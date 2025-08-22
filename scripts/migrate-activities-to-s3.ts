#!/usr/bin/env tsx
/**
 * Migrates activity images from local storage to AWS S3
 * Maintains exact activity-image associations
 */

import { db } from '../server/db';
import { activities } from '../shared/schema';
import { eq, and, isNull, isNotNull, or } from 'drizzle-orm';
import { S3Service } from '../server/services/s3Service';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const s3Service = new S3Service();

interface ActivityToMigrate {
  id: string;
  title: string;
  imageUrl: string | null;
  videoUrl: string | null;
  s3ImageKey: string | null;
  s3VideoKey: string | null;
  tenantId: string;
}

async function extractFilenameFromUrl(url: string): Promise<string | null> {
  if (!url) return null;
  
  // Extract filename from URL path
  const parts = url.split('/');
  return parts[parts.length - 1];
}

async function findLocalFile(filename: string, type: 'image' | 'video'): Promise<string | null> {
  const basePath = path.join(process.cwd(), 'public', 'activity-images', type === 'image' ? 'images' : 'videos');
  
  // Direct path
  const directPath = path.join(basePath, filename);
  if (fs.existsSync(directPath)) {
    return directPath;
  }
  
  // Check if file exists without path (just filename)
  const filenameOnly = path.basename(filename);
  const filenamePath = path.join(basePath, filenameOnly);
  if (fs.existsSync(filenamePath)) {
    return filenamePath;
  }
  
  return null;
}

async function uploadActivityImageToS3(
  activity: ActivityToMigrate,
  localPath: string,
  type: 'image' | 'video'
): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);
  const filename = path.basename(localPath);
  
  console.log(`  Uploading ${type} to S3...`);
  
  const result = await s3Service.uploadImage({
    tenantId: activity.tenantId,
    type: 'activities',
    originalName: filename,
    buffer: fileBuffer,
    id: activity.id,
    contentType: type === 'image' 
      ? `image/${path.extname(filename).slice(1).toLowerCase()}` 
      : `video/${path.extname(filename).slice(1).toLowerCase()}`
  });
  
  console.log(`  Uploaded to S3: ${result.key}`);
  
  return result.key;
}

async function migrateActivities() {
  console.log('Starting activity migration to S3...\n');
  
  try {
    // Get all activities with images but no S3 key
    const activitiesToMigrate = await db
      .select({
        id: activities.id,
        title: activities.title,
        imageUrl: activities.imageUrl,
        videoUrl: activities.videoUrl,
        s3ImageKey: activities.s3ImageKey,
        s3VideoKey: activities.s3VideoKey,
        tenantId: activities.tenantId,
      })
      .from(activities)
      .where(
        and(
          isNull(activities.deletedAt),
          or(
            and(isNotNull(activities.imageUrl), isNull(activities.s3ImageKey)),
            and(isNotNull(activities.videoUrl), isNull(activities.s3VideoKey))
          )
        )
      );
    
    console.log(`Found ${activitiesToMigrate.length} activities to migrate\n`);
    
    let migratedImages = 0;
    let migratedVideos = 0;
    let failedImages = 0;
    let failedVideos = 0;
    
    for (const activity of activitiesToMigrate) {
      console.log(`Processing activity: ${activity.title} (${activity.id})`);
      
      // Migrate image if needed
      if (activity.imageUrl && !activity.s3ImageKey) {
        const filename = await extractFilenameFromUrl(activity.imageUrl);
        if (filename) {
          const localPath = await findLocalFile(filename, 'image');
          
          if (localPath) {
            try {
              const s3Key = await uploadActivityImageToS3(activity, localPath, 'image');
              
              // Update database with S3 key
              await db
                .update(activities)
                .set({ s3ImageKey: s3Key })
                .where(eq(activities.id, activity.id));
              
              console.log(`  ✓ Image migrated successfully`);
              migratedImages++;
            } catch (error) {
              console.error(`  ✗ Failed to migrate image: ${error}`);
              failedImages++;
            }
          } else {
            console.log(`  ⚠ Image file not found locally: ${filename}`);
            failedImages++;
          }
        }
      }
      
      // Migrate video if needed
      if (activity.videoUrl && !activity.s3VideoKey) {
        const filename = await extractFilenameFromUrl(activity.videoUrl);
        if (filename) {
          const localPath = await findLocalFile(filename, 'video');
          
          if (localPath) {
            try {
              const s3Key = await uploadActivityImageToS3(activity, localPath, 'video');
              
              // Update database with S3 key
              await db
                .update(activities)
                .set({ s3VideoKey: s3Key })
                .where(eq(activities.id, activity.id));
              
              console.log(`  ✓ Video migrated successfully`);
              migratedVideos++;
            } catch (error) {
              console.error(`  ✗ Failed to migrate video: ${error}`);
              failedVideos++;
            }
          } else {
            console.log(`  ⚠ Video file not found locally: ${filename}`);
            failedVideos++;
          }
        }
      }
      
      console.log('');
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`✓ Images migrated: ${migratedImages}`);
    console.log(`✓ Videos migrated: ${migratedVideos}`);
    console.log(`✗ Images failed: ${failedImages}`);
    console.log(`✗ Videos failed: ${failedVideos}`);
    console.log(`Total activities processed: ${activitiesToMigrate.length}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateActivities()
  .then(() => {
    console.log('\nActivity migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Activity migration failed:', error);
    process.exit(1);
  });