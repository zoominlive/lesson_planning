import { db } from "../server/db";
import { users, milestones, materials, activities } from "../shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed sample milestones
  await db.insert(milestones).values([
    {
      title: "Shares toys with peers",
      description: "Child willingly shares toys and materials with classmates during play activities, demonstrating early cooperation skills.",
      category: "Social",
      ageRangeStart: 36,
      ageRangeEnd: 48,
      learningObjective: "Develop cooperation and social interaction skills"
    },
    {
      title: "Expresses feelings verbally",
      description: "Uses words to communicate basic emotions like happy, sad, angry, or excited instead of only physical reactions.",
      category: "Emotional",
      ageRangeStart: 36,
      ageRangeEnd: 48,
      learningObjective: "Develop emotional vocabulary and self-expression"
    },
    {
      title: "Sorts objects by attributes",
      description: "Groups objects by color, size, shape, or function, demonstrating classification skills.",
      category: "Cognitive",
      ageRangeStart: 36,
      ageRangeEnd: 48,
      learningObjective: "Develop logical thinking and categorization skills"
    },
    {
      title: "Uses scissors to cut shapes",
      description: "Controls scissors to cut along lines and create simple shapes, showing fine motor development.",
      category: "Physical",
      ageRangeStart: 48,
      ageRangeEnd: 60,
      learningObjective: "Develop fine motor control and hand-eye coordination"
    }
  ]);

  // Seed sample materials
  await db.insert(materials).values([
    {
      name: "Washable Crayons Set",
      description: "Set of 24 washable crayons in assorted colors, perfect for young children's art activities.",
      category: "Art Supplies",
      quantity: 15,
      location: "Art Cabinet A",
      status: "in_stock"
    },
    {
      name: "Picture Book Collection",
      description: "Diverse collection of age-appropriate picture books for story time and independent reading.",
      category: "Books & Reading",
      quantity: 45,
      location: "Reading Corner",
      status: "in_stock"
    },
    {
      name: "Wooden Building Blocks",
      description: "Natural wooden blocks in various shapes and sizes for construction and creative play.",
      category: "Building Materials",
      quantity: 3,
      location: "Block Area",
      status: "low_stock"
    }
  ]);

  // Get milestone and material IDs for activities
  const milestoneRows = await db.select().from(milestones);
  const materialRows = await db.select().from(materials);

  // Seed sample activities
  await db.insert(activities).values([
    {
      title: "Morning Circle",
      description: "Interactive circle time where children share experiences, sing songs, and learn about the day ahead.",
      duration: 25,
      ageRangeStart: 36,
      ageRangeEnd: 60,
      teachingObjectives: ["Develop listening skills", "Practice social interaction", "Build routine awareness"],
      milestoneIds: [milestoneRows[0].id, milestoneRows[1].id],
      materialIds: [materialRows[1].id],
      instructions: ["Gather children in circle", "Lead welcome song", "Discuss daily activities", "Share and listen time"],
      category: "Social Development",
      videoUrl: null,
      imageUrl: null
    },
    {
      title: "Finger Painting",
      description: "Children explore colors and textures while developing fine motor skills through guided finger painting activities.",
      duration: 45,
      ageRangeStart: 36,
      ageRangeEnd: 48,
      teachingObjectives: ["Develop fine motor control", "Learn color recognition", "Express creativity"],
      milestoneIds: [milestoneRows[2].id, milestoneRows[3].id],
      materialIds: [materialRows[0].id],
      instructions: ["Set up painting area", "Distribute materials", "Demonstrate techniques", "Guide exploration", "Clean up together"],
      category: "Art & Creativity",
      videoUrl: null,
      imageUrl: null
    }
  ]);

  console.log("✅ Database seeded successfully!");
}

seed().catch(console.error);