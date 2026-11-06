import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../useLanguage.js';

const shopLinks = [
  { label: 'Habesha Kemis', category: 'habesha-kemis' },
  { label: 'Tibeb & textiles', category: 'tibeb-fabric' },
  { label: 'Shawls & netela', category: 'shawl' },
  { label: 'Accessories', category: 'accessories' },
];

function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <section className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="footer-brand-mark">T</span>
            <span>Tibeb</span>
          </Link>
          <p>
            {t('A celebration of Ethiopian craft, culture, and the hands that weave every story.')}
          </p>
          <div className="footer-origin">
            <MapPin size={16} aria-hidden="true" />
            {t('Rooted in Ethiopia')}
          </div>
        </section>

        <nav className="footer-links" aria-label={t('Shop categories')}>
          <h2>{t('Explore')}</h2>
          {shopLinks.map((item) => (
            <Link
              key={item.category}
              to={`/products?category=${item.category}`}
            >
              {t(item.label)}
            </Link>
          ))}
          <Link to="/products">{t('All products')}</Link>
        </nav>

        <nav className="footer-links" aria-label={t('Customer links')}>
          <h2>{t('Your account')}</h2>
          <Link to="/cart">{t('Shopping cart')}</Link>
          <Link to="/orders">{t('Track an order')}</Link>
          <Link to="/shop">{t('Sell on Tibeb')}</Link>
          <Link to="/products">{t('Help & support')}</Link>
        </nav>

        <section className="footer-contact">
          <h2>{t('Get in touch')}</h2>
          <p>
            <MapPin size={17} aria-hidden="true" />
            Addis Ababa, Ethiopia
          </p>
        </section>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Tibeb Marketplace</span>
        <span>{t('Made with care in Ethiopia')} <span aria-hidden="true">✦</span></span>
      </div>
    </footer>
  );
}

export default Footer;
