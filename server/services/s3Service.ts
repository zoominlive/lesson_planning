import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  GetObjectCommandInput,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { Response } from 'express';

export type ImageType = 'activity' | 'material' | 'milestone';

interface S3Config {
  bucketUri: string;
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}

interface UploadOptions {
  tenantId: string;
  type: ImageType;
  originalName: string;
  id?: string; // Entity ID (activity ID, material ID, etc.)
  buffer: Buffer;
  contentType?: string;
}

interface SignedUrlOptions {
  key: string;
  expiresIn?: number; // Seconds, default 3600 (1 hour)
  operation?: 'get' | 'put';
}

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private bucketUri: string;

  constructor() {
    const config = this.loadConfig();
    
    // Parse bucket name from URI
    // Expected format: https://bucket-name.s3.region.amazonaws.com or s3://bucket-name
    this.bucketUri = config.bucketUri;
    this.bucketName = this.parseBucketName(config.bucketUri);
    
    // Extract region from URI if not provided
    const region = config.region || this.parseRegion(config.bucketUri) || 'ca-central-1';
    
    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    
    console.log(`S3 Service initialized with bucket: ${this.bucketName}, region: ${region}`);
  }

  private loadConfig(): S3Config {
    const bucketUri = process.env.S3_DEV_BUCKET_URI;
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET;

    if (!bucketUri || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing required S3 configuration. Please ensure S3_DEV_BUCKET_URI, S3_ACCESS_KEY, and S3_SECRET are set.');
    }

    return {
      bucketUri,
      accessKeyId,
      secretAccessKey,
    };
  }

  private parseBucketName(uri: string): string {
    // Handle s3:// format
    if (uri.startsWith('s3://')) {
      return uri.replace('s3://', '').split('/')[0];
    }
    
    // Handle https:// format
    if (uri.startsWith('https://')) {
      const match = uri.match(/https:\/\/([^.]+)\.s3/);
      if (match) {
        return match[1];
      }
    }
    
    // Assume it's just the bucket name
    return uri.split('/')[0];
  }

  private parseRegion(uri: string): string | null {
    // Try to extract region from URL like https://bucket.s3.us-west-2.amazonaws.com
    const match = uri.match(/\.s3\.([^.]+)\.amazonaws\.com/);
    return match ? match[1] : null;
  }

  /**
   * Generate a unique filename with tenant and type information
   */
  private generateFileName(options: {
    tenantId: string;
    type: ImageType;
    originalName: string;
    id?: string;
  }): string {
    const timestamp = Date.now();
    const extension = options.originalName.split('.').pop() || 'jpg';
    const sanitizedName = options.originalName
      .replace(/\.[^.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9]/g, '_') // Replace special chars
      .toLowerCase()
      .substring(0, 50); // Limit length
    
    // Format: tenantId_type_id_timestamp_name.ext
    const parts = [
      options.tenantId,
      options.type,
      options.id || 'noid',
      timestamp,
      sanitizedName,
    ].filter(Boolean);
    
    return `${parts.join('_')}.${extension}`;
  }

  /**
   * Generate S3 key (path) for a file
   */
  private generateS3Key(tenantId: string, type: ImageType, fileName: string): string {
    // Format: lesson-planning/<tenant_id>/<type>/<filename>
    // pluralize the type for folder name
    const folder = type === 'activity' ? 'activities' : 
                   type === 'material' ? 'materials' : 'milestones';
    return `lesson-planning/${tenantId}/${folder}/${fileName}`;
  }

  /**
   * Upload an image to S3
   */
  async uploadImage(options: UploadOptions): Promise<{
    key: string;
    fileName: string;
    url: string;
  }> {
    const fileName = this.generateFileName({
      tenantId: options.tenantId,
      type: options.type,
      originalName: options.originalName,
      id: options.id,
    });
    
    const key = this.generateS3Key(options.tenantId, options.type, fileName);
    
    // Determine content type
    const contentType = options.contentType || this.getContentType(options.originalName);
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: options.buffer,
      ContentType: contentType,
      // Add metadata for easier management
      Metadata: {
        tenantId: options.tenantId,
        type: options.type,
        originalName: options.originalName,
        uploadedAt: new Date().toISOString(),
        ...(options.id && { entityId: options.id }),
      },
    });

    try {
      await this.s3Client.send(command);
      
      return {
        key,
        fileName,
        url: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
      };
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error(`Failed to upload image to S3: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a signed URL for accessing an S3 object
   */
  async getSignedUrl(options: SignedUrlOptions): Promise<string> {
    const command = options.operation === 'put' 
      ? new PutObjectCommand({
          Bucket: this.bucketName,
          Key: options.key,
        })
      : new GetObjectCommand({
          Bucket: this.bucketName,
          Key: options.key,
        });

    try {
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: options.expiresIn || 3600, // Default 1 hour
      });
      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Download an image from S3 and stream to response
   */
  async downloadImage(key: string, res: Response): Promise<void> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.s3Client.send(command);
      
      // Set response headers
      if (response.ContentType) {
        res.set('Content-Type', response.ContentType);
      }
      if (response.ContentLength) {
        res.set('Content-Length', response.ContentLength.toString());
      }
      res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      // Stream the body to response
      if (response.Body instanceof Readable) {
        response.Body.pipe(res);
      } else {
        throw new Error('Unexpected response body type');
      }
    } catch (error: any) {
      console.error('Error downloading from S3:', error);
      if (error?.name === 'NoSuchKey') {
        res.status(404).json({ error: 'Image not found' });
      } else {
        res.status(500).json({ error: 'Failed to retrieve image' });
      }
    }
  }

  /**
   * Check if an object exists in S3
   */
  async objectExists(key: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * List objects for a tenant and type
   */
  async listObjects(tenantId: string, type?: ImageType): Promise<string[]> {
    const prefix = type 
      ? this.generateS3Key(tenantId, type, '').replace(/\/$/, '') + '/'
      : `${tenantId}/`;
    
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
      MaxKeys: 1000,
    });

    try {
      const response = await this.s3Client.send(command);
      return response.Contents?.map(obj => obj.Key!) || [];
    } catch (error) {
      console.error('Error listing S3 objects:', error);
      throw new Error(`Failed to list objects: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Copy an object within S3 (useful for migration)
   */
  async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${sourceKey}`,
      Key: destinationKey,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error copying S3 object:', error);
      throw new Error(`Failed to copy object: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete an object from S3
   */
  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting from S3:', error);
      throw new Error(`Failed to delete object: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get content type from filename
   */
  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'pdf': 'application/pdf',
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Parse an S3 key to extract tenant ID and type
   */
  parseS3Key(key: string): { tenantId: string; type: ImageType; fileName: string } | null {
    const parts = key.split('/');
    if (parts.length !== 3) return null;
    
    const [tenantId, folder, fileName] = parts;
    const type = folder === 'activities' ? 'activity' :
                 folder === 'materials' ? 'material' :
                 folder === 'milestones' ? 'milestone' : null;
    
    if (!type) return null;
    
    return { tenantId, type, fileName };
  }
}

// Export singleton instance
export const s3Service = new S3Service();