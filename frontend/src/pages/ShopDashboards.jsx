import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../useLanguage.js';
import {
  createSellerProduct,
  getSellerOrders,
  getSellerProducts,
  updateSellerOrderStatus,
  uploadProductImages,
  uploadProductVideos,
} from '../lib/api.js';

const makeVariant = () => ({
  id: crypto.randomUUID(),
  sku: '',
  size: '',
  color: '',
  price: '',
  stock: '0',
});

const initialForm = () => ({
  title: '',
  description: '',
  category: '',
  material: '',
  craftsmanship: 'handmade',
  madeToOrder: false,
  productionDays: '0',
  variants: [makeVariant()],
});

function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read video metadata.'));
    };
    video.src = url;
  });
}

function formatETB(cents) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function ShopDashboards({ user, categories, onAuthOpen }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [products, setProducts] = useState(null);
  const [orders, setOrders] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isSeller = user?.roles?.includes('seller');
  const imagePreviews = useMemo(() => [
    ...(frontImage ? [{ file: frontImage, label: t('Front view') }] : []),
    ...(backImage ? [{ file: backImage, label: t('Back view') }] : []),
    ...additionalImages.map((file) => ({ file, label: t('Additional view') })),
  ].map((item) => ({ ...item, url: URL.createObjectURL(item.file) })), [
    additionalImages,
    backImage,
    frontImage,
    t,
  ]);
  const videoPreviews = useMemo(
    () => videos.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [videos],
  );

  useEffect(
    () => () => {
      imagePreviews.forEach(({ url }) => URL.revokeObjectURL(url));
      videoPreviews.forEach(({ url }) => URL.revokeObjectURL(url));
    },
    [imagePreviews, videoPreviews],
  );

  useEffect(() => {
    if (!isSeller) return undefined;
    let active = true;

    Promise.allSettled([getSellerProducts(), getSellerOrders()]).then(
      ([productResult, orderResult]) => {
        if (!active) return;

        if (productResult.status === 'fulfilled') {
          setProducts(productResult.value);
        } else {
          setProducts([]);
          setError(
            productResult.reason?.response?.data?.message ||
              t('Could not load your products. Please try again.'),
          );
        }

        if (orderResult.status === 'fulfilled') {
          setOrders(orderResult.value);
        } else {
          setOrders([]);
          setError((current) =>
            current ||
            orderResult.reason?.response?.data?.message ||
            t('Could not load your orders. Please try again.'),
          );
        }
      },
    );

    return () => {
      active = false;
    };
  }, [isSeller, t]);

  const dashboardStats = useMemo(() => {
    const activeStatuses = new Set([
      'pending',
      'accepted',
      'preparing',
      'ready_for_pickup',
      'dispatched',
    ]);
    const activeOrders = (orders || []).filter(({ sellerOrder }) =>
      activeStatuses.has(sellerOrder.status),
    );
    const paidOrders = (orders || []).filter(({ paymentStatus }) => paymentStatus === 'paid');
    const paidEarningsCents = paidOrders.reduce(
      (total, { sellerOrder }) => total + (sellerOrder.sellerEarningsCents || 0),
      0,
    );
    const deliveredEarningsCents = paidOrders
      .filter(({ sellerOrder }) => sellerOrder.status === 'delivered')
      .reduce((total, { sellerOrder }) => total + (sellerOrder.sellerEarningsCents || 0), 0);
    const pendingEarningsCents = paidOrders
      .filter(({ sellerOrder }) => sellerOrder.settlementStatus !== 'paid')
      .reduce((total, { sellerOrder }) => total + (sellerOrder.sellerEarningsCents || 0), 0);
    const lowStockCount = (products || []).filter(
      (product) =>
        product.status === 'active' &&
        product.variants?.some((variant) => variant.stock <= 5),
    ).length;
    const inventoryUnits = (products || []).reduce(
      (total, product) =>
        total +
        (product.status === 'active'
          ? product.variants?.reduce((units, variant) => units + variant.stock, 0) || 0
          : 0),
      0,
    );

    return [
      { label: 'Active orders', value: orders ? activeOrders.length : '—' },
      { label: 'Awaiting acceptance', value: orders ? activeOrders.filter(({ sellerOrder }) => sellerOrder.status === 'pending').length : '—' },
      { label: 'Paid earnings', value: orders ? formatETB(paidEarningsCents) : '—' },
      { label: 'Delivered earnings', value: orders ? formatETB(deliveredEarningsCents) : '—' },
      { label: 'Pending payout', value: orders ? formatETB(pendingEarningsCents) : '—' },
      { label: 'Products listed', value: products ? products.filter((product) => product.status === 'active').length : '—' },
      { label: 'Products awaiting review', value: products ? products.filter((product) => product.status === 'draft').length : '—' },
      { label: 'Inventory units', value: products ? inventoryUnits : '—' },
      { label: 'Low-stock products', value: products ? lowStockCount : '—' },
    ];
  }, [orders, products]);

  const updateVariant = (variantId, field, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === variantId ? { ...variant, [field]: value } : variant,
      ),
    }));
  };

  const handleAngleImageChange = (angle, event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    if (file && (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)) {
      setError(t('Product images must be image files no larger than 5 MB.'));
      return;
    }
    if (angle === 'front') setFrontImage(file);
    else setBackImage(file);
    setError('');
  };

  const handleAdditionalImagesChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 3 || files.some((file) => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)) {
      setError(t('Choose up to 3 additional images, each no larger than 5 MB.'));
      event.target.value = '';
      return;
    }
    setAdditionalImages(files);
    event.target.value = '';
    setError('');
  };

  const handleVideosChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (
      files.length > 3 ||
      files.some(
        (file) =>
          !['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type) ||
          file.size > 20 * 1024 * 1024,
      )
    ) {
      setError(t('Choose up to 3 MP4, WebM, or MOV videos, each no larger than 20 MB.'));
      return;
    }

    try {
      const durations = await Promise.all(files.map(getVideoDuration));
      if (durations.some((duration) => duration > 60)) {
        setError(t('Product videos must be 60 seconds or shorter.'));
        return;
      }
      setVideos(files);
      setError('');
    } catch {
      setError(t('Could not read a selected video. Please choose another file.'));
    }
  };

  const handleAcceptOrder = async (order) => {
    setError('');
    setSuccess('');
    setAcceptingOrderId(order.orderId);

    try {
      const { order: updatedOrder } = await updateSellerOrderStatus(order.orderId, 'accept');
      setOrders((current) =>
        current?.map((entry) =>
          entry.orderId === order.orderId
            ? {
                ...entry,
                orderStatus: updatedOrder.orderStatus,
                sellerOrder: updatedOrder.sellerOrder,
              }
            : entry,
        ),
      );
      setSuccess(t('Order accepted successfully.'));
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          t('Could not accept this order. Please try again.'),
      );
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const skus = form.variants.map((variant) => variant.sku.trim().toUpperCase());
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !frontImage ||
      !backImage ||
      skus.some((sku) => !sku) ||
      new Set(skus).size !== skus.length ||
      form.variants.some((variant) =>
        !Number.isFinite(Number(variant.price)) ||
        Number(variant.price) <= 0 ||
        !Number.isSafeInteger(Math.round(Number(variant.price) * 100)) ||
        !Number.isSafeInteger(Number(variant.stock)) ||
        Number(variant.stock) < 0
      )
    ) {
      setError(t('Add front and back photos, then check product details, unique SKUs, prices, and stock quantities.'));
      return;
    }
    setIsSubmitting(true);

    try {
      const imageFiles = [frontImage, backImage, ...additionalImages].filter(Boolean);
      const [uploadedImages, uploadedVideos] = await Promise.all([
        uploadProductImages(imageFiles),
        videos.length ? uploadProductVideos(videos) : Promise.resolve([]),
      ]);
      const variants = form.variants.map(({ sku, size, color, price, stock }) => ({
        sku: sku.trim(),
        size: size.trim(),
        color: color.trim(),
        priceCents: Math.round(Number(price) * 100),
        stock: Number(stock),
      }));
      const product = await createSellerProduct({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        material: form.material.trim(),
        craftsmanship: form.craftsmanship,
        madeToOrder: form.madeToOrder,
        productionDays: form.madeToOrder ? Number(form.productionDays) : 0,
        images: uploadedImages,
        videos: uploadedVideos,
        variants,
      });
      setProducts((current) => [product, ...(current || [])]);
      setForm(initialForm());
      setFrontImage(null);
      setBackImage(null);
      setAdditionalImages([]);
      setVideos([]);
      setSuccess(t('Product submitted for review.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          t('Could not create your product. Please try again.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <section className="seller-gate page-block">
        <span className="eyebrow">{t('Seller dashboard')}</span>
        <h2>{t('Sign in to manage your shop')}</h2>
        <p>{t('Sign in with your seller account to add and manage products.')}</p>
        <button type="button" className="primary-button" onClick={() => onAuthOpen('login')}>
          {t('Sign in')}
        </button>
      </section>
    );
  }

  if (!isSeller) {
    return (
      <section className="seller-gate page-block">
        <span className="eyebrow">{t('Seller dashboard')}</span>
        <h2>{t('Seller access required')}</h2>
        <p>{t('Your account does not have seller access. Apply for a shop and wait for approval before listing products.')}</p>
      </section>
    );
  }

  return (
    <div className="seller-dashboard page-block">
      <div className="section-heading">
        <span className="eyebrow">{t('Seller dashboard')}</span>
        <h2>{t('Manage your shop')}</h2>
        <p>{t('Add product details, photos, and the options customers can order.')}</p>
      </div>

      <section className="seller-overview" aria-label={t('Shop performance')}>
        {dashboardStats.map((stat) => (
          <article className="seller-stat-card" key={stat.label}>
            <span>{t(stat.label)}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="seller-product-panel seller-orders-panel">
        <div className="seller-panel-heading">
          <div>
            <h3>{t('Active orders')}</h3>
            <p>{t('Latest customer orders that need fulfillment.')}</p>
          </div>
        </div>
        {orders === null ? (
          <p>{t('Loading your orders...')}</p>
        ) : orders.filter(({ sellerOrder }) =>
          ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'dispatched'].includes(sellerOrder.status),
        ).length ? (
          <div className="seller-product-list">
            {orders
              .filter(({ sellerOrder }) =>
                ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'dispatched'].includes(sellerOrder.status),
              )
              .slice(0, 5)
              .map((order) => (
                <article className="seller-order-item" key={`${order.orderId}-${order.sellerOrder._id}`}>
                  <div className="seller-product-info">
                    <strong>{order.orderNumber}</strong>
                    <span>
                      {order.sellerOrder.items.length} {t('items')} ·{' '}
                      {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(order.createdAt))}
                    </span>
                  </div>
                  <strong className="seller-order-amount">
                    {formatETB(order.sellerOrder.subtotalCents)}
                  </strong>
                  <span className={`seller-product-status status-${order.sellerOrder.status}`}>
                    {t(order.sellerOrder.status)}
                  </span>
                  {order.sellerOrder.status === 'pending' ? (
                    <button
                      type="button"
                      className="primary-button compact seller-accept-button"
                      onClick={() => handleAcceptOrder(order)}
                      disabled={acceptingOrderId === order.orderId || order.paymentStatus !== 'paid'}
                      title={order.paymentStatus !== 'paid' ? t('Payment must be confirmed before accepting.') : undefined}
                    >
                      {t(acceptingOrderId === order.orderId ? 'Accepting...' : 'Accept order')}
                    </button>
                  ) : null}
                </article>
              ))}
          </div>
        ) : (
          <p>{t('No active orders right now.')}</p>
        )}
        {success ? <div className="seller-success" role="status">{success}</div> : null}
        {error ? <div className="auth-error" role="alert">{error}</div> : null}
      </section>

      <section className="seller-product-panel">
        <div className="seller-panel-heading">
          <div>
            <h3>{t('Post a product')}</h3>
            <p>{t('New products are saved as drafts and sent to admin for review.')}</p>
          </div>
        </div>

        <form className="seller-product-form" onSubmit={handleSubmit}>
          <div className="seller-form-grid">
            <label>
              <span>{t('Product name')}</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                minLength={2}
                maxLength={200}
                required
              />
            </label>

            <label>
              <span>{t('Category')}</span>
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                required
              >
                <option value="">{t('Select a category')}</option>
                {Object.entries(categories).map(([key, label]) => (
                  <option key={key} value={key}>{t(label)}</option>
                ))}
              </select>
            </label>

            <label className="seller-form-wide">
              <span>{t('Description')}</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                maxLength={5000}
                required
              />
            </label>

            <label>
              <span>{t('Material')}</span>
              <input
                type="text"
                value={form.material}
                onChange={(event) => setForm((current) => ({ ...current, material: event.target.value }))}
                maxLength={150}
              />
            </label>

            <label>
              <span>{t('Craftsmanship')}</span>
              <select
                value={form.craftsmanship}
                onChange={(event) => setForm((current) => ({ ...current, craftsmanship: event.target.value }))}
              >
                <option value="handmade">{t('Handmade')}</option>
                <option value="machine-made">{t('Machine-made')}</option>
                <option value="mixed">{t('Mixed')}</option>
                <option value="unspecified">{t('Unspecified')}</option>
              </select>
            </label>

            <label className="seller-image-picker">
              <span>{t('Front photo')}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleAngleImageChange('front', event)}
              />
              <small>{t('Required. This is the first product photo customers see.')}</small>
            </label>

            <label className="seller-image-picker">
              <span>{t('Back photo')}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleAngleImageChange('back', event)}
              />
              <small>{t('Required. Shown as the second product photo.')}</small>
            </label>

            <label className="seller-form-wide seller-image-picker">
              <span>{t('Additional product photos')}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleAdditionalImagesChange}
              />
              <small>{t('Choose up to 3 additional images, each no larger than 5 MB.')}</small>
            </label>

            <label className="seller-form-wide seller-image-picker">
              <span>{t('Short product videos')}</span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                multiple
                onChange={handleVideosChange}
              />
              <small>{t('Choose up to 3 MP4, WebM, or MOV videos, each no larger than 20 MB and 60 seconds.')}</small>
            </label>
          </div>

          {imagePreviews.length > 0 ? (
            <div className="seller-image-previews">
              {imagePreviews.map(({ file, label, url }) => (
                <figure key={`${file.name}-${file.lastModified}`}>
                  <img src={url} alt={`${label}: ${file.name}`} />
                  <figcaption>{label}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}

          {videoPreviews.length > 0 ? (
            <div className="seller-video-previews">
              {videoPreviews.map(({ file, url }) => (
                <video
                  key={`${file.name}-${file.lastModified}`}
                  src={url}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  aria-label={`${t('Video preview')}: ${file.name}`}
                />
              ))}
            </div>
          ) : null}

          <div className="seller-order-options">
            <label className="seller-checkbox">
              <input
                type="checkbox"
                checked={form.madeToOrder}
                onChange={(event) => setForm((current) => ({ ...current, madeToOrder: event.target.checked }))}
              />
              <span>{t('Made to order')}</span>
            </label>
            {form.madeToOrder ? (
              <label>
                <span>{t('Production time (days)')}</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={form.productionDays}
                  onChange={(event) => setForm((current) => ({ ...current, productionDays: event.target.value }))}
                  required
                />
              </label>
            ) : null}
          </div>

          <div className="seller-variants">
            <div className="seller-variants-heading">
              <div>
                <h3>{t('Options and inventory')}</h3>
                <p>{t('Add at least one option. Each option needs a unique SKU, price, and stock quantity.')}</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setForm((current) => ({ ...current, variants: [...current.variants, makeVariant()] }))}
              >
                {t('Add option')}
              </button>
            </div>

            {form.variants.map((variant, index) => (
              <fieldset className="seller-variant-row" key={variant.id}>
                <legend>{t('Option')} {index + 1}</legend>
                <label>
                  <span>{t('SKU')}</span>
                  <input
                    value={variant.sku}
                    onChange={(event) => updateVariant(variant.id, 'sku', event.target.value)}
                    maxLength={80}
                    required
                  />
                </label>
                <label>
                  <span>{t('Size')}</span>
                  <input
                    value={variant.size}
                    onChange={(event) => updateVariant(variant.id, 'size', event.target.value)}
                    maxLength={50}
                  />
                </label>
                <label>
                  <span>{t('Color')}</span>
                  <input
                    value={variant.color}
                    onChange={(event) => updateVariant(variant.id, 'color', event.target.value)}
                    maxLength={80}
                  />
                </label>
                <label>
                  <span>{t('Price (ETB)')}</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={variant.price}
                    onChange={(event) => updateVariant(variant.id, 'price', event.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>{t('Stock')}</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={variant.stock}
                    onChange={(event) => updateVariant(variant.id, 'stock', event.target.value)}
                    required
                  />
                </label>
                {form.variants.length > 1 ? (
                  <button
                    type="button"
                    className="text-button seller-remove-option"
                    onClick={() => setForm((current) => ({
                      ...current,
                      variants: current.variants.filter((entry) => entry.id !== variant.id),
                    }))}
                  >
                    {t('Remove option')}
                  </button>
                ) : null}
              </fieldset>
            ))}
          </div>

          {error ? <div className="auth-error" role="alert">{error}</div> : null}
          {success ? <div className="seller-success" role="status">{success}</div> : null}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {t(isSubmitting ? 'Submitting product...' : 'Submit product for review')}
          </button>
        </form>
      </section>

      <section className="seller-product-panel">
        <div className="seller-panel-heading">
          <div>
            <h3>{t('Your products')}</h3>
            <p>{t('Track each listing through admin review.')}</p>
          </div>
          <span className="seller-product-count">{products?.length || 0}</span>
        </div>
        {products === null ? (
          <p>{t('Loading your products...')}</p>
        ) : products.length ? (
          <div className="seller-product-list">
            {products.map((product) => (
              <article className="seller-product-item" key={product._id}>
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" />
                ) : (
                  <div className="seller-product-placeholder" aria-hidden="true" />
                )}
                <div className="seller-product-info">
                  <strong>{product.title}</strong>
                  <span>{t(categories[product.category] || product.category)}</span>
                </div>
                <span className={`seller-product-status status-${product.status}`}>
                  {t(product.status)}
                </span>
                {product.rejectionReason ? <p>{product.rejectionReason}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p>{t('You have not posted any products yet.')}</p>
        )}
      </section>
    </div>
  );
}

export default ShopDashboards;
