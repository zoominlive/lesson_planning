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
    
    // Combine all text for parsing
    let fullText = description + ' ';
    instructions.forEach((inst: any) => {
      const text = inst.text || inst;
      if (typeof text === 'string') {
        fullText += text + ' ';
      }
    });
    
    // Extract materials using smarter parsing
    const foundMaterials = new Set<string>();
    const lowerText = fullText.toLowerCase();
    
    // Define material patterns with their consolidation rules
    const materialPatterns = [
      // Paper products - consolidate various paper types
      { 
        pattern: /\b(colored\s+)?paper\b/gi,
        category: 'paper',
        skip: ['paper cards', 'paper plates', 'paper towels'] // Skip these compounds
      },
      { 
        pattern: /\b(tissue|construction|contact|card)\s+paper\b/gi,
        category: 'specialty_paper'
      },
      
      // Drawing materials - consolidate crayons
      { 
        pattern: /\b(washable\s+)?crayons?\b/gi,
        category: 'crayons',
        skip: ['white crayon'] // White crayon is usually mentioned for specific techniques
      },
      { 
        pattern: /\bwhite\s+crayons?\b/gi,
        category: 'white_crayon'
      },
      { 
        pattern: /\b(washable\s+)?markers?\b/gi,
        category: 'markers'
      },
      { 
        pattern: /\b(colored\s+)?pencils?\b/gi,
        category: 'pencils'
      },
      
      // Paint supplies
      { 
        pattern: /\b(washable\s+|water\s*color\s+)?paints?\b/gi,
        category: 'paint'
      },
      { 
        pattern: /\bpaint\s+brush(es)?\b/gi,
        category: 'brushes'
      },
      
      // Adhesives - consolidate glue types
      { 
        pattern: /\b(glue\s+sticks?|glue|paste)\b/gi,
        category: 'adhesive'
      },
      
      // Cards - smart consolidation
      { 
        pattern: /\b(index\s+)?cards?\b/gi,
        category: 'cards',
        skip: ['paper cards', 'greeting cards', 'flash cards']
      },
      
      // Containers
      { 
        pattern: /\b(plastic\s+)?cups?\b/gi,
        category: 'cups'
      },
      { 
        pattern: /\b(small\s+)?jars?\b/gi,
        category: 'jars'
      },
      { 
        pattern: /\bcontainers?\b/gi,
        category: 'containers'
      },
      { 
        pattern: /\btrays?\b/gi,
        category: 'trays'
      },
      
      // Safety items
      { 
        pattern: /\b(safety\s+)?scissors?\b/gi,
        category: 'scissors'
      },
      { 
        pattern: /\b(battery[\s-]operated\s+)?(tea\s*lights?|candles?|LED\s+lights?)\b/gi,
        category: 'lights'
      },
      
      // Building materials
      { 
        pattern: /\b(building\s+|wooden\s+)?blocks?\b/gi,
        category: 'blocks'
      },
      
      // Books and puzzles
      { 
        pattern: /\bbooks?\b/gi,
        category: 'books'
      },
      { 
        pattern: /\bpuzzles?\b/gi,
        category: 'puzzles'
      },
      
      // Party and play materials
      { 
        pattern: /\bballoons?\b/gi,
        category: 'balloons'
      },
      { 
        pattern: /\bbubbles?\b/gi,
        category: 'bubbles'
      },
      { 
        pattern: /\bstickers?\b/gi,
        category: 'stickers'
      },
      
      // Adhesive materials
      { 
        pattern: /\b(masking\s+)?tape\b/gi,
        category: 'tape'
      },
      
      // Sensory materials
      { 
        pattern: /\bplay\s*dough\b/gi,
        category: 'playdough'
      },
      { 
        pattern: /\b(kinetic\s+)?sand\b/gi,
        category: 'sand'
      },
      
      // Music and movement
      { 
        pattern: /\b(musical\s+)?instruments?\b/gi,
        category: 'instruments'
      },
      { 
        pattern: /\bscarves?\b/gi,
        category: 'scarves'
      },
      { 
        pattern: /\bribbons?\b/gi,
        category: 'ribbons'
      },
      
      // Outdoor/movement equipment
      { 
        pattern: /\bcones?\b/gi,
        category: 'cones'
      },
      { 
        pattern: /\bhula\s*hoops?\b/gi,
        category: 'hoops'
      },
      { 
        pattern: /\bballs?\b/gi,
        category: 'balls'
      },
      { 
        pattern: /\bropes?\b/gi,
        category: 'ropes'
      },
      
      // Natural materials
      { 
        pattern: /\bleaves\b/gi,
        category: 'leaves'
      },
      { 
        pattern: /\bsticks?\b/gi,
        category: 'sticks'
      },
      { 
        pattern: /\brocks?\b/gi,
        category: 'rocks'
      },
      { 
        pattern: /\bshells?\b/gi,
        category: 'shells'
      }
    ];
    
    // Process each pattern
    materialPatterns.forEach(({ pattern, category, skip }) => {
      const matches = fullText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.trim().toLowerCase();
          
          // Check if we should skip this match
          if (skip && skip.some(skipTerm => cleaned.includes(skipTerm))) {
            return;
          }
          
          // Add to found materials with category
          foundMaterials.add(`${category}:${cleaned}`);
        });
      }
    });
    
    // Consolidate found materials by category
    const materialsByCategory = new Map<string, Set<string>>();
    foundMaterials.forEach(item => {
      const [category, material] = item.split(':');
      if (!materialsByCategory.has(category)) {
        materialsByCategory.set(category, new Set());
      }
      materialsByCategory.get(category)!.add(material);
    });
    
    // Define consolidated material mappings
    const consolidatedMappings: { [key: string]: { name: string, category: string, quantity: string, safety?: string, includes?: string } } = {
      // Paper products
      'paper': { 
        name: 'Drawing Paper', 
        category: 'Art Supplies', 
        quantity: 'Multiple sheets',
        includes: 'white and colored paper'
      },
      'specialty_paper': { 
        name: 'Specialty Paper Collection', 
        category: 'Art Supplies', 
        quantity: 'Assorted types',
        includes: 'construction, tissue, or contact paper as needed'
      },
      
      // Drawing materials
      'crayons': { 
        name: 'Washable Crayons Set', 
        category: 'Art Supplies', 
        quantity: '1 set per child',
        includes: 'full color set including white'
      },
      'white_crayon': { 
        name: 'White Crayons', 
        category: 'Art Supplies', 
        quantity: '1 per child',
        includes: 'for resist technique'
      },
      'markers': { 
        name: 'Washable Markers', 
        category: 'Art Supplies', 
        quantity: '1 set'
      },
      'pencils': { 
        name: 'Colored Pencils', 
        category: 'Art Supplies', 
        quantity: '1 set'
      },
      
      // Paint supplies
      'paint': { 
        name: 'Washable Paint', 
        category: 'Art Supplies', 
        quantity: 'Assorted colors',
        includes: 'tempera or watercolor as specified'
      },
      'brushes': { 
        name: 'Paint Brushes', 
        category: 'Art Supplies', 
        quantity: '1 per child'
      },
      
      // Adhesives
      'adhesive': { 
        name: 'Glue Supplies', 
        category: 'Art Supplies', 
        quantity: 'As needed',
        includes: 'glue sticks or liquid glue'
      },
      
      // Cards
      'cards': { 
        name: 'Blank Cards', 
        category: 'Art Supplies', 
        quantity: 'Multiple cards',
        includes: 'cardstock or index cards'
      },
      
      // Containers
      'cups': { 
        name: 'Plastic Cups', 
        category: 'Containers', 
        quantity: '1 per child'
      },
      'jars': { 
        name: 'Small Jars', 
        category: 'Containers', 
        quantity: '1 per child'
      },
      'containers': { 
        name: 'Storage Containers', 
        category: 'Containers', 
        quantity: 'As needed'
      },
      'trays': { 
        name: 'Activity Trays', 
        category: 'Containers', 
        quantity: '1 per child or group'
      },
      
      // Safety items
      'scissors': { 
        name: 'Safety Scissors', 
        category: 'Art Supplies', 
        quantity: '1 pair per child',
        safety: 'Adult supervision required'
      },
      'lights': { 
        name: 'Battery-Operated Lights', 
        category: 'Safety Items', 
        quantity: 'As needed',
        includes: 'LED tealights or similar safe lighting'
      },
      
      // Building materials
      'blocks': { 
        name: 'Building Blocks', 
        category: 'Manipulatives', 
        quantity: '1 set'
      },
      
      // Books and puzzles
      'books': { 
        name: 'Picture Books', 
        category: 'Reading Materials', 
        quantity: '2-3 books'
      },
      'puzzles': { 
        name: 'Age-Appropriate Puzzles', 
        category: 'Manipulatives', 
        quantity: '2-3 puzzles'
      },
      
      // Party and play materials
      'balloons': { 
        name: 'Balloons', 
        category: 'Party Supplies', 
        quantity: 'Pack of 10-20',
        safety: 'Adult supervision required for inflation'
      },
      'bubbles': { 
        name: 'Bubble Solution', 
        category: 'Sensory Play', 
        quantity: '1 bottle',
        includes: 'wands included'
      },
      'stickers': { 
        name: 'Sticker Sheets', 
        category: 'Art Supplies', 
        quantity: 'Multiple sheets'
      },
      
      // Adhesive materials
      'tape': { 
        name: 'Tape', 
        category: 'Art Supplies', 
        quantity: '1 roll',
        includes: 'masking or clear tape'
      },
      
      // Sensory materials
      'playdough': { 
        name: 'Play Dough', 
        category: 'Sensory Play', 
        quantity: 'Multiple colors',
        safety: 'Non-toxic'
      },
      'sand': { 
        name: 'Sensory Sand', 
        category: 'Sensory Play', 
        quantity: '2-3 lbs',
        includes: 'kinetic or regular play sand'
      },
      
      // Music and movement
      'instruments': { 
        name: 'Musical Instruments', 
        category: 'Music & Movement', 
        quantity: '1 set',
        includes: 'shakers, drums, bells'
      },
      'scarves': { 
        name: 'Movement Scarves', 
        category: 'Music & Movement', 
        quantity: '1 per child',
        includes: 'lightweight fabric'
      },
      'ribbons': { 
        name: 'Dance Ribbons', 
        category: 'Music & Movement', 
        quantity: '1 per child'
      },
      
      // Outdoor/movement equipment
      'cones': { 
        name: 'Activity Cones', 
        category: 'Physical Activity', 
        quantity: '4-6 cones'
      },
      'hoops': { 
        name: 'Hula Hoops', 
        category: 'Physical Activity', 
        quantity: '1-2 per group'
      },
      'balls': { 
        name: 'Play Balls', 
        category: 'Physical Activity', 
        quantity: 'Various sizes',
        includes: 'soft, child-safe balls'
      },
      'ropes': { 
        name: 'Jump Ropes', 
        category: 'Physical Activity', 
        quantity: '1 per child or group'
      },
      
      // Natural materials
      'leaves': { 
        name: 'Natural Leaves', 
        category: 'Nature Materials', 
        quantity: 'Collection',
        includes: 'clean, safe varieties'
      },
      'sticks': { 
        name: 'Natural Sticks', 
        category: 'Nature Materials', 
        quantity: 'Collection',
        safety: 'Check for sharp edges'
      },
      'rocks': { 
        name: 'Smooth Rocks', 
        category: 'Nature Materials', 
        quantity: 'Collection',
        safety: 'Clean before use'
      },
      'shells': { 
        name: 'Shells', 
        category: 'Nature Materials', 
        quantity: 'Collection',
        safety: 'Check for sharp edges'
      }
    };
    
    // Process consolidated materials - avoid duplicates intelligently
    const addedCategories = new Set<string>();
    
    materialsByCategory.forEach((materials, category) => {
      // Special handling for related categories
      if (category === 'white_crayon' && addedCategories.has('crayons')) {
        // Skip white crayon if we already have a crayon set
        return;
      }
      
      if (category === 'specialty_paper' && materials.size === 1) {
        // If only one type of specialty paper, be specific
        const paperType = Array.from(materials)[0];
        if (paperType.includes('tissue')) {
          suggestedMaterials.push({
            name: 'Tissue Paper',
            category: 'Art Supplies',
            quantity: 'Multiple colors',
            description: `Required for: ${activity.title || 'this activity'}`
          });
        } else if (paperType.includes('construction')) {
          suggestedMaterials.push({
            name: 'Construction Paper',
            category: 'Art Supplies',
            quantity: 'Multiple sheets',
            description: `Required for: ${activity.title || 'this activity'}`
          });
        } else if (paperType.includes('contact')) {
          suggestedMaterials.push({
            name: 'Clear Contact Paper',
            category: 'Art Supplies',
            quantity: '1 roll',
            description: `Required for: ${activity.title || 'this activity'}`
          });
        }
        addedCategories.add(category);
        return;
      }
      
      // Add the consolidated material if mapping exists
      if (consolidatedMappings[category]) {
        const mapped = consolidatedMappings[category];
        
        // Check if we need white crayon specifically (for resist techniques)
        if (category === 'white_crayon') {
          const hasResistTechnique = lowerText.includes('resist') || 
                                    lowerText.includes('reveal') || 
                                    lowerText.includes('invisible');
          if (!hasResistTechnique) {
            return; // Skip white crayon if not needed for special technique
          }
        }
        
        suggestedMaterials.push({
          name: mapped.name,
          category: mapped.category,
          quantity: mapped.quantity,
          description: `Required for: ${activity.title || 'this activity'}`,
          safetyNotes: mapped.safety || null
        });
        addedCategories.add(category);
      }
    });
    
    // Log results
    console.log('[PerplexityService] Found materials by category:', 
      Array.from(materialsByCategory.entries()).map(([cat, items]) => 
        `${cat}: ${Array.from(items).join(', ')}`
      )
    );
    console.log('[PerplexityService] Suggested materials:', 
      suggestedMaterials.map(m => m.name)
    );
    
    // Add the parsed materials to the activity object
    return {
      ...activity,
      suggestedMaterials: suggestedMaterials.slice(0, 8) // Limit to 8 most important materials
    };
  }
}

export const perplexityService = new PerplexityService();
