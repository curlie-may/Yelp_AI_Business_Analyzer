const express = require('express');
const router = express.Router();
const yelpService = require('../services/yelpService');

// Search for businesses with Business Match strategy
router.post('/search-business', async (req, res) => {
  try {
    const { businessName, city, state, phone, address } = req.body;

    // Validate required fields
    if (!businessName || !city || !state) {
      return res.status(400).json({ 
        error: 'Missing required fields: businessName, city, and state' 
      });
    }

    console.log('Searching for business:', businessName, 'in', city, state);
    if (phone) console.log('Phone provided:', phone);
    if (address) console.log('Address provided:', address);

    // Use the combined search strategy
    const result = await yelpService.findBusiness(businessName, city, state, phone, address);

    // Single business found (exact match)
    if (result.business) {
      console.log('Single business found:', result.business.name);
      return res.json({
        success: true,
        business: {
          id: result.business.id,
          name: result.business.name,
          rating: result.business.rating,
          review_count: result.business.review_count,
          location: result.business.location,
          phone: result.business.phone,
          display_phone: result.business.display_phone,
          image_url: result.business.image_url,
          coordinates: result.business.coordinates
        }
      });
    }

    // Multiple businesses found - return list for user to choose
    if (result.businesses && result.businesses.length > 0) {
      console.log('Multiple businesses found:', result.businesses.length);
      return res.json({
        success: true,
        businesses: result.businesses.map(b => ({
          id: b.id,
          name: b.name,
          rating: b.rating,
          review_count: b.review_count,
          location: b.location,
          phone: b.phone,
          display_phone: b.display_phone,
          image_url: b.image_url,
          coordinates: b.coordinates
        }))
      });
    }

    // No businesses found
    return res.status(404).json({ 
      error: 'No businesses found matching your search criteria.' 
    });

  } catch (error) {
    console.error('Business search error:', error);
    res.status(500).json({ 
      error: 'Failed to search for business. Please try again.',
      details: error.message 
    });
  }
});

module.exports = router;