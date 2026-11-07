import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, PackageCheck, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
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

const paymentOptions = [
  { id: 'telebirr', label: 'Telebirr', provider: 'telebirr', method: 'mobile_money' },
  {
    id: 'commercial_bank_of_ethiopia',
    label: 'Commercial Bank of Ethiopia',
    provider: 'bank_gateway',
    method: 'bank_transfer',
    institution: 'commercial_bank_of_ethiopia',
  },
  {
    id: 'bank_of_abyssinia',
    label: 'Bank of Abyssinia',
    provider: 'bank_gateway',
    method: 'bank_transfer',
    institution: 'bank_of_abyssinia',
  },
  {
    id: 'awash_bank',
    label: 'Awash Bank',
    provider: 'bank_gateway',
    method: 'bank_transfer',
    institution: 'awash_bank',
  },
  {
    id: 'dashen_bank',
    label: 'Dashen Bank',
    provider: 'bank_gateway',
    method: 'bank_transfer',
    institution: 'dashen_bank',
  },
];

function Cart({ cart, subtotal, updateQuantity, removeFromCart, onCheckout }) {
  const { t } = useLanguage();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(emptyShippingForm);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState('telebirr');
  const [checkoutError, setCheckoutError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="cart-empty-state">
        <span className="cart-empty-icon"><ShoppingBag size={30} aria-hidden="true" /></span>
        <span className="eyebrow accent">{t('Your cart')}</span>
        <h2>{t('Your cart is empty.')}</h2>
        <p>{t('Add handcrafted pieces from the marketplace to get started.')}</p>
        <Link to="/products" className="primary-button">
          {t('Explore products')} <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

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

      const selectedOption = paymentOptions.find(
        ({ id }) => id === selectedPaymentOption,
      );
      const order = await onCheckout(
        payload,
        shippingAddress.customerNote,
        {
          provider: selectedOption.provider,
          method: selectedOption.method,
          ...(selectedOption.institution
            ? { institution: selectedOption.institution }
            : {}),
        },
      );
      navigate(order?._id ? `/orders/${order._id}` : '/orders');
    } catch (error) {
      setCheckoutError(error?.response?.data?.message || t('Checkout failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-block cart-page">
      <header className="cart-page-heading">
        <div>
          <span className="eyebrow accent">{t('Thoughtfully chosen')}</span>
          <h1>{t('Your cart')}</h1>
          <p>{itemCount} {t(itemCount === 1 ? 'piece in your bag' : 'pieces in your bag')}</p>
        </div>
        <Link to="/products" className="cart-continue-link">
          {t('Continue shopping')} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <div className="cart-layout">
      <section className="cart-items-panel">
        <div className="cart-panel-heading">
          <div>
            <h2>{t('Your pieces')}</h2>
            <p>{t('A little craftsmanship, chosen just for you.')}</p>
          </div>
          <span className="cart-item-count">{itemCount} {t('items')}</span>
        </div>

        {cart.map((item) => (
          <article key={`${item.productId}-${item.variantId}`} className="cart-item">
            <div className="cart-item-image-wrap">
              <img src={item.image} alt={item.title} className="cart-item-image" />
            </div>
            <div className="cart-item-meta">
              <h3>{item.title}</h3>
              <span className="cart-item-variant">{item.variantLabel}</span>
              <span className="cart-item-unit-price">{formatETB(item.price)} {t('each')}</span>
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
            <button
              type="button"
              className="cart-remove-button"
              onClick={() => removeFromCart(item.productId, item.variantId)}
              aria-label={`${t('Remove')} ${item.title}`}
              title={t('Remove')}
            >
              <Trash2 size={17} aria-hidden="true" />
            </button>
          </article>
        ))}
      </section>

      <aside className="summary-panel">
        <div className="summary-panel-heading">
          <span className="summary-heading-icon"><ShoppingBag size={18} aria-hidden="true" /></span>
          <h2>{t('Order summary')}</h2>
        </div>
        <p className="summary-caption">{t('A clear view of your order before checkout.')}</p>
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

        <button
          type="button"
          className="primary-button full-width cart-checkout-button"
          onClick={() => setCheckoutOpen((current) => !current)}
        >
          {t(checkoutOpen ? 'Hide checkout form' : 'Proceed to checkout')}
          {!checkoutOpen ? <ArrowRight size={17} aria-hidden="true" /> : null}
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

            <fieldset className="checkout-payment-options">
              <legend>{t('Payment method')}</legend>
              {paymentOptions.map(({ id, label }) => (
                <label key={id} className="checkout-payment-option">
                  <input
                    type="radio"
                    name="payment-option"
                    value={id}
                    checked={selectedPaymentOption === id}
                    onChange={() => setSelectedPaymentOption(id)}
                  />
                  <span>{label}</span>
                </label>
              ))}
              <p role="note">
                {t('Sample checkout only: no money is transferred. Live provider integration is not configured.')}
              </p>
            </fieldset>

            {checkoutError ? <div className="auth-error">{checkoutError}</div> : null}

            <button type="submit" className="primary-button full-width" disabled={isSubmitting}>
              {t(isSubmitting ? 'Placing order...' : 'Place order')}
            </button>
          </form>
        ) : null}

        <div className="cart-summary-assurances">
          <div><PackageCheck size={17} aria-hidden="true" /><span>{t('Delivery details collected at checkout')}</span></div>
          <div><ShieldCheck size={17} aria-hidden="true" /><span>{t('Review your order before placing it')}</span></div>
        </div>
      </aside>
      </div>
    </div>
  );
}

export default Cart;
