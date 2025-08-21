#!/usr/bin/env node

/**
 * Database migration script for Drizzle ORM
 * Usage: node scripts/migrate.js
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool } from '@neondatabase/serverless';
import * as schema from '../shared/schema.js';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

console.log('🔄 Running database migrations...');

try {
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('✅ Database migrations completed successfully');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  await pool.end();
}