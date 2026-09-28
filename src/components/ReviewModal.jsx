import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { WORD_LIMIT, countWords, clampWords } from '../utils/reviewStore';
import './ReviewModal.css';

// Reusable star-rating popup: optional name + 1–5 stars + description (max 200
// words). `defaultName` prefills the field (e.g. a signed-in customer's name).
const ReviewModal = ({ title = 'Write a Review', subtitle, defaultName = '', onClose, onSubmit }) => {
  const [name, setName] = useState(defaultName);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const words = countWords(text);

  const submit = () => { if (rating < 1) return; onSubmit(rating, text.trim(), name.trim()); };

  return (
    <div className="review-overlay" onClick={onClose}>
      <div className="review-modal" onClick={e => e.stopPropagation()}>
        <button className="review-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        <h3 className="review-title">{title}</h3>
        {subtitle && <p className="review-subtitle">{subtitle}</p>}

        <input
          className="review-name-input"
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <div className="review-stars-pick">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              className="review-star-btn"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              <Star size={36} className={(hover || rating) >= n ? 'on' : ''} />
            </button>
          ))}
        </div>

        <textarea
          className="review-text-input"
          placeholder="Tell us about your experience (optional)"
          value={text}
          onChange={e => setText(clampWords(e.target.value))}
          rows={4}
        />
        <div className="review-wordcount">{words}/{WORD_LIMIT} words</div>

        <button className="review-submit" onClick={submit} disabled={rating < 1}>
          Submit Review
        </button>
      </div>
    </div>
  );
};

export default ReviewModal;
