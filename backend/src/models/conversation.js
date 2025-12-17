// In-memory conversation storage
// In production, this would be a database (MongoDB, PostgreSQL, etc.)

class ConversationStore {
  constructor() {
    // Store conversations by user ID
    this.conversations = new Map();
    // Store current active conversation by user ID
    this.activeConversations = new Map();
  }

  // Create new conversation
  createConversation(userId, businessId, businessName) {
    const conversationId = this.generateId();
    const conversation = {
      id: conversationId,
      userId,
      businessId,
      businessName,
      messages: [],
      chatId: null, // Yelp AI chat_id for multi-turn
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Get user's conversations or create new array
    const userConversations = this.conversations.get(userId) || [];
    userConversations.push(conversation);
    this.conversations.set(userId, userConversations);

    // Set as active conversation
    this.activeConversations.set(userId, conversationId);

    return conversation;
  }

  // Get conversation by ID
  getConversation(userId, conversationId) {
    const userConversations = this.conversations.get(userId) || [];
    return userConversations.find(conv => conv.id === conversationId);
  }

  // Get active conversation for user
  getActiveConversation(userId) {
    const activeId = this.activeConversations.get(userId);
    if (!activeId) return null;
    return this.getConversation(userId, activeId);
  }

  // Get all conversations for user
  getAllConversations(userId) {
    return this.conversations.get(userId) || [];
  }

  // Add message to conversation
  addMessage(userId, conversationId, role, content) {
    const conversation = this.getConversation(userId, conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.messages.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });

    conversation.lastUpdated = new Date().toISOString();
    return conversation;
  }

  // Update chat ID (for Yelp AI multi-turn)
  updateChatId(userId, conversationId, chatId) {
    const conversation = this.getConversation(userId, conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.chatId = chatId;
    return conversation;
  }

  // Set active conversation
  setActiveConversation(userId, conversationId) {
    const conversation = this.getConversation(userId, conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    this.activeConversations.set(userId, conversationId);
    return conversation;
  }

  // Delete conversation
  deleteConversation(userId, conversationId) {
    const userConversations = this.conversations.get(userId) || [];
    const filtered = userConversations.filter(conv => conv.id !== conversationId);
    this.conversations.set(userId, filtered);

    // Clear active if it was the deleted one
    if (this.activeConversations.get(userId) === conversationId) {
      this.activeConversations.delete(userId);
    }

    return true;
  }

  // Generate unique ID
  generateId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear all conversations for user (useful for testing)
  clearUserConversations(userId) {
    this.conversations.delete(userId);
    this.activeConversations.delete(userId);
  }
}

// Singleton instance
const conversationStore = new ConversationStore();

module.exports = conversationStore;