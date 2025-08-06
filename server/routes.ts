import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { type AuthenticatedRequest, generateDevelopmentToken, authenticateToken } from "./auth-middleware";
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
  app.get("/api/milestones", async (req, res) => {
    try {
      const { locationId } = req.query;
      const milestones = await storage.getMilestones(locationId as string);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  app.post("/api/milestones", async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertMilestoneSchema.parse(req.body);
      const milestone = await storage.createMilestone(data);
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Milestone creation error:", error);
      res.status(400).json({ error: "Invalid milestone data" });
    }
  });

  app.put("/api/milestones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertMilestoneSchema.partial().parse(req.body);
      const milestone = await storage.updateMilestone(id, data);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      res.json(milestone);
    } catch (error) {
      res.status(400).json({ error: "Invalid milestone data" });
    }
  });

  app.delete("/api/milestones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteMilestone(id);
      if (!deleted) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete milestone" });
    }
  });

  // Materials routes
  app.get("/api/materials", async (req, res) => {
    try {
      const { locationId } = req.query;
      const materials = await storage.getMaterials(locationId as string);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.post("/api/materials", async (req, res) => {
    try {
      const data = insertMaterialSchema.parse(req.body);
      const material = await storage.createMaterial(data);
      res.status(201).json(material);
    } catch (error) {
      res.status(400).json({ error: "Invalid material data" });
    }
  });

  app.put("/api/materials/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertMaterialSchema.partial().parse(req.body);
      const material = await storage.updateMaterial(id, data);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      res.status(400).json({ error: "Invalid material data" });
    }
  });

  app.delete("/api/materials/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteMaterial(id);
      if (!deleted) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete material" });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const { locationId } = req.query;
      const activities = await storage.getActivities(locationId as string);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const data = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(data);
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.put("/api/activities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertActivitySchema.partial().parse(req.body);
      const activity = await storage.updateActivity(id, data);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.delete("/api/activities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteActivity(id);
      if (!deleted) {
        return res.status(404).json({ error: "Activity not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  // Lesson Plans routes
  app.get("/api/lesson-plans", async (req, res) => {
    try {
      const { teacherId, locationId, roomId } = req.query;
      const lessonPlans = await storage.getLessonPlans(
        teacherId as string, 
        locationId as string, 
        roomId as string
      );
      res.json(lessonPlans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson plans" });
    }
  });

  app.post("/api/lesson-plans", async (req, res) => {
    try {
      const data = insertLessonPlanSchema.parse(req.body);
      const lessonPlan = await storage.createLessonPlan(data);
      res.status(201).json(lessonPlan);
    } catch (error) {
      res.status(400).json({ error: "Invalid lesson plan data" });
    }
  });

  app.put("/api/lesson-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertLessonPlanSchema.partial().parse(req.body);
      const lessonPlan = await storage.updateLessonPlan(id, data);
      if (!lessonPlan) {
        return res.status(404).json({ error: "Lesson plan not found" });
      }
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

  app.put("/api/scheduled-activities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertScheduledActivitySchema.partial().parse(req.body);
      const scheduledActivity = await storage.updateScheduledActivity(id, data);
      if (!scheduledActivity) {
        return res.status(404).json({ error: "Scheduled activity not found" });
      }
      res.json(scheduledActivity);
    } catch (error) {
      res.status(400).json({ error: "Invalid scheduled activity data" });
    }
  });

  app.delete("/api/scheduled-activities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteScheduledActivity(id);
      if (!deleted) {
        return res.status(404).json({ error: "Scheduled activity not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scheduled activity" });
    }
  });

  // Settings API Routes - Locations
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
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
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  app.post("/api/rooms", async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertRoomSchema.parse(req.body);
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
      const categories = await storage.getCategories(locationId as string);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
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
      const ageGroups = await storage.getAgeGroups(locationId as string);
      res.json(ageGroups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch age groups" });
    }
  });

  app.post("/api/age-groups", async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertAgeGroupSchema.parse(req.body);
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
