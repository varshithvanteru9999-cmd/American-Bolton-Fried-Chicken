import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import formatPrice from '../utils/formatPrice';
import { isAcceptingOrders } from '../utils/storeHours';
import { normalizeOptions, optionsPrice, invalidOptionGroups, toggleOptionChoice } from '../utils/options';
import './OrderNow.css';
import './CategoryPage.css';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { addToCart, menuConfig, categoryConfig, allMenuItems } = useCart();
  const menuItems = allMenuItems;

  const category = decodeURIComponent(categoryName);
  const categoryLabel = categoryConfig[category]?.name || category;

  const [showFilter, setShowFilter] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [heroVisible, setHeroVisible] = useState(true);

  const acceptingOrders = isAcceptingOrders();

  // Item customization modal (same behaviour as OrderNow)
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [optionSel, setOptionSel] = useState({});
  const [optionErrors, setOptionErrors] = useState([]);

  const trimmed = filterQuery.trim().toLowerCase();
  const items = menuItems
    .filter(item => {
      const cfg = menuConfig[item.id] || {};
      if (cfg.deleted === true || cfg.visible === false) return false;
      const effCat = cfg.category || item.category;
      if (effCat !== category) return false;
      return !trimmed || (cfg.name || item.title).toLowerCase().includes(trimmed);
    })
    .map(item => {
      const cfg = menuConfig[item.id] || {};
      const effCat = cfg.category || item.category;
      return {
        ...item,
        category: effCat,
        ...(cfg.price != null ? { price: cfg.price } : {}),
        ...(cfg.name ? { title: cfg.name } : {}),
        ...(cfg.image ? { image: cfg.image } : {}),
        ...(cfg.desc != null ? { desc: cfg.desc } : {}),
        ...(cfg.options ? { options: normalizeOptions(cfg.options) } : {}),
        available: cfg.hidden !== true && categoryConfig[effCat]?.hidden !== true,
      };
    });

  const openItemModal = (item) => {
    if (item?.available === false) return; // unavailable items can't be ordered
    setSelectedItem(item);
    setItemQuantity(1);
    setSelectedAddons([]);
    setOptionSel({});
    setOptionErrors([]);
  };

  const onOptionToggle = (group, name) => {
    setOptionSel(prev => toggleOptionChoice(prev, group, name));
    setOptionErrors(prev => prev.filter(id => id !== group.id));
  };

  const handleAddonToggle = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) return prev.filter(a => a.id !== addon.id);
      return [...prev, addon];
    });
  };

  const handleModalAdd = () => {
    if (!selectedItem) return;
    const invalid = invalidOptionGroups(selectedItem, optionSel);
    if (invalid.length) { setOptionErrors(invalid); return; }
    const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0)
      + optionsPrice(selectedItem, optionSel);
    const chosenOptions = selectedItem.options
      ? selectedItem.options.flatMap(g => optionSel[g.id] || [])
      : [];
    const finalItem = {
      ...selectedItem,
      price: selectedItem.price + addonsPrice,
      selectedAddons,
      selectedOptions: chosenOptions,
    };
    for (let i = 0; i < itemQuantity; i++) {
      addToCart(finalItem);
    }
    setSelectedItem(null);
  };

  const modalTotalPrice = selectedItem
    ? (selectedItem.price
        + selectedAddons.reduce((s, a) => s + a.price, 0)
        + optionsPrice(selectedItem, optionSel)) * itemQuantity
    : 0;

  return (
    <div className="category-page">
      {/* Sticky header: back arrow, category name, search */}
      <div className="category-page-header">
        <button className="header-icon-btn" onClick={() => navigate('/')} aria-label="Back to menu">
          <ArrowLeft size={22} />
        </button>
        <h2>{categoryLabel}</h2>
        <button
          className="header-icon-btn"
          onClick={() => { setShowFilter(s => !s); setFilterQuery(''); }}
          aria-label="Search this category"
        >
          <Search size={20} />
        </button>
      </div>

      {showFilter && (
        <div className="category-filter-row">
          <input
            autoFocus
            type="text"
            placeholder={`Search in ${category}...`}
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
          />
        </div>
      )}

      {/* Category hero image (hidden gracefully if the image is missing) */}
      {heroVisible && (
        <img
          className="category-hero"
          src={`/images/Main Img Category/${category}.png`}
          alt={category}
          onError={() => setHeroVisible(false)}
        />
      )}

      <div className="category-items">
        {items.length === 0 && (
          <p className="category-empty">
            {trimmed ? `No items match "${filterQuery}"` : 'No items in this category yet.'}
          </p>
        )}
        {items.map(item => {
          const unavailable = item.available === false;
          return (
            <div
              key={item.id}
              className={`menu-item-card ${unavailable ? 'item-unavailable' : ''}`}
              onClick={() => { if (!unavailable) openItemModal(item); }}
            >
              <div className="item-details">
                <h4>{item.title}</h4>
                <p className="item-desc">{item.desc}</p>
                <p className="item-price">{formatPrice(item.price)}</p>
                {unavailable && <p className="item-unavailable-label">Item Unavailable</p>}
              </div>
              {item.image && (
                <div className="item-image-wrapper">
                  <img src={item.image} alt={item.title} className="item-image" loading="lazy" decoding="async" />
                </div>
              )}
              {!unavailable && (
                <button className="add-btn" onClick={(e) => { e.stopPropagation(); openItemModal(item); }}>
                  <Plus size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Item Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content item-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}><X size={24} /></button>
            <div className="item-modal-header">
              {selectedItem.image && <img src={selectedItem.image} alt={selectedItem.title} className="modal-item-img" />}
              <div className="modal-item-info">
                <h2>{selectedItem.title}</h2>
                <p>{selectedItem.desc}</p>
              </div>
            </div>

            <div className="item-modal-body">
              {selectedItem.options && optionErrors.length > 0 && (
                <div className="option-warning-banner">
                  <Search size={16} /> Please choose the required option{optionErrors.length > 1 ? 's' : ''}.
                </div>
              )}
              {selectedItem.options && selectedItem.options.map(group => {
                const hasError = optionErrors.includes(group.id);
                const shapeClass = group.required ? 'opt-circle' : 'opt-square';
                return (
                  <div key={group.id} className={`option-group ${hasError ? 'option-group-error' : ''}`}>
                    <div className="option-group-head">
                      <span className="option-group-title">{group.label}</span>
                      <span className={`option-group-req ${hasError ? 'is-error' : ''}`}>{group.required ? 'Required' : 'Optional'}</span>
                    </div>
                    {group.note && <p className="option-group-note">{group.note}</p>}
                    <div className="option-choices">
                      {group.choices.map(choice => (
                        <label key={choice.name} className={`option-choice ${shapeClass}`}>
                          <input
                            type={group.multi ? 'checkbox' : 'radio'}
                            name={`${selectedItem.id}-${group.id}`}
                            checked={(optionSel[group.id] || []).includes(choice.name)}
                            onChange={() => onOptionToggle(group, choice.name)}
                          />
                          <span className="option-choice-name">{choice.name}</span>
                          {choice.price ? <span className="option-choice-price">{formatPrice(choice.price)}</span> : null}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}

              {!selectedItem.options && selectedItem.addons && selectedItem.addons.length > 0 && (
                <div className="addons-section">
                  <h3>Extras</h3>
                  {selectedItem.addons.map(addon => (
                    <label key={addon.id} className="addon-row">
                      <input
                        type="checkbox"
                        checked={selectedAddons.some(a => a.id === addon.id)}
                        onChange={() => handleAddonToggle(addon)}
                      />
                      <span className="addon-name">{addon.name}</span>
                      <span className="addon-price">+{formatPrice(addon.price)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {!acceptingOrders && (
              <div className="menu-unavailable-banner">This menu is not available at this time</div>
            )}
            <div className="item-modal-footer">
              <div className="qty-selector">
                <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}>-</button>
                <span>{itemQuantity}</span>
                <button onClick={() => setItemQuantity(itemQuantity + 1)}>+</button>
              </div>
              <button className="modal-add-btn" onClick={handleModalAdd} disabled={!acceptingOrders}>
                ADD <span className="modal-total-price">{formatPrice(modalTotalPrice)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
