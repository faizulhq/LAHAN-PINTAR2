'use client';

import React from 'react';
import {
  Row, Col, Card, Statistic, Typography,
  Divider, Spin, Alert, Flex, Progress, Tag, Skeleton
} from 'antd';
import {
  ContainerOutlined, DollarCircleOutlined, RiseOutlined, 
  WalletOutlined, ShoppingOutlined, ExperimentOutlined,
  ArrowRightOutlined, ShopOutlined, BarChartOutlined
} from '@ant-design/icons';
import { GiReceiveMoney, GiPayMoney } from 'react-icons/gi';
import { useQuery } from '@tanstack/react-query';
// Import Recharts untuk Grafik
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { getDashboardData } from '@/lib/api/dashboard';
// import { getFinancialReport } from '@/lib/api/reporting'; // <-- HAPUS INI KARENA SUDAH DIHAPUS
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

// --- OPERATOR DASHBOARD ---
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
             <Statistic title="Aset Dikelola" value={dashboardData?.total_assets || 0} prefix={<ContainerOutlined />} />
           </Card>
        </Col>
        <Col xs={24} sm={12}>
           <Card hoverable className="border-l-4" style={{ borderLeft: '4px solid #52c41a' }}>
             <Statistic title="Nilai Produksi Tercatat" value={formatRupiah(dashboardData?.total_yield)} prefix={<RiseOutlined />} valueStyle={{ color: '#237804' }}/>
           </Card>
        </Col>
      </Row>
      <Title level={4}>Aksi Cepat</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable style={{ background: '#f6ffed', borderColor: '#b7eb8f' }} onClick={() => router.push('/admin/pengeluaran')}>
            <Flex align="center" gap={16}>
              <ShoppingOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div><Title level={5} style={{ margin: 0 }}>Input Pengeluaran</Title><Text type="secondary" style={{ fontSize: 12 }}>Beli pakan, pupuk, dll</Text></div>
              <ArrowRightOutlined style={{ marginLeft: 'auto', color: '#52c41a' }} />
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable style={{ background: '#e6f7ff', borderColor: '#91d5ff' }} onClick={() => router.push('/admin/produksi')}>
            <Flex align="center" gap={16}>
              <ExperimentOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div><Title level={5} style={{ margin: 0 }}>Input Produksi</Title><Text type="secondary" style={{ fontSize: 12 }}>Catat hasil panen</Text></div>
              <ArrowRightOutlined style={{ marginLeft: 'auto', color: '#1890ff' }} />
            </Flex>
          </Card>
        </Col>
        {/* HAPUS/GANTI LINK PROYEK JIKA SUDAH DIHAPUS, ATAU GANTI KE ASET */}
        <Col xs={24} sm={12} md={8}>
          <Card hoverable style={{ background: '#fff7e6', borderColor: '#ffd591' }} onClick={() => router.push('/admin/asset')}>
            <Flex align="center" gap={16}>
              <ShopOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              <div><Title level={5} style={{ margin: 0 }}>Lihat Aset</Title><Text type="secondary" style={{ fontSize: 12 }}>Cek status lahan</Text></div>
              <ArrowRightOutlined style={{ marginLeft: 'auto', color: '#fa8c16' }} />
            </Flex>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// --- INVESTOR DASHBOARD ---
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
            <Statistic title="Total Modal Disetor" value={formatRupiah(dashboardData?.total_funding)} prefix={<DollarCircleOutlined />} valueStyle={{ color: '#1890ff', fontWeight: 600 }} />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Total dana investasi yang aktif.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable style={{ height: '100%', borderRadius: 12 }}>
            <Statistic title="Aset Dimiliki" value={dashboardData?.total_assets || 0} prefix={<ContainerOutlined />} valueStyle={{ fontWeight: 600 }} />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Jumlah lahan/proyek dalam portofolio.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable style={{ height: '100%', borderRadius: 12 }}>
            <Statistic title="Total Bagi Hasil (Net)" value={formatRupiah(dashboardData?.total_yield)} prefix={<RiseOutlined />} valueStyle={{ color: '#52c41a', fontWeight: 600 }} />
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
                   <div><Text strong style={{ fontSize: 15 }}>{owner.name}</Text><div style={{ fontSize: 12, color: '#8c8c8c' }}>Unit: {owner.units}</div></div>
                   <Tag color="blue" style={{ fontSize: 14, padding: '4px 10px' }}>{owner.percentage ? owner.percentage.toFixed(2) : 0}% Saham</Tag>
                 </Flex>
                 <Progress percent={owner.percentage || 0} showInfo={false} strokeColor={{ from: '#108ee9', to: '#87d068' }} strokeWidth={8}/>
               </div>
            ))
        ) : (
            <Alert message="Data kepemilikan spesifik belum tersedia." type="info" showIcon />
        )}
      </Card>
    </div>
  );
};

// --- EXECUTIVE DASHBOARD (Updated Logic) ---
const ExecutiveDashboard = ({ dashboardData }) => {
  // LOGIKA BARU: Ambil data langsung dari dashboardData (Backend sudah mengirim total_revenue & total_expense)
  const omzetAmount = dashboardData?.total_revenue || 0; // Total Penjualan
  const expenseAmount = dashboardData?.total_expense || 0; // Total Pengeluaran
  const labaAmount = omzetAmount - expenseAmount; // Hitung Laba Bersih
  
  const profitMarginPercent = calculateSafePercent(Math.abs(labaAmount), omzetAmount);
  const isProfit = labaAmount >= 0;

  // Data Visualisasi Grafik
  const financialData = [
    { name: 'Omzet', value: omzetAmount, color: '#1890ff' }, // Biru
    { name: 'Pengeluaran', value: expenseAmount, color: '#ff4d4f' }, // Merah
    { name: 'Laba Bersih', value: labaAmount, color: '#52c41a' }, // Hijau
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 0 }}>Dashboard Eksekutif</Title>
        <Text type="secondary">Ringkasan performa keseluruhan Lahan Pintar (Global State).</Text>
      </div>

      {/* 1. Summary Cards */}
      <Row gutter={[24, 24]}>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Statistic title="Total Aset" value={dashboardData?.total_assets || 0} prefix={<ContainerOutlined />} />
            </Card>
         </Col>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Statistic title="Total Dana Kelolaan" value={formatRupiah(dashboardData?.total_funding)} prefix={<GiReceiveMoney />} valueStyle={{ color: '#237804' }} />
            </Card>
         </Col>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Statistic title="Total Pengeluaran" value={formatRupiah(expenseAmount)} prefix={<GiPayMoney />} valueStyle={{ color: '#cf1322' }} />
            </Card>
         </Col>
         <Col xs={24} sm={12} lg={6}>
            <Card hoverable bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              {/* Cash on Hand diambil langsung dari dashboardData */}
              <Statistic title="Cash on Hand" value={formatRupiah(dashboardData?.total_cash_on_hand)} prefix={<WalletOutlined />} valueStyle={{ color: dashboardData?.total_cash_on_hand < 0 ? '#cf1322' : '#1890ff' }} />
            </Card>
         </Col>
      </Row>

      {/* 2. Charts Section */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
         {/* Kiri: Grafik Arus Kas */}
         <Col xs={24} lg={14}>
            <Card title={<><BarChartOutlined /> Analisis Arus Kas & Profitabilitas</>} bordered={false} style={{ height: '100%' }}>
               <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${value / 1000000}jt`} />
                    <RechartsTooltip 
                        formatter={(value) => formatRupiah(value)} 
                        cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="value" name="Jumlah (Rp)" radius={[4, 4, 0, 0]} barSize={60}>
                      {financialData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
               <Flex justify="center" gap={24} style={{ marginTop: 16 }}>
                  {financialData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, background: d.color, borderRadius: 2 }} />
                      <Text type="secondary">{d.name}: {formatRupiah(d.value)}</Text>
                    </div>
                  ))}
               </Flex>
            </Card>
         </Col>

         {/* Kanan: Profit Margin & Status Saham */}
         <Col xs={24} lg={10}>
            <Flex vertical gap={24} style={{ height: '100%' }}>
                {/* Health Card */}
                <Card title="Kesehatan Keuangan" bordered={false} style={{ flex: 1 }}>
                   <Flex justify='space-between' align='center' style={{ marginBottom: 24 }}>
                      <Text style={{ fontSize: 16 }}>Margin Laba</Text>
                      <Text strong style={{ color: isProfit ? '#52c41a' : '#f5222d', fontSize: 20 }}>
                          {profitMarginPercent.toFixed(1)}%
                      </Text>
                   </Flex>
                   <Progress 
                     percent={profitMarginPercent} 
                     showInfo={false} 
                     status={isProfit ? "active" : "exception"}
                     strokeColor={isProfit ? '#52c41a' : '#f5222d'}
                     strokeWidth={12}
                   />
                   <div style={{ marginTop: 12, textAlign: 'right' }}>
                      <Text type="secondary">{isProfit ? 'Profit ' : 'Rugi '} Operasional: {formatRupiah(labaAmount)}</Text>
                   </div>
                </Card>

                {/* Status Saham Global */}
                <Card title="Status Saham Global" bordered={false} style={{ flex: 2 }}>
                   <div style={{ textAlign: 'center', marginBottom: 20 }}>
                       <Statistic title="Saham Tersedia" value={dashboardData?.shares_available || 0} suffix="Lembar" valueStyle={{ color: '#fa8c16' }} />
                   </div>
                   <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                       {(!dashboardData?.ownership_percentage || dashboardData.ownership_percentage.length === 0) && (
                           <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                               Belum ada data pemegang saham spesifik.
                           </Text>
                       )}
                   </div>
                </Card>
            </Flex>
         </Col>
      </Row>
    </div>
  );
};

// --- MAIN WRAPPER ---
function AdminDashboardContent() {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  
  const isOperator = userRole === 'Operator';
  const isInvestor = userRole === 'Investor';

  const { data: dashboardData, isLoading: isLoadingDashboard, isError: isErrorDashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });

  const isLoading = isLoadingDashboard;

  if (isLoading) {
    return <div style={{ padding: 100, textAlign: 'center' }}><Spin size="large" tip="Memuat Dashboard..." /></div>;
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
         // Hapus prop reportData karena sudah tidak dipakai
         <ExecutiveDashboard dashboardData={dashboardData} />
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