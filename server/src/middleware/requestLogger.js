import db from '../config/db.js';

export function requestLogger(req, _res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  db.prepare(
    'INSERT INTO request_logs (ip, count, last_activity) VALUES (?, 1, NOW()) ' +
    'ON DUPLICATE KEY UPDATE count = count + 1, last_activity = NOW()'
  ).run(ip)
    .catch(() => {});
  next();
}
