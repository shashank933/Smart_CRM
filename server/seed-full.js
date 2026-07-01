const BASE = process.env.SEED_API_URL || 'http://localhost:3001/api';

async function request(url, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(`${url}: ${data.error || res.statusText} (${res.status})`);
  return data;
}

function log(label, value) {
  if (value !== undefined) console.log(`  ${label}: ${value}`);
  else console.log(`  ${label}`);
}

let token;

async function auth(ep, opts = {}) {
  return request(ep, opts, token);
}

async function seed() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   Smart CRM — Full Test Data Seed    ║');
  console.log('╚══════════════════════════════════════╝\n');

  // ── Step 1: Auth ──
  console.log('━━━ AUTH ━━━');
  try {
    await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'demo@smartcrm.com', password: 'demo123', name: 'Demo User' }),
    });
    log('User registered');
  } catch (e) {
    if (e.message.includes('409') || e.message.includes('already exists') || e.message.includes('duplicate')) {
      log('User already exists');
    } else throw e;
  }
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'demo@smartcrm.com', password: 'demo123' }),
  });
  token = loginRes.token;
  log('Logged in, token acquired');

  // ── Step 2: Companies ──
  console.log('\n━━━ COMPANIES ━━━');
  const companies = [
    { name: 'Acme Corp', industry: 'Technology', size: '51-200', website: 'https://acme.com', phone: '555-0100', city: 'San Francisco', state: 'CA', country: 'US', revenue: 5000000, description: 'Enterprise SaaS platform for workflow automation' },
    { name: 'Globex Industries', industry: 'Manufacturing', size: '201-500', website: 'https://globex.com', phone: '555-0200', city: 'Chicago', state: 'IL', country: 'US', revenue: 12000000, description: 'Industrial automation and robotics' },
    { name: 'Initech Solutions', industry: 'Technology', size: '11-50', website: 'https://initech.io', phone: '555-0300', city: 'Austin', state: 'TX', country: 'US', revenue: 800000, description: 'Cloud-native dev tools' },
    { name: 'Umbrella Corp', industry: 'Healthcare', size: '501-1000', website: 'https://umbrella.med', phone: '555-0400', city: 'Boston', state: 'MA', country: 'US', revenue: 25000000, description: 'Healthcare analytics and diagnostics' },
    { name: 'Stark Industries', industry: 'Energy', size: '1000+', website: 'https://stark.com', phone: '555-0500', city: 'New York', state: 'NY', country: 'US', revenue: 85000000, description: 'Clean energy and advanced materials' },
    { name: 'Wayne Enterprises', industry: 'Technology', size: '1000+', website: 'https://wayne.com', phone: '555-0600', city: 'Gotham', state: 'NJ', country: 'US', revenue: 72000000, description: 'Defense, tech, and philanthropy' },
    { name: 'Oscorp', industry: 'Pharmaceuticals', size: '501-1000', website: 'https://oscorp.com', phone: '555-0700', city: 'Los Angeles', state: 'CA', country: 'US', revenue: 18000000, description: 'Biotech and genetic research' },
    { name: 'LexCorp', industry: 'Conglomerate', size: '1000+', website: 'https://lexcorp.com', phone: '555-0800', city: 'Metropolis', state: 'DE', country: 'US', revenue: 95000000, description: 'Multi-industry conglomerate' },
  ];
  const compMap = {};
  for (const c of companies) {
    const created = await auth('/companies', { method: 'POST', body: JSON.stringify(c) });
    compMap[created.name] = created.id;
    log(`Company: ${created.name} (${created.industry})`);
  }

  // ── Step 3: Contacts ──
  console.log('\n━━━ CONTACTS ━━━');
  const contacts = [
    { first_name: 'John', last_name: 'Smith', email: 'john@acme.com', phone: '555-1001', title: 'CEO', department: 'Executive', company_id: compMap['Acme Corp'], status: 'active', source: 'manual', address: '123 Market St', city: 'San Francisco', state: 'CA', country: 'US', notes: 'Key decision maker. Responsive to cold outreach.' },
    { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@globex.com', phone: '555-2001', title: 'VP Sales', department: 'Sales', company_id: compMap['Globex Industries'], status: 'active', source: 'import', address: '456 Industrial Pkwy', city: 'Chicago', state: 'IL', country: 'US' },
    { first_name: 'Mike', last_name: 'Chen', email: 'mike@initech.io', phone: '555-3001', title: 'CTO', department: 'Engineering', company_id: compMap['Initech Solutions'], status: 'active', source: 'referral', address: '789 Tech Blvd', city: 'Austin', state: 'TX', country: 'US', notes: 'Technical buyer. Values detailed specs.' },
    { first_name: 'Emily', last_name: 'Davis', email: 'emily@umbrella.med', phone: '555-4001', title: 'Marketing Director', department: 'Marketing', company_id: compMap['Umbrella Corp'], status: 'active', source: 'conference', address: '321 Health Ave', city: 'Boston', state: 'MA', country: 'US' },
    { first_name: 'Robert', last_name: 'Wilson', email: 'robert@acme.com', phone: '555-1002', title: 'CFO', department: 'Finance', company_id: compMap['Acme Corp'], status: 'lead', source: 'website', address: '123 Market St', city: 'San Francisco', state: 'CA', country: 'US' },
    { first_name: 'Lisa', last_name: 'Brown', email: 'lisa@globex.com', phone: '555-2002', title: 'Product Manager', department: 'Product', company_id: compMap['Globex Industries'], status: 'inactive', source: 'manual', address: '456 Industrial Pkwy', city: 'Chicago', state: 'IL', country: 'US', notes: 'Left the company. Keep for historical records.' },
    { first_name: 'David', last_name: 'Kim', email: 'david@stark.com', phone: '555-5001', title: 'VP Engineering', department: 'Engineering', company_id: compMap['Stark Industries'], status: 'customer', source: 'referral', city: 'New York', state: 'NY', country: 'US' },
    { first_name: 'Jessica', last_name: 'Lee', email: 'jessica@wayne.com', phone: '555-6001', title: 'Procurement Director', department: 'Operations', company_id: compMap['Wayne Enterprises'], status: 'active', source: 'conference', city: 'Gotham', state: 'NJ', country: 'US' },
    { first_name: 'Alex', last_name: 'Rodriguez', email: 'alex@oscorp.com', phone: '555-7001', title: 'Research Director', department: 'R&D', company_id: compMap['Oscorp'], status: 'lead', source: 'website', city: 'Los Angeles', state: 'CA', country: 'US', notes: 'Interested in AI-powered research tools.' },
    { first_name: 'Nina', last_name: 'Petrova', email: 'nina@lexcorp.com', phone: '555-8001', title: 'CTO', department: 'Executive', company_id: compMap['LexCorp'], status: 'active', source: 'import', city: 'Metropolis', state: 'DE', country: 'US' },
    { first_name: 'James', last_name: 'Taylor', email: 'james@stark.com', phone: '555-5002', title: 'Software Architect', department: 'Engineering', company_id: compMap['Stark Industries'], status: 'active', source: 'manual', city: 'New York', state: 'NY', country: 'US' },
    { first_name: 'Maria', last_name: 'Garcia', email: 'maria@wayne.com', phone: '555-6002', title: 'IT Manager', department: 'IT', company_id: compMap['Wayne Enterprises'], status: 'lead', source: 'referral', city: 'Gotham', state: 'NJ', country: 'US' },
  ];
  const contMap = {};
  for (const c of contacts) {
    const created = await auth('/contacts', { method: 'POST', body: JSON.stringify(c) });
    contMap[`${created.first_name} ${created.last_name}`] = created.id;
    log(`Contact: ${created.first_name} ${created.last_name} — ${created.title} @ ${c.company_id ? companies.find(co => compMap[co.name] === c.company_id)?.name || '' : 'N/A'}`);
  }

  // ── Step 4: Deals ──
  console.log('\n━━━ DEALS ━━━');
  const deals = [
    { name: 'Enterprise License Deal', value: 250000, stage: 'negotiation', contact_id: contMap['John Smith'], company_id: compMap['Acme Corp'], probability: 70, expected_close: '2026-07-15', priority: 'high', description: 'Annual enterprise license with premium support' },
    { name: 'Manufacturing Automation POC', value: 180000, stage: 'proposal', contact_id: contMap['Sarah Johnson'], company_id: compMap['Globex Industries'], probability: 50, expected_close: '2026-08-01', priority: 'high', description: 'Proof of concept for factory floor automation' },
    { name: 'Cloud Migration Project', value: 95000, stage: 'qualified', contact_id: contMap['Mike Chen'], company_id: compMap['Initech Solutions'], probability: 40, expected_close: '2026-09-15', priority: 'medium', description: 'Migrate legacy infra to cloud' },
    { name: 'Healthcare Analytics Suite', value: 420000, stage: 'lead', contact_id: contMap['Emily Davis'], company_id: compMap['Umbrella Corp'], probability: 15, expected_close: '2026-10-01', priority: 'medium', description: 'Full analytics suite for hospital network' },
    { name: 'Annual Support Renewal', value: 45000, stage: 'closed_won', contact_id: contMap['Robert Wilson'], company_id: compMap['Acme Corp'], probability: 100, priority: 'low', description: 'Renewed annual support contract' },
    { name: 'Legacy System Upgrade', value: 120000, stage: 'closed_lost', contact_id: contMap['Lisa Brown'], company_id: compMap['Globex Industries'], probability: 0, priority: 'medium', description: 'Lost to competitor. Budget constraints.' },
    { name: 'Clean Energy Platform', value: 750000, stage: 'proposal', contact_id: contMap['David Kim'], company_id: compMap['Stark Industries'], probability: 60, expected_close: '2026-08-20', priority: 'high', description: 'Green energy monitoring and analytics' },
    { name: 'Defense Tech Integration', value: 520000, stage: 'qualified', contact_id: contMap['Jessica Lee'], company_id: compMap['Wayne Enterprises'], probability: 35, expected_close: '2026-11-01', priority: 'high', description: 'Secure comms integration' },
    { name: 'Lab Management System', value: 200000, stage: 'lead', contact_id: contMap['Alex Rodriguez'], company_id: compMap['Oscorp'], probability: 20, expected_close: '2026-12-15', priority: 'low', description: 'Lab inventory and experiment tracking' },
    { name: 'Enterprise AI Platform', value: 1500000, stage: 'negotiation', contact_id: contMap['Nina Petrova'], company_id: compMap['LexCorp'], probability: 65, expected_close: '2026-07-30', priority: 'high', description: 'Company-wide AI deployment' },
    { name: 'Stark Tower Renovation', value: 350000, stage: 'closed_won', contact_id: contMap['James Taylor'], company_id: compMap['Stark Industries'], probability: 100, priority: 'medium', description: 'Office space digital transformation' },
    { name: 'Wayne Security Audit', value: 80000, stage: 'closed_won', contact_id: contMap['Maria Garcia'], company_id: compMap['Wayne Enterprises'], probability: 100, priority: 'high', description: 'Annual security audit completed' },
  ];
  const dealIds = [];
  for (const d of deals) {
    const created = await auth('/deals', { method: 'POST', body: JSON.stringify(d) });
    dealIds.push(created.id);
    log(`Deal: ${d.name} — $${d.value.toLocaleString()} [${d.stage}]`);
  }

  // ── Step 5: Invoices ──
  console.log('\n━━━ INVOICES ━━━');
  const invoices = [
    { contact_id: contMap['John Smith'], company_id: compMap['Acme Corp'], status: 'paid', issue_date: '2026-06-01', due_date: '2026-06-30', subtotal: 50000, tax_rate: 8.5, tax_amount: 4250, total: 54250, notes: 'Q2 License Fee', items: [{ description: 'Enterprise License — Q2 2026', quantity: 1, unit_price: 50000, total: 50000 }] },
    { contact_id: contMap['Sarah Johnson'], company_id: compMap['Globex Industries'], status: 'sent', issue_date: '2026-06-15', due_date: '2026-07-15', subtotal: 75000, tax_rate: 8.5, tax_amount: 6375, discount: 1000, total: 80375, notes: 'Automation Consulting', items: [{ description: 'Consulting — On-site assessment', quantity: 5, unit_price: 15000, total: 75000 }] },
    { contact_id: contMap['Mike Chen'], company_id: compMap['Initech Solutions'], status: 'overdue', issue_date: '2026-05-01', due_date: '2026-05-31', subtotal: 25000, tax_rate: 8.5, tax_amount: 2125, total: 27125, notes: 'Cloud Migration Phase 1', items: [{ description: 'Migration planning & execution', quantity: 1, unit_price: 25000, total: 25000 }] },
    { contact_id: contMap['Emily Davis'], company_id: compMap['Umbrella Corp'], status: 'draft', issue_date: '2026-06-28', due_date: '2026-07-28', subtotal: 120000, tax_rate: 8.5, tax_amount: 10200, discount: 5000, total: 125200, notes: 'Analytics setup fee', items: [{ description: 'Healthcare Analytics Suite — Setup', quantity: 1, unit_price: 90000, total: 90000 }, { description: 'Training & onboarding', quantity: 2, unit_price: 15000, total: 30000 }] },
    { contact_id: contMap['Nina Petrova'], company_id: compMap['LexCorp'], status: 'draft', issue_date: '2026-07-01', due_date: '2026-08-01', subtotal: 300000, tax_rate: 8.5, tax_amount: 25500, total: 325500, notes: 'AI Platform Phase 1', items: [{ description: 'AI Platform — Architecture & Design', quantity: 1, unit_price: 150000, total: 150000 }, { description: 'Data integration pipelines', quantity: 1, unit_price: 100000, total: 100000 }, { description: 'Model training infrastructure', quantity: 1, unit_price: 50000, total: 50000 }] },
    { contact_id: contMap['David Kim'], company_id: compMap['Stark Industries'], status: 'sent', issue_date: '2026-06-20', due_date: '2026-07-20', subtotal: 200000, tax_rate: 8.5, tax_amount: 17000, total: 217000, notes: 'Energy Platform Milestone 1', items: [{ description: 'Green energy dashboard MVP', quantity: 1, unit_price: 200000, total: 200000 }] },
  ];
  for (const inv of invoices) {
    const created = await auth('/invoices', { method: 'POST', body: JSON.stringify(inv) });
    log(`Invoice: ${created.invoice_number} — ${inv.status} $${inv.total.toLocaleString()}`);
  }

  // ── Step 6: Conversations ──
  console.log('\n━━━ CONVERSATIONS ━━━');
  const convs = [
    { contact_id: contMap['John Smith'], company_id: compMap['Acme Corp'], subject: 'Enterprise License Discussion', channel: 'email', initial_message: 'Hi John, following up on our call about the enterprise license. I have some questions about the pricing tiers.' },
    { contact_id: contMap['Sarah Johnson'], company_id: compMap['Globex Industries'], subject: 'Factory Automation Timeline', channel: 'email', initial_message: 'Sarah, can we schedule a call to review the POC timeline? The team has some concerns about integration.' },
    { contact_id: contMap['Mike Chen'], company_id: compMap['Initech Solutions'], subject: 'Cloud Migration Status', channel: 'chat', initial_message: 'Hey Mike, how is the cloud migration going? Do you need any support from our side?' },
    { contact_id: contMap['Emily Davis'], company_id: compMap['Umbrella Corp'], subject: 'Product Demo Follow-up', channel: 'email', initial_message: 'Emily, thanks for the demo yesterday. Do you have the compliance docs ready for review?' },
    { contact_id: contMap['Nina Petrova'], company_id: compMap['LexCorp'], subject: 'AI Platform Contract Review', channel: 'email', initial_message: 'Nina, legal has sent over the revised contract. Please review sections 4-7 regarding data ownership.' },
  ];
  const convIds = [];
  for (const cv of convs) {
    const created = await auth('/conversations', { method: 'POST', body: JSON.stringify(cv) });
    convIds.push(created.id);
    log(`Conversation: "${cv.subject}" (${cv.channel})`);

    const replies = [
      { content: 'Thanks for reaching out! Let me review and get back to you shortly.', sender_type: 'contact' },
      { content: 'I have reviewed everything and it looks good. Can we move forward?', sender_type: 'contact' },
    ];
    for (const reply of replies) {
      await auth(`/conversations/${created.id}/messages`, { method: 'POST', body: JSON.stringify(reply) });
    }
    log('  2 reply messages added');
  }

  // ── Step 7: Activities ──
  console.log('\n━━━ ACTIVITIES ━━━');
  const activities = [
    { type: 'call', subject: 'Initial discovery call', description: 'Discussed CRM needs and current pain points', contact_id: contMap['John Smith'], company_id: compMap['Acme Corp'], status: 'completed', due_date: '2026-06-15' },
    { type: 'meeting', subject: 'POC demo presentation', description: 'Demoed the factory automation module', contact_id: contMap['Sarah Johnson'], company_id: compMap['Globex Industries'], status: 'completed', due_date: '2026-06-20' },
    { type: 'email', subject: 'Sent proposal document', description: 'Attached the formal proposal and pricing sheet', contact_id: contMap['Mike Chen'], company_id: compMap['Initech Solutions'], status: 'completed', due_date: '2026-06-22' },
    { type: 'task', subject: 'Follow up on pricing', description: 'Need to resend pricing options for the analytics suite', contact_id: contMap['Emily Davis'], company_id: compMap['Umbrella Corp'], status: 'pending', due_date: '2026-07-05' },
    { type: 'call', subject: 'Quarterly review call', description: 'Review Q2 performance and set Q3 targets', contact_id: contMap['Robert Wilson'], company_id: compMap['Acme Corp'], status: 'pending', due_date: '2026-07-10' },
    { type: 'task', subject: 'Prepare contract amendment', description: 'Legal needs the revised terms for LexCorp deal', contact_id: contMap['Nina Petrova'], company_id: compMap['LexCorp'], status: 'pending', due_date: '2026-07-03' },
    { type: 'meeting', subject: 'Security compliance review', description: 'Annual review with Wayne security team', contact_id: contMap['Jessica Lee'], company_id: compMap['Wayne Enterprises'], status: 'pending', due_date: '2026-07-08' },
    { type: 'email', subject: 'Follow-up: lab tools demo', description: 'Sent links to the lab management demo videos', contact_id: contMap['Alex Rodriguez'], company_id: compMap['Oscorp'], status: 'completed', due_date: '2026-06-28' },
    { type: 'call', subject: 'Cold outreach — Stark', description: 'Initial contact with Stark procurement team', contact_id: contMap['James Taylor'], company_id: compMap['Stark Industries'], status: 'completed', due_date: '2026-06-10' },
    { type: 'task', subject: 'Update CRM pipeline', description: 'Clean up stale deals and update stages', contact_id: contMap['David Kim'], company_id: compMap['Stark Industries'], status: 'pending', due_date: '2026-07-01' },
  ];
  for (const act of activities) {
    await auth('/activities', { method: 'POST', body: JSON.stringify(act) });
  }
  log(`${activities.length} activities created`);

  // ── Step 8: Tickets ──
  console.log('\n━━━ TICKETS ━━━');
  const tickets = [
    { subject: 'Login issue after v2.1 update', description: 'Users unable to login with SSO after the latest update. Affects ~50 users.', priority: 'urgent', contact_id: contMap['John Smith'], company_id: compMap['Acme Corp'], category: 'bug', source: 'web', tags: ['sso', 'login', 'urgent'] },
    { subject: 'Integration sync failing for Globex', description: 'The ERP integration keeps disconnecting every 2 hours. Need investigation.', priority: 'high', contact_id: contMap['Sarah Johnson'], company_id: compMap['Globex Industries'], category: 'integration', source: 'email', tags: ['erp', 'sync', 'connectivity'] },
    { subject: 'Feature request: Bulk import contacts', description: 'Would like the ability to import contacts from CSV with field mapping.', priority: 'medium', contact_id: contMap['Mike Chen'], company_id: compMap['Initech Solutions'], category: 'feature', source: 'chat', tags: ['import', 'csv', 'contacts'] },
    { subject: 'Billing discrepancy on INV-2026-0045', description: 'The invoice shows tax rate of 8.5% but our agreement says 7.25%.', priority: 'medium', contact_id: contMap['Emily Davis'], company_id: compMap['Umbrella Corp'], category: 'billing', source: 'email', tags: ['invoice', 'tax', 'billing'] },
    { subject: 'Account access for new team member', description: 'Need to add james.wilson@acme.com to the admin group for the CRM.', priority: 'low', contact_id: contMap['Robert Wilson'], company_id: compMap['Acme Corp'], category: 'support', source: 'web', tags: ['access', 'permissions'] },
    { subject: 'API rate limit reached during batch job', description: 'Nightly sync job hit the 1000 req/min limit. Need higher limits for enterprise tier.', priority: 'high', contact_id: contMap['Nina Petrova'], company_id: compMap['LexCorp'], category: 'support', source: 'web', tags: ['api', 'rate-limit', 'enterprise'] },
  ];
  const ticketIds = [];
  for (const t of tickets) {
    const created = await auth('/tickets', { method: 'POST', body: JSON.stringify(t) });
    ticketIds.push(created.id);
    log(`Ticket: ${created.ticket_number} — "${t.subject}" [${t.priority}]`);

    const comments = [
      { content: 'We are looking into this issue. Will update within 2 hours.', author_type: 'agent', is_internal: false },
    ];
    if (t.category === 'bug') {
      comments.push({ content: 'Root cause identified: missing config after deployment. Fix in progress.', author_type: 'agent', is_internal: false });
      comments.push({ content: 'ETA for fix: 4pm today. Hotfix PR ready for review.', author_type: 'agent', is_internal: true });
    }
    for (const comment of comments) {
      await auth(`/tickets/${created.id}/comments`, { method: 'POST', body: JSON.stringify(comment) });
    }
    log(`  ${comments.length} comment(s) added`);
  }

  // Update some ticket statuses
  await auth(`/tickets/${ticketIds[0]}/status`, { method: 'POST', body: JSON.stringify({ status: 'in_progress' }) });
  await auth(`/tickets/${ticketIds[4]}/status`, { method: 'POST', body: JSON.stringify({ status: 'resolved' }) });
  log('  Updated statuses: TKT-1 → in_progress, TKT-5 → resolved');

  // ── Step 9: Workflows ──
  console.log('\n━━━ WORKFLOWS ━━━');
  const workflows = [
    { name: 'Auto-follow up email on new deal', description: 'Sends an automated follow-up email when a new deal enters the pipeline', trigger_type: 'deal_created', trigger_config: { stage: 'lead' }, actions: [{ type: 'send_email', config: { template: 'welcome_deal' } }], status: 'active' },
    { name: 'Mark contact inactive after 60 days', description: 'Sets contact status to inactive if no activity for 60 days', trigger_type: 'contact_inactive', trigger_config: { days: 60 }, actions: [{ type: 'update_contact', config: { status: 'inactive' } }], status: 'active' },
    { name: 'Create task on deal stage change', description: 'Creates a follow-up task when a deal moves to a new stage', trigger_type: 'deal_updated', trigger_config: { watch_field: 'stage' }, actions: [{ type: 'create_activity', config: { type: 'task', subject_template: 'Follow up: {deal_name}' } }], status: 'draft' },
    { name: 'Slack notification for urgent tickets', description: 'Posts to Slack when a ticket with urgent priority is created', trigger_type: 'ticket_created', trigger_config: { priority: 'urgent' }, actions: [{ type: 'webhook', config: { url: 'https://hooks.slack.com/example', template: 'New urgent ticket: {subject}' } }], status: 'paused' },
    { name: 'Sync contacts on integration connect', description: 'Triggers a contact sync when a new integration is connected', trigger_type: 'integration_connected', trigger_config: { provider: 'hubspot' }, actions: [{ type: 'create_conversation', config: { channel: 'email', subject_template: 'Integration sync complete' } }], status: 'active' },
  ];
  for (const wf of workflows) {
    const created = await auth('/workflows', { method: 'POST', body: JSON.stringify(wf) });
    log(`Workflow: "${created.name}" [${created.trigger_type}] → ${created.status}`);
  }
  log('Toggling "mark contact inactive" workflow to paused');
  const allWfs = await auth('/workflows');
  const markInactiveWf = allWfs.find(w => w.name === 'Mark contact inactive after 60 days');
  if (markInactiveWf) await auth(`/workflows/${markInactiveWf.id}/toggle`, { method: 'POST' });

  // ── Step 10: API Tokens ──
  console.log('\n━━━ API TOKENS ━━━');
  const apiTokens = [
    { name: 'Production API Key', permissions: { contacts: { read: true, write: true, delete: true }, companies: { read: true, write: true, delete: true }, deals: { read: true, write: true, delete: true }, invoices: { read: true, write: false, delete: false }, conversations: { read: true, write: true, delete: false }, tickets: { read: true, write: true, delete: true } } },
    { name: 'Read-only Analytics Token', permissions: { contacts: { read: true, write: false, delete: false }, companies: { read: true, write: false, delete: false }, deals: { read: true, write: false, delete: false }, invoices: { read: true, write: false, delete: false }, conversations: { read: false, write: false, delete: false }, tickets: { read: true, write: false, delete: false } } },
    { name: 'CI/CD Integration Token', permissions: { contacts: { read: true, write: true, delete: false }, companies: { read: true, write: true, delete: false }, deals: { read: true, write: true, delete: false }, invoices: { read: false, write: false, delete: false }, conversations: { read: false, write: false, delete: false }, tickets: { read: true, write: true, delete: false } } },
  ];
  for (const tok of apiTokens) {
    const created = await auth('/apps', { method: 'POST', body: JSON.stringify(tok) });
    log(`Token: "${created.name}" — preview: ${created.token_preview}`);
  }

  // ── Step 11: Integrations ──
  console.log('\n━━━ INTEGRATIONS ━━━');
  try {
    await auth('/integrations/whatsapp/connect', {
      method: 'POST',
      body: JSON.stringify({ name: 'WhatsApp Business', phone_number_id: '123456789', access_token: 'wa-test-token-abc123', business_id: '987654321' }),
    });
    log('Integration: WhatsApp — connected');
    await auth('/integrations/whatsapp/sync', { method: 'POST' });
    log('  WhatsApp sync completed');
  } catch (e) { log(`WhatsApp integration skipped: ${e.message}`); }

  try {
    await auth('/integrations/hubspot/connect', {
      method: 'POST',
      body: JSON.stringify({ name: 'HubSpot CRM', api_key: 'hub-test-key-xyz789', portal_id: '12345' }),
    });
    log('Integration: HubSpot — connected');
    await auth('/integrations/hubspot/sync', { method: 'POST' });
    log('  HubSpot sync completed');
  } catch (e) { log(`HubSpot integration skipped: ${e.message}`); }

  try {
    await auth('/integrations/gmail/connect', {
      method: 'POST',
      body: JSON.stringify({ name: 'Gmail Sync', client_id: 'gmail-client-id', client_secret: 'gmail-secret', redirect_uri: 'https://app.example.com/oauth/callback' }),
    });
    log('Integration: Gmail — connected');
    await auth('/integrations/gmail/sync', { method: 'POST' });
    log('  Gmail sync completed');
  } catch (e) { log(`Gmail integration skipped: ${e.message}`); }

  // ── Step 12: AI Features ──
  console.log('\n━━━ AI FEATURES ━━━');
  try {
    const chatRes = await auth('/ai/chat', { method: 'POST', body: JSON.stringify({ message: 'What are the top 3 deals in our pipeline?', context: {} }) });
    log('AI Chat: response received');
  } catch (e) { log(`AI Chat skipped (API key may be missing): ${e.message.split('.')[0]}`); }

  try {
    if (dealIds.length > 0) {
      await auth('/ai/insights/deal', { method: 'POST', body: JSON.stringify({ deal_id: dealIds[0] }) });
      log('AI Deal Insight: generated');
    }
  } catch (e) { log(`AI Deal Insight skipped: ${e.message.split('.')[0]}`); }

  try {
    const firstContactId = Object.values(contMap)[0];
    if (firstContactId) {
      await auth('/ai/insights/contact', { method: 'POST', body: JSON.stringify({ contact_id: firstContactId }) });
      log('AI Contact Insight: generated');
    }
  } catch (e) { log(`AI Contact Insight skipped: ${e.message.split('.')[0]}`); }

  try {
    await auth('/ai/predictive/scoring', { method: 'POST' });
    log('AI Predictive Scoring: completed');
  } catch (e) { log(`AI Scoring skipped: ${e.message.split('.')[0]}`); }

  try {
    if (convIds.length > 0) {
      await auth('/ai/summarize-conversation', { method: 'POST', body: JSON.stringify({ conversation_id: convIds[0] }) });
      log('AI Conversation Summary: generated');
    }
  } catch (e) { log(`AI Summary skipped: ${e.message.split('.')[0]}`); }

  // ── Dashboard Summary ──
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║         DASHBOARD SUMMARY            ║');
  console.log('╚══════════════════════════════════════╝');
  const stats = await auth('/dashboard/stats');
  console.log(`  Contacts:  ${stats.totalContacts}`);
  console.log(`  Companies: ${stats.totalCompanies}`);
  console.log(`  Deals:     ${stats.totalDeals} (Open: ${stats.openDeals}, Won: ${stats.wonDeals})`);
  console.log(`  Pipeline:  $${(stats.pipelineValue || 0).toLocaleString()}`);
  console.log(`  Revenue:   $${(stats.totalRevenue || 0).toLocaleString()}`);
  console.log(`  Invoices:  ${stats.totalInvoices}`);
  console.log(`  Tickets:   ${stats.totalTickets} (Open: ${stats.openTickets}, Urgent: ${stats.urgentTickets})`);
  console.log(`  Win Rate:  ${stats.winRate}%`);
  console.log(`\n  Login: demo@smartcrm.com / demo123`);
  console.log(`  API:   ${BASE}`);
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║       SEED COMPLETE SUCCESSFULLY      ║');
  console.log('╚══════════════════════════════════════╝\n');
}

seed().catch(e => {
  console.error('\n══════════════════════════════════════');
  console.error('SEED FAILED:', e.message);
  console.error('══════════════════════════════════════\n');
  process.exit(1);
});
