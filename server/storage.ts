import { 
  type User, 
  type InsertUser, 
  type Milestone, 
  type InsertMilestone,
  type Material,
  type InsertMaterial,
  type Activity,
  type InsertActivity,
  type LessonPlan,
  type InsertLessonPlan,
  type ScheduledActivity,
  type InsertScheduledActivity
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Milestones
  getMilestones(): Promise<Milestone[]>;
  getMilestone(id: string): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: string, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: string): Promise<boolean>;

  // Materials
  getMaterials(): Promise<Material[]>;
  getMaterial(id: string): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, material: Partial<InsertMaterial>): Promise<Material | undefined>;
  deleteMaterial(id: string): Promise<boolean>;

  // Activities
  getActivities(): Promise<Activity[]>;
  getActivity(id: string): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<boolean>;

  // Lesson Plans
  getLessonPlans(teacherId?: string): Promise<LessonPlan[]>;
  getLessonPlan(id: string): Promise<LessonPlan | undefined>;
  createLessonPlan(lessonPlan: InsertLessonPlan): Promise<LessonPlan>;
  updateLessonPlan(id: string, lessonPlan: Partial<InsertLessonPlan>): Promise<LessonPlan | undefined>;
  deleteLessonPlan(id: string): Promise<boolean>;

  // Scheduled Activities
  getScheduledActivities(lessonPlanId: string): Promise<ScheduledActivity[]>;
  createScheduledActivity(scheduledActivity: InsertScheduledActivity): Promise<ScheduledActivity>;
  updateScheduledActivity(id: string, scheduledActivity: Partial<InsertScheduledActivity>): Promise<ScheduledActivity | undefined>;
  deleteScheduledActivity(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private milestones: Map<string, Milestone> = new Map();
  private materials: Map<string, Material> = new Map();
  private activities: Map<string, Activity> = new Map();
  private lessonPlans: Map<string, LessonPlan> = new Map();
  private scheduledActivities: Map<string, ScheduledActivity> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed sample milestones
    const sampleMilestones: Milestone[] = [
      {
        id: "milestone-1",
        title: "Shares toys with peers",
        description: "Child willingly shares toys and materials with classmates during play activities, demonstrating early cooperation skills.",
        category: "Social",
        ageRangeStart: 36,
        ageRangeEnd: 48,
        learningObjective: "Develop cooperation and social interaction skills"
      },
      {
        id: "milestone-2",
        title: "Expresses feelings verbally",
        description: "Uses words to communicate basic emotions like happy, sad, angry, or excited instead of only physical reactions.",
        category: "Emotional",
        ageRangeStart: 36,
        ageRangeEnd: 48,
        learningObjective: "Develop emotional vocabulary and self-expression"
      },
      {
        id: "milestone-3",
        title: "Sorts objects by attributes",
        description: "Groups objects by color, size, shape, or function, demonstrating classification skills.",
        category: "Cognitive",
        ageRangeStart: 36,
        ageRangeEnd: 48,
        learningObjective: "Develop logical thinking and categorization skills"
      },
      {
        id: "milestone-4",
        title: "Uses scissors to cut shapes",
        description: "Controls scissors to cut along lines and create simple shapes, showing fine motor development.",
        category: "Physical",
        ageRangeStart: 48,
        ageRangeEnd: 60,
        learningObjective: "Develop fine motor control and hand-eye coordination"
      }
    ];

    sampleMilestones.forEach(milestone => this.milestones.set(milestone.id, milestone));

    // Seed sample materials
    const sampleMaterials: Material[] = [
      {
        id: "material-1",
        name: "Washable Crayons Set",
        description: "Set of 24 washable crayons in assorted colors, perfect for young children's art activities.",
        category: "Art Supplies",
        quantity: 15,
        location: "Art Cabinet A",
        status: "in_stock"
      },
      {
        id: "material-2",
        name: "Picture Book Collection",
        description: "Diverse collection of age-appropriate picture books for story time and independent reading.",
        category: "Books & Reading",
        quantity: 45,
        location: "Reading Corner",
        status: "in_stock"
      },
      {
        id: "material-3",
        name: "Wooden Building Blocks",
        description: "Natural wooden blocks in various shapes and sizes for construction and creative play.",
        category: "Building Materials",
        quantity: 3,
        location: "Block Area",
        status: "low_stock"
      }
    ];

    sampleMaterials.forEach(material => this.materials.set(material.id, material));

    // Seed sample activities
    const sampleActivities: Activity[] = [
      {
        id: "activity-1",
        title: "Morning Circle",
        description: "Interactive circle time where children share experiences, sing songs, and learn about the day ahead.",
        duration: 25,
        ageRangeStart: 36,
        ageRangeEnd: 60,
        teachingObjectives: ["Develop listening skills", "Practice social interaction", "Build routine awareness"],
        milestoneIds: ["milestone-1", "milestone-2"],
        materialIds: ["material-2"],
        instructions: ["Gather children in circle", "Lead welcome song", "Discuss daily activities", "Share and listen time"],
        category: "Social Development",
        videoUrl: null,
        imageUrl: null
      },
      {
        id: "activity-2",
        title: "Finger Painting",
        description: "Children explore colors and textures while developing fine motor skills through guided finger painting activities.",
        duration: 45,
        ageRangeStart: 36,
        ageRangeEnd: 48,
        teachingObjectives: ["Develop fine motor control", "Learn color recognition", "Express creativity"],
        milestoneIds: ["milestone-3", "milestone-4"],
        materialIds: ["material-1"],
        instructions: ["Set up painting area", "Distribute materials", "Demonstrate techniques", "Guide exploration", "Clean up together"],
        category: "Art & Creativity",
        videoUrl: null,
        imageUrl: null
      }
    ];

    sampleActivities.forEach(activity => this.activities.set(activity.id, activity));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Milestones
  async getMilestones(): Promise<Milestone[]> {
    return Array.from(this.milestones.values());
  }

  async getMilestone(id: string): Promise<Milestone | undefined> {
    return this.milestones.get(id);
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const id = randomUUID();
    const milestone: Milestone = { ...insertMilestone, id };
    this.milestones.set(id, milestone);
    return milestone;
  }

  async updateMilestone(id: string, updates: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const milestone = this.milestones.get(id);
    if (!milestone) return undefined;
    
    const updatedMilestone = { ...milestone, ...updates };
    this.milestones.set(id, updatedMilestone);
    return updatedMilestone;
  }

  async deleteMilestone(id: string): Promise<boolean> {
    return this.milestones.delete(id);
  }

  // Materials
  async getMaterials(): Promise<Material[]> {
    return Array.from(this.materials.values());
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    return this.materials.get(id);
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const id = randomUUID();
    const material: Material = { ...insertMaterial, id };
    this.materials.set(id, material);
    return material;
  }

  async updateMaterial(id: string, updates: Partial<InsertMaterial>): Promise<Material | undefined> {
    const material = this.materials.get(id);
    if (!material) return undefined;
    
    const updatedMaterial = { ...material, ...updates };
    this.materials.set(id, updatedMaterial);
    return updatedMaterial;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    return this.materials.delete(id);
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = { ...insertActivity, id };
    this.activities.set(id, activity);
    return activity;
  }

  async updateActivity(id: string, updates: Partial<InsertActivity>): Promise<Activity | undefined> {
    const activity = this.activities.get(id);
    if (!activity) return undefined;
    
    const updatedActivity = { ...activity, ...updates };
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }

  async deleteActivity(id: string): Promise<boolean> {
    return this.activities.delete(id);
  }

  // Lesson Plans
  async getLessonPlans(teacherId?: string): Promise<LessonPlan[]> {
    let plans = Array.from(this.lessonPlans.values());
    if (teacherId) {
      plans = plans.filter(plan => plan.teacherId === teacherId);
    }
    return plans;
  }

  async getLessonPlan(id: string): Promise<LessonPlan | undefined> {
    return this.lessonPlans.get(id);
  }

  async createLessonPlan(insertLessonPlan: InsertLessonPlan): Promise<LessonPlan> {
    const id = randomUUID();
    const lessonPlan: LessonPlan = { 
      ...insertLessonPlan, 
      id,
      submittedAt: null,
      approvedAt: null
    };
    this.lessonPlans.set(id, lessonPlan);
    return lessonPlan;
  }

  async updateLessonPlan(id: string, updates: Partial<InsertLessonPlan>): Promise<LessonPlan | undefined> {
    const lessonPlan = this.lessonPlans.get(id);
    if (!lessonPlan) return undefined;
    
    const updatedLessonPlan = { ...lessonPlan, ...updates };
    this.lessonPlans.set(id, updatedLessonPlan);
    return updatedLessonPlan;
  }

  async deleteLessonPlan(id: string): Promise<boolean> {
    return this.lessonPlans.delete(id);
  }

  // Scheduled Activities
  async getScheduledActivities(lessonPlanId: string): Promise<ScheduledActivity[]> {
    return Array.from(this.scheduledActivities.values())
      .filter(sa => sa.lessonPlanId === lessonPlanId);
  }

  async createScheduledActivity(insertScheduledActivity: InsertScheduledActivity): Promise<ScheduledActivity> {
    const id = randomUUID();
    const scheduledActivity: ScheduledActivity = { ...insertScheduledActivity, id };
    this.scheduledActivities.set(id, scheduledActivity);
    return scheduledActivity;
  }

  async updateScheduledActivity(id: string, updates: Partial<InsertScheduledActivity>): Promise<ScheduledActivity | undefined> {
    const scheduledActivity = this.scheduledActivities.get(id);
    if (!scheduledActivity) return undefined;
    
    const updatedScheduledActivity = { ...scheduledActivity, ...updates };
    this.scheduledActivities.set(id, updatedScheduledActivity);
    return updatedScheduledActivity;
  }

  async deleteScheduledActivity(id: string): Promise<boolean> {
    return this.scheduledActivities.delete(id);
  }
}

export const storage = new MemStorage();
