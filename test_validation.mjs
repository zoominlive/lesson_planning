import fetch from 'node-fetch';

async function testValidation() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.log('No PERPLEXITY_API_KEY found');
    return;
  }
  
  console.log('Testing validation with sonar model...');
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
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
            content: 'Please validate these inputs for an early childhood educational activity:\nActivity Type: "sorting"\nFocus Material: "blocks"\nDetermine if these are appropriate for generating activities for children ages 0-5.'
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      })
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    } else {
      const data = await response.json();
      console.log('Success! Content:', data.choices[0].message.content);
      
      // Try to parse the JSON response
      try {
        const parsed = JSON.parse(data.choices[0].message.content);
        console.log('Parsed validation result:', parsed);
      } catch (e) {
        console.log('Could not parse JSON from response');
      }
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testValidation();
