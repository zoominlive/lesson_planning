import { db } from "../server/db";
import { milestones } from "../shared/schema";
import { eq } from "drizzle-orm";
import { milestoneStorage } from "../server/milestoneStorage";
import fs from "fs";
import path from "path";

const tenantId = "7cb6c28d-164c-49fa-b461-dfc47a8a3fed";

// Map of milestone titles to generated image files
const milestoneImages = [
  {
    title: "Shares toys with peers",
    category: "Social",
    imagePath: "attached_assets/generated_images/Children_sharing_toys_cooperatively_16e7d139.png"
  },
  {
    title: "Comforts others when upset",
    category: "Emotional",
    imagePath: "attached_assets/generated_images/Child_comforting_sad_friend_f0ba417c.png"
  },
  {
    title: "Completes simple puzzles",
    category: "Cognitive",
    imagePath: "attached_assets/generated_images/Children_solving_block_puzzles_42948e6c.png"
  },
  {
    title: "Climbs playground equipment",
    category: "Physical",
    imagePath: "attached_assets/generated_images/Children_climbing_playground_equipment_ec0ff208.png"
  }
];

async function uploadMilestoneImages() {
  console.log("Starting milestone image upload...");
  
  try {
    for (const imageData of milestoneImages) {
      console.log(`Processing: ${imageData.title}`);
      
      // Check if the image file exists
      const imagePath = path.join(process.cwd(), imageData.imagePath);
      if (!fs.existsSync(imagePath)) {
        console.log(`  - Image file not found: ${imagePath}`);
        continue;
      }
      
      // Read the image file
      const imageBuffer = fs.readFileSync(imagePath);
      const fileName = path.basename(imagePath);
      
      // Upload to object storage
      console.log(`  - Uploading to object storage...`);
      const imageUrl = await milestoneStorage.uploadMilestoneImage(
        tenantId,
        imageBuffer,
        fileName
      );
      console.log(`  - Uploaded successfully: ${imageUrl}`);
      
      // Find and update the milestone in the database
      const [milestone] = await db.select()
        .from(milestones)
        .where(eq(milestones.title, imageData.title))
        .limit(1);
      
      if (milestone) {
        await db.update(milestones)
          .set({ imageUrl })
          .where(eq(milestones.id, milestone.id));
        console.log(`  - Updated milestone ${milestone.id} with image URL`);
      } else {
        console.log(`  - Milestone not found: ${imageData.title}`);
      }
    }
    
    console.log("Image upload completed successfully!");
    
  } catch (error) {
    console.error("Image upload failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the upload
uploadMilestoneImages();