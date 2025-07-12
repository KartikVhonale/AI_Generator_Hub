import { useState, useRef } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '../config.js'
import './ImageEnhancer.css'

function ImageEnhancer() {
  const [originalImage, setOriginalImage] = useState(null)
  const [enhancedImage, setEnhancedImage] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [manualApiKey, setManualApiKey] = useState('')
  const [imageName, setImageName] = useState('')
  const fileInputRef = useRef(null)

  // Access environment variables through config file
  const API_KEY = config.GEMINI_API_KEY

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size must be less than 10MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setOriginalImage(e.target.result)
        setImageName(file.name)
        setError('')
      }
      reader.readAsDataURL(file)
    }
  }

  const convertToBase64 = (dataUrl) => {
    // Remove the data URL prefix to get just the base64 data
    return dataUrl.split(',')[1]
  }

  const enhanceImage = async () => {
    if (!originalImage) {
      setError('Please upload an image first')
      return
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt for enhancement')
      return
    }

    const currentApiKey = API_KEY || manualApiKey.trim()
    
    if (!currentApiKey) {
      setError('API key not found. Please set it in the .env file or enter it manually.')
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

      // Convert image to base64
      const base64Image = convertToBase64(originalImage)

      // Prepare content with both text and image
      const result = await model.generateContent([
        {
          text: `Enhance this image with: ${prompt}. 
                 Requirements for the enhanced version:
                 - 8K resolution quality with maximum detail
                 - Photorealistic rendering with perfect lighting
                 - Sharp focus and crisp details throughout
                 - Professional photography quality
                 - Rich colors and perfect contrast
                 - No blur, artifacts, or low-quality elements
                 - Studio-quality composition and framing
                 - Maintain the original composition while improving quality
                 Make this the highest quality enhanced image possible with incredible detail and realism.`
        },
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image
          }
        }
      ])

      const response = await result.response
      
      // Check for image data in the response
      const imagePart = response.candidates[0].content.parts.find(part => part.inlineData)
      
      if (imagePart && imagePart.inlineData) {
        const imageData = imagePart.inlineData
        const imageUrl = `data:${imageData.mimeType};base64,${imageData.data}`
        setEnhancedImage(imageUrl)
        setError('') // Clear any previous errors
      } else {
        // If no image, check for text response
        const textPart = response.candidates[0].content.parts.find(part => part.text)
        if (textPart) {
          setError(`Generated text instead of image: ${textPart.text}`)
        } else {
          setError('No enhanced image generated. Please try a different prompt.')
        }
      }
      
    } catch (err) {
      console.error('Error enhancing image:', err)
      setError(`Failed to enhance image: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      enhanceImage()
    }
  }

  const clearAll = () => {
    setOriginalImage(null)
    setEnhancedImage(null)
    setPrompt('')
    setError('')
    setImageName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadEnhancedImage = () => {
    if (enhancedImage) {
      const link = document.createElement('a')
      link.href = enhancedImage
      link.download = `enhanced-${imageName || 'image.png'}`
      link.click()
    }
  }

  return (
    <div className="image-enhancer">
      <header className="image-enhancer-header">
        <h1>🔄 AI Image Enhancer</h1>
        <p>Powered by Google Gemini - Enhance images with text prompts</p>
      </header>

      <main className="image-enhancer-main">
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
                  placeholder="Enter your Gemini API key"
                  className="api-input"
                />
                <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  🔒 Your API key is stored locally and never sent to external servers
                </small>
              </div>
            </div>
          )}

          <div className="image-upload-section">
            <label htmlFor="imageUpload">Upload Image:</label>
            <div className="upload-area">
              <input
                ref={fileInputRef}
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
              <div className="upload-placeholder">
                {originalImage ? (
                  <div className="uploaded-image">
                    <img src={originalImage} alt="Original" />
                    <span className="image-name">{imageName}</span>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">📁</div>
                    <p>Click to upload or drag an image here</p>
                    <p className="upload-hint">Supports PNG, JPG, JPEG (max 10MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="prompt-input">
            <label htmlFor="prompt">Enhancement Prompt:</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enhance to 8K quality, add perfect lighting, improve colors and details..."
              className="prompt-textarea"
              rows="4"
            />
          </div>

          <button 
            onClick={enhanceImage} 
            disabled={isLoading || !prompt.trim() || !originalImage || (!API_KEY && !manualApiKey.trim())}
            className="enhance-btn"
          >
            {isLoading ? '🔄 Enhancing...' : '✨ Enhance Image'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        <div className="images-section">
          {isLoading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Enhancing your image...</p>
            </div>
          )}

          {(originalImage || enhancedImage) && !isLoading && (
            <div className="images-comparison">
              {originalImage && (
                <div className="image-card">
                  <h3>📸 Original Image</h3>
                  <div className="image-container">
                    <img src={originalImage} alt="Original" className="comparison-image" />
                  </div>
                </div>
              )}

              {enhancedImage && (
                <div className="image-card">
                  <h3>✨ Enhanced Image</h3>
                  <div className="image-container">
                    <img src={enhancedImage} alt="Enhanced" className="comparison-image" />
                  </div>
                  <div className="image-actions">
                    <button onClick={downloadEnhancedImage} className="action-btn download-btn">
                      💾 Download
                    </button>
                    <button onClick={clearAll} className="action-btn clear-btn">
                      🗑️ Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="image-enhancer-footer">
        <p>Built with Google Gemini AI</p>
      </footer>
    </div>
  )
}

export default ImageEnhancer 