import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface WsMessage {
  orderId?: number;
  status?: string;
  reason?: string;
}

export default function NotificationManager() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    let ws: WebSocket;
    let reconnectDelay = 1000;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data: WsMessage = JSON.parse(event.data);
          if (data.orderId) {
            if (data.status === 'COMPLETED') {
              addToast(`Your order #${data.orderId} was completed successfully!`, 'success');
            } else if (data.status === 'CANCELLED' || data.status === 'REJECTED') {
              addToast(`Order #${data.orderId} was cancelled. ${data.reason ?? ''}`, 'error');
            } else if (data.status === 'PENDING') {
              addToast(`Order #${data.orderId} has been placed. Waiting for processing...`, 'info');
            } else {
              addToast(`Order #${data.orderId} status: ${data.status}.`, 'info');
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, 30000);
          connect();
        }, reconnectDelay);
      };

      ws.onopen = () => {
        reconnectDelay = 1000;
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current != null) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      ws?.close();
    };
  }, [user, addToast]);

  return null;
}
