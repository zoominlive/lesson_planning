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
  insertAgeGroupSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Apply authentication middleware to all API routes first
  app.use("/api", (req, res, next) => {
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
          authorizedLocationIds.includes(m.locationId)
        );
      }
      
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  app.post("/api/milestones", async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertMilestoneSchema.parse(req.body);
      
      // Validate that user has access to the location they're creating the milestone in
      const accessCheck = await validateLocationAccess(req, data.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
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
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, milestone.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
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
    try {
      const { id } = req.params;
      const data = insertMaterialSchema.partial().parse(req.body);
      
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
      res.status(400).json({ error: "Invalid material data" });
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

  // Serve static files from public folder
  app.use('/public', express.static('public'));

  // Serve images directly from object storage
  app.get('/storage/materials/:filename', async (req: AuthenticatedRequest, res) => {
    try {
      const { Client } = await import('@replit/object-storage');
      const client = new Client();
      const filename = `materials/${req.params.filename}`;
      
      const data = await client.downloadAsBytes(filename);
      res.set('Content-Type', 'image/png');
      res.send(data);
    } catch (error) {
      console.error('Error serving from object storage:', error);
      res.status(404).send('Image not found');
    }
  });

  // Object storage routes for material photos
  app.post("/api/objects/upload", async (req: AuthenticatedRequest, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
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
    try {
      const data = insertActivitySchema.parse(req.body);
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, data.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      const activity = await storage.createActivity(data);
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ error: "Invalid activity data" });
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

  // Lesson Plans routes
  app.get("/api/lesson-plans", async (req: AuthenticatedRequest, res) => {
    try {
      const { teacherId, locationId, roomId } = req.query;
      
      // Validate location access if locationId is provided
      if (locationId) {
        const accessCheck = await validateLocationAccess(req, locationId as string);
        if (!accessCheck.allowed) {
          return res.status(403).json({ error: accessCheck.message });
        }
      }
      
      // Get authorized location IDs for filtering
      const authorizedLocationIds = await getUserAuthorizedLocationIds(req);
      
      // Get lesson plans
      let lessonPlans = await storage.getLessonPlans(
        teacherId as string, 
        locationId as string, 
        roomId as string
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
      const data = insertLessonPlanSchema.parse(req.body);
      
      // Validate location access
      const accessCheck = await validateLocationAccess(req, data.locationId);
      if (!accessCheck.allowed) {
        return res.status(403).json({ error: accessCheck.message });
      }
      
      const lessonPlan = await storage.createLessonPlan(data);
      res.status(201).json(lessonPlan);
    } catch (error) {
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

  app.post("/api/scheduled-activities", async (req, res) => {
    try {
      const data = insertScheduledActivitySchema.parse(req.body);
      const scheduledActivity = await storage.createScheduledActivity(data);
      res.status(201).json(scheduledActivity);
    } catch (error) {
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

  // Settings API Routes - Locations
  app.get("/api/locations", async (req: AuthenticatedRequest, res) => {
    try {
      const locations = await storage.getLocations();
      
      // Filter locations to only those the user has access to
      const filteredLocations = locations.filter(loc => 
        req.locations && req.locations.includes(loc.name)
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

  const httpServer = createServer(app);
  return httpServer;
}
