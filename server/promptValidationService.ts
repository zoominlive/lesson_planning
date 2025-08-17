import fetch from 'node-fetch';

interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

class PromptValidationService {
  private apiKey: string;
  private apiUrl = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[PromptValidation] Perplexity API key not found - validation will be skipped');
    }
  }

  async validateActivityInputs(
    activityType?: string,
    focusMaterial?: string
  ): Promise<ValidationResult> {
    // If no API key, validation cannot be performed
    if (!this.apiKey) {
      throw new Error('Validation service not configured');
    }

    // If both inputs are empty, it's valid (user didn't specify preferences)
    if (!activityType && !focusMaterial) {
      return {
        isValid: true
      };
    }

    try {
      const validationPrompt = this.buildValidationPrompt(activityType, focusMaterial);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: `You are a content validation system for an early childhood education application. 
Your job is to validate that user inputs are appropriate for generating educational activities for children ages 0-5.

Respond ONLY with a JSON object in this exact format:
{
  "isValid": boolean,
  "reason": "string (only if invalid)"
}

Rules for validation:
1. REJECT anything violent, sexual, pornographic, or emotionally abusive
2. REJECT anything involving weapons, drugs, alcohol, or adult themes
3. REJECT anything that could be harmful or dangerous to young children
4. REJECT discriminatory or offensive content
5. ACCEPT legitimate early childhood educational activities (games, songs, sensory play, art, science, movement)
6. ACCEPT common classroom materials (blocks, paint, playdough, water, books, toys, etc.)
7. If the input is borderline, err on the side of caution and reject it

Do NOT modify or sanitize the inputs. Only validate them exactly as provided.`
            },
            {
              role: 'user',
              content: validationPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        console.error('[PromptValidation] API request failed:', response.status);
        // On API failure, throw error to block the request
        throw new Error(`Validation API request failed with status ${response.status}`);
      }

      const data = await response.json() as any;
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        console.error('[PromptValidation] No content in response');
        throw new Error('Validation API returned no content');
      }

      // Parse the JSON response
      try {
        const result = JSON.parse(content) as ValidationResult;
        console.log('[PromptValidation] Validation result:', result);
        return result;
      } catch (parseError) {
        console.error('[PromptValidation] Failed to parse response:', content);
        // If we can't parse, throw error to block the request
        throw new Error('Failed to parse validation response');
      }

    } catch (error) {
      console.error('[PromptValidation] Validation error:', error);
      // On any error, throw to block the request for safety
      throw error;
    }
  }

  private buildValidationPrompt(activityType?: string, focusMaterial?: string): string {
    const parts: string[] = ['Please validate the following inputs for an early childhood education activity:'];
    
    if (activityType) {
      parts.push(`Activity Type: "${activityType}"`);
    }
    
    if (focusMaterial) {
      parts.push(`Focus Material: "${focusMaterial}"`);
    }

    parts.push('\nDetermine if these are appropriate for generating activities for children ages 0-5.');
    
    return parts.join('\n');
  }

  /**
   * Validates a general activity prompt for appropriateness
   */
  async validateGeneralPrompt(prompt: string): Promise<ValidationResult> {
    if (!this.apiKey) {
      return { isValid: true };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: `You are a content validation system. Check if this prompt is appropriate for early childhood education (ages 0-5).
Respond with JSON: {"isValid": boolean, "reason": "string (only if invalid)"}
REJECT: violence, weapons, adult themes, dangerous activities
ACCEPT: legitimate educational activities, safe materials, age-appropriate content`
            },
            {
              role: 'user',
              content: `Validate this prompt: "${prompt}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 100
        })
      });

      if (!response.ok) {
        return { isValid: true }; // Be conservative on failure
      }

      const data = await response.json() as any;
      const content = data.choices[0]?.message?.content;
      
      try {
        return JSON.parse(content) as ValidationResult;
      } catch {
        return { isValid: true }; // Be conservative if parse fails
      }

    } catch (error) {
      console.error('[PromptValidation] General validation error:', error);
      return { isValid: true };
    }
  }
}

// Export a singleton instance
export const promptValidationService = new PromptValidationService();