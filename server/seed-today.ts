import { db } from "./db";
import { lessonPlans, scheduledActivities } from "@shared/schema";
import { startOfWeek } from "date-fns";

async function seedTodayData() {
  const tenantId = "7cb6c28d-164c-49fa-b461-dfc47a8a3fed";
  const locationId = "bfd1dc14-6c6b-4fa3-890b-e5b096cd29f4"; // Main Campus
  const roomId = "be3e6a76-17cb-4421-824a-272e24cf302f"; // Sunshine Room
  const teacherId = "0e73dc5e-6216-4c37-9415-dd881aa8e58a"; // Valid teacher ID
  
  // Get the start of current week (Sunday) - August 3, 2025
  const weekStart = new Date('2025-08-03T00:00:00.000Z');
  
  console.log("Creating lesson plan for week starting:", weekStart);
  
  // Create a lesson plan for current week
  const [lessonPlan] = await db.insert(lessonPlans).values({
    tenantId,
    locationId,
    roomId,
    weekStart,
    teacherId,
    theme: "Recording Test Week",
    notes: "Test lesson plan for tablet recording feature"
  }).returning();
  
  console.log("Created lesson plan:", lessonPlan.id);
  
  // Add activities for Friday (day 4)
  const fridayActivities = [
    {
      tenantId,
      locationId,
      roomId,
      lessonPlanId: lessonPlan.id,
      activityId: "a57a6101-8997-487e-bce9-06236732df32", // Mystery Sorting Safari
      dayOfWeek: 4, // Friday
      timeSlot: 2, // 8:00 AM
    },
    {
      tenantId,
      locationId,
      roomId,
      lessonPlanId: lessonPlan.id,
      activityId: "ea042709-14c5-4a69-b52a-d2001a07b711", // Animal Movement Obstacle Course
      dayOfWeek: 4, // Friday
      timeSlot: 4, // 10:00 AM
    },
    {
      tenantId,
      locationId,
      roomId,
      lessonPlanId: lessonPlan.id,
      activityId: "594ccd61-0ab3-47ce-9ffe-5ee55821e148", // Rainbow Block Sorting Adventure
      dayOfWeek: 4, // Friday
      timeSlot: 7, // 1:00 PM
    },
    {
      tenantId,
      locationId,
      roomId,
      lessonPlanId: lessonPlan.id,
      activityId: "c7487935-8940-465a-a320-045be793152f", // Animal Action Obstacle Course
      dayOfWeek: 4, // Friday
      timeSlot: 9, // 3:00 PM
    }
  ];
  
  const insertedActivities = await db.insert(scheduledActivities).values(fridayActivities).returning();
  
  console.log(`Added ${insertedActivities.length} activities for Friday`);
  console.log("Test data created successfully!");
}

seedTodayData().catch(console.error).finally(() => process.exit());