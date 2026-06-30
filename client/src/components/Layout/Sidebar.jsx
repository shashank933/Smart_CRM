import React from 'react';
import ReactDOM from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/store';
import logoSvg from '../../assets/logo.svg';
import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  FileText,
  MessageSquare,
  Key,
  Ticket,
  Home,
  Calendar,
  Link2,
  GitBranch,
  Brain,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home', desc: 'Workspace overview', exact: true },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Analytics', desc: 'Revenue and metrics' },
  { path: '/calendar', icon: Calendar, label: 'Calendar', desc: 'Meetings and tasks' },
  { path: '/contacts', icon: Users, label: 'Contacts', desc: 'People and relationships' },
  { path: '/companies', icon: Building2, label: 'Companies', desc: 'Organizations' },
  { path: '/deals', icon: Handshake, label: 'Deals', desc: 'Sales pipeline' },
  { path: '/invoices', icon: FileText, label: 'Invoices', desc: 'Billing and payments' },
  { path: '/tickets', icon: Ticket, label: 'Tickets', desc: 'Customer support' },
  { path: '/conversations', icon: MessageSquare, label: 'Conversations', desc: 'Inbox and threads' },
  { path: '/integrations', icon: Link2, label: 'Integrations', desc: 'Connected tools' },
  { path: '/workflows', icon: GitBranch, label: 'Workflows', desc: 'Automation builder' },
  { path: '/ai-assistant', icon: Brain, label: 'AI Assistant', desc: 'Insights and generation' },
  { path: '/apps', icon: Key, label: 'API Tokens', desc: 'External access' },
];

function TooltipPortal({ targetRef, show, children }) {
  if (!show || !targetRef.current) return null;
  const rect = targetRef.current.getBoundingClientRect();
  return ReactDOM.createPortal(
    <span className="app-nav-tooltip" style={{ position: 'fixed', top: rect.top + rect.height / 2, left: rect.right + 12, transform: 'translateY(-50%)' }}>
      {children}
    </span>,
    document.body
  );
}

function NavItem({ item, active }) {
  const Icon = item.icon;
  const linkRef = React.useRef(null);
  const [hovered, setHovered] = React.useState(false);

  return (
    <NavLink
      ref={linkRef}
      to={item.path}
      end={item.exact}
      className={`app-nav-link${active ? ' active' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="app-nav-icon">
        <Icon size={20} />
      </span>
      <span className="app-nav-text">
        <span className="app-nav-label">{item.label}</span>
        <span className="app-nav-desc">{item.desc}</span>
      </span>
      <TooltipPortal targetRef={linkRef} show={hovered}>
        <span className="app-nav-tooltip-label">{item.label}</span>
        <span className="app-nav-tooltip-desc">{item.desc}</span>
      </TooltipPortal>
    </NavLink>
  );
}

function ToggleBtn({ collapsed, onToggle }) {
  const btnRef = React.useRef(null);
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      ref={btnRef}
      className="app-sidebar-toggle"
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      <TooltipPortal targetRef={btnRef} show={hovered}>
        <span className="app-nav-tooltip-label">{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
      </TooltipPortal>
    </button>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = useStore(s => s.sidebarCollapsed);
  const toggleSidebar = useStore(s => s.toggleSidebar);

  const isActive = (item) => {
    if (item.exact) return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className={`app-sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="app-sidebar-brand">
        <div className="app-sidebar-logo">
          <img src={logoSvg} alt="SmartCRM" style={{ width: '28px', height: '28px' }} />
        </div>
        <div className="app-sidebar-brand-copy">
          <div className="app-sidebar-brand-title">SmartCRM</div>
          <div className="app-sidebar-brand-subtitle">Command workspace</div>
        </div>
      </div>

      <ToggleBtn collapsed={collapsed} onToggle={toggleSidebar} />

      <nav className="app-sidebar-nav">
        <div className="app-sidebar-section-label">Workspace</div>
        {navItems.map(item => (
          <NavItem key={item.path} item={item} active={isActive(item)} />
        ))}
      </nav>

      <div className="app-sidebar-footer">
        <div className="app-sidebar-ai" onClick={() => navigate('/ai-assistant')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') navigate('/ai-assistant'); }}>
          <div className="app-sidebar-ai-title">
            <Sparkles size={16} color="var(--accent)" />
            <span>AI co-pilot</span>
          </div>
          <div className="app-sidebar-ai-copy">
            Generate replies, analyze deals, and surface next actions from your CRM data.
          </div>
          <button className="clay-btn clay-btn-primary clay-btn-sm" onClick={() => navigate('/ai-assistant')} style={{ width: '100%', justifyContent: 'center' }}>
            Open Assistant
          </button>
        </div>
      </div>
    </aside>
  );
}