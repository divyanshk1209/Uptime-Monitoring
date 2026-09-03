from time import perf_counter

import httpx
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.config import settings
from app.database import Base, engine, get_db
from app.models import HealthCheck, Service
from app.schemas import HealthCheckRead, ServiceCreate, ServiceRead, ServiceUpdate

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PulseBoard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


def to_service_read(service: Service) -> ServiceRead:
    latest_check = service.checks[0] if service.checks else None
    return ServiceRead(
        id=service.id,
        name=service.name,
        url=service.url,
        expected_status=service.expected_status,
        created_at=service.created_at,
        latest_check=latest_check,
    )


@app.get("/services", response_model=list[ServiceRead])
def list_services(db: Session = Depends(get_db)):
    services = db.scalars(
        select(Service).options(selectinload(Service.checks)).order_by(Service.created_at.desc())
    ).all()
    return [to_service_read(service) for service in services]


@app.post("/services", response_model=ServiceRead, status_code=201)
def create_service(payload: ServiceCreate, db: Session = Depends(get_db)):
    service = Service(
        name=payload.name,
        url=str(payload.url),
        expected_status=payload.expected_status,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return to_service_read(service)


@app.put("/services/{service_id}", response_model=ServiceRead)
def update_service(service_id: int, payload: ServiceUpdate, db: Session = Depends(get_db)):
    service = db.get(Service, service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found")

    service.name = payload.name
    service.url = str(payload.url)
    service.expected_status = payload.expected_status
    db.commit()
    db.refresh(service)
    db.refresh(service, attribute_names=["checks"])
    return to_service_read(service)


@app.delete("/services/{service_id}", status_code=204)
def delete_service(service_id: int, db: Session = Depends(get_db)):
    service = db.get(Service, service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found")

    db.delete(service)
    db.commit()
    return None


@app.post("/services/{service_id}/check", response_model=HealthCheckRead)
async def run_check(service_id: int, db: Session = Depends(get_db)):
    service = db.get(Service, service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found")

    started_at = perf_counter()
    status_code: int | None = None
    response_time_ms: int | None = None
    error: str | None = None

    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            response = await client.get(service.url)
            status_code = response.status_code
            response_time_ms = round((perf_counter() - started_at) * 1000)
            ok = status_code == service.expected_status
    except httpx.HTTPError as exc:
        ok = False
        response_time_ms = round((perf_counter() - started_at) * 1000)
        error = str(exc)[:500]

    check = HealthCheck(
        service_id=service.id,
        ok=ok,
        status_code=status_code,
        response_time_ms=response_time_ms,
        error=error,
    )
    db.add(check)
    db.commit()
    db.refresh(check)
    return check


@app.get("/services/{service_id}/checks", response_model=list[HealthCheckRead])
def list_checks(service_id: int, db: Session = Depends(get_db)):
    service = db.get(Service, service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found")

    return db.scalars(
        select(HealthCheck)
        .where(HealthCheck.service_id == service_id)
        .order_by(HealthCheck.created_at.desc())
        .limit(20)
    ).all()
