import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import {
  ADMIN_LOGIN_EMAIL, ADMIN_LOGIN_PASSWORD, startAdminSession, isAdminEmail, isAdminSession,
} from '../admin/adminConfig';
import './Admin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Already logged in → go straight to the dashboard
  if (isAdminSession()) {
    navigate('/admin', { replace: true });
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const em = email.trim().toLowerCase();

    // 1) Try real Firebase email/password auth (secure — also unlocks Firestore data)
    if (isFirebaseConfigured && auth) {
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        if (isAdminEmail(em)) { startAdminSession(); navigate('/admin'); return; }
        setError('This account does not have admin access.');
        setBusy(false);
        return;
      } catch {
        // fall through to the local credential check
      }
    }

    // 2) Fallback: local credential check (from .env)
    if (em === ADMIN_LOGIN_EMAIL && ADMIN_LOGIN_PASSWORD && password === ADMIN_LOGIN_PASSWORD) {
      startAdminSession();
      navigate('/admin');
      return;
    }

    setError('Invalid email or password.');
    setBusy(false);
  };

  return (
    <div className="adminlogin-page">
      <form className="adminlogin-card" onSubmit={submit}>
        <div className="adminlogin-logo">
          <img src="/Logo.png" alt="American Fried Chicken" />
        </div>
        <p className="adminlogin-brand">AMERICAN FRIED CHICKEN</p>
        <span className="adminlogin-badge">ADMIN ACCESS</span>

        <label className="adminlogin-label" htmlFor="admin-email">Email or Mobile Number</label>
        <input
          id="admin-email"
          className="adminlogin-input"
          type="text"
          autoFocus
          placeholder="Enter admin email or mobile number"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <label className="adminlogin-label" htmlFor="admin-pass">Password</label>
        <input
          id="admin-pass"
          className="adminlogin-input"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {error && <p className="adminlogin-error">{error}</p>}

        <button type="submit" className="adminlogin-btn" disabled={busy}>
          {busy ? 'SIGNING IN…' : 'SIGN IN'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
