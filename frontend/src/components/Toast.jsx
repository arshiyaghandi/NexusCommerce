import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div 
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="glass animate-fade-in-up"
            style={{
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              pointerEvents: 'auto',
              minWidth: '300px',
              maxWidth: '400px',
              borderLeft: `4px solid ${
                toast.type === 'success' ? '#10b981' : 
                toast.type === 'error' ? '#ef4444' : 
                'var(--accent-primary)'
              }`
            }}
          >
            <div>
              {toast.type === 'success' && <CheckCircle size={24} color="#10b981" />}
              {toast.type === 'error' && <AlertCircle size={24} color="#ef4444" />}
              {toast.type === 'info' && <Info size={24} color="var(--accent-primary)" />}
            </div>
            <div style={{ flex: 1, fontSize: '0.95rem' }}>
              {toast.message}
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
