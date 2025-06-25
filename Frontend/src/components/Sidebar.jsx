import React from 'react';
import { Plus, MessageCircle, Clock, Sparkles } from 'lucide-react';

const Sidebar = ({ 
  chats, 
  currentChatId, 
  isDarkMode,
  onNewChat,
  onChatSelect 
}) => {
  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gradient-to-b from-gray-800 to-gray-900' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
      {/* Header Section */}
      <div className="p-4 border-b border-opacity-20 border-gray-300">
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className={`
            w-full flex items-center space-x-3 px-4 py-3 rounded-xl
            transition-all duration-300 group relative overflow-hidden
            ${isDarkMode 
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white' 
              : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white'
            }
            shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0
          `}
        >
          <div className="relative z-10 flex items-center space-x-3">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-medium">New chat</span>
            <Sparkles className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </button>
      </div>
        {/* Chat History Section */}
      <div className="flex-1 overflow-y-auto sidebar-scroll p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Recent Chats
          </h3>
        </div>
        
        <div className="space-y-2">
          {chats.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs opacity-75">Start a conversation!</p>
            </div>
          ) : (
            chats.map((chat, index) => (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={`
                  w-full text-left p-3 rounded-xl transition-all duration-200 group relative
                  ${chat.id === currentChatId 
                    ? isDarkMode 
                      ? 'bg-gradient-to-r from-primary-600/20 to-primary-500/10 border border-primary-500/30 text-white shadow-lg' 
                      : 'bg-gradient-to-r from-primary-50 to-primary-25 border border-primary-200 text-primary-900 shadow-md'
                    : isDarkMode
                      ? 'hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/30 text-gray-300 hover:text-white border border-transparent hover:border-gray-600/50'
                      : 'hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 text-gray-700 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:shadow-sm'
                  }
                  transform hover:scale-[1.02] active:scale-[0.98]
                `}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeInUp 0.3s ease-out forwards'
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200
                    ${chat.id === currentChatId 
                      ? 'bg-primary-500 shadow-lg shadow-primary-500/50' 
                      : isDarkMode 
                        ? 'bg-gray-500 group-hover:bg-gray-400' 
                        : 'bg-gray-300 group-hover:bg-gray-400'
                    }
                  `} />
                  <MessageCircle className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    chat.id === currentChatId ? 'text-primary-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className="truncate text-sm font-medium flex-1">{chat.title}</span>
                </div>
                <div className={`text-xs mt-2 flex items-center justify-between ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>{chat.messages.length - 1} messages</span>
                  {chat.id === currentChatId && (
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                  )}
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-white/5 to-white/0 pointer-events-none" />
              </button>
            ))
          )}
        </div>
        
        {/* Bottom gradient fade */}
        <div className={`h-6 mt-4 bg-gradient-to-t ${isDarkMode ? 'from-gray-900 to-transparent' : 'from-white to-transparent'} pointer-events-none`} />
      </div>
    </div>
  );
};

export default Sidebar;
