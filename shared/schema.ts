import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tenants table for multi-tenant support
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Token secrets table - separate from tenants for security
export const tokenSecrets = pgTable("token_secrets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  jwtSecret: text("jwt_secret").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Permissions table
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(), // e.g., "lesson_plan.submit"
  resource: text("resource").notNull(), // e.g., "lesson_plan"
  action: text("action").notNull(), // e.g., "submit"
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Roles table
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(), // "teacher", "director", etc.
  description: text("description").notNull(),
  isSystem: boolean("is_system").default(false).notNull(), // System roles can't be deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Role-Permission junction table
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  roleId: varchar("role_id").notNull().references(() => roles.id),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tenant-specific permission overrides
export const tenantPermissionOverrides = pgTable("tenant_permission_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  permissionName: text("permission_name").notNull(), // e.g., "lesson_plan.submit"
  rolesRequired: json("roles_required").$type<string[]>().notNull().default([]), // Roles that need approval
  autoApproveRoles: json("auto_approve_roles").$type<string[]>().notNull().default([]), // Roles that bypass approval
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table - tracks users from JWT tokens
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: text("user_id").notNull(), // User ID from JWT token
  username: text("username").notNull(), // Username/email from JWT token
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull(), // Admin, Teacher, etc.
  locations: json("locations").$type<string[]>().notNull().default([]), // Array of location names from JWT
  firstLoginDate: timestamp("first_login_date").notNull().defaultNow(),
  lastLoginDate: timestamp("last_login_date").notNull().defaultNow(),
  loginCount: integer("login_count").notNull().default(1),
  lastTokenPayload: json("last_token_payload"), // Store complete JWT payload for reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Developmental milestones
export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  locationIds: json("location_ids").$type<string[]>().notNull().default([]), // Multi-select locations
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // Social, Emotional, Cognitive, Physical
  ageGroupIds: json("age_group_ids").$type<string[]>().notNull().default([]), // Multi-select age groups
  learningObjective: text("learning_objective").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("active"), // active, disabled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// Materials
export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  locationIds: json("location_ids").$type<string[]>().notNull().default([]), // Multi-select locations
  name: text("name").notNull(),
  description: text("description").notNull(),
  ageGroups: json("age_groups").$type<string[]>().notNull().default([]), // Multi-select age groups for safety
  location: text("location").notNull(), // Storage location within the facility
  photoUrl: text("photo_url"), // URL to uploaded photo
  status: text("status").notNull().default("active"), // active or deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete timestamp
});

// Material Collections - for organizing materials into groups
export const materialCollections = pgTable("material_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  locationIds: json("location_ids").$type<string[]>().notNull().default([]), // Multi-select locations
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Junction table for many-to-many relationship between materials and collections
export const materialCollectionItems = pgTable("material_collection_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  materialId: varchar("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  collectionId: varchar("collection_id").notNull().references(() => materialCollections.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Instruction step type with optional image
export interface InstructionStep {
  text: string;
  imageUrl?: string;
}

// Activities
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  locationId: varchar("location_id").notNull().references(() => locations.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // in minutes
  ageGroupIds: json("age_group_ids").$type<string[]>().default([]), // Multi-select age groups
  milestoneIds: json("milestone_ids").$type<string[]>().notNull().default([]),
  materialIds: json("material_ids").$type<string[]>().notNull().default([]),
  instructions: json("instructions").$type<InstructionStep[]>().notNull().default([]),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  // AI-generated fields
  objectives: json("objectives").$type<string[]>().default([]), // Learning objectives
  preparationTime: integer("preparation_time"), // Setup time in minutes
  safetyConsiderations: json("safety_considerations").$type<string[]>().default([]),
  spaceRequired: text("space_required"), // Indoor/Outdoor/Both
  groupSize: text("group_size"), // e.g. "1-4 children"
  minChildren: integer("min_children").default(1), // Minimum number of children for this activity
  maxChildren: integer("max_children").default(10), // Maximum number of children for this activity
  messLevel: text("mess_level"), // Low/Medium/High
  variations: json("variations").$type<string[]>().default([]), // Activity variations
  // System fields
  status: text("status").notNull().default("active"), // active, disabled
  isActive: boolean("is_active").default(true).notNull(), // Soft delete flag
  deletedOn: timestamp("deleted_on"), // Timestamp when soft deleted
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// Lesson plans
export const lessonPlans = pgTable("lesson_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  locationId: varchar("location_id").notNull().references(() => locations.id),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  weekStart: text("week_start").notNull(), // ISO date string
  scheduleType: varchar("schedule_type", { length: 50 }).notNull().default("time-based"), // "time-based" or "position-based"
  status: text("status").notNull().default("draft"), // draft, submitted, approved, rejected
  submittedAt: timestamp("submitted_at"),
  submittedBy: varchar("submitted_by").references(() => users.id), // User who submitted for review
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id), // User who approved
  rejectedAt: timestamp("rejected_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id), // User who rejected
  reviewNotes: text("review_notes"), // Notes from reviewer
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Activity usage tracking
export const activityUsage = pgTable("activity_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  activityId: varchar("activity_id").notNull().references(() => activities.id),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  usedAt: timestamp("used_at").defaultNow().notNull(),
  duration: integer("duration"), // Actual duration in minutes
  notes: text("notes"),
});

// Teacher reviews for activities
export const activityReviews = pgTable("activity_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  activityId: varchar("activity_id").notNull().references(() => activities.id),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  engagementLevel: integer("engagement_level"), // 1-5 scale
  difficultyLevel: integer("difficulty_level"), // 1-5 scale
  wouldRecommend: boolean("would_recommend"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Scheduled activities (activities placed in calendar slots)
export const scheduledActivities = pgTable("scheduled_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  locationId: varchar("location_id").notNull().references(() => locations.id),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  lessonPlanId: varchar("lesson_plan_id").notNull().references(() => lessonPlans.id),
  activityId: varchar("activity_id").notNull().references(() => activities.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-4 (Monday-Friday)
  timeSlot: integer("time_slot").notNull(), // 0-4 (time slots throughout day)
  notes: text("notes"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
});

// Activity Records - tracks completion and feedback for scheduled activities during teaching
export const activityRecords = pgTable("activity_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  scheduledActivityId: varchar("scheduled_activity_id").notNull().references(() => scheduledActivities.id),
  userId: varchar("user_id").notNull().references(() => users.id), // Teacher who completed the activity
  completed: boolean("completed").default(false).notNull(),
  notes: text("notes"), // Teaching notes about how the activity went
  materialsUsed: boolean("materials_used"), // Whether suggested materials were used
  materialFeedback: text("material_feedback"), // Feedback about the materials
  rating: integer("rating"), // 1-5 star rating for the activity
  ratingFeedback: text("rating_feedback"), // Optional feedback about the rating
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notifications table for tracking lesson plan notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'lesson_plan_returned', 'lesson_plan_approved', etc.
  lessonPlanId: varchar("lesson_plan_id").references(() => lessonPlans.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  reviewNotes: text("review_notes"), // Feedback from reviewer
  weekStart: timestamp("week_start"), // The week of the lesson plan
  locationId: varchar("location_id").references(() => locations.id),
  roomId: varchar("room_id").references(() => rooms.id),
  isRead: boolean("is_read").default(false).notNull(),
  isDismissed: boolean("is_dismissed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  dismissedAt: timestamp("dismissed_at"),
});

// Zod schemas for validation
export const insertTenantSchema = createInsertSchema(tenants).pick({
  name: true,
  isActive: true,
});

export const insertTokenSecretSchema = createInsertSchema(tokenSecrets).pick({
  tenantId: true,
  jwtSecret: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  tenantId: true,
  userId: true,
  username: true,
  firstName: true,
  lastName: true,
  role: true,
  locations: true,
  lastTokenPayload: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
});

export const insertMaterialCollectionSchema = createInsertSchema(materialCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaterialCollectionItemSchema = createInsertSchema(materialCollectionItems).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUsedAt: true,
  usageCount: true
});

export const insertLessonPlanSchema = createInsertSchema(lessonPlans).omit({
  id: true,
  submittedAt: true,
  approvedAt: true,
});

export const insertScheduledActivitySchema = createInsertSchema(scheduledActivities).omit({
  id: true,
});

export const insertActivityUsageSchema = createInsertSchema(activityUsage).omit({
  id: true,
  usedAt: true,
});

export const insertActivityReviewSchema = createInsertSchema(activityReviews).omit({
  id: true,
  createdAt: true,
});

export const insertActivityRecordSchema = createInsertSchema(activityRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  dismissedAt: true,
});

// Permission schemas
export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

export const insertTenantPermissionOverrideSchema = createInsertSchema(tenantPermissionOverrides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Settings-related tables
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"),
  capacity: integer("capacity"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  capacity: integer("capacity"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // hex color code
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ageGroups = pgTable("age_groups", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ageRangeStart: integer("age_range_start").notNull(),
  ageRangeEnd: integer("age_range_end").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Organization Settings table for tenant-wide configuration
export const tenantSettings = pgTable("tenant_settings", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull().unique(),
  // Location-specific schedule settings
  locationSettings: json("location_settings").$type<{
    [locationId: string]: {
      scheduleType: "time-based" | "position-based";
      startTime?: string; // HH:MM format for time-based
      endTime?: string; // HH:MM format for time-based
      slotsPerDay?: number; // For position-based scheduling
    }
  }>().default({}),
  // Default settings for new locations
  defaultScheduleType: varchar("default_schedule_type", { length: 50 }).notNull().default("time-based"),
  defaultStartTime: varchar("default_start_time", { length: 5 }).default("06:00"),
  defaultEndTime: varchar("default_end_time", { length: 5 }).default("18:00"),
  defaultSlotsPerDay: integer("default_slots_per_day").default(8),
  weekStartDay: integer("week_start_day").default(1), // 0=Sunday, 1=Monday
  autoSaveInterval: integer("auto_save_interval").default(5), // minutes
  enableNotifications: boolean("enable_notifications").default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Settings schemas
export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertAgeGroupSchema = createInsertSchema(ageGroups).omit({
  id: true,
  createdAt: true,
});

export const insertTenantSettingsSchema = createInsertSchema(tenantSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports for organization settings
export type TenantSettings = typeof tenantSettings.$inferSelect;
export type InsertTenantSettings = z.infer<typeof insertTenantSettingsSchema>;

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type TokenSecret = typeof tokenSecrets.$inferSelect;
export type InsertTokenSecret = z.infer<typeof insertTokenSecretSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export type MaterialCollection = typeof materialCollections.$inferSelect;
export type InsertMaterialCollection = z.infer<typeof insertMaterialCollectionSchema>;

export type MaterialCollectionItem = typeof materialCollectionItems.$inferSelect;
export type InsertMaterialCollectionItem = z.infer<typeof insertMaterialCollectionItemSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type LessonPlan = typeof lessonPlans.$inferSelect;
export type InsertLessonPlan = z.infer<typeof insertLessonPlanSchema>;

export type ScheduledActivity = typeof scheduledActivities.$inferSelect;
export type InsertScheduledActivity = z.infer<typeof insertScheduledActivitySchema>;

export type ActivityUsage = typeof activityUsage.$inferSelect;
export type InsertActivityUsage = z.infer<typeof insertActivityUsageSchema>;

export type ActivityReview = typeof activityReviews.$inferSelect;
export type InsertActivityReview = z.infer<typeof insertActivityReviewSchema>;

export type ActivityRecord = typeof activityRecords.$inferSelect;
export type InsertActivityRecord = z.infer<typeof insertActivityRecordSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Settings types
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type AgeGroup = typeof ageGroups.$inferSelect;
export type InsertAgeGroup = z.infer<typeof insertAgeGroupSchema>;

// Permission types
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type TenantPermissionOverride = typeof tenantPermissionOverrides.$inferSelect;
export type InsertTenantPermissionOverride = z.infer<typeof insertTenantPermissionOverrideSchema>;

// Relations for settings tables
export const locationsRelations = relations(locations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [locations.tenantId], references: [tenants.id] }),
  rooms: many(rooms),
}));

export const roomsRelations = relations(rooms, ({ one }) => ({
  tenant: one(tenants, { fields: [rooms.tenantId], references: [tenants.id] }),
  location: one(locations, { fields: [rooms.locationId], references: [locations.id] }),
}));

export const categoriesRelations = relations(categories, ({ one }) => ({
  tenant: one(tenants, { fields: [categories.tenantId], references: [tenants.id] }),
}));

export const ageGroupsRelations = relations(ageGroups, ({ one }) => ({
  tenant: one(tenants, { fields: [ageGroups.tenantId], references: [tenants.id] }),
}));

// Activity Records relations
export const activityRecordsRelations = relations(activityRecords, ({ one }) => ({
  tenant: one(tenants, { fields: [activityRecords.tenantId], references: [tenants.id] }),
  scheduledActivity: one(scheduledActivities, { fields: [activityRecords.scheduledActivityId], references: [scheduledActivities.id] }),
  user: one(users, { fields: [activityRecords.userId], references: [users.id] }),
}));

// Scheduled Activities relations
export const scheduledActivitiesRelations = relations(scheduledActivities, ({ one, many }) => ({
  tenant: one(tenants, { fields: [scheduledActivities.tenantId], references: [tenants.id] }),
  location: one(locations, { fields: [scheduledActivities.locationId], references: [locations.id] }),
  room: one(rooms, { fields: [scheduledActivities.roomId], references: [rooms.id] }),
  lessonPlan: one(lessonPlans, { fields: [scheduledActivities.lessonPlanId], references: [lessonPlans.id] }),
  activity: one(activities, { fields: [scheduledActivities.activityId], references: [activities.id] }),
  activityRecords: many(activityRecords),
}));
