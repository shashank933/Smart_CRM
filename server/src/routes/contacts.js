import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
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

    const contacts = await db.prepare(query).all(...params);
    const countRow = await db.prepare('SELECT COUNT(*) as total FROM contacts').get();
    res.json({ contacts, total: countRow.total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const contact = await db.prepare(`
      SELECT c.*, cmp.name as company_name
      FROM contacts c
      LEFT JOIN companies cmp ON c.company_id = cmp.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const deals = await db.prepare('SELECT * FROM deals WHERE contact_id = ?').all(req.params.id);
    const activities = await db.prepare('SELECT * FROM activities WHERE contact_id = ? ORDER BY created_at DESC').all(req.params.id);
    const conversations = await db.prepare('SELECT * FROM conversations WHERE contact_id = ? ORDER BY updated_at DESC').all(req.params.id);

    res.json({ ...contact, deals, activities, conversations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const id = uuidv4();
    const {
      first_name, last_name, email, phone, mobile, title, department,
      company_id, status, source, address, city, state, country,
      linkedin, notes
    } = req.body;

    await db.prepare(`
      INSERT INTO contacts (id, first_name, last_name, email, phone, mobile, title, department,
        company_id, status, source, address, city, state, country, linkedin, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, first_name, last_name, email, phone, mobile, title, department,
      company_id || null, status || 'active', source, address, city, state, country, linkedin, notes);

    const contact = await db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
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
      await db.prepare(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const contact = await db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
