'use client';

import React from 'react';
import {
  Row, Col, Card, Statistic, Typography,
  Divider, Spin, Alert, Flex, Steps, Button, Progress // [FIX] Progress ditambahkan di sini
} from 'antd';
import {
  ContainerOutlined, DollarCircleOutlined, RiseOutlined, 
  WalletOutlined, ShoppingOutlined, ExperimentOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { GiReceiveMoney, GiPayMoney } from 'react-icons/gi';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { getDashboardData } from '@/lib/api/dashboard';
import { getFinancialReport } from '@/lib/api/reporting';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;

const formatRupiah = (value) => {
  if (value == null) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

// ==========================================================================
// 1. DASHBOARD KHUSUS OPERATOR (Fokus Kerja Lapangan)
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
               title="Total Hasil Produksi" 
               value={formatRupiah(dashboardData?.total_yield)} 
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

      <Card title="Panduan Singkat" style={{ marginTop: 24 }}>
        <Steps
          direction="vertical"
          size="small"
          current={-1}
          items={[
            { title: 'Cek Kondisi Aset', description: 'Pastikan kondisi lahan dan ternak dalam keadaan baik.' },
            { title: 'Catat Pengeluaran', description: 'Setiap pembelian operasional wajib dicatat beserta foto bukti.' },
            { title: 'Input Hasil Panen', description: 'Hasil produksi harus diinput segera setelah panen/pengambilan.' },
          ]}
        />
      </Card>
    </div>
  );
};

// ==========================================================================
// 2. DASHBOARD KHUSUS INVESTOR (Fokus ROI & Portofolio)
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
              title="Total Investasi Anda"
              value={formatRupiah(dashboardData?.total_funding)}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Divider />
            <Text type="secondary">Dana yang telah Anda salurkan ke proyek.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable style={{ height: '100%' }}>
            <Statistic
              title="Aset Didanai"
              value={dashboardData?.total_assets || 0}
              prefix={<ContainerOutlined />}
            />
            <Divider />
            <Text type="secondary">Jumlah aset/proyek yang Anda miliki kepemilikannya.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable style={{ height: '100%' }}>
            <Statistic
              title="Total Bagi Hasil (Yield)"
              value={formatRupiah(dashboardData?.total_yield)}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Divider />
            <Text type="secondary">Akumulasi keuntungan dari bagi hasil produksi.</Text>
          </Card>
        </Col>
      </Row>

      {/* List Kepemilikan */}
      {dashboardData?.ownership_percentage && dashboardData.ownership_percentage.length > 0 && (
        <Card title="Detail Kepemilikan Aset" style={{ marginTop: 24 }}>
            {dashboardData.ownership_percentage.map((owner, index) => (
               <div key={index} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                 <Flex justify="space-between" align='center'>
                    <div>
                        <Text strong style={{ fontSize: 16 }}>{owner.name || 'Nama Aset'}</Text>
                        <div style={{ fontSize: 12, color: '#999' }}>Unit Dimiliki: {owner.units || 0}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                         <Text strong style={{ color: '#1890ff', fontSize: 18 }}>{owner.percentage.toFixed(2)}%</Text>
                         <div style={{ fontSize: 12, color: '#999' }}>Saham</div>
                    </div>
                 </Flex>
                 <Progress percent={owner.percentage} showInfo={false} strokeColor="#1890ff" />
               </div>
            ))}
        </Card>
      )}
    </div>
  );
};

// ==========================================================================
// 3. DASHBOARD GLOBAL (Admin, Superadmin, Viewer)
// ==========================================================================
const ExecutiveDashboard = ({ dashboardData, reportData }) => {
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
                 title="Total Dana Masuk" 
                 value={formatRupiah(dashboardData?.total_funding)} 
                 prefix={<GiReceiveMoney />} 
                 valueStyle={{ color: '#237804' }}
              />
            </Card>
         </Col>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic 
                 title="Total Pengeluaran" 
                 value={formatRupiah(reportData?.ringkasan_dana?.total_pengeluaran)} 
                 prefix={<GiPayMoney />} 
                 valueStyle={{ color: '#cf1322' }}
              />
            </Card>
         </Col>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic 
                 title="Cash on Hand" 
                 value={formatRupiah(reportData?.ringkasan_dana?.sisa_dana)} 
                 prefix={<WalletOutlined />} 
                 valueStyle={{ color: '#1890ff' }}
              />
            </Card>
         </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
         <Col xs={24} lg={12}>
            <Card title="Status Keuangan" bordered={false}>
               <Flex justify='space-between' align='center' style={{ marginBottom: 16 }}>
                  <Text>Laba/Rugi Bersih</Text>
                  <Text strong 
                    style={{ 
                        color: reportData?.laba_rugi?.Status === 'Laba' ? '#52c41a' : '#f5222d',
                        fontSize: 18 
                    }}
                  >
                    {formatRupiah(reportData?.laba_rugi?.Jumlah)}
                  </Text>
               </Flex>
               <Divider />
               <Flex justify='space-between' align='center'>
                  <Text>Total Nilai Produksi</Text>
                  <Text strong>{formatRupiah(dashboardData?.total_yield)}</Text>
               </Flex>
            </Card>
         </Col>
         <Col xs={24} lg={12}>
            <Card title="Distribusi Kepemilikan Global" bordered={false}>
               {dashboardData?.ownership_percentage?.slice(0, 5).map((owner, i) => (
                   <div key={i} style={{ marginBottom: 12 }}>
                       <Flex justify="space-between">
                           <Text>{owner.name}</Text>
                           <Text>{owner.percentage.toFixed(1)}%</Text>
                       </Flex>
                       <Progress percent={owner.percentage} size="small" showInfo={false} />
                   </div>
               ))}
               {(!dashboardData?.ownership_percentage || dashboardData.ownership_percentage.length === 0) && (
                   <Text type="secondary">Belum ada data kepemilikan.</Text>
               )}
            </Card>
         </Col>
      </Row>
    </div>
  );
};

// ==========================================================================
// MAIN COMPONENT
// ==========================================================================
function AdminDashboardContent() {
  const user = useAuthStore((state) => state.user);
  
  // Cek Role
  const userRole = user?.role?.name || user?.role;
  const isOperator = userRole === 'Operator';
  const isInvestor = userRole === 'Investor';

  // Fetch Data Dashboard
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isError: isErrorDashboard,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });

  // Fetch Financial Report (Hanya jika BUKAN Operator)
  const {
    data: reportData,
    isLoading: isLoadingReport,
    isError: isErrorReport,
  } = useQuery({
    queryKey: ['financialReport'],
    queryFn: getFinancialReport,
    enabled: !isOperator,
  });

  const isLoading = isLoadingDashboard || (isLoadingReport && !isOperator);

  if (isLoading) return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>;
  
  if (isErrorDashboard) return <Alert message="Gagal memuat data dashboard" type="error" showIcon />;

  return (
    <div style={{ padding: '0px' }}>
      {isOperator ? (
         <OperatorDashboard dashboardData={dashboardData} user={user} />
      ) : isInvestor ? (
         <InvestorDashboard dashboardData={dashboardData} user={user} />
      ) : (
         <ExecutiveDashboard dashboardData={dashboardData} reportData={reportData} />
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}