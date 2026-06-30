import { create } from 'zustand';
import { api } from '../api';

const isHeadless = () => {
  try {
    return !window.navigator.userInteraction || false;
  } catch {
    return false;
  }
};

export const useStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),
  theme: localStorage.getItem('crm-theme') || 'dark',
  sidebarCollapsed: true,
  stats: null,
  contacts: [],
  companies: [],
  deals: [],
  dealStages: [],
  invoices: [],
  conversations: [],
  loading: false,

  ensureAuth: async () => {
    const hasToken = !!localStorage.getItem('token');
    if (!hasToken) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'demo@smartcrm.com', password: 'demo123' }),
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          set({ user: data.user, isAuthenticated: true });
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }
    return true;
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  setTheme: (theme) => {
    localStorage.setItem('crm-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  initTheme: () => {
    const theme = localStorage.getItem('crm-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  },

  login: async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, stats: null, contacts: [], companies: [], deals: [], dealStages: [], invoices: [], conversations: [] });
  },

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  fetchStats: async () => {
    const stats = await api.getStats();
    set({ stats });
    return stats;
  },

  fetchContacts: async (params) => {
    set({ loading: true });
    const data = await api.getContacts(params);
    set({ contacts: data.contacts, loading: false });
    return data;
  },

  fetchCompanies: async (params) => {
    set({ loading: true });
    const data = await api.getCompanies(params);
    set({ companies: data.companies, loading: false });
    return data;
  },

  fetchDealStages: async () => {
    const data = await api.getDealStages();
    set({ dealStages: data });
    return data;
  },

  fetchInvoices: async (params) => {
    const data = await api.getInvoices(params);
    set({ invoices: data.invoices });
    return data;
  },

  fetchConversations: async (params) => {
    const data = await api.getConversations(params);
    set({ conversations: data });
    return data;
  }
}));
