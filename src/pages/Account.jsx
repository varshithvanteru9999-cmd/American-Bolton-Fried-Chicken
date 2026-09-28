import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Receipt, MapPin, CreditCard, ChevronDown, Trash2, Mail, Plus, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import formatPrice from '../utils/formatPrice';
import { confirmAction, toast } from '../utils/alerts';
import './Account.css';

const SECTIONS = [
  { id: 'profile', label: 'Profile', Icon: User },
  { id: 'reorder', label: 'Reorder', Icon: Receipt },
  { id: 'address', label: 'Address Book', Icon: MapPin },
  { id: 'cards', label: 'Saved Cards', Icon: CreditCard },
];

const load = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback)); } catch { return fallback; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

const Account = () => {
  const navigate = useNavigate();
  const { user, orderHistory, addToCart, contactInfo, saveContactInfo, signOut, requestLogin } = useCart();
  const [section, setSection] = useState('profile');
  const [moreOpen, setMoreOpen] = useState(false);

  const nameParts = (user?.name || contactInfo?.name || '').trim().split(/\s+/);
  const [first, setFirst] = useState(nameParts[0] || '');
  const [last, setLast] = useState(nameParts.slice(1).join(' '));
  const [phone, setPhone] = useState(contactInfo?.phone || '');
  const [prefs, setPrefs] = useState(() => load('ms-marketing', { email: true, sms: false }));
  const [addresses, setAddresses] = useState(() => load('ms-addresses', []));
  const [newAddr, setNewAddr] = useState('');
  const [adding, setAdding] = useState(false);

  if (!user) {
    return (
      <div className="account-page">
        <div className="account-signin">
          <User size={42} />
          <h2>Sign in to view your account</h2>
          <p>Access your profile, orders and saved addresses.</p>
          <button onClick={requestLogin}>Sign in</button>
        </div>
      </div>
    );
  }

  const email = user.email || contactInfo?.email || '';
  const phoneValid = !phone.trim() || /^[+\d][\d\s-]{6,}$/.test(phone.trim());

  const togglePref = (k) => setPrefs(p => { const n = { ...p, [k]: !p[k] }; save('ms-marketing', n); return n; });
  const saveProfile = () => {
    if (!phoneValid) return;
    saveContactInfo({ name: `${first} ${last}`.trim(), email, phone: phone.trim() });
    toast('Profile updated');
  };
  const addAddress = () => {
    const a = newAddr.trim();
    if (!a) return;
    const next = [...addresses, a];
    setAddresses(next); save('ms-addresses', next);
    setNewAddr(''); setAdding(false); toast('Address added');
  };
  const removeAddress = async (i) => {
    const ok = await confirmAction({ title: 'Remove address?', confirmText: 'Remove', danger: true });
    if (!ok) return;
    const next = addresses.filter((_, j) => j !== i);
    setAddresses(next); save('ms-addresses', next); toast('Address removed');
  };
  const reorderItems = (() => {
    const byId = {};
    (orderHistory || []).forEach(o => o.items?.forEach(it => { if (!byId[it.id]) byId[it.id] = it; }));
    return Object.values(byId);
  })();
  return (
    <div className="account-page">
      <div className="account-grid">
        {/* LEFT: profile sidebar */}
        <aside className="account-side">
          <div className="account-user">
            <strong>{(user.name || 'Guest').toUpperCase()}</strong>
            <span>{email || '—'}</span>
            {!phone && <button className="account-addphone" onClick={() => setSection('profile')}>Add Phone Number</button>}
          </div>

          <nav className="account-nav">
            {SECTIONS.map(({ id, label, Icon }) => (
              <button key={id} className={`account-nav-item ${section === id ? 'active' : ''}`} onClick={() => setSection(id)}>
                <Icon size={20} /> {label}
              </button>
            ))}
          </nav>

          <div className="account-more">
            <button className="account-more-head" onClick={() => setMoreOpen(o => !o)}>
              <span>••• More</span>
              <ChevronDown size={18} className={moreOpen ? 'open' : ''} />
            </button>
            {moreOpen && (
              <div className="account-more-body">
                <button onClick={() => navigate('/about')}>About</button>
                <button onClick={() => navigate('/review')}>Reviews</button>
                <button className="account-signout" onClick={() => { signOut(); navigate('/'); }}><LogOut size={15} /> Sign out</button>
              </div>
            )}
          </div>

          <p className="account-version">12.5 (0603R1)</p>
        </aside>

        {/* RIGHT: section content */}
        <main className="account-main">
          {section === 'profile' && (
            <>
              <div className="account-card">
                <h2 className="account-card-title">ACCOUNT</h2>
                <div className="account-fields">
                  <label className="account-field">
                    <span>First Name</span>
                    <input value={first} onChange={e => setFirst(e.target.value)} />
                  </label>
                  <label className="account-field">
                    <span>Last Name</span>
                    <input value={last} onChange={e => setLast(e.target.value)} />
                  </label>
                  <label className={`account-field ${!phoneValid ? 'invalid' : ''}`}>
                    <span>Phone no</span>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone no" />
                    {!phoneValid && <em className="account-err">Invalid phone number.</em>}
                  </label>
                  <label className="account-field">
                    <span>Email</span>
                    <input value={email} readOnly />
                  </label>
                </div>
                <button className="account-save" onClick={saveProfile}>Save Changes</button>
              </div>

              <p className="account-section-head">RECEIVE OFFERS FROM AMERICAN FRIED CHICKEN THROUGH</p>
              <div className="account-prefs">
                <label className={`account-check ${prefs.email ? 'on' : ''}`}>
                  <input type="checkbox" checked={prefs.email} onChange={() => togglePref('email')} /> Email
                </label>
              </div>

              <div className="account-advanced">
                <h3>ADVANCE OPTIONS</h3>
                <button className="account-adv-row" onClick={() => toast('Your data export will be emailed to you.')}>
                  <span>Export My Data</span> <Mail size={18} />
                </button>
                <button className="account-adv-row danger" onClick={async () => {
                  const ok = await confirmAction({ title: 'Delete account?', text: 'This permanently removes your account and data.', confirmText: 'Delete', danger: true });
                  if (ok) { signOut(); navigate('/'); toast('Account deletion requested'); }
                }}>
                  <span>Delete Account</span> <Trash2 size={18} />
                </button>
              </div>
            </>
          )}

          {section === 'reorder' && (
            <div className="account-card">
              <h2 className="account-card-title">REORDER</h2>
              {reorderItems.length === 0 ? (
                <p className="account-empty">You haven't ordered anything yet.</p>
              ) : (
                <div className="account-reorder">
                  {reorderItems.map(item => (
                    <div key={item.id} className="account-reorder-row">
                      {item.image && <img src={item.image} alt={item.title} loading="lazy" />}
                      <div className="account-reorder-info"><strong>{item.title}</strong><span>{formatPrice(item.price)}</span></div>
                      <button className="account-reorder-add" onClick={() => { addToCart(item); toast('Added to basket'); }}><Plus size={16} /> Add</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === 'address' && (
            <div className="account-card">
              <div className="account-card-head">
                <h2 className="account-card-title">ADDRESS BOOK</h2>
                <button className="account-link" onClick={() => setAdding(a => !a)}><Plus size={15} /> Add Address</button>
              </div>
              {adding && (
                <div className="account-addr-form">
                  <input autoFocus placeholder="Enter full address" value={newAddr}
                    onChange={e => setNewAddr(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAddress()} />
                  <button onClick={addAddress}>Save</button>
                </div>
              )}
              {addresses.length === 0 && !adding ? (
                <p className="account-empty">No saved addresses yet.</p>
              ) : (
                addresses.map((a, i) => (
                  <div key={i} className="account-addr-row">
                    <span>{a}</span>
                    <button className="account-addr-del" onClick={() => removeAddress(i)} aria-label="Remove"><Trash2 size={18} /></button>
                  </div>
                ))
              )}
            </div>
          )}

          {section === 'cards' && (
            <div className="account-card">
              <h2 className="account-card-title">SAVED CARDS</h2>
              <p className="account-empty">No saved cards. Cards are entered securely at checkout via our payment provider.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Account;
