import React from 'react';
import { ChevronRight } from 'lucide-react';
import '../components.css';

const Hero = ({ onOrderClick }) => {
  return (
    <section className="hero">
      <div className="hero-bg"></div>
      <div className="container hero-content animate-fade-in">
        <h1>Authentic Burgers & BBQ in <span>Bolton</span></h1>
        <p>Order online and enjoy delicious food delivered straight to your door. The #1 takeaway in town for 1000's of families.</p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={onOrderClick}>
            Order Now <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
