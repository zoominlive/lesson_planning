import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import path from "path";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// The object storage client for interacting with the storage service
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class MilestoneStorageService {
  private privateObjectDir: string;
  
  constructor() {
    // Use the private object directory from environment variables
    this.privateObjectDir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!this.privateObjectDir) {
      console.warn(
        "PRIVATE_OBJECT_DIR not set. Milestone image upload may not work correctly."
      );
    }
  }

  private generateFileName(tenantId: string, originalName: string): string {
    const timestamp = Date.now();
    const randomString = randomUUID().substring(0, 8);
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext).replace(/[^a-z0-9]/gi, '_');
    return `${tenantId}/milestones/${baseName}_${timestamp}_${randomString}${ext}`;
  }

  private parseObjectPath(path: string): { bucketName: string; objectName: string } {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    const pathParts = path.split("/");
    if (pathParts.length < 3) {
      throw new Error("Invalid path: must contain at least a bucket name");
    }
    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join("/");
    return { bucketName, objectName };
  }

  private async signObjectURL({
    bucketName,
    objectName,
    method,
    ttlSec,
  }: {
    bucketName: string;
    objectName: string;
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    ttlSec: number;
  }): Promise<string> {
    const request = {
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
    const response = await fetch(
      `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to sign object URL, errorcode: ${response.status}, ` +
          `make sure you're running on Replit`
      );
    }

    const { signed_url: signedURL } = await response.json();
    return signedURL;
  }

  async uploadMilestoneImage(tenantId: string, buffer: Buffer, originalName: string): Promise<string> {
    if (!this.privateObjectDir) {
      throw new Error("Object storage not configured");
    }

    const fileName = this.generateFileName(tenantId, originalName);
    const fullPath = `${this.privateObjectDir}/${fileName}`;
    const { bucketName, objectName } = this.parseObjectPath(fullPath);
    
    try {
      // Get a signed URL for uploading
      const uploadUrl = await this.signObjectURL({
        bucketName,
        objectName,
        method: "PUT",
        ttlSec: 300, // 5 minutes
      });

      // Upload the file using the signed URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: buffer,
        headers: {
          "Content-Type": this.getContentType(originalName),
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
      }

      // Return the path that will be used to serve the image
      return `/api/milestones/images/${fileName}`;
    } catch (error) {
      console.error("Failed to upload milestone image:", error);
      throw new Error(`Failed to upload milestone image: ${error.message}`);
    }
  }

  async downloadMilestoneImage(filePath: string, res: Response): Promise<void> {
    if (!this.privateObjectDir) {
      res.status(500).json({ error: "Object storage not configured" });
      return;
    }

    try {
      const fullPath = `${this.privateObjectDir}/${filePath}`;
      const { bucketName, objectName } = this.parseObjectPath(fullPath);
      
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        res.status(404).json({ error: "Image not found" });
        return;
      }

      // Get file metadata
      const [metadata] = await file.getMetadata();
      
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || this.getContentType(filePath),
        "Content-Length": metadata.size,
        "Cache-Control": "public, max-age=3600",
      });

      // Stream the file to the response
      const stream = file.createReadStream();
      
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error serving milestone image:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to retrieve image" });
      }
    }
  }

  async deleteMilestoneImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.startsWith("/api/milestones/images/")) {
      return;
    }

    if (!this.privateObjectDir) {
      console.warn("Object storage not configured, cannot delete image");
      return;
    }

    const filePath = imageUrl.replace("/api/milestones/images/", "");
    const fullPath = `${this.privateObjectDir}/${filePath}`;
    const { bucketName, objectName } = this.parseObjectPath(fullPath);
    
    try {
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      await file.delete();
      console.log(`Deleted milestone image: ${filePath}`);
    } catch (error) {
      console.error("Failed to delete milestone image:", error);
    }
  }

  private getContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
      case ".png":
        return "image/png";
      case ".jpg":
      case ".jpeg":
        return "image/jpeg";
      case ".gif":
        return "image/gif";
      case ".webp":
        return "image/webp";
      default:
        return "image/jpeg";
    }
  }
}

export const milestoneStorage = new MilestoneStorageService();