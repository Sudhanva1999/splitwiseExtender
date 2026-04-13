# Splitwise Groups Fetcher Script

## What This Does

This script fetches all your Splitwise groups and displays their IDs and member names, making it easy to find the correct Group ID for your `.env` file.

## Usage

### Quick Run

```bash
npm run fetch-groups
```

### Manual Run

```bash
node scripts/fetchGroups.js
```

## Prerequisites

Make sure you have your Splitwise API key in your `.env` file:

```bash
VITE_SPLITWISE_API_KEY=your-api-key-here
```

## Output

The script will show:
- Group name
- Group ID (what you need for .env)
- Number of members
- Member names
- Whether the group simplifies debts

Example output:
```
✅ Found 3 group(s):

1. Weekend Trip
   Group ID: 12345678
   Members: 4
   → Alice Smith, Bob Jones, Charlie Brown, Diana Prince
   Simplify debts: Yes

2. Roommates
   Group ID: 87654321
   Members: 3
   → Alice Smith, Bob Jones, Eve Davis
   Simplify debts: No
```

## What to Do Next

1. Find the group you want to use from the list
2. Copy its Group ID
3. Add to your `.env` file:
   ```bash
   VITE_SPLITWISE_GROUP_ID=12345678
   ```
4. Restart your dev server:
   ```bash
   npm run dev
   ```

## Troubleshooting

### "VITE_SPLITWISE_API_KEY not found"
- Make sure `.env` file exists in the `split-bill-app/` directory
- Add your API key to `.env`

### "API Error: 401"
- Your API key is invalid or expired
- Get a new one from https://secure.splitwise.com/apps

### "No groups found"
- You're not a member of any Splitwise groups yet
- Create one at https://secure.splitwise.com/groups/new

## Using Different Groups

You can easily switch between groups:
1. Run `npm run fetch-groups` to see all options
2. Update `VITE_SPLITWISE_GROUP_ID` in `.env`
3. Restart the app

The app will load members from the new group!

