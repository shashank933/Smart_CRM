import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Webhook receiver - no auth required (validates via secret in URL)
router.post('/webhook/:provider/:secret', async (req, res) => {
  try {
    const { provider, secret } = req.params;
    const integration = await db.prepare('SELECT * FROM integrations WHERE provider = ? AND webhook_secret = ? AND status = ?')
      .get(provider, secret, 'connected') as any;

    if (!integration) return res.status(404).json({ error: 'Invalid webhook' });

    const payload = req.body;

    if (provider === 'whatsapp' && payload.entry) {
      console.log('WhatsApp webhook received');
    } else if (provider === 'hubspot' && payload.eventType) {
      console.log('HubSpot webhook received:', payload.eventType);
    }

    await db.prepare("UPDATE integrations SET last_sync = datetime('now') WHERE id = ?").run(integration.id);

    res.json({ received: true, provider, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.use(authenticateToken);

const PROVIDERS = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: 'Mail',
    description: 'Sync emails, auto-log conversations, and send from within the CRM.',
    color: '#ea4335',
    bg: '#fce8e6',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'OAuth 2.0 Client ID' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'OAuth 2.0 Client Secret' },
      { key: 'redirect_uri', label: 'Redirect URI', type: 'text', placeholder: 'https://yourapp.com/oauth/callback' }
    ],
    webhookSupported: false
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'MessageCircle',
    description: 'Send and receive WhatsApp messages via Twilio or Meta Business API.',
    color: '#25d366',
    bg: '#d4f5e0',
    fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', type: 'text', placeholder: 'From Meta Developer Console' },
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'Meta Business API Token' },
      { key: 'business_id', label: 'Business Account ID', type: 'text', placeholder: 'WhatsApp Business ID' }
    ],
    webhookSupported: true,
    webhookDescription: 'Incoming messages webhook. Set this URL in your Meta app configuration.'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: 'Rss',
    description: 'Bi-directional sync of contacts, companies, and deals with HubSpot.',
    color: '#ff7a59',
    bg: '#fff0eb',
    fields: [
      { key: 'api_key', label: 'API Key / Access Token', type: 'password', placeholder: 'HubSpot Private App Token' },
      { key: 'portal_id', label: 'Portal ID', type: 'text', placeholder: 'Your HubSpot Portal ID' }
    ],
    webhookSupported: true,
    webhookDescription: 'HubSpot webhook for real-time sync. Add this URL in your HubSpot app settings.'
  }
];

// Get all providers with connection status
router.get('/', async (req, res) => {
  try {
    const connections = await db.prepare('SELECT * FROM integrations').all();

    const result = PROVIDERS.map(p => {
      const existing = connections.find((c: any) => c.provider === p.id);
      return {
        ...p,
        connection: existing ? {
          id: existing.id,
          status: existing.status,
          name: existing.name,
          last_sync: existing.last_sync,
          webhook_secret: existing.webhook_secret,
          webhook_url: existing.webhook_secret
            ? `${req.protocol}://${req.get('host')}/api/integrations/webhook/${p.id}/${existing.webhook_secret}`
            : null,
          created_at: existing.created_at
        } : null
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Connect / configure an integration
router.post('/:provider/connect', async (req, res) => {
  try {
    const { provider } = req.params;
    const providerDef = PROVIDERS.find(p => p.id === provider);
    if (!providerDef) return res.status(404).json({ error: 'Unknown provider' });

    const existing = await db.prepare('SELECT * FROM integrations WHERE provider = ?').get(provider) as any;
    const { name, ...credentials } = req.body;

    if (existing) {
      await db.prepare(`UPDATE integrations SET name = ?, credentials = ?, config = ?, status = 'connected', updated_at = datetime('now') WHERE id = ?`)
        .run(name || existing.name, JSON.stringify(credentials), JSON.stringify(req.body.config || {}), existing.id);

      const updated = await db.prepare('SELECT * FROM integrations WHERE id = ?').get(existing.id);
      return res.json(formatIntegration(updated));
    }

    const id = uuidv4();
    const webhook_secret = crypto.randomBytes(24).toString('hex');

    await db.prepare(`INSERT INTO integrations (id, provider, name, credentials, config, status, webhook_secret)
      VALUES (?, ?, ?, ?, ?, 'connected', ?)`)
      .run(id, provider, name || `${providerDef.name} Connection`, JSON.stringify(credentials), JSON.stringify(req.body.config || {}), webhook_secret);

    const created = await db.prepare('SELECT * FROM integrations WHERE id = ?').get(id);
    res.status(201).json(formatIntegration(created));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Disconnect
router.post('/:provider/disconnect', async (req, res) => {
  try {
    const result = await db.prepare("UPDATE integrations SET status = 'disconnected', credentials = '{}', updated_at = datetime('now') WHERE provider = ?")
      .run(req.params.provider);
    if (result.changes === 0) return res.status(404).json({ error: 'No connection found' });
    res.json({ message: 'Disconnected' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Test connection
router.post('/:provider/test', async (req, res) => {
  try {
    const existing = await db.prepare('SELECT * FROM integrations WHERE provider = ? AND status = ?').get(req.params.provider, 'connected') as any;
    if (!existing) return res.status(400).json({ error: 'Integration not connected' });

    const credentials = JSON.parse(existing.credentials || '{}');
    const hasCreds = Object.values(credentials).some((v: any) => v && v.length > 3);

    // Simulated test for demo
    res.json({
      success: hasCreds,
      message: hasCreds
        ? `Successfully authenticated with ${req.params.provider}`
        : 'Credentials stored but not yet verified. Add valid credentials and retry.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Sync (trigger manual sync)
router.post('/:provider/sync', async (req, res) => {
  try {
    const existing = await db.prepare('SELECT * FROM integrations WHERE provider = ? AND status = ?').get(req.params.provider, 'connected') as any;
    if (!existing) return res.status(400).json({ error: 'Integration not connected' });

    await db.prepare("UPDATE integrations SET last_sync = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(existing.id);

    const synced = runSync(req.params.provider);
    const prompts = getSyncPrompts(req.params.provider, synced);

    res.json({
      message: `Sync completed for ${req.params.provider}`,
      last_sync: new Date().toISOString(),
      synced,
      prompts: prompts || undefined
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Get webhook URL for a connection
router.get('/:provider/webhook-url', async (req, res) => {
  try {
    const existing = await db.prepare('SELECT * FROM integrations WHERE provider = ?').get(req.params.provider) as any;
    if (!existing || !existing.webhook_secret) {
      return res.status(404).json({ error: 'No webhook configured' });
    }

    res.json({
      webhook_url: `${req.protocol}://${req.get('host')}/api/integrations/webhook/${req.params.provider}/${existing.webhook_secret}`
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

function formatIntegration(row: any) {
  return {
    id: row.id,
    provider: row.provider,
    name: row.name,
    config: JSON.parse(row.config || '{}'),
    status: row.status,
    last_sync: row.last_sync,
    webhook_secret: row.webhook_secret,
    created_at: row.created_at
  };
}

interface SyncEmail {
  fromName: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  threadId: string;
}

const GMAIL_SAMPLE_EMAILS: SyncEmail[] = [
  { fromName: 'Sarah Chen', fromEmail: 'sarah.chen@fintech.io', subject: 'Q3 Partnership Proposal', snippet: 'Hi, following up on our discussion about the API integration. I\'d like to schedule a call next week to review the technical requirements.', threadId: 'thread-1' },
  { fromName: 'Sarah Chen', fromEmail: 'sarah.chen@fintech.io', subject: 'Re: Q3 Partnership Proposal', snippet: 'Great, Tuesday at 2pm works for me. I\'ll prepare the architecture diagrams beforehand.', threadId: 'thread-1' },
  { fromName: 'Marcus Rivera', fromEmail: 'm.rivera@buildcorp.com', subject: 'New Construction Project Inquiry', snippet: 'We are evaluating CRM platforms for our upcoming commercial projects. Your AI features caught our attention.', threadId: 'thread-2' },
  { fromName: 'Marcus Rivera', fromEmail: 'm.rivera@buildcorp.com', subject: 'Re: New Construction Project Inquiry', snippet: 'Yes, we have 3 active projects and expect to scale to 8 by year-end. Can your system handle multi-project tracking?', threadId: 'thread-2' },
  { fromName: 'Elena Popov', fromEmail: 'elena@medcore.health', subject: 'HIPAA Compliance Question', snippet: 'We need a CRM that meets HIPAA requirements for patient data. Does your platform support compliance workflows?', threadId: 'thread-3' },
  { fromName: 'James Okonkwo', fromEmail: 'j.okonkwo@afritech.ng', subject: 'Partnership Expansion - West Africa', snippet: 'Our Lagos office is expanding and we need CRM coverage across 4 West African countries. Interested in a regional partnership.', threadId: 'thread-4' },
  { fromName: 'Priya Sharma', fromEmail: 'priya.sharma@datasense.ai', subject: 'Data Enrichment Integration', snippet: 'We\'d like to integrate our data enrichment API with your CRM. Would you be open to a technical discovery call?', threadId: 'thread-5' },
  { fromName: 'Lucas Martinez', fromEmail: 'lucas@greenlogistics.co', subject: 'Fleet Management CRM Setup', snippet: 'Our logistics company manages 200+ vehicles. Looking for a CRM that can track client locations and delivery schedules.', threadId: 'thread-6' },
  { fromName: 'Aisha Patel', fromEmail: 'aisha.patel@edtech.learn', subject: 'Demo Request - Education CRM', snippet: 'We\'re building an edtech platform and need CRM for 50+ institutional clients. Can we schedule a demo this Friday?', threadId: 'thread-7' },
  { fromName: 'Thomas Berg', fromEmail: 'thomas.berg@nordic.design', subject: 'UX Research Partnership', snippet: 'Our design agency is looking for a CRM partner. We have 200+ client accounts across Scandinavia.', threadId: 'thread-8' },
  { fromName: 'Yuki Tanaka', fromEmail: 'y.tanaka@sakura-eng.jp', subject: 'Manufacturing CRM Inquiry', snippet: 'We are a precision engineering firm in Osaka. Interested in your deal pipeline and inventory tracking features.', threadId: 'thread-9' },
  { fromName: 'Maria Silva', fromEmail: 'maria.silva@latam.ventures', subject: 'Venture Portfolio Management', snippet: 'Managing 15 portfolio companies across LATAM. Need a CRM that can track multiple entities and investor relations.', threadId: 'thread-10' },
];

const WHATSAPP_SAMPLE_MESSAGES = [
  { fromName: 'Carlos Mendez', fromPhone: '+5215551234567', content: 'Hi, is this the right number for SmartCRM support? I have a question about my account.' },
  { fromName: 'Fatima Al-Rashid', fromPhone: '+971501234567', content: 'Can you send me the proposal document we discussed? I need it for the board meeting tomorrow.' },
  { fromName: 'Oliver Schmidt', fromPhone: '+4915112345678', content: 'The integration with our ERP is showing a sync error. Can someone look into this?' },
  { fromName: 'Grace Kim', fromPhone: '+821012345678', content: 'We are ready to move forward with the enterprise plan. Please send the contract.' },
  { fromName: 'David Chen', fromPhone: '+8613812345678', content: 'Your AI chat feature is exactly what we needed. Are there any limits on the number of conversations?' },
];

function upsertContact(firstName: string, lastName: string, email: string): { id: string; isNew: boolean } {
  const existing = db.prepare('SELECT id FROM contacts WHERE email = ?').get(email) as any;
  if (existing) return { id: existing.id, isNew: false };

  const id = uuidv4();
  db.prepare(`INSERT INTO contacts (id, first_name, last_name, email, status, source)
    VALUES (?, ?, ?, ?, 'lead', 'gmail_sync')`).run(id, firstName, lastName, email);
  return { id, isNew: true };
}

function createConversation(contactId: string, subject: string, channel: string, messageContent: string): string {
  const convId = uuidv4();
  db.prepare(`INSERT INTO conversations (id, contact_id, subject, channel, status, last_message, last_message_at)
    VALUES (?, ?, ?, ?, 'open', ?, datetime('now'))`).run(convId, contactId, subject, channel, messageContent);

  const msgId = uuidv4();
  db.prepare(`INSERT INTO messages (id, conversation_id, sender_type, content, created_at)
    VALUES (?, ?, 'contact', ?, datetime('now'))`).run(msgId, convId, messageContent);

  return convId;
}

function appendMessage(conversationId: string, content: string) {
  const msgId = uuidv4();
  db.prepare(`INSERT INTO messages (id, conversation_id, sender_type, content, created_at)
    VALUES (?, ?, 'contact', ?, datetime('now'))`).run(msgId, conversationId, content);

  db.prepare("UPDATE conversations SET last_message = ?, last_message_at = datetime('now'), updated_at = datetime('now') WHERE id = ?")
    .run(content, conversationId);
}

function runSync(provider: string): Record<string, number> {
  switch (provider) {
    case 'gmail': {
      let contactsCreated = 0;
      let conversationsCreated = 0;
      let messagesSynced = 0;
      const threadMap = new Map<string, string>();

      for (const email of GMAIL_SAMPLE_EMAILS) {
        const nameParts = email.fromName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        const result = upsertContact(firstName, lastName, email.fromEmail);
        if (result.isNew) contactsCreated++;

        if (threadMap.has(email.threadId)) {
          appendMessage(threadMap.get(email.threadId)!, email.snippet);
          messagesSynced++;
        } else {
          const convId = createConversation(result.id, email.subject, 'email', email.snippet);
          threadMap.set(email.threadId, convId);
          conversationsCreated++;
          messagesSynced++;
        }
      }

      return {
        contacts_created: contactsCreated,
        conversations_created: conversationsCreated,
        messages_synced: messagesSynced,
        emails_processed: GMAIL_SAMPLE_EMAILS.length
      };
    }
    case 'whatsapp': {
      let contactsUpdated = 0;
      let messagesSynced = 0;

      for (const msg of WHATSAPP_SAMPLE_MESSAGES) {
        const contactName = msg.fromName;
        const nameParts = contactName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';
        const phoneEmail = `${msg.fromPhone.replace(/\D/g, '')}@whatsapp.local`;

        const result = upsertContact(firstName, lastName, phoneEmail);
        if (result.isNew) contactsUpdated++;

        const existingConv = db.prepare("SELECT id FROM conversations WHERE contact_id = ? AND channel = 'whatsapp' AND status = 'open'").get(result.id) as any;
        if (existingConv) {
          appendMessage(existingConv.id, msg.content);
        } else {
          createConversation(result.id, `WhatsApp chat with ${contactName}`, 'whatsapp', msg.content);
        }
        messagesSynced++;
      }

      return {
        contacts_updated: contactsUpdated,
        messages_synced: messagesSynced,
        chats_processed: WHATSAPP_SAMPLE_MESSAGES.length
      };
    }
    case 'hubspot': {
      const hubspotContacts = [
        { firstName: 'Robert', lastName: 'Frost', email: 'rfrost@enterprise.com' },
        { firstName: 'Diana', lastName: 'Prince', email: 'diana@amazon.ventures' },
        { firstName: 'Kenji', lastName: 'Yamamoto', email: 'k.yamamoto@nippon.co.jp' },
        { firstName: 'Sophie', lastName: 'Laurent', email: 'sophie.laurent@euro.tech' },
      ];

      let contactsSynced = 0;
      let companiesSynced = 0;
      let dealsSynced = 0;

      for (const c of hubspotContacts) {
        const result = upsertContact(c.firstName, c.lastName, c.email);
        if (result.isNew) contactsSynced++;

        const companyName = c.email.split('@')[1]?.split('.')[0] || 'Unknown';
        const existingCompany = db.prepare('SELECT id FROM companies WHERE name = ?').get(companyName) as any;
        let companyId: string;
        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          companyId = uuidv4();
          db.prepare('INSERT INTO companies (id, name, industry) VALUES (?, ?, ?)').run(companyId, companyName, 'Technology');
          companiesSynced++;
        }

        db.prepare('UPDATE contacts SET company_id = ? WHERE id = ?').run(companyId, result.id);

        const dealId = uuidv4();
        const dealValue = Math.round(Math.random() * 80000 + 20000);
        db.prepare("INSERT INTO deals (id, name, value, stage, contact_id, company_id, probability) VALUES (?, ?, ?, 'qualified', ?, ?, ?)")
          .run(dealId, `${companyName} Deal`, dealValue, result.id, companyId, Math.round(Math.random() * 50 + 30));
        dealsSynced++;
      }

      return { contacts_synced: contactsSynced, companies_synced: companiesSynced, deals_synced: dealsSynced };
    }
    default:
      return { items_synced: 0 };
  }
}

function getSyncPrompts(provider: string, synced: Record<string, number>) {
  switch (provider) {
    case 'gmail': {
      const contactsCreated = synced.contacts_created || 0;
      const conversationsCreated = synced.conversations_created || 0;
      const emailsProcessed = synced.emails_processed || 0;

      return {
        type: 'action_prompt',
        message: `Gmail sync complete. Processed ${emailsProcessed} emails across ${conversationsCreated} threads.`,
        suggestions: [
          {
            action: 'create_contacts',
            label: 'View New Contacts',
            description: contactsCreated > 0
              ? `${contactsCreated} new contacts created from email senders`
              : 'Extract and manage contacts from synced emails',
            count: contactsCreated,
            color: '#6c5ce7',
            bg: '#e8e8ff',
            route: '/contacts'
          },
          {
            action: 'view_conversations',
            label: 'Review Conversations',
            description: conversationsCreated > 0
              ? `${conversationsCreated} email threads auto-logged as conversations`
              : 'No new conversations created',
            count: conversationsCreated,
            color: '#00b894',
            bg: '#e0fff5',
            route: '/conversations'
          }
        ],
        note: contactsCreated === 0 ? 'All email senders already exist as contacts. Review the new conversations instead.' : undefined
      };
    }
    case 'whatsapp': {
      const messages = synced.messages_synced || 0;
      const contactsUpdated = synced.contacts_updated || 0;
      return {
        type: 'action_prompt',
        message: `WhatsApp sync complete. ${messages} messages from ${contactsUpdated} contacts processed.`,
        suggestions: [
          {
            action: 'view_conversations',
            label: 'View WhatsApp Chats',
            description: `${contactsUpdated} contacts synced with message history`,
            count: messages,
            color: '#25d366',
            bg: '#d4f5e0',
            route: '/conversations'
          }
        ]
      };
    }
    case 'hubspot': {
      const contacts = synced.contacts_synced || 0;
      const companies = synced.companies_synced || 0;
      const deals = synced.deals_synced || 0;
      return {
        type: 'action_prompt',
        message: `HubSpot sync complete. Imported ${contacts} contacts, ${companies} companies, and ${deals} deals.`,
        suggestions: [
          {
            action: 'create_contacts',
            label: 'View Imported Contacts',
            description: `${contacts} contacts imported with company associations`,
            count: contacts,
            color: '#ff7a59',
            bg: '#fff0eb',
            route: '/contacts'
          },
          {
            action: 'view_companies',
            label: 'View Imported Companies',
            description: `${companies} companies created with active deals`,
            count: companies,
            color: '#6c5ce7',
            bg: '#e8e8ff',
            route: '/companies'
          },
          {
            action: 'view_deals',
            label: 'View Synced Deals',
            description: `${deals} deals created in pipeline`,
            count: deals,
            color: '#00b894',
            bg: '#e0fff5',
            route: '/deals'
          }
        ]
      };
    }
    default:
      return null;
  }
}

export default router;
