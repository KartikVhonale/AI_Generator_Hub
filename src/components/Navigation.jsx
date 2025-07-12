import './Navigation.css'

function Navigation({ currentPage, onPageChange }) {
  return (
    <nav className="navigation">
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
            🔄 Image Enhancer
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