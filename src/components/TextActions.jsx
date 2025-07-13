import './TextActions.css'

function TextActions({ 
  text, 
  onCopy = null,
  onClear = null,
  showClear = true 
}) {
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      return {
        success: true,
        message: '✅ Text copied to clipboard!'
      }
    } catch (error) {
      // Fallback for older browsers or clipboard issues
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return {
          success: true,
          message: '✅ Text copied to clipboard!'
        }
      } catch (fallbackError) {
        return {
          success: false,
          message: '❌ Failed to copy text. Please try again.'
        }
      }
    }
  }

  const handleAction = async (action) => {
    let result = null
    
    switch (action) {
      case 'copy':
        result = await handleCopy()
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

    // Return the result for parent component to handle
    return result
  }

  return (
    <div className="text-actions">
      <button 
        onClick={() => handleAction('copy')}
        className="action-btn copy-btn"
        title="Copy Text"
        disabled={!text}
      >
        📋 Copy
      </button>
      
      {showClear && onClear && (
        <button 
          onClick={() => handleAction('clear')}
          className="action-btn clear-btn"
          title="Clear All"
        >
          🗑️ Clear
        </button>
      )}
    </div>
  )
}

export default TextActions 