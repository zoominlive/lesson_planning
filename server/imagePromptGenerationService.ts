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
      
      // Build enhanced prompt request for Perplexity using ChatGPT's structure
      const perplexityPrompt = `Write me a prompt for DALL-E 3 to create a professional photograph of the following activity:

${context.activityTitle} - ${context.activityDescription}

Use this exact structure for your prompt:
1. Start with "Ultra-realistic DSLR photograph of a bright ${setting}."
2. Then describe the scene: what children are doing
3. Add these technical photography elements in order:
   - "Sharp realistic textures, cinematic lighting, professional color grading."
   - "Shallow depth of field with focus on [main subject], while the background softly blurs."
   - "High-resolution, photorealistic detail, captured as if by a professional photographer with a wide-angle lens."
4. Include natural light and joyful expressions

Make it sound like a professional photography brief, not a casual description.`;
      
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
    
    // Enhanced fallback prompt using ChatGPT's professional photography structure
    const prompt = `Ultra-realistic DSLR photograph of a bright ${setting}. ${context.activityDescription}. Sharp realistic textures, cinematic lighting, professional color grading. Shallow depth of field with focus on children's activities and materials, while the background softly blurs. Joyful expressions and dynamic movement in a vibrant environment. High-resolution, photorealistic detail, captured as if by a professional photographer with a wide-angle lens.`;

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