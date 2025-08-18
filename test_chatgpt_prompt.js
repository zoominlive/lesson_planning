async function testChatGPTPrompt() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not set');
    return;
  }

  // ChatGPT's suggested prompt
  const prompt = `Ultra-realistic DSLR photograph of a bright childcare classroom. Children are collaboratively creating large murals at different art stations, each inspired by diverse music styles. The scene captures kids moving energetically with paintbrushes, crayons, and art materials, showing imaginative creativity and teamwork. The room is sunlit with natural light filtering through windows. Sharp realistic textures, cinematic lighting, professional color grading. Shallow depth of field with focus on children's hands and colorful artworks, while the background softly blurs. Joyful expressions and dynamic movement in a vibrant, art-filled environment. High-resolution, photorealistic detail, captured as if by a professional photographer with a wide-angle lens.`;

  console.log('Testing ChatGPT-enhanced prompt with DALL-E 3 API...\n');
  console.log('Prompt:', prompt);
  console.log('\nGenerating image...');

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        size: '1024x1024',
        quality: 'hd',
        n: 1
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', error);
      return;
    }

    const data = await response.json();
    console.log('\nImage generated successfully!');
    console.log('URL:', data.data[0].url);
    console.log('\nRevised prompt from DALL-E:', data.data[0].revised_prompt);
  } catch (error) {
    console.error('Error:', error);
  }
}

testChatGPTPrompt();