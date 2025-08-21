#!/bin/bash

# Database management script for Drizzle migrations
# Usage: ./scripts/db.sh [generate|migrate|push] [migration-name]

set -e

case "$1" in
  "generate")
    echo "🔄 Generating database migration..."
    if [ -n "$2" ]; then
      npx drizzle-kit generate --name="$2"
    else
      npx drizzle-kit generate
    fi
    echo "✅ Migration generated successfully"
    echo "💡 Next: Run './scripts/db.sh migrate' to apply the migration"
    ;;
    
  "migrate")
    echo "🔄 Applying database migrations..."
    node scripts/migrate.js
    ;;
    
  "push")
    echo "⚠️  Using push mode (direct schema sync - use only for development)"
    npx drizzle-kit push
    echo "✅ Database schema pushed"
    ;;
    
  *)
    echo "Database management script"
    echo ""
    echo "Usage: ./scripts/db.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  generate [name]   - Generate a new migration file"
    echo "  migrate          - Apply all pending migrations"
    echo "  push            - Push schema directly (development only)"
    echo ""
    echo "Examples:"
    echo "  ./scripts/db.sh generate add_user_table"
    echo "  ./scripts/db.sh migrate"
    echo "  ./scripts/db.sh push"
    ;;
esac