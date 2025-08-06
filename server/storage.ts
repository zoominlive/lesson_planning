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
  type InsertScheduledActivity,
  users,
  milestones,
  materials,
  activities,
  lessonPlans,
  scheduledActivities
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Milestones
  async getMilestones(): Promise<Milestone[]> {
    return await db.select().from(milestones);
  }

  async getMilestone(id: string): Promise<Milestone | undefined> {
    const [milestone] = await db.select().from(milestones).where(eq(milestones.id, id));
    return milestone || undefined;
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const [milestone] = await db
      .insert(milestones)
      .values(insertMilestone)
      .returning();
    return milestone;
  }

  async updateMilestone(id: string, updates: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const [milestone] = await db
      .update(milestones)
      .set(updates)
      .where(eq(milestones.id, id))
      .returning();
    return milestone || undefined;
  }

  async deleteMilestone(id: string): Promise<boolean> {
    const result = await db.delete(milestones).where(eq(milestones.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Materials
  async getMaterials(): Promise<Material[]> {
    return await db.select().from(materials);
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material || undefined;
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const [material] = await db
      .insert(materials)
      .values(insertMaterial)
      .returning();
    return material;
  }

  async updateMaterial(id: string, updates: Partial<InsertMaterial>): Promise<Material | undefined> {
    const [material] = await db
      .update(materials)
      .set(updates)
      .where(eq(materials.id, id))
      .returning();
    return material || undefined;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const result = await db.delete(materials).where(eq(materials.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities);
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async updateActivity(id: string, updates: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [activity] = await db
      .update(activities)
      .set(updates)
      .where(eq(activities.id, id))
      .returning();
    return activity || undefined;
  }

  async deleteActivity(id: string): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Lesson Plans
  async getLessonPlans(teacherId?: string): Promise<LessonPlan[]> {
    if (teacherId) {
      return await db.select().from(lessonPlans).where(eq(lessonPlans.teacherId, teacherId));
    }
    return await db.select().from(lessonPlans);
  }

  async getLessonPlan(id: string): Promise<LessonPlan | undefined> {
    const [lessonPlan] = await db.select().from(lessonPlans).where(eq(lessonPlans.id, id));
    return lessonPlan || undefined;
  }

  async createLessonPlan(insertLessonPlan: InsertLessonPlan): Promise<LessonPlan> {
    const [lessonPlan] = await db
      .insert(lessonPlans)
      .values(insertLessonPlan)
      .returning();
    return lessonPlan;
  }

  async updateLessonPlan(id: string, updates: Partial<InsertLessonPlan>): Promise<LessonPlan | undefined> {
    const [lessonPlan] = await db
      .update(lessonPlans)
      .set(updates)
      .where(eq(lessonPlans.id, id))
      .returning();
    return lessonPlan || undefined;
  }

  async deleteLessonPlan(id: string): Promise<boolean> {
    const result = await db.delete(lessonPlans).where(eq(lessonPlans.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Scheduled Activities
  async getScheduledActivities(lessonPlanId: string): Promise<ScheduledActivity[]> {
    return await db.select().from(scheduledActivities).where(eq(scheduledActivities.lessonPlanId, lessonPlanId));
  }

  async createScheduledActivity(insertScheduledActivity: InsertScheduledActivity): Promise<ScheduledActivity> {
    const [scheduledActivity] = await db
      .insert(scheduledActivities)
      .values(insertScheduledActivity)
      .returning();
    return scheduledActivity;
  }

  async updateScheduledActivity(id: string, updates: Partial<InsertScheduledActivity>): Promise<ScheduledActivity | undefined> {
    const [scheduledActivity] = await db
      .update(scheduledActivities)
      .set(updates)
      .where(eq(scheduledActivities.id, id))
      .returning();
    return scheduledActivity || undefined;
  }

  async deleteScheduledActivity(id: string): Promise<boolean> {
    const result = await db.delete(scheduledActivities).where(eq(scheduledActivities.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
