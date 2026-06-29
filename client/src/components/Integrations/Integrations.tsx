import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { Link2, Mail, MessageCircle, Rss, Check, X, RefreshCw, Power, Plug, Copy, ExternalLink, Eye, EyeOff, ArrowRight, Trash2, Users, MessageSquare, Building2, Handshake } from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog';

interface SyncSuggestion {
  action: string;
  label: string;
  description: string;
  count: number;
  color: string;
  bg: string;
  route: string;
}

interface SyncPrompt {
  type: string;
  message: string;
  suggestions?: SyncSuggestion[];
  note?: string;
}

interface ProviderField {
  key: string;
  label: string;
  type: string;
  placeholder: string;
}

interface ProviderInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  bg: string;
  fields: ProviderField[];
  webhookSupported: boolean;
  webhookDescription?: string;
  connection: {
    id: string;
    status: string;
    name: string;
    last_sync: string | null;
    webhook_secret: string | null;
    webhook_url: string | null;
    created_at: string;
  } | null;
}

const iconMap: Record<string, React.FC<{ size?: number; color?: string }>> = {
  Mail, MessageCircle, Rss
};

const statusBadge = (status: string) => {
  if (status === 'connected') return <span className="clay-badge clay-badge-success">Connected</span>;
  return <span className="clay-badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)' }}>Disconnected</span>;
};

export default function Integrations() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showFields, setShowFields] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<Record<string, any>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const providerToDisconnectRef = useRef<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const data = await api.request('/integrations');
      setProviders(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchIntegrations(); }, []);

  const handleConnect = async (providerId: string) => {
    const fields = providers.find(p => p.id === providerId)?.fields || [];
    const hasAll = fields.every(f => formData[f.key]?.trim());
    if (!hasAll) return;

    setSaving(true);
    try {
      await api.request(`/integrations/${providerId}/connect`, {
        method: 'POST',
        body: JSON.stringify({
          name: `${providers.find(p => p.id === providerId)?.name} Connection`,
          ...fields.reduce((acc, f) => ({ ...acc, [f.key]: formData[f.key] }), {})
        })
      });
      setConfiguring(null);
      setFormData({});
      fetchIntegrations();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDisconnect = (providerId: string) => {
    providerToDisconnectRef.current = providerId;
    setConfirmOpen(true);
  };

  const handleConfirmDisconnect = async () => {
    if (!providerToDisconnectRef.current) return;
    setConfirmOpen(false);
    try {
      await api.request(`/integrations/${providerToDisconnectRef.current}/disconnect`, { method: 'POST' });
      providerToDisconnectRef.current = null;
      fetchIntegrations();
    } catch (e) { console.error(e); }
  };

  const handleTest = async (providerId: string) => {
    try {
      const res = await api.request(`/integrations/${providerId}/test`, { method: 'POST' });
      setAlertMsg(res.message);
      setAlertOpen(true);
    } catch (e: any) {
      setAlertMsg(e.message);
      setAlertOpen(true);
    }
  };

  const handleSync = async (providerId: string) => {
    setSyncing(providerId);
    try {
      const res = await api.request(`/integrations/${providerId}/sync`, { method: 'POST' });
      setSyncResult(prev => ({ ...prev, [providerId]: res }));
      fetchIntegrations();
    } catch (e) { console.error(e); }
    setSyncing(null);
  };

  const copyWebhook = async (url: string, providerId: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(providerId);
    setTimeout(() => setCopied(null), 2000);
  };

  const s = {
    container: { maxWidth: '900px' as const },
    header: { display: 'flex' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: '24px' as const },
    grid: { display: 'flex' as const, flexDirection: 'column' as const, gap: '16px' as const },
    card: {
      background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px',
      boxShadow: 'var(--card-shadow)', border: 'var(--card-border)',
      transition: 'all 0.3s ease'
    },
    cardInner: { display: 'flex' as const, gap: '16px', alignItems: 'flex-start' as const },
    iconBox: (color: string, bg: string) => ({
      width: '56px', height: '56px', borderRadius: 'var(--radius)',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: 'var(--card-shadow-sm)'
    }),
    actions: { display: 'flex' as const, gap: '8px', flexWrap: 'wrap' as const, marginTop: '14px' as const },
    configPanel: {
      marginTop: '16px', padding: '18px', background: 'var(--bg-glass)', borderRadius: 'var(--radius)',
      animation: 'slideUp 0.25s ease'
    },
    webhookBox: {
      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
      background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
      fontFamily: 'monospace', fontSize: '11px', boxShadow: 'var(--card-shadow-inset)',
      marginTop: '8px', wordBreak: 'break-all' as const
    }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Integrations</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="clay-skeleton" style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : (
        <div style={s.grid}>
          {providers.map(p => {
            const IconC = iconMap[p.icon] || Link2;
            const connected = p.connection?.status === 'connected';
            return (
              <div key={p.id} style={s.card}>
                <div style={s.cardInner}>
                  <div style={s.iconBox(p.color, p.bg)}>
                    <IconC size={26} color={p.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{p.name}</h3>
                      {statusBadge(p.connection?.status || 'disconnected')}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '4px' }}>
                      {p.description}
                    </p>
                    {connected && p.connection?.last_sync && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last sync: {new Date(p.connection.last_sync).toLocaleString()}</span>
                    )}

                    {/* Sync result display */}
                    {syncResult[p.id] && !syncResult[p.id].prompts && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: '#e0fff5', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: '#006c50' }}>
                        <Check size={12} /> {syncResult[p.id].message}
                        {syncResult[p.id].synced && (
                          <span style={{ marginLeft: '8px', fontSize: '11px', opacity: 0.8 }}>
                            ({Object.entries(syncResult[p.id].synced).map(([k, v]) => `${k}: ${v}`).join(', ')})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action prompts after sync */}
                    {syncResult[p.id]?.prompts?.type === 'action_prompt' && (
                      <div style={{ marginTop: '12px', padding: '16px 18px', background: 'linear-gradient(135deg, #f0e8ff, #faf5ff)', borderRadius: 'var(--radius)', border: '1px solid rgba(108, 92, 231, 0.15)', boxShadow: 'var(--clay-shadow-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Check size={14} color="var(--accent)" />
                          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent-dark)' }}>{syncResult[p.id].message}</span>
                          <button
                            onClick={() => setSyncResult(prev => { const next = { ...prev }; delete next[p.id]; return next; })}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>{syncResult[p.id].prompts.message}</p>
                        {syncResult[p.id].prompts.suggestions && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {syncResult[p.id].prompts.suggestions.map((s: SyncSuggestion) => (
                              <button
                                key={s.action}
                                onClick={() => { setSyncResult(prev => { const next = { ...prev }; delete next[p.id]; return next; }); navigate(s.route); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                                  background: s.bg, border: 'none', borderRadius: 'var(--radius-sm)',
                                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                                  transition: 'all 0.2s ease', boxShadow: 'var(--clay-shadow-sm)',
                                  color: 'var(--text-primary)'
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--clay-shadow-hover)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--clay-shadow-sm)'; }}
                              >
                                <div style={{
                                  width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                                  background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {(() => {
                                    if (s.action === 'create_contacts') return <Users size={16} color="white" />;
                                    if (s.action === 'view_conversations') return <MessageSquare size={16} color="white" />;
                                    if (s.action === 'view_companies') return <Building2 size={16} color="white" />;
                                    if (s.action === 'view_deals') return <Handshake size={16} color="white" />;
                                    return <MessageSquare size={16} color="white" />;
                                  })()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.label}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.description}</div>
                                </div>
                                <span className="clay-badge clay-badge-accent" style={{ fontSize: '11px', flexShrink: 0 }}>{s.count}</span>
                                <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              </button>
                            ))}
                          </div>
                        )}
                        {syncResult[p.id].prompts.note && (
                          <p style={{ fontSize: '11px', color: 'var(--warning-dark)', marginTop: '10px', padding: '8px 12px', background: 'rgba(253, 203, 110, 0.15)', borderRadius: 'var(--radius-sm)', lineHeight: 1.5 }}>{syncResult[p.id].prompts.note}</p>
                        )}
                      </div>
                    )}

                    {/* Simple info prompt for other providers */}
                    {syncResult[p.id]?.prompts?.type === 'info' && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: '#e0f5fe', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: '#004a7a' }}>
                        <Check size={12} /> {syncResult[p.id].prompts.message}
                      </div>
                    )}

                    <div style={s.actions}>
                      {connected ? (
                        <>
                          <button className="clay-btn clay-btn-sm clay-btn-primary" onClick={() => handleSync(p.id)} disabled={syncing === p.id}>
                            <RefreshCw size={13} className={syncing === p.id ? 'clay-skeleton' : ''} /> {syncing === p.id ? 'Syncing...' : 'Sync Now'}
                          </button>
                          <button className="clay-btn clay-btn-sm" onClick={() => handleTest(p.id)}>
                            <Plug size={13} /> Test
                          </button>
                          <button className="clay-btn clay-btn-sm" onClick={() => setConfiguring(configuring === p.id ? null : p.id)}>
                            {configuring === p.id ? <EyeOff size={13} /> : <Eye size={13} />}
                            {configuring === p.id ? 'Hide Config' : 'Configure'}
                          </button>
                          <button className="clay-btn clay-btn-sm clay-btn-danger" onClick={() => handleDisconnect(p.id)}>
                            <Power size={13} /> Disconnect
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="clay-btn clay-btn-sm clay-btn-primary" onClick={() => setConfiguring(p.id)}>
                            <Link2 size={13} /> Connect
                          </button>
                          {configuring === p.id ? (
                            <button className="clay-btn clay-btn-sm" onClick={() => setConfiguring(null)}>
                              <X size={13} /> Cancel
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Configuration panel */}
                {configuring === p.id && (
                  <div style={s.configPanel}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                      {connected ? 'Update Configuration' : `Connect ${p.name}`}
                    </h4>
                    {p.fields.map(f => (
                      <div key={f.key} className="clay-form-group" style={{ marginBottom: '12px' }}>
                        <label className="clay-form-label">{f.label}</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            className="clay-input"
                            type={showFields[f.key] ? 'text' : f.type}
                            value={formData[f.key] || ''}
                            onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                            placeholder={f.placeholder}
                            style={{ paddingRight: f.type === 'password' ? '36px' : '12px' }}
                          />
                          {f.type === 'password' && (
                            <button onClick={() => setShowFields({ ...showFields, [f.key]: !showFields[f.key] })}
                              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                              {showFields[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button className="clay-btn clay-btn-primary clay-btn-sm" onClick={() => handleConnect(p.id)} disabled={saving}>
                      {connected ? 'Update' : 'Connect'} {p.name}
                    </button>
                  </div>
                )}

                {/* Webhook display */}
                {connected && p.connection?.webhook_url && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--divider-color)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      <Link2 size={11} /> Webhook URL
                      {p.webhookDescription && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>{p.webhookDescription}</span>}
                    </span>
                    <div style={s.webhookBox}>
                      <code style={{ flex: 1, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.connection.webhook_url}</code>
                      <button className="clay-btn clay-btn-sm" onClick={() => copyWebhook(p.connection!.webhook_url!, p.id)} style={{ flexShrink: 0 }}>
                        {copied === p.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Disconnect Integration"
        message={`Disconnect ${providerToDisconnectRef.current}?`}
        confirmLabel="Disconnect"
        danger
        onConfirm={handleConfirmDisconnect}
        onCancel={() => { setConfirmOpen(false); providerToDisconnectRef.current = null; }}
      />

      <ConfirmDialog
        open={alertOpen}
        title="Test Result"
        message={alertMsg}
        confirmLabel="OK"
        cancelLabel=""
        onConfirm={() => setAlertOpen(false)}
        onCancel={() => setAlertOpen(false)}
      />
    </div>
  );
}
