variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "backend_image_uri" {
  type = string
}

variable "frontend_image_uri" {
  type = string
}

variable "database_url" {
  type      = string
  sensitive = true
}

