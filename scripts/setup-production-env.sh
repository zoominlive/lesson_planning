#!/bin/bash

# Production Environment Setup Guide
# This script provides instructions for configuring production secrets in Replit

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Production Environment Setup Guide${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${YELLOW}IMPORTANT: All production secrets should be configured in Replit's Secrets tab${NC}"
echo -e "${YELLOW}Never store credentials in files!${NC}\n"

echo -e "${GREEN}Required Secrets for Production:${NC}"
echo ""

echo -e "${BLUE}1. Database Configuration:${NC}"
echo "   PROD_DATABASE_URL - Your production PostgreSQL connection string"
echo "   Example: postgresql://user:password@host/database?sslmode=require"
echo ""

echo -e "${BLUE}2. AWS S3 Configuration (if different from development):${NC}"
echo "   S3_ACCESS_KEY - AWS access key for S3"
echo "   S3_SECRET - AWS secret key for S3"
echo "   S3_DEV_BUCKET_URI - S3 bucket URI"
echo ""

echo -e "${BLUE}3. API Keys (if using AI features):${NC}"
echo "   OPENAI_API_KEY - OpenAI API key for image generation"
echo "   PERPLEXITY_API_KEY - Perplexity API key for content generation"
echo "   ANTHROPIC_API_KEY - Anthropic API key (optional)"
echo ""

echo -e "${YELLOW}How to add secrets in Replit:${NC}"
echo "1. Open your Replit project"
echo "2. Click on the 'Secrets' tab (lock icon) in the left sidebar"
echo "3. Click 'New Secret'"
echo "4. Enter the secret name (e.g., PROD_DATABASE_URL)"
echo "5. Enter the secret value"
echo "6. Click 'Add Secret'"
echo ""

echo -e "${YELLOW}To get your production database URL:${NC}"
echo "1. Go to your database provider (e.g., Neon, Supabase, etc.)"
echo "2. Find your production database connection string"
echo "3. Copy the full PostgreSQL URL including ?sslmode=require"
echo ""

# Check current secrets status
echo -e "${GREEN}Checking current secrets configuration...${NC}"
echo ""

# Check for required production secrets
check_secret() {
    local secret_name=$1
    if [ -z "${!secret_name}" ]; then
        echo -e "  ${RED}✗${NC} $secret_name - Not configured"
        return 1
    else
        echo -e "  ${GREEN}✓${NC} $secret_name - Configured"
        return 0
    fi
}

echo -e "${BLUE}Development Secrets:${NC}"
check_secret "DATABASE_URL"
check_secret "S3_ACCESS_KEY"
check_secret "S3_SECRET"
check_secret "S3_DEV_BUCKET_URI"
check_secret "OPENAI_API_KEY"
check_secret "PERPLEXITY_API_KEY"

echo ""
echo -e "${BLUE}Production Secrets:${NC}"
check_secret "PROD_DATABASE_URL"

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Add any missing secrets to Replit's Secrets tab"
echo "2. Run ./scripts/deploy-db-to-prod.sh to deploy database to production"
echo "3. Deploy your application code to production"
echo ""
echo -e "${GREEN}Remember: Never put actual credentials in .env files!${NC}"
echo -e "${GREEN}Always use Replit Secrets for sensitive values.${NC}"