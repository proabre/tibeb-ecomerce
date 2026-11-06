import { Link, NavLink } from "react-router-dom";
import { LogOut, UserRound, UserRoundPlus } from "lucide-react";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Orders", to: "/orders" },
  { label: "Admin", to: "/admin" },
  { label: "Seller", to: "/shop" },
];

function Navbar({
  cartCount,
  user,
  onAuthOpen,
  onLogout,
  isLoggingOut,
  logoutError,
}) {
  return (
    <header className="topbar">
      <div className="brand-wrap">
        <Link to="/" className="brand">
          <span className="brand-mark">T</span>
          Shiro Meda Tibeb
        </Link>
      </div>

      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="nav-actions">
        {user ? (
          <div className="account-actions">
            <span className="account-name" title={user.name}>
              <UserRound size={18} aria-hidden="true" />
              {user.name}
            </span>
            <button
              type="button"
              className="nav-account-button"
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              <LogOut size={17} aria-hidden="true" />
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </button>
            {logoutError ? (
              <span className="nav-auth-error" role="alert">
                {logoutError}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="account-actions">
            <button
              type="button"
              className="nav-account-button"
              onClick={() => onAuthOpen("login")}
            >
              <UserRound size={18} aria-hidden="true" />
              Sign in
            </button>
            <button
              type="button"
              className="nav-signup-button"
              onClick={() => onAuthOpen("register")}
            >
              <UserRoundPlus size={18} aria-hidden="true" />
              Sign up
            </button>
          </div>
        )}
        <Link to="/cart" className="cart-link">
          Cart
          {cartCount > 0 ? (
            <span className="cart-count">{cartCount}</span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
