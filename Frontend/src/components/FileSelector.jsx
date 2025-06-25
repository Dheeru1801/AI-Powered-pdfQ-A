import React from 'react';
import { FileText } from 'lucide-react';

const FileSelector = ({
  searchTerm,
  availableFiles,
  totalFiles,
  isSearching,
  backendError,
  isDarkMode,
  onSearchChange,
  onFileSelect,
  onClearSearch
}) => {
  return (
    <div className={`mt-3 pt-3 ${isDarkMode ? 'border-t border-gray-600' : 'border-t border-gray-200'}`}>      {/* Search Box */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={onSearchChange}
            className={`w-full px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-12 transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
            </div>
          )}
        </div>
        <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {isSearching ? (
            'Searching...'
          ) : searchTerm ? (
            `Found ${availableFiles.length} files matching "${searchTerm}"`
          ) : (
            `Showing ${availableFiles.length} recent files of ${totalFiles || 0} total`
          )}
        </div>
      </div>
        {/* File List */}
      <div className="space-y-3 max-h-48 sm:max-h-60 overflow-y-auto">
        {availableFiles.length > 0 ? (
          availableFiles.map((file, index) => (
            <button
              key={index}
              onClick={() => onFileSelect(file.filename)}
              className={`flex items-center space-x-3 w-full p-4 text-left text-sm sm:text-base rounded-xl transition-colors duration-200 touch-target ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-100 shadow-lg' 
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 shadow-sm hover:shadow-md'
              }`}
            >
              <FileText className="w-5 h-5 sm:w-4 sm:h-4 text-primary-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{file.filename}</div>
                {file.status && (
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {file.status === 'vectorized' ? '✅ Ready for Q&A' : '⏳ Processing...'}
                  </div>
                )}
              </div>
              <div className={`text-lg flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {file.status === 'vectorized' ? '✅' : '⏳'}
              </div>
            </button>
          ))
        ) : (
          <div className={`text-center py-4 text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {backendError ? (
              <div className="text-red-400">
                <div className="font-medium">⚠️ Backend connection failed</div>
                <div className="mt-1 text-xs">Make sure the backend server is running on port 8000</div>
              </div>
            ) : searchTerm ? (
              'No files found matching your search.'
            ) : (
              'No PDF documents in database. Upload some files first.'
            )}
          </div>
        )}
      </div>
      
      {/* Clear Search Button */}
      {searchTerm && (
        <button
          onClick={onClearSearch}
          className="mt-3 text-xs text-primary-500 hover:text-primary-600 underline"
        >
          Clear search and show recent files
        </button>
      )}
    </div>
  );
};

export default FileSelector;
