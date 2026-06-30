import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { Brain, Send, Sparkles, TrendingUp, Mail, FileText, MessageSquare, Zap, BarChart3, User, RefreshCw, Copy, ThumbsUp, Building2 } from 'lucide-react';

const TABS = [
  { key: 'chat', label: 'Chat', icon: MessageSquare },
  { key: 'scoring', label: 'Deal Scoring', icon: TrendingUp },
  { key: 'email', label: 'Email Generator', icon: Mail },
  { key: 'insights', label: 'Insights', icon: Brain },
];

const CONTEXT_TYPES = [
  { key: 'contact', label: 'Contact', icon: User },
  { key: 'company', label: 'Company', icon: Building2 },
  { key: 'deal', label: 'Deal', icon: TrendingUp },
];

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="clay-empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--clay-shadow)', border: '1px solid rgba(255,255,255,0.6)' }}>
      <Icon size={40} style={{ opacity: 0.4, color: 'var(--text-muted)', marginBottom: '12px' }} />
      <h3 style={{ marginBottom: '6px' }}>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function LoadingState({ message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <RefreshCw size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{message || 'Loading...'}</p>
    </div>
  );
}

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('chat');

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [contextType, setContextType] = useState(null);
  const [contextEntity, setContextEntity] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [deals, setDeals] = useState([]);
  const chatEndRef = useRef(null);

  const [scoringData, setScoringData] = useState(null);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [scoringError, setScoringError] = useState(null);

  const [emailForm, setEmailForm] = useState({ contact_id: '', deal_id: '', purpose: '' });
  const [emailResult, setEmailResult] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [emailCopied, setEmailCopied] = useState(false);

  const [insightType, setInsightType] = useState('contact');
  const [insightEntityId, setInsightEntityId] = useState('');
  const [insightResult, setInsightResult] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState(null);
  const [previousInsights, setPreviousInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (insightType && insightEntityId) {
      loadPreviousInsights();
    }
  }, [insightType, insightEntityId]);

  async function loadReferenceData() {
    try {
      const [contactsRes, companiesRes, dealsRes] = await Promise.all([
        api.getContacts(),
        api.getCompanies(),
        api.getDeals(),
      ]);
      setContacts(Array.isArray(contactsRes) ? contactsRes : contactsRes.contacts || contactsRes.data || []);
      setCompanies(Array.isArray(companiesRes) ? companiesRes : companiesRes.companies || companiesRes.data || []);
      setDeals(Array.isArray(dealsRes) ? dealsRes : dealsRes.data || []);
    } catch (err) {
      // reference data load failure is non-blocking
    }
  }

  async function loadPreviousInsights() {
    setInsightsLoading(true);
    try {
      const res = await api.getInsights(insightType, insightEntityId);
      setPreviousInsights(Array.isArray(res) ? res : res.insights || res.data || []);
    } catch {
      setPreviousInsights([]);
    } finally {
      setInsightsLoading(false);
    }
  }

  function getContextLabel() {
    if (!contextType || !contextEntity) return null;
    if (contextType === 'contact') {
      const c = contacts.find(x => x.id === contextEntity);
      return c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() || `Contact #${contextEntity}` : `Contact #${contextEntity}`;
    }
    if (contextType === 'company') {
      const c = companies.find(x => x.id === contextEntity);
      return c ? c.name : `Company #${contextEntity}`;
    }
    if (contextType === 'deal') {
      const d = deals.find(x => x.id === contextEntity);
      return d ? d.name : `Deal #${contextEntity}`;
    }
    return null;
  }

  async function handleChatSubmit(e) {
    e?.preventDefault();
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatError(null);
    setChatLoading(true);

    try {
      const payload = { message: text };
      if (contextType && contextEntity) {
        payload.context = { type: contextType, id: contextEntity };
      }
      const res = await api.aiChat(payload);
      const reply = res.reply || res.message || res.response || JSON.stringify(res);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setChatError(err.message);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', isError: true }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleScoring() {
    setScoringLoading(true);
    setScoringError(null);
    setScoringData(null);
    try {
      const res = await api.predictiveScoring();
      const data = Array.isArray(res) ? res : res.deals || res.data || res.scoring || [];
      setScoringData(data);
    } catch (err) {
      setScoringError(err.message);
    } finally {
      setScoringLoading(false);
    }
  }

  async function handleEmailGenerate(e) {
    e?.preventDefault();
    if (!emailForm.contact_id || !emailForm.purpose.trim()) {
      setEmailError('Contact and purpose are required.');
      return;
    }
    setEmailLoading(true);
    setEmailError(null);
    setEmailResult(null);
    try {
      const payload = {
        contact_id: Number(emailForm.contact_id),
        purpose: emailForm.purpose.trim(),
      };
      if (emailForm.deal_id) {
        payload.deal_id = Number(emailForm.deal_id);
      }
      const res = await api.generateEmail(payload);
      const result = {
        subject: res.subject || 'No Subject',
        body: res.body || res.email || res.content || JSON.stringify(res),
      };
      setEmailResult(result);
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailLoading(false);
    }
  }

  function handleEmailCopy() {
    if (!emailResult) return;
    const text = `Subject: ${emailResult.subject}\n\n${emailResult.body}`;
    navigator.clipboard.writeText(text).then(() => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    });
  }

  async function handleInsightsGenerate() {
    if (!insightEntityId) {
      setInsightError('Please select an entity.');
      return;
    }
    setInsightLoading(true);
    setInsightError(null);
    setInsightResult(null);
    try {
      const res = insightType === 'contact'
        ? await api.contactInsight(Number(insightEntityId))
        : await api.dealInsight(Number(insightEntityId));
      setInsightResult(res.insight || res.analysis || res.summary || JSON.stringify(res));
    } catch (err) {
      setInsightError(err.message);
    } finally {
      setInsightLoading(false);
    }
    loadPreviousInsights();
  }

  function getScoreColor(score) {
    if (score >= 70) return 'var(--success)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--danger)';
  }

  function getScoreBadge(score) {
    if (score >= 70) return 'clay-badge-success';
    if (score >= 40) return 'clay-badge-warning';
    return 'clay-badge-danger';
  }

  const contextLabel = getContextLabel();
  const contextEntities = contextType === 'contact' ? contacts : contextType === 'company' ? companies : deals;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--clay-shadow-sm)' }}>
            <Sparkles size={22} color="#fff" />
          </div>
          AI Assistant
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Get insights, score deals, generate emails, and chat with context-aware AI</p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div className="clay-tabs" style={{ display: 'inline-flex' }}>
          {TABS.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                className={`clay-tab${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <TabIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Chat */}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 260px)', minHeight: '500px' }}>
          <div className="clay-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} style={{ color: 'var(--accent)' }} />
              <span style={{ fontWeight: 600, fontSize: '15px' }}>AI Chat</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <MessageSquare size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
                  <h3 style={{ marginBottom: '6px', color: 'var(--text-secondary)' }}>Start a conversation</h3>
                  <p style={{ fontSize: '13px' }}>Ask the AI about deals, contacts, or anything CRM-related.</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: '14px',
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', flexShrink: 0, boxShadow: 'var(--clay-shadow-sm)' }}>
                        <Brain size={16} color="#fff" />
                      </div>
                    )}
                    <div
                      className={msg.role === 'user' ? 'clay-card-sm' : 'clay-card-sm'}
                      style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius)',
                        background: msg.role === 'user'
                          ? 'var(--accent-gradient)'
                          : msg.isError
                            ? 'rgba(113,113,122,0.15)'
                            : 'var(--bg-card)',
                        color: msg.role === 'user' ? '#fff' : msg.isError ? 'var(--danger)' : 'var(--text-primary)',
                        boxShadow: msg.role === 'user'
                          ? '4px 4px 12px rgba(99,102,241,0.3), -4px -4px 12px rgba(255,255,255,0.3)'
                          : 'var(--clay-shadow-sm)',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '10px', flexShrink: 0, boxShadow: 'var(--clay-shadow-sm)' }}>
                        <User size={16} style={{ color: 'var(--accent)' }} />
                      </div>
                    )}
                  </div>
                ))
              )}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', flexShrink: 0, boxShadow: 'var(--clay-shadow-sm)' }}>
                    <Brain size={16} color="#fff" />
                  </div>
                  <div className="clay-card-sm" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={14} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {chatError && (
              <div style={{ margin: '0 20px', background: 'rgba(113,113,122,0.15)', color: 'var(--danger)', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 500 }}>
                {chatError}
              </div>
            )}

            {(contextType || contextLabel) && (
              <div style={{ padding: '0 20px 8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {contextType && (
                  <span className="clay-tag" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', fontSize: '12px' }}>
                    {contextType === 'contact' ? <User size={12} /> : contextType === 'company' ? <Building2 size={12} /> : <TrendingUp size={12} />}
                    {contextLabel || `${contextType} context`}
                    <button
                      onClick={() => { setContextType(null); setContextEntity(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: 'var(--text-muted)', lineHeight: 1, fontSize: '14px' }}
                    >&times;</button>
                  </span>
                )}
              </div>
            )}

            <form onSubmit={handleChatSubmit} style={{ padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: '8px' }}>
              <input
                className="clay-input"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type your message..."
                style={{ flex: 1 }}
                disabled={chatLoading}
              />
              <button type="submit" className="clay-btn clay-btn-primary" disabled={chatLoading || !chatInput.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>

          <div className="clay-card" style={{ width: '250px', padding: '20px', flexShrink: 0 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} style={{ color: 'var(--accent)' }} />
              Add Context
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Provide context about a contact, company, or deal to help the AI give more relevant responses.</p>

            <div style={{ marginBottom: '14px' }}>
              <label className="clay-form-label">Context Type</label>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                {CONTEXT_TYPES.map(ct => {
                  const CTIcon = ct.icon;
                  return (
                    <button
                      key={ct.key}
                      className={`clay-btn clay-btn-sm${contextType === ct.key ? ' clay-btn-primary' : ''}`}
                      onClick={() => { setContextType(prev => prev === ct.key ? null : ct.key); setContextEntity(null); }}
                      style={{ flex: 1, padding: '6px 8px', fontSize: '11px' }}
                    >
                      <CTIcon size={12} />
                      {ct.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {contextType && (
              <div className="clay-form-group">
                <label className="clay-form-label">Select {contextType === 'contact' ? 'Contact' : contextType === 'company' ? 'Company' : 'Deal'}</label>
                <select
                  className="clay-input"
                  value={contextEntity || ''}
                  onChange={e => setContextEntity(e.target.value ? Number(e.target.value) : null)}
                  style={{ appearance: 'none', cursor: 'pointer', fontSize: '13px' }}
                >
                  <option value="">Select...</option>
                  {contextEntities.map(item => (
                    <option key={item.id} value={item.id}>
                      {contextType === 'contact'
                        ? `${item.first_name || ''} ${item.last_name || ''}`.trim()
                        : item.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {contextType && contextEntity && (
              <button className="clay-btn clay-btn-sm" onClick={() => { setContextType(null); setContextEntity(null); }} style={{ width: '100%', justifyContent: 'center' }}>
                Clear Context
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Deal Scoring */}
      {activeTab === 'scoring' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <button className="clay-btn clay-btn-primary" onClick={handleScoring} disabled={scoringLoading}>
              <RefreshCw size={16} style={{ animation: scoringLoading ? 'spin 1s linear infinite' : 'none' }} />
              {scoringLoading ? 'Analyzing...' : 'Analyze Pipeline'}
            </button>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>AI-powered deal scoring ranks all open deals by likelihood to close</p>
          </div>

          {scoringError && (
            <div style={{ background: 'rgba(113,113,122,0.15)', color: 'var(--danger)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
              {scoringError}
            </div>
          )}

          {scoringLoading && <LoadingState message="Analyzing pipeline and scoring deals..." />}

          {!scoringLoading && !scoringData && !scoringError && (
            <EmptyState icon={TrendingUp} title="Deal Scoring" description="Click 'Analyze Pipeline' to score your open deals with AI-powered predictions." />
          )}

          {scoringData && !scoringLoading && scoringData.length === 0 && (
            <EmptyState icon={BarChart3} title="No deals to score" description="Add deals to your pipeline first to get AI scoring predictions." />
          )}

          {scoringData && scoringData.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {scoringData.map((deal, i) => {
                const score = Number(deal.score ?? deal.confidence ?? deal.probability ?? 0);
                const dealName = deal.name || deal.deal_name || `Deal #${deal.id || i + 1}`;
                const reason = deal.reasoning || deal.reason || deal.analysis || '';
                return (
                  <div key={deal.id || i} className="clay-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {dealName}
                        </h3>
                        {deal.company_name && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{deal.company_name}</span>
                        )}
                      </div>
                      <div className={getScoreBadge(score)} style={{ fontSize: '14px', padding: '6px 14px', flexShrink: 0, marginLeft: '12px' }}>
                        {score}/100
                      </div>
                    </div>
                    <div className="clay-progress" style={{ marginBottom: '12px' }}>
                      <div
                        className="clay-progress-bar"
                        style={{ width: `${score}%`, background: getScoreColor(score) }}
                      />
                    </div>
                    {reason && (
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Email Generator */}
      {activeTab === 'email' && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div className="clay-card" style={{ flex: '1 1 400px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} style={{ color: 'var(--accent)' }} />
              Generate Professional Email
            </h3>

            {emailError && (
              <div style={{ background: 'rgba(113,113,122,0.15)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px' }}>
                {emailError}
              </div>
            )}

            <form onSubmit={handleEmailGenerate}>
              <div className="clay-form-group">
                <label className="clay-form-label">Contact *</label>
                <select
                  className="clay-input"
                  value={emailForm.contact_id}
                  onChange={e => { setEmailForm(prev => ({ ...prev, contact_id: e.target.value })); setEmailError(null); }}
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="">Select Contact</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}{c.company_name ? ` - ${c.company_name}` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="clay-form-group">
                <label className="clay-form-label">Deal Context (optional)</label>
                <select
                  className="clay-input"
                  value={emailForm.deal_id}
                  onChange={e => { setEmailForm(prev => ({ ...prev, deal_id: e.target.value })); setEmailError(null); }}
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="">No deal context</option>
                  {deals.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="clay-form-group">
                <label className="clay-form-label">Purpose *</label>
                <textarea
                  className="clay-input"
                  value={emailForm.purpose}
                  onChange={e => { setEmailForm(prev => ({ ...prev, purpose: e.target.value })); setEmailError(null); }}
                  rows={4}
                  style={{ resize: 'vertical' }}
                  placeholder="e.g. Follow up on the recent proposal, introduce our new pricing plans, thank them for the meeting..."
                />
              </div>

              <button
                type="submit"
                className="clay-btn clay-btn-primary"
                disabled={emailLoading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Sparkles size={16} />
                {emailLoading ? 'Generating...' : 'Generate Email'}
              </button>
            </form>
          </div>

          <div style={{ flex: '1 1 400px' }}>
            {!emailResult && !emailLoading && (
              <EmptyState icon={FileText} title="Generated Email" description="Fill out the form and click Generate to create a professional email draft." />
            )}

            {emailLoading && <LoadingState message="Generating email..." />}

            {emailResult && (
              <div className="clay-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} style={{ color: 'var(--accent)' }} />
                    Your Email
                  </h3>
                  <button className="clay-btn clay-btn-sm" onClick={handleEmailCopy}>
                    {emailCopied ? <><ThumbsUp size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>

                <div className="clay-card-sm" style={{ padding: '14px 16px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Subject</span>
                  <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>{emailResult.subject}</p>
                </div>

                <div className="clay-card-sm" style={{ padding: '18px 20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Body</span>
                  <p style={{ fontSize: '14px', lineHeight: 1.8, marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {emailResult.body}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Insights */}
      {activeTab === 'insights' && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 380px' }}>
            <div className="clay-card" style={{ padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={18} style={{ color: 'var(--accent)' }} />
                Generate Insights
              </h3>

              {insightError && (
                <div style={{ background: 'rgba(113,113,122,0.15)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px' }}>
                  {insightError}
                </div>
              )}

              <div className="clay-form-group">
                <label className="clay-form-label">Entity Type</label>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                  <button
                    className={`clay-btn clay-btn-sm${insightType === 'contact' ? ' clay-btn-primary' : ''}`}
                    onClick={() => { setInsightType('contact'); setInsightEntityId(''); setInsightResult(null); setPreviousInsights([]); }}
                    style={{ flex: 1 }}
                  >
                    <User size={14} /> Contact
                  </button>
                  <button
                    className={`clay-btn clay-btn-sm${insightType === 'deal' ? ' clay-btn-primary' : ''}`}
                    onClick={() => { setInsightType('deal'); setInsightEntityId(''); setInsightResult(null); setPreviousInsights([]); }}
                    style={{ flex: 1 }}
                  >
                    <TrendingUp size={14} /> Deal
                  </button>
                </div>
              </div>

              <div className="clay-form-group">
                <label className="clay-form-label">Select {insightType === 'contact' ? 'Contact' : 'Deal'}</label>
                <select
                  className="clay-input"
                  value={insightEntityId}
                  onChange={e => { setInsightEntityId(e.target.value); setInsightResult(null); setInsightError(null); }}
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="">Select...</option>
                  {insightType === 'contact'
                    ? contacts.map(c => (
                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name}{c.company_name ? ` - ${c.company_name}` : ''}</option>
                      ))
                    : deals.map(d => (
                        <option key={d.id} value={d.id}>{d.name}{d.company_name ? ` - ${d.company_name}` : ''}</option>
                      ))
                  }
                </select>
              </div>

              <button
                className="clay-btn clay-btn-primary"
                onClick={handleInsightsGenerate}
                disabled={insightLoading || !insightEntityId}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Sparkles size={16} />
                {insightLoading ? 'Generating...' : 'Generate Insights'}
              </button>
            </div>

            {insightLoading && <LoadingState message="Generating AI insights..." />}

            {insightResult && !insightLoading && (
              <div className="clay-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={18} style={{ color: 'var(--accent)' }} />
                  AI Analysis
                </h3>
                <div style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {insightResult}
                </div>
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 380px' }}>
            <div className="clay-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--accent)' }} />
                Previous Insights
              </h3>

              {!insightEntityId && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <FileText size={36} style={{ opacity: 0.4, marginBottom: '12px' }} />
                  <p style={{ fontSize: '13px' }}>Select an entity to view previous insights</p>
                </div>
              )}

              {insightEntityId && insightsLoading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                  <RefreshCw size={20} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                </div>
              )}

              {insightEntityId && !insightsLoading && previousInsights.length === 0 && !insightResult && (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No previous insights found for this entity.
                </div>
              )}

              {previousInsights.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                  {previousInsights.map((ins, i) => {
                    const date = ins.created_at || ins.date;
                    const content = ins.insight || ins.analysis || ins.summary || ins.content || '';
                    return (
                      <div key={ins.id || i} className="clay-card-sm" style={{ padding: '16px' }}>
                        {date && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                            {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
