// Di app/admin/page.jsx
'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { useLogout } from '@/lib/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/lib/api/dashboard';
import { getFinancialReport } from '@/lib/api/reporting';
import { useRouter } from 'next/navigation';
import { Layout, Row, Col, Card, Statistic, Avatar, Typography, Flex, Spin, Alert, Button, Progress } from 'antd'; // Import komponen antd
import { UserOutlined, FileTextOutlined, DollarCircleOutlined, EnvironmentOutlined } from '@ant-design/icons'; // Import ikon antd
import { LuWheat } from 'react-icons/lu';

const { Title, Text } = Typography;

function AdminDashboardContent() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const router = useRouter();

  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isError: isErrorDashboard,
    error: errorDashboard,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData
  });

  const {
    data: reportData,
    isLoading: isLoadingReport,
    isError: isErrorReport,
    error: errorReport,
  } = useQuery({
    queryKey: ['financialReport'],
    queryFn: getFinancialReport
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Redirect jika bukan Admin/Superadmin (ini bisa dihapus jika ProtectedRoute sudah handle)
  // React.useEffect(() => {
  //   if (user && user.role?.name !== 'Admin' && user.role?.name !== 'Superadmin') {
  //     router.replace('/dashboard');
  //   }
  // });

  // Loading state bisa dicek di ProtectedRoute, tapi bisa juga di sini sebagai fallback
  // if (!user || (user.role?.name !== 'Admin' && user.role?.name !== 'Superadmin')) {
  //   return <div style={{ padding: '20px' }}>Loading or Access Denied...</div>;
  // }

  const isLoading = isLoadingDashboard || isLoadingReport;
  const isError = isErrorDashboard || isErrorReport;
  const error = errorDashboard || errorReport;

  // Helper format Rupiah
  const formatRupiah = (value) => value != null ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';


  return (
    // Kita tidak perlu Layout/Header/Sider lagi karena sudah ada di app/admin/layout.jsx
    <div style={{ padding: '0px' }}> {/* Hapus padding jika sudah ada di layout utama */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
            <div>
              <Title level={2} style={{ margin: 0, color: '#111928' }}>
                Admin Dashboard
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Ringkasan data dan aktivitas sistem Lahan Pintar.
              </Text>
            </div>
            {/* Tombol Logout bisa dipindahkan ke dropdown profil di Header (layout.jsx) */}
            {/* <Button type="primary" danger onClick={handleLogout} loading={logoutMutation.isPending}>Logout</Button> */}
      </Flex>


      {isLoading && <Spin size="large"><div style={{ padding: 50 }} /></Spin>}
      {isError && !isLoading && <Alert message="Error Memuat Data" description={error?.message || 'Gagal memuat data dashboard atau laporan.'} type="error" showIcon />}

      {!isLoading && !isError && dashboardData && (
        <>
          {/* Kartu Statistik */}
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={8}>
              <Card hoverable>
                <Statistic
                  title={<Text style={{ fontSize: '18px', color: '#585858' }}>Total Aset</Text>}
                  value={dashboardData.total_assets || 0}
                  valueStyle={{ fontSize: '31px', color: '#111928' }}
                  prefix={<FileTextOutlined style={{ color: '#0958D9', fontSize: '34px', marginRight: '16px' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card hoverable>
                <Statistic
                  title={<Text style={{ fontSize: '18px', color: '#585858' }}>Total Pendanaan</Text>}
                  value={formatRupiah(dashboardData.total_funding)}
                  valueStyle={{ fontSize: '31px', color: '#111928' }}
                  prefix={<DollarCircleOutlined style={{ color: '#7CB305', fontSize: '34px', marginRight: '16px' }} />}
                />
              </Card>
            </Col>
             <Col xs={24} lg={8}>
              <Card hoverable>
                <Statistic
                   title={<Text style={{ fontSize: '18px', color: '#585858' }}>Total Hasil Produksi</Text>}
                   value={formatRupiah(dashboardData.total_yield)}
                   valueStyle={{ fontSize: '31px', color: '#111928' }}
                   prefix={<LuWheat style={{ color: '#FAAD14', fontSize: '34px', marginRight: '16px' }} />}
                />
              </Card>
            </Col>
          </Row>

          {/* Distribusi Kepemilikan */}
          {dashboardData?.ownership_percentage && dashboardData.ownership_percentage.length > 0 && (
            <Card title="Distribusi Kepemilikan" style={{ marginBottom: 24 }}>
                {dashboardData.ownership_percentage.map((owner, index) => (
                  <div key={index} style={{ marginBottom: 16 }}>
                    <Flex justify="space-between">
                       <Text strong>{owner.name}</Text>
                       <Text type="secondary">{owner.percentage.toFixed(2)}%</Text>
                     </Flex>
                     <Progress percent={owner.percentage} showInfo={false} />
                   </div>
               ))}
            </Card>
          )}
        </>
      )}

      {/* Laporan Keuangan (jika diperlukan di dashboard admin juga) */}
      {!isLoading && !isError && reportData && (
           <Card title="Ringkasan Keuangan Cepat">
               {/* Tampilkan summary singkat dari reportData jika perlu */}
               <Statistic
                    title={`Status Keuangan (${reportData.laba_rugi?.Status || 'Impas'})`}
                    value={formatRupiah(reportData.laba_rugi?.Jumlah)}
                    valueStyle={{ color: reportData.laba_rugi?.Status === 'Laba' ? '#52c41a' : reportData.laba_rugi?.Status === 'Rugi' ? '#f5222d' : '#8c8c8c' }}
                />
                {/* ... bisa tambahkan detail lain ... */}
           </Card>
       )}

      {/* --- BAGIAN SUPERADMIN TOOLS DIHAPUS --- */}

    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    // ProtectedRoute seharusnya sudah membungkus layout, jadi mungkin tidak perlu di sini lagi
    // Jika layout belum dibungkus, tambahkan di sini
    // <ProtectedRoute>
      <AdminDashboardContent />
    // </ProtectedRoute>
  );
}