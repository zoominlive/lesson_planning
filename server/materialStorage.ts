import { Client } from '@replit/object-storage';
import type { Response } from 'express';
import { randomUUID } from 'crypto';

// Specific bucket configuration for materials
const BUCKET_NAME = 'LessonPlanningImages';
const BUCKET_ID = 'replit-objstore-d58a7169-7456-4d57-a585-238159cd8bfa';
const MATERIALS_FOLDER = 'materials';

// Initialize the Replit Object Storage client
const storageClient = new Client();

export class MaterialStorageService {
  /**
   * Upload a material image to object storage
   * @param imageBuffer Buffer containing the image data
   * @param filename Original filename
   * @returns The storage path for the image
   */
  async uploadMaterialImage(imageBuffer: Buffer, filename: string): Promise<string> {
    const extension = filename.split('.').pop() || 'png';
    const uniqueId = randomUUID();
    const objectPath = `${MATERIALS_FOLDER}/${uniqueId}.${extension}`;
    
    try {
      const result = await storageClient.uploadFromBytes(objectPath, imageBuffer);
      if (result.error) {
        throw new Error(`Failed to upload image: ${result.error}`);
      }
      
      // Return the path that will be used to retrieve the image (public, no auth)
      return `/materials/images/${uniqueId}.${extension}`;
    } catch (error) {
      console.error('Error uploading material image:', error);
      throw error;
    }
  }

  /**
   * Get a presigned URL for direct upload from the client
   * @returns Presigned URL and object key
   */
  async getUploadUrl(): Promise<{ url: string; key: string }> {
    const uniqueId = randomUUID();
    const objectKey = `${MATERIALS_FOLDER}/${uniqueId}`;
    
    // For Replit Object Storage, we'll return a structured response
    // that the client can use for direct upload
    return {
      url: `/api/materials/upload-direct`,
      key: objectKey
    };
  }

  /**
   * Download a material image from object storage
   * @param imagePath The path to the image (e.g., "abc-123.png")
   * @param res Express response object
   */
  async downloadMaterialImage(imagePath: string, res: Response): Promise<void> {
    try {
      const objectPath = `${MATERIALS_FOLDER}/${imagePath}`;
      const result = await storageClient.downloadAsBytes(objectPath);
      
      if (result.error) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }

      const buffer = result.value ? result.value[0] : null;
      if (!buffer) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }
      
      // Determine content type from file extension
      const extension = imagePath.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (extension === 'png') contentType = 'image/png';
      else if (extension === 'jpg' || extension === 'jpeg') contentType = 'image/jpeg';
      else if (extension === 'gif') contentType = 'image/gif';
      else if (extension === 'webp') contentType = 'image/webp';
      
      // Set appropriate headers
      res.set({
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });

      // Send the image buffer
      res.send(buffer);
    } catch (error) {
      console.error('Error downloading material image:', error);
      res.status(500).json({ error: 'Failed to retrieve image' });
    }
  }

  /**
   * Delete a material image from object storage
   * @param imagePath The path to the image
   */
  async deleteMaterialImage(imagePath: string): Promise<boolean> {
    try {
      // Extract just the filename from the full path
      const filename = imagePath.split('/').pop();
      if (!filename) return false;
      
      const objectPath = `${MATERIALS_FOLDER}/${filename}`;
      const result = await storageClient.delete(objectPath);
      
      return !result.error;
    } catch (error) {
      console.error('Error deleting material image:', error);
      return false;
    }
  }

  /**
   * Copy an existing file to object storage (for migration)
   * @param sourceBuffer Buffer containing the file data
   * @param filename The filename to use
   * @returns The storage path for the image
   */
  async migrateImage(sourceBuffer: Buffer, filename: string): Promise<string> {
    const objectPath = `${MATERIALS_FOLDER}/${filename}`;
    
    try {
      const result = await storageClient.uploadFromBytes(objectPath, sourceBuffer);
      if (result.error) {
        throw new Error(`Failed to migrate image ${filename}: ${result.error}`);
      }
      
      // Return the path that will be used to retrieve the image (public, no auth)
      return `/materials/images/${filename}`;
    } catch (error) {
      console.error(`Error migrating image ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Handle direct upload from client
   * @param fileBuffer The uploaded file buffer
   * @param key The object key
   * @returns The final storage path
   */
  async handleDirectUpload(fileBuffer: Buffer, key: string): Promise<string> {
    try {
      const result = await storageClient.uploadFromBytes(key, fileBuffer);
      if (result.error) {
        throw new Error(`Failed to upload: ${result.error}`);
      }
      
      // Extract filename from key and return the retrieval path (public, no auth)
      const filename = key.replace(`${MATERIALS_FOLDER}/`, '');
      return `/materials/images/${filename}`;
    } catch (error) {
      console.error('Error in direct upload:', error);
      throw error;
    }
  }
}

export const materialStorage = new MaterialStorageService();