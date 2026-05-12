// Full Vercel API route - all endpoints
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

const NODE_ENV = process.env.NODE_ENV || 'development';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' });
    req.user = data.user;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

function requireAdmin(req, res, next) {
  const email = String(req.user?.email || '').toLowerCase();
  if (!ADMIN_EMAILS.length || !ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({ error: 'Forbidden', details: 'Email not in ADMIN_EMAILS' });
  }
  next();
}

app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase.from('questions').select('id').limit(1);
    res.json({ status: error ? 'error' : 'OK', database: error ? 'disconnected' : 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'error', database: 'error', error: e.message });
  }
});

app.get('/api/questions', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(100, Math.max(1, parseInt(limit)));
    const { data, error, count } = await supabase
      .from('questions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Math.min(100, Math.max(1, parseInt(limit))) - 1);
    if (error) throw error;
    res.json({ data: data || [], pagination: { page: parseInt(page), limit: parseInt(limit), total: count || 0 } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/questions', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, priority, status, mode, type, options, age_group } = req.body;
    const { data, error } = await supabase.from('questions').insert({
      uuid: uuidv4(),
      title,
      description: description || null,
      category: category || null,
      priority: priority || 'medium',
      status: status || 'active',
      mode: mode || 'regular',
      type: type || 'smiley',
      options: options || null,
      age_group: age_group || 'all',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    res.status(201).json({ message: 'Question created', data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/questions/:uuid', authenticate, requireAdmin, async (req, res) => {
  try {
    const { uuid } = req.params;
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    ['uuid', 'created_at'].forEach(k => delete updates[k]);
    const { data, error } = await supabase.from('questions').update(updates).eq('uuid', uuid).select().single();
    if (error) throw error;
    res.json({ message: 'Question updated', data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/questions/:uuid', authenticate, requireAdmin, async (req, res) => {
  try {
    const { uuid } = req.params;
    const { error } = await supabase.from('questions').delete().eq('uuid', uuid);
    if (error) throw error;
    res.json({ message: 'Question deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/questions/reorder', authenticate, requireAdmin, async (req, res) => {
  try {
    const order = Array.isArray(req.body?.order) ? req.body.order : [];
    const isValid = order.every(it => typeof it?.uuid === 'string');
    if (!isValid) return res.status(400).json({ error: 'Invalid order payload' });
    const now = Date.now();
    for (const item of order) {
      const timestamp = new Date(now + item.position * 1000).toISOString();
      await supabase.from('questions').update({ created_at: timestamp }).eq('uuid', item.uuid);
    }
    res.json({ message: 'Order saved' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/responses/stats', async (req, res) => {
  try {
    const { location } = req.query;
    let query = supabase.from('responses').select('question_uuid, response_data, survey_type');
    if (location) {
      query = supabase
        .from('responses')
        .select('question_uuid, response_data, survey_type, submissions!inner(location)')
        .eq('submissions.location', location);
    }
    const { data, error } = await query;
    if (error) throw error;

    const byQuestionAndType = {};
    for (const row of data || []) {
      const qid = row.question_uuid;
      const sType = row.survey_type || 'regular';
      const value = row.response_data?.value || row.response_data?.label;
      if (!qid || !value) continue;
      const key = `${qid}__${sType}`;
      if (!byQuestionAndType[key]) byQuestionAndType[key] = { question_uuid: qid, survey_type: sType, total: 0, counts: {} };
      byQuestionAndType[key].total += 1;
      byQuestionAndType[key].counts[value] = (byQuestionAndType[key].counts[value] || 0) + 1;
    }

    const qIds = [...new Set(Object.values(byQuestionAndType).map(b => b.question_uuid))];
    let titles = {};
    if (qIds.length) {
      const { data: qData } = await supabase.from('questions').select('uuid, title').in('uuid', qIds);
      titles = Object.fromEntries((qData || []).map(q => [q.uuid, q.title]));
    }

    const results = Object.values(byQuestionAndType).map(b => ({
      question_uuid: b.question_uuid,
      question_title: titles[b.question_uuid] || b.question_uuid,
      survey_type: b.survey_type,
      total: b.total,
      counts: b.counts
    }));

    res.json({ data: results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/responses', async (req, res) => {
  try {
    const { responses, survey_type, location } = req.body;
    const submissionUuid = uuidv4();

    const { error: subError } = await supabase.from('submissions').insert({
      uuid: submissionUuid,
      survey_type: survey_type || 'regular',
      location: location || null,
      created_at: new Date().toISOString()
    });
    if (subError) throw subError;

    const records = (responses || []).map(r => ({
      uuid: uuidv4(),
      submission_uuid: submissionUuid,
      question_uuid: r.question_uuid,
      response_data: r.response_data,
      user_identifier: r.user_identifier || null,
      survey_type: survey_type || 'regular'
    }));

    const { error } = await supabase.from('responses').insert(records);
    if (error) throw error;

    res.status(201).json({ message: 'Responses saved', submission_uuid: submissionUuid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/submissions', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('submissions')
      .select('*, responses(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    res.json({
      data: data || [],
      pagination: {
        page, limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: (offset + limit) < (count || 0),
        hasPrev: page > 1
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/submissions/:uuid', authenticate, requireAdmin, async (req, res) => {
  try {
    const { uuid } = req.params;
    const { error } = await supabase.from('submissions').delete().eq('uuid', uuid);
    if (error) throw error;
    res.json({ message: 'Submission deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/submissions/export/csv', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, responses(uuid, question_uuid, response_data, user_identifier)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const allUuids = [...new Set((data || []).flatMap(sub => (sub.responses || []).map(r => r.question_uuid)))];
    let titles = {};
    if (allUuids.length) {
      const { data: qData } = await supabase.from('questions').select('uuid, title').in('uuid', allUuids);
      (qData || []).forEach(q => titles[q.uuid] = q.title);
    }

    const rows = [];
    for (const sub of (data || [])) {
      const date = new Date(sub.created_at).toLocaleString('nl-NL');
      const loc = sub.location || 'Onbekend';
      const type = sub.survey_type || 'regular';
      for (const r of (sub.responses || [])) {
        const questionTitle = titles[r.question_uuid] || 'Onbekende vraag';
        const answer = r.response_data?.label || r.response_data?.value || '';
        rows.push(`${date};${loc};${type};"${String(questionTitle).replace(/"/g, '""')}";"${String(answer).replace(/"/g, '""')}"`);
      }
    }

    const csv = '\uFEFFDatum;Locatie;Type;Vraag;Antwoord\n' + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="antwoorden_export.csv"');
    res.send(csv);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/locations', async (req, res) => {
  try {
    const { data, error } = await supabase.from('locations').select('name, gender').order('name');
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/locations', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, gender } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!['male', 'female'].includes(gender)) return res.status(400).json({ error: 'Gender must be male or female' });
    const { data, error } = await supabase.from('locations').insert({ name: name.trim(), gender }).select().single();
    if (error) {
      if (String(error.message).toLowerCase().includes('duplicate')) return res.status(409).json({ error: 'Location already exists' });
      throw error;
    }
    res.status(201).json({ message: 'Location created', data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/locations/:name', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name } = req.params;
    const { gender } = req.body;
    if (!['male', 'female'].includes(gender)) return res.status(400).json({ error: 'Gender must be male or female' });
    const { data, error } = await supabase.from('locations').update({ gender }).eq('name', name).select().single();
    if (error) throw error;
    res.json({ message: 'Location updated', data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/locations/:name', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name } = req.params;
    const { error } = await supabase.from('locations').delete().eq('name', name);
    if (error) throw error;
    res.json({ message: 'Location deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api', (req, res) => {
  res.json({ message: 'Monitoringstool API', version: '1.0' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

export default app;