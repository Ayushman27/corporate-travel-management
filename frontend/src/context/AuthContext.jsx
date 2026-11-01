import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored    = localStorage.getItem('ctm_user');
    const token     = localStorage.getItem('ctm_token');
    const storedCo  = localStorage.getItem('ctm_company');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch (_) {}
    }
    if (storedCo) {
      try { setCompany(JSON.parse(storedCo)); } catch (_) {}
    }
    setLoading(false);
  }, []);

  // Employee login (email only or email + OTP)
  const employeeLogin = useCallback(async (email, companyId, otp) => {
    const { data } = await authAPI.employeeLogin({ email, companyId, otp });
    
    if (data.requiresOTP) {
      return data;
    }

    localStorage.setItem('ctm_token', data.token);
    localStorage.setItem('ctm_user',  JSON.stringify(data.user));
    if (data.company) localStorage.setItem('ctm_company', JSON.stringify(data.company));
    setUser(data.user);
    setCompany(data.company || null);
    toast.success(`Welcome, ${data.user.name}!`);
    return data;
  }, []);

  // Admin login (email + password)
  const adminLogin = useCallback(async (email, password, otp) => {
    const { data } = await authAPI.adminLogin({ email, password, otp });
    if (data.requiresOTP) {
      return data;
    }
    localStorage.setItem('ctm_token', data.token);
    localStorage.setItem('ctm_user',  JSON.stringify(data.user));
    if (data.company) localStorage.setItem('ctm_company', JSON.stringify(data.company));
    setUser(data.user);
    setCompany(data.company || null);
    toast.success(`Welcome back, ${data.user.name}!`);
    return data;
  }, []);

  // Register company
  const registerCompany = useCallback(async (formData) => {
    const { data } = await authAPI.registerCompany(formData);
    localStorage.setItem('ctm_token', data.token);
    localStorage.setItem('ctm_user',  JSON.stringify(data.user));
    if (data.company) localStorage.setItem('ctm_company', JSON.stringify(data.company));
    setUser(data.user);
    setCompany(data.company || null);
    toast.success(`Company "${data.company?.companyName}" registered! ${data.importedEmployees} employees imported.`);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ctm_token');
    localStorage.removeItem('ctm_user');
    localStorage.removeItem('ctm_company');
    setUser(null);
    setCompany(null);
    toast.success('Logged out successfully');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.me();
      setUser(data.user);
      setCompany(data.company || null);
      localStorage.setItem('ctm_user', JSON.stringify(data.user));
      if (data.company) localStorage.setItem('ctm_company', JSON.stringify(data.company));
    } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider value={{
      user, company, loading,
      employeeLogin, adminLogin, registerCompany,
      logout, refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
