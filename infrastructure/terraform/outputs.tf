# Terraform Outputs

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs for ALB"
  value       = aws_subnet.public[*].id
}

output "database_subnet_ids" {
  description = "Database subnet IDs for RDS"
  value       = aws_subnet.database[*].id
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "rds_secret_arn" {
  description = "ARN of Secrets Manager secret containing RDS credentials"
  value       = aws_secretsmanager_secret.db_password.arn
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "ecs_task_definition_arn" {
  description = "ECS task definition ARN"
  value       = aws_ecs_task_definition.app.arn
}

# ECR Outputs
output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_arn" {
  description = "ECR repository ARN"
  value       = aws_ecr_repository.app.arn
}

# ALB Outputs
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID for Route53"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "Target group ARN"
  value       = aws_lb_target_group.app.arn
}

# Application Secrets
output "app_secrets_arn" {
  description = "ARN of Secrets Manager secret containing application secrets"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

# GitHub Actions
output "github_actions_user_arn" {
  description = "IAM user ARN for GitHub Actions"
  value       = aws_iam_user.github_actions.arn
}

output "github_actions_access_key_id" {
  description = "Access key ID for GitHub Actions (add to GitHub Secrets)"
  value       = aws_iam_access_key.github_actions.id
  sensitive   = true
}

output "github_actions_secret_access_key" {
  description = "Secret access key for GitHub Actions (add to GitHub Secrets)"
  value       = aws_iam_access_key.github_actions.secret
  sensitive   = true
}

# Monitoring
output "cloudwatch_dashboard_url" {
  description = "URL to CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

# Application URL
output "application_url" {
  description = "Application URL"
  value       = "https://${var.app_domain}"
}

# Connection String (construct from secrets)
output "database_url_template" {
  description = "DATABASE_URL template (fetch actual values from Secrets Manager)"
  value       = "postgresql://<USERNAME>:<PASSWORD>@${aws_db_instance.main.address}:5432/${var.db_name}"
  sensitive   = true
}

# Useful AWS CLI Commands
output "useful_commands" {
  description = "Useful AWS CLI commands for operations"
  value = {
    view_logs = "aws logs tail ${aws_cloudwatch_log_group.ecs.name} --follow --region ${var.aws_region}"
    ecs_exec  = "aws ecs execute-command --cluster ${aws_ecs_cluster.main.name} --task <TASK_ID> --container nextjs-app --interactive --command '/bin/sh' --region ${var.aws_region}"
    deploy    = "aws ecs update-service --cluster ${aws_ecs_cluster.main.name} --service ${aws_ecs_service.app.name} --force-new-deployment --region ${var.aws_region}"
    get_db_password = "aws secretsmanager get-secret-value --secret-id ${aws_secretsmanager_secret.db_password.arn} --region ${var.aws_region} --query SecretString --output text"
  }
}
