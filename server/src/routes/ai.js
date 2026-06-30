import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

function getDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'sk-your-deepseek-api-key-here') {
    return null;
  }
  return {
    apiKey,
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    baseURL: 'https://api.deepseek.com'
  };
}

async function callAI(prompt, systemPrompt = 'You are a helpful CRM assistant.') {
  const client = getDeepSeekClient();
  if (!client) {
    return 'AI is not configured. Please set your DEEPSEEK_API_KEY in server/.env';
  }

  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: client.apiKey,
      baseURL: client.baseURL
    });
    const response = await openai.chat.completions.create({
      model: client.model,
      messages: [
        { role: 'system', content: `You are an AI assistant embedded inside SmartCRM, a customer relationship management platform. Your purpose is strictly limited to CRM-related topics: sales pipelines, deal strategies, contact management, follow-ups, revenue insights, customer support tickets, invoices, workflows, email generation, meeting scheduling, and CRM best practices. You operate within the SmartCRM workspace and only have knowledge of the CRM data provided to you in the current conversation.

CRITICAL RULES:
1. NEVER discuss topics unrelated to CRM (no coding, no general knowledge, no jokes, no personal advice, no politics, no entertainment).
2. If a user asks about anything outside CRM context, politely decline and redirect them back to CRM topics.
3. Always be concise, professional, and actionable.
4. Do not mention your underlying model or training data.
5. Keep responses under 200 words unless the user explicitly asks for detail.
6. Base your answers on the CRM context provided. If no context is available, guide the user to provide relevant CRM data (deals, contacts, etc.).\n\n${systemPrompt}` },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    return response.choices[0].message.content;
  } catch (err) {
    return `AI Error: ${err.message}`;
  }
}

router.post('/chat', async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  let contextStr = '';
  if (context) {
    const { contact_id, company_id, deal_id } = context;
    if (contact_id) {
      const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contact_id);
      if (contact) contextStr += `\nContact: ${contact.first_name} ${contact.last_name} (${contact.email || 'no email'})`;
    }
    if (company_id) {
      const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(company_id);
      if (company) contextStr += `\nCompany: ${company.name} (${company.industry || 'no industry'})`;
    }
    if (deal_id) {
      const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(deal_id);
      if (deal) contextStr += `\nDeal: ${deal.name} at stage ${deal.stage}, value $${deal.value}`;
    }
  }

  const response = await callAI(
    `Context from CRM:${contextStr}\n\nUser message: ${message}`,
    'You are a CRM assistant for SmartCRM. Provide concise, actionable insights about sales, deals, contacts, and CRM workflows. Decline non-CRM questions.'
  );

  res.json({ response, context: contextStr });
});

router.post('/insights/deal', async (req, res) => {
  const { deal_id } = req.body;
  if (!deal_id) return res.status(400).json({ error: 'Deal ID required' });

  const deal = db.prepare(`SELECT d.*, c.first_name || ' ' || c.last_name as contact_name
    FROM deals d LEFT JOIN contacts c ON d.contact_id = c.id WHERE d.id = ?`).get(deal_id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const prompt = `Analyze this CRM deal and provide insights:
    Deal: ${deal.name}
    Value: $${deal.value}
    Stage: ${deal.stage}
    Probability: ${deal.probability}%
    Contact: ${deal.contact_name || 'N/A'}
    Description: ${deal.description || 'N/A'}

    Provide: 1) Win probability assessment 2) Next best actions 3) Risk factors 4) Recommended follow-up strategy. Keep it under 300 words.`;

  const insight = await callAI(prompt, 'You are a sales strategist for SmartCRM. Analyze deals and provide actionable next steps.');

  db.prepare('INSERT INTO ai_insights (id, entity_type, entity_id, insight_type, content) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), 'deal', deal_id, 'deal_analysis', insight);

  res.json({ insight });
});

router.post('/insights/contact', async (req, res) => {
  const { contact_id } = req.body;
  if (!contact_id) return res.status(400).json({ error: 'Contact ID required' });

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contact_id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  const deals = db.prepare('SELECT * FROM deals WHERE contact_id = ?').all(contact_id);

  const prompt = `Analyze this CRM contact:
    Name: ${contact.first_name} ${contact.last_name}
    Title: ${contact.title || 'N/A'}
    Company: ${contact.department || 'N/A'}
    Status: ${contact.status}
    Notes: ${contact.notes || 'N/A'}
    Active deals: ${deals.length}
    ${deals.length > 0 ? `Deal details: ${JSON.stringify(deals)}` : ''}

    Provide: 1) Engagement score assessment 2) Recommended next outreach 3) Relationship health 4) Upsell/cross-sell opportunities. Keep under 300 words.`;

  const insight = await callAI(prompt, 'You are a CRM relationship expert for SmartCRM. Analyze contacts and suggest engagement strategies.');

  db.prepare('INSERT INTO ai_insights (id, entity_type, entity_id, insight_type, content) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), 'contact', contact_id, 'contact_analysis', insight);

  res.json({ insight });
});

router.post('/generate-email', async (req, res) => {
  const { contact_id, deal_id, purpose } = req.body;

  let context = '';
  if (contact_id) {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contact_id);
    if (contact) context += `\nContact: ${contact.first_name} ${contact.last_name}, Title: ${contact.title || 'N/A'}, Company: ${contact.department || 'N/A'}`;
  }
  if (deal_id) {
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(deal_id);
    if (deal) context += `\nDeal: ${deal.name}, Stage: ${deal.stage}, Value: $${deal.value}`;
  }

  const prompt = `Generate a professional email for:${context}\n\nPurpose: ${purpose || 'general follow-up'}\n\nWrite a concise, personalized email. Include subject line.`;

  const email = await callAI(prompt, 'You are a business email writer for SmartCRM. Write concise, professional emails within CRM context only.');

  res.json({ email });
});

router.post('/summarize-conversation', async (req, res) => {
  const { conversation_id } = req.body;
  if (!conversation_id) return res.status(400).json({ error: 'Conversation ID required' });

  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversation_id);
  if (messages.length === 0) return res.status(404).json({ error: 'No messages found' });

  const transcript = messages.map(m => `${m.sender_type}: ${m.content}`).join('\n');
  const summary = await callAI(`Summarize this conversation:\n\n${transcript}\n\nProvide: Key points, action items, sentiment, and next steps.`);

  db.prepare('INSERT INTO ai_insights (id, entity_type, entity_id, insight_type, content) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), 'conversation', conversation_id, 'summary', summary);

  res.json({ summary });
});

router.get('/insights/:entityType/:entityId', (req, res) => {
  const insights = db.prepare('SELECT * FROM ai_insights WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC')
    .all(req.params.entityType, req.params.entityId);
  res.json(insights);
});

router.post('/predictive/scoring', async (req, res) => {
  const deals = db.prepare("SELECT * FROM deals WHERE stage NOT IN ('closed_won','closed_lost')").all();
  if (deals.length === 0) return res.json({ scored: [] });

  const dealList = deals.map(d => `- ${d.name}: $${d.value}, stage ${d.stage}, probability ${d.probability}%`).join('\n');
  const prompt = `Rank these open deals by likelihood to close, considering value, stage, and probability. Return as JSON array with fields: deal_name, score (1-100), reasoning:\n\n${dealList}`;

  const response = await callAI(prompt, 'You are a sales analytics expert for SmartCRM. Score deals based on CRM data. Return valid JSON only.');
  res.json({ scored: response });
});

export default router;
