import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDb } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smart-crm-secret-key-change-in-production';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function generateApiToken() {
  return 'crmsk_' + crypto.randomBytes(32).toString('hex');
}

const DEFAULT_ALL_PERMISSIONS = {
  contacts: { read: true, write: true, delete: true },
  companies: { read: true, write: true, delete: true },
  deals: { read: true, write: true, delete: true },
  invoices: { read: true, write: true, delete: true },
  conversations: { read: true, write: true, delete: true },
  tickets: { read: true, write: true, delete: true }
};

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // API token (prefixed with crmsk_)
  if (token.startsWith('crmsk_')) {
    try {
      const db = getDb();
      const apiToken = db.prepare(
        "SELECT * FROM api_tokens WHERE token = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > datetime('now'))"
      ).get(token);

      if (!apiToken) {
        return res.status(403).json({ error: 'Invalid or expired API token' });
      }

      try {
        db.prepare("UPDATE api_tokens SET last_used = datetime('now') WHERE id = ?").run(apiToken.id);
      } catch (_) {}

      req.user = null;
      req.apiToken = {
        id: apiToken.id,
        name: apiToken.name,
        permissions: JSON.parse(apiToken.permissions || '{}')
      };
      return next();
    } catch (err) {
      return res.status(403).json({ error: 'Invalid API token' });
    }
  }

  // JWT token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.apiToken = null;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requirePermission(resource, action) {
  return (req, res, next) => {
    if (req.user) {
      return next();
    }

    if (req.apiToken && req.apiToken.permissions) {
      const perms = req.apiToken.permissions[resource];
      if (perms && perms[action]) {
        return next();
      }
      return res.status(403).json({
        error: `API token lacks permission: ${action} on ${resource}`
      });
    }

    return res.status(401).json({ error: 'Authentication required' });
  };
}

export function apiTokenOnly(req, res, next) {
  if (req.apiToken) {
    return next();
  }
  return res.status(403).json({ error: 'This endpoint requires an API token' });
}

export { DEFAULT_ALL_PERMISSIONS };
