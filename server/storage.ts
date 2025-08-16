import { 
  type User, 
  type InsertUser, 
  type Milestone, 
  type InsertMilestone,
  type Material,
  type InsertMaterial,
  type MaterialCollection,
  type InsertMaterialCollection,
  type MaterialCollectionItem,
  type InsertMaterialCollectionItem,
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
  type Location,
  type InsertLocation,
  type Room,
  type InsertRoom,
  type Category,
  type InsertCategory,
  type AgeGroup,
  type InsertAgeGroup,
  type TenantSettings,
  type InsertTenantSettings,
  users,
  milestones,
  materials,
  materialCollections,
  materialCollectionItems,
  activities,
  lessonPlans,
  scheduledActivities,
  tenants,
  tokenSecrets,
  locations,
  rooms,
  categories,
  ageGroups,
  tenantSettings,
  type Permission,
  type InsertPermission,
  type Role,
  type InsertRole,
  type RolePermission,
  type InsertRolePermission,
  type TenantPermissionOverride,
  type InsertTenantPermissionOverride,
  type Notification,
  type InsertNotification,
  type ActivityRecord,
  type InsertActivityRecord,
  permissions,
  roles,
  rolePermissions,
  tenantPermissionOverrides,
  notifications,
  activityRecords
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, isNull, inArray } from "drizzle-orm";

// Re-importing schema to use it within the class
import * as schema from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  upsertUserFromToken(tokenData: {
    userId: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    locations: string[];
    fullPayload?: any;
  }): Promise<User>;

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
  
  // Material Collections
  getMaterialCollections(): Promise<MaterialCollection[]>;
  getMaterialCollection(id: string): Promise<MaterialCollection | undefined>;
  createMaterialCollection(collection: InsertMaterialCollection): Promise<MaterialCollection>;
  updateMaterialCollection(id: string, collection: Partial<InsertMaterialCollection>): Promise<MaterialCollection | undefined>;
  deleteMaterialCollection(id: string): Promise<boolean>;
  
  // Material-Collection associations
  getMaterialsByCollection(collectionId: string): Promise<Material[]>;
  getCollectionsByMaterial(materialId: string): Promise<MaterialCollection[]>;
  addMaterialToCollection(materialId: string, collectionId: string): Promise<MaterialCollectionItem>;
  removeMaterialFromCollection(materialId: string, collectionId: string): Promise<boolean>;
  updateMaterialCollections(materialId: string, collectionIds: string[]): Promise<void>;

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
  getLessonPlansForReview(locationId?: string): Promise<any[]>;
  submitLessonPlanForReview(id: string, userId: string): Promise<LessonPlan | undefined>;
  withdrawLessonPlanFromReview(id: string): Promise<LessonPlan | undefined>;
  approveLessonPlan(id: string, userId: string, notes?: string): Promise<LessonPlan | undefined>;
  rejectLessonPlan(id: string, userId: string, notes: string): Promise<LessonPlan | undefined>;
  getLessonPlanByRoomAndWeek(roomId: string, weekStart: string): Promise<LessonPlan | undefined>;
  getScheduledActivitiesByLessonPlan(lessonPlanId: string): Promise<ScheduledActivity[]>;

  // Scheduled Activities
  getScheduledActivities(lessonPlanId: string, locationId?: string, roomId?: string): Promise<ScheduledActivity[]>;
  getAllScheduledActivities(): Promise<ScheduledActivity[]>;
  getScheduledActivity(id: string): Promise<ScheduledActivity | undefined>;
  createScheduledActivity(scheduledActivity: InsertScheduledActivity): Promise<ScheduledActivity>;
  updateScheduledActivity(id: string, scheduledActivity: Partial<InsertScheduledActivity>): Promise<ScheduledActivity | undefined>;
  deleteScheduledActivity(id: string): Promise<boolean>;

  // JWT/Tenant Management
  getTenant(id: string): Promise<Tenant | undefined>;
  getTokenSecret(tenantId: string): Promise<TokenSecret | undefined>;

  // Settings Management
  // Locations
  getLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | undefined>;
  deleteLocation(id: string): Promise<boolean>;

  // Rooms
  getRooms(): Promise<Room[]>;
  getRoomsByLocation(locationId: string): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, room: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: string): Promise<boolean>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategoriesByType(type: string): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Age Groups
  getAgeGroups(): Promise<AgeGroup[]>;
  getAgeGroup(id: string): Promise<AgeGroup | undefined>;
  createAgeGroup(ageGroup: InsertAgeGroup): Promise<AgeGroup>;
  updateAgeGroup(id: string, ageGroup: Partial<InsertAgeGroup>): Promise<AgeGroup | undefined>;
  deleteAgeGroup(id: string): Promise<boolean>;

  // Tenant Settings
  getTenantSettings(): Promise<TenantSettings | undefined>;
  updateTenantSettings(settings: Partial<InsertTenantSettings>): Promise<TenantSettings>;
  
  // Permissions
  getPermissions(): Promise<Permission[]>;
  getPermission(id: string): Promise<Permission | undefined>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  
  // Roles
  getRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined>;
  
  // Role Permissions
  getRolePermissions(roleId: string): Promise<RolePermission[]>;
  addRolePermission(rolePermission: InsertRolePermission): Promise<RolePermission>;
  removeRolePermission(roleId: string, permissionId: string): Promise<boolean>;
  
  // Tenant Permission Overrides
  getTenantPermissionOverride(tenantId: string, permissionName: string): Promise<TenantPermissionOverride | undefined>;
  getTenantPermissionOverrides(tenantId: string): Promise<TenantPermissionOverride[]>;
  createTenantPermissionOverride(override: InsertTenantPermissionOverride): Promise<TenantPermissionOverride>;
  updateTenantPermissionOverride(id: string, override: Partial<InsertTenantPermissionOverride>): Promise<TenantPermissionOverride | undefined>;
  
  // Permission Checking
  checkUserPermission(userId: string, role: string, resource: string, action: string, tenantId: string): Promise<{ hasPermission: boolean; requiresApproval: boolean; reason?: string }>;
  
  // Notifications
  getActiveNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  dismissNotification(notificationId: string, userId: string): Promise<boolean>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<boolean>;
  
  // Activity Records
  getActivityRecords(scheduledActivityId: string): Promise<ActivityRecord[]>;
  getActivityRecord(id: string): Promise<ActivityRecord | undefined>;
  createActivityRecord(activityRecord: InsertActivityRecord): Promise<ActivityRecord>;
  updateActivityRecord(id: string, updates: Partial<InsertActivityRecord>): Promise<ActivityRecord | undefined>;
  deleteActivityRecord(id: string): Promise<boolean>;
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

  async getUserByUserId(userId: string): Promise<User | undefined> {
    const conditions = [eq(users.userId, userId)];
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
    if (!this.tenantId && !insertUser.tenantId) {
      throw new Error('Tenant ID is required to create a user');
    }
    
    const userData = {
      tenantId: insertUser.tenantId || this.tenantId!,
      userId: insertUser.userId,
      username: insertUser.username,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      role: insertUser.role,
      locations: insertUser.locations || [],
      lastTokenPayload: insertUser.lastTokenPayload,
    };
    
    const [user] = await this.db
      .insert(users)
      .values(userData as any)
      .returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const conditions = [eq(users.id, id)];
    if (this.tenantId) conditions.push(eq(users.tenantId, this.tenantId));
    
    const updateValues: any = {};
    if (updateData.userId !== undefined) updateValues.userId = updateData.userId;
    if (updateData.username !== undefined) updateValues.username = updateData.username;
    if (updateData.firstName !== undefined) updateValues.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) updateValues.lastName = updateData.lastName;
    if (updateData.role !== undefined) updateValues.role = updateData.role;
    if (updateData.locations !== undefined) updateValues.locations = updateData.locations;
    if (updateData.lastTokenPayload !== undefined) updateValues.lastTokenPayload = updateData.lastTokenPayload;
    updateValues.updatedAt = new Date();
    
    const [updated] = await this.db
      .update(users)
      .set(updateValues)
      .where(and(...conditions))
      .returning();
    
    return updated || undefined;
  }

  async upsertUserFromToken(tokenData: {
    userId: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    locations: string[];
    fullPayload?: any;
  }): Promise<User> {
    if (!this.tenantId) {
      throw new Error('Tenant context is required for user upsert');
    }

    // Check if user exists by userId
    const existingUser = await this.getUserByUserId(tokenData.userId);
    
    if (existingUser) {
      // Update existing user
      const updated = await this.db
        .update(users)
        .set({
          username: tokenData.username,
          firstName: tokenData.firstName,
          lastName: tokenData.lastName,
          role: tokenData.role,
          locations: tokenData.locations,
          lastLoginDate: new Date(),
          loginCount: sql`${users.loginCount} + 1`,
          lastTokenPayload: tokenData.fullPayload,
          updatedAt: new Date(),
        })
        .where(and(
          eq(users.userId, tokenData.userId),
          eq(users.tenantId, this.tenantId)
        ))
        .returning();
      
      return updated[0];
    } else {
      // Create new user
      const newUser = await this.createUser({
        tenantId: this.tenantId,
        userId: tokenData.userId,
        username: tokenData.username,
        firstName: tokenData.firstName,
        lastName: tokenData.lastName,
        role: tokenData.role,
        locations: tokenData.locations,
        lastTokenPayload: tokenData.fullPayload,
      });
      
      return newUser;
    }
  }

  // Milestones
  async getMilestones(locationId?: string): Promise<Milestone[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(milestones.tenantId, this.tenantId));
    // Only return active, non-deleted milestones
    conditions.push(eq(milestones.status, 'active'));
    conditions.push(isNull(milestones.deletedAt));
    
    let results = await this.db.select().from(milestones).where(and(...conditions));
    
    // Filter by locationId if provided (check if locationId is in locationIds array)
    if (locationId) {
      results = results.filter(m => {
        return m.locationIds && Array.isArray(m.locationIds) && m.locationIds.includes(locationId);
      });
    }
    
    return results;
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
      .values(milestoneData as any)
      .returning();
    return milestone;
  }

  async updateMilestone(id: string, updates: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const conditions = [eq(milestones.id, id)];
    if (this.tenantId) conditions.push(eq(milestones.tenantId, this.tenantId));
    
    const dataToUpdate: any = { 
      ...updates, 
      updatedAt: sql`NOW()`
    };
    if (updates.locationIds) dataToUpdate.locationIds = updates.locationIds;
    
    const [milestone] = await this.db
      .update(milestones)
      .set(dataToUpdate)
      .where(and(...conditions))
      .returning();
    return milestone || undefined;
  }

  async deleteMilestone(id: string): Promise<boolean> {
    const conditions = [eq(milestones.id, id)];
    if (this.tenantId) conditions.push(eq(milestones.tenantId, this.tenantId));
    
    // Soft delete: set status to disabled and deletedAt to current timestamp
    const result = await this.db
      .update(milestones)
      .set({ 
        status: 'disabled',
        deletedAt: sql`NOW()`,
        updatedAt: sql`NOW()`
      })
      .where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Materials - Interface compatible version
  async getMaterials(): Promise<Material[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(materials.tenantId, this.tenantId));
    
    return await this.db.select().from(materials).where(conditions.length ? and(...conditions) : undefined);
  }

  // Extended version for location filtering
  async getMaterialsByLocation(locationId: string): Promise<Material[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(materials.tenantId, this.tenantId));
    
    // For multi-location materials, check if locationId is included in locationIds array
    conditions.push(sql`${materials.locationIds}::jsonb ? ${locationId}`); 
    
    return await this.db.select().from(materials).where(and(...conditions));
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
      .values(materialData as any)
      .returning();
    return material;
  }

  async updateMaterial(id: string, updates: Partial<InsertMaterial>): Promise<Material | undefined> {
    const conditions = [eq(materials.id, id)];
    if (this.tenantId) conditions.push(eq(materials.tenantId, this.tenantId));
    
    const updateData: any = { ...updates };
    if (updates.locationIds) {
      updateData.locationIds = Array.isArray(updates.locationIds) ? updates.locationIds : [];
    }
    if (updates.ageGroups) {
      updateData.ageGroups = Array.isArray(updates.ageGroups) ? updates.ageGroups : [];
    }
    
    const [material] = await this.db
      .update(materials)
      .set(updateData)
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

  // Material Collections
  async getMaterialCollections(): Promise<MaterialCollection[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(materialCollections.tenantId, this.tenantId));
    
    return await this.db.select().from(materialCollections).where(conditions.length ? and(...conditions) : undefined);
  }

  async getMaterialCollection(id: string): Promise<MaterialCollection | undefined> {
    const conditions = [eq(materialCollections.id, id)];
    if (this.tenantId) conditions.push(eq(materialCollections.tenantId, this.tenantId));
    
    const [collection] = await this.db.select().from(materialCollections).where(and(...conditions));
    return collection || undefined;
  }

  async createMaterialCollection(insertCollection: InsertMaterialCollection): Promise<MaterialCollection> {
    const collectionData = this.tenantId ? { ...insertCollection, tenantId: this.tenantId } : insertCollection;
    const [collection] = await this.db
      .insert(materialCollections)
      .values(collectionData as any)
      .returning();
    return collection;
  }

  async updateMaterialCollection(id: string, updates: Partial<InsertMaterialCollection>): Promise<MaterialCollection | undefined> {
    const conditions = [eq(materialCollections.id, id)];
    if (this.tenantId) conditions.push(eq(materialCollections.tenantId, this.tenantId));
    
    const [collection] = await this.db
      .update(materialCollections)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(...conditions))
      .returning();
    return collection || undefined;
  }

  async deleteMaterialCollection(id: string): Promise<boolean> {
    const conditions = [eq(materialCollections.id, id)];
    if (this.tenantId) conditions.push(eq(materialCollections.tenantId, this.tenantId));
    
    const result = await this.db.delete(materialCollections).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Material-Collection associations
  async getMaterialsByCollection(collectionId: string): Promise<Material[]> {
    const collectionItems = await this.db
      .select()
      .from(materialCollectionItems)
      .where(eq(materialCollectionItems.collectionId, collectionId));
    
    if (collectionItems.length === 0) return [];
    
    const materialIds = collectionItems.map(item => item.materialId);
    const conditions = [inArray(materials.id, materialIds)];
    if (this.tenantId) conditions.push(eq(materials.tenantId, this.tenantId));
    
    return await this.db.select().from(materials).where(and(...conditions));
  }

  async getCollectionsByMaterial(materialId: string): Promise<MaterialCollection[]> {
    const collectionItems = await this.db
      .select()
      .from(materialCollectionItems)
      .where(eq(materialCollectionItems.materialId, materialId));
    
    if (collectionItems.length === 0) return [];
    
    const collectionIds = collectionItems.map(item => item.collectionId);
    const conditions = [inArray(materialCollections.id, collectionIds)];
    if (this.tenantId) conditions.push(eq(materialCollections.tenantId, this.tenantId));
    
    return await this.db.select().from(materialCollections).where(and(...conditions));
  }

  async addMaterialToCollection(materialId: string, collectionId: string): Promise<MaterialCollectionItem> {
    const [item] = await this.db
      .insert(materialCollectionItems)
      .values({ materialId, collectionId })
      .returning();
    return item;
  }

  async removeMaterialFromCollection(materialId: string, collectionId: string): Promise<boolean> {
    const result = await this.db
      .delete(materialCollectionItems)
      .where(and(
        eq(materialCollectionItems.materialId, materialId),
        eq(materialCollectionItems.collectionId, collectionId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async updateMaterialCollections(materialId: string, collectionIds: string[]): Promise<void> {
    // Start a transaction to ensure consistency
    await this.db.transaction(async (tx) => {
      // First, remove all existing associations for this material
      await tx.delete(materialCollectionItems).where(eq(materialCollectionItems.materialId, materialId));
      
      // Then add the new associations
      if (collectionIds.length > 0) {
        await tx.insert(materialCollectionItems).values(
          collectionIds.map(collectionId => ({ materialId, collectionId }))
        );
      }
    });
  }

  // Activities
  async getActivities(locationId?: string): Promise<Activity[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(activities.tenantId, this.tenantId));
    if (locationId) conditions.push(eq(activities.locationId, locationId));
    // Filter out soft-deleted activities - check both isActive flag and deletedAt/deletedOn
    conditions.push(eq(activities.isActive, true));
    conditions.push(isNull(activities.deletedAt));
    conditions.push(isNull(activities.deletedOn));
    
    return await this.db.select().from(activities).where(conditions.length ? and(...conditions) : undefined);
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const conditions = [eq(activities.id, id)];
    if (this.tenantId) conditions.push(eq(activities.tenantId, this.tenantId));
    // Filter out soft-deleted activities - check both isActive flag and deletedAt/deletedOn
    conditions.push(eq(activities.isActive, true));
    conditions.push(isNull(activities.deletedAt));
    conditions.push(isNull(activities.deletedOn));
    
    const [activity] = await this.db.select().from(activities).where(and(...conditions));
    
    if (!activity) return undefined;
    
    // Fetch all related data for the activity using the ID arrays stored in the activity
    // Simple approach: fetch all records for the tenant and filter in JavaScript
    const [allMilestones, allMaterials, allAgeGroups] = await Promise.all([
      this.db.select().from(milestones).where(
        this.tenantId ? eq(milestones.tenantId, this.tenantId) : undefined
      ),
      this.db.select().from(materials).where(
        this.tenantId ? eq(materials.tenantId, this.tenantId) : undefined
      ),
      this.db.select().from(ageGroups).where(
        this.tenantId ? eq(ageGroups.tenantId, this.tenantId) : undefined
      )
    ]);
    
    // Filter to only the ones referenced by the activity
    const activityMilestones = activity.milestoneIds && activity.milestoneIds.length > 0
      ? allMilestones.filter(m => activity.milestoneIds.includes(m.id))
      : [];
    
    const activityMaterials = activity.materialIds && activity.materialIds.length > 0
      ? allMaterials.filter(m => activity.materialIds.includes(m.id))
      : [];
    
    const activityAgeGroups = activity.ageGroupIds && activity.ageGroupIds.length > 0
      ? allAgeGroups.filter(ag => activity.ageGroupIds!.includes(ag.id))
      : [];
    
    // Enrich activity with related data
    const enrichedActivity: any = {
      ...activity,
      milestones: activityMilestones,
      materials: activityMaterials,
      ageGroups: activityAgeGroups,
      // Instructions are already stored as JSON in the activity, just rename to steps
      steps: activity.instructions || []
    };
    
    return enrichedActivity;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    console.log('[DatabaseStorage] Creating activity with data:', insertActivity);
    const activityData = this.tenantId ? { ...insertActivity, tenantId: this.tenantId } : insertActivity;
    console.log('[DatabaseStorage] Activity data with tenant:', activityData);
    
    try {
      const [activity] = await this.db
        .insert(activities)
        .values(activityData as any)
        .returning();
      console.log('[DatabaseStorage] Activity created successfully:', activity.id);
      return activity;
    } catch (error) {
      console.error('[DatabaseStorage] Error creating activity:', error);
      throw error;
    }
  }

  async updateActivity(id: string, updates: Partial<InsertActivity>): Promise<Activity | undefined> {
    const conditions = [eq(activities.id, id)];
    if (this.tenantId) conditions.push(eq(activities.tenantId, this.tenantId));
    
    const updateData: any = { ...updates };
    if (updates.ageGroupIds) {
      updateData.ageGroupIds = Array.isArray(updates.ageGroupIds) ? updates.ageGroupIds : [];
    }
    if (updates.milestoneIds) {
      updateData.milestoneIds = Array.isArray(updates.milestoneIds) ? updates.milestoneIds : [];
    }
    if (updates.materialIds) {
      updateData.materialIds = Array.isArray(updates.materialIds) ? updates.materialIds : [];
    }
    if (updates.instructions) {
      updateData.instructions = Array.isArray(updates.instructions) ? updates.instructions : [];
    }
    if (updates.objectives) {
      updateData.objectives = Array.isArray(updates.objectives) ? updates.objectives : [];
    }
    if (updates.safetyConsiderations) {
      updateData.safetyConsiderations = Array.isArray(updates.safetyConsiderations) ? updates.safetyConsiderations : [];
    }
    if (updates.variations) {
      updateData.variations = Array.isArray(updates.variations) ? updates.variations : [];
    }
    
    const [activity] = await this.db
      .update(activities)
      .set(updateData)
      .where(and(...conditions))
      .returning();
    return activity || undefined;
  }

  async deleteActivity(id: string): Promise<boolean> {
    const conditions = [eq(activities.id, id)];
    if (this.tenantId) conditions.push(eq(activities.tenantId, this.tenantId));
    
    // Soft delete: set deletedOn timestamp, isActive to false, and status to disabled
    const result = await this.db
      .update(activities)
      .set({ 
        deletedOn: new Date(),
        deletedAt: new Date(),
        isActive: false,
        status: 'disabled',
        updatedAt: new Date()
      })
      .where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Activity Records
  async getActivityRecords(scheduledActivityId: string): Promise<ActivityRecord[]> {
    const conditions = [eq(activityRecords.scheduledActivityId, scheduledActivityId)];
    if (this.tenantId) conditions.push(eq(activityRecords.tenantId, this.tenantId));
    
    return await this.db.select().from(activityRecords).where(and(...conditions));
  }

  async getActivityRecord(id: string): Promise<ActivityRecord | undefined> {
    const conditions = [eq(activityRecords.id, id)];
    if (this.tenantId) conditions.push(eq(activityRecords.tenantId, this.tenantId));
    
    const [record] = await this.db.select().from(activityRecords).where(and(...conditions));
    return record || undefined;
  }

  async createActivityRecord(insertActivityRecord: InsertActivityRecord): Promise<ActivityRecord> {
    const recordData = this.tenantId ? { ...insertActivityRecord, tenantId: this.tenantId } : insertActivityRecord;
    
    // Set completed_at timestamp if the activity is being marked as completed
    if (recordData.completed) {
      recordData.completedAt = new Date();
    }
    
    const [record] = await this.db
      .insert(activityRecords)
      .values(recordData)
      .returning();
    
    // Also mark the scheduled activity as completed
    if (recordData.completed && recordData.scheduledActivityId) {
      await this.updateScheduledActivity(recordData.scheduledActivityId, {
        completed: true,
        completedAt: new Date()
      });
    }
    
    return record;
  }

  async updateActivityRecord(id: string, updates: Partial<InsertActivityRecord>): Promise<ActivityRecord | undefined> {
    const conditions = [eq(activityRecords.id, id)];
    if (this.tenantId) conditions.push(eq(activityRecords.tenantId, this.tenantId));
    
    const [record] = await this.db
      .update(activityRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(...conditions))
      .returning();
    return record || undefined;
  }

  async deleteActivityRecord(id: string): Promise<boolean> {
    const conditions = [eq(activityRecords.id, id)];
    if (this.tenantId) conditions.push(eq(activityRecords.tenantId, this.tenantId));
    
    const result = await this.db.delete(activityRecords).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Lesson Plans
  async getLessonPlans(teacherId?: string, locationId?: string, roomId?: string, scheduleType?: string): Promise<LessonPlan[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(lessonPlans.tenantId, this.tenantId));
    if (teacherId) conditions.push(eq(lessonPlans.teacherId, teacherId));
    if (locationId) conditions.push(eq(lessonPlans.locationId, locationId));
    if (roomId) conditions.push(eq(lessonPlans.roomId, roomId));
    if (scheduleType) conditions.push(eq(lessonPlans.scheduleType, scheduleType));
    
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
  
  async updateLessonPlanApprovalFields(id: string, approvalData: {
    submittedAt?: Date | null;
    submittedBy?: string | null;
    approvedAt?: Date | null;
    approvedBy?: string | null;
    reviewNotes?: string | null;
  }): Promise<LessonPlan | undefined> {
    const conditions = [eq(lessonPlans.id, id)];
    if (this.tenantId) conditions.push(eq(lessonPlans.tenantId, this.tenantId));
    
    const [lessonPlan] = await this.db
      .update(lessonPlans)
      .set(approvalData)
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

  async getLessonPlansForReview(locationId?: string): Promise<any[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(lessonPlans.tenantId, this.tenantId));
    if (locationId) conditions.push(eq(lessonPlans.locationId, locationId));
    // Only get submitted or approved plans
    conditions.push(sql`${lessonPlans.status} IN ('submitted', 'approved', 'rejected')`);
    
    const plans = await this.db.select().from(lessonPlans).where(conditions.length ? and(...conditions) : undefined);
    
    // Fetch related data for each lesson plan
    const enrichedPlans = await Promise.all(plans.map(async (plan) => {
      // Store current tenant context
      const originalTenantId = this.tenantId;
      
      // Ensure tenant context is set for the plan's tenant
      this.tenantId = plan.tenantId;
      
      const [teacher, location, room, submitter] = await Promise.all([
        plan.teacherId ? this.getUser(plan.teacherId) : null,
        plan.locationId ? this.getLocation(plan.locationId) : null,
        plan.roomId ? this.getRoom(plan.roomId) : null,
        plan.submittedBy ? this.getUser(plan.submittedBy) : null
      ]);
      
      // Restore original tenant context
      this.tenantId = originalTenantId;
      
      return {
        ...plan,
        teacher,
        location,
        room,
        submitter
      };
    }));
    
    return enrichedPlans;
  }

  async submitLessonPlanForReview(id: string, userId: string): Promise<LessonPlan | undefined> {
    const conditions = [eq(lessonPlans.id, id)];
    if (this.tenantId) conditions.push(eq(lessonPlans.tenantId, this.tenantId));
    
    const [lessonPlan] = await this.db
      .update(lessonPlans)
      .set({ 
        status: 'submitted',
        submittedAt: new Date(),
        submittedBy: userId,
        updatedAt: new Date()
      })
      .where(and(...conditions))
      .returning();
    return lessonPlan || undefined;
  }

  async withdrawLessonPlanFromReview(id: string): Promise<LessonPlan | undefined> {
    const conditions = [eq(lessonPlans.id, id)];
    if (this.tenantId) conditions.push(eq(lessonPlans.tenantId, this.tenantId));
    
    const [lessonPlan] = await this.db
      .update(lessonPlans)
      .set({ 
        status: 'draft',
        submittedAt: null,
        submittedBy: null,
        updatedAt: new Date()
      })
      .where(and(...conditions))
      .returning();
    return lessonPlan || undefined;
  }

  async approveLessonPlan(id: string, userId: string, notes?: string): Promise<LessonPlan | undefined> {
    console.log('[approveLessonPlan] Called with:', { id, userId, notes, tenantId: this.tenantId });
    
    const conditions = [eq(lessonPlans.id, id)];
    if (this.tenantId) conditions.push(eq(lessonPlans.tenantId, this.tenantId));
    
    const [lessonPlan] = await this.db
      .update(lessonPlans)
      .set({ 
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: userId,
        reviewNotes: notes || '',
        updatedAt: new Date()
      })
      .where(and(...conditions))
      .returning();
    
    console.log('[approveLessonPlan] Updated lesson plan:', lessonPlan);
    console.log('[approveLessonPlan] submittedBy:', lessonPlan?.submittedBy);
    
    // Create notification for the teacher who submitted the plan
    if (lessonPlan && lessonPlan.submittedBy) {
      console.log('[approveLessonPlan] Creating notification for user:', lessonPlan.submittedBy);
      try {
        // Get the room and location info for the notification
        const room = lessonPlan.roomId ? await this.getRoom(lessonPlan.roomId) : undefined;
        const location = lessonPlan.locationId ? await this.getLocation(lessonPlan.locationId) : undefined;
        
        const notificationData = {
          tenantId: lessonPlan.tenantId,
          userId: lessonPlan.submittedBy,  // Use submittedBy instead of teacherId
          type: 'lesson_plan_approved',
          lessonPlanId: lessonPlan.id,
          title: 'Lesson Plan Approved',
          message: `Your lesson plan for ${room?.name || 'Unknown Room'} at ${location?.name || 'Unknown Location'} has been approved.`,
          reviewNotes: notes || '',
          weekStart: new Date(lessonPlan.weekStart),
          locationId: lessonPlan.locationId,
          roomId: lessonPlan.roomId,
          isRead: false,
          isDismissed: false
        };
        
        console.log('[approveLessonPlan] Notification data:', notificationData);
        const notification = await this.createNotification(notificationData);
        console.log('[approveLessonPlan] Created notification:', notification);
      } catch (error) {
        console.error('[approveLessonPlan] Failed to create notification:', error);
      }
    } else {
      console.log('[approveLessonPlan] Not creating notification - no submittedBy:', lessonPlan);
    }
    
    return lessonPlan || undefined;
  }

  async getLessonPlanByRoomAndWeek(roomId: string, weekStart: string): Promise<LessonPlan | undefined> {
    const conditions = [
      eq(lessonPlans.roomId, roomId),
      eq(lessonPlans.weekStart, weekStart)
    ];
    if (this.tenantId) conditions.push(eq(lessonPlans.tenantId, this.tenantId));
    
    const [lessonPlan] = await this.db.select().from(lessonPlans).where(and(...conditions));
    return lessonPlan || undefined;
  }
  
  async getScheduledActivitiesByLessonPlan(lessonPlanId: string): Promise<ScheduledActivity[]> {
    const conditions = [eq(scheduledActivities.lessonPlanId, lessonPlanId)];
    if (this.tenantId) conditions.push(eq(scheduledActivities.tenantId, this.tenantId));
    
    return await this.db.select().from(scheduledActivities).where(and(...conditions));
  }
  
  async rejectLessonPlan(id: string, userId: string, notes: string): Promise<LessonPlan | undefined> {
    console.log('[rejectLessonPlan] Called with:', { id, userId, notes, tenantId: this.tenantId });
    
    const conditions = [eq(lessonPlans.id, id)];
    if (this.tenantId) conditions.push(eq(lessonPlans.tenantId, this.tenantId));
    
    const [lessonPlan] = await this.db
      .update(lessonPlans)
      .set({ 
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: userId,
        reviewNotes: notes,
        updatedAt: new Date()
      })
      .where(and(...conditions))
      .returning();
    
    console.log('[rejectLessonPlan] Updated lesson plan:', lessonPlan);
    console.log('[rejectLessonPlan] submittedBy:', lessonPlan?.submittedBy);
    
    // Create notification for the teacher who submitted the plan
    if (lessonPlan && lessonPlan.submittedBy) {
      console.log('[rejectLessonPlan] Creating notification for user:', lessonPlan.submittedBy);
      try {
        // Get the room and location info for the notification
        const room = lessonPlan.roomId ? await this.getRoom(lessonPlan.roomId) : undefined;
        const location = lessonPlan.locationId ? await this.getLocation(lessonPlan.locationId) : undefined;
        
        const notificationData = {
          tenantId: lessonPlan.tenantId,
          userId: lessonPlan.submittedBy,  // Use submittedBy instead of teacherId
          type: 'lesson_plan_returned',
          lessonPlanId: lessonPlan.id,
          title: 'Lesson Plan Returned for Revision',
          message: `Your lesson plan for ${room?.name || 'Unknown Room'} at ${location?.name || 'Unknown Location'} has been returned for revision.`,
          reviewNotes: notes,
          weekStart: new Date(lessonPlan.weekStart),
          locationId: lessonPlan.locationId,
          roomId: lessonPlan.roomId,
          isRead: false,
          isDismissed: false
        };
        
        console.log('[rejectLessonPlan] Notification data:', notificationData);
        const notification = await this.createNotification(notificationData);
        console.log('[rejectLessonPlan] Created notification:', notification);
      } catch (error) {
        console.error('[rejectLessonPlan] Failed to create notification:', error);
      }
    } else {
      console.log('[rejectLessonPlan] Not creating notification - no submittedBy:', lessonPlan);
    }
    
    return lessonPlan || undefined;
  }

  // Scheduled Activities
  async getScheduledActivities(lessonPlanId: string, locationId?: string, roomId?: string): Promise<ScheduledActivity[]> {
    const conditions = [eq(scheduledActivities.lessonPlanId, lessonPlanId)];
    if (this.tenantId) conditions.push(eq(scheduledActivities.tenantId, this.tenantId));
    if (locationId) conditions.push(eq(scheduledActivities.locationId, locationId));
    if (roomId) conditions.push(eq(scheduledActivities.roomId, roomId));
    
    return await this.db.select().from(scheduledActivities).where(and(...conditions));
  }

  async getAllScheduledActivities(): Promise<ScheduledActivity[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(scheduledActivities.tenantId, this.tenantId));
    
    if (conditions.length > 0) {
      return await this.db.select().from(scheduledActivities).where(and(...conditions));
    }
    return await this.db.select().from(scheduledActivities);
  }

  async getScheduledActivity(id: string): Promise<ScheduledActivity | undefined> {
    const conditions = [eq(scheduledActivities.id, id)];
    if (this.tenantId) conditions.push(eq(scheduledActivities.tenantId, this.tenantId));
    
    const [scheduledActivity] = await this.db
      .select()
      .from(scheduledActivities)
      .where(and(...conditions));
    return scheduledActivity;
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
      .where(eq(tokenSecrets.tenantId, tenantId));
    return tokenSecret;
  }

  // Settings Management Implementation
  // Locations
  async getLocations(): Promise<Location[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(locations.tenantId, this.tenantId));
    
    return await this.db.select().from(locations).where(conditions.length ? and(...conditions) : undefined);
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const conditions = [eq(locations.id, id)];
    if (this.tenantId) conditions.push(eq(locations.tenantId, this.tenantId));
    
    const [location] = await this.db.select().from(locations).where(and(...conditions));
    return location || undefined;
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const locationData = this.tenantId ? { ...insertLocation, tenantId: this.tenantId } : insertLocation;
    const [location] = await this.db
      .insert(locations)
      .values(locationData)
      .returning();
    return location;
  }

  async updateLocation(id: string, updates: Partial<InsertLocation>): Promise<Location | undefined> {
    const conditions = [eq(locations.id, id)];
    if (this.tenantId) conditions.push(eq(locations.tenantId, this.tenantId));
    
    const [location] = await this.db
      .update(locations)
      .set(updates)
      .where(and(...conditions))
      .returning();
    return location || undefined;
  }

  async deleteLocation(id: string): Promise<boolean> {
    const conditions = [eq(locations.id, id)];
    if (this.tenantId) conditions.push(eq(locations.tenantId, this.tenantId));
    
    const result = await this.db.delete(locations).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Rooms
  async getRooms(): Promise<Room[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(rooms.tenantId, this.tenantId));
    
    return await this.db.select().from(rooms).where(conditions.length ? and(...conditions) : undefined);
  }

  async getRoomsByLocation(locationId: string): Promise<Room[]> {
    const conditions = [eq(rooms.locationId, locationId)];
    if (this.tenantId) conditions.push(eq(rooms.tenantId, this.tenantId));
    
    return await this.db.select().from(rooms).where(and(...conditions));
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const conditions = [eq(rooms.id, id)];
    if (this.tenantId) conditions.push(eq(rooms.tenantId, this.tenantId));
    
    const [room] = await this.db.select().from(rooms).where(and(...conditions));
    return room || undefined;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const roomData = this.tenantId ? { ...insertRoom, tenantId: this.tenantId } : insertRoom;
    const [room] = await this.db
      .insert(rooms)
      .values(roomData)
      .returning();
    return room;
  }

  async updateRoom(id: string, updates: Partial<InsertRoom>): Promise<Room | undefined> {
    const conditions = [eq(rooms.id, id)];
    if (this.tenantId) conditions.push(eq(rooms.tenantId, this.tenantId));
    
    const [room] = await this.db
      .update(rooms)
      .set(updates)
      .where(and(...conditions))
      .returning();
    return room || undefined;
  }

  async deleteRoom(id: string): Promise<boolean> {
    const conditions = [eq(rooms.id, id)];
    if (this.tenantId) conditions.push(eq(rooms.tenantId, this.tenantId));
    
    const result = await this.db.delete(rooms).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Categories
  // Extended version for location filtering
  async getCategoriesByLocation(locationId: string): Promise<Category[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(categories.tenantId, this.tenantId));
    if (locationId) conditions.push(eq(categories.locationId, locationId));
    
    return await this.db.select().from(categories).where(and(...conditions));
  }

  // Interface compatibility method - override for no parameter version
  async getCategories(): Promise<Category[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(categories.tenantId, this.tenantId));
    
    return await this.db.select().from(categories).where(conditions.length ? and(...conditions) : undefined);
  }

  async getCategoriesByType(type: string): Promise<Category[]> {
    const conditions = [];
    if (this.tenantId) conditions.push(eq(categories.tenantId, this.tenantId));
    // Note: Current schema doesn't have a type field, so this returns all categories
    // This could be expanded if categories get a type field in the future
    
    return await this.db.select().from(categories).where(conditions.length ? and(...conditions) : undefined);
  }



  async getCategory(id: string, locationId?: string): Promise<Category | undefined> {
    const conditions = [eq(categories.id, id)];
    if (this.tenantId) conditions.push(eq(categories.tenantId, this.tenantId));
    if (locationId) conditions.push(eq(categories.locationId, locationId));
    
    const [category] = await this.db.select().from(categories).where(and(...conditions));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const categoryData = this.tenantId ? { ...insertCategory, tenantId: this.tenantId } : insertCategory;
    const [category] = await this.db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>, locationId?: string): Promise<Category | undefined> {
    const conditions = [eq(categories.id, id)];
    if (this.tenantId) conditions.push(eq(categories.tenantId, this.tenantId));
    if (locationId) conditions.push(eq(categories.locationId, locationId));
    
    const [category] = await this.db
      .update(categories)
      .set(updates)
      .where(and(...conditions))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: string, locationId?: string): Promise<boolean> {
    const conditions = [eq(categories.id, id)];
    if (this.tenantId) conditions.push(eq(categories.tenantId, this.tenantId));
    if (locationId) conditions.push(eq(categories.locationId, locationId));
    
    const result = await this.db.delete(categories).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Age Groups
  async getAgeGroups(locationId?: string): Promise<AgeGroup[]> {
    console.log("getAgeGroups called with tenantId:", this.tenantId, "locationId:", locationId);
    const conditions = [];
    if (this.tenantId) conditions.push(eq(ageGroups.tenantId, this.tenantId));
    if (locationId) conditions.push(eq(ageGroups.locationId, locationId));
    
    console.log("Conditions:", conditions.length);
    const result = await this.db.select().from(ageGroups).where(conditions.length ? and(...conditions) : undefined);
    console.log("Database result:", result);
    return result;
  }

  async getAgeGroup(id: string, locationId?: string): Promise<AgeGroup | undefined> {
    const conditions = [eq(ageGroups.id, id)];
    if (this.tenantId) conditions.push(eq(ageGroups.tenantId, this.tenantId));
    if (locationId) conditions.push(eq(ageGroups.locationId, locationId));
    
    const [ageGroup] = await this.db.select().from(ageGroups).where(and(...conditions));
    return ageGroup || undefined;
  }

  async createAgeGroup(insertAgeGroup: InsertAgeGroup): Promise<AgeGroup> {
    const ageGroupData = this.tenantId ? { ...insertAgeGroup, tenantId: this.tenantId } : insertAgeGroup;
    const [ageGroup] = await this.db
      .insert(ageGroups)
      .values(ageGroupData)
      .returning();
    return ageGroup;
  }

  async updateAgeGroup(id: string, updates: Partial<InsertAgeGroup>, locationId?: string): Promise<AgeGroup | undefined> {
    const conditions = [eq(ageGroups.id, id)];
    if (this.tenantId) conditions.push(eq(ageGroups.tenantId, this.tenantId));
    if (locationId) conditions.push(eq(ageGroups.locationId, locationId));
    
    const [ageGroup] = await this.db
      .update(ageGroups)
      .set(updates)
      .where(and(...conditions))
      .returning();
    return ageGroup || undefined;
  }

  async deleteAgeGroup(id: string, locationId?: string): Promise<boolean> {
    const conditions = [eq(ageGroups.id, id)];
    if (this.tenantId) conditions.push(eq(ageGroups.tenantId, this.tenantId));
    if (locationId) conditions.push(eq(ageGroups.locationId, locationId));
    
    const result = await this.db.delete(ageGroups).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  async updateTokenSecret(tenantId: string, data: Partial<InsertTokenSecret>): Promise<TokenSecret | undefined> {
    const [tokenSecret] = await this.db.update(tokenSecrets).set(data)
      .where(eq(tokenSecrets.tenantId, tenantId)).returning();
    return tokenSecret;
  }

  // Organization Settings Implementation
  async getTenantSettings(): Promise<TenantSettings | undefined> {
    if (!this.tenantId) return undefined;
    
    const [settings] = await this.db
      .select()
      .from(tenantSettings)
      .where(eq(tenantSettings.tenantId, this.tenantId));
    
    return settings || undefined;
  }

  async updateTenantSettings(updates: Partial<InsertTenantSettings>): Promise<TenantSettings> {
    if (!this.tenantId) throw new Error("Tenant context not set");
    
    // Check if settings exist for this tenant
    const existing = await this.getTenantSettings();
    
    if (existing) {
      // Update existing settings
      const [updated] = await this.db
        .update(tenantSettings)
        .set({ ...updates, updatedAt: new Date() } as any)
        .where(eq(tenantSettings.tenantId, this.tenantId))
        .returning();
      return updated;
    } else {
      // Create new settings
      const [created] = await this.db
        .insert(tenantSettings)
        .values({ ...updates, tenantId: this.tenantId } as any)
        .returning();
      return created;
    }
  }
  
  // Permission Management Implementation
  async getPermissions(): Promise<Permission[]> {
    return await this.db.select().from(permissions);
  }
  
  async getPermission(id: string): Promise<Permission | undefined> {
    const [permission] = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.id, id));
    return permission || undefined;
  }
  
  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const [permission] = await this.db
      .insert(permissions)
      .values(insertPermission)
      .returning();
    return permission;
  }
  
  // Roles
  async getRoles(): Promise<Role[]> {
    return await this.db.select().from(roles);
  }
  
  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, id));
    return role || undefined;
  }
  
  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await this.db
      .insert(roles)
      .values(insertRole)
      .returning();
    return role;
  }
  
  async updateRole(id: string, updates: Partial<InsertRole>): Promise<Role | undefined> {
    const [role] = await this.db
      .update(roles)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(roles.id, id))
      .returning();
    return role || undefined;
  }
  
  // Role Permissions
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return await this.db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
  }
  
  async addRolePermission(insertRolePermission: InsertRolePermission): Promise<RolePermission> {
    const [rolePermission] = await this.db
      .insert(rolePermissions)
      .values(insertRolePermission)
      .returning();
    return rolePermission;
  }
  
  async removeRolePermission(roleId: string, permissionId: string): Promise<boolean> {
    const result = await this.db
      .delete(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      ));
    return (result.rowCount ?? 0) > 0;
  }
  
  // Tenant Permission Overrides
  async getTenantPermissionOverride(tenantId: string, permissionName: string): Promise<TenantPermissionOverride | undefined> {
    const [override] = await this.db
      .select()
      .from(tenantPermissionOverrides)
      .where(and(
        eq(tenantPermissionOverrides.tenantId, tenantId),
        eq(tenantPermissionOverrides.permissionName, permissionName)
      ));
    return override || undefined;
  }
  
  async getTenantPermissionOverrides(tenantId: string): Promise<TenantPermissionOverride[]> {
    return await this.db
      .select()
      .from(tenantPermissionOverrides)
      .where(eq(tenantPermissionOverrides.tenantId, tenantId));
  }
  
  async createTenantPermissionOverride(insertOverride: InsertTenantPermissionOverride): Promise<TenantPermissionOverride> {
    const [override] = await this.db
      .insert(tenantPermissionOverrides)
      .values(insertOverride as any)
      .returning();
    return override;
  }
  
  async updateTenantPermissionOverride(id: string, updates: Partial<InsertTenantPermissionOverride>): Promise<TenantPermissionOverride | undefined> {
    const [override] = await this.db
      .update(tenantPermissionOverrides)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(tenantPermissionOverrides.id, id))
      .returning();
    return override || undefined;
  }
  
  // Permission Checking
  async checkUserPermission(
    userId: string, 
    role: string, 
    resource: string, 
    action: string, 
    tenantId: string
  ): Promise<{ hasPermission: boolean; requiresApproval: boolean; reason?: string }> {
    // Check for superadmin - has all permissions
    if (role.toLowerCase() === 'superadmin') {
      return { hasPermission: true, requiresApproval: false };
    }
    
    const permissionName = `${resource}.${action}`;
    
    // Check tenant-specific overrides
    const override = await this.getTenantPermissionOverride(tenantId, permissionName);
    
    if (override) {
      const roleLower = role.toLowerCase();
      const requiresApproval = override.rolesRequired.includes(roleLower);
      const autoApprove = override.autoApproveRoles.includes(roleLower);
      
      if (autoApprove) {
        return { hasPermission: true, requiresApproval: false };
      }
      
      if (requiresApproval) {
        return { hasPermission: true, requiresApproval: true, reason: 'Role requires approval for this action' };
      }
    }
    
    // Default permission checking based on role
    const defaultPermissions: { [key: string]: string[] } = {
      'teacher': [
        'lesson_plan.create', 'lesson_plan.read', 'lesson_plan.update', 'lesson_plan.submit',
        'activity.read', 'activity.create',
        'material.read',
        'milestone.read'
      ],
      'assistant_director': [
        'lesson_plan.create', 'lesson_plan.read', 'lesson_plan.update', 'lesson_plan.submit',
        'lesson_plan.approve', 'lesson_plan.reject',
        'activity.create', 'activity.read', 'activity.update', 'activity.delete',
        'material.create', 'material.read', 'material.update',
        'milestone.read', 'milestone.create'
      ],
      'director': [
        'lesson_plan.manage',
        'activity.manage',
        'material.manage',
        'milestone.manage',
        'user.read', 'user.update',
        'room.manage',
        'location.read'
      ],
      'admin': [
        'lesson_plan.manage',
        'activity.manage',
        'material.manage',
        'milestone.manage',
        'user.manage',
        'settings.manage',
        'location.manage',
        'room.manage'
      ]
    };
    
    const rolePermissions = defaultPermissions[role.toLowerCase()] || [];
    const hasPermission = rolePermissions.includes(permissionName) || rolePermissions.includes(`${resource}.manage`);
    
    // Check if this action requires approval for this role
    const requiresApproval = permissionName === 'lesson_plan.submit' && role.toLowerCase() === 'teacher';
    
    return {
      hasPermission,
      requiresApproval,
      reason: hasPermission ? undefined : `Role ${role} does not have permission for ${permissionName}`
    };
  }

  // Notifications
  async getActiveNotifications(userId: string): Promise<Notification[]> {
    const conditions = [
      eq(notifications.userId, userId),
      eq(notifications.isDismissed, false)
    ];
    if (this.tenantId) conditions.push(eq(notifications.tenantId, this.tenantId));
    
    const activeNotifications = await this.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(sql`${notifications.createdAt} DESC`);
    
    return activeNotifications;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    console.log('[createNotification] Called with:', notification);
    console.log('[createNotification] Current tenantId:', this.tenantId);
    
    if (!this.tenantId && !notification.tenantId) {
      throw new Error('Tenant ID is required to create a notification');
    }
    
    const notificationToInsert = {
      ...notification,
      tenantId: notification.tenantId || this.tenantId!,
    };
    
    console.log('[createNotification] Inserting:', notificationToInsert);
    
    const [newNotification] = await this.db
      .insert(notifications)
      .values(notificationToInsert)
      .returning();
    
    console.log('[createNotification] Created notification:', newNotification);
    
    return newNotification;
  }

  async dismissNotification(notificationId: string, userId: string): Promise<boolean> {
    const conditions = [
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ];
    if (this.tenantId) conditions.push(eq(notifications.tenantId, this.tenantId));
    
    const result = await this.db
      .update(notifications)
      .set({ 
        isDismissed: true,
        dismissedAt: new Date()
      })
      .where(and(...conditions))
      .returning();
    
    return result.length > 0;
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    const conditions = [
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ];
    if (this.tenantId) conditions.push(eq(notifications.tenantId, this.tenantId));
    
    const result = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(...conditions))
      .returning();
    
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();