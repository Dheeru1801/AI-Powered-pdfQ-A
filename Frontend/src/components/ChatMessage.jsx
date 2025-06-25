import React from 'react';
import FileSelector from './FileSelector';
import { useTypewriter } from '../hooks/useTypewriter';

const ChatMessage = ({ 
  message, 
  isDarkMode,
  searchTerm,
  isSearching,
  backendError,
  onFileSearch,
  onFileSelect,
  onClearSearch,
  onScrollToBottom
}) => {
  // Only animate the newest AI message
  const shouldAnimate = message.type === 'ai' && message.isNewestMessage === true;
  // Use typewriter effect
  const { displayedText, isTyping } = useTypewriter(
    message.content,
    shouldAnimate,
    20 // Speed: 20ms per character
  );
  
  // Show animated text for newest AI message, normal text for others
  const textToShow = shouldAnimate ? displayedText : message.content;
  
  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className="flex items-start space-x-2 sm:space-x-3 max-w-full sm:max-w-4xl w-full">
        {message.type !== 'user' && (
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs sm:text-sm font-bold">ai</span>
          </div>
        )}
          <div
          className={`break-words ${
            message.type === 'user'
              ? isDarkMode
                ? 'bg-blue-600 text-white rounded-2xl px-4 sm:px-4 py-3 sm:py-3 max-w-xs sm:max-w-md ml-auto'
                : 'bg-blue-100 text-gray-900 rounded-2xl px-4 sm:px-4 py-3 sm:py-3 max-w-xs sm:max-w-md ml-auto'
              : message.type === 'system'
              ? isDarkMode
                ? 'bg-yellow-900 text-yellow-100 rounded-2xl px-4 sm:px-4 py-3 sm:py-3 max-w-sm sm:max-w-lg border border-yellow-700'
                : 'bg-yellow-50 text-yellow-800 rounded-2xl px-4 sm:px-4 py-3 sm:py-3 max-w-sm sm:max-w-lg border border-yellow-200'
              : isDarkMode
              ? 'bg-gray-800 text-gray-100 rounded-2xl px-4 sm:px-4 py-3 sm:py-3 max-w-full sm:max-w-3xl shadow-sm border border-gray-700'
              : 'bg-white text-gray-900 rounded-2xl px-4 sm:px-4 py-3 sm:py-3 max-w-full sm:max-w-3xl shadow-sm border border-gray-200'
          }`}        >          <div className="text-base sm:text-sm leading-relaxed whitespace-pre-line">
            {textToShow}
            {isTyping && (
              <span className="inline-block w-2 h-5 bg-primary-500 ml-1 animate-pulse"></span>
            )}
          </div>
          {message.showFileSelector && message.availableFiles && (
            <FileSelector
              searchTerm={searchTerm}
              availableFiles={message.availableFiles}
              totalFiles={message.totalFiles}
              isSearching={isSearching}
              backendError={backendError}
              isDarkMode={isDarkMode}
              onSearchChange={onFileSearch}
              onFileSelect={onFileSelect}
              onClearSearch={onClearSearch}
            />
          )}
        </div>
        
        {message.type === 'user' && (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-medium">U</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
