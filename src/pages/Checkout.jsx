import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trash2, PlusCircle, Car, ShoppingBag, AlertTriangle,
  Info, X, Pencil, Check,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { menuItems, recommendedItems } from '../data/menuData';
import formatPrice from '../utils/formatPrice';
import { ukNowMinutes, getStoreStatus } from '../utils/storeHours';
import { startVivaPayment, verifyVivaPayment } from '../utils/payments';
import { toast } from '../utils/alerts';
import './Checkout.css';

const PAYMENT_OPTIONS = [
  { id: 'gpay', label: 'Google Pay', tag: 'G Pay' },
  { id: 'card', label: 'New Card' },
  { id: 'cash', label: 'Cash' },
];

// Schedule slots: 11:00 AM to 10:45 PM, every 15 minutes (matches OrderNow)
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

const Checkout = () => {
  const navigate = useNavigate();
  const {
    cartItems, totalPrice, removeItem, clearCart,
    fulfillmentType, setFulfillmentType, deliveryAddress, scheduledSlot,
    setScheduledSlot, setOrderPlaced, setAddressEditRequest, addOrder,
    user, contactInfo, saveContactInfo, orderHistory, ordersLoaded, coupons,
  } = useCart();

  const openAddressPopup = () => {
    setShowLocationModal(false);
    setAddressEditRequest(n => n + 1);
  };

  const [payment, setPayment] = useState('gpay');
  // Mobile-only two-step flow: 'basket' → tap CHECKOUT → 'payment'
  const [mobileStep, setMobileStep] = useState('basket');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const nowMins = ukNowMinutes();
  // When open, only today's remaining slots; otherwise offer the full
  // pre-order list (11:00 AM onward) for the next opening.
  const availableSlots = getStoreStatus() === 'open'
    ? ALL_SCHEDULE_SLOTS.filter(slot => slot.mins > nowMins)
    : ALL_SCHEDULE_SLOTS;
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructions, setInstructions] = useState(deliveryAddress?.instructions || '');
  const [orderNumber] = useState(() => `${Math.floor(1000000000 + Math.random() * 9000000000)}`);

  // Customer contact details (prefilled from a past order / signed-in profile).
  // Sign-in is optional — at checkout we just need an email OR a mobile number.
  const [name, setName] = useState(contactInfo?.name || user?.name || '');
  const [email, setEmail] = useState(contactInfo?.email || user?.email || '');
  const [phone, setPhone] = useState(contactInfo?.phone || '');
  const [contactErr, setContactErr] = useState('');

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, amount }
  const [couponErr, setCouponErr] = useState('');

  // First-order offer: 20% off for a signed-in customer with no prior orders.
  const firstOrderEligible = !!user && ordersLoaded && (orderHistory?.length || 0) === 0;
  const firstOrderDiscount = firstOrderEligible
    ? { code: 'FIRST20', amount: Math.round(totalPrice * 0.20 * 100) / 100, label: '20% off your first order' }
    : null;

  // Discount amount for the applied coupon, recomputed from the live basket
  // total (so a % code updates automatically if the cart changes).
  const couponAmount = (() => {
    if (!coupon) return 0;
    let raw = coupon.type === 'percent' ? (totalPrice * coupon.value) / 100 : coupon.value;
    if (coupon.type === 'percent' && coupon.maxCap > 0) raw = Math.min(raw, coupon.maxCap);
    return Math.min(Math.round(raw * 100) / 100, totalPrice);
  })();

  // A manually entered coupon takes precedence; otherwise apply the first-order offer.
  const appliedDiscount = coupon
    ? { code: coupon.code, amount: couponAmount, label: `Coupon (${coupon.code})` }
    : firstOrderDiscount;
  const discountAmount = appliedDiscount?.amount || 0;
  const finalTotal = Math.max(0, totalPrice - discountAmount);

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const def = (coupons || []).find(c => (c.code || '').toUpperCase() === code);
    if (!def) { setCouponErr('Invalid coupon code.'); return; }
    if (def.active === false) { setCouponErr('This coupon is not active.'); return; }
    if (def.expiry && new Date(def.expiry) < new Date(new Date().toDateString())) {
      setCouponErr('This coupon has expired.'); return;
    }
    if (def.maxUses > 0 && (def.uses || 0) >= def.maxUses) {
      setCouponErr('This coupon has reached its usage limit.'); return;
    }
    if (def.minOrder && totalPrice < def.minOrder) {
      setCouponErr(`Minimum order of ${formatPrice(def.minOrder)} required.`); return;
    }
    setCoupon(def); // store the definition; amount is computed live
    setCouponErr('');
  };
  const removeCoupon = () => { setCoupon(null); setCouponCode(''); setCouponErr(''); };

  // Handle the return from Viva hosted checkout (?viva=success&t=… / ?viva=fail).
  const [verifying, setVerifying] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viva = params.get('viva');
    if (!viva) return;
    if (viva === 'fail') {
      toast('Payment cancelled — your basket is saved.', 'info');
      window.history.replaceState({}, '', '/checkout');
      return;
    }
    if (viva === 'success') {
      const t = params.get('t');
      setVerifying(true);
      (async () => {
        const result = t ? await verifyVivaPayment(t) : { success: null };
        let pending = null;
        try { pending = JSON.parse(localStorage.getItem('ms-pending-order') || 'null'); } catch { /* ignore */ }
        // Viva only redirects to the success URL after a successful payment, so
        // place unless verification explicitly reports failure.
        if (pending && result.success !== false) {
          addOrder(pending.items, pending.total, { ...pending.meta, paymentRef: t });
          localStorage.removeItem('ms-pending-order');
          clearCart();
          setOrderPlaced(true);
          toast('Payment successful — order placed!');
          navigate('/');
        } else {
          setVerifying(false);
          toast('We could not confirm your payment. If you were charged, please contact us.', 'warning');
          window.history.replaceState({}, '', '/checkout');
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Confirming a Viva payment after returning from hosted checkout
  if (verifying) {
    return (
      <div className="checkout-page checkout-empty-page">
        <p>Confirming your payment…</p>
      </div>
    );
  }

  // Empty basket → nothing to check out
  if (cartItems.length === 0) {
    return (
      <div className="checkout-page checkout-empty-page">
        <p>Your basket is empty.</p>
        <button className="checkout-empty-btn" onClick={() => navigate('/')}>Back to menu</button>
      </div>
    );
  }

  const isDelivery = fulfillmentType === 'delivery';

  // Order metadata for whichever payment path is taken.
  const buildMeta = (isCash) => ({
    customerName: name.trim() || user?.name || 'Guest',
    phone: phone.trim(),
    email: email.trim() || user?.email || '',
    payment,
    paymentStatus: isCash ? 'COD' : 'PAID',
    fulfillment: fulfillmentType,
    address: deliveryAddress?.line || '',
    amountPaid: isCash ? 0 : finalTotal,
    discount: appliedDiscount ? { code: appliedDiscount.code, amount: appliedDiscount.amount } : null,
    schedule: scheduledSlot,
    isPreOrder: scheduledSlot !== 'now',
  });

  // Cash (COD) is placed immediately — no gateway.
  const finalizeCashOrder = () => {
    addOrder(cartItems, finalTotal, buildMeta(true));
    setOrderPlaced(true);
    clearCart();
    navigate('/');
  };

  const placeOrder = async () => {
    if (!email.trim() && !phone.trim()) {
      setMobileStep('payment');
      setContactErr('Please add an email or mobile number so we can reach you about this order.');
      window.scrollTo({ top: 0 });
      return;
    }
    setContactErr('');
    saveContactInfo({ name: name.trim(), email: email.trim(), phone: phone.trim() });

    if (payment === 'cash') { finalizeCashOrder(); return; }

    // Online (card / Google Pay) → Viva Smart Checkout. Stash the order so we
    // can place it when the customer returns from Viva, then redirect.
    try {
      localStorage.setItem('ms-pending-order', JSON.stringify({
        items: cartItems, total: finalTotal, meta: buildMeta(false),
      }));
      const redirectUrl = await startVivaPayment({
        amount: finalTotal,
        fullName: name.trim() || user?.name || 'Customer',
        email: email.trim() || user?.email || '',
        phone: phone.trim(),
        customerTrns: `Order # ${orderNumber}`,
      });
      window.location.href = redirectUrl;
    } catch (e) {
      toast(e.message || 'Payment could not be started. Please try again.', 'error');
    }
  };

  const onPaymentStep = mobileStep === 'payment';
  const goToPayment = () => { setMobileStep('payment'); window.scrollTo({ top: 0 }); };
  const backToBasket = () => { setMobileStep('basket'); window.scrollTo({ top: 0 }); };

  return (
    <div className={`checkout-page step-${mobileStep}`}>
      {/* Mobile-only top bar */}
      <div className="checkout-mobile-topbar">
        <button
          className="mobile-topbar-back"
          onClick={() => (onPaymentStep ? backToBasket() : navigate('/'))}
        >
          <ArrowLeft size={20} /> {onPaymentStep ? 'Payment' : 'Add more items'}
        </button>
        <span className="mobile-topbar-total">Total: {formatPrice(finalTotal)}</span>
      </div>

      <div className="checkout-grid">
        {/* LEFT: order details panel */}
        <div className="checkout-main" id="checkout-details">
          <button className="checkout-back" onClick={() => navigate('/')}>
            <ArrowLeft size={20} /> BACK
          </button>

          {/* Address / fulfillment card */}
          {isDelivery ? (
            <>
              <div className="checkout-address-card is-delivery">
                <div className="addr-card-row">
                  <span className="addr-dot addr-dot-top" aria-hidden="true"></span>
                  <span className="addr-dot addr-dot-bottom" aria-hidden="true"></span>
                  <div>
                    <h4>American Fried Chicken</h4>
                    <p className="addr-card-line">
                      {deliveryAddress?.line || 'Add a delivery address'}
                    </p>
                  </div>
                  <button className="addr-change" onClick={() => setShowLocationModal(true)}>Change</button>
                </div>

                <div className="addr-instructions-block">
                  <strong>Instructions to delivery driver ONLY</strong>
                  {showInstructions ? (
                    <textarea
                      autoFocus
                      maxLength={250}
                      rows={2}
                      placeholder="e.g. ring the doorbell, leave at the door…"
                      value={instructions}
                      onChange={e => setInstructions(e.target.value)}
                    />
                  ) : (
                    <button className="addr-add-instructions" onClick={() => setShowInstructions(true)}>
                      {instructions ? instructions : 'Add your delivery instructions'}
                    </button>
                  )}
                </div>
              </div>
              <p className="addr-out-of-area">This address falls outside of the takeaway's delivery area.</p>
            </>
          ) : (
            <div className="checkout-pickup-card">
              <p className="pickup-label">Pickup at</p>
              <h4>American Fried Chicken</h4>
            </div>
          )}

          {/* Schedule card */}
          <div className="checkout-schedule-card">
            <h4>Schedule</h4>
            <div className="schedule-card-row">
              {scheduledSlot === 'now' ? (
                <div>
                  <p className="schedule-asap">Deliver ASAP</p>
                  <p className="schedule-sub">(Ready in 30 mins)</p>
                </div>
              ) : (
                <div>
                  <p className="schedule-label">Scheduled On</p>
                  <p className="schedule-value">
                    <span className="preorder-pill">PRE-ORDER</span> (Today, {scheduledSlot.replace(/^0/, '')})
                  </p>
                </div>
              )}
              <button className="addr-change" onClick={() => setShowSchedule(true)}>Change</button>
            </div>
          </div>

          {/* Contact details */}
          <div className="checkout-contact-card">
            <h4>Contact details</h4>
            <p className="contact-hint">Add your email or mobile number so we can reach you about this order.</p>
            <div className="contact-fields">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="contact-fields">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (contactErr) setContactErr(''); }}
              />
              <input
                type="tel"
                placeholder="Mobile number"
                value={phone}
                onChange={e => { setPhone(e.target.value); if (contactErr) setContactErr(''); }}
              />
            </div>
            {contactErr && <p className="contact-err">{contactErr}</p>}
          </div>

          {/* Coupon code */}
          <div className="coupon-box">
            <span className="coupon-box-label">COUPON CODE</span>
            {coupon ? (
              <div className="coupon-applied">
                <span className="coupon-applied-code"><Check size={16} /> {coupon.code}</span>
                <span className="coupon-applied-amt">-{formatPrice(couponAmount)}</span>
                <button className="coupon-remove" onClick={removeCoupon} aria-label="Remove coupon">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="coupon-box-row">
                <input
                  value={couponCode}
                  onChange={e => { setCouponCode(e.target.value); if (couponErr) setCouponErr(''); }}
                  onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                  placeholder="ENTER CODE"
                />
                <button onClick={applyCoupon}>APPLY</button>
              </div>
            )}
            {couponErr && <p className="coupon-err">{couponErr}</p>}
          </div>

          {/* Payment options */}
          <h3 className="checkout-section-title">Payment Options</h3>
          <div className="payment-options">
            {PAYMENT_OPTIONS.map(opt => (
              <label key={opt.id} className={`payment-option ${payment === opt.id ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  checked={payment === opt.id}
                  onChange={() => setPayment(opt.id)}
                />
                {opt.tag && <span className="gpay-tag">{opt.tag}</span>}
                <span className="payment-label">{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="buy-with-wrap">
            <button
              className={`buy-with-btn ${payment === 'gpay' ? '' : 'pay-mode'}`}
              onClick={placeOrder}
            >
              {payment === 'gpay'
                ? <>Buy With <span className="gpay-tag light">G Pay</span></>
                : `PAY ${formatPrice(finalTotal)}`}
            </button>
          </div>
          <p className="checkout-order-no"># {orderNumber}</p>
        </div>

        {/* RIGHT: basket */}
        <aside className="checkout-basket">
          <h3 className="basket-title">Your Basket</h3>

          <div className="checkout-fulfil-toggle">
            <span className="fulfil-thumb" style={{ left: isDelivery ? '4px' : '50%' }}></span>
            <button
              className={`fulfil-btn ${isDelivery ? 'active' : ''}`}
              onClick={() => setFulfillmentType('delivery')}
            >
              <Car size={16} />
              <span className="fulfil-text"><strong>Delivery</strong><small>Pre-order</small></span>
            </button>
            <button
              className={`fulfil-btn ${!isDelivery ? 'active' : ''}`}
              onClick={() => setFulfillmentType('pickup')}
            >
              <ShoppingBag size={15} />
              <span className="fulfil-text"><strong>Pickup</strong><small>Pre-order</small></span>
            </button>
          </div>


          {firstOrderEligible && !coupon && (
            <div className="first-order-banner">
              <Check size={16} /> 20% off your first order applied!
            </div>
          )}
          {!user && (
            <div className="first-order-prompt">
              🎉 <strong>Sign in</strong> to get <strong>20% off</strong> your first order.
            </div>
          )}

          {/* You may also like */}
          <p className="basket-subtitle">YOU MAY ALSO LIKE</p>
          <div className="suggest-scroll">
            {recommendedItems.map(rec => {
              const full = menuItems.find(i => i.id === rec.id);
              return (
                <div key={rec.id} className="suggest-card">
                  <img src={full?.image || '/images/Recommended For you/1.png'} alt={rec.title} />
                  <div className="suggest-info">
                    <h5>{rec.title}</h5>
                    <span>{formatPrice(rec.price)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart line items */}
          <div className="basket-items">
            {cartItems.map(item => (
              <div key={item.id} className="basket-item">
                <span className="basket-item-qty">{item.quantity}x</span>
                <span className="basket-item-name">{item.title}</span>
                <span className="basket-item-price">{formatPrice(item.price * item.quantity)}</span>
                <button className="basket-item-remove" onClick={() => removeItem(item.id)} aria-label="Remove">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <button className="cooking-row">
            <PlusCircle size={20} /> Add Cooking Instructions
          </button>

          <div className="allergy-note">
            <AlertTriangle size={16} className="allergy-icon" />
            <span>If you're allergic or intolerant to any items, <a href="/allergy-info">Tap here</a></span>
          </div>

          {appliedDiscount && (
            <>
              <div className="basket-subtotal">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="basket-discount">
                <span>{appliedDiscount.label || `Discount (${appliedDiscount.code})`}</span>
                <span>-{formatPrice(appliedDiscount.amount)}</span>
              </div>
            </>
          )}
          <div className="basket-total">
            <span>Total</span>
            <span>{formatPrice(finalTotal)}</span>
          </div>
        </aside>
      </div>

      {/* Mobile-only bottom action bar */}
      <div className="checkout-mobile-actionbar">
        {onPaymentStep ? (
          <button
            className={`mobile-pay-btn ${payment === 'gpay' ? 'gpay' : ''}`}
            onClick={placeOrder}
          >
            {payment === 'gpay'
              ? <>Buy With <span className="gpay-tag light">G Pay</span></>
              : `PAY ${formatPrice(finalTotal)}`}
          </button>
        ) : (
          <div className="mobile-actionbar-btns">
            <button className="mobile-checkout-btn" onClick={goToPayment}>CHECKOUT</button>
            <button className="mobile-buy-btn" onClick={placeOrder}>
              Buy With <span className="gpay-tag light">G Pay</span>
            </button>
          </div>
        )}
        <p className="mobile-order-no"># {orderNumber}</p>
      </div>

      {/* Change location popup */}
      {showLocationModal && (
        <div className="location-modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="location-modal" onClick={e => e.stopPropagation()}>
            <div className="location-modal-head">
              <h3><Info size={20} /> You are in a new location</h3>
              <button className="location-modal-close" onClick={() => setShowLocationModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="checkout-fulfil-toggle location-toggle">
              <span className="fulfil-thumb" style={{ left: isDelivery ? '4px' : '50%' }}></span>
              <button
                className={`fulfil-btn ${isDelivery ? 'active' : ''}`}
                onClick={() => setFulfillmentType('delivery')}
              >
                <Car size={16} />
                <span className="fulfil-text"><strong>Delivery</strong><small>Pre-order</small></span>
              </button>
              <button
                className={`fulfil-btn ${!isDelivery ? 'active' : ''}`}
                onClick={() => setFulfillmentType('pickup')}
              >
                <ShoppingBag size={15} />
                <span className="fulfil-text"><strong>Pickup</strong><small>Pre-order</small></span>
              </button>
            </div>

            <button className="location-add-address" onClick={openAddressPopup}>
              <PlusCircle size={18} /> Add Address
            </button>

            {deliveryAddress?.line && (
              <>
                <div className="location-saved-head">SAVED ADDRESS</div>
                <label className="location-saved-row selected">
                  <input
                    type="radio"
                    name="saved-address"
                    defaultChecked
                  />
                  <span className="location-saved-line">{deliveryAddress.line}</span>
                  <button
                    className="location-saved-edit"
                    onClick={(e) => { e.preventDefault(); openAddressPopup(); }}
                    aria-label="Edit address"
                  >
                    <Pencil size={16} />
                  </button>
                </label>
                <p className="location-out-of-area">This address falls outside of the takeaway's delivery area.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Schedule popup */}
      {showSchedule && (
        <div className="location-modal-overlay" onClick={() => setShowSchedule(false)}>
          <div className="location-modal schedule-popup" onClick={e => e.stopPropagation()}>
            <div className="location-modal-head">
              <h3>When would you like to have your order</h3>
              <button className="location-modal-close" onClick={() => setShowSchedule(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="sched-tabs">
              <button className="sched-tab active">
                <span className="sched-tab-date">Today<br />{ukTodayLabel()}</span>
                <span className="sched-tab-check"><Check size={13} strokeWidth={3} /></span>
              </button>
            </div>

            <div className="sched-list">
              <label className="sched-option">
                <input
                  type="radio"
                  name="checkout-time"
                  checked={scheduledSlot === 'now'}
                  onChange={() => { setScheduledSlot('now'); setShowSchedule(false); }}
                />
                Schedule now (Ready in 30 mins)
              </label>
              {availableSlots.map(slot => (
                <label key={slot.label} className="sched-option">
                  <input
                    type="radio"
                    name="checkout-time"
                    checked={scheduledSlot === slot.label}
                    onChange={() => { setScheduledSlot(slot.label); setShowSchedule(false); }}
                  />
                  {slot.label}
                </label>
              ))}
              {availableSlots.length === 0 && (
                <p className="sched-empty">No more slots available today — ordering resumes tomorrow.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
