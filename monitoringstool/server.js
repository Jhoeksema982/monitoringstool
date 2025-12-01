import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Validation
import {
  questionSchema,
  questionUpdateSchema,
  uuidParamSchema,
  questionsQuerySchema,
  batchQuestionResponsesSchema,
  responsesQuerySchema,
  validateBody,
  validateParams,
  validateQuery
} from './validation/schemas.js';

// Supabase client
import supabase from './supabase/client.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
    });
  }
});

app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms) - IP: ${req.ip}`);
  });
  
  next();
});

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Helpers
function mapOrder(sortBy, sortOrder) {
  return { column: sortBy, ascending: String(sortOrder).toUpperCase() === 'ASC' };
}
// Auth middleware using Supabase JWT
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' });

    req.user = data.user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

function requireAdmin(req, res, next) {
  const raw = String(process.env.ADMIN_EMAILS || '')
    .trim();
  const allow = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = String(req.user?.email || '').toLowerCase();
  if (!allow.length || !allow.includes(email)) {
    // Helpful diagnostics in development
    if ((process.env.NODE_ENV || 'development') === 'development') {
      console.warn('Admin check failed:', { email, allowList: allow, rawEnv: raw });
    }
    return res.status(403).json({ 
      error: 'Forbidden',
      details: 'Email not in ADMIN_EMAILS on server',
    });
  }
  next();
}


async function testConnection() {
  try {
    const { error } = await supabase
      .from('questions')
      .select('id', { head: true, count: 'estimated' })
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (e) {
    console.error('❌ Supabase connection error:', e.message);
    return false;
  }
}

// API Routes with comprehensive security and validation

// Get all questions with pagination, filtering, and search
app.get('/api/questions', 
  validateQuery(questionsQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, category, status, priority, search, sortBy, sortOrder } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('questions')
        .select('uuid, title, description, category, priority, status, created_at, updated_at, created_by', { count: 'exact' });

      if (category) query = query.eq('category', category);
      if (status) query = query.eq('status', status);
      if (priority) query = query.eq('priority', priority);
      if (search) {
        const term = `%${search}%`;
        query = query.or(`title.ilike.${term},description.ilike.${term}`);
      }

      const { column, ascending } = mapOrder(sortBy, sortOrder);
      query = query.order(column, { ascending });

      // Pagination (range is inclusive)
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      const total = count || 0;
      res.json({
        data: data || [],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ 
        error: 'Failed to fetch questions',
        details: NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get single question by UUID
app.get('/api/questions/:uuid',
  validateParams(uuidParamSchema),
  async (req, res) => {
    try {
      const { uuid } = req.params;

      const { data, error } = await supabase
        .from('questions')
        .select('uuid, title, description, category, priority, status, created_at, updated_at, created_by')
        .eq('uuid', uuid)
        .single();

      if (error && error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Question not found' });
      }
      if (error) throw error;

      res.json({ data });
    } catch (error) {
      console.error('Error fetching question:', error);
      res.status(500).json({ 
        error: 'Failed to fetch question',
        details: NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Create new question
app.post('/api/questions',
  authenticate,
  requireAdmin,
  validateBody(questionSchema),
  async (req, res) => {
    try {
      const questionData = {
        uuid: uuidv4(),
        title: req.body.title,
        description: req.body.description || null,
        category: req.body.category || null,
        priority: req.body.priority || 'medium',
        status: req.body.status || 'active',
        created_by: req.body.created_by || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('questions')
        .insert(questionData)
        .select('uuid, title, description, category, priority, status, created_at, updated_at, created_by')
        .single();

      if (error) {
        if (String(error.message).toLowerCase().includes('duplicate')) {
          return res.status(409).json({ error: 'Question with this UUID already exists' });
        }
        throw error;
      }

      res.status(201).json({
        message: 'Question created successfully',
        data
      });
    } catch (error) {
      console.error('Error creating question:', error);
      res.status(500).json({ 
        error: 'Failed to create question',
        details: NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Update question
app.put('/api/questions/:uuid',
  authenticate,
  requireAdmin,
  validateParams(uuidParamSchema),
  validateBody(questionUpdateSchema.fork(['uuid'], (schema) => schema.forbidden())),
  async (req, res) => {
    try {
      const { uuid } = req.params;
      const updates = { ...req.body, updated_at: new Date().toISOString() };

      // Remove undefined keys
      Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const { data, error } = await supabase
        .from('questions')
        .update(updates)
        .eq('uuid', uuid)
        .select('uuid, title, description, category, priority, status, created_at, updated_at, created_by')
        .single();

      if (error && error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Question not found' });
      }
      if (error) throw error;

      res.json({
        message: 'Question updated successfully',
        data
      });
    } catch (error) {
      console.error('Error updating question:', error);
      res.status(500).json({ 
        error: 'Failed to update question',
        details: NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Delete question
app.delete('/api/questions/:uuid',
  authenticate,
  requireAdmin,
  validateParams(uuidParamSchema),
  async (req, res) => {
    try {
      const { uuid } = req.params;

const { error } = await supabase
        .from('questions')
        .delete()
        .eq('uuid', uuid)
        .select('uuid')
        .single();

      if (error && error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Question not found' });
      }
      if (error) throw error;

      res.json({ message: 'Question deleted successfully' });
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({ 
        error: 'Failed to delete question',
        details: NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// List responses with pagination and optional question filter
app.get('/api/responses',
  authenticate,
  requireAdmin,
  validateQuery(responsesQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, question_uuid } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('responses')
        .select('uuid, question_uuid, response_data, user_identifier, submission_uuid', { count: 'exact' });

      if (question_uuid) query = query.eq('question_uuid', question_uuid);

      // If created_at was removed, order by uuid as a stable fallback
      query = query.order('uuid', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      // Enrich with question titles
      const uuids = Array.from(new Set((data || []).map(r => r.question_uuid)));
      let titlesByUuid = {};
      if (uuids.length) {
        const { data: qData, error: qError } = await supabase
          .from('questions')
          .select('uuid, title')
          .in('uuid', uuids);
        if (qError) throw qError;
        titlesByUuid = Object.fromEntries((qData || []).map(q => [q.uuid, q.title]));
      }

      const enriched = (data || []).map(r => ({
        ...r,
        question_title: titlesByUuid[r.question_uuid] || null,
      }));

      const total = count || 0;
      res.json({
        data: enriched,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        }
      });
    } catch (error) {
      console.error('Error fetching responses:', error);
      res.status(500).json({
        error: 'Failed to fetch responses',
        details: NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Responses stats (aggregate per question and per response value)
app.get('/api/responses/stats',
  authenticate,
  requireAdmin,
  async (_req, res) => {
    try {
      // Fetch minimal fields and aggregate in app (portable and simple)
      const { data, error } = await supabase
        .from('responses')
        .select('question_uuid, response_data');

      if (error) throw error;

      const byQuestion = new Map();
      for (const row of data || []) {
        const qid = row.question_uuid;
        const value = (row.response_data && (row.response_data.value || row.response_data.label)) || null;
        if (!qid || !value) continue;
        if (!byQuestion.has(qid)) {
          byQuestion.set(qid, { total: 0, counts: {} });
        }
        const bucket = byQuestion.get(qid);
        bucket.total += 1;
        bucket.counts[value] = (bucket.counts[value] || 0) + 1;
      }

      // enrich with question titles
      const questionUuids = Array.from(byQuestion.keys());
      let titlesByUuid = {};
      if (questionUuids.length) {
        const { data: qData, error: qError } = await supabase
          .from('questions')
          .select('uuid, title')
          .in('uuid', questionUuids);
        if (qError) throw qError;
        titlesByUuid = Object.fromEntries((qData || []).map(q => [q.uuid, q.title]));
      }

      const results = questionUuids.map((qid) => ({
        question_uuid: qid,
        question_title: titlesByUuid[qid] || qid,
        total: byQuestion.get(qid).total,
        counts: byQuestion.get(qid).counts
      }));

      res.json({ data: results });
    } catch (error) {
      console.error('Error generating response stats:', error);
      res.status(500).json({
        error: 'Failed to generate response stats',
        details: NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Save responses (batch)
app.post('/api/responses',
  validateBody(batchQuestionResponsesSchema),
  async (req, res) => {
    try {
      const submissionUuid = uuidv4();
      const records = (req.body.responses || []).map(r => ({
        uuid: uuidv4(),
        submission_uuid: submissionUuid,
        question_uuid: r.question_uuid,
        response_data: r.response_data,
        user_identifier: r.user_identifier || null,
      }));

      const { error } = await supabase
        .from('responses')
        .insert(records);

      if (error) throw error;

      res.status(201).json({ message: 'Responses saved' });
    } catch (error) {
      console.error('Error saving responses:', error);
      res.status(500).json({ 
        error: 'Failed to save responses',
        details: NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Reorder questions (no-op placeholder so UI can "save order" without DB column)
app.post('/api/questions/reorder',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const order = Array.isArray(req.body?.order) ? req.body.order : [];
      // In case we later add a position column, validate payload shape minimally
      const isValid = order.every(it => typeof it?.uuid === 'string');
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid order payload' });
      }
      // Currently not persisted (no position column). Acknowledge request.
      return res.json({ message: 'Order accepted' });
    } catch (error) {
      console.error('Error reordering questions:', error);
      res.status(500).json({
        error: 'Failed to reorder questions',
        details: NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Health check endpoint with database status
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      environment: NODE_ENV,
      uptime: process.uptime()
    });
  } catch (_error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: 'Health check failed'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((error, req, res, _next) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    details: NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start server with proper error handling
async function startServer() {
  try {
    // Test database connection before starting server
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to Supabase. Server will not start.');
      process.exit(1);
    }
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔒 Security headers enabled`);
      console.log(`🛡️  Rate limiting active (${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per ${process.env.RATE_LIMIT_WINDOW_MS || 900000}ms)`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🔗 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    });
    
    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
      });
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };
    
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
