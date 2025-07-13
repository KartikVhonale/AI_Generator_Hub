import { useState, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config, saveApiKey, clearStoredApiKey } from '../config.js'
import TextActions from './TextActions'
import './TextGenerator.css'
import Footer from './Ui/Footer'

function TextGenerator() {
  const [prompt, setPrompt] = useState('')
  const [generatedText, setGeneratedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [manualApiKey, setManualApiKey] = useState('')
  const [textType, setTextType] = useState('story')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)

  // Access environment variables through config file
  const API_KEY = config.GEMINI_API_KEY

  // Check if API key is already saved on component mount
  useEffect(() => {
    if (API_KEY) {
      setApiKeySaved(true)
      setManualApiKey('') // Clear manual input if API key is available
    }
  }, [API_KEY])

  const handleApiKeySave = () => {
    if (manualApiKey.trim()) {
      const success = saveApiKey(manualApiKey.trim())
      if (success) {
        setApiKeySaved(true)
        setManualApiKey('')
        setShowApiKeyInput(false)
        setError('✅ API key saved successfully! You can now use all features.')
        setTimeout(() => setError(''), 3000)
        // Reload the page to update the config
        window.location.reload()
      } else {
        setError('❌ Failed to save API key. Please try again.')
      }
    } else {
      setError('❌ Please enter a valid API key.')
    }
  }

  const handleApiKeyClear = () => {
    const success = clearStoredApiKey()
    if (success) {
      setApiKeySaved(false)
      setManualApiKey('')
      setError('✅ API key cleared successfully!')
      setTimeout(() => setError(''), 3000)
      // Reload the page to update the config
      window.location.reload()
    } else {
      setError('❌ Failed to clear API key. Please try again.')
    }
  }

  const handleTextAction = async (action, result) => {
    if (result && result.message) {
      setError(result.message)
      setTimeout(() => setError(''), result.message.includes('✅') ? 3000 : 4000)
    }
  }

  const generateText = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    const currentApiKey = API_KEY || manualApiKey.trim()
    
    if (!currentApiKey) {
      setError('API key not found. Please set it in the .env file or enter it manually.')
      setShowApiKeyInput(true)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const genAI = new GoogleGenerativeAI(currentApiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

      let systemPrompt = ''
      switch (textType) {
        case 'story':
          systemPrompt = `Write a creative and engaging story based on this prompt: "${prompt}". 
                         Make it vivid, descriptive, and captivating. Include dialogue, emotions, and rich details. 
                         Keep it between 300-500 words.`
          break
        case 'poem':
          systemPrompt = `Create a beautiful poem inspired by this prompt: "${prompt}". 
                         Use vivid imagery, metaphors, and emotional depth. 
                         Make it rhythmic and memorable.`
          break
        case 'article':
          systemPrompt = `Write an informative article about: "${prompt}". 
                         Include facts, examples, and engaging content. 
                         Make it educational and well-structured. Keep it between 400-600 words.`
          break
        case 'essay':
          systemPrompt = `Write a thoughtful essay on: "${prompt}". 
                         Include introduction, body paragraphs with supporting points, and conclusion. 
                         Make it analytical and well-argued. Keep it between 500-800 words.`
          break
        case 'creative':
          systemPrompt = `Create something creative and imaginative based on: "${prompt}". 
                         This could be a script, dialogue, description, or any creative writing. 
                         Make it unique and engaging.`
          break
        default:
          systemPrompt = `Generate creative content based on: "${prompt}". 
                         Make it engaging and well-written.`
      }

      const result = await model.generateContent([systemPrompt])
      const response = await result.response
      const generatedContent = response.text()
      
      setGeneratedText(generatedContent)
      setError('')
      
    } catch (err) {
      console.error('Error generating text:', err)
      setError(`Failed to generate text: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      generateText()
    }
  }

  const clearText = () => {
    setGeneratedText('')
    setPrompt('')
    setError('')
  }

  return (
    <div className="text-generator">
      <header className="text-generator-header">
        <h1>✍️ AI Text Generator</h1>
        <p>Create amazing content with artificial intelligence | 🔐 Secure & Encrypted</p>
      </header>

      <main className="text-generator-main">
        <div className="input-section">
          {!API_KEY && (
            <div className="api-key-section">
              <div className="api-key-input">
                <label htmlFor="manualApiKey">Gemini API Key:</label>
                <input
                  id="manualApiKey"
                  type="password"
                  value={manualApiKey}
                  onChange={(e) => setManualApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="api-input"
                />
                <div className="api-key-actions">
                  <button 
                    onClick={handleApiKeySave}
                    className="save-api-btn"
                    disabled={!manualApiKey.trim()}
                  >
                    💾 Save API Key
                  </button>
                  {apiKeySaved && (
                    <button 
                      onClick={handleApiKeyClear}
                      className="clear-api-btn"
                    >
                      🗑️ Clear Saved Key
                    </button>
                  )}
                </div>
                <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  💾 Your API key is stored locally and never sent to external servers
                  <br />
                  🔐 Advanced encryption protects your key during transmission and storage 
                  <br />
                  💡 Bring your own API key from AI Studio for full functionality
                  {apiKeySaved && (
                    <>
                      <br />
                      ✅ API key is saved and will be remembered across all pages
                    </>
                  )}
                </small>
              </div>
            </div>
          )}

          {API_KEY && (
            <div className="api-key-status">
              <div className="status-indicator">
                <span className="status-icon">✅</span>
                <span className="status-text">API Key Available</span>
                <button 
                  onClick={handleApiKeyClear}
                  className="clear-api-btn-small"
                  title="Clear saved API key"
                >
                  🗑️
                </button>
              </div>
              <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                Your API key is saved and available for all features. You can clear it anytime.
              </small>
            </div>
          )}

          <div className="text-type-selector">
            <label htmlFor="textType">Type of Content:</label>
            <select
              id="textType"
              value={textType}
              onChange={(e) => setTextType(e.target.value)}
              className="text-type-select"
            >
              <option value="story">📖 Story</option>
              <option value="poem">📝 Poem</option>
              <option value="article">📰 Article</option>
              <option value="essay">📚 Essay</option>
              <option value="creative">🎨 Creative Writing</option>
            </select>
          </div>

          <div className="prompt-input">
            <label htmlFor="prompt">Describe what you want to generate:</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="A magical forest where time stands still..."
              className="prompt-textarea"
              rows="4"
            />
          </div>

          <button 
            onClick={generateText} 
            disabled={isLoading || !prompt.trim() || (!API_KEY && !manualApiKey.trim())}
            className="generate-btn"
          >
            {isLoading ? '🔄 Generating...' : '✨ Generate Text'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error.includes('✅') ? '' : '❌ '}{error}
          </div>
        )}

        <div className="text-section">
          {isLoading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Creating your masterpiece...</p>
            </div>
          )}

          {generatedText && !isLoading && (
            <div className="text-viewer">
              <div className="text-viewer-header">
                <h3>✨ Generated {textType.charAt(0).toUpperCase() + textType.slice(1)}</h3>
              </div>
              
              <div className="text-container">
                <div className="generated-text">
                  {generatedText.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
              
              <TextActions 
                text={generatedText}
                onAction={handleTextAction}
                onClear={clearText}
                showClear={true}
              />
              
              <div className="text-footer">
                <p className="text-description">
                  Your AI-generated {textType} is ready! You can copy it to your clipboard or clear to start over.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer/>
    </div>
  )
}

export default TextGenerator 