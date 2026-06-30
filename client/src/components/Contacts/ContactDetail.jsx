import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ArrowLeft, Mail, Phone, Building2, MapPin, Edit, Handshake, MessageSquare, Activity, Brain } from 'lucide-react';

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n || 0);
}

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    api.getContact(id).then(data => { setContact(data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const getInsight = async () => {
    setInsightLoading(true);
    try {
      const result = await api.contactInsight(id);
      setInsight(result.insight);
    } catch (e) {
      setInsight('AI insights are not available. Please configure your OpenAI API key.');
    }
    setInsightLoading(false);
  };

  const initials = contact ? `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase() : '';

  if (loading) {
    return (
      <div>
        <div className="clay-skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }} />
        <div className="clay-skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (!contact) {
    return <div className="clay-empty-state"><h3>Contact not found</h3></div>;
  }

  return (
    <div>
      <button className="clay-btn clay-btn-ghost" onClick={() => navigate('/contacts')} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Contacts
      </button>

      <div className="clay-split-view">
        <div>
          <div className="clay-card" style={{ padding: 'clamp(18px, 3vw, 28px)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div className="clay-avatar clay-avatar-lg" style={{ background: 'var(--accent-gradient)', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{contact.first_name} {contact.last_name}</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{contact.title || 'No title'} {contact.department ? `· ${contact.department}` : ''}</p>
                  </div>
                  <span className={`clay-badge clay-badge-${contact.status === 'active' ? 'success' : contact.status === 'lead' ? 'warning' : 'info'}`}>
                    {contact.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
                  {contact.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <Mail size={14} /> {contact.email}
                    </div>
                  )}
                  {contact.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <Phone size={14} /> {contact.phone}
                    </div>
                  )}
                  {contact.company_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <Building2 size={14} /> {contact.company_name}
                    </div>
                  )}
                  {contact.city && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <MapPin size={14} /> {contact.city}{contact.state ? `, ${contact.state}` : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {(contact.deals || []).length > 0 && (
            <div className="clay-card" style={{ padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Handshake size={18} /> Deals
              </h3>
              {contact.deals.map(deal => (
                <div key={deal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }} onClick={() => navigate(`/deals/${deal.id}`)}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{deal.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{deal.stage.replace('_', ' ')}</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>{formatCurrency(deal.value)}</div>
                </div>
              ))}
            </div>
          )}

          {(contact.activities || []).length > 0 && (
            <div className="clay-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} /> Activities
              </h3>
              {contact.activities.map(act => (
                <div key={act.id} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--clay-shadow-sm)' }}>
                    <Activity size={12} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '13px' }}>{act.subject}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {act.type} · {act.status} · {act.created_at ? new Date(act.created_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="clay-card" style={{ padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              {contact.mobile && <div><span style={{ color: 'var(--text-muted)' }}>Mobile:</span> {contact.mobile}</div>}
              {contact.source && <div><span style={{ color: 'var(--text-muted)' }}>Source:</span> {contact.source}</div>}
              {contact.address && <div><span style={{ color: 'var(--text-muted)' }}>Address:</span> {contact.address}</div>}
              {contact.country && <div><span style={{ color: 'var(--text-muted)' }}>Country:</span> {contact.country}</div>}
              {contact.linkedin && <div><span style={{ color: 'var(--text-muted)' }}>LinkedIn:</span> <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Profile</a></div>}
              {contact.last_contacted && <div><span style={{ color: 'var(--text-muted)' }}>Last Contacted:</span> {new Date(contact.last_contacted).toLocaleDateString()}</div>}
              {contact.created_at && <div><span style={{ color: 'var(--text-muted)' }}>Created:</span> {new Date(contact.created_at).toLocaleDateString()}</div>}
            </div>
          </div>

          {contact.notes && (
            <div className="clay-card" style={{ padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Notes</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{contact.notes}</p>
            </div>
          )}

          <div className="clay-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={18} /> AI Insights
            </h3>
            {!insight && (
              <button className="clay-btn clay-btn-primary clay-btn-sm" onClick={getInsight} disabled={insightLoading}>
                <Brain size={14} /> {insightLoading ? 'Analyzing...' : 'Generate Insights'}
              </button>
            )}
            {insight && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'var(--bg-glass)', padding: '14px', borderRadius: 'var(--radius-sm)', marginTop: '8px' }}>
                {insight}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
