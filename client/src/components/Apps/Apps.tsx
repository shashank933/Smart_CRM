import React, { useState, useEffect, useRef } from 'react';
import { Key, Plus, Copy, Trash2, Edit, Power, Shield, Clock, Check, X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { api } from '../../api';
import ConfirmDialog from '../ui/ConfirmDialog';

interface PermissionSet {
  read: boolean;
  write: boolean;
  delete: boolean;
}

interface TokenPermissions {
  contacts: PermissionSet;
  companies: PermissionSet;
  deals: PermissionSet;
  invoices: PermissionSet;
  conversations: PermissionSet;
  tickets: PermissionSet;
}

interface ApiToken {
  id: string;
  name: string;
  permissions: TokenPermissions;
  status: string;
  last_used: string | null;
  expires_at: string | null;
  created_at: string;
  token_preview?: string | null;
  token?: string;
}

const defaultPerms: TokenPermissions = {
  contacts: { read: true, write: true, delete: true },
  companies: { read: true, write: true, delete: true },
  deals: { read: true, write: true, delete: true },
  invoices: { read: true, write: true, delete: true },
  conversations: { read: true, write: true, delete: true },
  tickets: { read: true, write: true, delete: true }
} as TokenPermissions;

const resourceLabels: Record<string, string> = {
  contacts: 'Contacts', companies: 'Companies', deals: 'Deals', invoices: 'Invoices',
  conversations: 'Conversations', tickets: 'Tickets'
};

export default function Apps() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newToken, setNewToken] = useState<{ token?: string; id?: string } | null>(null);
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<TokenPermissions>({ ...defaultPerms });
  const [expiresAt, setExpiresAt] = useState('');
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const tokenIdToRevokeRef = useRef<string | null>(null);

  const fetchTokens = async () => {
    try {
      const data: ApiToken[] = await api.request('/apps');
      setTokens(data);
    } catch (e) {
      console.error('Failed to fetch tokens', e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTokens(); }, []);

  const handleCreate = async () => {
    try {
      const result = await api.request('/apps', {
        method: 'POST',
        body: JSON.stringify({ name, permissions, expires_at: expiresAt || null })
      });
      setNewToken(result);
      setName('');
      setPermissions({ ...defaultPerms });
      setExpiresAt('');
      fetchTokens();
    } catch (e) {
      console.error('Failed to create token', e);
    }
  };

  const handleRevoke = (id: string) => {
    tokenIdToRevokeRef.current = id;
    setConfirmOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (!tokenIdToRevokeRef.current) return;
    setConfirmOpen(false);
    try {
      await api.request(`/apps/${tokenIdToRevokeRef.current}`, { method: 'DELETE' });
      tokenIdToRevokeRef.current = null;
      fetchTokens();
    } catch (e) {
      console.error('Failed to revoke token', e);
    }
  };

  const copyToken = async (token: string, id: string) => {
    await navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePermission = (resource: string, action: string) => {
    setPermissions(prev => {
      const next = { ...prev };
      const key = resource as keyof TokenPermissions;
      const perm = next[key];
      if (action === 'read' && perm && 'read' in perm) {
        (perm as PermissionSet).read = !(perm as PermissionSet).read;
        if (!(perm as PermissionSet).read) {
          (perm as PermissionSet).write = false;
          (perm as PermissionSet).delete = false;
        }
      } else if (perm && action in perm) {
        (perm as Record<string, boolean>)[action] = !(perm as Record<string, boolean>)[action];
        if (action === 'write' && (perm as PermissionSet).write) {
          (perm as PermissionSet).read = true;
        }
        if (action === 'delete' && (perm as PermissionSet).delete) {
          (perm as PermissionSet).read = true;
          (perm as PermissionSet).write = true;
        }
      }
      return next;
    });
  };

  const toggleAll = (resource: string, enabled: boolean) => {
    setPermissions(prev => {
      const next = { ...prev };
      const key = resource as keyof TokenPermissions;
      if (key === 'dashboard') {
        next.dashboard = { read: enabled };
      } else {
        next[key] = { read: enabled, write: enabled, delete: enabled } as PermissionSet;
      }
      return next;
    });
  };

  const styles = {
    container: { maxWidth: '1100px' as const },
    header: { display: 'flex' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: '24px' as const },
    title: { fontSize: '22px' as const, fontWeight: 700 as const },
    grid: { display: 'flex' as const, flexDirection: 'column' as const, gap: '12px' as const },
    tokenCard: {
      background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '20px 24px',
      boxShadow: 'var(--clay-shadow)', border: '1px solid rgba(255,255,255,0.6)',
      display: 'flex' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const,
      transition: 'all 0.3s ease' as const
    },
    tokenInfo: { flex: 1 as const },
    tokenName: { fontSize: '15px' as const, fontWeight: 600 as const, display: 'flex' as const, alignItems: 'center' as const, gap: '8px' as const },
    tokenPreview: { fontSize: '12px' as const, color: 'var(--text-muted)' as const, fontFamily: 'monospace' as const, marginTop: '4px' as const },
    actions: { display: 'flex' as const, gap: '8px' as const },
    permsGrid: {
      display: 'grid' as const, gridTemplateColumns: '180px repeat(3, 80px)',
      gap: '4px 0', marginTop: '16px', fontSize: '13px' as const
    },
    permHeader: { fontWeight: 600 as const, color: 'var(--text-muted)' as const, fontSize: '11px' as const, textTransform: 'uppercase' as const, paddingBottom: '8px' as const },
    permRow: { display: 'contents' as const },
    permLabel: { padding: '6px 0' as const, fontWeight: 500 as const, display: 'flex' as const, alignItems: 'center' as const, gap: '6px' as const },
    permCell: { display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const },
    checkbox: {
      width: '20px', height: '20px', borderRadius: '6px', border: 'none', cursor: 'pointer',
      display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
      fontSize: '12px', transition: 'all 0.2s' as const
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>API Tokens & Connected Apps</h1>
        <button className="clay-btn clay-btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Generate Token
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="clay-skeleton" style={{ height: '72px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {!loading && tokens.length === 0 && (
        <div className="clay-empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}><Key size={48} /></div>
          <h3>No API Tokens</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Generate tokens to connect external apps with scoped permissions.</p>
        </div>
      )}

      <div style={styles.grid}>
        {tokens.map(tok => (
          <div key={tok.id} style={styles.tokenCard}>
            <div style={styles.tokenInfo}>
              <div style={styles.tokenName}>
                <Shield size={16} />
                {tok.name}
                <span className={`clay-badge ${tok.status === 'active' ? 'clay-badge-success' : 'clay-badge-warning'}`}>
                  {tok.status}
                </span>
              </div>
              <div style={styles.tokenPreview}>
                {tok.token_preview || '••••••••••••••••••••'}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                {tok.last_used && <span><Clock size={10} /> Last used: {new Date(tok.last_used).toLocaleDateString()}</span>}
                {tok.expires_at && <span>Expires: {new Date(tok.expires_at).toLocaleDateString()}</span>}
                <span>Created: {new Date(tok.created_at).toLocaleDateString()}</span>
              </div>
              {expandedToken === tok.id && (
                <div style={styles.permsGrid}>
                  <div style={styles.permHeader}>Resource</div>
                  <div style={styles.permHeader}>Read</div>
                  <div style={styles.permHeader}>Write</div>
                  <div style={styles.permHeader}>Delete</div>
                  {Object.entries(tok.permissions).map(([resource, perms]) => {
                    const r = resource as keyof TokenPermissions;
                    const p = tok.permissions[r];
                    const isRead = 'read' in p ? (p as PermissionSet).read : (p as { read: boolean }).read;
                    const isWrite = 'write' in p ? (p as PermissionSet).write : false;
                    const isDelete = 'delete' in p ? (p as PermissionSet).delete : false;
                    return (
                      <React.Fragment key={resource}>
                        <div style={styles.permLabel}>{resourceLabels[resource] || resource}</div>
                        <div style={styles.permCell}>{isRead ? <Check size={14} /> : <X size={14} />}</div>
                        <div style={styles.permCell}>{isWrite ? <Check size={14} /> : <X size={14} />}</div>
                        <div style={styles.permCell}>{isDelete ? <Check size={14} /> : <X size={14} />}</div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={styles.actions}>
              <button className="clay-btn clay-btn-sm" onClick={() => setExpandedToken(expandedToken === tok.id ? null : tok.id)}>
                <Eye size={14} />
              </button>
              <button className="clay-btn clay-btn-sm clay-btn-danger" onClick={() => handleRevoke(tok.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New token result modal */}
      {newToken && newToken.token && (
        <div className="clay-modal-overlay" onClick={() => setNewToken(null)}>
          <div className="clay-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="clay-modal-header">
              <h2>Token Generated</h2>
            </div>
            <div className="clay-modal-body">
              <div style={{ background: 'linear-gradient(135deg, #fff8e0, #fff3d4)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '16px', fontSize: '13px', color: '#8a6d00', fontWeight: 500 }}>
                Save this token now. You won't be able to see it again.
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '14px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all', boxShadow: 'var(--clay-shadow-inset)', marginBottom: '12px' }}>
                {newToken.token}
              </div>
              <button className="clay-btn clay-btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => copyToken(newToken.token!, newToken.id!)}>
                {copiedId === newToken.id ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy to Clipboard</>}
              </button>
            </div>
            <div className="clay-modal-footer">
              <button className="clay-btn" onClick={() => setNewToken(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create token modal */}
      {showCreate && (
        <div className="clay-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="clay-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh' }}>
            <div className="clay-modal-header">
              <h2>Generate API Token</h2>
            </div>
            <div className="clay-modal-body">
              <div className="clay-form-group">
                <label className="clay-form-label">Token Name</label>
                <input className="clay-input" placeholder="e.g., Sales Dashboard Integration" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="clay-form-group">
                <label className="clay-form-label">Expires At (optional)</label>
                <input className="clay-input" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
              </div>

              <label className="clay-form-label" style={{ marginBottom: '12px' }}>Permissions</label>
              <div style={styles.permsGrid}>
                <div style={styles.permHeader}>Resource</div>
                <div style={styles.permHeader}>Read</div>
                <div style={styles.permHeader}>Write</div>
                <div style={styles.permHeader}>Delete</div>
                {Object.entries(permissions).map(([resource, perms]) => {
                  const r = resource as keyof TokenPermissions;
                  const p = permissions[r];
                  const isRead = 'read' in p ? (p as PermissionSet).read : (p as { read: boolean }).read;
                  const isWrite = 'write' in p ? (p as PermissionSet).write : false;
                  const isDelete = 'delete' in p ? (p as PermissionSet).delete : false;
                  const allEnabled = isRead && isWrite && isDelete && resource !== 'dashboard';
                  return (
                    <React.Fragment key={resource}>
                      <div style={{ ...styles.permLabel, cursor: 'pointer' }} onClick={() => toggleAll(resource, !allEnabled)}>
                        {resourceLabels[resource] || resource}
                      </div>
                      <div style={styles.permCell}>
                        <div onClick={() => togglePermission(resource, 'read')}
                          style={{ ...styles.checkbox, background: isRead ? 'var(--success)' : 'var(--bg-primary)', boxShadow: isRead ? 'none' : 'var(--clay-shadow-inset)', color: isRead ? 'white' : 'transparent' }}>
                          {isRead ? <Check size={12} /> : null}
                        </div>
                      </div>
                      <div style={styles.permCell}>
                        {resource !== 'dashboard' && (
                          <div onClick={() => togglePermission(resource, 'write')}
                            style={{ ...styles.checkbox, background: isWrite ? 'var(--success)' : 'var(--bg-primary)', boxShadow: isWrite ? 'none' : 'var(--clay-shadow-inset)', color: isWrite ? 'white' : 'transparent' }}>
                            {isWrite ? <Check size={12} /> : null}
                          </div>
                        )}
                      </div>
                      <div style={styles.permCell}>
                        {resource !== 'dashboard' && (
                          <div onClick={() => togglePermission(resource, 'delete')}
                            style={{ ...styles.checkbox, background: isDelete ? 'var(--success)' : 'var(--bg-primary)', boxShadow: isDelete ? 'none' : 'var(--clay-shadow-inset)', color: isDelete ? 'white' : 'transparent' }}>
                            {isDelete ? <Check size={12} /> : null}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            <div className="clay-modal-footer">
              <button className="clay-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="clay-btn clay-btn-primary" onClick={handleCreate} disabled={!name.trim()}>
                <Key size={14} /> Generate Token
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Revoke Token"
        message="Revoke this token? External apps using it will lose access."
        confirmLabel="Revoke"
        danger
        onConfirm={handleConfirmRevoke}
        onCancel={() => { setConfirmOpen(false); tokenIdToRevokeRef.current = null; }}
      />
    </div>
  );
}
