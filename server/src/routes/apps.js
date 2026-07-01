import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken, generateApiToken, DEFAULT_ALL_PERMISSIONS } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// List all API tokens (masked)
router.get('/', async (req, res) => {
  try {
    const tokens = await db.prepare(`
      SELECT id, name, permissions, status, last_used, expires_at, created_at, updated_at
      FROM api_tokens ORDER BY created_at DESC
    `).all();

    const result = tokens.map(t => ({
      ...t,
      permissions: JSON.parse(t.permissions || '{}'),
      token_preview: null
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new API token
router.post('/', async (req, res) => {
  try {
    const { name, permissions, expires_at } = req.body;
    if (!name) return res.status(400).json({ error: 'Token name is required' });

    const id = uuidv4();
    const token = generateApiToken();

    const perms = permissions || DEFAULT_ALL_PERMISSIONS;

    await db.prepare(`INSERT INTO api_tokens (id, name, token, permissions, created_by, expires_at, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')`).run(
      id, name, token, JSON.stringify(perms),
      req.user?.id || req.apiToken?.id || null,
      expires_at || null
    );

    res.status(201).json({
      id, name, token,
      permissions: perms,
      status: 'active',
      expires_at: expires_at || null,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single token details
router.get('/:id', async (req, res) => {
  try {
    const token = await db.prepare('SELECT * FROM api_tokens WHERE id = ?').get(req.params.id);
    if (!token) return res.status(404).json({ error: 'Token not found' });

    res.json({
      ...token,
      permissions: JSON.parse(token.permissions || '{}'),
      token_preview: token.token.substring(0, 10) + '...' + token.token.substring(token.token.length - 8)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update token (name, permissions, status, expires_at)
router.put('/:id', async (req, res) => {
  try {
    const existing = await db.prepare('SELECT * FROM api_tokens WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Token not found' });

    const { name, permissions, status, expires_at } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (permissions !== undefined) { updates.push('permissions = ?'); params.push(JSON.stringify(permissions)); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (expires_at !== undefined) { updates.push('expires_at = ?'); params.push(expires_at); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(req.params.id);
      await db.prepare(`UPDATE api_tokens SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = await db.prepare('SELECT * FROM api_tokens WHERE id = ?').get(req.params.id);
    res.json({
      ...updated,
      permissions: JSON.parse(updated.permissions || '{}'),
      token_preview: updated.token.substring(0, 10) + '...' + updated.token.substring(updated.token.length - 8)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke/delete token
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.prepare("UPDATE api_tokens SET status = 'revoked', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Token not found' });
    res.json({ message: 'Token revoked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available permissions template
router.get('/permissions/template', async (req, res) => {
  try {
    res.json(DEFAULT_ALL_PERMISSIONS);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
