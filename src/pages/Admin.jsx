import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, CreditCard, UtensilsCrossed, Users, Tag,
  Settings as SettingsIcon, LogOut, ChevronLeft, ChevronRight, Check, X, Pencil,
  Download, Trash2, CalendarCheck, Search, RotateCcw, MapPin, Navigation, Plus, Menu as MenuIcon,
  Eye, EyeOff, Bell, BellOff, Calculator, Banknote, Camera, Image as ImageIcon,
  Percent, Save, SlidersHorizontal,
} from 'lucide-react';
import { collection, getDocs, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { useCart } from '../context/CartContext';
import { isAdminSession, endAdminSession, ADMIN_LOGIN_EMAIL } from '../admin/adminConfig';
import formatPrice from '../utils/formatPrice';
import { printInvoice } from '../utils/invoice';
import { confirmAction, toast } from '../utils/alerts';
import { installApp, isStandalone } from '../utils/pwa';
import { enableAdminPush } from '../utils/push';
import './Admin.css';

const NAV_GROUPS = [
  {
    title: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
      { id: 'orders', label: 'Total Orders', Icon: Receipt },
    ],
  },
  {
    title: 'Manage',
    items: [
      { id: 'billing', label: 'Billing', Icon: Calculator },
      { id: 'menu', label: 'Menu', Icon: UtensilsCrossed },
      { id: 'customers', label: 'Customers', Icon: Users },
      { id: 'discounts', label: 'Discounts', Icon: Tag },
    ],
  },
];

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useCart();
  const [section, setSection] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const go = (id) => { setSection(id); setMobileNavOpen(false); };

  // PWA install ("Download app") — uses the admin manifest active on /admin.
  const standalone = isStandalone();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const admin = isAdminSession();
  const adminName = (user?.name) || ADMIN_LOGIN_EMAIL.split('@')[0];
  // Signed in via the local .env password (no Firebase token) → Firestore
  // reads will be denied until a real Firebase admin user signs in.
  const onLocalFallback = isFirebaseConfigured && !user;

  // New-order alerts (beep + notification) toggle, remembered.
  const [alertsOn, setAlertsOn] = useState(() => {
    try { return localStorage.getItem('ms-admin-alerts') !== 'off'; } catch { return true; }
  });
  const alertsRef = useRef(alertsOn);
  alertsRef.current = alertsOn;

  // Unlock the beep sound on the first interaction (autoplay policy).
  useEffect(() => {
    const onceUnlock = () => unlockAudio();
    window.addEventListener('pointerdown', onceUnlock, { once: true });
    window.addEventListener('keydown', onceUnlock, { once: true });
    if (alertsOn && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        enableAdminPush().catch(() => {}); // re-subscribe for background push
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => { if (p === 'granted') enableAdminPush().catch(() => {}); }).catch(() => {});
      }
    }
    return () => {
      window.removeEventListener('pointerdown', onceUnlock);
      window.removeEventListener('keydown', onceUnlock);
    };
  }, [alertsOn]);

  const notifyNewOrder = (n) => {
    if (!alertsRef.current) return;
    playBeep();
    const msg = n > 1 ? `${n} new orders received` : 'New order received';
    toast(msg, 'success');
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('American Fried Chicken', { body: msg, icon: '/icon-192.png', tag: 'afc-order' }); } catch { /* ignore */ }
    }
  };

  const toggleAlerts = () => {
    const next = !alertsOn;
    setAlertsOn(next);
    try { localStorage.setItem('ms-admin-alerts', next ? 'on' : 'off'); } catch { /* ignore */ }
    if (next) {
      unlockAudio();
      playBeep(); // confirm sound works
      enableAdminPush().then(ok => {
        toast(ok ? 'Order alerts on (incl. when app is closed)' : 'Alerts on — allow notifications for closed-app alerts', ok ? 'success' : 'info');
      }).catch(() => toast('Order alerts on'));
    } else {
      toast('Order alerts off', 'info');
    }
  };

  useEffect(() => {
    if (!admin || !isFirebaseConfigured || !db) { setLoading(false); return; }
    setLoadError('');
    getDocs(collection(db, 'users'))
      .then(snap => setCustomers(snap.docs.map(d => ({ uid: d.id, ...d.data() }))))
      .catch(() => {});
    // Real-time orders: beep + notify whenever a new order is added.
    let initialised = false;
    const unsub = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const all = snap.docs.map(d => {
          const data = d.data();
          return {
            ...data,
            id: data.id ?? d.id,
            customerName: data.customerName || '—',
            customerEmail: data.email || '',
            amountPaid: data.amountPaid || 0,
            status: data.status || 'PENDING',
          };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
        setOrders(all);
        setLoading(false);
        if (initialised) {
          const added = snap.docChanges().filter(c => c.type === 'added').length;
          if (added > 0) notifyNewOrder(added);
        }
        initialised = true;
      },
      (e) => { setLoadError(e?.message || 'Failed to load admin data.'); setLoading(false); },
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  if (!admin) return <Navigate to="/admin/login" replace />;

  const logout = () => { endAdminSession(); navigate('/admin/login', { replace: true }); };

  // --- Order actions (optimistic + best-effort Firestore write) ---
  const setStatus = (order, status) => {
    setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status } : o)));
    if (db) {
      updateDoc(doc(db, 'orders', String(order.id)), { status })
        .catch(e => console.warn('status update failed:', e?.message));
      if (order.uid) {
        updateDoc(doc(db, 'users', order.uid, 'orders', String(order.id)), { status }).catch(() => {});
      }
    }
  };
  const removeOrder = async (order) => {
    const ok = await confirmAction({ title: 'Delete this order?', text: 'This cannot be undone.', confirmText: 'Delete', danger: true });
    if (!ok) return;
    setOrders(prev => prev.filter(o => o.id !== order.id));
    if (db) {
      deleteDoc(doc(db, 'orders', String(order.id)))
        .catch(e => console.warn('delete failed:', e?.message));
      if (order.uid) {
        deleteDoc(doc(db, 'users', order.uid, 'orders', String(order.id))).catch(() => {});
      }
    }
    toast('Order deleted');
  };

  // Upload a photo of the packed order (any image format) and save it on the order.
  const uploadOrderPhoto = async (order, file) => {
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file, 640);
      setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, packedPhoto: dataUrl } : o)));
      if (db) {
        updateDoc(doc(db, 'orders', String(order.id)), { packedPhoto: dataUrl })
          .catch(e => console.warn('photo save failed:', e?.message));
        if (order.uid) {
          updateDoc(doc(db, 'users', order.uid, 'orders', String(order.id)), { packedPhoto: dataUrl }).catch(() => {});
        }
      }
      toast('Packed photo uploaded');
    } catch { toast('Could not read that image', 'error'); }
  };
  // Remove the packed photo from an order.
  const deleteOrderPhoto = (order) => {
    setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, packedPhoto: '' } : o)));
    if (db) {
      updateDoc(doc(db, 'orders', String(order.id)), { packedPhoto: '' })
        .catch(e => console.warn('photo delete failed:', e?.message));
      if (order.uid) {
        updateDoc(doc(db, 'users', order.uid, 'orders', String(order.id)), { packedPhoto: '' }).catch(() => {});
      }
    }
    toast('Photo deleted');
  };

  // Reject an order (e.g. an item is out of stock).
  // NOTE: refund-on-reject is deferred until the payment gateway is integrated.
  const rejectOrder = async (order) => {
    const ok = await confirmAction({ title: 'Reject this order?', confirmText: 'Reject', danger: true });
    if (!ok) return;
    setStatus(order, 'REJECTED');
    toast('Order rejected', 'info');
    // TODO(payment-gateway): when a real gateway is integrated, refund `PAID`
    // orders here (e.g. stripe.refunds.create({ payment_intent })) and set
    // paymentStatus: 'REFUNDED' once the refund succeeds.
  };

  // Dashboard view: only today's orders + pre-orders (no past orders)
  const dashboardOrders = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    return orders.filter(o => o.isPreOrder || new Date(o.date) >= todayStart);
  }, [orders]);

  // Orders within the selected From/To date range (inclusive)
  const filteredOrders = useMemo(() => {
    const fromTs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTs = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;
    return orders.filter(o => {
      const t = new Date(o.date).getTime();
      if (fromTs !== null && t < fromTs) return false;
      if (toTs !== null && t > toTs) return false;
      return true;
    });
  }, [orders, fromDate, toDate]);

  const stats = useMemo(() => {
    const revenue = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);
    const collected = filteredOrders.reduce((s, o) => s + (o.amountPaid || 0), 0);
    // Count unique customers who actually ordered (deduped by email/phone),
    // since most order as guests and aren't in the `users` collection.
    const keys = new Set();
    filteredOrders.forEach(o => {
      const k = (o.email || o.phone || o.uid || o.customerName || '').toString().trim().toLowerCase();
      if (k) keys.add(k);
    });
    return {
      orders: filteredOrders.length,
      customers: keys.size,
      revenue, collected, outstanding: revenue - collected,
    };
  }, [filteredOrders]);

  const sectionLabel = NAV_GROUPS.flatMap(g => g.items).find(i => i.id === section)?.label || 'Dashboard';

  return (
    <div className={`adm ${collapsed ? 'adm-collapsed' : ''} ${mobileNavOpen ? 'adm-mobile-open' : ''}`}>
      {mobileNavOpen && <div className="adm-backdrop" onClick={() => setMobileNavOpen(false)} />}
      {/* Sidebar */}
      <aside className="adm-side">
        <div className="adm-brand">
          <img src="/Logo.png" alt="logo" />
          <div className="adm-brand-text">
            <strong>AMERICAN FRIED CHICKEN</strong>
            <span>ADMIN PANEL</span>
          </div>
          <button
            className="adm-collapse"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        <nav className="adm-nav">
          {NAV_GROUPS.map(group => (
            <div key={group.title} className="adm-nav-group">
              <span className="adm-nav-title">{group.title}</span>
              {group.items.map(({ id, label, Icon }) => (
                <button key={id} className={`adm-nav-item ${section === id ? 'active' : ''}`} onClick={() => go(id)}>
                  <Icon size={18} /> <span>{label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="adm-side-foot">
          <button className={`adm-nav-item ${section === 'settings' ? 'active' : ''}`} onClick={() => go('settings')}>
            <SettingsIcon size={18} /> <span>Settings</span>
          </button>
          <button className="adm-nav-item adm-logout" onClick={logout}>
            <LogOut size={18} /> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="adm-main">
        <header className="adm-top">
          <button className="adm-hamburger" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
            <MenuIcon size={22} />
          </button>
          <div className="adm-top-title">
            <h1>{sectionLabel}</h1>
            <p>Welcome back, {adminName}</p>
          </div>
          <div className="adm-top-right">
            <button
              className={`adm-bell-btn ${alertsOn ? 'on' : ''}`}
              onClick={toggleAlerts}
              title={alertsOn ? 'Order alerts on (tap to mute)' : 'Order alerts off (tap to enable)'}
            >
              {alertsOn ? <Bell size={16} /> : <BellOff size={16} />}
            </button>
            {!standalone && (
              <button className="adm-install-btn" onClick={installApp} title="Install / download the app">
                <Download size={16} /> <span className="adm-install-label">Install app</span>
              </button>
            )}
            <span className="adm-live"><span className="adm-dot"></span> Live</span>
            <span className="adm-location">American Fried Chicken · Bolton</span>
            <span className="adm-userchip">
              <span className="adm-avatar">{adminName.charAt(0).toUpperCase()}</span>
              {adminName}
            </span>
          </div>
        </header>

        <div className="adm-body">
          {!isFirebaseConfigured && <div className="adm-note">Firebase isn't configured — live data is unavailable.</div>}
          {loadError && (
            <div className="adm-err">
              {loadError}
              {onLocalFallback ? (
                <span className="adm-err-hint">
                  You're signed in with the local password, so there's no Firebase token for Firestore to authorise.
                  Enable <strong>Authentication → Email/Password</strong> in Firebase and add the user
                  <strong> {ADMIN_LOGIN_EMAIL}</strong>, then sign in again — the dashboard will read live orders.
                </span>
              ) : (
                <span className="adm-err-hint">
                  Publish the Firestore admin rules from <strong>docs/AUTH_SETUP.md</strong> so this admin
                  email is allowed to read orders and customers.
                </span>
              )}
            </div>
          )}

          {(section === 'dashboard' || section === 'orders') && (
            <>
              {section === 'orders' && (
                <div className="adm-stats adm-stats-3">
                  <StatCard icon={<Users size={22} />} value={stats.customers} label="TOTAL CUSTOMERS" />
                  <StatCard icon={<CalendarCheck size={22} />} value={stats.orders} label="TOTAL ORDERS" />
                  <StatCard icon={<CreditCard size={22} />} value={formatPrice(stats.revenue)} label="TOTAL REVENUE" />
                </div>
              )}
              <div className="adm-panel">
                <div className="adm-panel-head">
                  <h2 className="adm-panel-title">{section === 'dashboard' ? "Today's Orders & Pre-orders" : 'All Orders'}</h2>
                  {section === 'orders' && (
                    <div className="adm-filterbar">
                      <label>From <input type="date" value={fromDate} max={toDate || undefined} onChange={e => setFromDate(e.target.value)} /></label>
                      <label>To <input type="date" value={toDate} min={fromDate || undefined} onChange={e => setToDate(e.target.value)} /></label>
                      {(fromDate || toDate) && (
                        <button className="adm-filter-clear" onClick={() => { setFromDate(''); setToDate(''); }}>Clear</button>
                      )}
                    </div>
                  )}
                </div>
                <OrdersTable
                  orders={section === 'dashboard' ? dashboardOrders : filteredOrders}
                  loading={loading}
                  onConfirm={o => { setStatus(o, 'CONFIRMED'); toast('Order accepted'); }}
                  onReject={rejectOrder}
                  onDelete={removeOrder}
                  onUploadPhoto={uploadOrderPhoto}
                  onDeletePhoto={deleteOrderPhoto}
                />
              </div>
            </>
          )}

          {section === 'customers' && <CustomersTable customers={customers} orders={orders} loading={loading} />}
          {section === 'billing' && <BillingManager />}
          {section === 'menu' && <MenuManager />}
          {section === 'discounts' && <DiscountsManager />}
          {section === 'settings' && (
            <div className="adm-panel adm-empty">Settings — coming soon.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ───────────────────────── Discounts / Promo codes ─────────────────────────
const couponStatus = (c) => {
  if (c.active === false) return 'disabled';
  if (c.expiry && new Date(c.expiry) < new Date(new Date().toDateString())) return 'expired';
  return 'active';
};
const EMPTY_COUPON = { code: '', description: '', type: 'percent', value: '', minOrder: '', maxCap: '', expiry: '', maxUses: '', active: true };

const DiscountsManager = () => {
  const { coupons, saveCoupon, deleteCoupon } = useCart();
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_COUPON);

  const openNew = () => { setForm(EMPTY_COUPON); setEditingId(null); setView('form'); };
  const openEdit = (c) => {
    setForm({
      code: c.code || '', description: c.description || '', type: c.type || 'percent',
      value: String(c.value ?? ''), minOrder: String(c.minOrder || ''), maxCap: String(c.maxCap || ''),
      expiry: c.expiry || '', maxUses: String(c.maxUses || ''), active: c.active !== false,
    });
    setEditingId(c.id);
    setView('form');
  };
  const cancelForm = () => setView('list');
  const submit = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code || form.value === '') return;
    await saveCoupon({
      id: editingId || undefined,
      code,
      description: form.description.trim(),
      type: form.type,
      value: Number(form.value) || 0,
      minOrder: Number(form.minOrder) || 0,
      maxCap: Number(form.maxCap) || 0,
      expiry: form.expiry || '',
      maxUses: Number(form.maxUses) || 0,
      uses: editingId ? (coupons.find(c => c.id === editingId)?.uses || 0) : 0,
      active: editingId ? !!form.active : true,
    });
    setView('list');
    toast(editingId ? 'Promo code updated' : 'Promo code created');
  };
  const toggleActive = (c) => saveCoupon({ ...c, active: c.active === false });
  const remove = async (c) => {
    const ok = await confirmAction({ title: 'Delete promo code?', text: `"${c.code}" will be removed.`, confirmText: 'Delete', danger: true });
    if (!ok) return;
    deleteCoupon(c.id);
    toast('Promo code deleted');
  };

  const fmtDiscount = (c) => (c.type === 'percent' ? `${Number(c.value).toFixed(2)}%` : formatPrice(c.value));
  const sorted = [...(coupons || [])].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  const isPercent = form.type === 'percent';

  // ── New / Edit form (full panel) ─────────────────────────────────────────
  if (view === 'form') {
    return (
      <div className="adm-panel cpn-form">
        <section className="cpn-section">
          <h3 className="cpn-section-head"><Tag size={15} /> PROMO CODE DETAILS</h3>
          <div className="cpn-grid one">
            <label className="cpn-field">
              <span>CODE <em>(AUTO-UPPERCASED)</em></span>
              <input autoFocus value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="E.G. WELCOME20" />
            </label>
            <label className="cpn-field">
              <span>DESCRIPTION <em>(OPTIONAL)</em></span>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. 20% off for new customers" />
            </label>
          </div>
        </section>

        <section className="cpn-section">
          <h3 className="cpn-section-head"><Percent size={15} /> DISCOUNT SETTINGS</h3>
          <div className="cpn-grid">
            <label className="cpn-field">
              <span>DISCOUNT TYPE</span>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Fixed amount (£)</option>
              </select>
            </label>
            <label className="cpn-field">
              <span>{isPercent ? 'DISCOUNT %' : 'DISCOUNT AMOUNT (£)'}</span>
              <input type="number" step="0.01" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="e.g. 20" />
            </label>
          </div>
        </section>

        <section className="cpn-section">
          <h3 className="cpn-section-head"><SlidersHorizontal size={15} /> LIMITS &amp; VALIDITY</h3>
          <div className="cpn-grid">
            <label className="cpn-field">
              <span>MIN ORDER AMOUNT (£)</span>
              <input type="number" step="0.01" min="0" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} placeholder="0" />
            </label>
            <label className="cpn-field">
              <span>MAX DISCOUNT CAP (£) <em>% only</em></span>
              <input type="number" step="0.01" min="0" value={form.maxCap} disabled={!isPercent}
                onChange={e => setForm(f => ({ ...f, maxCap: e.target.value }))} placeholder="Leave blank = no cap" />
            </label>
            <label className="cpn-field">
              <span>MAX USES <em>(blank = unlimited)</em></span>
              <input type="number" step="1" min="0" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Unlimited" />
            </label>
            <label className="cpn-field">
              <span>VALID UNTIL <em>(blank = never)</em></span>
              <input type="date" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))} />
            </label>
          </div>
        </section>

        <div className="cpn-form-actions">
          <button className="adm-btn-ghost" onClick={cancelForm}>Cancel</button>
          <button className="adm-btn-primary" onClick={submit} disabled={!form.code.trim() || form.value === ''}>
            <Save size={15} /> SAVE CODE
          </button>
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="adm-panel">
      <div className="adm-cat-head">
        <h2 className="adm-panel-title"><Tag size={18} /> Promo Codes &amp; Discounts</h2>
        <button className="adm-add-btn primary" onClick={openNew}><Plus size={15} /> New Promo Code</button>
      </div>

      {sorted.length === 0 ? (
        <p className="adm-empty">No promo codes yet. Tap “New Promo Code” to create one.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Uses</th><th>Expiry</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {sorted.map(c => {
                const st = couponStatus(c);
                return (
                  <tr key={c.id}>
                    <td className="adm-cell-strong">{c.code}</td>
                    <td className="cpn-discount">{fmtDiscount(c)}</td>
                    <td>{c.minOrder ? formatPrice(c.minOrder) : '—'}</td>
                    <td>{c.uses || 0} / {c.maxUses ? c.maxUses : '∞'}</td>
                    <td>{c.expiry ? new Date(c.expiry).toLocaleDateString('en-GB') : '—'}</td>
                    <td><span className={`cpn-status ${st}`}>{st[0].toUpperCase() + st.slice(1)}</span></td>
                    <td>
                      <div className="cpn-actions">
                        <button className="cpn-btn edit" onClick={() => openEdit(c)}><Pencil size={13} /> Edit</button>
                        <button className="cpn-btn enable" onClick={() => toggleActive(c)}>
                          {c.active === false ? <><Eye size={13} /> Enable</> : <><EyeOff size={13} /> Disable</>}
                        </button>
                        <button className="cpn-btn del" onClick={() => remove(c)}><Trash2 size={13} /> Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, value, label }) => (
  <div className="adm-stat">
    <span className="adm-stat-icon">{icon}</span>
    <div className="adm-stat-text">
      <span className="adm-stat-value">{value}</span>
      <span className="adm-stat-label">{label}</span>
    </div>
  </div>
);

const StatusPill = ({ status }) => (
  <span className={`adm-status adm-status-${(status || 'pending').toLowerCase()}`}>
    <span className="adm-status-dot"></span> {status}
  </span>
);

const fmtDate = (d) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB').replace(/\//g, '-');
};
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });

const PAY_LABELS = { PAID: 'Paid', COD: 'Cash', REFUNDED: 'Refunded', UNPAID: 'Unpaid' };

// New-order alert sound (Web Audio — no asset needed). AudioContext is unlocked
// on the first user interaction (browser autoplay policy).
let _audioCtx = null;
const unlockAudio = () => {
  try {
    _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
  } catch { /* ignore */ }
};
const playBeep = () => {
  try {
    if (!_audioCtx) return;
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    const now = _audioCtx.currentTime;
    [0, 0.28].forEach((offset, i) => { // two-tone "ding-dong"
      const o = _audioCtx.createOscillator();
      const g = _audioCtx.createGain();
      o.connect(g); g.connect(_audioCtx.destination);
      o.type = 'sine';
      o.frequency.value = i === 0 ? 988 : 784;
      const t = now + offset;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.start(t); o.stop(t + 0.26);
    });
  } catch { /* ignore */ }
};

const OrdersTable = ({ orders, loading, onConfirm, onReject, onDelete, onUploadPhoto, onDeletePhoto }) => {
  const [viewPhoto, setViewPhoto] = useState(null); // the order whose packed photo is open
  if (loading) return <p className="adm-muted">Loading…</p>;
  if (!orders.length) return <p className="adm-muted">No orders yet.</p>;
  return (
    <>
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>
            <th>Customer</th><th>Contact</th><th>Date</th><th>Time</th><th>Items</th>
            <th>Total Price</th><th>Amount Paid</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => {
            return (
              <tr key={o.id}>
                <td className="adm-cell-strong">
                  {o.customerName}
                  {o.fulfillment === 'delivery' && o.address && (
                    <span className="adm-addr">
                      <MapPin size={12} className="adm-addr-pin" />
                      <span className="adm-addr-text" title={o.address}>{o.address}</span>
                      <a
                        className="adm-addr-map"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Open in Google Maps"
                      >
                        <Navigation size={11} /> Map
                      </a>
                    </span>
                  )}
                  {o.channel === 'billing'
                    ? <span className="adm-fulfil-pill adm-billing-pill">Billing</span>
                    : o.fulfillment === 'pickup' && <span className="adm-fulfil-pill">Pickup</span>}
                </td>
                <td>
                  {o.phone || (o.email ? '' : '—')}
                  {o.email && <span className="adm-email" title={o.email}>{o.email}</span>}
                </td>
                <td>
                  <span className="adm-datepill">{fmtDate(o.date)}</span>
                  {o.isPreOrder && <span className="adm-preorder" title={o.schedule ? `Scheduled: ${o.schedule}` : 'Pre-order'}>PRE-ORDER</span>}
                </td>
                <td>{fmtTime(o.date)}</td>
                <td className="adm-items">
                  {o.items && o.items.length ? (
                    <div className="adm-items-list">
                      {o.items.map((it, idx) => (
                        <span key={idx} className="adm-item-line" title={`${it.quantity}× ${it.title}`}>
                          <span className="adm-item-qty">{it.quantity}×</span> {it.title}
                        </span>
                      ))}
                    </div>
                  ) : '—'}
                </td>
                <td>
                  {formatPrice(o.total || 0)}
                  {o.discount && (
                    <span className="adm-discount">{o.discount.code} -{formatPrice(o.discount.amount)}</span>
                  )}
                </td>
                <td className="adm-muted">
                  {formatPrice(o.amountPaid || 0)}
                  {o.paymentStatus && o.paymentStatus !== 'UNPAID' && (
                    <span className={`adm-pay adm-pay-${o.paymentStatus.toLowerCase()}`}>
                      {PAY_LABELS[o.paymentStatus] || o.paymentStatus}
                    </span>
                  )}
                </td>
                <td><StatusPill status={o.status} /></td>
                <td>
                  <div className="adm-actions">
                    {o.status === 'PENDING' && (
                      <>
                        <button className="adm-act ok" title="Accept order" onClick={() => onConfirm(o)}><Check size={14} /></button>
                        <button className="adm-act no" title="Reject order" onClick={() => onReject(o)}><X size={14} /></button>
                      </>
                    )}
                    {o.status === 'CONFIRMED' && (
                      <button className="adm-act warn" title="Reject order" onClick={() => onReject(o)}><RotateCcw size={14} /></button>
                    )}
                    <button className="adm-act" title="Download invoice" onClick={() => printInvoice(o)}><Download size={14} /></button>
                    {o.packedPhoto && (
                      <button className="adm-act ok" title="View packed photo" onClick={() => setViewPhoto(o)}><ImageIcon size={14} /></button>
                    )}
                    <label className="adm-act" title="Upload packed photo">
                      <Plus size={14} />
                      <input type="file" accept="image/*" hidden onChange={e => onUploadPhoto(o, e.target.files?.[0])} />
                    </label>
                    <button className="adm-act del" title="Delete" onClick={() => onDelete(o)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {viewPhoto && (
      <div className="adm-modal-overlay" onClick={() => setViewPhoto(null)}>
        <div className="adm-modal adm-photo-modal" onClick={e => e.stopPropagation()}>
          <div className="adm-modal-head-row">
            <h3>Packed Photo</h3>
            <button className="adm-act" onClick={() => setViewPhoto(null)}><X size={16} /></button>
          </div>
          <img className="adm-photo-view" src={viewPhoto.packedPhoto} alt="Packed order" />
          <div className="adm-modal-actions">
            <button className="adm-btn-ghost" onClick={() => setViewPhoto(null)}>Close</button>
            <button className="adm-btn-danger" onClick={() => { onDeletePhoto(viewPhoto); setViewPhoto(null); }}>
              <Trash2 size={14} /> Delete Photo
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

const CustomersTable = ({ customers, orders, loading }) => {
  if (loading) return <p className="adm-muted">Loading…</p>;
  if (!customers.length) return <p className="adm-muted">No customers yet.</p>;
  const count = uid => orders.filter(o => o.uid === uid).length;
  return (
    <div className="adm-panel">
      <h2 className="adm-panel-title">Customers</h2>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Name</th><th>Email</th><th>Provider</th><th>Orders</th></tr></thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.uid}>
                <td className="adm-cell-strong">{c.name || '—'}</td>
                <td>{c.email || '—'}</td>
                <td style={{ textTransform: 'capitalize' }}>{c.provider || '—'}</td>
                <td>{count(c.uid)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Read an image file and downscale it to a small JPEG data URL so it fits in
// Firestore (no separate image storage needed).
const fileToResizedDataUrl = (file, max = 420) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = reject;
    img.src = e.target.result;
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// ───────────────────────── Billing (in-store / counter) ─────────────────────
// Tap items (grouped by category) to build a bill on the right. Items show no
// price — the admin types the price per line. "Generate Bill" opens a payment-
// method popup. Add Category / Add Item reuse the live menu (same as Menu tab).
const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', Icon: Banknote },
  { id: 'card', label: 'Card', Icon: CreditCard },
];
const nowMs = () => Date.now(); // module-level: keeps the timestamp out of render purity checks

const BillingManager = () => {
  const {
    allMenuItems, allCategories, categoryConfig, menuConfig, addCategory, addMenuItem, addOrder,
  } = useCart();
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [bill, setBill] = useState([]); // [{ key, id, title, qty, price }]
  const [cust, setCust] = useState({ name: '', email: '', phone: '' }); // optional customer details
  const [billPhoto, setBillPhoto] = useState(''); // packed-order photo for the whole bill
  const [modal, setModal] = useState(null); // 'category' | 'item'
  const [newCat, setNewCat] = useState('');
  const [newItem, setNewItem] = useState({ title: '', category: '', desc: '' });
  const [pay, setPay] = useState(null); // null | { stage:'choose' } | { stage:'done', method, total, id, emailed }
  const lineSeq = useRef(0);
  const billSeq = useRef(0);
  const billRef = useRef(null); // scroll target for the mobile "Current Bill" basket

  const catLabel = (c) => categoryConfig[c]?.name || c;
  const nameOf = (i) => menuConfig[i.id]?.name || i.title;
  const imageOf = (i) => menuConfig[i.id]?.image || i.image || '';
  const effCatOf = (i) => menuConfig[i.id]?.category || i.category;

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    return allMenuItems.filter(i =>
      menuConfig[i.id]?.deleted !== true &&
      (!s || (menuConfig[i.id]?.name || i.title).toLowerCase().includes(s))
    );
  }, [q, allMenuItems, menuConfig]);

  const shownCategories = catFilter === 'all' ? allCategories : [catFilter];
  const catItemsFor = (cat) => items.filter(i => effCatOf(i) === cat);

  const addToBill = (item) => setBill(prev => {
    const ex = prev.find(l => l.id === item.id);
    if (ex) return prev.map(l => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l));
    lineSeq.current += 1;
    return [...prev, { key: `l${lineSeq.current}`, id: item.id, title: nameOf(item), qty: 1, price: '', image: imageOf(item) || '' }];
  });
  const setQty = (key, d) => setBill(prev => prev.flatMap(l => {
    if (l.key !== key) return [l];
    const qty = l.qty + d;
    return qty <= 0 ? [] : [{ ...l, qty }];
  }));
  const setLinePrice = (key, val) => setBill(prev => prev.map(l => (l.key === key ? { ...l, price: val } : l)));
  const removeLine = (key) => setBill(prev => prev.filter(l => l.key !== key));
  // Upload the real packed-item photo for a bill line (any image format).
  const onLineImage = async (key, file) => {
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setBill(prev => prev.map(l => (l.key === key ? { ...l, image: dataUrl } : l)));
    } catch { toast('Could not read that image', 'error'); }
  };
  // Upload a packed-order photo for the whole bill (header + button, any format).
  const onBillPhoto = async (file) => {
    if (!file) return;
    try { setBillPhoto(await fileToResizedDataUrl(file, 640)); }
    catch { toast('Could not read that image', 'error'); }
  };

  const total = bill.reduce((s, l) => s + (Number(l.price) || 0) * l.qty, 0);

  const submitCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    await addCategory(name);
    setNewCat(''); setModal(null); setCatFilter(name);
    toast('Category added');
  };
  const submitItem = async () => {
    if (!newItem.title.trim() || !newItem.category) return;
    await addMenuItem({ title: newItem.title, price: '', category: newItem.category, desc: newItem.desc });
    setNewItem({ title: '', category: '', desc: '' }); setModal(null);
    toast('Item added');
  };

  const billLineItems = () => bill.map(l => ({
    id: l.id, title: l.title, price: Number(l.price) || 0, quantity: l.qty, image: l.image || '',
  }));
  // Build an order object for the printed receipt.
  const makeOrder = (id, methodLabel, totalVal) => ({
    id,
    date: nowMs(),
    items: billLineItems(),
    total: totalVal,
    amountPaid: totalVal,
    payment: methodLabel,
    status: 'COMPLETED',
    fulfillment: 'pickup',
    customerName: cust.name.trim() || 'In-store',
    email: cust.email.trim(),
    phone: cust.phone.trim(),
    packedPhoto: billPhoto,
  });

  const choosePayment = (method) => {
    billSeq.current += 1;
    const id = 'B' + String(billSeq.current).padStart(4, '0');
    const email = cust.email.trim();
    // Save the bill as an in-store order so it appears in Total Orders (channel:
    // 'billing'). addOrder also emails the invoice when an email + PAID are set.
    addOrder(billLineItems(), total, {
      customerName: cust.name.trim() || 'In-store',
      email,
      phone: cust.phone.trim(),
      payment: method.label,
      paymentStatus: 'PAID',
      amountPaid: total,
      fulfillment: 'pickup',
      channel: 'billing',
      packedPhoto: billPhoto,
    });
    setPay({ stage: 'done', method, total, id, emailed: Boolean(email), email });
    toast(email ? `Bill generated • Invoice sent to ${email}` : `Bill generated • Paid by ${method.label}`);
  };
  const printReceipt = () => printInvoice(makeOrder(pay.id, pay.method.label, pay.total));
  const finishBill = () => { setBill([]); setCust({ name: '', email: '', phone: '' }); setBillPhoto(''); setPay(null); };

  return (
    <div className="adm-billing">
      <div className="adm-billing-grid">
        {/* LEFT — items grouped by category (no prices shown) */}
        <div className="adm-bill-items">
          <div className="adm-menu-toolbar">
            <div className="adm-search">
              <Search size={16} />
              <input placeholder="Search menu items…" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <select className="adm-cat-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="all">All categories</option>
              {allCategories.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
            </select>
            <button className="adm-add-btn" onClick={() => { setNewCat(''); setModal('category'); }}>
              <Plus size={15} /> Add Category
            </button>
            <button className="adm-add-btn primary" onClick={() => {
              setNewItem({ title: '', category: catFilter === 'all' ? (allCategories[0] || '') : catFilter, desc: '' });
              setModal('item');
            }}>
              <Plus size={15} /> Add Item
            </button>
          </div>

          <div className="adm-bill-catscroll">
            {shownCategories.map(cat => {
              const citems = catItemsFor(cat);
              if (!citems.length) return null;
              return (
                <div key={cat} className="adm-bill-catblock">
                  <h3 className="adm-bill-catname">{catLabel(cat)}</h3>
                  <div className="adm-bill-tiles">
                    {citems.map(i => (
                      <button key={i.id} className="bill-tile" onClick={() => addToBill(i)}>
                        <span className="bill-tile-img">
                          {imageOf(i)
                            ? <img src={imageOf(i)} alt="" loading="lazy" />
                            : <UtensilsCrossed size={22} />}
                          <span className="bill-tile-add"><Plus size={15} /></span>
                        </span>
                        <span className="bill-tile-name">{nameOf(i)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {items.length === 0 && <p className="adm-empty">No items found.</p>}
          </div>
        </div>

        {/* RIGHT — current bill */}
        <div className="adm-bill-cart" ref={billRef}>
          <div className="adm-bill-cart-head">
            <span className="adm-bill-cart-title"><Receipt size={18} /> Current Bill</span>
            <label className="adm-bill-head-add" title={billPhoto ? 'Change packed photo' : 'Upload packed photo'}>
              {billPhoto ? <img src={billPhoto} alt="" /> : <Plus size={18} />}
              <input type="file" accept="image/*" hidden onChange={e => onBillPhoto(e.target.files?.[0])} />
            </label>
          </div>
          <div className="adm-bill-lines">
            {bill.length === 0 ? (
              <p className="adm-bill-empty">Tap items on the left to add them to the bill.</p>
            ) : bill.map(l => (
              <div key={l.key} className="bill-line">
                <label className="bill-line-img" title={l.image ? 'Change packed photo' : 'Add packed photo'}>
                  {l.image ? <img src={l.image} alt="" /> : <Camera size={16} />}
                  <input type="file" accept="image/*" hidden onChange={e => onLineImage(l.key, e.target.files?.[0])} />
                </label>
                <div className="bill-line-main">
                  <div className="bill-line-top">
                    <span className="bill-line-name">{l.title}</span>
                    <button className="bill-line-x" onClick={() => removeLine(l.key)} aria-label="Remove"><X size={14} /></button>
                  </div>
                  <div className="bill-line-bottom">
                    <div className="bill-qty">
                      <button onClick={() => setQty(l.key, -1)} aria-label="Decrease">−</button>
                      <span>{l.qty}</span>
                      <button onClick={() => setQty(l.key, 1)} aria-label="Increase">+</button>
                    </div>
                    <div className="bill-price">
                      <span className="bill-price-cur">£</span>
                      <input type="number" step="0.05" min="0" placeholder="0.00"
                        value={l.price} onChange={e => setLinePrice(l.key, e.target.value)} />
                    </div>
                    <span className="bill-line-sub">{formatPrice((Number(l.price) || 0) * l.qty)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="adm-bill-foot">
            <div className="adm-bill-customer">
              <input type="text" placeholder="Customer name (optional)"
                value={cust.name} onChange={e => setCust(c => ({ ...c, name: e.target.value }))} />
              <input type="email" inputMode="email" placeholder="Customer email (optional)"
                value={cust.email} onChange={e => setCust(c => ({ ...c, email: e.target.value }))} />
              <input type="tel" inputMode="tel" placeholder="Customer phone (optional)"
                value={cust.phone} onChange={e => setCust(c => ({ ...c, phone: e.target.value }))} />
              <p className="adm-bill-customer-note">If an email is entered, the invoice is sent to the customer.</p>
            </div>
            <div className="adm-bill-total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
            <button className="adm-bill-generate" disabled={bill.length === 0} onClick={() => setPay({ stage: 'choose' })}>
              Generate Bill
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-only basket: jumps to the Current Bill section */}
      {bill.length > 0 && (
        <button
          className="adm-bill-fab"
          onClick={() => billRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          <span className="adm-bill-fab-left">
            <Receipt size={18} /> Current Bill
            <span className="adm-bill-fab-count">{bill.reduce((s, l) => s + l.qty, 0)}</span>
          </span>
          <span className="adm-bill-fab-total">{formatPrice(total)}</span>
        </button>
      )}

      {/* Add Category */}
      {modal === 'category' && (
        <div className="adm-modal-overlay" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <h3>Add Category</h3>
            <label className="adm-field">
              <span>Category name</span>
              <input autoFocus value={newCat} onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitCategory()} placeholder="e.g. Desserts" />
            </label>
            <div className="adm-modal-actions">
              <button className="adm-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="adm-btn-primary" onClick={submitCategory} disabled={!newCat.trim()}>Add Category</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item (no price — billing items are priced per line) */}
      {modal === 'item' && (
        <div className="adm-modal-overlay" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <h3>Add Item</h3>
            <label className="adm-field">
              <span>Item name</span>
              <input autoFocus value={newItem.title} onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))} placeholder="e.g. Chocolate Brownie" />
            </label>
            <label className="adm-field">
              <span>Category</span>
              <select value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}>
                {allCategories.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
            </label>
            <div className="adm-modal-actions">
              <button className="adm-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="adm-btn-primary" onClick={submitItem} disabled={!newItem.title.trim() || !newItem.category}>Add Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Bill → payment popup */}
      {pay && (
        <div className="adm-modal-overlay" onClick={() => pay.stage === 'choose' && setPay(null)}>
          <div className="adm-modal adm-pay-modal" onClick={e => e.stopPropagation()}>
            {pay.stage === 'choose' ? (
              <>
                <h3>Select Payment Method</h3>
                <p className="adm-pay-total">Total payable <strong>{formatPrice(total)}</strong></p>
                <div className="adm-pay-methods">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.id} className="adm-pay-btn" onClick={() => choosePayment(m)}>
                      <m.Icon size={26} /><span>{m.label}</span>
                    </button>
                  ))}
                </div>
                <div className="adm-modal-actions">
                  <button className="adm-btn-ghost" onClick={() => setPay(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <div className="adm-pay-done-wrap">
                <div className="adm-pay-done"><Check size={34} /></div>
                <h3>Bill Generated</h3>
                <p className="adm-pay-summary">Paid by <strong>{pay.method.label}</strong> · <strong>{formatPrice(pay.total)}</strong></p>
                {pay.emailed && <p className="adm-pay-emailed">✉ Invoice sent to {pay.email}</p>}
                <div className="adm-modal-actions">
                  <button className="adm-btn-ghost" onClick={printReceipt}>Print Receipt</button>
                  <button className="adm-btn-primary" onClick={finishBill}>New Bill</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MenuManager = () => {
  const {
    allMenuItems, allCategories, menuConfig, saveMenuConfig,
    categoryConfig, saveCategoryConfig, addCategory, addMenuItem,
    renameCategory, deleteCategory,
  } = useCart();
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('all'); // 'all' | category | '__hidden__'
  const [editingCat, setEditingCat] = useState(null);
  const [catDraft, setCatDraft] = useState('');
  const catLabel = (c) => categoryConfig[c]?.name || c;
  const effCatOf = (item) => menuConfig[item.id]?.category || item.category;

  const [modal, setModal] = useState(null); // 'category' | 'item'
  const [newCat, setNewCat] = useState('');
  const [newItem, setNewItem] = useState({ title: '', price: '', category: '', desc: '' });

  // ── Edit Product dialog ────────────────────────────────────────────────
  const [editProduct, setEditProduct] = useState(null);
  const [eform, setEform] = useState({ name: '', category: '', price: '', image: '', desc: '' });
  const [egroups, setEgroups] = useState([]); // [{ id, kind, choose, choices:[{name,price}] }]
  const editFileRef = useRef(null);

  const openEdit = (item) => {
    const cfg = menuConfig[item.id] || {};
    setEform({
      name: cfg.name ?? item.title,
      category: cfg.category ?? item.category,
      price: String(cfg.price ?? item.price ?? ''),
      image: cfg.image ?? item.image ?? '',
      desc: cfg.desc ?? item.desc ?? '',
    });
    setEgroups(Array.isArray(cfg.options)
      ? cfg.options.map((g, i) => ({
          id: g.id || `g${i}`,
          kind: g.kind || (g.required ? 'required' : 'optional'),
          choose: g.choose || 1,
          choices: (g.choices || []).map(c => ({ name: c.name || '', price: c.price != null ? String(c.price) : '' })),
        }))
      : []);
    setEditProduct(item);
  };

  const onEditImage = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setEform(f => ({ ...f, image: dataUrl }));
    } catch { toast('Could not read that image', 'error'); }
  };
  const onEditImagePaste = (e) => {
    const file = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'))?.getAsFile();
    if (file) { e.preventDefault(); onEditImage(file); }
  };

  // Add-on builder handlers
  const addGroup = (kind) => setEgroups(p => [...p, { id: `g${Date.now()}`, kind, choose: 1, choices: [{ name: '', price: '' }] }]);
  const removeGroup = (gi) => setEgroups(p => p.filter((_, i) => i !== gi));
  const patchGroup = (gi, patch) => setEgroups(p => p.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const addChoice = (gi) => setEgroups(p => p.map((g, i) => (i === gi ? { ...g, choices: [...g.choices, { name: '', price: '' }] } : g)));
  const patchChoice = (gi, ci, patch) => setEgroups(p => p.map((g, i) => (i === gi ? { ...g, choices: g.choices.map((c, j) => (j === ci ? { ...c, ...patch } : c)) } : g)));
  const removeChoice = (gi, ci) => setEgroups(p => p.map((g, i) => (i === gi ? { ...g, choices: g.choices.filter((_, j) => j !== ci) } : g)));

  const saveEdit = () => {
    const cleaned = egroups.map(g => ({
      id: g.id,
      kind: g.kind,
      ...(g.kind === 'required' ? { choose: Math.max(1, Number(g.choose) || 1) } : {}),
      choices: g.choices
        .filter(c => c.name.trim())
        .map(c => (g.kind === 'optional'
          ? { name: c.name.trim(), price: Number(c.price) || 0 }
          : { name: c.name.trim() })),
    })).filter(g => g.choices.length > 0);

    const hadOptions = Array.isArray(menuConfig[editProduct.id]?.options);
    const patch = {
      name: eform.name.trim() || editProduct.title,
      category: eform.category,
      price: Number(eform.price) || 0,
      image: eform.image,
      desc: eform.desc,
    };
    if (cleaned.length > 0) patch.options = cleaned;
    else if (hadOptions) patch.options = [];
    saveMenuConfig(editProduct.id, patch);
    setEditProduct(null);
    toast('Item updated');
  };

  const deleteItem = async (item, name) => {
    const ok = await confirmAction({ title: 'Delete item?', text: `"${name}" will be removed from the menu.`, confirmText: 'Delete', danger: true });
    if (!ok) return;
    saveMenuConfig(item.id, { deleted: true });
    toast('Item deleted');
  };

  const startCatEdit = (cat) => { setEditingCat(cat); setCatDraft(catLabel(cat)); };
  const saveCatEdit = (cat) => { renameCategory(cat, catDraft); setEditingCat(null); toast('Category renamed'); };
  const delCat = async (cat) => {
    const ok = await confirmAction({ title: 'Delete category?', text: `"${catLabel(cat)}" and its items will be removed.`, confirmText: 'Delete', danger: true });
    if (!ok) return;
    deleteCategory(cat);
    if (catFilter === cat) setCatFilter('all');
    toast('Category deleted');
  };

  const submitCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    await addCategory(name);
    setNewCat(''); setModal(null); setCatFilter(name);
    toast('Category added');
  };
  const submitItem = async () => {
    if (!newItem.title.trim() || !newItem.category) return;
    await addMenuItem(newItem);
    setNewItem({ title: '', price: '', category: '', desc: '' }); setModal(null);
    toast('Item added');
  };

  const hiddenView = catFilter === '__hidden__';
  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    return allMenuItems.filter(i =>
      menuConfig[i.id]?.deleted !== true &&
      (!s || (menuConfig[i.id]?.name || i.title).toLowerCase().includes(s))
    );
  }, [q, allMenuItems, menuConfig]);

  const shownCategories = (catFilter === 'all' || hiddenView) ? allCategories : [catFilter];
  const catItemsFor = (cat) => items.filter(i => {
    if (effCatOf(i) !== cat) return false;
    if (hiddenView) return menuConfig[i.id]?.visible === false;
    return true;
  });

  return (
    <div className="adm-menu">
      <div className="adm-menu-toolbar">
        <div className="adm-search">
          <Search size={16} />
          <input placeholder="Search menu items…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="adm-cat-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All categories</option>
          {allCategories.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
          <option value="__hidden__">Hidden Products</option>
        </select>
        <button className="adm-add-btn" onClick={() => { setNewCat(''); setModal('category'); }}>
          <Plus size={15} /> Add Category
        </button>
        <button className="adm-add-btn primary" onClick={() => {
          setNewItem({ title: '', price: '', category: (catFilter === 'all' || hiddenView) ? (allCategories[0] || '') : catFilter, desc: '' });
          setModal('item');
        }}>
          <Plus size={15} /> Add Item
        </button>
      </div>

      {shownCategories.map(cat => {
        const catItems = catItemsFor(cat);
        if ((catFilter === 'all' || hiddenView) && !catItems.length) return null;
        const catOn = categoryConfig[cat]?.hidden !== true;
        return (
          <div key={cat} className="adm-panel adm-menu-panel">
            <div className="adm-cat-head">
              <div className="adm-cat-head-left">
                {editingCat === cat ? (
                  <>
                    <input className="adm-edit-input" value={catDraft} autoFocus
                      onChange={e => setCatDraft(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveCatEdit(cat)} />
                    <button className="adm-act ok" title="Save" onClick={() => saveCatEdit(cat)}><Check size={14} /></button>
                    <button className="adm-act" title="Cancel" onClick={() => setEditingCat(null)}><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <h2 className="adm-panel-title">{catLabel(cat)} <span className="adm-cat-count">{catItems.length}</span></h2>
                    <button className="adm-act" title="Rename category" onClick={() => startCatEdit(cat)}><Pencil size={14} /></button>
                    <button className="adm-act del" title="Delete category" onClick={() => delCat(cat)}><Trash2 size={14} /></button>
                  </>
                )}
              </div>
              <label className="adm-cat-toggle" title="Turn the whole category on/off">
                <span className="adm-cat-toggle-label">{catOn ? 'On' : 'Off'}</span>
                <span className="adm-switch">
                  <input type="checkbox" checked={catOn}
                    onChange={e => saveCategoryConfig(cat, { hidden: !e.target.checked })} />
                  <span className="adm-switch-slider"></span>
                </span>
              </label>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table adm-menu-table adm-menu-table-v">
                <thead><tr><th>Item</th><th>Visible</th><th>Price</th><th>Available</th><th>Action</th></tr></thead>
                <tbody>
                  {catItems.length === 0 && (
                    <tr><td colSpan={5} className="adm-muted">No items in this category yet.</td></tr>
                  )}
                  {catItems.map(item => {
                    const cfg = menuConfig[item.id] || {};
                    const name = cfg.name ?? item.title;
                    const price = cfg.price ?? item.price;
                    const img = cfg.image ?? item.image;
                    const available = cfg.hidden !== true;
                    const visible = cfg.visible !== false;
                    return (
                      <tr key={item.id} className={`${available ? '' : 'adm-row-off'} ${visible ? '' : 'adm-row-hidden'}`}>
                        <td className="adm-cell-strong">
                          <div className="adm-item-cell">
                            <span className={`adm-item-thumb ${img ? 'has-img' : ''}`}>
                              {img ? <img src={img} alt="" /> : <Plus size={16} />}
                            </span>
                            <span>{name}</span>
                          </div>
                        </td>
                        <td>
                          <button
                            className={`adm-vis-btn ${visible ? '' : 'off'}`}
                            title={visible ? 'Hide from customers' : 'Show to customers'}
                            onClick={() => saveMenuConfig(item.id, { visible: !visible })}
                          >
                            {visible ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                        </td>
                        <td>{formatPrice(price)}</td>
                        <td>
                          <label className="adm-switch">
                            <input type="checkbox" checked={available}
                              onChange={e => saveMenuConfig(item.id, { hidden: !e.target.checked })} />
                            <span className="adm-switch-slider"></span>
                          </label>
                        </td>
                        <td>
                          <div className="adm-actions">
                            <button className="adm-act" title="Edit item" onClick={() => openEdit(item)}><Pencil size={14} /></button>
                            <button className="adm-act del" title="Delete item" onClick={() => deleteItem(item, name)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {modal === 'category' && (
        <div className="adm-modal-overlay" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <h3>Add Category</h3>
            <label className="adm-field">
              <span>Category name</span>
              <input autoFocus value={newCat} onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitCategory()} placeholder="e.g. Desserts" />
            </label>
            <div className="adm-modal-actions">
              <button className="adm-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="adm-btn-primary" onClick={submitCategory} disabled={!newCat.trim()}>Add Category</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'item' && (
        <div className="adm-modal-overlay" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <h3>Add Item</h3>
            <label className="adm-field">
              <span>Item name</span>
              <input autoFocus value={newItem.title} onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))} placeholder="e.g. Chocolate Brownie" />
            </label>
            <label className="adm-field">
              <span>Category</span>
              <select value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}>
                {allCategories.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
            </label>
            <label className="adm-field">
              <span>Price</span>
              <input type="number" step="0.05" min="0" value={newItem.price} onChange={e => setNewItem(n => ({ ...n, price: e.target.value }))} placeholder="0.00" />
            </label>
            <label className="adm-field">
              <span>Description (optional)</span>
              <input value={newItem.desc} onChange={e => setNewItem(n => ({ ...n, desc: e.target.value }))} placeholder="Short description" />
            </label>
            <div className="adm-modal-actions">
              <button className="adm-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="adm-btn-primary" onClick={submitItem} disabled={!newItem.title.trim() || !newItem.category}>Add Item</button>
            </div>
          </div>
        </div>
      )}

      {editProduct && (
        <div className="adm-modal-overlay" onClick={() => setEditProduct(null)}>
          <div className="adm-modal adm-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-head-row">
              <h3>Edit Product</h3>
              <button className="adm-act" onClick={() => setEditProduct(null)}><X size={16} /></button>
            </div>

            <label className="adm-field">
              <span>Product name *</span>
              <input value={eform.name} onChange={e => setEform(f => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="adm-field">
              <span>Category *</span>
              <select value={eform.category} onChange={e => setEform(f => ({ ...f, category: e.target.value }))}>
                {allCategories.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
            </label>
            <label className="adm-field">
              <span>Price *</span>
              <input type="number" step="0.05" min="0" value={eform.price} onChange={e => setEform(f => ({ ...f, price: e.target.value }))} />
            </label>

            <div className="adm-field">
              <span>Product image</span>
              <div className="adm-img-drop" onClick={() => editFileRef.current?.click()} onPaste={onEditImagePaste} tabIndex={0}>
                {eform.image ? <img src={eform.image} alt="" /> : <span>Click or paste to add</span>}
                <small>Click or paste to change</small>
              </div>
              <input type="file" accept="image/*" ref={editFileRef} style={{ display: 'none' }}
                onChange={e => { onEditImage(e.target.files?.[0]); e.target.value = ''; }} />
            </div>

            <label className="adm-field">
              <span>Description</span>
              <textarea rows={3} value={eform.desc} onChange={e => setEform(f => ({ ...f, desc: e.target.value }))} />
            </label>

            {/* Add-on builder */}
            <div className="adm-addon-builder">
              <div className="adm-addon-head">
                <span>Add-ons</span>
                <div className="adm-addon-head-btns">
                  <button className="adm-add-btn" onClick={() => addGroup('required')}><Plus size={13} /> Please Select (Required)</button>
                  <button className="adm-add-btn" onClick={() => addGroup('optional')}><Plus size={13} /> Please Select (Optional)</button>
                </div>
              </div>

              {egroups.map((g, gi) => (
                <div key={g.id} className={`adm-addon-group ${g.kind}`}>
                  <div className="adm-addon-group-head">
                    <strong>Please Select <em>({g.kind === 'required' ? 'Required' : 'Optional'})</em></strong>
                    {g.kind === 'required' && (
                      <label className="adm-choose">Choose
                        <input type="number" min="1" value={g.choose}
                          onChange={e => patchGroup(gi, { choose: Math.max(1, Number(e.target.value) || 1) })} />
                      </label>
                    )}
                    <button className="adm-act del" title="Remove section" onClick={() => removeGroup(gi)}><Trash2 size={13} /></button>
                  </div>
                  {g.choices.map((c, ci) => (
                    <div key={ci} className="adm-addon-choice">
                      <span className={`adm-addon-shape ${g.kind === 'required' ? 'circle' : 'square'}`}></span>
                      <input placeholder="Option name" value={c.name}
                        onChange={e => patchChoice(gi, ci, { name: e.target.value })} />
                      {g.kind === 'optional' && (
                        <input className="adm-addon-price" type="number" step="0.05" min="0" placeholder="0.00" value={c.price}
                          onChange={e => patchChoice(gi, ci, { price: e.target.value })} />
                      )}
                      <button className="adm-act" title="Remove option" onClick={() => removeChoice(gi, ci)}><X size={13} /></button>
                    </div>
                  ))}
                  <button className="adm-addon-add" onClick={() => addChoice(gi)}><Plus size={13} /> Add option</button>
                </div>
              ))}
            </div>

            <div className="adm-modal-actions">
              <button className="adm-btn-ghost" onClick={() => setEditProduct(null)}>Cancel</button>
              <button className="adm-btn-primary" onClick={saveEdit} disabled={!eform.name.trim() || !eform.category}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
