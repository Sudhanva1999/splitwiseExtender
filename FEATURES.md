# Agentic Expense Manager - Features

## 1. Bill Processing with Multi-Agent System 🤖

Upload a receipt/bill image and let AI agents automatically extract all the information.

### How It Works

The system uses three specialized AI agents working together:

#### Agent 1: Store Detection Agent 🏪
- Analyzes the receipt to identify which store it's from
- Looks for logos, store names, addresses, and formatting patterns
- Returns: Store name, confidence level, and reasoning

#### Agent 2: Item Extraction Agent 📝
- Extracts all items with names, quantities, and prices
- Also extracts: tax, bag fees, other fees, subtotal, and total
- Adapts to different store formats
- Returns: Complete itemized list with all costs

#### Agent 3: Validation Agent ✅
- Validates extracted data for consistency
- Checks if item names make sense (not OCR errors)
- Validates quantities (e.g., fixes "soda qty 5.66" → "6")
- Validates prices (e.g., flags "$200 for a soda")
- Verifies math: items + tax + fees = total
- Corrects obvious errors
- Returns: Validated and corrected data

### Features
- **Upload any receipt image** (photo or scan)
- **Automatic store detection** (Walmart, Target, Costco, etc.)
- **Smart item extraction** with OCR correction
- **Data validation** to catch errors
- **JSON output** ready for API integration
- **Progress tracking** see each agent's work in real-time

### Supported Receipt Types
- Grocery stores (Walmart, Target, Kroger, Safeway, etc.)
- Restaurants
- Gas stations
- Retail stores
- Pharmacies (CVS, Walgreens)
- Any receipt with itemized purchases

## 2. Bill Splitter 💰

Split bills fairly among multiple people with various split methods.

### Split Modes

#### Equal Split
- Divides the total equally among selected users
- Perfect for shared meals or group purchases

#### Percentage Split
- Each person specifies their percentage share
- Must add up to 100%
- Great when people want different portions

#### Share-Based Split
- Assign shares/units to each person (e.g., 1, 2, 3)
- Amount is divided proportionally
- Useful for weighted splits

#### Custom Amount Split
- Manually specify exact dollar amounts
- Must add up to the total
- Full control over who pays what

### Features
- ✅ **User selection**: Choose who participates in the split
- ✅ **Real-time calculations**: See amounts update instantly
- ✅ **Precision normalization**: Ensures totals match exactly (rounded to 2 decimals)
- ✅ **Splitwise-ready**: Output format compatible with Splitwise API
- ✅ **Beautiful UI**: Modern, responsive design

### Normalization System
Our normalization ensures that:
- All amounts are rounded to 2 decimal places (cents)
- The sum of all splits equals the exact total
- Rounding differences are randomly distributed
- No penny left behind!

Example: $150.75 ÷ 4 = $37.69, $37.69, $37.69, $37.68 ✓

## Technical Details

### Technologies Used
- **React 19** - UI framework
- **Vite** - Build tool
- **OpenAI GPT-4o** - Vision model for receipt processing
- **Multi-agent architecture** - Specialized agents for each task

### Architecture
```
User uploads image
    ↓
Agent 1: Detect Store → "Walmart"
    ↓
Agent 2: Extract Items → [items, prices, tax...]
    ↓
Agent 3: Validate & Correct → Verified data
    ↓
Return JSON output
```

### Why Multi-Agent?
- **Specialization**: Each agent focuses on one task
- **Better accuracy**: Multiple checks catch more errors
- **Explainability**: See each step of processing
- **Maintainability**: Easy to improve individual agents
- **Reliability**: Validation layer ensures quality

## Future Enhancements
- [ ] Backend API for secure key storage
- [ ] Splitwise API integration
- [ ] Receipt history/database
- [ ] Batch processing multiple receipts
- [ ] Export to CSV/Excel
- [ ] Mobile app version

