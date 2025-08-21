# Database Migration Guide

This project has been updated to use **proper database migrations** instead of direct schema pushing for better production readiness and change tracking.

## Migration Workflow

### 📁 New Development Approach

When you make changes to the database schema in `shared/schema.ts`:

1. **Generate Migration**
   ```bash
   ./scripts/db.sh generate "describe_your_changes"
   ```
   This creates a versioned SQL migration file in the `migrations/` folder.

2. **Review Migration**
   Check the generated migration file to ensure it's correct before applying.

3. **Apply Migration**
   ```bash
   ./scripts/db.sh migrate
   ```
   This applies the migration to your database.

### 🔄 Available Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `./scripts/db.sh generate [name]` | Create migration file from schema changes | After modifying schema |
| `./scripts/db.sh migrate` | Apply pending migrations to database | Deploy changes |
| `./scripts/db.sh push` | Direct schema sync (old method) | Quick dev testing only |

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

## Legacy Support

The old `npm run db:push` command is still available for quick development testing, but should not be used for production changes.