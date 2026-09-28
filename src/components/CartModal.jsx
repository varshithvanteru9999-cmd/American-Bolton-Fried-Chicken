import React from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import formatPrice from '../utils/formatPrice';
import '../components.css';

const CartModal = ({ items, total, onClose, onUpdateQuantity, onRemove, onCheckout }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Your Cart</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {items.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is currently empty.</p>
            </div>
          ) : (
            <div className="cart-items">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.title} className="cart-item-img" loading="lazy" decoding="async" />
                  <div className="cart-item-info">
                    <h4 className="cart-item-title">{item.title}</h4>
                    <div className="cart-item-price">{formatPrice(item.price * item.quantity)}</div>
                    
                    <div className="cart-item-actions">
                      <button className="qty-btn" onClick={() => onUpdateQuantity(item.id, -1)}>
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button className="qty-btn" onClick={() => onUpdateQuantity(item.id, 1)}>
                        <Plus size={14} />
                      </button>
                      <button 
                        className="btn-icon" 
                        style={{marginLeft: 'auto', border: 'none', color: '#dc3545'}}
                        onClick={() => onRemove(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="modal-footer">
            <div className="cart-total-row">
              <span>Total:</span>
              <span>{formatPrice(total)}</span>
            </div>
            <button className="btn btn-primary" style={{width: '100%'}} onClick={onCheckout}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
