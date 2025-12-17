const openaiService = require('../services/openaiService');

class MemoryAgent {
  constructor() {
    this.name = 'Memory_Agent';
    // In production, this would connect to a database
    // For now, we'll work with in-memory storage passed from routes
  }

  // Search through past conversations
  async searchConversations(query, conversationHistory) {
    try {
      console.log(`${this.name}: Searching conversations for: ${query}`);

      if (!conversationHistory || conversationHistory.length === 0) {
        return {
          found: false,
          message: 'No past conversations found.',
          source: 'memory_search'
        };
      }

      // Convert all conversations to searchable text
      const conversationsText = conversationHistory.map((conv, idx) => {
        const messages = conv.messages
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        
        return `Conversation ${idx + 1} (${new Date(conv.timestamp).toLocaleDateString()}):\n${messages}`;
      }).join('\n\n---\n\n');

      // Use OpenAI to find relevant information
      const systemPrompt = `You are a memory retrieval assistant. Search through past conversations to find relevant information.
      If found, quote the specific insight and mention when it was discussed.
      If not found, clearly state it wasn't discussed.`;

      const messages = [
        {
          role: 'user',
          content: `Search these past conversations for: "${query}"
          
          ${conversationsText}
          
          What information was discussed about this topic?`
        }
      ];

      const result = await openaiService.chat(messages, systemPrompt);

      return {
        found: true,
        query,
        result,
        searchedConversations: conversationHistory.length,
        source: 'memory_search'
      };
    } catch (error) {
      console.error(`${this.name} search error:`, error);
      throw error;
    }
  }

  // Find specific insight from past conversation
  async findInsight(topic, date, conversationHistory) {
    try {
      console.log(`${this.name}: Finding insight about ${topic} from ${date}`);

      // Filter conversations by date if specified
      let relevantConversations = conversationHistory;
      
      if (date) {
        const targetDate = new Date(date);
        relevantConversations = conversationHistory.filter(conv => {
          const convDate = new Date(conv.timestamp);
          return convDate.toDateString() === targetDate.toDateString();
        });
      }

      if (relevantConversations.length === 0) {
        return {
          found: false,
          message: `No conversations found for ${date || 'that date'}.`,
          source: 'insight_search'
        };
      }

      // Search for specific topic
      const conversationsText = relevantConversations.map((conv, idx) => {
        const messages = conv.messages
          .map(msg => msg.content)
          .join('\n');
        
        return `Conversation ${idx + 1}:\n${messages}`;
      }).join('\n\n---\n\n');

      const systemPrompt = `You are an insight retrieval assistant. Find the specific insight about the requested topic.
      Quote the exact insight and provide context.`;

      const messages = [
        {
          role: 'user',
          content: `Find insights about "${topic}" from these conversations:
          
          ${conversationsText}`
        }
      ];

      const insight = await openaiService.chat(messages, systemPrompt);

      return {
        found: true,
        topic,
        date: date || 'unspecified',
        insight,
        source: 'insight_search'
      };
    } catch (error) {
      console.error(`${this.name} insight error:`, error);
      throw error;
    }
  }

  // Compare current insights with past conversations
  async compareWithHistory(currentInsights, conversationHistory) {
    try {
      console.log(`${this.name}: Comparing with history`);

      if (!conversationHistory || conversationHistory.length === 0) {
        return {
          comparison: 'No past conversations to compare.',
          source: 'history_comparison'
        };
      }

      // Get past insights summary
      const pastConversationsText = conversationHistory
        .slice(-5) // Last 5 conversations
        .map((conv, idx) => {
          const insights = conv.messages
            .filter(msg => msg.role === 'assistant')
            .map(msg => msg.content)
            .join('\n');
          
          return `Past Session ${idx + 1} (${new Date(conv.timestamp).toLocaleDateString()}):\n${insights}`;
        }).join('\n\n');

      const systemPrompt = `You are a trend analyst comparing current and historical business insights.
      Identify what changed, what stayed the same, and notable trends.`;

      const messages = [
        {
          role: 'user',
          content: `Compare current insights with history:
          
          CURRENT INSIGHTS:
          ${currentInsights}
          
          PAST INSIGHTS:
          ${pastConversationsText}
          
          What trends, changes, or patterns do you see?`
        }
      ];

      const comparison = await openaiService.chat(messages, systemPrompt);

      return {
        comparison,
        conversationsAnalyzed: Math.min(5, conversationHistory.length),
        source: 'history_comparison'
      };
    } catch (error) {
      console.error(`${this.name} comparison error:`, error);
      throw error;
    }
  }

  // Get summary of all past conversations
  async getConversationsSummary(conversationHistory) {
    try {
      console.log(`${this.name}: Getting conversations summary`);

      if (!conversationHistory || conversationHistory.length === 0) {
        return {
          summary: 'No past conversations.',
          count: 0,
          source: 'conversations_summary'
        };
      }

      const summaries = conversationHistory.map(conv => ({
        date: new Date(conv.timestamp).toLocaleDateString(),
        messageCount: conv.messages.length,
        topics: conv.messages
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content.substring(0, 50) + '...')
      }));

      return {
        summary: summaries,
        count: conversationHistory.length,
        source: 'conversations_summary'
      };
    } catch (error) {
      console.error(`${this.name} summary error:`, error);
      throw error;
    }
  }
}

module.exports = new MemoryAgent();