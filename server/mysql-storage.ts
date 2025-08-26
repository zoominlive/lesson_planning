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
import { eq, and, sql, isNull, inArray, or } from "drizzle-orm";
import type { IStorage } from "./storage";

export class MySQLStorage implements IStorage {
  constructor(private db: any) {}

  // Tenant context management
  tenantId: string | null = null;

  setTenantContext(tenantId: string) {
    console.log('Setting tenant context for tenantId:', tenantId);
    this.tenantId = tenantId;
  }

  clearTenantContext() {
    console.log('Clearing tenant context');
    this.tenantId = null;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select()
      .from(users)
      .where(eq(users.id, id));
    return result[0];
  }

  async getUserByUserId(userId: string): Promise<User | undefined> {
    const result = await this.db.select()
      .from(users)
      .where(eq(users.userId, userId));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select()
      .from(users)
      .where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user);
    const insertedId = result[0].insertId;
    const created = await this.getUser(insertedId);
    if (!created) throw new Error("Failed to create user");
    return created;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    await this.db.update(users)
      .set(user)
      .where(eq(users.id, id));
    return this.getUser(id);
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
    const tenantId = this.tenantId;
    if (!tenantId) {
      throw new Error('Tenant context not set');
    }

    const existingUser = await this.getUserByUserId(tokenData.userId);
    
    if (existingUser) {
      const updated = await this.updateUser(existingUser.id, {
        username: tokenData.username,
        firstName: tokenData.firstName,
        lastName: tokenData.lastName,
        role: tokenData.role,
        authorizedLocations: tokenData.locations,
      });
      if (!updated) throw new Error("Failed to update user");
      return updated;
    } else {
      return await this.createUser({
        tenantId,
        userId: tokenData.userId,
        username: tokenData.username,
        firstName: tokenData.firstName,
        lastName: tokenData.lastName,
        role: tokenData.role,
        authorizedLocations: tokenData.locations,
        isActive: true,
        createdAt: new Date()
      });
    }
  }

  // Milestones
  async getMilestones(): Promise<Milestone[]> {
    const conditions = [];
    
    if (this.tenantId) {
      conditions.push(
        or(
          eq(milestones.tenantId, this.tenantId),
          isNull(milestones.tenantId)
        )
      );
    }
    
    const query = this.db.select().from(milestones);
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    return query;
  }

  async getMilestone(id: string): Promise<Milestone | undefined> {
    const result = await this.db.select()
      .from(milestones)
      .where(eq(milestones.id, id));
    return result[0];
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const result = await this.db.insert(milestones).values(milestone);
    const insertedId = result[0].insertId;
    const created = await this.getMilestone(insertedId);
    if (!created) throw new Error("Failed to create milestone");
    return created;
  }

  async updateMilestone(id: string, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    await this.db.update(milestones)
      .set(milestone)
      .where(eq(milestones.id, id));
    return this.getMilestone(id);
  }

  async deleteMilestone(id: string): Promise<boolean> {
    const result = await this.db.delete(milestones).where(eq(milestones.id, id));
    return result.affectedRows > 0;
  }

  // Materials
  async getMaterials(): Promise<Material[]> {
    const conditions = [];
    
    if (this.tenantId) {
      conditions.push(
        or(
          eq(materials.tenantId, this.tenantId),
          isNull(materials.tenantId)
        )
      );
    }
    
    const query = this.db.select().from(materials);
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    return query;
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    const result = await this.db.select()
      .from(materials)
      .where(eq(materials.id, id));
    return result[0];
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const result = await this.db.insert(materials).values(material);
    const insertedId = result[0].insertId;
    const created = await this.getMaterial(insertedId);
    if (!created) throw new Error("Failed to create material");
    return created;
  }

  async updateMaterial(id: string, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    await this.db.update(materials)
      .set(material)
      .where(eq(materials.id, id));
    return this.getMaterial(id);
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const result = await this.db.delete(materials).where(eq(materials.id, id));
    return result.affectedRows > 0;
  }

  // Material Collections
  async getMaterialCollections(): Promise<MaterialCollection[]> {
    const conditions = [];
    
    if (this.tenantId) {
      conditions.push(eq(materialCollections.tenantId, this.tenantId));
    }
    
    const query = this.db.select().from(materialCollections);
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    return query;
  }

  async getMaterialCollection(id: string): Promise<MaterialCollection | undefined> {
    const result = await this.db.select()
      .from(materialCollections)
      .where(eq(materialCollections.id, id));
    return result[0];
  }

  async createMaterialCollection(collection: InsertMaterialCollection): Promise<MaterialCollection> {
    const result = await this.db.insert(materialCollections).values(collection);
    const insertedId = result[0].insertId;
    const created = await this.getMaterialCollection(insertedId);
    if (!created) throw new Error("Failed to create material collection");
    return created;
  }

  async updateMaterialCollection(id: string, collection: Partial<InsertMaterialCollection>): Promise<MaterialCollection | undefined> {
    await this.db.update(materialCollections)
      .set(collection)
      .where(eq(materialCollections.id, id));
    return this.getMaterialCollection(id);
  }

  async deleteMaterialCollection(id: string): Promise<boolean> {
    const result = await this.db.delete(materialCollections).where(eq(materialCollections.id, id));
    return result.affectedRows > 0;
  }

  // Material-Collection associations
  async getMaterialsByCollection(collectionId: string): Promise<Material[]> {
    const items = await this.db.select()
      .from(materialCollectionItems)
      .where(eq(materialCollectionItems.collectionId, collectionId));
    
    if (items.length === 0) return [];
    
    const materialIds = items.map(item => item.materialId);
    return this.db.select()
      .from(materials)
      .where(inArray(materials.id, materialIds));
  }

  async getCollectionsByMaterial(materialId: string): Promise<MaterialCollection[]> {
    const items = await this.db.select()
      .from(materialCollectionItems)
      .where(eq(materialCollectionItems.materialId, materialId));
    
    if (items.length === 0) return [];
    
    const collectionIds = items.map(item => item.collectionId);
    return this.db.select()
      .from(materialCollections)
      .where(inArray(materialCollections.id, collectionIds));
  }

  async addMaterialToCollection(materialId: string, collectionId: string): Promise<MaterialCollectionItem> {
    const result = await this.db.insert(materialCollectionItems).values({
      materialId,
      collectionId,
    });
    
    const items = await this.db.select()
      .from(materialCollectionItems)
      .where(and(
        eq(materialCollectionItems.materialId, materialId),
        eq(materialCollectionItems.collectionId, collectionId)
      ));
    
    return items[0];
  }

  async removeMaterialFromCollection(materialId: string, collectionId: string): Promise<boolean> {
    const result = await this.db.delete(materialCollectionItems)
      .where(and(
        eq(materialCollectionItems.materialId, materialId),
        eq(materialCollectionItems.collectionId, collectionId)
      ));
    return result.affectedRows > 0;
  }

  async updateMaterialCollections(materialId: string, collectionIds: string[]): Promise<void> {
    // Remove existing associations
    await this.db.delete(materialCollectionItems)
      .where(eq(materialCollectionItems.materialId, materialId));
    
    // Add new associations
    if (collectionIds.length > 0) {
      const items = collectionIds.map(collectionId => ({
        materialId,
        collectionId,
      }));
      await this.db.insert(materialCollectionItems).values(items);
    }
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    const conditions = [];
    
    if (this.tenantId) {
      conditions.push(eq(activities.tenantId, this.tenantId));
    }
    
    const query = this.db.select().from(activities);
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    return query;
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const result = await this.db.select()
      .from(activities)
      .where(eq(activities.id, id));
    return result[0];
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const result = await this.db.insert(activities).values(activity);
    const insertedId = result[0].insertId;
    const created = await this.getActivity(insertedId);
    if (!created) throw new Error("Failed to create activity");
    return created;
  }

  async updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined> {
    await this.db.update(activities)
      .set(activity)
      .where(eq(activities.id, id));
    return this.getActivity(id);
  }

  async deleteActivity(id: string): Promise<boolean> {
    const result = await this.db.delete(activities).where(eq(activities.id, id));
    return result.affectedRows > 0;
  }

  // Implement all other methods from IStorage interface...
  // For brevity, I'll implement the essential ones and you can add more as needed

  async getLessonPlans(teacherId?: string): Promise<LessonPlan[]> {
    const conditions = [];
    
    if (this.tenantId) {
      conditions.push(eq(lessonPlans.tenantId, this.tenantId));
    }
    
    if (teacherId) {
      conditions.push(eq(lessonPlans.teacherId, teacherId));
    }
    
    const query = this.db.select().from(lessonPlans);
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    return query;
  }

  async getLessonPlan(id: string): Promise<LessonPlan | undefined> {
    const result = await this.db.select()
      .from(lessonPlans)
      .where(eq(lessonPlans.id, id));
    return result[0];
  }

  async createLessonPlan(lessonPlan: InsertLessonPlan): Promise<LessonPlan> {
    const result = await this.db.insert(lessonPlans).values(lessonPlan);
    const insertedId = result[0].insertId;
    const created = await this.getLessonPlan(insertedId);
    if (!created) throw new Error("Failed to create lesson plan");
    return created;
  }

  async updateLessonPlan(id: string, lessonPlan: Partial<InsertLessonPlan>): Promise<LessonPlan | undefined> {
    await this.db.update(lessonPlans)
      .set(lessonPlan)
      .where(eq(lessonPlans.id, id));
    return this.getLessonPlan(id);
  }

  async deleteLessonPlan(id: string): Promise<boolean> {
    const result = await this.db.delete(lessonPlans).where(eq(lessonPlans.id, id));
    return result.affectedRows > 0;
  }

  // Tenant and Token Management
  async getTenant(id: string): Promise<Tenant | undefined> {
    const result = await this.db.select()
      .from(tenants)
      .where(eq(tenants.id, id));
    return result[0];
  }

  async getTokenSecret(tenantId: string): Promise<TokenSecret | undefined> {
    const result = await this.db.select()
      .from(tokenSecrets)
      .where(eq(tokenSecrets.tenantId, tenantId));
    return result[0];
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    const conditions = [];
    
    if (this.tenantId) {
      conditions.push(eq(locations.tenantId, this.tenantId));
    }
    
    const query = this.db.select().from(locations);
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    return query;
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const result = await this.db.select()
      .from(locations)
      .where(eq(locations.id, id));
    return result[0];
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const result = await this.db.insert(locations).values(location);
    const insertedId = result[0].insertId;
    const created = await this.getLocation(insertedId);
    if (!created) throw new Error("Failed to create location");
    return created;
  }

  async updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location | undefined> {
    await this.db.update(locations)
      .set(location)
      .where(eq(locations.id, id));
    return this.getLocation(id);
  }

  async deleteLocation(id: string): Promise<boolean> {
    const result = await this.db.delete(locations).where(eq(locations.id, id));
    return result.affectedRows > 0;
  }

  // Implement remaining methods with placeholder implementations
  // These will need to be properly implemented based on your needs
  
  async getLessonPlansForReview(locationId?: string): Promise<any[]> {
    return [];
  }
  
  async submitLessonPlanForReview(id: string, userId: string): Promise<LessonPlan | undefined> {
    return this.updateLessonPlan(id, { status: 'pending', submittedAt: new Date(), submittedBy: userId });
  }
  
  async withdrawLessonPlanFromReview(id: string): Promise<LessonPlan | undefined> {
    return this.updateLessonPlan(id, { status: 'draft', submittedAt: null, submittedBy: null });
  }
  
  async approveLessonPlan(id: string, userId: string, notes?: string): Promise<LessonPlan | undefined> {
    return this.updateLessonPlan(id, { status: 'approved', approvedAt: new Date(), approvedBy: userId, reviewNotes: notes });
  }
  
  async rejectLessonPlan(id: string, userId: string, notes: string): Promise<LessonPlan | undefined> {
    return this.updateLessonPlan(id, { status: 'rejected', rejectedAt: new Date(), rejectedBy: userId, reviewNotes: notes });
  }
  
  async getLessonPlanByRoomAndWeek(roomId: string, weekStart: string): Promise<LessonPlan | undefined> {
    const result = await this.db.select()
      .from(lessonPlans)
      .where(and(
        eq(lessonPlans.roomId, roomId),
        eq(lessonPlans.weekStart, weekStart)
      ));
    return result[0];
  }
  
  async getScheduledActivitiesByLessonPlan(lessonPlanId: string): Promise<ScheduledActivity[]> {
    return this.db.select()
      .from(scheduledActivities)
      .where(eq(scheduledActivities.lessonPlanId, lessonPlanId));
  }

  async getScheduledActivities(lessonPlanId: string, locationId?: string, roomId?: string): Promise<ScheduledActivity[]> {
    const conditions = [eq(scheduledActivities.lessonPlanId, lessonPlanId)];
    
    const query = this.db.select().from(scheduledActivities);
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    return query;
  }

  async getAllScheduledActivities(): Promise<ScheduledActivity[]> {
    return this.db.select().from(scheduledActivities);
  }

  async getScheduledActivity(id: string): Promise<ScheduledActivity | undefined> {
    const result = await this.db.select()
      .from(scheduledActivities)
      .where(eq(scheduledActivities.id, id));
    return result[0];
  }

  async createScheduledActivity(scheduledActivity: InsertScheduledActivity): Promise<ScheduledActivity> {
    const result = await this.db.insert(scheduledActivities).values(scheduledActivity);
    const insertedId = result[0].insertId;
    const created = await this.getScheduledActivity(insertedId);
    if (!created) throw new Error("Failed to create scheduled activity");
    return created;
  }

  async updateScheduledActivity(id: string, scheduledActivity: Partial<InsertScheduledActivity>): Promise<ScheduledActivity | undefined> {
    await this.db.update(scheduledActivities)
      .set(scheduledActivity)
      .where(eq(scheduledActivities.id, id));
    return this.getScheduledActivity(id);
  }

  async deleteScheduledActivity(id: string): Promise<boolean> {
    const result = await this.db.delete(scheduledActivities).where(eq(scheduledActivities.id, id));
    return result.affectedRows > 0;
  }

  // Rooms
  async getRooms(): Promise<Room[]> {
    const conditions = [];
    
    if (this.tenantId) {
      conditions.push(eq(rooms.tenantId, this.tenantId));
    }
    
    const query = this.db.select().from(rooms);
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    return query;
  }

  async getRoomsByLocation(locationId: string): Promise<Room[]> {
    const conditions = [eq(rooms.locationId, locationId)];
    
    if (this.tenantId) {
      conditions.push(eq(rooms.tenantId, this.tenantId));
    }
    
    return this.db.select()
      .from(rooms)
      .where(and(...conditions));
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const result = await this.db.select()
      .from(rooms)
      .where(eq(rooms.id, id));
    return result[0];
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const result = await this.db.insert(rooms).values(room);
    const insertedId = result[0].insertId;
    const created = await this.getRoom(insertedId);
    if (!created) throw new Error("Failed to create room");
    return created;
  }

  async updateRoom(id: string, room: Partial<InsertRoom>): Promise<Room | undefined> {
    await this.db.update(rooms)
      .set(room)
      .where(eq(rooms.id, id));
    return this.getRoom(id);
  }

  async deleteRoom(id: string): Promise<boolean> {
    const result = await this.db.delete(rooms).where(eq(rooms.id, id));
    return result.affectedRows > 0;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const conditions = [];
    
    if (this.tenantId) {
      conditions.push(
        or(
          eq(categories.tenantId, this.tenantId),
          isNull(categories.tenantId)
        )
      );
    }
    
    const query = this.db.select().from(categories);
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    return query;
  }

  async getCategoriesByType(type: string): Promise<Category[]> {
    const conditions = [eq(categories.type, type)];
    
    if (this.tenantId) {
      conditions.push(
        or(
          eq(categories.tenantId, this.tenantId),
          isNull(categories.tenantId)
        )
      );
    }
    
    return this.db.select()
      .from(categories)
      .where(and(...conditions));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await this.db.select()
      .from(categories)
      .where(eq(categories.id, id));
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await this.db.insert(categories).values(category);
    const insertedId = result[0].insertId;
    const created = await this.getCategory(insertedId);
    if (!created) throw new Error("Failed to create category");
    return created;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    await this.db.update(categories)
      .set(category)
      .where(eq(categories.id, id));
    return this.getCategory(id);
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await this.db.delete(categories).where(eq(categories.id, id));
    return result.affectedRows > 0;
  }

  // Age Groups
  async getAgeGroups(): Promise<AgeGroup[]> {
    const conditions = [];
    
    if (this.tenantId) {
      conditions.push(eq(ageGroups.tenantId, this.tenantId));
    }
    
    const query = this.db.select().from(ageGroups);
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    return query;
  }

  async getAgeGroup(id: string): Promise<AgeGroup | undefined> {
    const result = await this.db.select()
      .from(ageGroups)
      .where(eq(ageGroups.id, id));
    return result[0];
  }

  async createAgeGroup(ageGroup: InsertAgeGroup): Promise<AgeGroup> {
    const result = await this.db.insert(ageGroups).values(ageGroup);
    const insertedId = result[0].insertId;
    const created = await this.getAgeGroup(insertedId);
    if (!created) throw new Error("Failed to create age group");
    return created;
  }

  async updateAgeGroup(id: string, ageGroup: Partial<InsertAgeGroup>): Promise<AgeGroup | undefined> {
    await this.db.update(ageGroups)
      .set(ageGroup)
      .where(eq(ageGroups.id, id));
    return this.getAgeGroup(id);
  }

  async deleteAgeGroup(id: string): Promise<boolean> {
    const result = await this.db.delete(ageGroups).where(eq(ageGroups.id, id));
    return result.affectedRows > 0;
  }

  // Tenant Settings
  async getTenantSettings(): Promise<TenantSettings | undefined> {
    if (!this.tenantId) return undefined;
    
    const result = await this.db.select()
      .from(tenantSettings)
      .where(eq(tenantSettings.tenantId, this.tenantId));
    return result[0];
  }

  async updateTenantSettings(settings: Partial<InsertTenantSettings>): Promise<TenantSettings> {
    if (!this.tenantId) throw new Error("Tenant context not set");
    
    const existing = await this.getTenantSettings();
    
    if (existing) {
      await this.db.update(tenantSettings)
        .set(settings)
        .where(eq(tenantSettings.tenantId, this.tenantId));
    } else {
      await this.db.insert(tenantSettings).values({
        ...settings,
        tenantId: this.tenantId,
      });
    }
    
    const updated = await this.getTenantSettings();
    if (!updated) throw new Error("Failed to update tenant settings");
    return updated;
  }

  // Permissions
  async getPermissions(): Promise<Permission[]> {
    return this.db.select().from(permissions);
  }

  async getPermission(id: string): Promise<Permission | undefined> {
    const result = await this.db.select()
      .from(permissions)
      .where(eq(permissions.id, id));
    return result[0];
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const result = await this.db.insert(permissions).values(permission);
    const insertedId = result[0].insertId;
    const created = await this.getPermission(insertedId);
    if (!created) throw new Error("Failed to create permission");
    return created;
  }

  // Roles
  async getRoles(): Promise<Role[]> {
    return this.db.select().from(roles);
  }

  async getRole(id: string): Promise<Role | undefined> {
    const result = await this.db.select()
      .from(roles)
      .where(eq(roles.id, id));
    return result[0];
  }

  async createRole(role: InsertRole): Promise<Role> {
    const result = await this.db.insert(roles).values(role);
    const insertedId = result[0].insertId;
    const created = await this.getRole(insertedId);
    if (!created) throw new Error("Failed to create role");
    return created;
  }

  async updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined> {
    await this.db.update(roles)
      .set(role)
      .where(eq(roles.id, id));
    return this.getRole(id);
  }

  // Role Permissions
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return this.db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
  }

  async addRolePermission(rolePermission: InsertRolePermission): Promise<RolePermission> {
    const result = await this.db.insert(rolePermissions).values(rolePermission);
    
    const items = await this.db.select()
      .from(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, rolePermission.roleId),
        eq(rolePermissions.permissionId, rolePermission.permissionId)
      ));
    
    return items[0];
  }

  async removeRolePermission(roleId: string, permissionId: string): Promise<boolean> {
    const result = await this.db.delete(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      ));
    return result.affectedRows > 0;
  }

  // Tenant Permission Overrides
  async getTenantPermissionOverride(tenantId: string, permissionName: string): Promise<TenantPermissionOverride | undefined> {
    const result = await this.db.select()
      .from(tenantPermissionOverrides)
      .where(and(
        eq(tenantPermissionOverrides.tenantId, tenantId),
        eq(tenantPermissionOverrides.permissionName, permissionName)
      ));
    return result[0];
  }

  async getTenantPermissionOverrides(tenantId: string): Promise<TenantPermissionOverride[]> {
    return this.db.select()
      .from(tenantPermissionOverrides)
      .where(eq(tenantPermissionOverrides.tenantId, tenantId));
  }

  async createTenantPermissionOverride(override: InsertTenantPermissionOverride): Promise<TenantPermissionOverride> {
    const result = await this.db.insert(tenantPermissionOverrides).values(override);
    const insertedId = result[0].insertId;
    
    const created = await this.db.select()
      .from(tenantPermissionOverrides)
      .where(eq(tenantPermissionOverrides.id, insertedId));
    
    if (!created[0]) throw new Error("Failed to create tenant permission override");
    return created[0];
  }

  async updateTenantPermissionOverride(id: string, override: Partial<InsertTenantPermissionOverride>): Promise<TenantPermissionOverride | undefined> {
    await this.db.update(tenantPermissionOverrides)
      .set(override)
      .where(eq(tenantPermissionOverrides.id, id));
    
    const result = await this.db.select()
      .from(tenantPermissionOverrides)
      .where(eq(tenantPermissionOverrides.id, id));
    
    return result[0];
  }

  // Permission Checking
  async checkUserPermission(userId: string, role: string, resource: string, action: string, tenantId: string): Promise<{ hasPermission: boolean; requiresApproval: boolean; reason?: string }> {
    // This is a simplified implementation
    // You should implement proper permission checking logic based on your requirements
    return {
      hasPermission: true,
      requiresApproval: false
    };
  }

  // Notifications
  async getActiveNotifications(userId: string): Promise<Notification[]> {
    return this.db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isActive, true)
      ));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await this.db.insert(notifications).values(notification);
    const insertedId = result[0].insertId;
    
    const created = await this.db.select()
      .from(notifications)
      .where(eq(notifications.id, insertedId));
    
    if (!created[0]) throw new Error("Failed to create notification");
    return created[0];
  }

  async dismissNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await this.db.update(notifications)
      .set({ isActive: false, dismissedAt: new Date() })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
    return result.affectedRows > 0;
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await this.db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
    return result.affectedRows > 0;
  }

  // Activity Records
  async getActivityRecords(scheduledActivityId: string): Promise<ActivityRecord[]> {
    return this.db.select()
      .from(activityRecords)
      .where(eq(activityRecords.scheduledActivityId, scheduledActivityId));
  }

  async getActivityRecord(id: string): Promise<ActivityRecord | undefined> {
    const result = await this.db.select()
      .from(activityRecords)
      .where(eq(activityRecords.id, id));
    return result[0];
  }

  async createActivityRecord(activityRecord: InsertActivityRecord): Promise<ActivityRecord> {
    const result = await this.db.insert(activityRecords).values(activityRecord);
    const insertedId = result[0].insertId;
    const created = await this.getActivityRecord(insertedId);
    if (!created) throw new Error("Failed to create activity record");
    return created;
  }

  async updateActivityRecord(id: string, updates: Partial<InsertActivityRecord>): Promise<ActivityRecord | undefined> {
    await this.db.update(activityRecords)
      .set(updates)
      .where(eq(activityRecords.id, id));
    return this.getActivityRecord(id);
  }

  async deleteActivityRecord(id: string): Promise<boolean> {
    const result = await this.db.delete(activityRecords).where(eq(activityRecords.id, id));
    return result.affectedRows > 0;
  }

  async getCompletedActivityRecords(filters: {
    locationId?: string;
    roomId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<ActivityRecord[]> {
    const conditions = [eq(activityRecords.isCompleted, true)];
    
    // You would need to join with scheduledActivities and lessonPlans to filter by location and room
    // This is a simplified implementation
    
    const query = this.db.select().from(activityRecords);
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    return query;
  }
}