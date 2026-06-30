import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { Link2, Mail, MessageCircle, Rss, Check, X, RefreshCw, Power, Plug, Copy, Eye, EyeOff, ArrowRight, Users, MessageSquare, Building2, Handshake, ShieldCheck, Workflow, Radio, Activity, Sparkles } from 'lucide-react';
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

const getProviderAccent = (p: ProviderInfo) => ({
  color: p.color || 'var(--accent)',
  bg: p.bg || 'var(--accent-bg)',
});

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

  const connectedCount = providers.filter(p => p.connection?.status === 'connected').length;
  const webhookCount = providers.filter(p => p.webhookSupported).length;

  const s = {
    container: { maxWidth: '1320px' as const, margin: '0 auto' as const, display: 'flex' as const, flexDirection: 'column' as const, gap: '24px' as const },
    hero: {
      position: 'relative' as const,
      overflow: 'hidden' as const,
      borderRadius: '32px',
      padding: '34px',
      background: 'linear-gradient(135deg, rgba(79,70,229,0.95), rgba(124,58,237,0.9) 54%, rgba(6,182,212,0.78))',
      border: '1px solid rgba(255,255,255,0.18)',
      boxShadow: 'var(--card-shadow-hover)',
      color: '#fff',
    },
    heroGrid: { position: 'relative' as const, zIndex: 1, display: 'grid' as const, gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '28px', alignItems: 'end' as const },
    heroTitle: { fontSize: 'clamp(36px, 6vw, 66px)', lineHeight: 0.92, letterSpacing: '-0.07em', fontWeight: 900, margin: '0 0 14px' },
    heroText: { fontSize: '16px', lineHeight: 1.7, color: 'rgba(224,231,255,0.88)', maxWidth: '680px', margin: 0 },
    heroStats: { display: 'grid' as const, gridTemplateColumns: 'repeat(3, minmax(116px, 1fr))', gap: '12px', minWidth: '420px' },
    heroStat: { padding: '15px', borderRadius: '20px', background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(16px)' },
    grid: { display: 'grid' as const, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' },
    card: {
      position: 'relative' as const,
      overflow: 'hidden' as const,
      background: 'var(--bg-card)', borderRadius: '28px', padding: '24px',
      boxShadow: 'var(--card-shadow)', border: 'var(--card-border)', backdropFilter: 'blur(22px)',
      transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease'
    },
    cardInner: { display: 'flex' as const, gap: '16px', alignItems: 'flex-start' as const, position: 'relative' as const, zIndex: 1 },
    iconBox: (color: string, bg: string) => ({
      width: '60px', height: '60px', borderRadius: '20px',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: 'var(--card-shadow-sm)', border: '1px solid color-mix(in srgb, currentColor 12%, transparent)'
    }),
    actions: { display: 'flex' as const, gap: '9px', flexWrap: 'wrap' as const, marginTop: '18px' as const },
    configPanel: {
      position: 'relative' as const,
      zIndex: 1,
      marginTop: '18px', padding: '20px', background: 'var(--bg-glass)', borderRadius: '22px',
      border: '1px solid var(--divider-color)', animation: 'slideUp 0.25s ease', backdropFilter: 'blur(18px)'
    },
    webhookBox: {
      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
      background: 'var(--bg-glass)', borderRadius: '16px', border: '1px solid var(--divider-color)',
      fontFamily: 'monospace', fontSize: '11px', boxShadow: 'var(--card-shadow-sm)',
      marginTop: '8px', wordBreak: 'break-all' as const
    }
  };

  return (
    <div style={s.container}>
      <style>{`
        .integration-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--card-shadow-hover);
          border-color: var(--card-border-hover);
        }

        .integration-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 86% 0%, var(--provider-glow), transparent 42%);
          opacity: 0.55;
          pointer-events: none;
        }

        .integration-spin {
          animation: spin 0.8s linear infinite;
        }

        @media (max-width: 980px) {
          .integrations-hero-grid {
            grid-template-columns: 1fr !important;
          }

          .integrations-hero-stats {
            min-width: 0 !important;
          }
        }

        @media (max-width: 620px) {
          .integrations-hero-stats {
            grid-template-columns: 1fr !important;
          }

          .integration-card-inner {
            flex-direction: column;
          }
        }
      `}</style>

      <section style={s.hero}>
        <div className="integrations-hero-grid" style={s.heroGrid}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)', color: '#c7d2fe', fontSize: '12px', fontWeight: 900, marginBottom: '18px' }}>
              <Sparkles size={14} /> Integration Hub
            </div>
            <h1 style={s.heroTitle}>Connect every customer signal.</h1>
            <p style={s.heroText}>
              Bring email, messaging, feeds, webhooks and external business systems into SmartCRM so contacts, deals, conversations and support work stay synchronized.
            </p>
          </div>
          <div className="integrations-hero-stats" style={s.heroStats}>
            <div style={s.heroStat}>
              <Activity size={18} color="#a5f3fc" />
              <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '10px' }}>{providers.length}</div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#c7d2fe' }}>Available providers</div>
            </div>
            <div style={s.heroStat}>
              <ShieldCheck size={18} color="#86efac" />
              <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '10px' }}>{connectedCount}</div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#c7d2fe' }}>Connected</div>
            </div>
            <div style={s.heroStat}>
              <Radio size={18} color="#fef08a" />
              <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '10px' }}>{webhookCount}</div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#c7d2fe' }}>Webhook-ready</div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', right: '-90px', top: '-90px', width: '310px', height: '310px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)' }} />
        <div style={{ position: 'absolute', right: '22%', bottom: '-130px', width: '260px', height: '260px', borderRadius: '999px', background: 'rgba(34,211,238,0.18)' }} />
      </section>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>Provider marketplace</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px' }}>Configure secure sync channels and trigger data actions from connected systems.</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '999px', background: 'var(--bg-glass)', border: 'var(--card-border)', boxShadow: 'var(--card-shadow-sm)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 800 }}>
          <Workflow size={15} color="var(--accent)" /> {connectedCount} active workflows
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
          {[1,2,3,4].map(i => <div key={i} className="clay-skeleton" style={{ height: '260px', borderRadius: '28px' }} />)}
        </div>
      ) : (
        <div style={s.grid}>
          {providers.map(p => {
            const IconC = iconMap[p.icon] || Link2;
            const connected = p.connection?.status === 'connected';
            const accent = getProviderAccent(p);
            return (
              <div key={p.id} className="integration-card" style={{ ...s.card, '--provider-glow': `${accent.color}24` } as React.CSSProperties}>
                <div className="integration-card-inner" style={s.cardInner}>
                  <div style={s.iconBox(accent.color, accent.bg)}>
                    <IconC size={28} color={accent.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>{p.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          {statusBadge(p.connection?.status || 'disconnected')}
                          {p.webhookSupported && <span className="clay-badge clay-badge-info">Webhook</span>}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '10px' }}>
                      {p.description}
                    </p>
                    {connected && p.connection?.last_sync && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}><RefreshCw size={12} /> Last sync: {new Date(p.connection.last_sync).toLocaleString()}</span>
                    )}

                    {/* Sync result display */}
                    {syncResult[p.id] && !syncResult[p.id].prompts && (
                      <div style={{ marginTop: '14px', padding: '12px 14px', background: 'var(--success-bg)', borderRadius: '16px', fontSize: '12px', color: 'var(--success-text)', border: '1px solid rgba(16,185,129,0.18)', fontWeight: 700 }}>
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
                      <div style={{ marginTop: '14px', padding: '18px', background: 'linear-gradient(135deg, var(--accent-bg), var(--bg-glass))', borderRadius: '20px', border: '1px solid rgba(108, 92, 231, 0.15)', boxShadow: 'var(--card-shadow-sm)' }}>
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
                                  display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 14px',
                                  background: s.bg, border: '1px solid var(--divider-color)', borderRadius: '16px',
                                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                                  transition: 'all 0.2s ease', boxShadow: 'var(--card-shadow-sm)',
                                  color: 'var(--text-primary)'
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow-hover)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow-sm)'; }}
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
                      <div style={{ marginTop: '14px', padding: '12px 14px', background: 'var(--info-bg)', borderRadius: '16px', fontSize: '12px', color: 'var(--info-text)', border: '1px solid rgba(14,165,233,0.18)', fontWeight: 700 }}>
                        <Check size={12} /> {syncResult[p.id].prompts.message}
                      </div>
                    )}

                    <div style={s.actions}>
                      {connected ? (
                        <>
                          <button className="clay-btn clay-btn-sm clay-btn-primary" onClick={() => handleSync(p.id)} disabled={syncing === p.id}>
                            <RefreshCw size={13} className={syncing === p.id ? 'integration-spin' : ''} /> {syncing === p.id ? 'Syncing...' : 'Sync Now'}
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
                    <h4 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '14px', letterSpacing: '-0.03em' }}>
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
                  <div style={{ position: 'relative', zIndex: 1, marginTop: '18px', paddingTop: '18px', borderTop: '1px solid var(--divider-color)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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
