\# PulseBoard



PulseBoard is a small end-to-end uptime monitoring dashboard. It lets you register services, run health checks, store response history, and view status from a React dashboard.



This project is intentionally resume-friendly without being oversized:



\- \*\*Frontend:\*\* React, TypeScript, Vite

\- \*\*Backend API:\*\* Python, FastAPI, SQLAlchemy

\- \*\*Database Backend:\*\* PostgreSQL

\- \*\*DevOps:\*\* Docker, Docker Compose, GitHub Actions

\- \*\*Cloud:\*\* AWS App Runner Terraform blueprint



\## Why This Works Well For A Resume



You can describe it as:



> Built a Dockerized full-stack uptime monitoring platform using React, TypeScript, FastAPI, PostgreSQL, and AWS App Runner infrastructure as code. Implemented REST APIs, relational persistence, health-check execution, dashboard UI, container orchestration, and cloud deployment configuration.



Good resume bullets:



\- Built a full-stack service monitoring dashboard with React, TypeScript, FastAPI, and PostgreSQL.

\- Containerized frontend, backend API, and PostgreSQL database with Docker Compose.

\- Designed REST APIs for service registration, health-check execution, and status history.

\- Added GitHub Actions CI for backend tests, frontend builds, and Docker image builds.

\- Added AWS App Runner Terraform configuration for cloud deployment of Dockerized services.



\## Run Locally



Requirements:



\- Docker Desktop

\- Docker Compose



```powershell

docker compose up --build

```



Open:



\- Frontend: http://localhost:5173

\- Backend API docs: http://localhost:8000/docs



\## PostgreSQL Backend



PostgreSQL is the database backend for this project.



In local development, Docker Compose starts a `postgres:16-alpine` database container. The FastAPI backend connects to it with:



```text

postgresql+psycopg://pulseboard:pulseboard@db:5432/pulseboard

```



The backend models are defined with SQLAlchemy in `backend/app/models.py`. The API stores monitored services and health-check history in PostgreSQL.



\## Project Structure



```text

.

|-- backend/              FastAPI API and tests

|-- frontend/             React TypeScript dashboard

|-- cloud/aws-apprunner/  Terraform cloud deployment blueprint

|-- docker-compose.yml    Local full-stack environment

`-- .env.example          Local environment sample

```



\## API Overview



| Method | Endpoint | Purpose |

| --- | --- | --- |

| GET | `/health` | Backend API health check |

| GET | `/services` | List monitored services |

| POST | `/services` | Add a service |

| PUT | `/services/{id}` | Edit a service |

| DELETE | `/services/{id}` | Delete a service and its checks |

| POST | `/services/{id}/check` | Run a health check |

| GET | `/services/{id}/checks` | View service check history |



\## Check Stored Database Data



After running the project, open another PowerShell window from the project root and run:



```powershell

docker compose exec db psql -U pulseboard -d pulseboard

```



Useful SQL commands:



```sql

\\dt

select \* from services;

select \* from health\_checks;

select s.name, s.url, h.ok, h.status\_code, h.response\_time\_ms

from services s

left join health\_checks h on h.service\_id = s.id

order by h.created\_at desc;

\\q

```



\## Learning Path



1\. Start with `backend/app/main.py` and understand the API routes.

2\. Read `backend/app/models.py` to see how PostgreSQL tables are modeled with SQLAlchemy.

3\. Open `frontend/src/main.tsx` to see how the UI calls the API.

4\. Run everything with Docker Compose.

5\. Review `cloud/aws-apprunner` to understand the cloud deployment plan.



\## Cloud Deployment Notes



The Terraform files in `cloud/aws-apprunner` are a deployment blueprint. For a real deployment:



1\. Create a managed PostgreSQL database, for example AWS RDS, Neon, or Supabase.

2\. Build and push backend/frontend Docker images to a registry such as AWS ECR.

3\. Pass the image URLs and database URL into Terraform variables.

4\. Run Terraform from `cloud/aws-apprunner`.



This keeps the project practical for learning while still showing cloud and infrastructure-as-code experience.



