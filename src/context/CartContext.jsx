import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, deleteDoc, updateDoc, collection, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { auth, db, getProvider, isFirebaseConfigured } from '../firebase';
import { buildInvoiceHtml } from '../utils/invoice';
import { categories as baseCategories, menuItems as baseMenuItems } from '../data/menuData';

// EmailJS config (browser-side email — no backend needed). Set these in .env.
const EMAILJS = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};
const isEmailConfigured = Boolean(EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey);

// Module-level id generator (kept out of render so it doesn't trip purity rules).
const newReviewId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem('afc-bolton-cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Order-level fulfillment choice, shared between the store card toggle
  // and the Add Address popup at checkout
  const [fulfillmentType, setFulfillmentType] = useState('delivery');
  // Checkout details, shared across the address popup, schedule popup and the
  // checkout page
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [scheduledSlot, setScheduledSlot] = useState('now');
  const [orderPlaced, setOrderPlaced] = useState(false);
  // Signal raised by the checkout page to ask AppShell to open the Add Address popup
  const [addressEditRequest, setAddressEditRequest] = useState(0);
  // Signal raised by the "More" nav option to open the sign-in popup
  const [loginRequest, setLoginRequest] = useState(0);
  // Authentication. When Firebase is configured the user comes from Firebase
  // (via onAuthStateChanged); otherwise we fall back to a simulated user.
  const [user, setUser] = useState(() => {
    if (isFirebaseConfigured) return null;
    try {
      const stored = localStorage.getItem('afc-bolton-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Mirror Firebase auth state into our `user`, persist the profile to
  // Firestore on login, and load that user's saved order history.
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) { setUser(null); setOrderHistory([]); setOrdersLoaded(true); return; }
      setOrdersLoaded(false);
      const providerId = fbUser.providerData?.[0]?.providerId || '';
      const provider = providerId.includes('google') ? 'google'
        : providerId.includes('facebook') ? 'facebook'
        : providerId.includes('microsoft') ? 'microsoft'
        : 'account';
      const profile = {
        provider,
        name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Account'),
        email: fbUser.email || '',
        photo: fbUser.photoURL || '',
        uid: fbUser.uid,
      };
      setUser(profile);

      if (!db) { setOrdersLoaded(true); return; }
      // Save / update the user profile document, then load their orders
      (async () => {
        try {
          await setDoc(
            doc(db, 'users', fbUser.uid),
            { ...profile, lastLoginAt: serverTimestamp() },
            { merge: true }
          );
        } catch (e) {
          console.warn('Could not save user profile:', e?.message);
        }
        try {
          const snap = await getDocs(
            query(collection(db, 'users', fbUser.uid, 'orders'), orderBy('date', 'desc'))
          );
          setOrderHistory(snap.docs.map(d => d.data()));
        } catch (e) {
          console.warn('Could not load order history:', e?.message);
        } finally {
          setOrdersLoaded(true);
        }
      })();
    });
    return unsub;
  }, []);
  // Whether the signed-in user's order history has finished loading (used to
  // reliably tell if it's their first order). True immediately when Firebase
  // isn't configured (localStorage history is synchronous).
  const [ordersLoaded, setOrdersLoaded] = useState(!isFirebaseConfigured);

  // Past orders (for the Reorder page), persisted
  const [orderHistory, setOrderHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('afc-bolton-orders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Customer reviews shown on the Reviews page (newest first). Loaded from
  // Firestore (public) with a localStorage fallback.
  const [userReviews, setUserReviews] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ms-user-reviews') || '[]'); } catch { return []; }
  });
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'reviews'), orderBy('ts', 'desc')));
        if (!snap.empty) setUserReviews(snap.docs.map(d => d.data()));
      } catch { /* keep localStorage copy */ }
    })();
  }, []);
  useEffect(() => {
    try { localStorage.setItem('ms-user-reviews', JSON.stringify(userReviews)); } catch { /* ignore */ }
  }, [userReviews]);

  // Save a customer review (from the Reviews page, the post-order popup, or the
  // Reorder page). Shows immediately and persists to Firestore when available.
  const addReview = ({ name, rating, text, item }) => {
    const review = {
      id: newReviewId(),
      name: (name || 'Guest').trim() || 'Guest',
      rating: Number(rating) || 0,
      text: (text || '').trim(),
      item: item || null,
      ts: Date.now(),
    };
    setUserReviews(prev => [review, ...prev]);
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'reviews', review.id), review).catch(e => console.warn('Could not save review:', e?.message));
    }
    return review;
  };

  // Customer contact details (name + phone) captured at checkout, remembered
  // across orders so they prefill next time.
  const [contactInfo, setContactInfo] = useState(() => {
    try {
      const stored = localStorage.getItem('afc-bolton-contact');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const saveContactInfo = (info) => {
    setContactInfo(info);
    try { localStorage.setItem('afc-bolton-contact', JSON.stringify(info)); } catch { /* ignore */ }
  };

  // Admin-managed coupon / promo codes. Loaded from Firestore (public read) with
  // a localStorage fallback so codes still validate on the same device even if
  // the Firestore `coupons` rule hasn't been published yet.
  const [coupons, setCoupons] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ms-coupons') || '[]'); } catch { return []; }
  });
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'coupons'));
        if (!snap.empty) setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { /* keep localStorage copy */ }
    })();
  }, []);
  useEffect(() => {
    try { localStorage.setItem('ms-coupons', JSON.stringify(coupons)); } catch { /* ignore */ }
  }, [coupons]);
  const saveCoupon = async (coupon) => {
    const id = coupon.id || newReviewId();
    const data = { ...coupon, id };
    setCoupons(prev => {
      const i = prev.findIndex(c => c.id === id);
      if (i === -1) return [...prev, data];
      const next = [...prev]; next[i] = data; return next;
    });
    if (isFirebaseConfigured && db) {
      try { await setDoc(doc(db, 'coupons', id), data); } catch (e) { console.warn('Could not save coupon:', e?.message); }
    }
    return data;
  };
  const deleteCoupon = async (id) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
    if (isFirebaseConfigured && db) {
      try { await deleteDoc(doc(db, 'coupons', id)); } catch (e) { console.warn('Could not delete coupon:', e?.message); }
    }
  };
  // Increment a coupon's use count (called when an order using it is placed).
  const recordCouponUse = (code) => {
    if (!code) return;
    setCoupons(prev => prev.map(c => {
      if (c.code?.toUpperCase() !== code.toUpperCase()) return c;
      const uses = (c.uses || 0) + 1;
      if (isFirebaseConfigured && db) updateDoc(doc(db, 'coupons', c.id), { uses }).catch(() => {});
      return { ...c, uses };
    }));
  };

  // Admin-managed menu overrides (price / availability) keyed by item id
  const [menuConfig, setMenuConfig] = useState({});

  // Load menu overrides from Firestore once (public read)
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'menuConfig'));
        const map = {};
        snap.docs.forEach(d => { map[d.id] = d.data(); });
        setMenuConfig(map);
      } catch { /* ignore */ }
    })();
  }, []);

  // Admin: persist a menu override and update local state
  const saveMenuConfig = async (itemId, data) => {
    setMenuConfig(prev => ({ ...prev, [itemId]: { ...prev[itemId], ...data } }));
    if (isFirebaseConfigured && db) {
      try { await setDoc(doc(db, 'menuConfig', String(itemId)), data, { merge: true }); }
      catch (e) { console.warn('Could not save menu config:', e?.message); }
    }
  };

  // Admin-added items / categories and per-category availability
  const [customItems, setCustomItems] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [categoryConfig, setCategoryConfig] = useState({});

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    (async () => {
      try {
        const ci = await getDocs(collection(db, 'customMenuItems'));
        setCustomItems(ci.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { /* ignore */ }
      try {
        const cc = await getDocs(collection(db, 'customCategories'));
        setCustomCategories(cc.docs.map(d => d.data().name).filter(Boolean));
      } catch { /* ignore */ }
      try {
        const cfg = await getDocs(collection(db, 'categoryConfig'));
        const map = {}; cfg.docs.forEach(d => { map[d.id] = d.data(); });
        setCategoryConfig(map);
      } catch { /* ignore */ }
    })();
  }, []);

  // Add a new category
  const addCategory = async (name) => {
    const clean = (name || '').trim();
    if (!clean) return;
    setCustomCategories(prev => (prev.includes(clean) ? prev : [...prev, clean]));
    if (isFirebaseConfigured && db) {
      try { await setDoc(doc(db, 'customCategories', clean), { name: clean }); }
      catch (e) { console.warn('Could not add category:', e?.message); }
    }
  };

  // Add a new menu item
  const addMenuItem = async ({ title, price, category, desc }) => {
    const id = `c${Date.now()}`;
    const item = {
      id, title: (title || '').trim(), price: Number(price) || 0,
      category, desc: (desc || '').trim(), custom: true,
    };
    setCustomItems(prev => [...prev, item]);
    if (isFirebaseConfigured && db) {
      try { await setDoc(doc(db, 'customMenuItems', id), item); }
      catch (e) { console.warn('Could not add item:', e?.message); }
    }
    return item;
  };

  // Toggle / configure a whole category (e.g. turn it off, rename, delete)
  const saveCategoryConfig = async (category, data) => {
    setCategoryConfig(prev => ({ ...prev, [category]: { ...prev[category], ...data } }));
    if (isFirebaseConfigured && db) {
      try { await setDoc(doc(db, 'categoryConfig', category), data, { merge: true }); }
      catch (e) { console.warn('Could not save category config:', e?.message); }
    }
  };

  // Rename a category — stored as a display-name override; the category key
  // (and item associations) stay the same.
  const renameCategory = async (category, name) => {
    const clean = (name || '').trim();
    if (!clean) return;
    await saveCategoryConfig(category, { name: clean });
  };

  // Delete a category. Marks it deleted (works for base categories too) and
  // cleans up any admin-added category/items under it.
  const deleteCategory = async (category) => {
    setCategoryConfig(prev => ({ ...prev, [category]: { ...prev[category], deleted: true } }));
    setCustomCategories(prev => prev.filter(c => c !== category));
    setCustomItems(prev => prev.filter(i => i.category !== category));
    if (isFirebaseConfigured && db) {
      try { await setDoc(doc(db, 'categoryConfig', category), { deleted: true }, { merge: true }); } catch { /* ignore */ }
      try { await deleteDoc(doc(db, 'customCategories', category)); } catch { /* ignore */ }
    }
  };

  // Merged menu data: base (code) + admin-added, minus deleted categories
  const allMenuItems = useMemo(() => [...baseMenuItems, ...customItems], [customItems]);
  const allCategories = useMemo(() => {
    const list = [...baseCategories];
    customCategories.forEach(c => { if (!list.includes(c)) list.push(c); });
    return list.filter(c => categoryConfig[c]?.deleted !== true);
  }, [customCategories, categoryConfig]);

  useEffect(() => {
    localStorage.setItem('afc-bolton-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCartItems(prev => prev.map(i => {
      if (i.id === id) {
        const newQ = i.quantity + delta;
        return { ...i, quantity: newQ > 0 ? newQ : 1 };
      }
      return i;
    }));
  };

  const removeItem = (id) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => setCartItems([]);

  // Demo user used only when Firebase isn't configured yet
  const SIM_USERS = {
    google: { name: 'Google User', email: 'user@gmail.com' },
  };

  // Real social sign-in via Firebase; falls back to a simulated user until
  // Firebase credentials are added to .env.
  const signInWithProvider = async (provider) => {
    if (isFirebaseConfigured && auth) {
      const fbProvider = getProvider(provider);
      if (!fbProvider) throw new Error(`Unknown provider: ${provider}`);
      await signInWithPopup(auth, fbProvider); // user is set via onAuthStateChanged
      return;
    }
    // Simulated fallback
    const profile = SIM_USERS[provider] || { name: 'Guest', email: '' };
    const next = { provider, ...profile };
    setUser(next);
    try { localStorage.setItem('afc-bolton-user', JSON.stringify(next)); } catch { /* ignore */ }
  };

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      try { await firebaseSignOut(auth); } catch { /* ignore */ }
      return;
    }
    setUser(null);
    try { localStorage.removeItem('afc-bolton-user'); } catch { /* ignore */ }
  };

  const requestLogin = () => setLoginRequest(n => n + 1);

  // Email the invoice to the customer via EmailJS (sent from the browser).
  const emailInvoice = async (order) => {
    if (!order?.email) return;
    if (!isEmailConfigured) {
      console.warn('EmailJS not configured — invoice email skipped. Add VITE_EMAILJS_* to .env.');
      return;
    }
    try {
      await emailjs.send(
        EMAILJS.serviceId,
        EMAILJS.templateId,
        {
          to_email: order.email,
          customer_name: order.customerName || 'Customer',
          order_id: String(order.id),
          subject: `Your American Fried Chicken invoice #${order.id}`,
          html: buildInvoiceHtml(order),
        },
        { publicKey: EMAILJS.publicKey }
      );
    } catch (e) {
      console.warn('Could not send invoice email:', e?.text || e?.message);
    }
  };

  // Record a placed order. Every order (guest or signed-in) is saved to a
  // top-level `orders` collection so the admin dashboard can show them all;
  // signed-in users also get a copy under their profile for the Reorder page.
  // Falls back to localStorage when Firebase isn't configured.
  const addOrder = (items, total, meta = {}) => {
    if (!items || items.length === 0) return;
    const order = {
      id: Date.now(),
      date: new Date().toISOString(),
      status: 'PENDING',
      total,
      amountPaid: meta.amountPaid ?? 0,
      // Lifecycle: PAID (online captured) | COD (pay on collection) | REFUNDED
      paymentStatus: meta.paymentStatus || 'UNPAID',
      customerName: meta.customerName || user?.name || 'Guest',
      email: meta.email || user?.email || '',
      phone: meta.phone || '',
      payment: meta.payment || '',
      fulfillment: meta.fulfillment || '',
      channel: meta.channel || 'online',
      packedPhoto: meta.packedPhoto || '',
      address: meta.address || '',
      discount: meta.discount || null,
      schedule: meta.schedule || 'now',
      isPreOrder: meta.isPreOrder || false,
      uid: user?.uid || null,
      items: items.map(({ id, title, price, image, quantity }) => ({ id, title, price, image, quantity })),
    };
    setOrderHistory(prev => [order, ...prev]);

    if (isFirebaseConfigured && db) {
      // Admin's single source of truth — captures guest + signed-in orders
      setDoc(doc(db, 'orders', String(order.id)), order)
        .catch(e => console.warn('Could not save order:', e?.message));
      // Keep a copy under the signed-in user for their own order history
      if (user?.uid) {
        setDoc(doc(db, 'users', user.uid, 'orders', String(order.id)), order)
          .catch(e => console.warn('Could not save user order copy:', e?.message));
      }
    } else {
      // Guest / no Firebase — keep it locally
      try {
        const existing = JSON.parse(localStorage.getItem('afc-bolton-orders') || '[]');
        localStorage.setItem('afc-bolton-orders', JSON.stringify([order, ...existing]));
      } catch { /* ignore */ }
    }

    // Email the invoice once payment is completed (online orders are marked
    // PAID). Cash/COD orders are paid on collection/delivery, so no invoice is
    // sent at placement. Needs the customer's email (typed at checkout or from
    // their Google sign-in). Sent via EmailJS — independent of Firebase.
    if (order.email && order.paymentStatus === 'PAID') emailInvoice(order);

    // Count a coupon use when the order carries a promo code.
    if (order.discount?.code) recordCouponUse(order.discount.code);

    // Notify the admin's device(s) via Web Push — fires even if the admin app
    // is closed. Fire-and-forget; no-op locally where the server isn't running.
    try {
      fetch('/api/push/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: `New order from ${order.customerName || 'a customer'} (${order.fulfillment || 'order'})` }),
      }).catch(() => {});
    } catch { /* ignore */ }
  };

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      totalItems,
      totalPrice,
      isCartOpen,
      setIsCartOpen,
      fulfillmentType,
      setFulfillmentType,
      deliveryAddress,
      setDeliveryAddress,
      scheduledSlot,
      setScheduledSlot,
      orderPlaced,
      setOrderPlaced,
      addressEditRequest,
      setAddressEditRequest,
      user,
      signInWithProvider,
      signOut,
      loginRequest,
      requestLogin,
      orderHistory,
      ordersLoaded,
      addOrder,
      emailInvoice,
      userReviews,
      addReview,
      coupons,
      saveCoupon,
      deleteCoupon,
      contactInfo,
      saveContactInfo,
      menuConfig,
      saveMenuConfig,
      categoryConfig,
      saveCategoryConfig,
      addCategory,
      addMenuItem,
      renameCategory,
      deleteCategory,
      allMenuItems,
      allCategories,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
