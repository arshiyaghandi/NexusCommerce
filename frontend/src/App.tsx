import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';
import NotificationManager from './components/NotificationManager';
import ErrorBoundary from './components/ErrorBoundary';

/* ── Lazy-loaded pages (route-level code splitting) ─────────────── */
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', gap: '1.5rem' }}>
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src="/logo.jpg"
          alt="Loading..."
          style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
        />
      </motion.div>
      <div className="page-loader">
        <div className="page-loader-ring" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <NotificationManager />
            <BrowserRouter>
              <AnimatePresence mode="wait">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route element={<Layout />}>
                      {/*
                        Public routes — accessible without authentication.
                        These pages are marketing-facing and drive customer acquisition.
                      */}
                      <Route index element={<Home />} />
                      <Route path="products" element={<Products />} />
                      <Route path="products/:id" element={<ProductDetails />} />
                      <Route path="login" element={<Login />} />
                      <Route path="register" element={<Register />} />

                      {/*
                        Protected routes — require authenticated user.
                        Unauthenticated visitors are redirected to /login with a
                        redirect param so they return to the intended page after auth.
                      */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="cart" element={<Cart />} />
                        <Route path="checkout" element={<Checkout />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="profile" element={<Profile />} />
                      </Route>


                      {/*
                        Admin routes — require ROLE_ADMIN.
                        Non-admin users are redirected to the home page.
                      */}
                      <Route element={<AdminRoute />}>
                        <Route path="admin" element={<AdminDashboard />} />
                      </Route>
                    </Route>
                  </Routes>
                </Suspense>
              </AnimatePresence>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
