import OpenAI from 'openai';

let openaiClient = null;

export const initOpenAI = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY not found in .env file. Please add it to your .env file.');
  }
  
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Note: In production, use a backend server
    });
  }
  
  return openaiClient;
};

export const getOpenAI = () => {
  if (!openaiClient) {
    initOpenAI();
  }
  return openaiClient;
};

