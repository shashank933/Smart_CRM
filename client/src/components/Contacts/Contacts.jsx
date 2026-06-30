import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useStore } from '../../store/store';
import { Plus, Search, Mail, Phone, MoreVertical, Edit, Trash2, Building2, Filter, X } from 'lucide-react';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #6366f1, #a5b4fc)',
  'linear-gradient(135deg, #4f46e5, #818cf8)',
  'linear-gradient(135deg, #71717a, #a1a1aa)',
  'linear-gradient(135deg, #a1a1aa, #d4d4d8)',
  'linear-gradient(135deg, #818cf8, #a5b4fc)',
  'linear-gradient(135deg, #a1a1aa, #d4d4d8)',
  'linear-gradient(135deg, #a5b4fc, #818cf8)',
  'linear-gradient(135deg, #818cf8, #a5b4fc)',
];

function getInitials(first, last) {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || '?';
}

function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const STATUS_MAP = {
  active: { label: 'Active', className: 'clay-badge-success' },
  inactive: { label: 'Inactive', className: 'clay-badge-danger' },
  lead: { label: 'Lead', className: 'clay-badge-warning' },
  customer: { label: 'Customer', className: 'clay-badge-info' },
};

const INITIAL_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  mobile: '',
  title: '',
  department: '',
  company_id: '',
  status: 'active',
  notes: '',
};

export default function Contacts() {
  const navigate = useNavigate();
  const fetchStats = useStore(s => s.fetchStats);

  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionOpen, setActionOpen] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [contactsRes, companiesRes] = await Promise.all([
        api.getContacts(params),
        api.getCompanies(),
      ]);
      setContacts(Array.isArray(contactsRes) ? contactsRes : contactsRes.contacts || contactsRes.data || []);
      setCompanies(Array.isArray(companiesRes) ? companiesRes : companiesRes.companies || companiesRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setEditId(null);
    setForm({ ...INITIAL_FORM });
    setFormError('');
    setShowModal(true);
    setActionOpen(null);
  };

  const openEditModal = (contact) => {
    setEditId(contact.id);
    setForm({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      title: contact.title || '',
      department: contact.department || '',
      company_id: contact.company_id || '',
      status: contact.status || 'active',
      notes: contact.notes || '',
    });
    setFormError('');
    setShowModal(true);
    setActionOpen(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm({ ...INITIAL_FORM });
    setFormError('');
  };

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (formError) setFormError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.first_name || !form.email) {
      setFormError('First name and email are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        company_id: form.company_id ? Number(form.company_id) : null,
      };
      if (editId) {
        await api.updateContact(editId, payload);
      } else {
        await api.createContact(payload);
      }
      closeModal();
      fetchStats();
      fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteContact(id);
      setDeleteConfirm(null);
      setActionOpen(null);
      fetchStats();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActions = (id) => {
    setActionOpen(prev => (prev === id ? null : id));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Contacts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage your contacts and relationships</p>
        </div>
        <button className="clay-btn clay-btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Add Contact
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="clay-input"
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '42px' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }} />
          <select
            className="clay-input"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ paddingLeft: '36px', width: '160px', appearance: 'none', cursor: 'pointer' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="lead">Lead</option>
            <option value="customer">Customer</option>
          </select>
        </div>
        {error && (
            <div style={{ background: 'rgba(113,113,122,0.15)', color: 'var(--danger)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', flexBasis: '100%' }}>
              {error}
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px' }}><X size={14} /></button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="clay-card" style={{ padding: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="clay-skeleton" style={{ height: '48px', borderRadius: '8px' }} />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="clay-empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--clay-shadow)', border: '1px solid rgba(255,255,255,0.6)' }}>
          <Building2 size={48} style={{ opacity: 0.4, color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No contacts found</h3>
          <p style={{ marginBottom: '20px' }}>
            {search || statusFilter ? 'Try adjusting your search or filters.' : 'Get started by adding your first contact.'}
          </p>
          {(search || statusFilter) ? (
            <button className="clay-btn" onClick={() => { setSearch(''); setStatusFilter(''); }}>Clear Filters</button>
          ) : (
            <button className="clay-btn clay-btn-primary" onClick={openCreateModal}>
              <Plus size={16} /> Add Contact
            </button>
          )}
        </div>
      ) : (
        <div className="clay-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="clay-table-desktop">
            <table className="clay-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(contact => (
                  <tr key={contact.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/contacts/${contact.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="clay-avatar" style={{ background: getAvatarColor(`${contact.first_name}${contact.last_name}`) }}>
                          {getInitials(contact.first_name, contact.last_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>
                            {contact.first_name} {contact.last_name}
                          </div>
                          {contact.title && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{contact.title}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={e => e.stopPropagation()}
                          style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '14px' }}
                        >
                          {contact.email}
                        </a>
                      )}
                    </td>
                    <td style={{ fontSize: '14px' }}>
                      {contact.phone || contact.mobile || ''}
                    </td>
                    <td>
                      {contact.company_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                          <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
                          {contact.company_name}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`clay-badge ${(STATUS_MAP[contact.status] || STATUS_MAP.active).className}`}>
                        {(STATUS_MAP[contact.status] || STATUS_MAP.active).label}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {formatDate(contact.created_at)}
                    </td>
                    <td>
                      <div style={{ position: 'relative' }}>
                        <button
                          className="clay-btn clay-btn-sm clay-btn-ghost"
                          onClick={e => { e.stopPropagation(); toggleActions(contact.id); }}
                          style={{ padding: '4px 6px' }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {actionOpen === contact.id && (
                          <div
                            style={{
                              position: 'absolute',
                              right: '0',
                              top: '36px',
                              background: 'var(--bg-card)',
                              borderRadius: 'var(--radius-sm)',
                              boxShadow: 'var(--clay-shadow)',
                              border: '1px solid rgba(255,255,255,0.6)',
                              zIndex: 50,
                              minWidth: '140px',
                              overflow: 'hidden',
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              style={{
                                display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px',
                                border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px',
                                color: 'var(--text-primary)', fontFamily: 'inherit',
                              }}
                              onClick={() => openEditModal(contact)}
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button
                              style={{
                                display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px',
                                border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px',
                                color: 'var(--danger)', fontFamily: 'inherit',
                              }}
                              onClick={() => { setDeleteConfirm(contact.id); setActionOpen(null); }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="clay-table-mobile" style={{ flexDirection: 'column' }}>
            {contacts.map(contact => (
              <div key={contact.id} className="clay-mobile-card" onClick={() => navigate(`/contacts/${contact.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div className="clay-avatar" style={{ background: getAvatarColor(`${contact.first_name}${contact.last_name}`), width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '14px', color: 'white', flexShrink: 0 }}>
                    {getInitials(contact.first_name, contact.last_name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                      {contact.first_name} {contact.last_name}
                    </div>
                    {contact.title && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{contact.title}</div>
                    )}
                  </div>
                </div>
                <div className="clay-mobile-card-row">
                  <span className="label">Email</span>
                  <span className="value">{contact.email || '—'}</span>
                </div>
                {contact.phone && (
                  <div className="clay-mobile-card-row">
                    <span className="label">Phone</span>
                    <span className="value">{contact.phone}</span>
                  </div>
                )}
                {contact.company_name && (
                  <div className="clay-mobile-card-row">
                    <span className="label">Company</span>
                    <span className="value">{contact.company_name}</span>
                  </div>
                )}
                <div className="clay-mobile-card-row">
                  <span className="label">Status</span>
                  <span className="value">
                    <span className={`clay-badge ${(STATUS_MAP[contact.status] || STATUS_MAP.active).className}`}>
                      {(STATUS_MAP[contact.status] || STATUS_MAP.active).label}
                    </span>
                  </span>
                </div>
                <div className="clay-mobile-card-row">
                  <span className="label">Created</span>
                  <span className="value">{formatDate(contact.created_at)}</span>
                </div>
                <div className="clay-mobile-card-actions">
                  <button className="clay-btn clay-btn-sm" onClick={(e) => { e.stopPropagation(); openEditModal(contact); }}>
                    <Edit size={14} /> Edit
                  </button>
                  <button className="clay-btn clay-btn-sm" style={{ color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); setDeleteConfirm(contact.id); }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="clay-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="clay-modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="clay-modal-header">
              <h2>Delete Contact</h2>
              <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={() => setDeleteConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="clay-modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete this contact? This action cannot be undone.
              </p>
            </div>
            <div className="clay-modal-footer">
              <button className="clay-btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="clay-btn clay-btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="clay-modal-overlay" onClick={closeModal}>
          <div className="clay-modal" style={{ maxWidth: '660px' }} onClick={e => e.stopPropagation()}>
            <div className="clay-modal-header">
              <h2>{editId ? 'Edit Contact' : 'Add Contact'}</h2>
              <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="clay-modal-body">
                {formError && (
                    <div style={{ background: 'rgba(113,113,122,0.15)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '20px' }}>
                      {formError}
                  </div>
                )}
                <div className="clay-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="clay-form-group">
                    <label className="clay-form-label">First Name *</label>
                    <input className="clay-input" name="first_name" value={form.first_name} onChange={handleFormChange} required />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Last Name</label>
                    <input className="clay-input" name="last_name" value={form.last_name} onChange={handleFormChange} />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Email *</label>
                    <input className="clay-input" name="email" type="email" value={form.email} onChange={handleFormChange} required />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Phone</label>
                    <input className="clay-input" name="phone" value={form.phone} onChange={handleFormChange} />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Mobile</label>
                    <input className="clay-input" name="mobile" value={form.mobile} onChange={handleFormChange} />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Title</label>
                    <input className="clay-input" name="title" value={form.title} onChange={handleFormChange} />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Department</label>
                    <input className="clay-input" name="department" value={form.department} onChange={handleFormChange} />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Company</label>
                    <select className="clay-input" name="company_id" value={form.company_id} onChange={handleFormChange} style={{ appearance: 'none', cursor: 'pointer' }}>
                      <option value="">No Company</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Status</label>
                    <select className="clay-input" name="status" value={form.status} onChange={handleFormChange} style={{ appearance: 'none', cursor: 'pointer' }}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="lead">Lead</option>
                      <option value="customer">Customer</option>
                    </select>
                  </div>
                </div>
                <div className="clay-form-group" style={{ marginTop: '4px' }}>
                  <label className="clay-form-label">Notes</label>
                  <textarea
                    className="clay-input"
                    name="notes"
                    value={form.notes}
                    onChange={handleFormChange}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
              <div className="clay-modal-footer">
                <button type="button" className="clay-btn" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="clay-btn clay-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editId ? 'Update Contact' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
