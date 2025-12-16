'use client';

import React from 'react';
import {
  Row, Col, Card, Statistic, Typography,
  Divider, Spin, Alert, Flex, Progress, Tag
} from 'antd';
import {
  ContainerOutlined, DollarCircleOutlined, RiseOutlined, 
  WalletOutlined, ShoppingOutlined, ExperimentOutlined,
  ArrowRightOutlined, ShopOutlined
} from '@ant-design/icons';
import { GiReceiveMoney, GiPayMoney } from 'react-icons/gi';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { getDashboardData } from '@/lib/api/dashboard';
import { getFinancialReport } from '@/lib/api/reporting';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

const formatRupiah = (value) => {
  if (value == null) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const calculateSafePercent = (value, total) => {
  if (!total || total === 0 || !value) return 0;
  const pct = (value / total) * 100;
  return Math.min(Math.max(pct, 0), 100);
};

const OperatorDashboard = ({ dashboardData, user }) => {
  const router = useRouter();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 0 }}>Halo, {user?.username}!</Title>
        <Text type="secondary">Selamat bertugas. Berikut ringkasan operasional lapangan.</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
           <Card hoverable className="border-l-4" style={{ borderLeft: '4px solid #1890ff' }}>
             <Statistic 
               title="Aset Dikelola" 
               value={dashboardData?.total_assets || 0} 
               prefix={<ContainerOutlined />} 
             />
           </Card>
        </Col>
        <Col xs={24} sm={12}>
           <Card hoverable className="border-l-4" style={{ borderLeft: '4px solid #52c41a' }}>
             <Statistic 
               title="Nilai Produksi Tercatat" 
               value={formatRupiah(dashboardData?.total_yield)} 
               prefix={<RiseOutlined />} 
               valueStyle={{ color: '#237804' }}
             />
           </Card>
        </Col>
      </Row>

      <Title level={4}>Aksi Cepat</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card 
            hoverable 
            style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}
            onClick={() => router.push('/admin/pengeluaran')}
          >
            <Flex align="center" gap={16}>
              <ShoppingOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div>
                <Title level={5} style={{ margin: 0 }}>Input Pengeluaran</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Beli pakan, pupuk, dll</Text>
              </div>
              <ArrowRightOutlined style={{ marginLeft: 'auto', color: '#52c41a' }} />
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card 
            hoverable 
            style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}
            onClick={() => router.push('/admin/produksi')}
          >
            <Flex align="center" gap={16}>
              <ExperimentOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div>
                <Title level={5} style={{ margin: 0 }}>Input Produksi</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Catat hasil panen</Text>
              </div>
              <ArrowRightOutlined style={{ marginLeft: 'auto', color: '#1890ff' }} />
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card 
            hoverable 
            style={{ background: '#fff7e6', borderColor: '#ffd591' }}
            onClick={() => router.push('/admin/proyek')}
          >
            <Flex align="center" gap={16}>
              <ShopOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              <div>
                <Title level={5} style={{ margin: 0 }}>Lihat Proyek</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Cek status proyek</Text>
              </div>
              <ArrowRightOutlined style={{ marginLeft: 'auto', color: '#fa8c16' }} />
            </Flex>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const InvestorDashboard = ({ dashboardData }) => {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 0 }}>Portofolio Investasi</Title>
        <Text type="secondary">Pantau perkembangan aset dan bagi hasil Anda.</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card hoverable style={{ height: '100%', borderRadius: 12 }}>
            <Statistic
              title="Total Modal Disetor"
              value={formatRupiah(dashboardData?.total_funding)}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: '#1890ff', fontWeight: 600 }}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Total dana investasi yang aktif.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable style={{ height: '100%', borderRadius: 12 }}>
            <Statistic
              title="Aset Dimiliki"
              value={dashboardData?.total_assets || 0}
              prefix={<ContainerOutlined />}
              valueStyle={{ fontWeight: 600 }}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Jumlah lahan/proyek dalam portofolio.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable style={{ height: '100%', borderRadius: 12 }}>
            <Statistic
              title="Total Bagi Hasil (Net)"
              value={formatRupiah(dashboardData?.total_yield)}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a', fontWeight: 600 }}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Akumulasi keuntungan bersih diterima.</Text>
          </Card>
        </Col>
      </Row>

      <Card title="Rincian Kepemilikan Aset" style={{ marginTop: 24, borderRadius: 12 }}>
        {dashboardData?.ownership_percentage && dashboardData.ownership_percentage.length > 0 ? (
            dashboardData.ownership_percentage.map((owner, index) => (
               <div key={index} style={{ marginBottom: 20 }}>
                 <Flex justify="space-between" align='center' style={{ marginBottom: 4 }}>
                   <div>
                       <Text strong style={{ fontSize: 15 }}>{owner.name}</Text>
                       <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          Unit: {owner.units}
                       </div>
                   </div>
                   <Tag color="blue" style={{ fontSize: 14, padding: '4px 10px' }}>
                       {owner.percentage ? owner.percentage.toFixed(2) : 0}% Saham
                   </Tag>
                 </Flex>
                 <Progress 
                   percent={owner.percentage || 0} 
                   showInfo={false} 
                   strokeColor={{ from: '#108ee9', to: '#87d068' }} 
                   strokeWidth={8}
                 />
               </div>
            ))
        ) : (
            <Alert message="Anda belum memiliki kepemilikan aset." type="info" showIcon />
        )}
      </Card>
    </div>
  );
};

const ExecutiveDashboard = ({ dashboardData, reportData }) => {
  const labaAmount = reportData?.laba_rugi?.Jumlah || 0;
  const omzetAmount = dashboardData?.total_yield || 0;
  
  const profitMarginPercent = calculateSafePercent(Math.abs(labaAmount), omzetAmount);
  const isProfit = reportData?.laba_rugi?.Status === 'Laba';

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 0 }}>Dashboard Eksekutif</Title>
        <Text type="secondary">Ringkasan performa keseluruhan Lahan Pintar.</Text>
      </div>

      <Row gutter={[24, 24]}>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Statistic 
                 title="Total Aset" 
                 value={dashboardData?.total_assets || 0} 
                 prefix={<ContainerOutlined />} 
              />
            </Card>
         </Col>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Statistic 
                 title="Total Dana Kelolaan" 
                 value={formatRupiah(dashboardData?.total_funding)} 
                 prefix={<GiReceiveMoney />} 
                 valueStyle={{ color: '#237804' }}
              />
            </Card>
         </Col>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Statistic 
                 title="Total Pengeluaran" 
                 value={formatRupiah(reportData?.ringkasan_dana?.total_pengeluaran)} 
                 prefix={<GiPayMoney />} 
                 valueStyle={{ color: '#cf1322' }}
              />
            </Card>
         </Col>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
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
            <Card title="Kesehatan Keuangan" bordered={false} style={{ height: '100%' }}>
               <Flex justify='space-between' align='center' style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 16 }}>Laba/Rugi Operasional</Text>
                  <Text strong 
                    style={{ 
                        color: isProfit ? '#52c41a' : '#f5222d',
                        fontSize: 20 
                    }}
                  >
                    {formatRupiah(labaAmount)}
                  </Text>
               </Flex>
               
               <Progress 
                 percent={profitMarginPercent} 
                 showInfo={false} 
                 status={isProfit ? "active" : "exception"}
                 strokeColor={isProfit ? '#52c41a' : '#f5222d'}
               />
               
               <Divider />
               <Flex justify='space-between' align='center'>
                  <Text>Total Nilai Produksi (Omzet)</Text>
                  <Text strong>{formatRupiah(omzetAmount)}</Text>
               </Flex>
            </Card>
         </Col>
         <Col xs={24} lg={12}>
            <Card title="Top Investor (Kepemilikan)" bordered={false} style={{ height: '100%' }}>
               <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                   {dashboardData?.ownership_percentage?.map((owner, i) => (
                       <div key={i} style={{ marginBottom: 16 }}>
                           <Flex justify="space-between">
                               <Text strong>{owner.name}</Text>
                               <Text>{owner.percentage ? owner.percentage.toFixed(1) : 0}%</Text>
                           </Flex>
                           <Progress 
                              percent={owner.percentage || 0} 
                              size="small" 
                              showInfo={false} 
                              status="active" 
                           />
                       </div>
                   ))}
                   {(!dashboardData?.ownership_percentage || dashboardData.ownership_percentage.length === 0) && (
                       <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>Belum ada data kepemilikan.</Text>
                   )}
               </div>
            </Card>
         </Col>
      </Row>
    </div>
  );
};

function AdminDashboardContent() {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  
  const isOperator = userRole === 'Operator';
  const isInvestor = userRole === 'Investor';

  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isError: isErrorDashboard,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });

  const shouldFetchReport = !isOperator && !isInvestor;
  
  const {
    data: reportData,
    isLoading: isLoadingReport,
  } = useQuery({
    queryKey: ['financialReport'],
    queryFn: getFinancialReport,
    enabled: shouldFetchReport,
  });

  const isLoading = isLoadingDashboard || (shouldFetchReport && isLoadingReport);

  if (isLoading) {
    return (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <Spin size="large" tip="Memuat Dashboard..." />
      </div>
    );
  }
  
  if (isErrorDashboard) {
    return <Alert message="Gagal memuat data dashboard. Mohon refresh." type="error" showIcon />;
  }

  return (
    <div style={{ padding: '0px' }}>
      {isOperator ? (
         <OperatorDashboard dashboardData={dashboardData} user={user} />
      ) : isInvestor ? (
         <InvestorDashboard dashboardData={dashboardData} />
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