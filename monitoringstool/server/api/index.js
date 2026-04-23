// Vercel serverless function handler
// Routes all /api/* requests through the Express app

import dotenv from 'dotenv';
import app from '../server.js';

// Load environment variables
dotenv.config();

// Export handler for Vercel
export default app;
