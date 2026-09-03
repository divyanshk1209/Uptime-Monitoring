output "backend_url" {
  value = "https://${aws_apprunner_service.backend.service_url}"
}

output "frontend_url" {
  value = "https://${aws_apprunner_service.frontend.service_url}"
}

