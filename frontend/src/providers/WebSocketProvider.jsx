import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { WS_URL } from '../constants';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef(null);

  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token || !user || !user.id) return;

    const socket = new SockJS(WS_URL);
    const stompClient = Stomp.over(socket);
    
    // Disable extensive logging
    stompClient.debug = null;

    const connectCallback = () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');

      // Subscribe to User's specific order updates
      stompClient.subscribe(`/topic/order/${user.id}`, (message) => {
        if (message.body) {
          const order = JSON.parse(message.body);
          
          let title = '';
          let icon = '';
          
          if (order.status === 'PLACED') {
            title = 'Order Confirmed! 🎉';
            icon = '✅';
          } else if (order.status === 'PREPARING') {
            title = 'Food is being Prepared! 🍳';
            icon = '👨‍🍳';
          } else if (order.status === 'OUT_FOR_DELIVERY') {
            title = 'Order is Out for Delivery! 🛵';
            icon = '🏍️';
          } else if (order.status === 'DELIVERED') {
            title = 'Order Delivered! 🍽️';
            icon = '🥳';
          }

          if (title) {
            toast.custom((t) => (
              <div
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 z-[9999]`}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5 text-3xl">
                      {icon}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-black text-gray-900 dark:text-white">
                        {title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Order #{order.id} from {order.restaurantName} is now {order.status}.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-black text-orange-500 hover:text-orange-600 focus:outline-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            ), { duration: 6000 });
          }
        }
      });

      // If user is ADMIN, subscribe to global admin topic
      if (user.role === 'ADMIN') {
        stompClient.subscribe('/topic/admin/orders', (message) => {
          if (message.body) {
             const order = JSON.parse(message.body);
             toast(`New Update for Order #${order.id} (${order.status})`, {
               icon: '🔔',
               style: { borderRadius: '12px', background: '#333', color: '#fff' }
             });
          }
        });
      }
    };

    const errorCallback = (error) => {
      console.error('WebSocket connection error:', error);
    };

    stompClient.connect({ Authorization: `Bearer ${token}` }, connectCallback, errorCallback);
    stompClientRef.current = stompClient;
    setClient(stompClient);

    return () => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.disconnect();
      }
      setIsConnected(false);
      setClient(null);
    };
  }, [token, user?.id]);

  return (
    <WebSocketContext.Provider value={{ client, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
