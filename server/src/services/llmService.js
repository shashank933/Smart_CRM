import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';

function getClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'sk-your-deepseek-api-key-here') return null;
  return {
    apiKey,
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    baseURL: 'https://api.deepseek.com'
  };
}

export async function callLLM(prompt, systemPrompt, options = {}) {
  const { temperature = 0.7, maxTokens = 2000, endpoint = 'unknown', ip = null } = options;
  const client = getClient();
  if (!client) return null;

  const LOG_SQL = 'INSERT INTO llm_logs (id, endpoint, model, system_prompt, user_prompt, temperature, max_tokens, response, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: client.apiKey, baseURL: client.baseURL });

    const response = await openai.chat.completions.create({
      model: client.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: maxTokens
    });

    const output = response.choices[0].message.content;

    db.prepare(LOG_SQL)
      .run(uuidv4(), endpoint, client.model, systemPrompt, prompt, temperature, maxTokens, output, ip)
      .catch(() => {});

    return output;
  } catch {
    db.prepare(LOG_SQL)
      .run(uuidv4(), endpoint, client.model, systemPrompt, prompt, temperature, maxTokens, null, ip)
      .catch(() => {});
    return null;
  }
}
