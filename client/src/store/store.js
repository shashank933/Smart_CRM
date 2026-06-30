import { create } from 'zustand';
import { api } from '../api';

export const useStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),
  theme: localStorage.getItem('crm-theme') || 'midnight',
  sidebarCollapsed: true,
  stats: null,
  contacts: [],
  companies: [],
  deals: [],
  dealStages: [],
  invoices: [],
  conversations: [],
  loading: false,

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
    const theme = localStorage.getItem('crm-theme') || 'midnight';
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
