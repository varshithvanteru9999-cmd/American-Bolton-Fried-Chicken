import React from 'react';
import brand from '../data/brand';
import './BrandMark.css';

/**
 * The shop crest. Renders /Logo.png (drop the real crest artwork there) and
 * falls back to an inline SVG badge if that file is missing, so the header is
 * never left with a broken image.
 */
export const Crest = ({ size = 44, className = '' }) => {
  const [failed, setFailed] = React.useState(false);

  if (!failed) {
    return (
      <img
        src={brand.logo}
        alt={brand.legalName}
        width={size}
        height={size}
        className={`afc-crest ${className}`}
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    );
  }

  // Fallback badge: navy ring, red arc, cream banner — the crest's structure
  // reduced to shapes that read at 24px.
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`afc-crest ${className}`}
      role="img"
      aria-label={brand.legalName}
    >
      <circle cx="50" cy="50" r="48" fill="var(--afc-navy)" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="var(--afc-cream)" strokeWidth="2" />
      <path d="M18 38a34 34 0 0 1 64 0z" fill="var(--afc-red)" />
      <text x="50" y="33" textAnchor="middle" fill="#fff" fontSize="13"
            fontFamily="Oswald, sans-serif" fontWeight="700" letterSpacing="0.5">AFC</text>
      <rect x="14" y="56" width="72" height="18" rx="3" fill="var(--afc-cream)" />
      <text x="50" y="69" textAnchor="middle" fill="var(--afc-navy)" fontSize="11"
            fontFamily="Oswald, sans-serif" fontWeight="600" letterSpacing="1">BOLTON</text>
    </svg>
  );
};

/**
 * Crest + stacked wordmark. `variant` controls the text colour so it can sit
 * on the navy nav ("light") or a cream panel ("dark").
 */
const BrandMark = ({ size = 44, variant = 'light', showText = true, className = '' }) => (
  <span className={`afc-brandmark afc-brandmark-${variant} ${className}`}>
    <Crest size={size} />
    {showText && (
      <span className="afc-wordmark">
        <span className="afc-wordmark-top">AMERICAN</span>
        <span className="afc-wordmark-main">FRIED CHICKEN</span>
        <span className="afc-wordmark-sub">BOLTON · EST. LTD</span>
      </span>
    )}
  </span>
);

export default BrandMark;
