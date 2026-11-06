import { Link } from 'react-router-dom';
import ProductCard from '../Components/ProductCard.jsx';
import { homeHeroPhoto } from '../data/catalog.js';

const highlights = [
  'Verified independent sellers',
  'Authentic handcrafted designs',
  'Secure Telebirr-ready checkout',
  'Ethiopian delivery support',
];

function Home({ products, categories, addToCart }) {
  const featured = products.slice(0, 3);

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow accent">Discover Ethiopian heritage</span>
          <h1>Timeless traditional fashion for every celebration.</h1>
          <p>
            Shop handmade Habesha clothing, woven fabrics, and cultural accessories from trusted sellers across Ethiopia.
          </p>

          <div className="cta-row">
            <Link to="/products" className="primary-button">
              Shop collection
            </Link>
            <Link to="/shop" className="secondary-button">
              Become a seller
            </Link>
          </div>

          <ul className="feature-list">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="hero-visual">
          <img
            className="hero-image"
            src={homeHeroPhoto}
            alt="Woman wearing a white Habesha kemis with red and gold embroidery"
          />
          <div className="hero-card card-primary">
            <span>Featured drop</span>
            <h3>Habesha Kemis</h3>
            <strong>ETB 4,200</strong>
          </div>
          <div className="hero-card card-secondary">
            <span>Curated shops</span>
            <strong>120+</strong>
          </div>
        </div>
      </section>

      <section className="category-section">
        <div className="section-heading">
          <span className="eyebrow">Categories</span>
          <h2>Shop by tradition</h2>
        </div>

        <div className="category-grid">
          {Object.entries(categories).map(([key, label]) => (
            <Link key={key} to="/products" className="category-card">
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="marketplace-section">
        <div className="section-heading inline">
          <div>
            <span className="eyebrow">Featured products</span>
            <h2>Popular picks this week</h2>
          </div>
          <Link to="/products" className="text-link">
            Browse all products →
          </Link>
        </div>

        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;
