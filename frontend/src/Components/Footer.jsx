import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const shopLinks = [
  { label: 'Habesha Kemis', category: 'habesha-kemis' },
  { label: 'Tibeb & textiles', category: 'tibeb-fabric' },
  { label: 'Shawls & netela', category: 'shawl' },
  { label: 'Accessories', category: 'accessories' },
];

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <section className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="footer-brand-mark">T</span>
            <span>Tibeb</span>
          </Link>
          <p>
            A celebration of Ethiopian craft, culture, and the hands that weave
            every story.
          </p>
          <div className="footer-origin">
            <MapPin size={16} aria-hidden="true" />
            Rooted in Ethiopia
          </div>
        </section>

        <nav className="footer-links" aria-label="Shop categories">
          <h2>Explore</h2>
          {shopLinks.map((item) => (
            <Link
              key={item.category}
              to={`/products?category=${item.category}`}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/products">All products</Link>
        </nav>

        <nav className="footer-links" aria-label="Customer links">
          <h2>Your account</h2>
          <Link to="/cart">Shopping cart</Link>
          <Link to="/orders">Track an order</Link>
          <Link to="/shop">Sell on Tibeb</Link>
          <Link to="/products">Help & support</Link>
        </nav>

        <section className="footer-contact">
          <h2>Get in touch</h2>
          <p>
            <MapPin size={17} aria-hidden="true" />
            Addis Ababa, Ethiopia
          </p>
        </section>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Tibeb Marketplace</span>
        <span>Made with care in Ethiopia <span aria-hidden="true">✦</span></span>
      </div>
    </footer>
  );
}

export default Footer;
