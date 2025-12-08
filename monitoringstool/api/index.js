// Vercel serverless function wrapper
// This wraps the Express app from server.js to work on Vercel

import dotenv from 'dotenv';
import serverless from 'serverless-http';
import app from '../server.js';

// Load environment variables
dotenv.config();

// Wrap with serverless-http
const handler = serverless(app);

// Export for Vercel with explicit CORS header handling
export default async (req, res) => {
  // Add CORS headers explicitly for all responses
  const origin = req.headers.origin || '';
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());
  
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Pass to Express app
  return handler(req, res);
};
