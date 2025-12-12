'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/authStore';
import Cookies from 'js-cookie';

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  const checkAuth = useCallback(() => {
    if (isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        setUser(userData);
        setIsLoading(false);
      } catch (e) {
        Cookies.remove('user');
        router.replace('/login');
      }
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, router, setUser]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return children;
  }

  return <div>Loading...</div>;
};

export default ProtectedRoute;