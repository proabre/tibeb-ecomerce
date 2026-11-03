import { Link, NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Orders', to: '/orders' },
  { label: 'Admin', to: '/admin' },
  { label: 'Seller', to: '/shop' },
];

function Navbar({ cartCount }) {
  return (
    <header className="topbar">
      <div className="brand-wrap">
        <Link to="/" className="brand">
          <span className="brand-mark">T</span>
          Tibeb
        </Link>
      </div>

      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="nav-actions">
        <Link to="/cart" className="cart-link">
          Cart
          {cartCount > 0 ? <span className="cart-count">{cartCount}</span> : null}
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
