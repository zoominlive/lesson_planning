#!/usr/bin/env tsx
/**
 * Script to clean up milestone image URLs that don't have corresponding files
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Now import the services after env vars are loaded
import { storage } from '../server/storage';

async function main() {
  console.log('Cleaning up invalid milestone image URLs...\n');
  
  const milestonesToClean = [
    '4ead1815-cbb3-480f-a03d-4ee22857c5df', // Shares toys with peers
    '16b4900d-14a8-493b-8ecc-fb7d5e5144aa', // Comforts others when upset
    '72236a10-da6a-4b3f-8b90-37ae205c1fcc', // Completes simple puzzles
    '92b31b7d-83f4-4e3e-ae78-0d984c8cb283', // Climbs playground equipment
  ];
  
  for (const id of milestonesToClean) {
    try {
      const milestone = await storage.getMilestone(id);
      if (milestone && milestone.imageUrl && !milestone.s3Key) {
        console.log(`Clearing invalid image URL for milestone: ${milestone.title}`);
        await storage.updateMilestone(id, {
          imageUrl: null,
        });
        console.log(`  ✓ Cleared image URL for ${id}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to clean milestone ${id}:`, error);
    }
  }
  
  console.log('\nCleanup completed!');
  process.exit(0);
}

main().catch(console.error);