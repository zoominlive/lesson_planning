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

      // Build the request to Perplexity based on context type
      const perplexityPrompt = this.buildPerplexityPrompt(context);
      
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
              role: 'system',
              content: 'You are an expert at writing detailed, vivid image generation prompts for educational childcare activities. Create prompts that result in bright, safe, professional photography-style images suitable for teacher reference materials.'
            },
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
   * Build the request prompt for Perplexity based on context
   */
  private buildPerplexityPrompt(context: ImagePromptContext): string {
    if (context.type === 'activity') {
      return `Create a detailed image generation prompt for this childcare activity. 
        The prompt should start with: "A bright, photo-realistic childcare classroom depicting"
        Then describe this activity: "${context.activityDescription}"
        
        Additional context:
        - Activity title: ${context.activityTitle}
        - Age group: ${context.ageGroup || 'early childhood'}
        - Category: ${context.category || 'general'}
        - Space: ${context.spaceRequired || 'indoor classroom'}
        
        The image should show:
        - Professional, educational setting
        - Clear demonstration of the activity
        - Age-appropriate materials and setup
        - Bright, welcoming environment
        - Safety-conscious arrangement
        
        Write a single, cohesive prompt that captures all these elements naturally.`;
    } else {
      // Step image prompt
      return `Create a detailed image generation prompt for step ${context.stepNumber} of a childcare activity.
        The prompt should start with: "A bright, photo-realistic childcare classroom showing"
        Then describe this specific step: "${context.stepText}"
        
        Context from the main activity:
        - Activity: ${context.activityTitle}
        - Description: ${context.activityDescription}
        - This is step ${context.stepNumber} of the instructions
        
        The image should:
        - Clearly demonstrate this specific step
        - Show professional educational setting
        - Include relevant materials and setup
        - Be consistent with a childcare classroom environment
        
        Write a single, focused prompt for this step.`;
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
        quality: "standard",
        style: "natural" // Use natural style for photo-realistic images
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
    let prompt = '';
    
    if (context.type === 'activity') {
      prompt = `A bright, photo-realistic childcare classroom depicting ${context.activityDescription}. Professional educational setting with age-appropriate materials, bright lighting, and safe environment.`;
    } else {
      prompt = `A bright, photo-realistic childcare classroom showing step ${context.stepNumber}: ${context.stepText}. Clear demonstration of this instruction step in a professional educational setting.`;
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