import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, ShoppingBag } from 'lucide-react';
import { getMyOrders } from '../lib/api.js';
import { useLanguage } from '../useLanguage.js';

function formatETB(cents) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100);
}

function Orders({ user, isSessionLoading, onAuthOpen }) {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loadedForUserId, setLoadedForUserId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSessionLoading) return undefined;

    if (!user) return undefined;

    let active = true;

    getMyOrders()
      .then((result) => {
        if (active) {
          setOrders(result);
          setError('');
          setLoadedForUserId(user._id);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
            t('Could not load your orders. Please try again.'),
          );
          setLoadedForUserId(user._id);
        }
      })
      ;

    return () => {
      active = false;
    };
  }, [isSessionLoading, user, t]);

  if (isSessionLoading) {
    return <div className="orders-feedback" role="status">{t('Checking your account...')}</div>;
  }

  if (!user) {
    return (
      <section className="orders-empty-state">
        <span className="orders-empty-icon"><ShoppingBag size={27} aria-hidden="true" /></span>
        <span className="eyebrow accent">{t('Order history')}</span>
        <h1>{t('Sign in to see your orders')}</h1>
        <p>{t('Your purchases and delivery progress will appear here after you sign in.')}</p>
        <button type="button" className="primary-button" onClick={() => onAuthOpen('login')}>
          {t('Sign in')}
        </button>
      </section>
    );
  }

  if (loadedForUserId !== user._id) {
    return <div className="orders-feedback" role="status">{t('Loading your orders...')}</div>;
  }

  return (
    <div className="page-block orders-page">
      <header className="orders-page-heading">
        <div>
          <span className="eyebrow accent">{t('Your account')}</span>
          <h1>{t('Your orders')}</h1>
          <p>{t('Keep track of purchases and delivery progress.')}</p>
        </div>
        <Link to="/products" className="orders-shop-link">
          {t('Continue shopping')} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </header>

      {error ? (
        <div className="orders-feedback orders-error" role="alert">{error}</div>
      ) : orders.length === 0 ? (
        <section className="orders-empty-state">
          <span className="orders-empty-icon"><Package size={27} aria-hidden="true" /></span>
          <h2>{t('No orders yet')}</h2>
          <p>{t('When you place an order, its status and delivery progress will show here.')}</p>
          <Link to="/products" className="primary-button">
            {t('Explore products')} <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <section className="orders-list" aria-label={t('Your orders')}>
          {orders.map((order) => {
            const items = (order.sellerOrders || []).flatMap((sellerOrder) => sellerOrder.items || []);
            const orderDate = order.createdAt
              ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(order.createdAt))
              : '';

            return (
              <article className="orders-list-card" key={order._id}>
                <div className="orders-card-heading">
                  <div>
                    <span className="eyebrow">{t('Order')}</span>
                    <h2>{order.orderNumber}</h2>
                    <p>{orderDate}{items.length ? ` · ${items.length} ${t(items.length === 1 ? 'item' : 'items')}` : ''}</p>
                  </div>
                  <div className="orders-card-total">
                    <span>{t('Total')}</span>
                    <strong>{formatETB(order.totalCents)}</strong>
                  </div>
                </div>

                <div className="orders-card-details">
                  <span className={`status-badge order-status-${order.status}`}>{t(order.status)}</span>
                  <span className={`payment-status-chip payment-${order.paymentStatus}`}>
                    <span aria-hidden="true" />
                    {t(order.paymentStatus)}
                  </span>
                </div>

                <div className="orders-card-items">
                  {items.slice(0, 3).map((item) => (
                    <div className="orders-card-item" key={item._id || `${item.productId}-${item.variantSku}`}>
                      {item.image ? <img src={item.image} alt="" /> : <span className="orders-item-placeholder" />}
                      <span>{item.productTitle}</span>
                      <small>×{item.quantity}</small>
                    </div>
                  ))}
                  {items.length > 3 ? <span className="orders-more-items">+{items.length - 3} {t('more')}</span> : null}
                </div>

                <Link to={`/orders/${order._id}`} className="orders-view-link">
                  {t('View order details')} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default Orders;
