#!/usr/bin/env tsx
/**
 * Fix activity images that were incorrectly placed in /milestones/ folder
 * Move them to /activities/ folder and update database records
 */

import { db } from '../server/db';
import { activities } from '../shared/schema';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';
import { S3Service } from '../server/services/s3Service';
import * as dotenv from 'dotenv';
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

const s3Service = new S3Service();

// Access the private S3 client for copying operations
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ca-central-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET!,
  },
});

const bucketName = 'duploservices-dev-activities-748544146453';

async function fixActivityPaths() {
  console.log('Fixing activity S3 paths...\n');
  
  try {
    // Get all activities with S3 keys in the wrong location
    const activitiesToFix = await db
      .select({
        id: activities.id,
        title: activities.title,
        imageUrl: activities.imageUrl,
        s3ImageKey: activities.s3ImageKey,
      })
      .from(activities)
      .where(
        and(
          isNotNull(activities.s3ImageKey),
          isNull(activities.deletedAt)
        )
      );
    
    console.log(`Found ${activitiesToFix.length} activities to fix\n`);
    
    let fixed = 0;
    let failed = 0;
    
    for (const activity of activitiesToFix) {
      if (activity.s3ImageKey && activity.s3ImageKey.includes('/milestones/')) {
        console.log(`Processing: ${activity.title} (${activity.id})`);
        console.log(`  Old key: ${activity.s3ImageKey}`);
        
        // Create new key with /activities/ instead of /milestones/
        const newS3Key = activity.s3ImageKey.replace('/milestones/', '/activities/');
        console.log(`  New key: ${newS3Key}`);
        
        try {
          // Copy object to new location
          await s3Client.send(new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${activity.s3ImageKey}`,
            Key: newS3Key,
          }));
          console.log(`  ✓ Copied to new location`);
          
          // Delete old object
          await s3Client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: activity.s3ImageKey,
          }));
          console.log(`  ✓ Deleted old location`);
          
          // Update database with new S3 key and URL
          const newImageUrl = `/api/activities/s3/${newS3Key.split('/').pop()}`;
          await db
            .update(activities)
            .set({ 
              s3ImageKey: newS3Key,
              imageUrl: newImageUrl
            })
            .where(eq(activities.id, activity.id));
          
          console.log(`  ✓ Updated database`);
          fixed++;
        } catch (error) {
          console.error(`  ✗ Failed to move: ${error}`);
          failed++;
        }
        
        console.log('');
      }
    }
    
    console.log('\n=== Fix Summary ===');
    console.log(`✓ Fixed: ${fixed} activities`);
    console.log(`✗ Failed: ${failed} activities`);
    
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
}

// Run fix
fixActivityPaths()
  .then(() => {
    console.log('\nActivity path fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Activity path fix failed:', error);
    process.exit(1);
  });