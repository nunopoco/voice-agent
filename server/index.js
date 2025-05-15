const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it')();
const Retell = require('retell-sdk');
require('dotenv').config();

const { initializeDatabase } = require('./database/init');
const dbService = require('./database/service');

// Initialize Retell client
const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || 'your_retell_api_key',
});

// Initialize database
const db = initializeDatabase();

const app = express();
const PORT = process.env.PORT || 12000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = process.env.UPLOADS_PATH || './server/uploads';
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));

// Routes
app.get('/api/user', (req, res) => {
  let userId = req.cookies.userId;
  
  if (!userId) {
    userId = uuidv4();
    res.cookie('userId', userId, { 
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }
  
  res.json({ userId });
});

// Get conversation history
app.get('/api/conversations', async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const conversations = await dbService.getConversationHistory(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Save conversation message
app.post('/api/conversations', async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { message, role } = req.body;
    if (!message || !role) {
      return res.status(400).json({ error: 'Message and role are required' });
    }
    
    const id = await dbService.saveConversation(userId, message, role);
    res.status(201).json({ id, userId, message, role });
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Read the file content
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Convert to markdown (simplified version - in a real app, you'd use a proper parser based on file type)
    const markdownContent = `# File: ${req.file.originalname}\n\n\`\`\`\n${fileContent}\n\`\`\``;
    
    // Save file info to database
    await dbService.saveUploadedFile(userId, req.file.originalname, markdownContent);
    
    // Delete the file after processing
    fs.unlinkSync(filePath);
    
    res.status(201).json({ 
      message: 'File uploaded and processed successfully',
      filename: req.file.originalname
    });
  } catch (error) {
    console.error('Error processing file upload:', error);
    res.status(500).json({ error: 'Failed to process file upload' });
  }
});

// Get uploaded files
app.get('/api/uploads', async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const files = await dbService.getUploadedFiles(userId);
    res.json(files);
  } catch (error) {
    console.error('Error fetching uploaded files:', error);
    res.status(500).json({ error: 'Failed to fetch uploaded files' });
  }
});

// Create a web call with Retell
app.post('/api/call', async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get the agent ID from environment variables or request body
    const agentId = process.env.RETELL_AGENT_ID || req.body.agentId;
    
    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }
    
    try {
      console.log('Creating web call with agent ID');
      
      // Create a web call using Retell SDK
      const webCallResponse = await retellClient.call.createWebCall({ 
        agent_id: agentId,
        metadata: { userId }
      });
      
      if (!webCallResponse || !webCallResponse.access_token) {
        throw new Error('Invalid response from Retell API');
      }
      
      // Return the access token to the client
      res.status(201).json({ 
        accessToken: webCallResponse.access_token,
        callId: webCallResponse.call_id 
      });
    } catch (retellError) {
      console.error('Retell service error');
      
      // Check if it's a service unavailability error
      if (retellError.response && retellError.response.status === 503) {
        return res.status(503).json({ error: 'Retell service unavailable', details: 'The voice service is currently unavailable. Please try again later.' });
      }
      
      // Check for network errors or timeouts
      if (retellError.code === 'ECONNREFUSED' || retellError.code === 'ETIMEDOUT' || retellError.code === 'ENOTFOUND') {
        return res.status(503).json({ error: 'Retell service unavailable', details: 'Cannot connect to the voice service. Please try again later.' });
      }
      
      // For other errors
      res.status(500).json({ error: 'Failed to create web call', details: retellError.message || 'Unknown error' });
    }
  } catch (error) {
    console.error('Error in call endpoint');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if Retell service is available
app.get('/api/check-service', async (req, res) => {
  try {
    console.log('Checking Retell service availability...');
    
    // Simple check - if we have a valid API key, consider the service available
    if (!process.env.RETELL_API_KEY || process.env.RETELL_API_KEY === 'your_retell_api_key') {
      console.log('Retell API key not properly configured');
      // Return service unavailable
      return res.status(503).json({ 
        available: false, 
        error: 'Retell service unavailable',
        details: 'The voice service is currently unavailable. Please try again later.'
      });
    }
    
    // Note: We're not checking for Agent ID here since it might be provided in the request
    // when making a call. This allows the application to work even if RETELL_AGENT_ID
    // is not set in the environment variables.
    
    // If we get here, the service is considered available
    // In a production environment, you might want to make an actual API call to verify
    console.log('Retell service check passed');
    res.json({ available: true });
  } catch (error) {
    console.error('Retell service check failed');
    
    // Return service unavailable
    res.status(503).json({ 
      available: false, 
      error: 'Retell service unavailable',
      details: 'The voice service is currently unavailable. Please try again later.'
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});