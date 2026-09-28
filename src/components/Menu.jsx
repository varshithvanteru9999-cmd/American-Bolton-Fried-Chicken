import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import formatPrice from '../utils/formatPrice';
import '../components.css';

const menuData = [
  {
    id: 1,
    title: 'Classic Cheese Burger',
    category: 'Burgers',
    price: 6.99,
    description: 'Juicy beef patty, melted cheddar, fresh lettuce, tomato, and our signature sauce.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 2,
    title: 'Double BBQ Bacon Burger',
    category: 'Burgers',
    price: 8.99,
    description: 'Two beef patties, crispy bacon, onion rings, and smoky BBQ sauce.',
    image: 'https://images.unsplash.com/photo-1594212691516-dbd966ce1e17?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 3,
    title: 'Spicy Chicken Burger',
    category: 'Burgers',
    price: 7.49,
    description: 'Crispy fried chicken breast, spicy mayo, jalapeños, and lettuce.',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 4,
    title: 'BBQ Ribs Half Rack',
    category: 'BBQ',
    price: 12.99,
    description: 'Slow-cooked pork ribs glazed in our sticky BBQ sauce, served with fries.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 5,
    title: 'BBQ Wings (6pcs)',
    category: 'BBQ',
    price: 5.99,
    description: 'Tender chicken wings tossed in rich BBQ sauce.',
    image: 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 6,
    title: 'Mixed Grill Platter',
    category: 'Grill',
    price: 18.99,
    description: 'A feast of grilled chicken, lamb chops, sausages, and grilled veggies.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

const categories = ['All', 'Burgers', 'BBQ', 'Grill'];

const Menu = ({ onAddToCart }) => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredMenu = activeCategory === 'All' 
    ? menuData 
    : menuData.filter(item => item.category === activeCategory);

  return (
    <section id="menu-section" className="menu-section">
      <div className="container">
        <div className="menu-header">
          <h2>Our Menu</h2>
          <p>Explore our wide variety of authentic fast-food options, freshly prepared for you.</p>
        </div>

        <div className="categories">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="menu-grid">
          {filteredMenu.map(item => (
            <div key={item.id} className="menu-item animate-fade-in">
              <img src={item.image} alt={item.title} className="menu-item-img" loading="lazy" decoding="async" />
              <div className="menu-item-content">
                <h3 className="menu-item-title">{item.title}</h3>
                <p className="menu-item-desc">{item.description}</p>
                <div className="menu-item-footer">
                  <span className="menu-item-price">{formatPrice(item.price)}</span>
                  <button 
                    className="btn-icon" 
                    onClick={() => onAddToCart(item)}
                    aria-label="Add to cart"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Menu;
