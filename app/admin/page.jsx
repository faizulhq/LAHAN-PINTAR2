'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { useLogout } from '@/lib/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/lib/api/dashboard';
import { getFinancialReport } from '@/lib/api/reporting';
import { useRouter } from 'next/navigation';

function AdminDashboardContent() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const router = useRouter();

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

  // Redirect jika bukan Admin/Superadmin
  React.useEffect(() => {
    if (user && user.role !== 'Admin' && user.role !== 'Superadmin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (!user || (user.role !== 'Admin' && user.role !== 'Superadmin')) {
    return <div style={{ padding: '20px' }}>Access Denied. Redirecting...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
          <p style={{ margin: '5px 0', color: '#666' }}>
            Selamat datang, {user.username}! (Role: {user.role})
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          style={{
            padding: '10px 20px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </button>
      </div>

      <hr style={{ margin: '20px 0' }} />

      {/* Dashboard Statistics */}
      <section style={{ marginBottom: '30px' }}>
        <h2>Ringkasan Dashboard</h2>
        {isLoadingDashboard ? (
          <p>Memuat data dashboard...</p>
        ) : dashboardData ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Total Assets</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
                {dashboardData.total_assets || 0}
              </p>
            </div>
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Total Funding</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
                Rp {Number(dashboardData.total_funding || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Total Yield</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>
                Rp {Number(dashboardData.total_yield || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: '#dc3545' }}>Gagal memuat data dashboard.</p>
        )}
      </section>

      {/* Ownership Percentage */}
      {dashboardData?.ownership_percentage && dashboardData.ownership_percentage.length > 0 && (
        <section style={{ marginBottom: '30px' }}>
          <h2>Ownership Distribution</h2>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            {dashboardData.ownership_percentage.map((owner, index) => (
              <div key={index} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontWeight: '500' }}>{owner.name}</span>
                  <span style={{ fontWeight: 'bold', color: '#007bff' }}>{owner.percentage}%</span>
                </div>
                <div style={{ background: '#e9ecef', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: '#007bff',
                      height: '100%',
                      width: `${owner.percentage}%`,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <hr style={{ margin: '30px 0' }} />

      {/* Financial Report */}
      <section>
        <h2>Laporan Keuangan</h2>
        {isLoadingReport ? (
          <p>Memuat laporan keuangan...</p>
        ) : reportData ? (
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Ringkasan Dana</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'white', borderRadius: '4px' }}>
                  <span>Total Dana Masuk:</span>
                  <span style={{ fontWeight: 'bold' }}>Rp {Number(reportData.ringkasan_dana?.total_dana_masuk || 0).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'white', borderRadius: '4px' }}>
                  <span>Total Pengeluaran:</span>
                  <span style={{ fontWeight: 'bold', color: '#dc3545' }}>Rp {Number(reportData.ringkasan_dana?.total_pengeluaran || 0).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'white', borderRadius: '4px' }}>
                  <span>Sisa Dana:</span>
                  <span style={{ fontWeight: 'bold', color: '#28a745' }}>Rp {Number(reportData.ringkasan_dana?.sisa_dana || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Total Yield</h3>
              <div style={{ padding: '10px', background: 'white', borderRadius: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                  Rp {Number(reportData.total_yield || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Laba/Rugi</h3>
              <div style={{ padding: '15px', background: 'white', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  Rp {Number(reportData.laba_rugi?.Jumlah || 0).toLocaleString('id-ID')}
                </span>
                <span
                  style={{
                    padding: '5px 15px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    background: reportData.laba_rugi?.Status === 'Laba' ? '#d4edda' : reportData.laba_rugi?.Status === 'Rugi' ? '#f8d7da' : '#e2e3e5',
                    color: reportData.laba_rugi?.Status === 'Laba' ? '#155724' : reportData.laba_rugi?.Status === 'Rugi' ? '#721c24' : '#383d41'
                  }}
                >
                  {reportData.laba_rugi?.Status || 'Impas'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#dc3545' }}>Gagal memuat laporan keuangan.</p>
        )}
      </section>

      {/* Admin Tools Section - Only for Superadmin */}
      {user.role === 'Superadmin' && (
        <>
          <hr style={{ margin: '30px 0' }} />
          <section>
            <h2>Superadmin Tools</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <button
                style={{
                  padding: '15px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Manage Users
              </button>
              <button
                style={{
                  padding: '15px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                System Settings
              </button>
              <button
                style={{
                  padding: '15px',
                  background: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                View Logs
              </button>
              <button
                style={{
                  padding: '15px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Export Data
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}