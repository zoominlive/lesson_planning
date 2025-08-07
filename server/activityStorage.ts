import { Client } from "@replit/object-storage";
import path from "path";
import crypto from "crypto";

export class ActivityStorageService {
  private client: Client;
  
  constructor() {
    this.client = new Client();
  }

  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext).replace(/[^a-z0-9]/gi, '_');
    return `${baseName}_${timestamp}_${randomString}${ext}`;
  }

  async uploadActivityImage(buffer: Buffer, originalName: string): Promise<string> {
    const fileName = this.generateFileName(originalName);
    const objectPath = `activities/images/${fileName}`;
    
    const result = await this.client.uploadFromBytes(objectPath, buffer);
    
    if (result.error) {
      throw new Error(`Failed to upload activity image: ${result.error}`);
    }

    return `/api/activities/images/${fileName}`;
  }

  async uploadActivityVideo(buffer: Buffer, originalName: string): Promise<string> {
    const fileName = this.generateFileName(originalName);
    const objectPath = `activities/videos/${fileName}`;
    
    const result = await this.client.uploadFromBytes(objectPath, buffer);
    
    if (result.error) {
      throw new Error(`Failed to upload activity video: ${result.error}`);
    }

    return `/api/activities/videos/${fileName}`;
  }

  async uploadInstructionImage(buffer: Buffer, originalName: string): Promise<string> {
    const fileName = this.generateFileName(originalName);
    const objectPath = `activities/instructions/${fileName}`;
    
    const result = await this.client.uploadFromBytes(objectPath, buffer);
    
    if (result.error) {
      throw new Error(`Failed to upload instruction image: ${result.error}`);
    }

    return `/api/activities/instructions/${fileName}`;
  }

  async downloadActivityImage(fileName: string): Promise<Buffer | null> {
    const objectPath = `activities/images/${fileName}`;
    const result = await this.client.downloadAsBytes(objectPath);
    
    if (result.error) {
      console.error('Failed to download activity image:', result.error);
      return null;
    }

    return result.value;
  }

  async downloadActivityVideo(fileName: string): Promise<Buffer | null> {
    const objectPath = `activities/videos/${fileName}`;
    const result = await this.client.downloadAsBytes(objectPath);
    
    if (result.error) {
      console.error('Failed to download activity video:', result.error);
      return null;
    }

    return result.value;
  }

  async downloadInstructionImage(fileName: string): Promise<Buffer | null> {
    const objectPath = `activities/instructions/${fileName}`;
    const result = await this.client.downloadAsBytes(objectPath);
    
    if (result.error) {
      console.error('Failed to download instruction image:', result.error);
      return null;
    }

    return result.value;
  }

  async deleteActivityImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.startsWith('/api/activities/images/')) {
      return;
    }

    const fileName = imageUrl.replace('/api/activities/images/', '');
    const objectPath = `activities/images/${fileName}`;
    
    const result = await this.client.delete(objectPath);
    
    if (result.error) {
      console.error('Failed to delete activity image:', result.error);
    }
  }

  async deleteActivityVideo(videoUrl: string): Promise<void> {
    if (!videoUrl || !videoUrl.startsWith('/api/activities/videos/')) {
      return;
    }

    const fileName = videoUrl.replace('/api/activities/videos/', '');
    const objectPath = `activities/videos/${fileName}`;
    
    const result = await this.client.delete(objectPath);
    
    if (result.error) {
      console.error('Failed to delete activity video:', result.error);
    }
  }

  async deleteInstructionImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.startsWith('/api/activities/instructions/')) {
      return;
    }

    const fileName = imageUrl.replace('/api/activities/instructions/', '');
    const objectPath = `activities/instructions/${fileName}`;
    
    const result = await this.client.delete(objectPath);
    
    if (result.error) {
      console.error('Failed to delete instruction image:', result.error);
    }
  }
}

export const activityStorage = new ActivityStorageService();