import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getAccessToken, setAccessToken, addTokenObserver, removeTokenObserver } from '../utils/axios';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const checkAuth = async () => {
    try {
      const refreshResponse = await api.post('/refresh');
      setAccessToken(refreshResponse.data.accessToken);
      setUser(refreshResponse.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      // Only show errors for protected routes
      if (!window.location.pathname.startsWith('/login') && 
          !window.location.pathname.startsWith('/signup') &&
          !window.location.pathname.startsWith('/')) {
        console.error('Auth check failed:', error);
      }
      // Clear user state on auth failure
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const tokenObserver = (token) => {
      setIsAuthenticated(!!token);
    };
    addTokenObserver(tokenObserver);
    
    // Only check auth if we don't have a valid token
    if (!getAccessToken()) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
    
    return () => {
      removeTokenObserver(tokenObserver);
    };
  }, []);

 

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setAccessToken(null);
    
  };
  
  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      handleLogout();
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          ...data
        };
      }

      setAccessToken(data.accessToken);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true, user: data.user };
      
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'Failed to connect to the server' 
      };
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
