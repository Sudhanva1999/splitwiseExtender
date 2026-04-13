import { getOpenAI } from '../config/openai';

/**
 * Agent 2: Item Extraction Agent
 * Extracts item details including name, quantity, and price
 */
export const extractItems = async (imageBase64, storeInfo) => {
  const openai = getOpenAI();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a receipt item extraction specialist. Extract all items from the receipt with their names, quantities, and prices.

Store identified: ${storeInfo.store}

Guidelines:
- Extract EVERY item listed on the receipt
- Item names should be clear and readable
- Quantities should be numeric (default to 1 if not shown)
- Prices should be numeric (in dollars)
- Also extract: tax, bag fee, other fees if present
- Some fields might be missing depending on the store

Return ONLY a JSON object with this EXACT format:
{
  "itemList": [
    {
      "itemName": "Product Name",
      "qty": 1.0,
      "price": 0.00
    }
  ],
  "tax": 0.00,
  "bagFee": 0.00,
  "otherFees": 0.00,
  "subtotal": 0.00,
  "total": 0.00
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all items and details from this receipt:"
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
      max_tokens: 2000,
      temperature: 0.2
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse item extraction response');
  } catch (error) {
    console.error('Item extraction error:', error);
    throw error;
  }
};

