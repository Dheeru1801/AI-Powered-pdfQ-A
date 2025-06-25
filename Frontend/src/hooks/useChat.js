/**
 * useChat Hook - Chat Management for PDF RAG Q&A System
 * 
 * A comprehensive React hook that manages all chat-related state and operations
 * including message handling, file management, and Q&A interactions.
 * 
 * Features:
 * - Multi-chat session management
 * - File upload and vectorization workflow
 * - Real-time message handling with AI responses
 * - Document search and filtering
 * - Error handling and loading states
 * - Dark mode support
 * 
 * @author PDF RAG System
 * @date 2024
 */

import { useState, useRef, useEffect } from 'react';
import { apiService, validateFile, generateMessageId } from '../utils/api.js';

/**
 * Custom hook for managing chat functionality
 * 
 * @returns {Object} Chat state and methods for UI components
 */
export const useChat = () => {
  // ============================
  // CHAT STATE MANAGEMENT
  // ============================
  
  /**
   * Array of chat sessions with messages and metadata
   * Each chat contains: id, title, messages[], uploadedFile, createdAt
   */
  const [chats, setChats] = useState([
    {
      id: 1,
      title: 'New Chat',
      messages: [
        {
          id: 1,
          type: 'ai',
          content: 'Our own Large Language Model (LLM) is a type of AI that can learn from data. We have trained it on 7 billion parameters which makes it better than other LLMs. Upload a file and Get started!',
          timestamp: new Date()
        }
      ],
      uploadedFile: null,
      createdAt: new Date()
    }
  ]);
  
  // Current active chat and UI state
  const [currentChatId, setCurrentChatId] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // ============================
  // CURRENT CHAT STATE
  // ============================
  
  // Get current chat object
  const currentChat = chats.find(chat => chat.id === currentChatId);
  
  // Input and interaction state
  const [inputMessage, setInputMessage] = useState('');
  const [availableFiles, setAvailableFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalFiles, setTotalFiles] = useState(0);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [backendError, setBackendError] = useState(null);
  
  // ============================
  // REFS AND UTILITIES
  // ============================
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  /**
   * Smooth scroll to bottom of messages container
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Helper function to update current chat with new data
   * @param {Object} updates - Object with properties to update
   */
  const updateCurrentChat = (updates) => {
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId ? { ...chat, ...updates } : chat
    ));
  };
  // ============================
  // CHAT MANAGEMENT FUNCTIONS
  // ============================

  /**
   * Create a new chat session with default welcome message
   * Adds the new chat to the beginning of the chats array and switches to it
   */
  const createNewChat = () => {
    const newChatId = Date.now();
    const newChat = {
      id: newChatId,
      title: 'New Chat',
      messages: [
        {
          id: 1,
          type: 'ai',
          content: 'Our own Large Language Model (LLM) is a type of AI that can learn from data. We have trained it on 7 billion parameters which makes it better than other LLMs. Upload a file and Get started!',
          timestamp: new Date()
        }
      ],
      uploadedFile: null,
      createdAt: new Date()
    };
    
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    setInputMessage('');
    setSearchTerm('');
  };

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Generate chat title from first user message
  const generateChatTitle = (message) => {
    if (message.length > 30) {
      return message.substring(0, 30) + '...';
    }
    return message;
  };
  // ============================
  // EFFECTS AND AUTO-SCROLL
  // ============================

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  // ============================
  // HOOK RETURN OBJECT
  // ============================

  return {
    // ========== CHAT STATE ==========
    chats,                    // Array of all chat sessions
    setChats,                 // Setter for chats array
    currentChatId,            // ID of currently active chat
    setCurrentChatId,         // Switch between chats
    currentChat,              // Current chat object with messages
    isDarkMode,               // Dark/light theme toggle state
    
    // ========== INPUT STATE ==========
    inputMessage,             // Current message being typed
    setInputMessage,          // Update input message
    availableFiles,           // List of uploaded files for selection
    setAvailableFiles,        // Update files list
    searchTerm,               // File search filter term
    setSearchTerm,            // Update search term
    totalFiles,               // Total count of available files
    setTotalFiles,            // Update total files count
    
    // ========== LOADING STATES ==========
    isLoading,                // Q&A request in progress
    setIsLoading,             // Control Q&A loading state
    isUploading,              // File upload in progress
    setIsUploading,           // Control upload loading state
    isSearching,              // File search in progress
    setIsSearching,           // Control search loading state
    backendError,             // Backend connection error
    setBackendError,          // Update error state
    
    // ========== REFS ==========
    fileInputRef,             // Reference to file input element
    messagesEndRef,           // Reference for auto-scroll target
    searchTimeoutRef,         // Debounced search timeout
    
    // ========== FUNCTIONS ==========
    scrollToBottom,           // Scroll to latest message
    updateCurrentChat,        // Update current chat data
    createNewChat,            // Create new chat session
    toggleTheme,              // Switch dark/light mode
    generateChatTitle         // Auto-generate chat title from content
  };
};
