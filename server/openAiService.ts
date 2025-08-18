import OpenAI from "openai";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export class OpenAIService {
  private openai: OpenAI | null = null;
  private initialized = false;
  private referenceStyleDescription: string | null = null;

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

  async analyzeReferenceImage(imagePath: string): Promise<string> {
    if (!this.initialized || !this.openai) {
      throw new Error(
        "OpenAI service is not initialized. Please check your API key.",
      );
    }

    try {
      // Read the image file and convert to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Use GPT-4 Vision to analyze the image style
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // GPT-4 with vision capabilities
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing photographic styles. Describe the visual style of this image in detail, focusing on: lighting quality and direction, color palette and saturation, composition and framing, depth of field, camera angle and perspective, overall mood and atmosphere, and any distinctive photographic techniques. Be specific and technical in your description, as this will be used to replicate the style in other images."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and describe its photographic style in detail. Focus on technical aspects that can be replicated."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      });

      const styleDescription = response.choices[0].message.content;
      
      // Store the style description for use in future generations
      this.referenceStyleDescription = styleDescription;
      
      console.log("[OpenAI] Reference image style analyzed:", styleDescription);
      
      return styleDescription || "Unable to analyze image style";
    } catch (error: any) {
      console.error("[OpenAI] Failed to analyze reference image:", error);
      throw new Error(`Failed to analyze reference image: ${error.message}`);
    }
  }

  setReferenceStyle(styleDescription: string | null) {
    this.referenceStyleDescription = styleDescription;
    if (styleDescription) {
      console.log("[OpenAI] Reference style set:", styleDescription.substring(0, 100) + "...");
    } else {
      console.log("[OpenAI] Reference style cleared");
    }
  }

  getReferenceStyle(): string | null {
    return this.referenceStyleDescription;
  }

  async generateActivityImage(
    activityTitle: string,
    activityDescription: string,
    spaceRequired?: string,
  ): Promise<string> {
    if (!this.initialized || !this.openai) {
      throw new Error(
        "OpenAI service is not initialized. Please check your API key.",
      );
    }

    try {
      // Create a prompt for professional educational reference images for teachers
      // Clear, realistic depictions that help adult educators understand activities
      
      // Determine the environment setting based on spaceRequired
      let environmentSetting = "";
      if (spaceRequired) {
        if (spaceRequired.toLowerCase() === "outdoor" || spaceRequired.toLowerCase() === "outdoors") {
          environmentSetting = "\nENVIRONMENT: This is an OUTDOOR activity. Show it taking place outside in a natural setting like a playground, garden, park, or outdoor play area with appropriate outdoor elements like grass, trees, sunshine, or outdoor equipment.";
        } else if (spaceRequired.toLowerCase() === "indoor" || spaceRequired.toLowerCase() === "indoors") {
          environmentSetting = "\nENVIRONMENT: This is an INDOOR activity. Show it taking place inside a classroom, playroom, or indoor educational space with appropriate indoor elements like walls, windows, indoor flooring, and classroom furniture.";
        } else if (spaceRequired.toLowerCase() === "both") {
          environmentSetting = "\nENVIRONMENT: This activity can be done either indoors or outdoors. Choose the most appropriate setting based on the activity description.";
        }
      }
      
      // Include reference style if available
      let styleSection = "";
      if (this.referenceStyleDescription) {
        styleSection = `

REFERENCE STYLE TO MATCH:
${this.referenceStyleDescription}

IMPORTANT: Match the photographic style, lighting, color palette, composition, and overall aesthetic of the reference image described above while maintaining the educational content requirements.`;
      }
      
      const imagePrompt = `PHOTOREALISTIC classroom photograph showing: "${activityTitle}"

CRITICAL REQUIREMENTS - ABSOLUTELY NO TEXT OR WORDS:
- NO text anywhere in the image
- NO labels, NO titles, NO captions, NO written words
- NO signs, NO banners, NO written instructions
- PHOTOREALISTIC style only - must look like an actual photograph
- NOT cartoon, NOT illustrated, NOT drawn, NOT animated
- Real photography aesthetic - like a photo taken with a camera
- Natural lighting as if taken in a real classroom
- Realistic proportions and perspectives${environmentSetting}

SHOW THIS ACTIVITY:
${activityDescription}${styleSection}

VISUAL STYLE:
- Documentary photography style
- Professional educational photography
- Clear focus on the activity materials and setup
- Natural, realistic colors
- Clean, organized classroom environment
- Children or hands demonstrating the activity naturally
- Practical setup that teachers can replicate

ABSOLUTELY FORBIDDEN:
- NO text of any kind
- NO cartoon or illustrated style
- NO fantasy elements
- NO exaggerated features
- NO stylized or artistic interpretations
- NO labels or written instructions
- NO speech bubbles or thought bubbles

Create a PHOTOREALISTIC image that looks like an actual photograph taken in a real classroom.`;

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
            quality: "hd", // Use hd quality for best results
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
