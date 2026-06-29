import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

router.get('/stages', (req, res) => {
  const stages = STAGES.map(s => ({
    key: s,
    label: s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    deals: db.prepare(`SELECT d.*, c.first_name || ' ' || c.last_name as contact_name,
      cmp.name as company_name FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN companies cmp ON d.company_id = cmp.id
      WHERE d.stage = ? ORDER BY d.updated_at DESC`).all(s)
  }));
  res.json(stages);
});

router.get('/', (req, res) => {
  const { stage, contact_id, company_id, search, limit = 200 } = req.query;
  let query = `SELECT d.*, c.first_name || ' ' || c.last_name as contact_name,
    cmp.name as company_name FROM deals d
    LEFT JOIN contacts c ON d.contact_id = c.id
    LEFT JOIN companies cmp ON d.company_id = cmp.id WHERE 1=1`;
  const params = [];

  if (stage) { query += ` AND d.stage = ?`; params.push(stage); }
  if (contact_id) { query += ` AND d.contact_id = ?`; params.push(contact_id); }
  if (company_id) { query += ` AND d.company_id = ?`; params.push(company_id); }
  if (search) { query += ` AND d.name LIKE ?`; params.push(`%${search}%`); }

  query += ` ORDER BY d.updated_at DESC LIMIT ?`;
  params.push(Number(limit));

  const deals = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as total FROM deals').get().total;
  const totalValue = db.prepare('SELECT SUM(value) as total FROM deals WHERE stage NOT IN (?, ?)').get('closed_lost', 'closed_won')?.total || 0;
  const wonValue = db.prepare('SELECT SUM(value) as total FROM deals WHERE stage = ?').get('closed_won')?.total || 0;

  res.json({ deals, total, totalValue, wonValue });
});

router.get('/:id', (req, res) => {
  const deal = db.prepare(`SELECT d.*, c.first_name || ' ' || c.last_name as contact_name, c.email as contact_email,
    cmp.name as company_name FROM deals d
    LEFT JOIN contacts c ON d.contact_id = c.id
    LEFT JOIN companies cmp ON d.company_id = cmp.id
    WHERE d.id = ?`).get(req.params.id);

  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const activities = db.prepare('SELECT * FROM activities WHERE deal_id = ? ORDER BY created_at DESC').all(req.params.id);
  const conversations = db.prepare('SELECT * FROM conversations WHERE deal_id = ? ORDER BY updated_at DESC').all(req.params.id);

  res.json({ ...deal, activities, conversations });
});

router.post('/', (req, res) => {
  const id = uuidv4();
  const { name, value, stage, contact_id, company_id, probability, expected_close, description, priority } = req.body;

  if (!name) return res.status(400).json({ error: 'Deal name is required' });

  db.prepare(`INSERT INTO deals (id, name, value, stage, contact_id, company_id, probability, expected_close, description, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, value || 0, stage || 'lead', contact_id || null, company_id || null, probability || 20, expected_close, description, priority || 'medium');

  const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(id);
  res.status(201).json(deal);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Deal not found' });

  const fields = ['name', 'value', 'stage', 'contact_id', 'company_id', 'probability', 'expected_close', 'description', 'lost_reason', 'priority'];
  const updates = [];
  const params = [];

  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  });

  if (req.body.stage === 'closed_won') {
    updates.push(`won_date = datetime('now')`);
  }

  updates.push(`updated_at = datetime('now')`);
  params.push(req.params.id);
  db.prepare(`UPDATE deals SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  res.json(deal);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM deals WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Deal not found' });
  res.json({ message: 'Deal deleted' });
});

export default router;
