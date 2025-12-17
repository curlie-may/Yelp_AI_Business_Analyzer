import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

const Login = ({ onLogin }) => {
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('CA');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  // US states for dropdown
  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearchResults([]);

    try {
      const response = await api.searchBusiness(businessName, city, state, phone, address);
      
      if (response.success) {
        if (response.businesses && response.businesses.length > 1) {
          // Multiple results - show list for user to pick
          setSearchResults(response.businesses);
        } else if (response.businesses && response.businesses.length === 1) {
          // Single result - auto-login
          selectBusiness(response.businesses[0]);
        } else if (response.business) {
          // Direct match from Business Match API
          selectBusiness(response.business);
        } else {
          setError('No businesses found. Please check your search criteria.');
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || 'Business not found. Please try different search criteria.');
    } finally {
      setLoading(false);
    }
  };

  const selectBusiness = (business) => {
    // Store business info in session
    sessionStorage.setItem('businessId', business.id);
    sessionStorage.setItem('businessName', business.name);
    sessionStorage.setItem('businessData', JSON.stringify(business));
    
    const userId = 'user_' + Date.now();
    sessionStorage.setItem('userId', userId);
    
    // Call the onLogin callback to update App.jsx state
    if (onLogin) {
      onLogin(userId, business);
    }
    
    // Navigate to home
    navigate('/');
  };

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Yelp AI Business Analyzer</h1>
        <p className="subtitle">Find insights from your reviews</p>
        
        {searchResults.length === 0 ? (
          <form onSubmit={handleSearch} className="login-form">
            <div className="form-group">
              <label htmlFor="businessName">
                Business Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., Handy Plumbing Man"
                required
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">
                  City <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., San Carlos"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">
                  State <span className="required">*</span>
                </label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  disabled={loading}
                >
                  {US_STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(650) 649-6304"
                disabled={loading}
                maxLength={14}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Street Address</label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 1011 American St"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || !businessName || !city || !state}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        ) : (
          <div className="search-results">
            <h2>Select Your Business</h2>
            <p className="results-count">Found {searchResults.length} location{searchResults.length > 1 ? 's' : ''}</p>
            
            <div className="business-list">
              {searchResults.map((business, index) => (
                <div 
                  key={business.id || index} 
                  className="business-item"
                  onClick={() => selectBusiness(business)}
                >
                  <div className="business-info">
                    <h3>{business.name}</h3>
                    <p className="business-address">
                      {business.location?.address1}
                      {business.location?.city && `, ${business.location.city}`}
                      {business.location?.state && `, ${business.location.state}`}
                      {business.location?.zip_code && ` ${business.location.zip_code}`}
                    </p>
                    {business.display_phone && (
                      <p className="business-phone">📞 {business.display_phone}</p>
                    )}
                    {business.rating && (
                      <p className="business-rating">
                        ⭐ {business.rating} ({business.review_count} reviews)
                      </p>
                    )}
                  </div>
                  <div className="business-arrow">→</div>
                </div>
              ))}
            </div>

            <button 
              className="back-button"
              onClick={() => setSearchResults([])}
            >
              ← Back to Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;