import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../api';
import { Plus, Search, MessageSquare, Send, User, Bot, ArrowLeft, MoreVertical, Filter, Brain, RefreshCw, X, Mail, Phone } from 'lucide-react';

const CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'chat', label: 'Chat', icon: MessageSquare },
];

const CHANNEL_MAP = {
  email: { label: 'Email', icon: Mail, badge: 'clay-badge-info' },
  phone: { label: 'Phone', icon: Phone, badge: 'clay-badge-accent' },
  chat: { label: 'Chat', icon: MessageSquare, badge: 'clay-badge-success' },
};

const STATUS_MAP = {
  open: { label: 'Open', className: 'clay-badge-success' },
  closed: { label: 'Closed', className: 'clay-badge-danger' },
  pending: { label: 'Pending', className: 'clay-badge-warning' },
  resolved: { label: 'Resolved', className: 'clay-badge-info' },
};

const AVATAR_COLORS = [
  'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  'linear-gradient(135deg, #00b894, #55efc4)',
  'linear-gradient(135deg, #e17055, #fab1a0)',
  'linear-gradient(135deg, #fdcb6e, #ffeaa7)',
  'linear-gradient(135deg, #74b9ff, #a4d1ff)',
  'linear-gradient(135deg, #fd79a8, #fab1c8)',
  'linear-gradient(135deg, #a29bfe, #dfd8ff)',
  'linear-gradient(135deg, #00cec9, #81ecec)',
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase() || '?';
}

function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const INITIAL_FORM = {
  contact_id: '',
  subject: '',
  channel: 'email',
  initial_message: '',
};

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [aiReply, setAiReply] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [mobileView, setMobileView] = useState('list');
  const [actionOpen, setActionOpen] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterChannel) params.channel = filterChannel;
      const res = await api.getConversations(params);
      setConversations(Array.isArray(res) ? res : res.conversations || res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterChannel]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await api.getContacts();
      setContacts(Array.isArray(res) ? res : res.contacts || res.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const selectConversation = useCallback(async (conv) => {
    setSelectedId(conv.id);
    setMobileView('thread');
    setAiReply(null);
    setAiSummary(null);
    setActionOpen(null);
    setLoadingMessages(true);
    try {
      const res = await api.getConversation(conv.id);
      const data = res.conversation || res.data || res;
      setSelectedConversation(data);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedId,
      sender_type: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    try {
      const res = await api.sendMessage(selectedId, { content: text, sender_type: 'user' });
      const savedMsg = res.message || res.data || res;
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? savedMsg : m));
      fetchConversations();
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setError(err.message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleGetAiReply = async () => {
    if (!selectedId || aiLoading) return;
    setAiLoading(true);
    setAiReply(null);
    try {
      const contextMessages = messages.slice(-20).map(m => ({
        role: m.sender_type === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));
      const res = await api.aiChat({
        messages: [
          { role: 'system', content: 'You are a helpful CRM assistant. Based on the conversation context, suggest a professional reply that the user can send to the contact. Keep it concise and helpful.' },
          ...contextMessages,
          { role: 'user', content: 'Generate a suggested reply for this conversation.' },
        ],
      });
      setAiReply(res.reply || res.message || res.response || 'No suggestion generated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedId || summaryLoading) return;
    setSummaryLoading(true);
    setAiSummary(null);
    try {
      const res = await api.summarizeConversation(selectedId);
      setAiSummary(res.summary || res.message || res.response || 'No summary available.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleUseAiReply = () => {
    if (aiReply) {
      setNewMessage(aiReply);
      setAiReply(null);
      inputRef.current?.focus();
    }
  };

  const openNewModal = () => {
    setForm({ ...INITIAL_FORM });
    setFormError('');
    setShowNewModal(true);
    setActionOpen(null);
  };

  const closeNewModal = () => {
    setShowNewModal(false);
    setForm({ ...INITIAL_FORM });
    setFormError('');
  };

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (formError) setFormError('');
  };

  const handleCreateConversation = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.contact_id) {
      setFormError('Please select a contact.');
      return;
    }
    if (!form.subject.trim()) {
      setFormError('Subject is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        contact_id: Number(form.contact_id),
        subject: form.subject.trim(),
        channel: form.channel,
        initial_message: form.initial_message.trim() || null,
      };
      const res = await api.createConversation(payload);
      const newConv = res.conversation || res.data || res;
      closeNewModal();
      await fetchConversations();
      if (newConv && newConv.id) {
        await selectConversation(newConv);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    if (selectedId) {
      const conv = conversations.find(c => c.id === selectedId);
      if (conv) selectConversation(conv);
    }
    fetchConversations();
  };

  const goBackToList = () => {
    setMobileView('list');
    setSelectedId(null);
    setSelectedConversation(null);
    setMessages([]);
    setAiReply(null);
    setAiSummary(null);
  };

  const filteredConversations = conversations;

  const selectedChannelInfo = selectedConversation ? (CHANNEL_MAP[selectedConversation.channel] || CHANNEL_MAP.chat) : null;
  const selectedStatusInfo = selectedConversation ? (STATUS_MAP[selectedConversation.status] || STATUS_MAP.open) : null;

  const getChannelIcon = (channel) => {
    const info = CHANNEL_MAP[channel] || CHANNEL_MAP.chat;
    const IconComponent = info.icon;
    return <IconComponent size={14} />;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Conversations</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage your conversations and messages</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="clay-btn clay-btn-ghost" onClick={handleRefresh}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="clay-btn clay-btn-primary" onClick={openNewModal}>
            <Plus size={18} /> New Conversation
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 500, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px' }}><X size={14} /></button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 200px)', minHeight: '560px' }}>
        <div
          style={{
            width: mobileView === 'thread' ? '100%' : '380px',
            flexShrink: 0,
            display: mobileView === 'thread' ? 'none' : 'flex',
            flexDirection: 'column',
          }}
          className="clay-card"
        >
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  className="clay-input"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: '36px', paddingTop: '10px', paddingBottom: '10px', fontSize: '13px' }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Filter size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }} />
                <select
                  className="clay-input"
                  value={filterChannel}
                  onChange={e => setFilterChannel(e.target.value)}
                  style={{ paddingLeft: '30px', paddingRight: '8px', width: '110px', fontSize: '12px', paddingTop: '10px', paddingBottom: '10px', appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="">All</option>
                  {CHANNEL_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '12px' }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', padding: '14px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div className="clay-skeleton" style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="clay-skeleton" style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
                      <div className="clay-skeleton" style={{ width: '100%', height: '12px', marginBottom: '6px' }} />
                      <div className="clay-skeleton" style={{ width: '80px', height: '12px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="clay-empty-state" style={{ padding: '40px 20px' }}>
                <MessageSquare size={40} style={{ opacity: 0.4, color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h3>No conversations found</h3>
                <p style={{ marginBottom: '16px', fontSize: '13px' }}>
                  {search || filterChannel ? 'Try adjusting your search or filters.' : 'Start your first conversation.'}
                </p>
                {(search || filterChannel) ? (
                  <button className="clay-btn clay-btn-sm" onClick={() => { setSearch(''); setFilterChannel(''); }}>Clear Filters</button>
                ) : (
                  <button className="clay-btn clay-btn-primary clay-btn-sm" onClick={openNewModal}>
                    <Plus size={14} /> New Conversation
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map(conv => {
                const chInfo = CHANNEL_MAP[conv.channel] || CHANNEL_MAP.chat;
                const isSelected = selectedId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '14px 16px',
                      borderBottom: '1px solid rgba(0,0,0,0.04)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--bg-glass)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-glass)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-sm)',
                        background: getAvatarColor(conv.contact_name || conv.subject || ''),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '15px',
                        color: 'white',
                        flexShrink: 0,
                        boxShadow: 'var(--clay-shadow-sm)',
                      }}
                    >
                      {getInitials(conv.contact_name || '')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.contact_name || 'Unknown Contact'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '8px' }}>
                          {formatTime(conv.last_message_at || conv.updated_at || conv.created_at)}
                        </div>
                      </div>
                      {conv.subject && (
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.subject}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          {(() => { const ChannelIcon = chInfo.icon; return <ChannelIcon size={12} />; })()}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {conv.last_message || 'No messages yet'}
                        </div>
                        {conv.unread_count > 0 && (
                          <span style={{
                            background: 'var(--accent-gradient)',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 700,
                            minWidth: '20px',
                            height: '20px',
                            borderRadius: '10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 6px',
                            boxShadow: 'var(--clay-shadow-sm)',
                          }}>
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: mobileView === 'list' ? 'none' : 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
          className="clay-card"
        >
          {!selectedConversation ? (
            <div className="clay-empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--accent-light), #dfd8ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: 'var(--clay-shadow)',
              }}>
                <MessageSquare size={36} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Select a Conversation</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Choose a conversation from the list to view messages</p>
            </div>
          ) : (
            <>
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexShrink: 0,
              }}>
                <button
                  className="clay-btn clay-btn-sm clay-btn-ghost"
                  onClick={goBackToList}
                  style={{ display: 'none' }}
                >
                  <ArrowLeft size={16} />
                </button>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius)',
                    background: getAvatarColor(selectedConversation.contact_name || selectedConversation.subject || ''),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '16px',
                    color: 'white',
                    flexShrink: 0,
                    boxShadow: 'var(--clay-shadow-sm)',
                  }}
                >
                  {getInitials(selectedConversation.contact_name || '')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedConversation.contact_name || 'Unknown Contact'}
                    </h3>
                    {selectedChannelInfo && (() => { const SelectedChannelIcon = selectedChannelInfo.icon; return (
                      <span className={`clay-badge ${selectedChannelInfo.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <SelectedChannelIcon size={12} />
                        {selectedChannelInfo.label}
                      </span>
                    )})()}
                    {selectedStatusInfo && (
                      <span className={`clay-badge ${selectedStatusInfo.className}`}>
                        {selectedStatusInfo.label}
                      </span>
                    )}
                  </div>
                  {selectedConversation.subject && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedConversation.subject}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    className="clay-btn clay-btn-sm"
                    onClick={handleSummarize}
                    disabled={summaryLoading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Brain size={14} />
                    {summaryLoading ? 'Summarizing...' : 'Summarize'}
                  </button>
                  <button
                    className="clay-btn clay-btn-sm clay-btn-primary"
                    onClick={handleGetAiReply}
                    disabled={aiLoading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Bot size={14} />
                    {aiLoading ? 'Thinking...' : 'Get AI Reply'}
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {aiSummary && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #f0edff, #e8e0ff)',
                      borderRadius: 'var(--radius)',
                      padding: '16px 20px',
                      marginBottom: '20px',
                      border: '1px solid rgba(108, 92, 231, 0.2)',
                      boxShadow: 'var(--clay-shadow-sm)',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Brain size={16} />
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-dark)' }}>AI Summary</span>
                      <button
                        onClick={() => setAiSummary(null)}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0 }}>{aiSummary}</p>
                  </div>
                )}

                {loadingMessages ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start' }}>
                        <div
                          className="clay-skeleton"
                          style={{
                            width: `${Math.random() * 200 + 180}px`,
                            height: `${Math.random() * 40 + 40}px`,
                            borderRadius: i % 2 === 0 ? 'var(--radius) var(--radius) 4px var(--radius)' : 'var(--radius) var(--radius) var(--radius) 4px',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="clay-empty-state" style={{ padding: '40px 20px' }}>
                    <MessageSquare size={40} style={{ opacity: 0.4, color: 'var(--text-muted)', marginBottom: '12px' }} />
                    <h3>No messages yet</h3>
                    <p style={{ fontSize: '13px' }}>Send the first message to start this conversation.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {messages.map(msg => {
                      const isUser = msg.sender_type === 'user';
                      const isAI = msg.sender_type === 'ai';
                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            justifyContent: isUser ? 'flex-end' : 'flex-start',
                            alignItems: 'flex-end',
                            gap: '8px',
                          }}
                        >
                          {!isUser && (
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: 'var(--clay-shadow-sm)',
                                background: isAI
                                  ? 'linear-gradient(135deg, var(--accent), var(--accent-light))'
                                  : getAvatarColor(selectedConversation?.contact_name || ''),
                              }}
                            >
                              {isAI ? <Bot size={16} /> : <User size={16} />}
                            </div>
                          )}
                          <div style={{ maxWidth: '70%' }}>
                            <div
                              style={{
                                background: isUser
                                  ? 'var(--accent-gradient)'
                                  : isAI
                                    ? 'linear-gradient(135deg, #f0edff, #e8e0ff)'
                                    : 'var(--bg-card)',
                                color: isUser ? 'white' : 'var(--text-primary)',
                                padding: '12px 16px',
                                borderRadius: isUser
                                  ? 'var(--radius) var(--radius) 4px var(--radius)'
                                  : 'var(--radius) var(--radius) var(--radius) 4px',
                                boxShadow: isUser
                                  ? '4px 4px 12px rgba(108, 92, 231, 0.25), -2px -2px 8px rgba(255, 255, 255, 0.3)'
                                  : 'var(--clay-shadow-sm)',
                                border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.6)',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                wordBreak: 'break-word',
                              }}
                            >
                              {msg.content}
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                marginTop: '4px',
                                textAlign: isUser ? 'right' : 'left',
                                paddingLeft: isUser ? '0' : '40px',
                                paddingRight: isUser ? '0' : '0',
                              }}
                            >
                              {isAI ? 'AI Assistant' : (isUser ? 'You' : (selectedConversation?.contact_name || 'Contact'))}
                              {' · '}
                              {formatMessageTime(msg.created_at)}
                            </div>
                          </div>
                          {isUser && (
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'var(--accent-gradient)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: 'var(--clay-shadow-sm)',
                              }}
                            >
                              <User size={16} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {aiReply && (
                <div
                  style={{
                    margin: '0 20px 12px 20px',
                    background: 'linear-gradient(135deg, #f0f9ff, #e0f5fe)',
                    borderRadius: 'var(--radius)',
                    padding: '14px 18px',
                    border: '1px solid rgba(116, 185, 255, 0.3)',
                    boxShadow: 'var(--clay-shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Bot size={16} />
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#004a7a' }}>AI Suggested Reply</span>
                    <button
                      onClick={() => setAiReply(null)}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', margin: '0 0 10px 0' }}>{aiReply}</p>
                  <button className="clay-btn clay-btn-sm clay-btn-primary" onClick={handleUseAiReply} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Send size={12} /> Use This Reply
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-end',
                  flexShrink: 0,
                  background: 'var(--bg-primary)',
                  borderBottomLeftRadius: 'var(--radius-lg)',
                  borderBottomRightRadius: 'var(--radius-lg)',
                }}
              >
                <textarea
                  ref={inputRef}
                  className="clay-input"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  rows={2}
                  style={{ resize: 'none', flex: 1, fontSize: '14px', lineHeight: '1.5' }}
                />
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary"
                  disabled={!newMessage.trim() || sending}
                  style={{ padding: '10px 18px', height: 'fit-content' }}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {showNewModal && (
        <div className="clay-modal-overlay" onClick={closeNewModal}>
          <div className="clay-modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="clay-modal-header">
              <h2>New Conversation</h2>
              <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={closeNewModal}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateConversation}>
              <div className="clay-modal-body">
                {formError && (
                  <div style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '20px' }}>
                    {formError}
                  </div>
                )}
                <div className="clay-form-group">
                  <label className="clay-form-label">Contact *</label>
                  <select
                    className="clay-input"
                    name="contact_id"
                    value={form.contact_id}
                    onChange={handleFormChange}
                    required
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">Select a contact</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name}{c.email ? ` (${c.email})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="clay-form-group">
                  <label className="clay-form-label">Subject *</label>
                  <input
                    className="clay-input"
                    name="subject"
                    value={form.subject}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. Product inquiry, Support request..."
                  />
                </div>
                <div className="clay-form-group">
                  <label className="clay-form-label">Channel</label>
                  <select
                    className="clay-input"
                    name="channel"
                    value={form.channel}
                    onChange={handleFormChange}
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    {CHANNEL_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="clay-form-group">
                  <label className="clay-form-label">Initial Message</label>
                  <textarea
                    className="clay-input"
                    name="initial_message"
                    value={form.initial_message}
                    onChange={handleFormChange}
                    rows={4}
                    style={{ resize: 'vertical' }}
                    placeholder="Start the conversation..."
                  />
                </div>
              </div>
              <div className="clay-modal-footer">
                <button type="button" className="clay-btn" onClick={closeNewModal} disabled={saving}>Cancel</button>
                <button type="submit" className="clay-btn clay-btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Conversation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
