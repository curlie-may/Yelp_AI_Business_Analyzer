const openaiService = require('../services/openaiService');
const reportService = require('../services/reportService');

class ReportAgent {
  constructor() {
    this.name = 'Report_Agent';
  }

  // Generate executive summary from conversation
  async generateSummary(conversationMessages, businessContext) {
    try {
      console.log(`${this.name}: Generating conversation summary`);

      const conversationText = conversationMessages
        .map((msg, idx) => `${idx + 1}. ${msg.role === 'user' ? 'Q' : 'A'}: ${msg.content}`)
        .join('\n');

      const systemPrompt = `You are a business analyst creating executive summaries.
      Summarize the key insights from this conversation in a clear, professional format.
      Focus on actionable insights and important findings.
      Keep it concise but comprehensive.`;

      const messages = [
        {
          role: 'user',
          content: `Business: ${businessContext.businessName}
          
          Conversation:
          ${conversationText}
          
          Create an executive summary highlighting key insights and findings.`
        }
      ];

      const summary = await openaiService.chat(messages, systemPrompt);

      return {
        summary,
        conversationLength: conversationMessages.length,
        generatedAt: new Date().toISOString(),
        source: 'report_summary'
      };
    } catch (error) {
      console.error(`${this.name} summary error:`, error);
      throw error;
    }
  }

  // Extract key insights from conversation
  async extractKeyInsights(conversationMessages) {
    try {
      console.log(`${this.name}: Extracting key insights`);

      const conversationText = conversationMessages
        .filter(msg => msg.role === 'assistant')
        .map(msg => msg.content)
        .join('\n\n');

      const systemPrompt = `You are an analyst extracting key insights from business intelligence data.
      Return JSON with array of insights, each having: category, insight, importance (1-5).`;

      const messages = [
        {
          role: 'user',
          content: `Extract 5-10 key insights from this analysis:\n\n${conversationText}`
        }
      ];

      const result = await openaiService.chatJSON(messages, systemPrompt);

      return {
        insights: result.insights || [],
        source: 'key_insights'
      };
    } catch (error) {
      console.error(`${this.name} insights error:`, error);
      throw error;
    }
  }

  // Format shareable HTML report
  async formatShareableReport(conversation, priorities, additionalNotes, businessContext) {
    try {
      console.log(`${this.name}: Formatting shareable report`);

      // Extract any chart data from conversation
      const charts = reportService.extractChartDataFromConversation(conversation.messages);

      // Generate HTML report
      let html;
      if (priorities && priorities.length > 0) {
        html = await reportService.formatShareablePriorityReport(
          conversation,
          priorities,
          businessContext.businessName,
          additionalNotes,
          charts
        );
      } else {
        html = reportService.formatShareableConversation(
          conversation,
          businessContext.businessName
        );
      }

      return {
        html,
        metadata: {
          businessName: businessContext.businessName,
          generatedAt: new Date().toISOString(),
          conversationLength: conversation.messages.length,
          priorityCount: priorities ? priorities.length : 0,
          hasNotes: !!additionalNotes,
          hasCharts: charts.length > 0
        },
        source: 'shareable_report'
      };
    } catch (error) {
      console.error(`${this.name} shareable report error:`, error);
      throw error;
    }
  }

  // Generate action items list
  async generateActionItems(priorities) {
    try {
      console.log(`${this.name}: Generating action items list`);

      const systemPrompt = `You are a project manager creating actionable task lists.
      Convert priorities into specific, measurable action items with clear next steps.
      Return JSON with action items array.`;

      const messages = [
        {
          role: 'user',
          content: `Convert these priorities into specific action items:
          ${JSON.stringify(priorities, null, 2)}
          
          Make each action item specific, measurable, and time-bound when possible.`
        }
      ];

      const result = await openaiService.chatJSON(messages, systemPrompt);

      return {
        actionItems: result.actionItems || [],
        source: 'action_items'
      };
    } catch (error) {
      console.error(`${this.name} action items error:`, error);
      throw error;
    }
  }
}

module.exports = new ReportAgent();
