import { useState } from 'react'
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
  }
  
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
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
            </head>
            <body>
              <div class="image-container">
                <div class="title">${title}</div>
                <img src="${imageUrl}" alt="${title}" />
                <button class="download-btn" onclick="downloadImage()">💾 Download Image</button>
              </div>
              <script>
                function downloadImage() {
                  const link = document.createElement('a');
                  link.href = '${imageUrl}';
                  link.download = '${fileName}';
                  link.click();
                }
              </script>
            </body>
          </html>
        `)
        newWindow.document.close()
        newWindow.focus()
        return {
          success: true,
          message: '✅ Image opened in new tab!'
        }
      } else {
        return {
          success: false,
          message: 'Popup blocked! Please allow popups for this site.'
        }
      }
    } catch (error) {
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
    <div className={`image-container-wrapper ${className}`}>
      <div className="image-viewer">
        <div className="image-viewer-header">
          <h3>{title}</h3>
        </div>
        
        <div className="image-display-container">
          <img 
            src={imageUrl} 
            alt={title} 
            className={`displayed-image ${isZoomed ? 'zoomed' : ''}`}
            style={{ 
              transform: `scale(${zoomLevel})`,
              cursor: isZoomed ? 'grab' : 'default'
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