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

// Users table (teachers)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  username: text("username").notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  classroom: text("classroom"),
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
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Lesson plans
export const lessonPlans = pgTable("lesson_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  locationId: varchar("location_id").notNull().references(() => locations.id),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  weekStart: text("week_start").notNull(), // ISO date string
  status: text("status").notNull().default("draft"), // draft, submitted, approved
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
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
  username: true,
  password: true,
  name: true,
  email: true,
  classroom: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
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

// Settings types
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type AgeGroup = typeof ageGroups.$inferSelect;
export type InsertAgeGroup = z.infer<typeof insertAgeGroupSchema>;

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
