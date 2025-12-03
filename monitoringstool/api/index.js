// Vercel serverless function wrapper
// This wraps the Express app from server.js to work on Vercel

import dotenv from 'dotenv';
import serverless from 'serverless-http';
import app from '../server.js';

// Load environment variables
dotenv.config();

// Export for Vercel
export default serverless(app);
