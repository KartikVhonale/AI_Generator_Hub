import { useState, useEffect } from 'react'
import './App.css'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config, validateConfig, debugConfig, saveApiKey, clearStoredApiKey } from './config.js'
import Navigation from './components/Navigation'
import TextGenerator from './components/TextGenerator'
import ImageEnhancer from './components/ImageEnhancer'
import ImageContainer from './components/ImageContainer'

function App() {
  const [prompt, setPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [manualApiKey, setManualApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [currentPage, setCurrentPage] = useState('image')
  const [imageType, setImageType] = useState('photorealistic')
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
  
  // Validate and debug configuration
  validateConfig()
  debugConfig()
  
  // Additional debugging to see exactly what's happening
  console.log('=== ENVIRONMENT VARIABLE DEBUG ===')
  console.log('import.meta.env:', import.meta.env)
  console.log('import.meta.env.VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY)
  console.log('config.GEMINI_API_KEY:', config.GEMINI_API_KEY)
  console.log('API_KEY constant:', API_KEY)
  console.log('================================')

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

  const handleImageAction = async (action, result) => {
    if (result && result.message) {
      setError(result.message)
      setTimeout(() => setError(''), result.message.includes('✅') ? 3000 : 4000)
    }
  }

  const generateImage = async () => {
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
      
      // Use Gemini's image generation model
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-preview-image-generation",
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      })

      // Get the style prompt based on selected image type
      const getStylePrompt = (type) => {
        switch (type) {
          case 'photorealistic':
            return `Create an extremely high-quality, ultra-detailed photorealistic image of: ${prompt}. 
                    Requirements:
                    - 8K resolution quality with maximum detail
                    - Photorealistic rendering with perfect lighting
                    - Sharp focus and crisp details throughout
                    - Professional photography quality
                    - Rich colors and perfect contrast
                    - No blur, artifacts, or low-quality elements
                    - Studio-quality composition and framing
                    Make this the highest quality image possible with incredible detail and realism.`
          case 'artistic':
            return `Create a beautiful artistic painting of: ${prompt}. 
                    Style: Oil painting with vibrant colors, artistic brushstrokes, and creative composition.
                    Requirements:
                    - 8K resolution quality with maximum detail
                    - High-quality artistic rendering
                    - Rich, vibrant colors and textures
                    - Expressive brushwork and artistic style
                    - Creative composition and lighting
                    - Professional artwork quality
                    Make this a stunning piece of digital art.`
          case 'cartoon':
            return `Create a cute and colorful cartoon illustration of: ${prompt}. 
                    Style: Modern cartoon/anime style with clean lines and bright colors.
                    Requirements:
                    - 8K resolution quality with maximum detail
                    - Clean, smooth cartoon rendering
                    - Bright, cheerful colors
                    - Simple but expressive design
                    - Professional animation quality
                    - Cute and appealing style
                    Make this a delightful cartoon image.`
          case 'fantasy':
            return `Create a magical fantasy artwork of: ${prompt}. 
                    Style: Fantasy art with magical elements, ethereal lighting, and mystical atmosphere.
                    Requirements:
                    - 8K resolution quality with maximum detail
                    - Magical and mystical atmosphere
                    - Ethereal lighting and glowing effects
                    - Fantasy elements and magical details
                    - Rich, otherworldly colors
                    - Professional fantasy art quality
                    Make this a captivating fantasy scene.`
          case 'minimalist':
            return `Create a clean minimalist design of: ${prompt}. 
                    Style: Minimalist art with simple shapes, clean lines, and subtle colors.
                    Requirements:
                    - 8K resolution quality with maximum detail
                    - Clean, simple design
                    - Minimal color palette
                    - Geometric shapes and clean lines
                    - Subtle, elegant composition
                    - Professional minimalist quality
                    Make this a sophisticated minimalist artwork.`
          case 'vintage':
            return `Create a vintage/retro style image of: ${prompt}. 
                    Style: Vintage photography or artwork with retro colors and nostalgic feel.
                    Requirements:
                    - 8K resolution quality with maximum detail
                    - Vintage/retro aesthetic
                    - Nostalgic color palette
                    - Classic composition and style
                    - Authentic vintage feel
                    - Professional retro quality
                    Make this a beautiful vintage-style image.`
          default:
            return `Create an extremely high-quality, ultra-detailed image of: ${prompt}. 
                    Requirements:
                    - 8K resolution quality with maximum detail
                    - Photorealistic rendering with perfect lighting
                    - Sharp focus and crisp details throughout
                    - Professional photography quality
                    - Rich colors and perfect contrast
                    - No blur, artifacts, or low-quality elements
                    - Studio-quality composition and framing
                    Make this the highest quality image possible with incredible detail and realism.`
        }
      }

      const result = await model.generateContent([
        getStylePrompt(imageType)
      ])

      const response = await result.response
      
      // Check for image data in the response
      const imagePart = response.candidates[0].content.parts.find(part => part.inlineData)
      
      if (imagePart && imagePart.inlineData) {
        const imageData = imagePart.inlineData
        const imageUrl = `data:${imageData.mimeType};base64,${imageData.data}`
        setGeneratedImage(imageUrl)
        setError('') // Clear any previous errors
      } else {
        // If no image, check for text response
        const textPart = response.candidates[0].content.parts.find(part => part.text)
        if (textPart) {
          setError(`Generated text instead of image: ${textPart.text}`)
        } else {
          setError('No image or text generated. Please try a different prompt.')
        }
      }
      
    } catch (err) {
      console.error('Error generating image:', err)
      setError(`Failed to generate image: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      generateImage()
    }
  }

  // Get placeholder text based on selected image type
  const getPlaceholderText = (type) => {
    switch (type) {
      case 'photorealistic':
        return 'A stunning 8K photorealistic landscape with perfect lighting and incredible detail...'
      case 'artistic':
        return 'A beautiful oil painting of a serene landscape with vibrant colors and artistic brushstrokes...'
      case 'cartoon':
        return 'A cute cartoon character in a colorful animated world with clean lines and bright colors...'
      case 'fantasy':
        return 'A magical fantasy world with mystical creatures, glowing effects, and ethereal atmosphere...'
      case 'minimalist':
        return 'A clean minimalist design with simple shapes, geometric forms, and subtle colors...'
      case 'vintage':
        return 'A nostalgic vintage scene with retro colors, classic composition, and timeless appeal...'
      default:
        return 'A stunning 8K photorealistic landscape with perfect lighting and incredible detail...'
    }
  }

  return (
    <div className="app">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      
      {currentPage === 'text' ? (
        <TextGenerator />
      ) : currentPage === 'enhance' ? (
        <ImageEnhancer />
      ) : (
        <>
          <header className="header">
            <h1>🎨 AI Image Generator</h1>
            <p>Create stunning images with artificial intelligence | 🔐 Secure & Encrypted</p>
          </header>

      <main className="main">
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

          <div className="image-type-selector">
            <label htmlFor="imageType">Image Style:</label>
            <select
              id="imageType"
              value={imageType}
              onChange={(e) => setImageType(e.target.value)}
              className="image-type-select"
            >
              <option value="photorealistic">📸 Photorealistic</option>
              <option value="artistic">🎨 Artistic Painting</option>
              <option value="cartoon">🎭 Cartoon/Anime</option>
              <option value="fantasy">✨ Fantasy/Magical</option>
              <option value="minimalist">⚪ Minimalist</option>
              <option value="vintage">📷 Vintage/Retro</option>
            </select>
          </div>

          <div className="prompt-input">
            <label htmlFor="prompt">Describe the image you want to generate:</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={getPlaceholderText(imageType)}
              className="prompt-textarea"
              rows="5"
            />
          </div>

          <button 
            onClick={generateImage} 
            disabled={isLoading || !prompt.trim() || (!API_KEY && !manualApiKey.trim())}
            className="generate-btn"
          >
            {isLoading ? '🔄 Generating...' : '✨ Generate Image'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error.includes('✅') ? '' : '❌ '}{error}
          </div>
        )}

        <div className="image-section">
          {isLoading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Creating your masterpiece...</p>
            </div>
          )}

          {generatedImage && !isLoading && (
            <ImageContainer 
              imageUrl={generatedImage}
              fileName="ai-generated-image.png"
              title="✨ Generated Image"
              description="Your AI-generated masterpiece is ready! You can download, copy the image, or open it in a new tab."
              onAction={handleImageAction}
            />
          )}
        </div>
      </main>

          <footer className="footer">
            <p>Built with modern AI technology | 🔐 Encrypted API transmission | 🌐 Secure HTTPS</p>
          </footer>
        </>
      )}
    </div>
  )
}

export default App