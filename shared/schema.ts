import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tenants table for multi-tenant JWT authentication
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  jwtSecret: text("jwt_secret").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Users table (teachers)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  classroom: text("classroom"),
});

// Developmental milestones
export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // Social, Emotional, Cognitive, Physical
  ageRangeStart: integer("age_range_start").notNull(), // in months
  ageRangeEnd: integer("age_range_end").notNull(), // in months
  learningObjective: text("learning_objective").notNull(),
});

// Materials
export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  location: text("location").notNull(),
  status: text("status").notNull().default("in_stock"), // in_stock, low_stock, out_of_stock, on_order
});

// Activities
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // in minutes
  ageRangeStart: integer("age_range_start").notNull(), // in months
  ageRangeEnd: integer("age_range_end").notNull(), // in months
  teachingObjectives: json("teaching_objectives").$type<string[]>().notNull().default([]),
  milestoneIds: json("milestone_ids").$type<string[]>().notNull().default([]),
  materialIds: json("material_ids").$type<string[]>().notNull().default([]),
  instructions: json("instructions").$type<string[]>().notNull().default([]),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
});

// Lesson plans
export const lessonPlans = pgTable("lesson_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  weekStart: text("week_start").notNull(), // ISO date string
  room: text("room").notNull(),
  status: text("status").notNull().default("draft"), // draft, submitted, approved
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
});

// Scheduled activities (activities placed in calendar slots)
export const scheduledActivities = pgTable("scheduled_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonPlanId: varchar("lesson_plan_id").notNull().references(() => lessonPlans.id),
  activityId: varchar("activity_id").notNull().references(() => activities.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-4 (Monday-Friday)
  timeSlot: integer("time_slot").notNull(), // 0-4 (time slots throughout day)
  notes: text("notes"),
});

// Zod schemas for validation
export const insertTenantSchema = createInsertSchema(tenants).pick({
  name: true,
  jwtSecret: true,
  isActive: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  tenantId: true,
  username: true,
  password: true,
  name: true,
  email: true,
  classroom: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).pick({
  title: true,
  description: true,
  category: true,
  ageRangeStart: true,
  ageRangeEnd: true,
  learningObjective: true,
});

export const insertMaterialSchema = createInsertSchema(materials).pick({
  name: true,
  description: true,
  category: true,
  quantity: true,
  location: true,
  status: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  title: true,
  description: true,
  duration: true,
  ageRangeStart: true,
  ageRangeEnd: true,
  teachingObjectives: true,
  milestoneIds: true,
  materialIds: true,
  instructions: true,
  videoUrl: true,
  imageUrl: true,
  category: true,
});

export const insertLessonPlanSchema = createInsertSchema(lessonPlans).pick({
  teacherId: true,
  weekStart: true,
  room: true,
  status: true,
});

export const insertScheduledActivitySchema = createInsertSchema(scheduledActivities).pick({
  lessonPlanId: true,
  activityId: true,
  dayOfWeek: true,
  timeSlot: true,
  notes: true,
});

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

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
