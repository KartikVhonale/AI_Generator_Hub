import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ai_hub_gemini_api_key';

export function useApiKey() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '');

  useEffect(() => {
    // Listen for changes from other tabs/windows
    const handler = () => setApiKey(localStorage.getItem(STORAGE_KEY) || '');
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const saveApiKey = (key) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
  };

  const clearApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey('');
  };

  return [apiKey, saveApiKey, clearApiKey];
} 