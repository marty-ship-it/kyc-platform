#!/bin/bash
# Manual deployment script for AWS ECS
# Usage: ./scripts/deploy-manual.sh <environment>

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
ECR_REPO="kyc-platform-${ENVIRONMENT}"
ECS_CLUSTER="kyc-platform-cluster-${ENVIRONMENT}"
ECS_SERVICE="kyc-platform-service-${ENVIRONMENT}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  KYC Platform - Manual AWS Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Environment:${NC} $ENVIRONMENT"
echo -e "${YELLOW}AWS Region:${NC} $AWS_REGION"
echo ""

# Verify AWS credentials
echo -e "${BLUE}🔐 Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure'${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ Authenticated as AWS Account: $ACCOUNT_ID${NC}"
echo ""

# Get ECR repository URL
echo -e "${BLUE}📦 Getting ECR repository...${NC}"
ECR_URL=$(aws ecr describe-repositories \
    --repository-names "$ECR_REPO" \
    --region "$AWS_REGION" \
    --query 'repositories[0].repositoryUri' \
    --output text 2>/dev/null || echo "")

if [ -z "$ECR_URL" ]; then
    echo -e "${RED}❌ ECR repository not found: $ECR_REPO${NC}"
    echo -e "${YELLOW}💡 Run terraform apply first to create infrastructure${NC}"
    exit 1
fi

echo -e "${GREEN}✅ ECR Repository: $ECR_URL${NC}"
echo ""

# Login to ECR
echo -e "${BLUE}🔐 Logging in to ECR...${NC}"
if aws ecr get-login-password --region "$AWS_REGION" | \
   docker login --username AWS --password-stdin "$ECR_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ECR login successful${NC}"
else
    echo -e "${RED}❌ ECR login failed${NC}"
    exit 1
fi
echo ""

# Build image
echo -e "${BLUE}🔨 Building Docker image...${NC}"
if docker build -t "$ECR_REPO:latest" -f Dockerfile.railway . ; then
    echo -e "${GREEN}✅ Image built successfully${NC}"
else
    echo -e "${RED}❌ Image build failed${NC}"
    exit 1
fi
echo ""

# Get git commit hash
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Tag images
echo -e "${BLUE}🏷️  Tagging images...${NC}"
docker tag "$ECR_REPO:latest" "$ECR_URL:latest"
docker tag "$ECR_REPO:latest" "$ECR_URL:$GIT_SHA"
docker tag "$ECR_REPO:latest" "$ECR_URL:$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Images tagged${NC}"
echo ""

# Push images
echo -e "${BLUE}⬆️  Pushing images to ECR...${NC}"
docker push "$ECR_URL:latest"
docker push "$ECR_URL:$GIT_SHA"
docker push "$ECR_URL:$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Images pushed to ECR${NC}"
echo ""

# Update ECS service
echo -e "${BLUE}🔄 Updating ECS service...${NC}"
UPDATE_OUTPUT=$(aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$ECS_SERVICE" \
    --force-new-deployment \
    --region "$AWS_REGION" \
    2>&1 || echo "")

if [ -z "$UPDATE_OUTPUT" ]; then
    echo -e "${RED}❌ ECS service update failed${NC}"
    echo -e "${YELLOW}💡 Check that cluster and service exist${NC}"
    exit 1
fi

echo -e "${GREEN}✅ ECS service update initiated${NC}"
echo ""

# Wait for service stability
echo -e "${BLUE}⏳ Waiting for service to stabilize...${NC}"
echo -e "${YELLOW}This may take 5-10 minutes. Press Ctrl+C to stop watching.${NC}"
echo ""

if aws ecs wait services-stable \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE" \
    --region "$AWS_REGION" ; then
    echo ""
    echo -e "${GREEN}✅ Service is stable!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Service stability check failed or timed out${NC}"
    echo -e "${YELLOW}💡 Check ECS console for more details${NC}"
fi
echo ""

# Get deployment status
echo -e "${BLUE}📊 Deployment Status:${NC}"
aws ecs describe-services \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE" \
    --region "$AWS_REGION" \
    --query 'services[0].{RunningCount:runningCount,DesiredCount:desiredCount,Status:status}' \
    --output table

echo ""

# Get ALB endpoint
echo -e "${BLUE}🌐 Application URL:${NC}"
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names "kyc-platform-alb-${ENVIRONMENT}" \
    --region "$AWS_REGION" \
    --query 'LoadBalancers[0].DNSName' \
    --output text 2>/dev/null || echo "")

if [ -n "$ALB_DNS" ]; then
    echo -e "${GREEN}   https://$ALB_DNS${NC}"
    echo ""

    # Test health endpoint
    echo -e "${BLUE}🏥 Testing health endpoint...${NC}"
    if curl -sf "https://$ALB_DNS/api/db-test" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check failed. Application may still be starting...${NC}"
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo -e "  View logs:    ${YELLOW}aws logs tail /ecs/kyc-platform-${ENVIRONMENT} --follow${NC}"
echo -e "  ECS console:  ${YELLOW}https://console.aws.amazon.com/ecs/home?region=${AWS_REGION}#/clusters/${ECS_CLUSTER}${NC}"
echo ""
