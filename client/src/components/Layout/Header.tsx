import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/store';
import { Search, Bell, LogOut, UserCircle, ChevronDown, User, Building2, Handshake, FileText, Ticket, Sparkles, BookOpen, Zap, Users, MessageSquare, LayoutDashboard, Calendar, GitBranch } from 'lucide-react';
import { api } from '../../api';

const pageTitles = {
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
  '/workflows': 'Workflows'
};

const iconBtnStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s ease, color 0.15s ease',
  flexShrink: 0,
} as React.CSSProperties;

const dropdownItemBase = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  padding: '10px 14px',
  border: 'none',
  cursor: 'pointer',
  background: 'none',
  fontFamily: 'inherit',
  fontSize: '13px',
  color: 'var(--text-primary)',
  textAlign: 'left' as const,
  transition: 'background 0.15s ease',
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

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

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useStore(s => s.user);
  const logout = useStore(s => s.logout);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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
  const title = isDetail ? 'Details' : (pageTitles[basePath] || pageTitles[location.pathname] || 'Dashboard');

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
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          const key = typeKeys[i];
          const data = r.value;
          let items: any[] = [];
          if (key === 'contact') items = data.contacts || [];
          else if (key === 'company') items = data.companies || [];
          else if (key === 'deal') items = data.deals || [];
          else if (key === 'invoice') items = data.invoices || [];
          else if (key === 'ticket') items = data.tickets || [];
          items.forEach((item: any) => allResults.push({ ...item, _type: key }));
        }
      });

      setSearchResults(allResults.slice(0, 15));
      setSearchSelected(-1);
      if (allResults.length > 0) setSearchOpen(true);
    } catch {
      // ignored
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
      setSearchOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      performSearch(val);
    }, 300);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchSelected(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchSelected(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchSelected >= 0 && searchSelected < searchResults.length) {
        const item = searchResults[searchSelected];
        navigateToResult(item);
      }
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
      inputRef.current?.blur();
    }
  };

  const navigateToResult = (item: any) => {
    const prefix = typeRoutePrefix[item._type] || '/';
    navigate(prefix + '/' + item.id);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const getResultTitle = (item: any): string => {
    switch (item._type) {
      case 'contact': return `${item.first_name || ''} ${item.last_name || ''}`.trim();
      case 'company': return item.name || '';
      case 'deal': return item.name || '';
      case 'invoice': return item.invoice_number || '';
      case 'ticket': return item.subject || '';
      default: return '';
    }
  };

  const getResultSubtitle = (item: any): string => {
    switch (item._type) {
      case 'contact': return item.email || '';
      case 'company': return item.industry || '';
      case 'deal': return `${(item.stage || '').replace(/_/g, ' ')} · ${formatCurrency(item.value || 0)}`;
      case 'invoice': return `${item.status || ''} · ${formatCurrency(item.total || 0)}`;
      case 'ticket': return `${item.status || ''} · ${item.priority || ''}`;
      default: return '';
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
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
    const t = item._type || 'other';
    if (!groups[t]) groups[t] = [];
    groups[t].push(item);
    return groups;
  }, {});

  let resultIndex = 0;

  return (
    <header style={{
      height: 'var(--header-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      background: 'var(--header-bg)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--header-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div>
        <h1 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
          {title}
        </h1>
        {isDetail && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
            {location.pathname}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          ref={searchRef}
          style={{ position: 'relative' }}
          onMouseEnter={() => { if (searchQuery.length === 0) setSearchOpen(true); }}
          onMouseLeave={() => { if (searchQuery.length === 0) setSearchOpen(false); }}
        >
          <Search size={14} style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
            zIndex: 1,
          }} />
          <input
            ref={inputRef}
            placeholder="Search contacts, deals, tickets..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-bg)';
              setSearchOpen(true);
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.boxShadow = '';
            }}
            style={{
              width: '240px',
              padding: '8px 12px 8px 32px',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: 'var(--text-primary)',
              background: 'var(--bg-card)',
              border: 'var(--card-border)',
              borderRadius: '6px',
              outline: 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
          />
          {searchOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              width: '400px',
              background: 'var(--bg-card)',
              border: 'var(--card-border)',
              borderRadius: '10px',
              boxShadow: 'var(--card-shadow-hover)',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'slideUp 0.15s ease',
              maxHeight: '400px',
              overflowY: 'auto',
            }}>
              {searchLoading ? (
                <div style={{
                  padding: '20px 16px',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid var(--divider-color)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    display: 'inline-block',
                  }} />
                  Searching...
                </div>
              ) : searchQuery.length === 0 ? (
                <div>
                  <div style={{ padding: '8px 14px 4px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quick navigation
                  </div>
                  {[
                    { label: 'Dashboard', desc: 'Revenue, deals, and analytics', route: '/dashboard', icon: LayoutDashboard },
                    { label: 'Contacts', desc: 'Manage your contacts', route: '/contacts', icon: Users },
                    { label: 'Companies', desc: 'Organizations and accounts', route: '/companies', icon: Building2 },
                    { label: 'Deals', desc: 'Pipeline and opportunities', route: '/deals', icon: Handshake },
                    { label: 'Invoices', desc: 'Billing and payments', route: '/invoices', icon: FileText },
                    { label: 'Tickets', desc: 'Support and issues', route: '/tickets', icon: Ticket },
                    { label: 'Calendar', desc: 'Meetings and tasks', route: '/calendar', icon: Calendar },
                    { label: 'Integrations', desc: 'Connect external services', route: '/integrations', icon: null },
                    { label: 'Workflows', desc: 'Automate your processes', route: '/workflows', icon: GitBranch },
                    { label: 'Conversations', desc: 'Messages and email threads', route: '/conversations', icon: MessageSquare },
                  ].map(item => (
                    <button
                      key={item.route}
                      onClick={() => {
                        navigate(item.route);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        width: '100%', padding: '9px 14px',
                        border: 'none', cursor: 'pointer',
                        background: 'transparent',
                        fontFamily: 'inherit', fontSize: '13px',
                        color: 'var(--text-primary)', textAlign: 'left',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-glass)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {item.icon && <item.icon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{
                  padding: '20px 16px',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  textAlign: 'center',
                }}>
                  No results found for &apos;{searchQuery}&apos;
                </div>
              ) : (
                Object.keys(groupedResults).map(typeKey => {
                  const IconComponent = typeIcons[typeKey];
                  const label = typeLabels[typeKey] || typeKey;
                  const items = groupedResults[typeKey];
                  return (
                    <div key={typeKey}>
                      <div style={{
                        padding: '8px 14px 4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        {IconComponent && <IconComponent size={12} />}
                        {label}
                      </div>
                      {items.map((item: any) => {
                        const idx = resultIndex++;
                        const isSelected = idx === searchSelected;
                        return (
                          <button
                            key={item.id}
                            onClick={() => navigateToResult(item)}
                            onMouseEnter={() => setSearchSelected(idx)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              width: '100%',
                              padding: '9px 14px',
                              border: 'none',
                              cursor: 'pointer',
                              background: isSelected ? 'var(--bg-glass)' : 'transparent',
                              fontFamily: 'inherit',
                              fontSize: '13px',
                              color: 'var(--text-primary)',
                              textAlign: 'left' as const,
                            }}>
                            {IconComponent && (
                              <IconComponent size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {getResultTitle(item)}
                              </div>
                              <div style={{
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                marginTop: '2px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {getResultSubtitle(item)}
                              </div>
                            </div>
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

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            style={{
              ...iconBtnStyle,
              position: 'relative',
              background: notifOpen ? 'var(--bg-glass)' : 'transparent',
            }}
            onClick={() => setNotifOpen(!notifOpen)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-glass)'; }}
            onMouseLeave={e => { if (!notifOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <Bell size={16} />
            <span style={{
              position: 'absolute', top: '6px', right: '6px',
              width: '8px', height: '8px', borderRadius: '50%',
              background: 'var(--accent)',
            }} />
          </button>
          {notifOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              width: '360px',
              background: 'var(--bg-card)',
              borderRadius: '10px',
              boxShadow: 'var(--card-shadow-hover)',
              border: 'var(--card-border)',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'slideUp 0.15s ease',
              maxHeight: '420px',
              overflowY: 'auto',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>Notifications</span>
                <span className="clay-badge clay-badge-accent" style={{ fontSize: '10px' }}>3 new</span>
              </div>
              <div style={{ padding: '4px 0' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider-color)', display: 'flex', gap: '12px', cursor: 'pointer' }}
                  onClick={() => { setNotifOpen(false); navigate('/guide'); }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={16} color="var(--accent)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Welcome to SmartCRM</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>Complete the onboarding guide to get started with your CRM.</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Just now</div>
                  </div>
                </div>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider-color)', display: 'flex', gap: '12px', cursor: 'pointer' }}
                  onClick={() => { setNotifOpen(false); navigate('/contacts'); }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Users size={16} color="var(--accent)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Import your contacts</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>Connect Gmail to auto-import contacts or add them manually.</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>1 hour ago</div>
                  </div>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', gap: '12px', cursor: 'pointer' }}
                  onClick={() => { setNotifOpen(false); navigate('/integrations'); }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Zap size={16} color="#34d399" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Set up integrations</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>Connect Gmail, WhatsApp or HubSpot to supercharge your workflow.</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>2 hours ago</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px 4px 4px',
              borderRadius: '8px',
              border: 'var(--card-border)',
              background: dropdownOpen ? 'var(--bg-glass)' : 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { if (!dropdownOpen) (e.currentTarget as HTMLElement).style.background = 'var(--bg-glass)'; }}
            onMouseLeave={e => { if (!dropdownOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <span style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: '#fff',
              flexShrink: 0,
            }}>
              {userInitials}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              {firstName}
            </span>
            <ChevronDown size={14} color="var(--text-muted)" style={{
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              width: '240px',
              background: 'var(--bg-card)',
              borderRadius: '10px',
              boxShadow: 'var(--card-shadow-hover)',
              border: 'var(--card-border)',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'slideUp 0.15s ease',
            }}>
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--divider-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <span style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#fff',
                  flexShrink: 0,
                }}>
                  {userInitials}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email || ''}</div>
                </div>
              </div>
              <div style={{ padding: '4px 0' }}>
                <button
                  style={dropdownItemBase}
                  onClick={handleProfile}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-glass)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <UserCircle size={15} /> My Profile
                </button>
                <button
                  style={dropdownItemBase}
                  onClick={() => { setDropdownOpen(false); navigate('/guide'); }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-glass)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <BookOpen size={15} /> Getting Started
                </button>
                <button
                  style={dropdownItemBase}
                  onClick={handleLogout}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-glass)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
