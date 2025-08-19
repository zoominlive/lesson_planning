import fetch from 'node-fetch';

async function testPerplexityAPI() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.log('No PERPLEXITY_API_KEY found');
    return;
  }
  
  // Try different model names that might work
  const models = [
    'sonar-small-128k-online',
    'sonar-medium-128k-online', 
    'llama-3-sonar-small-128k-online',
    'llama-3-sonar-medium-128k-online'
  ];
  
  for (const model of models) {
    console.log(`\nTesting model: ${model}`);
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'Respond with JSON: {"test": "success"}'
            },
            {
              role: 'user',
              content: 'Test'
            }
          ],
          temperature: 0.1,
          max_tokens: 50
        })
      });
      
      if (response.ok) {
        console.log(`✓ Model ${model} works!`);
        const data = await response.json();
        console.log('Response:', data.choices[0].message.content);
        break;
      } else {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.log(`✗ Model ${model} failed:`, error.error.message);
      }
    } catch (error) {
      console.error(`✗ Model ${model} error:`, error.message);
    }
  }
}

testPerplexityAPI();
