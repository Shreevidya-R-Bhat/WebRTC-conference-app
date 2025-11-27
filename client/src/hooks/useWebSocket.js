import { useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url) {
  const ws = useRef(null);
  const messageHandlers = useRef(new Set());

  useEffect(() => {
    console.log('🔌 Creating WebSocket connection');
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('✅ WebSocket CONNECTED');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      messageHandlers.current.forEach(handler => handler(data));
    };

    ws.current.onclose = () => {
      console.log('🔌 WebSocket CLOSED');
    };

    ws.current.onerror = () => {
      console.error('❌ WebSocket ERROR');
    };

    return () => {
      console.log('🧹 Cleaning up WebSocket');
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]); // Only re-run if URL changes

  const sendMessage = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
      console.log('📤', data.type);
      return true;
    }
    console.error('❌ Cannot send - WebSocket not open');
    return false;
  }, []);

  const onMessage = useCallback((handler) => {
    messageHandlers.current.add(handler);
    return () => messageHandlers.current.delete(handler);
  }, []);

  return { sendMessage, onMessage };
}
