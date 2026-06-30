import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { Plus, Search, Filter, Clock, AlertCircle, CheckCircle2, ArrowUpCircle, MessageSquare, Trash2, User, Tag } from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  contact_name?: string;
  company_name?: string;
  comment_count?: number;
  category?: string;
  tags_parsed?: string[];
  created_at: string;
  updated_at: string;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <AlertCircle size={14} color="var(--warning)" />,
  in_progress: <ArrowUpCircle size={14} color="var(--info)" />,
  pending: <Clock size={14} color="var(--warning)" />,
  resolved: <CheckCircle2 size={14} color="var(--success)" />,
  closed: <CheckCircle2 size={14} color="var(--text-muted)" />
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'clay-badge-danger',
  high: 'clay-badge-warning',
  medium: 'clay-badge-info',
  low: 'clay-badge-accent'
};

export default function Tickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium', category: '', contact_id: '', source: 'web' });
  const [contacts, setContacts] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const ticketIdToDeleteRef = useRef<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const data = await api.getTickets(params);
      setTickets(data.tickets);
      setStatusCounts(data.statusCounts || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [statusFilter, priorityFilter]);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchTickets();
  };

  const handleCreate = async () => {
    if (!form.subject.trim()) return;
    try {
      const created = await api.createTicket(form);
      setShowCreate(false);
      setForm({ subject: '', description: '', priority: 'medium', category: '', contact_id: '', source: 'web' });
      fetchTickets();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    ticketIdToDeleteRef.current = id;
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ticketIdToDeleteRef.current) return;
    setConfirmOpen(false);
    try {
      await api.deleteTicket(ticketIdToDeleteRef.current);
      ticketIdToDeleteRef.current = null;
      fetchTickets();
    } catch (e) { console.error(e); }
  };

  const loadContacts = async () => {
    try {
      const data = await api.getContacts({ limit: 200 });
      setContacts(data.contacts || []);
    } catch (e) { console.error(e); }
  };

  const statusTabs = ['', 'open', 'in_progress', 'pending', 'resolved', 'closed'];

  const s = {
    container: { maxWidth: '1200px' as const },
    header: { display: 'flex' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: '20px' as const },
    filters: { display: 'flex' as const, gap: '12px' as const, marginBottom: '20px' as const, flexWrap: 'wrap' as const },
    statsRow: { display: 'flex' as const, gap: '12px' as const, marginBottom: '20px' as const, flexWrap: 'wrap' as const },
    statPill: {
      padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600,
      cursor: 'pointer', border: 'none', fontFamily: 'inherit',
      background: 'var(--bg-glass)', boxShadow: 'var(--clay-shadow-sm)',
      display: 'flex' as const, alignItems: 'center' as const, gap: '6px' as const
    },
    table: { width: '100%' as const, borderCollapse: 'separate' as const, borderSpacing: '0' as const },
    th: { textAlign: 'left' as const, padding: '12px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(0,0,0,0.06)' as const },
    td: { padding: '12px 14px', fontSize: '13px', borderBottom: '1px solid rgba(0,0,0,0.04)' as const },
    tr: (isSelected: boolean) => ({ cursor: 'pointer' as const, background: isSelected ? 'var(--bg-glass)' : 'transparent' })
  };

  return (
    <div style={s.container}>
      <div className="page-header">
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Tickets</h1>
        <button className="clay-btn clay-btn-primary" onClick={() => { setShowCreate(true); loadContacts(); }}>
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {/* Stats pills */}
      <div style={s.statsRow}>
        {statusTabs.map(st => {
          const count = st ? (statusCounts[st] || 0) : Object.values(statusCounts).reduce((a, b) => a + b, 0);
          return (
            <button key={st} style={{ ...s.statPill, background: statusFilter === st ? 'var(--accent-light)' : 'var(--bg-glass)', color: statusFilter === st ? 'white' : 'var(--text-secondary)', fontWeight: statusFilter === st ? 700 : 600 }}
              onClick={() => setStatusFilter(st)}>
              {st ? STATUS_ICONS[st] : null}
              {st ? st.replace('_', ' ') : 'All'} ({count})
            </button>
          );
        })}
      </div>

      {/* Search + filters */}
      <div style={s.filters}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="clay-input" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearch} style={{ paddingLeft: '34px', paddingTop: '8px', paddingBottom: '8px', fontSize: '13px' }} />
        </div>
        <select className="clay-input" value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); }} style={{ width: '140px', paddingTop: '8px', paddingBottom: '8px' }}>
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="clay-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1,2,3,4,5].map(i => <div key={i} className="clay-skeleton" style={{ height: '40px', borderRadius: '8px' }} />)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="clay-empty-state">
            <MessageSquare size={40} />
            <h3>No tickets found</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Create your first support ticket.</p>
          </div>
        ) : (
          <>
            <div className="clay-table-desktop">
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Ticket</th>
                    <th style={s.th}>Contact</th>
                    <th style={s.th}>Priority</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Category</th>
                    <th style={s.th}>Updated</th>
                    <th style={s.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} style={{ cursor: 'pointer' }}>
                      <td style={s.td}>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{t.subject}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.ticket_number}</div>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={12} />
                          <span>{t.contact_name || '—'}</span>
                        </div>
                        {t.company_name && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.company_name}</div>}
                      </td>
                      <td style={s.td}>
                        <span className={`clay-badge ${PRIORITY_COLORS[t.priority] || 'clay-badge-info'}`}>{t.priority}</span>
                      </td>
                      <td style={s.td}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500 }}>
                          {STATUS_ICONS[t.status]}{t.status.replace('_', ' ')}
                        </span>
                        {t.comment_count ? (
                          <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <MessageSquare size={10} /> {t.comment_count}
                          </span>
                        ) : null}
                      </td>
                      <td style={s.td}>
                        {t.category ? <span className="clay-tag">{t.category}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ ...s.td, fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(t.updated_at).toLocaleDateString()}
                      </td>
                      <td style={s.td}>
                        <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={(e) => handleDelete(t.id, e)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="clay-table-mobile" style={{ flexDirection: 'column' }}>
              {tickets.map(t => (
                <div key={t.id} className="clay-mobile-card" onClick={() => navigate(`/tickets/${t.id}`)}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{t.subject}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '6px' }}>{t.ticket_number}</div>
                  <div className="clay-mobile-card-row">
                    <span className="label">Status</span>
                    <span className="value" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      {STATUS_ICONS[t.status]}{t.status.replace('_', ' ')}
                      {t.comment_count ? <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}><MessageSquare size={10} /> {t.comment_count}</span> : null}
                    </span>
                  </div>
                  <div className="clay-mobile-card-row">
                    <span className="label">Priority</span>
                    <span className="value"><span className={`clay-badge ${PRIORITY_COLORS[t.priority] || 'clay-badge-info'}`}>{t.priority}</span></span>
                  </div>
                  {t.contact_name && (
                    <div className="clay-mobile-card-row">
                      <span className="label">Contact</span>
                      <span className="value">{t.contact_name}</span>
                    </div>
                  )}
                  {t.category && (
                    <div className="clay-mobile-card-row">
                      <span className="label">Category</span>
                      <span className="value"><span className="clay-tag">{t.category}</span></span>
                    </div>
                  )}
                  <div className="clay-mobile-card-row">
                    <span className="label">Updated</span>
                    <span className="value">{new Date(t.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="clay-mobile-card-actions">
                    <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={(e) => handleDelete(t.id, e)} style={{ color: 'var(--danger)' }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="clay-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="clay-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="clay-modal-header"><h2>New Ticket</h2></div>
            <div className="clay-modal-body">
              <div className="clay-form-group">
                <label className="clay-form-label">Subject *</label>
                <input className="clay-input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Brief summary of the issue" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="clay-form-group">
                  <label className="clay-form-label">Priority</label>
                  <select className="clay-input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="clay-form-group">
                  <label className="clay-form-label">Source</label>
                  <select className="clay-input" value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
                    <option value="web">Web</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="chat">Chat</option>
                  </select>
                </div>
              </div>
              <div className="clay-form-group">
                <label className="clay-form-label">Category</label>
                <input className="clay-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g., Billing, Technical, Account" />
              </div>
              <div className="clay-form-group">
                <label className="clay-form-label">Contact</label>
                <select className="clay-input" value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}>
                  <option value="">None</option>
                  {(contacts || []).map(c => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="clay-form-group">
                <label className="clay-form-label">Description</label>
                <textarea className="clay-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} placeholder="Detailed description of the issue..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="clay-modal-footer">
              <button className="clay-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="clay-btn clay-btn-primary" onClick={handleCreate} disabled={!form.subject.trim()}>Create Ticket</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Ticket"
        message="Delete this ticket?"
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => { setConfirmOpen(false); ticketIdToDeleteRef.current = null; }}
      />
    </div>
  );
}
