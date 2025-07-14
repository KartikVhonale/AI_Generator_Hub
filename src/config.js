// Configuration file for environment variables
// This file can be imported to access environment variables

// Local storage keys
const STORAGE_KEYS = {
  API_KEY: 'ai_hub_gemini_api_key'
}

// Helper function to get API key from localStorage
const getStoredApiKey = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || null
  } catch (error) {
    console.warn('Failed to access localStorage:', error)
    return null
  }
}

// Helper function to save API key to localStorage
export const saveApiKey = (apiKey) => {
  try {
    if (apiKey && apiKey.trim()) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey.trim())
      return true
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY)
      return true
    }
  } catch (error) {
    console.warn('Failed to save API key to localStorage:', error)
    return false
  }
}

// Helper function to clear stored API key
export const clearStoredApiKey = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.API_KEY)
    return true
  } catch (error) {
    console.warn('Failed to clear API key from localStorage:', error)
    return false
  }
}

export const config = {
  GEMINI_API_KEY: getStoredApiKey() || import.meta.env.VITE_GEMINI_API_KEY,
  // Add other environment variables here as needed
  // EXAMPLE_API_URL: import.meta.env.VITE_API_URL,
}

// Helper function to check if all required environment variables are set
export const validateConfig = () => {
  const requiredVars = ['GEMINI_API_KEY']
  const missing = requiredVars.filter(varName => !config[varName])
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing)
    return false
  }
  
  return true
}

// Debug function to log environment variables (without exposing sensitive data)
export const debugConfig = () => {
  console.log('Environment Configuration:', {
    GEMINI_API_KEY_EXISTS: !!config.GEMINI_API_KEY,
    GEMINI_API_KEY_LENGTH: config.GEMINI_API_KEY ? config.GEMINI_API_KEY.length : 0,
    GEMINI_API_KEY_PREFIX: config.GEMINI_API_KEY ? config.GEMINI_API_KEY.substring(0, 10) + '...' : 'Not found',
    STORED_API_KEY_EXISTS: !!getStoredApiKey(),
    ENV_API_KEY_EXISTS: !!import.meta.env.VITE_GEMINI_API_KEY
  })
} 