import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
});

export function getOAuthUrl(provider) {
  if (!['google', 'facebook'].includes(provider)) {
    throw new Error('Unsupported sign-in provider');
  }

  return new URL(
    `/api/auth/${provider}`,
    api.defaults.baseURL || window.location.origin,
  ).toString();
}

export async function fetchPublicProducts() {
  try {
    const { data } = await api.get('/api/products', {
      params: { limit: 50 },
    });
    return data.products ?? [];
  } catch {
    return [];
  }
}

export async function getCurrentUser() {
  const { data } = await api.get('/api/auth/me');
  return data.user ?? null;
}

export async function registerUser(payload) {
  const { data } = await api.post('/api/auth/register', payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await api.post('/api/auth/login', payload);
  return data;
}

export async function logoutUser() {
  const { data } = await api.post('/api/auth/logout');
  return data;
}

export async function getCart() {
  const { data } = await api.get('/api/cart');
  return data;
}

export async function addCartItem(productId, variantSku, quantity = 1) {
  const { data } = await api.post('/api/cart/items', {
    productId,
    variantSku,
    quantity,
  });
  return data;
}

export async function updateCartItem(itemId, quantity) {
  const { data } = await api.patch(`/api/cart/items/${itemId}`, { quantity });
  return data;
}

export async function removeCartItem(itemId) {
  const { data } = await api.delete(`/api/cart/items/${itemId}`);
  return data;
}

export async function uploadProductImages(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  const { data } = await api.post('/api/uploads/products', formData);
  return data.images.map((image) => image.url);
}

export async function uploadProductVideos(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('videos', file));
  const { data } = await api.post('/api/uploads/product-videos', formData);
  return data.videos;
}

export async function createSellerProduct(payload) {
  const { data } = await api.post('/api/products', payload);
  return data.product;
}

export async function getSellerProducts() {
  const { data } = await api.get('/api/products/my-products');
  return data.products ?? [];
}

export async function getSellerOrders() {
  const { data } = await api.get('/api/orders/seller/my-orders');
  return data.orders ?? [];
}

export async function updateSellerOrderStatus(orderId, action) {
  const { data } = await api.patch(`/api/orders/seller/my-orders/${orderId}/status`, {
    action,
  });
  return data;
}

export async function getPendingAdminProducts() {
  const { data } = await api.get('/api/products/admin/pending');
  return data.products ?? [];
}

export async function reviewAdminProduct(productId, action, rejectionReason = '') {
  const { data } = await api.patch(`/api/products/admin/${productId}/review`, {
    action,
    ...(action === 'reject' ? { rejectionReason } : {}),
  });
  return data;
}

export async function createOrder(payload) {
  const { data } = await api.post('/api/orders', payload);
  return data;
}

export async function initiatePayment(orderId, idempotencyKey) {
  const { data } = await api.post(
    `/api/payments/orders/${orderId}/initiate`,
    {},
    {
      headers: { 'Idempotency-Key': idempotencyKey },
    },
  );

  return data;
}

export async function confirmDevelopmentPayment(paymentId, result = 'success') {
  const { data } = await api.post(`/api/payments/${paymentId}/dev-confirm`, {
    result,
  });

  return data;
}

export default api;
