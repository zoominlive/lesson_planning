import { Client } from "@replit/object-storage";
import path from "path";
import crypto from "crypto";
import type { Response } from "express";

export class MilestoneStorageService {
  private client: Client;
  
  constructor() {
    this.client = new Client();
  }

  private generateFileName(tenantId: string, originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext).replace(/[^a-z0-9]/gi, '_');
    return `${tenantId}/milestones/${baseName}_${timestamp}_${randomString}${ext}`;
  }

  async uploadMilestoneImage(tenantId: string, buffer: Buffer, originalName: string): Promise<string> {
    const fileName = this.generateFileName(tenantId, originalName);
    
    const result = await this.client.uploadFromBytes(fileName, buffer);
    
    if (result.error) {
      throw new Error(`Failed to upload milestone image: ${result.error}`);
    }

    return `/api/milestones/images/${fileName}`;
  }

  async downloadMilestoneImage(filePath: string, res: Response): Promise<void> {
    try {
      const result = await this.client.downloadAsBytes(filePath);
      
      if (result.error) {
        console.error('Failed to download milestone image:', result.error);
        res.status(404).json({ error: 'Image not found' });
        return;
      }

      // Determine content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';

      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      });
      res.send(result.value);
    } catch (error) {
      console.error('Error serving milestone image:', error);
      res.status(500).json({ error: 'Failed to retrieve image' });
    }
  }

  async deleteMilestoneImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.startsWith('/api/milestones/images/')) {
      return;
    }

    const filePath = imageUrl.replace('/api/milestones/images/', '');
    
    const result = await this.client.delete(filePath);
    
    if (result.error) {
      console.error('Failed to delete milestone image:', result.error);
    }
  }
}

export const milestoneStorage = new MilestoneStorageService();