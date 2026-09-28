import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendedItems } from '../data/menuData';
import { Info, Plus, X, ChevronDown, Search, Check, Clock, Car, ShoppingBag, Users, Star, Download, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import formatPrice from '../utils/formatPrice';
import { ukNowMinutes, getStoreStatus } from '../utils/storeHours';
import { normalizeOptions, optionsPrice, invalidOptionGroups, toggleOptionChoice } from '../utils/options';
import { installApp, isStandalone } from '../utils/pwa';
import brand from '../data/brand';
import BrandMark from '../components/BrandMark';
import './OrderNow.css';

// Schedule slots: 11:00 AM to 10:45 PM, every 15 minutes
const ALL_SCHEDULE_SLOTS = (() => {
  const slots = [];
  for (let mins = 11 * 60; mins <= 22 * 60 + 45; mins += 15) {
    const h24 = Math.floor(mins / 60);
    const m = mins % 60;
    const h12 = h24 > 12 ? h24 - 12 : h24;
    slots.push({
      mins,
      label: `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`,
    });
  }
  return slots;
})();

const ukTodayLabel = () =>
  new Date().toLocaleDateString('en-GB', {
    timeZone: 'Europe/London',
    day: '2-digit',
    month: 'short',
  });

// Brand logos for the social sign-in buttons (lucide has no brand icons)
const GoogleIcon = () => (
  <svg className="brand-icon" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

const OrderNow = () => {
  const { cartItems, addToCart, updateQuantity, fulfillmentType, setFulfillmentType, setScheduledSlot, signInWithProvider, loginRequest, menuConfig, categoryConfig, allMenuItems, allCategories } = useCart();

  // Apply admin menu overrides: drop deleted items, override name+price, and
  // flag unavailable (item hidden OR its category turned off) so they show as
  // "Item Unavailable". Includes admin-added items.
  const menu = useMemo(() =>
    allMenuItems
      .filter(i => {
        const cfg = menuConfig[i.id] || {};
        if (cfg.deleted === true || cfg.visible === false) return false; // removed / hidden
        const effCat = cfg.category || i.category;
        return categoryConfig[effCat]?.deleted !== true;
      })
      .map(i => {
        const cfg = menuConfig[i.id] || {};
        const effCat = cfg.category || i.category;
        const catOff = categoryConfig[effCat]?.hidden === true;
        return {
          ...i,
          category: effCat,
          ...(cfg.price != null ? { price: cfg.price } : {}),
          ...(cfg.name ? { title: cfg.name } : {}),
          ...(cfg.image ? { image: cfg.image } : {}),
          ...(cfg.desc != null ? { desc: cfg.desc } : {}),
          ...(cfg.options ? { options: normalizeOptions(cfg.options) } : {}),
          available: cfg.hidden !== true && !catOff,
        };
      }),
    [allMenuItems, menuConfig, categoryConfig]
  );
  const navigate = useNavigate();
  const categories = allCategories;
  const menuItems = allMenuItems;
  const catLabel = (c) => categoryConfig[c]?.name || c;
  const [activeCategory, setActiveCategory] = useState(allCategories[0]);

  // Modals state
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  // Customisation option selections: { [groupId]: [choiceName, ...] }
  const [optionSel, setOptionSel] = useState({});
  
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('now');
  const [showOffers, setShowOffers] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginView, setLoginView] = useState('social'); // 'social' | 'email'
  const [signedInToast, setSignedInToast] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showTrackOrder, setShowTrackOrder] = useState(false);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const scrollToCategory = (category) => {
    setActiveCategory(category);
    const element = document.getElementById(category);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll-spy: highlight the category whose section is currently in view as
  // the user scrolls (desktop sidebar). Uses capture so it works whether the
  // page or an inner element is the scroller.
  useEffect(() => {
    const offset = 160; // below the sticky navbar
    const onScroll = () => {
      let current = categories[0];
      for (const c of categories) {
        const el = document.getElementById(c);
        if (el && el.getBoundingClientRect().top - offset <= 0) current = c;
      }
      if (current) setActiveCategory(prev => (prev === current ? prev : current));
    };
    window.addEventListener('scroll', onScroll, true);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [categories]);

  const [optionErrors, setOptionErrors] = useState([]); // ids of unsatisfied required groups

  const openItemModal = (item) => {
    if (item?.available === false) return; // unavailable items can't be ordered
    setSelectedItem(item);
    setItemQuantity(1);
    setSelectedAddons([]);
    setOptionSel({});
    setOptionErrors([]);
  };

  // --- Customisation option helpers ---
  const onOptionToggle = (group, name) => {
    setOptionSel(prev => toggleOptionChoice(prev, group, name));
    setOptionErrors(prev => prev.filter(id => id !== group.id)); // clear this group's warning
  };

  // Open the sign-in popup when the "More" nav option asks for it
  useEffect(() => {
    if (!loginRequest) return;
    setLoginView('social');
    setShowLogin(true);
  }, [loginRequest]);

  // Social sign-in (Firebase, or simulated until keys are added).
  const [loginError, setLoginError] = useState('');
  const handleSocialLogin = async (provider) => {
    setLoginError('');
    try {
      await signInWithProvider(provider);
      setShowLogin(false);
      setLoginView('social');
      setSignedInToast(true);
      setTimeout(() => setSignedInToast(false), 3000);
    } catch (err) {
      // Ignore the user simply closing the popup; surface real errors
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') return;
      setLoginError(err?.message || 'Sign-in failed. Please try again.');
    }
  };

  const handleAddonToggle = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) return prev.filter(a => a.id !== addon.id);
      return [...prev, addon];
    });
  };

  const handleModalAdd = () => {
    if (!selectedItem) return;
    const invalid = invalidOptionGroups(selectedItem, optionSel);
    if (invalid.length) { setOptionErrors(invalid); return; } // show warnings, don't add

    // Final price = base + extras (addons) + paid options (e.g. cheese)
    const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0)
      + optionsPrice(selectedItem, optionSel);
    const chosenOptions = selectedItem.options
      ? selectedItem.options.flatMap(g => optionSel[g.id] || [])
      : [];
    const finalItem = {
      ...selectedItem,
      price: selectedItem.price + addonsPrice,
      selectedAddons,
      selectedOptions: chosenOptions,
    };

    for (let i = 0; i < itemQuantity; i++) {
      addToCart(finalItem);
    }

    setSelectedItem(null);
  };

  const modalTotalPrice = selectedItem
    ? (selectedItem.price
        + selectedAddons.reduce((s, a) => s + a.price, 0)
        + optionsPrice(selectedItem, optionSel)) * itemQuantity
    : 0;

  // Store status (UK time): 'open' | 'preorder' | 'closed'
  const nowMins = ukNowMinutes();
  const storeStatus = getStoreStatus();
  const storeOpen = storeStatus === 'open';
  // Live orders when open; pre-orders during the 10–11 AM window; closed otherwise.
  const acceptingOrders = storeStatus !== 'closed';
  // When open: only today's remaining slots. During pre-order: the full
  // 11:00 AM–10:45 PM list for today's opening.
  const availableSlots = storeOpen
    ? ALL_SCHEDULE_SLOTS.filter(slot => slot.mins > nowMins)
    : ALL_SCHEDULE_SLOTS;

  // A selected slot that has since expired falls back to "Schedule now"
  const activeSlot =
    selectedSlot !== 'now' && availableSlots.some(slot => slot.label === selectedSlot)
      ? selectedSlot
      : null;

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchResults = trimmedQuery
    ? menu.filter(item =>
        item.title.toLowerCase().includes(trimmedQuery) ||
        (item.desc && item.desc.toLowerCase().includes(trimmedQuery)) ||
        item.category.toLowerCase().includes(trimmedQuery)
      ).slice(0, 20)
    : [];

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
  };

  return (
    <div className="order-now-page">
      {/* ---- Hero: full-bleed image with the crest and store details over it ---- */}
      <header className="afc-hero">
        {/* Backdrop is built from brand colours rather than the old banner
            artwork, which still carried the previous shop's marks. */}
        <div className="afc-hero-bg afc-hero-pattern" aria-hidden="true" />
        <div className="afc-hero-scrim" aria-hidden="true" />

        <button className="search-toggle" onClick={() => setShowSearch(true)} aria-label="Search menu">
          <Search size={18} />
        </button>

        <div className="afc-hero-inner">
          <BrandMark size={84} variant="light" showText={false} className="afc-hero-crest" />
          <h1 className="afc-hero-title">
            <span className="afc-hero-title-top">American</span>
            <span className="afc-hero-title-main">Fried Chicken</span>
          </h1>
          <p className="afc-hero-tag">{brand.tagline}</p>
          <div className="afc-hero-meta">
            <span className="afc-hero-meta-item">
              <MapPin size={14} /> {brand.addressLine1}
            </span>
            <button className="afc-hero-meta-item afc-hero-link" onClick={() => navigate('/review')}>
              <span className="star">★</span> 4.7 (100+)
            </button>
            <button className="afc-hero-meta-item afc-hero-link" onClick={() => navigate('/info')}>
              <Info size={14} /> Store info
            </button>
          </div>
        </div>
      </header>

      {/* ---- Order bar: fulfilment controls, lifted out of the hero ---- */}
      <div className="afc-orderbar">
        <div className="afc-orderbar-inner">
          <div className={`fulfillment-tabs ${storeStatus === 'closed' ? 'is-closed' : ''}`}>
            <div className="toggle-switch-container">
              <div className="toggle-switch-bg" style={{ left: fulfillmentType === 'pickup' ? '50%' : '0%' }}></div>
              <button 
                className={`toggle-btn ${fulfillmentType === 'delivery' ? 'active' : ''}`}
                onClick={() => setFulfillmentType('delivery')}
              >
                <Car size={18} className="tab-icon" />
                <div className="tab-text">
                  <strong>Delivery</strong>
                  <span>{storeOpen ? '30 mins' : storeStatus === 'preorder' ? 'Pre-order' : 'Closed'}</span>
                </div>
              </button>
              <button 
                className={`toggle-btn ${fulfillmentType === 'pickup' ? 'active' : ''}`}
                onClick={() => setFulfillmentType('pickup')}
              >
                <ShoppingBag size={17} className="tab-icon" />
                <div className="tab-text">
                  <strong>Pickup</strong>
                  <span>{storeOpen ? '15 mins' : storeStatus === 'preorder' ? 'Pre-order' : 'Closed'}</span>
                </div>
              </button>
            </div>
            <div className="other-tabs">
              <button
                className="tab schedule-tab-btn"
                onClick={() => setShowSchedule(true)}
                disabled={!acceptingOrders}
              >
                <span className="schedule-clock-icon"><Clock size={13} /></span>
                <strong>
                  {activeSlot ? `Today, ${activeSlot.replace(/^0/, '')}` : 'Schedule'}
                </strong>
              </button>
              <button
                className="tab group-order-btn"
                onClick={() => { setLoginView('social'); setShowLogin(true); }}
              >
                <Users size={17} className="tab-icon" />
                <strong>Group Order</strong>
              </button>
            </div>
          </div>

          {/* Pre-order banner — accepting scheduled orders only (before opening) */}
          {storeStatus === 'preorder' && (
            <div className="status-banner preorder-banner">
              <svg className="hanging-sign preorder-sign" viewBox="0 0 130 64" width="78" height="40" aria-label="Pre-order">
                <circle cx="65" cy="6" r="4" fill="none" stroke="#1f7fc4" strokeWidth="2" />
                <line x1="65" y1="9" x2="20" y2="24" stroke="#1f7fc4" strokeWidth="2" />
                <line x1="65" y1="9" x2="110" y2="24" stroke="#1f7fc4" strokeWidth="2" />
                <rect x="12" y="24" width="106" height="32" rx="6" fill="#2196d6" />
                <text x="65" y="45" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" letterSpacing="0.5">PRE-ORDER</text>
              </svg>
              <span className="status-text">
                Accepting Scheduled orders only. Online ordering resumes at 11:00 AM
              </span>
            </div>
          )}

          {/* Closed banner — fully closed (overnight) */}
          {storeStatus === 'closed' && (
            <div className="status-banner closed-banner">
              <svg className="hanging-sign closed-sign" viewBox="0 0 96 64" width="62" height="42" aria-label="Closed">
                {/* hook ring */}
                <circle cx="48" cy="6" r="4" fill="none" stroke="var(--afc-red-dark)" strokeWidth="2" />
                {/* two hanging cords forming an inverted V */}
                <line x1="48" y1="9" x2="16" y2="24" stroke="var(--afc-red-dark)" strokeWidth="2" />
                <line x1="48" y1="9" x2="80" y2="24" stroke="var(--afc-red-dark)" strokeWidth="2" />
                {/* the board */}
                <rect x="10" y="24" width="76" height="32" rx="6" fill="var(--afc-red)" />
                <text x="48" y="45" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700" letterSpacing="0.5">CLOSED</text>
              </svg>
              <span className="status-text">
                We're closed for online ordering at the moment. Pre-orders open at 10:00 AM, for collection from 11:00 AM.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile App Download Banner */}
      <div className="mobile-app-banner">
        <div className="app-banner-image">
          <img src="/images/Mobile Download Logo.png" alt="Mobile App" loading="lazy" decoding="async" />
        </div>
        <div className="app-banner-content">
          <strong>Download our App for Free</strong>
          <p>Get our app to enjoy a smooth and hassle-free ordering experience</p>
          {!isStandalone() && (
            <button className="app-install-btn" onClick={installApp}>
              <Download size={16} /> Install App
            </button>
          )}
        </div>
      </div>

      {/* ---- Sticky category rail (desktop): horizontal, replaces the sidebar ---- */}
      <nav className="afc-catrail" aria-label="Menu categories">
        <div className="afc-catrail-inner">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`afc-catrail-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => scrollToCategory(cat)}
            >
              {catLabel(cat)}
            </button>
          ))}
        </div>
      </nav>

      <div className="container main-order-layout">
        {/* Main Content Area */}
        <div className="menu-content">
          <button className="afc-dealstrip" onClick={() => setShowOffers(true)}>
            <span className="afc-dealstrip-badge">20%</span>
            <span className="afc-dealstrip-copy">
              <strong>Save 20% today</strong>
              <span>Minimum spend applies — delivery &amp; pickup</span>
            </span>
            <span className="afc-dealstrip-cta">View offer <ChevronDown size={16} /></span>
          </button>

          {/* Recommended Area */}
          <div className="recommended-section">
            <h3 className="afc-section-head"><span>Chef's picks</span></h3>
            <div className="recommended-scroll">
               {recommendedItems.map((rec) => {
                 const fullItem = menuItems.find(i => i.id === rec.id);
                 return (
                   <div key={rec.id} className="recommended-card" onClick={() => openItemModal(fullItem)}>
                     <img src={fullItem?.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80"} alt={rec.title} loading="lazy" decoding="async" />
                     <div className="rec-info">
                       <h4>{rec.title}</h4>
                       <p>{formatPrice(rec.price)}</p>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>

          {/* Categories Grid (Desktop Only) */}
          <div className="menu-sections desktop-categories">
            {categories.map((cat) => {
              const itemsInCategory = menu.filter(item => item.category === cat);
              if(itemsInCategory.length === 0) return null;

              return (
                <div key={cat} id={cat} className="menu-category-section">
                  <h3 className="category-title afc-section-head"><span>{catLabel(cat)}</span></h3>
                  <div className="items-grid">
                    {itemsInCategory.map((item) => {
                      const unavailable = item.available === false;
                      return (
                        <div
                          key={item.id}
                          className={`menu-item-card ${unavailable ? 'item-unavailable' : ''}`}
                          onClick={() => { if (!unavailable) openItemModal(item); }}
                        >
                          <div className="item-details">
                            <h4>{item.title}</h4>
                            <p className="item-desc">{item.desc}</p>
                            <p className="item-price">{formatPrice(item.price)}</p>
                            {unavailable && <p className="item-unavailable-label">Item Unavailable</p>}
                          </div>
                          {item.image && (
                            <div className="item-image-wrapper">
                              <img src={item.image} alt={item.title} className="item-image" loading="lazy" decoding="async" />
                            </div>
                          )}
                          {!unavailable && (
                            <button className="add-btn" onClick={(e) => { e.stopPropagation(); openItemModal(item); }}>
                              <Plus size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Mobile Categories Navigation (Mobile Only) — each category opens its own page */}
          <div className="mobile-category-navigation">
            <div className="mobile-categories-list">
              {categories.map(cat => (
                <div
                  key={cat}
                  className="mobile-category-item"
                  onClick={() => navigate(`/category/${encodeURIComponent(cat)}`)}
                >
                  <span>{catLabel(cat)}</span>
                  <span className="chevron">&gt;</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Search Overlay */}
      {showSearch && (
        <div className="modal-overlay search-overlay" onClick={closeSearch}>
          <div className="search-panel" onClick={e => e.stopPropagation()}>
            <div className="search-input-row">
              <Search size={18} className="search-input-icon" />
              <input
                autoFocus
                type="text"
                className="search-input"
                placeholder="Search for burgers, wings, meals..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button className="search-close" onClick={closeSearch} aria-label="Close search">
                <X size={20} />
              </button>
            </div>
            <div className="search-results">
              {!trimmedQuery && (
                <p className="search-hint">Start typing to search the menu</p>
              )}
              {trimmedQuery && searchResults.length === 0 && (
                <p className="search-hint">No items found for "{searchQuery}"</p>
              )}
              {searchResults.map(item => {
                const unavailable = item.available === false;
                return (
                  <div
                    key={item.id}
                    className={`search-result-row ${unavailable ? 'item-unavailable' : ''}`}
                    onClick={() => { if (!unavailable) { openItemModal(item); closeSearch(); } }}
                  >
                    {item.image && <img src={item.image} alt={item.title} loading="lazy" decoding="async" />}
                    <div className="search-result-info">
                      <h4>{item.title}</h4>
                      <span>{unavailable ? 'Item Unavailable' : item.category}</span>
                    </div>
                    <span className="search-result-price">{formatPrice(item.price)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className={`modal-content item-modal ${selectedItem.options ? 'item-modal-wide' : ''}`} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}><X size={24} /></button>

            {selectedItem.image && <img src={selectedItem.image} alt={selectedItem.title} className="modal-item-img" />}

            <div className="item-modal-main">
              <div className="modal-item-info">
                <h2>{selectedItem.title}</h2>
                <p>{selectedItem.desc}</p>
              </div>

              <div className="item-modal-body">
              {/* Customisation option groups */}
              {selectedItem.options && optionErrors.length > 0 && (
                <div className="option-warning-banner">
                  <Info size={16} /> Please choose the required option{optionErrors.length > 1 ? 's' : ''}.
                </div>
              )}
              {selectedItem.options && selectedItem.options.map(group => {
                const hasError = optionErrors.includes(group.id);
                const shapeClass = group.required ? 'opt-circle' : 'opt-square';
                return (
                  <div key={group.id} className={`option-group ${hasError ? 'option-group-error' : ''}`}>
                    <div className="option-group-head">
                      <span className="option-group-title">{group.label}</span>
                      <span className={`option-group-req ${hasError ? 'is-error' : ''}`}>{group.required ? 'Required' : 'Optional'}</span>
                    </div>
                    {group.note && <p className="option-group-note">{group.note}</p>}
                    <div className="option-choices">
                      {group.choices.map(choice => (
                        <label key={choice.name} className={`option-choice ${shapeClass}`}>
                          <input
                            type={group.multi ? 'checkbox' : 'radio'}
                            name={`${selectedItem.id}-${group.id}`}
                            checked={(optionSel[group.id] || []).includes(choice.name)}
                            onChange={() => onOptionToggle(group, choice.name)}
                          />
                          <span className="option-choice-name">{choice.name}</span>
                          {choice.price ? <span className="option-choice-price">{formatPrice(choice.price)}</span> : null}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Legacy extras (items without option groups) */}
              {!selectedItem.options && selectedItem.addons && selectedItem.addons.length > 0 && (
                <div className="addons-section">
                  <h3>Extras</h3>
                  {selectedItem.addons.map(addon => (
                    <label key={addon.id} className="addon-row">
                      <input
                        type="checkbox"
                        checked={selectedAddons.some(a => a.id === addon.id)}
                        onChange={() => handleAddonToggle(addon)}
                      />
                      <span className="addon-name">{addon.name}</span>
                      <span className="addon-price">+{formatPrice(addon.price)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {!acceptingOrders && (
              <div className="menu-unavailable-banner">This menu is not available at this time</div>
            )}
            <div className="item-modal-footer">
              <div className="qty-selector">
                <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}>-</button>
                <span>{itemQuantity}</span>
                <button onClick={() => setItemQuantity(itemQuantity + 1)}>+</button>
              </div>
              <button
                className="modal-add-btn"
                onClick={handleModalAdd}
                disabled={!acceptingOrders}
              >
                ADD <span className="modal-total-price">{formatPrice(modalTotalPrice)}</span>
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="modal-overlay" onClick={() => setShowSchedule(false)}>
          <div className="modal-content schedule-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSchedule(false)}><X size={24} /></button>
            <h3>When would you like to have your order</h3>
            <div className="schedule-tabs">
              <button className="schedule-tab active">
                <span className="schedule-tab-date">
                  Today
                  <br />
                  {ukTodayLabel()}
                </span>
                <span className="schedule-tab-check"><Check size={13} strokeWidth={3} /></span>
              </button>
            </div>
            <div className="schedule-list">
              <label className="schedule-option">
                <input
                  type="radio"
                  name="time"
                  checked={selectedSlot === 'now'}
                  onChange={() => { setSelectedSlot('now'); setScheduledSlot('now'); setShowSchedule(false); }}
                />
                Schedule now (Ready in 30 mins)
              </label>
              {availableSlots.map(slot => (
                <label key={slot.label} className="schedule-option">
                  <input
                    type="radio"
                    name="time"
                    checked={selectedSlot === slot.label}
                    onChange={() => { setSelectedSlot(slot.label); setScheduledSlot(slot.label); setShowSchedule(false); }}
                  />
                  {slot.label}
                </label>
              ))}
              {availableSlots.length === 0 && (
                <p className="schedule-empty">No more slots available today — ordering resumes tomorrow.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offers Modal */}
      {showOffers && (
        <div className="modal-overlay" onClick={() => setShowOffers(false)}>
          <div className="modal-content offers-modal" onClick={e => e.stopPropagation()}>
             <button className="modal-close" onClick={() => setShowOffers(false)}><X size={24} /></button>
             <h3>Offers</h3>
             <div className="offer-card">
               <h4>Get 20% OFF</h4>
               <p>On orders over £20</p>
               <ul className="offer-terms">
                 <li>Valid on Delivery & Pickup</li>
                 <li>Up to £25 savings</li>
                 <li>Available daily</li>
                 <li>Only on selected items</li>
               </ul>
             </div>
          </div>
        </div>
      )}


      {/* Login Modal */}
      {showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="modal-content login-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLogin(false)}><X size={24} /></button>
            <h3>Sign in to continue</h3>

            {loginView === 'social' ? (
              <>
                <div className="loyalty-banner">
                  <span className="loyalty-banner-icon"><Star size={18} fill="#f0932b" /></span>
                  <div>
                    <strong>Get 20% off your first order</strong>
                    <p>Sign in to unlock exclusive offers and faster checkout.</p>
                  </div>
                </div>
                <div className="social-logins">
                  <button className="social-btn" onClick={() => handleSocialLogin('google')}><GoogleIcon /> Sign in with Google</button>
                </div>
                {loginError && <p className="login-error">{loginError}</p>}
                <p className="login-info-box">
                  Sign in to track orders, store payment info, customize delivery, access
                  promotions, and receive updates. Your info stays secure with Google login.
                </p>
                <div className="login-footer">
                  Have an account ?{' '}
                  <button className="login-text-btn" onClick={() => setLoginView('email')}>Sign in</button>
                </div>
              </>
            ) : (
              <>
                <div className="email-login-form">
                  <input type="email" placeholder="Email address" className="login-input" />
                  <input type="password" placeholder="Password" className="login-input" />
                  <button className="email-login-btn">Sign In</button>
                </div>
                <div className="login-footer">
                  <button className="login-text-btn" onClick={() => { setShowLogin(false); setShowForgotPassword(true); }}>Forgot Password?</button>
                  <span> · </span>
                  <button className="login-text-btn" onClick={() => { setShowLogin(false); setShowRegister(true); }}>Create Account</button>
                  <span> · </span>
                  <button className="login-text-btn" onClick={() => setLoginView('social')}>Back</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Simulated sign-in confirmation */}
      {signedInToast && (
        <div className="signin-toast">✓ Signed in successfully</div>
      )}

      {/* Registration Modal */}
      {showRegister && (
        <div className="modal-overlay" onClick={() => setShowRegister(false)}>
          <div className="modal-content login-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRegister(false)}><X size={24} /></button>
            <h3>Create Account</h3>
            <div className="email-login-form">
              <div className="name-row">
                <input type="text" placeholder="First name" className="login-input" />
                <input type="text" placeholder="Last name" className="login-input" />
              </div>
              <input type="email" placeholder="Email address" className="login-input" />
              <input type="tel" placeholder="Phone number" className="login-input" />
              <input type="password" placeholder="Password" className="login-input" />
              <input type="password" placeholder="Confirm password" className="login-input" />
              <button className="email-login-btn">Create Account</button>
            </div>
            <div className="login-footer">
              Already have an account?{' '}
              <button className="login-text-btn" onClick={() => { setShowRegister(false); setShowLogin(true); }}>Sign In</button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="modal-content login-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowForgotPassword(false)}><X size={24} /></button>
            <h3>Reset Password</h3>
            <p className="modal-subtitle">Enter your email and we'll send you a reset link.</p>
            <div className="email-login-form">
              <input type="email" placeholder="Email address" className="login-input" />
              <button className="email-login-btn">Send Reset Link</button>
            </div>
            <div className="login-footer">
              <button className="login-text-btn" onClick={() => { setShowForgotPassword(false); setShowLogin(true); }}>Back to Sign In</button>
            </div>
          </div>
        </div>
      )}

      {/* Track Order Modal */}
      {showTrackOrder && (
        <div className="modal-overlay" onClick={() => setShowTrackOrder(false)}>
          <div className="modal-content track-order-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTrackOrder(false)}><X size={24} /></button>
            <h3>Track Your Order</h3>
            <div className="track-order-body">
              <div className="track-input-row">
                <input type="text" placeholder="Enter order number (e.g. AFC-123456)" className="login-input" />
                <button className="email-login-btn" style={{ marginTop: 0 }}>Track</button>
              </div>
              <div className="track-status-card">
                <div className="track-step completed"><span className="track-dot"></span><div><strong>Order Placed</strong><p>Your order has been received</p></div></div>
                <div className="track-step completed"><span className="track-dot"></span><div><strong>Confirmed</strong><p>Restaurant confirmed your order</p></div></div>
                <div className="track-step active"><span className="track-dot"></span><div><strong>Preparing</strong><p>Your food is being prepared</p></div></div>
                <div className="track-step"><span className="track-dot"></span><div><strong>Out for Delivery</strong><p>Driver is on the way</p></div></div>
                <div className="track-step"><span className="track-dot"></span><div><strong>Delivered</strong><p>Enjoy your meal!</p></div></div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderNow;
