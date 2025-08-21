import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  type AuthenticatedRequest, 
  generateDevelopmentToken, 
  authenticateToken,
  validateLocationAccess,
  getUserAuthorizedLocationIds 
} from "./middleware/auth-middleware";
import { redirectToAuthorizedView, checkViewAccess } from "./middleware/view-access-control";
import { checkPermission } from "./middleware/permission-checker";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { materialStorage } from "./materialStorage";
import { activityStorage } from "./activityStorage";
import { perplexityService } from "./services/perplexityService";
import { openAIService } from "./services/openAiService";
import { imagePromptGenerationService } from "./services/imagePromptGenerationService";
import { promptValidationService } from "./services/promptValidationService";
import { milestoneStorage } from "./milestoneStorage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertMilestoneSchema, 
  insertMaterialSchema, 
  insertActivitySchema, 
  insertLessonPlanSchema,
  insertScheduledActivitySchema,
  type InsertLocation,
  insertLocationSchema,
  type InsertRoom,
  insertRoomSchema,
  type InsertCategory,
  insertCategorySchema,
  type InsertAgeGroup,
  insertAgeGroupSchema,
  insertTenantSettingsSchema,
  insertTenantPermissionOverrideSchema,
  insertActivityRecordSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({ storage: multer.memoryStorage() });
  
  // PUBLIC API ROUTES - No authentication required for these specific paths
  // Serve milestone images from object storage (public access for display in UI)
  app.get('/api/milestones/images/*', async (req, res) => {
    try {
      const filePath = (req.params as any)['0'] || ''; // Gets everything after /api/milestones/images/
      // Extract just the filename from the path (e.g., "express_feelings.png" from "tenantId/milestones/express_feelings.png")
      const filename = filePath.split('/').pop() || '';
      const imagePath = path.join(process.cwd(), 'public', 'milestone-images', filename);
      
      // Check if file exists in public directory first
      if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
      } else {
        // Fallback to object storage if not in public directory
        await milestoneStorage.downloadMilestoneImage(filePath, res);
      }
    } catch (error) {
      console.error('Error serving milestone image:', error);
      res.status(500).json({ error: 'Failed to retrieve image' });
    }
  });
  
  // Serve material images from object storage (public access for display in UI)
  app.get('/api/materials/images/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      const imagePath = path.join(process.cwd(), 'public', 'materials', 'images', filename);
      
      // Check if file exists in public directory first
      if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
      } else {
        // Fallback to object storage if not in public directory
        await materialStorage.downloadMaterialImage(filename, res);
      }
    } catch (error) {
      console.error('Error serving material image:', error);
      res.status(500).json({ error: 'Failed to retrieve image' });
    }
  });
  
  // Serve activity images from local storage (public access)
  app.get('/api/activities/images/:filename', async (req, res) => {
    try {
      const imageBuffer = await activityStorage.downloadActivityImage(req.params.filename);
      if (!imageBuffer) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Determine content type based on file extension
      const ext = path.extname(req.params.filename).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(imageBuffer);
    } catch (error) {
      console.error('Error serving activity image:', error);
      res.status(500).json({ error: 'Failed to retrieve image' });
    }
  });
  
  // Serve activity videos from local storage (public access)
  app.get('/api/activities/videos/:filename', async (req, res) => {
    try {
      const videoBuffer = await activityStorage.downloadActivityVideo(req.params.filename);
      if (!videoBuffer) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      // Determine content type based on file extension
      const ext = path.extname(req.params.filename).toLowerCase();
      let contentType = 'video/mp4';
      if (ext === '.webm') contentType = 'video/webm';
      else if (ext === '.ogg') contentType = 'video/ogg';
      
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(videoBuffer);
    } catch (error) {
      console.error('Error serving activity video:', error);
      res.status(500).json({ error: 'Failed to retrieve video' });
    }
  });
  
  // Serve instruction images from local storage (public access)
  app.get('/api/activities/instructions/:filename', async (req, res) => {
    try {
      const imageBuffer = await activityStorage.downloadInstructionImage(req.params.filename);
      if (!imageBuffer) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Determine content type based on file extension
      const ext = path.extname(req.params.filename).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(imageBuffer);
    } catch (error) {
      console.error('Error serving instruction image:', error);
      res.status(500).json({ error: 'Failed to retrieve image' });
    }
  });
  
  // Apply authentication middleware to all API routes EXCEPT the public ones above
  app.use("/api", (req, res, next) => {
    // Skip authentication for public image routes
    if (req.path.startsWith('/milestones/images/') ||
        req.path.startsWith('/materials/images/') || 
        req.path.startsWith('/activities/images/') ||
        req.path.startsWith('/activities/videos/') ||
        req.path.startsWith('/activities/instructions/')) {
      return next();
    }
    return authenticateToken(req as AuthenticatedRequest, res, next);
  });

  // Apply tenant context middleware to all API routes
  app.use("/api", (req: AuthenticatedRequest, res, next) => {
    console.log("Setting tenant context for tenantId:", req.tenantId);
    if (req.tenantId) {
      storage.setTenantContext(req.tenantId);
    }
    next();
  });

  // Apply view access control middleware to check role-based redirects
  app.use("/", redirectToAuthorizedView);
  
  // Add a route to get current user information
  app.get("/api/user", async (req: AuthenticatedRequest, res) => {
    try {
      console.log('User endpoint called with auth data:', {
        tenantId: req.tenantId,
        userId: req.userId,
        userFirstName: req.userFirstName,
        userLastName: req.userLastName,
        username: req.username,
        role: req.role
      });
      
      const userData = {
        tenantId: req.tenantId,
        userId: req.userId,
        userFirstName: req.userFirstName,
        userLastName: req.userLastName,
        username: req.username,
        role: req.role
      };
      
      res.set('Cache-Control', 'no-cache');
      res.json(userData);
    } catch (error) {
      console.error('Error in /api/user:', error);
      res.status(500).json({ error: "Failed to get user information" });
    }
  });

  // Get all users for the current tenant and optional location
  app.get("/api/users", async (req: AuthenticatedRequest, res) => {
    try {
      const { locationId } = req.query;
      
      // Get all users filtered by tenant (and optionally location)
      const users = await storage.getUsers(locationId as string);
      
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Milestones routes
  app.get("/api/milestones", async (req: AuthenticatedRequest, res) => {
    try {
      const { locationId } = req.query;
      
      // Validate location access if locationId is provided
      if (locationId) {
        const accessCheck = await validateLocationAccess(req, locationId as string);
        if (!accessCheck.allowed) {
          return res.status(403).json({ error: accessCheck.message });
        }
      }
      
      // Get authorized location IDs for filtering
      const authorizedLocationIds = await getUserAuthorizedLocationIds(req);
      
      // Filter milestones to only authorized locations
      let milestones = await storage.getMilestones(locationId as string);
      
      // If no specific location requested, filter to only authorized locations
      if (!locationId && authorizedLocationIds.length > 0) {
        milestones = milestones.filter(m => 
          m.locationIds && m.locationIds.some(locId => authorizedLocationIds.includes(locId))
        );
      }
      
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  // Upload milestone image
  app.post("/api/milestones/upload-image", upload.single('image'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: "Tenant ID not found" });
      }

      const imageUrl = await milestoneStorage.uploadMilestoneImage(
        tenantId,
        req.file.buffer,
        req.file.originalname
      );

      res.json({ imageUrl });
    } catch (error) {
      console.error('Error uploading milestone image:', error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  app.post("/api/milestones", async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertMilestoneSchema.parse(req.body);
      
      // Validate that user has access to all locations they're creating the milestone in
      if (data.locationIds && data.locationIds.length > 0) {
        for (const locationId of data.locationIds) {
          const accessCheck = await validateLocationAccess(req, locationId);
          if (!accessCheck.allowed) {
            return res.status(403).json({ error: accessCheck.message });
          }
        }
      }
      
      const milestone = await storage.createMilestone(data);
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Milestone creation error:", error);
      res.status(400).json({ error: "Invalid milestone data" });
    }
  });

  app.put("/api/milestones/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const data = insertMilestoneSchema.partial().parse(req.body);
      
      // Get existing milestone to check location access
      const existing = await storage.getMilestone(id);
      if (!existing) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      
      // Validate access to existing locations
      for (const locationId of existing.locationIds) {
        const accessCheck = await validateLocationAccess(req, locationId);
        if (!accessCheck.allowed) {
          return res.status(403).json({ error: accessCheck.message });
        }
      }
      
      // If changing locations, validate access to new locations
      if (data.locationIds) {
        for (const locationId of data.locationIds) {
          const newAccessCheck = await validateLocationAccess(req, locationId);
          if (!newAccessCheck.allowed) {
            return res.status(403).json({ error: `Cannot move to location: ${newAccessCheck.message}` });
          }
        }
      }
      
      const milestone = await storage.updateMilestone(id, data);
      res.json(milestone);
    } catch (error) {
      res.status(400).json({ error: "Invalid milestone data" });
    }
  });

  app.delete("/api/milestones/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      // Get milestone to check location access
      const milestone = await storage.getMilestone(id);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      
      // Validate location access - check if user has access to any of the milestone's locations
      const userLocationIds = await getUserAuthorizedLocationIds(req);
      const hasAccess = milestone.locationIds.some(locId => userLocationIds.includes(locId));
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied. You don't have permission to access this milestone." });
      }
      
      const deleted = await storage.deleteMilestone(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete milestone" });
    }
  });

  // Materials routes
  app.get("/api/materials", async (req: AuthenticatedRequest, res) => {
    try {
      const { locationId } = req.query;
      
      // Validate location access if locationId is provided
      if (locationId) {
        const accessCheck = await validateLocationAccess(req, locationId as string);
        if (!accessCheck.allowed) {
          return res.status(403).json({ error: accessCheck.message });
        }
      }
      
      // Get authorized location IDs for filtering
      const authorizedLocationIds = await getUserAuthorizedLocationIds(req);
      
      // Get materials
      let materials = locationId 
        ? await storage.getMaterialsByLocation(locationId as string)
        : await storage.getMaterials();
      
      // Filter materials to only include those in authorized locations
      if (authorizedLocationIds.length > 0) {
        materials = materials.filter(m => {
          // Check if any of the material's locationIds are in the authorized list
          return m.locationIds && m.locationIds.some(locId => 
            authorizedLocationIds.includes(locId)
          );
        });
      }
      
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.post("/api/materials", checkPermission('material', 'create'), async (req: AuthenticatedRequest, res) => {
    try {
      console.log('[POST /api/materials] Request body:', req.body);
      console.log('[POST /api/materials] Request tenantId:', req.tenantId);
      
      // Don't accept tenantId from body, use it from the authenticated request
      const { tenantId: bodyTenantId, ...bodyWithoutTenant } = req.body;
      
      // Add the tenantId from the authenticated request
      const materialDataWithTenant = {
        ...bodyWithoutTenant,
        tenantId: req.tenantId // Use the authenticated tenant ID
      };
      
      console.log('[POST /api/materials] Data with tenant:', materialDataWithTenant);
      
      const data = insertMaterialSchema.parse(materialDataWithTenant);
      console.log('[POST /api/materials] Parsed data:', data);
      
      // Validate that user has access to ALL locations they're assigning the material to
      if (data.locationIds && data.locationIds.length > 0) {
        for (const locId of data.locationIds) {
          const accessCheck = await validateLocationAccess(req, locId);
          if (!accessCheck.allowed) {
            return res.status(403).json({ error: `Access denied: ${accessCheck.message}` });
          }
        }
      }
      
      const material = await storage.createMaterial(data);
      res.status(201).json(material);
    } catch (error) {
      console.error('[POST /api/materials] Error:', error);
      res.status(400).json({ error: "Invalid material data" });
    }
  });

  app.put("/api/materials/:id", checkPermission('material', 'update'), async (req: AuthenticatedRequest, res) => {
    console.log('[PUT /api/materials] Starting update for ID:', req.params.id);
    console.log('[PUT /api/materials] Request body:', req.body);
    console.log('[PUT /api/materials] Auth info:', { tenantId: req.tenantId, userId: req.userId });
    
    try {
      const { id } = req.params;
      // Don't accept tenantId from body, use it from the authenticated request
      const { tenantId: bodyTenantId, ...bodyWithoutTenant } = req.body;
      
      // Add the tenantId from the authenticated request for partial updates
      const materialDataWithTenant = {
        ...bodyWithoutTenant,
        tenantId: req.tenantId // Use the authenticated tenant ID
      };
      
      const data = insertMaterialSchema.partial().parse(materialDataWithTenant);
      console.log('[PUT /api/materials] Parsed data:', data);
      
      // Get existing material to check location access
      const existing = await storage.getMaterial(id);
      if (!existing) {
        return res.status(404).json({ error: "Material not found" });
      }
      
      // Validate access to ALL existing locations
      if (existing.locationIds) {
        for (const locId of existing.locationIds) {
          const accessCheck = await validateLocationAccess(req, locId);
          if (!accessCheck.allowed) {
            return res.status(403).json({ error: accessCheck.message });
          }
        }
      }
      
      // If changing locations, validate access to ALL new locations
      if (data.locationIds) {
        for (const locId of data.locationIds) {
          const accessCheck = await validateLocationAccess(req, locId);
          if (!accessCheck.allowed) {
            return res.status(403).json({ error: `Cannot assign to location: ${accessCheck.message}` });
          }
        }
      }
      
      const material = await storage.updateMaterial(id, data);
      res.json(material);
    } catch (error) {
      console.error('[PUT /api/materials] Error:', error);
      res.status(400).json({ 
        error: "Invalid material data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.delete("/api/materials/:id", checkPermission('material', 'delete'), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      // Get material to check location access
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      
      // Validate access to ALL material locations
      if (material.locationIds) {
        for (const locId of material.locationIds) {
          const accessCheck = await validateLocationAccess(req, locId);
          if (!accessCheck.allowed) {
            return res.status(403).json({ error: accessCheck.message });
          }
        }
      }
      
      const deleted = await storage.deleteMaterial(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete material" });
    }
  });

  // Material image upload routes (authenticated)

  // Get presigned URL for material upload
  app.post('/api/materials/upload-url', async (req: AuthenticatedRequest, res) => {
    try {
      const uploadData = await materialStorage.getUploadUrl();
      res.json(uploadData);
    } catch (error) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ error: 'Failed to get upload URL' });
    }
  });

  // Handle direct upload of material images
  app.post('/api/materials/upload-direct', upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { key } = req.body;
      if (!key) {
        return res.status(400).json({ error: 'No storage key provided' });
      }

      const photoPath = await materialStorage.handleDirectUpload(req.file.buffer, key);
      res.json({ photoPath });
    } catch (error) {
      console.error('Error uploading material image:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // Update material photo endpoint
  app.put('/api/materials/:id/photo', async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { photoURL } = req.body;
      
      // Get existing material to check permissions
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ error: 'Material not found' });
      }

      // Validate access to material locations
      if (material.locationIds) {
        for (const locId of material.locationIds) {
          const accessCheck = await validateLocationAccess(req, locId);
          if (!accessCheck.allowed) {
            return res.status(403).json({ error: accessCheck.message });
          }
        }
      }

      // Update the material with the new photo URL
      const updatedMaterial = await storage.updateMaterial(id, { photoUrl: photoURL });
      res.json({ objectPath: photoURL });
    } catch (error) {
      console.error('Error updating material photo:', error);
      res.status(500).json({ error: 'Failed to update material photo' });
    }
  });

  // Material Collections endpoints
  app.get("/api/material-collections", async (req: AuthenticatedRequest, res) => {
    try {
      const collections = await storage.getMaterialCollections();
      res.json(collections);
    } catch (error) {
      console.error('[GET /api/material-collections] Error:', error);
      res.status(500).json({ error: "Failed to fetch material collections" });
    }
  });

  app.post("/api/material-collections", async (req: AuthenticatedRequest, res) => {
    try {
      const data = req.body;
      const collection = await storage.createMaterialCollection(data);
      res.json(collection);
    } catch (error) {
      console.error('[POST /api/material-collections] Error:', error);
      res.status(400).json({ 
        error: "Invalid collection data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/material-collections/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const collection = await storage.updateMaterialCollection(id, data);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      console.error('[PUT /api/material-collections] Error:', error);
      res.status(400).json({ 
        error: "Invalid collection data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.delete("/api/material-collections/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteMaterialCollection(id);
      if (!deleted) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('[DELETE /api/material-collections] Error:', error);
      res.status(500).json({ error: "Failed to delete collection" });
    }
  });

  // Get materials by collection
  app.get("/api/material-collections/:id/materials", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const materials = await storage.getMaterialsByCollection(id);
      res.json(materials);
    } catch (error) {
      console.error('[GET /api/material-collections/:id/materials] Error:', error);
      res.status(500).json({ error: "Failed to fetch materials for collection" });
    }
  });

  // Add materials to a collection
  app.post("/api/material-collections/:id/materials", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { materialIds } = req.body;
      
      console.log('[POST /api/material-collections/:id/materials] Adding materials to collection:', id, materialIds);
      
      if (!Array.isArray(materialIds)) {
        return res.status(400).json({ error: "materialIds must be an array" });
      }
      
      // Add each material to the collection
      const results = [];
      for (const materialId of materialIds) {
        try {
          const item = await storage.addMaterialToCollection(materialId, id);
          results.push(item);
        } catch (error) {
          // Skip if material is already in collection (duplicate key error)
          console.log(`Material ${materialId} may already be in collection ${id}:`, error);
        }
      }
      
      res.json({ success: true, added: results.length });
    } catch (error) {
      console.error('[POST /api/material-collections/:id/materials] Error:', error);
      res.status(500).json({ error: "Failed to add materials to collection" });
    }
  });

  // Get collections for a material
  app.get("/api/materials/:id/collections", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const collections = await storage.getCollectionsByMaterial(id);
      res.json(collections);
    } catch (error) {
      console.error('[GET /api/materials/:id/collections] Error:', error);
      res.status(500).json({ error: "Failed to fetch collections for material" });
    }
  });

  // Update material collections
  app.put("/api/materials/:id/collections", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { collectionIds } = req.body;
      
      if (!Array.isArray(collectionIds)) {
        return res.status(400).json({ error: "collectionIds must be an array" });
      }
      
      await storage.updateMaterialCollections(id, collectionIds);
      res.json({ success: true });
    } catch (error) {
      console.error('[PUT /api/materials/:id/collections] Error:', error);
      res.status(500).json({ error: "Failed to update material collections" });
    }
  });

  // Legacy object storage routes (kept for backward compatibility)
  app.post("/api/objects/upload", async (req: AuthenticatedRequest, res) => {
    try {
      // Redirect to new material upload URL endpoint
      const uploadData = await materialStorage.getUploadUrl();
      res.json({ uploadURL: uploadData.url, key: uploadData.key });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req: AuthenticatedRequest, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.put("/api/materials/:id/photo", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { photoURL } = req.body;
      
      if (!photoURL) {
        return res.status(400).json({ error: "photoURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        photoURL,
        {
          owner: req.userId || "anonymous",
          visibility: "public", // Material photos are public
        },
      );

      // Update the material with the photo URL
      const material = await storage.updateMaterial(id, { photoUrl: objectPath });
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      res.json({ objectPath });
    } catch (error) {
      console.error("Error setting material photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate AI image for material
  app.post('/api/materials/generate-image', async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, prompt } = req.body;
      
      // Check if OPENAI_API_KEY is available
      if (!process.env.OPENAI_API_KEY) {
        console.error('OpenAI API key not configured');
        return res.status(503).json({ 
          error: 'Image generation service is not available. Please ensure OPENAI_API_KEY is configured.' 
        });
      }
      
      // For materials, we want simple product shots on white backgrounds
      const materialName = name || prompt?.split('.')[0] || 'Material';
      const materialDescription = description || '';
      
      // Create a simple, direct prompt for clean product photography
      const imagePrompt = `High-quality product photography of ${materialName}${materialDescription ? `, ${materialDescription}` : ''}. Professional studio lighting, pure white background, crisp and clear, centered composition, no shadows, commercial product shot style. Show only the item itself, no hands or people.`;
      
      console.log('[Material Image Generation] Using direct prompt:', imagePrompt);
      
      // Generate image directly with OpenAI API
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: imagePrompt,
            size: "1024x1024",
            quality: "hd",
            n: 1,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Material Image Generation] Failed:", errorText);
        throw new Error(`Image generation failed: ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;
      
      if (!imageUrl) {
        return res.status(500).json({ error: 'Failed to generate image' });
      }
      
      // Save the generated image locally
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.arrayBuffer();
      
      // Generate a unique filename
      const timestamp = Date.now();
      const uniqueId = crypto.randomUUID().substring(0, 8);
      const filename = `ai_generated_material_${timestamp}_${uniqueId}.png`;
      const imagePath = path.join(
        process.cwd(),
        "public",
        "materials",
        "images",
        filename
      );
      
      // Ensure directory exists
      const dir = path.dirname(imagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save the image
      fs.writeFileSync(imagePath, Buffer.from(buffer));
      
      const localUrl = `/api/materials/images/${filename}`;
      console.log("[Material Image Generation] Image saved locally:", localUrl);
      
      res.json({ url: localUrl, prompt: imagePrompt });
    } catch (error) {
      console.error('Material image generation error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to generate image. Please try again later.' 
      });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req: AuthenticatedRequest, res) => {
    try {
      const { locationId } = req.query;
      
      // Validate location access if locationId is provided
      if (locationId) {
        const accessCheck = await validateLocationAccess(req, locationId as string);
        if (!accessCheck.allowed) {
          return res.status(403).json({ error: accessCheck.message });
        }
      }
      
      // Get authorized location IDs for filtering
      const authorizedLocationIds = await getUserAuthorizedLocationIds(req);
      
      // Get activities
      let activities = await storage.getActivities(locationId as string);
      
      // Filter to only authorized locations if no specific location requested
      if (!locationId && authorizedLocationIds.length > 0) {
        activities = activities.filter(a => 
          authorizedLocationIds.includes(a.locationId)
        );
      }
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", checkPermission('activity', 'create'), async (req: AuthenticatedRequest, res) => {
    console.log('[POST /api/activities] Request body:', req.body);
    console.log('[POST /api/activities] Authenticated tenant:', req.tenantId);
    
    try {
      // Add tenantId from authenticated context to the request body
      const dataWithTenant = {
        ...req.body,
        tenantId: req.tenantId
      };
      
      // Parse and validate the activity data with the schema
      const data = insertActivitySchema.parse(dataWithTenant);
      console.log('[POST /api/activities] Parsed data with tenant:', data);
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, data.locationId);
      if (!accessCheck.allowed) {
        console.log('[POST /api/activities] Location access denied:', accessCheck.message);
        return res.status(403).json({ error: accessCheck.message });
      }
      
      // Create the activity with all fields including AI-generated ones
      const activity = await storage.createActivity(data);
      console.log('[POST /api/activities] Activity created successfully with ID:', activity.id);
      res.status(201).json(activity);
    } catch (error) {
      console.error('[POST /api/activities] Error creating activity:', error);
      if (error instanceof Error) {
        console.error('[POST /api/activities] Error details:', error.message);
        console.error('[POST /api/activities] Error stack:', error.stack);
      }
      res.status(400).json({ error: "Invalid activity data", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/activities/:id", checkPermission('activity', 'update'), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const data = insertActivitySchema.partial().parse(req.body);
      
      // Get existing activity to check location access
      const existing = await storage.getActivity(id);
      if (!existing) {
        return res.status(404).json({ error: "Activity not found" });
      }
      
      // Validate access to existing location
      const accessCheck = await validateLocationAccess(req, existing.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      // If changing location, validate access to new location
      if (data.locationId && data.locationId !== existing.locationId) {
        const newAccessCheck = await validateLocationAccess(req, data.locationId);
        if (!newAccessCheck.allowed) {
          return res.status(403).json({ error: `Cannot move to location: ${newAccessCheck.message}` });
        }
      }
      
      const activity = await storage.updateActivity(id, data);
      res.json(activity);
    } catch (error) {
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.delete("/api/activities/:id", checkPermission('activity', 'delete'), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      // Get activity to check location access
      const activity = await storage.getActivity(id);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, activity.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      const deleted = await storage.deleteActivity(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });
  
  // Upload route for activity media
  app.post('/api/activities/upload', upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const type = req.body.type as 'image' | 'video' | 'instruction';
      if (!type) {
        return res.status(400).json({ error: 'File type not specified' });
      }
      
      let url: string;
      
      switch(type) {
        case 'image':
          url = await activityStorage.uploadActivityImage(req.file.buffer, req.file.originalname);
          break;
        case 'video':
          url = await activityStorage.uploadActivityVideo(req.file.buffer, req.file.originalname);
          break;
        case 'instruction':
          url = await activityStorage.uploadInstructionImage(req.file.buffer, req.file.originalname);
          break;
        default:
          return res.status(400).json({ error: 'Invalid file type' });
      }
      
      res.json({ url });
    } catch (error) {
      console.error('Activity upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // Generate step image using AI
  app.post('/api/activities/generate-step-image', async (req: AuthenticatedRequest, res) => {
    try {
      const { activityTitle, activityDescription, stepNumber, stepText, ageGroup, category, spaceRequired } = req.body;
      
      if (!stepText || !stepNumber) {
        return res.status(400).json({ error: 'Step text and number are required' });
      }

      // Check if services are available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          error: 'Image generation service is not available. Please check your OpenAI API key configuration.' 
        });
      }

      // Use the new imagePromptGenerationService for step images
      const result = await imagePromptGenerationService.generateActivityImage({
        type: 'step',
        activityTitle: activityTitle || 'Activity',
        activityDescription: activityDescription || '',
        stepNumber,
        stepText,
        ageGroup,
        category,
        spaceRequired
      });
      
      if (!result.url) {
        return res.status(500).json({ error: 'Failed to generate step image' });
      }
      
      // Save the generated image locally
      const imageResponse = await fetch(result.url);
      const buffer = await imageResponse.arrayBuffer();
      
      // Generate a unique filename
      const timestamp = Date.now();
      const uniqueId = crypto.randomUUID().substring(0, 8);
      const filename = `ai_generated_${timestamp}_${uniqueId}.png`;
      const imagePath = path.join(
        process.cwd(),
        "public",
        "activity-images",
        "images",
        filename
      );
      
      // Ensure directory exists
      const dir = path.dirname(imagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save the image
      fs.writeFileSync(imagePath, Buffer.from(buffer));
      
      const localUrl = `/api/activities/images/${filename}`;
      console.log("[ImagePromptGeneration] Step image saved locally:", localUrl);
      
      res.json({ url: localUrl, prompt: result.prompt });
    } catch (error) {
      console.error('Step image generation error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to generate step image. Please try again later.' 
      });
    }
  });

  // Generate activity image using AI

  app.post('/api/activities/generate-image', async (req: AuthenticatedRequest, res) => {
    try {
      const { prompt, title, description, spaceRequired, ageGroup, category } = req.body;
      
      if (!prompt && (!title || !description)) {
        return res.status(400).json({ error: 'Either prompt or both title and description are required' });
      }

      // Check if services are available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          error: 'Image generation service is not available. Please check your OpenAI API key configuration.' 
        });
      }

      // Use the new imagePromptGenerationService
      const activityTitle = title || prompt?.split('.')[0] || 'Activity';
      const activityDescription = description || prompt || '';
      
      const result = await imagePromptGenerationService.generateActivityImage({
        type: 'activity',
        activityTitle,
        activityDescription,
        ageGroup,
        category,
        spaceRequired
      });
      
      if (!result.url) {
        return res.status(500).json({ error: 'Failed to generate image' });
      }
      
      // Save the generated image locally
      const imageResponse = await fetch(result.url);
      const buffer = await imageResponse.arrayBuffer();
      
      // Generate a unique filename
      const timestamp = Date.now();
      const uniqueId = crypto.randomUUID().substring(0, 8);
      const filename = `ai_generated_${timestamp}_${uniqueId}.png`;
      const imagePath = path.join(
        process.cwd(),
        "public",
        "activity-images",
        "images",
        filename
      );
      
      // Ensure directory exists
      const dir = path.dirname(imagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save the image
      fs.writeFileSync(imagePath, Buffer.from(buffer));
      
      const localUrl = `/api/activities/images/${filename}`;
      console.log("[ImagePromptGeneration] Image saved locally:", localUrl);
      
      res.json({ url: localUrl, prompt: result.prompt });
    } catch (error) {
      console.error('Activity image generation error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to generate image. Please try again later.' 
      });
    }
  });

  // Generate activity using AI
  app.post('/api/activities/generate', async (req: AuthenticatedRequest, res) => {
    const { ageGroupId, ageGroupName, ageRange, category, isQuiet, isIndoor, locationId, activityType, focusMaterial, milestoneId, milestoneTitle, milestoneDescription, milestoneCategory } = req.body;
    
    if (!ageGroupName || !category || isQuiet === undefined || isIndoor === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate user inputs for safety and appropriateness
    if (activityType || focusMaterial) {
      console.log('[AI Generation] Validating user inputs:', { activityType, focusMaterial });
      
      try {
        const validationResult = await promptValidationService.validateActivityInputs(
          activityType,
          focusMaterial
        );
        
        // Block if validation returns false (inappropriate content detected)
        if (!validationResult.isValid) {
          console.log('[AI Generation] Validation failed:', validationResult.reason);
          return res.status(400).json({ 
            error: 'The requested activity type or material is not appropriate for early childhood education.',
            reason: validationResult.reason || 'Content does not meet safety guidelines for children ages 0-5.'
          });
        }
        
        console.log('[AI Generation] Validation passed');
      } catch (validationError) {
        // If validation service fails, block the request for safety
        console.error('[AI Generation] Validation service error:', validationError);
        return res.status(503).json({ 
          error: 'Content validation service is temporarily unavailable. Please try again later or remove the activity type and focus material fields.',
          reason: 'Unable to verify content safety at this time.'
        });
      }
    }

    // Fetch existing activities to avoid duplicates
    const existingActivities = await storage.getActivities();
    const existingActivityInfo = existingActivities.map(activity => ({
      title: activity.title,
      description: activity.description
    }));

    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        // Generate activity using Perplexity AI
        const generatedActivity = await perplexityService.generateActivity({
          ageGroup: ageGroupName,
          category,
          isQuiet,
          isIndoor,
          ageRange: ageRange || { start: 2, end: 5 },
          existingActivities: existingActivityInfo,
          activityType: activityType,
          focusMaterial: focusMaterial,
          milestoneTitle: milestoneTitle,
          milestoneDescription: milestoneDescription,
          milestoneCategory: milestoneCategory
        });

        // Check if the generation failed
        if (generatedActivity.title === "Activity Generation Failed") {
          console.log(`[Activity Generation] Attempt ${attempts} failed, ${attempts < maxAttempts ? 'retrying...' : 'no more retries'}`);
          
          if (attempts < maxAttempts) {
            // Send a status update to the client that we're retrying
            continue; // Try again
          } else {
            // All attempts failed
            return res.status(503).json({ 
              error: 'Activity generation temporarily unavailable. Please try again later or create the activity manually.',
              retryable: false 
            });
          }
        }

        // Validate suggested materials against existing database
        let validatedMaterials = [];
        if (generatedActivity.suggestedMaterials && generatedActivity.suggestedMaterials.length > 0) {
          // Fetch all existing materials
          const existingMaterials = await storage.getMaterials();
          
          // Create a map for quick lookups - normalize names for comparison
          const materialMap = new Map();
          existingMaterials.forEach(mat => {
            const normalizedName = mat.name.toLowerCase().trim();
            materialMap.set(normalizedName, mat);
            // Also check for partial matches (e.g., "Drawing Paper" vs "Paper")
            const simplifiedName = normalizedName.replace(/\s+(paper|supplies|materials|set|kit)$/i, '').trim();
            if (simplifiedName !== normalizedName) {
              materialMap.set(simplifiedName, mat);
            }
          });
          
          // Check each suggested material
          validatedMaterials = generatedActivity.suggestedMaterials.map((suggestedMat: any) => {
            const normalizedSuggestedName = suggestedMat.name.toLowerCase().trim();
            const simplifiedSuggestedName = normalizedSuggestedName.replace(/\s+(paper|supplies|materials|set|kit)$/i, '').trim();
            
            // Check for exact match or simplified match
            const existingMaterial = materialMap.get(normalizedSuggestedName) || 
                                     materialMap.get(simplifiedSuggestedName) ||
                                     // Also check for very similar names (e.g., "Balloon" vs "Balloons")
                                     existingMaterials.find(m => {
                                       const mName = m.name.toLowerCase();
                                       const sName = suggestedMat.name.toLowerCase();
                                       // Check singular/plural variations
                                       return mName === sName || 
                                              mName === sName + 's' || 
                                              mName + 's' === sName ||
                                              // Check for very similar names (drawing paper vs paper)
                                              (sName.includes('paper') && mName.includes('paper')) ||
                                              (sName.includes('balloon') && mName.includes('balloon')) ||
                                              (sName.includes('tape') && mName.includes('tape'));
                                     });
            
            if (existingMaterial) {
              // Material exists - return the existing material info
              return {
                ...suggestedMat,
                existingMaterialId: existingMaterial.id,
                existingMaterialName: existingMaterial.name,
                existingMaterialCategory: existingMaterial.category,
                isExisting: true
              };
            } else {
              // Material doesn't exist - mark as new
              return {
                ...suggestedMat,
                isExisting: false
              };
            }
          });
          
          console.log('[Activity Generation] Validated materials:', validatedMaterials.map((m: any) => ({
            name: m.name,
            isExisting: m.isExisting,
            existingName: m.existingMaterialName
          })));
        }

        // Transform the AI response to match our activity form structure
        const transformedActivity = {
          title: generatedActivity.title,
          description: generatedActivity.description,
          duration: generatedActivity.duration,
          ageRangeStart: ageRange.start,
          ageRangeEnd: ageRange.end,
          objectives: generatedActivity.learningObjectives,
          preparationTime: generatedActivity.setupTime,
          safetyConsiderations: generatedActivity.safetyConsiderations,
          category,
          spaceRequired: generatedActivity.spaceRequired,
          groupSize: generatedActivity.groupSize,
          messLevel: generatedActivity.messLevel,
          instructions: generatedActivity.instructions.map((inst: any, index: number) => ({
            stepNumber: index + 1,
            text: inst.text,
            tip: inst.tip || '',
            imageUrl: ''
          })),
          variations: generatedActivity.variations,
          imagePrompt: generatedActivity.imagePrompt,
          suggestedMaterials: validatedMaterials.length > 0 ? validatedMaterials : (generatedActivity.suggestedMaterials || []),
          // Include milestone information if provided
          targetedMilestoneId: milestoneId || null,
          targetedMilestoneTitle: milestoneTitle || null,
          targetedMilestoneDescription: milestoneDescription || null,
          targetedMilestoneCategory: milestoneCategory || null
        };

        res.json(transformedActivity);
        return; // Success, exit the function
        
      } catch (error) {
        console.error(`Activity generation error (attempt ${attempts}/${maxAttempts}):`, error);
        
        if (attempts >= maxAttempts) {
          res.status(500).json({ 
            error: 'Failed to generate activity after multiple attempts. Please try again later.',
            retryable: true 
          });
          return;
        }
        // Continue to next attempt
      }
    }
  });

  // Serve activity images
  app.get('/api/activities/images/:fileName', async (req: AuthenticatedRequest, res) => {
    try {
      const { fileName } = req.params;
      const imageBuffer = await activityStorage.downloadActivityImage(fileName);
      
      if (!imageBuffer) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Determine content type based on file extension
      const ext = path.extname(fileName).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(imageBuffer);
    } catch (error) {
      console.error('Error serving activity image:', error);
      res.status(500).json({ error: 'Failed to retrieve image' });
    }
  });

  // Serve activity videos
  app.get('/api/activities/videos/:fileName', async (req: AuthenticatedRequest, res) => {
    try {
      const { fileName } = req.params;
      const videoBuffer = await activityStorage.downloadActivityVideo(fileName);
      
      if (!videoBuffer) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      // Determine content type based on file extension
      const ext = path.extname(fileName).toLowerCase();
      let contentType = 'video/mp4';
      if (ext === '.webm') contentType = 'video/webm';
      else if (ext === '.ogg') contentType = 'video/ogg';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(videoBuffer);
    } catch (error) {
      console.error('Error serving activity video:', error);
      res.status(500).json({ error: 'Failed to retrieve video' });
    }
  });

  // Serve instruction images
  app.get('/api/activities/instructions/:fileName', async (req: AuthenticatedRequest, res) => {
    try {
      const { fileName } = req.params;
      const imageBuffer = await activityStorage.downloadInstructionImage(fileName);
      
      if (!imageBuffer) {
        return res.status(404).json({ error: 'Instruction image not found' });
      }
      
      // Determine content type based on file extension
      const ext = path.extname(fileName).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(imageBuffer);
    } catch (error) {
      console.error('Error serving instruction image:', error);
      res.status(500).json({ error: 'Failed to retrieve instruction image' });
    }
  });

  // Activity Records routes
  app.post("/api/activity-records", async (req: AuthenticatedRequest, res) => {
    try {
      const dataWithTenant = {
        ...req.body,
        tenantId: req.tenantId,
        userId: req.userId
      };
      
      const data = insertActivityRecordSchema.parse(dataWithTenant);
      
      // Get the scheduled activity to validate access
      const scheduledActivity = await storage.getScheduledActivity(data.scheduledActivityId);
      if (!scheduledActivity) {
        return res.status(404).json({ error: "Scheduled activity not found" });
      }
      
      // TODO: Add location validation if needed based on scheduled activity's lesson plan
      
      const record = await storage.createActivityRecord(data);
      res.status(201).json(record);
    } catch (error) {
      console.error('Error creating activity record:', error);
      res.status(400).json({ 
        error: "Invalid activity record data", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/activity-records/scheduled/:scheduledActivityId", async (req: AuthenticatedRequest, res) => {
    try {
      const { scheduledActivityId } = req.params;
      
      // Get the scheduled activity to validate access
      const scheduledActivity = await storage.getScheduledActivity(scheduledActivityId);
      if (!scheduledActivity) {
        return res.status(404).json({ error: "Scheduled activity not found" });
      }
      
      const records = await storage.getActivityRecords(scheduledActivityId);
      res.json(records);
    } catch (error) {
      console.error('Error fetching activity records:', error);
      res.status(500).json({ error: "Failed to fetch activity records" });
    }
  });

  // Analyze completed activities using AI
  app.post("/api/activity-review/analyze", async (req: AuthenticatedRequest, res) => {
    console.log("Activity review analyze endpoint called");
    console.log("User role:", req.role);
    console.log("Request body keys:", Object.keys(req.body || {}));
    
    try {
      // Check user role - only directors and assistant directors can analyze activities
      const role = req.role?.toLowerCase();
      if (role !== 'director' && role !== 'assistant_director' && role !== 'admin' && role !== 'superadmin') {
        console.log("Permission denied for role:", role);
        return res.status(403).json({ error: "Insufficient permissions to analyze activities" });
      }

      const { prompt, activities, stats } = req.body;
      
      if (!prompt || !activities) {
        console.log("Missing data - prompt:", !!prompt, "activities:", !!activities);
        return res.status(400).json({ error: "Missing required analysis data" });
      }

      console.log("Activities count:", activities?.length || 0);
      console.log("Prompt length:", prompt?.length || 0);

      // Use OpenAI to analyze the activities
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      if (!OPENAI_API_KEY) {
        console.log("OpenAI API key not configured");
        return res.status(500).json({ error: "AI service not configured" });
      }

      console.log("Starting OpenAI API call...");

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert early childhood education consultant analyzing activity feedback to identify patterns, concerns, and provide actionable recommendations. Respond with a JSON object containing: summary (string), activityConcerns (array of objects with category, concern, affectedActivities, and severity), recommendations (array of objects with title, description, priority, and actionItems), positiveHighlights (array of strings), and overallScore (number 0-100)."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", errorText);
        return res.status(500).json({ error: "Failed to analyze activities" });
      }

      console.log("OpenAI API call successful");
      const aiResponse = await response.json();
      const analysisText = aiResponse.choices[0].message.content;
      let analysis;
      
      try {
        analysis = JSON.parse(analysisText);
        console.log("Analysis parsed successfully");
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        console.error("Raw AI response:", analysisText);
        return res.status(500).json({ error: "Invalid analysis format received" });
      }

      // Add timestamp to the analysis
      analysis.generatedAt = new Date().toISOString();

      console.log("Sending analysis response to client");
      res.json({ analysis });
    } catch (error) {
      console.error("Activity analysis error:", error);
      res.status(500).json({ error: "Failed to analyze activities" });
    }
  });

  // Get completed activity records with filters - MUST BE BEFORE /:id route
  app.get("/api/activity-records/completed", async (req: AuthenticatedRequest, res) => {
    try {
      // Check user role - only directors and assistant directors can view completed activities
      const role = req.role?.toLowerCase();
      if (role !== 'director' && role !== 'assistant_director' && role !== 'admin' && role !== 'superadmin') {
        return res.status(403).json({ error: "Insufficient permissions to view completed activities" });
      }

      const { locationId, roomId, teacherId, dateFrom, dateTo, minRating, exactRating, materialsUsed } = req.query;
      
      // Validate location access if locationId is provided
      if (locationId) {
        const accessCheck = await validateLocationAccess(req, locationId as string);
        if (!accessCheck.allowed) {
          return res.status(403).json({ error: accessCheck.message });
        }
      }
      
      // Parse filters
      const filters = {
        locationId: locationId as string | undefined,
        roomId: roomId as string | undefined,
        teacherId: teacherId as string | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        minRating: minRating ? parseInt(minRating as string) : undefined,
        exactRating: exactRating ? parseInt(exactRating as string) : undefined,
        materialsUsed: materialsUsed === undefined ? undefined : materialsUsed === 'true'
      };
      
      const completedRecords = await storage.getCompletedActivityRecords(filters);
      
      // Calculate statistics
      const stats = {
        totalActivities: completedRecords.length,
        averageRating: completedRecords.reduce((acc, r) => acc + (r.rating || 0), 0) / (completedRecords.filter(r => r.rating).length || 1),
        materialsUsedCount: completedRecords.filter(r => r.materialsUsed === true).length,
        materialsNotUsedCount: completedRecords.filter(r => r.materialsUsed === false).length,
        materialsUsageRate: completedRecords.filter(r => r.materialsUsed === true).length / (completedRecords.filter(r => r.materialsUsed !== null).length || 1) * 100,
        ratingDistribution: {
          1: completedRecords.filter(r => r.rating === 1).length,
          2: completedRecords.filter(r => r.rating === 2).length,
          3: completedRecords.filter(r => r.rating === 3).length,
          4: completedRecords.filter(r => r.rating === 4).length,
          5: completedRecords.filter(r => r.rating === 5).length,
        }
      };
      
      res.json({
        records: completedRecords,
        stats
      });
    } catch (error) {
      console.error('Error fetching completed activity records:', error);
      res.status(500).json({ error: "Failed to fetch completed activity records" });
    }
  });

  // Export completed activity records to CSV - MUST BE BEFORE /:id route
  app.get("/api/activity-records/export", async (req: AuthenticatedRequest, res) => {
    try {
      // Check user role
      const role = req.role?.toLowerCase();
      if (role !== 'director' && role !== 'assistant_director' && role !== 'admin' && role !== 'superadmin') {
        return res.status(403).json({ error: "Insufficient permissions to export activity records" });
      }

      const { locationId, roomId, dateFrom, dateTo, minRating, exactRating, materialsUsed } = req.query;
      
      // Parse filters
      const filters = {
        locationId: locationId as string | undefined,
        roomId: roomId as string | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        minRating: minRating ? parseInt(minRating as string) : undefined,
        exactRating: exactRating ? parseInt(exactRating as string) : undefined,
        materialsUsed: materialsUsed === undefined ? undefined : materialsUsed === 'true'
      };
      
      const completedRecords = await storage.getCompletedActivityRecords(filters);
      
      // Convert to CSV format
      const csvHeader = [
        'Activity Title',
        'Room',
        'Location',
        'Teacher',
        'Completed Date',
        'Day of Week',
        'Time Slot',
        'Rating',
        'Materials Used',
        'Notes',
        'Material Feedback',
        'Rating Feedback'
      ].join(',');
      
      const csvRows = completedRecords.map((record: any) => {
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const timeSlotNames = ['Morning', 'Mid-Morning', 'Afternoon', 'Late Afternoon', 'Evening'];
        
        return [
          `"${record.activityTitle || ''}"`,
          `"${record.roomName || ''}"`,
          `"${record.locationName || ''}"`,
          `"${record.teacherName || ''}"`,
          record.completedAt ? new Date(record.completedAt).toLocaleDateString() : '',
          dayNames[record.dayOfWeek] || '',
          timeSlotNames[record.timeSlot] || '',
          record.rating || '',
          record.materialsUsed === true ? 'Yes' : record.materialsUsed === false ? 'No' : '',
          `"${record.notes || ''}"`,
          `"${record.materialFeedback || ''}"`,
          `"${record.ratingFeedback || ''}"`
        ].join(',');
      });
      
      const csv = [csvHeader, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="completed-activities-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error('Error exporting activity records:', error);
      res.status(500).json({ error: "Failed to export activity records" });
    }
  });

  app.get("/api/activity-records/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const record = await storage.getActivityRecord(id);
      
      if (!record) {
        return res.status(404).json({ error: "Activity record not found" });
      }
      
      res.json(record);
    } catch (error) {
      console.error('Error fetching activity record:', error);
      res.status(500).json({ error: "Failed to fetch activity record" });
    }
  });

  app.patch("/api/activity-records/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updates = insertActivityRecordSchema.partial().parse(req.body);
      
      const record = await storage.updateActivityRecord(id, updates);
      if (!record) {
        return res.status(404).json({ error: "Activity record not found" });
      }
      
      res.json(record);
    } catch (error) {
      console.error('Error updating activity record:', error);
      res.status(400).json({ 
        error: "Invalid activity record data", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.delete("/api/activity-records/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteActivityRecord(id);
      
      if (!success) {
        return res.status(404).json({ error: "Activity record not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting activity record:', error);
      res.status(500).json({ error: "Failed to delete activity record" });
    }
  });

  // Get completed activity records with filters
  app.get("/api/activity-records/completed", async (req: AuthenticatedRequest, res) => {
    try {
      // Check user role - only directors and assistant directors can view completed activities
      const role = req.role?.toLowerCase();
      if (role !== 'director' && role !== 'assistant_director' && role !== 'admin' && role !== 'superadmin') {
        return res.status(403).json({ error: "Insufficient permissions to view completed activities" });
      }

      const { locationId, roomId, dateFrom, dateTo, minRating, exactRating, materialsUsed } = req.query;
      
      // Validate location access if locationId is provided
      if (locationId) {
        const accessCheck = await validateLocationAccess(req, locationId as string);
        if (!accessCheck.allowed) {
          return res.status(403).json({ error: accessCheck.message });
        }
      }
      
      // Parse filters
      const filters = {
        locationId: locationId as string | undefined,
        roomId: roomId as string | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        minRating: minRating ? parseInt(minRating as string) : undefined,
        exactRating: exactRating ? parseInt(exactRating as string) : undefined,
        materialsUsed: materialsUsed === undefined ? undefined : materialsUsed === 'true'
      };
      
      const completedRecords = await storage.getCompletedActivityRecords(filters);
      
      // Calculate statistics
      const stats = {
        totalActivities: completedRecords.length,
        averageRating: completedRecords.reduce((acc, r) => acc + (r.rating || 0), 0) / (completedRecords.filter(r => r.rating).length || 1),
        materialsUsedCount: completedRecords.filter(r => r.materialsUsed === true).length,
        materialsNotUsedCount: completedRecords.filter(r => r.materialsUsed === false).length,
        materialsUsageRate: completedRecords.filter(r => r.materialsUsed === true).length / (completedRecords.filter(r => r.materialsUsed !== null).length || 1) * 100,
        ratingDistribution: {
          1: completedRecords.filter(r => r.rating === 1).length,
          2: completedRecords.filter(r => r.rating === 2).length,
          3: completedRecords.filter(r => r.rating === 3).length,
          4: completedRecords.filter(r => r.rating === 4).length,
          5: completedRecords.filter(r => r.rating === 5).length,
        }
      };
      
      res.json({
        records: completedRecords,
        stats
      });
    } catch (error) {
      console.error('Error fetching completed activity records:', error);
      res.status(500).json({ error: "Failed to fetch completed activity records" });
    }
  });

  // Export completed activity records to CSV
  app.get("/api/activity-records/export", async (req: AuthenticatedRequest, res) => {
    try {
      // Check user role
      const role = req.role?.toLowerCase();
      if (role !== 'director' && role !== 'assistant_director' && role !== 'admin' && role !== 'superadmin') {
        return res.status(403).json({ error: "Insufficient permissions to export activity records" });
      }

      const { locationId, roomId, dateFrom, dateTo, minRating, exactRating, materialsUsed } = req.query;
      
      // Parse filters
      const filters = {
        locationId: locationId as string | undefined,
        roomId: roomId as string | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        minRating: minRating ? parseInt(minRating as string) : undefined,
        exactRating: exactRating ? parseInt(exactRating as string) : undefined,
        materialsUsed: materialsUsed === undefined ? undefined : materialsUsed === 'true'
      };
      
      const completedRecords = await storage.getCompletedActivityRecords(filters);
      
      // Convert to CSV format
      const csvHeader = [
        'Activity Title',
        'Room',
        'Location',
        'Teacher',
        'Completed Date',
        'Week Start',
        'Day of Week',
        'Time Slot',
        'Rating',
        'Materials Used',
        'Notes',
        'Rating Feedback',
        'Material Feedback'
      ].join(',');
      
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const timeSlotNames = ['Morning', 'Mid-Morning', 'Afternoon', 'Late Afternoon', 'Evening'];
      
      const csvRows = completedRecords.map(record => {
        const completedDate = record.completedAt ? new Date(record.completedAt).toLocaleDateString() : '';
        const weekStart = record.weekStart ? new Date(record.weekStart).toLocaleDateString() : '';
        const dayOfWeek = dayNames[record.dayOfWeek] || '';
        const timeSlot = timeSlotNames[record.timeSlot] || '';
        
        return [
          `"${record.activityTitle || ''}"`,
          `"${record.roomName || ''}"`,
          `"${record.locationName || ''}"`,
          `"${record.teacherName || ''}"`,
          completedDate,
          weekStart,
          dayOfWeek,
          timeSlot,
          record.rating || '',
          record.materialsUsed === true ? 'Yes' : record.materialsUsed === false ? 'No' : '',
          `"${(record.notes || '').replace(/"/g, '""')}"`,
          `"${(record.ratingFeedback || '').replace(/"/g, '""')}"`,
          `"${(record.materialFeedback || '').replace(/"/g, '""')}"`
        ].join(',');
      });
      
      const csv = [csvHeader, ...csvRows].join('\n');
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="completed-activities-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error('Error exporting activity records:', error);
      res.status(500).json({ error: "Failed to export activity records" });
    }
  });

  // Lesson Plans routes
  app.get("/api/lesson-plans", async (req: AuthenticatedRequest, res) => {
    try {
      const { teacherId, locationId, roomId, scheduleType } = req.query;
      
      // Validate location access if locationId is provided
      if (locationId) {
        const accessCheck = await validateLocationAccess(req, locationId as string);
        if (!accessCheck.allowed) {
          return res.status(403).json({ error: accessCheck.message });
        }
      }
      
      // Get authorized location IDs for filtering
      const authorizedLocationIds = await getUserAuthorizedLocationIds(req);
      
      // Get lesson plans with optional schedule type filter
      let lessonPlans = await storage.getLessonPlans(
        teacherId as string, 
        locationId as string, 
        roomId as string,
        scheduleType as string
      );
      
      // Filter to only authorized locations if no specific location requested
      if (!locationId && authorizedLocationIds.length > 0) {
        lessonPlans = lessonPlans.filter(lp => 
          authorizedLocationIds.includes(lp.locationId)
        );
      }
      
      res.json(lessonPlans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson plans" });
    }
  });

  app.post("/api/lesson-plans", async (req: AuthenticatedRequest, res) => {
    try {
      console.log('[POST /api/lesson-plans] Request body:', req.body);
      console.log('[POST /api/lesson-plans] Auth info:', { tenantId: req.tenantId, userId: req.userId });
      
      // Get current user from storage
      const currentUser = await storage.getUserByUserId(req.userId!);
      if (!currentUser) {
        return res.status(403).json({ error: "User not found" });
      }
      
      // Add teacherId from current user and tenantId
      const dataWithTenantId = {
        ...req.body,
        tenantId: req.tenantId,
        teacherId: currentUser.id  // Add the current user's ID as teacherId
      };
      
      console.log('[POST /api/lesson-plans] Data with tenant ID:', dataWithTenantId);
      const data = insertLessonPlanSchema.parse(dataWithTenantId);
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, data.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      // Check if a lesson plan already exists for this combination
      const existingPlans = await storage.getLessonPlans(
        undefined, // no teacherId filter - lesson plans are shared
        data.locationId,
        data.roomId,
        data.scheduleType
      );
      
      // Filter by matching weekStart date
      const weekStartDate = new Date(data.weekStart);
      weekStartDate.setHours(0, 0, 0, 0);
      
      const existingPlan = existingPlans.find(lp => {
        const lpWeekStart = new Date(lp.weekStart);
        lpWeekStart.setHours(0, 0, 0, 0);
        return lpWeekStart.getTime() === weekStartDate.getTime();
      });
      
      if (existingPlan) {
        console.log('[POST /api/lesson-plans] Found existing lesson plan:', existingPlan.id);
        // Return the existing lesson plan instead of creating a duplicate
        res.status(200).json(existingPlan);
      } else {
        console.log('[POST /api/lesson-plans] Creating new lesson plan');
        // Create a new lesson plan without teacherId (it's shared)
        const lessonPlan = await storage.createLessonPlan(data);
        res.status(201).json(lessonPlan);
      }
    } catch (error) {
      console.error('[POST /api/lesson-plans] Validation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid lesson plan data", 
          details: error.errors 
        });
      }
      res.status(400).json({ error: "Invalid lesson plan data" });
    }
  });

  app.put("/api/lesson-plans/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const data = insertLessonPlanSchema.partial().parse(req.body);
      
      // Get existing lesson plan to check location access
      const existing = await storage.getLessonPlan(id);
      if (!existing) {
        return res.status(404).json({ error: "Lesson plan not found" });
      }
      
      // Validate access to existing location
      const accessCheck = await validateLocationAccess(req, existing.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      // If changing location, validate access to new location
      if (data.locationId && data.locationId !== existing.locationId) {
        const newAccessCheck = await validateLocationAccess(req, data.locationId);
        if (!newAccessCheck.allowed) {
          return res.status(403).json({ error: `Cannot move to location: ${newAccessCheck.message}` });
        }
      }
      
      const lessonPlan = await storage.updateLessonPlan(id, data);
      res.json(lessonPlan);
    } catch (error) {
      res.status(400).json({ error: "Invalid lesson plan data" });
    }
  });

  // Scheduled Activities routes
  app.get("/api/scheduled-activities/:roomId", async (req: AuthenticatedRequest, res) => {
    try {
      const { roomId } = req.params;
      const { weekStart, locationId, lessonPlanId } = req.query;
      
      console.log('[GET /api/scheduled-activities] Params:', { roomId, weekStart, locationId, lessonPlanId });
      
      // Get all scheduled activities for this room
      const allScheduledActivities = await storage.getAllScheduledActivities();
      
      // Filter lesson plans by week, location, and room if weekStart is provided
      let lessonPlanIds: string[] = [];
      
      // If a specific lessonPlanId is provided (e.g., when revising a rejected plan), use it directly
      if (lessonPlanId) {
        lessonPlanIds = [lessonPlanId as string];
        console.log('[GET /api/scheduled-activities] Using specific lesson plan ID:', lessonPlanId);
      } else if (weekStart && locationId) {
        // Get tenant settings to determine current schedule type for this location
        const orgSettings = await storage.getTenantSettings();
        let currentScheduleType: 'time-based' | 'position-based' = 'time-based'; // default
        
        if (orgSettings && orgSettings.locationSettings) {
          const locationSettings = orgSettings.locationSettings[locationId as string];
          if (locationSettings && locationSettings.scheduleType) {
            currentScheduleType = locationSettings.scheduleType as 'time-based' | 'position-based';
          } else if (orgSettings.defaultScheduleType) {
            currentScheduleType = orgSettings.defaultScheduleType as 'time-based' | 'position-based';
          }
        }
        
        const allLessonPlans = await storage.getLessonPlans();
        
        // Filter lesson plans by the week start date, location, room AND schedule type
        const weekLessonPlans = allLessonPlans.filter(lp => {
          // Parse the dates and compare only the date part (not time)
          const lpWeekStart = new Date(lp.weekStart);
          const requestedWeekStart = new Date(weekStart as string);
          
          // Set both dates to start of day for comparison
          lpWeekStart.setHours(0, 0, 0, 0);
          requestedWeekStart.setHours(0, 0, 0, 0);
          
          const matchesWeek = lpWeekStart.getTime() === requestedWeekStart.getTime();
          const matchesLocation = lp.locationId === locationId;
          const matchesRoom = lp.roomId === roomId;
          const matchesScheduleType = lp.scheduleType === currentScheduleType;
          
          console.log('[GET /api/scheduled-activities] Checking lesson plan:', {
            lpId: lp.id,
            lpWeekStart: lpWeekStart.toISOString(),
            requestedWeekStart: requestedWeekStart.toISOString(),
            lpLocation: lp.locationId,
            lpRoom: lp.roomId,
            lpScheduleType: lp.scheduleType,
            currentScheduleType,
            matchesWeek,
            matchesLocation,
            matchesRoom,
            matchesScheduleType
          });
          
          return matchesWeek && matchesLocation && matchesRoom && matchesScheduleType;
        });
        
        // IMPORTANT: When multiple lesson plans exist, select the one with activities
        if (weekLessonPlans.length > 0) {
          // If there are multiple lesson plans, check which ones have activities
          const plansWithActivityCount = await Promise.all(
            weekLessonPlans.map(async (lp) => {
              const activities = allScheduledActivities.filter(sa => 
                sa.lessonPlanId === lp.id && sa.tenantId === req.tenantId
              );
              return { plan: lp, activityCount: activities.length };
            })
          );
          
          // Sort by activity count (descending) and then by created_at for consistency
          plansWithActivityCount.sort((a, b) => {
            if (b.activityCount !== a.activityCount) {
              return b.activityCount - a.activityCount; // More activities first
            }
            // If same activity count, use the more recent one
            return b.plan.createdAt > a.plan.createdAt ? 1 : -1;
          });
          
          const selectedPlan = plansWithActivityCount[0].plan;
          lessonPlanIds = [selectedPlan.id];
          console.log(`[GET /api/scheduled-activities] Found ${weekLessonPlans.length} lesson plans, selected plan with ${plansWithActivityCount[0].activityCount} activities:`, selectedPlan.id);
        } else {
          console.log('[GET /api/scheduled-activities] No matching lesson plans found');
        }
      }
      
      // Filter by room, tenant, and optionally by lesson plan (week)
      const roomScheduledActivities = allScheduledActivities.filter(sa => {
        const matchesRoom = sa.roomId === roomId;
        const matchesTenant = sa.tenantId === req.tenantId;
        const matchesWeek = !weekStart || lessonPlanIds.includes(sa.lessonPlanId);
        return matchesRoom && matchesTenant && matchesWeek;
      });
      
      console.log('[GET /api/scheduled-activities] Filtered activities count:', roomScheduledActivities.length);
      
      // Populate activity data for each scheduled activity
      const populatedActivities = await Promise.all(
        roomScheduledActivities.map(async (sa) => {
          const activity = await storage.getActivity(sa.activityId);
          const enrichedActivity = activity as any;
          
          // Get any existing activity records for this scheduled activity
          const activityRecords = await storage.getActivityRecords(sa.id);
          
          console.log('[GET /api/scheduled-activities] Activity data for', sa.activityId, ':', {
            hasActivity: !!activity,
            hasMilestones: !!(enrichedActivity?.milestones),
            milestonesCount: enrichedActivity?.milestones?.length || 0,
            hasMaterials: !!(enrichedActivity?.materials),
            materialsCount: enrichedActivity?.materials?.length || 0,
            hasAgeGroups: !!(enrichedActivity?.ageGroups),
            ageGroupsCount: enrichedActivity?.ageGroups?.length || 0,
            hasSteps: !!(enrichedActivity?.steps),
            stepsCount: enrichedActivity?.steps?.length || 0,
            activityTitle: activity?.title,
            milestoneIds: activity?.milestoneIds,
            materialIds: activity?.materialIds
          });
          return {
            ...sa,
            activity,
            activityRecords: activityRecords || []
          };
        })
      );
      
      res.json(populatedActivities);
    } catch (error) {
      console.error('Error fetching scheduled activities:', error);
      res.status(500).json({ error: "Failed to fetch scheduled activities" });
    }
  });

  app.get("/api/lesson-plans/:lessonPlanId/scheduled-activities", async (req, res) => {
    try {
      const { lessonPlanId } = req.params;
      const { locationId, roomId } = req.query;
      const scheduledActivities = await storage.getScheduledActivities(
        lessonPlanId,
        locationId as string,
        roomId as string
      );
      res.json(scheduledActivities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scheduled activities" });
    }
  });

  app.post("/api/scheduled-activities", async (req: AuthenticatedRequest, res) => {
    try {
      let { lessonPlanId, weekStart, ...otherData } = req.body;
      
      console.log('[POST /api/scheduled-activities] Request body:', { lessonPlanId, weekStart, ...otherData });
      
      // If no lesson plan ID provided, try to find or create one
      if (!lessonPlanId && otherData.locationId && otherData.roomId) {
        // Determine the week start date
        let targetWeekStart: Date;
        if (weekStart) {
          targetWeekStart = new Date(weekStart);
        } else {
          // Default to current week if not provided
          targetWeekStart = new Date();
          const dayOfWeek = targetWeekStart.getDay();
          const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          targetWeekStart.setDate(targetWeekStart.getDate() + daysToMonday);
        }
        targetWeekStart.setHours(0, 0, 0, 0);
        
        console.log('[POST /api/scheduled-activities] Target week start:', targetWeekStart.toISOString());
        
        // Get tenant settings to determine schedule type for this location
        const orgSettings = await storage.getTenantSettings();
        let currentScheduleType: 'time-based' | 'position-based' = 'time-based'; // default
        
        if (orgSettings && orgSettings.locationSettings) {
          const locationSettings = orgSettings.locationSettings[otherData.locationId];
          if (locationSettings && locationSettings.scheduleType) {
            currentScheduleType = locationSettings.scheduleType as 'time-based' | 'position-based';
          } else if (orgSettings.defaultScheduleType) {
            currentScheduleType = orgSettings.defaultScheduleType as 'time-based' | 'position-based';
          }
        }
        
        // First try to find existing lesson plan for this week/location/room with matching schedule type
        const allLessonPlans = await storage.getLessonPlans();
        const existingLessonPlan = allLessonPlans.find(lp => {
          const lpWeekStart = new Date(lp.weekStart);
          lpWeekStart.setHours(0, 0, 0, 0);
          
          return lpWeekStart.getTime() === targetWeekStart.getTime() &&
                 lp.locationId === otherData.locationId &&
                 lp.roomId === otherData.roomId &&
                 lp.tenantId === req.tenantId &&
                 lp.scheduleType === currentScheduleType;
        });
        
        if (existingLessonPlan) {
          console.log('[POST /api/scheduled-activities] Found existing lesson plan:', existingLessonPlan.id);
          lessonPlanId = existingLessonPlan.id;
        } else {
          // Create new lesson plan if none exists
          console.log('[POST /api/scheduled-activities] Creating new lesson plan');
          
          // Use the authenticated user as the teacher
          let teacherId = req.userId || 'default-teacher';
          
          // Try to get existing user by ID
          let teacher = await storage.getUser(teacherId);
          
          if (!teacher) {
            // Get or create a user from the JWT information
            const currentUser = await storage.getUserByUserId(req.userId!);
            if (currentUser) {
              teacherId = currentUser.id;
            } else {
              // This shouldn't happen in normal flow, but handle it
              console.error('[POST /api/scheduled-activities] User not found for userId:', req.userId);
              return res.status(403).json({ error: "User not found" });
            }
          }
          
          // Use the already fetched schedule type from above
          const lessonPlan = await storage.createLessonPlan({
            tenantId: req.tenantId!,
            locationId: otherData.locationId,
            roomId: otherData.roomId,
            teacherId: teacherId,
            weekStart: targetWeekStart.toISOString(),
            scheduleType: currentScheduleType,
            status: 'draft'
          });
          
          console.log('[POST /api/scheduled-activities] Created lesson plan:', lessonPlan.id);
          lessonPlanId = lessonPlan.id;
        }
      }
      
      // Now create the scheduled activity with the lesson plan ID
      const data = insertScheduledActivitySchema.parse({
        ...otherData,
        lessonPlanId,
        tenantId: req.tenantId
      });
      
      const scheduledActivity = await storage.createScheduledActivity(data);
      res.status(201).json(scheduledActivity);
    } catch (error) {
      console.error('Error creating scheduled activity:', error);
      res.status(400).json({ error: "Invalid scheduled activity data" });
    }
  });

  app.put("/api/scheduled-activities/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const data = insertScheduledActivitySchema.partial().parse(req.body);
      
      // Get existing scheduled activity to check location access
      const existing = await storage.getScheduledActivity(id);
      if (!existing) {
        return res.status(404).json({ error: "Scheduled activity not found" });
      }
      
      // Validate access to existing location
      const accessCheck = await validateLocationAccess(req, existing.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      // If changing location, validate access to new location
      if (data.locationId && data.locationId !== existing.locationId) {
        const newAccessCheck = await validateLocationAccess(req, data.locationId);
        if (!newAccessCheck.allowed) {
          return res.status(403).json({ error: `Cannot move to location: ${newAccessCheck.message}` });
        }
      }
      
      const scheduledActivity = await storage.updateScheduledActivity(id, data);
      res.json(scheduledActivity);
    } catch (error) {
      res.status(400).json({ error: "Invalid scheduled activity data" });
    }
  });

  // PATCH endpoint for partial updates (like drag and drop moves)
  app.patch("/api/scheduled-activities/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const data = insertScheduledActivitySchema.partial().parse(req.body);
      
      console.log('[PATCH /api/scheduled-activities] Updating activity:', id, 'with data:', data);
      
      // Get existing scheduled activity to check location access
      const existing = await storage.getScheduledActivity(id);
      if (!existing) {
        return res.status(404).json({ error: "Scheduled activity not found" });
      }
      
      // Validate access to existing location
      const accessCheck = await validateLocationAccess(req, existing.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      // If changing location, validate access to new location
      if (data.locationId && data.locationId !== existing.locationId) {
        const newAccessCheck = await validateLocationAccess(req, data.locationId);
        if (!newAccessCheck.allowed) {
          return res.status(403).json({ error: `Cannot move to location: ${newAccessCheck.message}` });
        }
      }
      
      const scheduledActivity = await storage.updateScheduledActivity(id, data);
      res.json(scheduledActivity);
    } catch (error) {
      console.error('[PATCH /api/scheduled-activities] Error:', error);
      res.status(400).json({ error: "Invalid scheduled activity data" });
    }
  });

  app.delete("/api/scheduled-activities/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      // Get scheduled activity to check location access
      const scheduledActivity = await storage.getScheduledActivity(id);
      if (!scheduledActivity) {
        return res.status(404).json({ error: "Scheduled activity not found" });
      }
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, scheduledActivity.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      const deleted = await storage.deleteScheduledActivity(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scheduled activity" });
    }
  });

  // Lesson Plan Review API Routes
  app.post("/api/lesson-plans/:id/submit", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      // Get lesson plan to check access
      const lessonPlan = await storage.getLessonPlan(id);
      if (!lessonPlan) {
        return res.status(404).json({ error: "Lesson plan not found" });
      }
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, lessonPlan.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }

      // Get current user from storage
      const currentUser = await storage.getUserByUserId(req.userId!);
      if (!currentUser) {
        return res.status(403).json({ error: "User not found" });
      }
      
      // Check if user's role has auto-approval permissions
      const role = req.role?.toLowerCase();
      const autoApproveRoles = ['assistant_director', 'director', 'admin', 'superadmin'];
      
      if (role && autoApproveRoles.includes(role)) {
        // Auto-approve for roles with auto-approval permission
        const approved = await storage.approveLessonPlan(id, currentUser.id, "Auto-approved");
        res.json(approved);
      } else {
        // Submit for review for roles requiring approval
        const submitted = await storage.submitLessonPlanForReview(id, currentUser.id);
        res.json(submitted);
      }
    } catch (error) {
      console.error('Error submitting lesson plan:', error);
      res.status(500).json({ error: "Failed to submit lesson plan" });
    }
  });

  // Check for existing lesson plans before copying
  app.post("/api/lesson-plans/check-existing", async (req: AuthenticatedRequest, res) => {
    try {
      const { roomIds, weekStarts } = req.body;
      
      if (!roomIds || !weekStarts || !roomIds.length || !weekStarts.length) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const existingPlans = [];
      
      for (const roomId of roomIds) {
        for (const weekStart of weekStarts) {
          const existingPlan = await storage.getLessonPlanByRoomAndWeek(
            roomId,
            weekStart
          );
          
          if (existingPlan) {
            // Get room name
            const room = await storage.getRoom(roomId);
            existingPlans.push({
              lessonPlanId: existingPlan.id,
              roomId: roomId,
              roomName: room?.name || 'Unknown Room',
              weekStart: weekStart,
              status: existingPlan.status
            });
          }
        }
      }
      
      res.json({ existingPlans });
    } catch (error) {
      console.error('Error checking existing lesson plans:', error);
      res.status(500).json({ error: "Failed to check existing lesson plans" });
    }
  });
  
  // Copy lesson plan to other rooms
  app.post("/api/lesson-plans/copy", async (req: AuthenticatedRequest, res) => {
    try {
      const { sourceLessonPlanId, targetRoomIds, targetWeekStarts, overwrite } = req.body;
      
      if (!sourceLessonPlanId || !targetRoomIds || !targetWeekStarts || 
          !targetRoomIds.length || !targetWeekStarts.length) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Check if user has permission to copy lesson plans
      // This would be enhanced with proper permission checking based on tenant overrides
      const role = req.role?.toLowerCase();
      const copyAllowedRoles = ['teacher', 'assistant_director', 'director', 'admin', 'superadmin'];
      
      if (!role || !copyAllowedRoles.includes(role)) {
        return res.status(403).json({ error: "Insufficient permissions to copy lesson plans" });
      }
      
      // Get source lesson plan
      const sourceLessonPlan = await storage.getLessonPlan(sourceLessonPlanId);
      if (!sourceLessonPlan) {
        return res.status(404).json({ error: "Source lesson plan not found" });
      }
      
      // Check if source lesson plan is approved
      if (sourceLessonPlan.status !== 'approved') {
        return res.status(400).json({ error: "Only approved lesson plans can be copied" });
      }
      
      // Validate location access for source
      const sourceAccessCheck = await validateLocationAccess(req, sourceLessonPlan.locationId);
      if (!sourceAccessCheck.allowed) {
        return res.status(403).json({ error: sourceAccessCheck.message });
      }
      
      // Get all scheduled activities for source lesson plan
      const sourceActivities = await storage.getScheduledActivities(
        sourceLessonPlanId,
        sourceLessonPlan.locationId,
        sourceLessonPlan.roomId
      );
      
      const copiedPlans = [];
      
      // Copy to each target room and week combination
      const skippedPlans = [];
      
      for (const targetRoomId of targetRoomIds) {
        // Get room to ensure it exists and is in the same location
        const room = await storage.getRoom(targetRoomId);
        if (!room) {
          console.warn(`Room ${targetRoomId} not found, skipping`);
          continue;
        }
        
        if (room.locationId !== sourceLessonPlan.locationId) {
          console.warn(`Room ${targetRoomId} is in a different location, skipping`);
          continue;
        }
        
        for (const targetWeekStart of targetWeekStarts) {
          // Check if a lesson plan already exists for this room and week
          const existingPlans = await storage.getLessonPlans();
          const existingPlan = existingPlans.find(lp => {
            const lpWeekStart = new Date(lp.weekStart);
            const targetWeek = new Date(targetWeekStart);
            lpWeekStart.setHours(0, 0, 0, 0);
            targetWeek.setHours(0, 0, 0, 0);
            
            return lpWeekStart.getTime() === targetWeek.getTime() &&
                   lp.locationId === sourceLessonPlan.locationId &&
                   lp.roomId === targetRoomId &&
                   lp.scheduleType === sourceLessonPlan.scheduleType;
          });
          
          if (existingPlan && !overwrite) {
            skippedPlans.push({
              roomId: targetRoomId,
              roomName: room.name,
              weekStart: targetWeekStart
            });
            continue;
          }
          
          // If overwriting, delete the existing plan and its activities first
          if (existingPlan && overwrite) {
            // Delete scheduled activities for the existing plan
            const existingActivities = await storage.getScheduledActivities(existingPlan.id);
            for (const activity of existingActivities) {
              await storage.deleteScheduledActivity(activity.id);
            }
            // Delete the existing lesson plan
            await storage.deleteLessonPlan(existingPlan.id);
          }
          
          // Create new lesson plan with basic fields
          console.log('[COPY] Creating new lesson plan for room:', targetRoomId, 'week:', targetWeekStart);
          console.log('[COPY] Source lesson plan status:', sourceLessonPlan.status);
          console.log('[COPY] Source submittedBy:', sourceLessonPlan.submittedBy);
          console.log('[COPY] Current user ID (req.userId):', req.userId);
          
          // Look up the actual user ID (UUID) from the user_id since foreign keys reference users.id
          const currentUser = req.userId ? await storage.getUserByUserId(req.userId) : undefined;
          const actualUserId = currentUser ? currentUser.id : req.userId;
          console.log('[COPY] Actual user UUID:', actualUserId);
          
          const newLessonPlan = await storage.createLessonPlan({
            tenantId: req.tenantId!,
            locationId: sourceLessonPlan.locationId,
            roomId: targetRoomId,
            teacherId: actualUserId || sourceLessonPlan.teacherId,
            weekStart: targetWeekStart,
            scheduleType: sourceLessonPlan.scheduleType,
            status: sourceLessonPlan.status, // Preserve the approval status
            submittedBy: actualUserId // Always use current user UUID as submittedBy for copied plans
          });
          
          console.log('[COPY] Created lesson plan:', newLessonPlan.id, 'with status:', newLessonPlan.status);
          
          // Update the lesson plan with approval fields if source was approved or submitted
          if (sourceLessonPlan.status === 'approved' || sourceLessonPlan.status === 'submitted') {
            console.log('[COPY] Updating approval fields for:', newLessonPlan.id);
            const updateResult = await storage.updateLessonPlanApprovalFields(newLessonPlan.id, {
              submittedAt: sourceLessonPlan.submittedAt || new Date(),
              submittedBy: actualUserId, // Always use current user UUID as submittedBy for copied plans
              approvedAt: sourceLessonPlan.approvedAt,
              approvedBy: sourceLessonPlan.approvedBy || (sourceLessonPlan.status === 'approved' ? actualUserId : null),
              reviewNotes: sourceLessonPlan.reviewNotes ? `Copied from approved plan: ${sourceLessonPlan.reviewNotes}` : 'Copied from approved plan'
            });
            console.log('[COPY] Update result:', updateResult);
          }
          
          // Copy all scheduled activities
          for (const activity of sourceActivities) {
            await storage.createScheduledActivity({
              tenantId: req.tenantId!,
              lessonPlanId: newLessonPlan.id,
              activityId: activity.activityId,
              locationId: sourceLessonPlan.locationId,
              roomId: targetRoomId,
              dayOfWeek: activity.dayOfWeek,
              timeSlot: activity.timeSlot,
              notes: activity.notes
            });
          }
          
          copiedPlans.push({
            lessonPlanId: newLessonPlan.id,
            roomId: targetRoomId,
            roomName: room.name,
            weekStart: targetWeekStart
          });
        }
      }
      
      res.json({
        success: true,
        copiedCount: copiedPlans.length,
        skippedCount: skippedPlans.length,
        copiedPlans,
        skippedPlans
      });
      
    } catch (error) {
      console.error('Error copying lesson plan:', error);
      res.status(500).json({ error: "Failed to copy lesson plan" });
    }
  });
  
  // Withdraw lesson plan from review or approved status
  app.post("/api/lesson-plans/:id/withdraw", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      // Get lesson plan to check access
      const lessonPlan = await storage.getLessonPlan(id);
      if (!lessonPlan) {
        return res.status(404).json({ error: "Lesson plan not found" });
      }
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, lessonPlan.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }

      // Check if lesson plan is in submitted or approved status
      if (lessonPlan.status !== 'submitted' && lessonPlan.status !== 'approved') {
        return res.status(400).json({ error: "Only submitted or approved lesson plans can be withdrawn" });
      }

      // Withdraw from review/approved (set status back to draft)
      const withdrawn = await storage.withdrawLessonPlanFromReview(id);
      res.json(withdrawn);
    } catch (error) {
      console.error('Error withdrawing lesson plan:', error);
      res.status(500).json({ error: "Failed to withdraw lesson plan" });
    }
  });

  app.post("/api/lesson-plans/:id/approve", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      // Check user role
      const role = req.role?.toLowerCase();
      if (role !== 'director' && role !== 'assistant_director' && role !== 'admin' && role !== 'superadmin') {
        return res.status(403).json({ error: "Insufficient permissions to approve lesson plans" });
      }
      
      // Get lesson plan to check access
      const lessonPlan = await storage.getLessonPlan(id);
      if (!lessonPlan) {
        return res.status(404).json({ error: "Lesson plan not found" });
      }
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, lessonPlan.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }

      // Get current user from storage
      const currentUser = await storage.getUserByUserId(req.userId!);
      if (!currentUser) {
        return res.status(403).json({ error: "User not found" });
      }
      
      const approved = await storage.approveLessonPlan(id, currentUser.id, notes);
      res.json(approved);
    } catch (error) {
      console.error('Error approving lesson plan:', error);
      res.status(500).json({ error: "Failed to approve lesson plan" });
    }
  });

  app.post("/api/lesson-plans/:id/reject", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      // Check user role
      const role = req.role?.toLowerCase();
      if (role !== 'director' && role !== 'assistant_director' && role !== 'admin' && role !== 'superadmin') {
        return res.status(403).json({ error: "Insufficient permissions to reject lesson plans" });
      }
      
      if (!notes) {
        return res.status(400).json({ error: "Review notes are required when rejecting" });
      }
      
      // Get lesson plan to check access
      const lessonPlan = await storage.getLessonPlan(id);
      if (!lessonPlan) {
        return res.status(404).json({ error: "Lesson plan not found" });
      }
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, lessonPlan.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }

      // Get current user from storage
      const currentUser = await storage.getUserByUserId(req.userId!);
      if (!currentUser) {
        return res.status(403).json({ error: "User not found" });
      }
      
      const rejected = await storage.rejectLessonPlan(id, currentUser.id, notes);
      res.json(rejected);
    } catch (error) {
      console.error('Error rejecting lesson plan:', error);
      res.status(500).json({ error: "Failed to reject lesson plan" });
    }
  });

  app.get("/api/lesson-plans/review", async (req: AuthenticatedRequest, res) => {
    try {
      // Check user role
      const role = req.role?.toLowerCase();
      if (role !== 'director' && role !== 'assistant_director' && role !== 'admin' && role !== 'superadmin') {
        return res.status(403).json({ error: "Insufficient permissions to view lesson plans for review" });
      }
      
      // Get user's authorized location IDs
      const authorizedLocationIds = await getUserAuthorizedLocationIds(req);
      
      // Get lesson plans for review
      const allPlansForReview = await storage.getLessonPlansForReview();
      
      // Filter to only authorized locations
      const filteredPlans = allPlansForReview.filter(plan => 
        authorizedLocationIds.includes(plan.locationId)
      );
      
      res.json(filteredPlans);
    } catch (error) {
      console.error('Error fetching lesson plans for review:', error);
      res.status(500).json({ error: "Failed to fetch lesson plans for review" });
    }
  });

  // Notifications API Routes
  app.get("/api/notifications", async (req: AuthenticatedRequest, res) => {
    try {
      // Get current user from storage
      const currentUser = await storage.getUserByUserId(req.userId!);
      if (!currentUser) {
        return res.status(403).json({ error: "User not found" });
      }

      // Get active (non-dismissed) notifications for the user
      const notifications = await storage.getActiveNotifications(currentUser.id);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/dismiss", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      // Get current user from storage
      const currentUser = await storage.getUserByUserId(req.userId!);
      if (!currentUser) {
        return res.status(403).json({ error: "User not found" });
      }

      // Dismiss the notification
      const dismissed = await storage.dismissNotification(id, currentUser.id);
      if (!dismissed) {
        return res.status(404).json({ error: "Notification not found or already dismissed" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error dismissing notification:', error);
      res.status(500).json({ error: "Failed to dismiss notification" });
    }
  });

  app.post("/api/notifications/:id/mark-read", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      // Get current user from storage
      const currentUser = await storage.getUserByUserId(req.userId!);
      if (!currentUser) {
        return res.status(403).json({ error: "User not found" });
      }

      // Mark notification as read
      const marked = await storage.markNotificationAsRead(id, currentUser.id);
      if (!marked) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Settings API Routes - Locations
  app.get("/api/locations", async (req: AuthenticatedRequest, res) => {
    try {
      const locations = await storage.getLocations();
      
      // SuperAdmin gets access to all locations
      if (req.role === 'SuperAdmin') {
        res.json(locations);
        return;
      }
      
      // Filter locations to only those the user has access to
      // Check both location ID and name for backward compatibility
      const filteredLocations = locations.filter(loc => 
        req.locations && (
          req.locations.includes(loc.id) || 
          req.locations.includes(loc.name)
        )
      );
      
      res.json(filteredLocations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  app.post("/api/locations", async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(data);
      res.status(201).json(location);
    } catch (error) {
      console.error("Location creation error:", error);
      res.status(400).json({ error: "Invalid location data" });
    }
  });

  app.put("/api/locations/:id", async (req, res) => {
    try {
      const data = insertLocationSchema.partial().parse(req.body);
      const location = await storage.updateLocation(req.params.id, data);
      if (location) {
        res.json(location);
      } else {
        res.status(404).json({ error: "Location not found" });
      }
    } catch (error) {
      res.status(400).json({ error: "Invalid location data" });
    }
  });

  app.delete("/api/locations/:id", async (req, res) => {
    try {
      const success = await storage.deleteLocation(req.params.id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Location not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete location" });
    }
  });

  // Get settings for a specific location
  app.get("/api/locations/:id/settings", async (req: AuthenticatedRequest, res) => {
    try {
      const { id: locationId } = req.params;
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      // Get tenant settings
      const orgSettings = await storage.getTenantSettings();
      if (!orgSettings) {
        return res.json({
          scheduleType: 'time-based',
          startTime: '06:00',
          endTime: '18:00',
          slotsPerDay: 8
        });
      }
      
      // Get location-specific settings or fall back to defaults
      let locationSettings: any = {};
      if (orgSettings.locationSettings && orgSettings.locationSettings[locationId]) {
        locationSettings = orgSettings.locationSettings[locationId];
      }
      
      // Return merged settings with fallbacks
      const settings = {
        scheduleType: locationSettings.scheduleType || orgSettings.defaultScheduleType || 'time-based',
        startTime: locationSettings.startTime || orgSettings.defaultStartTime || '06:00',
        endTime: locationSettings.endTime || orgSettings.defaultEndTime || '18:00',
        slotsPerDay: locationSettings.slotsPerDay || orgSettings.defaultSlotsPerDay || 8
      };
      
      res.json(settings);
    } catch (error) {
      console.error("Location settings fetch error:", error);
      res.status(500).json({ error: "Failed to fetch location settings" });
    }
  });

  // Settings API Routes - Rooms  
  app.get("/api/rooms", async (req: AuthenticatedRequest, res) => {
    try {
      const rooms = await storage.getRooms();
      
      // Get authorized location IDs
      const authorizedLocationIds = await getUserAuthorizedLocationIds(req);
      
      // Filter rooms to only those in authorized locations
      const filteredRooms = rooms.filter(room => 
        authorizedLocationIds.includes(room.locationId)
      );
      
      res.json(filteredRooms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  app.post("/api/rooms", async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertRoomSchema.parse(req.body);
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, data.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      const room = await storage.createRoom(data);
      res.status(201).json(room);
    } catch (error) {
      console.error("Room creation error:", error);
      res.status(400).json({ error: "Invalid room data" });
    }
  });

  app.put("/api/rooms/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const data = insertRoomSchema.partial().parse(req.body);
      
      // Get existing room to check location access
      const existingRoom = await storage.getRoom(id);
      if (!existingRoom) {
        return res.status(404).json({ error: "Room not found" });
      }
      
      // Validate access to existing location
      const existingAccessCheck = await validateLocationAccess(req, existingRoom.locationId);
      if (!existingAccessCheck.allowed) {
        return res.status(403).json({ error: existingAccessCheck.message });
      }
      
      // If location is being changed, validate access to new location
      if (data.locationId && data.locationId !== existingRoom.locationId) {
        const newAccessCheck = await validateLocationAccess(req, data.locationId);
        if (!newAccessCheck.allowed) {
          return res.status(403).json({ error: newAccessCheck.message });
        }
      }
      
      const room = await storage.updateRoom(id, data);
      if (room) {
        res.json(room);
      } else {
        res.status(404).json({ error: "Room not found" });
      }
    } catch (error) {
      console.error("Room update error:", error);
      res.status(400).json({ error: "Invalid room data" });
    }
  });

  app.delete("/api/rooms/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      // Get room to check location access
      const room = await storage.getRoom(id);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, room.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      const success = await storage.deleteRoom(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Room not found" });
      }
    } catch (error) {
      console.error("Room deletion error:", error);
      res.status(500).json({ error: "Failed to delete room" });
    }
  });

  // Settings API Routes - Categories
  app.get("/api/categories", async (req: AuthenticatedRequest, res) => {
    try {
      const { locationId } = req.query;
      
      // Validate location access if locationId is provided
      if (locationId) {
        const accessCheck = await validateLocationAccess(req, locationId as string);
        if (!accessCheck.allowed) {
          return res.status(403).json({ error: accessCheck.message });
        }
      }
      
      // Get authorized location IDs
      const authorizedLocationIds = await getUserAuthorizedLocationIds(req);
      
      // Get categories
      let categories = locationId 
        ? await storage.getCategoriesByLocation(locationId as string)
        : await storage.getCategories();
      
      // Filter to only authorized locations if no specific location requested
      if (!locationId && authorizedLocationIds.length > 0) {
        categories = categories.filter(c => 
          authorizedLocationIds.includes(c.locationId)
        );
      }
      
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req: AuthenticatedRequest, res) => {
    try {
      console.log('[POST /api/categories] Request body:', req.body);
      console.log('[POST /api/categories] Request tenantId:', req.tenantId);
      console.log('[POST /api/categories] Request userId:', req.userId);
      
      if (!req.tenantId) {
        console.error('[POST /api/categories] No tenantId in authenticated request!');
        return res.status(401).json({ error: "Tenant context required" });
      }
      
      // Don't accept tenantId from body, use it from the authenticated request
      const { tenantId: bodyTenantId, ...bodyWithoutTenant } = req.body;
      
      // Add the tenantId from the authenticated request
      const dataWithTenant = {
        ...bodyWithoutTenant,
        tenantId: req.tenantId // Use the authenticated tenant ID
      };
      
      console.log('[POST /api/categories] Data with tenant:', dataWithTenant);
      
      // Validate the complete data with tenantId
      const validatedData = insertCategorySchema.parse(dataWithTenant);
      console.log('[POST /api/categories] Validated data:', validatedData);
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, validatedData.locationId);
      if (!accessCheck.allowed) {
        console.log('[POST /api/categories] Location access denied:', accessCheck.message);
        return res.status(403).json({ error: accessCheck.message });
      }
      
      const category = await storage.createCategory(validatedData);
      console.log('[POST /api/categories] Category created successfully:', category);
      res.status(201).json(category);
    } catch (error: any) {
      console.error('[POST /api/categories] Error creating category:', error);
      if (error instanceof Error) {
        console.error('[POST /api/categories] Error message:', error.message);
        console.error('[POST /api/categories] Error stack:', error.stack);
      }
      if (error?.issues) {
        console.error('[POST /api/categories] Validation issues:', JSON.stringify(error.issues, null, 2));
        error.issues.forEach((issue: any) => {
          console.error(`[POST /api/categories] Field '${issue.path.join('.')}' - ${issue.message}`);
        });
      }
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { locationId } = req.query;
      const updates = req.body;
      const category = await storage.updateCategory(id, updates, locationId as string);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { locationId } = req.query;
      const success = await storage.deleteCategory(id, locationId as string);
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Settings API Routes - Age Groups
  app.get("/api/age-groups", async (req: AuthenticatedRequest, res) => {
    try {
      const { locationId } = req.query;
      console.log("Age groups API called with locationId:", locationId, "tenantId:", req.tenantId);
      
      // Validate location access if locationId is provided
      if (locationId) {
        const accessCheck = await validateLocationAccess(req, locationId as string);
        if (!accessCheck.allowed) {
          return res.status(403).json({ error: accessCheck.message });
        }
      }
      
      // Get authorized location IDs
      const authorizedLocationIds = await getUserAuthorizedLocationIds(req);
      
      // Get age groups
      let ageGroups = await storage.getAgeGroups(locationId as string);
      
      // Filter to only authorized locations if no specific location requested
      if (!locationId && authorizedLocationIds.length > 0) {
        ageGroups = ageGroups.filter(ag => 
          authorizedLocationIds.includes(ag.locationId)
        );
      }
      
      console.log("Found age groups:", ageGroups.length);
      res.json(ageGroups);
    } catch (error) {
      console.error("Age groups API error:", error);
      res.status(500).json({ error: "Failed to fetch age groups" });
    }
  });

  app.post("/api/age-groups", async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertAgeGroupSchema.parse(req.body);
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, data.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      const ageGroup = await storage.createAgeGroup(data);
      res.status(201).json(ageGroup);
    } catch (error) {
      console.error("Age group creation error:", error);
      res.status(400).json({ error: "Invalid age group data", details: error });
    }
  });

  app.put("/api/age-groups/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { locationId } = req.query;
      const updates = req.body;
      const ageGroup = await storage.updateAgeGroup(id, updates, locationId as string);
      if (!ageGroup) {
        return res.status(404).json({ error: "Age group not found" });
      }
      res.json(ageGroup);
    } catch (error) {
      res.status(500).json({ error: "Failed to update age group" });
    }
  });

  app.delete("/api/age-groups/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { locationId } = req.query;
      const success = await storage.deleteAgeGroup(id, locationId as string);
      if (!success) {
        return res.status(404).json({ error: "Age group not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete age group" });
    }
  });

  // Parent API Routes
  app.get("/api/parent/lesson-plans", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { weekStart, roomId } = req.query;
      
      if (!tenantId || !userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // For parent view, we'll need to determine which room(s) to show
      // For now, we'll fetch all approved lesson plans for all rooms in authorized locations
      const authorizedLocationIds = await getUserAuthorizedLocationIds(req);
      
      // Get lesson plans that are approved
      const allLessonPlans = await storage.getLessonPlansForReview();
      
      // Filter to only approved plans in authorized locations
      let filteredPlans = allLessonPlans.filter((plan: any) => 
        plan.status === 'approved' && authorizedLocationIds.includes(plan.locationId)
      );
      
      // If roomId is provided, filter to only that room
      if (roomId) {
        filteredPlans = filteredPlans.filter((plan: any) => 
          plan.roomId === roomId
        );
      }
      
      // If weekStart is provided, filter to only that week
      if (weekStart) {
        filteredPlans = filteredPlans.filter((plan: any) => 
          plan.weekStart === weekStart || plan.weekStart.startsWith(weekStart as string)
        );
      }
      
      // Enrich with activities and related data
      const enrichedPlans = await Promise.all(filteredPlans.map(async (plan: any) => {
        // Get scheduled activities for this lesson plan
        const scheduledActivities = await storage.getScheduledActivities(plan.id);
        
        // Get room and location details (already included in getLessonPlansForReview response)
        const room = plan.room || await storage.getRoom(plan.roomId);
        const location = plan.location || await storage.getLocation(plan.locationId);
        
        // Enrich activities with related data
        const enrichedActivities = await Promise.all(scheduledActivities.map(async (scheduledActivity: any) => {
          const activity = await storage.getActivity(scheduledActivity.activityId);
          const activityRecords = await storage.getActivityRecords(scheduledActivity.id);
          
          // Get milestones and materials from the activity (not scheduled activity)
          const milestones = activity?.milestoneIds && activity.milestoneIds.length > 0
            ? await Promise.all(activity.milestoneIds.map((id: string) => storage.getMilestone(id)))
            : [];
          
          const materials = activity?.materialIds && activity.materialIds.length > 0
            ? await Promise.all(activity.materialIds.map((id: string) => storage.getMaterial(id)))
            : [];
          
          // Get activity steps from the enriched activity data (instructions field)
          const steps = (activity as any)?.steps || activity?.instructions || [];
          
          // Check if activity is completed (has any records)
          const isCompleted = activityRecords && activityRecords.length > 0;
          const avgRating = isCompleted && activityRecords.length > 0
            ? activityRecords.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / activityRecords.length
            : undefined;
          
          // Get category details - activity.category contains category name, need to find by name
          let category = null;
          if (activity?.category) {
            try {
              // First try to get by ID (in case it's an ID)
              category = await storage.getCategory(activity.category);
              
              // If that fails, try to find by name
              if (!category) {
                const categories = await storage.getCategories();
                category = categories.find((c: any) => c.name === activity.category);
              }
            } catch (error) {
              console.log(`Failed to fetch category for ${activity.category}:`, error);
            }
          }
          
          // Get duration from activity (activities have duration field)
          const duration = activity?.duration || null;

          return {
            id: scheduledActivity.id,
            title: activity?.title || 'Untitled Activity',
            description: activity?.description,
            imageUrl: activity?.imageUrl,
            categoryId: activity?.category,
            category: category ? {
              id: category.id,
              name: category.name,
              color: category.color || '#2BABE2'
            } : null,
            dayOfWeek: scheduledActivity.dayOfWeek,
            position: scheduledActivity.timeSlot, // Use timeSlot as position
            startTime: null, // Position-based schedule doesn't have specific times
            endTime: null,
            duration: duration,
            completed: isCompleted,
            rating: avgRating ? Math.round(avgRating) : undefined,
            milestones: milestones.filter(m => m).map(m => ({
              id: m!.id,
              name: m!.title, // Map database 'title' field to 'name' for frontend
              description: m!.description
            })),
            materials: materials.filter(m => m).map(m => ({
              id: m!.id,
              name: m!.name,
              photoUrl: m!.photoUrl
            })),
            steps: Array.isArray(steps) ? steps.map((s: any, index: number) => ({
              orderIndex: s.orderIndex !== undefined ? s.orderIndex : index,
              instruction: s.instruction || s
            })) : []
          };
        }));
        
        return {
          id: plan.id,
          weekStart: plan.weekStart,
          status: plan.status,
          approvedAt: plan.approvedAt,
          scheduleType: plan.scheduleType,
          activities: enrichedActivities,
          room: room ? { id: room.id, name: room.name } : undefined,
          location: location ? { id: location.id, name: location.name } : undefined
        };
      }));
      
      res.json(enrichedPlans);
    } catch (error) {
      console.error("Parent lesson plans fetch error:", error);
      res.status(500).json({ error: "Failed to fetch lesson plans" });
    }
  });

  // Organization Settings API Routes
  app.get("/api/organization-settings", async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await storage.getTenantSettings();
      
      // Get all locations for this tenant to include in response
      const locations = await storage.getLocations();
      
      // Return default settings if none exist
      if (!settings) {
        return res.json({
          locationSettings: {},
          defaultScheduleType: 'time-based',
          defaultStartTime: '06:00',
          defaultEndTime: '18:00',
          defaultSlotsPerDay: 8,
          weekStartDay: 1,
          autoSaveInterval: 5,
          enableNotifications: true,
          locations: locations // Include locations for UI
        });
      }
      
      res.json({
        ...settings,
        locations: locations // Include locations for UI
      });
    } catch (error) {
      console.error("Organization settings fetch error:", error);
      res.status(500).json({ error: "Failed to fetch organization settings" });
    }
  });

  app.put("/api/organization-settings", async (req: AuthenticatedRequest, res) => {
    try {
      const updates = req.body;
      const settings = await storage.updateTenantSettings(updates);
      
      // Get all locations for response
      const locations = await storage.getLocations();
      
      res.json({
        ...settings,
        locations: locations
      });
    } catch (error) {
      console.error("Organization settings update error:", error);
      res.status(400).json({ error: "Invalid settings data" });
    }
  });
  
  // Permission Management Routes
  
  // Get all permission overrides for the organization
  app.get("/api/permissions/overrides", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: "Tenant context required" });
      }
      
      // Get all overrides for this tenant directly from database
      const overrides = await storage.getTenantPermissionOverrides(tenantId);
      
      res.json(overrides);
    } catch (error) {
      console.error("Permission overrides fetch error:", error);
      res.status(500).json({ error: "Failed to fetch permission overrides" });
    }
  });
  
  // Create a new permission override
  app.post("/api/permissions/overrides", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("POST /api/permissions/overrides - Request body:", req.body);
      console.log("User role:", req.role);
      
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: "Tenant context required" });
      }
      
      // Only admin and superadmin can manage permissions
      const userRole = req.role?.toLowerCase();
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        console.log("Permission denied - User role:", req.role);
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const validation = insertTenantPermissionOverrideSchema.safeParse(req.body);
      if (!validation.success) {
        console.log("Validation failed:", validation.error);
        return res.status(400).json({ error: "Invalid permission override data", details: validation.error });
      }
      
      console.log("Creating permission override:", validation.data);
      const override = await storage.createTenantPermissionOverride({
        ...validation.data,
        tenantId: tenantId
      });
      
      console.log("Permission override created:", override);
      res.json(override);
    } catch (error) {
      console.error("Permission override creation error:", error);
      res.status(500).json({ error: "Failed to create permission override" });
    }
  });
  
  // Update a permission override
  app.patch("/api/permissions/overrides/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("PATCH /api/permissions/overrides/:id - ID:", req.params.id);
      console.log("Request body:", req.body);
      console.log("User role:", req.role);
      
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: "Tenant context required" });
      }
      
      // Only admin and superadmin can manage permissions
      const userRole = req.role?.toLowerCase();
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        console.log("Permission denied - User role:", req.role);
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const { id } = req.params;
      // Remove timestamp fields and id from updates
      const { createdAt, updatedAt, id: bodyId, ...updates } = req.body;
      
      console.log("Updating permission override:", id, updates);
      const override = await storage.updateTenantPermissionOverride(id, updates);
      
      if (!override) {
        console.log("Permission override not found:", id);
        return res.status(404).json({ error: "Permission override not found" });
      }
      
      console.log("Permission override updated:", override);
      res.json(override);
    } catch (error) {
      console.error("Permission override update error:", error);
      res.status(500).json({ error: "Failed to update permission override" });
    }
  });
  
  // Check user permission for a specific action
  app.post("/api/permissions/check", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: "Tenant context required" });
      }
      
      const { resource, action } = req.body;
      if (!resource || !action) {
        return res.status(400).json({ error: "Resource and action are required" });
      }
      
      const permission = await storage.checkUserPermission(
        req.userId || '',
        req.role || '',
        resource,
        action,
        tenantId
      );
      
      res.json(permission);
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Failed to check permission" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
