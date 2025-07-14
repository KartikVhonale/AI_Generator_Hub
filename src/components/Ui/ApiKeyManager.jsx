import React, { useState, useEffect } from 'react';
import { useApiKey } from '../../hooks/useApiKey';
import "../App.css"

const ApiKeyManager = ({ onStatusChange }) => {
  const [apiKey, saveApiKey, clearApiKey] = useApiKey();
  const [manualApiKey, setManualApiKey] = useState('');
  const [error, setError] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(!!apiKey);

  useEffect(() => {
    setApiKeySaved(!!apiKey);
    setManualApiKey('');
    if (onStatusChange) onStatusChange(!!apiKey);
  }, [apiKey, onStatusChange]);

  const handleSave = () => {
    if (manualApiKey.trim()) {
      saveApiKey(manualApiKey.trim());
      setError('✅ API key saved successfully!');
      setTimeout(() => setError(''), 3000);
    } else {
      setError('❌ Please enter a valid API key.');
    }
  };

  const handleClear = () => {
    clearApiKey();
    setError('✅ API key cleared successfully!');
    setTimeout(() => setError(''), 3000);
  };

  return (
    <div className="api-key-manager">
      {!apiKey && (
        <div className="api-key-section">
          <label htmlFor="manualApiKey">Gemini API Key:</label>
          <input
            id="manualApiKey"
            type="password"
            value={manualApiKey}
            onChange={e => setManualApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="api-input"
          />
          <div className="api-key-actions">
            <button onClick={handleSave} className="save-api-btn" disabled={!manualApiKey.trim()}>
              💾 Save API Key
            </button>
          </div>
          <small>
            💾 Your API key is stored locally and never sent to external servers.
            <br />
            🔐 Advanced encryption protects your key during transmission and storage.
            <br />
            💡 Bring your own API key from AI Studio for full functionality.
          </small>
        </div>
      )}
      {apiKey && (
        <div className="api-key-status">
          <span className="status-icon">✅</span>
          <span className="status-text">API Key Available</span>
          <button onClick={handleClear} className="clear-api-btn-small" title="Clear saved API key">
            🗑️
          </button>
          <small>
            Your API key is saved and available for all features. You can clear it anytime.
          </small>
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ApiKeyManager; 