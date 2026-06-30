import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../api';
import { Brain, Send, X, Minimize2, Maximize2, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function AIFloatBot() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hi! I'm your CRM assistant. Ask me about contacts, deals, or workflows." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await api.aiChat({ message: text });
      setMessages(prev => [...prev, { role: 'ai', content: res.response || 'Sorry, I had trouble processing that.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'AI is not available right now.' }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="clay-float-bot-btn"
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'var(--accent-gradient)', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          animation: 'pulse 2s infinite'
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(99,102,241,0.5)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)';
        }}
      >
        <Brain size={24} color="white" />
      </button>
    );
  }

  if (minimized) {
    return (
      <div className="clay-float-bot-chip" style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--card-shadow-hover)', border: 'var(--card-border)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
        cursor: 'pointer', animation: 'slideUp 0.25s ease'
      }} onClick={() => setMinimized(false)}>
        <Brain size={18} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: '13px', fontWeight: 600 }}>AI Assistant</span>
        <button onClick={e => { e.stopPropagation(); setOpen(false); setMinimized(false); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
            <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="clay-float-bot-panel" style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
      width: 'min(380px, calc(100vw - 24px))', height: 'min(520px, calc(100vh - 100px))',
      background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--card-shadow-hover)', border: 'var(--card-border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      animation: 'slideUp 0.25s ease'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--divider-color)',
        background: 'var(--accent-gradient)',
        color: 'white', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} />
          <span style={{ fontWeight: 700, fontSize: '14px' }}>AI Assistant</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setMinimized(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', padding: '4px', display: 'flex' }}>
            <Minimize2 size={14} />
          </button>
          <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', padding: '4px', display: 'flex' }}>
          <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px', borderRadius: m.role === 'user' ? 'var(--radius) var(--radius) 4px var(--radius)' : 'var(--radius) var(--radius) var(--radius) 4px',
              background: m.role === 'user' ? 'var(--accent-gradient)' : 'var(--bg-glass)',
              color: m.role === 'user' ? 'white' : 'var(--text-primary)',
              fontSize: '13px', lineHeight: 1.5, boxShadow: 'var(--card-shadow-sm)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 'var(--radius)', background: 'var(--bg-glass)', fontSize: '13px' }}>
            <span style={{ animation: 'pulse 1s infinite' }}>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--divider-color)', flexShrink: 0, display: 'flex', gap: '8px' }}>
        <input
          className="clay-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
        />
        <button className="clay-btn clay-btn-primary clay-btn-sm" onClick={handleSend} disabled={!input.trim() || loading} style={{ padding: '8px 12px' }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
