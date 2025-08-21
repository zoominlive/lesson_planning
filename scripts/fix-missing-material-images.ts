#!/usr/bin/env tsx
/**
 * Script to fix missing material images by using AI-generated placeholders
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
  console.log('Fixing missing material images...\n');
  
  const s3Service = new S3Service();
  
  // Materials with missing images
  const missingMaterials = [
    { id: '19982068-d4bf-4dd5-ae4a-64444cb4e5ba', name: 'Bubble Solution', fallbackImage: 'ai_generated_material_1755575837386_043be1e1.png' },
    { id: 'b25e4338-2137-4c3c-9760-9f52769f6a1d', name: 'Play Balls', fallbackImage: 'ai_generated_material_1755576583121_37877eaa.png' },
    { id: '6487e4f8-59da-4851-8017-0be90930380f', name: 'Colored Pencils', fallbackImage: 'ai_generated_material_1755576830901_caffa2a4.png' },
  ];
  
  for (const { id, name, fallbackImage } of missingMaterials) {
    try {
      const material = await storage.getMaterial(id);
      if (!material) {
        console.log(`Material ${id} not found`);
        continue;
      }
      
      // Skip if already has S3 key
      if (material.s3Key) {
        console.log(`Material ${name} already has S3 key`);
        continue;
      }
      
      console.log(`Processing: ${name}`);
      
      // Use an AI-generated image as placeholder
      const placeholderPath = path.join(process.cwd(), 'public', 'materials', 'images', fallbackImage);
      
      try {
        await fs.access(placeholderPath);
        const fileBuffer = await fs.readFile(placeholderPath);
        
        // Upload to S3
        const s3Result = await s3Service.uploadImage({
          tenantId: material.tenantId,
          type: 'material',
          originalName: fallbackImage,
          id: material.id,
          buffer: fileBuffer,
        });
        
        console.log(`  Uploaded to S3: ${s3Result.key}`);
        
        // Generate signed URL
        const signedUrl = await s3Service.getSignedUrl({
          key: s3Result.key,
          operation: 'get',
          expiresIn: 3600,
        });
        
        // Update material with S3 key
        await storage.updateMaterial(id, {
          s3Key: s3Result.key,
          photoUrl: material.photoUrl || `/api/materials/images/${fallbackImage}`,
        });
        
        console.log(`  ✓ Fixed with AI-generated image`);
      } catch (error) {
        console.error(`  ✗ Failed to fix: ${error}`);
      }
    } catch (error) {
      console.error(`Failed to process material ${id}:`, error);
    }
  }
  
  console.log('\nMissing material images have been fixed!');
  process.exit(0);
}

main().catch(console.error);