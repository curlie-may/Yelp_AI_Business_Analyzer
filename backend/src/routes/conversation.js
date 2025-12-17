const express = require('express');
const router = express.Router();
const multer = require('multer');
const conversationStore = require('../models/conversation');
const openaiService = require('../services/openaiService');
const queryAgent = require('../agents/queryAgent');
const analysisAgent = require('../agents/analysisAgent');
const memoryAgent = require('../agents/memoryAgent');

// Configure multer for audio upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Start new conversation
router.post('/start', async (req, res) => {
  try {
    const { userId, businessId, businessName } = req.body;

    if (!userId || !businessId || !businessName) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, businessId, businessName' 
      });
    }

    const conversation = conversationStore.createConversation(userId, businessId, businessName);

    res.json({
      success: true,
      conversationId: conversation.id,
      message: 'Conversation started'
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process voice input (Speech-to-Text + Query)
router.post('/voice', upload.single('audio'), async (req, res) => {
  try {
    const { userId, conversationId } = req.body;

    if (!userId || !conversationId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, conversationId' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Get conversation
    const conversation = conversationStore.getConversation(userId, conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Convert speech to text
    const transcription = await openaiService.speechToText(req.file.buffer, req.file.originalname);
    console.log('Transcription:', transcription);

    // Add user message to conversation
    conversationStore.addMessage(userId, conversationId, 'user', transcription);

    // Determine if this is a memory query or Yelp query
    const isMemoryQuery = transcription.toLowerCase().includes('last time') || 
                          transcription.toLowerCase().includes('previously') ||
                          transcription.toLowerCase().includes('before') ||
                          transcription.toLowerCase().includes('past conversation');

    let response;

    if (isMemoryQuery) {
      // Use Memory Agent
      const history = conversationStore.getAllConversations(userId)
        .filter(conv => conv.id !== conversationId); // Exclude current
      
      const memoryResult = await memoryAgent.searchConversations(transcription, history);
      response = memoryResult.result || memoryResult.message;
    } else {
      // Use Query Agent to get insights from Yelp
      const queryResult = await queryAgent.query(
        transcription, 
        conversation.businessId, 
        conversation.chatId
      );

      // Update chat ID for multi-turn conversation
      if (queryResult.chatId) {
        conversationStore.updateChatId(userId, conversationId, queryResult.chatId);
      }

      response = queryResult.answer;
    }

    // Add assistant response to conversation
    conversationStore.addMessage(userId, conversationId, 'assistant', response);

    // Try to generate audio response (Text-to-Speech) - make it optional
    let audioBase64 = null;
    try {
      const audioBuffer = await openaiService.textToSpeech(response);
      audioBase64 = audioBuffer.toString('base64');
    } catch (ttsError) {
      console.error('TTS failed (non-fatal):', ttsError.message);
      // Continue without audio - text response is what matters
    }

    res.json({
      success: true,
      transcription,
      response,
      audio: audioBase64, // Will be null if TTS failed
      conversationId
    });
  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process text input (without speech)
router.post('/text', async (req, res) => {
  try {
    const { userId, conversationId, message } = req.body;

    if (!userId || !conversationId || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, conversationId, message' 
      });
    }

    // Get conversation
    const conversation = conversationStore.getConversation(userId, conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Add user message
    conversationStore.addMessage(userId, conversationId, 'user', message);

    // Determine if this is a memory query
    const isMemoryQuery = message.toLowerCase().includes('last time') || 
                          message.toLowerCase().includes('previously') ||
                          message.toLowerCase().includes('before') ||
                          message.toLowerCase().includes('past conversation');

    let response;

    if (isMemoryQuery) {
      const history = conversationStore.getAllConversations(userId)
        .filter(conv => conv.id !== conversationId);
      
      const memoryResult = await memoryAgent.searchConversations(message, history);
      response = memoryResult.result || memoryResult.message;
    } else {
      const queryResult = await queryAgent.query(
        message, 
        conversation.businessId, 
        conversation.chatId
      );

      if (queryResult.chatId) {
        conversationStore.updateChatId(userId, conversationId, queryResult.chatId);
      }

      response = queryResult.answer;
    }

    // Add assistant response
    conversationStore.addMessage(userId, conversationId, 'assistant', response);

    // Try to generate audio for response - make it optional
    let audioBase64 = null;
    try {
      const audioBuffer = await openaiService.textToSpeech(response);
      audioBase64 = audioBuffer.toString('base64');
    } catch (ttsError) {
      console.error('TTS failed (non-fatal):', ttsError.message);
      // Continue without audio
    }

    res.json({
      success: true,
      response,
      audio: audioBase64,
      conversationId
    });
  } catch (error) {
    console.error('Text processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get conversation history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = conversationStore.getAllConversations(userId);

    res.json({
      success: true,
      conversations: conversations.map(conv => ({
        id: conv.id,
        businessName: conv.businessName,
        timestamp: conv.timestamp,
        lastUpdated: conv.lastUpdated,
        messageCount: conv.messages.length
      }))
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific conversation
router.get('/:userId/:conversationId', async (req, res) => {
  try {
    const { userId, conversationId } = req.params;
    const conversation = conversationStore.getConversation(userId, conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete conversation
router.delete('/:userId/:conversationId', async (req, res) => {
  try {
    const { userId, conversationId } = req.params;
    conversationStore.deleteConversation(userId, conversationId);

    res.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;