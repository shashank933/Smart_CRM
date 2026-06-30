import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ArrowLeft, Send, Brain, RefreshCw, User, MessageSquare, AlertCircle, CheckCircle2, Clock, ArrowUpCircle, Tag, Trash2 } from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog';

interface Comment {
  id: string;
  content: string;
  author_type: string;
  is_internal: number;
  created_at: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  contact_name?: string;
  contact_email?: string;
  company_name?: string;
  deal_name?: string;
  category?: string;
  source?: string;
  tags_parsed?: string[];
  resolution?: string;
  assigned_to?: string;
  comment_count?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  comments?: Comment[];
}

const STATUS_STEPS = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
const STATUS_LABELS: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', pending: 'Pending', resolved: 'Resolved', closed: 'Closed'
};
const PRIO_COLORS: Record<string, string> = {
  urgent: 'clay-badge-danger', high: 'clay-badge-warning', medium: 'clay-badge-info', low: 'clay-badge-accent'
};

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      const data = await api.getTicket(id!);
      setTicket(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchTicket(); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ticket?.comments]);

  const handleStatusChange = async (status: string) => {
    try {
      await api.updateTicketStatus(id!, status);
      fetchTicket();
    } catch (e) { console.error(e); }
  };

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.addTicketComment(id!, { content: reply, author_type: 'user', is_internal: isInternal });
      setReply('');
      setIsInternal(false);
      fetchTicket();
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const handleSummarize = async () => {
    setAiLoading(true);
    try {
      const res = await api.summarizeTicket(id!);
      setAiSummary(res.summary);
    } catch (e) { console.error(e); }
    setAiLoading(false);
  };

  const handleSuggestReply = async () => {
    setAiLoading(true);
    try {
      const res = await api.suggestTicketReply(id!);
      setAiReply(res.reply);
    } catch (e) { console.error(e); }
    setAiLoading(false);
  };

  const useAiReply = () => {
    if (aiReply) { setReply(aiReply); setAiReply(null); }
  };

  const handleConfirmDelete = async () => {
    setConfirmDeleteOpen(false);
    try { await api.deleteTicket(id!); navigate('/tickets'); } catch (e) { console.error(e); }
  };

  if (loading) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="clay-skeleton" style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />
      <div className="clay-skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />
    </div>;
  }

  if (!ticket) {
    return <div className="clay-empty-state"><h3>Ticket not found</h3></div>;
  }

  const s = {
    layout: { display: 'grid' as const, gridTemplateColumns: '1fr 340px', gap: '20px' as const },
    main: { display: 'flex' as const, flexDirection: 'column' as const, gap: '16px' as const },
    card: { background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--clay-shadow)', border: '1px solid rgba(255,255,255,0.6)' },
    comment: { display: 'flex' as const, gap: '12px' as const, padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' },
    inputRow: { display: 'flex' as const, gap: '8px' as const, marginTop: '12px' as const }
  };

  return (
    <div>
      <button className="clay-btn clay-btn-ghost" onClick={() => navigate('/tickets')} style={{ marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to Tickets
      </button>

      <div style={s.layout}>
        {/* Main column */}
        <div style={s.main}>
          {/* Header card */}
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{ticket.subject}</h2>
                  <span className={`clay-badge ${PRIO_COLORS[ticket.priority]}`}>{ticket.priority}</span>
                  <span className="clay-badge clay-badge-accent">{STATUS_LABELS[ticket.status]}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{ticket.ticket_number}</div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  {ticket.contact_name && <span><User size={12} /> {ticket.contact_name}{ticket.contact_email ? ` (${ticket.contact_email})` : ''}</span>}
                  {ticket.company_name && <span><Tag size={12} /> {ticket.company_name}</span>}
                  {ticket.source && <span>Source: {ticket.source}</span>}
                  {ticket.category && <span>Category: {ticket.category}</span>}
                  <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                  {ticket.resolved_at && <span style={{ color: 'var(--success)' }}>Resolved: {new Date(ticket.resolved_at).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
            {ticket.description && (
              <div style={{ marginTop: '16px', padding: '14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {ticket.description}
              </div>
            )}
          </div>

          {/* Status stepper */}
          <div style={s.card}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {STATUS_STEPS.map((st, i) => {
                const isActive = STATUS_STEPS.indexOf(ticket.status) >= i;
                const isCurrent = ticket.status === st;
                return (
                  <button key={st} onClick={() => handleStatusChange(st)}
                    className={`clay-btn clay-btn-sm ${isCurrent ? 'clay-btn-primary' : isActive ? '' : 'clay-btn-ghost'}`}
                    style={{ opacity: isActive ? 1 : 0.5 }}>
                    {STATUS_LABELS[st]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Summary */}
          {aiSummary && (
            <div style={{ ...s.card, background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Brain size={16} /> AI Summary
                </span>
                <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={() => setAiSummary(null)}>Dismiss</button>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{aiSummary}</p>
            </div>
          )}

          {/* AI suggested reply */}
          {aiReply && (
            <div style={{ ...s.card, background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Brain size={16} /> AI Suggested Reply
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="clay-btn clay-btn-sm clay-btn-primary" onClick={useAiReply}>Use This</button>
                  <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={() => setAiReply(null)}>Dismiss</button>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{aiReply}</p>
            </div>
          )}

          {/* Comments thread */}
          <div style={s.card}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} /> Conversation ({ticket.comments?.length || 0})
            </h3>
            {(ticket.comments || []).length === 0 && (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No replies yet. Add the first comment.
              </div>
            )}
            {(ticket.comments || []).map((c: Comment) => (
              <div key={c.id} style={{ ...s.comment, background: c.is_internal ? 'rgba(161,161,170,0.2)' : 'transparent', borderRadius: '8px', padding: c.is_internal ? '12px' : '14px 0' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: c.author_type === 'user' ? 'var(--accent-gradient)' : 'linear-gradient(135deg, var(--info), var(--info-light))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px'
                }}>
                  {c.author_type === 'user' ? 'U' : 'C'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>
                      {c.author_type === 'user' ? 'Support Agent' : 'Contact'}
                      {c.is_internal ? <span style={{ color: 'var(--danger)', marginLeft: '6px', fontSize: '10px' }}>INTERNAL</span> : null}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.content}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />

            {/* Reply input */}
            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: isInternal ? 'var(--danger)' : 'var(--text-muted)' }}>
                  <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                  Internal note
                </label>
              </div>
              <div style={s.inputRow}>
                <textarea className="clay-input" value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  placeholder="Type your reply... (Enter to send, Shift+Enter for newline)"
                  rows={3} style={{ flex: 1, resize: 'vertical' }} />
                <button className="clay-btn clay-btn-primary" onClick={handleSendReply} disabled={!reply.trim() || sending} style={{ alignSelf: 'flex-end' }}>
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* AI Actions */}
          <div style={s.card}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Brain size={16} /> AI Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="clay-btn clay-btn-sm" onClick={handleSummarize} disabled={aiLoading} style={{ justifyContent: 'center' }}>
                <RefreshCw size={14} className={aiLoading ? 'clay-skeleton' : ''} /> Summarize Ticket
              </button>
              <button className="clay-btn clay-btn-sm" onClick={handleSuggestReply} disabled={aiLoading} style={{ justifyContent: 'center' }}>
                <MessageSquare size={14} /> Suggest Reply
              </button>
            </div>
          </div>

          {/* Details card */}
          <div style={s.card}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> {STATUS_LABELS[ticket.status]}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Priority:</span> {ticket.priority}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>ID:</span> <code style={{ fontSize: '11px' }}>{ticket.ticket_number}</code></div>
              {ticket.category && <div><span style={{ color: 'var(--text-muted)' }}>Category:</span> {ticket.category}</div>}
              {ticket.source && <div><span style={{ color: 'var(--text-muted)' }}>Source:</span> {ticket.source}</div>}
              {ticket.tags_parsed && ticket.tags_parsed.length > 0 && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tags:</span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {ticket.tags_parsed.map((t: string, i: number) => (
                      <span key={i} className="clay-tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {ticket.resolution && (
                <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--success)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Resolution:</span>
                  {ticket.resolution}
                </div>
              )}
            </div>
          </div>

          {/* Delete */}
          <div style={s.card}>
            <button className="clay-btn clay-btn-danger clay-btn-sm" onClick={() => setConfirmDeleteOpen(true)} style={{ width: '100%', justifyContent: 'center' }}>
              <Trash2 size={14} /> Delete Ticket
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Ticket"
        message="Delete this ticket permanently? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
