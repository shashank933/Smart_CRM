import { useState, useRef, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/store';
import {
  Search,
  Bell,
  LogOut,
  UserCircle,
  ChevronDown,
  User,
  Building2,
  Handshake,
  FileText,
  Ticket,
  BookOpen,
  Zap,
  Users,
  MessageSquare,
  LayoutDashboard,
  Calendar,
  GitBranch,
  Link2,
  Sparkles,
  X,
  Sun,
  Moon,
  Menu,
  Home,
  Brain,
  Key,
} from 'lucide-react';
import { api } from '../../api';

const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Analytics',
  '/calendar': 'Calendar',
  '/contacts': 'Contacts',
  '/companies': 'Companies',
  '/deals': 'Deals',
  '/invoices': 'Invoices',
  '/conversations': 'Conversations',
  '/ai-assistant': 'AI Assistant',
  '/apps': 'API Tokens',
  '/tickets': 'Tickets',
  '/workflows': 'Workflows',
  '/integrations': 'Integrations',
  '/guide': 'Getting Started',
  '/profile': 'Profile',
};

const typeIcons: Record<string, any> = {
  contact: User,
  company: Building2,
  deal: Handshake,
  invoice: FileText,
  ticket: Ticket,
};

const typeLabels: Record<string, string> = {
  contact: 'Contacts',
  company: 'Companies',
  deal: 'Deals',
  invoice: 'Invoices',
  ticket: 'Tickets',
};

const typeRoutePrefix: Record<string, string> = {
  contact: '/contacts',
  company: '/companies',
  deal: '/deals',
  invoice: '/invoices',
  ticket: '/tickets',
};

const quickLinks = [
  { label: 'Analytics', desc: 'Revenue, deals, and metrics', route: '/dashboard', icon: LayoutDashboard },
  { label: 'Contacts', desc: 'Manage people and relationships', route: '/contacts', icon: Users },
  { label: 'Companies', desc: 'Organizations and accounts', route: '/companies', icon: Building2 },
  { label: 'Deals', desc: 'Pipeline and opportunities', route: '/deals', icon: Handshake },
  { label: 'Invoices', desc: 'Billing and payments', route: '/invoices', icon: FileText },
  { label: 'Tickets', desc: 'Support and issues', route: '/tickets', icon: Ticket },
  { label: 'Calendar', desc: 'Meetings and tasks', route: '/calendar', icon: Calendar },
  { label: 'Integrations', desc: 'Connect external services', route: '/integrations', icon: Link2 },
  { label: 'Workflows', desc: 'Automate processes', route: '/workflows', icon: GitBranch },
  { label: 'Conversations', desc: 'Messages and email threads', route: '/conversations', icon: MessageSquare },
];

const mobileNavItems = [
  { path: '/', icon: Home, label: 'Home', exact: true },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Analytics' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/contacts', icon: Users, label: 'Contacts' },
  { path: '/companies', icon: Building2, label: 'Companies' },
  { path: '/deals', icon: Handshake, label: 'Deals' },
  { path: '/invoices', icon: FileText, label: 'Invoices' },
  { path: '/tickets', icon: Ticket, label: 'Tickets' },
  { path: '/conversations', icon: MessageSquare, label: 'Conversations' },
  { path: '/integrations', icon: Link2, label: 'Integrations' },
  { path: '/workflows', icon: GitBranch, label: 'Workflows' },
  { path: '/ai-assistant', icon: Brain, label: 'AI Assistant' },
  { path: '/apps', icon: Key, label: 'API Tokens' },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n || 0);
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useStore(s => s.user);
  const logout = useStore(s => s.logout);
  const theme = useStore(s => s.theme);
  const setTheme = useStore(s => s.setTheme);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSelected, setSearchSelected] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);

  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const isDetail = location.pathname.split('/').length > 2;
  const title = isDetail ? 'Record details' : (pageTitles[basePath] || pageTitles[location.pathname] || 'Workspace');

  const userInitials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';
  const firstName = user?.name?.split(' ')[0] || 'User';

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await Promise.allSettled([
        api.getContacts({ search: query, limit: 5 }),
        api.request('/companies?search=' + encodeURIComponent(query) + '&limit=5'),
        api.request('/deals?search=' + encodeURIComponent(query) + '&limit=5'),
        api.request('/invoices?search=' + encodeURIComponent(query) + '&limit=5'),
        api.request('/tickets?search=' + encodeURIComponent(query) + '&limit=5'),
      ]);

      const allResults: any[] = [];
      const typeKeys = ['contact', 'company', 'deal', 'invoice', 'ticket'];

      results.forEach((result, index) => {
        if (result.status !== 'fulfilled' || !result.value) return;

        const key = typeKeys[index];
        const data = result.value;
        let items: any[] = [];

        if (key === 'contact') items = data.contacts || [];
        if (key === 'company') items = data.companies || [];
        if (key === 'deal') items = data.deals || [];
        if (key === 'invoice') items = data.invoices || [];
        if (key === 'ticket') items = data.tickets || [];

        items.forEach(item => allResults.push({ ...item, _type: key }));
      });

      setSearchResults(allResults.slice(0, 15));
      setSearchSelected(-1);
      setSearchOpen(true);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 2) {
      setSearchResults([]);
      setSearchOpen(true);
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      performSearch(val);
    }, 260);
  };

  const navigateToResult = (item: any) => {
    const prefix = typeRoutePrefix[item._type] || '/';
    navigate(prefix + '/' + item.id);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchSelected(prev => Math.min(prev + 1, searchResults.length - 1));
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchSelected(prev => Math.max(prev - 1, -1));
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchSelected >= 0 && searchSelected < searchResults.length) {
        navigateToResult(searchResults[searchSelected]);
      }
    }

    if (e.key === 'Escape') {
      setSearchOpen(false);
      inputRef.current?.blur();
    }
  };

  const getResultTitle = (item: any): string => {
    if (item._type === 'contact') return `${item.first_name || ''} ${item.last_name || ''}`.trim();
    if (item._type === 'company') return item.name || '';
    if (item._type === 'deal') return item.name || '';
    if (item._type === 'invoice') return item.invoice_number || '';
    if (item._type === 'ticket') return item.subject || '';
    return '';
  };

  const getResultSubtitle = (item: any): string => {
    if (item._type === 'contact') return item.email || item.company_name || '';
    if (item._type === 'company') return item.industry || '';
    if (item._type === 'deal') return `${(item.stage || '').replace(/_/g, ' ')} · ${formatCurrency(item.value || 0)}`;
    if (item._type === 'invoice') return `${item.status || ''} · ${formatCurrency(item.total || 0)}`;
    if (item._type === 'ticket') return `${item.status || ''} · ${item.priority || ''}`;
    return '';
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target as Node)) {
        setMobileNavOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  const handleProfile = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  const groupedResults = searchResults.reduce((groups: Record<string, any[]>, item) => {
    const type = item._type || 'other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(item);
    return groups;
  }, {});

  let resultIndex = 0;

  const mobileIsActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="app-header">
      {mobileNavOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div ref={mobileNavRef} className="mobile-nav-wrapper">
          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileNavOpen(prev => !prev)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {mobileNavOpen && (
            <div className="mobile-nav-dropdown" onClick={e => e.stopPropagation()}>
              <div className="mobile-nav-header">
                <span style={{ fontWeight: 800, fontSize: '14px' }}>Navigation</span>
                <button
                  className="clay-btn clay-btn-sm clay-btn-ghost"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="mobile-nav-items">
                {mobileNavItems.map(item => {
                  const Icon = item.icon;
                  const active = mobileIsActive(item.path, item.exact);
                  return (
                    <button
                      key={item.path}
                      className={`mobile-nav-item${active ? ' active' : ''}`}
                      onClick={() => {
                        navigate(item.path);
                        setMobileNavOpen(false);
                      }}
                    >
                      <span className="mobile-nav-item-icon">
                        <Icon size={20} />
                      </span>
                      <span className="mobile-nav-item-label">{item.label}</span>
                      {active && <span className="mobile-nav-active-dot" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="app-header-kicker">SmartCRM</div>
          <h1 className="app-header-title">{title}</h1>
          {isDetail && <div className="app-header-path">{location.pathname}</div>}
        </div>
      </div>

      <div className="app-header-search" ref={searchRef}>
        <Search className="app-search-icon" size={17} />
        <input
          ref={inputRef}
          className="app-search-input"
          placeholder="Command search: contacts, deals, tickets..."
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          onFocus={() => setSearchOpen(true)}
        />

        {searchOpen && (
          <div className="app-search-panel">
            {searchLoading ? (
              <div style={{ padding: '18px 14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 800 }}>
                <span style={{ width: '16px', height: '16px', border: '2px solid var(--divider-color)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Searching CRM...
              </div>
            ) : searchQuery.length === 0 ? (
              <div>
                <div className="app-search-group-title">
                  <Sparkles size={12} />
                  Quick navigation
                </div>
                {quickLinks.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.route}
                      className="app-search-quick"
                      onClick={() => {
                        navigate(item.route);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <span className="app-search-quick-icon">
                        <Icon size={17} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span className="app-search-result-title">{item.label}</span>
                        <span className="app-search-result-subtitle">{item.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 750 }}>
                No results for “{searchQuery}”
              </div>
            ) : (
              Object.keys(groupedResults).map(typeKey => {
                const Icon = typeIcons[typeKey] || Search;
                const items = groupedResults[typeKey];

                return (
                  <div key={typeKey}>
                    <div className="app-search-group-title">
                      <Icon size={12} />
                      {typeLabels[typeKey] || typeKey}
                    </div>
                    {items.map((item: any) => {
                      const idx = resultIndex++;
                      const isSelected = idx === searchSelected;

                      return (
                        <button
                          key={item.id}
                          className={`app-search-result${isSelected ? ' selected' : ''}`}
                          onClick={() => navigateToResult(item)}
                          onMouseEnter={() => setSearchSelected(idx)}
                        >
                          <span className="app-search-result-icon">
                            <Icon size={17} />
                          </span>
                          <span style={{ minWidth: 0 }}>
                            <span className="app-search-result-title">{getResultTitle(item)}</span>
                            <span className="app-search-result-subtitle">{getResultSubtitle(item)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="app-header-actions">
        <div style={{ display: 'flex', gap: '4px', marginRight: '8px' }}>
          <button
            className={`app-theme-button${theme === 'light' ? ' active' : ''}`}
            onClick={() => setTheme('light')}
            style={{ width: '34px', height: '34px' }}
          >
            <Sun size={14} />
          </button>
          <button
            className={`app-theme-button${theme === 'dark' ? ' active' : ''}`}
            onClick={() => setTheme('dark')}
            style={{ width: '34px', height: '34px' }}
          >
            <Moon size={14} />
          </button>
        </div>

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="app-icon-button" onClick={() => setNotifOpen(prev => !prev)}>
            <Bell size={17} />
            <span className="app-notification-dot" />
          </button>

          {notifOpen && (
            <>
              <div className="app-notification-overlay" onClick={() => setNotifOpen(false)} />
              <div className="app-dropdown app-notification-panel">
                <div className="app-dropdown-header" style={{ justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '14px', fontWeight: 950 }}>Notifications</div>
                  <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={() => setNotifOpen(false)}>
                    <X size={16} />
                  </button>
                </div>

              <div className="app-notification-item" onClick={() => { setNotifOpen(false); navigate('/guide'); }}>
                <span className="app-search-result-icon">
                  <BookOpen size={17} />
                </span>
                <span>
                  <div style={{ fontSize: '13px', fontWeight: 900 }}>Finish onboarding</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '3px' }}>Complete the setup guide to unlock your CRM workflow.</div>
                </span>
              </div>

              <div className="app-notification-item" onClick={() => { setNotifOpen(false); navigate('/contacts'); }}>
                <span className="app-search-result-icon">
                  <Users size={17} />
                </span>
                <span>
                  <div style={{ fontSize: '13px', fontWeight: 900 }}>Import contacts</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '3px' }}>Connect Gmail or add contacts manually.</div>
                </span>
              </div>

              <div className="app-notification-item" onClick={() => { setNotifOpen(false); navigate('/integrations'); }}>
                <span className="app-search-result-icon">
                  <Zap size={17} />
                </span>
                <span>
                  <div style={{ fontSize: '13px', fontWeight: 900 }}>Connect integrations</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '3px' }}>Sync Gmail, WhatsApp, and HubSpot data.</div>
                </span>
              </div>
            </div>
          </>
          )}
        </div>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button className="app-user-button" onClick={() => setDropdownOpen(prev => !prev)}>
            <span className="app-user-avatar">{userInitials}</span>
            <span style={{ fontSize: '13px', fontWeight: 900 }}>{firstName}</span>
            <ChevronDown size={15} color="var(--text-muted)" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease' }} />
          </button>

          {dropdownOpen && (
            <div className="app-dropdown">
              <div className="app-dropdown-header">
                <span className="app-user-avatar">{userInitials}</span>
                <span style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 950 }}>{user?.name || 'User'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</div>
                </span>
              </div>

              <button className="app-dropdown-item" onClick={handleProfile}>
                <UserCircle size={16} />
                My Profile
              </button>
              <button className="app-dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/guide'); }}>
                <BookOpen size={16} />
                Getting Started
              </button>
              <button className="app-dropdown-item" onClick={handleLogout}>
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}