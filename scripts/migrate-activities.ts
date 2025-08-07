import { db } from "../server/db";
import { activities, ageGroups, type InstructionStep } from "@shared/schema";
import { eq } from "drizzle-orm";

async function migrateActivities() {
  console.log("Starting activity migration...");
  
  try {
    // Get all existing activities
    const allActivities = await db.select().from(activities);
    console.log(`Found ${allActivities.length} activities to migrate`);
    
    // Get all age groups for mapping
    const allAgeGroups = await db.select().from(ageGroups);
    console.log(`Found ${allAgeGroups.length} age groups`);
    
    // Migrate each activity
    for (const activity of allActivities) {
      console.log(`Migrating activity: ${activity.title}`);
      
      // Convert age ranges to age group IDs
      let ageGroupIds: string[] = [];
      if ('ageRangeStart' in activity && 'ageRangeEnd' in activity) {
        // Find matching age groups based on age range
        const matchingGroups = allAgeGroups.filter(group => {
          const activityStart = (activity as any).ageRangeStart || 0;
          const activityEnd = (activity as any).ageRangeEnd || 999;
          
          // Check if age group overlaps with activity age range
          return (group.ageRangeStart <= activityEnd && group.ageRangeEnd >= activityStart);
        });
        
        ageGroupIds = matchingGroups.map(g => g.id);
        console.log(`  - Mapped to ${ageGroupIds.length} age groups`);
      }
      
      // Convert string instructions to InstructionStep objects if needed
      let instructions: InstructionStep[] = [];
      if (Array.isArray(activity.instructions)) {
        instructions = activity.instructions.map((inst: any) => {
          if (typeof inst === 'string') {
            return { text: inst };
          }
          return inst;
        });
      }
      
      // Update the activity with new structure
      await db.update(activities)
        .set({
          ageGroupIds: ageGroupIds.length > 0 ? ageGroupIds : ['default-age-group'],
          instructions: instructions,
          usageCount: 0,
          updatedAt: new Date()
        })
        .where(eq(activities.id, activity.id));
      
      console.log(`  - Updated activity ${activity.id}`);
    }
    
    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the migration
migrateActivities();