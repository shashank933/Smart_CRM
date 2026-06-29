const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  // Generic request
  request,

  // Auth
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  deleteAccount: () => request('/auth/account', { method: 'DELETE' }),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Dashboard
  getStats: () => request('/dashboard/stats'),
  getRecentActivities: () => request('/dashboard/recent-activities'),

  // Contacts
  getContacts: (params = {}) => request(`/contacts?${new URLSearchParams(params)}`),
  getContact: (id) => request(`/contacts/${id}`),
  createContact: (data) => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id, data) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),

  // Companies
  getCompanies: (params = {}) => request(`/companies?${new URLSearchParams(params)}`),
  getCompany: (id) => request(`/companies/${id}`),
  createCompany: (data) => request('/companies', { method: 'POST', body: JSON.stringify(data) }),
  updateCompany: (id, data) => request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCompany: (id) => request(`/companies/${id}`, { method: 'DELETE' }),

  // Deals
  getDeals: (params = {}) => request(`/deals?${new URLSearchParams(params)}`),
  getDealStages: () => request('/deals/stages'),
  getDeal: (id) => request(`/deals/${id}`),
  createDeal: (data) => request('/deals', { method: 'POST', body: JSON.stringify(data) }),
  updateDeal: (id, data) => request(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDeal: (id) => request(`/deals/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: (params = {}) => request(`/invoices?${new URLSearchParams(params)}`),
  getInvoice: (id) => request(`/invoices/${id}`),
  createInvoice: (data) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id, data) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),

  // Conversations
  getConversations: (params = {}) => request(`/conversations?${new URLSearchParams(params)}`),
  getConversation: (id) => request(`/conversations/${id}`),
  createConversation: (data) => request('/conversations', { method: 'POST', body: JSON.stringify(data) }),
  updateConversation: (id, data) => request(`/conversations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  sendMessage: (id, data) => request(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify(data) }),

  // Activities
  getActivities: (params = {}) => request(`/activities?${new URLSearchParams(params)}`),
  createActivity: (data) => request('/activities', { method: 'POST', body: JSON.stringify(data) }),
  updateActivity: (id, data) => request(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteActivity: (id) => request(`/activities/${id}`, { method: 'DELETE' }),

  // AI
  aiChat: (data) => request('/ai/chat', { method: 'POST', body: JSON.stringify(data) }),
  dealInsight: (deal_id) => request('/ai/insights/deal', { method: 'POST', body: JSON.stringify({ deal_id }) }),
  contactInsight: (contact_id) => request('/ai/insights/contact', { method: 'POST', body: JSON.stringify({ contact_id }) }),
  generateEmail: (data) => request('/ai/generate-email', { method: 'POST', body: JSON.stringify(data) }),
  summarizeConversation: (conversation_id) => request('/ai/summarize-conversation', { method: 'POST', body: JSON.stringify({ conversation_id }) }),
  getInsights: (entityType, entityId) => request(`/ai/insights/${entityType}/${entityId}`),
  predictiveScoring: () => request('/ai/predictive/scoring', { method: 'POST' }),

  // Tickets
  getTickets: (params = {}) => request(`/tickets?${new URLSearchParams(params)}`),
  getTicket: (id) => request(`/tickets/${id}`),
  createTicket: (data) => request('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  updateTicket: (id, data) => request(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTicket: (id) => request(`/tickets/${id}`, { method: 'DELETE' }),
  updateTicketStatus: (id, status) => request(`/tickets/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  addTicketComment: (id, data) => request(`/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  summarizeTicket: (id) => request(`/tickets/${id}/summarize`, { method: 'POST' }),
  suggestTicketReply: (id) => request(`/tickets/${id}/suggest-reply`, { method: 'POST' }),
  getTicketStats: () => request('/tickets/stats/overview'),

  // Calendar
  getCalendarEvents: (start, end) => request(`/activities/calendar?start=${start}&end=${end}`),

  // Integrations
  getIntegrations: () => request('/integrations'),
  connectIntegration: (provider, data) => request(`/integrations/${provider}/connect`, { method: 'POST', body: JSON.stringify(data) }),
  disconnectIntegration: (provider) => request(`/integrations/${provider}/disconnect`, { method: 'POST' }),
  testIntegration: (provider) => request(`/integrations/${provider}/test`, { method: 'POST' }),
  syncIntegration: (provider) => request(`/integrations/${provider}/sync`, { method: 'POST' }),
  getIntegrationWebhook: (provider) => request(`/integrations/${provider}/webhook-url`),
};
