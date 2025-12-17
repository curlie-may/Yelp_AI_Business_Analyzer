const express = require('express');
const router = express.Router();
const conversationStore = require('../models/conversation');
const priorityAgent = require('../agents/priorityAgent');
const reportAgent = require('../agents/reportAgent');

// Generate priorities from conversation
router.post('/generate-priorities', async (req, res) => {
  try {
    const { userId, conversationId } = req.body;

    if (!userId || !conversationId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, conversationId' 
      });
    }

    const conversation = conversationStore.getConversation(userId, conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Generate priorities using Priority Agent
    const businessContext = {
      businessName: conversation.businessName,
      businessId: conversation.businessId
    };

    const result = await priorityAgent.generatePriorities(
      conversation.messages,
      businessContext
    );

    res.json({
      success: true,
      priorities: result.priorities,
      generatedAt: result.generatedAt
    });
  } catch (error) {
    console.error('Generate priorities error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate shareable HTML report (conversation summary only)
router.post('/generate-shareable-summary', async (req, res) => {
  try {
    const { userId, conversationId } = req.body;

    if (!userId || !conversationId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, conversationId' 
      });
    }

    const conversation = conversationStore.getConversation(userId, conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const businessContext = {
      businessName: conversation.businessName,
      businessId: conversation.businessId
    };

    // Generate shareable HTML report
    const result = await reportAgent.formatShareableReport(
      conversation,
      null, // No priorities
      '',   // No additional notes
      businessContext
    );

    res.json({
      success: true,
      html: result.html,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Generate shareable summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate shareable HTML report with priorities
router.post('/generate-shareable-report', async (req, res) => {
  try {
    const { 
      userId, 
      conversationId, 
      priorities,
      additionalNotes 
    } = req.body;

    if (!userId || !conversationId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, conversationId' 
      });
    }

    const conversation = conversationStore.getConversation(userId, conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const businessContext = {
      businessName: conversation.businessName,
      businessId: conversation.businessId
    };

    // Generate shareable HTML report with priorities
    const result = await reportAgent.formatShareableReport(
      conversation,
      priorities || [],
      additionalNotes || '',
      businessContext
    );

    res.json({
      success: true,
      html: result.html,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Generate shareable report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get conversation summary (without generating full report)
router.post('/summary', async (req, res) => {
  try {
    const { userId, conversationId } = req.body;

    if (!userId || !conversationId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, conversationId' 
      });
    }

    const conversation = conversationStore.getConversation(userId, conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const businessContext = {
      businessName: conversation.businessName,
      businessId: conversation.businessId
    };

    // Generate summary using Report Agent
    const result = await reportAgent.generateSummary(
      conversation.messages,
      businessContext
    );

    res.json({
      success: true,
      summary: result.summary,
      metadata: {
        conversationLength: result.conversationLength,
        generatedAt: result.generatedAt
      }
    });
  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Extract key insights
router.post('/insights', async (req, res) => {
  try {
    const { userId, conversationId } = req.body;

    if (!userId || !conversationId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, conversationId' 
      });
    }

    const conversation = conversationStore.getConversation(userId, conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const result = await reportAgent.extractKeyInsights(conversation.messages);

    res.json({
      success: true,
      insights: result.insights
    });
  } catch (error) {
    console.error('Extract insights error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;