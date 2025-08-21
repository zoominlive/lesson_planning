import { s3Service } from "./s3Service";
import { db } from "../db";
import { materials, milestones, activities } from "@shared/schema";
import { eq } from "drizzle-orm";

interface SignedUrlResponse {
  url: string;
  expiresIn: number;
  s3Key?: string;
}

export class SignedUrlService {
  private readonly DEFAULT_EXPIRY = 3600; // 1 hour in seconds

  /**
   * Get signed URL for a milestone image
   */
  async getMilestoneImageUrl(milestoneId: string): Promise<SignedUrlResponse | null> {
    try {
      const [milestone] = await db
        .select()
        .from(milestones)
        .where(eq(milestones.id, milestoneId));

      if (!milestone) {
        return null;
      }

      // Prefer S3 key if available
      if (milestone.s3Key) {
        const url = await s3Service.getSignedUrl({
          key: milestone.s3Key,
          expiresIn: this.DEFAULT_EXPIRY,
          operation: 'get',
        });

        return {
          url,
          expiresIn: this.DEFAULT_EXPIRY,
          s3Key: milestone.s3Key,
        };
      }

      // Fallback to existing URL if no S3 key yet (during migration)
      if (milestone.imageUrl) {
        return {
          url: milestone.imageUrl,
          expiresIn: this.DEFAULT_EXPIRY,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting milestone image URL:', error);
      throw error;
    }
  }

  /**
   * Get signed URL for a material photo
   */
  async getMaterialPhotoUrl(materialId: string): Promise<SignedUrlResponse | null> {
    try {
      const [material] = await db
        .select()
        .from(materials)
        .where(eq(materials.id, materialId));

      if (!material) {
        return null;
      }

      // Prefer S3 key if available
      if (material.s3Key) {
        const url = await s3Service.getSignedUrl({
          key: material.s3Key,
          expiresIn: this.DEFAULT_EXPIRY,
          operation: 'get',
        });

        return {
          url,
          expiresIn: this.DEFAULT_EXPIRY,
          s3Key: material.s3Key,
        };
      }

      // Fallback to existing URL if no S3 key yet (during migration)
      if (material.photoUrl) {
        return {
          url: material.photoUrl,
          expiresIn: this.DEFAULT_EXPIRY,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting material photo URL:', error);
      throw error;
    }
  }

  /**
   * Get signed URL for an activity image
   */
  async getActivityImageUrl(activityId: string): Promise<SignedUrlResponse | null> {
    try {
      const [activity] = await db
        .select()
        .from(activities)
        .where(eq(activities.id, activityId));

      if (!activity) {
        return null;
      }

      // Prefer S3 key if available
      if (activity.s3ImageKey) {
        const url = await s3Service.getSignedUrl({
          key: activity.s3ImageKey,
          expiresIn: this.DEFAULT_EXPIRY,
          operation: 'get',
        });

        return {
          url,
          expiresIn: this.DEFAULT_EXPIRY,
          s3Key: activity.s3ImageKey,
        };
      }

      // Fallback to existing URL if no S3 key yet (during migration)
      if (activity.imageUrl) {
        return {
          url: activity.imageUrl,
          expiresIn: this.DEFAULT_EXPIRY,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting activity image URL:', error);
      throw error;
    }
  }

  /**
   * Get signed URL for an activity video
   */
  async getActivityVideoUrl(activityId: string): Promise<SignedUrlResponse | null> {
    try {
      const [activity] = await db
        .select()
        .from(activities)
        .where(eq(activities.id, activityId));

      if (!activity) {
        return null;
      }

      // Prefer S3 key if available
      if (activity.s3VideoKey) {
        const url = await s3Service.getSignedUrl({
          key: activity.s3VideoKey,
          expiresIn: this.DEFAULT_EXPIRY,
          operation: 'get',
        });

        return {
          url,
          expiresIn: this.DEFAULT_EXPIRY,
          s3Key: activity.s3VideoKey,
        };
      }

      // Fallback to existing URL if no S3 key yet (during migration)
      if (activity.videoUrl) {
        return {
          url: activity.videoUrl,
          expiresIn: this.DEFAULT_EXPIRY,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting activity video URL:', error);
      throw error;
    }
  }

  /**
   * Get signed URL for upload
   */
  async getUploadUrl(
    tenantId: string,
    type: 'activity' | 'material' | 'milestone',
    filename: string
  ): Promise<SignedUrlResponse> {
    try {
      // Generate a unique filename with tenant and type information
      const timestamp = Date.now();
      const extension = filename.split('.').pop() || 'jpg';
      const sanitizedName = filename
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase()
        .substring(0, 50);
      
      const uniqueFilename = `${tenantId}_${type}_${timestamp}_${sanitizedName}.${extension}`;
      const folder = type === 'activity' ? 'activities' : 
                     type === 'material' ? 'materials' : 'milestones';
      const key = `${tenantId}/${folder}/${uniqueFilename}`;

      const url = await s3Service.getSignedUrl({
        key,
        expiresIn: 900, // 15 minutes for upload
        operation: 'put',
      });

      return {
        url,
        expiresIn: 900,
        s3Key: key,
      };
    } catch (error) {
      console.error('Error getting upload URL:', error);
      throw error;
    }
  }

  /**
   * Batch get signed URLs for multiple items
   */
  async getBatchSignedUrls(items: {
    type: 'milestone' | 'material' | 'activity';
    id: string;
    mediaType?: 'image' | 'video';
  }[]): Promise<Map<string, SignedUrlResponse | null>> {
    const results = new Map<string, SignedUrlResponse | null>();

    await Promise.all(
      items.map(async (item) => {
        try {
          let result: SignedUrlResponse | null = null;
          
          switch (item.type) {
            case 'milestone':
              result = await this.getMilestoneImageUrl(item.id);
              break;
            case 'material':
              result = await this.getMaterialPhotoUrl(item.id);
              break;
            case 'activity':
              if (item.mediaType === 'video') {
                result = await this.getActivityVideoUrl(item.id);
              } else {
                result = await this.getActivityImageUrl(item.id);
              }
              break;
          }
          
          results.set(`${item.type}-${item.id}-${item.mediaType || 'image'}`, result);
        } catch (error) {
          console.error(`Error getting signed URL for ${item.type} ${item.id}:`, error);
          results.set(`${item.type}-${item.id}-${item.mediaType || 'image'}`, null);
        }
      })
    );

    return results;
  }
}

// Export singleton instance
export const signedUrlService = new SignedUrlService();