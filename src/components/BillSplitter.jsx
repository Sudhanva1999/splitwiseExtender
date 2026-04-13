import { useState } from 'react';
import './BillSplitter.css';

const BillSplitter = ({ totalAmount, users, onClose, onSplit }) => {
  const [splitMode, setSplitMode] = useState('equal'); // 'equal', 'percentage', 'shares', 'amount'
  const [userValues, setUserValues] = useState(
    users.reduce((acc, user) => ({ ...acc, [user.id]: 0 }), {})
  );
  const [selectedUsers, setSelectedUsers] = useState(
    users.reduce((acc, user) => ({ ...acc, [user.id]: true }), {})
  );

  // Normalization function to ensure splits add up to exact total (rounded to 2 decimals)
  const normalizeSplits = (splits) => {
    // Round each amount to 2 decimal places
    const roundedSplits = splits.map(split => ({
      ...split,
      amount: Math.round(split.amount * 100) / 100
    }));

    // Calculate sum of rounded amounts
    const sum = roundedSplits.reduce((acc, split) => acc + split.amount, 0);
    
    // Calculate the difference (round to 2 decimals to avoid floating point errors)
    const difference = Math.round((totalAmount - sum) * 100) / 100;

    if (Math.abs(difference) >= 0.01) {
      // Pick a random user to adjust
      const randomIndex = Math.floor(Math.random() * roundedSplits.length);
      
      // Adjust the amount by the difference
      roundedSplits[randomIndex].amount = Math.round((roundedSplits[randomIndex].amount + difference) * 100) / 100;
    }

    return roundedSplits;
  };

  const calculateSplit = () => {
    // Get only selected users
    const activeUsers = users.filter(user => selectedUsers[user.id]);
    
    if (activeUsers.length === 0) {
      alert('Please select at least one user to split the bill');
      return;
    }

    let splits = [];

    switch (splitMode) {
      case 'equal':
        const equalAmount = totalAmount / activeUsers.length;
        splits = activeUsers.map(user => ({
          userId: user.id,
          name: user.name,
          amount: equalAmount
        }));
        break;

      case 'percentage':
        // Only consider selected users for percentage calculation
        const selectedPercentages = activeUsers.reduce((sum, user) => 
          sum + (parseFloat(userValues[user.id]) || 0), 0);
        if (Math.abs(selectedPercentages - 100) > 0.01) {
          alert(`Percentages for selected users must add up to 100%. Current: ${selectedPercentages.toFixed(2)}%`);
          return;
        }
        splits = activeUsers.map(user => ({
          userId: user.id,
          name: user.name,
          amount: (totalAmount * (parseFloat(userValues[user.id]) || 0)) / 100
        }));
        break;

      case 'shares':
        // Only consider selected users for shares calculation
        const selectedShares = activeUsers.reduce((sum, user) => 
          sum + (parseFloat(userValues[user.id]) || 0), 0);
        if (selectedShares === 0) {
          alert('Total shares for selected users must be greater than 0');
          return;
        }
        splits = activeUsers.map(user => ({
          userId: user.id,
          name: user.name,
          amount: (totalAmount * (parseFloat(userValues[user.id]) || 0)) / selectedShares
        }));
        break;

      case 'amount':
        // Only consider selected users for amount calculation
        const selectedTotal = activeUsers.reduce((sum, user) => 
          sum + (parseFloat(userValues[user.id]) || 0), 0);
        if (Math.abs(selectedTotal - totalAmount) > 0.01) {
          alert(`Amounts for selected users must add up to ${totalAmount.toFixed(2)}. Current total: ${selectedTotal.toFixed(2)}`);
          return;
        }
        splits = activeUsers.map(user => ({
          userId: user.id,
          name: user.name,
          amount: parseFloat(userValues[user.id]) || 0
        }));
        break;

      default:
        break;
    }

    // Normalize the splits to ensure they add up exactly
    const normalizedSplits = normalizeSplits(splits);
    
    onSplit(normalizedSplits);
  };

  const handleValueChange = (userId, value) => {
    setUserValues(prev => ({
      ...prev,
      [userId]: value
    }));
  };

  const handleModeChange = (mode) => {
    setSplitMode(mode);
    // Reset values when mode changes based on selected users
    const activeUsers = users.filter(user => selectedUsers[user.id]);
    const activeCount = activeUsers.length > 0 ? activeUsers.length : users.length;
    
    if (mode === 'equal') {
      setUserValues(users.reduce((acc, user) => ({ ...acc, [user.id]: 0 }), {}));
    } else if (mode === 'percentage') {
      const percentPerUser = (100 / activeCount).toFixed(2);
      setUserValues(users.reduce((acc, user) => ({ 
        ...acc, 
        [user.id]: selectedUsers[user.id] ? percentPerUser : 0 
      }), {}));
    } else if (mode === 'shares') {
      setUserValues(users.reduce((acc, user) => ({ 
        ...acc, 
        [user.id]: selectedUsers[user.id] ? 1 : 0 
      }), {}));
    } else if (mode === 'amount') {
      const equalAmount = (totalAmount / activeCount).toFixed(2);
      setUserValues(users.reduce((acc, user) => ({ 
        ...acc, 
        [user.id]: selectedUsers[user.id] ? equalAmount : 0 
      }), {}));
    }
  };

  const handleUserSelection = (userId) => {
    const newSelectedUsers = {
      ...selectedUsers,
      [userId]: !selectedUsers[userId]
    };
    setSelectedUsers(newSelectedUsers);
    
    // Recalculate default values based on new selection
    const activeUsers = users.filter(user => newSelectedUsers[user.id]);
    const activeCount = activeUsers.length;
    
    if (activeCount === 0) return;
    
    if (splitMode === 'percentage') {
      const percentPerUser = (100 / activeCount).toFixed(2);
      setUserValues(users.reduce((acc, user) => ({ 
        ...acc, 
        [user.id]: newSelectedUsers[user.id] ? percentPerUser : 0 
      }), {}));
    } else if (splitMode === 'shares') {
      setUserValues(users.reduce((acc, user) => ({ 
        ...acc, 
        [user.id]: newSelectedUsers[user.id] ? 1 : 0 
      }), {}));
    } else if (splitMode === 'amount') {
      const equalAmount = (totalAmount / activeCount).toFixed(2);
      setUserValues(users.reduce((acc, user) => ({ 
        ...acc, 
        [user.id]: newSelectedUsers[user.id] ? equalAmount : 0 
      }), {}));
    }
  };

  return (
    <div className="popover-overlay" onClick={onClose}>
      <div className="popover-content" onClick={(e) => e.stopPropagation()}>
        <div className="popover-header">
          <h2>Split Bill</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="popover-body">
          <div className="total-amount">
            <strong>Total Amount: ${totalAmount.toFixed(2)}</strong>
          </div>

          <div className="split-mode-selector">
            <label>Split by:</label>
            <div className="mode-buttons">
              <button
                className={splitMode === 'equal' ? 'active' : ''}
                onClick={() => handleModeChange('equal')}
              >
                Equal
              </button>
              <button
                className={splitMode === 'percentage' ? 'active' : ''}
                onClick={() => handleModeChange('percentage')}
              >
                Percentage
              </button>
              <button
                className={splitMode === 'shares' ? 'active' : ''}
                onClick={() => handleModeChange('shares')}
              >
                Shares
              </button>
              <button
                className={splitMode === 'amount' ? 'active' : ''}
                onClick={() => handleModeChange('amount')}
              >
                Amount
              </button>
            </div>
          </div>

          <div className="users-list">
            {users.map(user => {
              const activeCount = users.filter(u => selectedUsers[u.id]).length;
              const displayAmount = activeCount > 0 ? (totalAmount / activeCount) : 0;
              
              return (
                <div key={user.id} className={`user-row ${!selectedUsers[user.id] ? 'disabled' : ''}`}>
                  <div className="user-checkbox">
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      checked={selectedUsers[user.id]}
                      onChange={() => handleUserSelection(user.id)}
                    />
                    <label htmlFor={`user-${user.id}`} className="user-name">
                      {user.name}
                    </label>
                  </div>
                  
                  {splitMode !== 'equal' && selectedUsers[user.id] && (
                    <div className="user-input">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={userValues[user.id]}
                      onChange={(e) => handleValueChange(user.id, e.target.value)}
                    />
                      <span className="input-suffix">
                        {splitMode === 'percentage' ? '%' : 
                         splitMode === 'shares' ? 'shares' : 
                         '$'}
                      </span>
                    </div>
                  )}
                  {splitMode === 'equal' && selectedUsers[user.id] && (
                    <span className="user-amount">
                      ${displayAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="popover-footer">
            <button className="cancel-btn" onClick={onClose}>Cancel</button>
            <button className="split-btn" onClick={calculateSplit}>Split Bill</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillSplitter;

