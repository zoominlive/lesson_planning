#!/bin/bash

# Verify S3 Deployment
# This script checks that all S3 resources are accessible after deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}S3 Deployment Verification${NC}"
echo -e "${YELLOW}========================================${NC}"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    exit 1
fi

# Load production environment
source .env.production

if [ -z "$PRODUCTION_DATABASE_URL" ]; then
    echo -e "${RED}Error: PRODUCTION_DATABASE_URL not found${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Checking database S3 keys...${NC}"

# Check activities with S3 keys
ACTIVITIES_WITH_S3=$(psql "$PRODUCTION_DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM activities 
    WHERE s3_image_key IS NOT NULL;
" 2>/dev/null || echo "0")

ACTIVITIES_WITHOUT_S3=$(psql "$PRODUCTION_DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM activities 
    WHERE image_url IS NOT NULL AND s3_image_key IS NULL;
" 2>/dev/null || echo "0")

echo "Activities with S3 keys: $ACTIVITIES_WITH_S3"
echo "Activities without S3 keys: $ACTIVITIES_WITHOUT_S3"

# Check materials with S3 keys
MATERIALS_WITH_S3=$(psql "$PRODUCTION_DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM materials 
    WHERE s3_key IS NOT NULL;
" 2>/dev/null || echo "0")

MATERIALS_WITHOUT_S3=$(psql "$PRODUCTION_DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM materials 
    WHERE photo_url IS NOT NULL AND s3_key IS NULL;
" 2>/dev/null || echo "0")

echo "Materials with S3 keys: $MATERIALS_WITH_S3"
echo "Materials without S3 keys: $MATERIALS_WITHOUT_S3"

# Check milestones with S3 keys
MILESTONES_WITH_S3=$(psql "$PRODUCTION_DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM milestones 
    WHERE s3_key IS NOT NULL;
" 2>/dev/null || echo "0")

MILESTONES_WITHOUT_S3=$(psql "$PRODUCTION_DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM milestones 
    WHERE image_url IS NOT NULL AND s3_key IS NULL;
" 2>/dev/null || echo "0")

echo "Milestones with S3 keys: $MILESTONES_WITH_S3"
echo "Milestones without S3 keys: $MILESTONES_WITHOUT_S3"

echo -e "\n${YELLOW}Testing S3 bucket access...${NC}"

# Test AWS CLI access (if installed)
if command -v aws &> /dev/null; then
    echo "Testing AWS S3 access..."
    if aws s3 ls s3://$S3_BUCKET_NAME/lesson-planning/ --region $AWS_REGION > /dev/null 2>&1; then
        echo -e "${GREEN}✓ S3 bucket accessible${NC}"
        
        # Count objects
        TOTAL_OBJECTS=$(aws s3 ls s3://$S3_BUCKET_NAME/lesson-planning/ --recursive --region $AWS_REGION | wc -l)
        echo "Total objects in S3: $TOTAL_OBJECTS"
    else
        echo -e "${RED}✗ Cannot access S3 bucket${NC}"
        echo "Check AWS credentials and bucket permissions"
    fi
else
    echo -e "${YELLOW}AWS CLI not installed, skipping S3 access test${NC}"
fi

echo -e "\n${YELLOW}Sample S3 keys from database:${NC}"

# Show sample S3 keys
echo -e "\nSample activity S3 keys:"
psql "$PRODUCTION_DATABASE_URL" -c "
    SELECT title, s3_image_key 
    FROM activities 
    WHERE s3_image_key IS NOT NULL 
    LIMIT 3;
"

echo -e "\nSample material S3 keys:"
psql "$PRODUCTION_DATABASE_URL" -c "
    SELECT name, s3_key 
    FROM materials 
    WHERE s3_key IS NOT NULL 
    LIMIT 3;
"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Verification Complete${NC}"
echo -e "${GREEN}========================================${NC}"

if [ "$ACTIVITIES_WITHOUT_S3" -eq "0" ] && [ "$MATERIALS_WITHOUT_S3" -eq "0" ] && [ "$MILESTONES_WITHOUT_S3" -eq "0" ]; then
    echo -e "${GREEN}✓ All images migrated to S3 successfully!${NC}"
else
    echo -e "${YELLOW}⚠ Some images may not be migrated to S3${NC}"
fi