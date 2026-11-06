import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../useLanguage.js';

function formatETB(value) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(value);
}

const emptyShippingForm = {
  recipientName: '',
  phone: '',
  city: 'Addis Ababa',
  addressLine: '',
  deliveryInstructions: '',
  customerNote: '',
};

function Cart({ cart, subtotal, updateQuantity, removeFromCart, onCheckout }) {
  const { t } = useLanguage();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(emptyShippingForm);
  const [checkoutError, setCheckoutError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="page-block empty-state">
        <h3>{t('Your cart is empty.')}</h3>
        <p>{t('Add handcrafted pieces from the marketplace to get started.')}</p>
        <Link to="/products" className="primary-button">
          {t('Explore products')}
        </Link>
      </div>
    );
  }

  const handleCheckoutSubmit = async (event) => {
    event.preventDefault();
    setCheckoutError('');
    setIsSubmitting(true);

    try {
      const payload = {
        recipientName: shippingAddress.recipientName,
        phone: shippingAddress.phone,
        city: shippingAddress.city,
        addressLine: shippingAddress.addressLine,
        deliveryInstructions: shippingAddress.deliveryInstructions,
      };

      await onCheckout(payload, shippingAddress.customerNote);
      navigate('/orders');
    } catch (error) {
      setCheckoutError(error?.response?.data?.message || t('Checkout failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-block cart-layout">
      <section className="cart-items-panel">
        <div className="section-heading inline">
          <div>
            <span className="eyebrow">{t('Your cart')}</span>
            <h2>{cart.length} {t('item(s)')}</h2>
          </div>
        </div>

        {cart.map((item) => (
          <article key={`${item.productId}-${item.variantId}`} className="cart-item">
            <img src={item.image} alt={item.title} className="cart-item-image" />
            <div className="cart-item-meta">
              <h3>{item.title}</h3>
              <span>{item.variantLabel}</span>
            </div>
            <div className="quantity-control">
              <button type="button" aria-label={t('Decrease quantity')} onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}>
                -
              </button>
              <span>{item.quantity}</span>
              <button type="button" aria-label={t('Increase quantity')} onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}>
                +
              </button>
            </div>
            <div className="cart-item-price">{formatETB(item.price * item.quantity)}</div>
            <button type="button" className="text-button" onClick={() => removeFromCart(item.productId, item.variantId)}>
              {t('Remove')}
            </button>
          </article>
        ))}
      </section>

      <aside className="summary-panel">
        <h3>{t('Order summary')}</h3>
        <div className="summary-row">
          <span>{t('Subtotal')}</span>
          <strong>{formatETB(subtotal)}</strong>
        </div>
        <div className="summary-row">
          <span>{t('Delivery')}</span>
          <strong>ETB 450</strong>
        </div>
        <div className="summary-row total">
          <span>{t('Total')}</span>
          <strong>{formatETB(subtotal + 450)}</strong>
        </div>

        <button type="button" className="primary-button full-width" onClick={() => setCheckoutOpen((current) => !current)}>
          {t(checkoutOpen ? 'Hide checkout form' : 'Proceed to checkout')}
        </button>

        {checkoutOpen ? (
          <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
            <label>
              <span>{t('Recipient name')}</span>
              <input
                type="text"
                value={shippingAddress.recipientName}
                onChange={(event) => setShippingAddress((current) => ({ ...current, recipientName: event.target.value }))}
                required
              />
            </label>

            <label>
              <span>{t('Phone')}</span>
              <input
                type="tel"
                value={shippingAddress.phone}
                onChange={(event) => setShippingAddress((current) => ({ ...current, phone: event.target.value }))}
                required
              />
            </label>

            <label>
              <span>{t('City')}</span>
              <input
                type="text"
                value={shippingAddress.city}
                onChange={(event) => setShippingAddress((current) => ({ ...current, city: event.target.value }))}
                required
              />
            </label>

            <label>
              <span>{t('Address')}</span>
              <input
                type="text"
                value={shippingAddress.addressLine}
                onChange={(event) => setShippingAddress((current) => ({ ...current, addressLine: event.target.value }))}
                required
              />
            </label>

            <label>
              <span>{t('Delivery instructions')}</span>
              <input
                type="text"
                value={shippingAddress.deliveryInstructions}
                onChange={(event) => setShippingAddress((current) => ({ ...current, deliveryInstructions: event.target.value }))}
              />
            </label>

            <label>
              <span>{t('Order note')}</span>
              <textarea
                rows="3"
                value={shippingAddress.customerNote}
                onChange={(event) => setShippingAddress((current) => ({ ...current, customerNote: event.target.value }))}
              />
            </label>

            {checkoutError ? <div className="auth-error">{checkoutError}</div> : null}

            <button type="submit" className="primary-button full-width" disabled={isSubmitting}>
              {t(isSubmitting ? 'Placing order...' : 'Place order')}
            </button>
          </form>
        ) : null}
      </aside>
    </div>
  );
}

export default Cart;
