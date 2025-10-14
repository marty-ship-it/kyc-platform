# AWS Migration Quickstart Guide

This is a condensed, step-by-step guide for migrating the KYC Platform from Railway to AWS. For comprehensive details, see [AWS_MIGRATION_TRD.md](./AWS_MIGRATION_TRD.md).

## Prerequisites Checklist

- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Terraform >= 1.5.0 installed
- [ ] Docker installed and running
- [ ] Git repository access
- [ ] ACM Certificate created and validated for your domain
- [ ] Route53 hosted zone (if using Route53)

## Quick Start (Production Deployment)

### Step 1: Prepare Terraform Backend (5 minutes)

```bash
# Run the automated setup script
./scripts/terraform-setup.sh production

# This creates:
# - S3 bucket for Terraform state
# - DynamoDB table for state locking
# - Initializes Terraform
# - Runs validation and formatting
```

### Step 2: Configure Variables (10 minutes)

Edit `infrastructure/terraform/terraform.tfvars`:

```hcl
# Required values
environment     = "production"
app_domain      = "kyc-platform.yourcompany.com"
certificate_arn = "arn:aws:acm:ap-southeast-2:ACCOUNT:certificate/CERT-ID"
nextauth_secret = "generate-with-openssl-rand-base64-32"
alert_email     = "ops@yourcompany.com"

# Database
db_username = "kycadmin"

# Optional (defaults are sensible)
ecs_task_cpu      = 512
ecs_task_memory   = 1024
ecs_desired_count = 2
```

### Step 3: Deploy Infrastructure (20 minutes)

```bash
cd infrastructure/terraform

# Review the plan (should show ~50-60 resources)
terraform plan -var="environment=production"

# Apply the plan
terraform apply -var="environment=production"

# Save outputs for later
terraform output -json > outputs.json
```

**What gets created:**
- VPC with public/private/database subnets across 2 AZs
- RDS PostgreSQL 16.3 (Multi-AZ)
- ECS Fargate cluster and service
- Application Load Balancer with HTTPS
- ECR repository
- CloudWatch monitoring and alarms
- Secrets Manager for credentials
- IAM roles and policies

### Step 4: Configure GitHub Actions (5 minutes)

Add secrets to your GitHub repository (Settings → Secrets → Actions):

```bash
# Get credentials from Terraform output
AWS_ACCESS_KEY_ID=$(terraform output -raw github_actions_access_key_id)
AWS_SECRET_ACCESS_KEY=$(terraform output -raw github_actions_secret_access_key)
AWS_REGION=ap-southeast-2
```

Add these to GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

### Step 5: Initial Image Deploy (10 minutes)

```bash
# Build and push the first image
./scripts/deploy-manual.sh production

# This will:
# - Build Docker image from Dockerfile.railway
# - Push to ECR
# - Update ECS service
# - Wait for deployment to stabilize
```

### Step 6: Migrate Database (30 minutes)

**Export from Railway:**

```bash
# Login to Railway
railway login
railway link  # Select your project

# Export database
railway run pg_dump -Fc -v -d $DATABASE_URL > railway_dump.backup

# Verify size
ls -lh railway_dump.backup
```

**Import to AWS RDS:**

```bash
# Get RDS credentials
aws secretsmanager get-secret-value \
  --secret-id kyc-platform-db-password-production \
  --region ap-southeast-2 \
  --query SecretString --output text | jq -r

# Set connection variables
export PGHOST=$(terraform output -raw rds_endpoint | cut -d: -f1)
export PGPORT=5432
export PGDATABASE=kycplatform
export PGUSER=kycadmin
export PGPASSWORD=<from-secrets-manager>

# Import data
pg_restore -v -d $PGDATABASE railway_dump.backup

# Verify
psql -c "SELECT COUNT(*) FROM users;"
psql -c "SELECT COUNT(*) FROM entities;"
```

### Step 7: Validation (15 minutes)

```bash
# Run automated validation
./scripts/migration-validate.sh production https://your-alb-dns-name

# Manual checks:
# 1. Visit ALB URL: https://<alb-dns-name>
# 2. Test login with demo users
# 3. Check CloudWatch dashboard
# 4. Verify all data is present
```

### Step 8: DNS Cutover (5 minutes)

**Option A: Route53 Alias Record**

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id <YOUR_ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "kyc-platform.yourcompany.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "'$(terraform output -raw alb_zone_id)'",
          "DNSName": "'$(terraform output -raw alb_dns_name)'",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

**Option B: CNAME Record (External DNS)**

Point your CNAME to: `$(terraform output -raw alb_dns_name)`

### Step 9: Monitor (30 minutes)

```bash
# Watch ECS service
watch -n 5 'aws ecs describe-services \
  --cluster kyc-platform-cluster-production \
  --services kyc-platform-service-production \
  --query "services[0].{Running:runningCount,Desired:desiredCount}"'

# View application logs
aws logs tail /ecs/kyc-platform-production --follow

# Check CloudWatch dashboard
echo "https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#dashboards:name=kyc-platform-production"
```

### Step 10: Decommission Railway (After 48 hours)

Once confident in AWS deployment:

```bash
# 1. Take final Railway backup
railway run pg_dump -Fc > railway_final_backup.backup

# 2. Delete Railway service
railway down

# 3. Keep Railway project in read-only for 7 days
```

## Common Issues & Solutions

### Issue: Terraform apply fails with "InvalidParameterValue"

**Solution**: Check that `certificate_arn` is valid and in the correct region (ap-southeast-2)

### Issue: ECS tasks fail to start

**Diagnosis**:
```bash
aws ecs describe-tasks --cluster kyc-platform-cluster-production --tasks <task-arn>
aws logs tail /ecs/kyc-platform-production --since 10m
```

**Common causes**:
- Database connection failure (check security groups)
- Missing secrets in Secrets Manager
- Image pull errors (check ECR permissions)

### Issue: Database connection timeout

**Solution**: Verify security group rules:
```bash
# ECS tasks security group must be allowed in RDS security group
aws ec2 describe-security-groups --group-ids <rds-sg-id>
```

### Issue: ALB returns 502 Bad Gateway

**Diagnosis**:
```bash
aws elbv2 describe-target-health --target-group-arn <arn>
```

**Solution**: Check health check endpoint returns 200:
```bash
# Exec into container
TASK_ARN=$(aws ecs list-tasks --cluster kyc-platform-cluster-production --query 'taskArns[0]' --output text)
aws ecs execute-command \
  --cluster kyc-platform-cluster-production \
  --task "$TASK_ARN" \
  --container nextjs-app \
  --interactive \
  --command "/bin/sh"

# Test health endpoint
curl localhost:3000/api/db-test
```

## Rollback Plan

If critical issues occur:

```bash
# 1. Revert DNS to Railway
# Update your DNS to point back to Railway

# 2. Or rollback ECS to previous task definition
aws ecs update-service \
  --cluster kyc-platform-cluster-production \
  --service kyc-platform-service-production \
  --task-definition <previous-task-definition-arn>
```

## Cost Estimate

**Expected monthly cost**: ~$323 USD

Breakdown:
- ECS Fargate (2 tasks): $35
- RDS db.t3.medium Multi-AZ: $120
- RDS Storage (100 GB): $23
- NAT Gateway (2 AZs): $86
- ALB: $20
- Other services: $39

**Optimization tips**:
- Use RDS Reserved Instances (-40%)
- Single NAT Gateway for non-production (-$43/mo)
- Right-size ECS tasks based on metrics

## Next Steps

1. **Set up staging environment**:
   ```bash
   ./scripts/terraform-setup.sh staging
   terraform apply -var="environment=staging"
   ```

2. **Configure CI/CD for dev branch**:
   - Dev branch pushes deploy to staging automatically

3. **Enable additional monitoring**:
   - Set up PagerDuty/Slack integration with SNS
   - Configure custom CloudWatch dashboards

4. **Implement backups**:
   - RDS automated backups (already configured)
   - Manual snapshots before major changes

5. **Performance tuning**:
   - Monitor ECS CPU/memory metrics
   - Adjust auto-scaling thresholds
   - Consider RDS read replicas for reporting

## Support & Resources

- **TRD**: [AWS_MIGRATION_TRD.md](./AWS_MIGRATION_TRD.md) - Comprehensive technical reference
- **Terraform Docs**: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- **AWS ECS**: https://docs.aws.amazon.com/ecs/
- **AWS RDS**: https://docs.aws.amazon.com/rds/

## Useful Commands

```bash
# View logs
aws logs tail /ecs/kyc-platform-production --follow

# Force new deployment
aws ecs update-service \
  --cluster kyc-platform-cluster-production \
  --service kyc-platform-service-production \
  --force-new-deployment

# Exec into container
TASK_ARN=$(aws ecs list-tasks --cluster kyc-platform-cluster-production --query 'taskArns[0]' --output text)
aws ecs execute-command \
  --cluster kyc-platform-cluster-production \
  --task "$TASK_ARN" \
  --container nextjs-app \
  --interactive \
  --command "/bin/sh"

# Get database password
aws secretsmanager get-secret-value \
  --secret-id kyc-platform-db-password-production \
  --query SecretString --output text | jq -r

# Manual deployment
./scripts/deploy-manual.sh production

# Validation
./scripts/migration-validate.sh production https://your-domain.com
```

---

**Estimated Total Time**: 2-3 hours (excluding monitoring period)
