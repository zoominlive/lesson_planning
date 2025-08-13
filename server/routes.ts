import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  type AuthenticatedRequest, 
  generateDevelopmentToken, 
  authenticateToken,
  validateLocationAccess,
  getUserAuthorizedLocationIds 
} from "./auth-middleware";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { materialStorage } from "./materialStorage";
import { activityStorage } from "./activityStorage";
import { perplexityService } from "./perplexityService";
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
  insertTenantPermissionOverrideSchema
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
      const imagePath = path.join(process.cwd(), 'public', 'materials-images', filename);
      
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

  app.post("/api/materials", async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertMaterialSchema.parse(req.body);
      
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
      res.status(400).json({ error: "Invalid material data" });
    }
  });

  app.put("/api/materials/:id", async (req: AuthenticatedRequest, res) => {
    console.log('[PUT /api/materials] Starting update for ID:', req.params.id);
    console.log('[PUT /api/materials] Request body:', req.body);
    console.log('[PUT /api/materials] Auth info:', { tenantId: req.tenantId, userId: req.userId });
    
    try {
      const { id } = req.params;
      const data = insertMaterialSchema.partial().parse(req.body);
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

  app.delete("/api/materials/:id", async (req: AuthenticatedRequest, res) => {
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

  app.post("/api/activities", async (req: AuthenticatedRequest, res) => {
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

  app.put("/api/activities/:id", async (req: AuthenticatedRequest, res) => {
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

  app.delete("/api/activities/:id", async (req: AuthenticatedRequest, res) => {
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

  // Generate activity using AI
  app.post('/api/activities/generate', async (req: AuthenticatedRequest, res) => {
    try {
      const { ageGroupId, ageGroupName, ageRange, category, isQuiet, locationId } = req.body;
      
      if (!ageGroupName || !category || isQuiet === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Generate activity using Perplexity AI
      const generatedActivity = await perplexityService.generateActivity({
        ageGroup: ageGroupName,
        category,
        isQuiet,
        ageRange: ageRange || { start: 2, end: 5 }
      });

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
        imagePrompt: generatedActivity.imagePrompt
      };

      res.json(transformedActivity);
    } catch (error) {
      console.error('Activity generation error:', error);
      res.status(500).json({ error: 'Failed to generate activity. Please try again.' });
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
      const { weekStart, locationId } = req.query;
      
      console.log('[GET /api/scheduled-activities] Params:', { roomId, weekStart, locationId });
      
      // Get all scheduled activities for this room
      const allScheduledActivities = await storage.getAllScheduledActivities();
      
      // Filter lesson plans by week, location, and room if weekStart is provided
      let lessonPlanIds: string[] = [];
      if (weekStart && locationId) {
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
          return {
            ...sa,
            activity
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

  // Withdraw lesson plan from review
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

      // Check if lesson plan is in submitted status
      if (lessonPlan.status !== 'submitted') {
        return res.status(400).json({ error: "Only submitted lesson plans can be withdrawn from review" });
      }

      // Withdraw from review (set status back to draft)
      const withdrawn = await storage.withdrawLessonPlanFromReview(id);
      res.json(withdrawn);
    } catch (error) {
      console.error('Error withdrawing lesson plan:', error);
      res.status(500).json({ error: "Failed to withdraw lesson plan from review" });
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
      const data = insertCategorySchema.parse(req.body);
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, data.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Category creation error:", error);
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
