import { Link, NavLink } from "react-router-dom";
import { LogOut, UserRound, UserRoundPlus } from "lucide-react";
import { useLanguage } from "../useLanguage.js";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
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
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="topbar">
      <div className="brand-wrap">
        <Link to="/" className="brand">
          <span className="brand-mark">T</span>
          Shiro Meda Tibeb
        </Link>
      </div>

      <nav className="main-nav" aria-label={t("Main navigation")}>
        {[...navItems.slice(0, 2), ...(user ? [{ label: "Orders", to: "/orders" }] : []), ...navItems.slice(2)].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {t(item.label)}
          </NavLink>
        ))}
      </nav>

      <div className="nav-actions">
        <label className="language-control">
          <span>{t("Language")}</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            aria-label={t("Language")}
          >
            <option value="en">English</option>
            <option value="am">አማርኛ</option>
            <option value="om">Afaan Oromoo</option>
          </select>
        </label>
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
              {t(isLoggingOut ? "Signing out..." : "Sign out")}
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
              {t("Sign in")}
            </button>
            <button
              type="button"
              className="nav-signup-button"
              onClick={() => onAuthOpen("register")}
            >
              <UserRoundPlus size={18} aria-hidden="true" />
              {t("Sign up")}
            </button>
          </div>
        )}
        <Link to="/cart" className="cart-link">
          {t("Cart")}
          {cartCount > 0 ? (
            <span className="cart-count">{cartCount}</span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
