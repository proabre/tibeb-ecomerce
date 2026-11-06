import { useEffect, useState } from 'react';
import { useLanguage } from '../useLanguage.js';
import {
  getPendingAdminProducts,
  reviewAdminProduct,
} from '../lib/api.js';

function formatETB(cents) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function AdminDashboard({ user, onAuthOpen }) {
  const { t } = useLanguage();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [actionProductId, setActionProductId] = useState(null);
  const [rejectingProductId, setRejectingProductId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!user?.roles?.includes('admin')) return undefined;
    let active = true;

    getPendingAdminProducts()
      .then((pendingProducts) => {
        if (active) setProducts(pendingProducts);
      })
      .catch((requestError) => {
        if (active) {
          setProducts([]);
          setError(
            requestError?.response?.data?.message ||
              t('Could not load pending products. Please try again.'),
          );
        }
      });

    return () => {
      active = false;
    };
  }, [user, t]);

  const handleReview = async (productId, action) => {
    setError('');
    setActionProductId(productId);

    try {
      await reviewAdminProduct(productId, action, rejectionReason.trim());
      setProducts((current) =>
        current?.filter((product) => product._id !== productId) || [],
      );
      setRejectingProductId(null);
      setRejectionReason('');
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          t('Could not review this product. Please try again.'),
      );
    } finally {
      setActionProductId(null);
    }
  };

  if (!user) {
    return (
      <section className="seller-gate page-block">
        <span className="eyebrow">{t('Admin dashboard')}</span>
        <h2>{t('Sign in to access the admin dashboard')}</h2>
        <button type="button" className="primary-button" onClick={() => onAuthOpen('login')}>
          {t('Sign in')}
        </button>
      </section>
    );
  }

  if (!user.roles?.includes('admin')) {
    return (
      <section className="seller-gate page-block">
        <span className="eyebrow">{t('Admin dashboard')}</span>
        <h2>{t('Admin access required')}</h2>
        <p>{t('This account does not have the admin role. Add its email to ADMIN_EMAILS in backend/.env, restart the backend, then sign out and back in.')}</p>
      </section>
    );
  }

  return (
    <div className="admin-dashboard page-block">
      <header className="admin-dashboard-heading">
        <div>
          <span className="eyebrow">{t('Admin dashboard')}</span>
          <h2>{t('Product review')}</h2>
          <p>{t('Review seller listings before they appear in the marketplace.')}</p>
        </div>
        <div className="admin-pending-count">
          <strong>{products?.length ?? '—'}</strong>
          <span>{t('Pending products')}</span>
        </div>
      </header>

      {error ? <div className="auth-error" role="alert">{error}</div> : null}

      <section className="admin-review-panel">
        <div className="admin-review-heading">
          <div>
            <h3>{t('Pending products')}</h3>
            <p>{t('Approve a listing to publish it, or reject it with a reason for the seller.')}</p>
          </div>
        </div>

        {products === null ? (
          <p className="admin-review-message">{t('Loading pending products...')}</p>
        ) : products.length === 0 ? (
          <div className="admin-empty-state">
            <span className="admin-empty-check" aria-hidden="true">✓</span>
            <strong>{t('You are all caught up.')}</strong>
            <p>{t('There are no products waiting for review.')}</p>
          </div>
        ) : (
          <div className="admin-product-list">
            {products.map((product) => {
              const shopIsApproved =
                product.shopId?.verificationStatus === 'approved' &&
                product.shopId?.status === 'active';

              return (
                <article className="admin-product-card" key={product._id}>
                  {product.images?.[0] ? (
                    <img className="admin-product-image" src={product.images[0]} alt="" />
                  ) : (
                    <div className="admin-product-image admin-product-image-empty" />
                  )}
                  <div className="admin-product-content">
                    <div className="admin-product-title-row">
                      <div>
                        <h4>{product.title}</h4>
                        <span className="admin-product-shop">
                          {product.shopId?.name || t('Unknown shop')}
                        </span>
                      </div>
                      <span className="admin-category-tag">{t(product.category)}</span>
                    </div>
                    <p className="admin-product-description">{product.description}</p>
                    {product.variants?.length ? (
                      <div className="admin-variant-summary">
                        {product.variants.map((variant) => (
                          <span key={variant._id || variant.sku}>
                            {[variant.size, variant.color].filter(Boolean).join(' / ') || variant.sku}
                            {' · '}{formatETB(variant.priceCents)}
                            {' · '}{variant.stock} {t('in stock')}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {!shopIsApproved ? (
                      <p className="admin-review-warning">
                        {t('This shop must be approved and active before its products can be published.')}
                      </p>
                    ) : null}

                    {rejectingProductId === product._id ? (
                      <div className="admin-rejection-form">
                        <label>
                          <span>{t('Reason for rejection')}</span>
                          <textarea
                            value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.target.value)}
                            maxLength={1000}
                            rows={2}
                            required
                          />
                        </label>
                        <div className="admin-product-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                              setRejectingProductId(null);
                              setRejectionReason('');
                            }}
                            disabled={actionProductId === product._id}
                          >
                            {t('Cancel')}
                          </button>
                          <button
                            type="button"
                            className="admin-reject-button"
                            onClick={() => handleReview(product._id, 'reject')}
                            disabled={!rejectionReason.trim() || actionProductId === product._id}
                          >
                            {t(actionProductId === product._id ? 'Submitting...' : 'Confirm rejection')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="admin-product-actions">
                        <button
                          type="button"
                          className="primary-button compact"
                          onClick={() => handleReview(product._id, 'approve')}
                          disabled={!shopIsApproved || actionProductId === product._id}
                        >
                          {t(actionProductId === product._id ? 'Submitting...' : 'Approve product')}
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {
                            setRejectingProductId(product._id);
                            setRejectionReason('');
                          }}
                          disabled={actionProductId === product._id}
                        >
                          {t('Reject')}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
