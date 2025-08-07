interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

export class PerplexityService {
  private apiKey: string;
  private apiUrl = "https://api.perplexity.ai/chat/completions";

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || "";
    if (!this.apiKey) {
      console.warn("PERPLEXITY_API_KEY not found in environment variables");
    } else {
      console.log(
        "Perplexity API key loaded successfully (length:",
        this.apiKey.length,
        ")",
      );
    }
  }

  async generateActivity(params: {
    ageGroup: string;
    category: string;
    isQuiet: boolean;
    ageRange: { start: number; end: number };
  }): Promise<any> {
    const quietDescription = params.isQuiet
      ? "This should be a quiet, calm activity suitable for quiet time, nap preparation, or low-energy periods."
      : "This can be an active, engaging activity.";

    const prompt = `Create a detailed educational activity for ${params.ageGroup} children (${params.ageRange.start}-${params.ageRange.end} years old) in the category of ${params.category}. ${quietDescription}

Return ONLY a valid JSON object with no additional text, markdown, or explanation. The JSON must follow this exact structure:
{
  "title": "Creative and engaging activity title",
  "description": "A detailed 2-3 sentence description of the activity and its educational benefits",
  "duration": 30,
  "instructions": [
    {
      "text": "Clear step-by-step instruction"
    }
  ],
  "learningObjectives": ["objective1", "objective2", "objective3"],
  "setupTime": 10,
  "groupSize": "1-4 children",
  "spaceRequired": "Indoor",
  "messLevel": "Low",
  "variations": ["variation1", "variation2"],
  "safetyConsiderations": ["safety point 1", "safety point 2"],
  "imagePrompt": "A detailed description for generating an image of this activity"
}

Ensure the activity is:
- Age-appropriate and developmentally suitable
- Educational and promotes learning
- Safe and practical for a childcare setting
- Engaging and fun for children
- Clear and easy for educators to implement`;

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content:
                "You are an expert early childhood educator. You MUST respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, explanations, or text outside the JSON. The response should start with { and end with }.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          stream: false,
          top_p: 0.9,
          presence_penalty: 0,
          frequency_penalty: 1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Perplexity API error response:", errorText);
        console.error(
          "Request body was:",
          JSON.stringify(
            {
              model: "sonar-pro",
              messages: [
                {
                  role: "system",
                  content:
                    "You are an expert early childhood educator with extensive experience in creating developmentally appropriate activities for children. Always respond with valid JSON only, no additional text.",
                },
                {
                  role: "user",
                  content: prompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 2000,
              stream: false,
            },
            null,
            2,
          ),
        );
        throw new Error(
          `Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = (await response.json()) as PerplexityResponse;
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from Perplexity API");
      }

      console.log('[PerplexityService] Raw AI response:', content);

      // Parse the JSON response
      try {
        // First, try to clean the content
        let cleanedContent = content.trim();
        
        // Remove any markdown code blocks if present
        cleanedContent = cleanedContent.replace(/```json\s*/gi, '');
        cleanedContent = cleanedContent.replace(/```\s*/g, '');
        
        // Try to extract JSON if wrapped in other text
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedContent = jsonMatch[0];
        }
        
        // Fix common JSON issues
        // Replace single quotes with double quotes for property names
        cleanedContent = cleanedContent.replace(/'([^']+)'\s*:/g, '"$1":');
        
        // Remove trailing commas before closing braces/brackets
        cleanedContent = cleanedContent.replace(/,\s*([\]}])/g, '$1');
        
        console.log('[PerplexityService] Attempting to parse cleaned content');
        const activityData = JSON.parse(cleanedContent);
        console.log('[PerplexityService] Successfully parsed activity data');
        return activityData;
      } catch (parseError) {
        console.error('[PerplexityService] Failed to parse JSON:', parseError);
        console.error('[PerplexityService] Content that failed to parse:', content);
        
        // As a fallback, create a basic activity structure
        console.log('[PerplexityService] Returning fallback activity structure');
        return {
          title: "Activity Generation Failed",
          description: "The AI response could not be parsed. Please try again or create the activity manually.",
          duration: 30,
          instructions: [{text: "Please create the activity manually"}],
          learningObjectives: ["To be defined"],
          setupTime: 10,
          groupSize: "1-4 children",
          spaceRequired: "Indoor",
          messLevel: "Low",
          variations: [],
          safetyConsiderations: [],
          imagePrompt: "Educational activity for children"
        };
      }
    } catch (error) {
      console.error("Error generating activity with Perplexity:", error);
      throw error;
    }
  }
}

export const perplexityService = new PerplexityService();
