import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { requestFirebaseNotificationPermission, onMessageListener } from '../utils/firebase';
import api from '../commonApi/api';
import { motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    // Play a pleasant double-ding sound (D5 then A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (error) {
    console.error("Audio play failed:", error);
  }
};

export const showAnimatedToast = (title, message, iconStr, theme = 'default') => {
  playNotificationSound();

  let borderClass = 'border border-gray-100 dark:border-gray-700 ring-1 ring-black/5';
  let iconBgClass = 'bg-white border-gray-200';
  
  if (theme === 'orange') {
    borderClass = 'border-l-4 border-l-orange-500 border-y border-r border-gray-100 dark:border-gray-700 shadow-orange-500/20 shadow-lg';
    iconBgClass = 'bg-orange-50 border-orange-200';
  } else if (theme === 'red') {
    borderClass = 'border-l-4 border-l-red-500 border-y border-r border-gray-100 dark:border-gray-700 shadow-red-500/20 shadow-lg';
    iconBgClass = 'bg-red-50 border-red-200';
  }

  toast.custom(
    (t) => (
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{
          opacity: t.visible ? 1 : 0,
          y: t.visible ? 0 : -20,
          scale: t.visible ? 1 : 0.9,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl pointer-events-auto flex overflow-hidden ${borderClass}`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full border ${iconBgClass} overflow-hidden shadow-sm`}>
              {theme === 'default' ? (
                <img src="/images/kannan_silks_logo.png" alt="Logo" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-xl">{iconStr}</span>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {title}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-100 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    ),
    { duration: 5000 }
  );
};

export const useNotifications = (user, token) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.data.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      // 1. Initialize Socket.IO connection
      const newSocket = io(SOCKET_URL, {
        auth: {
          token
        }
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      newSocket.on('new_notification', (notification) => {
        // Handle incoming WebSocket notification
        showAnimatedToast(notification.title, notification.message, '🔔');
        fetchNotifications(); // Refresh notifications
        window.dispatchEvent(new CustomEvent('app_notification', { detail: notification }));
      });

      // 2. Request FCM Permission and Token
      const setupFCM = async () => {
        try {
          const fcmToken = await requestFirebaseNotificationPermission();
          if (fcmToken) {
            // Send token to backend
            await api.post('/notifications/fcm-token', { token: fcmToken });
            console.log('FCM Token sent to backend');
          }
        } catch (error) {
          console.error('Error setting up FCM:', error);
        }
      };

      setupFCM();

      // Cleanup on unmount
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user?.id, token]);

  useEffect(() => {
    // Listen for FCM foreground messages
    const listenForMessages = async () => {
      try {
        const payload = await onMessageListener();
        if (payload) {
          showAnimatedToast(
            payload.notification.title,
            payload.notification.body,
            '🔥'
          );
          fetchNotifications(); // Refresh notifications
          window.dispatchEvent(new CustomEvent('app_notification', { detail: payload }));
          // To keep listening, we'd ideally loop or re-attach listener
          listenForMessages(); 
        }
      } catch (err) {
        console.log('failed: ', err);
      }
    };
    
    if (user) {
        listenForMessages();
    }
  }, [user?.id]);

  useEffect(() => {
    const handleSync = (e) => {
      const detail = e.detail;
      if (detail && detail.action) {
        if (detail.action === 'markAsRead') {
          setNotifications(prev => prev.map(n => n.id === detail.id ? { ...n, is_read: true } : n));
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else if (detail.action === 'markAllAsRead') {
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
          setUnreadCount(0);
        } else if (detail.action === 'delete') {
          setNotifications(prev => {
             const toDelete = prev.find(n => n.id === detail.id);
             if (toDelete && !toDelete.is_read) {
               setUnreadCount(c => Math.max(0, c - 1));
             }
             return prev.filter(n => n.id !== detail.id);
          });
        }
      } else {
        fetchNotifications();
      }
    };
    window.addEventListener('notifications_sync', handleSync);
    return () => window.removeEventListener('notifications_sync', handleSync);
  }, [user?.id, token]);

  const markAsRead = async (id) => {
    window.dispatchEvent(new CustomEvent('notifications_sync', { detail: { action: 'markAsRead', id } }));

    try {
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Error marking as read', error);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    window.dispatchEvent(new CustomEvent('notifications_sync', { detail: { action: 'markAllAsRead' } }));

    try {
      await api.put('/notifications/read-all');
    } catch (error) {
      console.error('Error marking all as read', error);
      fetchNotifications();
    }
  };

  const deleteNotification = async (id) => {
    window.dispatchEvent(new CustomEvent('notifications_sync', { detail: { action: 'delete', id } }));

    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error('Error deleting notification', error);
      fetchNotifications();
    }
  };

  return { socket, notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification };
};

