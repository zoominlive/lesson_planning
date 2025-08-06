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
  tokenSecrets
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Re-importing schema to use it within the class
import * as schema from "@shared/schema";

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

  // JWT/Tenant Management
  getTenant(id: string): Promise<Tenant | undefined>;
  getTokenSecret(tenantId: string): Promise<TokenSecret | undefined>;
}

export class DatabaseStorage implements IStorage {
  private db = db;
  private tenantId: string | null = null;

  setTenantContext(tenantId: string) {
    this.tenantId = tenantId;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const conditions = [eq(users.id, id)];
    if (this.tenantId) conditions.push(eq(users.tenantId, this.tenantId));
    
    const [user] = await this.db.select().from(users).where(and(...conditions));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const conditions = [eq(users.username, username)];
    if (this.tenantId) conditions.push(eq(users.tenantId, this.tenantId));
    
    const [user] = await this.db.select().from(users).where(and(...conditions));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userData = this.tenantId ? { ...insertUser, tenantId: this.tenantId } : insertUser;
    const [user] = await this.db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Milestones
  async getMilestones(): Promise<Milestone[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(milestones.tenantId, this.tenantId));
    
    return await this.db.select().from(milestones).where(conditions.length ? and(...conditions) : undefined);
  }

  async getMilestone(id: string): Promise<Milestone | undefined> {
    const conditions = [eq(milestones.id, id)];
    if (this.tenantId) conditions.push(eq(milestones.tenantId, this.tenantId));
    
    const [milestone] = await this.db.select().from(milestones).where(and(...conditions));
    return milestone || undefined;
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const milestoneData = this.tenantId ? { ...insertMilestone, tenantId: this.tenantId } : insertMilestone;
    const [milestone] = await this.db
      .insert(milestones)
      .values(milestoneData)
      .returning();
    return milestone;
  }

  async updateMilestone(id: string, updates: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const conditions = [eq(milestones.id, id)];
    if (this.tenantId) conditions.push(eq(milestones.tenantId, this.tenantId));
    
    const [milestone] = await this.db
      .update(milestones)
      .set(updates)
      .where(and(...conditions))
      .returning();
    return milestone || undefined;
  }

  async deleteMilestone(id: string): Promise<boolean> {
    const conditions = [eq(milestones.id, id)];
    if (this.tenantId) conditions.push(eq(milestones.tenantId, this.tenantId));
    
    const result = await this.db.delete(milestones).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Materials
  async getMaterials(): Promise<Material[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(materials.tenantId, this.tenantId));
    
    return await this.db.select().from(materials).where(conditions.length ? and(...conditions) : undefined);
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    const conditions = [eq(materials.id, id)];
    if (this.tenantId) conditions.push(eq(materials.tenantId, this.tenantId));
    
    const [material] = await this.db.select().from(materials).where(and(...conditions));
    return material || undefined;
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const materialData = this.tenantId ? { ...insertMaterial, tenantId: this.tenantId } : insertMaterial;
    const [material] = await this.db
      .insert(materials)
      .values(materialData)
      .returning();
    return material;
  }

  async updateMaterial(id: string, updates: Partial<InsertMaterial>): Promise<Material | undefined> {
    const conditions = [eq(materials.id, id)];
    if (this.tenantId) conditions.push(eq(materials.tenantId, this.tenantId));
    
    const [material] = await this.db
      .update(materials)
      .set(updates)
      .where(and(...conditions))
      .returning();
    return material || undefined;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const conditions = [eq(materials.id, id)];
    if (this.tenantId) conditions.push(eq(materials.tenantId, this.tenantId));
    
    const result = await this.db.delete(materials).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(activities.tenantId, this.tenantId));
    
    return await this.db.select().from(activities).where(conditions.length ? and(...conditions) : undefined);
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const conditions = [eq(activities.id, id)];
    if (this.tenantId) conditions.push(eq(activities.tenantId, this.tenantId));
    
    const [activity] = await this.db.select().from(activities).where(and(...conditions));
    return activity || undefined;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const activityData = this.tenantId ? { ...insertActivity, tenantId: this.tenantId } : insertActivity;
    const [activity] = await this.db
      .insert(activities)
      .values(activityData)
      .returning();
    return activity;
  }

  async updateActivity(id: string, updates: Partial<InsertActivity>): Promise<Activity | undefined> {
    const conditions = [eq(activities.id, id)];
    if (this.tenantId) conditions.push(eq(activities.tenantId, this.tenantId));
    
    const [activity] = await this.db
      .update(activities)
      .set(updates)
      .where(and(...conditions))
      .returning();
    return activity || undefined;
  }

  async deleteActivity(id: string): Promise<boolean> {
    const conditions = [eq(activities.id, id)];
    if (this.tenantId) conditions.push(eq(activities.tenantId, this.tenantId));
    
    const result = await this.db.delete(activities).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Lesson Plans
  async getLessonPlans(teacherId?: string): Promise<LessonPlan[]> {
    const conditions = [];
    if (teacherId) conditions.push(eq(lessonPlans.teacherId, teacherId));
    if (this.tenantId) conditions.push(eq(lessonPlans.tenantId, this.tenantId));
    
    return await this.db.select().from(lessonPlans).where(conditions.length ? and(...conditions) : undefined);
  }

  async getLessonPlan(id: string): Promise<LessonPlan | undefined> {
    const conditions = [eq(lessonPlans.id, id)];
    if (this.tenantId) conditions.push(eq(lessonPlans.tenantId, this.tenantId));
    
    const [lessonPlan] = await this.db.select().from(lessonPlans).where(and(...conditions));
    return lessonPlan || undefined;
  }

  async createLessonPlan(insertLessonPlan: InsertLessonPlan): Promise<LessonPlan> {
    const lessonPlanData = this.tenantId ? { ...insertLessonPlan, tenantId: this.tenantId } : insertLessonPlan;
    const [lessonPlan] = await this.db
      .insert(lessonPlans)
      .values(lessonPlanData)
      .returning();
    return lessonPlan;
  }

  async updateLessonPlan(id: string, updates: Partial<InsertLessonPlan>): Promise<LessonPlan | undefined> {
    const conditions = [eq(lessonPlans.id, id)];
    if (this.tenantId) conditions.push(eq(lessonPlans.tenantId, this.tenantId));
    
    const [lessonPlan] = await this.db
      .update(lessonPlans)
      .set(updates)
      .where(and(...conditions))
      .returning();
    return lessonPlan || undefined;
  }

  async deleteLessonPlan(id: string): Promise<boolean> {
    const conditions = [eq(lessonPlans.id, id)];
    if (this.tenantId) conditions.push(eq(lessonPlans.tenantId, this.tenantId));
    
    const result = await this.db.delete(lessonPlans).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Scheduled Activities
  async getScheduledActivities(lessonPlanId: string): Promise<ScheduledActivity[]> {
    const conditions = [eq(scheduledActivities.lessonPlanId, lessonPlanId)];
    if (this.tenantId) conditions.push(eq(scheduledActivities.tenantId, this.tenantId));
    
    return await this.db.select().from(scheduledActivities).where(and(...conditions));
  }

  async createScheduledActivity(insertScheduledActivity: InsertScheduledActivity): Promise<ScheduledActivity> {
    const scheduledActivityData = this.tenantId ? { ...insertScheduledActivity, tenantId: this.tenantId } : insertScheduledActivity;
    const [scheduledActivity] = await this.db
      .insert(scheduledActivities)
      .values(scheduledActivityData)
      .returning();
    return scheduledActivity;
  }

  async updateScheduledActivity(id: string, updates: Partial<InsertScheduledActivity>): Promise<ScheduledActivity | undefined> {
    const conditions = [eq(scheduledActivities.id, id)];
    if (this.tenantId) conditions.push(eq(scheduledActivities.tenantId, this.tenantId));
    
    const [scheduledActivity] = await this.db
      .update(scheduledActivities)
      .set(updates)
      .where(and(...conditions))
      .returning();
    return scheduledActivity || undefined;
  }

  async deleteScheduledActivity(id: string): Promise<boolean> {
    const conditions = [eq(scheduledActivities.id, id)];
    if (this.tenantId) conditions.push(eq(scheduledActivities.tenantId, this.tenantId));
    
    const result = await this.db.delete(scheduledActivities).where(and(...conditions));
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
      .where(and(eq(tokenSecrets.tenantId, tenantId), eq(tokenSecrets.isActive, true)));
    return tokenSecret;
  }

  async updateTokenSecret(tenantId: string, data: Partial<InsertTokenSecret>): Promise<TokenSecret | undefined> {
    const [tokenSecret] = await this.db.update(tokenSecrets).set(data)
      .where(eq(tokenSecrets.tenantId, tenantId)).returning();
    return tokenSecret;
  }
}

export const storage = new DatabaseStorage();