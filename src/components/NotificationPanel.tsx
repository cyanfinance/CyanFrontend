import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, AlertCircle, DollarSign, CreditCard, CheckCircle } from 'lucide-react';
import { API_URL } from '../config';

interface Notification {
  _id: string;
  type: 'new_loan' | 'new_repayment' | 'loan_closed' | 'payment_due' | 'payment_overdue';
  title: string;
  message: string;
  loanId: {
    _id: string;
    loanId: string;
    amount: number;
    term: number;
    interestRate: number;
    status: string;
  };
  customerName: string;
  customerMobile: string;
  amount: number;
  dueDate?: string;
  isRead: boolean;
  isActive: boolean;
  createdAt: string;
  readAt?: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, token }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isOpen, filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'unread') {
        params.append('isRead', 'false');
      }
      
      const response = await fetch(`${API_URL}/notifications?${params}`, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await response.json();
      if (response.ok) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token
        }
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token
        }
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_loan':
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'new_repayment':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'loan_closed':
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      case 'payment_due':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'payment_overdue':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'new_loan':
        return 'border-l-blue-500 bg-blue-50';
      case 'new_repayment':
        return 'border-l-green-500 bg-green-50';
      case 'loan_closed':
        return 'border-l-purple-500 bg-purple-50';
      case 'payment_due':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'payment_overdue':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-4 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="ml-auto px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            >
              Mark All Read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="w-12 h-12 mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 rounded-lg border-l-4 ${getNotificationColor(notification.type)} ${
                    !notification.isRead ? 'ring-2 ring-yellow-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-semibold text-sm ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="p-1 hover:bg-green-100 rounded transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>{notification.customerName} • {notification.customerMobile}</span>
                        <span>{formatDate(notification.createdAt)}</span>
                      </div>
                      {notification.amount && (
                        <div className="mt-2 text-sm font-medium text-gray-700">
                          Amount: {formatCurrency(notification.amount)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel; 