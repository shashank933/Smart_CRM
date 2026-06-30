import React, { useState } from 'react';
import { useStore } from '../../store/store';
import logoSvg from '../../assets/logo.svg';
import {
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
    color: '#888888',
    title: 'Enterprise Deal',
    subtitle: '$45,000 · Proposal',
    detail: 'Owner: Maya · Close date: Aug 12 · Probability: 68%',
    metric: '+18%'
  },
  {
    icon: Building2,
    color: '#aaaaaa',
    title: 'Acme Corp',
    subtitle: 'Technology · 500+ employees',
    detail: '12 contacts · 4 active deals · Last touch: Today',
    metric: 'Tier A'
  },
  {
    icon: Ticket,
    color: '#666666',
    title: 'API Integration',
    subtitle: 'High priority · Open',
    detail: 'SLA: 4h · Assigned to Support · 3 customer replies',
    metric: 'SLA'
  },
  {
    icon: FileText,
    color: '#999999',
    title: 'INV-2048',
    subtitle: 'Paid · $12,500',
    detail: 'Due Jun 28 · Contact: Sarah Chen · Q2 services',
    metric: 'Paid'
  },
  {
    icon: User,
    color: '#aaaaaa',
    title: 'Sarah Chen',
    subtitle: 'CTO @ Fintech.io',
    detail: 'Lead score: 92 · Source: Gmail sync · 2 open deals',
    metric: 'Hot'
  },
  {
    icon: MessageSquare,
    color: '#aaaaaa',
    title: 'Support Chat',
    subtitle: 'WhatsApp · 2 unread',
    detail: 'Last message: Pricing question · Sentiment: Positive',
    metric: 'Live'
  },
  {
    icon: PhoneCall,
    color: '#999999',
    title: 'Discovery Call',
    subtitle: 'Today · 3:30 PM',
    detail: 'Attendees: 4 · Linked deal: Cloud Migration · Notes ready',
    metric: 'Next'
  },
  {
    icon: CalendarCheck,
    color: '#888888',
    title: 'Renewal Task',
    subtitle: 'Due tomorrow',
    detail: 'Account: Enterprise Corp · Renewal value: $32,000',
    metric: '92%'
  },
  {
    icon: BarChart3,
    color: '#777777',
    title: 'Revenue Forecast',
    subtitle: 'Q4 pipeline · $1.2M',
    detail: 'Weighted forecast: $740K · 14 opportunities tracked',
    metric: '+31%'
  },
  {
    icon: ReceiptText,
    color: '#888888',
    title: 'Invoice Review',
    subtitle: '3 pending approvals',
    detail: 'Outstanding: $84,200 · Oldest due: 9 days ago',
    metric: '3'
  },
  {
    icon: Users,
    color: '#999999',
    title: 'New Contacts',
    subtitle: '12 imported from event',
    detail: '6 qualified leads · 4 companies matched automatically',
    metric: '+12'
  },
  {
    icon: Target,
    color: '#aaaaaa',
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

const WhatsAppIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.22 21.78l4.612-1.218A9.95 9.95 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill={color === 'currentColor' ? '#25D366' : color} opacity="0.15"/>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.22 21.78l4.612-1.218A9.95 9.95 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" stroke={color === 'currentColor' ? '#25D366' : color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12l2 2 4-4" stroke={color === 'currentColor' ? '#25D366' : color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
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
      background: '#09090b',
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
      background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18), rgba(99, 102, 241, 0) 65%)',
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
      background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0) 68%)',
      filter: 'blur(10px)',
      zIndex: 1,
    },
    veil: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(115deg, rgba(9, 9, 11, 0.7), rgba(24, 24, 27, 0.8) 47%, rgba(9, 9, 11, 0.6))',
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
      padding: '6px 12px',
      borderRadius: '6px',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      background: 'rgba(255, 255, 255, 0.06)',
      color: '#a1a1aa',
      fontSize: '12px',
      fontWeight: 600,
      marginBottom: '20px',
    },
    heading: {
      margin: 0,
      color: '#ffffff',
      fontSize: 'clamp(40px, 6vw, 72px)',
      lineHeight: 1,
      letterSpacing: '-0.04em',
      fontWeight: 700,
      textWrap: 'balance',
    },
    paragraph: {
      maxWidth: '560px',
      margin: '20px 0 30px',
      color: '#a1a1aa',
      fontSize: '16px',
      lineHeight: 1.6,
    },
    features: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(210px, 1fr))',
      gap: '14px',
      maxWidth: '650px',
    },
    formPanel: {
      width: '100%',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      borderRadius: '16px',
      background: '#ffffff',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
      padding: '30px',
      boxSizing: 'border-box',
      color: '#09090b',
    },
    panelTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '18px',
      marginBottom: '26px',
    },
    title: {
      fontSize: '26px',
      fontWeight: 700,
      color: '#09090b',
      margin: '0 0 4px',
      letterSpacing: '-0.02em',
    },
    subtitle: {
      fontSize: '14px',
      color: '#71717a',
      margin: 0,
      lineHeight: 1.5,
    },
    demoBadge: {
      flexShrink: 0,
      borderRadius: '8px',
      padding: '6px 10px',
      background: 'rgba(99, 102, 241, 0.1)',
      color: '#6366f1',
      fontWeight: 600,
      fontSize: '12px',
      border: '1px solid rgba(99, 102, 241, 0.15)',
    },
    inputWrap: {
      position: 'relative',
      marginBottom: '16px'
    },
    inputLabel: {
      display: 'block',
      fontSize: '13px',
      fontWeight: 600,
      color: '#3f3f46',
      marginBottom: '6px'
    },
    inputIcon: {
      position: 'absolute',
      left: '14px',
      top: '38px',
      transform: 'translateY(-50%)',
      color: '#a1a1aa',
      pointerEvents: 'none'
    },
    input: {
      width: '100%',
      padding: '11px 14px 11px 42px',
      borderRadius: '8px',
      border: '1px solid rgba(0, 0, 0, 0.12)',
      fontSize: '14px',
      color: '#09090b',
      background: '#fafafa',
      outline: 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      boxSizing: 'border-box'
    },
    buttonPrimary: {
      width: '100%',
      padding: '13px',
      borderRadius: '8px',
      border: 'none',
      background: '#6366f1',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '8px',
      transition: 'background 0.15s ease',
    },
    buttonGoogle: {
      width: '100%',
      padding: '11px',
      borderRadius: '8px',
      border: '1px solid rgba(0, 0, 0, 0.12)',
      background: '#ffffff',
      color: '#09090b',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '20px',
      transition: 'background 0.15s ease',
    },
    error: {
      background: 'rgba(113, 113, 122, 0.12)',
      border: '1px solid rgba(113, 113, 122, 0.2)',
      color: '#a1a1aa',
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
      color: '#a1a1aa',
      fontSize: '12px',
      fontWeight: 600,
      marginBottom: '20px',
    },
    dividerLine: {
      flex: 1,
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
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
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 18px;
          color: #0F172A;
          animation: card-float 6s ease-in-out infinite;
          animation-delay: calc(var(--card-index, 0) * -0.6s);
        }

        .motion-card-icon {
          width: 68px;
          height: 68px;
          border-radius: 14px;
          background: color-mix(in srgb, var(--card-accent) 12%, white);
          color: var(--card-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .motion-card-copy {
          min-width: 0;
          flex: 1;
        }

        .motion-card-title {
          font-size: 18px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: -0.02em;
        }

        .motion-card-subtitle {
          margin-top: 4px;
          font-size: 14px;
          color: #52525b;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .motion-card-detail {
          margin-top: 6px;
          font-size: 12px;
          line-height: 1.4;
          color: #71717a;
          font-weight: 500;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .motion-card-metric {
          flex-shrink: 0;
          min-width: 56px;
          padding: 8px 10px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--card-accent) 10%, white);
          color: var(--card-accent);
          font-size: 13px;
          font-weight: 700;
          text-align: center;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #d4d4d8;
          font-weight: 500;
          font-size: 13px;
        }

        .feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.12);
          color: #818cf8;
          flex-shrink: 0;
        }

        .form-input:focus {
          border-color: #6366f1 !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
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
            border-radius: 12px;
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
            border-radius: 12px;
            gap: 13px;
          }

          .motion-card-icon {
            width: 50px;
            height: 50px;
            border-radius: 10px;
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
            <img src={logoSvg} alt="SmartCRM" style={{ width: '40px', height: '40px' }} />
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>SmartCRM</span>
          </div>

          <div className="login-hero">
            <div style={styles.eyebrow}>
              <Sparkles size={15} />
              Live CRM command center
            </div>
            <h1 style={styles.heading}>Every customer signal in motion.</h1>
            <p style={styles.paragraph}>
              Deals, companies, tickets, invoices, contacts and WhatsApp conversations flow together in one AI-powered workspace built for fast-moving teams.
            </p>

            <div className="login-features" style={styles.features}>
              <FeatureItem icon={WhatsAppIcon} text="Connected with WhatsApp" />
              <FeatureItem icon={Handshake} text="Pipeline and deal velocity" />
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
                  <button type="button" style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
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

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#71717a', fontWeight: 500 }}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              style={{
                color: '#6366f1', border: 'none', background: 'none',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px'
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