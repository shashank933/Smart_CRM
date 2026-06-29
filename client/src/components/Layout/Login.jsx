import React, { useState } from 'react';
import { useStore } from '../../store/store';
import { Brain, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('demo@smartcrm.com');
  const [password, setPassword] = useState('demo123');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useStore(s => s.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        useStore.setState({ user: data.user, isAuthenticated: true });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5',
      padding: '20px'
    },
    card: {
      width: '100%',
      maxWidth: '400px',
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      padding: '48px 40px',
      textAlign: 'center'
    },
    title: {
      fontSize: '26px',
      fontWeight: 700,
      color: '#1a202c',
      marginBottom: '6px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#a0aec0',
      marginBottom: '32px'
    },
    inputWrap: {
      position: 'relative',
      marginBottom: '14px'
    },
    inputIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#a0aec0',
      pointerEvents: 'none'
    },
    input: {
      width: '100%',
      padding: '10px 14px 10px 36px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
      color: '#1a202c',
      background: '#ffffff',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.15s ease'
    },
    button: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: 'none',
      background: 'linear-gradient(135deg, #6C5CE7, #a347ba)',
      color: '#ffffff',
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '6px',
      opacity: 1,
      transition: 'opacity 0.15s ease'
    },
    buttonDisabled: {
      opacity: 0.6
    },
    error: {
      background: '#fff5f5',
      border: '1px solid #fed7d7',
      color: '#c53030',
      padding: '10px 14px',
      borderRadius: '6px',
      marginBottom: '16px',
      fontSize: '13px',
      fontWeight: 500
    },
    footer: {
      marginTop: '24px',
      fontSize: '13px',
      color: '#a0aec0'
    },
    link: {
      color: '#6C5CE7',
      cursor: 'pointer',
      fontWeight: 600,
      background: 'none',
      border: 'none',
      fontFamily: 'inherit',
      fontSize: '13px',
      padding: 0,
      textDecoration: 'none'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Brain size={40} color="#6C5CE7" style={{ marginBottom: '20px' }} />
        <h1 style={styles.title}>Smart CRM</h1>
        <p style={styles.subtitle}>AI-powered customer relationship management</p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={styles.error}>{error}</div>
          )}
          {isRegister && (
            <div style={styles.inputWrap}>
              <User size={16} style={styles.inputIcon} />
              <input
                style={styles.input}
                type="text"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                required={isRegister}
                onFocus={e => e.target.style.borderColor = '#6C5CE7'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          )}
          <div style={styles.inputWrap}>
            <Mail size={16} style={styles.inputIcon} />
            <input
              style={styles.input}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              onFocus={e => e.target.style.borderColor = '#6C5CE7'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div style={styles.inputWrap}>
            <Lock size={16} style={styles.inputIcon} />
            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              onFocus={e => e.target.style.borderColor = '#6C5CE7'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <button
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={styles.footer}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button
            style={styles.link}
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
            onMouseLeave={e => e.target.style.textDecoration = 'none'}
          >
            {isRegister ? 'Sign In' : 'Create one'}
          </button>
        </div>
      </div>
    </div>
  );
}
