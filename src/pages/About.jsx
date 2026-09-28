import BrandMark from '../components/BrandMark';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Hand, Smartphone, Utensils } from 'lucide-react';
import './About.css';

// Drawn from the live menu, using the same product photos the order page
// uses — the previous list showed items (Nutella muffins, cheesy chips) that
// are not on the menu, and two stock photos that were not our food.
const galleryItems = [
  { label: 'TOWER BURGER', img: '/images/items/tower-burger.webp' },
  { label: 'HOT & SPICY WINGS', img: '/images/items/10-hot-spicy-wings.webp' },
  { label: 'MEAT FEAST PIZZA', img: '/images/items/meat-feast.webp' },
  { label: 'FAMILY FEAST MEAL', img: '/images/items/family-feast-meal.webp' },
  { label: 'CHICKEN WRAP', img: '/images/items/chicken-wrap.webp' },
  { label: 'GARLIC BREAD', img: '/images/items/cheese-garlic-bread.webp' },
  { label: 'CHICKEN POPCORN', img: '/images/items/chicken-popcorn.webp' },
  { label: 'CHOCOLATE FUDGE CAKE', img: '/images/items/chocolate-fudge-cake.webp' },
];

const About = () => {
  return (
    <div className="about-page">
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-left">
          <h1>DELICIOUS<br />COOKING</h1>
          <Link to="/" className="btn-order">ORDER NOW <ArrowRight size={18} /></Link>
        </div>
        <div className="about-hero-right">
          <img className="img-front" src="/images/BURGERS/Premium Chicken Burger.jpg" alt="Chicken burger" />
          <img className="img-back" src="/images/BURGERS/Chicken Fillet Burger.jpg" alt="Chicken fillet burger" />
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works-wrap">
        <div className="how-it-works">
          <div className="step-card dark">
            <Hand size={38} strokeWidth={1.4} className="step-icon" />
            <h3>Pick A Dish</h3>
            <p>Pick the one you like most from our menu.</p>
          </div>
          <div className="step-card yellow">
            <Smartphone size={38} strokeWidth={1.4} className="step-icon" />
            <h3>Make Payment</h3>
            <p>You can now pay online for your foods.</p>
          </div>
          <div className="step-card dark">
            <Utensils size={38} strokeWidth={1.4} className="step-icon" />
            <h3>Receive Your Food</h3>
            <p>We will bring your food to your doorstep.</p>
          </div>
        </div>
      </section>

      {/* Passionate */}
      <section className="about-passion">
        <div className="about-passion-inner">
          <div className="passion-left">
            <h2>We're passionate about providing delicious and high quality food</h2>
          </div>
          <div className="passion-right">
            <p>Our priority is to satisfy all of our customers needs, we offer a variety of excellent food, prepared with the freshest and finest ingredients, to the highest standard.</p>
            <p>Our Takeaway offers delicious food at competitive prices. We now have a website, where you can order online, choose from our entire menu, order your favourite meals and have them delivered straight to your door!</p>
          </div>
        </div>
      </section>

      {/* Branding banner */}
      <section className="about-banner">
        <div className="about-banner-inner">
          <div className="about-banner-img">
            <BrandMark size={128} variant="dark" />
          </div>
          <div className="about-banner-divider"></div>
          <div className="about-banner-chicken">
            <img src="/images/MAIN ITEMS/2pcs Chicken.jpg" alt="Fried chicken" />
          </div>
        </div>
      </section>

      {/* Gallery strip with hover labels */}
      <section className="about-gallery">
        {galleryItems.map(item => (
          <div className="about-gallery-item" key={item.label}>
            <img src={item.img} alt={item.label} loading="lazy" />
            <div className="about-gallery-overlay"><span>{item.label}</span></div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default About;
