import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class OpenAIService {
  private openai: OpenAI | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('[OpenAI] No API key found in environment');
      return;
    }

    if (apiKey.length < 20) {
      console.error('[OpenAI] API key appears to be invalid (too short)');
      return;
    }

    try {
      this.openai = new OpenAI({ apiKey });
      this.initialized = true;
      console.log(`[OpenAI] Service initialized successfully (key length: ${apiKey.length})`);
    } catch (error) {
      console.error('[OpenAI] Failed to initialize:', error);
    }
  }

  async generateActivityImage(activityTitle: string, activityDescription: string): Promise<string> {
    if (!this.initialized || !this.openai) {
      throw new Error('OpenAI service is not initialized. Please check your API key.');
    }

    try {
      // Create a prompt that generates 3D Pixar-style educational illustrations
      // Matching the adorable animated character style
      const imagePrompt = `Create a 3D animated style educational illustration for a children's activity called "${activityTitle}"

STYLE REQUIREMENTS:
- 3D rendered Pixar/Disney animation style with soft lighting
- Adorable chibi-style characters with large expressive eyes and round features
- Smooth, polished 3D surfaces with subtle ambient occlusion
- Bright, vibrant color palette with soft pastels and bold primaries
- Modern preschool classroom setting with large windows and natural light
- Soft, diffused lighting creating gentle shadows and highlights
- Characters should have exaggerated cute proportions (large heads, small bodies)
- Include colorful foam blocks, tunnels, mats, and educational toys
- Clean, minimalist classroom with organized storage cubbies
- Depth of field effect with background slightly blurred
- Characters wearing simple, colorful clothing
- NO text, letters, numbers, or words anywhere in the image
- Diverse children with different hair colors and skin tones
- Joyful, playful atmosphere with characters mid-action

ACTIVITY TO ILLUSTRATE: ${activityDescription}

Create a dynamic 3D scene showing adorable animated children actively engaged in the activity, similar to a frame from a Pixar movie. The style should be polished, professional, and irresistibly cute.`;

      console.log(`[OpenAI] Generating image with prompt: ${imagePrompt.substring(0, 200)}...`);

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: imagePrompt,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid', // 'vivid' produces more colorful, warm illustrations
          n: 1
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[OpenAI] Generation failed:", errorText);
        
        // Parse error message if possible
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            // Check for specific error types
            if (errorData.error.code === 'billing_hard_limit_reached') {
              throw new Error('OpenAI account has insufficient credits. Please add credits at https://platform.openai.com/settings/organization/billing');
            }
            if (errorData.error.message.includes('quota') || errorData.error.message.includes('limit')) {
              throw new Error(`OpenAI API limit reached: ${errorData.error.message}. Please check your OpenAI account.`);
            }
            throw new Error(errorData.error.message);
          }
        } catch (parseError) {
          // If parsing fails, use generic error
          if (parseError instanceof Error && !parseError.message.includes('JSON')) {
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
      const imagePath = path.join(process.cwd(), 'public', 'activity-images', 'images', filename);
      
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
      hasApiKey: !!process.env.OPENAI_API_KEY
    };
  }
}

// Export a singleton instance
export const openAIService = new OpenAIService();