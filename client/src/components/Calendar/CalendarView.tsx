import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../../api';
import { ChevronLeft, ChevronRight, Plus, Phone, CheckSquare, Clock, AlertCircle, X, User, Trash2 } from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog';

interface CalendarEvent {
  id: string;
  type: string;
  subject: string;
  description: string | null;
  status: string;
  due_date: string;
  contact_name?: string;
  deal_name?: string;
  completed_at?: string | null;
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: 'task', subject: '', description: '', due_date: '', status: 'pending' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deletingIdRef = useRef<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const start = firstDay.toISOString().split('T')[0];
      const end = lastDay.toISOString().split('T')[0];
      const data = await api.request(`/activities/calendar?start=${start}&end=${end}`);
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleDelete = async () => {
    const id = deletingIdRef.current;
    if (!id) return;
    try {
      await api.request(`/activities/${id}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (e) { console.error(e); }
    setConfirmOpen(false);
    deletingIdRef.current = null;
  };

  useEffect(() => { fetchEvents(); }, [year, month]);

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.due_date) return;
    try {
      await api.createActivity(form);
      setShowCreate(false);
      setForm({ type: 'task', subject: '', description: '', due_date: '', status: 'pending' });
      fetchEvents();
    } catch (e) { console.error(e); }
  };

  const openDate = (dateStr: string) => {
    setForm(f => ({ ...f, due_date: dateStr }));
    setShowCreate(true);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));
  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(e => {
      if (!map[e.due_date]) map[e.due_date] = [];
      map[e.due_date].push(e);
    });
    return map;
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = todayDate.toISOString().split('T')[0];
    return events
      .filter(e => e.due_date >= now && e.status !== 'completed')
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 12);
  }, [events, todayDate]);

  const pendingTasks = useMemo(() => {
    return events
      .filter(e => e.type === 'task' && e.status !== 'completed')
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 8);
  }, [events]);

  const meetings = useMemo(() => {
    return upcomingEvents.filter(e => e.type === 'meeting' || e.type === 'call');
  }, [upcomingEvents]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00');
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const s = {
    container: { display: 'flex' as const, gap: '20px', maxWidth: '1200px' as const, alignItems: 'flex-start' as const, flexWrap: 'wrap' as const },
    header: { display: 'flex' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: '16px' as const },
    monthTitle: { fontSize: '20px', fontWeight: 700 },
    navBtn: { background: 'var(--bg-card)', border: 'var(--card-border)', borderRadius: 'var(--radius-sm)', width: '34px', height: '34px', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, cursor: 'pointer', color: 'var(--text-primary)' },
    calendarWrap: { flex: '1 1 280px', minWidth: 0 },
    sidePanel: { width: '300px', flexShrink: 0, display: 'flex' as const, flexDirection: 'column' as const, gap: '16px' as const, flex: '1 1 280px', minWidth: '260px' },
    calendarGrid: {
      display: 'grid' as const, gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '1px', background: 'rgba(0,0,0,0.04)', borderRadius: 'var(--radius-lg)',
      overflow: 'hidden', border: 'var(--card-border)'
    },
    dayHeader: {
      padding: '8px 4px', fontSize: '10px', fontWeight: 600, textAlign: 'center' as const,
      color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.5px',
      background: 'var(--bg-card)'
    },
    dayCell: {
      minHeight: '72px', padding: '5px', background: 'var(--bg-card)',
      cursor: 'pointer', transition: 'background 0.15s',
      display: 'flex' as const, flexDirection: 'column' as const
    },
    dayNumber: {
      fontSize: '11px', fontWeight: 600, marginBottom: '2px',
      width: '22px', height: '22px', display: 'flex' as const, alignItems: 'center' as const,
      justifyContent: 'center' as const, borderRadius: '6px'
    },
    eventDot: (type: string) => ({
      display: 'flex' as const, alignItems: 'center' as const, gap: '3px',
      padding: '1px 4px', borderRadius: '3px', fontSize: '9px', fontWeight: 500,
      marginBottom: '1px', whiteSpace: 'nowrap' as const, overflow: 'hidden' as const,
      textOverflow: 'ellipsis' as const,
      background: type === 'meeting' ? '#d1fae5' : type === 'call' ? '#e4e4e7' : '#a7f3d0',
      color: type === 'meeting' ? 'var(--accent)' : type === 'call' ? 'var(--text-secondary)' : 'var(--accent-dark)'
    }),
    sideCard: {
      background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: 'var(--card-border)',
      padding: '20px'
    },
    sideCardTitle: {
      fontSize: '13px', fontWeight: 700, marginBottom: '14px',
      display: 'flex' as const, alignItems: 'center' as const, gap: '8px',
      color: 'var(--text-primary)'
    },
    sideEvent: {
      display: 'flex' as const, alignItems: 'center' as const, gap: '10px',
      padding: '8px 0', borderBottom: '1px solid var(--divider-color)'
    },
    sideEventIcon: (type: string) => ({
      width: '32px', height: '32px', borderRadius: '8px',
      display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
      flexShrink: 0,
      background: type === 'meeting' ? '#d1fae5' : type === 'call' ? '#e4e4e7' : '#a7f3d0'
    })
  };

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} style={{ ...s.dayCell, background: 'var(--bg-primary)', cursor: 'default' }} />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = eventsByDate[dateStr] || [];
    const isToday = dateStr === today;
    days.push(
      <div key={d} style={s.dayCell}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-glass)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
        onClick={() => openDate(dateStr)}>
        <div style={{ ...s.dayNumber, background: isToday ? 'var(--accent)' : 'transparent', color: isToday ? 'white' : 'var(--text-secondary)', fontWeight: isToday ? 700 : 600 }}>
          {d}
        </div>
        {dayEvents.slice(0, 2).map(ev => (
          <div key={ev.id} style={s.eventDot(ev.type)} title={ev.subject}>
            {ev.type === 'task' ? <CheckSquare size={9} /> : <Phone size={9} />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.subject}</span>
          </div>
        ))}
        {dayEvents.length > 2 && (
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', paddingLeft: '4px' }}>+{dayEvents.length - 2}</div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: '20px', maxWidth: '1200px' }}>
        <div className="clay-skeleton" style={{ flex: 1, height: '500px', borderRadius: 'var(--radius-lg)' }} />
        <div className="clay-skeleton" style={{ width: '300px', height: '500px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  return (
    <div className="clay-calendar-container" style={s.container}>
      <div style={s.calendarWrap}>
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button style={s.navBtn} onClick={prevMonth}><ChevronLeft size={16} /></button>
            <h2 style={s.monthTitle}>{monthName} {year}</h2>
            <button style={s.navBtn} onClick={nextMonth}><ChevronRight size={16} /></button>
          </div>
          <button className="clay-btn clay-btn-primary clay-btn-sm" onClick={() => { setForm(f => ({ ...f, due_date: today })); setShowCreate(true); }}>
            <Plus size={14} /> Add
          </button>
        </div>

        <div style={s.calendarGrid}>
          {dayNames.map(d => <div key={d} style={s.dayHeader}>{d}</div>)}
          {days}
        </div>
      </div>

      <div style={s.sidePanel}>
        <div style={s.sideCard}>
          <div style={s.sideCardTitle}>
            <Phone size={14} color="var(--accent)" />
            Upcoming Meetings
          </div>
          {meetings.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '12px 0', textAlign: 'center' }}>
              No upcoming meetings
            </div>
          ) : (
            meetings.map(ev => (
              <div key={ev.id} style={s.sideEvent}>
                <div style={s.sideEventIcon(ev.type)}>
                  <Phone size={14} color="var(--accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.subject}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatDate(ev.due_date)}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deletingIdRef.current = ev.id; setConfirmOpen(true); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', borderRadius: '4px', display: 'flex' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        <div style={s.sideCard}>
          <div style={s.sideCardTitle}>
            <CheckSquare size={14} color="var(--accent)" />
            Pending Tasks
          </div>
          {pendingTasks.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '12px 0', textAlign: 'center' }}>
              No pending tasks
            </div>
          ) : (
            pendingTasks.map(ev => (
              <div key={ev.id} style={s.sideEvent}>
                <div style={s.sideEventIcon(ev.type)}>
                  <CheckSquare size={14} color="var(--accent-dark)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.subject}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatDate(ev.due_date)}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deletingIdRef.current = ev.id; setConfirmOpen(true); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', borderRadius: '4px', display: 'flex' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreate && (
        <div className="clay-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="clay-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="clay-modal-header">
              <h2>Add Event</h2>
              <button className="clay-btn clay-btn-sm clay-btn-ghost" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="clay-modal-body">
              <div className="clay-form-group">
                <label className="clay-form-label">Type</label>
                <select className="clay-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="task">Task</option>
                  <option value="meeting">Meeting</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div className="clay-form-group">
                <label className="clay-form-label">Subject *</label>
                <input className="clay-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Event title" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="clay-form-group">
                  <label className="clay-form-label">Date *</label>
                  <input className="clay-input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div className="clay-form-group">
                  <label className="clay-form-label">Status</label>
                  <select className="clay-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="clay-form-group">
                <label className="clay-form-label">Description</label>
                <textarea className="clay-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Optional details..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="clay-modal-footer">
              <button className="clay-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="clay-btn clay-btn-primary" onClick={handleCreate} disabled={!form.subject.trim() || !form.due_date}>
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Event"
        message="This event will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); deletingIdRef.current = null; }}
      />
    </div>
  );
}
