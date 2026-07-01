import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { contact_id, company_id, deal_id, status, channel } = req.query;
    let query = `SELECT conv.*, c.first_name || ' ' || c.last_name as contact_name,
      cmp.name as company_name, d.name as deal_name
      FROM conversations conv
      LEFT JOIN contacts c ON conv.contact_id = c.id
      LEFT JOIN companies cmp ON conv.company_id = cmp.id
      LEFT JOIN deals d ON conv.deal_id = d.id WHERE 1=1`;
    const params = [];

    if (contact_id) { query += ` AND conv.contact_id = ?`; params.push(contact_id); }
    if (company_id) { query += ` AND conv.company_id = ?`; params.push(company_id); }
    if (deal_id) { query += ` AND conv.deal_id = ?`; params.push(deal_id); }
    if (status) { query += ` AND conv.status = ?`; params.push(status); }
    if (channel) { query += ` AND conv.channel = ?`; params.push(channel); }

    query += ` ORDER BY conv.updated_at DESC LIMIT 100`;

    const conversations = await db.prepare(query).all(...params);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const conversation = await db.prepare(`SELECT conv.*, c.first_name || ' ' || c.last_name as contact_name,
      cmp.name as company_name, d.name as deal_name
      FROM conversations conv
      LEFT JOIN contacts c ON conv.contact_id = c.id
      LEFT JOIN companies cmp ON conv.company_id = cmp.id
      LEFT JOIN deals d ON conv.deal_id = d.id
      WHERE conv.id = ?`).get(req.params.id);

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const messages = await db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json({ ...conversation, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const id = uuidv4();
    const { contact_id, company_id, deal_id, subject, channel, initial_message } = req.body;

    await db.prepare(`INSERT INTO conversations (id, contact_id, company_id, deal_id, subject, channel, last_message, last_message_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(id, contact_id || null, company_id || null, deal_id || null, subject || '', channel || 'email', initial_message || '');

    if (initial_message) {
      await db.prepare(`INSERT INTO messages (id, conversation_id, sender_type, content) VALUES (?, ?, 'user', ?)`).run(uuidv4(), id, initial_message);
    }

    const conversation = await db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const conversation = await db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const { content, sender_type } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content required' });

    const msgId = uuidv4();
    await db.prepare(`INSERT INTO messages (id, conversation_id, sender_type, content, is_ai_generated) VALUES (?, ?, ?, ?, ?)`)
      .run(msgId, req.params.id, sender_type || 'user', content, sender_type === 'ai' ? 1 : 0);

    await db.prepare(`UPDATE conversations SET last_message = ?, last_message_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
      .run(content, req.params.id);

    const message = await db.prepare('SELECT * FROM messages WHERE id = ?').get(msgId);
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Conversation not found' });

    const fields = ['contact_id', 'company_id', 'deal_id', 'subject', 'channel', 'status'];
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
      await db.prepare(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const conversation = await db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
