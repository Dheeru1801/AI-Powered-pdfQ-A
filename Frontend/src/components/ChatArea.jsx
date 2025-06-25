import React from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const ChatArea = ({ 
  currentChat,
  isDarkMode,
  isLoading,
  inputMessage,
  searchTerm,
  isSearching,
  backendError,
  messagesEndRef,
  onInputChange,
  onKeyPress,
  onSendMessage,
  onFileSearch,
  onFileSelect,
  onClearSearch,
  onScrollToBottom
}) => {return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Area - Scrollable */}
      <div 
        className={`flex-1 overflow-y-auto sidebar-scroll px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
        style={{ height: 0 }}
      >        {currentChat?.messages?.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isDarkMode={isDarkMode}
            searchTerm={searchTerm}
            isSearching={isSearching}
            backendError={backendError}
            onFileSearch={onFileSearch}
            onFileSelect={onFileSelect}
            onClearSearch={onClearSearch}
            onScrollToBottom={onScrollToBottom}
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">ai</span>
              </div>
              <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-100 border border-gray-700' 
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                <div className="flex space-x-1">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-gray-500' : 'bg-gray-400'}`}></div>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-gray-500' : 'bg-gray-400'}`} style={{animationDelay: '0.2s'}}></div>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-gray-500' : 'bg-gray-400'}`} style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <ChatInput
        isDarkMode={isDarkMode}
        inputMessage={inputMessage}
        isLoading={isLoading}
        onInputChange={onInputChange}
        onKeyPress={onKeyPress}
        onSendMessage={onSendMessage}
      />
    </div>
  );
};

export default ChatArea;
