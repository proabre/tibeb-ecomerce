import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import './App.css';

import Navbar from './Components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Order from './pages/Order.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ShopDashboards from './pages/ShopDashboards.jsx';
import { productCatalog, categoryLabels } from './data/catalog.js';
import {
  addCartItem,
  confirmDevelopmentPayment,
  createOrder,
  fetchPublicProducts,
  getCurrentUser,
  initiatePayment,
  loginUser,
  logoutUser,
  registerUser,
} from './lib/api.js';

const sampleOrder = {
  id: 'TIB-2401',
  total: 8420,
  status: 'processing',
  timeline: [
    { label: 'Order placed', date: 'April 10, 2026', completed: true },
    { label: 'Payment confirmed', date: 'April 10, 2026', completed: true },
    { label: 'Seller preparing', date: 'April 11, 2026', completed: true },
    { label: 'Out for delivery', date: 'Pending', completed: false },
    { label: 'Delivered', date: 'Pending', completed: false },
  ],
};

const formatPrice = (cents) => Math.round(cents / 100);

function normalizeProduct(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const firstVariant = variants[0] ?? null;

  return {
    id: product._id || product.id,
    slug: product.slug || product.name?.toLowerCase().replace(/\s+/g, '-') || 'product',
    name: product.title || product.name,
    category: product.category,
    price: firstVariant ? formatPrice(firstVariant.priceCents ?? firstVariant.price ?? 0) : Number(product.price ?? 0),
    material: product.material || 'Traditional fabric',
    craftsmanship: product.craftsmanship || 'handmade',
    description: product.description || 'Authentic Ethiopian traditional clothing.',
    images: product.images?.length ? product.images : [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
    ],
    shop: product.shopId?.name || product.shop || 'Tibeb Market',
    rating: product.rating ?? 4.8,
    stock: product.stock ?? firstVariant?.stock ?? 1,
    variants: variants.length
      ? variants.map((variant) => ({
          id: variant._id || variant.sku || `${product._id || product.id}-${variant.size || variant.color || 'variant'}`,
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

function App() {
  const [products, setProducts] = useState(productCatalog);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authForm, setAuthForm] = useState({
    name: '',
    identifier: '',
    password: '',
  });
  const [authError, setAuthError] = useState('');
  const [latestOrder, setLatestOrder] = useState(null);
  const [cart, setCart] = useState(() => {
    try {
      const value = window.localStorage.getItem('tibeb-cart');
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let isMounted = true;

    async function loadProfileAndProducts() {
      try {
        const profile = await getCurrentUser();
        if (isMounted && profile) {
          setUser(profile);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      }

      const liveProducts = await fetchPublicProducts();
      if (!isMounted || !liveProducts.length) return;
      setProducts(liveProducts.map(normalizeProduct));
    }

    loadProfileAndProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem('tibeb-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = async (product, variant) => {
    if (!user) {
      setAuthMode('login');
      setAuthError('Please sign in to add items to your cart.');
      setIsAuthOpen(true);
      return;
    }

    try {
      const backendVariant = variant?.sku || variant?.label || variant?.id || 'default';
      await addCartItem(product.id, backendVariant, 1);
    } catch {
      setCart((current) => {
        const existing = current.find((item) => item.productId === product.id && item.variantId === variant.id);

        if (existing) {
          return current.map((item) =>
            item.productId === product.id && item.variantId === variant.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        }

        return [
          ...current,
          {
            productId: product.id,
            variantId: variant.id,
            title: product.name,
            image: product.images[0],
            variantLabel: variant.label,
            price: variant.price,
            quantity: 1,
          },
        ];
      });
    }
  };

  const updateQuantity = (productId, variantId, nextQuantity) => {
    if (nextQuantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: nextQuantity }
          : item,
      ),
    );
  };

  const removeFromCart = (productId, variantId) => {
    setCart((current) =>
      current.filter(
        (item) => !(item.productId === productId && item.variantId === variantId),
      ),
    );
  };

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  );

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

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
      setIsAuthOpen(false);
      setAuthError('');
      setAuthForm({ name: '', identifier: '', password: '' });
    } catch (error) {
      setAuthError(error?.response?.data?.message || 'Authentication failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore backend logout failures and still clear the local session.
    }

    setUser(null);
  };

  const handleCheckout = async (shippingAddress, customerNote = '') => {
    if (!user) {
      setAuthMode('login');
      setAuthError('Please sign in to place an order.');
      setIsAuthOpen(true);
      return null;
    }

    const { order } = await createOrder({ shippingAddress, customerNote });
    const payment = await initiatePayment(order._id, `tibeb-${Date.now()}`);
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

    setLatestOrder(preparedOrder);
    return preparedOrder;
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar cartCount={cartCount} />

        <div className="user-bar">
          {user ? (
            <>
              <span>Welcome, {user.name}</span>
              <button type="button" className="secondary-button" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <button type="button" className="primary-button compact" onClick={() => setIsAuthOpen(true)}>
              Sign in
            </button>
          )}
        </div>

        <main className="page-shell">
          <Routes>
            <Route
              path="/"
              element={<Home products={products} categories={categoryLabels} addToCart={addToCart} />}
            />
            <Route
              path="/products"
              element={<Products products={products} categories={categoryLabels} addToCart={addToCart} />}
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
                  onCheckout={handleCheckout}
                />
              }
            />
            <Route path="/orders" element={<Order order={latestOrder ?? sampleOrder} />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/shop" element={<ShopDashboards />} />
          </Routes>
        </main>
      </div>

      {isAuthOpen ? (
        <div className="modal-backdrop" onClick={() => setIsAuthOpen(false)}>
          <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
            <div className="auth-header">
              <h3>{authMode === 'login' ? 'Welcome back' : 'Create account'}</h3>
              <button type="button" className="text-button" onClick={() => setIsAuthOpen(false)}>
                Close
              </button>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' ? (
                <label>
                  <span>Name</span>
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Your full name"
                    required
                  />
                </label>
              ) : null}

              <label>
                <span>{authMode === 'login' ? 'Email or phone' : 'Email or phone number'}</span>
                <input
                  type="text"
                  value={authForm.identifier}
                  onChange={(event) => setAuthForm((current) => ({ ...current, identifier: event.target.value }))}
                  placeholder="you@example.com or 0911..."
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Password"
                  required
                />
              </label>

              {authError ? <div className="auth-error">{authError}</div> : null}

              <button type="submit" className="primary-button full-width">
                {authMode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <button
              type="button"
              className="text-button switch-auth"
              onClick={() => {
                setAuthMode((current) => (current === 'login' ? 'register' : 'login'));
                setAuthError('');
              }}
            >
              {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      ) : null}
    </BrowserRouter>
  );
}

export default App;
