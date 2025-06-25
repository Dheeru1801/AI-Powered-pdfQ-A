import React from 'react';
import { Send } from 'lucide-react';

const WelcomeScreen = ({ 
  isDarkMode,
  inputMessage,
  isLoading,
  onInputChange,
  onKeyPress,
  onSendMessage
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-4 sm:px-6 py-8">
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-4xl">        <div className="text-center max-w-2xl w-full" style={{ transform: 'translateY(6px)' }}>
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-2xl">ai</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Hey, Ready to dive in?
          </h1>
          <p className={`mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Our own Large Language Model (LLM) is a type of AI that can learn from data. 
            We have trained it on 7 billion parameters which makes it better than other LLMs. 
            Upload a file and Get started!
          </p>
        </div>
        
        {/* Center Input */}
        <div className="w-full max-w-2xl px-2 sm:px-0 mt-8">        <div className="flex items-end space-x-3 sm:space-x-4">
          <div className="flex-1" style={{ transform: 'translateY(4px)' }}>
            <textarea
              value={inputMessage}
              onChange={onInputChange}
              onKeyPress={onKeyPress}
              placeholder="Send a message..."
              rows={1}
              className={`w-full px-3 sm:px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm sm:text-base transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              style={{ minHeight: '56px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={onSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`bg-primary-500 hover:bg-primary-600 text-white rounded-lg p-3 sm:p-4 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              !inputMessage.trim() || isLoading
                ? 'opacity-50 cursor-not-allowed'
                : ''            }`}
          >
            <Send className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
