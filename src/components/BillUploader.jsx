import { useState, useEffect } from 'react';
import { initOpenAI } from '../config/openai';
import { processBillImage, fileToBase64 } from '../services/billProcessor';
import { getCurrentUser, createMultipleExpenses, getSplitwiseCredentials } from '../services/splitwiseService';
import BillSplitter from './BillSplitter';
import './BillUploader.css';

const BillUploader = ({ users }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [items, setItems] = useState([]);
  const [storeName, setStoreName] = useState('');
  const [error, setError] = useState(null);
  
  // Track splits for each item: { itemId: { userId: amount } }
  const [itemSplits, setItemSplits] = useState({});
  
  // Track quick split selections: { itemId: { userId: boolean } }
  const [quickSplitSelections, setQuickSplitSelections] = useState({});
  
  // Complex split popover state
  const [complexSplitItem, setComplexSplitItem] = useState(null);
  
  // Manual entry mode (skip image upload)
  const [manualMode, setManualMode] = useState(false);

  // Splitwise integration
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResults, setSubmitResults] = useState(null);
  const [payerId, setPayerId] = useState(null); // Who paid for the bill

  // Fetch current Splitwise user on mount
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { apiKey } = getSplitwiseCredentials();
        const user = await getCurrentUser(apiKey);
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to load current user:', err);
        // Continue without current user - will use first user in group as payer
      }
    };
    loadCurrentUser();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setItems([]);
      setItemSplits({});
      setQuickSplitSelections({});
    }
  };

  const handleProcessBill = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setItems([]);
    setProgress({ step: 0, message: 'Starting...' });

    try {
      // Initialize OpenAI with .env key
      initOpenAI();
      
      const base64Image = await fileToBase64(selectedFile);
      
      const processedData = await processBillImage(base64Image, (progressUpdate) => {
        setProgress(progressUpdate);
      });

      // Convert to editable items with unique IDs
      const editableItems = processedData.itemList.map((item, idx) => ({
        id: Date.now() + idx,
        itemName: item.itemName,
        qty: item.qty,
        price: item.price
      }));
      
      setItems(editableItems);
      setStoreName(processedData.store);
      
      // Initialize quick split selections (all users selected by default)
      const initialSelections = {};
      editableItems.forEach((item) => {
        initialSelections[item.id] = users.reduce((acc, user) => ({ ...acc, [user.id]: true }), {});
      });
      setQuickSplitSelections(initialSelections);
      
      setProgress(null);
    } catch (err) {
      setError('Error processing bill: ' + err.message);
      setProgress(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      itemName: '',
      qty: 1,
      price: 0
    };
    setItems([...items, newItem]);
    
    // Initialize selections for new item
    setQuickSplitSelections({
      ...quickSplitSelections,
      [newItem.id]: users.reduce((acc, user) => ({ ...acc, [user.id]: true }), {})
    });
  };

  const handleDeleteItem = (itemId) => {
    const newItems = items.filter((item) => item.id !== itemId);
    setItems(newItems);
    
    // Remove splits and selections for deleted item
    const newSplits = { ...itemSplits };
    delete newSplits[itemId];
    setItemSplits(newSplits);
    
    const newSelections = { ...quickSplitSelections };
    delete newSelections[itemId];
    setQuickSplitSelections(newSelections);
  };

  const handleQuickSplitToggle = (itemId, userId) => {
    setQuickSplitSelections({
      ...quickSplitSelections,
      [itemId]: {
        ...quickSplitSelections[itemId],
        [userId]: !quickSplitSelections[itemId][userId]
      }
    });
  };

  const handleQuickSplitConfirm = (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const selections = quickSplitSelections[itemId];
    const selectedUsers = users.filter(user => selections[user.id]);
    
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    // Split equally among selected users
    const amountPerUser = item.price / selectedUsers.length;
    
    // Apply normalization to ensure exact match
    const splits = selectedUsers.map(user => ({
      userId: user.id,
      name: user.name,
      amount: Math.round(amountPerUser * 100) / 100
    }));
    
    // Normalize
    const sum = splits.reduce((acc, s) => acc + s.amount, 0);
    const difference = Math.round((item.price - sum) * 100) / 100;
    if (Math.abs(difference) >= 0.01) {
      const randomIndex = Math.floor(Math.random() * splits.length);
      splits[randomIndex].amount = Math.round((splits[randomIndex].amount + difference) * 100) / 100;
    }
    
    // Store splits
    const splitMap = {};
    splits.forEach(split => {
      splitMap[split.userId] = split.amount;
    });
    
    setItemSplits({
      ...itemSplits,
      [itemId]: splitMap
    });
  };

  const handleComplexSplit = (itemId) => {
    setComplexSplitItem(itemId);
  };

  const handleComplexSplitClose = () => {
    setComplexSplitItem(null);
  };

  const handleComplexSplitConfirm = (splits) => {
    // splits is array of { userId, name, amount }
    const splitMap = {};
    splits.forEach(split => {
      splitMap[split.userId] = split.amount;
    });
    
    setItemSplits({
      ...itemSplits,
      [complexSplitItem]: splitMap
    });
    
    setComplexSplitItem(null);
  };

  const handleFinalSubmit = async () => {
    // Validate payer is selected
    if (!payerId && !currentUser?.id && !users[0]?.id) {
      alert('Please select who paid for this bill.');
      return;
    }

    // Validate all items have splits
    const unsplitItems = items.filter((item) => !itemSplits[item.id]);
    if (unsplitItems.length > 0) {
      alert(`Please split all items. ${unsplitItems.length} item(s) not split yet.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSubmitResults(null);

    try {
      const { apiKey, groupId } = getSplitwiseCredentials();
      
      // Get the payer - must be selected by user
      const selectedPayerId = payerId || currentUser?.id || users[0]?.id;
      if (!selectedPayerId) {
        throw new Error('No user found to set as payer');
      }

      // Format expenses for Splitwise API
      const expenses = items.map((item) => {
        const splits = itemSplits[item.id];
        
        // Create users array for this expense
        const expenseUsers = users.map(user => {
          const owedAmount = splits[user.id] || 0;
          return {
            userId: user.id,
            paidShare: user.id === selectedPayerId ? item.price : 0, // Payer paid the full amount
            owedShare: owedAmount // Each user owes their split amount
          };
        }).filter(u => u.owedShare > 0 || u.paidShare > 0); // Only include users involved

        return {
          cost: item.price,
          description: item.itemName,
          groupId: parseInt(groupId),
          currencyCode: 'USD',
          date: new Date().toISOString().split('T')[0],
          details: `Qty: ${item.qty} - Split via Agentic Expense Manager`,
          users: expenseUsers
        };
      });

      console.log('Submitting expenses to Splitwise:', expenses);

      // Create all expenses
      const results = await createMultipleExpenses(expenses, apiKey);
      
      setSubmitResults(results);
      
      if (results.errorCount === 0) {
        // All successful
        alert(`✅ Success! Created ${results.successCount} expense(s) in Splitwise.\n\nCheck your Splitwise app to see the expenses!`);
      } else if (results.successCount > 0) {
        // Partial success
        alert(`⚠️ Partial Success!\n\n✅ Created: ${results.successCount} expense(s)\n❌ Failed: ${results.errorCount} expense(s)\n\nErrors:\n${results.errors.map(e => `- ${e.itemName}: ${e.error}`).join('\n')}`);
      } else {
        // All failed
        throw new Error(`Failed to create expenses:\n${results.errors.map(e => `- ${e.itemName}: ${e.error}`).join('\n')}`);
      }

    } catch (err) {
      console.error('Error submitting to Splitwise:', err);
      setError('Failed to create expenses in Splitwise: ' + err.message);
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnterManual = () => {
    setManualMode(true);
    setStoreName('Manual Entry');
    setItems([]);
    setItemSplits({});
    setQuickSplitSelections({});
    setError(null);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setItems([]);
    setItemSplits({});
    setQuickSplitSelections({});
    setError(null);
    setProgress(null);
    setStoreName('');
    setManualMode(false);
    setSubmitResults(null);
    setPayerId(null);
  };

  return (
    <div className="bill-uploader-container">
      {!manualMode && items.length === 0 && (
        <>
          <h2>Upload Receipt</h2>

          <div className="upload-section">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              id="file-input"
              className="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              {selectedFile ? 'Change Image' : 'Select Image'}
            </label>

            {selectedFile && (
              <div className="file-info">
                <span>📄 {selectedFile.name}</span>
              </div>
            )}
          </div>

          <div className="manual-entry-divider">
            <span>or</span>
          </div>

          <div className="manual-entry-section">
            <button className="manual-entry-btn" onClick={handleEnterManual}>
              Enter Items Manually
            </button>
            <p className="manual-entry-hint">Skip the receipt scan and add items directly</p>
          </div>

          {previewUrl && (
            <div className="preview-section">
              <h3>Preview</h3>
              <img src={previewUrl} alt="Receipt preview" className="receipt-preview" />
            </div>
          )}

          {selectedFile && !isProcessing && (
            <button className="process-btn" onClick={handleProcessBill}>
              Process Bill
            </button>
          )}

          {isProcessing && progress && (
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(progress.step / 6) * 100}%` }}
                />
              </div>
              <p className="progress-message">{progress.message}</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}
        </>
      )}

      {(items.length > 0 || manualMode) && (
        <div className="items-editor">
          <div className="items-header">
            <h2>{manualMode && items.length === 0 ? 'Add Items Manually' : `Items from ${storeName}`}</h2>
            <div className="header-controls">
              <div className="payer-selector">
                <label htmlFor="payer-select">Who Paid?</label>
                <select 
                  id="payer-select"
                  value={payerId || ''} 
                  onChange={(e) => setPayerId(parseInt(e.target.value))}
                  className="payer-select"
                >
                  <option value="">Select who paid...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.id === currentUser?.id ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button className="reset-btn" onClick={handleReset}>
                {manualMode ? 'Back to Upload' : 'Upload New Receipt'}
              </button>
            </div>
          </div>

          <div className="items-table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Quick Split</th>
                  <th>Split Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                        className="item-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', parseFloat(e.target.value))}
                        className="item-input qty-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value))}
                        className="item-input price-input"
                      />
                    </td>
                    <td>
                      <div className="quick-split-cell">
                        {users.map(user => (
                          <label key={user.id} className="user-checkbox-label">
                            <input
                              type="checkbox"
                              checked={quickSplitSelections[item.id]?.[user.id] || false}
                              onChange={() => handleQuickSplitToggle(item.id, user.id)}
                            />
                            <span>{user.name}</span>
                          </label>
                        ))}
                        <button 
                          className="confirm-quick-split-btn"
                          onClick={() => handleQuickSplitConfirm(item.id)}
                        >
                          Confirm
                        </button>
                      </div>
                    </td>
                    <td>
                      {itemSplits[item.id] ? (
                        <div className="split-status">
                          <span className="split-done">✓ Split</span>
                          <div className="split-details">
                            {Object.entries(itemSplits[item.id]).map(([userId, amount]) => {
                              const user = users.find(u => u.id === parseInt(userId));
                              return (
                                <div key={userId} className="split-detail-item">
                                  {user?.name}: ${amount.toFixed(2)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="split-pending">Not split</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="complex-split-btn"
                          onClick={() => handleComplexSplit(item.id)}
                        >
                          Complex Split
                        </button>
                        <button
                          className="delete-item-btn"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="items-footer">
            <button className="add-item-btn" onClick={handleAddItem} disabled={isSubmitting}>
              + Add Item
            </button>
            <button 
              className="submit-btn" 
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? '⏳ Sending to Splitwise...' : '📤 Submit to Splitwise'}
            </button>
          </div>

          {submitResults && submitResults.successCount > 0 && (
            <div className="submit-success">
              <h3>✅ Expenses Created in Splitwise!</h3>
              <p>Successfully created {submitResults.successCount} expense(s) out of {submitResults.total}.</p>
              {submitResults.errorCount > 0 && (
                <div className="submit-errors">
                  <h4>Failed to create {submitResults.errorCount} expense(s):</h4>
                  <ul>
                    {submitResults.errors.map((err, idx) => (
                      <li key={idx}>{err.itemName}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button className="reset-btn" onClick={handleReset}>
                {manualMode ? 'Start Over' : 'Process Another Receipt'}
              </button>
            </div>
          )}
        </div>
      )}

      {complexSplitItem !== null && (
        <BillSplitter
          totalAmount={items.find(i => i.id === complexSplitItem)?.price || 0}
          users={users}
          onClose={handleComplexSplitClose}
          onSplit={handleComplexSplitConfirm}
        />
      )}
    </div>
  );
};

export default BillUploader;
