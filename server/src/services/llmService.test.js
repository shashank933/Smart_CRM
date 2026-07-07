import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  dbPrepareRun: vi.fn(),
  dbPrepare: vi.fn(),
  openaiCreate: vi.fn(),
  uuid: 'log-uuid-5678',
}));

vi.mock('../config/db.js', () => ({
  default: {
    prepare: mocks.dbPrepare,
  },
}));

vi.mock('uuid', () => ({ v4: () => mocks.uuid }));

vi.mock('openai', () => ({
  default: class {
    constructor(config) {
      this.config = config;
    }
    chat = {
      completions: {
        create: mocks.openaiCreate,
      },
    };
  },
}));

mocks.dbPrepare.mockReturnValue({ run: mocks.dbPrepareRun });

import { callLLM } from './llmService.js';

const LOG_SQL = 'INSERT INTO llm_logs (id, endpoint, model, system_prompt, user_prompt, temperature, max_tokens, response, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

describe('callLLM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dbPrepareRun.mockResolvedValue({ changes: 1 });
    process.env.DEEPSEEK_API_KEY = 'sk-test-key-123';
    process.env.DEEPSEEK_MODEL = 'deepseek-chat';
  });

  it('returns null when DEEPSEEK_API_KEY is not configured', async () => {
    process.env.DEEPSEEK_API_KEY = 'sk-your-deepseek-api-key-here';
    const result = await callLLM('test prompt', 'system prompt', { endpoint: 'test' });
    expect(result).toBeNull();
    expect(mocks.openaiCreate).not.toHaveBeenCalled();
  });

  it('calls OpenAI with correct model and messages', async () => {
    mocks.openaiCreate.mockResolvedValue({
      choices: [{ message: { content: 'LLM response' } }],
    });

    await callLLM('user prompt', 'system instruction', { endpoint: 'ai/chat' });

    expect(mocks.openaiCreate).toHaveBeenCalledWith({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'system instruction' },
        { role: 'user', content: 'user prompt' },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
  });

  it('respects custom temperature and maxTokens options', async () => {
    mocks.openaiCreate.mockResolvedValue({
      choices: [{ message: { content: 'response' } }],
    });

    await callLLM('p', 's', { temperature: 0.3, maxTokens: 1000, endpoint: 'test' });

    expect(mocks.openaiCreate).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0.3, max_tokens: 1000 })
    );
  });

  it('logs successful response to llm_logs table with ip', async () => {
    mocks.openaiCreate.mockResolvedValue({
      choices: [{ message: { content: 'success response' } }],
    });

    const result = await callLLM('user prompt', 'system prompt', {
      endpoint: 'ai/chat',
      temperature: 0.5,
      maxTokens: 500,
      ip: '192.168.1.1',
    });

    expect(result).toBe('success response');
    expect(mocks.dbPrepare).toHaveBeenCalledWith(LOG_SQL);
    expect(mocks.dbPrepareRun).toHaveBeenCalledWith(
      mocks.uuid, 'ai/chat', 'deepseek-chat', 'system prompt', 'user prompt', 0.5, 500, 'success response', '192.168.1.1'
    );
  });

  it('logs null response and null ip on OpenAI error', async () => {
    mocks.openaiCreate.mockRejectedValue(new Error('API error'));

    const result = await callLLM('user prompt', 'system prompt', {
      endpoint: 'error-test',
      temperature: 0.7,
      maxTokens: 2000,
    });

    expect(result).toBeNull();
    expect(mocks.dbPrepareRun).toHaveBeenCalledWith(
      mocks.uuid, 'error-test', 'deepseek-chat', 'system prompt', 'user prompt', 0.7, 2000, null, null
    );
  });

  it('defaults endpoint to "unknown" and ip to null when not provided', async () => {
    mocks.openaiCreate.mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    });

    await callLLM('p', 's');

    expect(mocks.dbPrepareRun).toHaveBeenCalledWith(
      expect.any(String), 'unknown', expect.any(String), expect.any(String), expect.any(String), 0.7, 2000, 'ok', null
    );
  });
});
