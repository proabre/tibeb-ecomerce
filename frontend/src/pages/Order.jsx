import OrderTimeline from '../Components/OrderTimeline.jsx';
import { useLanguage } from '../useLanguage.js';

function formatETB(value) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(value);
}

function Order({ order }) {
  const { t } = useLanguage();
  const orderId = order?.orderNumber || order?.id || 'TIB-0000';
  const total = order?.totalCents ? Math.round(order.totalCents / 100) : order?.total ?? 0;
  const status = order?.status || 'processing';
  const timeline = order?.timeline || [
    { label: 'Order placed', date: 'Today', completed: true },
    { label: 'Payment confirmed', date: 'Today', completed: true },
    { label: 'Seller preparing', date: 'Pending', completed: false },
    { label: 'Out for delivery', date: 'Pending', completed: false },
    { label: 'Delivered', date: 'Pending', completed: false },
  ];

  return (
    <div className="page-block order-page">
      <div className="section-heading inline">
        <div>
          <span className="eyebrow">{t('Order tracking')}</span>
          <h2>{t('Order')} {orderId}</h2>
        </div>
        <span className="status-badge">{t(status)}</span>
      </div>

      <div className="order-layout">
        <div className="order-card">
          <OrderTimeline steps={timeline} />
        </div>

        <aside className="summary-panel">
          <h3>{t('Payment summary')}</h3>
          <div className="summary-row">
            <span>{t('Subtotal')}</span>
            <strong>{formatETB(total)}</strong>
          </div>
          <div className="summary-row">
            <span>{t('Delivery')}</span>
            <strong>ETB 450</strong>
          </div>
          <div className="summary-row total">
            <span>{t('Total')}</span>
            <strong>{formatETB(total + 450)}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Order;
