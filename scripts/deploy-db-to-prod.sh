#!/bin/bash

# Deploy Development Database to Production
# This script completely replaces the production database with development data
# WARNING: This will overwrite ALL production data!

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Database Deployment Script${NC}"
echo -e "${YELLOW}Development → Production${NC}"
echo -e "${YELLOW}========================================${NC}"

# Production secrets are now in Replit Secrets
echo -e "${GREEN}Using production database from Replit Secrets${NC}"

# Development database URL is already in environment (Replit)
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: Development DATABASE_URL not found${NC}"
    echo "DATABASE_URL environment variable is not set"
    exit 1
fi

# Production database URL should be in Replit secrets as PROD_DATABASE_URL
if [ -z "$PROD_DATABASE_URL" ]; then
    echo -e "${RED}Error: Production PROD_DATABASE_URL not found${NC}"
    echo "Please add PROD_DATABASE_URL to Replit Secrets"
    exit 1
fi

# Extract database URLs
DEV_DB_URL=${DATABASE_URL}
PROD_DB_URL=${PROD_DATABASE_URL}

if [ -z "$DEV_DB_URL" ] || [ -z "$PROD_DB_URL" ]; then
    echo -e "${RED}Error: Database URLs not found in environment files${NC}"
    exit 1
fi

# Create backup directory
BACKUP_DIR="./database-backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "\n${YELLOW}Step 1: Backing up production database...${NC}"
PROD_BACKUP_FILE="$BACKUP_DIR/prod_backup_${TIMESTAMP}.sql"
pg_dump "$PROD_DB_URL" > "$PROD_BACKUP_FILE"
echo -e "${GREEN}✓ Production backup saved to: $PROD_BACKUP_FILE${NC}"

echo -e "\n${YELLOW}Step 2: Exporting development database...${NC}"
DEV_EXPORT_FILE="$BACKUP_DIR/dev_export_${TIMESTAMP}.sql"
pg_dump "$DEV_DB_URL" > "$DEV_EXPORT_FILE"
echo -e "${GREEN}✓ Development database exported to: $DEV_EXPORT_FILE${NC}"

echo -e "\n${YELLOW}Step 3: WARNING - About to overwrite production database!${NC}"
echo -e "${RED}This will permanently replace ALL production data with development data.${NC}"
read -p "Are you absolutely sure? Type 'DEPLOY' to continue: " CONFIRM

if [ "$CONFIRM" != "DEPLOY" ]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 4: Clearing production database tables...${NC}"
# Instead of dropping the entire database (which requires superuser privileges),
# we'll drop all tables in the existing database
psql "$PROD_DB_URL" << EOF
-- Drop all tables in the current schema
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all sequences
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public')
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
    
    -- Drop all types
    FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e')
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END \$\$;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Production database tables cleared${NC}"
else
    echo -e "${RED}Failed to clear production database tables${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 5: Restoring development data to production...${NC}"
psql "$PROD_DB_URL" < "$DEV_EXPORT_FILE"
echo -e "${GREEN}✓ Development data restored to production${NC}"

echo -e "\n${YELLOW}Step 6: Verifying deployment...${NC}"
# Run a simple query to verify
ACTIVITY_COUNT=$(psql "$PROD_DB_URL" -t -c "SELECT COUNT(*) FROM activities;" 2>/dev/null || echo "0")
MATERIAL_COUNT=$(psql "$PROD_DB_URL" -t -c "SELECT COUNT(*) FROM materials;" 2>/dev/null || echo "0")
MILESTONE_COUNT=$(psql "$PROD_DB_URL" -t -c "SELECT COUNT(*) FROM milestones;" 2>/dev/null || echo "0")

echo -e "${GREEN}✓ Database verification:${NC}"
echo "  - Activities: $ACTIVITY_COUNT"
echo "  - Materials: $MATERIAL_COUNT"
echo "  - Milestones: $MILESTONE_COUNT"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Deploy the latest code to production"
echo "2. Verify environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.)"
echo "3. Restart the production server"
echo "4. Test image loading with S3 signed URLs"
echo -e "\n${YELLOW}Backup location:${NC} $PROD_BACKUP_FILE"
echo -e "${YELLOW}To rollback:${NC} psql \$PROD_DATABASE_URL < $PROD_BACKUP_FILE"