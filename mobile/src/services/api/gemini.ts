const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export interface GeminiClassification {
  waste_type: 'plastic' | 'paper' | 'metal' | 'organic' | 'other';
  confidence: number;
  notes: string;
}

const PROMPT = `
Identify the dominant waste type in this image.
Return ONLY valid JSON in this format:
{
  "waste_type": "plastic | paper | metal | organic | other",
  "confidence": 0.0-1.0,
  "notes": "brief description"
}
If unclear, use "other" and low confidence.
`;

export const classifyWaste = async (base64Image: string): Promise<GeminiClassification> => {
  if (!GEMINI_API_KEY) {
    console.error('Missing Gemini API Key');
    return { waste_type: 'other', confidence: 0, notes: 'API Key not configured' };
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error detail:', JSON.stringify(errorData));
      throw new Error('Gemini classification failed');
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('Empty response from Gemini');
    }

    // Clean JSON response (sometimes Gemini adds markdown block)
    const cleanJson = textResponse.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Gemini Service Error:', error);
    return {
      waste_type: 'other',
      confidence: 0,
      notes: 'Error during classification',
    };
  }
};
