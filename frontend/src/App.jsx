import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import { checkAuth, getCart } from './services/api';
import { ToastProvider } from './components/Toast';
import NotificationManager from './components/NotificationManager';

function App() {
  const [user, setUser] = useState(null);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    checkAuth().then(res => {
      setUser(res);
      if (!res.error) {
        refreshCart();
      }
    });
  }, []);

  const refreshCart = () => {
    getCart().then(res => {
      const count = res.data.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(count);
    }).catch(e => console.error("Failed to fetch cart count", e));
  };

  return (
    <ToastProvider>
      <NotificationManager user={user} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout user={user} cartItemCount={cartItemCount} />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="products" element={<Products refreshCart={refreshCart} />} />
            <Route path="products/:id" element={<ProductDetails refreshCart={refreshCart} />} />
            <Route path="cart" element={<Cart refreshCart={refreshCart} />} />
            <Route path="orders" element={<Orders />} />
            {user && user.roles && user.roles.includes('ROLE_ADMIN') && (
              <Route path="admin" element={<AdminDashboard />} />
            )}
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
