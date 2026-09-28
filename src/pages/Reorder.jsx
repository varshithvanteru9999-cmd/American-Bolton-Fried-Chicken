import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import formatPrice from '../utils/formatPrice';
import { toast } from '../utils/alerts';
import { WORD_LIMIT, countWords, clampWords, markItemReviewed, itemReviewed } from '../utils/reviewStore';
import './Reorder.css';

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// Per-item rating + description (max 200 words). Submits to the Reviews page.
const ItemReview = ({ item, user, addReview }) => {
  const [done, setDone] = useState(() => itemReviewed(item.id));
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');

  if (done) return <p className="reorder-reviewed">✓ Thanks for your review</p>;

  const submit = () => {
    if (rating < 1) return;
    addReview({ name: user?.name || 'Guest', rating, text, item: item.title });
    markItemReviewed(item.id);
    setDone(true);
    toast('Thanks for your review!');
  };

  return (
    <div className="reorder-review">
      <span className="reorder-review-label">Rate this item</span>
      <div className="reorder-stars">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            className="reorder-star"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <Star size={22} className={(hover || rating) >= n ? 'on' : ''} />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <textarea
            className="reorder-review-text"
            placeholder="Describe your experience (optional)"
            value={text}
            onChange={e => setText(clampWords(e.target.value))}
            rows={3}
          />
          <div className="reorder-review-foot">
            <span className="reorder-wordcount">{countWords(text)}/{WORD_LIMIT} words</span>
            <button className="reorder-review-submit" onClick={submit}>Submit Review</button>
          </div>
        </>
      )}
    </div>
  );
};

const Reorder = () => {
  const navigate = useNavigate();
  const { user, orderHistory, addToCart, addReview } = useCart();

  // Only show history for signed-in users, limited to the last month
  const recentOrders = user
    ? orderHistory.filter(o => Date.now() - new Date(o.date).getTime() <= MONTH_MS)
    : [];

  // De-duplicate items across recent orders (keep the most recent of each)
  const itemsById = {};
  recentOrders.forEach(order => {
    order.items.forEach(item => {
      if (!itemsById[item.id]) itemsById[item.id] = item;
    });
  });
  const items = Object.values(itemsById);

  return (
    <div className="reorder-page">
      {items.length > 0 ? (
        <div className="reorder-content">
          <h2 className="reorder-title">Order Again</h2>
          <p className="reorder-subtitle">Items you've ordered in the last month</p>
          <div className="reorder-grid">
            {items.map(item => (
              <div key={item.id} className="reorder-card">
                {item.image && <img src={item.image} alt={item.title} className="reorder-card-img" loading="lazy" decoding="async" />}
                <div className="reorder-card-body">
                  <h4>{item.title}</h4>
                  <div className="reorder-card-foot">
                    <span className="reorder-price">{formatPrice(item.price)}</span>
                    <button className="reorder-add" onClick={() => addToCart(item)} aria-label={`Add ${item.title}`}>
                      <Plus size={16} /> Add
                    </button>
                  </div>
                  <ItemReview item={item} user={user} addReview={addReview} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="reorder-empty">
          <p className="reorder-empty-title">Use this page to reorder your favorite items!</p>
          <p className="reorder-empty-sub">Order something to see it here</p>
          <button className="reorder-browse" onClick={() => navigate('/')}>Browse the menu</button>
        </div>
      )}
    </div>
  );
};

export default Reorder;
