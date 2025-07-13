import { useState, useEffect, useRef, useCallback } from 'react'
import './OpenInNewTab.css'

function OpenInNewTab() {
  const [imageUrl, setImageUrl] = useState('')
  const [imageTitle, setImageTitle] = useState('AI Generated Image')
  const [fileName, setFileName] = useState('ai-generated-image.png')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState('')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [baseContainerSize, setBaseContainerSize] = useState({ width: 0, height: 0 })
  const [dragVelocity, setDragVelocity] = useState({ x: 0, y: 0 })
  const [lastDragPosition, setLastDragPosition] = useState({ x: 0, y: 0 })
  const [dragStartTime, setDragStartTime] = useState(0)
  const imageRef = useRef(null)
  const containerRef = useRef(null)
  const dragRef = useRef({ isDragging: false, startPos: { x: 0, y: 0 }, lastPos: { x: 0, y: 0 } })
  const animationFrameRef = useRef(null)

  useEffect(() => {
    // Get image data from localStorage using the key from URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const storageKey = urlParams.get('key')
    
    if (storageKey) {
      try {
        const storedData = localStorage.getItem(storageKey)
        if (storedData) {
          const imageData = JSON.parse(storedData)
          setImageUrl(imageData.url)
          setImageTitle(imageData.title || 'AI Generated Image')
          setFileName(imageData.fileName || 'ai-generated-image.png')
          
          // Clean up the localStorage after retrieving the data
          localStorage.removeItem(storageKey)
        } else {
          console.error('No image data found in localStorage')
        }
      } catch (error) {
        console.error('Error reading image data from localStorage:', error)
      }
    } else {
      console.error('No storage key provided in URL parameters')
    }
  }, [])

  // Handle window resize to recalculate container size
  useEffect(() => {
    const handleResize = () => {
      if (imageDimensions.width > 0 && imageDimensions.height > 0) {
        const baseSize = calculateBaseContainerSize(imageDimensions.width, imageDimensions.height)
        setBaseContainerSize(baseSize)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [imageDimensions])

  const handleDownload = () => {
    try {
      setDownloadStatus('downloading')
      
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = fileName
      link.click()
      
      setDownloadStatus('success')
      setTimeout(() => setDownloadStatus(''), 3000)
    } catch (error) {
      setDownloadStatus('error')
      setTimeout(() => setDownloadStatus(''), 3000)
    }
  }

  const calculateBaseContainerSize = (imgWidth, imgHeight) => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Responsive available space calculation
    let availableWidth, availableHeight
    
    if (viewportWidth <= 480) {
      // Mobile phones
      availableWidth = viewportWidth * 0.9
      availableHeight = viewportHeight * 0.5
    } else if (viewportWidth <= 768) {
      // Tablets
      availableWidth = viewportWidth * 0.85
      availableHeight = viewportHeight * 0.55
    } else if (viewportWidth <= 1024) {
      // Small laptops
      availableWidth = viewportWidth * 0.8
      availableHeight = viewportHeight * 0.6
    } else {
      // Desktop
      availableWidth = viewportWidth * 0.8
      availableHeight = viewportHeight * 0.6
    }
    
    // Calculate aspect ratios
    const imageAspectRatio = imgWidth / imgHeight
    const availableAspectRatio = availableWidth / availableHeight
    
    let containerWidth, containerHeight
    
    if (imageAspectRatio > availableAspectRatio) {
      // Image is wider - constrain by width
      containerWidth = Math.min(imgWidth, availableWidth)
      containerHeight = containerWidth / imageAspectRatio
    } else {
      // Image is taller - constrain by height
      containerHeight = Math.min(imgHeight, availableHeight)
      containerWidth = containerHeight * imageAspectRatio
    }
    
    // Responsive minimum size
    let minSize
    if (viewportWidth <= 480) {
      minSize = 200
    } else if (viewportWidth <= 768) {
      minSize = 250
    } else {
      minSize = 300
    }
    
    // Ensure minimum size while maintaining aspect ratio
    if (containerWidth < minSize || containerHeight < minSize) {
      if (imageAspectRatio > 1) {
        containerWidth = minSize
        containerHeight = minSize / imageAspectRatio
      } else {
        containerHeight = minSize
        containerWidth = minSize * imageAspectRatio
      }
    }
    
    // Ensure the container doesn't exceed viewport bounds
    const maxWidth = viewportWidth * 0.95
    const maxHeight = viewportHeight * 0.8
    
    if (containerWidth > maxWidth) {
      containerWidth = maxWidth
      containerHeight = maxWidth / imageAspectRatio
    }
    
    if (containerHeight > maxHeight) {
      containerHeight = maxHeight
      containerWidth = maxHeight * imageAspectRatio
    }
    
    return { width: containerWidth, height: containerHeight }
  }

  const getDynamicContainerSize = () => {
    if (baseContainerSize.width === 0 || baseContainerSize.height === 0) {
      return { width: 'auto', height: 'auto' }
    }
    
    // Calculate the scaled size needed to accommodate the zoomed image
    const scaledWidth = baseContainerSize.width * zoomLevel
    const scaledHeight = baseContainerSize.height * zoomLevel
    
    // Responsive padding based on screen size
    let padding
    const viewportWidth = window.innerWidth
    
    if (viewportWidth <= 480) {
      padding = 20 // Smaller padding for mobile
    } else if (viewportWidth <= 768) {
      padding = 30 // Medium padding for tablets
    } else {
      padding = 50 // Larger padding for desktop
    }
    
    const finalWidth = scaledWidth + (padding * 2)
    const finalHeight = scaledHeight + (padding * 2)
    
    return {
      width: `${finalWidth}px`,
      height: `${finalHeight}px`
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
    // Get image dimensions after it loads
    if (imageRef.current) {
      const img = imageRef.current
      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight
      }
      setImageDimensions(dimensions)
      
      // Calculate base container size
      const baseSize = calculateBaseContainerSize(dimensions.width, dimensions.height)
      setBaseContainerSize(baseSize)
    }
  }

  const handleImageError = () => {
    setImageLoaded(false)
  }

  // Zoom control functions
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

  // Calculate drag boundaries based on zoom level and container size
  const getDragBoundaries = useCallback(() => {
    if (!imageRef.current || baseContainerSize.width === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }

    const scaledWidth = baseContainerSize.width * zoomLevel
    const scaledHeight = baseContainerSize.height * zoomLevel
    
    // Calculate how much the image extends beyond the container
    const overflowX = Math.max(0, scaledWidth - baseContainerSize.width)
    const overflowY = Math.max(0, scaledHeight - baseContainerSize.height)
    
    // Set boundaries to prevent dragging too far
    const minX = -overflowX / 2
    const maxX = overflowX / 2
    const minY = -overflowY / 2
    const maxY = overflowY / 2
    
    return { minX, maxX, minY, maxY }
  }, [zoomLevel, baseContainerSize])

  // Apply momentum to drag with improved performance
  const applyMomentum = useCallback((velocity, currentPosition) => {
    const friction = 0.92
    const minVelocity = 0.5
    
    if (Math.abs(velocity.x) < minVelocity && Math.abs(velocity.y) < minVelocity) {
      return
    }
    
    const newPosition = {
      x: currentPosition.x + velocity.x,
      y: currentPosition.y + velocity.y
    }
    
    // Apply boundaries
    const boundaries = getDragBoundaries()
    newPosition.x = Math.max(boundaries.minX, Math.min(boundaries.maxX, newPosition.x))
    newPosition.y = Math.max(boundaries.minY, Math.min(boundaries.maxY, newPosition.y))
    
    // Update velocity with friction
    const newVelocity = {
      x: velocity.x * friction,
      y: velocity.y * friction
    }
    
    setDragVelocity(newVelocity)
    setPosition(newPosition)
    
    // Continue momentum if velocity is still significant
    if (Math.abs(newVelocity.x) > minVelocity || Math.abs(newVelocity.y) > minVelocity) {
      animationFrameRef.current = requestAnimationFrame(() => applyMomentum(newVelocity, newPosition))
    }
  }, [getDragBoundaries])

  // Optimized mouse drag handlers
  const handleMouseDown = useCallback((e) => {
    if (isZoomed && e.button === 0) { // Left mouse button only
      e.preventDefault()
      e.stopPropagation()
      
      dragRef.current.isDragging = true
      dragRef.current.startPos = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      }
      dragRef.current.lastPos = { x: e.clientX, y: e.clientY }
      
      setIsDragging(true)
      setDragStartTime(Date.now())
      
      // Remove transition during drag for smooth movement
      if (imageRef.current) {
        imageRef.current.style.transition = 'none'
        imageRef.current.style.cursor = 'grabbing'
      }
    }
  }, [isZoomed, position])

  const handleMouseMove = useCallback((e) => {
    if (dragRef.current.isDragging && isZoomed) {
      e.preventDefault()
      e.stopPropagation()
      
      const currentTime = Date.now()
      const deltaTime = currentTime - dragStartTime
      
      const newX = e.clientX - dragRef.current.startPos.x
      const newY = e.clientY - dragRef.current.startPos.y
      
      // Calculate velocity for momentum (improved calculation)
      const deltaX = e.clientX - dragRef.current.lastPos.x
      const deltaY = e.clientY - dragRef.current.lastPos.y
      const velocity = {
        x: deltaTime > 0 ? (deltaX / deltaTime) * 16.67 : 0, // 60fps timing
        y: deltaTime > 0 ? (deltaY / deltaTime) * 16.67 : 0
      }
      
      setDragVelocity(velocity)
      dragRef.current.lastPos = { x: e.clientX, y: e.clientY }
      
      // Apply boundaries
      const boundaries = getDragBoundaries()
      const boundedX = Math.max(boundaries.minX, Math.min(boundaries.maxX, newX))
      const boundedY = Math.max(boundaries.minY, Math.min(boundaries.maxY, newY))
      
      setPosition({ x: boundedX, y: boundedY })
    }
  }, [isZoomed, dragStartTime, getDragBoundaries])

  const handleMouseUp = useCallback((e) => {
    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false
      setIsDragging(false)
      
      // Restore transition after drag
      if (imageRef.current) {
        imageRef.current.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        imageRef.current.style.cursor = isZoomed ? 'grab' : 'default'
      }
      
      // Apply momentum if velocity is significant
      if (Math.abs(dragVelocity.x) > 1 || Math.abs(dragVelocity.y) > 1) {
        applyMomentum(dragVelocity, position)
      }
    }
  }, [dragVelocity, position, isZoomed, applyMomentum])

  const handleMouseLeave = useCallback((e) => {
    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false
      setIsDragging(false)
      
      // Restore transition after drag
      if (imageRef.current) {
        imageRef.current.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        imageRef.current.style.cursor = isZoomed ? 'grab' : 'default'
      }
      
      // Apply momentum if velocity is significant
      if (Math.abs(dragVelocity.x) > 1 || Math.abs(dragVelocity.y) > 1) {
        applyMomentum(dragVelocity, position)
      }
    }
  }, [dragVelocity, position, isZoomed, applyMomentum])

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

    // Touch handlers
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
        setDragStartTime(Date.now())
        setLastDragPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY })
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
        const currentTime = Date.now()
        const deltaTime = currentTime - dragStartTime
        
        const newX = e.touches[0].clientX - dragStart.x
        const newY = e.touches[0].clientY - dragStart.y
        
        // Calculate velocity for momentum
        const deltaX = e.touches[0].clientX - lastDragPosition.x
        const deltaY = e.touches[0].clientY - lastDragPosition.y
        const velocity = {
          x: deltaTime > 0 ? deltaX / deltaTime * 16 : 0,
          y: deltaTime > 0 ? deltaY / deltaTime * 16 : 0
        }
        
        setDragVelocity(velocity)
        setLastDragPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY })
        
        // Apply boundaries
        const boundaries = getDragBoundaries()
        const boundedX = Math.max(boundaries.minX, Math.min(boundaries.maxX, newX))
        const boundedY = Math.max(boundaries.minY, Math.min(boundaries.maxY, newY))
        
        setPosition({ x: boundedX, y: boundedY })
      }
    }

    const handleTouchEnd = (e) => {
      setIsDragging(false)
      if (e.touches.length === 0) {
        initialDistance = 0
        
        // Apply momentum if velocity is significant
        if (Math.abs(dragVelocity.x) > 0.5 || Math.abs(dragVelocity.y) > 0.5) {
          applyMomentum(dragVelocity, position)
        }
      }
    }

    // Add mouse event listeners with passive: false for better performance
    image.addEventListener('mousedown', handleMouseDown, { passive: false })
    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp, { passive: false })
    image.addEventListener('mouseleave', handleMouseLeave, { passive: false })

    // Add touch event listeners
    image.addEventListener('touchstart', handleTouchStart, { passive: false })
    image.addEventListener('touchmove', handleTouchMove, { passive: false })
    image.addEventListener('touchend', handleTouchEnd, { passive: false })

    // Cleanup
    return () => {
      image.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      image.removeEventListener('mouseleave', handleMouseLeave)
      image.removeEventListener('touchstart', handleTouchStart)
      image.removeEventListener('touchmove', handleTouchMove)
      image.removeEventListener('touchend', handleTouchEnd)
      
      // Cancel any pending animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [zoomLevel, isZoomed, position, isDragging, dragStart, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, getDragBoundaries, applyMomentum])

  if (!imageUrl) {
    return (
      <div className="open-tab-container">
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <h2>No Image Found</h2>
          <p>The image URL is missing or invalid.</p>
          <button onClick={() => window.close()} className="close-btn">
            Close Tab
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="open-tab-container" ref={containerRef}>
      <div className="open-tab-header">
        <div className="header-content">
          <h1 className="page-title">{imageTitle}</h1>
          <p className="page-subtitle">AI Generated Masterpiece</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleDownload}
            className={`download-button ${downloadStatus}`}
            disabled={downloadStatus === 'downloading'}
          >
            {downloadStatus === 'downloading' && '⏳'}
            {downloadStatus === 'success' && '✅'}
            {downloadStatus === 'error' && '❌'}
            {!downloadStatus && '💾'}
            {downloadStatus === 'downloading' ? ' Downloading...' : ' Download'}
          </button>
          <button onClick={() => window.close()} className="close-button">
            ✕ Close
          </button>
        </div>
      </div>

      <div className="image-container">
        <div 
          className="image-wrapper"
          style={{
            ...getDynamicContainerSize(),
            minWidth: '300px',
            minHeight: '200px',
            transition: 'width 0.3s ease, height 0.3s ease'
          }}
        >
          {!imageLoaded && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Loading image...</p>
            </div>
          )}
          <img
            ref={imageRef}
            src={imageUrl}
            alt={imageTitle}
            className={`main-image ${imageLoaded ? 'loaded' : ''} ${isZoomed ? 'zoomed' : ''} ${isDragging ? 'dragging' : ''}`}
            style={{ 
              transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
              cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'default',
              touchAction: 'none',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              maxWidth: 'none',
              maxHeight: 'none'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Zoom Controls */}
          <div className="zoom-controls">
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
          
          {/* Zoom Level Display */}
          {isZoomed && (
            <div className="zoom-level-display">
              {Math.round(zoomLevel * 100)}%
            </div>
          )}
        </div>
      </div>

      <div className="image-info-panel">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">File Name</span>
            <span className="info-value">{fileName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Quality</span>
            <span className="info-value">Ultra HD 8K</span>
          </div>
          <div className="info-item">
            <span className="info-label">Generated</span>
            <span className="info-value">With AI</span>
          </div>
          <div className="info-item">
            <span className="info-label">Format</span>
            <span className="info-value">PNG</span>
          </div>
        </div>
      </div>

      <div className="footer">
        <p className="footer-text">
          Generated with advanced AI technology • High-quality image ready for download
        </p>
      </div>
    </div>
  )
}

export default OpenInNewTab 