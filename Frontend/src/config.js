/**
 * Configuration File for PDF RAG Q&A System Frontend
 * 
 * Centralizes all configuration constants including API endpoints,
 * application settings, UI constants, and environment-specific values.
 * 
 * This file serves as the single source of truth for system configuration,
 * making it easy to modify settings across the entire application.
 * 
 * @author PDF RAG System
 * @date 2024
 */

// ============================
// API CONFIGURATION
// ============================

/**
 * API endpoint configuration for backend communication
 * Base URL is configurable via environment variables for different environments
 */
export const API_CONFIG = {
  // Backend server base URL - defaults to local development
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  
  // API endpoint paths
  ENDPOINTS: {
    UPLOAD_PDF: '/uploadpdf/',        // POST: Upload PDF file
    VECTORIZE: '/vectorize',          // POST: Create vector embeddings
    ASK: '/api/ask',                  // POST: Ask questions about documents
    FILES: '/api/files',              // GET: List uploaded files
    EXTRACT: '/extract',              // POST: Extract text from PDF
    VIEW: '/view'                     // GET: View document content
  }
};

// ============================
// CHAT SYSTEM CONFIGURATION
// ============================

/**
 * Chat functionality limits and constraints
 */
export const CHAT_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,    // 10MB file size limit
  ALLOWED_FILE_TYPES: ['application/pdf'], // Only PDF files supported
  MAX_MESSAGE_LENGTH: 1000,            // Character limit for messages
  TYPING_DELAY: 100,                   // Simulated typing delay (ms)
  AUTO_SCROLL_DELAY: 100,              // Delay before auto-scroll (ms)
  SEARCH_DEBOUNCE_DELAY: 300           // File search debounce (ms)
};

// ============================
// USER INTERFACE CONFIGURATION
// ============================

/**
 * UI text constants and user-facing messages
 */
export const UI_CONFIG = {
  // System response messages
  MESSAGES: {
    UPLOAD_SUCCESS: '📄 {filename} uploaded successfully! You can now ask questions about this document.',
    VECTORIZE_SUCCESS: '✅ Document vectorized successfully! Created {count} vectors. You can now ask questions about it.',
    VECTORIZE_ERROR: '⚠️ Document vectorization failed. Please try uploading again.',
    UPLOAD_ERROR: 'Upload failed: {error}',
    CHAT_ERROR: 'Sorry, I encountered an error while processing your question. Please try again.',
    CONNECTION_ERROR: 'Unable to connect to the server. Please check your connection and try again.',
    NO_FILES_FOUND: 'No documents found. Please upload a PDF file first.',
    PROCESSING: 'Processing your request...'
  },
  
  // Input placeholders and labels
  PLACEHOLDERS: {
    MESSAGE_INPUT: 'Send a message...',
    FILE_UPLOAD: 'Upload PDF',
    SEARCH_FILES: 'Search files...',
    CHAT_TITLE: 'New Chat'
  },
  
  // Loading and status indicators
  LOADING_STATES: {
    UPLOADING: 'Uploading...',
    VECTORIZING: 'Creating embeddings...',
    THINKING: 'Thinking...',
    SEARCHING: 'Searching...'
  }
};

// ============================
// THEME CONFIGURATION
// ============================

/**
 * Theme and styling constants
 */
export const THEME_CONFIG = {
  // Available themes
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark'
  },
  
  // Default theme
  DEFAULT_THEME: 'light',
  
  // Animation durations
  ANIMATIONS: {
    FAST: '150ms',
    NORMAL: '300ms',
    SLOW: '500ms'
  }
};
