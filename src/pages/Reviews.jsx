import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, Info, Star, CornerUpLeft, PenLine } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ReviewModal from '../components/ReviewModal';
import './Reviews.css';

// Standard owner reply used on several reviews.
const REPLY = "Hi there, Thank you for your custom and giving us a rating, we really appreciate the feedback. American Fried Chicken team";

// Genuine reviews (name `n`, rating `r`, optional comment `t`, `f` = Foodhub
// source tag, `resp` = owner response).
const REVIEWS = [
  { n: 'Michael', r: 5 },
  { n: 'Zayne', r: 5, t: 'Quick, Hot and Tasty', f: true, resp: REPLY },
  { n: 'Stanley', r: 4 },
  { n: 'Jennifer', r: 4 },
  { n: 'Connor', r: 5 },
  { n: 'Chloe', r: 5, t: 'Delivered promptly and piping hot. Their hot wings and barbecue wings are particularly good.' },
  { n: 'Chaz', r: 5 },
  { n: 'Patrick', r: 4 },
  { n: 'Robert', r: 5 },
  { n: 'Robert', r: 5 },
  { n: 'Mrs', r: 5 },
  { n: 'David', r: 5 },
  { n: 'Louise', r: 5, t: 'Amazing fast delivery and food was lovely. Cant fault this place. Far far far better then kfc.' },
  { n: 'Zain', r: 5 },
  { n: 'Ursula', r: 5 },
  { n: 'Joshin', r: 5 },
  { n: 'Kishor', r: 5 },
  { n: 'Chaz', r: 5 },
  { n: 'Ali', r: 1, f: true },
  { n: 'Sam', r: 5 },
  { n: 'Hamza', r: 5 },
  { n: 'Trevor', r: 1, f: true },
  { n: 'Ali', r: 5 },
  { n: 'Chaz', r: 5, t: "Absolutely first-class customer service to correct a problem that wasn't their fault in the first place." },
  { n: 'Ray', r: 5, f: true },
  { n: 'Stanley', r: 4 },
  { n: 'saiganesh', r: 5, resp: REPLY },
  { n: 'Robert', r: 5 },
  { n: 'Garry', r: 4, f: true },
  { n: 'Robert', r: 5 },
  { n: 'Carly', r: 5 },
  { n: 'Ray', r: 5, f: true },
  { n: 'Elliot', r: 5 },
  { n: 'Michael', r: 5 },
  { n: 'Trevor', r: 5, resp: REPLY },
  { n: 'Louis', r: 5 },
  { n: 'Mrs', r: 3 },
  { n: 'Robert', r: 5 },
  { n: 'Hamza', r: 5 },
  { n: 'Robert', r: 5 },
  { n: 'Hamza', r: 5 },
  { n: 'Mark', r: 5 },
  { n: 'sarah', r: 5, f: true },
  { n: 'Robert', r: 5 },
  { n: 'Hamza', r: 5 },
  { n: 'Hamza', r: 5 },
  { n: 'Jennifer', r: 5 },
  { n: 'Ray', r: 5, f: true },
  { n: 'Robert', r: 5 },
  { n: 'Robert', r: 4 },
  { n: 'Hamza', r: 5 },
  { n: 'Carly', r: 4, resp: REPLY },
  { n: 'David', r: 5, t: 'Really quick and tasty', f: true },
  { n: 'Robert', r: 5 },
  { n: 'Mark', r: 5 },
  { n: 'Joshin', r: 5 },
  { n: 'Ray', r: 5, t: 'Juicy', f: true },
  { n: 'Robert', r: 5 },
  { n: 'Ali', r: 4 },
  { n: 'Vinny', r: 5, t: 'Decent wings', f: true },
  { n: 'Jennifer', r: 5, t: 'Absolutely beautiful foods as a treat my little family love it', f: true },
  { n: 'JKStanley', r: 1, t: "Refuse to take orders via this app claiming there's a fault! It has been nearly a year since this was said.... Just get it fixed!!!!", f: true, resp: "Hi there, sorry for your inconvenience caused by us. We are happy to say that our app is back and you can order through this app now.\nThank you for your custom\nAmerican Fried Chicken team" },
  { n: 'Stanley', r: 4 },
  { n: 'Dikshya', r: 5 },
  { n: 'umit', r: 1 },
  { n: 'Ray', r: 5, f: true },
  { n: 'Kishor', r: 5 },
  { n: 'Louise', r: 5, t: 'No complaints . All perfect,hot and fast delivery.' },
  { n: 'JKStanley', r: 1, f: true },
  { n: 'Hamza', r: 5 },
  { n: 'Louise', r: 5, t: 'Always amazing' },
  { n: 'Ray', r: 5, f: true },
  { n: 'Michael', r: 5 },
  { n: 'Kerry', r: 5 },
  { n: 'Ray', r: 5 },
  { n: 'Chaz', r: 3, t: "They were out of BBQ wings so I accepted Korean BBQ wings as a substitute. Really didn't like them, unfortunately." },
  { n: 'Elliot', r: 5 },
  { n: 'Jennifer', r: 5, f: true },
  { n: 'Louise', r: 5, t: 'Amazing as always' },
  { n: 'sarah', r: 5, f: true },
  { n: 'Stuart', r: 5 },
  { n: 'Hamza', r: 5 },
  { n: 'Michael', r: 5 },
  { n: 'Ursula', r: 5 },
  { n: 'Louis', r: 5 },
  { n: 'Joshin', r: 5 },
  { n: 'Robert', r: 4 },
  { n: 'sarah', r: 5 },
  { n: 'Elliot', r: 5 },
  { n: 'Elliot', r: 5 },
  { n: 'Trevor', r: 5 },
  { n: 'Dikshya', r: 5 },
  { n: 'JKStanley', r: 4, f: true },
  { n: 'Joshin', r: 5 },
  { n: 'Chaz', r: 5 },
  { n: 'Robert', r: 5 },
  { n: 'Ray', r: 5, t: 'Nice', f: true },
  { n: 'Kerry', r: 5 },
  { n: 'Michael', r: 5 },
  { n: 'Stuart', r: 5 },
  { n: 'garrat', r: 1 },
  { n: 'Michael', r: 5 },
  { n: 'Stanley', r: 5 },
  { n: 'sarah', r: 5 },
  { n: 'Angela', r: 5, f: true, resp: REPLY },
  { n: 'Vinny', r: 5, resp: REPLY },
  { n: 'Chloe', r: 5 },
  { n: 'Jennifer', r: 5, t: 'Always hot and fresh and always fantastic range of foods, myself and children love it here when having a treat in the week!', f: true },
  { n: 'Kishor', r: 4 },
  { n: 'Zain', r: 5, resp: REPLY },
  { n: 'Patrick', r: 5 },
  { n: 'Hamza', r: 5 },
  { n: 'Elliot', r: 5, f: true },
  { n: 'Robert', r: 5 },
  { n: 'Mark', r: 5 },
  { n: 'Dikshya', r: 5, resp: 'Thank you for your kind review! We appreciate' },
  { n: 'Ray', r: 5 },
  { n: 'Samantha', r: 5 },
  { n: 'Dikshya', r: 5 },
  { n: 'Dikshya', r: 5, resp: REPLY },
  { n: 'Joshin', r: 5 },
  { n: 'Chaz', r: 5 },
  { n: 'Stuart', r: 5 },
  { n: 'Carly', r: 5 },
  { n: 'Chaz', r: 5, t: "Lessons clearly learned from last time; food all arrived piping hot.\nAs per usual i can't fault the quality of the food: easily the best takeaway chicken in Bolton,  IMO" },
  { n: 'Connor', r: 5 },
  { n: 'Patrick', r: 5 },
  { n: 'Dikshya', r: 5 },
  { n: 'Robert', r: 5 },
  { n: 'Hamza', r: 5 },
  { n: 'Robert', r: 5 },
  { n: 'Kerry', r: 5 },
  { n: 'Ray', r: 5 },
  { n: 'JKStanley', r: 4, f: true },
  { n: 'Sam', r: 5 },
  { n: 'Ray', r: 5, f: true },
  { n: 'Ray', r: 5, f: true },
  { n: 'Robert', r: 5 },
  { n: 'Chaz', r: 5 },
  { n: 'Kerry', r: 5, t: "Food is excellent as always, and I'd give them an extra star for customer service if I could, as, without going into details, they made up for a previous error (which apparently wasn't even really their fault). Thanks very much!" },
  { n: 'Angela', r: 1 },
  { n: 'Jennifer', r: 5, t: 'Absolutely beautifully delicious!', f: true },
  { n: 'Patrick', r: 5 },
  { n: 'Chloe', r: 5, t: 'Always brilliant food and delivery is really quick!', resp: REPLY },
  { n: 'Ray', r: 5, t: 'Great', f: true },
  { n: 'Jennifer', r: 5, f: true },
  { n: 'Jodie', r: 5, t: 'Amazing! Best chicken in the whole of Bolton!', f: true },
  { n: 'Joshin', r: 5 },
  { n: 'Zain', r: 5, t: 'Amazing food', f: true },
  { n: 'JKStanley', r: 4, f: true },
  { n: 'Ray', r: 4 },
  { n: 'Robert', r: 5 },
  { n: 'Ray', r: 5 },
  { n: 'Kerry', r: 5 },
  { n: 'Angela', r: 1 },
  { n: 'Vinny', r: 5, f: true },
  { n: 'JKStanley', r: 4, f: true },
  { n: 'JKStanley', r: 4 },
  { n: 'Andrew', r: 5, t: 'Great food great service as always', resp: REPLY },
  { n: 'Stanley', r: 4 },
];

const Stars = ({ count }) => (
  <span className="review-stars">
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} size={16} fill="#f5a623" stroke="#f5a623" />
    ))}
  </span>
);

const Reviews = () => {
  const { userReviews, addReview, user } = useCart();
  const [filter, setFilter] = useState('all');
  const [writeOpen, setWriteOpen] = useState(false);

  // Customer-submitted reviews (newest first) on top of the seeded reviews.
  const all = useMemo(() => {
    const mine = (userReviews || []).map(u => ({ n: u.name, r: u.rating, t: u.text || undefined, mine: true }));
    return [...mine, ...REVIEWS];
  }, [userReviews]);

  const counts = useMemo(() => all.reduce((acc, r) => { acc[r.r] = (acc[r.r] || 0) + 1; return acc; }, {}), [all]);
  const total = all.length;
  const avg = total ? (all.reduce((s, r) => s + r.r, 0) / total).toFixed(1) : '0.0';
  const filters = [
    { key: 'all', stars: 0, count: total },
    { key: '5', stars: 5, count: counts[5] || 0 },
    { key: '4', stars: 4, count: counts[4] || 0 },
    { key: '3', stars: 3, count: counts[3] || 0 },
    { key: '2', stars: 2, count: counts[2] || 0 },
    { key: '1', stars: 1, count: counts[1] || 0 },
  ];

  const visible = filter === 'all' ? all : all.filter(r => r.r === Number(filter));

  return (
    <div className="reviews-page">
      {/* Header */}
      <header className="reviews-header">
        <div>
          <h1>Review of the American Fried Chicken in Bolton</h1>
          <Link to="/info" className="reviews-info-link"><Info size={14} /> Info</Link>
        </div>
        <Link to="/" className="reviews-order-now">ORDER NOW</Link>
      </header>

      <div className="reviews-body">
        {/* LEFT: reviews list */}
        <div className="reviews-main">
          <div className="reviews-list-head-row">
            <h2 className="reviews-list-head"><ThumbsUp size={20} /> Reviews</h2>
            <button className="write-review-btn" onClick={() => setWriteOpen(true)}>
              <PenLine size={16} /> Write Reviews
            </button>
          </div>
          <div className="reviews-list">
            {visible.map((r, i) => (
              <div key={i} className="review-card">
                <h4>{r.n}</h4>
                <Stars count={r.r} />
                {r.t && <p className="review-text">{r.t}</p>}
                {r.f && <span className="review-foodhub">VERIFIED</span>}
                {r.resp && (
                  <div className="review-response">
                    <span className="review-response-head"><CornerUpLeft size={14} /> Response from American Fried Chicken</span>
                    <p>{r.resp}</p>
                  </div>
                )}
              </div>
            ))}
            {visible.length === 0 && (
              <div className="review-card"><p className="reviews-empty">No reviews with this rating yet.</p></div>
            )}
          </div>
        </div>

        {/* RIGHT: summary + sort */}
        <aside className="reviews-side">
          <div className="reviews-summary">
            <div className="reviews-score">{avg}</div>
            <div className="reviews-count">({total} Reviews)</div>
            <div className="reviews-recommend">Highly Recommended</div>
          </div>

          <div className="reviews-sort">
            <h3>Sort by</h3>
            {filters.map(f => (
              <label key={f.key} className={`sort-option ${filter === f.key ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="review-filter"
                  checked={filter === f.key}
                  onChange={() => setFilter(f.key)}
                />
                {f.key === 'all' ? (
                  <span className="sort-all">All</span>
                ) : (
                  <span className="sort-stars-row">
                    <Stars count={f.stars} />
                    <span className="sort-count">({f.count})</span>
                  </span>
                )}
              </label>
            ))}
          </div>
        </aside>
      </div>

      {writeOpen && (
        <ReviewModal
          title="Write a Review"
          subtitle="Tap a star and tell us about your experience."
          defaultName={user?.name || ''}
          onClose={() => setWriteOpen(false)}
          onSubmit={(rating, text, name) => {
            addReview({ name: name || user?.name || 'Guest', rating, text });
            setWriteOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Reviews;
