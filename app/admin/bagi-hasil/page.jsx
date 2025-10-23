// Di app/admin/bagi-hasil/page.jsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, Button, Modal, Typography, Flex, Space, Popconfirm, message,
  Spin, Alert, Card, Tag, Descriptions // Descriptions untuk detail
} from 'antd';
// Impor ikon react-icons yang sesuai
import { AiFillDollarCircle } from 'react-icons/ai';
// Impor ikon Ant Design standar
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
// Impor API terkait
import {
  getProfitDistributions, deleteProfitDistribution,
} from '@/lib/api/profit_distribution'; //
import { getDistributionDetails } from '@/lib/api/distribution_detail'; //
import { getProductions } from '@/lib/api/production'; // Untuk info produksi terkait
import { getAssets } from '@/lib/api/asset';         // Untuk nama aset
import { getInvestors } from '@/lib/api/investor';   // Untuk nama investor

const { Title, Text } = Typography;

// Helper format
const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY HH:mm') : '-'; // Tambah waktu
const formatShortDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => value != null ? `Rp ${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Rp 0,00';
const formatPercent = (value) => value != null ? `${Number(value).toFixed(2)}%` : '0.00%';

// Komponen Utama Halaman Bagi Hasil
function ProfitDistributionContent() {
  const queryClient = useQueryClient();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState(null); // Untuk detail modal

  // --- Fetch Data ---
  // Data Utama: Profit Distributions
  const { data: distributions, isLoading: isLoadingDistributions, isError: isErrorDistributions, error: errorDistributions } = useQuery({
    queryKey: ['profitDistributions'],
    queryFn: getProfitDistributions,
  });
  // Data Detail (akan di-fetch saat modal dibuka, atau fetch semua di awal jika datanya tidak terlalu banyak)
  // Opsi 1: Fetch all details initially (jika data < ~1000 records)
  const { data: allDetails, isLoading: isLoadingAllDetails } = useQuery({
      queryKey: ['distributionDetails'],
      queryFn: getDistributionDetails,
      enabled: !!distributions, // Hanya fetch jika distributions sudah ada
  });
  // Data Relasi untuk Mapping Nama
  const { data: productions, isLoading: isLoadingProductions } = useQuery({ queryKey: ['productions'], queryFn: getProductions });
  const { data: assets, isLoading: isLoadingAssets } = useQuery({ queryKey: ['assets'], queryFn: getAssets });
  const { data: investors, isLoading: isLoadingInvestors } = useQuery({ queryKey: ['investors'], queryFn: getInvestors });


  // --- Data Mapping ---
  const assetMap = useMemo(() => assets ? assets.reduce((acc, a) => { acc[a.id] = a.name; return acc; }, {}) : {}, [assets]);
  const investorMap = useMemo(() => {
     if (!investors) return {};
     return investors.reduce((acc, inv) => { acc[inv.id] = inv.username || `Investor ${inv.id}`; return acc; }, {});
  }, [investors]);
  // Map ID Produksi ke detail produksi (misal nama aset & tanggal produksi)
  const productionMap = useMemo(() => {
      if (!productions || !assetMap) return {};
      return productions.reduce((acc, p) => {
          acc[p.id] = {
              assetName: assetMap[p.asset] || `Aset ID ${p.asset}`,
              productionDate: p.date,
              quantity: p.quantity,
              unit: p.unit,
              totalValue: p.total_value,
          };
          return acc;
      }, {});
  }, [productions, assetMap]);
  // Kelompokkan Detail berdasarkan ID Distribusi
   const detailsByDistributionId = useMemo(() => {
    if (!allDetails) return {};
    return allDetails.reduce((acc, detail) => {
      const distId = detail.distribution; // ID ProfitDistribution
      if (!acc[distId]) {
        acc[distId] = [];
      }
      acc[distId].push(detail);
      return acc;
    }, {});
  }, [allDetails]);


  // --- Mutasi (Hanya Hapus) ---
  const deleteMutation = useMutation({
    mutationFn: deleteProfitDistribution,
    onSuccess: () => {
      message.success('Data bagi hasil berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['profitDistributions'] });
      // Mungkin perlu invalidate details juga jika di-fetch terpisah per modal
      queryClient.invalidateQueries({ queryKey: ['distributionDetails'] });
    },
    onError: (err) => { message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`); },
  });

  // --- Handlers ---
  const showDetailModal = (distribution) => {
    setSelectedDistribution(distribution);
    setIsDetailModalOpen(true);
  };
  const handleDetailCancel = () => { setIsDetailModalOpen(false); setSelectedDistribution(null); };
  const handleDelete = (id) => { deleteMutation.mutate(id); };

  // --- Kolom Tabel Utama (ProfitDistribution) ---
  const columns = [
    { title: 'Periode/ID', dataIndex: 'period', key: 'period', sorter: (a, b) => a.period.localeCompare(b.period), width: 150 },
    {
        title: 'Produksi Terkait', dataIndex: 'production', key: 'production',
        render: (prodId) => productionMap[prodId]?.assetName ? `${productionMap[prodId].assetName} (${formatShortDate(productionMap[prodId].productionDate)})` : `Produksi ID ${prodId}`,
        sorter: (a, b) => (productionMap[a.production]?.assetName || '').localeCompare(productionMap[b.production]?.assetName || ''),
    },
    { title: 'Profit Bersih', dataIndex: 'net_profit', key: 'net_profit', render: formatRupiah, sorter: (a, b) => parseFloat(a.net_profit) - parseFloat(b.net_profit), align: 'right' },
    { title: 'Bagian Pemilik Lahan', dataIndex: 'landowner_share', key: 'landowner_share', render: formatRupiah, sorter: (a, b) => parseFloat(a.landowner_share) - parseFloat(b.landowner_share), align: 'right' },
    { title: 'Total Bagian Investor', dataIndex: 'investor_share', key: 'investor_share', render: formatRupiah, sorter: (a, b) => parseFloat(a.investor_share) - parseFloat(b.investor_share), align: 'right' },
    { title: 'Tanggal Dibuat', dataIndex: 'created_at', key: 'created_at', render: formatDate, sorter: (a, b) => moment(a.created_at).unix() - moment(b.created_at).unix() },
    {
      title: 'Aksi', key: 'action', width: 120, align: 'center', fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => showDetailModal(record)}>Detail</Button>
          <Popconfirm title="Hapus Data Bagi Hasil?" description="Ini akan menghapus data induk & detailnya." onConfirm={() => handleDelete(record.id)} okText="Ya" cancelText="Tidak" okButtonProps={{ danger: true, loading: deleteMutation.isPending }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Kolom Tabel Detail (DistributionDetail) di Modal
  const detailColumns = [
      { title: 'Investor', dataIndex: 'investor', key: 'investor', render: (id) => investorMap[id] || `ID ${id}` },
      { title: 'Persentase', dataIndex: 'ownership_percentage', key: 'ownership_percentage', render: formatPercent, align: 'right' },
      { title: 'Jumlah Diterima', dataIndex: 'amount_received', key: 'amount_received', render: formatRupiah, align: 'right' },
  ];

  const isLoadingInitialData = isLoadingDistributions || isLoadingProductions || isLoadingAssets || isLoadingInvestors || isLoadingAllDetails; // Include details loading
  const isErrorInitialData = isErrorDistributions || !productions || !assets || !investors || !allDetails; // Include details error check


  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}>
              <AiFillDollarCircle style={{ marginRight: '8px', verticalAlign: 'middle', fontSize: '24px' }}/> Manajemen Bagi Hasil
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>Lihat rekam jejak pembagian keuntungan.</Text>
        </div>
        {/* Tidak ada tombol Tambah karena dibuat otomatis */}
      </Flex>

      {/* Filter bisa ditambahkan di sini jika perlu (misal filter by Aset, Periode) */}
      {/* <Card style={{ marginBottom: 24 }}> ... Filter components ... </Card> */}

      {isLoadingInitialData && <Spin size="large"><div style={{ padding: 50 }} /></Spin>}
      {isErrorInitialData && !isLoadingInitialData && <Alert message="Error Memuat Data Awal" description={errorDistributions?.message || 'Gagal memuat data relasi'} type="error" showIcon />}

      {!isLoadingInitialData && !isErrorInitialData && (
         <Card bodyStyle={{ padding: 0 }}>
            <Table
                columns={columns}
                dataSource={Array.isArray(distributions) ? distributions : []} // Tampilkan semua distribution
                rowKey="id"
                loading={isLoadingDistributions || deleteMutation.isPending}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: 1200 }}
            />
         </Card>
      )}

      {/* Modal Detail Bagi Hasil per Investor */}
      <Modal
        title={`Detail Bagi Hasil - Periode ${selectedDistribution?.period || ''}`}
        open={isDetailModalOpen}
        onCancel={handleDetailCancel}
        footer={[ <Button key="back" onClick={handleDetailCancel}>Tutup</Button> ]}
        width={800} // Buat modal lebih lebar
        destroyOnHidden
      >
        {selectedDistribution && (
            <Spin spinning={isLoadingAllDetails || isLoadingInvestors}>
                <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="Produksi Terkait">{productionMap[selectedDistribution.production]?.assetName || `ID ${selectedDistribution.production}`}</Descriptions.Item>
                    <Descriptions.Item label="Tgl Produksi">{formatShortDate(productionMap[selectedDistribution.production]?.productionDate)}</Descriptions.Item>
                    <Descriptions.Item label="Nilai Produksi">{formatRupiah(productionMap[selectedDistribution.production]?.totalValue)}</Descriptions.Item>
                    <Descriptions.Item label="Profit Bersih">{formatRupiah(selectedDistribution.net_profit)}</Descriptions.Item>
                    <Descriptions.Item label="Bagian Pemilik Lahan">{formatRupiah(selectedDistribution.landowner_share)}</Descriptions.Item>
                    <Descriptions.Item label="Total Bagian Investor">{formatRupiah(selectedDistribution.investor_share)}</Descriptions.Item>
                    <Descriptions.Item label="Tanggal Kalkulasi">{formatDate(selectedDistribution.created_at)}</Descriptions.Item>
                </Descriptions>

                <Title level={5}>Rincian Pembagian Investor</Title>
                 <Table
                    columns={detailColumns}
                    // Ambil detail yang sesuai dari map `detailsByDistributionId`
                    dataSource={detailsByDistributionId[selectedDistribution.id] || []}
                    rowKey="id"
                    pagination={false} // Tidak perlu pagination di modal
                    size="small"
                 />
            </Spin>
        )}
      </Modal>
    </>
  );
}

export default function ProfitDistributionPage() {
  return (
    <ProtectedRoute>
      <ProfitDistributionContent />
    </ProtectedRoute>
  );
}