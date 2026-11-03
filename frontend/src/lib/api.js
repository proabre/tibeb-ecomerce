import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
});

export async function fetchPublicProducts() {
  try {
    const { data } = await api.get('/api/products');
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
