import { useState, useRef, useEffect } from 'react'
import './ImageContainer.css'

function ImageContainer({ 
  imageUrl, 
  fileName = 'ai-generated-image.png', 
  title = 'AI Generated Image',
  description = 'Your AI-generated masterpiece is ready! You can download, copy the image, or open it in a new tab.',
  onClear = null,
  showClear = false,
  showInfo = true,
  className = '',
  onAction = null
}) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef(null)
  const containerRef = useRef(null)
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3))
    setIsZoomed(true)
  }
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
    setIsZoomed(prev => prev - 0.25 > 0.5)
  }
  
  const handleResetZoom = () => {
    setZoomLevel(1)
    setIsZoomed(false)
    setPosition({ x: 0, y: 0 })
  }

  // Touch zoom and pan functionality
  useEffect(() => {
    const image = imageRef.current
    const container = containerRef.current
    
    if (!image || !container) return

    let initialDistance = 0
    let initialZoom = 1
    let initialPosition = { x: 0, y: 0 }

    const getDistance = (touches) => {
      if (touches.length < 2) return 0
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const getCenter = (touches) => {
      if (touches.length < 2) return { x: 0, y: 0 }
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
      }
    }

    const handleTouchStart = (e) => {
      e.preventDefault()
      
      if (e.touches.length === 2) {
        // Pinch to zoom
        initialDistance = getDistance(e.touches)
        initialZoom = zoomLevel
        initialPosition = { ...position }
      } else if (e.touches.length === 1 && isZoomed) {
        // Single touch drag when zoomed
        setIsDragging(true)
        setDragStart({
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y
        })
      }
    }

    const handleTouchMove = (e) => {
      e.preventDefault()
      
      if (e.touches.length === 2) {
        // Handle pinch zoom
        const currentDistance = getDistance(e.touches)
        if (initialDistance > 0) {
          const scale = currentDistance / initialDistance
          const newZoom = Math.max(0.5, Math.min(3, initialZoom * scale))
          setZoomLevel(newZoom)
          setIsZoomed(newZoom > 1)
        }
      } else if (e.touches.length === 1 && isDragging && isZoomed) {
        // Handle single touch drag
        const newX = e.touches[0].clientX - dragStart.x
        const newY = e.touches[0].clientY - dragStart.y
        
        // Calculate bounds to prevent dragging too far
        const maxX = (zoomLevel - 1) * image.offsetWidth / 2
        const maxY = (zoomLevel - 1) * image.offsetHeight / 2
        
        setPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY))
        })
      }
    }

    const handleTouchEnd = (e) => {
      setIsDragging(false)
      if (e.touches.length === 0) {
        initialDistance = 0
      }
    }

    // Add event listeners
    image.addEventListener('touchstart', handleTouchStart, { passive: false })
    image.addEventListener('touchmove', handleTouchMove, { passive: false })
    image.addEventListener('touchend', handleTouchEnd, { passive: false })

    // Cleanup
    return () => {
      image.removeEventListener('touchstart', handleTouchStart)
      image.removeEventListener('touchmove', handleTouchMove)
      image.removeEventListener('touchend', handleTouchEnd)
    }
  }, [zoomLevel, isZoomed, position, isDragging, dragStart])
  
  const handleCopyImage = async () => {
    try {
      // Create a canvas to convert the image to blob
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.crossOrigin = 'anonymous'
      
      img.onload = async () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        try {
          // Convert canvas to blob
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
          
          // Create clipboard item
          const clipboardItem = new ClipboardItem({
            'image/png': blob
          })
          
          // Copy to clipboard
          await navigator.clipboard.write([clipboardItem])
          
          return {
            success: true,
            message: '✅ Image copied to clipboard!'
          }
        } catch (error) {
          console.error('Error copying image:', error)
          return {
            success: false,
            message: '❌ Failed to copy image. Please try downloading instead.'
          }
        }
      }
      
      img.onerror = () => {
        return {
          success: false,
          message: '❌ Failed to load image for copying. Please try downloading instead.'
        }
      }
      
      img.src = imageUrl
      
    } catch (error) {
      console.error('Error copying image:', error)
      return {
        success: false,
        message: '❌ Failed to copy image. Please try downloading instead.'
      }
    }
  }

  const handleOpenInNewTab = () => {
    try {
      // Store image data in localStorage to avoid URL length issues
      const imageData = {
        url: imageUrl,
        title: title,
        fileName: fileName,
        timestamp: Date.now()
      }
      
      // Store in localStorage with a unique key
      const storageKey = `image_${Date.now()}`
      localStorage.setItem(storageKey, JSON.stringify(imageData))
      
      // Get the current base URL
      const baseUrl = window.location.origin
      
      // Try to open the new tab with the OpenInNewTab component
      const newWindow = window.open(`${baseUrl}/open-in-new-tab?key=${storageKey}`, '_blank')
      
      if (newWindow) {
        newWindow.focus()
        return {
          success: true,
          message: '✅ Image opened in new tab!'
        }
      } else {
        // Fallback: Try opening with a simple HTML page
        const fallbackWindow = window.open('', '_blank')
        if (fallbackWindow) {
          fallbackWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${title}</title>
                <style>
                  body { 
                    margin: 0; 
                    padding: 20px; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: Arial, sans-serif;
                    color: white;
                    text-align: center;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .container { 
                    max-width: 800px; 
                    width: 100%;
                    background: rgba(255,255,255,0.1);
                    padding: 30px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.2);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                  }
                  h1 {
                    margin: 0 0 20px 0;
                    font-size: 2rem;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
                  }
                  img { 
                    max-width: 100%; 
                    height: auto; 
                    border-radius: 15px;
                    box-shadow: 0 15px 40px rgba(0,0,0,0.4);
                    margin: 20px 0;
                  }
                  .button-group {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-top: 25px;
                  }
                  .download-btn {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
                  }
                  .download-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
                  }
                  .close-btn {
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 15px 30px;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                  }
                  .close-btn:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                  }
                  .info {
                    margin: 20px 0;
                    padding: 15px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                    font-size: 14px;
                    opacity: 0.9;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>${title}</h1>
                  <div class="info">
                    AI Generated Masterpiece • Ultra HD 8K Quality
                  </div>
                  <img src="${imageUrl}" alt="${title}" />
                  <div class="button-group">
                    <button class="download-btn" onclick="downloadImage()">💾 Download Image</button>
                    <button class="close-btn" onclick="window.close()">✕ Close Tab</button>
                  </div>
                </div>
                <script>
                  function downloadImage() {
                    try {
                      const link = document.createElement('a');
                      link.href = '${imageUrl}';
                      link.download = '${fileName}';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (error) {
                      alert('Download failed. Please right-click the image and select "Save image as..."');
                    }
                  }
                </script>
              </body>
            </html>
          `)
          fallbackWindow.document.close()
          fallbackWindow.focus()
          return {
            success: true,
            message: '✅ Image opened in new tab! (Fallback mode)'
          }
        } else {
          return {
            success: false,
            message: 'Popup blocked! Please allow popups for this site.'
          }
        }
      }
    } catch (error) {
      console.error('Error opening in new tab:', error)
      return {
        success: false,
        message: 'Failed to open image in new tab. Please try downloading instead.'
      }
    }
  }

  const handleDownload = () => {
    try {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = fileName
      link.click()
      return {
        success: true,
        message: '✅ Image download started!'
      }
    } catch (error) {
      return {
        success: false,
        message: '❌ Failed to download image. Please try again.'
      }
    }
  }

  const handleImageAction = async (action) => {
    let result = null
    
    switch (action) {
      case 'copy':
        result = await handleCopyImage()
        break
      case 'open':
        result = handleOpenInNewTab()
        break
      case 'download':
        result = handleDownload()
        break
      case 'clear':
        if (onClear) {
          onClear()
          result = {
            success: true,
            message: '✅ All content cleared!'
          }
        }
        break
      default:
        result = {
          success: false,
          message: '❌ Unknown action.'
        }
    }

    // Handle the result
    if (onAction) {
      onAction(action, result)
    } else if (result && result.message) {
      // Default behavior if no callback provided
      console.log(result.message)
    }
  }

  return (
    <div className={`image-container-wrapper ${className}`} ref={containerRef}>
      <div className="image-viewer">
        <div className="image-viewer-header">
          <h3>{title}</h3>
        </div>
        
        <div className="image-display-container">
          <img 
            ref={imageRef}
            src={imageUrl} 
            alt={title} 
            className={`displayed-image ${isZoomed ? 'zoomed' : ''} ${isDragging ? 'dragging' : ''}`}
            style={{ 
              transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
              cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'default',
              touchAction: 'none'
            }}
            onLoad={() => console.log('Image loaded successfully')}
            onError={() => console.error('Failed to load image')}
          />
          
          {/* Zoom Controls positioned on the image (desktop/tablet) */}
          <div className="zoom-controls-overlay">
            <button 
              onClick={handleZoomOut}
              className="zoom-btn zoom-out-btn"
              title="Zoom Out"
              disabled={zoomLevel <= 0.5}
            >
              🔍−
            </button>
            
            <button 
              onClick={handleResetZoom}
              className="zoom-btn zoom-reset-btn"
              title="Reset Zoom"
              disabled={!isZoomed}
            >
              🔍
            </button>
            
            <button 
              onClick={handleZoomIn}
              className="zoom-btn zoom-in-btn"
              title="Zoom In"
              disabled={zoomLevel >= 3}
            >
              🔍+
            </button>
          </div>
          
          {showInfo && (
            <div className="image-overlay">
              <div className="image-info">
                <span className="image-size">Generated with AI</span>
                <span className="image-type">Ultra HD 8K Quality</span>
                {isZoomed && (
                  <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="image-actions">
          <button 
            onClick={() => handleImageAction('download')}
            className="action-btn download-btn"
            title="Download Image"
          >
            💾 Download
          </button>
          
          <button 
            onClick={() => handleImageAction('copy')}
            className="action-btn copy-btn"
            title="Copy Image"
          >
            📋 Copy Image
          </button>
          
          <button 
            onClick={() => handleImageAction('open')}
            className="action-btn open-btn"
            title="Open in New Tab"
          >
            🔗 Open
          </button>
          
          {showClear && onClear && (
            <button 
              onClick={() => handleImageAction('clear')}
              className="action-btn clear-btn"
              title="Clear All"
            >
              🗑️ Clear All
            </button>
          )}
        </div>
        
        <div className="image-footer">
          <p className="image-description">
            {description}
          </p>
        </div>
      </div>
      
      {/* Zoom Controls outside container (mobile) */}
      <div className="zoom-controls-mobile">
        <button 
          onClick={handleZoomOut}
          className="zoom-btn zoom-out-btn"
          title="Zoom Out"
          disabled={zoomLevel <= 0.5}
        >
          🔍−
        </button>
        
        <button 
          onClick={handleResetZoom}
          className="zoom-btn zoom-reset-btn"
          title="Reset Zoom"
          disabled={!isZoomed}
        >
          🔍
        </button>
        
        <button 
          onClick={handleZoomIn}
          className="zoom-btn zoom-in-btn"
          title="Zoom In"
          disabled={zoomLevel >= 3}
        >
          🔍+
        </button>
      </div>
    </div>
  )
}

export default ImageContainer 