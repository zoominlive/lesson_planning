# Database Migration Guide - Hybrid Approach

This project uses a **hybrid migration approach** combining Drizzle's push method for development with migration files for production deployment.

## Hybrid Migration Workflow

### 🔧 Development Changes (Recommended)

When you make changes to the database schema in `shared/schema.ts`:

1. **Apply Changes Directly**
   ```bash
   ./scripts/db.sh push
   ```
   This reliably syncs your schema changes to the database.

2. **Generate Migration for Production** (Optional)
   ```bash
   ./scripts/db.sh generate "describe_your_changes"
   ```
   This creates migration files for production deployment tracking.

### Why This Approach?
- **Existing Database**: 21 tables created with push method
- **Reliability**: Push method handles existing database without conflicts  
- **Production Readiness**: Migration files available when needed

### 🔄 Available Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `./scripts/db.sh push` | Direct schema sync (primary method) | Development changes |
| `./scripts/db.sh generate [name]` | Create migration file from schema changes | Production deployment prep |
| `./scripts/db.sh migrate` | Apply pending migrations to database | Production deployment |

### 🏗️ Migration Files

- Location: `migrations/` folder
- Format: `XXXX_migration_name.sql`
- Version controlled: Yes ✅
- Rollback support: Yes ✅
- Production safe: Yes ✅

## Benefits of Migrations

- **Change History**: Every schema change is tracked
- **Team Collaboration**: Migrations can be reviewed in PRs
- **Production Safety**: Migrations can be tested before deployment
- **Rollback Support**: Changes can be undone if needed
- **Environment Sync**: Same migrations work across dev/staging/prod

## Migration vs Push

| Method | Generate Files | Version Control | Production Safe | Rollback |
|--------|----------------|-----------------|-----------------|----------|
| **Migration** ✅ | Yes | Yes | Yes | Yes |
| **Push** ❌ | No | No | Risky | No |

## Example Workflow

```bash
# 1. Modify schema in shared/schema.ts
# 2. Generate migration
./scripts/db.sh generate "add_lesson_plan_status"

# 3. Review the generated migration file
cat migrations/XXXX_add_lesson_plan_status.sql

# 4. Apply migration
./scripts/db.sh migrate
```

## ✅ Hybrid Approach - Status Complete

**Your Current Setup:**
- **Development Workflow**: `./scripts/db.sh push` (reliable and tested)
- **Production Ready**: Migration generation available when needed
- **Migration Infrastructure**: Fully implemented and documented
- **Database Status**: 21 tables, working perfectly with push method

## Daily Workflow

### For Schema Changes:
```bash
# 1. Edit shared/schema.ts
# 2. Apply changes
./scripts/db.sh push

# 3. Optional: Generate migration file for production
./scripts/db.sh generate "describe_your_changes"
```

### Benefits You Get:
- **Reliability**: Push method works consistently with your database
- **Production Ready**: Migration files when you need them
- **Same Process**: Consistent workflow for dev and prod preparation
- **No Conflicts**: Avoids baseline issues with existing database

## Migration Infrastructure Ready

When you need it for production deployment:
- Migration scripts are ready
- Documentation is complete
- Baseline handling is implemented
- Both approaches work seamlessly

## Legacy Support

The old `npm run db:push` command is still available for quick development testing, but should not be used for production changes.