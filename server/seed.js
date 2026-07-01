const BASE = 'http://localhost:32778/api';

async function request(endpoint, options = {}, token) {
  const headers = { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...options.headers };
  const res = await fetch(`${BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(`${endpoint}: ${data.error || res.statusText}`);
  return data;
}

async function seed() {
  try {
    await request('/auth/register', { method: 'POST', body: JSON.stringify({ email: 'demo@smartcrm.com', password: 'demo123', name: 'Demo User' }) });
    console.log('User registered');
  } catch (e) {
    if (!e.message.includes('already exists')) throw e;
    console.log('User already exists, logging in...');
  }

  const { token } = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'demo@smartcrm.com', password: 'demo123' }) });
  const auth = (ep, opts = {}) => request(ep, opts, token);

  const companies = [
    { name: 'Acme Corp', industry: 'Technology', size: '51-200', website: 'https://acme.com', phone: '555-0100', city: 'San Francisco', state: 'CA', country: 'US', revenue: 5000000, description: 'Enterprise SaaS platform' },
    { name: 'Globex Industries', industry: 'Manufacturing', size: '201-500', website: 'https://globex.com', phone: '555-0200', city: 'Chicago', state: 'IL', country: 'US', revenue: 12000000 },
    { name: 'Initech Solutions', industry: 'Technology', size: '11-50', website: 'https://initech.io', phone: '555-0300', city: 'Austin', state: 'TX', country: 'US', revenue: 800000 },
    { name: 'Umbrella Corp', industry: 'Healthcare', size: '501-1000', website: 'https://umbrella.med', phone: '555-0400', city: 'Boston', state: 'MA', country: 'US', revenue: 25000000 }
  ];
  const compMap = {};
  for (const c of companies) {
    const created = await auth('/companies', { method: 'POST', body: JSON.stringify(c) });
    compMap[created.name] = created.id;
    console.log(`  Company: ${created.name}`);
  }

  const contacts = [
    { first_name: 'John', last_name: 'Smith', email: 'john@acme.com', phone: '555-1001', title: 'CEO', department: 'Executive', company_id: compMap['Acme Corp'] },
    { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@globex.com', phone: '555-2001', title: 'VP Sales', department: 'Sales', company_id: compMap['Globex Industries'] },
    { first_name: 'Mike', last_name: 'Chen', email: 'mike@initech.io', phone: '555-3001', title: 'CTO', department: 'Engineering', company_id: compMap['Initech Solutions'] },
    { first_name: 'Emily', last_name: 'Davis', email: 'emily@umbrella.med', phone: '555-4001', title: 'Marketing Director', department: 'Marketing', company_id: compMap['Umbrella Corp'] },
    { first_name: 'Robert', last_name: 'Wilson', email: 'robert@acme.com', phone: '555-1002', title: 'CFO', department: 'Finance', company_id: compMap['Acme Corp'], status: 'lead' },
    { first_name: 'Lisa', last_name: 'Brown', email: 'lisa@globex.com', phone: '555-2002', title: 'Product Manager', department: 'Product', company_id: compMap['Globex Industries'], status: 'inactive' }
  ];
  const contMap = {};
  for (const c of contacts) {
    const created = await auth('/contacts', { method: 'POST', body: JSON.stringify(c) });
    contMap[`${created.first_name} ${created.last_name}`] = created.id;
    console.log(`  Contact: ${created.first_name} ${created.last_name}`);
  }

  const deals = [
    { name: 'Enterprise License Deal', value: 250000, stage: 'negotiation', contact_id: contMap['John Smith'], company_id: compMap['Acme Corp'], probability: 70, expected_close: '2026-07-15', priority: 'high' },
    { name: 'Manufacturing Automation POC', value: 180000, stage: 'proposal', contact_id: contMap['Sarah Johnson'], company_id: compMap['Globex Industries'], probability: 50, expected_close: '2026-08-01', priority: 'high' },
    { name: 'Cloud Migration Project', value: 95000, stage: 'qualified', contact_id: contMap['Mike Chen'], company_id: compMap['Initech Solutions'], probability: 40, expected_close: '2026-09-15', priority: 'medium' },
    { name: 'Healthcare Analytics Suite', value: 420000, stage: 'lead', contact_id: contMap['Emily Davis'], company_id: compMap['Umbrella Corp'], probability: 15, expected_close: '2026-10-01', priority: 'medium' },
    { name: 'Annual Support Renewal', value: 45000, stage: 'closed_won', contact_id: contMap['Robert Wilson'], company_id: compMap['Acme Corp'], probability: 100, priority: 'low' },
    { name: 'Legacy System Upgrade', value: 120000, stage: 'closed_lost', contact_id: contMap['Lisa Brown'], company_id: compMap['Globex Industries'], probability: 0, priority: 'medium' }
  ];
  for (const d of deals) {
    await auth('/deals', { method: 'POST', body: JSON.stringify(d) });
    console.log(`  Deal: ${d.name} ($${d.value})`);
  }

  const invoices = [
    { contact_id: contMap['John Smith'], company_id: compMap['Acme Corp'], status: 'paid', issue_date: '2026-06-01', due_date: '2026-06-30', subtotal: 50000, tax_rate: 8.5, tax_amount: 4250, total: 54250, notes: 'Q2 License Fee' },
    { contact_id: contMap['Sarah Johnson'], company_id: compMap['Globex Industries'], status: 'sent', issue_date: '2026-06-15', due_date: '2026-07-15', subtotal: 75000, tax_rate: 8.5, tax_amount: 6375, discount: 1000, total: 80375, notes: 'Automation Consulting' },
    { contact_id: contMap['Mike Chen'], company_id: compMap['Initech Solutions'], status: 'overdue', issue_date: '2026-05-01', due_date: '2026-05-31', subtotal: 25000, tax_rate: 8.5, tax_amount: 2125, total: 27125, notes: 'Cloud Migration Phase 1' },
    { contact_id: contMap['Emily Davis'], company_id: compMap['Umbrella Corp'], status: 'draft', issue_date: '2026-06-28', due_date: '2026-07-28', subtotal: 120000, tax_rate: 8.5, tax_amount: 10200, discount: 5000, total: 125200 }
  ];
  for (const inv of invoices) {
    await auth('/invoices', { method: 'POST', body: JSON.stringify(inv) });
    console.log(`  Invoice: ${inv.status} $${inv.total}`);
  }

  await auth('/conversations', { method: 'POST', body: JSON.stringify({ contact_id: contMap['John Smith'], company_id: compMap['Acme Corp'], subject: 'Enterprise License Discussion', channel: 'email', initial_message: 'Hi John, following up on our call about the enterprise license...' }) });
  console.log('  Conversation created');

  const activities = [
    { type: 'call', subject: 'Initial discovery call', contact_id: contMap['John Smith'], company_id: compMap['Acme Corp'], status: 'completed' },
    { type: 'meeting', subject: 'POC demo presentation', contact_id: contMap['Sarah Johnson'], company_id: compMap['Globex Industries'], status: 'completed' },
    { type: 'email', subject: 'Sent proposal document', contact_id: contMap['Mike Chen'], company_id: compMap['Initech Solutions'], status: 'completed' },
    { type: 'task', subject: 'Follow up on pricing', contact_id: contMap['Emily Davis'], company_id: compMap['Umbrella Corp'], status: 'pending', due_date: '2026-07-05' },
    { type: 'call', subject: 'Quarterly review call', contact_id: contMap['Robert Wilson'], company_id: compMap['Acme Corp'], status: 'pending', due_date: '2026-07-10' }
  ];
  for (const act of activities) {
    await auth('/activities', { method: 'POST', body: JSON.stringify(act) });
  }
  console.log('  5 activities created');

  const stats = await auth('/dashboard/stats');
  console.log('\n=== DASHBOARD ===');
  console.log(`Contacts: ${stats.totalContacts} | Companies: ${stats.totalCompanies}`);
  console.log(`Deals: ${stats.totalDeals} (Open: ${stats.openDeals}, Won: ${stats.wonDeals})`);
  console.log(`Pipeline: $${stats.pipelineValue} | Revenue: $${stats.totalRevenue}`);
  console.log(`Invoices: ${stats.totalInvoices} | Win Rate: ${stats.winRate}%`);

  console.log('\nSeed complete! Login with demo@smartcrm.com / demo123');
}

seed().catch(e => {
  console.error('SEED FAILED:', e.message);
  process.exit(1);
});
