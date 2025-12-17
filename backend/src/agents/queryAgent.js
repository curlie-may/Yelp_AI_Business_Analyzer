const yelpService = require('../services/yelpService');

class QueryAgent {
  constructor() {
    // Keywords that indicate simple fact questions
    this.factKeywords = {
      rating: ['rating', 'stars', 'star rating', 'rated', 'score'],
      reviews: ['how many reviews', 'review count', 'number of reviews'],
      hours: ['hours', 'open', 'close', 'opening hours', 'business hours'],
      phone: ['phone', 'phone number', 'contact', 'call'],
      address: ['address', 'location', 'where located'],
      price: ['price range', 'how expensive', 'pricing', 'cost']
    };

    // Temporal patterns that indicate date/time-specific queries
    this.temporalPatterns = [
      /\b(20\d{2})\b/,                                    // Years: 2020, 2021, 2022, etc.
      /\b(last|this|previous|next)\s+(year|month|quarter|week)\b/i,
      /\b(since|before|after|in|during)\s+(20\d{2})\b/i, // "since 2020", "in 2022"
      /\byear[\s-]over[\s-]year\b/i,
      /\byearly\b/i,
      /\bannual(ly)?\b/i,
      /\bfrom\s+\d{4}\s+to\s+\d{4}\b/i,                  // "from 2020 to 2023"
      /\bbetween\s+.+\s+and\s+.+\b/i,                    // "between March and June"
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i,
      /\bover\s+time\b/i,
      /\bhistorical(ly)?\b/i,
      /\btrend(s)?\s+(over|across|from)\b/i,
      /\bcompare\s+\d{4}\b/i,                             // "compare 2022"
      /\bQ[1-4]\s+\d{4}\b/i,                              // "Q1 2023"
      /\bfiscal\s+year\b/i
    ];
  }

  // Check if query contains temporal/date-specific patterns
  containsTemporalQuery(query) {
    const lowerQuery = query.toLowerCase();
    return this.temporalPatterns.some(pattern => pattern.test(lowerQuery));
  }

  // Extract core topic from temporal query
  extractCoreTopic(query) {
    const lowerQuery = query.toLowerCase();
    
    // Common topics to extract
    if (lowerQuery.includes('rating') || lowerQuery.includes('star')) {
      return 'rating';
    }
    if (lowerQuery.includes('review')) {
      return 'reviews';
    }
    if (lowerQuery.includes('complaint') || lowerQuery.includes('negative') || lowerQuery.includes('problem')) {
      return 'complaints';
    }
    if (lowerQuery.includes('praise') || lowerQuery.includes('positive') || lowerQuery.includes('love')) {
      return 'positive feedback';
    }
    if (lowerQuery.includes('service')) {
      return 'service quality';
    }
    if (lowerQuery.includes('food') || lowerQuery.includes('menu')) {
      return 'food and menu';
    }
    
    // Default to general insights
    return 'overall customer feedback';
  }

  // Determine if question is asking for a simple fact
  detectFactQuestion(query) {
    const lowerQuery = query.toLowerCase();
    
    for (const [factType, keywords] of Object.entries(this.factKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return factType;
      }
    }
    
    return null; // Not a fact question, needs analysis
  }

  // Extract direct answer from business data
  async extractDirectAnswer(factType, businessId) {
    try {
      const businessDetails = await yelpService.getBusinessDetails(businessId);
      
      switch (factType) {
        case 'rating':
          return {
            answer: `Your business has a **${businessDetails.rating} star rating** based on ${businessDetails.review_count.toLocaleString()} reviews.`,
            source: 'direct'
          };
        
        case 'reviews':
          return {
            answer: `Your business has **${businessDetails.review_count.toLocaleString()} reviews** on Yelp with an average rating of ${businessDetails.rating} stars.`,
            source: 'direct'
          };
        
        case 'hours':
          if (businessDetails.hours && businessDetails.hours[0]) {
            const today = new Date().getDay();
            const todayHours = businessDetails.hours[0].open.find(h => h.day === today);
            if (todayHours) {
              return {
                answer: `Today you're open from ${this.formatTime(todayHours.start)} to ${this.formatTime(todayHours.end)}.`,
                source: 'direct'
              };
            }
          }
          return {
            answer: `Hours information is available on your Yelp page at ${businessDetails.url}`,
            source: 'direct'
          };
        
        case 'phone':
          return {
            answer: `Your business phone number is **${businessDetails.display_phone || businessDetails.phone}**.`,
            source: 'direct'
          };
        
        case 'address':
          const addr = businessDetails.location;
          return {
            answer: `Your business is located at **${addr.address1}${addr.address2 ? ', ' + addr.address2 : ''}, ${addr.city}, ${addr.state} ${addr.zip_code}**.`,
            source: 'direct'
          };
        
        case 'price':
          const priceLevel = businessDetails.price || 'Not specified';
          return {
            answer: `Your business is listed as **${priceLevel}** price range on Yelp.`,
            source: 'direct'
          };
        
        default:
          return null;
      }
    } catch (error) {
      console.error('Direct answer extraction error:', error);
      return null;
    }
  }

  // Format time from military to standard
  formatTime(militaryTime) {
    const hours = parseInt(militaryTime.substring(0, 2));
    const minutes = militaryTime.substring(2);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const standardHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    return `${standardHours}:${minutes} ${ampm}`;
  }

  // Main query processing
  async query(userQuery, businessId, chatId = null) {
    try {
      console.log('Query_Agent: Processing query for business', businessId);
      
      // FIRST: Check for temporal/date-specific queries
      if (this.containsTemporalQuery(userQuery)) {
        console.log('Query_Agent: Temporal query detected, applying guardrail');
        
        // Extract the core topic they're asking about
        const coreTopic = this.extractCoreTopic(userQuery);
        
        // Create a general version of the question
        let generalQuestion;
        if (coreTopic === 'rating') {
          generalQuestion = 'What is the overall rating and what do customers say?';
        } else if (coreTopic === 'reviews') {
          generalQuestion = 'What themes and trends appear in customer reviews?';
        } else {
          generalQuestion = `What do customers say about ${coreTopic}?`;
        }
        
        // Get the general answer from Yelp AI
        const result = await yelpService.aiQuery(generalQuestion, businessId, chatId);
        
        // Prepend guardrail message
        const guardrailMessage = "I can't reliably filter reviews or ratings by specific dates or time periods. However, I can share what I know overall: ";
        
        return {
          answer: guardrailMessage + result.answer,
          chatId: result.chatId,
          entities: result.entities,
          source: 'yelp_ai_guardrail'
        };
      }
      
      // Check if this is a simple fact question
      const factType = this.detectFactQuestion(userQuery);
      
      if (factType) {
        // Extract direct answer from business data
        const directAnswer = await this.extractDirectAnswer(factType, businessId);
        if (directAnswer) {
          console.log('Query_Agent: Returning direct answer for', factType);
          return {
            answer: directAnswer.answer,
            chatId: chatId, // Maintain chat continuity
            source: 'direct'
          };
        }
      }
      
      // Not a simple fact, or extraction failed - use Yelp AI API
      console.log('Query_Agent: Using Yelp AI API for analytical query');
      const result = await yelpService.aiQuery(userQuery, businessId, chatId);
      
      return {
        answer: result.answer,
        chatId: result.chatId,
        entities: result.entities,
        source: 'yelp_ai'
      };
    } catch (error) {
      console.error('Query_Agent error:', error);
      throw error;
    }
  }
}

module.exports = new QueryAgent();