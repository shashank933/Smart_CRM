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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [form, setForm] = useState({ type: 'task', subject: '', description: '', due_date: '', status: 'pending' });
  const [contacts, setContacts] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
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
  useEffect(() => { api.getContacts({ limit: 200 }).then(d => setContacts(d.contacts || [])).catch(() => {}); }, []);

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
    setSelectedDate(dateStr);
    setForm(f => ({ ...f, due_date: dateStr }));
    setShowCreate(true);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));
  const today = new Date().toISOString().split('T')[0];

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

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const s = {
    container: { maxWidth: '1000px' as const },
    header: { display: 'flex' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: '20px' as const },
    monthTitle: { fontSize: '22px', fontWeight: 700 },
    navBtn: { background: 'var(--bg-card)', border: 'none', borderRadius: 'var(--radius-sm)', width: '36px', height: '36px', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, cursor: 'pointer', boxShadow: 'var(--clay-shadow-sm)', color: 'var(--text-primary)' },
    calendarGrid: {
      display: 'grid' as const, gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '1px', background: 'rgba(0,0,0,0.04)', borderRadius: 'var(--radius-lg)',
      overflow: 'hidden', boxShadow: 'var(--clay-shadow)'
    },
    dayHeader: {
      padding: '10px', fontSize: '11px', fontWeight: 600, textAlign: 'center' as const,
      color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.5px',
      background: 'var(--bg-card)'
    },
    dayCell: {
      minHeight: '90px', padding: '6px', background: 'var(--bg-card)',
      cursor: 'pointer', transition: 'background 0.15s',
      display: 'flex' as const, flexDirection: 'column' as const
    },
    dayNumber: {
      fontSize: '12px', fontWeight: 600, marginBottom: '4px',
      width: '24px', height: '24px', display: 'flex' as const, alignItems: 'center' as const,
      justifyContent: 'center' as const, borderRadius: '6px'
    },
    eventDot: (type: string) => ({
      display: 'flex' as const, alignItems: 'center' as const, gap: '4px',
      padding: '2px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: 500,
      marginBottom: '2px', whiteSpace: 'nowrap' as const, overflow: 'hidden' as const,
      textOverflow: 'ellipsis' as const,
      background: type === 'meeting' ? '#e8e8ff' : type === 'call' ? '#fff8e0' : '#d0ffe8',
      color: type === 'meeting' ? '#6c5ce7' : type === 'call' ? '#b8860b' : '#006c50'
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
        <div style={{ ...s.dayNumber, background: isToday ? 'var(--accent-gradient)' : 'transparent', color: isToday ? 'white' : 'var(--text-secondary)' }}>
          {d}
        </div>
        {dayEvents.slice(0, 3).map(ev => (
          <div key={ev.id} style={s.eventDot(ev.type)} title={ev.subject}>
            {ev.type === 'meeting' ? <Phone size={9} /> : ev.type === 'call' ? <Phone size={9} /> : <CheckSquare size={9} />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.subject}</span>
          </div>
        ))}
        {dayEvents.length > 3 && (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', paddingLeft: '5px' }}>+{dayEvents.length - 3} more</div>
        )}
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={s.navBtn} onClick={prevMonth}><ChevronLeft size={18} /></button>
          <h2 style={s.monthTitle}>{monthName} {year}</h2>
          <button style={s.navBtn} onClick={nextMonth}><ChevronRight size={18} /></button>
        </div>
        <button className="clay-btn clay-btn-primary" onClick={() => { setSelectedDate(today); setForm(f => ({ ...f, due_date: today })); setShowCreate(true); }}>
          <Plus size={16} /> Add Event
        </button>
      </div>

      {loading ? (
        <div className="clay-skeleton" style={{ height: '500px', borderRadius: 'var(--radius-lg)' }} />
      ) : (
        <>
          <div style={s.calendarGrid}>
            {dayNames.map(d => <div key={d} style={s.dayHeader}>{d}</div>)}
            {days}
          </div>

          {/* Selected date events list */}
          {selectedDate && !showCreate && (
            <div className="clay-card" style={{ marginTop: '20px', padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
                  Events for {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <button className="clay-btn clay-btn-sm clay-btn-primary" onClick={() => setShowCreate(true)}>
                  <Plus size={12} /> Add
                </button>
              </div>
              {(eventsByDate[selectedDate] || []).length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0' }}>No events on this day</div>
              ) : (
                (eventsByDate[selectedDate] || []).map(ev => (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: ev.type === 'meeting' ? '#e8e8ff' : ev.type === 'call' ? '#fff8e0' : '#d0ffe8' }}>
                      {ev.type === 'meeting' || ev.type === 'call' ? <Phone size={14} color="#6c5ce7" /> : <CheckSquare size={14} color="#00b894" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{ev.subject}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {ev.contact_name && <span><User size={10} /> {ev.contact_name}</span>}
                        {ev.status && <span> · {ev.status}</span>}
                      </div>
                    </div>
                    <span className="clay-tag">{ev.type}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletingIdRef.current = ev.id; setConfirmOpen(true); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: '4px', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLElement).style.background = 'var(--danger-bg)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Create event modal */}
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
