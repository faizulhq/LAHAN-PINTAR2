// Di app/admin/laporan/page.jsx
'use client';

import React from 'react';
import {
  Card, Typography, Spin, Alert, Row, Col, Statistic, Divider, Tag, Space, Flex
} from 'antd';
// Ganti ikon sesuai menu Laporan (misal AiOutlineAreaChart atau FundProjectionScreenOutlined)
import { AiOutlineAreaChart } from 'react-icons/ai'; // Atau FundProjectionScreenOutlined dari antd
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getFinancialReport } from '@/lib/api/reporting'; //
import {
    ArrowUpOutlined, ArrowDownOutlined, DollarCircleOutlined, WalletOutlined,
    RiseOutlined, FallOutlined, MinusOutlined
} from '@ant-design/icons'; // Ikon untuk statistik

const { Title, Text } = Typography;

// Helper format Rupiah
const formatRupiah = (value) => value != null ? `Rp ${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'Rp 0';

// Komponen Utama Halaman Laporan
function ReportingContent() {
  // Fetch data laporan keuangan
  const { data: reportData, isLoading, isError, error } = useQuery({
    queryKey: ['financialReport'],
    queryFn: getFinancialReport, //
  });

  // Data dari API
  const ringkasanDana = reportData?.ringkasan_dana;
  const totalYield = reportData?.total_yield;
  const labaRugi = reportData?.laba_rugi;

  // Menentukan ikon & warna Laba/Rugi
  const labaRugiStatus = labaRugi?.Status;
  const LabaRugiIcon =
    labaRugiStatus === 'Laba' ? RiseOutlined : labaRugiStatus === 'Rugi' ? FallOutlined : MinusOutlined;
  const labaRugiColor =
    labaRugiStatus === 'Laba' ? '#52c41a' : labaRugiStatus === 'Rugi' ? '#f5222d' : '#8c8c8c';
  const labaRugiTagColor =
    labaRugiStatus === 'Laba' ? 'success' : labaRugiStatus === 'Rugi' ? 'error' : 'default';

  return (
    <>
      {/* Header Halaman */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}>
              <AiOutlineAreaChart style={{ marginRight: '8px', verticalAlign: 'middle', fontSize: '24px' }}/> Laporan Keuangan
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>Ringkasan kondisi finansial Lahan Pintar.</Text>
        </div>
        {/* Tidak ada tombol Tambah/Edit di halaman laporan */}
      </Flex>

      {/* Tampilan Loading atau Error */}
      {isLoading && <Spin size="large"><div style={{ padding: 50 }} /></Spin>}
      {isError && !isLoading && <Alert message="Error Memuat Laporan" description={error?.message || 'Gagal mengambil data laporan keuangan'} type="error" showIcon />}

      {/* Tampilan Data Laporan */}
      {!isLoading && !isError && reportData && (
        <Row gutter={[24, 24]}>
          {/* Kolom Kiri: Ringkasan Dana */}
          <Col xs={24} lg={12}>
            <Card title="Ringkasan Dana">
               <Space direction="vertical" size="large" style={{ width: '100%' }}>
                   <Statistic
                     title="Total Dana Masuk (Pendanaan)"
                     value={formatRupiah(ringkasanDana?.total_dana_masuk)}
                     prefix={<ArrowUpOutlined style={{ color: '#3f8600' }} />}
                   />
                   <Statistic
                     title="Total Pengeluaran"
                     value={formatRupiah(ringkasanDana?.total_pengeluaran)}
                     prefix={<ArrowDownOutlined style={{ color: '#cf1322' }} />}
                     valueStyle={{ color: '#cf1322' }}
                   />
                   <Divider style={{ margin: '8px 0' }}/>
                   <Statistic
                     title="Sisa Dana Tersedia"
                     value={formatRupiah(ringkasanDana?.sisa_dana)}
                     prefix={<WalletOutlined />}
                     valueStyle={{ color: '#28a745' }}
                   />
               </Space>
            </Card>
          </Col>

          {/* Kolom Kanan: Hasil & Laba/Rugi */}
          <Col xs={24} lg={12}>
            <Card title="Hasil Usaha">
               <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Statistic
                     title="Total Hasil Produksi (Yield)"
                     value={formatRupiah(totalYield)}
                     prefix={<DollarCircleOutlined />}
                     valueStyle={{ color: '#faad14' }} // Warna kuning
                   />
                   <Divider style={{ margin: '8px 0' }}/>
                    <Statistic
                         title="Laba / Rugi Bersih (Yield - Pengeluaran)"
                         value={formatRupiah(labaRugi?.Jumlah)}
                         prefix={<LabaRugiIcon />}
                         valueStyle={{ color: labaRugiColor }}
                         suffix={<Tag color={labaRugiTagColor}>{labaRugi?.Status || 'Impas'}</Tag>}
                    />
               </Space>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
}

export default function ReportPage() {
  return (
    <ProtectedRoute>
      <ReportingContent />
    </ProtectedRoute>
  );
}