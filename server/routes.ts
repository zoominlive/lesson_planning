import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, generateJwtSecret, type AuthenticatedRequest } from "./auth-middleware";
import { 
  insertMilestoneSchema, 
  insertMaterialSchema, 
  insertActivitySchema, 
  insertLessonPlanSchema,
  insertScheduledActivitySchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // TODO: Tenant management routes will be added when JWT is implemented

  // TODO: Apply authentication middleware when JWT is properly implemented
  // app.use("/api", authenticateToken);
  
  // Milestones routes
  app.get("/api/milestones", async (req, res) => {
    try {
      const milestones = await storage.getMilestones();
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  app.post("/api/milestones", async (req, res) => {
    try {
      const data = insertMilestoneSchema.parse(req.body);
      const milestone = await storage.createMilestone(data);
      res.status(201).json(milestone);
    } catch (error) {
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
      const materials = await storage.getMaterials();
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
      const activities = await storage.getActivities();
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
      const { teacherId } = req.query;
      const lessonPlans = await storage.getLessonPlans(teacherId as string);
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
      const scheduledActivities = await storage.getScheduledActivities(lessonPlanId);
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

  const httpServer = createServer(app);
  return httpServer;
}
