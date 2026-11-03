import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

function formatETB(value) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(value);
}

function ProductDetail({ products, addToCart }) {
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
        <h3>Product not found.</h3>
        <Link to="/products" className="primary-button">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="product-detail-page page-block">
      <div className="detail-gallery">
        {product.images.map((image, index) => (
          <img key={`${product.id}-${index}`} src={image} alt={`${product.name}-${index + 1}`} className="detail-image" />
        ))}
      </div>

      <div className="detail-content">
        <span className="eyebrow accent">{product.shop}</span>
        <h1>{product.name}</h1>
        <div className="detail-rating">★ {product.rating} · {product.stock} in stock</div>

        <p className="detail-description">{product.description}</p>

        <div className="detail-price">{formatETB(selectedVariant?.price ?? product.price)}</div>

        <div className="variant-picker">
          <span className="label">Choose variant</span>
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
          <button type="button" className="primary-button" onClick={() => selectedVariant && addToCart(product, selectedVariant)}>
            Add to cart
          </button>
          <Link to="/products" className="secondary-button">
            Continue shopping
          </Link>
        </div>

        <div className="info-grid">
          <div>
            <span>Material</span>
            <strong>{product.material}</strong>
          </div>
          <div>
            <span>Craftsmanship</span>
            <strong>{product.craftsmanship}</strong>
          </div>
          <div>
            <span>Category</span>
            <strong>{product.category}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
