import OrderTimeline from '../Components/OrderTimeline.jsx';
import { useLanguage } from '../useLanguage.js';

function formatETB(value) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
  }).format(value);
}

function Order({ order }) {
  const { t } = useLanguage();
  const orderId = order?.orderNumber || order?.id || 'TIB-0000';
  const subtotal = order?.subtotalCents != null
    ? order.subtotalCents / 100
    : order?.total ?? 0;
  const delivery = order?.deliveryFeeCents != null
    ? order.deliveryFeeCents / 100
    : order?.deliveryFee ?? 450;
  const total = order?.totalCents != null
    ? order.totalCents / 100
    : subtotal + delivery;
  const status = order?.status || 'processing';
  const paymentStatus = order?.paymentStatus || 'paid';
  const shippingAddress = order?.shippingAddress;
  const items = (order?.sellerOrders || []).flatMap((sellerOrder) => sellerOrder.items || []);
  const placedAt = order?.createdAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(order.createdAt))
    : null;
  const timeline = order?.timeline || [
    { label: 'Order placed', date: 'Today', completed: true },
    { label: 'Payment confirmed', date: 'Today', completed: true },
    { label: 'Seller preparing', date: 'Pending', completed: false },
    { label: 'Out for delivery', date: 'Pending', completed: false },
    { label: 'Delivered', date: 'Pending', completed: false },
  ];
  const completedSteps = timeline.filter((step) => step.completed).length;
  const progress = timeline.length ? Math.round((completedSteps / timeline.length) * 100) : 0;

  return (
    <div className="page-block order-page">
      <header className="order-heading">
        <div className="order-heading-copy">
          <span className="eyebrow">{t('Order tracking')}</span>
          <div className="order-title-row">
            <h2>{t('Order')} <span>{orderId}</span></h2>
            <span className={`status-badge order-status-${status}`}>
              {t(status)}
            </span>
          </div>
          <p>
            {t('Follow your order from payment through delivery.')}
            {placedAt ? <span className="order-placed-date"> · {t('Placed on')} {placedAt}</span> : null}
          </p>
        </div>
        <div className={`payment-status-chip payment-${paymentStatus}`}>
          <span aria-hidden="true" />
          {t(paymentStatus)}
        </div>
      </header>

      <div className="order-layout">
        <div className="order-main-column">
          <section className="order-card order-tracking-card">
            <div className="order-section-heading">
              <div>
                <span className="eyebrow">{t('Shipment')}</span>
                <h3>{t('Order progress')}</h3>
              </div>
              <span className="order-progress-count">
                {completedSteps} / {timeline.length}
              </span>
            </div>
            <div
              className="order-progress-track"
              role="progressbar"
              aria-label={t('Order progress')}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={progress}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <OrderTimeline steps={timeline} />
          </section>

          {items.length > 0 ? (
            <section className="order-card order-items-card">
              <div className="order-section-heading">
                <div>
                  <span className="eyebrow">{t('In this order')}</span>
                  <h3>{t('Items')} <span className="order-item-count">{items.length}</span></h3>
                </div>
              </div>
              <div className="order-item-list">
                {items.map((item) => (
                  <article className="order-product-row" key={item._id || `${item.productId}-${item.variantSku}`}>
                    {item.image ? <img src={item.image} alt="" /> : <div className="order-product-placeholder" />}
                    <div className="order-product-copy">
                      <strong>{item.productTitle}</strong>
                      <span>
                        {[item.size, item.color, `${t('Qty')}: ${item.quantity}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </div>
                    <strong className="order-product-price">
                      {formatETB((item.lineTotalCents ?? item.unitPriceCents * item.quantity) / 100)}
                    </strong>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {shippingAddress ? (
            <section className="order-card order-address-card">
              <span className="eyebrow">{t('Delivery address')}</span>
              <strong>{shippingAddress.recipientName}</strong>
              <span>{shippingAddress.phone}</span>
              <span>
                {[shippingAddress.addressLine, shippingAddress.subCity, shippingAddress.city]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </section>
          ) : null}
        </div>

        <aside className="summary-panel order-summary-panel">
          <span className="eyebrow">{t('Order total')}</span>
          <h3>{t('Payment summary')}</h3>
          <div className="summary-row">
            <span>{t('Subtotal')}</span>
            <strong>{formatETB(subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>{t('Delivery')}</span>
            <strong>{formatETB(delivery)}</strong>
          </div>
          <div className="summary-row total">
            <span>{t('Total')}</span>
            <strong>{formatETB(total)}</strong>
          </div>
          <div className="order-summary-note">
            <span className="order-summary-check" aria-hidden="true">✓</span>
            <span>{t('Your order total includes delivery.')}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Order;
