const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const conversationRoutes = require('./routes/conversation');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // For handling audio data

// Routes
app.use('/api/conversation', conversationRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Yelp Business Analyzer API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  });
});

//****Use this section to run on local laptop. Commented out 20251215****** 
// Start server
//app.listen(PORT, () => {
//  console.log(`Server is running on port ${PORT}`);
//  console.log(`Health check: http://localhost:${PORT}/health`);
//});
//****************************

//Added this section 20251215 to run on phone
// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Network access: http://10.0.0.49:${PORT}/health`);
});