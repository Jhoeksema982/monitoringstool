import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

// Validation
import Joi from 'joi';
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
import supabase from '../supabase/client.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Runtime flags to detect which optional columns exist on `questions`.
const optionalQuestionColumns = {
  mode: false,
  type: false,
  options: false,
  age_group: false,
  gender: false,
};

function questionSelectFields() {
  const base = ['uuid', 'title', 'description', 'category', 'priority', 'status', 'created_at', 'updated_at', 'created_by'];
  if (optionalQuestionColumns.mode) base.splice(5, 0, 'mode');
  if (optionalQuestionColumns.type) base.splice(6, 0, 'type');
  if (optionalQuestionColumns.options) base.splice(7, 0, 'options');
  if (optionalQuestionColumns.age_group) base.splice(8, 0, 'age_group');
  if (optionalQuestionColumns.gender) base.splice(9, 0, 'gender');
  return base.join(', ');
}

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

// CORS configuration - allow all origins in production for serverless
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? true : (process.env.CORS_ORIGIN || 'http://localhost:3000'),
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
    // detect which optional columns exist on the questions table
    for (const col of Object.keys(optionalQuestionColumns)) {
      try {
        const { error: colErr } = await supabase
          .from('questions')
          .select(col)
          .limit(1);
        optionalQuestionColumns[col] = !colErr;
      } catch {
        optionalQuestionColumns[col] = false;
      }
    }
    console.log('optional columns present:', optionalQuestionColumns);
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
        const { page, limit, category, status, priority, search, sortBy, sortOrder, mode, gender } = req.query;
      const offset = (page - 1) * limit;

        let query = supabase
          .from('questions')
          .select(questionSelectFields(), { count: 'exact' });

      if (category) query = query.eq('category', category);
      if (status) query = query.eq('status', status);
      if (priority) query = query.eq('priority', priority);
      if (mode) {
        if (optionalQuestionColumns.mode) {
          query = query.eq('mode', mode);
        } else {
          // Column not present: treat legacy rows as `regular`.
          if (mode !== 'regular') {
            // No rows will match this non-regular mode when column is missing.
            return res.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: page > 1 } });
          }
          // mode === 'regular' and column missing -> no filter needed (all legacy rows are regular)
        }
      }
      if (gender) {
        if (optionalQuestionColumns.gender) {
          // gender=all means: show questions for this gender AND questions with gender=all
          if (gender === 'all') {
            query = query.in('gender', ['all', 'male', 'female']);
          } else {
            query = query.in('gender', [gender, 'all']);
          }
        }
      }
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
        .select(questionSelectFields())
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
        mode: req.body.mode || 'regular',
        type: req.body.type || 'smiley',
        options: req.body.options || null,
        age_group: req.body.age_group || 'all',
        created_by: req.body.created_by || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Strip columns that don't exist in the database
      for (const col of ['mode', 'type', 'options', 'age_group', 'gender']) {
        if (!optionalQuestionColumns[col]) delete questionData[col];
      }

      const { data, error } = await supabase
        .from('questions')
        .insert(questionData)
        .select(questionSelectFields())
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

      // Strip columns that don't exist in the database
      for (const col of ['mode', 'type', 'options', 'age_group', 'gender']) {
        if (!optionalQuestionColumns[col] && Object.prototype.hasOwnProperty.call(updates, col)) {
          delete updates[col];
        }
      }

      const { data, error } = await supabase
        .from('questions')
        .update(updates)
        .eq('uuid', uuid)
        .select(questionSelectFields())
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

// GET Submissions (Groups) - NEW ENDPOINT FOR ADMIN
app.get('/api/submissions', 
  authenticate,
  requireAdmin,
  validateQuery(Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    survey_type: Joi.string().valid('regular', 'ouder_kind', 'extra_vader_kind').optional(),
  })),
  async (req, res) => {
    try {
      const { page, limit, survey_type } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('submissions')
        .select('*, responses(uuid, question_uuid, response_data, user_identifier)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (survey_type) {
        query = query.eq('survey_type', survey_type);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const allResponseUuids = (data || []).flatMap(sub => sub.responses.map(r => r.question_uuid));
      const uniqueQ_Uuids = [...new Set(allResponseUuids)];
      
      let titlesMap = {};
      if (uniqueQ_Uuids.length > 0) {
        const { data: qData } = await supabase
          .from('questions')
          .select('uuid, title')
          .in('uuid', uniqueQ_Uuids);
        (qData || []).forEach(q => titlesMap[q.uuid] = q.title);
      }

      const enrichedData = data.map(sub => ({
        ...sub,
        responses: sub.responses.map(r => ({
          ...r,
          question_title: titlesMap[r.question_uuid] || 'Onbekende vraag'
        }))
      }));

      res.json({
        data: enrichedData,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: (offset + limit) < (count || 0),
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  }
);

// Locations API
app.get('/api/locations', async (req, res) => {
  try {
    const { data, error } = await supabase.from('locations').select('name, gender').order('name');
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

app.post('/api/locations',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { name, gender } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
      if (!['male', 'female'].includes(gender)) return res.status(400).json({ error: 'Gender must be male or female' });
      const { data, error } = await supabase.from('locations').insert({ name: name.trim(), gender }).select().single();
      if (error) {
        if (String(error.message).toLowerCase().includes('duplicate')) {
          return res.status(409).json({ error: 'Location already exists' });
        }
        throw error;
      }
      res.status(201).json({ message: 'Location created', data });
    } catch (error) {
      console.error('Error creating location:', error);
      res.status(500).json({ error: 'Failed to create location' });
    }
  }
);

app.delete('/api/locations/:name',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { name } = req.params;
      const { error } = await supabase.from('locations').delete().eq('name', name);
      if (error) throw error;
      res.json({ message: 'Location deleted' });
    } catch (error) {
      console.error('Error deleting location:', error);
      res.status(500).json({ error: 'Failed to delete location' });
    }
  }
);

app.put('/api/locations/:name',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { name } = req.params;
      const { gender } = req.body;
      if (!['male', 'female'].includes(gender)) return res.status(400).json({ error: 'Gender must be male or female' });
      const { data, error } = await supabase.from('locations').update({ gender }).eq('name', name).select().single();
      if (error) throw error;
      res.json({ message: 'Location updated', data });
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  }
);

// Export all submissions as CSV
app.get('/api/submissions/export/csv',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      let query = supabase
        .from('submissions')
        .select('*, responses(uuid, question_uuid, response_data, user_identifier)')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Fetch question titles
      const allUuids = [...new Set((data || []).flatMap(sub => (sub.responses || []).map(r => r.question_uuid)))];
      let titles = {};
      if (allUuids.length) {
        const { data: qData } = await supabase
          .from('questions')
          .select('uuid, title')
          .in('uuid', allUuids);
        (qData || []).forEach(q => titles[q.uuid] = q.title);
      }

      // Build CSV rows
      const header = 'Datum;Locatie;Type;Vraag;Antwoord';
      const rows = [];
      for (const sub of (data || [])) {
        const date = new Date(sub.created_at).toLocaleString('nl-NL');
        const loc = sub.location || 'Onbekend';
        const type = sub.survey_type || 'regular';
        for (const r of (sub.responses || [])) {
          const questionTitle = titles[r.question_uuid] || 'Onbekende vraag';
          const answer = r.response_data?.label || r.response_data?.value || '';
          // Escape quotes for CSV
          const escapedAnswer = String(answer).replace(/"/g, '""');
          const escapedQuestion = String(questionTitle).replace(/"/g, '""');
          rows.push(`${date};${loc};${type};"${escapedQuestion}";"${escapedAnswer}"`);
        }
      }

      const csv = '\uFEFF' + header + '\n' + rows.join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="antwoorden_export.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      res.status(500).json({ error: 'Failed to export CSV' });
    }
  }
);

// List responses (OLD - kept for compatibility/stats if needed)
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
        .select('uuid, question_uuid, response_data, user_identifier, submission_uuid, survey_type', { count: 'exact' });

      if (question_uuid) query = query.eq('question_uuid', question_uuid);

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

// Responses stats
app.get('/api/responses/stats',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { location } = req.query;

      // Begin met de query op responses
      let query = supabase.from('responses');

      // NIEUW: Filter logica toevoegen
      if (location) {
        // We gebruiken !inner om te forceren dat de response bij een submission hoort 
        // die de opgegeven locatie heeft.
        query = query
          .select('question_uuid, response_data, survey_type, submissions!inner(location)')
          .eq('submissions.location', location);
      } else {
        // Geen locatie gekozen? Haal alles op
        query = query.select('question_uuid, response_data, survey_type');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by question AND survey_type
      const byQuestionAndType = new Map();
      for (const row of data || []) {
        const qid = row.question_uuid;
        const sType = row.survey_type || 'regular';
        const value = (row.response_data && (row.response_data.value || row.response_data.label)) || null;
        if (!qid || !value) continue;
        const key = `${qid}__${sType}`;
        if (!byQuestionAndType.has(key)) {
          byQuestionAndType.set(key, { question_uuid: qid, survey_type: sType, total: 0, counts: {} });
        }
        const bucket = byQuestionAndType.get(key);
        bucket.total += 1;
        bucket.counts[value] = (bucket.counts[value] || 0) + 1;
      }

      // enrich with question titles
      const questionUuids = Array.from(new Set([...byQuestionAndType.values()].map(b => b.question_uuid)));
      let titlesByUuid = {};
      if (questionUuids.length) {
        const { data: qData, error: qError } = await supabase
          .from('questions')
          .select('uuid, title')
          .in('uuid', questionUuids);
        if (qError) throw qError;
        titlesByUuid = Object.fromEntries((qData || []).map(q => [q.uuid, q.title]));
      }

      const results = [...byQuestionAndType.values()].map((bucket) => ({
        question_uuid: bucket.question_uuid,
        question_title: titlesByUuid[bucket.question_uuid] || bucket.question_uuid,
        survey_type: bucket.survey_type,
        total: bucket.total,
        counts: bucket.counts
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

// Save responses (batch) - UPDATED FOR LOCATION
app.post('/api/responses',
  validateBody(batchQuestionResponsesSchema),
  async (req, res) => {
    try {
      const submissionUuid = uuidv4();
      const surveyType = req.body.survey_type || 'regular';
      // NIEUW: Haal locatie op uit request
      const location = req.body.location || null;

      // 1. EERST: Maak de submission (groep) aan in de database MET locatie
      const { error: subError } = await supabase
        .from('submissions')
        .insert({
          uuid: submissionUuid,
          survey_type: surveyType,
          location: location, 
          created_at: new Date().toISOString()
        });

      if (subError) throw subError;

      // 2. DAARNA: Koppel de antwoorden aan deze submission
      const records = (req.body.responses || []).map(r => ({
        uuid: uuidv4(),
        submission_uuid: submissionUuid, 
        question_uuid: r.question_uuid,
        response_data: r.response_data,
        user_identifier: r.user_identifier || null,
        survey_type: surveyType,
      }));

      const { error } = await supabase
        .from('responses')
        .insert(records);

      if (error) throw error;

      res.status(201).json({ message: 'Responses saved', submission_uuid: submissionUuid });
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
let lastDbStatus = 'unknown';
app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase.from('questions').select('id', { head: true, count: 'estimated' }).limit(1);
    lastDbStatus = error ? 'disconnected' : 'connected';
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: lastDbStatus,
      environment: NODE_ENV,
      uptime: process.uptime()
    });
  } catch {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: 'Health check failed'
    });
  }
});

// 404 handler
// Serve static build when in production or when explicitly enabled
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.SERVE_STATIC === 'true' || (process.env.NODE_ENV || 'development') === 'production') {
  const staticPath = path.join(__dirname, 'dist');
  app.use(express.static(staticPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(staticPath, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

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

// Export the Express app so serverless wrappers can import it.
export default app;

// Only start the server when this file is executed directly (node server.js).
// When imported by serverless platforms (Vercel), the default export will be used.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}