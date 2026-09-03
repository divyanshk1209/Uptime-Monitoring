from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


class ServiceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    url: HttpUrl
    expected_status: int = Field(default=200, ge=100, le=599)


class ServiceUpdate(ServiceCreate):
    pass


class HealthCheckRead(BaseModel):
    id: int
    ok: bool
    status_code: int | None
    response_time_ms: int | None
    error: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ServiceRead(BaseModel):
    id: int
    name: str
    url: str
    expected_status: int
    created_at: datetime
    latest_check: HealthCheckRead | None = None

    model_config = {"from_attributes": True}
