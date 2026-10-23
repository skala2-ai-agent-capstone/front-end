import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toastState, setToastState] = useState({ message: '', key: 0 });

  const toast = useCallback((message) => {
    setToastState((s) => ({ message, key: s.key + 1 }));
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) { setAuthLoading(false); return; }
    api.get('/api/me')
      .then((me) => setUser(me))
      .catch(() => sessionStorage.removeItem('accessToken'))
      .finally(() => setAuthLoading(false));
  }, []);

  const login = useCallback(async (employeeNo, password) => {
    const data = await api.post('/api/auth/login', { employeeNo: Number(employeeNo), password });
    sessionStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  }, []);

  const signup = useCallback(async ({ employeeNo, password, name, companyId, teamId }) => {
    const data = await api.post('/api/auth/signup', {
      employeeNo: Number(employeeNo),
      password,
      name,
      companyId,
      teamId: teamId || undefined,
    });
    sessionStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    isLoggedIn: !!user, authLoading, user, role: user?.role, profile: user,
    login, signup, logout,
    toast, toastState,
  }), [user, authLoading, toastState, login, signup, logout, toast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
