import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

function generateInvoiceNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  return `INV-${ts}`;
}

router.get('/', (req, res) => {
  const { status, contact_id, company_id, search, limit = 100 } = req.query;
  let query = `SELECT i.*, c.first_name || ' ' || c.last_name as contact_name,
    cmp.name as company_name FROM invoices i
    LEFT JOIN contacts c ON i.contact_id = c.id
    LEFT JOIN companies cmp ON i.company_id = cmp.id WHERE 1=1`;
  const params = [];

  if (status) { query += ` AND i.status = ?`; params.push(status); }
  if (contact_id) { query += ` AND i.contact_id = ?`; params.push(contact_id); }
  if (company_id) { query += ` AND i.company_id = ?`; params.push(company_id); }
  if (search) { query += ` AND i.invoice_number LIKE ?`; params.push(`%${search}%`); }

  query += ` ORDER BY i.created_at DESC LIMIT ?`;
  params.push(Number(limit));

  const invoices = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as total FROM invoices').get().total;
  const totalRevenue = db.prepare('SELECT SUM(total) as total FROM invoices WHERE status = ?').get('paid')?.total || 0;
  const outstanding = db.prepare('SELECT SUM(total) as total FROM invoices WHERE status IN (?, ?)').get('sent', 'overdue')?.total || 0;

  res.json({ invoices, total, totalRevenue, outstanding });
});

router.get('/:id', (req, res) => {
  const invoice = db.prepare(`SELECT i.*, c.first_name || ' ' || c.last_name as contact_name, c.email as contact_email,
    cmp.name as company_name FROM invoices i
    LEFT JOIN contacts c ON i.contact_id = c.id
    LEFT JOIN companies cmp ON i.company_id = cmp.id
    WHERE i.id = ?`).get(req.params.id);

  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
  res.json({ ...invoice, items });
});

router.post('/', (req, res) => {
  const id = uuidv4();
  const invoice_number = generateInvoiceNumber();
  const { contact_id, company_id, issue_date, due_date, subtotal, tax_rate, tax_amount, discount, total, currency, notes, items } = req.body;

  db.prepare(`INSERT INTO invoices (id, invoice_number, contact_id, company_id, status, issue_date, due_date, subtotal, tax_rate, tax_amount, discount, total, currency, notes)
    VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, invoice_number, contact_id || null, company_id || null, issue_date, due_date, subtotal || 0, tax_rate || 0, tax_amount || 0, discount || 0, total || 0, currency || 'USD', notes);

  if (items && items.length > 0) {
    const insertItem = db.prepare('INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)');
    items.forEach(item => {
      insertItem.run(uuidv4(), id, item.description, item.quantity || 1, item.unit_price || 0, item.total || 0);
    });
  }

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  res.status(201).json(invoice);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Invoice not found' });

  const fields = ['contact_id', 'company_id', 'status', 'issue_date', 'due_date', 'subtotal', 'tax_rate', 'tax_amount', 'discount', 'total', 'currency', 'notes'];
  const updates = [];
  const params = [];

  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  });

  if (req.body.status === 'paid') {
    updates.push(`paid_at = datetime('now')`);
  }

  updates.push(`updated_at = datetime('now')`);
  params.push(req.params.id);
  db.prepare(`UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  if (req.body.items) {
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);
    const insertItem = db.prepare('INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)');
    req.body.items.forEach(item => {
      insertItem.run(uuidv4(), req.params.id, item.description, item.quantity || 1, item.unit_price || 0, item.total || 0);
    });
  }

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
  res.json({ ...invoice, items });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ message: 'Invoice deleted' });
});

export default router;
