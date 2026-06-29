import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

interface TicketRow {
  id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  contact_id: string | null;
  company_id: string | null;
  deal_id: string | null;
  assigned_to: string | null;
  category: string | null;
  source: string;
  tags: string | null;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Ticket extends TicketRow {
  contact_name?: string;
  company_name?: string;
  deal_name?: string;
  comment_count?: number;
  tags_parsed?: string[];
}

function generateTicketNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `TKT-${ts}`;
}

function parseTicket(row: TicketRow & Record<string, unknown>): Ticket {
  return {
    ...row,
    tags_parsed: row.tags ? (row.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean) : []
  };
}

function getAIClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'sk-your-deepseek-api-key-here') return null;
  return { apiKey, model: process.env.DEEPSEEK_MODEL || 'deepseek-chat', baseURL: 'https://api.deepseek.com' };
}

async function callAI(prompt: string, systemPrompt: string): Promise<string | null> {
  const client = getAIClient();
  if (!client) return null;
  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: client.apiKey, baseURL: client.baseURL });
    const response = await openai.chat.completions.create({
      model: client.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    return response.choices[0].message.content;
  } catch {
    return null;
  }
}

// List tickets with filters
router.get('/', (req: Request, res: Response) => {
  const { status, priority, contact_id, company_id, search, category, assigned_to, limit = '100', offset = '0' } = req.query;
  let query = `SELECT t.*,
    c.first_name || ' ' || c.last_name as contact_name,
    cmp.name as company_name,
    d.name as deal_name,
    (SELECT COUNT(*) FROM ticket_comments WHERE ticket_id = t.id) as comment_count
    FROM tickets t
    LEFT JOIN contacts c ON t.contact_id = c.id
    LEFT JOIN companies cmp ON t.company_id = cmp.id
    LEFT JOIN deals d ON t.deal_id = d.id
    WHERE 1=1`;
  const params: unknown[] = [];

  if (status) { query += ` AND t.status = ?`; params.push(status); }
  if (priority) { query += ` AND t.priority = ?`; params.push(priority); }
  if (contact_id) { query += ` AND t.contact_id = ?`; params.push(contact_id); }
  if (company_id) { query += ` AND t.company_id = ?`; params.push(company_id); }
  if (category) { query += ` AND t.category = ?`; params.push(category); }
  if (assigned_to) { query += ` AND t.assigned_to = ?`; params.push(assigned_to); }
  if (search) {
    query += ` AND (t.subject LIKE ? OR t.ticket_number LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY
    CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
    t.updated_at DESC
    LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const tickets = db.prepare(query).all(...params) as (TicketRow & Record<string, unknown>)[];
  const total = (db.prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number }).count || 0;
  const stats = db.prepare(`
    SELECT status, COUNT(*) as count FROM tickets GROUP BY status
  `).all() as { status: string; count: number }[];

  const statusCounts: Record<string, number> = { open: 0, in_progress: 0, pending: 0, resolved: 0, closed: 0 };
  stats.forEach((s: { status: string; count: number }) => { statusCounts[s.status] = s.count; });

  res.json({ tickets: tickets.map(parseTicket), total, statusCounts });
});

// Get single ticket with comments
router.get('/:id', (req: Request, res: Response) => {
  const ticket = db.prepare(`SELECT t.*,
    c.first_name || ' ' || c.last_name as contact_name,
    c.email as contact_email,
    cmp.name as company_name,
    d.name as deal_name,
    (SELECT COUNT(*) FROM ticket_comments WHERE ticket_id = t.id) as comment_count
    FROM tickets t
    LEFT JOIN contacts c ON t.contact_id = c.id
    LEFT JOIN companies cmp ON t.company_id = cmp.id
    LEFT JOIN deals d ON t.deal_id = d.id
    WHERE t.id = ?`).get(req.params.id) as (TicketRow & Record<string, unknown>) | undefined;

  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const comments = db.prepare(
    'SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC'
  ).all(req.params.id);

  res.json({ ...parseTicket(ticket), comments });
});

// Create ticket
router.post('/', (req: Request, res: Response) => {
  const id = uuidv4();
  const ticket_number = generateTicketNumber();
  const { subject, description, contact_id, company_id, deal_id, priority, category, source, tags, assigned_to } = req.body;

  if (!subject) return res.status(400).json({ error: 'Subject is required' });

  const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || '');

  db.prepare(`INSERT INTO tickets (id, ticket_number, subject, description, status, priority, contact_id, company_id, deal_id, assigned_to, category, source, tags)
    VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, ticket_number, subject, description || '', priority || 'medium',
      contact_id || null, company_id || null, deal_id || null,
      assigned_to || null, category || null, source || 'web', tagsStr);

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as TicketRow;
  res.status(201).json(parseTicket(ticket));
});

// Update ticket
router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ticket not found' });

  const { subject, description, status, priority, contact_id, company_id, deal_id, assigned_to, category, source, tags, resolution } = req.body;
  const updates: string[] = [];
  const params: unknown[] = [];

  const fields: [string, unknown][] = [
    ['subject', subject], ['description', description], ['priority', priority],
    ['contact_id', contact_id], ['company_id', company_id], ['deal_id', deal_id],
    ['assigned_to', assigned_to], ['category', category], ['source', source],
    ['resolution', resolution]
  ];

  fields.forEach(([key, val]) => {
    if (val !== undefined) { updates.push(`${key} = ?`); params.push(val); }
  });

  if (tags !== undefined) {
    updates.push('tags = ?');
    params.push(Array.isArray(tags) ? tags.join(',') : tags);
  }

  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
    if (status === 'resolved' || status === 'closed') {
      updates.push("resolved_at = datetime('now')");
    }
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    params.push(req.params.id);
    db.prepare(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id) as TicketRow;
  res.json(parseTicket(ticket));
});

// Delete ticket
router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Ticket not found' });
  res.json({ message: 'Ticket deleted' });
});

// Quick status change
router.post('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status required' });

  const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ticket not found' });

  const updates: string[] = ["status = ?", "updated_at = datetime('now')"];
  const params: unknown[] = [status];

  if (status === 'resolved' || status === 'closed') {
    updates.push("resolved_at = datetime('now')");
  }

  params.push(req.params.id);
  db.prepare(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id) as TicketRow;
  res.json(parseTicket(ticket));
});

// Add comment
router.post('/:id/comments', (req: Request, res: Response) => {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const { content, author_type, is_internal } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  const commentId = uuidv4();
  db.prepare(`INSERT INTO ticket_comments (id, ticket_id, content, author_type, is_internal)
    VALUES (?, ?, ?, ?, ?)`)
    .run(commentId, req.params.id, content, author_type || 'user', is_internal ? 1 : 0);

  db.prepare("UPDATE tickets SET updated_at = datetime('now') WHERE id = ?").run(req.params.id);

  const comment = db.prepare('SELECT * FROM ticket_comments WHERE id = ?').get(commentId);
  res.status(201).json(comment);
});

// AI - Summarize ticket
router.post('/:id/summarize', async (req: Request, res: Response) => {
  const ticket = db.prepare(`SELECT t.*, c.first_name || ' ' || c.last_name as contact_name
    FROM tickets t LEFT JOIN contacts c ON t.contact_id = c.id WHERE t.id = ?`)
    .get(req.params.id) as (TicketRow & { contact_name: string }) | undefined;
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const comments = db.prepare('SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC').all(req.params.id);
  const thread = comments.map((c: { author_type: string; content: string }) => `${c.author_type}: ${c.content}`).join('\n');

  const prompt = `Summarize this support ticket:
Subject: ${ticket.subject}
Contact: ${ticket.contact_name || 'N/A'}
Priority: ${ticket.priority}
Status: ${ticket.status}
Description: ${ticket.description || 'N/A'}
Thread:
${thread}

Provide: 1) Brief summary 2) Current status 3) Recommended next action. Keep under 200 words.`;

  const summary = await callAI(prompt, 'You are a support team lead. Summarize tickets concisely.');
  res.json({ summary: summary || 'AI not configured. Set DEEPSEEK_API_KEY in server/.env' });
});

// AI - Suggest reply
router.post('/:id/suggest-reply', async (req: Request, res: Response) => {
  const ticket = db.prepare(`SELECT t.*, c.first_name || ' ' || c.last_name as contact_name
    FROM tickets t LEFT JOIN contacts c ON t.contact_id = c.id WHERE t.id = ?`)
    .get(req.params.id) as (TicketRow & { contact_name: string }) | undefined;
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const comments = db.prepare('SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC LIMIT 10').all(req.params.id);
  const thread = comments.map((c: { author_type: string; content: string }) => `${c.author_type}: ${c.content}`).join('\n');

  const prompt = `Draft a professional reply for this support ticket:
Subject: ${ticket.subject}
Contact: ${ticket.contact_name || 'customer'}
Description: ${ticket.description || 'N/A'}
Status: ${ticket.status}
Recent thread:
${thread}

Write a helpful, empathetic reply that addresses the issue. Keep it concise and professional.`;

  const reply = await callAI(prompt, 'You are a professional customer support agent. Write helpful replies.');
  res.json({ reply: reply || 'AI not configured. Set DEEPSEEK_API_KEY in server/.env' });
});

// Stats overview
router.get('/stats/overview', (req: Request, res: Response) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count,
      SUM(CASE WHEN priority = 'urgent' AND status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) as urgent_count,
      SUM(CASE WHEN priority = 'high' AND status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) as high_count
    FROM tickets
  `).get() as Record<string, number>;
  res.json(stats);
});

export default router;
