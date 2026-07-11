import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Gateway URL
});

// Intercept requests to add the Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication endpoints
export const login = async (username, password) => {
  const params = new URLSearchParams();
  params.append('client_id', 'nexus-auth-client');
  params.append('client_secret', 'ICdEmE4XwvcC1HMLydpsuYwUh9pp0eHm');
  params.append('grant_type', 'password');
  params.append('username', username);
  params.append('password', password);

  const response = await axios.post(
    'http://localhost:8081/realms/nexus-realm/protocol/openid-connect/token',
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  localStorage.setItem('access_token', response.data.access_token);
  localStorage.setItem('refresh_token', response.data.refresh_token);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
};

// Simple JWT decode to extract user info without making a backend request
export const checkAuth = () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return Promise.resolve({ error: 'Not authenticated' });
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check expiration
    if (payload.exp * 1000 < Date.now()) {
      logout();
      return Promise.resolve({ error: 'Token expired' });
    }

    const roles = payload.realm_access?.roles?.map(r => `ROLE_${r.toUpperCase()}`) || [];
    return Promise.resolve({
      name: payload.name || payload.preferred_username,
      email: payload.email,
      roles: roles
    });
  } catch (e) {
    logout();
    return Promise.resolve({ error: 'Invalid token' });
  }
};

// Product Endpoints
export const getProducts = () => api.get('/products');
export const getProduct = (id) => api.get(`/products/${id}`);

// Cart Endpoints
export const getCart = () => api.get('/cart');
export const addToCart = (product, quantity) => api.post('/cart/items', {
  productId: product.id,
  productName: product.name,
  quantity,
  unitPrice: product.price
});
export const removeFromCart = (productId) => api.delete(`/cart/items/${productId}`);
export const clearCart = () => api.delete('/cart');

// Order Endpoints
export const placeOrder = () => api.post('/orders');
export const getOrders = () => api.get('/orders');

// Finance Endpoints (Admin Only)
export const fetchRevenue = () => api.get('/finance/summary');
export const fetchTransactions = () => api.get('/finance/transactions');

// Inventory Endpoint
export const getInventory = (skuCode) => api.get(`/inventory/${skuCode}`);

// Register function - calls auth-service directly (not through gateway since user is not authenticated)
export const register = async (username, password, email, firstName, lastName) => {
  try {
    const response = await axios.post('http://localhost:8091/api/auth/register', {
      username,
      password,
      email,
      firstName,
      lastName
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Registration failed');
  }
};

export default api;
