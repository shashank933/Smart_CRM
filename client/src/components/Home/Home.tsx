import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/store';
import { api } from '../../api';
import {
  Clock, Calendar, DollarSign, TrendingUp, TrendingDown,
  Handshake, Users, Ticket, MessageSquare, Zap,
  UserPlus, Sparkles, FilePlus, Phone, CheckSquare,
  Plus, CalendarDays, GitBranch, ListChecks
} from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  subject: string;
  description: string | null;
  status: string;
  due_date: string | null;
  contact_name?: string;
  deal_name?: string;
  completed_at?: string | null;
}

interface StatCard {
  label: string;
  value: string;
  rawValue?: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  trend?: { value: number; up: boolean };
}

const emerald = '#10b981';
const indigo = '#6366f1';
const cyan = '#06b6d4';
const amber = '#f59e0b';

export default function Home() {
  const navigate = useNavigate();
  const user = useStore(s => s.user);
  const stats = useStore(s => s.stats);
  const fetchStats = useStore(s => s.fetchStats);

  const [time, setTime] = useState(new Date());
  const [meetings, setMeetings] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchStats().finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [activitiesRes, tasksRes] = await Promise.all([
          api.getActivities({ type: 'meeting', due_date: today, limit: 10 }),
          api.getActivities({ type: 'task', status: 'pending', limit: 10 })
        ]);
        setMeetings(Array.isArray(activitiesRes) ? activitiesRes : []);
        setTasks(Array.isArray(tasksRes) ? tasksRes : []);
      } catch (e) {}
      setLoading(false);
    };
    fetchToday();
  }, []);

  const computeTrends = useCallback(() => {
    if (!stats || !stats.revenueByMonth || stats.revenueByMonth.length < 2) {
      return { revenueTrend: 0, revenueUp: true };
    }
    const months = stats.revenueByMonth;
    const current = months[0]?.total || 0;
    const previous = months[1]?.total || 0;
    if (previous === 0) return { revenueTrend: current > 0 ? 100 : 0, revenueUp: true };
    const pct = Math.round(((current - previous) / previous) * 100);
    return { revenueTrend: Math.abs(pct), revenueUp: pct >= 0 };
  }, [stats]);

  const getGreeting = () => {
    const h = time.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'User';
  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const formatCurrency = (v: number | undefined) => {
    if (v == null) return '$0';
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
    return `$${v.toLocaleString()}`;
  };

  const formatPercentage = (v: number | undefined) => `${v ?? 0}%`;

  const { revenueTrend, revenueUp } = computeTrends();

  const statCards: StatCard[] = [
    {
      label: 'Revenue (MTD)',
      value: formatCurrency(stats?.totalRevenue),
      rawValue: stats?.totalRevenue || 0,
      icon: DollarSign,
      color: emerald,
      trend: { value: revenueTrend, up: revenueUp }
    },
    {
      label: 'Active Deals',
      value: String(stats?.openDeals ?? 0),
      rawValue: stats?.openDeals || 0,
      icon: Handshake,
      color: indigo,
      trend: stats?.winRate != null ? { value: stats.winRate, up: stats.winRate >= 50 } : undefined
    },
    {
      label: 'New Contacts',
      value: String(stats?.totalContacts ?? 0),
      rawValue: stats?.totalContacts || 0,
      icon: Users,
      color: cyan
    },
    {
      label: 'Open Tickets',
      value: String(stats?.openTickets ?? 0),
      rawValue: stats?.openTickets || 0,
      icon: Ticket,
      color: amber,
      trend: stats?.urgentTickets != null ? { value: stats.urgentTickets, up: false } : undefined
    }
  ];

  const TrendArrow = ({ up }: { up: boolean }) =>
    up ? <TrendingUp size={12} /> : <TrendingDown size={12} />;

  const shortcuts = [
    { icon: UserPlus, label: 'New Contact', path: '/contacts', color: indigo },
    { icon: Handshake, label: 'New Deal', path: '/deals', color: emerald },
    { icon: Ticket, label: 'New Ticket', path: '/tickets', color: '#ef4444' },
    { icon: GitBranch, label: 'Workflows', path: '/workflows', color: '#8b5cf6' },
    { icon: Sparkles, label: 'AI Assistant', path: '/ai-assistant', color: '#a78bfa' },
    { icon: FilePlus, label: 'New Invoice', path: '/invoices', color: '#3b82f6' }
  ];

  /* ---------- reusable style fragments ---------- */

  const iconBox = (bg: string) => ({
    width: '40px', height: '40px', borderRadius: 'var(--radius)',
    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0
  });

  const iconBoxSm = (bg: string) => ({
    width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background 0.2s ease'
  });

  const timeBadge: React.CSSProperties = {
    background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '6px 14px', borderRadius: 'var(--radius)',
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
    color: '#e0e7ff'
  };

  /* ==================== RENDER ==================== */

  return (
    <div className="page-surface" style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* ── Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(49,46,129,0.94) 0%, rgba(107,33,168,0.9) 50%, rgba(8,145,178,0.82) 100%)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '32px', padding: '38px',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 58px)', fontWeight: 900, color: '#f5f3ff', margin: '0 0 8px', letterSpacing: '-0.06em', lineHeight: 0.95 }}>
            {getGreeting()}, {firstName}
          </h1>
          <p style={{ fontSize: '17px', color: 'rgba(224,231,255,0.82)', margin: '0 0 22px', maxWidth: '620px', lineHeight: 1.6 }}>
            Your revenue, customer conversations, support work, and next actions are synced into one live workspace.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={timeBadge}>
              <Clock size={15} color="#a5b4fc" /> {formattedTime}
            </div>
            <div style={{
              ...timeBadge,
              fontFamily: 'var(--font-family)',
              fontSize: '12px',
              fontWeight: 500
            }}>
              <Calendar size={13} color="#a5b4fc" /> {formattedDate}
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', right: '34px', top: '28px', width: '260px', padding: '18px', borderRadius: '24px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(16px)', transform: 'rotate(4deg)' }}>
          <div style={{ fontSize: '12px', color: '#c7d2fe', fontWeight: 800, marginBottom: '10px' }}>Pipeline momentum</div>
          <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.18)', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ width: '72%', height: '100%', background: 'linear-gradient(90deg, #34d399, #22d3ee)', borderRadius: '999px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 900 }}>
            <span>{formatCurrency(stats?.pipelineValue || 0)}</span>
            <span>72%</span>
          </div>
        </div>
        <div style={{
          position: 'absolute', right: '140px', bottom: '-50px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: 'rgba(99,102,241,0.08)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', right: '250px', top: '-20px',
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(192,132,252,0.06)', pointerEvents: 'none'
        }} />
      </div>

      {/* ── Stat Cards ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {statCards.map(s => (
          <div key={s.label} className="clay-stat-card" style={{
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            cursor: 'default'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={iconBox(`${s.color}1a`)}>
                <s.icon size={20} color={s.color} />
              </div>
              {s.trend && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '3px 8px', borderRadius: '999px', fontSize: '12px',
                  fontWeight: 600,
                  background: s.trend.up ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: s.trend.up ? 'var(--success-text)' : 'var(--danger-text)',
                  border: `1px solid ${s.trend.up ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                }}>
                  <TrendArrow up={s.trend.up} />
                  {formatPercentage(s.trend.value)}
                </div>
              )}
            </div>
            <div className="clay-stat-value" style={{
              fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)'
            }}>
              {s.value}
            </div>
            <div className="clay-stat-label" style={{
              fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
          <h2 style={{
              fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)',
            margin: 0, display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Zap size={18} /> Quick Actions
          </h2>
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500,
            fontFamily: 'var(--font-family)', padding: 0,
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <ListChecks size={13} /> Customize
          </button>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px'
        }}>
          {shortcuts.map(sc => (
            <button
              key={sc.label}
              onClick={() => navigate(sc.path)}
              style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
                padding: '20px 14px', border: 'var(--card-border)',
                boxShadow: 'var(--card-shadow)', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '10px', transition: 'all 0.15s ease',
                fontFamily: 'var(--font-family)'
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-2px)';
                el.style.boxShadow = 'var(--card-shadow-hover)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'var(--card-shadow)';
              }}
            >
              <div style={iconBoxSm(`${sc.color}1a`)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = sc.color + '26';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = sc.color + '1a';
                }}
              >
                <sc.icon size={18} color={sc.color} />
              </div>
              <span style={{
                fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                {sc.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Meetings & Tasks ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px'
      }}>
        {/* Today's Meetings */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
          padding: '24px', boxShadow: 'var(--card-shadow)',
          border: 'var(--card-border)'
        }}>
          <h3 style={{
            fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)',
            margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Phone size={16} /> Today's Meetings
          </h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1,2,3].map(i => (
                <div key={i} className="clay-skeleton" style={{ height: '36px', borderRadius: '8px' }} />
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <CalendarDays size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ fontSize: '13px', margin: '0 0 8px' }}>No meetings scheduled for today</p>
              <button
                className="clay-btn clay-btn-sm clay-btn-primary"
                onClick={() => navigate('/calendar')}
              >
                <Plus size={12} /> Schedule Meeting
              </button>
            </div>
          ) : (
            meetings.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 0', borderBottom: '1px solid var(--divider-color)'
              }}>
                <div style={iconBoxSm('#6366f11a')}>
                  <Phone size={14} color={indigo} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {m.subject}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {m.due_date && (
                      <span>
                        <Clock size={10} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                        {new Date(m.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {m.contact_name && <span> · {m.contact_name}</span>}
                  </div>
                </div>
                <span className="clay-badge" style={{
                  background: m.status === 'completed' ? 'var(--success-bg)' : 'var(--info-bg)',
                  color: m.status === 'completed' ? 'var(--success-text)' : 'var(--info-text)',
                  fontSize: '10px'
                }}>
                  {m.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Pending Tasks */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
          padding: '24px', boxShadow: 'var(--card-shadow)',
          border: 'var(--card-border)'
        }}>
          <h3 style={{
            fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)',
            margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <CheckSquare size={16} /> Pending Tasks
          </h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1,2,3].map(i => (
                <div key={i} className="clay-skeleton" style={{ height: '36px', borderRadius: '8px' }} />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <ListChecks size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ fontSize: '13px', margin: '0 0 8px' }}>No pending tasks</p>
              <button
                className="clay-btn clay-btn-sm clay-btn-primary"
                onClick={() => navigate('/calendar')}
              >
                <Plus size={12} /> Add Task
              </button>
            </div>
          ) : (
            tasks.map(t => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 0', borderBottom: '1px solid var(--divider-color)'
              }}>
                <div style={iconBoxSm('#f59e0b1a')}>
                  <CheckSquare size={14} color={amber} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t.subject}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {t.due_date && (
                      <span>
                        <Clock size={10} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                        {new Date(t.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {t.deal_name && <span> · {t.deal_name}</span>}
                  </div>
                </div>
                <span className="clay-badge" style={{
                  background: 'var(--warning-bg)', color: 'var(--warning-text)', fontSize: '10px'
                }}>
                  pending
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
