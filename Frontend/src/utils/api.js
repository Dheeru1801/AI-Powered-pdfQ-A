/**
 * API Service Module for PDF RAG Q&A System
 * 
 * Provides a centralized interface for all backend API communications including:
 * - File upload and management
 * - Document vectorization
 * - Question answering with RAG
 * - File listing and metadata retrieval
 * 
 * Features:
 * - Comprehensive error handling
 * - File validation utilities
 * - Response formatting helpers
 * - Type-safe API interactions
 * 
 * @author PDF RAG System
 * @date 2024
 */

import { API_CONFIG } from '../config.js';

/**
 * Main API Service Class
 * 
 * Handles all HTTP communications with the FastAPI backend.
 * Provides methods for file operations, document processing, and Q&A functionality.
 */
class APIService {
  /**
   * Initialize API service with base configuration
   */
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  /**
   * Upload a PDF file to the backend for processing
   * 
   * @param {File} file - PDF file object from file input
   * @returns {Promise<Object>} Upload response with file metadata
   * @throws {Error} If upload fails or file is invalid
   */
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.UPLOAD_PDF}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return await response.json();
  }

  /**
   * Vectorize an uploaded document to create embeddings
   * 
   * @param {string} filename - Name of the file to vectorize
   * @returns {Promise<Object>} Vectorization response with status and details
   * @throws {Error} If vectorization fails
   */
  async vectorizeDocument(filename) {
    const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.VECTORIZE}/${filename}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Vectorization failed');
    }

    return await response.json();
  }

  /**
   * Ask a question about a document using RAG
   * 
   * @param {string} question - The question text
   * @param {string|null} filename - Optional filename to restrict the search
   * @returns {Promise<Object>} Response with answer and source information
   * @throws {Error} If the question cannot be processed
   */
  async askQuestion(question, filename = null) {
    const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.ASK}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: question,
        filename: filename
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get response');
    }

    return await response.json();
  }

  /**
   * Retrieve the list of uploaded files and their metadata
   * 
   * @returns {Promise<Array>} List of files with metadata
   * @throws {Error} If file retrieval fails
   */
  async getFiles() {
    const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.FILES}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }

    return await response.json();
  }

  /**
   * Upload and vectorize a PDF file in one operation
   * 
   * @param {File} file - PDF file object from file input
   * @returns {Promise<Object>} Combined response with upload and vectorization status
   * @throws {Error} If either upload or vectorization fails
   */
  async uploadAndVectorize(file) {
    try {
      // Step 1: Upload the file
      const uploadResult = await this.uploadFile(file);
      
      // Step 2: Vectorize the uploaded file
      const vectorizeResult = await this.vectorizeDocument(file.name);
      
      // Return combined success response
      return {
        success: true,
        upload: uploadResult,
        vectorization: vectorizeResult,
        filename: file.name
      };
    } catch (error) {
      // Return error response
      return {
        success: false,
        error: error.message,
        filename: file.name
      };
    }
  }
}

export const apiService = new APIService();

// Utility functions
/**
 * Format file size from bytes to a human-readable string
 * 
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size with appropriate units
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate the uploaded file for type and size
 * 
 * @param {File} file - The file object to validate
 * @returns {boolean} True if the file is valid
 * @throws {Error} If the file is not a PDF or exceeds the size limit
 */
export const validateFile = (file) => {
  if (!file.type.includes('pdf')) {
    throw new Error('Please upload a PDF file only.');
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB
    throw new Error('File size must be less than 10MB.');
  }
  
  return true;
};

/**
 * Generate a unique message ID based on the current timestamp and a random number
 * 
 * @returns {number} Unique message ID
 */
export const generateMessageId = () => {
  return Date.now() + Math.random();
};

/**
 * Format a timestamp date object to a readable string
 * 
 * @param {Date} date - The date object to format
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};
