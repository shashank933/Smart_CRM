import React, { useState } from 'react';
import { useStore } from '../../store/store';
import {
  Brain,
  Mail,
  Lock,
  User,
  ArrowRight,
  Handshake,
  Building2,
  Ticket,
  FileText,
  MessageSquare,
  Sparkles,
  Zap,
  PhoneCall,
  CalendarCheck,
  BarChart3,
  ReceiptText,
  Users,
  Target,
} from 'lucide-react';

const CRM_CARDS = [
  {
    icon: Handshake,
    color: '#34D399',
    title: 'Enterprise Deal',
    subtitle: '$45,000 · Proposal',
    detail: 'Owner: Maya · Close date: Aug 12 · Probability: 68%',
    metric: '+18%'
  },
  {
    icon: Building2,
    color: '#818CF8',
    title: 'Acme Corp',
    subtitle: 'Technology · 500+ employees',
    detail: '12 contacts · 4 active deals · Last touch: Today',
    metric: 'Tier A'
  },
  {
    icon: Ticket,
    color: '#F87171',
    title: 'API Integration',
    subtitle: 'High priority · Open',
    detail: 'SLA: 4h · Assigned to Support · 3 customer replies',
    metric: 'SLA'
  },
  {
    icon: FileText,
    color: '#FBBF24',
    title: 'INV-2048',
    subtitle: 'Paid · $12,500',
    detail: 'Due Jun 28 · Contact: Sarah Chen · Q2 services',
    metric: 'Paid'
  },
  {
    icon: User,
    color: '#60A5FA',
    title: 'Sarah Chen',
    subtitle: 'CTO @ Fintech.io',
    detail: 'Lead score: 92 · Source: Gmail sync · 2 open deals',
    metric: 'Hot'
  },
  {
    icon: MessageSquare,
    color: '#C084FC',
    title: 'Support Chat',
    subtitle: 'WhatsApp · 2 unread',
    detail: 'Last message: Pricing question · Sentiment: Positive',
    metric: 'Live'
  },
  {
    icon: PhoneCall,
    color: '#22D3EE',
    title: 'Discovery Call',
    subtitle: 'Today · 3:30 PM',
    detail: 'Attendees: 4 · Linked deal: Cloud Migration · Notes ready',
    metric: 'Next'
  },
  {
    icon: CalendarCheck,
    color: '#A3E635',
    title: 'Renewal Task',
    subtitle: 'Due tomorrow',
    detail: 'Account: Enterprise Corp · Renewal value: $32,000',
    metric: '92%'
  },
  {
    icon: BarChart3,
    color: '#FB7185',
    title: 'Revenue Forecast',
    subtitle: 'Q4 pipeline · $1.2M',
    detail: 'Weighted forecast: $740K · 14 opportunities tracked',
    metric: '+31%'
  },
  {
    icon: ReceiptText,
    color: '#F97316',
    title: 'Invoice Review',
    subtitle: '3 pending approvals',
    detail: 'Outstanding: $84,200 · Oldest due: 9 days ago',
    metric: '3'
  },
  {
    icon: Users,
    color: '#38BDF8',
    title: 'New Contacts',
    subtitle: '12 imported from event',
    detail: '6 qualified leads · 4 companies matched automatically',
    metric: '+12'
  },
  {
    icon: Target,
    color: '#A78BFA',
    title: 'Campaign Lead',
    subtitle: 'Webinar · Qualified',
    detail: 'Engagement: High · Next step: Demo invite email',
    metric: 'MQL'
  },
];

const CARD_ROWS = [
  CRM_CARDS,
  [...CRM_CARDS.slice(4), ...CRM_CARDS.slice(0, 4)],
  [...CRM_CARDS.slice(8), ...CRM_CARDS.slice(0, 8)],
  [...CRM_CARDS.slice(2), ...CRM_CARDS.slice(0, 2)],
  [...CRM_CARDS.slice(6), ...CRM_CARDS.slice(0, 6)],
  [...CRM_CARDS.slice(10), ...CRM_CARDS.slice(0, 10)],
  [...CRM_CARDS.slice(1), ...CRM_CARDS.slice(0, 1)],
  [...CRM_CARDS.slice(5), ...CRM_CARDS.slice(0, 5)],
];

const repeatedCards = (cards) => [...cards, ...cards, ...cards, ...cards];

const MotionCard = ({ icon: Icon, color, title, subtitle, detail, metric }) => (
  <div className="motion-card">
    <div className="motion-card-icon" style={{ '--card-accent': color }}>
      <Icon size={24} />
    </div>
    <div className="motion-card-copy">
      <div className="motion-card-title">{title}</div>
      <div className="motion-card-subtitle">{subtitle}</div>
      <div className="motion-card-detail">{detail}</div>
    </div>
    <div className="motion-card-metric" style={{ '--card-accent': color }}>
      {metric}
    </div>
  </div>
);

const FeatureItem = ({ icon: Icon, text }) => (
  <div className="feature-item">
    <div className="feature-icon">
      <Icon size={16} />
    </div>
    <span>{text}</span>
  </div>
);

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('demo@smartcrm.com');
  const [password, setPassword] = useState('demo123');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useStore(s => s.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        useStore.setState({ user: data.user, isAuthenticated: true });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('Google OAuth integration is not configured in this demo environment.');
  };

  const styles = {
    page: {
      position: 'relative',
      minHeight: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#070A1A',
      color: '#ffffff',
    },
    motionField: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: '230vw',
      minWidth: '2600px',
      height: '230vh',
      transform: 'translate(-50%, -50%) rotate(-24deg)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '28px',
      zIndex: 0,
    },
    glowA: {
      position: 'absolute',
      width: '48vw',
      height: '48vw',
      minWidth: '420px',
      minHeight: '420px',
      top: '-15%',
      left: '-8%',
      borderRadius: '999px',
      background: 'radial-gradient(circle, rgba(99, 102, 241, 0.55), rgba(99, 102, 241, 0) 65%)',
      filter: 'blur(12px)',
      zIndex: 1,
    },
    glowB: {
      position: 'absolute',
      width: '42vw',
      height: '42vw',
      minWidth: '360px',
      minHeight: '360px',
      right: '-10%',
      bottom: '-14%',
      borderRadius: '999px',
      background: 'radial-gradient(circle, rgba(45, 212, 191, 0.38), rgba(45, 212, 191, 0) 68%)',
      filter: 'blur(10px)',
      zIndex: 1,
    },
    veil: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(115deg, rgba(3, 7, 18, 0.48), rgba(17, 24, 39, 0.72) 47%, rgba(30, 27, 75, 0.42))',
      zIndex: 2,
    },
    content: {
      position: 'relative',
      zIndex: 5,
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(380px, 500px)',
      gap: '48px',
      alignItems: 'center',
      padding: '42px clamp(24px, 6vw, 86px)',
      boxSizing: 'border-box',
    },
    brand: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '42px',
    },
    hero: {
      maxWidth: '690px',
    },
    eyebrow: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '999px',
      border: '1px solid rgba(255, 255, 255, 0.16)',
      background: 'rgba(255, 255, 255, 0.08)',
      color: '#C7D2FE',
      fontSize: '13px',
      fontWeight: 700,
      marginBottom: '22px',
      backdropFilter: 'blur(18px)',
    },
    heading: {
      margin: 0,
      color: '#ffffff',
      fontSize: 'clamp(44px, 7vw, 92px)',
      lineHeight: 0.9,
      letterSpacing: '-0.07em',
      fontWeight: 900,
      textWrap: 'balance',
    },
    paragraph: {
      maxWidth: '560px',
      margin: '24px 0 34px',
      color: '#D9E4FF',
      fontSize: '18px',
      lineHeight: 1.65,
    },
    features: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(210px, 1fr))',
      gap: '14px',
      maxWidth: '650px',
    },
    formPanel: {
      width: '100%',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '32px',
      background: 'linear-gradient(160deg, rgba(255, 255, 255, 0.92), rgba(241, 245, 249, 0.82))',
      boxShadow: '0 30px 100px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.86)',
      backdropFilter: 'blur(26px)',
      padding: '34px',
      boxSizing: 'border-box',
      color: '#0F172A',
    },
    panelTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '18px',
      marginBottom: '26px',
    },
    title: {
      fontSize: '30px',
      fontWeight: 900,
      color: '#0F172A',
      margin: '0 0 8px',
      letterSpacing: '-0.04em',
    },
    subtitle: {
      fontSize: '14px',
      color: '#64748B',
      margin: 0,
      lineHeight: 1.5,
    },
    demoBadge: {
      flexShrink: 0,
      borderRadius: '16px',
      padding: '10px 12px',
      background: 'rgba(79, 70, 229, 0.1)',
      color: '#4338CA',
      fontWeight: 800,
      fontSize: '12px',
      border: '1px solid rgba(79, 70, 229, 0.16)',
    },
    inputWrap: {
      position: 'relative',
      marginBottom: '16px'
    },
    inputLabel: {
      display: 'block',
      fontSize: '13px',
      fontWeight: 800,
      color: '#334155',
      marginBottom: '7px'
    },
    inputIcon: {
      position: 'absolute',
      left: '15px',
      top: '40px',
      transform: 'translateY(-50%)',
      color: '#94A3B8',
      pointerEvents: 'none'
    },
    input: {
      width: '100%',
      padding: '13px 14px 13px 44px',
      borderRadius: '14px',
      border: '1px solid rgba(148, 163, 184, 0.48)',
      fontSize: '14px',
      color: '#0F172A',
      background: 'rgba(255, 255, 255, 0.78)',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
      boxSizing: 'border-box'
    },
    buttonPrimary: {
      width: '100%',
      padding: '15px',
      borderRadius: '16px',
      border: 'none',
      background: 'linear-gradient(135deg, #4F46E5, #7C3AED 55%, #06B6D4)',
      color: '#ffffff',
      fontSize: '15px',
      fontWeight: 800,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '10px',
      boxShadow: '0 18px 34px rgba(79, 70, 229, 0.32)',
      transition: 'transform 0.2s ease, opacity 0.2s ease',
    },
    buttonGoogle: {
      width: '100%',
      padding: '12px',
      borderRadius: '14px',
      border: '1px solid rgba(148, 163, 184, 0.42)',
      background: 'rgba(255, 255, 255, 0.66)',
      color: '#0F172A',
      fontSize: '14px',
      fontWeight: 800,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '22px',
      transition: 'background 0.2s ease, transform 0.2s ease',
    },
    error: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      color: '#B91C1C',
      padding: '12px 14px',
      borderRadius: '12px',
      marginBottom: '18px',
      fontSize: '13px',
      fontWeight: 700
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      textAlign: 'center',
      color: '#94A3B8',
      fontSize: '13px',
      fontWeight: 700,
      marginBottom: '22px',
    },
    dividerLine: {
      flex: 1,
      borderBottom: '1px solid rgba(148, 163, 184, 0.38)',
    },
    dividerText: {
      padding: '0 10px',
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes card-stream-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }

        @keyframes card-stream-right {
          0% { transform: translateX(-25%); }
          100% { transform: translateX(0); }
        }

        @keyframes card-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.015); }
        }

        .motion-row {
          display: flex;
          gap: 34px;
          width: max-content;
          will-change: transform;
        }

        .motion-row.left { animation: card-stream-left var(--row-speed) linear infinite; }
        .motion-row.right { animation: card-stream-right var(--row-speed) linear infinite; }

        .motion-card {
          width: 430px;
          min-height: 132px;
          padding: 24px;
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(226, 232, 240, 0.82));
          box-shadow: 0 28px 84px rgba(2, 6, 23, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.92);
          display: flex;
          align-items: center;
          gap: 18px;
          color: #0F172A;
          backdrop-filter: blur(20px);
          animation: card-float 6s ease-in-out infinite;
          animation-delay: calc(var(--card-index, 0) * -0.6s);
        }

        .motion-card-icon {
          width: 68px;
          height: 68px;
          border-radius: 22px;
          background: color-mix(in srgb, var(--card-accent) 18%, white);
          color: var(--card-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--card-accent) 18%, transparent), 0 12px 28px color-mix(in srgb, var(--card-accent) 16%, transparent);
        }

        .motion-card-copy {
          min-width: 0;
          flex: 1;
        }

        .motion-card-title {
          font-size: 20px;
          font-weight: 900;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: -0.035em;
        }

        .motion-card-subtitle {
          margin-top: 6px;
          font-size: 15px;
          color: #475569;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .motion-card-detail {
          margin-top: 8px;
          font-size: 13px;
          line-height: 1.45;
          color: #64748B;
          font-weight: 700;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .motion-card-metric {
          flex-shrink: 0;
          min-width: 64px;
          padding: 10px 12px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--card-accent) 15%, white);
          color: color-mix(in srgb, var(--card-accent) 82%, #0F172A);
          font-size: 14px;
          font-weight: 900;
          text-align: center;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--card-accent) 18%, transparent);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.13);
          background: rgba(255, 255, 255, 0.08);
          color: #E0E7FF;
          font-weight: 800;
          font-size: 14px;
          backdrop-filter: blur(16px);
        }

        .feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 10px;
          background: rgba(129, 140, 248, 0.22);
          color: #C4B5FD;
          flex-shrink: 0;
        }

        .form-input:focus {
          border-color: #6366F1 !important;
          background: rgba(255, 255, 255, 0.94) !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.14);
        }

        .google-btn:hover { background: rgba(255, 255, 255, 0.92) !important; transform: translateY(-1px); }
        .primary-btn:hover { transform: translateY(-1px); }

        @media (max-width: 980px) {
          .login-content {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            padding: 28px 20px !important;
          }

          .login-hero {
            max-width: 100% !important;
          }

          .login-features {
            grid-template-columns: 1fr !important;
          }

          .login-panel {
            max-width: 520px;
            margin: 0 auto;
            padding: 26px !important;
          }

          .motion-card {
            width: 360px;
            min-height: 120px;
            padding: 20px;
          }

          .motion-card-icon {
            width: 58px;
            height: 58px;
            border-radius: 20px;
          }

          .motion-card-title {
            font-size: 18px;
          }
        }

        @media (max-width: 620px) {
          .login-brand {
            margin-bottom: 26px !important;
          }

          .login-copy p {
            font-size: 15px !important;
            margin-bottom: 22px !important;
          }

          .login-panel-top {
            flex-direction: column;
          }

          .motion-field {
            min-width: 1900px !important;
            opacity: 0.72;
          }

          .motion-row {
            gap: 22px;
          }

          .motion-card {
            width: 310px;
            min-height: 108px;
            padding: 16px;
            border-radius: 24px;
            gap: 13px;
          }

          .motion-card-icon {
            width: 50px;
            height: 50px;
            border-radius: 17px;
          }

          .motion-card-title {
            font-size: 16px;
          }

          .motion-card-subtitle {
            font-size: 13px;
          }

          .motion-card-detail {
            font-size: 11px;
            -webkit-line-clamp: 1;
          }

          .motion-card-metric {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .motion-row,
          .motion-card {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div className="motion-field" style={styles.motionField} aria-hidden="true">
        {CARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`motion-row ${rowIndex % 2 === 0 ? 'left' : 'right'}`}
            style={{ '--row-speed': `${48 + rowIndex * 5}s` }}
          >
            {repeatedCards(row).map((card, cardIndex) => (
              <div key={`${rowIndex}-${cardIndex}`} style={{ '--card-index': cardIndex }}>
                <MotionCard {...card} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={styles.glowA} />
      <div style={styles.glowB} />
      <div style={styles.veil} />

      <main className="login-content" style={styles.content}>
        <section className="login-copy" style={styles.hero}>
          <div className="login-brand" style={styles.brand}>
            <div style={{ width: '46px', height: '46px', borderRadius: '15px', background: 'linear-gradient(135deg, #818CF8, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 18px 36px rgba(79, 70, 229, 0.35)' }}>
              <Brain size={25} color="#ffffff" />
            </div>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>SmartCRM</span>
          </div>

          <div className="login-hero">
            <div style={styles.eyebrow}>
              <Sparkles size={15} />
              Live CRM command center
            </div>
            <h1 style={styles.heading}>Every customer signal in motion.</h1>
            <p style={styles.paragraph}>
              Deals, companies, tickets, invoices, contacts and conversations flow together in one AI-powered workspace built for fast-moving teams.
            </p>

            <div className="login-features" style={styles.features}>
              <FeatureItem icon={Handshake} text="Pipeline and deal velocity" />
              <FeatureItem icon={MessageSquare} text="Omnichannel conversations" />
              <FeatureItem icon={Zap} text="Automated workflows" />
              <FeatureItem icon={BarChart3} text="Real-time revenue insights" />
            </div>
          </div>
        </section>

        <section className="login-panel" style={styles.formPanel}>
          <div className="login-panel-top" style={styles.panelTop}>
            <div>
              <h2 style={styles.title}>
                {isRegister ? 'Create workspace' : 'Login to Dashboard'}
              </h2>
              <p style={styles.subtitle}>
                {isRegister ? 'Start tracking every customer touchpoint today.' : 'Welcome back. Your CRM is already moving.'}
              </p>
            </div>
            <div style={styles.demoBadge}>Demo ready</div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="button" className="google-btn" style={styles.buttonGoogle} onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.02 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <div style={styles.dividerText}>or continue with email</div>
            <div style={styles.dividerLine}></div>
          </div>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div style={styles.inputWrap}>
                <label style={styles.inputLabel}>Full Name</label>
                <User size={16} style={styles.inputIcon} />
                <input
                  className="form-input"
                  style={styles.input}
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={isRegister}
                />
              </div>
            )}

            <div style={styles.inputWrap}>
              <label style={styles.inputLabel}>Email Address</label>
              <Mail size={16} style={styles.inputIcon} />
              <input
                className="form-input"
                style={styles.input}
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={styles.inputWrap}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                <label style={{ ...styles.inputLabel, marginBottom: 0 }}>Password</label>
                {!isRegister && (
                  <button type="button" style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <Lock size={16} style={styles.inputIcon} />
              <input
                className="form-input"
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              className="primary-btn"
              style={{ ...styles.buttonPrimary, opacity: loading ? 0.7 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '14px', color: '#64748B', fontWeight: 700 }}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              style={{
                color: '#4F46E5', border: 'none', background: 'none',
                fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px'
              }}
            >
              {isRegister ? 'Sign In' : 'Sign up for free'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}