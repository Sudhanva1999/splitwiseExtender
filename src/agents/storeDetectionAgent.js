import { getOpenAI } from '../config/openai';

/**
 * Agent 1: Store Detection Agent
 * Identifies which establishment the bill belongs to (Walmart, Target, etc.)
 */
export const detectStore = async (imageBase64) => {
  const openai = getOpenAI();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a store detection specialist. Analyze the receipt image and identify which store or establishment it belongs to.
          
Common stores include: Walmart, Target, Costco, Whole Foods, Safeway, Kroger, CVS, Walgreens, Amazon, restaurants, gas stations, etc.

Look for:
- Store logos
- Store name at the top
- Store address
- Receipt formatting patterns
- Unique identifiers

Return ONLY a JSON object with this format:
{
  "store": "Store Name",
  "confidence": "high|medium|low",
  "reasoning": "Brief explanation of why you identified this store"
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify the store from this receipt:"
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse store detection response');
  } catch (error) {
    console.error('Store detection error:', error);
    throw error;
  }
};

