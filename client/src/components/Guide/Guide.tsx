import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Users, Handshake, TrendingUp, FileText,
  Sparkles, Ticket, Calendar, CheckCircle2, ChevronRight,
  PartyPopper
} from 'lucide-react';

interface GuideStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  path: string;
}

const STORAGE_KEY = 'crm-guide-steps';

const steps: GuideStep[] = [
  {
    id: 1,
    title: 'Connect Your Email',
    description: 'Link your Gmail account to auto-import contacts and log conversations.',
    icon: Mail,
    label: 'Connect Gmail',
    path: '/integrations'
  },
  {
    id: 2,
    title: 'Add Your First Contact',
    description: 'Create a contact manually to start building your CRM database.',
    icon: Users,
    label: 'Add Contact',
    path: '/contacts'
  },
  {
    id: 3,
    title: 'Create a Deal Pipeline',
    description: 'Set up your first deal to track sales opportunities through stages.',
    icon: Handshake,
    label: 'Create Deal',
    path: '/deals'
  },
  {
    id: 4,
    title: 'Explore Analytics',
    description: 'Visit the analytics dashboard to see key metrics and revenue trends.',
    icon: TrendingUp,
    label: 'View Analytics',
    path: '/dashboard'
  },
  {
    id: 5,
    title: 'Send an Invoice',
    description: 'Create and send an invoice to start tracking your revenue.',
    icon: FileText,
    label: 'Create Invoice',
    path: '/invoices'
  },
  {
    id: 6,
    title: 'Set Up AI Assistant',
    description: 'Try the AI-powered assistant for deal insights and email generation.',
    icon: Sparkles,
    label: 'Open AI Assistant',
    path: '/ai-assistant'
  },
  {
    id: 7,
    title: 'Create a Ticket',
    description: 'Set up a support ticket to manage customer requests.',
    icon: Ticket,
    label: 'Create Ticket',
    path: '/tickets'
  },
  {
    id: 8,
    title: 'Add Calendar Events',
    description: 'Schedule meetings and tasks in the calendar view.',
    icon: Calendar,
    label: 'Open Calendar',
    path: '/calendar'
  }
];

function loadCompleted(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id: unknown) => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

function saveCompleted(ids: number[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export default function Guide() {
  const navigate = useNavigate();
  const [completedIds, setCompletedIds] = useState<number[]>(() => loadCompleted());
  const [showConfetti, setShowConfetti] = useState(false);

  const completedCount = completedIds.length;
  const totalCount = steps.length;
  const allDone = completedCount === totalCount;

  useEffect(() => {
    saveCompleted(completedIds);
  }, [completedIds]);

  useEffect(() => {
    if (allDone && !showConfetti) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [allDone]);

  const handleStepAction = (step: GuideStep) => {
    if (!completedIds.includes(step.id)) {
      setCompletedIds(prev => {
        if (prev.includes(step.id)) return prev;
        const next = [...prev, step.id];
        return next;
      });
    }
    navigate(step.path);
  };

  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const s = useMemo(() => ({
    container: {
      maxWidth: '800px' as const,
      margin: '0 auto',
      padding: '32px 24px'
    },
    header: {
      marginBottom: '28px'
    },
    title: {
      fontSize: '28px',
      fontWeight: 800,
      color: 'var(--text-primary)',
      margin: '0 0 6px',
      letterSpacing: '-0.5px'
    },
    subtitle: {
      fontSize: '14px',
      color: 'var(--text-secondary)',
      margin: 0,
      lineHeight: 1.5
    },
    progressSection: {
      marginBottom: '28px'
    },
    progressMeta: {
      display: 'flex' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: '10px'
    },
    progressLabel: {
      fontSize: '13px',
      fontWeight: 600,
      color: 'var(--text-secondary)'
    },
    progressCount: {
      fontSize: '13px',
      fontWeight: 700,
      color: 'var(--accent)'
    },
    progressTrack: {
      height: '6px',
      borderRadius: 'var(--radius-full)',
      background: 'var(--bg-secondary)',
      boxShadow: 'var(--card-shadow-inset)',
      overflow: 'hidden' as const
    },
    progressFill: (pct: number) => ({
      height: '100%',
      width: `${pct}%`,
      borderRadius: 'var(--radius-full)',
      background: 'var(--accent-gradient)',
      transition: 'width 0.5s ease'
    }),
    confettiBanner: {
      background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #065f46 100%)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      marginBottom: '24px',
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: '14px',
      animation: 'slideUp 0.4s ease',
      position: 'relative' as const,
      overflow: 'hidden' as const
    },
    confettiIcon: {
      width: '44px',
      height: '44px',
      borderRadius: 'var(--radius-full)',
      background: 'rgba(99, 102, 241, 0.2)',
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0
    },
    confettiText: {
      flex: 1,
      minWidth: 0
    },
    confettiTitle: {
      fontSize: '16px',
      fontWeight: 700,
      color: '#d1fae5',
      margin: '0 0 2px'
    },
    confettiSub: {
      fontSize: '13px',
      color: '#a7f3d0',
      margin: 0
    },
    stepsList: {
      display: 'flex' as const,
      flexDirection: 'column' as const,
      gap: '12px' as const
    },
    stepCard: (isCompleted: boolean) => ({
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: 'var(--card-border)',
      borderLeft: isCompleted
        ? '3px solid var(--success)'
        : '3px solid transparent',
      boxShadow: 'var(--card-shadow)',
      padding: '20px 24px',
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: '16px',
      transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
      opacity: isCompleted ? 0.78 : 1
    }),
    stepCardHover: {
      boxShadow: 'var(--card-shadow-hover)',
      transform: 'translateY(-1px)'
    },
    stepNumber: (isCompleted: boolean) => ({
      width: '40px',
      height: '40px',
      borderRadius: 'var(--radius-full)',
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
      background: isCompleted ? 'var(--success)' : 'var(--bg-glass)',
      border: isCompleted ? '2px solid var(--success)' : '2px solid var(--divider-color)',
      color: isCompleted ? '#ffffff' : 'var(--text-muted)',
      fontWeight: 700,
      fontSize: '14px',
      transition: 'all 0.3s ease'
    }),
    stepBody: {
      flex: 1,
      minWidth: 0
    },
    stepTitle: (isCompleted: boolean) => ({
      fontSize: '15px',
      fontWeight: 600,
      color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
      margin: '0 0 4px',
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: '8px'
    }),
    stepDesc: {
      fontSize: '13px',
      color: 'var(--text-muted)',
      margin: 0,
      lineHeight: 1.5
    },
    stepAction: {
      flexShrink: 0
    },
    actionBtn: (isCompleted: boolean) => ({
      display: 'inline-flex' as const,
      alignItems: 'center' as const,
      gap: '6px',
      padding: isCompleted ? '0' : '8px 16px',
      borderRadius: 'var(--radius-sm)',
      border: isCompleted ? 'none' : '1px solid var(--accent)',
      background: isCompleted ? 'transparent' : 'transparent',
      color: isCompleted ? 'var(--success-text)' : 'var(--accent)',
      fontSize: '13px',
      fontWeight: 600,
      cursor: isCompleted ? 'default' : 'pointer',
      fontFamily: 'var(--font-family)',
      transition: 'all 0.15s ease'
    }),
    actionBtnHover: {
      background: 'var(--accent)',
      color: '#ffffff'
    }
  }), []);

  return (
    <div style={s.container}>
      {/* ── Header ── */}
      <div style={s.header}>
        <h1 style={s.title}>Getting Started</h1>
        <p style={s.subtitle}>
          Follow these steps to set up your SmartCRM workspace. Track your progress below.
        </p>
      </div>

      {/* ── Progress ── */}
      <div style={s.progressSection}>
        <div style={s.progressMeta}>
          <span style={s.progressLabel}>Onboarding Progress</span>
          <span style={s.progressCount}>{completedCount} / {totalCount} completed</span>
        </div>
        <div style={s.progressTrack}>
          <div style={s.progressFill(progressPercent)} />
        </div>
      </div>

      {/* ── Congratulations Banner ── */}
      {showConfetti && (
        <div style={s.confettiBanner}>
          <div style={s.confettiIcon}>
            <PartyPopper size={22} color="#818cf8" />
          </div>
          <div style={s.confettiText}>
            <p style={s.confettiTitle}>You&apos;re all set!</p>
            <p style={s.confettiSub}>
              You&apos;ve completed every onboarding step. Your SmartCRM workspace is ready.
            </p>
          </div>
        </div>
      )}

      {/* ── Steps ── */}
      <div style={s.stepsList}>
        {steps.map(step => {
          const isCompleted = completedIds.includes(step.id);
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              style={{
                ...s.stepCard(isCompleted),
                ...(isCompleted ? { borderLeftColor: 'var(--success)' } : {})
              }}
              onMouseEnter={e => {
                if (isCompleted) return;
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = 'var(--card-shadow-hover)';
                el.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                if (isCompleted) return;
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = 'var(--card-shadow)';
                el.style.transform = 'translateY(0)';
              }}
            >
              {/* Number Circle */}
              <div style={s.stepNumber(isCompleted)}>
                {isCompleted ? (
                  <CheckCircle2 size={20} color="#ffffff" />
                ) : (
                  step.id
                )}
              </div>

              {/* Content */}
              <div style={s.stepBody}>
                <h3 style={s.stepTitle(isCompleted)}>
                  <Icon size={16} color={isCompleted ? 'var(--text-muted)' : 'var(--accent)'} />
                  {step.title}
                </h3>
                <p style={s.stepDesc}>{step.description}</p>
              </div>

              {/* Action Button */}
              <div style={s.stepAction}>
                {isCompleted ? (
                  <span style={s.actionBtn(true)}>
                    <CheckCircle2 size={16} color="var(--success-text)" />
                    Done
                  </span>
                ) : (
                  <button
                    style={s.actionBtn(false)}
                    onClick={() => handleStepAction(step)}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = 'var(--accent)';
                      el.style.color = '#ffffff';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = 'transparent';
                      el.style.color = 'var(--accent)';
                    }}
                  >
                    {step.label}
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
