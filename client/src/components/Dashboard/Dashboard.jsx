import { useEffect, useState } from 'react';
import { useStore } from '../../store/store';
import { api } from '../../api';
import { Users, Building2, Handshake, DollarSign, TrendingUp, FileText, MessageSquare, Activity, Ticket, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const STAGE_COLORS = { lead: '#71717a', qualified: '#a1a1aa', proposal: '#d4d4d8', negotiation: '#52525b', closed_won: '#6366f1', closed_lost: '#3f3f46' };

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n || 0);
}

const cardStyle = {
  background: 'var(--bg-card)',
  border: 'var(--card-border)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--card-shadow)',
  backdropFilter: 'blur(4px)',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = useStore(s => s.stats);
  const fetchStats = useStore(s => s.fetchStats);
  const [activities, setActivities] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .catch(() => setLoadError(true))
      .finally(() => setInitialLoading(false));
    api.getRecentActivities().then(setActivities).catch(() => {});
  }, []);

  if (initialLoading) {
    return (
      <div className="page-surface" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="clay-skeleton" style={{ height: '120px', borderRadius: '12px' }} />
        ))}
      </div>
    );
  }

  if (loadError || !stats) {
    return (
      <div style={{ ...cardStyle, padding: '48px 32px', textAlign: 'center' }}>
        <Activity size={48} style={{ opacity: 0.4, color: 'var(--text-muted)', marginBottom: '16px' }} />
        <h3 style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>Unable to load analytics</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Check that the server is running and your database is initialized.</p>
        <button className="clay-btn clay-btn-primary" onClick={() => { setLoadError(false); setInitialLoading(true); fetchStats().then(() => setInitialLoading(false)).catch(() => { setLoadError(true); setInitialLoading(false); }); }}>
          Retry
        </button>
      </div>
    );
  }

  const dealStageData = (stats.dealsByStage || []).map(d => ({
    name: d.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: d.count,
    stage: d.stage
  }));

  const revenueData = (stats.revenueByMonth || []).map(d => ({
    month: d.month,
    revenue: d.total
  })).reverse();

  return (
    <div className="page-surface" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ ...cardStyle, padding: 'clamp(20px, 3vw, 30px)', background: 'var(--accent-gradient)', color: '#fff', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', gap: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#cccccc', marginBottom: '10px' }}>Analytics overview</div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 0.96, letterSpacing: '-0.06em', margin: 0, fontWeight: 900 }}>Pipeline health and revenue signals.</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ padding: '12px 16px', borderRadius: '18px', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(2px)' }}>
              <div style={{ fontSize: '11px', color: '#cccccc', fontWeight: 800 }}>Won Revenue</div>
              <div style={{ fontSize: '22px', fontWeight: 900 }}>{formatCurrency(stats.totalRevenue)}</div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '18px', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(2px)' }}>
              <div style={{ fontSize: '11px', color: '#cccccc', fontWeight: 800 }}>Win Rate</div>
              <div style={{ fontSize: '22px', fontWeight: 900 }}>{stats.winRate}%</div>
            </div>
          </div>
        </div>
        <div className="clay-hero-decor" style={{ position: 'absolute', width: '260px', height: '260px', right: '-70px', top: '-80px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
        <div className="clay-card" style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.totalContacts}</span>
            <div style={{ padding: '8px', background: 'rgba(99,102,241,0.12)', borderRadius: '8px', color: '#6366f1' }}><Users size={16} /></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Total Contacts</p>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
              <ArrowUpRight size={12} /> 12% vs last month
            </span>
          </div>
        </div>

        <div className="clay-card" style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.totalCompanies}</span>
            <div style={{ padding: '8px', background: 'rgba(99,102,241,0.12)', borderRadius: '8px', color: '#6366f1' }}><Building2 size={16} /></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Companies</p>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
              <ArrowUpRight size={12} /> 8% vs last month
            </span>
          </div>
        </div>

        <div className="clay-card" style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.openDeals}</span>
            <div style={{ padding: '8px', background: 'rgba(99,102,241,0.12)', borderRadius: '8px', color: '#6366f1' }}><Handshake size={16} /></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Open Deals</p>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
              <ArrowUpRight size={12} /> 5% vs last month
            </span>
          </div>
        </div>

        <div className="clay-card" style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>{formatCurrency(stats.pipelineValue)}</span>
            <div style={{ padding: '8px', background: 'rgba(99,102,241,0.12)', borderRadius: '8px', color: '#6366f1' }}><DollarSign size={16} /></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Pipeline Value</p>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Gross potential</span>
          </div>
        </div>

        <div className="clay-card" style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.winRate}%</span>
            <div style={{ padding: '8px', background: 'rgba(99,102,241,0.12)', borderRadius: '8px', color: '#6366f1' }}><TrendingUp size={16} /></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Win Rate</p>
            <span style={{ fontSize: '11px', color: '#6366f1', marginTop: '4px', display: 'block' }}>Steady performance</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Revenue Won</p>
            <h4 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{formatCurrency(stats.totalRevenue)}</h4>
          </div>
          <div style={{ padding: '8px', background: 'rgba(99,102,241,0.12)', borderRadius: '8px', color: '#6366f1' }}><CheckCircle2 size={16} /></div>
        </div>
        <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Outstanding</p>
            <h4 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{formatCurrency(stats.outstandingAmount)}</h4>
          </div>
          <div style={{ padding: '8px', background: 'rgba(161,161,170,0.12)', borderRadius: '8px', color: '#a1a1aa' }}><Clock size={16} /></div>
        </div>
        <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Open Conversations</p>
            <h4 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{stats.openConversations}</h4>
          </div>
          <div style={{ padding: '8px', background: 'rgba(99,102,241,0.12)', borderRadius: '8px', color: '#6366f1' }}><MessageSquare size={16} /></div>
        </div>
        <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Open Tickets</p>
            <h4 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{stats.openTickets || 0}</h4>
          </div>
          <div style={{ padding: '8px', background: 'rgba(161,161,170,0.12)', borderRadius: '8px', color: '#a1a1aa' }}><Ticket size={16} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div style={{ ...cardStyle, padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '16px' }}>Revenue Trends</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: '#888888' }} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} tick={{ fill: '#888888' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#111111', border: '1px solid #1a1a1a', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', fontSize: '12px' }}
                  labelStyle={{ color: '#999999' }}
                  formatter={v => [formatCurrency(v), 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>No revenue data yet</div>
          )}
        </div>

        <div style={{ ...cardStyle, padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '16px' }}>Deal Pipeline</h3>
          {dealStageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={dealStageData} cx="50%" cy="45%" innerRadius="40%" outerRadius="70%" paddingAngle={3} dataKey="value">
                  {dealStageData.map((entry, i) => (
                    <Cell key={i} fill={STAGE_COLORS[entry.stage] || '#808080'} stroke="#111111" strokeWidth={3} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111111', border: '1px solid #1a1a1a', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', fontSize: '12px' }}
                  labelStyle={{ color: '#999999' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>No deals yet</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
            {dealStageData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: STAGE_COLORS[d.stage] || '#808080' }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={{ ...cardStyle, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Deals</h3>
            <button onClick={() => navigate('/deals')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '12px', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}>View All</button>
          </div>
          {(stats.recentDeals || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {stats.recentDeals.map((deal, i) => (
                <div
                  key={deal.id}
                  onClick={() => navigate(`/deals/${deal.id}`)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: i < stats.recentDeals.length - 1 ? '1px solid var(--divider-color)' : 'none',
                    cursor: 'pointer', transition: 'opacity 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{deal.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{deal.contact_name || 'No contact'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{formatCurrency(deal.value)}</div>
                    <span style={{
                      display: 'inline-block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                      padding: '2px 8px', borderRadius: '4px', marginTop: '4px',
                      background: deal.stage === 'closed_won' ? 'rgba(99,102,241,0.12)' : deal.stage === 'closed_lost' ? 'rgba(113,113,122,0.12)' : 'rgba(99,102,241,0.08)',
                      color: deal.stage === 'closed_won' ? '#6366f1' : deal.stage === 'closed_lost' ? '#71717a' : '#6366f1',
                    }}>
                      {deal.stage.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>No deals yet</div>
          )}
        </div>

        <div style={{ ...cardStyle, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Activities</h3>
          </div>
          {activities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activities.slice(0, 6).map((act, i) => (
                <div key={act.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '10px 0', borderBottom: i < Math.min(activities.length, 6) - 1 ? '1px solid var(--divider-color)' : 'none',
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Activity size={14} color="#6366f1" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.subject}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {act.contact_name && `${act.contact_name} · `}{act.type}
                      {act.deal_name ? ` · ${act.deal_name}` : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {act.created_at ? new Date(act.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Activity logging initialization complete.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
