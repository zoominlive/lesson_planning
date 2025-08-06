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
  type Tenant,
  type InsertTenant,
  type TokenSecret,
  type InsertTokenSecret,
  users,
  milestones,
  materials,
  activities,
  lessonPlans,
  scheduledActivities,
  tenants,
  tokenSecrets,
  insertTenantSchema,
  insertTokenSecretSchema
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Re-importing schema to use it within the class
import * as schema from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Milestones
  getMilestones(tenantId?: string): Promise<Milestone[]>;
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
  getLessonPlans(teacherId?: string, tenantId?: string): Promise<LessonPlan[]>;
  getLessonPlan(id: string): Promise<LessonPlan | undefined>;
  createLessonPlan(lessonPlan: InsertLessonPlan): Promise<LessonPlan>;
  updateLessonPlan(id: string, lessonPlan: Partial<InsertLessonPlan>): Promise<LessonPlan | undefined>;
  deleteLessonPlan(id: string): Promise<boolean>;

  // Scheduled Activities
  getScheduledActivities(lessonPlanId: string): Promise<ScheduledActivity[]>;
  createScheduledActivity(scheduledActivity: InsertScheduledActivity): Promise<ScheduledActivity>;
  updateScheduledActivity(id: string, scheduledActivity: Partial<InsertScheduledActivity>): Promise<ScheduledActivity | undefined>;
  deleteScheduledActivity(id: string): Promise<boolean>;

  // Tenant Management
  createTenant(data: InsertTenant): Promise<Tenant>;
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenants(): Promise<Tenant[]>;
  updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant | undefined>;

  // Token Secrets Management
  createTokenSecret(data: InsertTokenSecret): Promise<TokenSecret>;
  getTokenSecret(tenantId: string): Promise<TokenSecret | undefined>;
  updateTokenSecret(tenantId: string, data: Partial<InsertTokenSecret>): Promise<TokenSecret | undefined>;
}

export class DatabaseStorage implements IStorage {
  private db = db; // Make db accessible within the class

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Milestones
  async getMilestones(tenantId?: string): Promise<Milestone[]> {
    // Milestones might be shared across tenants or tenant-specific
    // For now, returning all milestones as per the original logic, but a tenantId filter could be added here if needed.
    return await this.db.select().from(milestones);
  }

  async getMilestone(id: string): Promise<Milestone | undefined> {
    const [milestone] = await this.db.select().from(milestones).where(eq(milestones.id, id));
    return milestone || undefined;
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const [milestone] = await this.db
      .insert(milestones)
      .values(insertMilestone)
      .returning();
    return milestone;
  }

  async updateMilestone(id: string, updates: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const [milestone] = await this.db
      .update(milestones)
      .set(updates)
      .where(eq(milestones.id, id))
      .returning();
    return milestone || undefined;
  }

  async deleteMilestone(id: string): Promise<boolean> {
    const result = await this.db.delete(milestones).where(eq(milestones.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Materials
  async getMaterials(): Promise<Material[]> {
    return await this.db.select().from(materials);
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    const [material] = await this.db.select().from(materials).where(eq(materials.id, id));
    return material || undefined;
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const [material] = await this.db
      .insert(materials)
      .values(insertMaterial)
      .returning();
    return material;
  }

  async updateMaterial(id: string, updates: Partial<InsertMaterial>): Promise<Material | undefined> {
    const [material] = await this.db
      .update(materials)
      .set(updates)
      .where(eq(materials.id, id))
      .returning();
    return material || undefined;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const result = await this.db.delete(materials).where(eq(materials.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return await this.db.select().from(activities);
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const [activity] = await this.db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await this.db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async updateActivity(id: string, updates: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [activity] = await this.db
      .update(activities)
      .set(updates)
      .where(eq(activities.id, id))
      .returning();
    return activity || undefined;
  }

  async deleteActivity(id: string): Promise<boolean> {
    const result = await this.db.delete(activities).where(eq(activities.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Lesson Plans
  async getLessonPlans(teacherId?: string, tenantId?: string): Promise<LessonPlan[]> {
    let query = this.db.select().from(lessonPlans);

    // lessonPlans table has direct tenantId column, so filter directly
    if (tenantId) {
      query = query.where(eq(lessonPlans.tenantId, tenantId));
    }

    if (teacherId) {
      query = query.where(eq(lessonPlans.teacherId, teacherId));
    }

    return await query;
  }

  async getLessonPlan(id: string): Promise<LessonPlan | undefined> {
    const [lessonPlan] = await this.db.select().from(lessonPlans).where(eq(lessonPlans.id, id));
    return lessonPlan || undefined;
  }

  async createLessonPlan(insertLessonPlan: InsertLessonPlan): Promise<LessonPlan> {
    const [lessonPlan] = await this.db
      .insert(lessonPlans)
      .values(insertLessonPlan)
      .returning();
    return lessonPlan;
  }

  async updateLessonPlan(id: string, updates: Partial<InsertLessonPlan>): Promise<LessonPlan | undefined> {
    const [lessonPlan] = await this.db
      .update(lessonPlans)
      .set(updates)
      .where(eq(lessonPlans.id, id))
      .returning();
    return lessonPlan || undefined;
  }

  async deleteLessonPlan(id: string): Promise<boolean> {
    const result = await this.db.delete(lessonPlans).where(eq(lessonPlans.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Scheduled Activities
  async getScheduledActivities(lessonPlanId: string): Promise<ScheduledActivity[]> {
    return await this.db.select().from(scheduledActivities).where(eq(scheduledActivities.lessonPlanId, lessonPlanId));
  }

  async createScheduledActivity(insertScheduledActivity: InsertScheduledActivity): Promise<ScheduledActivity> {
    const [scheduledActivity] = await this.db
      .insert(scheduledActivities)
      .values(insertScheduledActivity)
      .returning();
    return scheduledActivity;
  }

  async updateScheduledActivity(id: string, updates: Partial<InsertScheduledActivity>): Promise<ScheduledActivity | undefined> {
    const [scheduledActivity] = await this.db
      .update(scheduledActivities)
      .set(updates)
      .where(eq(scheduledActivities.id, id))
      .returning();
    return scheduledActivity || undefined;
  }

  async deleteScheduledActivity(id: string): Promise<boolean> {
    const result = await this.db.delete(scheduledActivities).where(eq(scheduledActivities.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Tenant Management
  async createTenant(data: InsertTenant): Promise<Tenant> {
    const [tenant] = await this.db.insert(tenants).values(data).returning();
    return tenant;
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await this.db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenants(): Promise<Tenant[]> {
    return await this.db.select().from(tenants).where(eq(tenants.isActive, true));
  }

  async updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const [tenant] = await this.db.update(tenants).set(data).where(eq(tenants.id, id)).returning();
    return tenant;
  }

  // Token Secrets Management
  async createTokenSecret(data: InsertTokenSecret): Promise<TokenSecret> {
    const [tokenSecret] = await this.db.insert(tokenSecrets).values(data).returning();
    return tokenSecret;
  }

  async getTokenSecret(tenantId: string): Promise<TokenSecret | undefined> {
    const [tokenSecret] = await this.db.select().from(tokenSecrets)
      .where(eq(tokenSecrets.tenantId, tenantId) && eq(tokenSecrets.isActive, true));
    return tokenSecret;
  }

  async updateTokenSecret(tenantId: string, data: Partial<InsertTokenSecret>): Promise<TokenSecret | undefined> {
    const [tokenSecret] = await this.db.update(tokenSecrets).set(data)
      .where(eq(tokenSecrets.tenantId, tenantId)).returning();
    return tokenSecret;
  }
}

export const storage = new DatabaseStorage();