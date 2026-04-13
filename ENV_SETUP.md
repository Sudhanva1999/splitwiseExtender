# Environment Setup

## OpenAI API Key Setup

To use the bill processing feature, you need an OpenAI API key.

### Getting Your API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy your API key (starts with `sk-`)

### Setting Up Your API Key

You have two options:

#### Option 1: Enter in the App (Recommended for Testing)
1. Run the app: `npm run dev`
2. Navigate to the "Upload Bill" tab
3. Enter your API key when prompted
4. The key is stored only in memory during your session

#### Option 2: Use .env File (For Development)
1. Create a `.env` file in the `split-bill-app` directory
2. Add your key:
   ```
   VITE_OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. Restart the dev server

**Note:** The `.env` file is gitignored for security. Never commit your API key!

### Security Warning

⚠️ This app uses `dangerouslyAllowBrowser: true` to call OpenAI directly from the browser for demo purposes. 

**For production apps, you should:**
- Create a backend server
- Store the API key securely on the server
- Make API calls from the server, not the browser
- Never expose your API key in frontend code

