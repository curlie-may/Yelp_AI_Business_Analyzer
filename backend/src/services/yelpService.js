const axios = require('axios');

class YelpService {
  constructor() {
    this.apiKey = process.env.YELP_API_KEY;
    this.baseURL = 'https://api.yelp.com/v3';
    this.aiURL = 'https://api.yelp.com/ai/chat/v2';
  }

  // Search for businesses by name and location (returns multiple results)
  async searchBusinessesByLocation(businessName, city, state) {
    try {
      console.log('=== YELP BUSINESS SEARCH ===');
      console.log('Business Name:', businessName);
      console.log('Location:', `${city}, ${state}`);
      
      const response = await axios.get(`${this.baseURL}/businesses/search`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        },
        params: {
          term: businessName,
          location: `${city}, ${state}`,
          limit: 10
        }
      });

      console.log('Found', response.data.businesses?.length || 0, 'business(es)');
      return response.data.businesses || [];
    } catch (error) {
      console.error('Yelp business search error:', error.response?.data || error.message);
      throw new Error('Failed to search businesses: ' + (error.response?.data?.error?.description || error.message));
    }
  }

  // Business Match API - find exact business with name, city, state, and optional phone/address
  async searchBusinessByMatch(businessName, city, state, phone = null, address = null) {
    try {
      console.log('=== YELP BUSINESS MATCH ===');
      console.log('Business Name:', businessName);
      console.log('City:', city);
      console.log('State:', state);
      console.log('Phone:', phone || 'not provided');
      console.log('Address:', address || 'not provided');
      
      const params = {
        name: businessName,
        city: city,
        state: state,
        country: 'US'
      };
      
      // Add optional parameters if provided
      if (phone) {
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        params.phone = `+1${cleanPhone}`;
      }
      
      if (address) {
        params.address1 = address;
      }

      const response = await axios.get(`${this.baseURL}/businesses/matches`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        },
        params: params
      });

      console.log('=== BUSINESS MATCH RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Businesses found:', response.data.businesses?.length || 0);

      if (response.data.businesses && response.data.businesses.length > 0) {
        console.log('Matched business:', response.data.businesses[0].name);
        return response.data.businesses[0];
      }
      
      throw new Error('Business not found with the provided information');
    } catch (error) {
      console.error('=== BUSINESS MATCH ERROR ===');
      console.error('Error:', error.response?.data || error.message);
      throw new Error('Failed to match business: ' + (error.response?.data?.error?.description || error.message));
    }
  }

  // Combined search strategy: Try Business Match first, fall back to regular search
  async findBusiness(businessName, city, state, phone = null, address = null) {
    try {
      // If phone or address provided, try Business Match for exact match
      if (phone || address) {
        console.log('Attempting Business Match with phone/address...');
        try {
          const business = await this.searchBusinessByMatch(businessName, city, state, phone, address);
          return { business, source: 'match' };
        } catch (error) {
          console.log('Business Match failed, falling back to search...');
        }
      }
      
      // Fall back to regular search (returns multiple results)
      console.log('Using regular search...');
      const businesses = await this.searchBusinessesByLocation(businessName, city, state);
      
      if (businesses.length === 0) {
        throw new Error('No businesses found matching your search');
      }
      
      // If we have phone/address, try to filter results
      if (phone || address) {
        const cleanPhone = phone ? phone.replace(/[\s\-\(\)]/g, '') : null;
        
        const filtered = businesses.filter(b => {
          const phoneMatch = cleanPhone && b.phone && b.phone.includes(cleanPhone);
          const addressMatch = address && b.location?.address1?.toLowerCase().includes(address.toLowerCase());
          return phoneMatch || addressMatch;
        });
        
        if (filtered.length === 1) {
          return { business: filtered[0], source: 'search_filtered' };
        } else if (filtered.length > 0) {
          return { businesses: filtered, source: 'search_filtered' };
        }
      }
      
      // Return all results for user to choose
      if (businesses.length === 1) {
        return { business: businesses[0], source: 'search' };
      }
      
      return { businesses, source: 'search' };
    } catch (error) {
      console.error('findBusiness error:', error);
      throw error;
    }
  }

  // Fallback: Search for a business by name and location (original method)
  async searchBusiness(businessName, location) {
    try {
      const response = await axios.get(`${this.baseURL}/businesses/search`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        },
        params: {
          term: businessName,
          location: location,
          limit: 1
        }
      });

      if (response.data.businesses && response.data.businesses.length > 0) {
        return response.data.businesses[0];
      }
      
      throw new Error('Business not found');
    } catch (error) {
      console.error('Yelp search error:', error.response?.data || error.message);
      throw new Error('Failed to search business: ' + error.message);
    }
  }

  // Get business details
  async getBusinessDetails(businessId) {
    try {
      const response = await axios.get(`${this.baseURL}/businesses/${businessId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Yelp business details error:', error.response?.data || error.message);
      throw new Error('Failed to get business details: ' + error.message);
    }
  }

  // Get business reviews
  async getBusinessReviews(businessId) {
    try {
      const response = await axios.get(`${this.baseURL}/businesses/${businessId}/reviews`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`
        },
        params: {
          limit: 50,
          sort_by: 'yelp_sort'
        }
      });

      return response.data.reviews;
    } catch (error) {
      console.error('Yelp reviews error:', error.response?.data || error.message);
      throw new Error('Failed to get reviews: ' + error.message);
    }
  }

  // Yelp AI API - Query with natural language
  async aiQuery(query, businessId, chatId = null, userContext = null) {
    try {
      const payload = {
        query: query
      };

      if (chatId) {
        payload.chat_id = chatId;
      }

      if (userContext) {
        payload.user_context = userContext;
      }

      // If we have a business context, include it in the query
      let enhancedQuery = query;
      if (businessId && !chatId) {
        const businessDetails = await this.getBusinessDetails(businessId);
        
        // Be more specific about which business to avoid "which location?" responses
        enhancedQuery = `Answer this question about the specific business "${businessDetails.name}" located at ${businessDetails.location.address1}, ${businessDetails.location.city} (Business ID: ${businessId}): ${query}`;
        payload.query = enhancedQuery;
        
        if (businessDetails.coordinates) {
          payload.user_context = {
            latitude: businessDetails.coordinates.latitude,
            longitude: businessDetails.coordinates.longitude,
            locale: 'en_US'
          };
        }
      }

      console.log('Yelp AI API request:', JSON.stringify(payload, null, 2));

      const response = await axios.post(this.aiURL, payload, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Yelp AI API response:', JSON.stringify(response.data, null, 2));

      return {
        answer: response.data.response?.text || response.data.response || 'No response available',
        chatId: response.data.chat_id,
        entities: response.data.entities || [],
        types: response.data.types || [],
        tags: response.data.response?.tags || []
      };
    } catch (error) {
      console.error('Yelp AI query error:', error.response?.data || error.message);
      throw new Error('Failed to query Yelp AI: ' + (error.response?.data?.error?.description || error.message));
    }
  }

  // Compare multiple businesses
  async compareBusinesses(businessIds, query) {
    try {
      const promises = businessIds.map(async (id) => {
        const businessDetails = await this.getBusinessDetails(id);
        const enhancedQuery = `Regarding ${businessDetails.name}: ${query}`;
        return this.aiQuery(enhancedQuery, id);
      });
      
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Business comparison error:', error);
      throw new Error('Failed to compare businesses: ' + error.message);
    }
  }
}

module.exports = new YelpService();