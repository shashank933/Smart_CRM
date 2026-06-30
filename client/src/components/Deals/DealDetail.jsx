import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ArrowLeft, Handshake, DollarSign, Calendar, User, Building2, TrendingUp, Brain, Activity, FileText, MessageSquare } from 'lucide-react';

const STAGE_LABELS = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

const STAGE_BADGE_CLASS = {
  lead: 'clay-badge-accent',
  qualified: 'clay-badge-info',
  proposal: 'clay-badge-warning',
  negotiation: 'clay-badge-accent',
  closed_won: 'clay-badge-success',
  closed_lost: 'clay-badge-danger',
};

function formatCurrency(n) {
  const num = Number(n);
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getDeal(id)
      .then(data => {
        setDeal(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const getInsight = async () => {
    setInsightLoading(true);
    try {
      const result = await api.dealInsight(id);
      setInsight(result.insight || result);
    } catch (e) {
      setInsight('AI insights are not available. Please configure your OpenAI API key.');
    }
    setInsightLoading(false);
  };

  if (loading) {
    return (
      <div>
        <div className="clay-skeleton" style={{ width: '130px', height: '36px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }} />
        <div className="clay-skeleton" style={{ height: '180px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="clay-skeleton" style={{ height: '110px', borderRadius: 'var(--radius-lg)' }} />
          <div className="clay-skeleton" style={{ height: '110px', borderRadius: 'var(--radius-lg)' }} />
          <div className="clay-skeleton" style={{ height: '110px', borderRadius: 'var(--radius-lg)' }} />
        </div>
        <div className="clay-split-view">
          <div className="clay-skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
          <div className="clay-skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div>
        <button className="clay-btn clay-btn-ghost" onClick={() => navigate('/deals')} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Back to Deals
        </button>
        <div className="clay-empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--clay-shadow)', border: '1px solid rgba(255,255,255,0.6)' }}>
          <Handshake size={48} style={{ opacity: 0.4, color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>Deal not found</h3>
          <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>The deal you are looking for does not exist or has been removed.</p>
          <button className="clay-btn clay-btn-primary" onClick={() => navigate('/deals')}>
            <ArrowLeft size={16} /> Back to Deals
          </button>
        </div>
      </div>
    );
  }

  const activities = deal.activities || [];
  const conversations = deal.conversations || [];
  const probability = Number(deal.probability) || 0;

  let probabilityBarColor = 'var(--danger)';
  if (probability >= 70) probabilityBarColor = 'var(--success)';
  else if (probability >= 40) probabilityBarColor = 'var(--warning)';

  return (
    <div>
      <button className="clay-btn clay-btn-ghost" onClick={() => navigate('/deals')} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Deals
      </button>

      <div className="clay-card" style={{ padding: 'clamp(18px, 3vw, 28px)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{deal.name}</h2>
              <span className={`clay-badge ${STAGE_BADGE_CLASS[deal.stage] || 'clay-badge-accent'}`}>
                {STAGE_LABELS[deal.stage] || deal.stage}
              </span>
              {deal.priority && (
                <span className="clay-tag" style={{ textTransform: 'capitalize' }}>{deal.priority}</span>
              )}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={24} style={{ color: 'var(--accent)' }} />
              <span className="clay-stat-value">{formatCurrency(deal.value)}</span>
            </div>
          </div>
          <button className="clay-btn" onClick={() => navigate('/deals')}>
            <Handshake size={16} /> All Deals
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="clay-stat-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--accent-light), #a5b4fc)' }}>
                <DollarSign size={20} color="var(--accent)" />
            </div>
          </div>
          <div className="clay-stat-value" style={{ fontSize: '24px' }}>{formatCurrency(deal.value)}</div>
          <div className="clay-stat-label">Deal Value</div>
        </div>

        <div className="clay-stat-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--warning-light), #d4d4d8)' }}>
                <TrendingUp size={20} color="var(--warning)" />
            </div>
          </div>
          <div className="clay-stat-value" style={{ fontSize: '24px' }}>{probability}%</div>
          <div className="clay-stat-label">Probability</div>
          <div className="clay-progress" style={{ marginTop: '10px', height: '6px' }}>
            <div className="clay-progress-bar" style={{ width: `${probability}%`, background: probabilityBarColor }} />
          </div>
        </div>

        <div className="clay-stat-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--info-light), #d4d4d8)' }}>
                <Calendar size={20} color="var(--info)" />
            </div>
          </div>
          <div className="clay-stat-value" style={{ fontSize: '20px' }}>
            {deal.expected_close ? formatDateShort(deal.expected_close) : '—'}
          </div>
          <div className="clay-stat-label">Expected Close</div>
        </div>
      </div>

      <div className="clay-split-view" style={{ marginBottom: '24px' }}>
        <div>
          <div className="clay-card" style={{ padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              {deal.contact_name && (
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: deal.contact_id ? 'pointer' : 'default', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)', boxShadow: 'var(--clay-shadow-sm)' }}
                  onClick={() => deal.contact_id && navigate(`/contacts/${deal.contact_id}`)}
                >
                  <div className="clay-avatar clay-avatar-sm" style={{ background: 'var(--accent-gradient)' }}>
                    <User size={14} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{deal.contact_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Contact</div>
                  </div>
                </div>
              )}
              {deal.company_name && (
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: deal.company_id ? 'pointer' : 'default', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)', boxShadow: 'var(--clay-shadow-sm)' }}
                  onClick={() => deal.company_id && navigate(`/companies/${deal.company_id}`)}
                >
                  <div className="clay-avatar clay-avatar-sm" style={{ background: 'linear-gradient(135deg, var(--success), var(--success-light))' }}>
                    <Building2 size={14} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{deal.company_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Company</div>
                  </div>
                </div>
              )}
              {deal.created_at && (
                <div style={{ color: 'var(--text-muted)' }}>
                  Created {formatDate(deal.created_at)}
                </div>
              )}
            </div>
          </div>

          {deal.description && (
            <div className="clay-card" style={{ padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} /> Description
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{deal.description}</p>
            </div>
          )}

          {deal.stage === 'closed_lost' && deal.loss_reason && (
            <div className="clay-card" style={{ padding: '24px', marginBottom: '20px', border: '1px solid rgba(113, 113, 122, 0.2)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} style={{ transform: 'rotate(180deg)' }} /> Loss Reason
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{deal.loss_reason}</p>
            </div>
          )}

          {activities.length > 0 && (
            <div className="clay-card" style={{ padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} /> Activities
              </h3>
              {activities.map(act => (
                <div key={act.id} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--clay-shadow-sm)' }}>
                    <Activity size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '13px' }}>{act.subject || act.type || 'Activity'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {[act.type, act.status, act.created_at ? formatDateShort(act.created_at) : null].filter(Boolean).join(' · ')}
                    </div>
                    {act.description && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>{act.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {conversations.length > 0 && (
            <div className="clay-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} /> Conversations
              </h3>
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}
                  onClick={() => navigate(`/conversations/${conv.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="clay-avatar clay-avatar-sm" style={{ background: 'linear-gradient(135deg, var(--info), var(--info-light))' }}>
                      <MessageSquare size={13} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '13px' }}>{conv.subject || conv.title || `Conversation #${conv.id}`}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {conv.status && <span style={{ textTransform: 'capitalize' }}>{conv.status}</span>}
                        {conv.updated_at ? ` · ${formatDateShort(conv.updated_at)}` : ''}
                      </div>
                    </div>
                  </div>
                  <button className="clay-btn clay-btn-sm clay-btn-ghost">
                    <MessageSquare size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="clay-card" style={{ padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={18} /> AI Insights
            </h3>
            {!insight && (
              <button className="clay-btn clay-btn-primary clay-btn-sm" onClick={getInsight} disabled={insightLoading}>
                <Brain size={14} /> {insightLoading ? 'Analyzing...' : 'Generate AI Insights'}
              </button>
            )}
            {insight && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'var(--bg-glass)', padding: '14px', borderRadius: 'var(--radius-sm)', marginTop: '8px', boxShadow: 'var(--clay-shadow-sm)' }}>
                {typeof insight === 'string' ? insight : JSON.stringify(insight, null, 2)}
              </div>
            )}
          </div>

          <div className="clay-card" style={{ padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} /> Deal Health
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Progress ({STAGE_LABELS[deal.stage] || deal.stage})
            </div>
            <div className="clay-progress" style={{ marginBottom: '16px', height: '8px' }}>
              <div
                className="clay-progress-bar"
                style={{
                  width: `${Math.max(8, (STAGE_LABELS[deal.stage] ? ['lead','qualified','proposal','negotiation','closed_won'].indexOf(deal.stage) + 1 : 1) / 5 * 100)}%`,
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Probability</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{probability}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Expected Value</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(deal.value * probability / 100)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Activities</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activities.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Conversations</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{conversations.length}</span>
              </div>
            </div>
          </div>

          {deal.stage === 'closed_lost' && !deal.loss_reason && (
            <div className="clay-card" style={{ padding: '20px 24px', background: 'rgba(113,113,122,0.1)', border: '1px solid rgba(113,113,122,0.15)' }}>
              <p style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 500 }}>
                This deal was marked as lost. No loss reason has been recorded.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
