import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ArrowLeft, Building2, Globe, MapPin, Users, Phone, DollarSign, Handshake, FileText, Edit, Activity, Mail } from 'lucide-react';

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const TABS = ['contacts', 'deals', 'invoices', 'activities'];

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contacts');

  useEffect(() => {
    setLoading(true);
    api.getCompany(id)
      .then(data => {
        setCompany(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="clay-skeleton" style={{ width: '140px', height: '36px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }} />
        <div className="clay-skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="clay-skeleton" style={{ height: '100px', borderRadius: 'var(--radius-lg)' }} />
          <div className="clay-skeleton" style={{ height: '100px', borderRadius: 'var(--radius-lg)' }} />
          <div className="clay-skeleton" style={{ height: '100px', borderRadius: 'var(--radius-lg)' }} />
        </div>
        <div className="clay-skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (!company) {
    return (
      <div>
        <button className="clay-btn clay-btn-ghost" onClick={() => navigate('/companies')} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Back to Companies
        </button>
        <div className="clay-empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--clay-shadow)', border: '1px solid rgba(255,255,255,0.6)' }}>
          <Building2 size={48} style={{ opacity: 0.4, color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>Company not found</h3>
          <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>The company you are looking for does not exist or has been removed.</p>
          <button className="clay-btn clay-btn-primary" onClick={() => navigate('/companies')}>
            <ArrowLeft size={16} /> Back to Companies
          </button>
        </div>
      </div>
    );
  }

  const contacts = company.contacts || [];
  const deals = company.deals || [];
  const invoices = company.invoices || [];
  const activities = company.activities || [];
  const totalRevenue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  return (
    <div>
      <button className="clay-btn clay-btn-ghost" onClick={() => navigate('/companies')} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Companies
      </button>

      <div className="clay-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{company.name}</h2>
              {company.industry && (
                <span className="clay-badge clay-badge-accent">{company.industry}</span>
              )}
              {company.size && (
                <span className="clay-tag">{company.size} employees</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '12px' }}>
              {company.website && (
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}
                >
                  <Globe size={14} /> {company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {(company.city || company.state || company.country) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <MapPin size={14} />
                  {[company.city, company.state, company.country].filter(Boolean).join(', ')}
                </div>
              )}
              {company.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Phone size={14} /> {company.phone}
                </div>
              )}
            </div>
          </div>
          <button className="clay-btn" onClick={() => navigate(`/companies`)}>
            <Edit size={16} /> Edit Company
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="clay-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--info-light), #d4d4d8)' }}>
                <Users size={20} color="var(--info)" />
            </div>
          </div>
          <div className="clay-stat-value">{contacts.length}</div>
          <div className="clay-stat-label">Contacts</div>
        </div>

        <div className="clay-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--success-light), #818cf8)' }}>
                <Handshake size={20} color="var(--success)" />
            </div>
          </div>
          <div className="clay-stat-value">{deals.length}</div>
          <div className="clay-stat-label">Deals</div>
        </div>

        <div className="clay-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--warning-light), #d4d4d8)' }}>
                <DollarSign size={20} color="var(--warning)" />
            </div>
          </div>
          <div className="clay-stat-value">{formatCurrency(totalRevenue)}</div>
          <div className="clay-stat-label">Total Revenue</div>
        </div>
      </div>

      <div className="clay-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 0' }}>
          <div className="clay-tabs">
            {TABS.map(tab => (
              <button
                key={tab}
                className={`clay-tab${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {' '}
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 400 }}>
                  ({tab === 'contacts' ? contacts.length : tab === 'deals' ? deals.length : tab === 'invoices' ? invoices.length : activities.length})
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {activeTab === 'contacts' && (
            contacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Users size={32} style={{ opacity: 0.4, marginBottom: '12px' }} />
                <p style={{ fontSize: '14px' }}>No contacts associated with this company.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {contacts.map(contact => (
                  <div
                    key={contact.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        className="clay-avatar"
                        style={{ background: 'var(--accent-gradient)' }}
                      >
                        {`${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{contact.first_name} {contact.last_name}</div>
                        {contact.title && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{contact.title}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {contact.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={13} /> {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={13} /> {contact.phone}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'deals' && (
            deals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Handshake size={32} style={{ opacity: 0.4, marginBottom: '12px' }} />
                <p style={{ fontSize: '14px' }}>No deals associated with this company.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {deals.map(deal => (
                  <div
                    key={deal.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}
                    onClick={() => navigate(`/deals/${deal.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--success-light), #818cf8)', width: '40px', height: '40px', borderRadius: 'var(--radius-sm)' }}>
                        <Handshake size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{deal.name}</div>
                        {deal.stage && (
                          <span className="clay-tag" style={{ fontSize: '10px', marginTop: '4px' }}>
                            {deal.stage.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{formatCurrency(deal.value)}</div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'invoices' && (
            invoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <FileText size={32} style={{ opacity: 0.4, marginBottom: '12px' }} />
                <p style={{ fontSize: '14px' }}>No invoices associated with this company.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {invoices.map(invoice => (
                  <div
                    key={invoice.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="clay-stat-icon" style={{ background: 'linear-gradient(135deg, var(--info-light), #d4d4d8)', width: '40px', height: '40px', borderRadius: 'var(--radius-sm)' }}>
                        <FileText size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{invoice.number || `Invoice #${invoice.id}`}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {invoice.status && (
                            <span className={`clay-badge ${invoice.status === 'paid' ? 'clay-badge-success' : invoice.status === 'overdue' ? 'clay-badge-danger' : 'clay-badge-warning'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                              {invoice.status}
                            </span>
                          )}
                          {invoice.date && ` · ${formatDate(invoice.date)}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{formatCurrency(invoice.total || invoice.amount)}</div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'activities' && (
            activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Activity size={32} style={{ opacity: 0.4, marginBottom: '12px' }} />
                <p style={{ fontSize: '14px' }}>No activities recorded for this company.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activities.map(act => (
                  <div key={act.id} style={{ display: 'flex', gap: '12px', padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--clay-shadow-sm)' }}>
                      <Activity size={15} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '13px' }}>{act.subject || act.type || 'Activity'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {[act.type, act.status, act.due_date ? formatDate(act.due_date) : null, act.created_at ? formatDate(act.created_at) : null].filter(Boolean).join(' · ')}
                      </div>
                      {act.description && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>{act.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {company.description && (
        <div className="clay-card" style={{ padding: '24px', marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>About</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{company.description}</p>
        </div>
      )}

      {company.linkedin && (
        <div className="clay-card" style={{ padding: '20px 24px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Globe size={18} style={{ color: 'var(--accent)' }} />
          <a
            href={company.linkedin.startsWith('http') ? company.linkedin : `https://${company.linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
          >
            View LinkedIn Profile
          </a>
        </div>
      )}
    </div>
  );
}
