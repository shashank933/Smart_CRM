import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'crm.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db = null;
let SQL = null;

function saveToDisk() {
  if (!db) return;
  try {
    const data = db.rawDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (e) {
    console.error('Failed to save database:', e.message);
  }
}

function sanitizeParams(params) {
  return params.map(p => p === undefined ? null : p);
}

class StatementWrapper {
  constructor(sqlDb, sql) {
    this.sqlDb = sqlDb;
    this.sql = sql;
  }

  all(...params) {
    const stmt = this.sqlDb.prepare(this.sql);
    const clean = sanitizeParams(params);
    if (clean.length > 0) stmt.bind(clean);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  get(...params) {
    const results = this.all(...params);
    return results.length > 0 ? results[0] : undefined;
  }

  run(...params) {
    const clean = sanitizeParams(params);
    this.sqlDb.run(this.sql, clean);
    saveToDisk();
    return { changes: this.sqlDb.getRowsModified() };
  }
}

class DBWrapper {
  constructor(sqlDb) {
    this.rawDb = sqlDb;
  }

  prepare(sql) {
    return new StatementWrapper(this.rawDb, sql);
  }

  exec(sql) {
    this.rawDb.exec(sql);
    saveToDisk();
  }
}

export async function initializeDatabase() {
  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const buffer = fs.readFileSync(DB_PATH);
      db = new DBWrapper(new SQL.Database(buffer));
    } catch (e) {
      console.error('Failed to load existing database, creating new:', e.message);
      db = new DBWrapper(new SQL.Database());
    }
  } else {
    db = new DBWrapper(new SQL.Database());
  }

  db.exec(`PRAGMA foreign_keys = ON;`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      avatar TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT,
      size TEXT,
      website TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      revenue REAL,
      description TEXT,
      linkedin TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      mobile TEXT,
      title TEXT,
      department TEXT,
      company_id TEXT,
      status TEXT DEFAULT 'active',
      source TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      linkedin TEXT,
      notes TEXT,
      avatar TEXT,
      last_contacted TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      value REAL DEFAULT 0,
      stage TEXT DEFAULT 'lead',
      contact_id TEXT,
      company_id TEXT,
      probability INTEGER DEFAULT 20,
      expected_close TEXT,
      description TEXT,
      lost_reason TEXT,
      won_date TEXT,
      priority TEXT DEFAULT 'medium',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT,
      contact_id TEXT,
      company_id TEXT,
      deal_id TEXT,
      status TEXT DEFAULT 'pending',
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      contact_id TEXT,
      company_id TEXT,
      status TEXT DEFAULT 'draft',
      issue_date TEXT,
      due_date TEXT,
      subtotal REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      notes TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      contact_id TEXT,
      company_id TEXT,
      deal_id TEXT,
      subject TEXT,
      channel TEXT DEFAULT 'email',
      status TEXT DEFAULT 'open',
      last_message TEXT,
      last_message_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      content TEXT NOT NULL,
      is_ai_generated INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_insights (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      insight_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      trigger_type TEXT NOT NULL,
      trigger_config TEXT,
      actions TEXT,
      status TEXT DEFAULT 'draft',
      last_run TEXT,
      run_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workflow_executions (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      trigger_data TEXT,
      result TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS api_tokens (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      permissions TEXT DEFAULT '{}',
      created_by TEXT,
      last_used TEXT,
      expires_at TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      ticket_number TEXT UNIQUE NOT NULL,
      subject TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'medium',
      contact_id TEXT,
      company_id TEXT,
      deal_id TEXT,
      assigned_to TEXT,
      category TEXT,
      source TEXT DEFAULT 'web',
      tags TEXT,
      resolution TEXT,
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
      FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ticket_comments (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      content TEXT NOT NULL,
      author_type TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
    CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);
    CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(company_id);
    CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
    CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id);
    CREATE INDEX IF NOT EXISTS idx_activities_deal ON activities(deal_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_contact ON invoices(contact_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_ai_insights_entity ON ai_insights(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
    CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token);

    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      name TEXT NOT NULL,
      config TEXT DEFAULT '{}',
      credentials TEXT DEFAULT '{}',
      status TEXT DEFAULT 'disconnected',
      last_sync TEXT,
      webhook_secret TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_contact ON tickets(contact_id);
    CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);
  `);

  saveToDisk();

  const contactCount = db.prepare('SELECT COUNT(*) as c FROM contacts').get();
  if (contactCount.c === 0) {
    seedDemoData();
  }

  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (userCount.c === 0) {
    const bcrypt = (await import('bcryptjs')).default;
    const demoId = uuidv4();
    const hashedPassword = bcrypt.hashSync('demo123', 10);
    db.prepare("INSERT INTO users (id, email, name, password, role) VALUES (?, 'demo@smartcrm.com', 'Demo User', ?, 'admin')")
      .run(demoId, hashedPassword);
    console.log('Demo user created: demo@smartcrm.com / demo123');
  }

  console.log('Database initialized successfully');
}

function seedDemoData() {
  const cids = {};
  const coids = {};

  const contacts = [
    { fn: 'Sarah', ln: 'Chen', email: 'sarah.chen@fintech.io', phone: '415-555-0101', title: 'CTO', dept: 'Engineering' },
    { fn: 'Marcus', ln: 'Rivera', email: 'm.rivera@buildcorp.com', phone: '312-555-0102', title: 'VP Construction', dept: 'Operations' },
    { fn: 'Elena', ln: 'Popov', email: 'elena@medcore.health', phone: '206-555-0103', title: 'Compliance Director', dept: 'Legal' },
    { fn: 'James', ln: 'Okonkwo', email: 'j.okonkwo@afritech.ng', phone: '+234-555-0104', title: 'Regional Director', dept: 'Sales' },
    { fn: 'Priya', ln: 'Sharma', email: 'priya.sharma@datasense.ai', phone: '650-555-0105', title: 'Head of AI', dept: 'Engineering' },
    { fn: 'Lucas', ln: 'Martinez', email: 'lucas@greenlogistics.co', phone: '305-555-0106', title: 'Operations Manager', dept: 'Logistics' },
    { fn: 'Aisha', ln: 'Patel', email: 'aisha@edtech.learn', phone: '212-555-0107', title: 'Product Director', dept: 'Product' },
    { fn: 'Thomas', ln: 'Berg', email: 'thomas@nordic.design', phone: '+46-555-0108', title: 'Creative Director', dept: 'Design' },
    { fn: 'Yuki', ln: 'Tanaka', email: 'y.tanaka@sakura-eng.jp', phone: '+81-555-0109', title: 'VP Engineering', dept: 'Engineering' },
    { fn: 'Maria', ln: 'Silva', email: 'maria@latam.ventures', phone: '+55-555-0110', title: 'Managing Partner', dept: 'Investment' },
    { fn: 'Robert', ln: 'Frost', email: 'rfrost@enterprise.com', phone: '617-555-0111', title: 'CEO', dept: 'Executive' },
    { fn: 'Diana', ln: 'Prince', email: 'diana@amazon.ventures', phone: '206-555-0112', title: 'Investment Partner', dept: 'Ventures' },
    { fn: 'Kenji', ln: 'Yamamoto', email: 'k.yamamoto@nippon.co.jp', phone: '+81-555-0113', title: 'President', dept: 'Executive' },
    { fn: 'Sophie', ln: 'Laurent', email: 'sophie@euro.tech', phone: '+33-555-0114', title: 'CTO', dept: 'Engineering' },
    { fn: 'Carlos', ln: 'Mendez', email: 'carlos@latam.trade', phone: '+52-555-0115', title: 'Trade Director', dept: 'Trade' },
    { fn: 'Olivia', ln: 'Wang', email: 'o.wang@pacific.group', phone: '415-555-0116', title: 'CFO', dept: 'Finance' },
    { fn: 'Hans', ln: 'Mueller', email: 'hans@deutsche.ag', phone: '+49-555-0117', title: 'Managing Director', dept: 'Management' },
    { fn: 'Chloe', ln: 'Dubois', email: 'chloe@paris.consulting', phone: '+33-555-0118', title: 'Senior Partner', dept: 'Consulting' },
    { fn: 'Raj', ln: 'Kapoor', email: 'raj@mumbai.ventures', phone: '+91-555-0119', title: 'Founder', dept: 'Executive' },
    { fn: 'Emily', ln: 'Johnson', email: 'emily@healthbridge.io', phone: '415-555-0120', title: 'COO', dept: 'Operations' },
  ];

  const companies = [
    { name: 'Fintech Solutions', industry: 'Financial Technology', size: '50-200', website: 'fintech.io', city: 'San Francisco', state: 'CA', country: 'USA' },
    { name: 'BuildCorp Construction', industry: 'Construction', size: '200-500', website: 'buildcorp.com', city: 'Chicago', state: 'IL', country: 'USA' },
    { name: 'MedCore Health', industry: 'Healthcare', size: '500-1000', website: 'medcore.health', city: 'Seattle', state: 'WA', country: 'USA' },
    { name: 'AfriTech Solutions', industry: 'Technology', size: '50-200', website: 'afritech.ng', city: 'Lagos', state: '', country: 'Nigeria' },
    { name: 'DataSense AI', industry: 'Artificial Intelligence', size: '10-50', website: 'datasense.ai', city: 'Palo Alto', state: 'CA', country: 'USA' },
    { name: 'Green Logistics', industry: 'Logistics', size: '200-500', website: 'greenlogistics.co', city: 'Miami', state: 'FL', country: 'USA' },
    { name: 'EduTech Learn', industry: 'Education', size: '50-200', website: 'edtech.learn', city: 'New York', state: 'NY', country: 'USA' },
    { name: 'Nordic Design Studio', industry: 'Design', size: '200-500', website: 'nordic.design', city: 'Stockholm', state: '', country: 'Sweden' },
    { name: 'Sakura Engineering', industry: 'Manufacturing', size: '500-1000', website: 'sakura-eng.jp', city: 'Osaka', state: '', country: 'Japan' },
    { name: 'LATAM Ventures', industry: 'Venture Capital', size: '10-50', website: 'latam.ventures', city: 'Sao Paulo', state: '', country: 'Brazil' },
    { name: 'Enterprise Corp', industry: 'Technology', size: '1000+', website: 'enterprise.com', city: 'Boston', state: 'MA', country: 'USA' },
    { name: 'Amazon Ventures', industry: 'Venture Capital', size: '50-200', website: 'amazon.ventures', city: 'Seattle', state: 'WA', country: 'USA' },
  ];

  for (const c of contacts) {
    const id = uuidv4();
    cids[c.email] = id;
    db.prepare(`INSERT INTO contacts (id, first_name, last_name, email, phone, title, department, status, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'manual')`).run(id, c.fn, c.ln, c.email, c.phone, c.title, c.dept);
  }

  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    const id = uuidv4();
    coids[c.name] = id;
    db.prepare(`INSERT INTO companies (id, name, industry, size, website, city, state, country)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, c.name, c.industry, c.size, c.website, c.city, c.state, c.country);

    const contactEmails = [
      ['sarah.chen@fintech.io'],
      ['m.rivera@buildcorp.com'],
      ['elena@medcore.health'],
      ['j.okonkwo@afritech.ng'],
      ['priya.sharma@datasense.ai'],
      ['lucas@greenlogistics.co'],
      ['aisha@edtech.learn'],
      ['thomas@nordic.design'],
      ['y.tanaka@sakura-eng.jp'],
      ['maria@latam.ventures'],
      ['rfrost@enterprise.com'],
      ['diana@amazon.ventures'],
    ];
    const links = contactEmails[i] || [];
    for (const e of links) {
      if (cids[e]) {
        db.prepare('UPDATE contacts SET company_id = ? WHERE id = ?').run(id, cids[e]);
      }
    }
  }

  const dealStages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  const dealNames = [
    'API Integration', 'Office Tower Phase 1', 'HIPAA Compliance Package',
    'West Africa Expansion', 'Data Pipeline Migration', 'Fleet Management Suite',
    'EdTech Platform License', 'UX Design Retainer', 'Precision Parts Order',
    'Portfolio Management Tool', 'Enterprise CRM Rollout', 'Venture Fund CRM',
    'Pacific Trade Desk', 'European Market Entry', 'Mumbai Startup Incubator',
    'Healthcare Data Platform', 'Construction ERP', 'Nordic Brand Identity',
    'LATAM Logistics Network', 'AI Model Training Suite', 'Cloud Migration Deal',
    'Digital Transformation', 'Smart Factory IoT', 'Fintech API Suite'
  ];

  const stageWeights = ['lead', 'lead', 'lead', 'qualified', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_won', 'closed_won', 'closed_won', 'closed_lost', 'closed_lost'];
  const contactList = Object.values(cids);
  const companyList = Object.values(coids);

  const now = new Date();
  for (let i = 0; i < dealNames.length; i++) {
    const id = uuidv4();
    const stage = i < stageWeights.length ? stageWeights[i] : dealStages[Math.floor(Math.random() * dealStages.length)];
    const value = Math.round((Math.random() * 180000 + 20000) / 1000) * 1000;
    const probability = stage === 'closed_won' ? 100 : stage === 'closed_lost' ? 0 : Math.round(Math.random() * 70 + 10);
    const contactId = contactList[i % contactList.length];
    const companyId = companyList[i % companyList.length];
    let wonDate = null;
    let expectedClose = null;

    if (stage === 'closed_won') {
      const monthsAgo = Math.floor(Math.random() * 6);
      const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, Math.floor(Math.random() * 28) + 1);
      wonDate = d.toISOString().split('T')[0];
    } else if (stage !== 'closed_lost') {
      const d = new Date(now.getFullYear(), now.getMonth() + Math.floor(Math.random() * 3) + 1, Math.floor(Math.random() * 28) + 1);
      expectedClose = d.toISOString().split('T')[0];
    }

    db.prepare(`INSERT INTO deals (id, name, value, stage, contact_id, company_id, probability, expected_close, won_date, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, dealNames[i], value, stage, contactId, companyId, probability, expectedClose, wonDate,
      ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
    );
  }

  const invoiceStatuses = ['paid', 'sent', 'overdue', 'draft', 'paid', 'paid', 'sent'];
  for (let i = 0; i < 10; i++) {
    const id = uuidv4();
    const status = invoiceStatuses[i % invoiceStatuses.length];
    const subtotal = Math.round((Math.random() * 40000 + 5000) / 100) * 100;
    const taxRate = 8.5;
    const taxAmount = Math.round(subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;
    const contactId = contactList[i % contactList.length];
    const invNum = `INV-${String(i + 1).padStart(4, '0')}`;
    db.prepare(`INSERT INTO invoices (id, invoice_number, contact_id, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total)
      VALUES (?, ?, ?, ?, date('now','-' || ? || ' days'), date('now','+' || ? || ' days'), ?, ?, ?, ?)`)
      .run(id, invNum, contactId, status, 30 + i * 5, 15, subtotal, taxRate, taxAmount, total);

    const itemId = uuidv4();
    db.prepare(`INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total)
      VALUES (?, ?, ?, ?, ?, ?)`).run(itemId, id, `Service ${i + 1}`, Math.floor(Math.random() * 5) + 1, Math.round(subtotal / (Math.floor(Math.random() * 5) + 1)), subtotal);
  }

  for (let i = 0; i < 5; i++) {
    const subject = ['Product inquiry', 'Support request', 'Billing question', 'Feature feedback', 'Partnership opportunity'][i];
    const contactId = contactList[i % contactList.length];
    const convId = uuidv4();
    db.prepare(`INSERT INTO conversations (id, contact_id, subject, channel, status, last_message, last_message_at)
      VALUES (?, ?, ?, 'email', 'open', ?, datetime('now'))`).run(convId, contactId, subject, 'Initial message from customer');
    db.prepare(`INSERT INTO messages (id, conversation_id, sender_type, content, created_at)
      VALUES (?, ?, 'contact', ?, datetime('now'))`).run(uuidv4(), convId, 'Hello, I have a question about your CRM platform.');
  }

  const ticketSubjects = [
    'Login issue after update', 'Integration sync failing', 'Feature request: Bulk import',
    'Billing discrepancy on invoice', 'Account access for new team member', 'API rate limit reached'
  ];
  const ticketPriorities = ['medium', 'high', 'low', 'medium', 'low', 'urgent'];
  const ticketStatuses = ['open', 'in_progress', 'open', 'open', 'open', 'open'];
  for (let i = 0; i < ticketSubjects.length; i++) {
    const id = uuidv4();
    const num = `TKT-${1000 + i}`;
    const contactId = contactList[(i + 3) % contactList.length];
    db.prepare(`INSERT INTO tickets (id, ticket_number, subject, description, status, priority, contact_id, category, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'support', 'web')`).run(id, num, ticketSubjects[i], `Description for ${ticketSubjects[i]}`, ticketStatuses[i], ticketPriorities[i], contactId);

    if (i < 3) {
      db.prepare(`INSERT INTO ticket_comments (id, ticket_id, content, author_type, is_internal)
        VALUES (?, ?, ?, 'agent', ?)`).run(uuidv4(), id, 'We are looking into this issue.', i === 2 ? 1 : 0);
    }
  }
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return db;
}

export default {
  prepare(sql) { return getDb().prepare(sql); },
  exec(sql) { return getDb().exec(sql); }
};
