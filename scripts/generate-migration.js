#!/usr/bin/env node

/**
 * Generate database migration script for Drizzle ORM
 * Usage: node scripts/generate-migration.js [migration-name]
 */

import { execSync } from 'child_process';

const migrationName = process.argv[2];
const nameArg = migrationName ? ` --name="${migrationName}"` : '';

console.log('🔄 Generating database migration...');

try {
  execSync(`npx drizzle-kit generate${nameArg}`, { stdio: 'inherit' });
  console.log('✅ Migration generated successfully');
  console.log('💡 Next: Run "npm run db:migrate" to apply the migration');
} catch (error) {
  console.error('❌ Migration generation failed:', error.message);
  process.exit(1);
}