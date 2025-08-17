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
      // Create a prompt that generates realistic 3D animated educational illustrations
      // High-quality photorealistic animation style with depth and dimension
      const imagePrompt = `Create a high-quality, photorealistic 3D animated educational illustration for a children's activity called "${activityTitle}"

STYLE REQUIREMENTS:
- Photorealistic 3D rendering with realistic textures and materials
- Natural, realistic proportions for children (not chibi or exaggerated)
- High-detail textures: fabric on clothing, wood grain on furniture, realistic skin
- Realistic lighting with accurate shadows, highlights, and reflections
- Ray-traced global illumination for natural light bouncing
- Realistic materials: glossy plastic toys, soft fabric mats, metallic surfaces
- Strong depth and dimension with proper perspective and atmospheric haze
- Natural poses and expressions that look lifelike
- Realistic hair with individual strands and natural movement
- Detailed classroom environment with realistic props and furniture
- Soft depth of field with natural bokeh in background
- Realistic color grading with natural saturation levels
- NO text, letters, numbers, or words in the image
- Diverse children with realistic features and natural skin tones
- Professional cinematographic quality like modern animated films

ACTIVITY TO ILLUSTRATE: ${activityDescription}

Create a photorealistic 3D scene that looks like a high-budget animated film - realistic yet still warm and engaging for children. Think "The Incredibles" or recent Disney films with their realistic rendering style.`;

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
            style: "vivid", // 'vivid' produces more colorful, warm illustrations
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
