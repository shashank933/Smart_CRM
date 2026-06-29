import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    db.prepare(
      'INSERT INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)'
    ).run(id, email, name, hashedPassword, 'user');

    const user = { id, email, name, role: 'user' };
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, avatar FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

router.put('/profile', authenticateToken, (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ error: 'User ID not found' });

    const { name, email, current_password, new_password } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (email !== undefined) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
      if (existing) return res.status(409).json({ error: 'Email already in use' });
      updates.push('email = ?'); params.push(email);
    }
    if (new_password) {
      if (!current_password) return res.status(400).json({ error: 'Current password required to change password' });
      const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId);
      if (!user || !bcrypt.compareSync(current_password, user.password)) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      updates.push('password = ?'); params.push(bcrypt.hashSync(new_password, 10));
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(userId);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = db.prepare('SELECT id, email, name, role, avatar FROM users WHERE id = ?').get(userId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/account', authenticateToken, (req, res) => {
  try {
    const userId = req.user?.id || req.apiToken?.id;
    if (!userId) return res.status(400).json({ error: 'User ID not found' });

    db.prepare('DELETE FROM api_tokens WHERE created_by = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
