import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { Plus, Power, Play, Trash2, GitBranch, Zap, X } from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  actions: any[];
  status: string;
  last_run_at: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

interface WorkflowMetadata {
  triggers: { value: string; label: string }[];
  actions: { value: string; label: string }[];
}

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [metadata, setMetadata] = useState<WorkflowMetadata>({ triggers: [], actions: [] });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', trigger_type: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmActionRef = useRef<{ type: string; id: string; name?: string } | null>(null);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const data = await api.request('/workflows');
      setWorkflows(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchMetadata = async () => {
    try {
      const data = await api.request('/workflows/metadata');
      setMetadata(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWorkflows();
    fetchMetadata();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.trigger_type) return;
    setSubmitting(true);
    try {
      await api.request('/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          trigger_type: form.trigger_type,
          trigger_config: {},
          actions: []
        })
      });
      setShowCreate(false);
      setForm({ name: '', description: '', trigger_type: '' });
      fetchWorkflows();
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  const handleDelete = (id: string) => {
    confirmActionRef.current = { type: 'delete', id };
    setConfirmOpen(true);
  };

  const handleToggle = async (workflow: Workflow) => {
    setActionLoading(workflow.id);
    try {
      await api.request(`/workflows/${workflow.id}/toggle`, { method: 'POST' });
      fetchWorkflows();
    } catch (e) {
      console.error(e);
    }
    setActionLoading(null);
  };

  const handleExecute = (workflow: Workflow) => {
    confirmActionRef.current = { type: 'execute', id: workflow.id, name: workflow.name };
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmActionRef.current) return;
    setConfirmOpen(false);
    if (confirmActionRef.current.type === 'delete') {
      try {
        await api.request(`/workflows/${confirmActionRef.current.id}`, { method: 'DELETE' });
        setWorkflows(prev => prev.filter(wf => wf.id !== confirmActionRef.current!.id));
      } catch (e) {
        console.error(e);
      }
    } else if (confirmActionRef.current.type === 'execute') {
      setActionLoading(confirmActionRef.current.id);
      try {
        await api.request(`/workflows/${confirmActionRef.current.id}/execute`, { method: 'POST' });
        fetchWorkflows();
      } catch (e) {
        console.error(e);
      }
      setActionLoading(null);
    }
    confirmActionRef.current = null;
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="clay-badge clay-badge-success">Active</span>;
      case 'paused':
        return <span className="clay-badge clay-badge-warning">Paused</span>;
      default:
        return <span className="clay-badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)' }}>Draft</span>;
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };

  const s = {
    container: { maxWidth: '900px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    title: { fontSize: '22px', fontWeight: 700 },
    grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
    card: {
      background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '20px 24px',
      border: 'var(--card-border)', boxShadow: 'var(--card-shadow)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: '16px', transition: 'all 0.2s ease'
    },
    cardLeft: { flex: 1, minWidth: 0 },
    cardRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' },
    cardName: { fontSize: '15px', fontWeight: 700 },
    cardDesc: { fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.5 },
    cardMeta: { display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' },
    metaItem: { display: 'flex', alignItems: 'center', gap: '5px' },
    actions: { display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={s.title}>Workflows</h1>
        <button
          className="clay-btn clay-btn-primary"
          onClick={() => {
            if (metadata.triggers.length === 0) fetchMetadata();
            setShowCreate(true);
          }}
        >
          <Plus size={16} /> New Workflow
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="clay-skeleton" style={{ height: '100px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="clay-empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}><GitBranch size={48} /></div>
          <h3>No Workflows</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Automate your CRM with triggers and actions. Create your first workflow to get started.
          </p>
          <button
            className="clay-btn clay-btn-primary"
            style={{ marginTop: '20px' }}
            onClick={() => {
              if (metadata.triggers.length === 0) fetchMetadata();
              setShowCreate(true);
            }}
          >
            <Zap size={16} /> Create Workflow
          </button>
        </div>
      ) : (
        <div style={s.grid}>
          {workflows.map(wf => (
            <div
              key={wf.id}
              style={{
                ...s.card,
                ...(actionLoading === wf.id ? { opacity: 0.6, pointerEvents: 'none' } : {})
              }}
            >
              <div style={s.cardLeft}>
                <div style={s.cardRow}>
                  <span style={s.cardName}>{wf.name}</span>
                  {statusBadge(wf.status)}
                </div>
                {wf.description && (
                  <div style={s.cardDesc}>{wf.description}</div>
                )}
                <div style={s.cardMeta}>
                  <span style={s.metaItem}>
                    <Zap size={12} />
                    {wf.trigger_type}
                  </span>
                  <span style={s.metaItem}>
                    <Play size={12} />
                    Run {wf.run_count || 0} times
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Last: {formatTime(wf.last_run_at)}
                  </span>
                </div>
              </div>
              <div style={s.actions}>
                <button
                  className="clay-btn clay-btn-sm"
                  onClick={() => handleToggle(wf)}
                  disabled={actionLoading === wf.id}
                  title={wf.status === 'active' ? 'Pause' : 'Activate'}
                >
                  <Power size={13} />
                </button>
                {wf.status === 'active' && (
                  <button
                    className="clay-btn clay-btn-sm"
                    onClick={() => handleExecute(wf)}
                    disabled={actionLoading === wf.id}
                    title="Execute now"
                  >
                    <Play size={13} />
                  </button>
                )}
                <button
                  className="clay-btn clay-btn-sm clay-btn-danger"
                  onClick={() => handleDelete(wf.id)}
                  disabled={actionLoading === wf.id}
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="clay-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="clay-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="clay-modal-header">
              <h2>New Workflow</h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="clay-modal-body">
              <div className="clay-form-group">
                <label className="clay-form-label">Name *</label>
                <input
                  className="clay-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Welcome Email Sequence"
                />
              </div>
              <div className="clay-form-group">
                <label className="clay-form-label">Description</label>
                <textarea
                  className="clay-input"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="What does this workflow do?"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="clay-form-group">
                <label className="clay-form-label">Trigger Type *</label>
                <select
                  className="clay-input"
                  value={form.trigger_type}
                  onChange={e => setForm({ ...form, trigger_type: e.target.value })}
                >
                  <option value="">Select a trigger...</option>
                  {metadata.triggers.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="clay-modal-footer">
              <button className="clay-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                className="clay-btn clay-btn-primary"
                onClick={handleCreate}
                disabled={!form.name.trim() || !form.trigger_type || submitting}
              >
                {submitting ? 'Creating...' : <><Zap size={14} /> Create Workflow</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={confirmActionRef.current?.type === 'delete' ? 'Delete Workflow' : 'Execute Workflow'}
        message={confirmActionRef.current?.type === 'delete' ? 'Delete this workflow? This action cannot be undone.' : `Manually execute "${confirmActionRef.current?.name}"?`}
        confirmLabel={confirmActionRef.current?.type === 'delete' ? 'Delete' : 'Execute'}
        danger={confirmActionRef.current?.type === 'delete'}
        onConfirm={handleConfirm}
        onCancel={() => { setConfirmOpen(false); confirmActionRef.current = null; }}
      />
    </div>
  );
}
