const yelpService = require('../services/yelpService');
const openaiService = require('../services/openaiService');

class AnalysisAgent {
  constructor() {
    this.name = 'Analysis_Agent';
  }

  // Compare responses over time
  async analyzeTimePeriods(topic, businessId, timeframe1, timeframe2) {
    try {
      console.log(`${this.name}: Analyzing ${topic} across time periods`);

      // Query for both time periods
      const query1 = `What did customers say about ${topic} ${timeframe1}?`;
      const query2 = `What did customers say about ${topic} ${timeframe2}?`;

      const [result1, result2] = await Promise.all([
        yelpService.aiQuery(query1, businessId),
        yelpService.aiQuery(query2, businessId)
      ]);

      // Use OpenAI to analyze the differences
      const systemPrompt = `You are an analyst comparing customer feedback across time periods. 
      Identify trends, changes, improvements or declines. Be specific with examples.`;

      const messages = [
        {
          role: 'user',
          content: `Compare these two time periods for ${topic}:
          
          Period 1 (${timeframe1}): ${result1.response}
          
          Period 2 (${timeframe2}): ${result2.response}
          
          Provide a clear analysis of what changed, improved, or declined.`
        }
      ];

      const analysis = await openaiService.chat(messages, systemPrompt);

      return {
        topic,
        timeframe1,
        timeframe2,
        period1Data: result1.response,
        period2Data: result2.response,
        analysis,
        source: 'temporal_comparison'
      };
    } catch (error) {
      console.error(`${this.name} error:`, error);
      throw error;
    }
  }

  // Calculate percentage changes and metrics
  async calculateMetrics(topic, businessId) {
    try {
      console.log(`${this.name}: Calculating metrics for ${topic}`);

      // Get recent data
      const query = `What are the statistics and numbers related to ${topic}?`;
      const result = await yelpService.aiQuery(query, businessId);

      // Use OpenAI to extract and calculate metrics
      const systemPrompt = `You are a data analyst. Extract numerical data, percentages, and metrics from the text.
      Calculate changes, trends, and present findings clearly. Format as JSON with keys: metrics, trends, summary.`;

      const messages = [
        {
          role: 'user',
          content: `Extract and analyze metrics from this data about ${topic}: ${result.response}`
        }
      ];

      const metrics = await openaiService.chatJSON(messages, systemPrompt);

      return {
        topic,
        ...metrics,
        source: 'metrics_analysis'
      };
    } catch (error) {
      console.error(`${this.name} metrics error:`, error);
      throw error;
    }
  }

  // Identify patterns across multiple queries
  async identifyPatterns(queries, businessId) {
    try {
      console.log(`${this.name}: Identifying patterns across ${queries.length} queries`);

      // Execute all queries
      const results = await Promise.all(
        queries.map(q => yelpService.aiQuery(q, businessId))
      );

      // Analyze patterns using OpenAI
      const systemPrompt = `You are a business analyst identifying patterns and themes across customer feedback.
      Look for recurring issues, common praise, and actionable insights.`;

      const combinedData = results.map((r, i) => 
        `Query ${i + 1}: ${queries[i]}\nResponse: ${r.response}`
      ).join('\n\n');

      const messages = [
        {
          role: 'user',
          content: `Identify key patterns, themes, and insights from this customer feedback:\n\n${combinedData}`
        }
      ];

      const patterns = await openaiService.chat(messages, systemPrompt);

      return {
        queries,
        patterns,
        individualResults: results,
        source: 'pattern_analysis'
      };
    } catch (error) {
      console.error(`${this.name} pattern error:`, error);
      throw error;
    }
  }
}

module.exports = new AnalysisAgent();