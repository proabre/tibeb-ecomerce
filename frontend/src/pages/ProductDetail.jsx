import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductViewer from '../Components/ProductViewer.jsx';
import { useLanguage } from '../useLanguage.js';

function formatETB(value) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(value);
}

function ProductDetail({ products, addToCart }) {
  const { t } = useLanguage();
  const { slug } = useParams();
  const product = useMemo(
    () => products.find((entry) => entry.slug === slug),
    [products, slug],
  );

  const [selectedVariantId, setSelectedVariantId] = useState(product?.variants?.[0]?.id ?? '');

  const selectedVariant =
    product?.variants.find((variant) => variant.id === selectedVariantId) ?? product?.variants[0] ?? null;

  if (!product) {
    return (
      <div className="page-block empty-state">
        <h3>{t('Product not found.')}</h3>
        <Link to="/products" className="primary-button">
          {t('Back to products')}
        </Link>
      </div>
    );
  }

  return (
    <div className="product-detail-page page-block">
      <ProductViewer
        key={product.slug}
        images={product.images}
        videos={product.videos}
        name={product.name}
      />

      <div className="detail-content">
        <span className="eyebrow accent">{product.shop}</span>
        <h1>{product.name}</h1>
        <div className="detail-rating">★ {product.rating} · {product.stock} {t('in stock')}</div>

        <p className="detail-description">{product.description}</p>

        <div className="detail-price">{formatETB(selectedVariant?.price ?? product.price)}</div>

        <div className="variant-picker">
          <span className="label">{t('Choose variant')}</span>
          <div className="variant-options">
            {product.variants.map((variant) => (
              <button
                type="button"
                key={variant.id}
                className={selectedVariant?.id === variant.id ? 'variant-option selected' : 'variant-option'}
                onClick={() => setSelectedVariantId(variant.id)}
              >
                {variant.label}
              </button>
            ))}
          </div>
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => selectedVariant && addToCart(product, selectedVariant)}
            disabled={!product.orderable}
            title={!product.orderable ? t('This sample product is not listed by a seller yet') : undefined}
          >
            {t(product.orderable ? 'Add to cart' : 'Preview only')}
          </button>
          <Link to="/checkout" className="secondary-button">
            {t('Continue to checkout')}
          </Link>
        </div>

        <div className="info-grid">
          <div>
            <span>{t('Material')}</span>
            <strong>{product.material}</strong>
          </div>
          <div>
            <span>{t('Craftsmanship')}</span>
            <strong>{product.craftsmanship}</strong>
          </div>
          <div>
            <span>{t('Category')}</span>
            <strong>{t(product.category)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
