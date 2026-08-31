import dotenv from 'dotenv';
dotenv.config();

/**
 * Service to interact directly with the Google Gemini API.
 */
export const executeGeminiPrompt = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  if (!apiKey || apiKey === 'your_gemini_api_key') {
    throw new Error('Gemini API Key is not configured in backend .env file.');
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error details:', errorData);
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini returned an empty response.');
    }

    let aiText = data.candidates[0].content.parts[0].text;
    
    // Sanitize JSON response from markdown wrappers if present
    aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    return JSON.parse(aiText);
  } catch (error) {
    console.error('Error executing Gemini API prompt:', error);
    throw error;
  }
};
