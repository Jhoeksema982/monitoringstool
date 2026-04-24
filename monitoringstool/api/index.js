// Vercel API route
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || 'https://umlsadvlxhrlushowmef.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey || '', {
  auth: { persistSession: false, autoRefreshToken: false }
});

app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase.from('questions').select('id').limit(1);
    
    res.json({
      status: error ? 'error' : 'OK',
      database: error ? 'disconnected' : 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.json({ status: 'error', database: 'error', error: e.message });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Monitoringstool API', status: 'running' });
});

export default app;