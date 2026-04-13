# Splitwise Integration Setup

## Overview

The app now fetches users automatically from your Splitwise group! No need to manually configure users - they're pulled directly from Splitwise.

## Setup Steps

### 1. Get Your Splitwise API Key

1. Go to https://secure.splitwise.com/apps
2. Log in to your Splitwise account
3. Click "Register your application"
4. Fill in the form:
   - **Application name**: Agentic Expense Manager
   - **Description**: AI-powered expense splitting
   - **Homepage URL**: http://localhost:5173 (for development)
5. Click "Register"
6. Copy your **API key** (it will look like a long string)

### 2. Get Your Group ID

**Option A: Use Our Helper Script (Easiest!)**
```bash
npm run fetch-groups
```
This will show all your groups with their IDs and members. Pick the one you want!

**Option B: From URL**
1. Go to https://secure.splitwise.com
2. Navigate to your group
3. Look at the URL: `https://secure.splitwise.com/groups/12345678`
4. The number at the end (`12345678`) is your Group ID

**Option C: From API**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://secure.splitwise.com/api/v3.0/get_groups
```
Find your group in the response and note its `id`.

### 3. Update Your .env File

Edit `/split-bill-app/.env`:

```bash
# OpenAI API Key
VITE_OPENAI_API_KEY=sk-your-openai-key

# Splitwise API Key (from step 1)
VITE_SPLITWISE_API_KEY=your-splitwise-api-key-here

# Splitwise Group ID (from step 2)
VITE_SPLITWISE_GROUP_ID=12345678
```

### 4. Restart the App

```bash
cd split-bill-app
npm run dev
```

The app will now:
- Load users from your Splitwise group on startup
- Display group members at the top
- Use real names from Splitwise

## How It Works

1. **On app load**: Calls Splitwise API `/get_group/{id}` endpoint
2. **Extracts members**: Gets all group members with their names
3. **Transforms data**: Converts to app format with id and name
4. **Fallback**: If Splitwise fails, uses default test users

## Troubleshooting

### "Splitwise credentials not found"
- Make sure `.env` file exists in `split-bill-app/` directory
- Check that both `VITE_SPLITWISE_API_KEY` and `VITE_SPLITWISE_GROUP_ID` are set
- Restart the dev server after updating `.env`

### "Splitwise API error: 401"
- Your API key is invalid or expired
- Generate a new API key at https://secure.splitwise.com/apps

### "Splitwise API error: 404"
- Your Group ID is incorrect
- Double-check the group ID from the URL

### "No users found in the Splitwise group"
- The group might be empty
- Add members to your Splitwise group first

### CORS Issues
If you get CORS errors:
- This is a limitation of browser-based API calls
- For production, use a backend server to proxy Splitwise API calls
- For development, you can use a CORS proxy or browser extension

## API Details

### Endpoint Used
```
GET https://secure.splitwise.com/api/v3.0/get_group/{id}
```

### Headers
```
Authorization: Bearer {your_api_key}
Content-Type: application/json
```

### Response Structure
```json
{
  "group": {
    "id": 12345678,
    "name": "Weekend Trip",
    "members": [
      {
        "id": 1,
        "first_name": "Alice",
        "last_name": "Smith",
        "email": "alice@example.com",
        "picture": {
          "medium": "https://..."
        }
      },
      // ... more members
    ]
  }
}
```

### What We Extract
- `id`: User ID from Splitwise
- `name`: Combined first and last name
- `firstName`: First name only
- `lastName`: Last name only
- `email`: User email
- `picture`: Profile picture URL (for future use)

## Benefits

✅ **No Manual Configuration**: Users sync automatically from Splitwise
✅ **Real Names**: Uses actual Splitwise display names
✅ **Always Updated**: Fetch fresh data on each app load
✅ **Multiple Groups**: Switch groups by changing Group ID in .env
✅ **Fallback Support**: Works even if Splitwise is unavailable

## Future Enhancements

Possible improvements:
- [ ] Sync splits back to Splitwise after processing
- [ ] Support multiple groups (group selector UI)
- [ ] Cache users to reduce API calls
- [ ] Refresh users button
- [ ] Show user profile pictures
- [ ] Create expenses directly in Splitwise

## Security Notes

⚠️ **Important**: 
- Never commit your `.env` file to git
- Keep your API key secret
- For production, use a backend server
- Don't expose API keys in frontend code

## Example .env File

```bash
# Complete .env file example
VITE_OPENAI_API_KEY=sk-proj-abc123...
VITE_SPLITWISE_API_KEY=xyz789...
VITE_SPLITWISE_GROUP_ID=12345678
```

## Testing

To test the integration:
1. Add/remove members in your Splitwise group
2. Refresh the app
3. Members should update automatically

## Related Files

- `src/services/splitwiseService.js` - Splitwise API integration
- `src/App.jsx` - User loading logic
- `.env` - Configuration file
- `.env.example` - Template with placeholders

