import { detectStore } from '../agents/storeDetectionAgent';
import { extractItems } from '../agents/itemExtractionAgent';
import { validateExtractedData } from '../agents/validationAgent';

/**
 * Main orchestrator function for the multi-agent bill processing system
 * Coordinates all agents to process a bill image
 * 
 * @param {string} imageBase64 - Base64 encoded image with data URI prefix
 * @param {function} onProgress - Callback for progress updates
 * @returns {Promise<Object>} Processed bill data
 */
export const processBillImage = async (imageBase64, onProgress = null) => {
  try {
    // Step 1: Detect Store
    if (onProgress) onProgress({ step: 1, message: 'Identifying store...' });
    
    const storeInfo = await detectStore(imageBase64);
    console.log('Store detected:', storeInfo);
    
    if (onProgress) onProgress({ 
      step: 2, 
      message: `Store identified: ${storeInfo.store}`,
      data: { storeInfo }
    });
    
    // Step 2: Extract Items
    if (onProgress) onProgress({ step: 3, message: 'Extracting items...' });
    
    const extractedData = await extractItems(imageBase64, storeInfo);
    console.log('Items extracted:', extractedData);
    
    if (onProgress) onProgress({ 
      step: 4, 
      message: `Extracted ${extractedData.itemList?.length || 0} items`,
      data: { extractedData }
    });
    
    // Step 3: Validate Data
    if (onProgress) onProgress({ step: 5, message: 'Validating data...' });
    
    const validationResult = await validateExtractedData(extractedData, storeInfo);
    console.log('Validation result:', validationResult);
    
    if (onProgress) onProgress({ 
      step: 6, 
      message: 'Processing complete!',
      data: { validationResult }
    });
    
    // Return final processed data
    const finalData = {
      store: storeInfo.store,
      storeConfidence: storeInfo.confidence,
      itemList: validationResult.correctedData.itemList,
      tax: validationResult.correctedData.tax || 0,
      bagFee: validationResult.correctedData.bagFee || 0,
      otherFees: validationResult.correctedData.otherFees || 0,
      subtotal: validationResult.correctedData.subtotal || 0,
      total: validationResult.correctedData.total || 0,
      validation: {
        isValid: validationResult.isValid,
        issues: validationResult.issues,
        confidence: validationResult.confidence
      },
      rawData: {
        storeDetection: storeInfo,
        extraction: extractedData,
        validation: validationResult
      }
    };
    
    return finalData;
    
  } catch (error) {
    console.error('Bill processing error:', error);
    throw new Error(`Failed to process bill: ${error.message}`);
  }
};

/**
 * Helper function to convert File to base64 data URI
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

