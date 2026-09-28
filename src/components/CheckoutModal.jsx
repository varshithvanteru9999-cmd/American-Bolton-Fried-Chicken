import React, { useState } from 'react';
import { X } from 'lucide-react';
import formatPrice from '../utils/formatPrice';
import '../components.css';

const CheckoutModal = ({ total, onClose, onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'card'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete();
  };

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  return (
    <div className="modal-overlay center" onClick={onClose}>
      <div className="modal-content centered" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Checkout</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="john@example.com" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="07000000000" />
            </div>
            <div className="form-group">
              <label>Delivery Address</label>
              <textarea name="address" required value={formData.address} onChange={handleChange} rows="3" placeholder="123 Street, City..."></textarea>
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} style={{padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '1rem'}}>
                <option value="card">Credit/Debit Card (Pay Online)</option>
                <option value="cash">Cash on Delivery</option>
              </select>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <div className="cart-total-row">
            <span>Total to Pay:</span>
            <span>{formatPrice(total)}</span>
          </div>
          <button form="checkout-form" type="submit" className="btn btn-primary" style={{width: '100%'}}>
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
