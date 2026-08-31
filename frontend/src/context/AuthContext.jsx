import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const silentRefresh = async () => {
    try {
      const storedUser = localStorage.getItem('userInfo');
      if (!storedUser) return;
      const parsed = JSON.parse(storedUser);
      
      const { data } = await axios.post('http://localhost:5000/api/auth/refresh', {}, { withCredentials: true });
      const updatedUser = { ...parsed, token: data.token };
      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Silent refresh failed:', error);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      // Perform initial refresh verification
      silentRefresh();
    }

    // Set up silent refresh check every 14 minutes (Access Token has a 15 min TTL)
    const interval = setInterval(() => {
      silentRefresh();
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/auth/login', 
        { email, password },
        { withCredentials: true }
      );
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, silentRefresh }}>
      {children}
    </AuthContext.Provider>
  );
};
