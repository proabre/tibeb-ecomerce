import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../useLanguage.js';

const emptyShippingForm = {
  recipientName: '',
  phone: '',
  city: 'Addis Ababa',
  addressLine: '',
  deliveryProvider: 'ethioposta',
  deliveryInstructions: '',
  customerNote: '',
};

const deliveryOptions = [
  {
    id: 'fedex',
    label: 'FedEx',
    description: 'International courier',
  },
  {
    id: 'dhl',
    label: 'DHL Express',
    description: 'International courier',
  },
  {
    id: 'ethioposta',
    label: 'Ethiopian Postal Service (Ethioposta)',
    description: 'Nationwide postal delivery',
  },
  {
    id: 'deliver_addis',
    label: 'Deliver Addis',
    description: 'Addis Ababa local delivery',
  },
  {
    id: 'ahununu',
    label: 'Ahununu Courier',
    description: 'Addis Ababa local delivery',
  },
  {
    id: 'local_courier',
    label: 'Local courier (seller-arranged)',
    description: 'Local delivery outside Addis Ababa',
  },
];

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

function formatETB(value) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(value);
}

function Checkout({ cart, subtotal, onCheckout }) {
  const { t } = useLanguage();
  const [shippingAddress, setShippingAddress] = useState(emptyShippingForm);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState('telebirr');
  const [checkoutError, setCheckoutError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  if (cart.length === 0) {
    return <Navigate to="/cart" replace />;
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
        deliveryProvider: shippingAddress.deliveryProvider,
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
      setCheckoutError(
        error?.response?.data?.message || t('Checkout failed. Please try again.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-block checkout-page">
      <header className="checkout-page-heading">
        <Link to="/cart" className="checkout-back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          {t('Back to cart')}
        </Link>
        <span className="eyebrow accent">{t('Almost there')}</span>
        <h1 id="checkout-title">{t('Delivery and payment')}</h1>
        <p>{t('Add your delivery details and choose a payment method.')}</p>
      </header>

      <div className="checkout-page-layout">
        <section className="checkout-panel" aria-labelledby="checkout-title">
          <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
            <section className="checkout-buyer-section" aria-labelledby="buyer-details-title">
              <div className="checkout-section-heading">
                <span className="checkout-step-number">1</span>
                <div>
                  <h2 id="buyer-details-title">{t('Buyer details')}</h2>
                  <p>{t('Who should we contact and where should we deliver?')}</p>
                </div>
              </div>

              <div className="checkout-fields-grid">
                <label className="checkout-field">
                  <span>{t('Recipient name')}</span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={shippingAddress.recipientName}
                    onChange={(event) => setShippingAddress((current) => ({ ...current, recipientName: event.target.value }))}
                    required
                  />
                </label>

                <label className="checkout-field">
                  <span>{t('Phone')}</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={shippingAddress.phone}
                    onChange={(event) => setShippingAddress((current) => ({ ...current, phone: event.target.value }))}
                    required
                  />
                </label>

                <label className="checkout-field">
                  <span>{t('City')}</span>
                  <input
                    type="text"
                    autoComplete="address-level2"
                    value={shippingAddress.city}
                    onChange={(event) => setShippingAddress((current) => ({ ...current, city: event.target.value }))}
                    required
                  />
                </label>

                <label className="checkout-field">
                  <span>{t('Address')}</span>
                  <input
                    type="text"
                    autoComplete="street-address"
                    value={shippingAddress.addressLine}
                    onChange={(event) => setShippingAddress((current) => ({ ...current, addressLine: event.target.value }))}
                    required
                  />
                </label>
              </div>

              <details className="checkout-optional-details">
                <summary>{t('Add delivery instructions or an order note (optional)')}</summary>
                <div className="checkout-optional-fields">
                  <label className="checkout-field">
                    <span>{t('Delivery instructions')}</span>
                    <input
                      type="text"
                      value={shippingAddress.deliveryInstructions}
                      onChange={(event) => setShippingAddress((current) => ({ ...current, deliveryInstructions: event.target.value }))}
                    />
                  </label>

                  <label className="checkout-field">
                    <span>{t('Order note')}</span>
                    <textarea
                      rows="2"
                      value={shippingAddress.customerNote}
                      onChange={(event) => setShippingAddress((current) => ({ ...current, customerNote: event.target.value }))}
                    />
                  </label>
                </div>
              </details>
            </section>

            <fieldset className="checkout-payment-options">
              <legend>
                <span className="checkout-step-number">2</span>
                <span>{t('Choose a delivery service')}</span>
              </legend>
              <div className="checkout-payment-list">
                {deliveryOptions.map(({ id, label, description }) => (
                  <label
                    key={id}
                    className={`checkout-payment-option${shippingAddress.deliveryProvider === id ? ' selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="delivery-provider"
                      value={id}
                      checked={shippingAddress.deliveryProvider === id}
                      onChange={() => setShippingAddress((current) => ({
                        ...current,
                        deliveryProvider: id,
                      }))}
                    />
                    <span className="checkout-payment-option-copy">
                      <strong>{label}</strong>
                      <small>{t(description)}</small>
                    </span>
                  </label>
                ))}
              </div>
              <p className="checkout-demo-note" role="note">
                {t('Courier selection is a sample. Availability and final delivery fees will be confirmed by the seller.')}
              </p>
            </fieldset>

            <fieldset className="checkout-payment-options">
              <legend>
                <span className="checkout-step-number">3</span>
                <span>{t('Choose how to pay')}</span>
              </legend>
              <div className="checkout-payment-list">
                {paymentOptions.map(({ id, label, method }) => (
                  <label
                    key={id}
                    className={`checkout-payment-option${selectedPaymentOption === id ? ' selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment-option"
                      value={id}
                      checked={selectedPaymentOption === id}
                      onChange={() => setSelectedPaymentOption(id)}
                    />
                    <span className="checkout-payment-option-copy">
                      <strong>{label}</strong>
                      <small>{t(method === 'mobile_money' ? 'Mobile money' : 'Bank transfer')}</small>
                    </span>
                  </label>
                ))}
              </div>
              <p className="checkout-demo-note" role="note">
                {t('Sample checkout only: no money is transferred. Live provider integration is not configured.')}
              </p>
            </fieldset>

            {checkoutError ? <div className="auth-error" role="alert">{checkoutError}</div> : null}

            <div className="checkout-submit-row">
              <p>{t('By placing your order, you confirm your delivery details are correct.')}</p>
              <button type="submit" className="primary-button checkout-submit-button" disabled={isSubmitting}>
                {t(isSubmitting ? 'Placing order...' : 'Place order')}
                {!isSubmitting ? <ArrowRight size={17} aria-hidden="true" /> : null}
              </button>
            </div>
          </form>
        </section>

        <aside className="summary-panel checkout-order-summary">
          <div className="summary-panel-heading">
            <h2>{t('Order summary')}</h2>
            <span className="cart-item-count">{itemCount} {t('items')}</span>
          </div>
          <div className="checkout-summary-items">
            {cart.map((item) => (
              <div className="checkout-summary-item" key={`${item.productId}-${item.variantId}`}>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.variantLabel} · {t('Qty')} {item.quantity}</small>
                </span>
                <strong>{formatETB(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="summary-row">
            <span>{t('Subtotal')}</span>
            <strong>{formatETB(subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>{t('Delivery')}</span>
            <strong>{t('To be confirmed')}</strong>
          </div>
          <div className="summary-row total">
            <span>{t('Total')}</span>
            <strong>{formatETB(subtotal)}</strong>
          </div>
          <p className="checkout-summary-assurance">
            <ShieldCheck size={16} aria-hidden="true" />
            {t('Sample checkout only: no money is transferred. Live provider integration is not configured.')}
          </p>
        </aside>
      </div>
    </div>
  );
}

export default Checkout;
