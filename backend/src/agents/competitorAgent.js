const yelpService = require('../services/yelpService');
const openaiService = require('../services/openaiService');

class CompetitorAgent {
  constructor() {
    this.defaultRadius = 8046.72; // 5 miles in meters
  }

  // Find competitors near a business
  async findCompetitors(businessId, radius = this.defaultRadius) {
    try {
      const businessDetails = await yelpService.getBusinessDetails(businessId);
      
      // Get the business category
      const category = businessDetails.categories && businessDetails.categories.length > 0
        ? businessDetails.categories[0].alias
        : null;

      if (!category) {
        throw new Error('Cannot determine business category for competitor search');
      }

      // Search for similar businesses nearby
      const axios = require('axios');
      const response = await axios.get(`https://api.yelp.com/v3/businesses/search`, {
        headers: {
          Authorization: `Bearer ${process.env.YELP_API_KEY}`
        },
        params: {
          categories: category,
          latitude: businessDetails.coordinates.latitude,
          longitude: businessDetails.coordinates.longitude,
          radius: Math.min(radius, 40000), // Yelp max is 40km
          limit: 10,
          sort_by: 'rating'
        }
      });

      // Filter out the current business
      const competitors = response.data.businesses.filter(b => b.id !== businessId);

      return {
        competitors: competitors.slice(0, 5), // Top 5 competitors
        category,
        radius: radius / 1609.34 // Convert back to miles for display
      };
    } catch (error) {
      console.error('Find competitors error:', error);
      throw new Error('Failed to find competitors: ' + error.message);
    }
  }

  // Analyze competitive positioning
  async analyzeCompetition(businessId, query, radius = this.defaultRadius) {
    try {
      const businessDetails = await yelpService.getBusinessDetails(businessId);
      const competitorData = await this.findCompetitors(businessId, radius);

      // Build comparison prompt
      const competitorSummary = competitorData.competitors.map(c => 
        `- ${c.name}: ${c.rating} stars (${c.review_count} reviews), ${c.price || 'N/A'} price range`
      ).join('\n');

      const systemPrompt = `You are analyzing competitive positioning for ${businessDetails.name}.

Your business:
- Rating: ${businessDetails.rating} stars
- Reviews: ${businessDetails.review_count}
- Price: ${businessDetails.price || 'N/A'}

Top competitors within ${competitorData.radius.toFixed(1)} miles:
${competitorSummary}

Provide a concise competitive analysis addressing: ${query}`;

      const messages = [
        { role: 'user', content: query }
      ];

      const analysis = await openaiService.chat(messages, systemPrompt);

      return {
        analysis,
        competitors: competitorData.competitors,
        businessRating: businessDetails.rating,
        averageCompetitorRating: competitorData.competitors.reduce((sum, c) => sum + c.rating, 0) / competitorData.competitors.length
      };
    } catch (error) {
      console.error('Competitor analysis error:', error);
      throw new Error('Failed to analyze competition: ' + error.message);
    }
  }

  // SWOT analysis
  async generateSWOT(businessId) {
    try {
      const businessDetails = await yelpService.getBusinessDetails(businessId);
      const reviews = await yelpService.getBusinessReviews(businessId);
      const competitorData = await this.findCompetitors(businessId);

      const systemPrompt = `Generate a SWOT analysis for ${businessDetails.name} based on their Yelp data.

Business Info:
- Rating: ${businessDetails.rating} stars (${businessDetails.review_count} reviews)
- Price: ${businessDetails.price || 'N/A'}
- Categories: ${businessDetails.categories.map(c => c.title).join(', ')}

Recent Reviews Summary:
${reviews.slice(0, 5).map(r => `- ${r.rating} stars: "${r.text.substring(0, 100)}..."`).join('\n')}

Competitors:
${competitorData.competitors.slice(0, 3).map(c => `- ${c.name}: ${c.rating} stars`).join('\n')}

Return a JSON object with this structure:
{
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "threats": ["threat 1", "threat 2"]
}`;

      const swot = await openaiService.chatJSON(
        [{ role: 'user', content: 'Generate SWOT analysis' }],
        systemPrompt
      );

      return swot;
    } catch (error) {
      console.error('SWOT generation error:', error);
      throw new Error('Failed to generate SWOT: ' + error.message);
    }
  }
}

module.exports = new CompetitorAgent();