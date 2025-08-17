import fetch from 'node-fetch';

async function testPerplexityAPI() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.log('No PERPLEXITY_API_KEY found');
    return;
  }
  
  console.log('Testing Perplexity API with key length:', apiKey.length);
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a test. Respond with JSON: {"test": "success"}'
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
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    } else {
      const data = await response.json();
      console.log('Success! Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPerplexityAPI();
