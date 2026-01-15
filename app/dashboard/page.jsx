'use client';

import React from 'react';
import {
  Layout, Row, Col, Card, Statistic, Avatar, Typography, Space, 
  Divider, Dropdown, Spin, Alert, Flex, Button, Steps
} from 'antd';
import {
  UserOutlined, LogoutOutlined, MailOutlined, UserSwitchOutlined,
  ContainerOutlined, DollarCircleOutlined, RiseOutlined, 
  WalletOutlined, ShoppingOutlined, ExperimentOutlined,
  ArrowRightOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { GiSprout, GiPayMoney, GiReceiveMoney } from 'react-icons/gi';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { useLogout } from '@/lib/hooks/useAuth';
import { getDashboardData } from '@/lib/api/dashboard';
// Reporting dihapus dari backend
import { useRouter } from 'next/navigation';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const formatRupiah = (value) => {
  if (value == null) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

// ==========================================================================
// 1. DASHBOARD KHUSUS OPERATOR
// ==========================================================================
const OperatorDashboard = ({ dashboardData, user }) => {
  const router = useRouter();

  return (
    <div>
      <Title level={3}>Halo, {user?.username}!</Title>
      <Paragraph type="secondary">Selamat bekerja. Berikut ringkasan operasional hari ini.</Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
            <Card hoverable className="border-l-4 border-l-blue-500">
              <Statistic 
                title="Total Aset Dikelola" 
                value={dashboardData?.total_assets || 0} 
                prefix={<ContainerOutlined />} 
              />
            </Card>
        </Col>
        <Col xs={24} sm={12}>
            <Card hoverable className="border-l-4 border-l-green-500">
              <Statistic 
                title="Total Nilai Aset" 
                value={dashboardData?.total_asset_value} 
                prefix={<RiseOutlined />} 
                valueStyle={{ color: '#237804' }}
              />
            </Card>
        </Col>
      </Row>

      <Title level={4} style={{ marginTop: 32 }}>Aksi Cepat</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card 
            hoverable 
            style={{ background: '#f6ffed', borderColor: '#b7eb8f', cursor: 'pointer' }}
            onClick={() => router.push('/admin/pengeluaran')}
          >
            <Flex align="center" gap={16}>
              <ShoppingOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <div>
                <Title level={5} style={{ margin: 0 }}>Input Pengeluaran</Title>
                <Text type="secondary">Catat pembelian pakan, pupuk, dll</Text>
              </div>
              <ArrowRightOutlined style={{ marginLeft: 'auto' }} />
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card 
            hoverable 
            style={{ background: '#e6f7ff', borderColor: '#91d5ff', cursor: 'pointer' }}
            onClick={() => router.push('/admin/produksi')}
          >
            <Flex align="center" gap={16}>
              <ExperimentOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <div>
                <Title level={5} style={{ margin: 0 }}>Input Produksi</Title>
                <Text type="secondary">Catat hasil panen harian</Text>
              </div>
              <ArrowRightOutlined style={{ marginLeft: 'auto' }} />
            </Flex>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ==========================================================================
// 2. DASHBOARD KHUSUS INVESTOR
// ==========================================================================
const InvestorDashboard = ({ dashboardData, user }) => {
  return (
    <div>
      <Title level={3}>Portofolio Investasi</Title>
      <Paragraph type="secondary">Ringkasan kinerja investasi Anda di Lahan Pintar.</Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card hoverable style={{ height: '100%' }}>
            <Statistic
              title="Saham Terjual (Total)"
              value={dashboardData?.shares_sold || 0}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix="Lembar"
            />
            <Divider />
            <Text type="secondary">Total lembar saham yang beredar di sistem.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable style={{ height: '100%' }}>
            <Statistic
              title="Aset Produktif"
              value={dashboardData?.total_assets || 0}
              prefix={<ContainerOutlined />}
            />
            <Divider />
            <Text type="secondary">Jumlah aset/lahan yang sedang dikelola.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable style={{ height: '100%' }}>
            <Statistic
              title="Valuasi Aset Total"
              value={dashboardData?.total_asset_value}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Divider />
            <Text type="secondary">Nilai total aset yang menjadi dasar bagi hasil.</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ==========================================================================
// 3. DASHBOARD GLOBAL (Admin, Superadmin)
// ==========================================================================
const ExecutiveDashboard = ({ dashboardData }) => {
  return (
    <div>
      <Title level={3}>Dashboard Ringkasan</Title>
      <Paragraph type="secondary">Gambaran umum performa Lahan Pintar secara keseluruhan.</Paragraph>

      <Row gutter={[24, 24]}>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic 
                 title="Total Aset" 
                 value={dashboardData?.total_assets || 0} 
                 prefix={<ContainerOutlined />} 
              />
            </Card>
         </Col>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic 
                 title="Saham Terjual" 
                 value={dashboardData?.shares_sold} 
                 prefix={<GiReceiveMoney />} 
                 valueStyle={{ color: '#237804' }}
                 suffix="Lbr"
              />
            </Card>
         </Col>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic 
                 title="Valuasi Aset" 
                 value={dashboardData?.total_asset_value} 
                 prefix={<RiseOutlined />} 
                 valueStyle={{ color: '#1890ff' }}
              />
            </Card>
         </Col>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic 
                 title="Cash on Hand" 
                 value={dashboardData?.total_cash_on_hand} 
                 prefix={<WalletOutlined />} 
                 valueStyle={{ color: '#cf1322' }} // Merah jika minus (logic be)
              />
            </Card>
         </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
         <Col xs={24} lg={12}>
            <Card title="Status Saham" bordered={false}>
               <Flex justify='space-between' align='center' style={{ marginBottom: 16 }}>
                  <Text>Saham Tersedia</Text>
                  <Text strong 
                    style={{ 
                        color: '#52c41a',
                        fontSize: 18 
                    }}
                  >
                    {dashboardData?.shares_available} Lembar
                  </Text>
               </Flex>
               <Divider />
               <Flex justify='space-between' align='center'>
                  <Text>Harga Per Lembar</Text>
                  <Text strong>{formatRupiah(100000)} (Est)</Text>
               </Flex>
            </Card>
         </Col>
      </Row>
    </div>
  );
};

// ==========================================================================
// MAIN COMPONENT
// ==========================================================================
function DashboardContent() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  // Cek Role
  const userRole = user?.role?.name || user?.role;
  const isOperator = userRole === 'Operator';
  const isInvestor = userRole === 'Investor';

  // Fetch Data Global
  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });

  const handleLogout = () => logoutMutation.mutate();

  const menuItems = [
    {
      key: 'info',
      type: 'group',
      label: <Text strong>{user?.username}</Text>,
      children: [
        { key: 'role', icon: <UserSwitchOutlined />, label: userRole, disabled: true },
      ],
    },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Header style={{ background: '#FFFFFF', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 84, position: 'sticky', top: 0, zIndex: 1, boxShadow: '0 2px 8px #f0f1f2' }}>
        <Flex align="center" gap="middle">
          <GiSprout style={{ fontSize: '32px', color: '#237804' }} />
          <Title level={4} style={{ margin: 0, color: '#111928' }}>Lahan Pintar</Title>
        </Flex>
        <Dropdown menu={{ items: menuItems, onClick: ({ key }) => key === 'logout' && handleLogout() }}>
          <Avatar size="large" icon={<UserOutlined />} style={{ cursor: 'pointer', backgroundColor: '#237804' }} />
        </Dropdown>
      </Header>

      <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {isLoading && <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>}
        
        {isError && <Alert message="Gagal memuat data dashboard" type="error" showIcon />}

        {!isLoading && !isError && (
          <>
            {isOperator ? (
               <OperatorDashboard dashboardData={dashboardData} user={user} />
            ) : isInvestor ? (
               <InvestorDashboard dashboardData={dashboardData} user={user} />
            ) : (
               <ExecutiveDashboard dashboardData={dashboardData} />
            )}
          </>
        )}
      </Content>
    </Layout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}