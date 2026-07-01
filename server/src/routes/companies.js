import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { search, industry, limit = 100, offset = 0 } = req.query;
    let query = `SELECT c.*, (SELECT COUNT(*) FROM contacts WHERE company_id = c.id) as contact_count,
      (SELECT COUNT(*) FROM deals WHERE company_id = c.id) as deal_count
      FROM companies c WHERE 1=1`;
    const params = [];

    if (search) {
      query += ` AND (c.name LIKE ? OR c.industry LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (industry) {
      query += ` AND c.industry = ?`;
      params.push(industry);
    }

    query += ` ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const companies = await db.prepare(query).all(...params);
    const total = (await db.prepare('SELECT COUNT(*) as total FROM companies').get()).total;
    res.json({ companies, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const company = await db.prepare(`SELECT c.*,
      (SELECT COUNT(*) FROM contacts WHERE company_id = c.id) as contact_count,
      (SELECT COUNT(*) FROM deals WHERE company_id = c.id) as deal_count
      FROM companies c WHERE c.id = ?`).get(req.params.id);

    if (!company) return res.status(404).json({ error: 'Company not found' });

    const contacts = await db.prepare('SELECT * FROM contacts WHERE company_id = ?').all(req.params.id);
    const deals = await db.prepare('SELECT * FROM deals WHERE company_id = ?').all(req.params.id);
    const activities = await db.prepare('SELECT * FROM activities WHERE company_id = ? ORDER BY created_at DESC').all(req.params.id);
    const invoices = await db.prepare('SELECT * FROM invoices WHERE company_id = ? ORDER BY created_at DESC').all(req.params.id);

    res.json({ ...company, contacts, deals, activities, invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const id = uuidv4();
    const { name, industry, size, website, phone, address, city, state, country, revenue, description, linkedin } = req.body;

    if (!name) return res.status(400).json({ error: 'Company name is required' });

    await db.prepare(`INSERT INTO companies (id, name, industry, size, website, phone, address, city, state, country, revenue, description, linkedin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, name, industry, size, website, phone, address, city, state, country, revenue || 0, description, linkedin);

    const company = await db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Company not found' });

    const fields = ['name', 'industry', 'size', 'website', 'phone', 'address', 'city', 'state', 'country', 'revenue', 'description', 'linkedin'];
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
      await db.prepare(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const company = await db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.prepare('DELETE FROM companies WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Company not found' });
    res.json({ message: 'Company deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
