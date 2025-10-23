// Di app/dashboard/page.jsx
'use client';

import React from 'react';
import {
  Layout,
  Row,
  Col,
  Card,
  Statistic,
  Avatar,
  Typography,
  Space,
  Progress,
  Divider,
  Dropdown,
  Spin, // Untuk loading
  Alert, // Untuk error
  Flex,
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  MailOutlined,
  UserSwitchOutlined,
  ContainerOutlined, // Mengganti FileTextOutlined
  DollarCircleOutlined, // Mengganti DollarOutlined
  PieChartOutlined, // Mengganti EnvironmentOutlined (untuk ownership)
  RiseOutlined, // Untuk Laba
  FallOutlined, // Untuk Rugi
  MinusOutlined, // Untuk Impas
  WalletOutlined, // Untuk Sisa Dana
  AppstoreOutlined, // Logo
} from '@ant-design/icons';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { useLogout } from '@/lib/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/lib/api/dashboard'; //
import { getFinancialReport } from '@/lib/api/reporting'; //

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

// Fungsi helper untuk format Rupiah
const formatRupiah = (value) => {
  if (value == null) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

// Komponen utama konten dashboard
function DashboardContent() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  // Ambil data dashboard & laporan
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isError: isErrorDashboard,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });

  const {
    data: reportData,
    isLoading: isLoadingReport,
    isError: isErrorReport,
  } = useQuery({
    queryKey: ['financialReport'],
    queryFn: getFinancialReport,
  });

  // Handler untuk logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
    }
  };

  // Item menu dropdown profil
  const menuItems = [
    {
      key: 'info',
      type: 'group',
      label: <Text strong>{user?.username || 'Username'}</Text>,
      children: [
        {
          key: 'email',
          icon: <MailOutlined />,
          label: user?.email || 'Email not found',
          disabled: true,
          style: { cursor: 'default', color: 'rgba(0, 0, 0, 0.88)' },
        },
        {
          key: 'role',
          icon: <UserSwitchOutlined />,
          label: user?.role || 'Role not found',
          disabled: true,
          style: { cursor: 'default', color: 'rgba(0, 0, 0, 0.88)' },
        },
      ],
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  // Menentukan ikon Laba/Rugi
  const labaRugiStatus = reportData?.laba_rugi?.Status;
  const LabaRugiIcon =
    labaRugiStatus === 'Laba' ? RiseOutlined : labaRugiStatus === 'Rugi' ? FallOutlined : MinusOutlined;
  const labaRugiColor =
    labaRugiStatus === 'Laba' ? '#52c41a' : labaRugiStatus === 'Rugi' ? '#f5222d' : '#8c8c8c';


  return (
    <Layout style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      
      {/* Header */}
      <Header
        style={{
          background: '#FFFFFF',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1)',
          height: 84,
          position: 'sticky', // Membuat header tetap di atas saat scroll
          top: 0,
          zIndex: 1,
        }}
      >
        <Flex align="center" gap="middle">
          <AppstoreOutlined style={{ fontSize: 32, color: '#237804' }} />
          <Title level={4} style={{ margin: 0, color: '#111928', whiteSpace: 'nowrap' }}>
            Lahan Pintar
          </Title>
        </Flex>
        <Dropdown
          menu={{ items: menuItems, onClick: handleMenuClick }}
          placement="bottomRight"
          arrow
          trigger={['click']}
        >
          <Avatar
            size="large"
            icon={<UserOutlined />}
            style={{ cursor: 'pointer' }}
          />
        </Dropdown>
      </Header>

      {/* Konten Utama */}
      <Content style={{ padding: '24px' }}>
        <Title level={3} style={{ marginBottom: 24 }}>
          Dashboard Ringkasan
        </Title>
        <Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 24 }}>
          Selamat datang kembali, {user?.username}! Berikut ringkasan aktivitas lahan pintar.
        </Paragraph>

        {/* --- Bagian Statistik Utama --- */}
        {(isLoadingDashboard || isLoadingReport) && <Spin size="large" style={{ display: 'block', marginBottom: 24 }} />}
        {(isErrorDashboard || isErrorReport) && (
          <Alert
            message="Error"
            description="Gagal memuat data dashboard atau laporan. Silakan coba refresh halaman."
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {!isLoadingDashboard && !isErrorDashboard && (
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Total Aset Aktif"
                  value={dashboardData?.total_assets || 0}
                  prefix={<ContainerOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Total Pendanaan"
                  value={formatRupiah(dashboardData?.total_funding)}
                  prefix={<DollarCircleOutlined />}
                />
              </Card>
            </Col>
             <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Total Hasil Produksi"
                  value={formatRupiah(dashboardData?.total_yield)}
                   prefix={<RiseOutlined />}
                   valueStyle={{ color: '#ffc107' }} // Warna kuning seperti di admin
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Statistic
                  title="Sisa Dana Tersedia"
                  value={formatRupiah(reportData?.ringkasan_dana?.sisa_dana)}
                  prefix={<WalletOutlined />}
                  valueStyle={{ color: '#28a745' }} // Warna hijau
                />
              </Card>
            </Col>
          </Row>
        )}

        <Row gutter={[24, 24]}>
          {/* --- Bagian Distribusi Kepemilikan --- */}
          {!isLoadingDashboard && !isErrorDashboard && dashboardData?.ownership_percentage && dashboardData.ownership_percentage.length > 0 && (
            <Col xs={24} lg={12}>
              <Card title="Distribusi Kepemilikan" headStyle={{borderBottom: 0}}>
                 <Spin spinning={isLoadingDashboard}>
                   {dashboardData.ownership_percentage.map((owner, index) => (
                      <div key={index} style={{ marginBottom: 16 }}>
                        <Flex justify="space-between">
                           <Text strong>{owner.name}</Text>
                           <Text type="secondary">{owner.percentage.toFixed(2)}%</Text>
                         </Flex>
                         <Progress percent={owner.percentage} showInfo={false} />
                       </div>
                   ))}
                 </Spin>
              </Card>
            </Col>
          )}

          {/* --- Bagian Ringkasan Keuangan --- */}
          {!isLoadingReport && !isErrorReport && reportData && (
             <Col xs={24} lg={12}>
               <Card title="Ringkasan Keuangan" headStyle={{borderBottom: 0}}>
                 <Spin spinning={isLoadingReport}>
                   <Space direction="vertical" size="large" style={{width: '100%'}}>
                      <Statistic
                        title="Total Dana Masuk"
                        value={formatRupiah(reportData.ringkasan_dana?.total_dana_masuk)}
                       />
                       <Statistic
                        title="Total Pengeluaran"
                        value={formatRupiah(reportData.ringkasan_dana?.total_pengeluaran)}
                        valueStyle={{ color: '#f5222d' }} // Merah
                       />
                       <Divider style={{margin: '8px 0'}}/>
                       <Statistic
                         title={`Status Keuangan (${reportData.laba_rugi?.Status || 'Impas'})`}
                         value={formatRupiah(reportData.laba_rugi?.Jumlah)}
                         prefix={<LabaRugiIcon />}
                         valueStyle={{ color: labaRugiColor }}
                        />
                    </Space>
                  </Spin>
               </Card>
             </Col>
           )}
        </Row>
      </Content>
    </Layout>
  );
}

// Bungkus dengan ProtectedRoute
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}