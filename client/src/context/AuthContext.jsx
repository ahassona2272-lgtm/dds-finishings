import { createContext, useContext, useState, useEffect } from 'react';
import { login, getMe, getNotifications } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      fetchNotifications();
    }
    setLoading(false);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleLogin = async (email, password) => {
    const res = await login(email, password);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    fetchNotifications();
    return res.data;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setNotifications([]);
  };

  const refreshUser = async () => {
    try {
      const res = await getMe();
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login: handleLogin,
      logout: handleLogout,
      refreshUser,
      notifications,
      fetchNotifications,
      unreadCount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}