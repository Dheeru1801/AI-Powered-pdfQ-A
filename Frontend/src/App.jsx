/**
 * App Component - Main Application Entry Point
 * 
 * The root component of the PDF RAG Q&A System that orchestrates all major
 * functionality including chat management, file operations, and UI state.
 * 
 * Features:
 * - Multi-chat session management with persistent state
 * - File upload and vectorization workflow
 * - Real-time Q&A with AI responses and source citations
 * - Responsive design with collapsible sidebar
 * - Dark/light theme support
 * - Error handling and loading states
 * - Document search and filtering
 * 
 * Architecture:
 * - Uses custom hooks for state management (useChat)
 * - Modular component structure for maintainability
 * - Centralized API service for backend communication
 * - Configuration-driven UI text and settings
 * 
 * @author Dheeraj Chandra
 * @date 24-June-2025
 */

import React, { useState, useEffect } from 'react';
import { Plus, MessageCircle } from 'lucide-react';
import { apiService, validateFile, generateMessageId } from './utils/api.js';
import { UI_CONFIG, API_CONFIG } from './config.js';
import { useChat } from './hooks/useChat.js';
import { Sidebar, Header, WelcomeScreen, ChatArea } from './components/index.js';
import './styles.css';

function App() {
  // ============================
  // HOOK AND STATE MANAGEMENT
  // ============================
  
  // Get all chat-related state and functions from custom hook
  const {
    // Chat state
    chats, setChats, currentChatId, setCurrentChatId, currentChat,
    
    // UI state
    isDarkMode, inputMessage, setInputMessage,
    
    // File management
    availableFiles, setAvailableFiles, searchTerm, setSearchTerm, 
    totalFiles, setTotalFiles,
    
    // Loading states
    isLoading, setIsLoading, isUploading, setIsUploading, 
    isSearching, setIsSearching, backendError, setBackendError,
    
    // Refs and utilities
    fileInputRef, messagesEndRef, searchTimeoutRef,
    scrollToBottom, updateCurrentChat, createNewChat, 
    toggleTheme, generateChatTitle  } = useChat();  // Local component state - Start with sidebar closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  // ============================
  // COMPUTED VALUES
  // ============================
  
  // Check if current chat has any user messages (beyond initial AI greeting)
  const hasMessages = currentChat?.messages && currentChat.messages.length > 1;

  // ============================
  // FILE MANAGEMENT FUNCTIONS
  // ============================
  /**
   * Fetch available files from backend with optional search filtering
   * @param {string} search - Optional search term to filter files
   */
  const fetchAvailableFiles = async (search = '') => {
    try {
      setIsSearching(true);
      setBackendError(null);        // Use API service for consistent error handling and configuration
      const result = await apiService.getFiles();
      
      // Handle search filtering on the frontend if needed
      let files = result.files || [];
      if (search && search.trim()) {
        const searchTerm = search.toLowerCase();
        files = files.filter(file => 
          file.filename?.toLowerCase().includes(searchTerm)
        );
      }
      
      setAvailableFiles(files);
      setTotalFiles(result.total_files || files.length);    } catch (error) {
      setBackendError(`Failed to load files: ${error.message}`);
      setAvailableFiles([]);
      setTotalFiles(0);    } finally {
      setIsSearching(false);
    }
  };

  // ============================
  // EFFECTS
  // ============================
  
  /**
   * Handle responsive sidebar behavior
   */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Fetch available files when the component mounts
   */
  useEffect(() => {
    fetchAvailableFiles();
  }, []); // Empty dependency array - only run once on mount

  /**
   * Handle file search input and debounce API calls
   * @param {string} value - Search term entered by user
   */
  const handleFileSearch = (value) => {
    setSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchAvailableFiles(value);
    }, 300);
  };

  /**
   * Clear the file search term and refetch all available files
   */
  const clearSearch = () => {
    setSearchTerm('');
    fetchAvailableFiles();
  };

  /**
   * Handle selection of a file from the available files list
   * @param {string} filename - Name of the selected file
   */
  const handleFileSelect = async (filename) => {
    if (!filename) return;
    
    try {
      const fileInfo = { name: filename };
      updateCurrentChat({ uploadedFile: fileInfo });
      
      const acknowledgment = `✅ PDF "${filename}" is now loaded! You can ask questions about its content.`;
      const newMessage = {
        id: generateMessageId(),
        type: 'system',
        content: acknowledgment,
        timestamp: new Date()
      };
      
      updateCurrentChat({
        messages: [...currentChat.messages, newMessage]
      });      
      setSearchTerm('');
      scrollToBottom();
    } catch (error) {
      // File selection failed - handled by UI state
    }
  };
  /**
   * Handle file upload from the user's device
   * Validates file, uploads to backend, triggers vectorization, and updates UI
   * @param {Event} event - File input change event
   */
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size before upload
    try {
      validateFile(file);
    } catch (error) {
      alert(error.message);
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to backend and trigger vectorization
      const result = await apiService.uploadAndVectorize(file);
      
      if (result.success) {
        // Update current chat with uploaded file info
        updateCurrentChat({ uploadedFile: { name: file.name } });
        
        // Add success message to chat
        const acknowledgment = `✅ PDF "${file.name}" uploaded and processed successfully! You can now ask questions about its content.`;
        const newMessage = {
          id: generateMessageId(),
          type: 'system',
          content: acknowledgment,
          timestamp: new Date()
        };
          updateCurrentChat({
          messages: [...currentChat.messages, newMessage]
        });
        
        // Refresh the available files list
        await fetchAvailableFiles();
        
        scrollToBottom();
      } else {
        throw new Error(result.error || 'Upload failed');      }
    } catch (error) {
      alert(`Upload failed: ${error.message}`);    } finally {
      setIsUploading(false);
      event.target.value = ''; // Clear file input
    }
  };
  
  // ============================
  // MESSAGE HANDLING FUNCTIONS
  // ============================
  
  // ============================
  // MESSAGE HANDLING FUNCTIONS
  // ============================

  /**
   * Handle sending a user message and getting AI response
   * 
   * This function manages the complete message flow:
   * 1. Validates input and creates user message
   * 2. Updates chat title for first user message
   * 3. Handles file selection if no file is selected
   * 4. Sends question to RAG system and displays response
   * 5. Manages loading states and error handling
   */  const handleSendMessage = async () => {
    // Validate input and prevent multiple simultaneous requests
    if (!inputMessage.trim() || isLoading) return;
    
    // Create user message object
    const userMessage = {
      id: generateMessageId(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };
    
    let updatedMessages = [...currentChat.messages, userMessage];
    
    // Auto-generate chat title from first user message
    const userMessages = updatedMessages.filter(msg => msg.type === 'user');
    if (userMessages.length === 1) {
      const newTitle = generateChatTitle(inputMessage.trim());
      updateCurrentChat({ 
        title: newTitle,
        messages: updatedMessages 
      });
    } else {
      updateCurrentChat({ messages: updatedMessages });
    }
    
    // Clear input and set loading state
    setInputMessage('');
    setIsLoading(true);

    try {
      let response;
      
      // Check if user has selected a file for Q&A
      if (!currentChat.uploadedFile) {
        // No file selected - prompt user to choose from available files
        await fetchAvailableFiles();
        const filePromptMessage = {
          id: generateMessageId(),
          type: 'ai',
          content: 'Please select a PDF document from your uploaded files to ask questions about:',
          timestamp: new Date(),
          showFileSelector: true,
          availableFiles: [],
          totalFiles: 0
        };
        
        updatedMessages = [...updatedMessages, filePromptMessage];
        updateCurrentChat({ messages: updatedMessages });
        
        // Fetch files and update the message
        await fetchAvailableFiles();
        const updatedFileMessage = {
          ...filePromptMessage,
          availableFiles: availableFiles,
          totalFiles: totalFiles
        };
        
        const finalMessages = updatedMessages.map(msg => 
          msg.id === filePromptMessage.id ? updatedFileMessage : msg
        );        updateCurrentChat({ messages: finalMessages });
      } else {
        // Ask question about the uploaded file
        response = await apiService.askQuestion(
          inputMessage.trim(),
          currentChat.uploadedFile.name
        );        // Backend returns { answer: "...", sources: [...] } directly
        if (response.answer) {
          const aiMessage = {
            id: generateMessageId(),
            type: 'ai',
            content: response.answer,
            timestamp: new Date(),
            sources: response.sources || [],
            isNewestMessage: true // Mark as newest for typewriter effect
          };
          
          // Clear isNewestMessage flag from all previous messages
          const updatedMessagesCleared = updatedMessages.map(msg => ({
            ...msg,
            isNewestMessage: false
          }));
          
          updatedMessages = [...updatedMessagesCleared, aiMessage];
          updateCurrentChat({ messages: updatedMessages });
        } else {
          throw new Error('No answer received from the server');
        }
      }    } catch (error) {
      const errorMessage = {
        id: generateMessageId(),
        type: 'ai',
        content: `❌ Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
        isNewestMessage: true // Mark as newest for typewriter effect
      };
      
      // Clear isNewestMessage flag from all previous messages
      const updatedMessagesCleared = updatedMessages.map(msg => ({
        ...msg,
        isNewestMessage: false
      }));
      
      updatedMessages = [...updatedMessagesCleared, errorMessage];
      updateCurrentChat({ messages: updatedMessages });
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  /**
   * Handle key press events in the message input area
   * @param {KeyboardEvent} e - Key press event
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  // ============================
  // UI AND EVENT HANDLER FUNCTIONS
  // ============================
  
  // Handler functions for components
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  const handleUploadClick = () => fileInputRef.current?.click();
  const handleInputChange = (e) => setInputMessage(e.target.value);
  return (
    <div className={`h-screen flex transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Mobile Sidebar Overlay - Only show on mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`
          transition-all duration-300 
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          border-r
          ${sidebarOpen 
            ? 'w-64 translate-x-0' 
            : 'w-0 -translate-x-full md:w-0'
          }
          ${sidebarOpen && 'md:static md:translate-x-0'}
          ${!sidebarOpen && 'md:w-0'}
          overflow-hidden
          fixed md:static inset-y-0 left-0 z-30
        `}>
          <div className="w-64 h-full">
            <Sidebar
              chats={chats}
              currentChatId={currentChatId}
              isDarkMode={isDarkMode}              onChatSelect={(chatId) => {
                setCurrentChatId(chatId);
                // Clear isNewestMessage flags when switching chats
                setChats(prevChats => prevChats.map(chat => ({
                  ...chat,
                  messages: chat.messages.map(msg => ({ ...msg, isNewestMessage: false }))
                })));
                // Close sidebar on mobile when selecting a chat
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}              onNewChat={() => {
                createNewChat();
                // Clear isNewestMessage flags when creating new chat
                setChats(prevChats => prevChats.map(chat => ({
                  ...chat,
                  messages: chat.messages.map(msg => ({ ...msg, isNewestMessage: false }))
                })));
                // Close sidebar on mobile when creating new chat
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            />
          </div>
        </div>        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}          <Header
            isDarkMode={isDarkMode}
            sidebarOpen={sidebarOpen}
            isUploading={isUploading}
            onToggleSidebar={handleToggleSidebar}
            onUploadClick={handleUploadClick}
            onToggleTheme={toggleTheme}
          />{/* Chat Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {!hasMessages ? (
              <WelcomeScreen
                isDarkMode={isDarkMode}
                inputMessage={inputMessage}
                isLoading={isLoading}
                onInputChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onSendMessage={handleSendMessage}
              />            ) : (
              <ChatArea
                currentChat={currentChat}
                isDarkMode={isDarkMode}
                isLoading={isLoading}
                inputMessage={inputMessage}
                searchTerm={searchTerm}
                isSearching={isSearching}
                backendError={backendError}
                messagesEndRef={messagesEndRef}
                onInputChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onSendMessage={handleSendMessage}
                onFileSearch={handleFileSearch}
                onFileSelect={handleFileSelect}
                onClearSearch={clearSearch}
                onScrollToBottom={scrollToBottom}
              />
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}

export default App;
