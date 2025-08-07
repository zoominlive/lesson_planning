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

    const prompt = `Create a comprehensive educational activity for ${params.ageGroup} children (${params.ageRange.start}-${params.ageRange.end} years old) in the category of ${params.category}. ${quietDescription}

Please generate a complete activity with the following structure. Return ONLY valid JSON:
{
  "title": "[Create an engaging, creative title for the activity]",
  "description": "[Write a detailed 2-3 sentence description explaining what children will do and the educational benefits]",
  "duration": [appropriate duration in minutes for the age group, typically 15-45],
  "instructions": [
    {"text": "[First step - be specific and clear]"},
    {"text": "[Second step - include details]"},
    {"text": "[Third step - explain what to do]"},
    {"text": "[Continue with 4-8 total steps as needed]"}
  ],
  "learningObjectives": [
    "[Specific learning objective 1]",
    "[Specific learning objective 2]",
    "[Specific learning objective 3]"
  ],
  "setupTime": [preparation time in minutes, typically 5-15],
  "groupSize": "[e.g., 1-4 children, 2-6 children, or Full class]",
  "spaceRequired": "[Indoor, Outdoor, or Both]",
  "messLevel": "[Low, Medium, or High]",
  "variations": [
    "[Creative variation or adaptation 1]",
    "[Creative variation or adaptation 2]"
  ],
  "safetyConsiderations": [
    "[Important safety point 1]",
    "[Important safety point 2]"
  ],
  "imagePrompt": "[Detailed description for visualizing this activity]"
}

IMPORTANT JSON FORMATTING RULES:
- Do NOT use single quotes anywhere in your response
- Do NOT use apostrophes or quotation marks within string values
- Do NOT use special characters like em dash (—)
- Use simple dashes (-) instead of em dashes
- Instead of "don't" write "do not"
- Instead of "it's" write "it is"
- Instead of naming variations like "'Shape Hunt': description" just write "Shape Hunt - description"

Ensure the activity is:
- Age-appropriate and developmentally suitable for ${params.ageRange.start}-${params.ageRange.end} year olds
- Educational and promotes ${params.category} development
- Safe and practical for a childcare setting
- Engaging and fun for children
- Complete with 4-8 clear instructional steps`;

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
        // First, handle special characters
        // Replace em dash with regular dash
        cleanedContent = cleanedContent.replace(/—/g, '-');
        
        // Replace smart quotes with regular quotes
        cleanedContent = cleanedContent.replace(/['']/g, "'");
        cleanedContent = cleanedContent.replace(/[""]/g, '"');
        
        // Try to parse first without modifications
        try {
          const firstAttempt = JSON.parse(cleanedContent);
          console.log('[PerplexityService] Successfully parsed activity data on first attempt');
          return firstAttempt;
        } catch (e) {
          // If that fails, try more aggressive cleaning
          console.log('[PerplexityService] First parse attempt failed, trying aggressive cleaning');
          
          // Replace single quotes with escaped quotes within strings
          // This regex looks for strings and escapes single quotes within them
          cleanedContent = cleanedContent.replace(/"([^"]*)"/g, (match, p1) => {
            // Escape any single quotes within the string value
            const escaped = p1.replace(/'/g, "\\'");
            return `"${escaped}"`;
          });
          
          // Remove trailing commas before closing braces/brackets
          cleanedContent = cleanedContent.replace(/,\s*([\]}])/g, '$1');
          
          // Try parsing again
          try {
            const secondAttempt = JSON.parse(cleanedContent);
            console.log('[PerplexityService] Successfully parsed activity data on second attempt');
            return secondAttempt;
          } catch (e2) {
            // If still failing, try one more approach - remove problematic quotes altogether
            console.log('[PerplexityService] Second parse attempt failed, removing problematic quotes');
            
            // Replace strings that have quotes at the beginning followed by text
            cleanedContent = cleanedContent.replace(/"'([^:]+)':\s*([^"]*?)"/g, '"$1 - $2"');
            cleanedContent = cleanedContent.replace(/"'([^"]*?)'/g, '"$1"');
            
            console.log('[PerplexityService] Final cleaned content:', cleanedContent.substring(0, 500) + '...');
            const finalAttempt = JSON.parse(cleanedContent);
            console.log('[PerplexityService] Successfully parsed activity data on final attempt');
            return finalAttempt;
          }
        }
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
