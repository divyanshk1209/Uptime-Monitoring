# AWS App Runner Blueprint

This folder shows how PulseBoard can be deployed to AWS with infrastructure as code.

For a real deployment, provide:

- `backend_image_uri`: Docker image URI for the FastAPI backend
- `frontend_image_uri`: Docker image URI for the React/Nginx frontend
- `database_url`: Managed PostgreSQL connection string

Example:

```powershell
terraform init
terraform apply `
  -var "backend_image_uri=123456789012.dkr.ecr.us-east-1.amazonaws.com/pulseboard-api:latest" `
  -var "frontend_image_uri=123456789012.dkr.ecr.us-east-1.amazonaws.com/pulseboard-web:latest" `
  -var "database_url=postgresql+psycopg://user:password@host:5432/pulseboard"
```

