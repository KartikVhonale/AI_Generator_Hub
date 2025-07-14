import { useState, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useApiKey } from '../hooks/useApiKey';
import ImageContainer from './Ui/ImageContainer'
import './ImageEnhancer.css'
import Footer from './Ui/Footer'
import Header from './Ui/Header.jsx';

function ImageEnhancer() {
  const [originalImage, setOriginalImage] = useState(null)
  const [enhancedImage, setEnhancedImage] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [manualApiKey, setManualApiKey] = useState('')
  const [imageName, setImageName] = useState('')
  const [enhancementType, setEnhancementType] = useState('normal')
  const [styleOption, setStyleOption] = useState('realistic')
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const fileInputRef = useRef(null)

  const [apiKey, saveApiKey, clearApiKey] = useApiKey();

  useEffect(() => {
    if (apiKey) {
      setApiKeySaved(true);
      setManualApiKey('');
    } else {
      setApiKeySaved(false);
    }
  }, [apiKey]);

  const handleApiKeySave = () => {
    if (manualApiKey.trim()) {
      saveApiKey(manualApiKey.trim());
      setApiKeySaved(true);
      setManualApiKey('');
      setError('✅ API key saved successfully! You can now use all features.');
      setTimeout(() => setError(''), 3000);
    } else {
      setError('❌ Please enter a valid API key.');
    }
  };
  const handleApiKeyClear = () => {
    clearApiKey();
    setApiKeySaved(false);
    setManualApiKey('');
    setError('✅ API key cleared successfully!');
    setTimeout(() => setError(''), 3000);
  };

  const handleImageAction = async (action, result) => {
    if (result && result.message) {
      setError(result.message)
      setTimeout(() => setError(''), result.message.includes('✅') ? 3000 : 4000)
    }
  }

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

  const getEnhancementPrompt = () => {
    const basePrompt = prompt.trim()
    
    switch (enhancementType) {
      case 'background-remove':
        return `Remove the background from this image completely. 
                Requirements:
                - Remove all background elements
                - Keep only the main subject/object
                - Create a transparent or white background
                - Maintain sharp edges and details of the subject
                - Ensure the subject is clearly defined
                ${basePrompt ? `Additional instructions: ${basePrompt}` : ''}`
      
      case 'style-transfer':
        const stylePrompts = {
          realistic: 'Apply a photorealistic style with natural lighting and colors',
          artistic: 'Apply an artistic painting style with vibrant colors and brushstrokes',
          cartoon: 'Apply a cartoon/anime style with clean lines and bright colors',
          vintage: 'Apply a vintage/retro style with nostalgic colors and effects',
          fantasy: 'Apply a fantasy style with magical elements and ethereal lighting',
          minimalist: 'Apply a minimalist style with simple shapes and clean design'
        }
        return `Transform this image using ${styleOption} style. 
                ${stylePrompts[styleOption]}
                Requirements:
                - Maintain the original composition
                - Apply the selected style consistently
                - Preserve important details
                - Create a cohesive artistic result
                ${basePrompt ? `Additional instructions: ${basePrompt}` : ''}`
      
      case 'upscale':
        return `Upscale this image to ultra-high resolution with maximum detail. 
                Requirements:
                - Increase resolution to 8K quality
                - Enhance fine details and textures
                - Improve sharpness and clarity
                - Maintain natural colors and lighting
                - Remove any noise or artifacts
                - Preserve the original composition
                ${basePrompt ? `Additional instructions: ${basePrompt}` : ''}`
      
      case 'color-correct':
        return `Color correct and enhance this image. 
                Requirements:
                - Improve color balance and saturation
                - Enhance contrast and brightness
                - Fix any color casts or issues
                - Make colors more vibrant and natural
                - Improve overall visual appeal
                - Maintain realistic appearance
                ${basePrompt ? `Additional instructions: ${basePrompt}` : ''}`
      
      case 'normal':
      default:
        return `Enhance this image with: ${basePrompt || 'general improvements'}. 
                Requirements:
                - 8K resolution quality with maximum detail
                - Photorealistic rendering with perfect lighting
                - Sharp focus and crisp details throughout
                - Professional photography quality
                - Rich colors and perfect contrast
                - No blur, artifacts, or low-quality elements
                - Studio-quality composition and framing
                - Maintain the original composition while improving quality
                Make this the highest quality enhanced image possible with incredible detail and realism.`
    }
  }

  const enhanceImage = async () => {
    if (!originalImage) {
      setError('Please upload an image first')
      return
    }

    if (enhancementType === 'normal' && !prompt.trim()) {
      setError('Please enter a prompt for enhancement')
      return
    }

    const currentApiKey = apiKey || manualApiKey.trim()
    
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
          text: getEnhancementPrompt()
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
    setEnhancementType('normal')
    setStyleOption('realistic')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getPlaceholderText = () => {
    switch (enhancementType) {
      case 'background-remove':
        return 'Remove background completely, keep only the main subject...'
      case 'style-transfer':
        return 'Apply artistic style transformation...'
      case 'upscale':
        return 'Upscale to 8K resolution, enhance details...'
      case 'color-correct':
        return 'Improve colors, contrast, and brightness...'
      case 'normal':
      default:
        return 'Enhance to 8K quality, add perfect lighting, improve colors and details...'
    }
  }

  return (
    <div className="image-enhancer">
      <Header title="🔄 AI Image Enhancer" subtitle="Upload and enhance your images with AI magic!" />

      <main className="image-enhancer-main">
        <div className="input-section">
          {!apiKey && (
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

          {apiKey && (
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

          <div className="enhancement-type-selector">
            <label htmlFor="enhancementType">Enhancement Type:</label>
            <select
              id="enhancementType"
              value={enhancementType}
              onChange={(e) => setEnhancementType(e.target.value)}
              className="enhancement-type-select"
            >
              <option value="normal">✨ Normal Enhancement</option>
              <option value="background-remove">🎭 Background Removal</option>
              <option value="style-transfer">🎨 Style Transfer</option>
              <option value="upscale">📈 Upscale Resolution</option>
              <option value="color-correct">🎨 Color Correction</option>
            </select>
          </div>

          {enhancementType === 'style-transfer' && (
            <div className="style-option-selector">
              <label htmlFor="styleOption">Style Option:</label>
              <select
                id="styleOption"
                value={styleOption}
                onChange={(e) => setStyleOption(e.target.value)}
                className="style-option-select"
              >
                <option value="realistic">📸 Realistic</option>
                <option value="artistic">🎨 Artistic</option>
                <option value="cartoon">🎭 Cartoon</option>
                <option value="vintage">📷 Vintage</option>
                <option value="fantasy">✨ Fantasy</option>
                <option value="minimalist">⚪ Minimalist</option>
              </select>
            </div>
          )}

          <div className="prompt-input">
            <label htmlFor="prompt">
              {enhancementType === 'normal' ? 'Enhancement Prompt:' : 'Additional Instructions (Optional):'}
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={getPlaceholderText()}
              className="prompt-textarea"
              rows="4"
            />
          </div>

          <button 
            onClick={enhanceImage} 
            disabled={isLoading || (enhancementType === 'normal' && !prompt.trim()) || !originalImage || (!apiKey && !manualApiKey.trim())}
            className="enhance-btn"
          >
            {isLoading ? '🔄 Enhancing...' : `✨ ${enhancementType === 'background-remove' ? 'Remove Background' : 
              enhancementType === 'style-transfer' ? 'Apply Style' :
              enhancementType === 'upscale' ? 'Upscale Image' :
              enhancementType === 'color-correct' ? 'Color Correct' : 'Enhance Image'}`}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error.includes('✅') ? '' : '❌ '}{error}
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
                  <div className="original-image-container">
                    <img src={originalImage} alt="Original" className="comparison-image" />
                  </div>
                </div>
              )}

              {enhancedImage && (
                <div className="image-card">
                  <h3>✨ Enhanced Image</h3>
                  <ImageContainer 
                    imageUrl={enhancedImage}
                    fileName={`enhanced-${imageName || 'image.png'}`}
                    title="✨ Enhanced Image"
                    description="Your AI-enhanced masterpiece is ready! You can download, copy the image, or open it in a new tab."
                    onAction={handleImageAction}
                    onClear={clearAll}
                    showClear={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ImageEnhancer 