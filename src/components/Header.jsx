import BrandMark from './BrandMark';
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu as MenuIcon, X } from 'lucide-react';
import '../components.css';

const Header = ({ cartCount, onCartClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${isScrolled ? 'glass' : ''}`}>
      <div className="container header-content">
        <div className="logo-container">
          <BrandMark size={40} variant="light" />
        </div>

        <nav className="nav-links">
          <a href="#">Home</a>
          <a href="#menu-section">Menu</a>
          <a href="#about-section">About</a>
        </nav>

        <div className="header-actions">
          <button className="cart-btn" onClick={onCartClick}>
            <ShoppingBag size={24} />
            <span>Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown could go here */}
    </header>
  );
};

export default Header;
