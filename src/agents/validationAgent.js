import { getOpenAI } from '../config/openai';

/**
 * Agent 3: Validation Agent
 * Validates extracted data for consistency and reasonableness
 */
export const validateExtractedData = async (extractedData, storeInfo) => {
  const openai = getOpenAI();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a data validation specialist. Review the extracted receipt data and check for inconsistencies or errors.

Store: ${storeInfo.store}

Validation checks:
1. Item names should make sense (not garbled OCR text)
2. Quantities should be reasonable (e.g., soda quantity of 5.66 doesn't make sense - should be 1 or 6)
3. Prices should be realistic (e.g., soda at $200 is unrealistic)
4. Check if items are appropriate for this store type
5. Verify math: itemList sum + tax + fees should equal total (allow small rounding differences)
6. Item quantities should typically be whole numbers for countable items (1, 2, 3) or reasonable decimals for weighted items (2.5 lbs)

For each item, either:
- Keep it as-is if valid
- Correct obvious errors (e.g., qty 5.66 → 6, garbled name → best guess)
- Flag if uncertain

Return ONLY a JSON object with this format:
{
  "isValid": true/false,
  "issues": ["list of issues found"],
  "correctedData": {
    "itemList": [...],
    "tax": 0.00,
    "bagFee": 0.00,
    "otherFees": 0.00,
    "subtotal": 0.00,
    "total": 0.00
  },
  "confidence": "high|medium|low"
}`
        },
        {
          role: "user",
          content: `Validate this extracted receipt data:\n\n${JSON.stringify(extractedData, null, 2)}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse validation response');
  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
};

