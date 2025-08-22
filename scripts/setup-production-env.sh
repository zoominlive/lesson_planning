#!/bin/bash

# Setup Production Environment File
# This script helps you configure the .env.production file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Production Environment Setup${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${YELLOW}To find your production database URL from Replit:${NC}"
echo "1. Go to your Replit deployment dashboard"
echo "2. Click on your deployed app"
echo "3. Go to the 'Settings' or 'Environment Variables' tab"
echo "4. Look for DATABASE_URL (this was created when you first deployed)"
echo ""
echo -e "${YELLOW}You'll also need your AWS S3 credentials from your AWS account${NC}"
echo ""

# Create or update .env.production
echo -e "\n${GREEN}Let's set up your production environment...${NC}"

# Check if .env.production exists
if [ -f .env.production ]; then
    echo -e "${YELLOW}Found existing .env.production file${NC}"
    echo "Do you want to update it? (y/n)"
    read -r UPDATE_CHOICE
    if [ "$UPDATE_CHOICE" != "y" ]; then
        echo "Keeping existing configuration"
        exit 0
    fi
fi

# Get production database URL
echo -e "\n${BLUE}Step 1: Database Configuration${NC}"
echo "Enter your production DATABASE_URL from Replit deployment:"
echo "(It should look like: postgresql://username:password@host/database?sslmode=require)"
read -r PROD_DB_URL

if [ -z "$PROD_DB_URL" ]; then
    echo -e "${RED}Error: Database URL cannot be empty${NC}"
    exit 1
fi

# Get AWS credentials (use development ones if same)
echo -e "\n${BLUE}Step 2: AWS S3 Configuration${NC}"
echo "Are you using the same AWS S3 bucket as development? (y/n)"
read -r SAME_AWS

if [ "$SAME_AWS" = "y" ]; then
    # Try to get from current environment
    AWS_KEY_ID="${AWS_ACCESS_KEY_ID}"
    AWS_SECRET="${AWS_SECRET_ACCESS_KEY}"
    AWS_REG="${AWS_REGION:-ca-central-1}"
    S3_BUCKET="${S3_BUCKET_NAME:-duploservices-dev-activities-748544146453}"
    
    echo "Using development AWS configuration:"
    echo "  AWS_REGION: $AWS_REG"
    echo "  S3_BUCKET_NAME: $S3_BUCKET"
else
    echo "Enter AWS_ACCESS_KEY_ID:"
    read -r AWS_KEY_ID
    echo "Enter AWS_SECRET_ACCESS_KEY:"
    read -s AWS_SECRET
    echo ""
    echo "Enter AWS_REGION (default: ca-central-1):"
    read -r AWS_REG
    AWS_REG="${AWS_REG:-ca-central-1}"
    echo "Enter S3_BUCKET_NAME (default: duploservices-dev-activities-748544146453):"
    read -r S3_BUCKET
    S3_BUCKET="${S3_BUCKET:-duploservices-dev-activities-748544146453}"
fi

# Get API keys
echo -e "\n${BLUE}Step 3: API Keys (optional)${NC}"
echo "Do you want to set up API keys now? (y/n)"
read -r SETUP_APIS

if [ "$SETUP_APIS" = "y" ]; then
    echo "Enter OPENAI_API_KEY (or press Enter to skip):"
    read -r OPENAI_KEY
    echo "Enter PERPLEXITY_API_KEY (or press Enter to skip):"
    read -r PERPLEXITY_KEY
    echo "Enter ANTHROPIC_API_KEY (or press Enter to skip):"
    read -r ANTHROPIC_KEY
else
    # Use development keys if available
    OPENAI_KEY="${OPENAI_API_KEY}"
    PERPLEXITY_KEY="${PERPLEXITY_API_KEY}"
    ANTHROPIC_KEY="${ANTHROPIC_API_KEY}"
fi

# Get JWT secret
echo -e "\n${BLUE}Step 4: JWT Secret${NC}"
echo "Enter JWT_SECRET for production (or press Enter to generate one):"
read -r JWT_SEC

if [ -z "$JWT_SEC" ]; then
    # Generate a random JWT secret
    JWT_SEC=$(openssl rand -base64 32)
    echo -e "${GREEN}Generated JWT secret: $JWT_SEC${NC}"
fi

# Write to .env.production
echo -e "\n${YELLOW}Writing configuration to .env.production...${NC}"

cat > .env.production << EOF
# Production Database Configuration
# Generated on $(date)

# Production PostgreSQL Database URL
PRODUCTION_DATABASE_URL=$PROD_DB_URL

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=$AWS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET
AWS_REGION=$AWS_REG
S3_BUCKET_NAME=$S3_BUCKET

# API Keys
OPENAI_API_KEY=$OPENAI_KEY
PERPLEXITY_API_KEY=$PERPLEXITY_KEY
ANTHROPIC_API_KEY=$ANTHROPIC_KEY

# JWT Configuration
JWT_SECRET=$JWT_SEC
EOF

echo -e "${GREEN}✓ Production environment configured successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review .env.production to ensure all values are correct"
echo "2. Run ./scripts/deploy-db-to-prod.sh to deploy database"
echo "3. Deploy your application code to production"
echo ""
echo -e "${RED}Important: Keep .env.production secure and never commit it to git!${NC}"