import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  const { search, status, company_id, limit = 100, offset = 0 } = req.query;
  let query = `
    SELECT c.*, cmp.name as company_name
    FROM contacts c
    LEFT JOIN companies cmp ON c.company_id = cmp.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    query += ` AND c.status = ?`;
    params.push(status);
  }
  if (company_id) {
    query += ` AND c.company_id = ?`;
    params.push(company_id);
  }

  query += ` ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const contacts = db.prepare(query).all(...params);
  const countRow = db.prepare('SELECT COUNT(*) as total FROM contacts').get();
  res.json({ contacts, total: countRow.total });
});

router.get('/:id', (req, res) => {
  const contact = db.prepare(`
    SELECT c.*, cmp.name as company_name
    FROM contacts c
    LEFT JOIN companies cmp ON c.company_id = cmp.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  const deals = db.prepare('SELECT * FROM deals WHERE contact_id = ?').all(req.params.id);
  const activities = db.prepare('SELECT * FROM activities WHERE contact_id = ? ORDER BY created_at DESC').all(req.params.id);
  const conversations = db.prepare('SELECT * FROM conversations WHERE contact_id = ? ORDER BY updated_at DESC').all(req.params.id);

  res.json({ ...contact, deals, activities, conversations });
});

router.post('/', (req, res) => {
  const id = uuidv4();
  const {
    first_name, last_name, email, phone, mobile, title, department,
    company_id, status, source, address, city, state, country,
    linkedin, notes
  } = req.body;

  db.prepare(`
    INSERT INTO contacts (id, first_name, last_name, email, phone, mobile, title, department,
      company_id, status, source, address, city, state, country, linkedin, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, first_name, last_name, email, phone, mobile, title, department,
    company_id || null, status || 'active', source, address, city, state, country, linkedin, notes);

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
  res.status(201).json(contact);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Contact not found' });

  const fields = [
    'first_name', 'last_name', 'email', 'phone', 'mobile', 'title', 'department',
    'company_id', 'status', 'source', 'address', 'city', 'state', 'country',
    'linkedin', 'notes'
  ];
  const updates = [];
  const params = [];

  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  });

  if (updates.length > 0) {
    updates.push(`updated_at = datetime('now')`);
    params.push(req.params.id);
    db.prepare(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  res.json(contact);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Contact not found' });
  res.json({ message: 'Contact deleted' });
});

export default router;
