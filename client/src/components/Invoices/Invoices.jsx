import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useStore } from '../../store/store';
import { Plus, Search, FileText, DollarSign, Calendar, User, Building2, MoreVertical, Edit, Trash2, Download, Filter, X } from 'lucide-react';

const STATUS_MAP = {
  draft: { label: 'Draft', className: 'clay-badge-info' },
  sent: { label: 'Sent', className: 'clay-badge-warning' },
  paid: { label: 'Paid', className: 'clay-badge-success' },
  overdue: { label: 'Overdue', className: 'clay-badge-danger' },
  cancelled: { label: 'Cancelled', className: 'clay-badge-danger' },
};

const STATUS_OPTIONS = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

const EMPTY_ITEM = { description: '', quantity: '1', unit_price: '0', total: '0' };

const INITIAL_FORM = {
  contact_id: '',
  company_id: '',
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  subtotal: '0',
  tax_rate: '0',
  discount: '0',
  total: '0',
  notes: '',
  items: [{ ...EMPTY_ITEM }],
};

function formatCurrency(n) {
  const num = Number(n);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Invoices() {
  const navigate = useNavigate();
  const fetchStats = useStore(s => s.fetchStats);

  const [invoices, setInvoices] = useState([]);
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

  const calcInvoiceTotal = useCallback((items, taxRate, discount) => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const tax = subtotal * (Number(taxRate) || 0) / 100;
    return Math.max(0, subtotal + tax - (Number(discount) || 0));
  }, []);

  const updateItemCalc = useCallback((items, taxRate, discount) => {
    const updated = items.map(item => ({
      ...item,
      total: String((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)),
    }));
    const subtotal = updated.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const tax = subtotal * (Number(taxRate) || 0) / 100;
    return {
      items: updated,
      subtotal: String(subtotal),
      total: String(Math.max(0, subtotal + tax - (Number(discount) || 0))),
    };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [invoicesRes, contactsRes, companiesRes] = await Promise.all([
        api.getInvoices(params),
        api.getContacts(),
        api.getCompanies(),
      ]);
      setInvoices(Array.isArray(invoicesRes) ? invoicesRes : invoicesRes.invoices || invoicesRes.data || []);
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

  const summary = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (Number(i.total) || 0), 0),
    outstanding: invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + (Number(i.total) || 0), 0),
    overdue: invoices.filter(i => i.status === 'overdue').length,
  };

  const openCreateModal = () => {
    setEditId(null);
    setForm({ ...INITIAL_FORM });
    setFormError('');
    setShowModal(true);
    setActionOpen(null);
  };

  const openEditModal = (invoice) => {
    setEditId(invoice.id);
    setForm({
      contact_id: invoice.contact_id ?? '',
      company_id: invoice.company_id ?? '',
      issue_date: invoice.issue_date ? invoice.issue_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      due_date: invoice.due_date ? invoice.due_date.slice(0, 10) : '',
      subtotal: invoice.subtotal ?? '0',
      tax_rate: invoice.tax_rate ?? '0',
      discount: invoice.discount ?? '0',
      total: invoice.total ?? '0',
      notes: invoice.notes || '',
      items: (invoice.items && invoice.items.length > 0)
        ? invoice.items.map(item => ({
            description: item.description || '',
            quantity: String(item.quantity ?? 1),
            unit_price: String(item.unit_price ?? 0),
            total: String(item.total ?? Number(item.quantity ?? 1) * Number(item.unit_price ?? 0)),
          }))
        : [{ ...EMPTY_ITEM }],
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
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'tax_rate' || name === 'discount') {
        const recalc = updateItemCalc(next.items, next.tax_rate, next.discount);
        return { ...next, subtotal: recalc.subtotal, total: recalc.total };
      }
      return next;
    });
    if (formError) setFormError('');
  };

  const handleItemChange = (index, field, value) => {
    setForm(prev => {
      const items = prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      const updated = items.map(item => ({
        ...item,
        total: field === 'quantity' || field === 'unit_price'
          ? String((Number(field === 'quantity' ? value : item.quantity) || 0) * (Number(field === 'unit_price' ? value : item.unit_price) || 0))
          : String((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)),
      }));
      const subtotal = updated.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
      const tax = subtotal * (Number(prev.tax_rate) || 0) / 100;
      return {
        ...prev,
        items: updated,
        subtotal: String(subtotal),
        total: String(Math.max(0, subtotal + tax - (Number(prev.discount) || 0))),
      };
    });
    if (formError) setFormError('');
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_ITEM }],
    }));
  };

  const removeItem = (index) => {
    setForm(prev => {
      if (prev.items.length <= 1) return prev;
      const items = prev.items.filter((_, i) => i !== index);
      const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
      const tax = subtotal * (Number(prev.tax_rate) || 0) / 100;
      return {
        ...prev,
        items,
        subtotal: String(subtotal),
        total: String(Math.max(0, subtotal + tax - (Number(prev.discount) || 0))),
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.contact_id && !form.company_id) {
      setFormError('Please select a contact or company.');
      return;
    }
    if ((form.items || []).length === 0) {
      setFormError('At least one invoice item is required.');
      return;
    }
    setSaving(true);
    try {
      const items = (form.items || []).map(item => ({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
        total: Number(item.total) || 0,
      }));
      const payload = {
        contact_id: form.contact_id ? Number(form.contact_id) : null,
        company_id: form.company_id ? Number(form.company_id) : null,
        issue_date: form.issue_date || null,
        due_date: form.due_date || null,
        subtotal: Number(form.subtotal) || 0,
        tax_rate: Number(form.tax_rate) || 0,
        discount: Number(form.discount) || 0,
        total: Number(form.total) || 0,
        notes: form.notes || '',
        items,
      };
      if (editId) {
        await api.updateInvoice(editId, payload);
      } else {
        await api.createInvoice(payload);
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
      await api.deleteInvoice(id);
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
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Invoices</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage your invoices and track payments</p>
        </div>
        <button className="clay-btn clay-btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Create Invoice
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="clay-stat-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--accent-light), #a5b4fc)' }}>
                <FileText size={20} />
            </div>
            <div>
              <div className="clay-stat-value" style={{ fontSize: '24px' }}>{summary.total}</div>
              <div className="clay-stat-label">Total Invoices</div>
            </div>
          </div>
        </div>
        <div className="clay-stat-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--success-light), var(--accent-light))' }}>
                <DollarSign size={20} />
            </div>
            <div>
              <div className="clay-stat-value" style={{ fontSize: '24px' }}>{formatCurrency(summary.paid)}</div>
              <div className="clay-stat-label">Paid Revenue</div>
            </div>
          </div>
        </div>
        <div className="clay-stat-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--warning-light), #d4d4d8)' }}>
                <DollarSign size={20} />
            </div>
            <div>
              <div className="clay-stat-value" style={{ fontSize: '24px' }}>{formatCurrency(summary.outstanding)}</div>
              <div className="clay-stat-label">Outstanding</div>
            </div>
          </div>
        </div>
        <div className="clay-stat-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--danger-light), #d4d4d8)' }}>
                <Calendar size={20} />
            </div>
            <div>
              <div className="clay-stat-value" style={{ fontSize: '24px' }}>{summary.overdue}</div>
              <div className="clay-stat-label">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="clay-input"
            placeholder="Search invoices..."
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
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{STATUS_MAP[s].label}</option>
            ))}
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
      ) : invoices.length === 0 ? (
        <div className="clay-empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--clay-shadow)', border: '1px solid rgba(255,255,255,0.6)' }}>
          <FileText size={48} style={{ opacity: 0.4, color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No invoices found</h3>
          <p style={{ marginBottom: '20px' }}>
            {search || statusFilter ? 'Try adjusting your search or filters.' : 'Get started by creating your first invoice.'}
          </p>
          {(search || statusFilter) ? (
            <button className="clay-btn" onClick={() => { setSearch(''); setStatusFilter(''); }}>Clear Filters</button>
          ) : (
            <button className="clay-btn clay-btn-primary" onClick={openCreateModal}>
              <Plus size={16} /> Create Invoice
            </button>
          )}
        </div>
      ) : (
        <div className="clay-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="clay-table-desktop">
            <table className="clay-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${invoice.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>
                          {invoice.invoice_number || `#${invoice.id}`}
                        </span>
                      </div>
                    </td>
                    <td>
                      {invoice.contact_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                          <User size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          {invoice.contact_name}
                        </div>
                      )}
                    </td>
                    <td>
                      {invoice.company_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                          <Building2 size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          {invoice.company_name}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <DollarSign size={14} style={{ color: 'var(--accent)' }} />
                        {formatCurrency(invoice.total)}
                      </div>
                    </td>
                    <td>
                      <span className={`clay-badge ${(STATUS_MAP[invoice.status] || STATUS_MAP.draft).className}`}>
                        {(STATUS_MAP[invoice.status] || STATUS_MAP.draft).label}
                      </span>
                    </td>
                    <td style={{ fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        {formatDate(invoice.issue_date)}
                      </div>
                    </td>
                    <td style={{ fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        {formatDate(invoice.due_date)}
                      </div>
                    </td>
                    <td>
                      <div style={{ position: 'relative' }}>
                        <button
                          className="clay-btn clay-btn-sm clay-btn-ghost"
                          onClick={e => { e.stopPropagation(); toggleActions(invoice.id); }}
                          style={{ padding: '4px 6px' }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {actionOpen === invoice.id && (
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
                              onClick={() => openEditModal(invoice)}
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button
                              style={{
                                display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px',
                                border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px',
                                color: 'var(--danger)', fontFamily: 'inherit',
                              }}
                              onClick={() => { setDeleteConfirm(invoice.id); setActionOpen(null); }}
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
            {invoices.map(invoice => (
              <div key={invoice.id} className="clay-mobile-card" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FileText size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>
                    {invoice.invoice_number || `#${invoice.id}`}
                  </span>
                  <span className={`clay-badge ${(STATUS_MAP[invoice.status] || STATUS_MAP.draft).className}`} style={{ marginLeft: 'auto' }}>
                    {(STATUS_MAP[invoice.status] || STATUS_MAP.draft).label}
                  </span>
                </div>
                <div className="clay-mobile-card-row">
                  <span className="label">Amount</span>
                  <span className="value" style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatCurrency(invoice.total)}</span>
                </div>
                {invoice.contact_name && (
                  <div className="clay-mobile-card-row">
                    <span className="label">Contact</span>
                    <span className="value">{invoice.contact_name}</span>
                  </div>
                )}
                {invoice.company_name && (
                  <div className="clay-mobile-card-row">
                    <span className="label">Company</span>
                    <span className="value">{invoice.company_name}</span>
                  </div>
                )}
                <div className="clay-mobile-card-row">
                  <span className="label">Issued</span>
                  <span className="value">{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="clay-mobile-card-row">
                  <span className="label">Due</span>
                  <span className="value">{formatDate(invoice.due_date)}</span>
                </div>
                <div className="clay-mobile-card-actions">
                  <button className="clay-btn clay-btn-sm" onClick={(e) => { e.stopPropagation(); openEditModal(invoice); }}>
                    <Edit size={14} /> Edit
                  </button>
                  <button className="clay-btn clay-btn-sm" style={{ color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); setDeleteConfirm(invoice.id); }}>
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
              <h2>Delete Invoice</h2>
              <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={() => setDeleteConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="clay-modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete this invoice? This action cannot be undone.
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
          <div className="clay-modal" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
            <div className="clay-modal-header">
              <h2>{editId ? 'Edit Invoice' : 'Create Invoice'}</h2>
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
                <div className="clay-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Contact</label>
                    <select className="clay-input" name="contact_id" value={form.contact_id} onChange={handleFormChange} style={{ appearance: 'none', cursor: 'pointer' }}>
                      <option value="">Select Contact</option>
                      {contacts.map(c => (
                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Company</label>
                    <select className="clay-input" name="company_id" value={form.company_id} onChange={handleFormChange} style={{ appearance: 'none', cursor: 'pointer' }}>
                      <option value="">Select Company</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Issue Date</label>
                    <input className="clay-input" name="issue_date" type="date" value={form.issue_date} onChange={handleFormChange} />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Due Date</label>
                    <input className="clay-input" name="due_date" type="date" value={form.due_date} onChange={handleFormChange} />
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label className="clay-form-label" style={{ marginBottom: '8px' }}>Invoice Items</label>
                  <div className="clay-invoice-items-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Qty</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unit Price</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</span>
                    <span></span>
                  </div>
                  {(form.items || []).map((item, idx) => (
                    <div key={idx} className="clay-invoice-items-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <input
                        className="clay-input"
                        placeholder="Item description"
                        value={item.description}
                        onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        style={{ padding: '10px 12px', fontSize: '13px' }}
                      />
                      <input
                        className="clay-input"
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        style={{ padding: '10px 12px', fontSize: '13px' }}
                      />
                      <input
                        className="clay-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                        style={{ padding: '10px 12px', fontSize: '13px' }}
                      />
                      <input
                        className="clay-input"
                        value={formatCurrency(item.total)}
                        readOnly
                        style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', fontWeight: 600 }}
                      />
                      <button
                        type="button"
                        className="clay-btn clay-btn-sm clay-btn-ghost"
                        onClick={() => removeItem(idx)}
                        style={{ padding: '6px', color: 'var(--danger)', justifyContent: 'center' }}
                        disabled={(form.items || []).length <= 1}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="clay-btn clay-btn-sm"
                    onClick={addItem}
                    style={{ marginTop: '4px' }}
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                <div className="clay-divider" />

                <div className="clay-invoice-summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Subtotal</label>
                    <input
                      className="clay-input"
                      value={formatCurrency(form.subtotal)}
                      readOnly
                      style={{ textAlign: 'right', fontWeight: 600 }}
                    />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Tax Rate (%)</label>
                    <input
                      className="clay-input"
                      name="tax_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.tax_rate}
                      onChange={handleFormChange}
                      style={{ textAlign: 'right' }}
                    />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Discount</label>
                    <input
                      className="clay-input"
                      name="discount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discount}
                      onChange={handleFormChange}
                      style={{ textAlign: 'right' }}
                    />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Total</label>
                    <input
                      className="clay-input"
                      value={formatCurrency(form.total)}
                      readOnly
                      style={{ textAlign: 'right', fontWeight: 700, fontSize: '16px', color: 'var(--accent)' }}
                    />
                  </div>
                </div>

                <div className="clay-form-group">
                  <label className="clay-form-label">Notes</label>
                  <textarea
                    className="clay-input"
                    name="notes"
                    value={form.notes}
                    onChange={handleFormChange}
                    rows={3}
                    style={{ resize: 'vertical' }}
                    placeholder="Additional notes or payment terms..."
                  />
                </div>
              </div>
              <div className="clay-modal-footer">
                <button type="button" className="clay-btn" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="clay-btn clay-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editId ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
