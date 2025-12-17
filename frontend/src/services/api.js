import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = {
  // Search for business by name, city, state, and optional phone/address
  searchBusiness: async (businessName, city, state, phone = '', address = '') => {
    const response = await axios.post(`${API_URL}/api/auth/search-business`, {
      businessName,
      city,
      state,
      phone,
      address
    });
    return response.data;
  },

  // Start a new conversation
  startConversation: async (userId, businessId, businessName) => {
    const response = await axios.post(`${API_URL}/api/conversation/start`, {
      userId,
      businessId,
      businessName
    });
    return response.data;
  },

  // Send voice recording
  sendVoiceMessage: async (userId, conversationId, audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('userId', userId);
    formData.append('conversationId', conversationId);

    const response = await axios.post(`${API_URL}/api/conversation/voice`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Send text message
  sendTextMessage: async (userId, conversationId, message) => {
    const response = await axios.post(`${API_URL}/api/conversation/text`, {
      userId,
      conversationId,
      message
    });
    return response.data;
  },

  // Get conversation history
  getConversationHistory: async (userId) => {
    const response = await axios.get(`${API_URL}/api/conversation/history/${userId}`);
    return response.data;
  },

  // Get specific conversation
  getConversation: async (userId, conversationId) => {
    const response = await axios.get(`${API_URL}/api/conversation/${userId}/${conversationId}`);
    return response.data;
  },

  // Delete conversation
  deleteConversation: async (userId, conversationId) => {
    const response = await axios.delete(`${API_URL}/api/conversation/${userId}/${conversationId}`);
    return response.data;
  },

  // Generate priorities
  generatePriorities: async (userId, conversationId) => {
    const response = await axios.post(`${API_URL}/api/report/generate-priorities`, {
      userId,
      conversationId
    });
    return response.data;
  },

  // Generate shareable summary
  generateShareableSummary: async (userId, conversationId) => {
    const response = await axios.post(`${API_URL}/api/report/generate-shareable-summary`, {
      userId,
      conversationId
    });
    return response.data;
  },

  // Generate shareable report with priorities
  generateShareableReport: async (userId, conversationId, priorities, additionalNotes = '') => {
    const response = await axios.post(`${API_URL}/api/report/generate-shareable-report`, {
      userId,
      conversationId,
      priorities,
      additionalNotes
    });
    return response.data;
  }
};

export default api;