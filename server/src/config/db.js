import knex from 'knex';
import { v4 as uuidv4 } from 'uuid';

let kdb = null;

class StatementWrapper {
  constructor(kdb, sql) {
    this.kdb = kdb;
    this.sql = this.translateSql(sql);
  }

  translateSql(sql) {
    let s = sql
      .replace(/strftime\('%Y-%m',\s*([^)]+)\)/g, "DATE_FORMAT($1, '%Y-%m')")
      .replace(/datetime\('now'\)/g, 'NOW()')
      .replace(/datetime\('now','-([^']+)'\)/g, (_, arg) => {
        const match = arg.match(/(\d+)\s*(days?|months?|years?)/i);
        if (match) {
          const num = match[1];
          const unit = match[2].toLowerCase().startsWith('day') ? 'DAY'
            : match[2].toLowerCase().startsWith('month') ? 'MONTH'
            : 'YEAR';
          return `DATE_SUB(NOW(), INTERVAL ${num} ${unit})`;
        }
        return `DATE_SUB(NOW(), INTERVAL ${arg})`;
      })
      .replace(/datetime\('now','\+([^']+)'\)/g, (_, arg) => {
        const match = arg.match(/(\d+)\s*(days?|months?|years?)/i);
        if (match) {
          const num = match[1];
          const unit = match[2].toLowerCase().startsWith('day') ? 'DAY'
            : match[2].toLowerCase().startsWith('month') ? 'MONTH'
            : 'YEAR';
          return `DATE_ADD(NOW(), INTERVAL ${num} ${unit})`;
        }
        return `DATE_ADD(NOW(), INTERVAL ${arg})`;
      })
      .replace(/date\('now','-([^']+)'\)/g, (_, arg) => {
        const match = arg.match(/(\d+)\s*(days?|months?|years?)/i);
        if (match) {
          const num = match[1];
          const unit = match[2].toLowerCase().startsWith('day') ? 'DAY'
            : match[2].toLowerCase().startsWith('month') ? 'MONTH'
            : 'YEAR';
          return `DATE_SUB(CURDATE(), INTERVAL ${num} ${unit})`;
        }
        return `DATE_SUB(CURDATE(), INTERVAL ${arg})`;
      })
      .replace(/date\('now','\+([^']+)'\)/g, (_, arg) => {
        const match = arg.match(/(\d+)\s*(days?|months?|years?)/i);
        if (match) {
          const num = match[1];
          const unit = match[2].toLowerCase().startsWith('day') ? 'DAY'
            : match[2].toLowerCase().startsWith('month') ? 'MONTH'
            : 'YEAR';
          return `DATE_ADD(CURDATE(), INTERVAL ${num} ${unit})`;
        }
        return `DATE_ADD(CURDATE(), INTERVAL ${arg})`;
      });

    s = s.replace(/(\w+\.\w+)\s*\|\|\s*'([^']*)'\s*\|\|\s*(\w+\.\w+)/g,
      "CONCAT($1, '$2', $3)");
    s = s.replace(/(\w+\.\w+)\s*\|\|\s*'([^']*)'\s*\|\|\s*(\w+\.\w+)\s*\|\|\s*'([^']*)'\s*\|\|\s*(\w+\.\w+)/g,
      "CONCAT($1, '$2', $3, '$4', $5)");

    return s;
  }

  async all(...params) {
    const clean = sanitizeParams(params);
    const result = await this.kdb.raw(this.sql, clean);
    const rows = result[0];
    return rows.map(row => {
      const obj = {};
      for (const key of Object.keys(row)) {
        obj[key] = row[key];
      }
      return obj;
    });
  }

  async get(...params) {
    const results = await this.all(...params);
    return results.length > 0 ? results[0] : undefined;
  }

  async run(...params) {
    const clean = sanitizeParams(params);
    const result = await this.kdb.raw(this.sql, clean);
    return { changes: result[0]?.affectedRows || 0 };
  }
}

class DBWrapper {
  constructor(kdb) {
    this.kdb = kdb;
  }

  prepare(sql) {
    return new StatementWrapper(this.kdb, sql);
  }

  async exec(sql) {
    const statements = sql.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        await this.kdb.raw(stmt.trim());
      }
    }
  }
}

function sanitizeParams(params) {
  return params.map(p => p === undefined ? null : p);
}

let db = null;

export async function initializeDatabase() {
  const host = process.env.DB_HOST || '72.62.188.79';
  const port = process.env.DB_PORT || '32778';
  const user = process.env.DB_USER || 'agentic_db';
  const password = process.env.DB_PASSWORD || 'NDbWWeYaQTjlKFRGprj5SFsrau8Wjspd';
  const database = process.env.DB_NAME || 'smart_crm';

  kdb = knex({
    client: 'mysql2',
    connection: {
      host,
      port: parseInt(port),
      user,
      password,
      database,
    },
    pool: { min: 0, max: 10 },
  });

  await kdb.raw('SELECT 1');
  console.log('Connected to MariaDB');

  await kdb.raw('SET FOREIGN_KEY_CHECKS = 1');

  await createTables();

  db = new DBWrapper(kdb);

  await ensureDemoData();
  console.log('Database initialized successfully');
}

async function createTables() {
  const hasUsers = await kdb.schema.hasTable('users');
  if (hasUsers) return;

  await kdb.schema.createTable('users', (table) => {
    table.string('id', 36).primary();
    table.string('email', 255).unique().notNullable();
    table.string('name', 255).notNullable();
    table.string('password', 255).notNullable();
    table.string('role', 50).defaultTo('user');
    table.string('avatar', 255);
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.timestamp('updated_at').defaultTo(kdb.fn.now());
  });

  await kdb.schema.createTable('companies', (table) => {
    table.string('id', 36).primary();
    table.string('name', 255).notNullable();
    table.string('industry', 100);
    table.string('size', 50);
    table.string('website', 255);
    table.string('phone', 50);
    table.string('address', 255);
    table.string('city', 100);
    table.string('state', 100);
    table.string('country', 100);
    table.decimal('revenue', 15, 2);
    table.text('description');
    table.string('linkedin', 255);
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.timestamp('updated_at').defaultTo(kdb.fn.now());
  });

  await kdb.schema.createTable('contacts', (table) => {
    table.string('id', 36).primary();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255);
    table.string('phone', 50);
    table.string('mobile', 50);
    table.string('title', 100);
    table.string('department', 100);
    table.string('company_id', 36);
    table.string('status', 50).defaultTo('active');
    table.string('source', 50);
    table.string('address', 255);
    table.string('city', 100);
    table.string('state', 100);
    table.string('country', 100);
    table.string('linkedin', 255);
    table.text('notes');
    table.string('avatar', 255);
    table.timestamp('last_contacted');
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.timestamp('updated_at').defaultTo(kdb.fn.now());
    table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');
  });

  await kdb.schema.createTable('deals', (table) => {
    table.string('id', 36).primary();
    table.string('name', 255).notNullable();
    table.decimal('value', 15, 2).defaultTo(0);
    table.string('stage', 50).defaultTo('lead');
    table.string('contact_id', 36);
    table.string('company_id', 36);
    table.integer('probability').defaultTo(20);
    table.date('expected_close');
    table.text('description');
    table.text('lost_reason');
    table.date('won_date');
    table.string('priority', 20).defaultTo('medium');
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.timestamp('updated_at').defaultTo(kdb.fn.now());
    table.foreign('contact_id').references('id').inTable('contacts').onDelete('SET NULL');
    table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');
  });

  await kdb.schema.createTable('activities', (table) => {
    table.string('id', 36).primary();
    table.string('type', 50).notNullable();
    table.string('subject', 255).notNullable();
    table.text('description');
    table.string('contact_id', 36);
    table.string('company_id', 36);
    table.string('deal_id', 36);
    table.string('status', 50).defaultTo('pending');
    table.date('due_date');
    table.timestamp('completed_at');
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.timestamp('updated_at').defaultTo(kdb.fn.now());
    table.foreign('contact_id').references('id').inTable('contacts').onDelete('CASCADE');
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE');
    table.foreign('deal_id').references('id').inTable('deals').onDelete('CASCADE');
  });

  await kdb.schema.createTable('invoices', (table) => {
    table.string('id', 36).primary();
    table.string('invoice_number', 50).unique().notNullable();
    table.string('contact_id', 36);
    table.string('company_id', 36);
    table.string('status', 50).defaultTo('draft');
    table.date('issue_date');
    table.date('due_date');
    table.decimal('subtotal', 15, 2).defaultTo(0);
    table.decimal('tax_rate', 5, 2).defaultTo(0);
    table.decimal('tax_amount', 15, 2).defaultTo(0);
    table.decimal('discount', 15, 2).defaultTo(0);
    table.decimal('total', 15, 2).defaultTo(0);
    table.string('currency', 10).defaultTo('USD');
    table.text('notes');
    table.timestamp('paid_at');
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.timestamp('updated_at').defaultTo(kdb.fn.now());
    table.foreign('contact_id').references('id').inTable('contacts').onDelete('SET NULL');
    table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');
  });

  await kdb.schema.createTable('invoice_items', (table) => {
    table.string('id', 36).primary();
    table.string('invoice_id', 36).notNullable();
    table.string('description', 255).notNullable();
    table.decimal('quantity', 10, 2).defaultTo(1);
    table.decimal('unit_price', 15, 2).defaultTo(0);
    table.decimal('total', 15, 2).defaultTo(0);
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.foreign('invoice_id').references('id').inTable('invoices').onDelete('CASCADE');
  });

  await kdb.schema.createTable('conversations', (table) => {
    table.string('id', 36).primary();
    table.string('contact_id', 36);
    table.string('company_id', 36);
    table.string('deal_id', 36);
    table.string('subject', 255);
    table.string('channel', 50).defaultTo('email');
    table.string('status', 50).defaultTo('open');
    table.text('last_message');
    table.timestamp('last_message_at');
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.timestamp('updated_at').defaultTo(kdb.fn.now());
    table.foreign('contact_id').references('id').inTable('contacts').onDelete('SET NULL');
    table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');
    table.foreign('deal_id').references('id').inTable('deals').onDelete('SET NULL');
  });

  await kdb.schema.createTable('messages', (table) => {
    table.string('id', 36).primary();
    table.string('conversation_id', 36).notNullable();
    table.string('sender_type', 50).notNullable();
    table.text('content').notNullable();
    table.boolean('is_ai_generated').defaultTo(false);
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.foreign('conversation_id').references('id').inTable('conversations').onDelete('CASCADE');
  });

  await kdb.schema.createTable('ai_insights', (table) => {
    table.string('id', 36).primary();
    table.string('entity_type', 50).notNullable();
    table.string('entity_id', 36).notNullable();
    table.string('insight_type', 50).notNullable();
    table.text('content').notNullable();
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.index(['entity_type', 'entity_id']);
  });

  await kdb.schema.createTable('workflows', (table) => {
    table.string('id', 36).primary();
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('trigger_type', 100).notNullable();
    table.json('trigger_config');
    table.json('actions');
    table.string('status', 50).defaultTo('draft');
    table.timestamp('last_run');
    table.integer('run_count').defaultTo(0);
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.timestamp('updated_at').defaultTo(kdb.fn.now());
  });

  await kdb.schema.createTable('workflow_executions', (table) => {
    table.string('id', 36).primary();
    table.string('workflow_id', 36).notNullable();
    table.string('status', 50).defaultTo('pending');
    table.json('trigger_data');
    table.text('result');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.foreign('workflow_id').references('id').inTable('workflows').onDelete('CASCADE');
  });

  await kdb.schema.createTable('api_tokens', (table) => {
    table.string('id', 36).primary();
    table.string('name', 255).notNullable();
    table.string('token', 255).unique().notNullable();
    table.json('permissions').defaultTo('{}');
    table.string('created_by', 36);
    table.timestamp('last_used');
    table.timestamp('expires_at');
    table.string('status', 50).defaultTo('active');
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.timestamp('updated_at').defaultTo(kdb.fn.now());
  });

  await kdb.schema.createTable('tickets', (table) => {
    table.string('id', 36).primary();
    table.string('ticket_number', 50).unique().notNullable();
    table.string('subject', 255).notNullable();
    table.text('description');
    table.string('status', 50).defaultTo('open');
    table.string('priority', 50).defaultTo('medium');
    table.string('contact_id', 36);
    table.string('company_id', 36);
    table.string('deal_id', 36);
    table.string('assigned_to', 36);
    table.string('category', 100);
    table.string('source', 50).defaultTo('web');
    table.json('tags');
    table.text('resolution');
    table.timestamp('resolved_at');
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.timestamp('updated_at').defaultTo(kdb.fn.now());
    table.foreign('contact_id').references('id').inTable('contacts').onDelete('SET NULL');
    table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');
    table.foreign('deal_id').references('id').inTable('deals').onDelete('SET NULL');
  });

  await kdb.schema.createTable('ticket_comments', (table) => {
    table.string('id', 36).primary();
    table.string('ticket_id', 36).notNullable();
    table.text('content').notNullable();
    table.string('author_type', 50).notNullable();
    table.boolean('is_internal').defaultTo(false);
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.foreign('ticket_id').references('id').inTable('tickets').onDelete('CASCADE');
  });

  await kdb.schema.createTable('integrations', (table) => {
    table.string('id', 36).primary();
    table.string('provider', 100).notNullable();
    table.string('name', 255).notNullable();
    table.json('config').defaultTo('{}');
    table.json('credentials').defaultTo('{}');
    table.string('status', 50).defaultTo('disconnected');
    table.timestamp('last_sync');
    table.string('webhook_secret', 255);
    table.timestamp('created_at').defaultTo(kdb.fn.now());
    table.timestamp('updated_at').defaultTo(kdb.fn.now());
    table.index('provider');
  });

  console.log('Database tables created');
}

async function ensureDemoData() {
  const { default: bcrypt } = await import('bcryptjs');

  const userCount = await kdb('users').count('id as c').first();
  if (userCount.c === 0) {
    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync('demo123', 10);
    await kdb('users').insert({
      id: userId,
      email: 'demo@smartcrm.com',
      name: 'Demo User',
      password: hashedPassword,
      role: 'admin',
    });
    console.log('Demo user created: demo@smartcrm.com / demo123');
  }

  const contactCount = await kdb('contacts').count('id as c').first();
  if (contactCount.c === 0) {
    await seedDemoData();
  }
}

async function seedDemoData() {
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
    await kdb('contacts').insert({
      id, first_name: c.fn, last_name: c.ln, email: c.email,
      phone: c.phone, title: c.title, department: c.dept,
      status: 'active', source: 'manual',
    });
  }

  const contactEmails = [
    ['sarah.chen@fintech.io'], ['m.rivera@buildcorp.com'], ['elena@medcore.health'],
    ['j.okonkwo@afritech.ng'], ['priya.sharma@datasense.ai'], ['lucas@greenlogistics.co'],
    ['aisha@edtech.learn'], ['thomas@nordic.design'], ['y.tanaka@sakura-eng.jp'],
    ['maria@latam.ventures'], ['rfrost@enterprise.com'], ['diana@amazon.ventures'],
  ];

  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    const id = uuidv4();
    coids[c.name] = id;
    await kdb('companies').insert({
      id, name: c.name, industry: c.industry, size: c.size,
      website: c.website, city: c.city, state: c.state, country: c.country,
    });

    const links = contactEmails[i] || [];
    for (const e of links) {
      if (cids[e]) {
        await kdb('contacts').where('id', cids[e]).update({ company_id: id });
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
    'Digital Transformation', 'Smart Factory IoT', 'Fintech API Suite',
  ];

  const stageWeights = ['lead', 'lead', 'lead', 'qualified', 'qualified', 'proposal', 'negotiation',
    'closed_won', 'closed_won', 'closed_won', 'closed_won', 'closed_lost', 'closed_lost'];
  const contactList = Object.values(cids);
  const companyList = Object.values(coids);
  const now = new Date();

  for (let i = 0; i < dealNames.length; i++) {
    const id = uuidv4();
    const stage = i < stageWeights.length ? stageWeights[i]
      : dealStages[Math.floor(Math.random() * dealStages.length)];
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

    await kdb('deals').insert({
      id, name: dealNames[i], value, stage, contact_id: contactId, company_id: companyId,
      probability, expected_close: expectedClose, won_date: wonDate,
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    });
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
    await kdb('invoices').insert({
      id, invoice_number: invNum, contact_id: contactId, status,
      issue_date: kdb.raw(`DATE_SUB(CURDATE(), INTERVAL ${30 + i * 5} DAY)`),
      due_date: kdb.raw(`DATE_ADD(CURDATE(), INTERVAL 15 DAY)`),
      subtotal, tax_rate: taxRate, tax_amount: taxAmount, total,
    });

    await kdb('invoice_items').insert({
      id: uuidv4(), invoice_id: id, description: `Service ${i + 1}`,
      quantity: Math.floor(Math.random() * 5) + 1,
      unit_price: Math.round(subtotal / (Math.floor(Math.random() * 5) + 1)),
      total: subtotal,
    });
  }

  for (let i = 0; i < 5; i++) {
    const subject = ['Product inquiry', 'Support request', 'Billing question', 'Feature feedback', 'Partnership opportunity'][i];
    const contactId = contactList[i % contactList.length];
    const convId = uuidv4();
    await kdb('conversations').insert({
      id: convId, contact_id: contactId, subject, channel: 'email',
      status: 'open', last_message: 'Initial message from customer',
    });
    await kdb('messages').insert({
      id: uuidv4(), conversation_id: convId, sender_type: 'contact',
      content: 'Hello, I have a question about your CRM platform.',
    });
  }

  const ticketSubjects = [
    'Login issue after update', 'Integration sync failing', 'Feature request: Bulk import',
    'Billing discrepancy on invoice', 'Account access for new team member', 'API rate limit reached',
  ];
  const ticketPriorities = ['medium', 'high', 'low', 'medium', 'low', 'urgent'];
  const ticketStatuses = ['open', 'in_progress', 'open', 'open', 'open', 'open'];
  for (let i = 0; i < ticketSubjects.length; i++) {
    const id = uuidv4();
    const num = `TKT-${1000 + i}`;
    const contactId = contactList[(i + 3) % contactList.length];
    await kdb('tickets').insert({
      id, ticket_number: num, subject: ticketSubjects[i],
      description: `Description for ${ticketSubjects[i]}`,
      status: ticketStatuses[i], priority: ticketPriorities[i],
      contact_id: contactId, category: 'support', source: 'web',
    });

    if (i < 3) {
      await kdb('ticket_comments').insert({
        id: uuidv4(), ticket_id: id, content: 'We are looking into this issue.',
        author_type: 'agent', is_internal: i === 2,
      });
    }
  }
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return db;
}

export default {
  prepare(sql) { return getDb().prepare(sql); },
  exec(sql) { return getDb().exec(sql); },
};
