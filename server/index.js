import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Proxy Server is running' });
});

// API Proxy endpoint
app.post('/api/proxy', async (req, res) => {
  console.log("Step 2");
  try {
    const { baseUrl, endpoint, apiKey, method = 'GET', headers = {}, body } = req.body;

    // Validate required fields
    if (!baseUrl || !endpoint) {
      return res.status(400).json({
        success: false,
        error: 'baseUrl and endpoint are required'
      });
    }

    // Construct the full URL
    const fullUrl = baseUrl.endsWith('/') 
      ? `${baseUrl}${endpoint}` 
      : `${baseUrl}/${endpoint}`;

    console.log(`Making ${method} request to: ${fullUrl}`);

    // Prepare headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'API-Proxy-Server/1.0',
      ...headers,
    };

    // Add API key to headers if provided
    if (apiKey) {
      if (apiKey.startsWith('Bearer ')) {
        requestHeaders['Authorization'] = apiKey;
      } else {
        // Try multiple common API key header patterns
        requestHeaders['Authorization'] = `Bearer ${apiKey}`;
        requestHeaders['X-API-Key'] = apiKey;
        requestHeaders['API-Key'] = apiKey;
      }
    }

    // Prepare fetch options
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: requestHeaders,
    };

    // Add body for non-GET requests
    if (method.toUpperCase() !== 'GET' && body) {
      fetchOptions.body = JSON.stringify(body);
    }

    // Make the API request
    const apiResponse = await fetch(fullUrl, fetchOptions);
    
    // Get response text
    const responseText = await apiResponse.text();
    
    // Try to parse as JSON, fallback to text
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      parsedData = responseText;
    }

    // Extract response headers
    const responseHeaders = {};
    apiResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Send response back to client
    const response = {
      success: apiResponse.ok,
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      data: parsedData,
      headers: responseHeaders,
    };

    console.log(`Response status: ${apiResponse.status} ${apiResponse.statusText}`);
    
    res.json(response);

  } catch (error) {
    console.error('API Proxy Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Proxy endpoint: http://localhost:${PORT}/api/proxy`);
});

export default app;