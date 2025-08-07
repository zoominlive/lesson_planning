import path from "path";
import crypto from "crypto";
import fs from "fs";
import { promises as fsPromises } from "fs";

export class ActivityStorageService {
  private localStoragePath: string;
  
  constructor() {
    // Use local storage directory
    this.localStoragePath = path.join(process.cwd(), 'public', 'activity-images');
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    const dirs = [
      path.join(this.localStoragePath, 'images'),
      path.join(this.localStoragePath, 'videos'),
      path.join(this.localStoragePath, 'instructions')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
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
    const filePath = path.join(this.localStoragePath, 'images', fileName);
    
    try {
      await fsPromises.writeFile(filePath, buffer);
      return `/api/activities/images/${fileName}`;
    } catch (error) {
      throw new Error(`Failed to upload activity image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async uploadActivityVideo(buffer: Buffer, originalName: string): Promise<string> {
    const fileName = this.generateFileName(originalName);
    const filePath = path.join(this.localStoragePath, 'videos', fileName);
    
    try {
      await fsPromises.writeFile(filePath, buffer);
      return `/api/activities/videos/${fileName}`;
    } catch (error) {
      throw new Error(`Failed to upload activity video: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async uploadInstructionImage(buffer: Buffer, originalName: string): Promise<string> {
    const fileName = this.generateFileName(originalName);
    const filePath = path.join(this.localStoragePath, 'instructions', fileName);
    
    try {
      await fsPromises.writeFile(filePath, buffer);
      return `/api/activities/instructions/${fileName}`;
    } catch (error) {
      throw new Error(`Failed to upload instruction image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async downloadActivityImage(fileName: string): Promise<Buffer | null> {
    const filePath = path.join(this.localStoragePath, 'images', fileName);
    
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      return await fsPromises.readFile(filePath);
    } catch (error) {
      console.error('Failed to download activity image:', error);
      return null;
    }
  }

  async downloadActivityVideo(fileName: string): Promise<Buffer | null> {
    const filePath = path.join(this.localStoragePath, 'videos', fileName);
    
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      return await fsPromises.readFile(filePath);
    } catch (error) {
      console.error('Failed to download activity video:', error);
      return null;
    }
  }

  async downloadInstructionImage(fileName: string): Promise<Buffer | null> {
    const filePath = path.join(this.localStoragePath, 'instructions', fileName);
    
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      return await fsPromises.readFile(filePath);
    } catch (error) {
      console.error('Failed to download instruction image:', error);
      return null;
    }
  }

  async deleteActivityImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.startsWith('/api/activities/images/')) {
      return;
    }

    const fileName = imageUrl.replace('/api/activities/images/', '');
    const filePath = path.join(this.localStoragePath, 'images', fileName);
    
    try {
      if (fs.existsSync(filePath)) {
        await fsPromises.unlink(filePath);
      }
    } catch (error) {
      console.error('Failed to delete activity image:', error);
    }
  }

  async deleteActivityVideo(videoUrl: string): Promise<void> {
    if (!videoUrl || !videoUrl.startsWith('/api/activities/videos/')) {
      return;
    }

    const fileName = videoUrl.replace('/api/activities/videos/', '');
    const filePath = path.join(this.localStoragePath, 'videos', fileName);
    
    try {
      if (fs.existsSync(filePath)) {
        await fsPromises.unlink(filePath);
      }
    } catch (error) {
      console.error('Failed to delete activity video:', error);
    }
  }

  async deleteInstructionImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.startsWith('/api/activities/instructions/')) {
      return;
    }

    const fileName = imageUrl.replace('/api/activities/instructions/', '');
    const filePath = path.join(this.localStoragePath, 'instructions', fileName);
    
    try {
      if (fs.existsSync(filePath)) {
        await fsPromises.unlink(filePath);
      }
    } catch (error) {
      console.error('Failed to delete instruction image:', error);
    }
  }
}

export const activityStorage = new ActivityStorageService();