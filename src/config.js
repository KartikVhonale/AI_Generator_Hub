// Configuration file for environment variables
// This file can be imported to access environment variables

export const config = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
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
    GEMINI_API_KEY_PREFIX: config.GEMINI_API_KEY ? config.GEMINI_API_KEY.substring(0, 10) + '...' : 'Not found'
  })
} 