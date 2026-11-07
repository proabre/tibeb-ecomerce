import { Link } from 'react-router-dom';
import { ArrowRight, PackageCheck, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
import { useLanguage } from '../useLanguage.js';

function formatETB(value) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(value);
}

function Cart({ cart, subtotal, updateQuantity, removeFromCart }) {
  const { t } = useLanguage();

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
          <strong>{t('To be confirmed')}</strong>
        </div>
        <div className="summary-row total">
          <span>{t('Total')}</span>
          <strong>{formatETB(subtotal)}</strong>
        </div>

        <Link to="/checkout" className="primary-button full-width cart-checkout-button">
          {t('Proceed to checkout')} <ArrowRight size={17} aria-hidden="true" />
        </Link>

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
