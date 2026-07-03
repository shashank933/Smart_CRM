import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useStore } from '../../store/store';
import { Plus, DollarSign, Calendar, User, Building2, MoreVertical, Edit, Trash2, GripVertical } from 'lucide-react';

const STAGE_LABELS = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

const STAGE_ORDER = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

const STAGE_COLORS = {
  lead: '#dfe6e9',
  qualified: 'var(--accent-light)',
  proposal: 'var(--text-muted)',
  negotiation: '#a5b4fc',
  closed_won: 'var(--accent)',
  closed_lost: 'var(--text-secondary)',
};

const STAGE_BADGE_MAP = {
  lead: 'clay-badge-accent',
  qualified: 'clay-badge-info',
  proposal: 'clay-badge-warning',
  negotiation: 'clay-badge-accent',
  closed_won: 'clay-badge-success',
  closed_lost: 'clay-badge-danger',
};

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const INITIAL_FORM = {
  name: '',
  value: '',
  contact_id: '',
  company_id: '',
  stage: 'lead',
  probability: '50',
  expected_close: '',
  description: '',
  priority: 'medium',
};

function formatCurrency(n) {
  const num = Number(n);
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(num);
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ProbabilityBar({ value }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  let barColor = 'var(--danger)';
  if (pct >= 70) barColor = 'var(--success)';
  else if (pct >= 40) barColor = 'var(--warning)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div className="clay-progress" style={{ flex: 1, height: '6px' }}>
        <div className="clay-progress-bar" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', minWidth: '28px' }}>{pct}%</span>
    </div>
  );
}

function StageHeader({ stage, deals, color }) {
  const total = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, flexShrink: 0 }} />
        <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {STAGE_LABELS[stage] || stage}
        </h3>
        <span className="clay-tag" style={{ fontSize: '11px', padding: '2px 8px' }}>{deals.length}</span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
        {formatCurrency(total)}
      </div>
    </div>
  );
}

export default function Deals() {
  const navigate = useNavigate();
  const fetchStats = useStore(s => s.fetchStats);

  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragDeal, setDragDeal] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionOpen, setActionOpen] = useState(null);

  const pipelineRef = useRef(null);
  const topScrollRef = useRef(null);

  const syncScroll = (source, target) => {
    target.scrollLeft = source.scrollLeft;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stagesData, contactsData, companiesData] = await Promise.all([
        api.getDealStages(),
        api.getContacts(),
        api.getCompanies(),
      ]);
      setStages(Array.isArray(stagesData) ? stagesData : stagesData.stages || []);
      setContacts(Array.isArray(contactsData) ? contactsData : contactsData.contacts || contactsData.data || []);
      setCompanies(Array.isArray(companiesData) ? companiesData : companiesData.companies || companiesData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allDeals = stages.reduce((acc, s) => acc.concat(s.deals || []), []);
  const totalPipeline = allDeals.reduce((sum, d) => {
    if (d.stage !== 'closed_lost') return sum + (Number(d.value) || 0);
    return sum;
  }, 0);
  const wonValue = allDeals
    .filter(d => d.stage === 'closed_won')
    .reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  const openCreateModal = () => {
    setEditId(null);
    setForm({ ...INITIAL_FORM });
    setFormError('');
    setShowModal(true);
    setActionOpen(null);
  };

  const openEditModal = (deal) => {
    setEditId(deal.id);
    setForm({
      name: deal.name || '',
      value: deal.value ?? '',
      contact_id: deal.contact_id ?? '',
      company_id: deal.company_id ?? '',
      stage: deal.stage || 'lead',
      probability: deal.probability ?? 50,
      expected_close: deal.expected_close ? deal.expected_close.slice(0, 10) : '',
      description: deal.description || '',
      priority: deal.priority || 'medium',
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
      setFormError('Deal name is required.');
      return;
    }
    if (!form.value || Number(form.value) <= 0) {
      setFormError('A valid deal value is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        value: Number(form.value),
        contact_id: form.contact_id ? Number(form.contact_id) : null,
        company_id: form.company_id ? Number(form.company_id) : null,
        stage: form.stage,
        probability: Number(form.probability),
        expected_close: form.expected_close || null,
        description: form.description || '',
        priority: form.priority,
      };
      if (editId) {
        await api.updateDeal(editId, payload);
      } else {
        await api.createDeal(payload);
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
      await api.deleteDeal(id);
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

  const onDragStart = (e, deal) => {
    setDragDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', deal.id);
  };

  const onDragOver = (e, stageKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageKey);
  };

  const onDragLeave = (e) => {
    setDragOverStage(null);
  };

  const onDrop = async (e, stageKey) => {
    e.preventDefault();
    setDragOverStage(null);
    if (!dragDeal || dragDeal.stage === stageKey) {
      setDragDeal(null);
      return;
    }
    const dealId = dragDeal.id;
    const previousStages = stages.map(s => ({
      ...s,
      deals: s.deals.filter(d => d.id !== dealId),
    }));
    const newStages = previousStages.map(s => {
      if (s.key === stageKey) {
        return { ...s, deals: [...s.deals, { ...dragDeal, stage: stageKey }] };
      }
      return s;
    });
    setStages(newStages);
    setDragDeal(null);
    try {
      await api.updateDeal(dealId, { stage: stageKey });
      fetchStats();
    } catch {
      fetchData();
    }
  };

  const onDragEnd = () => {
    setDragDeal(null);
    setDragOverStage(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Deals Pipeline</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage your sales pipeline and opportunities</p>
        </div>
        <button className="clay-btn clay-btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Add Deal
        </button>
      </div>

      {error && (
          <div style={{ background: 'rgba(113,113,122,0.15)', color: 'var(--danger)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
            {error}
          </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="clay-stat-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--accent-light), #a5b4fc)' }}>
                <DollarSign size={20} color="var(--accent)" />
            </div>
            <div>
              <div className="clay-stat-value" style={{ fontSize: '24px' }}>{formatCurrency(totalPipeline)}</div>
              <div className="clay-stat-label">Total Pipeline</div>
            </div>
          </div>
        </div>
        <div className="clay-stat-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--success-light), var(--accent-light))' }}>
                <DollarSign size={20} color="var(--accent)" />
            </div>
            <div>
              <div className="clay-stat-value" style={{ fontSize: '24px' }}>{formatCurrency(wonValue)}</div>
              <div className="clay-stat-label">Won Revenue</div>
            </div>
          </div>
        </div>
        <div className="clay-stat-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--info-light), #d4d4d8)' }}>
                <GripVertical size={20} />
            </div>
            <div>
              <div className="clay-stat-value" style={{ fontSize: '24px' }}>{allDeals.length}</div>
              <div className="clay-stat-label">Total Deals</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
          {STAGE_ORDER.map(stage => (
            <div key={stage} style={{ minWidth: '290px', width: '290px', flexShrink: 0 }}>
              <div className="clay-card" style={{ padding: '16px' }}>
                <div className="clay-skeleton" style={{ width: '100px', height: '18px', marginBottom: '16px' }} />
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="clay-card-sm" style={{ padding: '14px', marginBottom: '10px' }}>
                    <div className="clay-skeleton" style={{ width: '140px', height: '14px', marginBottom: '10px' }} />
                    <div className="clay-skeleton" style={{ width: '80px', height: '14px', marginBottom: '8px' }} />
                    <div className="clay-skeleton" style={{ width: '100%', height: '6px', borderRadius: 'var(--radius-full)' }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : stages.length === 0 ? (
        <div className="clay-empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--clay-shadow)', border: '1px solid rgba(255,255,255,0.6)' }}>
          <DollarSign size={48} style={{ opacity: 0.4, color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No deals yet</h3>
          <p style={{ marginBottom: '20px' }}>Get started by adding your first deal to the pipeline.</p>
          <button className="clay-btn clay-btn-primary" onClick={openCreateModal}>
                  <Plus size={16} /> Add Deal
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div
            ref={topScrollRef}
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              height: '8px',
              marginBottom: '4px',
            }}
            onScroll={() => {
              if (pipelineRef.current) {
                pipelineRef.current.scrollLeft = topScrollRef.current.scrollLeft;
              }
            }}
          >
            <div style={{ height: '1px', width: `${STAGE_ORDER.length * 306}px` }} />
          </div>
          <div
            ref={pipelineRef}
            style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '24px', minHeight: '400px' }}
            onScroll={() => {
              if (topScrollRef.current) {
                topScrollRef.current.scrollLeft = pipelineRef.current.scrollLeft;
              }
            }}
          >
          {STAGE_ORDER.map(stageKey => {
            const stage = stages.find(s => s.key === stageKey) || { key: stageKey, label: STAGE_LABELS[stageKey] || stageKey, deals: [] };
            const deals = stage.deals || [];
            return (
              <div
                key={stageKey}
                style={{
                  minWidth: '290px',
                  width: '290px',
                  flexShrink: 0,
                }}
              >
                <div
                  className="clay-card"
                  style={{
                    padding: '16px',
                    transition: 'box-shadow 0.2s ease',
                    ...(dragOverStage === stageKey ? { boxShadow: 'var(--clay-shadow-hover), 0 0 0 2px var(--accent-light)' } : {}),
                  }}
                  onDragOver={(e) => onDragOver(e, stageKey)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, stageKey)}
                >
                  <StageHeader stage={stageKey} deals={deals} color={STAGE_COLORS[stageKey]} />

                  {deals.length === 0 && stageKey === 'lead' && (
                    <button
                      className="clay-btn clay-btn-sm"
                      onClick={openCreateModal}
                      style={{ width: '100%', justifyContent: 'center', marginBottom: '8px' }}
                    >
                        <Plus size={14} /> Add Deal
                    </button>
                  )}

                  {deals.map(deal => (
                    <div
                      key={deal.id}
                      className="clay-card-sm"
                      draggable
                      onDragStart={(e) => onDragStart(e, deal)}
                      onDragEnd={onDragEnd}
                      style={{
                        padding: '14px',
                        marginBottom: '10px',
                        cursor: 'grab',
                        position: 'relative',
                        opacity: dragDeal?.id === deal.id ? 0.5 : 1,
                        transition: 'box-shadow 0.2s ease, opacity 0.2s ease',
                      }}
                      onClick={() => navigate(`/deals/${deal.id}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, cursor: 'grab' }} />
                          <h4 style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {deal.name}
                          </h4>
                        </div>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <button
                            className="clay-btn clay-btn-sm clay-btn-ghost"
                            onClick={e => { e.stopPropagation(); toggleActions(deal.id); }}
                            style={{ padding: '2px 4px' }}
                          >
                            <MoreVertical size={14} />
                          </button>
                          {actionOpen === deal.id && (
                            <div
                              style={{
                                position: 'absolute',
                                right: '0',
                                top: '28px',
                                background: 'var(--bg-card)',
                                borderRadius: 'var(--radius-sm)',
                                boxShadow: 'var(--clay-shadow)',
                                border: '1px solid rgba(255,255,255,0.6)',
                                zIndex: 50,
                                minWidth: '130px',
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
                                onClick={() => openEditModal(deal)}
                              >
                                <Edit size={14} /> Edit
                              </button>
                              <button
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px',
                                  border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px',
                                  color: 'var(--danger)', fontFamily: 'inherit',
                                }}
                                onClick={() => { setDeleteConfirm(deal.id); setActionOpen(null); }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DollarSign size={14} style={{ color: 'var(--accent)' }} />
                        {formatCurrency(deal.value)}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {deal.contact_name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <User size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.contact_name}</span>
                          </div>
                        )}
                        {deal.company_name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Building2 size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.company_name}</span>
                          </div>
                        )}
                        {deal.expected_close && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span>{formatDateShort(deal.expected_close)}</span>
                          </div>
                        )}
                      </div>

                      <ProbabilityBar value={deal.probability} />
                    </div>
                  ))}

                  {deals.length === 0 && stageKey !== 'lead' && (
                    <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Drop deals here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="clay-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="clay-modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="clay-modal-header">
              <h2>Delete Deal</h2>
              <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={() => setDeleteConfirm(null)}>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>&times;</span>
              </button>
            </div>
            <div className="clay-modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete this deal? This action cannot be undone.
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
          <div className="clay-modal" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
            <div className="clay-modal-header">
              <h2>{editId ? 'Edit Deal' : 'Add Deal'}</h2>
              <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={closeModal}>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>&times;</span>
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="clay-modal-body">
                {formError && (
                    <div style={{ background: 'rgba(113,113,122,0.15)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '20px' }}>
                      {formError}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="clay-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="clay-form-label">Deal Name *</label>
                    <input className="clay-input" name="name" value={form.name} onChange={handleFormChange} required placeholder="e.g. Enterprise Software License" />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Value *</label>
                    <input className="clay-input" name="value" type="number" min="0" step="0.01" value={form.value} onChange={handleFormChange} required placeholder="0" />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Stage</label>
                    <select className="clay-input" name="stage" value={form.stage} onChange={handleFormChange} style={{ appearance: 'none', cursor: 'pointer' }}>
                      {STAGE_ORDER.map(k => (
                        <option key={k} value={k}>{STAGE_LABELS[k]}</option>
                      ))}
                    </select>
                  </div>
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
                    <label className="clay-form-label">Probability (%)</label>
                    <input className="clay-input" name="probability" type="number" min="0" max="100" value={form.probability} onChange={handleFormChange} />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Expected Close Date</label>
                    <input className="clay-input" name="expected_close" type="date" value={form.expected_close} onChange={handleFormChange} />
                  </div>
                  <div className="clay-form-group">
                    <label className="clay-form-label">Priority</label>
                    <select className="clay-input" name="priority" value={form.priority} onChange={handleFormChange} style={{ appearance: 'none', cursor: 'pointer' }}>
                      {PRIORITY_OPTIONS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
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
                      placeholder="Deal details and notes..."
                    />
                  </div>
                </div>
              </div>
              <div className="clay-modal-footer">
                <button type="button" className="clay-btn" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="clay-btn clay-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editId ? 'Update Deal' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
