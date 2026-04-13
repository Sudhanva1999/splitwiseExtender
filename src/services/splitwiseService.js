/**
 * Splitwise API Service
 * Handles communication with Splitwise API to fetch group and user data
 */

// Use proxy in development to avoid CORS issues
const SPLITWISE_API_BASE = import.meta.env.DEV 
  ? '/api/splitwise'  // Proxy endpoint in development
  : 'https://secure.splitwise.com/api/v3.0'; // Direct in production (needs backend)

/**
 * Fetch group details including members from Splitwise
 * @param {string} groupId - The Splitwise group ID
 * @param {string} apiKey - The Splitwise API key
 * @returns {Promise<Array>} Array of user objects
 */
export const fetchGroupUsers = async (groupId, apiKey) => {
  if (!groupId || !apiKey) {
    throw new Error('Splitwise API key and Group ID are required');
  }

  try {
    const response = await fetch(`${SPLITWISE_API_BASE}/get_group/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Splitwise API error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    // Extract users from group data
    const group = data.group;
    
    if (!group || !group.members) {
      throw new Error('Invalid group data received from Splitwise');
    }

    // Transform Splitwise users to our app format
    const users = group.members.map(member => ({
      id: member.id,
      name: `${member.first_name}${member.last_name ? ' ' + member.last_name : ''}`.trim() || 'Unknown',
      firstName: member.first_name || '',
      lastName: member.last_name || '',
      email: member.email || '',
      picture: member.picture?.medium || null
    }));

    return users;
  } catch (error) {
    console.error('Error fetching Splitwise group users:', error);
    throw error;
  }
};

/**
 * Get Splitwise credentials from environment variables
 * @returns {Object} Object with apiKey and groupId
 */
export const getSplitwiseCredentials = () => {
  const apiKey = import.meta.env.VITE_SPLITWISE_API_KEY;
  const groupId = import.meta.env.VITE_SPLITWISE_GROUP_ID;

  if (!apiKey || !groupId) {
    throw new Error(
      'Splitwise credentials not found in .env file. Please add VITE_SPLITWISE_API_KEY and VITE_SPLITWISE_GROUP_ID'
    );
  }

  return { apiKey, groupId };
};

/**
 * Get current authenticated user from Splitwise
 * @param {string} apiKey - The Splitwise API key
 * @returns {Promise<Object>} Current user data
 */
export const getCurrentUser = async (apiKey) => {
  if (!apiKey) {
    throw new Error('Splitwise API key is required');
  }

  try {
    const response = await fetch(`${SPLITWISE_API_BASE}/get_current_user`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Splitwise API error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

/**
 * Create an expense in Splitwise
 * @param {Object} expenseData - Expense data
 * @param {string} apiKey - Splitwise API key
 * @returns {Promise<Object>} Created expense data
 */
export const createExpense = async (expenseData, apiKey) => {
  if (!apiKey) {
    throw new Error('Splitwise API key is required');
  }

  try {
    // Format the expense data for Splitwise API
    // Splitwise expects flattened format: users__0__user_id, users__0__paid_share, etc.
    const payload = {
      cost: expenseData.cost.toFixed(2), // Must be string with 2 decimals
      description: expenseData.description,
      group_id: expenseData.groupId,
      currency_code: expenseData.currencyCode || 'USD',
      date: expenseData.date || new Date().toISOString().split('T')[0],
      repeat_interval: 'never',
      creation_method: 'api' // Indicates expense was created via API
    };

    // Add users in Splitwise's flattened format
    expenseData.users.forEach((user, index) => {
      payload[`users__${index}__user_id`] = user.userId;
      payload[`users__${index}__paid_share`] = user.paidShare.toFixed(2);
      payload[`users__${index}__owed_share`] = user.owedShare.toFixed(2);
    });

    // Add category if provided
    if (expenseData.categoryId) {
      payload.category_id = expenseData.categoryId;
    }

    // Add details/notes if provided
    if (expenseData.details) {
      payload.details = expenseData.details;
    }
    
    // Note: "created_by" is automatically set to the user whose API key is being used
    // The authenticated user (API key owner) is the one who "added" this expense

    console.log('Creating Splitwise expense:', payload);

    const response = await fetch(`${SPLITWISE_API_BASE}/create_expense`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create expense: ${response.status} - ${errorData.errors?.join(', ') || errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    // Check for errors in response even if status is 200
    if (data.errors && data.errors.length > 0) {
      throw new Error(`Splitwise API errors: ${data.errors.join(', ')}`);
    }

    return data.expenses?.[0] || data.expense;
  } catch (error) {
    console.error('Error creating Splitwise expense:', error);
    throw error;
  }
};

/**
 * Create multiple expenses in Splitwise (one per item)
 * @param {Array} expenses - Array of expense data objects
 * @param {string} apiKey - Splitwise API key
 * @returns {Promise<Array>} Array of created expenses
 */
export const createMultipleExpenses = async (expenses, apiKey) => {
  const results = [];
  const errors = [];

  for (let i = 0; i < expenses.length; i++) {
    try {
      const result = await createExpense(expenses[i], apiKey);
      results.push({ success: true, expense: result, itemIndex: i });
    } catch (error) {
      errors.push({ success: false, error: error.message, itemIndex: i, itemName: expenses[i].description });
      console.error(`Failed to create expense for "${expenses[i].description}":`, error);
    }
  }

  return {
    results,
    errors,
    successCount: results.length,
    errorCount: errors.length,
    total: expenses.length
  };
};

