import { useEffect, useState } from 'react';
import { useStore } from '../../store/store';
import { api } from '../../api';
import { Users, Building2, Handshake, DollarSign, TrendingUp, FileText, MessageSquare, Activity, Ticket, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const STAGE_COLORS = { lead: '#6366f1', qualified: '#06b6d4', proposal: '#f59e0b', negotiation: '#3b82f6', closed_won: '#10b981', closed_lost: '#ef4444' };

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n || 0);
}

const cardStyle = {
  background: 'var(--bg-card)',
  border: 'var(--card-border)',
  borderRadius: '12px',
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        <div style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.totalContacts}</span>
            <div style={{ padding: '8px', background: 'rgba(99,102,241,0.1)', borderRadius: '8px', color: '#818cf8' }}><Users size={16} /></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Total Contacts</p>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
              <ArrowUpRight size={12} /> 12% vs last month
            </span>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.totalCompanies}</span>
            <div style={{ padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', color: '#34d399' }}><Building2 size={16} /></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Companies</p>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
              <ArrowUpRight size={12} /> 8% vs last month
            </span>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.openDeals}</span>
            <div style={{ padding: '8px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', color: '#fbbf24' }}><Handshake size={16} /></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Open Deals</p>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
              <ArrowUpRight size={12} /> 5% vs last month
            </span>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#818cf8', lineHeight: 1 }}>{formatCurrency(stats.pipelineValue)}</span>
            <div style={{ padding: '8px', background: 'rgba(99,102,241,0.1)', borderRadius: '8px', color: '#818cf8' }}><DollarSign size={16} /></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Pipeline Value</p>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Gross potential</span>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stats.winRate}%</span>
            <div style={{ padding: '8px', background: 'rgba(168,85,247,0.1)', borderRadius: '8px', color: '#c084fc' }}><TrendingUp size={16} /></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Win Rate</p>
            <span style={{ fontSize: '11px', color: '#c084fc', marginTop: '4px', display: 'block' }}>Steady performance</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Revenue Won</p>
            <h4 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{formatCurrency(stats.totalRevenue)}</h4>
          </div>
          <div style={{ padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', color: '#34d399' }}><CheckCircle2 size={16} /></div>
        </div>
        <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Outstanding</p>
            <h4 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{formatCurrency(stats.outstandingAmount)}</h4>
          </div>
          <div style={{ padding: '8px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', color: '#fbbf24' }}><Clock size={16} /></div>
        </div>
        <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Open Conversations</p>
            <h4 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{stats.openConversations}</h4>
          </div>
          <div style={{ padding: '8px', background: 'rgba(6,182,212,0.1)', borderRadius: '8px', color: '#22d3ee' }}><MessageSquare size={16} /></div>
        </div>
        <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Open Tickets</p>
            <h4 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{stats.openTickets || 0}</h4>
          </div>
          <div style={{ padding: '8px', background: 'rgba(244,114,182,0.1)', borderRadius: '8px', color: '#f472b6' }}><Ticket size={16} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <div style={{ ...cardStyle, padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Revenue Trends</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2238" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#111322', border: '1px solid #1e2238', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
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
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Deal Pipeline</h3>
          {dealStageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={dealStageData} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                  {dealStageData.map((entry, i) => (
                    <Cell key={i} fill={STAGE_COLORS[entry.stage] || '#6366f1'} stroke="#111322" strokeWidth={3} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111322', border: '1px solid #1e2238', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>No deals yet</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
            {dealStageData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: STAGE_COLORS[d.stage] || '#6366f1' }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ ...cardStyle, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Deals</h3>
            <button onClick={() => navigate('/deals')} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '12px', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}>View All</button>
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
                      background: deal.stage === 'closed_won' ? 'rgba(16,185,129,0.1)' : deal.stage === 'closed_lost' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                      color: deal.stage === 'closed_won' ? '#34d399' : deal.stage === 'closed_lost' ? '#f87171' : '#818cf8',
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
                    <Activity size={14} color="#818cf8" />
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
