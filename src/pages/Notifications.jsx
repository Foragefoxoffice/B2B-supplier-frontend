import React, { useState } from 'react';
import { Bell, Check, Trash2, Calendar, Package, AlertCircle, ShoppingCart, MessageSquare, Truck, BellCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifications } from '../hooks/useNotifications';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'NEW_PO':
    case 'order':
      return { icon: ShoppingCart, color: 'bg-blue-100 text-blue-600' };
    case 'PO_APPROVED':
    case 'product':
      return { icon: Package, color: 'bg-green-100 text-green-600' };
    case 'DISPATCH_UPDATED':
      return { icon: Truck, color: 'bg-purple-100 text-purple-600' };
    case 'NEW_MESSAGE':
      return { icon: MessageSquare, color: 'bg-orange-100 text-orange-600' };
    case 'alert':
      return { icon: AlertCircle, color: 'bg-rose-100 text-rose-600' };
    default:
      return { icon: Bell, color: 'bg-slate-100 text-slate-600' };
  }
};

const Notifications = () => {
  const userString = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const user = userString ? JSON.parse(userString) : null;

  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotifications(user, token);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'

  const filteredNotifications = activeTab === 'all'
    ? (notifications || [])
    : (notifications || []).filter(n => !n.is_read);

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2 tracking-tight"><BellCheck className="h-6 w-6 text-[#2563EB]" />Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay updated with your latest alerts and activities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </button>
          )}
          {notifications?.length > 0 && (
            <button
              onClick={deleteAllNotifications}
              className="flex items-center text-sm font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete all
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-2 mr-6 text-sm font-semibold relative transition-colors cursor-pointer ${activeTab === 'all' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            All
            <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">
              {(notifications || []).length}
            </span>
            {activeTab === 'all' && (
              <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('unread')}
            className={`py-4 px-2 text-sm font-semibold relative transition-colors cursor-pointer ${activeTab === 'unread' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                {unreadCount}
              </span>
            )}
            {activeTab === 'unread' && (
              <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {/* Notification List */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            // Skeleton Loader
            Array.from({ length: 5 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="p-6 flex items-start gap-4 animate-pulse">
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-200 rounded w-24"></div>
                  </div>
                  <div className="h-3 bg-slate-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const { icon: Icon, color } = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`p-6 flex items-start gap-4 transition-colors hover:bg-slate-50 ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <h4 className={`text-sm font-semibold truncate ${!notification.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center text-xs text-slate-400 whitespace-nowrap shrink-0">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                    <p className={`text-sm ${!notification.is_read ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                      {notification.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4 opacity-100 transition-opacity">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors tooltip cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Unread dot indicator */}
                  {!notification.is_read && (
                    <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 shrink-0"></div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <Bell className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">No notifications yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {activeTab === 'unread'
                  ? "You've read all your notifications. You're all caught up!"
                  : "When you get notifications, they'll show up here."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
