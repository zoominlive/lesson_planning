import { Router } from "express";
import type { Request, Response } from "express";
import { s3Service } from "../services/s3Service";
import { signedUrlService } from "../services/signedUrlService";
import { s3MigrationService } from "../services/s3MigrationService";
import type { AuthenticatedRequest } from "../middleware/auth-middleware";

const router = Router();

/**
 * Get signed URL for viewing an image
 */
router.get("/api/signed-urls/:type/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, id } = req.params;
    const { mediaType } = req.query;
    
    let result = null;
    
    switch (type) {
      case 'milestone':
        result = await signedUrlService.getMilestoneImageUrl(id);
        break;
      case 'material':
        result = await signedUrlService.getMaterialPhotoUrl(id);
        break;
      case 'activity':
        if (mediaType === 'video') {
          result = await signedUrlService.getActivityVideoUrl(id);
        } else {
          result = await signedUrlService.getActivityImageUrl(id);
        }
        break;
      default:
        return res.status(400).json({ error: 'Invalid type' });
    }
    
    if (!result) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error getting signed URL:', error);
    res.status(500).json({ error: 'Failed to get signed URL' });
  }
});

/**
 * Get signed URL for uploading
 */
router.post("/api/signed-urls/upload", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, filename } = req.body;
    const tenantId = req.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!type || !filename) {
      return res.status(400).json({ error: 'Type and filename are required' });
    }
    
    if (!['activity', 'material', 'milestone'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }
    
    const result = await signedUrlService.getUploadUrl(tenantId, type as any, filename);
    res.json(result);
  } catch (error) {
    console.error('Error getting upload URL:', error);
    res.status(500).json({ error: 'Failed to get upload URL' });
  }
});

/**
 * Batch get signed URLs
 */
router.post("/api/signed-urls/batch", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }
    
    const results = await signedUrlService.getBatchSignedUrls(items);
    
    // Convert Map to object for JSON response
    const response: Record<string, any> = {};
    results.forEach((value, key) => {
      response[key] = value;
    });
    
    res.json(response);
  } catch (error) {
    console.error('Error getting batch signed URLs:', error);
    res.status(500).json({ error: 'Failed to get signed URLs' });
  }
});

/**
 * Test migration endpoint - no auth required for development
 */
router.post("/api/s3/migrate-test", async (req: Request, res: Response) => {
  try {
    const tenantId = req.body.tenantId || '7cb6c28d-164c-49fa-b461-dfc47a8a3fed';
    
    // Run migration in background
    res.json({ message: 'Migration started. Check logs for progress.' });
    
    // Run migration asynchronously
    s3MigrationService.migrateAll(tenantId).then(results => {
      const report = s3MigrationService.getReport();
      console.log('Migration completed:', report);
    }).catch(error => {
      console.error('Migration failed:', error);
    });
  } catch (error) {
    console.error('Error starting migration:', error);
    res.status(500).json({ error: 'Failed to start migration' });
  }
});

/**
 * Migrate existing images to S3 (Admin only)
 */
router.post("/api/s3/migrate", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.role !== 'Admin' && req.role !== 'admin' && req.role !== 'Superadmin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const tenantId = req.body.tenantId || req.tenantId;
    
    // Run migration in background
    res.json({ message: 'Migration started. Check logs for progress.' });
    
    // Run migration asynchronously
    s3MigrationService.migrateAll(tenantId).then(results => {
      const report = s3MigrationService.getReport();
      console.log('Migration completed:', report);
    }).catch(error => {
      console.error('Migration failed:', error);
    });
  } catch (error) {
    console.error('Error starting migration:', error);
    res.status(500).json({ error: 'Failed to start migration' });
  }
});

/**
 * Get migration status (Admin only)
 */
router.get("/api/s3/migrate/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.role !== 'Admin' && req.role !== 'admin' && req.role !== 'Superadmin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const report = s3MigrationService.getReport();
    res.json(report);
  } catch (error) {
    console.error('Error getting migration status:', error);
    res.status(500).json({ error: 'Failed to get migration status' });
  }
});

export default router;