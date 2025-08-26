import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const expireTime = localStorage.getItem('auth_expire');
    
    if (!token || !expireTime) {
      navigate('/login');
      return;
    }

    const now = new Date().getTime();
    if (now >= parseInt(expireTime)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_expire');
      navigate('/login');
    }
  }, [navigate]);

  return <>{children}</>;
};
