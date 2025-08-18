async function testRealisticPrompt() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not set');
    return;
  }

  // New realistic prompt with proper constraints
  const prompt = `Ultra-realistic DSLR photograph of a cozy, normal-sized childcare classroom. Shows exactly 7 children (ages 3-5) collaborating on art projects at two round tables. Standard classroom with normal-height windows (8 feet tall), realistic proportions (25x30 feet room). Children are painting and drawing with age-appropriate materials. Warm natural light from regular windows, not dramatic cathedral lighting. Sharp realistic textures, natural lighting, professional color grading. Shallow depth of field focusing on children's hands working on art. Shot with 35mm lens for natural perspective, avoiding wide-angle distortion. Photorealistic detail like an actual childcare center promotional photo.`;

  console.log('Testing realistic prompt with proper constraints...\n');
  console.log('Key constraints:');
  console.log('- Exactly 7 children (not 100!)');
  console.log('- Normal 8-foot windows (not 30-foot cathedral windows)');
  console.log('- Realistic 25x30 foot classroom size');
  console.log('- 35mm lens (no wide-angle distortion)');
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

testRealisticPrompt();