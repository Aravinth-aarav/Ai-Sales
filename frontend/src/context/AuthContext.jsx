import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const silentRefresh = async () => {
    try {
      const storedUser = localStorage.getItem('userInfo');

      if (!storedUser) return;

      const parsed = JSON.parse(storedUser);

      const { data } = await api.post(
        '/auth/refresh',
        {},
        { withCredentials: true }
      );

      const updatedUser = {
        ...parsed,
        token: data.token
      };

      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));

    } catch (error) {
      console.error('Silent refresh failed:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        silentRefresh();
      }
    }, 0);

    const interval = setInterval(() => {
      silentRefresh();
    }, 14 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post(
        '/auth/login',
        { email, password },
        { withCredentials: true }
      );

      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        silentRefresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
