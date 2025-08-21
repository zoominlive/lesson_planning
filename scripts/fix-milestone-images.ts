#!/usr/bin/env tsx
/**
 * Script to fix milestone images by uploading the correct AI-generated images
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
  console.log('Fixing milestone images with correct AI-generated images...\n');
  
  const s3Service = new S3Service();
  
  // Map milestones to their correct AI-generated images
  const milestoneImageMap = [
    { 
      id: '4ead1815-cbb3-480f-a03d-4ee22857c5df', 
      title: 'Shares toys with peers',
      imagePath: 'attached_assets/generated_images/Children_sharing_toys_cooperatively_16e7d139.png'
    },
    { 
      id: '16b4900d-14a8-493b-8ecc-fb7d5e5144aa', 
      title: 'Comforts others when upset',
      imagePath: 'attached_assets/generated_images/Child_comforting_sad_friend_f0ba417c.png'
    },
    { 
      id: '72236a10-da6a-4b3f-8b90-37ae205c1fcc', 
      title: 'Completes simple puzzles',
      imagePath: 'attached_assets/generated_images/Children_solving_block_puzzles_42948e6c.png'
    },
    { 
      id: '92b31b7d-83f4-4e3e-ae78-0d984c8cb283', 
      title: 'Climbs playground equipment',
      imagePath: 'attached_assets/generated_images/Children_climbing_playground_equipment_ec0ff208.png'
    },
  ];
  
  for (const { id, title, imagePath } of milestoneImageMap) {
    try {
      const milestone = await storage.getMilestone(id);
      if (milestone) {
        console.log(`Processing: ${title}`);
        
        // Read the correct image file
        const fullPath = path.join(process.cwd(), imagePath);
        const fileBuffer = await fs.readFile(fullPath);
        const fileName = path.basename(imagePath);
        
        // Upload to S3
        const s3Result = await s3Service.uploadImage({
          tenantId: milestone.tenantId,
          type: 'milestone',
          originalName: fileName,
          id: milestone.id,
          buffer: fileBuffer,
        });
        
        console.log(`  Uploaded correct image to S3: ${s3Result.key}`);
        
        // Generate signed URL
        const signedUrl = await s3Service.getSignedUrl({
          key: s3Result.key,
          operation: 'get',
          expiresIn: 3600,
        });
        
        // Update milestone with correct image
        await storage.updateMilestone(id, {
          imageUrl: signedUrl,
          s3Key: s3Result.key,
        });
        
        console.log(`  ✓ Fixed with correct AI-generated image`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to fix milestone ${id}:`, error);
    }
  }
  
  console.log('\nAll milestone images have been fixed with their correct AI-generated images!');
  process.exit(0);
}

main().catch(console.error);