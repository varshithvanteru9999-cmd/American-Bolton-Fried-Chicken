import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import OrderNow from './pages/OrderNow'; // eager — the home page / LCP route
// Every other route is code-split so it only downloads when visited. This keeps
// the initial (home page) JS bundle small for faster mobile load.
const About = lazy(() => import('./pages/About'));
const Reviews = lazy(() => import('./pages/Reviews'));
const AllergyInfo = lazy(() => import('./pages/AllergyInfo'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const Checkout = lazy(() => import('./pages/Checkout'));
const InfoPage = lazy(() => import('./pages/Info'));
const Reorder = lazy(() => import('./pages/Reorder'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Account = lazy(() => import('./pages/Account'));
import {
  Menu as MenuIcon, X, User, ShoppingBag, Info, RefreshCw, MoreHorizontal,
  Trash2, Search, Car, Home, Building2, Briefcase, BedDouble, MapPin, PlusCircle,
  Globe, ChevronDown, LogOut, Download,
  UtensilsCrossed, Receipt, Star, LayoutGrid,
  Phone, Clock, MapPin as PinIcon, Mail,
} from 'lucide-react';
import { installApp, isStandalone } from './utils/pwa';
import ReviewModal from './components/ReviewModal';
import { pendingOrderReview, markOrderReviewed, dismissOrderReview } from './utils/reviewStore';

// Standard UK postcode format, e.g. BL1 1AA, SW1A 1AA, M1 1AE
const isValidUkPostcode = (value) =>
  /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/.test(value.trim());

const BUILDING_TYPES = [
  { name: 'House', Icon: Home },
  { name: 'Apartment', Icon: Building2 },
  { name: 'Office', Icon: Briefcase },
  { name: 'Hotel', Icon: BedDouble },
  { name: 'Other', Icon: MapPin },
];

// Extra (optional) fields shown in the address form per building type
const BUILDING_EXTRA_FIELDS = {
  Office: ['Business Name', 'Suite / Floor'],
  Hotel: ['Hotel Name', 'Room / Floor'],
  Other: ['Apt / Suite / Floor', 'Business / Building Name'],
};

const EMPTY_ADDRESS_FORM = {
  houseNo: '',
  street: '',
  city: '',
  postcode: '',
  extra1: '',
  extra2: '',
  label: 'Home',
  instructions: '',
};
import { useCart } from './context/CartContext';
import BrandMark from './components/BrandMark';
import brand from './data/brand';
import formatPrice from './utils/formatPrice';
import './App.css';

// Scroll to the top of the page whenever the route changes
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  // The navbar is transparent over the banner photo and turns solid once the
  // page scrolls past it — otherwise light-on-transparent links become
  // unreadable against the white menu cards below.
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());
  const profileRef = useRef(null);
  const location = useLocation();
  const { user, signOut, requestLogin } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 360);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hide the install button once the app has been installed (or is running standalone)
  useEffect(() => {
    const onInstalled = () => setInstalled(true);
    window.addEventListener('pwa-installed', onInstalled);
    return () => window.removeEventListener('pwa-installed', onInstalled);
  }, []);

  // Close the profile dropdown when clicking outside of it
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const links = [
    { name: 'Order Now', path: '/', Icon: UtensilsCrossed },
    { name: 'About', path: '/about', Icon: Info },
    { name: 'Reorder', path: '/reorder', Icon: Receipt },
    { name: 'Reviews', path: '/review', Icon: Star },
    { name: 'More', path: '/more', Icon: LayoutGrid },
  ];

  return (
    <nav className={`exact-navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" aria-label={`${brand.legalName} home`}>
          <BrandMark size={42} variant="light" />
        </Link>
        
        <div className={`navbar-links ${mobileOpen ? 'mobile-active' : ''}`}>
          {links.map(({ name, path, Icon }) => (
            name === 'More' ? (
              <Link
                key={name}
                to="/account"
                className={location.pathname === '/account' ? 'active' : ''}
                onClick={(e) => { setMobileOpen(false); if (!user) { e.preventDefault(); requestLogin(); } }}
              >
                <Icon size={17} className="nav-link-icon" /> {name}
              </Link>
            ) : (
              <Link
                key={name}
                to={path}
                className={location.pathname === path ? 'active' : ''}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={17} className="nav-link-icon" /> {name}
              </Link>
            )
          ))}
          <div className="navbar-user">
            {!installed && (
              <button
                className="navbar-install-btn"
                onClick={() => { setMobileOpen(false); installApp(); }}
                aria-label="Install app"
                title="Install app (Android, iOS & Desktop)"
              >
                <Download size={18} />
                <span className="navbar-install-label">Install App</span>
              </button>
            )}
            {user ? (
              <div className="profile-menu" ref={profileRef}>
                <button className="profile-trigger" onClick={() => setProfileOpen(o => !o)}>
                  {user.photo ? (
                    <img className="profile-avatar" src={user.photo} alt={user.name} referrerPolicy="no-referrer" />
                  ) : (
                    <span className="profile-avatar profile-initial">{user.name.charAt(0).toUpperCase()}</span>
                  )}
                  <span className="navbar-user-name">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={15} className={`profile-caret ${profileOpen ? 'open' : ''}`} />
                </button>
                {profileOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-head">
                      {user.photo ? (
                        <img className="profile-avatar lg" src={user.photo} alt={user.name} referrerPolicy="no-referrer" />
                      ) : (
                        <span className="profile-avatar lg profile-initial">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                      <div className="profile-id">
                        <strong>{user.name}</strong>
                        {user.email && <span className="profile-email">{user.email}</span>}
                      </div>
                    </div>
                    <button className="profile-signout" onClick={() => { setProfileOpen(false); signOut(); }}>
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="profile-login-btn" onClick={requestLogin} aria-label="Sign in">
                <User size={18} />
              </button>
            )}
          </div>
        </div>

        <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>
    </nav>
  );
};

const VisaWord = ({ gold, size = 18 }) => (
  <svg viewBox="0 0 56 22" height={size} className="visa-word" aria-label="Visa" role="img">
    <text x="2" y="16" fontFamily="Arial, sans-serif" fontStyle="italic" fontWeight="800" fontSize="17" fill="#1A1F71">VISA</text>
    {gold && <rect x="3" y="18" width="46" height="2.5" fill="#F7B600" />}
  </svg>
);

const VerifiedByVisa = () => (
  <div className="pay-item">
    <span className="vbv-text">Verified by</span>
    <VisaWord gold />
  </div>
);

const VisaElectron = () => (
  <div className="pay-item">
    <VisaWord gold />
    <span className="electron-text">Electron</span>
  </div>
);

const MastercardMark = () => (
  <div className="pay-item">
    <svg viewBox="0 0 48 30" height="26" aria-label="Mastercard" role="img">
      <circle cx="19" cy="15" r="13" fill="#EB001B" />
      <circle cx="29" cy="15" r="13" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
    <span className="mc-text">mastercard</span>
  </div>
);

const VisaPlain = () => (
  <div className="pay-item">
    <VisaWord size={22} />
  </div>
);

const Footer = () => {
  const [showUnsub, setShowUnsub] = useState(false);
  const [unsubValue, setUnsubValue] = useState('');
  const [unsubDone, setUnsubDone] = useState(false);

  const closeUnsub = () => { setShowUnsub(false); setUnsubValue(''); setUnsubDone(false); };
  const handleUnsub = (e) => {
    e.preventDefault();
    if (!unsubValue.trim()) return;
    setUnsubDone(true);
  };

  return (
    <footer className="exact-footer">
      <div className="afc-stripe" aria-hidden="true" />

      {/* One compact grid: identity, links and store details side by side,
          rather than four stacked full-width bands. */}
      <div className="footer-main">
        <div className="footer-main-inner">

          {/* Identity + app install */}
          <div className="footer-col footer-col-brand">
            <BrandMark size={46} variant="dark" />
            <p className="footer-tagline">{brand.tagline}</p>
            <button
              type="button"
              className="footer-install-btn"
              onClick={installApp}
              aria-label="Install app on Android, iOS or desktop"
            >
              <Download size={15} /> Install App
            </button>
          </div>

          {/* Navigation */}
          <div className="footer-col">
            <h4>Order</h4>
            <Link to="/">Order Now</Link>
            <Link to="/reorder">Reorder</Link>
            <Link to="/review">Reviews</Link>
            <Link to="/info">Store Info</Link>
          </div>

          <div className="footer-col">
            <h4>Help</h4>
            <Link to="/allergy-info">Allergy Information</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <button className="footer-link-btn" onClick={() => setShowUnsub(true)}>Unsubscribe</button>
          </div>

          {/* Store details — the things a customer actually looks for */}
          <div className="footer-col footer-col-contact">
            <h4>Find Us</h4>
            <p className="footer-detail">
              <PinIcon size={14} />
              <span>{brand.addressLine1}<br />{brand.addressLine2}</span>
            </p>
            <a className="footer-detail" href={brand.phoneHref}>
              <Phone size={14} /> <span>{brand.phone}</span>
            </a>
            <a className="footer-detail" href={`mailto:${brand.email}`}>
              <Mail size={14} /> <span>{brand.email}</span>
            </a>
            <p className="footer-detail">
              <Clock size={14} /> <span>{brand.hours}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Single strip: hygiene rating, payment marks, legal line */}
      <div className="footer-strip">
        <div className="footer-strip-inner">
          <div className="footer-hygiene">
            <span className="fh-label">Food Hygiene Rating</span>
            <span className="fh-score">5</span>
            <span className="fh-verdict">Very Good</span>
          </div>

          <div className="footer-pay">
            <VerifiedByVisa />
            <VisaElectron />
            <MastercardMark />
            <VisaPlain />
          </div>

          <button className="lang-select">
            <Globe size={14} /> EN-GB <ChevronDown size={13} />
          </button>
        </div>
      </div>

      <div className="footer-legal">
        <span>&copy; {new Date().getFullYear()} {brand.legalName}. All rights reserved.</span>
        <span className="footer-legal-sep">·</span>
        <span className="omnireach-powered">Powered by</span>
        <img src="/images/omnireach.png" alt="OmniReach" className="omnireach-logo-img" />
      </div>

      {/* Unsubscribe popup */}
      {showUnsub && (
        <div className="unsub-overlay" onClick={closeUnsub}>
          <div className="unsub-modal" onClick={e => e.stopPropagation()}>
            <button className="unsub-close" onClick={closeUnsub} aria-label="Close"><X size={20} /></button>
            {unsubDone ? (
              <p className="unsub-success">✓ You have been unsubscribed from promotional emails.</p>
            ) : (
              <form onSubmit={handleUnsub}>
                <h3 className="unsub-title">UNSUBSCRIPTION</h3>
                <p className="unsub-desc">Please enter your details to unsubscribe from American Fried Chicken promotional e-mails.</p>
                <input
                  className="unsub-input"
                  placeholder="Enter your Email/Mobile Number"
                  value={unsubValue}
                  onChange={e => setUnsubValue(e.target.value)}
                />
                <button type="submit" className="unsub-btn">UNSUBSCRIBE</button>
              </form>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};

const BottomNav = () => {
  const location = useLocation();
  const { requestLogin, user } = useCart();
  return (
    <div className="mobile-bottom-nav">
      <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <ShoppingBag size={20} />
        <span>Order Now</span>
      </Link>
      <Link to="/about" className={`bottom-nav-item ${location.pathname === '/about' ? 'active' : ''}`}>
        <Info size={20} />
        <span>About</span>
      </Link>
      <Link to="/reorder" className={`bottom-nav-item ${location.pathname === '/reorder' ? 'active' : ''}`}>
        <RefreshCw size={20} />
        <span>Reorder</span>
      </Link>
      <Link
        to="/account"
        className={`bottom-nav-item ${location.pathname === '/account' ? 'active' : ''}`}
        onClick={(e) => { if (!user) { e.preventDefault(); requestLogin(); } }}
      >
        <MoreHorizontal size={20} />
        <span>More</span>
      </Link>
    </div>
  );
};

function AppShell() {
  const navigate = useNavigate();
  const appLocation = useLocation();
  const onCheckout = appLocation.pathname === '/checkout';
  const onAdmin = appLocation.pathname.startsWith('/admin');
  // Routes that paint a full-bleed banner behind the navbar. These get the
  // transparent nav so the artwork runs to the top of the page; every other
  // route keeps the solid bar.
  const onHome = appLocation.pathname === '/';
  const onBannerRoute = onHome || appLocation.pathname === '/reorder';

  // On admin pages, swap to the admin manifest so installing the app there
  // creates a separate "Admin" app that launches into /admin/login (the
  // customer app keeps start_url "/"). Restore the default off admin pages.
  const defaultManifestHref = useRef(null);
  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link) return;
    if (defaultManifestHref.current === null) defaultManifestHref.current = link.getAttribute('href');
    link.setAttribute('href', onAdmin ? '/admin.webmanifest' : defaultManifestHref.current);
  }, [onAdmin]);
  const {
    cartItems, updateQuantity, removeItem, totalItems, totalPrice,
    isCartOpen, setIsCartOpen, fulfillmentType, setFulfillmentType,
    setDeliveryAddress, orderPlaced, setOrderPlaced,
    addressEditRequest, user, orderHistory, addReview,
  } = useCart();
  const [orderComplete, setOrderComplete] = useState(false);
  // Post-order review prompt: { order } when shown
  const [orderReview, setOrderReview] = useState(null);

  // Add Address popup (shown before checkout when Delivery is selected)
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressStep, setAddressStep] = useState('postcode'); // 'postcode' | 'details'
  const [postcode, setPostcode] = useState('');
  const [buildingType, setBuildingType] = useState('');
  const [showBuildingPicker, setShowBuildingPicker] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const setFormField = (key, value) =>
    setAddressForm(prev => ({ ...prev, [key]: value }));

  const postcodeValid = isValidUkPostcode(postcode);

  // Live UK address suggestions (OpenStreetMap Nominatim, GB-only, debounced)
  useEffect(() => {
    if (!showAddressModal || addressStep !== 'postcode' || fulfillmentType !== 'delivery') return;
    const query = postcode.trim();
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=gb&q=${encodeURIComponent(query)}`,
          { signal: controller.signal, headers: { 'Accept-Language': 'en-GB' } }
        );
        const data = await res.json();
        setSuggestions(
          data.map(r => {
            const a = r.address || {};
            const title =
              [a.house_number, a.road || a.pedestrian || a.neighbourhood || r.name]
                .filter(Boolean)
                .join(' ') || r.display_name.split(',')[0];
            const city = a.city || a.town || a.village || a.county || '';
            const subtitle = [a.postcode, city, 'UK'].filter(Boolean).join(', ');
            return {
              id: r.place_id,
              title,
              subtitle,
              parts: {
                houseNo: a.house_number || '',
                street: a.road || a.pedestrian || a.neighbourhood || '',
                city,
                postcode: (a.postcode || '').toUpperCase(),
              },
            };
          })
        );
      } catch {
        // aborted or offline — keep whatever we had
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [postcode, showAddressModal, addressStep, fulfillmentType]);

  // Open the address-details form. The building-type picker auto-opens on top
  // so the user must choose a type first (matches the original flow).
  const openAddressForm = (label, parts) => {
    setSelectedAddress(label);
    setAddressForm({ ...EMPTY_ADDRESS_FORM, ...parts });
    setBuildingType('');
    setAddressStep('details');
    setShowBuildingPicker(true);
  };

  const pickSuggestion = (s) => {
    openAddressForm(`${s.title}, ${s.subtitle}`, s.parts);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    if (fulfillmentType === 'delivery') {
      setAddressStep('postcode');
      setShowAddressModal(true);
    } else {
      navigate('/checkout');
    }
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setShowBuildingPicker(false);
  };

  const continueToCheckout = () => {
    // Compose the delivery address from the form + selected location
    const lineParts = [
      addressForm.extra1,
      addressForm.extra2,
      `${addressForm.houseNo} ${addressForm.street}`.trim(),
      addressForm.city,
      addressForm.postcode,
    ].filter(Boolean);
    setDeliveryAddress({
      label: addressForm.label,
      buildingType,
      line: lineParts.join(', '),
      instructions: addressForm.instructions,
    });
    closeAddressModal();
    navigate('/checkout');
  };

  // Open the Add Address popup when the checkout page asks to edit an address
  useEffect(() => {
    if (!addressEditRequest) return;
    setFulfillmentType('delivery');
    setAddressStep('postcode');
    setShowAddressModal(true);
  }, [addressEditRequest, setFulfillmentType]);

  // Show a success toast after an order is placed on the checkout page
  useEffect(() => {
    if (!orderPlaced) return;
    setOrderComplete(true);
    const t = setTimeout(() => {
      setOrderComplete(false);
      setOrderPlaced(false);
    }, 4000);
    return () => clearTimeout(t);
  }, [orderPlaced, setOrderPlaced]);

  // Signed-in customers: ~1 hour after their last order, prompt for a review
  // the next time they open the site/app (dismissible, shown once per order).
  useEffect(() => {
    if (!user) return;
    const o = pendingOrderReview(orderHistory);
    if (o) setOrderReview(prev => prev || o);
  }, [user, orderHistory]);

  return (
      <div className={`app-container${onCheckout ? ' checkout-route' : ''}${onHome ? ' home-route' : ''}${onBannerRoute ? ' banner-route' : ''}`}>
        <ScrollToTop />
        {!onAdmin && <Navbar />}

        <div className="main-content">
          <Suspense fallback={<div className="route-fallback" />}>
            <Routes>
              <Route path="/" element={<OrderNow />} />
              <Route path="/category/:categoryName" element={<CategoryPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/info" element={<InfoPage />} />
              <Route path="/reorder" element={<Reorder />} />
              <Route path="/about" element={<About />} />
              <Route path="/review" element={<Reviews />} />
              <Route path="/allergy-info" element={<AllergyInfo />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/account" element={<Account />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<OrderNow />} />
            </Routes>
          </Suspense>
        </div>

        {!onAdmin && <Footer />}
        {!onCheckout && !onAdmin && <BottomNav />}

        {/* Order success toast */}
        {orderComplete && (
          <div className="order-success-toast">
            ✓ Order placed successfully! We'll send you updates.
          </div>
        )}

        {/* Post-order review popup (~1h after a signed-in customer's order) */}
        {!onAdmin && orderReview && (
          <ReviewModal
            title="How was your last order?"
            subtitle={`Ordered on ${new Date(orderReview.date).toLocaleDateString('en-GB')} — your review helps others!`}
            defaultName={user?.name || ''}
            onClose={() => { dismissOrderReview(orderReview.id); setOrderReview(null); }}
            onSubmit={(rating, text, name) => {
              addReview({ name: name || user?.name || 'Guest', rating, text });
              markOrderReviewed(orderReview.id);
              setOrderReview(null);
            }}
          />
        )}

        {/* Floating Basket Tab — hidden on the checkout page (basket is already shown there) */}
        {totalItems > 0 && !onCheckout && !onAdmin && (
          <div className="floating-basket" onClick={() => setIsCartOpen(!isCartOpen)}>
            <div className="basket-info">
              <span>{totalItems} Item{totalItems > 1 ? 's' : ''}</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <button className="basket-btn">
              <ShoppingBag size={18} className="basket-btn-icon" />
              BASKET
            </button>
          </div>
        )}

        {/* Sliding Cart Drawer */}
        <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
          <div className="cart-header">
            <h3>Basket</h3>
            <button className="close-cart" onClick={() => setIsCartOpen(false)}><X size={20} /></button>
          </div>
          <div className="cart-body">
            {cartItems.length === 0 && (
              <p className="cart-empty">Your basket is empty.</p>
            )}
            {cartItems.map(item => (
              <div key={item.id} className="cart-drawer-item">
                <div className="cart-drawer-details">
                  <h4>{item.title}</h4>
                  <p>{formatPrice(item.price)}</p>
                </div>
                <div className="cart-drawer-actions">
                  <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                  <button className="cart-remove-btn" onClick={() => removeItem(item.id)} aria-label="Remove item">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-footer">
            <div className="cart-subtotal">
              <span>Subtotal:</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <button
              className="checkout-btn"
              onClick={handleProceedToCheckout}
              disabled={cartItems.length === 0}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>

        {/* Add Address Modal — shown before checkout for Delivery orders */}
        {showAddressModal && (
          <div className="modal-overlay" onClick={closeAddressModal}>
            <div className="modal-content address-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={closeAddressModal} aria-label="Close">
                <X size={24} />
              </button>
              <h3>Add Address</h3>

              <div className="toggle-switch-container address-toggle">
                <div
                  className="toggle-switch-bg"
                  style={{ left: fulfillmentType === 'pickup' ? '50%' : '0%' }}
                ></div>
                <button
                  className={`toggle-btn ${fulfillmentType === 'delivery' ? 'active' : ''}`}
                  onClick={() => setFulfillmentType('delivery')}
                >
                  <Car size={18} />
                  <div className="tab-text">
                    <strong>Delivery</strong>
                    <span>30 mins</span>
                  </div>
                </button>
                <button
                  className={`toggle-btn ${fulfillmentType === 'pickup' ? 'active' : ''}`}
                  onClick={() => setFulfillmentType('pickup')}
                >
                  <ShoppingBag size={18} />
                  <div className="tab-text">
                    <strong>Pickup</strong>
                    <span>15 mins</span>
                  </div>
                </button>
              </div>

              {fulfillmentType !== 'delivery' ? (
                <button className="address-continue-btn" onClick={continueToCheckout}>
                  Continue to Checkout
                </button>
              ) : addressStep === 'postcode' ? (
                /* STEP 1: UK postcode / address search with live suggestions */
                <>
                  {postcode.trim() !== '' && (
                    <span className="postcode-float-label">Enter your Postcode</span>
                  )}
                  <div className="postcode-row">
                    <Search size={20} className="postcode-search-icon" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Enter your Postcode"
                      value={postcode}
                      onChange={e => setPostcode(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && postcodeValid) {
                          setSelectedAddress('');
                          setAddressStep('details');
                        }
                      }}
                    />
                    {postcode.trim() !== '' && (
                      <button
                        className="postcode-clear"
                        onClick={() => { setPostcode(''); setSuggestions([]); }}
                        aria-label="Clear"
                      >
                        <X size={13} />
                      </button>
                    )}
                    <button
                      className="postcode-cancel"
                      onClick={() => { setPostcode(''); closeAddressModal(); }}
                    >
                      Cancel
                    </button>
                  </div>

                  {postcode.trim() !== '' && (
                    <div className="address-suggestions">
                      {suggestions.map(s => (
                        <div key={s.id} className="address-suggestion-row" onClick={() => pickSuggestion(s)}>
                          <MapPin size={18} className="suggestion-pin" />
                          <div className="suggestion-text">
                            <strong>{s.title}</strong>
                            <span>{s.subtitle}</span>
                          </div>
                        </div>
                      ))}
                      {searching && suggestions.length === 0 && (
                        <p className="suggestion-hint">Searching UK addresses…</p>
                      )}
                      {!searching && suggestions.length === 0 && !postcodeValid && (
                        <p className="suggestion-hint">No matching UK addresses found</p>
                      )}
                      {postcodeValid && suggestions.length === 0 && !searching && (
                        <button
                          className="address-continue-btn"
                          onClick={() => openAddressForm(
                            `${postcode.trim().toUpperCase()}, United Kingdom`,
                            { postcode: postcode.trim().toUpperCase() }
                          )}
                        >
                          Deliver to this Postcode
                        </button>
                      )}
                      <button
                        className="add-manual-link"
                        onClick={() => openAddressForm(
                          `${postcode.trim().toUpperCase()}, United Kingdom`,
                          { postcode: isValidUkPostcode(postcode) ? postcode.trim().toUpperCase() : '' }
                        )}
                      >
                        <PlusCircle size={18} />
                        Add Address Manually...
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* STEP 2: location preview + full address form + save */
                <>
                  <div className="address-form-scroll">
                    <div className="address-map-wrap">
                      <iframe
                        title="Delivery location map"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedAddress || `${postcode.trim()}, UK`)}&z=18&t=k&output=embed`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                    <div className="address-line-row">
                      <span className="address-line-text">
                        {selectedAddress || `${postcode.trim().toUpperCase()}, United Kingdom`}
                      </span>
                      <button
                        className="address-edit-link"
                        onClick={() => { setSelectedAddress(''); setAddressStep('postcode'); }}
                      >
                        Edit
                      </button>
                    </div>

                    {buildingType && (
                      <>
                        <div className="address-grid">
                          {/* Row 1: building type (opens picker) + house/door no */}
                          <button
                            type="button"
                            className="addr-field addr-field-select"
                            onClick={() => setShowBuildingPicker(true)}
                          >
                            <span className="addr-label">Building Type</span>
                            <span className="addr-value">{buildingType}</span>
                          </button>
                          <div className="addr-field">
                            <span className="addr-label">House/Door No <em>(required)</em></span>
                            <input
                              value={addressForm.houseNo}
                              onChange={e => setFormField('houseNo', e.target.value)}
                            />
                          </div>

                          {/* Row 2: building-type-specific extra fields */}
                          {(BUILDING_EXTRA_FIELDS[buildingType] || []).map((ph, i) => (
                            <div className="addr-field" key={ph}>
                              <span className="addr-label">{ph}</span>
                              <input
                                placeholder={ph}
                                value={i === 0 ? addressForm.extra1 : addressForm.extra2}
                                onChange={e => setFormField(i === 0 ? 'extra1' : 'extra2', e.target.value)}
                              />
                            </div>
                          ))}

                          {/* Street + City */}
                          <div className="addr-field">
                            <span className="addr-label">Street <em>(required)</em></span>
                            <input
                              value={addressForm.street}
                              onChange={e => setFormField('street', e.target.value)}
                            />
                          </div>
                          <div className="addr-field">
                            <span className="addr-label">City <em>(required)</em></span>
                            <input
                              value={addressForm.city}
                              onChange={e => setFormField('city', e.target.value)}
                            />
                          </div>

                          {/* Postcode */}
                          <div className="addr-field">
                            <span className="addr-label">Postcode <em>(required)</em></span>
                            <input
                              value={addressForm.postcode}
                              onChange={e => setFormField('postcode', e.target.value.toUpperCase())}
                            />
                          </div>
                        </div>

                        <div className="address-label-row">
                          <strong>Address label</strong>
                          {['Home', 'Office', 'Other'].map(l => (
                            <button
                              key={l}
                              type="button"
                              className={`label-chip ${addressForm.label === l ? 'active' : ''}`}
                              onClick={() => setFormField('label', l)}
                            >
                              {l}
                            </button>
                          ))}
                        </div>

                        <div className="address-instructions">
                          <strong>Instructions to delivery driver ONLY</strong>
                          <div className="instructions-input-wrap">
                            <textarea
                              maxLength={250}
                              rows={2}
                              value={addressForm.instructions}
                              onChange={e => setFormField('instructions', e.target.value)}
                            />
                            <span className="instructions-counter">{addressForm.instructions.length} / 250</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="address-save-bar">
                    <button
                      className="address-save-btn"
                      disabled={!buildingType || !addressForm.houseNo.trim() || !addressForm.street.trim() || !addressForm.city.trim() || !isValidUkPostcode(addressForm.postcode)}
                      onClick={continueToCheckout}
                    >
                      SAVE
                    </button>
                  </div>

                  {showBuildingPicker && (
                    <div className="building-picker-overlay" onClick={() => buildingType && setShowBuildingPicker(false)}>
                      <div className="building-picker" onClick={e => e.stopPropagation()}>
                        <h4>Choose building type</h4>
                        {BUILDING_TYPES.map(({ name, Icon }) => (
                          <label key={name} className="building-option">
                            <Icon size={20} />
                            <span>{name}</span>
                            <input
                              type="radio"
                              name="buildingType"
                              checked={buildingType === name}
                              onChange={() => {
                                setBuildingType(name);
                                setAddressForm(prev => ({ ...prev, extra1: '', extra2: '' }));
                                setShowBuildingPicker(false);
                              }}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

      </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
