import OpenAI from "openai";

interface ImagePromptContext {
  type: 'activity' | 'step';
  activityTitle: string;
  activityDescription: string;
  ageGroup?: string;
  category?: string;
  spaceRequired?: string;
  stepNumber?: number;
  stepText?: string;
}

interface GeneratedPrompt {
  prompt: string;
  success: boolean;
  error?: string;
}

class ImagePromptGenerationService {
  private openai: OpenAI;
  private perplexityApiKey: string;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
  }

  /**
   * Generate a detailed image prompt using Perplexity AI
   */
  async generateImagePrompt(context: ImagePromptContext): Promise<GeneratedPrompt> {
    try {
      if (!this.perplexityApiKey) {
        throw new Error('PERPLEXITY_API_KEY is not configured');
      }

      // Determine indoor/outdoor setting
      const isOutdoor = context.spaceRequired?.toLowerCase().includes('outdoor');
      const setting = isOutdoor ? 'childcare playground' : 'childcare classroom';
      
      // Build enhanced prompt request for Perplexity using realistic constraints
      let perplexityPrompt: string;
      
      if (context.type === 'step' && context.stepNumber && context.stepText) {
        // For step images, emphasize consistency with the main activity image
        perplexityPrompt = `Write me a prompt for DALL-E 3 to create a CONSISTENT professional photograph showing Step ${context.stepNumber} of an activity.

Activity: ${context.activityTitle} - ${context.activityDescription}
Step ${context.stepNumber}: ${context.stepText}

CRITICAL CONSISTENCY REQUIREMENTS:
- This is part of a series of educational images that MUST maintain the exact same visual style
- Use the EXACT SAME photographic style: Ultra-realistic DSLR photograph
- Use the EXACT SAME setting: cozy, normal-sized ${setting}
- Show the EXACT SAME realistic constraints: 6-10 children, normal 7-8 foot windows, 20x30 feet room
- Use the EXACT SAME camera settings: 35mm lens, shallow depth of field, natural lighting

Your prompt MUST follow this EXACT structure:
"Ultra-realistic DSLR photograph of a cozy, normal-sized ${setting}. Shows 6-8 children engaged in Step ${context.stepNumber}: [describe the specific step action]. Standard classroom with normal-height windows, realistic proportions. Consistent educational photography style. Sharp realistic textures, natural lighting, professional color grading. Shallow depth of field focusing on the step action. Shot with 35mm lens for natural perspective. Maintains visual continuity with activity series."

Make it look like part of the same photo shoot as the main activity image.`;
      } else {
        // For main activity images
        perplexityPrompt = `Write me a prompt for DALL-E 3 to create a professional photograph of the following activity:

${context.activityTitle} - ${context.activityDescription}

IMPORTANT REALISTIC CONSTRAINTS:
- Show exactly 6-10 children (not more)
- Normal-sized classroom with standard 7-8 foot tall windows
- Realistic classroom proportions (about 20x30 feet room size)
- Age-appropriate furniture and equipment

Use this exact structure for your prompt:
1. Start with "Ultra-realistic DSLR photograph of a cozy, normal-sized ${setting}."
2. Specify "showing 6-10 children" in the scene description
3. Add these technical photography elements:
   - "Standard classroom with normal-height windows, realistic proportions."
   - "Sharp realistic textures, natural lighting, professional color grading."
   - "Shallow depth of field with focus on [main subject], background softly blurred."
   - "Shot with 35mm lens for natural perspective, not wide-angle distortion."

Make it realistic and believable, like a photo from an actual childcare center.`;
      }
      
      console.log('[ImagePromptGeneration] Requesting prompt from Perplexity for:', context.type);
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'user',
              content: perplexityPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ImagePromptGeneration] Perplexity API error:', errorText);
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedPrompt = data.choices?.[0]?.message?.content;

      if (!generatedPrompt) {
        throw new Error('No prompt generated from Perplexity');
      }

      console.log('[ImagePromptGeneration] Generated prompt:', generatedPrompt);

      return {
        prompt: generatedPrompt,
        success: true
      };
    } catch (error) {
      console.error('[ImagePromptGeneration] Error generating prompt:', error);
      // Fallback to basic prompt if Perplexity fails
      return this.getFallbackPrompt(context);
    }
  }



  /**
   * Generate the actual image using OpenAI DALL-E 3
   */
  async generateImage(prompt: string): Promise<{ url: string }> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
      }

      console.log('[ImagePromptGeneration] Generating image with DALL-E 3');
      
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "hd" // Use hd quality for best results
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI');
      }

      console.log('[ImagePromptGeneration] Image generated successfully');
      return { url: imageUrl };
    } catch (error: any) {
      console.error('[ImagePromptGeneration] Error generating image:', error);
      
      if (error?.error?.code === 'billing_hard_limit_reached') {
        throw new Error('OpenAI billing limit reached. Please add credits to your OpenAI account.');
      }
      
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  /**
   * Complete workflow: Generate prompt with Perplexity, then image with DALL-E
   */
  async generateActivityImage(context: ImagePromptContext): Promise<{ url: string; prompt: string }> {
    // Step 1: Generate prompt with Perplexity
    const promptResult = await this.generateImagePrompt(context);
    
    if (!promptResult.success) {
      throw new Error(promptResult.error || 'Failed to generate prompt');
    }

    // Step 2: Generate image with DALL-E using the prompt
    const imageResult = await this.generateImage(promptResult.prompt);
    
    return {
      url: imageResult.url,
      prompt: promptResult.prompt
    };
  }

  /**
   * Fallback prompt generation if Perplexity is unavailable
   */
  private getFallbackPrompt(context: ImagePromptContext): GeneratedPrompt {
    // Determine indoor/outdoor setting
    const isOutdoor = context.spaceRequired?.toLowerCase().includes('outdoor');
    const setting = isOutdoor ? 'childcare playground' : 'childcare classroom';
    
    let prompt: string;
    
    if (context.type === 'step' && context.stepNumber && context.stepText) {
      // Step image fallback with consistency emphasis
      prompt = `Ultra-realistic DSLR photograph of a cozy, normal-sized ${setting}. Shows 6-8 children engaged in Step ${context.stepNumber}: ${context.stepText}. Standard classroom with normal-height windows (7-8 feet tall), realistic proportions (20x30 feet room). Consistent educational photography style maintaining visual continuity with activity series. Sharp realistic textures, natural lighting, professional color grading. Shallow depth of field focusing on the specific step action. Shot with 35mm lens for natural perspective. Photorealistic detail matching the style of the main activity image.`;
    } else {
      // Main activity image fallback
      prompt = `Ultra-realistic DSLR photograph of a cozy, normal-sized ${setting}. Shows exactly 6-10 children engaged in: ${context.activityDescription}. Standard classroom with normal-height windows (7-8 feet tall), realistic proportions (20x30 feet room). Sharp realistic textures, natural lighting, professional color grading. Shallow depth of field with focus on children's activities, background softly blurred. Joyful but realistic expressions. Shot with 35mm lens for natural perspective, avoiding wide-angle distortion. Photorealistic detail like an actual childcare center photo.`;
    }

    return {
      prompt,
      success: true
    };
  }
}

// Export singleton instance
export const imagePromptGenerationService = new ImagePromptGenerationService();

// Export types for use in other modules
export type { ImagePromptContext, GeneratedPrompt };