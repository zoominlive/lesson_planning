#!/usr/bin/env tsx
/**
 * Script to migrate all milestone images from local storage to AWS S3
 * Run with: npx tsx scripts/migrate-milestones-to-s3.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Now import the services after env vars are loaded
import { S3MigrationService } from '../server/services/s3MigrationService';

async function main() {
  console.log('='.repeat(60));
  console.log('MILESTONE IMAGE MIGRATION TO S3');
  console.log('='.repeat(60));
  console.log('');
  
  const migrationService = new S3MigrationService();
  
  try {
    console.log('Starting migration process...\n');
    
    const results = await migrationService.migrateMilestoneImages();
    
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION RESULTS');
    console.log('='.repeat(60));
    console.log(`Total milestones checked: ${results.total}`);
    console.log(`Successfully migrated: ${results.migrated}`);
    console.log(`Failed migrations: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\nERRORS:');
      results.errors.forEach(error => {
        console.log(`  - Milestone ${error.id}: ${error.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Migration completed!');
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('MIGRATION FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the migration
main().catch(console.error);