# Agentic Expense Manager

A smart expense management app with AI-powered receipt processing and intelligent bill splitting.

## Features

🤖 **Multi-Agent Bill Processing**
- Upload receipt images and extract all data automatically
- 3 specialized AI agents: Store Detection, Item Extraction, and Validation
- Handles OCR errors and validates data for accuracy

💰 **Smart Bill Splitter**
- Multiple split modes: Equal, Percentage, Shares, Custom Amount
- User selection - choose who to include in the split
- Precision normalization ensures exact totals (Splitwise-ready)

👥 **Splitwise Integration**
- Automatically fetches users from your Splitwise group
- No manual user configuration needed
- Real names from Splitwise
- Easy group switching via .env file

## Quick Start

### Installation

```bash
cd split-bill-app
npm install
```

### Setup API Keys

You need two sets of credentials:

#### 1. OpenAI API Key (for bill processing)
Get your key from [OpenAI Platform](https://platform.openai.com/api-keys)

#### 2. Splitwise API Key & Group ID (for user management)
- Get API key from [Splitwise Apps](https://secure.splitwise.com/apps)
- Get Group ID from your Splitwise group URL

Create a `.env` file:
```bash
VITE_OPENAI_API_KEY=sk-your-openai-key
VITE_SPLITWISE_API_KEY=your-splitwise-api-key
VITE_SPLITWISE_GROUP_ID=12345678
```

See [SPLITWISE_SETUP.md](./SPLITWISE_SETUP.md) for detailed Splitwise setup instructions.

### Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

### Upload Bill Tab 📸
1. Enter your OpenAI API key
2. Upload a receipt/bill image
3. Click "Process Bill"
4. Watch the AI agents work:
   - Agent 1 identifies the store
   - Agent 2 extracts all items
   - Agent 3 validates and corrects the data
5. View results and copy JSON output

### Split Bill Tab 💰
1. Enter total amount and users
2. Click "Split Bill"
3. Select users to include
4. Choose split mode (Equal/Percentage/Shares/Amount)
5. Adjust values if needed
6. Click "Split Bill" to get results

## Documentation

- [FEATURES.md](./FEATURES.md) - Detailed feature documentation
- [SPLITWISE_SETUP.md](./SPLITWISE_SETUP.md) - Splitwise integration setup guide
- [ENV_SETUP.md](./ENV_SETUP.md) - API key setup guide

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **OpenAI GPT-4o** - Vision AI for receipt processing
- **Multi-agent architecture** - Specialized AI agents

## Architecture

```
┌─────────────────┐
│  User uploads   │
│  receipt image  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Agent 1:      │
│ Store Detection │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Agent 2:      │
│Item Extraction  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Agent 3:      │
│   Validation    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Structured JSON │
│     Output      │
└─────────────────┘
```

## Security Note

⚠️ This app calls OpenAI directly from the browser for demo purposes. For production:
- Use a backend server
- Store API keys securely on the server
- Never expose keys in frontend code

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
split-bill-app/
├── src/
│   ├── agents/
│   │   ├── storeDetectionAgent.js
│   │   ├── itemExtractionAgent.js
│   │   └── validationAgent.js
│   ├── components/
│   │   ├── BillSplitter.jsx
│   │   ├── BillUploader.jsx
│   │   └── *.css
│   ├── config/
│   │   └── openai.js
│   ├── services/
│   │   └── billProcessor.js
│   ├── App.jsx
│   └── main.jsx
├── .env (create this)
├── package.json
└── README.md
```

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.
