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

Please provide a comprehensive activity plan in the following JSON format:
{
  "title": "Creative and engaging activity title",
  "description": "A detailed 2-3 sentence description of the activity and its educational benefits",
  "duration": number (in minutes, appropriate for the age group),
  "instructions": [
    {
      "text": "Clear step-by-step instruction",
      "tip": "Optional helpful tip for this step"
    }
  ],
  "learningObjectives": ["objective1", "objective2", "objective3"],
  "setupTime": number (preparation time in minutes),
  "groupSize": "1-4 children" or similar,
  "spaceRequired": "Indoor/Outdoor/Both",
  "messLevel": "Low/Medium/High",
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

      console.log("Raw AI response:", content);

      // Parse the JSON response
      try {
        // First try to parse as-is
        const activityData = JSON.parse(content);
        return activityData;
      } catch (parseError) {
        console.log("Initial parse failed, attempting to extract JSON...");
        
        // Try to extract JSON from the response if it contains other text
        // Look for JSON object between curly braces
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extracted = jsonMatch[0];
            console.log("Extracted JSON:", extracted.substring(0, 200) + "...");
            return JSON.parse(extracted);
          } catch (secondParseError) {
            console.error("Failed to parse extracted JSON:", secondParseError);
            console.error("Extracted content was:", jsonMatch[0].substring(0, 500));
          }
        }
        
        // If that fails, try to find JSON between ```json markers
        const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          try {
            console.log("Found JSON in code block, attempting to parse...");
            return JSON.parse(codeBlockMatch[1]);
          } catch (codeBlockError) {
            console.error("Failed to parse code block JSON:", codeBlockError);
          }
        }
        
        throw new Error("Failed to parse AI response as JSON. Response was: " + content.substring(0, 500));
      }
    } catch (error) {
      console.error("Error generating activity with Perplexity:", error);
      throw error;
    }
  }
}

export const perplexityService = new PerplexityService();
