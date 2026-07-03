import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/store';
import { api } from '../../api';
import { User, Mail, Shield, Calendar, Key, Save, Trash2, AlertTriangle, Check, X, Eye, EyeOff, ArrowLeft, Lock } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const user = useStore(s => s.user);
  const setUser = useStore(s => s.setUser);
  const logout = useStore(s => s.logout);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const userInitials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          current_password: newPassword ? currentPassword : undefined,
          new_password: newPassword || undefined
        })
      });
      setUser(updated);
      setCurrentPassword('');
      setNewPassword('');
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Failed to update profile' });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteLoading(true);
    try {
      await api.deleteAccount();
      logout();
      navigate('/login');
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete account' });
    }
    setDeleteLoading(false);
  };

  const s = {
    container: { maxWidth: '640px', margin: '0 auto' },
    card: {
      background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '28px',
      boxShadow: 'var(--clay-shadow)', border: '1px solid rgba(255,255,255,0.6)',
      marginBottom: '20px'
    },
    avatar: {
      width: '72px', height: '72px', borderRadius: 'var(--radius-lg)',
      background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '28px', fontWeight: 800, color: 'white',
      boxShadow: '8px 8px 16px rgba(99,102,241,0.3)', marginBottom: '20px'
    },
    formGroup: { marginBottom: '18px' },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' },
    inputRow: { position: 'relative' as const },
    pwToggle: {
      position: 'absolute' as const, right: '12px', top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
      padding: '4px'
    },
    dangerZone: {
      background: 'linear-gradient(135deg, #e4e4e7, #d4d4d8)',
      borderRadius: 'var(--radius-lg)', padding: '24px',
      border: '1px solid rgba(113,113,122,0.2)', marginBottom: '20px'
    },
    alert: (type: 'success' | 'error') => ({
      padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px',
      fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px',
      background: type === 'success' ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #e4e4e7, #d4d4d8)',
      color: type === 'success' ? 'var(--accent-dark)' : '#3f3f46'
    }),
    infoRow: {
      display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0',
      fontSize: '13px', color: 'var(--text-secondary)'
    }
  };

  return (
    <div style={s.container}>
      <button className="clay-btn clay-btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: '16px' }}>
        <ArrowLeft size={14} /> Back
      </button>

      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>My Profile</h1>

      {/* Account info card */}
      <div style={s.card}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={s.avatar}>{userInitials}</div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{user?.name}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user?.email}</div>
          <span className="clay-badge clay-badge-accent" style={{ marginTop: '8px' }}>{user?.role || 'User'}</span>
        </div>

        <div className="clay-divider" />

        <div style={s.infoRow}><User size={14} /> <strong>Account ID:</strong> <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.id}</code></div>
      </div>

      {/* Edit profile card */}
      <div style={s.card}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} /> Edit Profile
        </h2>

        {message && (
          <div style={s.alert(message.type)}>
            {message.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={s.formGroup}>
            <label style={s.label}>Full Name</label>
            <div style={s.inputRow}>
              <User size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
              <input className="clay-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ paddingLeft: '38px' }} />
            </div>
          </div>

          <div style={s.formGroup}>
            <label style={s.label}>Email</label>
            <div style={s.inputRow}>
              <Mail size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
              <input className="clay-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{ paddingLeft: '38px' }} />
            </div>
          </div>

          <div className="clay-divider" />

          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <Lock size={14} /> Change Password
          </h3>

          <div style={s.formGroup}>
            <label style={s.label}>Current Password</label>
            <div style={s.inputRow}>
              <Key size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
              <input className="clay-input" type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" style={{ paddingLeft: '38px', paddingRight: '38px' }} />
              <button type="button" style={s.pwToggle} onClick={() => setShowCurrentPw(!showCurrentPw)}>
                {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div style={s.formGroup}>
            <label style={s.label}>New Password</label>
            <div style={s.inputRow}>
              <Key size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
              <input className="clay-input" type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" style={{ paddingLeft: '38px', paddingRight: '38px' }} />
              <button type="button" style={s.pwToggle} onClick={() => setShowNewPw(!showNewPw)}>
                {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button className="clay-btn clay-btn-primary" type="submit" disabled={saving || !name.trim()} style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px' }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div style={s.dangerZone}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} /> Danger Zone
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Once you delete your account, there is no going back. All your data will be permanently removed.
        </p>

        {!showDeleteConfirm ? (
          <button className="clay-btn clay-btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={14} /> Delete My Account
          </button>
        ) : (
          <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--clay-shadow-inset)' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--danger)' }}>
              Type DELETE to confirm:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input className="clay-input" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE" style={{ flex: 1 }} autoFocus />
              <button className="clay-btn clay-btn-danger" onClick={handleDelete} disabled={deleteConfirmText !== 'DELETE' || deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Confirm'}
              </button>
              <button className="clay-btn" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}>
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
