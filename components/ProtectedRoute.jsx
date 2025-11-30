'use client';
import { useEffect, useState } from 'react'; // Tambah useState
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/authStore';
import { Spin } from 'antd';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. Cek Login
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // 2. Ambil Role Name (Support Object & String)
    const userRole = user.role?.name || user.role;

    // 3. Cek Hak Akses Role
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      // Jika role tidak diizinkan, redirect ke halaman yang sesuai
      if (userRole === 'Viewer') {
        router.push('/dashboard');
      } else {
        router.push('/admin'); // Default redirect
      }
    } else {
      // Lolos semua cek
      setIsAuthorized(true);
    }
  }, [isAuthenticated, user, router, allowedRoles]);

  // Tampilkan loading selagi mengecek (Mencegah kedipan konten terlarang)
  if (!isAuthorized) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="Memverifikasi akses..." />
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;