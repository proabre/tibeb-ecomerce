import { Link } from 'react-router-dom';
import { useLanguage } from '../useLanguage.js';

function formatETB(value) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(value);
}

function ProductCard({ product, onAddToCart }) {
  const { t } = useLanguage();
  const primaryVariant = product.variants[0];

  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`} className="card-image-link">
        <img src={product.images[0]} alt={product.name} className="product-image" />
      </Link>

      <div className="product-card-body">
        <div className="product-meta-row">
          <span className="eyebrow">{product.shop}</span>
          <span className="rating">★ {product.rating}</span>
        </div>

        <Link to={`/products/${product.slug}`} className="product-title-link">
          <h3>{product.name}</h3>
        </Link>

        <p className="product-description">{product.description}</p>

        <div className="product-footer">
          <div>
            <div className="price">{formatETB(primaryVariant.price)}</div>
            <div className="variant-label">{primaryVariant.label}</div>
          </div>

          <button
            type="button"
            className="primary-button compact"
            onClick={() => onAddToCart(product, primaryVariant)}
            disabled={!product.orderable}
            title={!product.orderable ? t('This sample product is not listed by a seller yet') : undefined}
          >
            {t(product.orderable ? 'Add to cart' : 'Preview only')}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
