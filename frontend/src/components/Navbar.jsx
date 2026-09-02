import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Bell } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      if (!user?.token) return;
      const { data } = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s polling
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      if (!user?.token) return;
      await axios.patch('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      if (!user?.token) return;
      await axios.patch(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Extract initials for avatar
  const getInitials = (name) => {
    if (!name) return 'M';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-[#08070f] border-b border-white/[0.04]">
      {/* Title */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
          Enterprise Hub
        </h2>
      </div>

      {/* Profile, Notifications & Logout */}
      <div className="flex items-center gap-6">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer hover:bg-white/[0.04]"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 text-[9px] font-extrabold text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-2.5 w-80 bg-[#0d0c15] border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <h3 className="text-xs font-bold text-gray-200">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.04]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-xs">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id}
                      onClick={() => handleMarkRead(notif._id)}
                      className={`p-3.5 text-left cursor-pointer transition-colors hover:bg-white/[0.02] flex gap-2.5 items-start ${
                        !notif.read ? 'bg-purple-500/[0.02]' : ''
                      }`}
                    >
                      {/* Unread indicator dot */}
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      )}
                      <div className="space-y-1">
                        <p className={`text-xs text-gray-300 leading-snug ${!notif.read ? 'font-semibold text-white' : ''}`}>
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-gray-500 block">
                          {getRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-white/10"></div>

        {/* User profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-blue-300">
            {getInitials(user?.name)}
          </div>
          <span className="text-sm font-medium text-gray-200">
            {user?.name || 'Admin'}
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-white/10"></div>

        {/* Logout */}
        <button 
          onClick={logout} 
          className="px-3.5 py-1.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
