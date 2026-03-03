import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/axiosConfig";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Verify token on mount and restore session
  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken) {
        try {
          // Verify token with server (token will be added by interceptor)
          const response = await api.get("/users/verify");

          // Token is valid, restore user session
          const userData = response.data.user;
          
          // Ensure name field exists (construct from firstName/lastName if needed)
          if (!userData.name && userData.firstName && userData.lastName) {
            userData.name = `${userData.firstName} ${userData.lastName}`;
          }
          
          setToken(savedToken);
          setUser(userData);
          
          // Update localStorage with properly formatted user data
          localStorage.setItem("user", JSON.stringify(userData));
        } catch (error) {
          // Token is invalid or expired, clear storage
          console.error("Token verification failed:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      } else if (savedUser) {
        // Legacy support: if user exists but no token, clear it
        localStorage.removeItem("user");
        setUser(null);
      }
      
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const isAuthenticated = () => {
    return user !== null && token !== null;
  };

  const getToken = () => {
    return token || localStorage.getItem("token");
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    loading,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
