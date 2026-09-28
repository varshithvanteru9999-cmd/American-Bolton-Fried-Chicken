import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Info as InfoIcon, MapPin, Image as ImageIcon, Clock, Utensils, Star, X } from 'lucide-react';
import './Info.css';

// Gallery photos (captured from the live americanfriedchicken.co.uk gallery, in order)
const galleryImages = [
  'https://assets.foodhub.com/images/thumbnails/mi_1724488504phpbZl26J_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724487858phptukruj_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488981phpM51vIT_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488956phpubJsfn_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488341phpBl8Pty_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724339668phpLJ7t7A_500.jpg',
  'https://assets.foodhub.com/images/thumbnails/mi_1724499332php2vL9qR_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724498946php0cKO0K_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724498916phpXnLUqg_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488931phpDDx7kX_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488801phpVBLNl6_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488754phpHG7RF3_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488716phpTkblwx_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488569php8rUxCu_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488542phpC4Lb0A_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488440phpjfLZxL_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488392phpq3HtZK_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488300php7jhKQ0_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488269phpIDRD5J_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488180phpNjBPMo_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724488020php27lUrJ_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724487976phpugYise_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724487938phpiSrC3G_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724487903php5j4nCW_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724487822php6CB3BU_500.png',
  'https://assets.foodhub.com/images/thumbnails/mi_1724339651phpPnHXy1_500.jpg',
  'https://assets.foodhub.com/images/thumbnails/mi_1724182238phpevC8Pc_500.jpg',
  'https://assets.foodhub.com/images/thumbnails/mi_1724180093phpp7P0Ue_500.jpg',
  'https://assets.foodhub.com/private/d41d8cd98f00b204e9800998ecf8427e/jpg/1720623816.jpg',
  'https://assets.foodhub.com/private/d41d8cd98f00b204e9800998ecf8427e/jpg/1720623803.jpg',
  'https://assets.foodhub.com/private/d41d8cd98f00b204e9800998ecf8427e/jpg/1720623789.jpg',
  'https://assets.foodhub.com/private/d41d8cd98f00b204e9800998ecf8427e/jpg/1720623776.jpg',
  'https://assets.foodhub.com/private/d41d8cd98f00b204e9800998ecf8427e/jpg/1720623756.jpg',
];

const cuisines = [
  { name: 'Burgers', img: galleryImages[0] },
  { name: 'BBQ', img: galleryImages[27] },
  { name: 'Grill', img: galleryImages[2] },
];

const OPENING_HOURS = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
];

const Info = () => {
  const [showAllGallery, setShowAllGallery] = useState(false);

  return (
    <div className="info-page">
      {/* Header bar */}
      <header className="info-header">
        <div className="info-header-title">
          <h1>American Fried Chicken</h1>
          <span className="info-rating"><Star size={14} fill="#f5a623" stroke="#f5a623" /> 4.7 <small>(100+)</small></span>
        </div>
        <Link to="/" className="info-order-now">ORDER NOW</Link>
      </header>

      <div className="info-body">
        {/* LEFT column */}
        <div className="info-main">
          {/* INFO */}
          <section className="info-card">
            <h3 className="info-card-head"><InfoIcon size={16} /> INFO</h3>
            <div className="info-card-inner">
              <p>
                Order your food online from the #1 takeaway in the town. When it comes to
                Bolton, American Fried Chicken is the obvious choice for 100's of families.
                Try once, love it forever.
              </p>
            </div>
          </section>

          {/* LOCATION */}
          <section className="info-card">
            <h3 className="info-card-head"><MapPin size={16} /> LOCATION</h3>
            <div className="info-card-inner">
              <p className="info-address">Bolton Town Centre, Bolton, BL1 1AA</p>
              <p className="info-phone">+44 7534 571279</p>
              <div className="info-map">
                <iframe
                  title="American Fried Chicken location"
                  src="https://www.google.com/maps?q=Bolton%20Town%20Centre%2C%20Bolton%2C%20BL1%201AA&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </section>

          {/* GALLERY */}
          <section className="info-card">
            <div className="info-card-head info-card-head-row">
              <span><ImageIcon size={16} /> GALLERY</span>
              <button className="info-viewall" onClick={() => setShowAllGallery(true)}>View all</button>
            </div>
            <div className="info-card-inner">
              <div className="info-gallery">
                {galleryImages.slice(0, 5).map((src, i) => (
                  <img key={i} src={src} alt={`Gallery ${i + 1}`} loading="lazy" />
                ))}
                {galleryImages.length > 5 && (
                  <button className="gallery-more" onClick={() => setShowAllGallery(true)}>
                    <img src={galleryImages[5]} alt="More gallery photos" loading="lazy" />
                    <span className="gallery-more-overlay">{galleryImages.length - 5} more</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT column */}
        <aside className="info-side">
          {/* Food Hygiene Rating */}
          <section className="hygiene-card">
            <div className="hygiene-top">
              <span className="hygiene-title">Food Hygiene Rating</span>
              <span className="hygiene-date">Last Inspection:<br /><strong>22 Aug 2024</strong></span>
            </div>
            <div className="hygiene-scale">
              {[0, 1, 2, 3, 4, 5].map(n => (
                <span key={n} className={`hygiene-dot ${n === 5 ? 'active' : ''}`}>{n}</span>
              ))}
            </div>
            <span className="hygiene-label">VERY GOOD</span>
          </section>

          {/* CUISINES */}
          <section className="info-card">
            <h3 className="info-card-head"><Utensils size={16} /> CUISINES</h3>
            <div className="info-card-inner">
              <div className="info-cuisines">
                {cuisines.map(c => (
                  <div key={c.name} className="cuisine-item">
                    <img src={c.img} alt={c.name} />
                    <span>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* OPENING HOURS */}
          <section className="info-card">
            <h3 className="info-card-head"><Clock size={16} /> OPENING HOURS</h3>
            <div className="info-card-inner">
              <table className="hours-table">
                <thead>
                  <tr><th>Day</th><th>Pickup</th><th>Delivery</th></tr>
                </thead>
                <tbody>
                  {OPENING_HOURS.map(day => (
                    <tr key={day} className={day === 'Sat' ? 'hours-highlight' : ''}>
                      <td>{day}</td>
                      <td>11:00 AM - 11:00 PM</td>
                      <td>11:00 AM - 11:00 PM</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </aside>
      </div>

      {/* Gallery lightbox — all photos */}
      {showAllGallery && (
        <div className="gallery-modal-overlay" onClick={() => setShowAllGallery(false)}>
          <div className="gallery-modal" onClick={e => e.stopPropagation()}>
            <div className="gallery-modal-head">
              <div className="gallery-modal-title">
                <h3>American Fried Chicken</h3>
                <span className="info-rating"><Star size={14} fill="#f5a623" stroke="#f5a623" /> 4.7 <small>(100+)</small></span>
              </div>
              <div className="gallery-modal-actions">
                <Link to="/" className="info-order-now" onClick={() => setShowAllGallery(false)}>ORDER NOW</Link>
                <button className="gallery-modal-close" onClick={() => setShowAllGallery(false)} aria-label="Close">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="gallery-modal-grid">
              {galleryImages.map((src, i) => (
                <img key={i} src={src} alt={`Gallery ${i + 1}`} loading="lazy" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Info;
