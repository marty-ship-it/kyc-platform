# Variable definitions for KYC Platform infrastructure

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-southeast-2" # Sydney - Australia for compliance
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["ap-southeast-2a", "ap-southeast-2b"]
}

# ECS Configuration
variable "ecs_task_cpu" {
  description = "CPU units for ECS task (256 = 0.25 vCPU)"
  type        = number
  default     = 512
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_max_count" {
  description = "Maximum number of ECS tasks for auto-scaling"
  type        = number
  default     = 4
}

variable "ecs_min_count" {
  description = "Minimum number of ECS tasks for auto-scaling"
  type        = number
  default     = 1
}

# RDS Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "kycplatform"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "kycadmin"
  sensitive   = true
}

variable "db_backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = true
}

# Application Configuration
variable "app_domain" {
  description = "Domain name for the application"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
}

variable "nextauth_secret" {
  description = "NextAuth.js secret key"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "GitHub repository for CI/CD"
  type        = string
  default     = "marty-ship-it/kyc-platform"
}

variable "github_branch" {
  description = "GitHub branch for deployments"
  type        = string
  default     = "main"
}

# Monitoring & Alerting
variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

# Cost Management
variable "enable_cost_allocation_tags" {
  description = "Enable cost allocation tags"
  type        = bool
  default     = true
}

# Logging
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}
