#!/usr/bin/env tsx
/**
 * Script to restore default placeholder images for milestones missing photos
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
  console.log('Restoring placeholder images for milestones...\n');
  
  const s3Service = new S3Service();
  
  // Milestones that need images
  const milestonesToRestore = [
    { id: '4ead1815-cbb3-480f-a03d-4ee22857c5df', title: 'Shares toys with peers', suggestedFile: 'express_feelings.png' },
    { id: '16b4900d-14a8-493b-8ecc-fb7d5e5144aa', title: 'Comforts others when upset', suggestedFile: 'express_feelings.png' },
    { id: '72236a10-da6a-4b3f-8b90-37ae205c1fcc', title: 'Completes simple puzzles', suggestedFile: 'sorts_objects.png' },
    { id: '92b31b7d-83f4-4e3e-ae78-0d984c8cb283', title: 'Climbs playground equipment', suggestedFile: 'uses_scissors.png' },
  ];
  
  for (const { id, title, suggestedFile } of milestonesToRestore) {
    try {
      const milestone = await storage.getMilestone(id);
      if (milestone && !milestone.s3Key) {
        console.log(`Restoring image for: ${title}`);
        
        // Use an existing milestone image as placeholder
        const placeholderPath = path.join(process.cwd(), 'public', 'milestone-images', suggestedFile);
        
        try {
          await fs.access(placeholderPath);
          const fileBuffer = await fs.readFile(placeholderPath);
          
          // Upload placeholder to S3
          const s3Result = await s3Service.uploadImage({
            tenantId: milestone.tenantId,
            type: 'milestone',
            originalName: `placeholder_${suggestedFile}`,
            id: milestone.id,
            buffer: fileBuffer,
          });
          
          console.log(`  Uploaded placeholder to S3: ${s3Result.key}`);
          
          // Generate signed URL
          const signedUrl = await s3Service.getSignedUrl({
            key: s3Result.key,
            operation: 'get',
            expiresIn: 3600,
          });
          
          // Update milestone with placeholder
          await storage.updateMilestone(id, {
            imageUrl: signedUrl,
            s3Key: s3Result.key,
          });
          
          console.log(`  ✓ Restored with placeholder image`);
        } catch (error) {
          console.error(`  ✗ Failed to restore: ${error}`);
        }
      }
    } catch (error) {
      console.error(`  ✗ Failed to process milestone ${id}:`, error);
    }
  }
  
  console.log('\nPlaceholder restoration completed!');
  console.log('Note: These are temporary placeholders. Users can upload proper images through the UI.');
  process.exit(0);
}

main().catch(console.error);