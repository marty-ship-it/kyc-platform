# AWS Migration Technical Reference Document (TRD)

**Project**: KYC Platform Migration from Railway to AWS
**Version**: 1.0
**Date**: 2025-01-15
**Author**: Technical Team
**Status**: Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture (Railway)](#current-architecture-railway)
3. [Target Architecture (AWS)](#target-architecture-aws)
4. [Service Mapping](#service-mapping)
5. [Migration Strategy](#migration-strategy)
6. [Infrastructure as Code](#infrastructure-as-code)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Data Migration](#data-migration)
9. [Security & Compliance](#security--compliance)
10. [Cost Analysis](#cost-analysis)
11. [Rollback Plan](#rollback-plan)
12. [Post-Migration Validation](#post-migration-validation)
13. [Appendices](#appendices)

---

## Executive Summary

### Objective
Migrate the KYC Platform from Railway to AWS using Infrastructure as Code (Terraform) with automated CI/CD deployment via GitHub Actions.

### Key Benefits
- **Scalability**: Auto-scaling ECS Fargate with multi-AZ RDS
- **Cost Control**: Granular resource management and optimization
- **Compliance**: Australian data residency (ap-southeast-2)
- **Reliability**: 99.99% uptime with multi-AZ deployment
- **Observability**: Enhanced monitoring with CloudWatch, X-Ray, and custom dashboards
- **Security**: KMS encryption, Secrets Manager, VPC isolation, automated security scanning

### Timeline
- **Phase 1**: Infrastructure Provisioning (2-3 days)
- **Phase 2**: CI/CD Setup (1 day)
- **Phase 3**: Data Migration & Testing (2-3 days)
- **Phase 4**: Cutover & Monitoring (1 day)
- **Total**: ~7-10 days

### Success Criteria
✅ Zero data loss during migration
✅ < 1 hour downtime window
✅ All endpoints responding with < 500ms p95 latency
✅ Database connection pool healthy
✅ CI/CD pipeline successfully deploys updates
✅ CloudWatch alarms configured and tested

---

## Current Architecture (Railway)

### Components

```
Railway Platform
├── Application Service
│   ├── Docker: node:20-alpine
│   ├── Build: Dockerfile.railway (multi-stage)
│   ├── Runtime: Next.js 15 (standalone)
│   └── Port: 3000
│
├── PostgreSQL Database
│   ├── Version: 16.x
│   ├── Managed by Railway
│   ├── Auto-backups: Enabled
│   └── Connection: DATABASE_URL env var
│
├── Environment Variables
│   ├── DATABASE_URL (injected)
│   ├── NEXTAUTH_SECRET
│   ├── NEXTAUTH_URL
│   └── NODE_ENV=production
│
└── Deployment
    ├── Git Push → Auto Deploy
    ├── Zero-downtime rolling updates
    └── Health checks: /api/db-test
```

### Current Limitations
1. **Limited scaling control** - Can't set per-AZ distribution
2. **No VPC isolation** - Single network boundary
3. **Basic monitoring** - Railway dashboard only
4. **Cost visibility** - Bundled pricing model
5. **Database access** - No read replicas or fine-tuned IOPS
6. **Deployment control** - Limited rollback capabilities

---

## Target Architecture (AWS)

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                      AWS ap-southeast-2                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Route 53 DNS                                                   │
│       ↓                                                         │
│  CloudFront CDN (Optional)                                      │
│       ↓                                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Application Load Balancer (ALB)                         │  │
│  │  ├── AZ-A (ap-southeast-2a)                              │  │
│  │  └── AZ-B (ap-southeast-2b)                              │  │
│  │  ├── HTTPS: 443 (ACM Certificate)                        │  │
│  │  └── HTTP: 80 → Redirect to HTTPS                        │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────┴─────────────────────────────────────┐  │
│  │  ECS Fargate Cluster                                     │  │
│  │  ├── Service: kyc-platform-service                       │  │
│  │  ├── Tasks: 2-4 (auto-scaling)                           │  │
│  │  ├── Task Definition: 512 CPU, 1024 MB                   │  │
│  │  ├── Container: nextjs-app (ECR image)                   │  │
│  │  ├── Private Subnets (Multi-AZ)                          │  │
│  │  ├── Outbound: NAT Gateway                               │  │
│  │  └── Health Check: /api/db-test                          │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────┴─────────────────────────────────────┐  │
│  │  RDS PostgreSQL 16.3                                     │  │
│  │  ├── Instance: db.t3.medium                              │  │
│  │  ├── Storage: 100 GB gp3 (auto-scaling)                  │  │
│  │  ├── Multi-AZ: Enabled                                   │  │
│  │  ├── Backup: 7-day retention                             │  │
│  │  ├── Encryption: KMS                                     │  │
│  │  ├── Enhanced Monitoring: 60s                            │  │
│  │  └── Private Database Subnets                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Supporting Services:                                           │
│  ├── ECR: Docker image registry                                │
│  ├── Secrets Manager: DB credentials, app secrets              │
│  ├── CloudWatch: Logs, metrics, dashboards, alarms             │
│  ├── SNS: Alert notifications                                  │
│  ├── S3: ALB logs, backups                                     │
│  ├── KMS: Encryption keys                                      │
│  └── IAM: Roles and policies                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Network Architecture

**VPC CIDR**: 10.0.0.0/16

| Subnet Type | CIDR | AZ | Purpose |
|------------|------|-----|---------|
| Public A | 10.0.0.0/24 | ap-southeast-2a | ALB, NAT GW |
| Public B | 10.0.1.0/24 | ap-southeast-2b | ALB, NAT GW |
| Private A | 10.0.10.0/24 | ap-southeast-2a | ECS Tasks |
| Private B | 10.0.11.0/24 | ap-southeast-2b | ECS Tasks |
| Database A | 10.0.20.0/24 | ap-southeast-2a | RDS Primary |
| Database B | 10.0.21.0/24 | ap-southeast-2b | RDS Standby |

**Security Groups**:
- ALB: Allow 80/443 from 0.0.0.0/0
- ECS Tasks: Allow 3000 from ALB SG
- RDS: Allow 5432 from ECS Tasks SG

---

## Service Mapping

### Complete Railway → AWS Translation

| Railway Component | AWS Service | Configuration | Notes |
|------------------|-------------|---------------|-------|
| **Railway Project** | CloudFormation Stack | Terraform managed | All resources tagged |
| **Railway Service** | ECS Fargate | 512 CPU, 1024 MB | 2-4 tasks with auto-scaling |
| **Docker Build** | CodeBuild + ECR | Dockerfile.railway | Same multi-stage build |
| **Environment Variables** | Secrets Manager | app-secrets, db-password | Encrypted with KMS |
| **Railway Edge** | ALB + Route53 | HTTPS with ACM | Optional CloudFront |
| **SSL Certificates** | ACM | Auto-renewal | Managed by AWS |
| **PostgreSQL** | RDS PostgreSQL 16.3 | Multi-AZ, gp3 storage | Compatible with current schema |
| **Monitoring** | CloudWatch | Logs, metrics, alarms | Enhanced with dashboards |
| **Logging** | CloudWatch Logs | 30-day retention | Structured JSON logs |
| **Git Deployments** | GitHub Actions | Push to main/dev | Automated pipeline |
| **Health Checks** | ALB Target Group | /api/db-test endpoint | 30s interval |
| **Volumes** | EFS (optional) | Not currently used | Future for uploads |

### Environment Variables Migration

| Railway Variable | AWS Secrets Manager Path | ECS Task Reference |
|-----------------|-------------------------|-------------------|
| `DATABASE_URL` | `db-password:host::` | Constructed from RDS endpoint |
| `NEXTAUTH_SECRET` | `app-secrets:NEXTAUTH_SECRET::` | Static value |
| `NEXTAUTH_URL` | `app-secrets:NEXTAUTH_URL::` | https://domain |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Environment | `3000` |

---

## Migration Strategy

### Pre-Migration Checklist

- [ ] AWS Account setup with admin access
- [ ] Terraform installed (v1.5+)
- [ ] AWS CLI configured
- [ ] GitHub repository secrets configured
- [ ] ACM certificate requested and validated
- [ ] Route53 hosted zone configured (if using)
- [ ] S3 bucket for Terraform state created
- [ ] DynamoDB table for Terraform locks created
- [ ] Alert email verified in SNS

### Phase 1: Infrastructure Provisioning (Day 1-3)

#### Step 1.1: Terraform State Backend Setup

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket kyc-platform-terraform-state \
  --region ap-southeast-2 \
  --create-bucket-configuration LocationConstraint=ap-southeast-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket kyc-platform-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket kyc-platform-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name kyc-platform-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-2
```

#### Step 1.2: Terraform Variable Configuration

```bash
cd infrastructure/terraform

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required values:**
- `app_domain`: Your domain name
- `certificate_arn`: ACM certificate ARN
- `nextauth_secret`: Generate with `openssl rand -base64 32`
- `alert_email`: Your operations email
- `db_username`: Database master username

#### Step 1.3: Terraform Deployment

```bash
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Preview changes
terraform plan -out=tfplan

# Review the plan carefully
# Should show ~50-60 resources to create

# Apply infrastructure
terraform apply tfplan

# Save outputs
terraform output -json > terraform-outputs.json
```

**Expected Duration**: 15-20 minutes

**Key Outputs to Note**:
- `ecr_repository_url`: For Docker image push
- `rds_endpoint`: Database connection
- `alb_dns_name`: Load balancer endpoint
- `github_actions_access_key_id`: For CI/CD
- `github_actions_secret_access_key`: For CI/CD

#### Step 1.4: Initial Image Push

```bash
# Get ECR login
aws ecr get-login-password --region ap-southeast-2 | \
  docker login --username AWS --password-stdin <ECR_REPO_URL>

# Build image locally
docker build -t kyc-platform:test -f Dockerfile.railway .

# Tag for ECR
docker tag kyc-platform:test <ECR_REPO_URL>:latest

# Push to ECR
docker push <ECR_REPO_URL>:latest

# Verify push
aws ecr describe-images \
  --repository-name kyc-platform-production \
  --region ap-southeast-2
```

### Phase 2: CI/CD Setup (Day 4)

#### Step 2.1: Configure GitHub Secrets

Navigate to GitHub repository → Settings → Secrets → Actions

Add the following secrets:

```bash
AWS_ACCESS_KEY_ID: <from terraform output>
AWS_SECRET_ACCESS_KEY: <from terraform output>
AWS_REGION: ap-southeast-2
```

#### Step 2.2: Test GitHub Actions Workflow

```bash
# Push to dev branch to trigger build
git checkout dev
git commit --allow-empty -m "test: trigger AWS deployment"
git push origin dev

# Monitor in GitHub Actions tab
# Workflow: "Deploy to AWS ECS"
```

#### Step 2.3: Validate Pipeline

✅ Test job passes (lint, typecheck, e2e)
✅ Build job pushes image to ECR
✅ Deploy job updates ECS service
✅ Health check succeeds

### Phase 3: Data Migration (Day 5-7)

#### Step 3.1: Database Export from Railway

```bash
# Connect to Railway PostgreSQL
railway login
railway link # Select your project

# Create dump
railway run pg_dump -Fc -v -d $DATABASE_URL > railway_dump.backup

# Verify dump
ls -lh railway_dump.backup
```

#### Step 3.2: Prepare AWS RDS

```bash
# Get RDS credentials from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id kyc-platform-db-password-production \
  --region ap-southeast-2 \
  --query SecretString \
  --output text | jq -r

# Set environment variables
export PGHOST=<rds-endpoint>
export PGPORT=5432
export PGDATABASE=kycplatform
export PGUSER=kycadmin
export PGPASSWORD=<from-secrets-manager>

# Test connection
psql -c "SELECT version();"
```

#### Step 3.3: Database Migration

```bash
# Restore to AWS RDS
pg_restore -v -d $PGDATABASE railway_dump.backup

# Verify data
psql -c "SELECT COUNT(*) FROM users;"
psql -c "SELECT COUNT(*) FROM entities;"
psql -c "SELECT COUNT(*) FROM cases;"

# Run Prisma migrations (if needed)
npx prisma db push
```

#### Step 3.4: Data Validation

```sql
-- Compare record counts
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION ALL
SELECT 'organisations', COUNT(*) FROM organisations
UNION ALL
SELECT 'entities', COUNT(*) FROM entities
UNION ALL
SELECT 'deals', COUNT(*) FROM deals
UNION ALL
SELECT 'cases', COUNT(*) FROM cases
UNION ALL
SELECT 'kyc_checks', COUNT(*) FROM kyc_checks
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;

-- Verify latest records
SELECT id, email, role FROM users ORDER BY "createdAt" DESC LIMIT 5;
SELECT id, "fullName", "riskScore" FROM entities ORDER BY "createdAt" DESC LIMIT 5;
```

### Phase 4: Cutover (Day 8)

#### Step 4.1: Pre-Cutover Checks

- [ ] AWS infrastructure fully provisioned
- [ ] CI/CD pipeline tested and working
- [ ] Database migrated and validated
- [ ] Application health check passing
- [ ] CloudWatch dashboards configured
- [ ] SNS alerts tested
- [ ] Rollback plan documented

#### Step 4.2: DNS Cutover

**Option A: Route53 Weighted Routing (Gradual)**

```bash
# Create Route53 record with weighted routing
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "kyc-platform.example.com",
        "Type": "A",
        "SetIdentifier": "AWS-ECS",
        "Weight": 10,
        "AliasTarget": {
          "HostedZoneId": "<ALB_ZONE_ID>",
          "DNSName": "<ALB_DNS_NAME>",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'

# Gradually increase weight: 10 → 50 → 100
# Monitor for 15 minutes at each step
```

**Option B: Direct Cutover (Immediate)**

```bash
# Update DNS to point to AWS ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "kyc-platform.example.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "<ALB_ZONE_ID>",
          "DNSName": "<ALB_DNS_NAME>",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

#### Step 4.3: Enable Railway Read-Only Mode (Optional)

```bash
# Put Railway in maintenance mode
railway vars set MAINTENANCE_MODE=true

# Or disable write operations at database level
# This prevents data divergence during cutover
```

#### Step 4.4: Monitor Cutover

```bash
# Watch ECS service metrics
watch -n 5 'aws ecs describe-services \
  --cluster kyc-platform-cluster-production \
  --services kyc-platform-service-production \
  --query "services[0].{Running:runningCount,Desired:desiredCount}"'

# Monitor ALB target health
watch -n 5 'aws elbv2 describe-target-health \
  --target-group-arn <TARGET_GROUP_ARN> \
  --query "TargetHealthDescriptions[*].TargetHealth.State"'

# Check CloudWatch logs
aws logs tail /ecs/kyc-platform-production --follow
```

### Phase 5: Post-Migration Validation (Day 9)

Run comprehensive validation tests (see [Post-Migration Validation](#post-migration-validation) section).

---

## Infrastructure as Code

### Terraform Structure

```
infrastructure/terraform/
├── main.tf              # Provider config, backend, locals
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── vpc.tf              # VPC, subnets, NAT gateways
├── rds.tf              # RDS PostgreSQL database
├── ecs.tf              # ECS cluster, service, task definition
├── ecr.tf              # ECR repository, lifecycle policies
├── alb.tf              # Application Load Balancer, target groups
├── monitoring.tf       # CloudWatch, SNS, alarms
├── terraform.tfvars    # Variable values (gitignored)
└── terraform.tfvars.example  # Example values
```

### Terraform Commands Reference

```bash
# Initialize backend and download providers
terraform init

# Validate configuration syntax
terraform validate

# Format code
terraform fmt -recursive

# Check for security issues (requires tfsec)
tfsec .

# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# Destroy infrastructure (careful!)
terraform destroy

# Target specific resource
terraform apply -target=aws_ecs_service.app

# Import existing resource
terraform import aws_db_instance.main <instance-id>

# Show current state
terraform show

# List resources
terraform state list

# View outputs
terraform output
terraform output -json
```

### Terraform State Management

```bash
# Show state
terraform state show aws_ecs_service.app

# Move resource
terraform state mv aws_ecs_service.app aws_ecs_service.app_new

# Remove from state (doesn't delete resource)
terraform state rm aws_ecs_service.app

# Pull remote state
terraform state pull > state.json

# Push local state (dangerous!)
terraform state push state.json
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/deploy-aws.yml`

### Workflow Stages

1. **Determine Environment**
   - `main` branch → production
   - `dev` branch → dev
   - Manual dispatch → user choice

2. **Test**
   - Lint (ESLint)
   - Type check (TypeScript)
   - E2E tests (Playwright)

3. **Build & Push**
   - Build Docker image (Dockerfile.railway)
   - Scan with Trivy
   - Push to ECR
   - Tag with SHA and branch

4. **Deploy**
   - Update ECS task definition
   - Deploy to ECS service
   - Run database migrations
   - Verify health endpoint

5. **Rollback** (on failure)
   - Revert to previous task definition
   - Notify team

### Manual Deployment

```bash
# Trigger manual deployment
gh workflow run deploy-aws.yml \
  -f environment=production

# Watch workflow run
gh run watch

# View logs
gh run view --log
```

### Local Deployment (Emergency)

```bash
# Build and push image
./scripts/deploy-manual.sh production

# Update ECS service
aws ecs update-service \
  --cluster kyc-platform-cluster-production \
  --service kyc-platform-service-production \
  --force-new-deployment \
  --region ap-southeast-2
```

---

## Data Migration

### Database Compatibility

| Feature | Railway PostgreSQL | AWS RDS PostgreSQL |
|---------|-------------------|-------------------|
| Version | 16.x | 16.3 |
| Extensions | Standard | Standard + PostGIS |
| Connection | Direct | VPC only |
| Backups | Automatic | 7-day retention |
| Replicas | No | Read replicas supported |

### Migration Tools

**Recommended**: `pg_dump` / `pg_restore` (native PostgreSQL tools)

**Alternative**: AWS DMS (Database Migration Service) for zero-downtime

### Zero-Downtime Migration (Advanced)

```bash
# 1. Set up AWS DMS replication instance
aws dms create-replication-instance \
  --replication-instance-identifier kyc-migration \
  --replication-instance-class dms.t3.medium \
  --allocated-storage 50

# 2. Create source and target endpoints
aws dms create-endpoint \
  --endpoint-identifier railway-source \
  --endpoint-type source \
  --engine-name postgres \
  --server-name railway-host \
  --port 5432 \
  --database-name railway_db \
  --username user \
  --password pass

aws dms create-endpoint \
  --endpoint-identifier aws-target \
  --endpoint-type target \
  --engine-name postgres \
  --server-name rds-endpoint \
  --port 5432 \
  --database-name kycplatform \
  --username kycadmin \
  --password rds-pass

# 3. Create and start replication task
aws dms create-replication-task \
  --replication-task-identifier kyc-migration-task \
  --source-endpoint-arn <source-arn> \
  --target-endpoint-arn <target-arn> \
  --replication-instance-arn <instance-arn> \
  --migration-type full-load-and-cdc \
  --table-mappings file://table-mappings.json

aws dms start-replication-task \
  --replication-task-arn <task-arn> \
  --start-replication-task-type start-replication
```

---

## Security & Compliance

### Encryption

| Component | Encryption Method | Key Management |
|-----------|------------------|----------------|
| RDS Storage | AES-256 | KMS (CMK) |
| RDS Snapshots | AES-256 | KMS (CMK) |
| ECR Images | AES-256 | KMS (CMK) |
| Secrets Manager | AES-256 | KMS (CMK) |
| S3 Buckets | AES-256 | KMS or S3-managed |
| ECS Task Secrets | Transit only | Secrets Manager |
| ALB HTTPS | TLS 1.3 | ACM |

### IAM Least Privilege

**ECS Task Execution Role**:
- `AmazonECSTaskExecutionRolePolicy` (AWS managed)
- Custom policy for Secrets Manager access

**ECS Task Role** (application runtime):
- CloudWatch Logs write
- Custom permissions (none currently needed)

**GitHub Actions IAM User**:
- ECR push/pull
- ECS service update
- Task definition registration
- Limited to specific resources

### Network Security

```
Internet
    ↓ (HTTPS 443)
ALB (Public Subnets)
    ↓ (HTTP 3000)
ECS Tasks (Private Subnets)
    ↓ (PostgreSQL 5432)
RDS (Database Subnets - Isolated)
```

- ALB: Public subnets, internet-facing
- ECS: Private subnets, no public IPs
- RDS: Database subnets, no direct internet access
- NAT Gateway: Outbound internet for ECS (npm, external APIs)

### Compliance (Australian AUSTRAC)

- **Data Residency**: ap-southeast-2 (Sydney)
- **Encryption at Rest**: All storage encrypted
- **Encryption in Transit**: TLS 1.3 for all connections
- **Audit Logging**: CloudWatch Logs retained 30 days
- **Access Control**: IAM with MFA for console access
- **Network Isolation**: VPC with private subnets

---

## Cost Analysis

### Estimated Monthly Costs (Production)

| Service | Configuration | Estimated Cost (USD) |
|---------|--------------|---------------------|
| **ECS Fargate** | 2 tasks × 0.5 vCPU × 1 GB × 730 hrs | $35.04 |
| **RDS PostgreSQL** | db.t3.medium Multi-AZ | $120.00 |
| **RDS Storage** | 100 GB gp3 | $23.00 |
| **RDS Backup** | 100 GB snapshots | $9.50 |
| **ALB** | 730 hours + LCU charges | $20.00 |
| **NAT Gateway** | 2 × $0.059/hr × 730 hrs | $86.14 |
| **Data Transfer** | 100 GB outbound | $9.00 |
| **ECR Storage** | 10 GB images | $1.00 |
| **CloudWatch** | Logs (5 GB), metrics, alarms | $12.00 |
| **Secrets Manager** | 3 secrets | $1.20 |
| **KMS** | 4 keys | $4.00 |
| **S3** | ALB logs, backups | $2.00 |
| **Total** | | **~$322.88/month** |

**Railway Current Cost**: ~$50-100/month (estimated)

### Cost Optimization Strategies

1. **Use Reserved Instances for RDS** (-40% cost)
   - 1-year no upfront: $72/month (save $48/month)

2. **Right-size ECS Tasks** (if over-provisioned)
   - Monitor CPU/memory usage
   - Scale down to 256 CPU / 512 MB if possible

3. **Use Single NAT Gateway** (non-production)
   - Save $43.07/month
   - Trade-off: Single point of failure

4. **Implement S3 Lifecycle Policies**
   - Move old logs to Glacier after 90 days
   - Delete after 1 year

5. **Use AWS Cost Explorer**
   - Enable cost allocation tags
   - Set up budgets and alerts

### Cost Comparison: Railway vs AWS

| Aspect | Railway | AWS |
|--------|---------|-----|
| Base Cost | $50-100/mo | $323/mo |
| Scalability | Limited | Unlimited |
| Control | Basic | Granular |
| Visibility | Low | High |
| Optimization | Bundled | Per-service |

**Break-even Analysis**: AWS more cost-effective at scale (>3 environments, >4 tasks)

---

## Rollback Plan

### Scenario 1: Infrastructure Issues During Provisioning

**Symptoms**: Terraform errors, resource creation failures

**Actions**:
```bash
# 1. Review error
terraform show

# 2. Destroy problematic resources
terraform destroy -target=aws_ecs_service.app

# 3. Fix configuration
nano ecs.tf

# 4. Re-apply
terraform plan
terraform apply
```

**Impact**: None (not yet live)

### Scenario 2: Application Issues After Deployment

**Symptoms**: 5xx errors, failed health checks, high latency

**Actions**:
```bash
# 1. Check ECS service events
aws ecs describe-services \
  --cluster kyc-platform-cluster-production \
  --services kyc-platform-service-production \
  --query 'services[0].events'

# 2. Check CloudWatch logs
aws logs tail /ecs/kyc-platform-production --follow | grep ERROR

# 3. Rollback to previous task definition
PREV_TASK_DEF=$(aws ecs describe-services ... | jq -r '.services[0].deployments[1].taskDefinition')

aws ecs update-service \
  --cluster kyc-platform-cluster-production \
  --service kyc-platform-service-production \
  --task-definition $PREV_TASK_DEF \
  --force-new-deployment

# 4. Monitor rollback
watch -n 5 'aws ecs describe-services ...'
```

**Recovery Time**: 5-10 minutes
**Impact**: Degraded service during rollback

### Scenario 3: Database Issues After Migration

**Symptoms**: Connection errors, data inconsistencies

**Actions**:
```bash
# 1. Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier kyc-platform-db-production-restored \
  --db-snapshot-identifier kyc-platform-db-production-pre-migration

# 2. Update ECS task definition with new endpoint
# (requires Terraform update)

# 3. Or restore from Railway backup
pg_restore -v -d $PGDATABASE railway_backup_YYYYMMDD.backup
```

**Recovery Time**: 15-30 minutes
**Impact**: Full outage during restore

### Scenario 4: DNS Issues

**Symptoms**: Unable to reach application

**Actions**:
```bash
# 1. Verify ALB health
aws elbv2 describe-target-health --target-group-arn <ARN>

# 2. Test ALB directly
curl -v https://<ALB_DNS_NAME>/api/db-test

# 3. If ALB healthy, revert DNS
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch file://revert-dns.json

# 4. Point back to Railway
```

**Recovery Time**: 1-5 minutes (DNS propagation)
**Impact**: Brief downtime

### Complete Rollback to Railway

**Last Resort**: If AWS migration fails completely

```bash
# 1. Update environment variables in Railway
railway vars set DATABASE_URL=<original-railway-db-url>

# 2. Redeploy last working version
railway up

# 3. Revert DNS to Railway
railway domain

# 4. Notify team
# 5. Post-mortem
```

**Recovery Time**: 10-20 minutes
**Impact**: Full outage during switchback

---

## Post-Migration Validation

### Automated Health Checks

```bash
#!/bin/bash
# File: scripts/validate-migration.sh

BASE_URL="https://kyc-platform.example.com"

echo "🔍 Starting post-migration validation..."

# 1. Health endpoint
echo "Testing /api/db-test..."
curl -sf "$BASE_URL/api/db-test" || exit 1
echo "✅ Health check passed"

# 2. Authentication
echo "Testing /api/auth/signin..."
curl -sf "$BASE_URL/api/auth/signin" > /dev/null || exit 1
echo "✅ Auth endpoint accessible"

# 3. API endpoints
for endpoint in "/api/entities" "/api/cases" "/api/deals"; do
  echo "Testing $endpoint..."
  curl -sf -H "Cookie: $AUTH_COOKIE" "$BASE_URL$endpoint" > /dev/null || exit 1
done
echo "✅ All API endpoints responding"

# 4. Database queries
echo "Testing database connectivity..."
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "SELECT COUNT(*) FROM users;" || exit 1
echo "✅ Database accessible"

# 5. Performance test
echo "Testing response times..."
ab -n 100 -c 10 "$BASE_URL/api/db-test" | grep "Time per request"
echo "✅ Performance baseline captured"

echo "🎉 All validation checks passed!"
```

### Manual Validation Checklist

#### Functionality
- [ ] Login as each role (DIRECTOR, COMPLIANCE, AGENT)
- [ ] Create new entity
- [ ] Run entity screening
- [ ] Create compliance case
- [ ] Generate TTR report
- [ ] Upload evidence file
- [ ] View audit trail
- [ ] Admin panel accessible

#### Data Integrity
- [ ] User count matches Railway
- [ ] Entity count matches Railway
- [ ] Case count matches Railway
- [ ] Latest records present
- [ ] No duplicate data
- [ ] Foreign key constraints intact

#### Performance
- [ ] Homepage loads < 2s
- [ ] API responses < 500ms (p95)
- [ ] Database queries < 100ms (p95)
- [ ] No N+1 queries
- [ ] Connection pool healthy

#### Security
- [ ] HTTPS enforced
- [ ] HTTP redirects to HTTPS
- [ ] Secrets not in logs
- [ ] RBAC enforced
- [ ] Session management working
- [ ] CSRF protection active

#### Monitoring
- [ ] CloudWatch dashboard populated
- [ ] Logs streaming to CloudWatch
- [ ] Alarms configured
- [ ] SNS alerts working
- [ ] Test alarm notification

#### CI/CD
- [ ] GitHub Actions workflow passes
- [ ] Can deploy from dev branch
- [ ] Can deploy from main branch
- [ ] Rollback mechanism works

---

## Appendices

### Appendix A: Deployment Scripts

#### scripts/deploy-manual.sh

```bash
#!/bin/bash
set -euo pipefail

ENVIRONMENT="${1:-production}"
AWS_REGION="ap-southeast-2"
ECR_REPO="kyc-platform-${ENVIRONMENT}"

echo "🚀 Manual deployment to ${ENVIRONMENT}"

# Get ECR repository URL
ECR_URL=$(aws ecr describe-repositories \
  --repository-names "$ECR_REPO" \
  --region "$AWS_REGION" \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "📦 ECR Repository: $ECR_URL"

# Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$ECR_URL"

# Build image
echo "🔨 Building Docker image..."
docker build -t "$ECR_REPO:latest" -f Dockerfile.railway .

# Tag image
docker tag "$ECR_REPO:latest" "$ECR_URL:latest"
docker tag "$ECR_REPO:latest" "$ECR_URL:$(git rev-parse --short HEAD)"

# Push image
echo "⬆️  Pushing to ECR..."
docker push "$ECR_URL:latest"
docker push "$ECR_URL:$(git rev-parse --short HEAD)"

# Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service \
  --cluster "kyc-platform-cluster-${ENVIRONMENT}" \
  --service "kyc-platform-service-${ENVIRONMENT}" \
  --force-new-deployment \
  --region "$AWS_REGION"

echo "✅ Deployment initiated. Check CloudWatch for logs."
```

### Appendix B: Monitoring Queries

#### CloudWatch Logs Insights

**Error Rate**:
```sql
fields @timestamp, @message
| filter @message like /ERROR/ or level = "error"
| stats count() by bin(5m)
```

**Slow Queries**:
```sql
fields @timestamp, @message
| parse @message /prisma:query.*(?<duration>\d+)ms/
| filter duration > 1000
| sort duration desc
| limit 20
```

**API Response Times**:
```sql
fields @timestamp, method, url, duration
| filter method in ["GET", "POST", "PUT", "DELETE"]
| stats avg(duration), max(duration), pct(duration, 95) by url
| sort avg desc
```

### Appendix C: Useful Commands

#### ECS Commands

```bash
# List running tasks
aws ecs list-tasks \
  --cluster kyc-platform-cluster-production \
  --service-name kyc-platform-service-production

# Exec into container
TASK_ARN=$(aws ecs list-tasks --cluster kyc-platform-cluster-production --query 'taskArns[0]' --output text)
aws ecs execute-command \
  --cluster kyc-platform-cluster-production \
  --task "$TASK_ARN" \
  --container nextjs-app \
  --interactive \
  --command "/bin/sh"

# View task logs
aws logs tail /ecs/kyc-platform-production --follow

# Force new deployment
aws ecs update-service \
  --cluster kyc-platform-cluster-production \
  --service kyc-platform-service-production \
  --force-new-deployment
```

#### RDS Commands

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier kyc-platform-db-production \
  --db-snapshot-identifier kyc-manual-$(date +%Y%m%d-%H%M)

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier kyc-platform-db-production

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier kyc-platform-db-production-new \
  --db-snapshot-identifier <snapshot-id>
```

#### CloudWatch Commands

```bash
# Get metric statistics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=kyc-platform-service-production Name=ClusterName,Value=kyc-platform-cluster-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# Test alarm
aws cloudwatch set-alarm-state \
  --alarm-name kyc-platform-ecs-cpu-high-production \
  --state-value ALARM \
  --state-reason "Testing alarm"
```

### Appendix D: Troubleshooting

#### Problem: ECS Tasks Not Starting

**Symptoms**: Tasks start then immediately stop

**Diagnosis**:
```bash
aws ecs describe-tasks --cluster <cluster> --tasks <task-arn>
aws logs tail /ecs/kyc-platform-production --since 10m
```

**Common Causes**:
- Database connection failure (check security groups)
- Missing environment variables
- Image pull errors (check ECR permissions)
- Health check failures

#### Problem: Database Connection Timeout

**Symptoms**: "ETIMEDOUT" or "Connection refused"

**Diagnosis**:
```bash
# Check security group
aws ec2 describe-security-groups --group-ids <rds-sg-id>

# Test from ECS task
aws ecs execute-command ... --command "nc -zv <rds-endpoint> 5432"
```

**Fix**:
- Ensure ECS tasks SG is allowed in RDS SG
- Verify RDS is in database subnets
- Check route tables

#### Problem: 502 Bad Gateway from ALB

**Symptoms**: ALB returns 502 errors

**Diagnosis**:
```bash
aws elbv2 describe-target-health --target-group-arn <arn>
aws logs tail /ecs/kyc-platform-production --follow
```

**Common Causes**:
- No healthy targets (check health check endpoint)
- Container port mismatch (should be 3000)
- Application crashed (check logs)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-15 | Technical Team | Initial TRD |

---

**End of Document**
