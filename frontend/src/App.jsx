import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Eye, EyeOff, LogOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { useLanguage } from './useLanguage.js';

import Navbar from './Components/Navbar.jsx';
import Footer from './Components/Footer.jsx';
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Order from './pages/Order.jsx';
import Orders from './pages/Orders.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ShopDashboards from './pages/ShopDashboards.jsx';
import {
  fallbackProductImage,
  productCatalog,
  categoryLabels,
} from './data/catalog.js';
import {
  addCartItem,
  confirmDevelopmentPayment,
  createOrder,
  fetchPublicProducts,
  getCart,
  getCurrentUser,
  getOAuthUrl,
  initiatePayment,
  loginUser,
  logoutUser,
  removeCartItem,
  registerUser,
  updateCartItem,
} from './lib/api.js';

const formatPrice = (cents) => Math.round(cents / 100);

function normalizeProduct(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const firstVariant = variants[0] ?? null;

  return {
    id: product._id || product.id,
    slug: product.slug || product.name?.toLowerCase().replace(/\s+/g, '-') || 'product',
    name: product.title || product.name,
    category: product.category,
    orderable: true,
    price: firstVariant ? formatPrice(firstVariant.priceCents ?? firstVariant.price ?? 0) : Number(product.price ?? 0),
    material: product.material || 'Traditional fabric',
    craftsmanship: product.craftsmanship || 'handmade',
    description: product.description || 'Authentic Ethiopian traditional clothing.',
    images: product.images?.length ? product.images : [fallbackProductImage],
    videos: Array.isArray(product.videos) ? product.videos : [],
    shop: product.shopId?.name || product.shop || 'Tibeb Market',
    rating: product.rating ?? 4.8,
    stock: product.stock ?? firstVariant?.stock ?? 1,
    variants: variants.length
      ? variants.map((variant) => ({
          id: variant._id || variant.sku || `${product._id || product.id}-${variant.size || variant.color || 'variant'}`,
          sku: variant.sku,
          label: variant.size || variant.color || variant.sku || 'Default',
          price: formatPrice(variant.priceCents ?? variant.price ?? 0),
          inStock: (variant.stock ?? 1) > 0,
        }))
      : [{
          id: `${product._id || product.id}-default`,
          label: 'Default',
          price: Number(product.price ?? 0),
          inStock: true,
        }],
  };
}

function normalizeCartItem(item) {
  const product = item.product;
  const variant = product.variants?.find((entry) => entry.sku === item.variantSku);

  return {
    productId: product._id,
    variantId: item.variantSku,
    cartItemId: item._id,
    title: product.title,
    image: product.images?.[0] || '',
    variantLabel: [variant?.size, variant?.color].filter(Boolean).join(' · ') || item.variantSku,
    price: formatPrice(item.unitPriceCents),
    quantity: item.quantity,
  };
}

function App() {
  const { t } = useLanguage();
  const [oauthResult] = useState(
    () => new URL(window.location.href).searchParams.get('oauth'),
  );
  const [products, setProducts] = useState(productCatalog);
  const [user, setUser] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [isAuthOpen, setIsAuthOpen] = useState(oauthResult === 'error');
  const [authForm, setAuthForm] = useState({
    name: '',
    identifier: '',
    password: '',
  });
  const [authError, setAuthError] = useState(
    oauthResult === 'error'
      ? t('Social sign-in failed. Please try again or use your email and password.')
      : '',
  );
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [cartError, setCartError] = useState('');
  const [cart, setCart] = useState([]);

  const refreshCart = async () => {
    const response = await getCart();
    setCart(response.items.map(normalizeCartItem));
  };

  useEffect(() => {
    let isMounted = true;

    async function loadProfileAndProducts() {
      let profile = null;
      try {
        profile = await getCurrentUser();
        if (isMounted && profile) {
          setUser(profile);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setCart([]);
        }
      } finally {
        if (isMounted) setIsSessionLoading(false);
      }

      if (isMounted && profile) {
        try {
          const response = await getCart();
          if (isMounted) {
            setCart(response.items.map(normalizeCartItem));
          }
        } catch (error) {
          if (isMounted) {
            setCartError(error?.response?.data?.message || 'Could not load your saved cart.');
          }
        }
      }

      const liveProducts = await fetchPublicProducts();
      if (!isMounted || !liveProducts.length) return;
      const liveCatalog = liveProducts.map(normalizeProduct);
      const liveSlugs = new Set(liveCatalog.map((product) => product.slug));
      setProducts([
        ...liveCatalog,
        ...productCatalog.filter((product) => !liveSlugs.has(product.slug)),
      ]);
    }

    loadProfileAndProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!oauthResult) return;

    const url = new URL(window.location.href);
    url.searchParams.delete('oauth');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);

    if (oauthResult !== 'success') return;

    let isMounted = true;
    async function loadOAuthSession() {
      try {
        const profile = await getCurrentUser();
        if (!isMounted) return;
        setUser(profile);
        setAuthError('');
        setIsAuthOpen(false);
        try {
          await refreshCart();
        } catch (error) {
          if (isMounted) {
            setCartError(error?.response?.data?.message || t('Could not load your saved cart.'));
          }
        }
      } catch {
        if (!isMounted) return;
        setAuthError(t('Social sign-in could not be completed. Please try again.'));
        setIsAuthOpen(true);
      }
    }

    loadOAuthSession();
    return () => {
      isMounted = false;
    };
  }, [oauthResult, t]);

  const addToCart = async (product, variant) => {
    if (!user) {
      setAuthMode('login');
      setAuthError(t('Please sign in to add items to your cart.'));
      setIsAuthOpen(true);
      return;
    }

    if (!product.orderable) {
      setCartError(t('This catalog preview item is not yet listed by a seller and cannot be ordered.'));
      return;
    }

    if (!variant.sku) {
      setCartError(t('This product is missing a valid variant SKU and cannot be added to your cart.'));
      return;
    }

    setCartError('');
    try {
      await addCartItem(product.id, variant.sku, 1);
      await refreshCart();
    } catch (error) {
      setCartError(error?.response?.data?.message || t('Could not add this product to your cart.'));
    }
  };

  const updateQuantity = async (productId, variantId, nextQuantity) => {
    if (nextQuantity <= 0) {
      await removeFromCart(productId, variantId);
      return;
    }

    const item = cart.find((entry) => entry.productId === productId && entry.variantId === variantId);
    if (!item) return;

    setCartError('');
    try {
      await updateCartItem(item.cartItemId, nextQuantity);
      await refreshCart();
    } catch (error) {
      setCartError(error?.response?.data?.message || t('Could not update your cart.'));
    }
  };

  const removeFromCart = async (productId, variantId) => {
    const item = cart.find((entry) => entry.productId === productId && entry.variantId === variantId);
    if (!item) return;

    setCartError('');
    try {
      await removeCartItem(item.cartItemId);
      await refreshCart();
    } catch (error) {
      setCartError(error?.response?.data?.message || t('Could not remove this item from your cart.'));
    }
  };

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  );
  const localizedCategoryLabels = Object.fromEntries(
    Object.entries(categoryLabels).map(([key, label]) => [key, t(label)]),
  );

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setIsAuthSubmitting(true);

    try {
      const payload =
        authMode === 'register'
          ? {
              name: authForm.name,
              email: authForm.identifier.includes('@') ? authForm.identifier : '',
              phone: authForm.identifier.includes('@') ? '' : authForm.identifier,
              password: authForm.password,
            }
          : {
              identifier: authForm.identifier,
              password: authForm.password,
            };

      const response =
        authMode === 'register'
          ? await registerUser(payload)
          : await loginUser(payload);

      const nextUser = response.user;
      setUser(nextUser);
      setLogoutError('');
      setCart([]);
      try {
        await refreshCart();
      } catch (error) {
        setCartError(error?.response?.data?.message || t('Could not load your saved cart.'));
      }
      setIsAuthOpen(false);
      setAuthError('');
      setAuthForm({ name: '', identifier: '', password: '' });
    } catch (error) {
      const validationErrors = error?.response?.data?.errors;
      setAuthError(
        validationErrors?.map(({ message }) => message).join(' ') ||
          error?.response?.data?.message ||
          t('Authentication failed. Please try again.'),
      );
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError('');

    try {
      await logoutUser();
      setUser(null);
      setCart([]);
      setIsLogoutConfirmOpen(false);
    } catch (error) {
      setLogoutError(
        error?.response?.data?.message || t('Could not sign out. Please try again.'),
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCheckout = async (
    shippingAddress,
    customerNote = '',
    paymentMethod,
  ) => {
    if (!user) {
      setAuthMode('login');
      setAuthError(t('Please sign in to place an order.'));
      setIsAuthOpen(true);
      return null;
    }

    const { order } = await createOrder({ shippingAddress, customerNote });
    setCart([]);
    const payment = await initiatePayment(
      order._id,
      `tibeb-${Date.now()}`,
      paymentMethod,
    );
    const confirmation = await confirmDevelopmentPayment(payment.payment._id, 'success');

    const nextOrder = confirmation.order || order;
    const preparedOrder = {
      ...nextOrder,
      id: nextOrder.orderNumber || nextOrder._id,
      total: nextOrder.totalCents ? Math.round(nextOrder.totalCents / 100) : nextOrder.total ?? 0,
      status: nextOrder.status || 'confirmed',
      timeline: [
        { label: 'Order placed', date: 'Today', completed: true },
        { label: 'Payment confirmed', date: 'Today', completed: true },
        { label: 'Seller preparing', date: 'Pending', completed: false },
        { label: 'Out for delivery', date: 'Pending', completed: false },
        { label: 'Delivered', date: 'Pending', completed: false },
      ],
    };

    return preparedOrder;
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar
          cartCount={cartCount}
          user={user}
          onAuthOpen={(mode) => {
            setAuthMode(mode);
            setAuthError('');
            setIsAuthOpen(true);
          }}
          onLogout={() => {
            setLogoutError('');
            setIsLogoutConfirmOpen(true);
          }}
          isLoggingOut={isLoggingOut}
          logoutError={logoutError}
        />

        <main className="page-shell">
          {cartError ? (
            <div className="cart-feedback" role="alert">
              {cartError}
            </div>
          ) : null}
          <Routes>
            <Route
              path="/"
              element={<Home products={products} categories={localizedCategoryLabels} addToCart={addToCart} />}
            />
            <Route
              path="/products"
              element={<Products products={products} categories={localizedCategoryLabels} addToCart={addToCart} />}
            />
            <Route
              path="/products/:slug"
              element={<ProductDetail products={products} addToCart={addToCart} />}
            />
            <Route
              path="/cart"
              element={
                <Cart
                  cart={cart}
                  subtotal={subtotal}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                />
              }
            />
            <Route
              path="/checkout"
              element={
                <Checkout
                  cart={cart}
                  subtotal={subtotal}
                  onCheckout={handleCheckout}
                />
              }
            />
            <Route
              path="/orders"
              element={
                <Orders
                  user={user}
                  isSessionLoading={isSessionLoading}
                  onAuthOpen={(mode) => {
                    setAuthMode(mode);
                    setAuthError('');
                    setIsAuthOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/orders/:id"
              element={
                <Order
                  user={user}
                  isSessionLoading={isSessionLoading}
                  onAuthOpen={(mode) => {
                    setAuthMode(mode);
                    setAuthError('');
                    setIsAuthOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <AdminDashboard
                  user={user}
                  onAuthOpen={(mode) => {
                    setAuthMode(mode);
                    setAuthError('');
                    setIsAuthOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/shop/*"
              element={
                <ShopDashboards
                  user={user}
                  categories={localizedCategoryLabels}
                  onAuthOpen={(mode) => {
                    setAuthMode(mode);
                    setAuthError('');
                    setIsAuthOpen(true);
                  }}
                />
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>

      {isAuthOpen ? (
        <div
          className="modal-backdrop"
          onClick={() => !isAuthSubmitting && setIsAuthOpen(false)}
        >
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="auth-header">
              <h3 id="auth-title">{t(authMode === 'login' ? 'Welcome back' : 'Create account')}</h3>
              <button
                type="button"
                className="text-button"
                onClick={() => setIsAuthOpen(false)}
                disabled={isAuthSubmitting}
              >
                {t('Close')}
              </button>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <div className="social-auth-options">
                <button
                  type="button"
                  className="social-auth-button"
                  onClick={() => window.location.assign(getOAuthUrl('google'))}
                  disabled={isAuthSubmitting}
                >
                  <span className="google-mark" aria-hidden="true">G</span>
                  {t('Continue with Google')}
                </button>
                <button
                  type="button"
                  className="social-auth-button"
                  onClick={() => window.location.assign(getOAuthUrl('facebook'))}
                  disabled={isAuthSubmitting}
                >
                  <span className="facebook-mark" aria-hidden="true">f</span>
                  {t('Continue with Facebook')}
                </button>
              </div>
              <div className="auth-divider"><span>{t('Or use email')}</span></div>
              {authMode === 'register' ? (
                <label>
                  <span>{t('Name')}</span>
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder={t('Your full name')}
                    autoComplete="name"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </label>
              ) : null}

              <label>
                <span>{t(authMode === 'login' ? 'Email or phone' : 'Email or phone number')}</span>
                <input
                  type="text"
                  value={authForm.identifier}
                  onChange={(event) => setAuthForm((current) => ({ ...current, identifier: event.target.value }))}
                  placeholder={t('you@example.com or 0911...')}
                  autoComplete={authMode === 'login' ? 'username' : 'email'}
                  maxLength={254}
                  required
                />
              </label>

              <label>
                <span>{t('Password')}</span>
                <span className="password-input-wrap">
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={authForm.password}
                    onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder={t('Password')}
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    minLength={authMode === 'register' ? 8 : 1}
                    maxLength={72}
                    required
                  />
                  <button
                    type="button"
                    className="password-visibility-button"
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    aria-label={t(isPasswordVisible ? 'Hide password' : 'Show password')}
                    aria-pressed={isPasswordVisible}
                  >
                    {isPasswordVisible ? (
                      <EyeOff size={19} aria-hidden="true" />
                    ) : (
                      <Eye size={19} aria-hidden="true" />
                    )}
                  </button>
                </span>
              </label>

              {authError ? <div className="auth-error">{authError}</div> : null}

              <button
                type="submit"
                className="primary-button full-width"
                disabled={isAuthSubmitting}
              >
                {isAuthSubmitting
                  ? t('Please wait...')
                  : authMode === 'login'
                    ? t('Sign in')
                    : t('Create account')}
              </button>
            </form>

            <button
              type="button"
              className="text-button switch-auth"
              onClick={() => {
                setAuthMode((current) => (current === 'login' ? 'register' : 'login'));
                setAuthError('');
              }}
              disabled={isAuthSubmitting}
            >
              {t(authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in')}
            </button>
          </div>
        </div>
      ) : null}
      {isLogoutConfirmOpen ? (
        <div
          className="modal-backdrop"
          onClick={() => !isLoggingOut && setIsLogoutConfirmOpen(false)}
        >
          <section
            className="logout-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="logout-icon" aria-hidden="true">
              <LogOut size={23} />
            </div>
            <h2 id="logout-title">{t('Sign out?')}</h2>
            <p id="logout-description">{t('Are you sure you want to sign out?')}</p>
            {logoutError ? (
              <div className="logout-modal-error" role="alert">
                {logoutError}
              </div>
            ) : null}
            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-cancel-button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                disabled={isLoggingOut}
                autoFocus
              >
                {t('Stay signed in')}
              </button>
              <button
                type="button"
                className="logout-confirm-button"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut size={17} aria-hidden="true" />
                {t(isLoggingOut ? 'Signing out...' : 'Sign out')}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </BrowserRouter>
  );
}

export default App;
