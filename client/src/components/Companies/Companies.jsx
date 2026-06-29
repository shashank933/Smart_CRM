import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useStore } from '../../store/store';
import { Plus, Search, Building2, Globe, Users, MoreVertical, Edit, Trash2, Filter, X, Handshake, MapPin } from 'lucide-react';

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'Education',
  'Real Estate',
  'Consulting',
  'Media',
  'Energy',
  'Transportation',
  'Legal',
];

const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
];

const INITIAL_FORM = {
  name: '',
  industry: '',
  size: '',
  website: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: '',
  revenue: '',
  description: '',
  linkedin: '',
};

export default function Companies() {
  const navigate = useNavigate();
  const fetchStats = useStore(s => s.fetchStats);

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

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
      if (industryFilter) params.industry = industryFilter;
      const res = await api.getCompanies(params);
      setCompanies(Array.isArray(res) ? res : res.companies || res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, industryFilter]);

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

  const openEditModal = (company) => {
    setEditId(company.id);
    setForm({
      name: company.name || '',
      industry: company.industry || '',
      size: company.size || '',
      website: company.website || '',
      phone: company.phone || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      country: company.country || '',
      revenue: company.revenue || '',
      description: company.description || '',
      linkedin: company.linkedin || '',
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
    if (!form.name) {
      setFormError('Company name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        revenue: form.revenue ? Number(form.revenue) : null,
      };
      if (editId) {
        await api.updateCompany(editId, payload);
      } else {
        await api.createCompany(payload);
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
      await api.deleteCompany(id);
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

  const formatRevenue = (n) => {
    if (!n) return null;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Companies</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage organizations and accounts</p>
        </div>
        <button className="clay-btn clay-btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Add Company
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="clay-input"
            placeholder="Search companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '42px' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }} />
          <select
            className="clay-input"
            value={industryFilter}
            onChange={e => setIndustryFilter(e.target.value)}
            style={{ paddingLeft: '36px', width: '180px', appearance: 'none', cursor: 'pointer' }}
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
        {error && (
          <div style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', flexBasis: '100%' }}>
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px' }}><X size={14} /></button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="clay-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div className="clay-skeleton" style={{ width: '140px', height: '22px' }} />
                <div className="clay-skeleton" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
              </div>
              <div className="clay-skeleton" style={{ width: '80px', height: '22px', borderRadius: 'var(--radius-full)', marginBottom: '16px' }} />
              <div style={{ display: 'flex', gap: '24px', marginBottom: '14px' }}>
                <div className="clay-skeleton" style={{ width: '60px', height: '14px' }} />
                <div className="clay-skeleton" style={{ width: '60px', height: '14px' }} />
              </div>
              <div className="clay-skeleton" style={{ width: '180px', height: '14px', marginBottom: '8px' }} />
              <div className="clay-skeleton" style={{ width: '140px', height: '14px' }} />
            </div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="clay-empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--clay-shadow)', border: '1px solid rgba(255,255,255,0.6)' }}>
          <Building2 size={48} style={{ opacity: 0.4, color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No companies found</h3>
          <p style={{ marginBottom: '20px' }}>
            {search || industryFilter ? 'Try adjusting your search or filters.' : 'Get started by adding your first company.'}
          </p>
          {(search || industryFilter) ? (
            <button className="clay-btn" onClick={() => { setSearch(''); setIndustryFilter(''); }}>Clear Filters</button>
          ) : (
            <button className="clay-btn clay-btn-primary" onClick={openCreateModal}>
                <Plus size={16} /> Add Company
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {companies.map(company => (
            <div
              key={company.id}
              className="clay-card"
              style={{ padding: '24px', cursor: 'pointer' }}
              onClick={() => navigate(`/companies/${company.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.3 }}>{company.name}</h3>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    className="clay-btn clay-btn-sm clay-btn-ghost"
                    onClick={e => { e.stopPropagation(); toggleActions(company.id); }}
                    style={{ padding: '4px 6px' }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {actionOpen === company.id && (
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
                        onClick={() => openEditModal(company)}
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px',
                          border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px',
                          color: 'var(--danger)', fontFamily: 'inherit',
                        }}
                        onClick={() => { setDeleteConfirm(company.id); setActionOpen(null); }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {company.industry && (
                <span className="clay-badge clay-badge-accent" style={{ marginBottom: '16px' }}>
                  {company.industry}
                </span>
              )}

              <div style={{ display: 'flex', gap: '24px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Users size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontWeight: 600 }}>{company.contacts_count ?? 0}</span>
                  <span style={{ color: 'var(--text-muted)' }}>contacts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Handshake size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontWeight: 600 }}>{company.deals_count ?? 0}</span>
                  <span style={{ color: 'var(--text-muted)' }}>deals</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {company.website && (
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    <Globe size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {(company.city || company.state || company.country) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    {[company.city, company.state, company.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <div className="clay-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="clay-modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="clay-modal-header">
              <h2>Delete Company</h2>
              <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={() => setDeleteConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="clay-modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete this company? This action cannot be undone and may affect associated contacts and deals.
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
          <div className="clay-modal" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
            <div className="clay-modal-header">
              <h2>{editId ? 'Edit Company' : 'Add Company'}</h2>
              <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="clay-modal-body">
                {formError && (
                  <div style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '20px' }}>
                    {formError}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="clay-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="clay-form-label">Company Name *</label>
                    <input className="clay-input" name="name" value={form.name} onChange={handleFormChange} required placeholder="e.g. Acme Corp" />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Industry</label>
                    <input className="clay-input" name="industry" value={form.industry} onChange={handleFormChange} list="industry-list" placeholder="e.g. Technology" />
                    <datalist id="industry-list">
                      {INDUSTRIES.map(ind => <option key={ind} value={ind} />)}
                    </datalist>
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Company Size</label>
                    <select className="clay-input" name="size" value={form.size} onChange={handleFormChange} style={{ appearance: 'none', cursor: 'pointer' }}>
                      <option value="">Select size</option>
                      {COMPANY_SIZES.map(s => (
                        <option key={s} value={s}>{s} employees</option>
                      ))}
                    </select>
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Website</label>
                    <input className="clay-input" name="website" value={form.website} onChange={handleFormChange} placeholder="www.example.com" />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Phone</label>
                    <input className="clay-input" name="phone" value={form.phone} onChange={handleFormChange} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Address</label>
                    <input className="clay-input" name="address" value={form.address} onChange={handleFormChange} placeholder="123 Main St" />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">City</label>
                    <input className="clay-input" name="city" value={form.city} onChange={handleFormChange} />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">State</label>
                    <input className="clay-input" name="state" value={form.state} onChange={handleFormChange} />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Country</label>
                    <input className="clay-input" name="country" value={form.country} onChange={handleFormChange} />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Annual Revenue</label>
                    <input className="clay-input" name="revenue" type="number" value={form.revenue} onChange={handleFormChange} placeholder="0" />
                  </div>
                  <div className="clay-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="clay-form-label">LinkedIn URL</label>
                    <input className="clay-input" name="linkedin" value={form.linkedin} onChange={handleFormChange} placeholder="https://linkedin.com/company/..." />
                  </div>
                  <div className="clay-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="clay-form-label">Description</label>
                    <textarea
                      className="clay-input"
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      rows={3}
                      style={{ resize: 'vertical' }}
                      placeholder="Brief description of the company..."
                    />
                  </div>
                </div>
              </div>
              <div className="clay-modal-footer">
                <button type="button" className="clay-btn" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="clay-btn clay-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editId ? 'Update Company' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
