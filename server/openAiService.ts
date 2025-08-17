import OpenAI from "openai";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export class OpenAIService {
  private openai: OpenAI | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.log("[OpenAI] No API key found in environment");
      return;
    }

    if (apiKey.length < 20) {
      console.error("[OpenAI] API key appears to be invalid (too short)");
      return;
    }

    try {
      this.openai = new OpenAI({ apiKey });
      this.initialized = true;
      console.log(
        `[OpenAI] Service initialized successfully (key length: ${apiKey.length})`,
      );
    } catch (error) {
      console.error("[OpenAI] Failed to initialize:", error);
    }
  }

  async generateActivityImage(
    activityTitle: string,
    activityDescription: string,
  ): Promise<string> {
    if (!this.initialized || !this.openai) {
      throw new Error(
        "OpenAI service is not initialized. Please check your API key.",
      );
    }

    try {
      // Create a prompt for professional educational reference images for teachers
      // Clear, realistic depictions that help adult educators understand activities
      const imagePrompt = `Create a clear, professional educational reference image for teachers showing the activity: "${activityTitle}"

STYLE REQUIREMENTS:
- Professional educational documentation style
- Clear, realistic depiction suitable for adult educators
- Focus on showing the activity setup, materials, and process
- Clean, well-lit educational environment
- Neutral, professional color palette (not overly bright or childish)
- Realistic proportions and perspectives
- Show actual educational materials and classroom setup
- Documentary-style composition that clearly demonstrates the activity
- Include children engaged in the activity but with realistic, non-cartoonish appearance
- Professional photography aesthetic, like educational textbooks or teacher training materials
- Clear visual hierarchy showing important elements of the activity
- Practical, implementable setup that teachers can replicate
- NO cartoon elements, NO exaggerated features, NO childish decorations
- NO text, labels, or watermarks in the image

ACTIVITY DETAILS: ${activityDescription}

Create a professional, realistic educational reference image that helps teachers understand exactly how to implement this activity in their classroom. The image should look like it belongs in a teacher's manual or educational resource guide.`;

      console.log(
        `[OpenAI] Generating image with prompt: ${imagePrompt.substring(0, 200)}...`,
      );

      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: imagePrompt,
            size: "1024x1024",
            quality: "standard",
            style: "natural", // 'natural' produces more realistic, professional images
            n: 1,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[OpenAI] Generation failed:", errorText);

        // Parse error message if possible
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            // Check for specific error types
            if (errorData.error.code === "billing_hard_limit_reached") {
              throw new Error(
                "OpenAI account has insufficient credits. Please add credits at https://platform.openai.com/settings/organization/billing",
              );
            }
            if (
              errorData.error.message.includes("quota") ||
              errorData.error.message.includes("limit")
            ) {
              throw new Error(
                `OpenAI API limit reached: ${errorData.error.message}. Please check your OpenAI account.`,
              );
            }
            throw new Error(errorData.error.message);
          }
        } catch (parseError) {
          // If parsing fails, use generic error
          if (
            parseError instanceof Error &&
            !parseError.message.includes("JSON")
          ) {
            throw parseError;
          }
        }

        throw new Error(`Image generation failed: ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;

      console.log("[OpenAI] Image generated successfully:", imageUrl);

      // Download and save the image locally
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.arrayBuffer();

      // Generate a unique filename
      const timestamp = Date.now();
      const uniqueId = crypto.randomUUID().substring(0, 8);
      const filename = `ai_generated_${timestamp}_${uniqueId}.png`;
      const imagePath = path.join(
        process.cwd(),
        "public",
        "activity-images",
        "images",
        filename,
      );

      // Ensure directory exists
      const dir = path.dirname(imagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Save the image
      fs.writeFileSync(imagePath, Buffer.from(buffer));

      const localUrl = `/api/activities/images/${filename}`;
      console.log("[OpenAI] Image saved locally:", localUrl);

      return localUrl;
    } catch (error) {
      console.error("[OpenAI] Error generating image:", error);
      throw error;
    }
  }

  // Add a method to check if the service is available
  isAvailable(): boolean {
    return this.initialized && this.openai !== null;
  }

  // Method to get service status for debugging
  getStatus(): { initialized: boolean; hasApiKey: boolean } {
    return {
      initialized: this.initialized,
      hasApiKey: !!process.env.OPENAI_API_KEY,
    };
  }
}

// Export a singleton instance
export const openAIService = new OpenAIService();
