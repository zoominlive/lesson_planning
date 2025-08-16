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
    existingActivities?: Array<{ title: string; description: string }>;
  }): Promise<any> {
    const quietDescription = params.isQuiet
      ? "This should be a quiet, calm activity suitable for quiet time, nap preparation, or low-energy periods."
      : "This can be an active, engaging activity.";

    // Create a list of existing activities to avoid duplicates
    let existingActivitiesContext = "";
    if (params.existingActivities && params.existingActivities.length > 0) {
      const activityList = params.existingActivities
        .map(a => `- "${a.title}": ${a.description}`)
        .join("\n");
      existingActivitiesContext = `

IMPORTANT: Avoid creating activities similar to these existing ones:
${activityList}

Create something unique and different from the above activities. Do not repeat similar concepts, themes, or approaches.`;
    }

    const prompt = `Create a comprehensive educational activity for ${params.ageGroup} children (${params.ageRange.start}-${params.ageRange.end} years old) in the category of ${params.category}. ${quietDescription}${existingActivitiesContext}

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
          
          // Extract and format materials from the activity
          const parsedActivity = this.parseMaterialsFromActivity(firstAttempt);
          return parsedActivity;
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
            
            // Extract and format materials from the activity
            const parsedActivity = this.parseMaterialsFromActivity(secondAttempt);
            return parsedActivity;
          } catch (e2) {
            // If still failing, try one more approach - remove problematic quotes altogether
            console.log('[PerplexityService] Second parse attempt failed, removing problematic quotes');
            
            // Replace strings that have quotes at the beginning followed by text
            cleanedContent = cleanedContent.replace(/"'([^:]+)':\s*([^"]*?)"/g, '"$1 - $2"');
            cleanedContent = cleanedContent.replace(/"'([^"]*?)'/g, '"$1"');
            
            console.log('[PerplexityService] Final cleaned content:', cleanedContent.substring(0, 500) + '...');
            const finalAttempt = JSON.parse(cleanedContent);
            console.log('[PerplexityService] Successfully parsed activity data on final attempt');
            
            // Extract and format materials from the activity
            const parsedActivity = this.parseMaterialsFromActivity(finalAttempt);
            return parsedActivity;
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

  // Parse materials from the AI-generated activity description
  private parseMaterialsFromActivity(activity: any): any {
    const suggestedMaterials: any[] = [];
    
    console.log('[PerplexityService] Parsing materials from activity:', activity.title);
    
    // Parse materials from the description and instructions
    const description = activity.description || '';
    const instructions = activity.instructions || [];
    
    // Common material patterns to look for
    const materialPatterns = [
      // Materials explicitly mentioned
      /(?:using|with|need|require[s]?|gather)\s+([^,.]+(?:,\s*[^,.]+)*)/gi,
      // Items in quotes that might be materials
      /"([^"]+)"/g,
      // Materials after keywords
      /materials?:\s*([^.]+)/gi,
      /supplies:\s*([^.]+)/gi,
      /items:\s*([^.]+)/gi
    ];
    
    // Extract materials from description
    const foundMaterials = new Set<string>();
    
    // Check description for materials
    materialPatterns.forEach((pattern: RegExp) => {
      const matches = Array.from(description.matchAll(pattern));
      for (const match of matches) {
        if (match && match[1]) {
          // Split by commas and clean up each material
          const items = match[1].split(/,|\sand\s/);
          items.forEach((item: string) => {
            const cleaned = item.trim().toLowerCase();
            if (cleaned && cleaned.length > 2 && cleaned.length < 50) {
              foundMaterials.add(cleaned);
            }
          });
        }
      }
    });
    
    // Check instructions for materials
    instructions.forEach((instruction: any) => {
      const text = instruction.text || instruction;
      if (typeof text === 'string') {
        materialPatterns.forEach((pattern: RegExp) => {
          const matches = Array.from(text.matchAll(pattern));
          for (const match of matches) {
            if (match && match[1]) {
              const items = match[1].split(/,|\sand\s/);
              items.forEach((item: string) => {
                const cleaned = item.trim().toLowerCase();
                if (cleaned && cleaned.length > 2 && cleaned.length < 50) {
                  foundMaterials.add(cleaned);
                }
              });
            }
          }
        });
      }
    });
    
    // Format materials for database insertion
    const commonMaterials = [
      { keyword: 'paper', name: 'Construction Paper', category: 'Art Supplies', quantity: 'Multiple sheets' },
      { keyword: 'crayon', name: 'Washable Crayons', category: 'Art Supplies', quantity: '1 set' },
      { keyword: 'marker', name: 'Washable Markers', category: 'Art Supplies', quantity: '1 set' },
      { keyword: 'glue', name: 'Child-Safe Glue', category: 'Art Supplies', quantity: '1 bottle' },
      { keyword: 'scissor', name: 'Safety Scissors', category: 'Art Supplies', quantity: '1 pair per child' },
      { keyword: 'paint', name: 'Washable Paint', category: 'Art Supplies', quantity: 'Assorted colors' },
      { keyword: 'block', name: 'Building Blocks', category: 'Manipulatives', quantity: '1 set' },
      { keyword: 'book', name: 'Picture Books', category: 'Reading Materials', quantity: 'Various' },
      { keyword: 'puzzle', name: 'Age-Appropriate Puzzles', category: 'Manipulatives', quantity: '2-3 puzzles' },
      { keyword: 'ball', name: 'Soft Play Balls', category: 'Gross Motor', quantity: '3-5 balls' },
      { keyword: 'music', name: 'Musical Instruments', category: 'Music', quantity: 'Assorted' },
      { keyword: 'tissue', name: 'Tissue Paper', category: 'Art Supplies', quantity: 'Multiple colors' },
      { keyword: 'jar', name: 'Small Jars or Containers', category: 'Containers', quantity: '1 per child' },
      { keyword: 'cup', name: 'Plastic Cups', category: 'Containers', quantity: '1 per child' },
      { keyword: 'brush', name: 'Paint Brushes', category: 'Art Supplies', quantity: '1 per child' },
    ];
    
    // Match found materials with common materials database
    foundMaterials.forEach(material => {
      const matchedMaterial = commonMaterials.find(cm => 
        material.includes(cm.keyword)
      );
      
      if (matchedMaterial) {
        // Check if not already added
        if (!suggestedMaterials.some(m => m.name === matchedMaterial.name)) {
          suggestedMaterials.push({
            name: matchedMaterial.name,
            category: matchedMaterial.category,
            quantity: matchedMaterial.quantity,
            description: `Required for: ${activity.title || 'this activity'}`,
            safetyNotes: material.includes('scissor') ? 'Adult supervision required' : 
                        material.includes('glue') || material.includes('paint') ? 'Non-toxic materials only' : null
          });
        }
      } else if (!material.includes('children') && !material.includes('activity')) {
        // Add as custom material if it doesn't match common ones
        const capitalizedMaterial = material.charAt(0).toUpperCase() + material.slice(1);
        suggestedMaterials.push({
          name: capitalizedMaterial,
          category: 'General Supplies',
          quantity: '1',
          description: `Required for: ${activity.title || 'this activity'}`
        });
      }
    });
    
    console.log('[PerplexityService] Found materials:', foundMaterials);
    console.log('[PerplexityService] Suggested materials:', suggestedMaterials);
    
    // Add the parsed materials to the activity object
    return {
      ...activity,
      suggestedMaterials: suggestedMaterials.slice(0, 10) // Limit to 10 suggestions
    };
  }
}

export const perplexityService = new PerplexityService();
