import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { API_URL } from '../config';
import NotificationPanel from './NotificationPanel';

interface NotificationBellProps {
  token: string;
  isAdmin?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ token, isAdmin = false }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const fetchUnreadCount = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    if (isAdmin) {
      setIsPanelOpen(true);
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      <button
        onClick={handleBellClick}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-medium animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {loading && (
          <div className="absolute -top-1 -right-1 w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
        )}
      </button>

      <NotificationPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        token={token}
      />
    </>
  );
};

export default NotificationBell; 