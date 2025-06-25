/**
 * ChatInput Component
 * 
 * Provides the main input interface for users to type and send messages
 * in the chat system. Features auto-resizing textarea, keyboard shortcuts,
 * and adaptive styling for different themes.
 * 
 * Features:
 * - Auto-resizing textarea with min/max height constraints
 * - Enter key submission with Shift+Enter for new lines
 * - Disabled state during message processing
 * - Responsive design for mobile and desktop
 * - Dark/light theme support
 * 
 * @param {Object} props - Component props
 * @param {boolean} isDarkMode - Current theme mode
 * @param {string} inputMessage - Current message text
 * @param {boolean} isLoading - Loading state for send button
 * @param {Function} onInputChange - Message text change handler
 * @param {Function} onKeyPress - Keyboard event handler
 * @param {Function} onSendMessage - Message send handler
 */

import React from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ 
  isDarkMode,
  inputMessage,
  isLoading,
  onInputChange,
  onKeyPress,
  onSendMessage
}) => {
  // Auto-resize textarea function
  const handleTextareaChange = (e) => {
    onInputChange(e);
    
    // Auto-resize logic with consistent base height
    const textarea = e.target;
    textarea.style.height = '48px'; // Reset to consistent base
    const newHeight = Math.max(48, Math.min(textarea.scrollHeight, 150));
    textarea.style.height = newHeight + 'px';
  };

  return (
    <div className={`px-4 sm:px-6 py-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* ChatGPT-style floating input container */}
      <div className="max-w-4xl mx-auto">        <div className={`
          relative rounded-2xl border transition-all duration-200 floating-input
          ${isDarkMode 
            ? 'bg-gray-800 border-gray-600 shadow-lg' 
            : 'bg-white border-gray-300 shadow-lg hover:shadow-xl'          }
          ${inputMessage.trim() ? 'ring-2 ring-primary-500/20' : ''}
          focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-500        `}>          <div className="p-3 sm:p-4 flex items-start gap-3">
            {/* Auto-expanding textarea */}
            <div className="flex-1 relative" style={{ transform: 'translateY(3px)' }}>
              <textarea
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyPress={onKeyPress}
                placeholder="Message AI Planet..."
                rows={1}
                className={`
                  w-full resize-none border-0 bg-transparent outline-none
                  text-base placeholder-gray-500
                  ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}
                  scrollbar-hide scrollbar-hide-textarea                `}
                style={{ 
                  minHeight: '48px',
                  maxHeight: '150px',
                  height: '48px',
                  lineHeight: '24px',
                  padding: '8px 0'
                }}              />
            </div>
            
            {/* Send button - positioned to align with text center */}
            <div className="flex-shrink-0 flex items-center" style={{ minHeight: '48px' }}>
              <button
                onClick={onSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
                  ${!inputMessage.trim() || isLoading
                    ? isDarkMode 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-500 hover:bg-primary-600 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                  }
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                `}
                title={isLoading ? 'Processing...' : 'Send message (Enter)'}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Subtle bottom border/glow effect */}
          <div className={`
            absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 h-0.5 rounded-full transition-opacity duration-200
            ${inputMessage.trim() 
              ? 'bg-gradient-to-r from-primary-500/50 to-primary-600/50 opacity-100' 
              : 'opacity-0'
            }          `} />
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
