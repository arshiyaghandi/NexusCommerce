import { useNavigate } from 'react-router-dom';
import { Trash2, CreditCard, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import PageTransition from '../components/PageTransition';

const itemVariants = {
  initial: { opacity: 0, x: -30, height: 0, marginBottom: 0 },
  animate: {
    opacity: 1,
    x: 0,
    height: 'auto',
    marginBottom: '1rem',
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    x: 60,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
  },
};

export default function Cart() {
  const navigate = useNavigate();
  const { items, isLoading, addItem, removeItem, clearCart } = useCart();

  if (isLoading) return <div className="text-center mt-4 text-muted">Loading cart...</div>;

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <PageTransition>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Your Cart</h2>
        {items.length > 0 && (
          <motion.button
            className="btn btn-outline"
            onClick={() => clearCart()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 size={16} /> Clear Cart
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {items.length === 0 ? (
          <motion.div
            key="empty-cart"
            className="glass"
            style={{ padding: '4rem', textAlign: 'center' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <ShoppingBag size={64} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem', display: 'block', opacity: 0.4 }} />
            </motion.div>
            <p className="text-muted" style={{ fontSize: '1.25rem' }}>Your cart is currently empty.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.productId}
                    className="glass"
                    style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' }}
                    variants={itemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layout
                  >
                    <div>
                      <h4 style={{ marginBottom: '0.25rem' }}>{item.productName}</h4>
                      <p className="text-muted">Qty: {item.quantity} x ${item.unitPrice}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        className="glass"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '8px',
                        }}
                      >
                        <motion.button
                          onClick={() => {
                            if (item.quantity > 1) {
                              addItem({
                                product: { id: item.productId, skuCode: '', name: item.productName, description: '', price: item.unitPrice },
                                quantity: -1,
                              });
                            } else {
                              removeItem(item.productId);
                            }
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.8 }}
                        >
                          -
                        </motion.button>
                        <motion.span
                          key={item.quantity}
                          style={{ padding: '0 0.5rem', fontWeight: '600', fontSize: '0.9rem' }}
                          initial={{ scale: 1.4, color: 'var(--accent-primary)' }}
                          animate={{ scale: 1, color: 'var(--text-light)' }}
                          transition={{ duration: 0.2 }}
                        >
                          {item.quantity}
                        </motion.span>
                        <motion.button
                          onClick={() =>
                            addItem({
                              product: { id: item.productId, skuCode: '', name: item.productName, description: '', price: item.unitPrice },
                              quantity: 1,
                            })
                          }
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.8 }}
                        >
                          +
                        </motion.button>
                      </div>
                      <motion.span
                        key={`total-${item.quantity}`}
                        style={{ fontWeight: '600', minWidth: '70px', textAlign: 'right' }}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                      >
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </motion.span>
                      <motion.button
                        className="btn btn-outline"
                        style={{ padding: '0.5rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        onClick={() => removeItem(item.productId)}
                        whileHover={{ scale: 1.1, borderColor: '#ef4444' }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <motion.div
              className="glass"
              style={{ padding: '2rem', position: 'sticky', top: '100px' }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>Order Summary</h3>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <span className="text-muted">Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <span className="text-muted">Tax (0%)</span>
                <span>$0.00</span>
              </div>
              <div className="flex-between" style={{ marginBottom: '2rem', fontSize: '1.25rem', fontWeight: '600' }}>
                <span>Total</span>
                <motion.span
                  key={`grand-${total}`}
                  style={{ color: 'var(--accent-primary)' }}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  ${total.toFixed(2)}
                </motion.span>
              </div>
              <motion.button
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem' }}
                onClick={() => navigate('/checkout')}
                whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)' }}
                whileTap={{ scale: 0.98 }}
              >
                <CreditCard size={18} /> Checkout & Pay
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
