#!/bin/bash
# Post-migration validation script
# Usage: ./scripts/migration-validate.sh <environment> <app-url>

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT="${1:-production}"
BASE_URL="${2:-https://kyc-platform.example.com}"
PASS_COUNT=0
FAIL_COUNT=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Post-Migration Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Environment:${NC} $ENVIRONMENT"
echo -e "${YELLOW}Base URL:${NC} $BASE_URL"
echo ""

# Helper functions
pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASS_COUNT++))
}

fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAIL_COUNT++))
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

test_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_code=${3:-200}

    echo -ne "Testing $description... "

    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" || echo "000")

    if [ "$status_code" -eq "$expected_code" ]; then
        pass "$description ($status_code)"
    else
        fail "$description (got $status_code, expected $expected_code)"
    fi
}

# 1. Basic Connectivity
echo -e "${BLUE}🌐 Testing Basic Connectivity${NC}"
echo "----------------------------------------"

test_endpoint "/api/db-test" "Health endpoint" 200

# Test HTTPS enforcement
echo -ne "Testing HTTPS redirect... "
if curl -s -L -o /dev/null -w "%{http_code}" "${BASE_URL/https/http}" | grep -q "200"; then
    pass "HTTP redirects to HTTPS"
else
    fail "HTTP redirect not working"
fi

echo ""

# 2. API Endpoints
echo -e "${BLUE}🔌 Testing API Endpoints${NC}"
echo "----------------------------------------"

test_endpoint "/api/auth/signin" "Auth signin page" 200
test_endpoint "/api/debug-env" "Debug endpoint" 200

# These require authentication, just check they're accessible
test_endpoint "/api/entities" "Entities API" 401
test_endpoint "/api/cases" "Cases API" 401
test_endpoint "/api/deals" "Deals API" 401

echo ""

# 3. Performance Tests
echo -e "${BLUE}⚡ Testing Performance${NC}"
echo "----------------------------------------"

echo -ne "Testing response time... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/api/db-test")
response_ms=$(echo "$response_time * 1000" | bc)

if (( $(echo "$response_time < 2.0" | bc -l) )); then
    pass "Response time: ${response_ms}ms (< 2000ms)"
else
    warn "Response time: ${response_ms}ms (slow)"
fi

echo ""

# 4. Database Connectivity
if [ -n "${PGHOST:-}" ] && [ -n "${PGUSER:-}" ]; then
    echo -e "${BLUE}🗄️  Testing Database Connectivity${NC}"
    echo "----------------------------------------"

    echo -ne "Testing database connection... "
    if psql -h "$PGHOST" -U "$PGUSER" -d "${PGDATABASE:-kycplatform}" -c "SELECT 1;" > /dev/null 2>&1; then
        pass "Database connection successful"

        # Check table counts
        echo -ne "Checking data integrity... "
        USER_COUNT=$(psql -h "$PGHOST" -U "$PGUSER" -d "${PGDATABASE:-kycplatform}" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
        ENTITY_COUNT=$(psql -h "$PGHOST" -U "$PGUSER" -d "${PGDATABASE:-kycplatform}" -t -c "SELECT COUNT(*) FROM entities;" 2>/dev/null | tr -d ' ')

        if [ "$USER_COUNT" -gt 0 ] && [ "$ENTITY_COUNT" -gt 0 ]; then
            pass "Data present (Users: $USER_COUNT, Entities: $ENTITY_COUNT)"
        else
            fail "Data missing or empty"
        fi
    else
        fail "Database connection failed"
    fi

    echo ""
else
    warn "Skipping database tests (PGHOST not set)"
    echo ""
fi

# 5. AWS Service Health
if command -v aws &> /dev/null; then
    echo -e "${BLUE}☁️  Testing AWS Services${NC}"
    echo "----------------------------------------"

    # ECS Service
    echo -ne "Testing ECS service... "
    ECS_STATUS=$(aws ecs describe-services \
        --cluster "kyc-platform-cluster-$ENVIRONMENT" \
        --services "kyc-platform-service-$ENVIRONMENT" \
        --region ap-southeast-2 \
        --query 'services[0].{Running:runningCount,Desired:desiredCount,Status:status}' \
        --output json 2>/dev/null || echo "{}")

    RUNNING=$(echo "$ECS_STATUS" | jq -r '.Running // 0')
    DESIRED=$(echo "$ECS_STATUS" | jq -r '.Desired // 0')

    if [ "$RUNNING" -eq "$DESIRED" ] && [ "$RUNNING" -gt 0 ]; then
        pass "ECS tasks healthy ($RUNNING/$DESIRED running)"
    else
        fail "ECS tasks unhealthy ($RUNNING/$DESIRED running)"
    fi

    # ALB Targets
    echo -ne "Testing ALB targets... "
    TARGET_HEALTH=$(aws elbv2 describe-target-health \
        --target-group-arn $(aws elbv2 describe-target-groups \
            --names "kyc-platform-tg-$ENVIRONMENT" \
            --region ap-southeast-2 \
            --query 'TargetGroups[0].TargetGroupArn' \
            --output text 2>/dev/null) \
        --region ap-southeast-2 \
        --query 'TargetHealthDescriptions[?TargetHealth.State==`healthy`]' \
        --output json 2>/dev/null || echo "[]")

    HEALTHY_COUNT=$(echo "$TARGET_HEALTH" | jq '. | length')

    if [ "$HEALTHY_COUNT" -gt 0 ]; then
        pass "ALB has $HEALTHY_COUNT healthy target(s)"
    else
        fail "No healthy ALB targets"
    fi

    # RDS Status
    echo -ne "Testing RDS instance... "
    RDS_STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier "kyc-platform-db-$ENVIRONMENT" \
        --region ap-southeast-2 \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text 2>/dev/null || echo "")

    if [ "$RDS_STATUS" == "available" ]; then
        pass "RDS instance available"
    else
        fail "RDS instance status: $RDS_STATUS"
    fi

    echo ""
else
    warn "Skipping AWS tests (AWS CLI not available)"
    echo ""
fi

# 6. Security Checks
echo -e "${BLUE}🔒 Testing Security${NC}"
echo "----------------------------------------"

echo -ne "Testing SSL certificate... "
if echo | openssl s_client -connect "${BASE_URL#https://}:443" -servername "${BASE_URL#https://}" 2>/dev/null | grep -q "Verify return code: 0"; then
    pass "SSL certificate valid"
else
    warn "SSL certificate validation failed"
fi

echo -ne "Testing security headers... "
headers=$(curl -s -I "$BASE_URL/api/db-test")
if echo "$headers" | grep -qi "strict-transport-security"; then
    pass "Security headers present"
else
    warn "Missing security headers"
fi

echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Validation Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ All validation checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some validation checks failed${NC}"
    echo -e "${YELLOW}💡 Review failed checks above${NC}"
    exit 1
fi
