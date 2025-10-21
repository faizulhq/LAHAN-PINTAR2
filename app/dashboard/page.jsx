'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute'; // Import dari folder components
import useAuthStore from '@/lib/store/authStore';
import { useLogout } from '@/lib/hooks/useAuth';

// Konten utama dashboard dipisah ke komponen sendiri
function DashboardContent() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      {user ? (
        <>
          <p>Selamat datang, {user.username}! (Role: {user.role})</p>
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            style={{ padding: '10px', background: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </>
      ) : (
        <p>Memuat data user...</p>
      )}
      {/* Tambahkan konten dashboard lainnya di sini */}
    </div>
  );
}

// Komponen Halaman Dashboard yang mengekspor
export default function DashboardPage() {
  return (
    // Bungkus konten dengan ProtectedRoute
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}