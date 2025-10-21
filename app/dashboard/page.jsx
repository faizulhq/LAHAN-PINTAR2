'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute'; 
import useAuthStore from '@/lib/store/authStore';
import { useLogout } from '@/lib/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/lib/api/dashboard'; 
import { getFinancialReport } from '@/lib/api/reporting';

function DashboardContent() {
  console.log("🏁 [DashboardPage] BERHASIL RENDER KONTEN");
  
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  
  const { 
    data: dashboardData, 
    isLoading: isLoadingDashboard 
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData
  });

  const { 
    data: reportData, 
    isLoading: isLoadingReport 
  } = useQuery({
    queryKey: ['financialReport'],
    queryFn: getFinancialReport
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      {user ? (
        <p>Selamat datang, {user.username}! (Role: {user.role})</p>
      ) : (
        <p>Memuat data user...</p>
      )}

      <hr />
      
      <h3>Ringkasan Dashboard</h3>
      {isLoadingDashboard ? (
        <p>Memuat data dashboard...</p>
      ) : dashboardData ? (
        <pre>{JSON.stringify(dashboardData, null, 2)}</pre>
      ) : (
        <p>Gagal memuat data dashboard.</p>
      )}

      <hr />

      <h3>Ringkasan Keuangan</h3>
      {isLoadingReport ? (
        <p>Memuat laporan...</p>
      ) : reportData ? (
        <pre>{JSON.stringify(reportData, null, 2)}</pre>
      ) : (
        <p>Gagal memuat data laporan.</p>
      )}

      <hr style={{ marginTop: '20px' }} />

      <button
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
        style={{ padding: '10px', background: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}