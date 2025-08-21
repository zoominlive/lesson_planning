#!/usr/bin/env tsx
/**
 * Script to migrate all material images from local storage to AWS S3
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Now import the services after env vars are loaded
import { storage } from '../server/storage';
import { S3Service } from '../server/services/s3Service';

async function main() {
  console.log('============================================================');
  console.log('MATERIAL IMAGE MIGRATION TO S3');
  console.log('============================================================\n');
  
  const s3Service = new S3Service();
  console.log('Starting migration process...\n');
  
  try {
    // Get all materials from database
    const materials = await storage.getMaterials();
    console.log(`Found ${materials.length} materials to check`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: any[] = [];
    
    for (const material of materials) {
      // Skip if no photo URL
      if (!material.photoUrl) {
        console.log(`Skipping material ${material.id} (${material.name}) - no photo`);
        skippedCount++;
        continue;
      }
      
      // Skip if already has S3 key
      if (material.s3Key) {
        console.log(`Skipping material ${material.id} (${material.name}) - already migrated to S3`);
        skippedCount++;
        continue;
      }
      
      // Extract filename from URL
      let filename: string;
      if (material.photoUrl.startsWith('/api/materials/images/')) {
        filename = material.photoUrl.replace('/api/materials/images/', '');
      } else if (material.photoUrl.includes('/')) {
        const parts = material.photoUrl.split('/');
        filename = parts[parts.length - 1];
      } else {
        filename = material.photoUrl;
      }
      
      // Build local file path
      const localPath = path.join(process.cwd(), 'public', 'materials', 'images', filename);
      
      console.log(`\nMigrating material ${material.id} (${material.name})`);
      console.log(`  Looking for file: ${filename}`);
      
      try {
        // Check if file exists
        await fs.access(localPath);
        
        // Read the file
        const fileBuffer = await fs.readFile(localPath);
        
        // Upload to S3
        const s3Result = await s3Service.uploadImage({
          tenantId: material.tenantId,
          type: 'material',
          originalName: filename,
          id: material.id,
          buffer: fileBuffer,
        });
        
        console.log(`  ✓ Uploaded to S3: ${s3Result.key}`);
        
        // Generate signed URL for immediate use
        const signedUrl = await s3Service.getSignedUrl({
          key: s3Result.key,
          operation: 'get',
          expiresIn: 3600,
        });
        
        // Update material with S3 key (keep the original photoUrl for now)
        await storage.updateMaterial(material.id, {
          s3Key: s3Result.key,
          photoUrl: material.photoUrl, // Keep original URL for backwards compatibility
        });
        
        console.log(`  ✓ Updated material record with S3 key`);
        migratedCount++;
        
      } catch (error: any) {
        console.error(`  ✗ Failed to migrate: ${error.message}`);
        errors.push({
          id: material.id,
          name: material.name,
          error: error.message
        });
        errorCount++;
      }
    }
    
    console.log('\n============================================================');
    console.log('MIGRATION RESULTS');
    console.log('============================================================');
    console.log(`Total materials checked: ${materials.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Failed: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\nERRORS:');
      errors.forEach(err => {
        console.log(`  - ${err.name} (${err.id}): ${err.error}`);
      });
    }
    
    console.log('\n============================================================');
    console.log('Migration completed!');
    console.log('============================================================');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch(console.error);