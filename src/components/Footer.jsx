import React from 'react';
import '../components.css';
import brand from '../data/brand';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h3>{brand.legalName}</h3>
          <p>{brand.tagline}</p>
          <p>We pride ourselves on providing the best authentic burgers, BBQ, and grill items in town.</p>
        </div>
        
        <div>
          <h3>Contact Us</h3>
          <p>{brand.addressLine1}</p>
          <p>{brand.addressLine2}</p>
          <p>Phone: {brand.phone}</p>
        </div>

        <div>
          <h3>Opening Hours</h3>
          <p>{brand.hours}</p>
        </div>

        <div>
          <h3>Legal</h3>
          <div className="footer-links">
            <a href="#">Terms & Conditions</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Cookie Policy</a>
            <a href="#">Allergy Information</a>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {brand.legalName}. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
