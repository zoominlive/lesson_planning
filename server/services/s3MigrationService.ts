import { db } from "../db";
import { materials, milestones, activities } from "@shared/schema";
import { eq } from "drizzle-orm";
import { s3Service } from "./s3Service";
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";

interface MigrationResult {
  type: string;
  id: string;
  success: boolean;
  oldPath?: string;
  newS3Key?: string;
  error?: string;
}

export class S3MigrationService {
  private results: MigrationResult[] = [];

  /**
   * Migrate all existing images to S3
   */
  async migrateAll(tenantId?: string): Promise<MigrationResult[]> {
    console.log("Starting S3 migration...");
    
    // Migrate milestones
    await this.migrateMilestones(tenantId);
    
    // Migrate materials
    await this.migrateMaterials(tenantId);
    
    // Migrate activities
    await this.migrateActivities(tenantId);
    
    console.log(`Migration complete. Processed ${this.results.length} items.`);
    return this.results;
  }

  /**
   * Migrate milestone images to S3
   */
  private async migrateMilestones(tenantId?: string): Promise<void> {
    console.log("Migrating milestone images...");
    
    const query = tenantId 
      ? db.select().from(milestones).where(eq(milestones.tenantId, tenantId))
      : db.select().from(milestones);
    
    const allMilestones = await query;
    
    for (const milestone of allMilestones) {
      if (milestone.imageUrl && !milestone.s3Key) {
        try {
          const buffer = await this.getImageBuffer(milestone.imageUrl);
          
          if (buffer) {
            const originalName = this.extractFilename(milestone.imageUrl);
            const result = await s3Service.uploadImage({
              tenantId: milestone.tenantId,
              type: 'milestone',
              originalName,
              id: milestone.id,
              buffer,
            });
            
            // Update database with S3 key
            await db.update(milestones)
              .set({ s3Key: result.key })
              .where(eq(milestones.id, milestone.id));
            
            this.results.push({
              type: 'milestone',
              id: milestone.id,
              success: true,
              oldPath: milestone.imageUrl,
              newS3Key: result.key,
            });
            
            console.log(`✓ Migrated milestone ${milestone.id}: ${result.key}`);
          }
        } catch (error) {
          console.error(`Failed to migrate milestone ${milestone.id}:`, error);
          this.results.push({
            type: 'milestone',
            id: milestone.id,
            success: false,
            oldPath: milestone.imageUrl,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  /**
   * Migrate material photos to S3
   */
  private async migrateMaterials(tenantId?: string): Promise<void> {
    console.log("Migrating material photos...");
    
    const query = tenantId 
      ? db.select().from(materials).where(eq(materials.tenantId, tenantId))
      : db.select().from(materials);
    
    const allMaterials = await query;
    
    for (const material of allMaterials) {
      if (material.photoUrl && !material.s3Key) {
        try {
          const buffer = await this.getImageBuffer(material.photoUrl);
          
          if (buffer) {
            const originalName = this.extractFilename(material.photoUrl);
            const result = await s3Service.uploadImage({
              tenantId: material.tenantId,
              type: 'material',
              originalName,
              id: material.id,
              buffer,
            });
            
            // Update database with S3 key
            await db.update(materials)
              .set({ s3Key: result.key })
              .where(eq(materials.id, material.id));
            
            this.results.push({
              type: 'material',
              id: material.id,
              success: true,
              oldPath: material.photoUrl,
              newS3Key: result.key,
            });
            
            console.log(`✓ Migrated material ${material.id}: ${result.key}`);
          }
        } catch (error) {
          console.error(`Failed to migrate material ${material.id}:`, error);
          this.results.push({
            type: 'material',
            id: material.id,
            success: false,
            oldPath: material.photoUrl,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  /**
   * Migrate activity images and videos to S3
   */
  private async migrateActivities(tenantId?: string): Promise<void> {
    console.log("Migrating activity media...");
    
    const query = tenantId 
      ? db.select().from(activities).where(eq(activities.tenantId, tenantId))
      : db.select().from(activities);
    
    const allActivities = await query;
    
    for (const activity of allActivities) {
      // Migrate image
      if (activity.imageUrl && !activity.s3ImageKey) {
        try {
          const buffer = await this.getImageBuffer(activity.imageUrl);
          
          if (buffer) {
            const originalName = this.extractFilename(activity.imageUrl);
            const result = await s3Service.uploadImage({
              tenantId: activity.tenantId,
              type: 'activity',
              originalName,
              id: activity.id,
              buffer,
            });
            
            // Update database with S3 key
            await db.update(activities)
              .set({ s3ImageKey: result.key })
              .where(eq(activities.id, activity.id));
            
            this.results.push({
              type: 'activity-image',
              id: activity.id,
              success: true,
              oldPath: activity.imageUrl,
              newS3Key: result.key,
            });
            
            console.log(`✓ Migrated activity image ${activity.id}: ${result.key}`);
          }
        } catch (error) {
          console.error(`Failed to migrate activity image ${activity.id}:`, error);
          this.results.push({
            type: 'activity-image',
            id: activity.id,
            success: false,
            oldPath: activity.imageUrl,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      
      // Migrate video
      if (activity.videoUrl && !activity.s3VideoKey) {
        try {
          const buffer = await this.getImageBuffer(activity.videoUrl);
          
          if (buffer) {
            const originalName = this.extractFilename(activity.videoUrl);
            const result = await s3Service.uploadImage({
              tenantId: activity.tenantId,
              type: 'activity',
              originalName,
              id: `${activity.id}_video`,
              buffer,
            });
            
            // Update database with S3 key
            await db.update(activities)
              .set({ s3VideoKey: result.key })
              .where(eq(activities.id, activity.id));
            
            this.results.push({
              type: 'activity-video',
              id: activity.id,
              success: true,
              oldPath: activity.videoUrl,
              newS3Key: result.key,
            });
            
            console.log(`✓ Migrated activity video ${activity.id}: ${result.key}`);
          }
        } catch (error) {
          console.error(`Failed to migrate activity video ${activity.id}:`, error);
          this.results.push({
            type: 'activity-video',
            id: activity.id,
            success: false,
            oldPath: activity.videoUrl,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  /**
   * Get image buffer from URL or local path
   */
  private async getImageBuffer(urlOrPath: string): Promise<Buffer | null> {
    try {
      // Check if it's a local file path
      if (urlOrPath.startsWith('/api/')) {
        // Extract filename from API path
        const filename = this.extractFilename(urlOrPath);
        
        // Try different local directories
        const possiblePaths = [
          path.join(process.cwd(), 'public', 'milestone-images', filename),
          path.join(process.cwd(), 'public', 'materials', 'images', filename),
          path.join(process.cwd(), 'public', 'activity-images', 'images', filename),
          path.join(process.cwd(), 'public', 'activity-images', 'videos', filename),
          path.join(process.cwd(), 'public', 'activity-images', 'instructions', filename),
        ];
        
        for (const filePath of possiblePaths) {
          try {
            const buffer = await fs.readFile(filePath);
            return buffer;
          } catch (error) {
            // File not found in this path, try next
            continue;
          }
        }
        
        // If not found locally, try fetching from the server
        const fullUrl = `http://localhost:5000${urlOrPath}`;
        const response = await fetch(fullUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      }
      
      // If it's a full URL, fetch it
      if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
        const response = await fetch(urlOrPath);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      }
      
      // Try as a relative path
      const filePath = path.join(process.cwd(), urlOrPath);
      try {
        const buffer = await fs.readFile(filePath);
        return buffer;
      } catch (error) {
        // File not found
      }
      
      console.warn(`Could not retrieve image from: ${urlOrPath}`);
      return null;
    } catch (error) {
      console.error(`Error getting image buffer from ${urlOrPath}:`, error);
      return null;
    }
  }

  /**
   * Extract filename from URL or path
   */
  private extractFilename(urlOrPath: string): string {
    const parts = urlOrPath.split('/');
    const filename = parts[parts.length - 1];
    return filename || 'unknown.jpg';
  }

  /**
   * Get migration report
   */
  getReport(): {
    total: number;
    successful: number;
    failed: number;
    details: MigrationResult[];
  } {
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    return {
      total: this.results.length,
      successful,
      failed,
      details: this.results,
    };
  }
}

// Export singleton instance
export const s3MigrationService = new S3MigrationService();