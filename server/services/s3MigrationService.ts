import { S3Service } from './s3Service';
import { storage } from '../storage';
import fs from 'fs/promises';
import path from 'path';

export class S3MigrationService {
  private s3Service: S3Service;

  constructor() {
    this.s3Service = new S3Service();
  }

  /**
   * Migrate all milestone images from local storage to S3
   */
  async migrateMilestoneImages(): Promise<{
    total: number;
    migrated: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    console.log('Starting milestone image migration to S3...');
    
    const results = {
      total: 0,
      migrated: 0,
      failed: 0,
      errors: [] as Array<{ id: string; error: string }>
    };

    try {
      // Get all milestones
      const milestones = await storage.getMilestones();
      results.total = milestones.length;
      
      console.log(`Found ${milestones.length} milestones to check`);

      for (const milestone of milestones) {
        // Skip if no image URL or already has S3 key
        if (!milestone.imageUrl || milestone.s3Key) {
          console.log(`Skipping milestone ${milestone.id} - ${milestone.s3Key ? 'already migrated' : 'no image'}`);
          continue;
        }

        // Check if image URL is a local path
        if (!this.isLocalImagePath(milestone.imageUrl)) {
          console.log(`Skipping milestone ${milestone.id} - not a local image path`);
          // Clear the non-local image URL
          await storage.updateMilestone(milestone.id, {
            imageUrl: null,
          });
          console.log(`Cleared non-local image URL for milestone ${milestone.id}`);
          continue;
        }

        try {
          console.log(`Migrating milestone ${milestone.id}: ${milestone.title}`);
          
          // Extract the local file path
          const localPath = this.extractLocalPath(milestone.imageUrl);
          const fullPath = path.join(process.cwd(), 'public', localPath);
          
          // Check if file exists
          try {
            await fs.access(fullPath);
          } catch {
            console.error(`File not found: ${fullPath}`);
            results.errors.push({ 
              id: milestone.id, 
              error: `Local file not found: ${localPath}` 
            });
            results.failed++;
            continue;
          }

          // Read the file
          const fileBuffer = await fs.readFile(fullPath);
          const fileName = path.basename(localPath);
          
          // Upload to S3
          const s3Result = await this.s3Service.uploadImage({
            tenantId: milestone.tenantId,
            type: 'milestone',
            originalName: fileName,
            id: milestone.id,
            buffer: fileBuffer,
          });
          
          console.log(`Uploaded to S3: ${s3Result.key}`);
          
          // Generate signed URL
          const signedUrl = await this.s3Service.getSignedUrl({
            key: s3Result.key,
            operation: 'get',
            expiresIn: 3600,
          });
          
          // Update milestone with S3 info
          await storage.updateMilestone(milestone.id, {
            imageUrl: signedUrl,
            s3Key: s3Result.key,
          });
          
          console.log(`Updated milestone ${milestone.id} with S3 key: ${s3Result.key}`);
          results.migrated++;
          
          // Optional: Delete local file after successful migration
          // await fs.unlink(fullPath);
          // console.log(`Deleted local file: ${fullPath}`);
          
        } catch (error) {
          console.error(`Failed to migrate milestone ${milestone.id}:`, error);
          results.errors.push({ 
            id: milestone.id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          results.failed++;
        }
      }
      
      console.log('Migration completed:', results);
      return results;
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Check if an image URL is a local path
   */
  private isLocalImagePath(url: string): boolean {
    // Check if it's a relative path or starts with /api/milestones/images
    return url.startsWith('/api/milestones/images/') || 
           url.startsWith('/images/') ||
           url.startsWith('/uploads/') ||
           !url.startsWith('http');
  }

  /**
   * Extract the local file path from the URL
   */
  private extractLocalPath(url: string): string {
    // Remove /api/milestones/images/ prefix if present
    if (url.startsWith('/api/milestones/images/')) {
      // Extract just the filename from the path
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return `milestone-images/${filename}`;
    }
    
    // Remove leading slash if present
    if (url.startsWith('/')) {
      return url.substring(1);
    }
    
    return url;
  }

  /**
   * Generate a signed URL for a milestone that already has an S3 key
   */
  async refreshMilestoneSignedUrl(milestoneId: string): Promise<string | null> {
    try {
      const milestone = await storage.getMilestone(milestoneId);
      if (!milestone || !milestone.s3Key) {
        return null;
      }

      const signedUrl = await this.s3Service.getSignedUrl({
        key: milestone.s3Key,
        operation: 'get',
        expiresIn: 3600,
      });

      await storage.updateMilestone(milestoneId, {
        imageUrl: signedUrl,
      });

      return signedUrl;
    } catch (error) {
      console.error(`Failed to refresh signed URL for milestone ${milestoneId}:`, error);
      return null;
    }
  }

  /**
   * Refresh all milestone signed URLs
   */
  async refreshAllMilestoneSignedUrls(): Promise<{
    total: number;
    refreshed: number;
    failed: number;
  }> {
    const results = {
      total: 0,
      refreshed: 0,
      failed: 0,
    };

    try {
      const milestones = await storage.getMilestones();
      results.total = milestones.filter(m => m.s3Key).length;

      for (const milestone of milestones) {
        if (!milestone.s3Key) continue;

        const url = await this.refreshMilestoneSignedUrl(milestone.id);
        if (url) {
          results.refreshed++;
        } else {
          results.failed++;
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to refresh signed URLs:', error);
      throw error;
    }
  }
}