import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  prepareRun: vi.fn(),
  prepare: vi.fn(),
}));

vi.mock('../config/db.js', () => ({
  default: {
    prepare: mocks.prepare,
  },
}));

mocks.prepare.mockReturnValue({ run: mocks.prepareRun });

import { requestLogger } from './requestLogger.js';

const INSERT_SQL =
  'INSERT INTO request_logs (ip, count, last_activity) VALUES (?, 1, NOW()) ' +
  'ON DUPLICATE KEY UPDATE count = count + 1, last_activity = NOW()';

describe('requestLogger middleware', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prepareRun.mockResolvedValue({ changes: 1 });

    req = {
      ip: '192.168.1.1',
      headers: { 'x-forwarded-for': '203.0.113.1' },
      socket: { remoteAddress: '10.0.0.1' },
    };
    res = {};
    next = vi.fn();
  });

  it('calls db.prepare with INSERT ... ON DUPLICATE KEY UPDATE SQL', () => {
    requestLogger(req, res, next);
    expect(mocks.prepare).toHaveBeenCalledWith(INSERT_SQL);
  });

  it('passes req.ip as the only param', () => {
    requestLogger(req, res, next);
    expect(mocks.prepareRun).toHaveBeenCalledWith('192.168.1.1');
  });

  it('falls back to x-forwarded-for when req.ip is absent', () => {
    req.ip = undefined;
    requestLogger(req, res, next);
    expect(mocks.prepareRun).toHaveBeenCalledWith('203.0.113.1');
  });

  it('falls back to socket.remoteAddress when ip and x-forwarded-for are absent', () => {
    req.ip = undefined;
    req.headers['x-forwarded-for'] = undefined;
    requestLogger(req, res, next);
    expect(mocks.prepareRun).toHaveBeenCalledWith('10.0.0.1');
  });

  it('calls next() to continue middleware chain', () => {
    requestLogger(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('does not throw when db.prepare.run rejects', () => {
    mocks.prepareRun.mockRejectedValue(new Error('DB connection lost'));
    expect(() => requestLogger(req, res, next)).not.toThrow();
    expect(next).toHaveBeenCalled();
  });
});
