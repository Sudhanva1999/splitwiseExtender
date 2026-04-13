import { useState, useEffect } from 'react'
import BillUploader from './components/BillUploader'
import { fetchGroupUsers, getSplitwiseCredentials } from './services/splitwiseService'
import './App.css'

function App() {
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        setError(null);
        
        const { apiKey, groupId } = getSplitwiseCredentials();
        const splitwiseUsers = await fetchGroupUsers(groupId, apiKey);
        
        if (splitwiseUsers.length === 0) {
          throw new Error('No users found in the Splitwise group');
        }
        
        setUsers(splitwiseUsers);
      } catch (err) {
        console.error('Error loading Splitwise users:', err);
        setError(err.message);
        
        // Fallback to default users if Splitwise fails
        console.warn('Falling back to default users');
        setUsers([
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Charlie' },
          { id: 4, name: 'Diana' }
        ]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  if (isLoadingUsers) {
    return (
      <div className="app-container">
        <h1>Agentic Expense Manager</h1>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading Splitwise group members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1>Agentic Expense Manager</h1>
      {error && (
        <div className="warning-message">
          <strong>⚠️ Splitwise Warning:</strong> {error}
          <br />
          <small>Using fallback users. Check your .env file for correct VITE_SPLITWISE_API_KEY and VITE_SPLITWISE_GROUP_ID</small>
        </div>
      )}
      <div className="users-info">
        <span>Group Members: {users.map(u => u.name).join(', ')}</span>
      </div>
      <BillUploader users={users} />
    </div>
  )
}

export default App
