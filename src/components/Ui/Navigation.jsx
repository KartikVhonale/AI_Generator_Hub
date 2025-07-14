import { useState, useEffect } from 'react'
import './Navigation.css'

function Navigation({ currentPage, onPageChange }) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const isMobile = window.innerWidth <= 768
      
      if (isMobile) {
        // Mobile behavior: only show navbar when at the top
        if (currentScrollY <= 100) {
          setIsVisible(true)
        } else if (currentScrollY > lastScrollY) {
          // Scrolling down - hide navbar
          setIsVisible(false)
        }
        // Don't show navbar when scrolling up on mobile (unless at top)
      } else {
        // Desktop behavior: show navbar when scrolling up
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down and past 100px - hide navbar
          setIsVisible(false)
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show navbar
          setIsVisible(true)
        }
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  return (
    <nav className={`navigation ${!isVisible ? 'nav-hidden' : ''}`}>
      <div className="nav-container">
        <div className="nav-brand">
          <h2>🤖 AI Generator Hub</h2>
        </div>
        
        <div className="nav-tabs">
          <button
            className={`nav-tab ${currentPage === 'image' ? 'active' : ''}`}
            onClick={() => onPageChange('image')}
          >
            🎨 Image Generator
          </button>
          <button
            className={`nav-tab ${currentPage === 'enhance' ? 'active' : ''}`}
            onClick={() => onPageChange('enhance')}
          >
            🔄 AI Image Tools
          </button>
          <button
            className={`nav-tab ${currentPage === 'text' ? 'active' : ''}`}
            onClick={() => onPageChange('text')}
          >
            ✍️ Text Generator
          </button>
        </div>
        
        <div className="nav-actions">
          <button
            className="api-key-btn"
            onClick={() => window.open('https://makersuite.google.com/app/apikey', '_blank')}
            title="Get your API key from AI Studio"
          >
            🔑 Get API Key
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navigation 