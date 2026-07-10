import { useEffect } from 'react';
import { useToast } from './Toast';

export default function NotificationManager({ user }) {
  const { addToast } = useToast();

  useEffect(() => {
    if (!user || user.error) return; // Only connect if authenticated

    const ws = new WebSocket('ws://localhost:8080/ws/notifications');

    ws.onopen = () => {
      console.log('Connected to NexusCommerce WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WS Message received:', data);
        
        // Saga Events Handling
        if (data.orderId) {
          if (data.status === 'COMPLETED' || data.status === 'APPROVED') {
             addToast(`Your order #${data.orderId} was completed successfully!`, 'success');
          } else if (data.status === 'CANCELLED' || data.status === 'REJECTED') {
             // Differentiate reason based on the actual event class name or message
             const reason = data.reason ? data.reason : 'inventory or payment issues';
             addToast(`Order #${data.orderId} was cancelled due to ${reason}.`, 'error');
          } else if (data.status === 'PENDING') {
             addToast(`Order #${data.orderId} has been placed. Waiting for payment...`, 'info');
          } else {
             addToast(`Order #${data.orderId} status updated to ${data.status}.`, 'info');
          }
        }
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
    };

    return () => {
      ws.close();
    };
  }, [user, addToast]);

  return null; // This component doesn't render anything
}
