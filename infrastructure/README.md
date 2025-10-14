# Infrastructure

This directory contains Infrastructure as Code (IaC) for deploying the KYC Platform to AWS.

## Quick Start

```bash
# 1. Setup Terraform backend
./scripts/terraform-setup.sh production

# 2. Configure variables
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Edit with your values

# 3. Deploy infrastructure
terraform apply -var="environment=production"

# 4. Deploy application
./scripts/deploy-manual.sh production
```

See [AWS_MIGRATION_QUICKSTART.md](../docs/AWS_MIGRATION_QUICKSTART.md) for detailed instructions.

## Directory Structure

```
infrastructure/
├── terraform/
│   ├── main.tf              # Provider and backend configuration
│   ├── variables.tf         # Input variables
│   ├── outputs.tf           # Output values
│   ├── vpc.tf              # VPC and networking
│   ├── rds.tf              # PostgreSQL database
│   ├── ecs.tf              # ECS Fargate cluster and service
│   ├── ecr.tf              # Container registry
│   ├── alb.tf              # Application Load Balancer
│   ├── monitoring.tf       # CloudWatch and SNS
│   └── terraform.tfvars    # Variable values (gitignored)
└── README.md               # This file
```

## Terraform Resources

### Networking
- VPC with CIDR 10.0.0.0/16
- 2 Public subnets (ALB, NAT Gateway)
- 2 Private subnets (ECS tasks)
- 2 Database subnets (RDS)
- 2 NAT Gateways for high availability
- Internet Gateway
- Route tables and associations
- VPC Flow Logs

### Compute
- ECS Fargate cluster
- ECS service with 2-4 tasks (auto-scaling)
- Task definition (512 CPU, 1024 MB memory)
- Application Load Balancer
- Target group with health checks

### Database
- RDS PostgreSQL 16.3
- Multi-AZ deployment
- db.t3.medium instance
- 100 GB gp3 storage (auto-scaling)
- 7-day backup retention
- Enhanced monitoring
- Performance Insights

### Container Registry
- ECR repository with image scanning
- Lifecycle policies for image cleanup
- KMS encryption

### Security
- IAM roles for ECS tasks
- IAM user for GitHub Actions
- Security groups with least privilege
- KMS keys for encryption
- Secrets Manager for credentials

### Monitoring
- CloudWatch log groups
- CloudWatch dashboard
- CloudWatch alarms for:
  - ECS CPU/memory
  - RDS CPU/connections/storage
  - ALB response time/errors
  - Application errors
- SNS topic for alerts
- CloudWatch Logs Insights queries

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `environment` | Environment name | `production` |
| `app_domain` | Application domain | `kyc.example.com` |
| `certificate_arn` | ACM certificate ARN | `arn:aws:acm:...` |
| `nextauth_secret` | NextAuth secret key | Generate with `openssl rand -base64 32` |
| `alert_email` | Email for CloudWatch alerts | `ops@example.com` |
| `db_username` | RDS master username | `kycadmin` |

## Outputs

Key outputs after `terraform apply`:

- `ecr_repository_url` - Docker image registry
- `rds_endpoint` - Database connection string
- `alb_dns_name` - Load balancer URL
- `github_actions_access_key_id` - For CI/CD
- `github_actions_secret_access_key` - For CI/CD
- `application_url` - Final application URL

## Environments

The infrastructure supports multiple environments:

- `production` - Production environment on main branch
- `staging` - Staging environment for testing
- `dev` - Development environment on dev branch

Each environment is isolated with separate:
- VPC
- RDS instance
- ECS cluster
- ECR repository
- Secrets Manager entries

## Cost Estimate

**Production environment**: ~$323/month

See [AWS_MIGRATION_TRD.md](../docs/AWS_MIGRATION_TRD.md#cost-analysis) for detailed breakdown.

## Terraform Commands

```bash
# Initialize
terraform init

# Validate
terraform validate

# Format
terraform fmt -recursive

# Plan
terraform plan -var="environment=production"

# Apply
terraform apply -var="environment=production"

# Destroy (careful!)
terraform destroy -var="environment=production"

# Show outputs
terraform output
terraform output -json
```

## Updating Infrastructure

```bash
# 1. Make changes to .tf files
nano infrastructure/terraform/ecs.tf

# 2. Plan changes
terraform plan -var="environment=production"

# 3. Apply changes
terraform apply -var="environment=production"

# 4. If ECS task definition changed, force redeploy
aws ecs update-service \
  --cluster kyc-platform-cluster-production \
  --service kyc-platform-service-production \
  --force-new-deployment
```

## Disaster Recovery

### Backup

RDS automated backups run daily with 7-day retention.

Manual snapshot:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier kyc-platform-db-production \
  --db-snapshot-identifier manual-$(date +%Y%m%d)
```

### Restore

```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier kyc-platform-db-production-restored \
  --db-snapshot-identifier <snapshot-id>

# Update Terraform state
terraform import aws_db_instance.main kyc-platform-db-production-restored
```

## Monitoring

### CloudWatch Dashboard

View metrics at:
```
https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#dashboards:name=kyc-platform-production
```

### View Logs

```bash
# Stream logs
aws logs tail /ecs/kyc-platform-production --follow

# Query logs (Insights)
aws logs start-query \
  --log-group-name /ecs/kyc-platform-production \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc'
```

### Alerts

CloudWatch alarms send notifications to the configured SNS topic, which emails the `alert_email`.

Test alarm:
```bash
aws cloudwatch set-alarm-state \
  --alarm-name kyc-platform-ecs-cpu-high-production \
  --state-value ALARM \
  --state-reason "Testing alert"
```

## Security

### Secrets Management

All secrets stored in AWS Secrets Manager:
- Database credentials
- Application secrets (NEXTAUTH_SECRET, NEXTAUTH_URL)

Access secrets:
```bash
aws secretsmanager get-secret-value \
  --secret-id kyc-platform-db-password-production \
  --query SecretString --output text | jq -r
```

### Encryption

- RDS: Encrypted at rest with KMS
- ECR: Encrypted with KMS
- S3: Encrypted with AES-256
- Secrets Manager: Encrypted with KMS
- Transit: TLS 1.3 everywhere

### Network Security

- ECS tasks in private subnets (no public IPs)
- RDS in isolated database subnets
- Security groups with least privilege
- VPC Flow Logs enabled

## Troubleshooting

See [AWS_MIGRATION_TRD.md](../docs/AWS_MIGRATION_TRD.md#appendix-d-troubleshooting) for comprehensive troubleshooting guide.

## CI/CD

GitHub Actions workflow (`.github/workflows/deploy-aws.yml`) automatically:
1. Runs tests (lint, typecheck, E2E)
2. Builds Docker image
3. Scans image for vulnerabilities
4. Pushes to ECR
5. Updates ECS service
6. Runs health checks
7. Rolls back on failure

## Support

- **Documentation**: [docs/](../docs/)
- **Issues**: Create GitHub issue
- **AWS Support**: Use AWS Support Center

## License

Private - Kycira Platform
