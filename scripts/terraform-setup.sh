#!/bin/bash
# Terraform setup script - prepares AWS backend and runs initial deployment
# Usage: ./scripts/terraform-setup.sh <environment>

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT="${1:-production}"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
STATE_BUCKET="kyc-platform-terraform-state"
LOCK_TABLE="kyc-platform-terraform-locks"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Terraform Infrastructure Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform not installed${NC}"
    echo -e "${YELLOW}💡 Install from: https://www.terraform.io/downloads${NC}"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not installed${NC}"
    echo -e "${YELLOW}💡 Install from: https://aws.amazon.com/cli/${NC}"
    exit 1
fi

if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Create S3 bucket for Terraform state
echo -e "${BLUE}📦 Setting up Terraform state backend...${NC}"

if aws s3 ls "s3://$STATE_BUCKET" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  S3 bucket already exists: $STATE_BUCKET${NC}"
else
    echo -e "${YELLOW}Creating S3 bucket: $STATE_BUCKET${NC}"

    if [ "$AWS_REGION" == "us-east-1" ]; then
        # us-east-1 doesn't need LocationConstraint
        aws s3api create-bucket \
            --bucket "$STATE_BUCKET" \
            --region "$AWS_REGION"
    else
        aws s3api create-bucket \
            --bucket "$STATE_BUCKET" \
            --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION"
    fi

    echo -e "${GREEN}✅ S3 bucket created${NC}"
fi

# Enable versioning
echo -e "${YELLOW}Enabling versioning...${NC}"
aws s3api put-bucket-versioning \
    --bucket "$STATE_BUCKET" \
    --versioning-configuration Status=Enabled

# Enable encryption
echo -e "${YELLOW}Enabling encryption...${NC}"
aws s3api put-bucket-encryption \
    --bucket "$STATE_BUCKET" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }'

# Block public access
echo -e "${YELLOW}Blocking public access...${NC}"
aws s3api put-public-access-block \
    --bucket "$STATE_BUCKET" \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo -e "${GREEN}✅ S3 bucket configured${NC}"
echo ""

# Create DynamoDB table for state locking
echo -e "${BLUE}🔒 Setting up state locking...${NC}"

if aws dynamodb describe-table --table-name "$LOCK_TABLE" --region "$AWS_REGION" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  DynamoDB table already exists: $LOCK_TABLE${NC}"
else
    echo -e "${YELLOW}Creating DynamoDB table: $LOCK_TABLE${NC}"

    aws dynamodb create-table \
        --table-name "$LOCK_TABLE" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$AWS_REGION"

    echo -e "${YELLOW}Waiting for table to be active...${NC}"
    aws dynamodb wait table-exists \
        --table-name "$LOCK_TABLE" \
        --region "$AWS_REGION"

    echo -e "${GREEN}✅ DynamoDB table created${NC}"
fi

echo ""

# Prepare terraform directory
echo -e "${BLUE}📁 Preparing Terraform configuration...${NC}"
cd infrastructure/terraform

# Check for terraform.tfvars
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${YELLOW}⚠️  terraform.tfvars not found${NC}"
    echo -e "${YELLOW}Copying from example...${NC}"
    cp terraform.tfvars.example terraform.tfvars

    echo ""
    echo -e "${RED}⚠️  IMPORTANT: Edit terraform.tfvars with your values!${NC}"
    echo -e "${YELLOW}Required values:${NC}"
    echo "  - app_domain"
    echo "  - certificate_arn"
    echo "  - nextauth_secret"
    echo "  - alert_email"
    echo ""
    echo -e "${YELLOW}Press Enter when ready to continue...${NC}"
    read -r
fi

# Initialize Terraform
echo -e "${BLUE}🔧 Initializing Terraform...${NC}"
terraform init \
    -backend-config="bucket=$STATE_BUCKET" \
    -backend-config="key=$ENVIRONMENT/terraform.tfstate" \
    -backend-config="region=$AWS_REGION" \
    -backend-config="dynamodb_table=$LOCK_TABLE"

echo -e "${GREEN}✅ Terraform initialized${NC}"
echo ""

# Validate configuration
echo -e "${BLUE}✔️  Validating configuration...${NC}"
if terraform validate; then
    echo -e "${GREEN}✅ Configuration valid${NC}"
else
    echo -e "${RED}❌ Configuration invalid${NC}"
    exit 1
fi
echo ""

# Format code
echo -e "${BLUE}🎨 Formatting Terraform code...${NC}"
terraform fmt -recursive
echo -e "${GREEN}✅ Code formatted${NC}"
echo ""

# Plan infrastructure
echo -e "${BLUE}📋 Planning infrastructure changes...${NC}"
echo -e "${YELLOW}Review the plan carefully before applying!${NC}"
echo ""

terraform plan \
    -var="environment=$ENVIRONMENT" \
    -out="tfplan-$ENVIRONMENT"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Plan Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Review the plan above"
echo -e "  2. If everything looks good, run:"
echo -e "     ${GREEN}terraform apply tfplan-$ENVIRONMENT${NC}"
echo ""
echo -e "${YELLOW}Estimated creation time: 15-20 minutes${NC}"
echo ""
echo -e "${YELLOW}After apply completes:${NC}"
echo -e "  1. Save the outputs: ${GREEN}terraform output -json > ../outputs.json${NC}"
echo -e "  2. Configure GitHub Secrets with AWS credentials"
echo -e "  3. Push Docker image: ${GREEN}./scripts/deploy-manual.sh $ENVIRONMENT${NC}"
echo ""
