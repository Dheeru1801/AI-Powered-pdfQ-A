import React from 'react';
import { Upload, Menu, Loader2 } from 'lucide-react';

const Header = ({ 
  sidebarOpen,
  isDarkMode,
  isUploading,
  onToggleSidebar,
  onToggleTheme,
  onUploadClick
}) => {
  return (
    <>
    <div className={`flex items-center justify-between px-4 py-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>      <div className="flex items-center space-x-4">
        {/* Mobile: Hamburger menu / Desktop: Sidebar toggle */}
        <button          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSidebar();
          }}
          className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* AI Logo */}
        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">ai</span>
        </div>
        
        <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          AI Planet
        </h1>
      </div>
        <div className="flex items-center space-x-3">
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
          <button
          onClick={onUploadClick}
          disabled={isUploading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
            isUploading
              ? isDarkMode 
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isDarkMode 
                ? 'bg-primary-600 hover:bg-primary-700 text-white hover:scale-105' 
                : 'bg-primary-500 hover:bg-primary-600 text-white hover:scale-105'
          }`}
          title={isUploading ? 'Uploading and processing...' : 'Upload PDF file'}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Processing...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload PDF</span>
            </>
          )}
        </button>      </div>
    </div>
    
    {/* Upload Progress Bar */}
    {isUploading && (
      <div className={`px-4 py-3 border-b ${isDarkMode ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-2">
              <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                📄 Uploading and vectorizing PDF...
              </span>              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Please wait
              </span>
            </div>
            <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div className="h-2 bg-primary-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Header;
