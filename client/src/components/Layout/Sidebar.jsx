import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../../store/store';
import { LayoutDashboard, Users, Building2, Handshake, FileText, MessageSquare, Key, Ticket, Home, Calendar, Link2, GitBranch, Palette } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home', desc: 'Overview and quick actions', exact: true },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Analytics', desc: 'Revenue, deals, and metrics' },
  { path: '/calendar', icon: Calendar, label: 'Calendar', desc: 'Meetings and scheduled tasks' },
  { path: '/contacts', icon: Users, label: 'Contacts', desc: 'Manage people and relationships' },
  { path: '/companies', icon: Building2, label: 'Companies', desc: 'Organizations and accounts' },
  { path: '/deals', icon: Handshake, label: 'Deals', desc: 'Pipeline and opportunities' },
  { path: '/invoices', icon: FileText, label: 'Invoices', desc: 'Billing and payments' },
  { path: '/tickets', icon: Ticket, label: 'Tickets', desc: 'Support and issue tracking' },
  { path: '/conversations', icon: MessageSquare, label: 'Conversations', desc: 'Messages and email threads' },
  { path: '/integrations', icon: Link2, label: 'Integrations', desc: 'Connect external services' },
  { path: '/workflows', icon: GitBranch, label: 'Workflows', desc: 'Automate your processes' },
  { path: '/apps', icon: Key, label: 'API Tokens', desc: 'Manage API access keys' },
];

function NavItem({ item, isActive }) {
  const [hovered, setHovered] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const linkRef = useRef(null);

  useEffect(() => {
    if (hovered && linkRef.current) {
      const rect = linkRef.current.getBoundingClientRect();
      setTooltipStyle({
        position: 'fixed',
        left: rect.right + 12,
        top: rect.top + rect.height / 2,
        transform: 'translateY(-50%)',
        zIndex: 1000,
      });
    }
  }, [hovered]);

  return (
    <div style={{ position: 'relative' }}>
      <NavLink
        ref={linkRef}
        to={item.path}
        end={item.exact}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          borderRadius: '6px',
          textDecoration: 'none',
          color: isActive ? 'var(--accent)' : 'var(--sidebar-text-secondary)',
          background: isActive
            ? 'var(--accent-bg)'
            : hovered
              ? 'var(--sidebar-nav-hover-bg)'
              : 'transparent',
          transition: 'background 0.15s ease, color 0.15s ease',
        }}
      >
        <item.icon size={18} style={{ flexShrink: 0 }} />
      </NavLink>
      {hovered && (
        <div style={{
          ...tooltipStyle,
          background: 'var(--bg-card)',
          border: 'var(--card-border)',
          borderRadius: '8px',
          boxShadow: 'var(--card-shadow-hover)',
          padding: '10px 14px',
          pointerEvents: 'none',
          animation: 'fadeIn 0.12s ease',
          whiteSpace: 'nowrap',
        }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{item.label}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{item.desc}</div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const theme = useStore(s => s.theme);
  const setTheme = useStore(s => s.setTheme);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef(null);

  const themes = [
    { key: 'light', label: 'Light', color: '#5f6fff', bg: '#fafafa' },
    { key: 'dark', label: 'Dark', color: '#818cf8', bg: '#1a1a1a' },
    { key: 'midnight', label: 'Midnight', color: '#6c7bff', bg: '#000212' }
  ];

  useEffect(() => {
    const handleClick = (e) => {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (item) => {
    if (item.exact) return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside style={{
      position: 'sticky',
      top: 0,
      height: '100vh',
      width: '64px',
      flexShrink: 0,
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--sidebar-divider)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '64px',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '14px', color: '#fff',
        }}>S</div>
      </div>

      <nav style={{
        flex: 1,
        padding: '8px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        overflowY: 'auto',
        overflowX: 'hidden',
        alignItems: 'center',
      }}>
        {navItems.map(item => (
          <NavItem
            key={item.path}
            item={item}
            isActive={isActive(item)}
          />
        ))}

        <div ref={themeRef} style={{ position: 'relative', marginTop: 'auto' }}>
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '8px', borderRadius: '6px',
              border: 'none', background: themeOpen ? 'var(--sidebar-nav-hover-bg)' : 'transparent',
              color: 'var(--sidebar-text-secondary)', cursor: 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease',
              width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-nav-hover-bg)'; }}
            onMouseLeave={e => { if (!themeOpen) e.currentTarget.style.background = 'transparent'; }}
          >
            <Palette size={18} />
          </button>
          {themeOpen && (
            <div style={{
              position: 'fixed',
              left: '80px',
              bottom: '24px',
              width: '160px',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              boxShadow: 'var(--card-shadow-hover)',
              border: 'var(--card-border)',
              zIndex: 1000,
              overflow: 'hidden',
              padding: '4px',
              animation: 'fadeIn 0.12s ease',
            }}>
              {themes.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTheme(t.key); setThemeOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '10px 12px',
                    border: 'none', cursor: 'pointer',
                    background: theme === t.key ? 'var(--bg-glass)' : 'transparent',
                    fontFamily: 'inherit', fontSize: '13px',
                    color: 'var(--text-primary)', textAlign: 'left',
                    borderRadius: '6px', fontWeight: theme === t.key ? 600 : 400,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => { if (theme !== t.key) e.currentTarget.style.background = 'var(--bg-glass)'; }}
                  onMouseLeave={e => { if (theme !== t.key) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    width: '18px', height: '18px', borderRadius: '4px',
                    background: `linear-gradient(135deg, ${t.color}, ${t.bg})`,
                    flexShrink: 0,
                    border: theme === t.key ? '2px solid var(--accent)' : '1px solid var(--divider-color)',
                  }} />
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
