import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  const { contact_id, company_id, deal_id, type, status, limit = 50 } = req.query;
  let query = `SELECT a.*, c.first_name || ' ' || c.last_name as contact_name,
    d.name as deal_name, cmp.name as company_name
    FROM activities a
    LEFT JOIN contacts c ON a.contact_id = c.id
    LEFT JOIN deals d ON a.deal_id = d.id
    LEFT JOIN companies cmp ON a.company_id = cmp.id WHERE 1=1`;
  const params = [];

  if (contact_id) { query += ` AND a.contact_id = ?`; params.push(contact_id); }
  if (company_id) { query += ` AND a.company_id = ?`; params.push(company_id); }
  if (deal_id) { query += ` AND a.deal_id = ?`; params.push(deal_id); }
  if (type) { query += ` AND a.type = ?`; params.push(type); }
  if (status) { query += ` AND a.status = ?`; params.push(status); }

  query += ` ORDER BY a.created_at DESC LIMIT ?`;
  params.push(Number(limit));

  res.json(db.prepare(query).all(...params));
});

// Calendar events by date range
router.get('/calendar', (req, res) => {
  const { start, end } = req.query;
  let query = `SELECT a.*, c.first_name || ' ' || c.last_name as contact_name,
    d.name as deal_name, cmp.name as company_name
    FROM activities a
    LEFT JOIN contacts c ON a.contact_id = c.id
    LEFT JOIN deals d ON a.deal_id = d.id
    LEFT JOIN companies cmp ON a.company_id = cmp.id
    WHERE a.due_date IS NOT NULL`;
  const params = [];

  if (start) { query += ` AND a.due_date >= ?`; params.push(start); }
  if (end) { query += ` AND a.due_date <= ?`; params.push(end); }

  query += ` ORDER BY a.due_date ASC LIMIT 200`;

  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const id = uuidv4();
  const { type, subject, description, contact_id, company_id, deal_id, status, due_date } = req.body;

  if (!type || !subject) return res.status(400).json({ error: 'Type and subject required' });

  db.prepare(`INSERT INTO activities (id, type, subject, description, contact_id, company_id, deal_id, status, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, type, subject, description, contact_id || null, company_id || null, deal_id || null, status || 'pending', due_date);

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  res.status(201).json(activity);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Activity not found' });

  const fields = ['type', 'subject', 'description', 'contact_id', 'company_id', 'deal_id', 'status', 'due_date'];
  const updates = [];
  const params = [];

  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  });

  if (req.body.status === 'completed') {
    updates.push(`completed_at = datetime('now')`);
  }

  updates.push(`updated_at = datetime('now')`);
  params.push(req.params.id);
  db.prepare(`UPDATE activities SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  res.json(db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Activity not found' });
  res.json({ message: 'Activity deleted' });
});

export default router;
