'use client';
import React, { useState, useMemo } from 'react';
import {
  Row, Col, Card, Tabs, Typography, Divider, Tag, Spin, Alert, Table, Button, Popconfirm, message, Space
} from 'antd';
import { DollarCircleFilled, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getProfitDistributions, updateProfitDistribution, deleteProfitDistribution } from '@/lib/api/profit_distribution';
import useAuthStore from '@/lib/store/authStore';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// --- Helper Formatting ---
const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : 'Rp 0';

const formatShortDate = (dateString) =>
  dateString ? moment(dateString).format('DD MMM YYYY') : '-';

function ProfitDistributionContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('list');

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  // --- DATA FETCHING (Hanya ambil Rekap Global) ---
  const { data: distributions = [], isLoading, isError } = useQuery({
    queryKey: ['profitDistributions'],
    queryFn: getProfitDistributions,
  });

  // --- MUTATIONS ---
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateProfitDistribution(id, { status }),
    onSuccess: () => {
      message.success('Status distribusi berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['profitDistributions'] });
    },
    onError: (err) => message.error(`Gagal update status: ${err.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfitDistribution,
    onSuccess: () => {
      message.success('Data distribusi berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['profitDistributions'] });
    },
    onError: (err) => message.error(`Gagal menghapus data: ${err.message}`)
  });

  // --- STATISTIK ---
  const totalDistribusi = useMemo(() => {
    return distributions.reduce((sum, d) => sum + Number(d.investor_share || d.total_distributed || 0), 0);
  }, [distributions]);

  // --- TABLE COLUMNS ---
  const columns = [
    { 
      title: 'Tanggal Catat', 
      dataIndex: 'created_at', 
      key: 'created_at', 
      render: formatShortDate 
    },
    { 
      title: 'Periode', 
      dataIndex: 'period', 
      key: 'period', 
      render: (t) => <b>{t || '-'}</b> 
    },
    { 
      title: 'Laba Bersih (Net)', 
      dataIndex: 'net_profit', 
      key: 'net_profit', 
      render: (v) => formatRupiah(v) 
    },
    { 
      title: 'Jatah Investor (Total)', 
      dataIndex: 'investor_share', 
      key: 'investor_share', 
      render: (v) => <span style={{color: '#237804', fontWeight: 'bold'}}>{formatRupiah(v)}</span> 
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status) => (
        status === 'Distributed' 
          ? <Tag color="green">Selesai Dibagikan</Tag> 
          : <Tag color="orange">Menunggu Transfer</Tag>
      )
    },
    {
      title: 'Aksi',
      key: 'aksi',
      render: (_, record) => canEdit && (
        <Space>
          {record.status !== 'Distributed' && (
            <Popconfirm title="Tandai Selesai?" onConfirm={() => updateStatusMutation.mutate({ id: record.id, status: 'Distributed' })} okText="Ya" cancelText="Batal">
              <Button type="text" icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
            </Popconfirm>
          )}
          <Popconfirm title="Hapus Data?" onConfirm={() => deleteMutation.mutate(record.id)} okText="Hapus" cancelText="Batal" okButtonProps={{ danger: true }}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (isLoading) return <Spin size="large" tip="Memuat data..." style={{ width: '100%', padding: 80 }} />;
  if (isError) return <Alert message="Gagal memuat data bagi hasil" type="error" showIcon />;

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontWeight: 700, fontSize: '30px', color: '#111928', marginBottom: '8px' }}>
          Bagi Hasil Global
        </Title>
        <Text type="secondary">Rekapitulasi pembagian keuntungan (dividen) dari kas pusat.</Text>
      </div>

      {/* STATISTICS CARD */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12}>
          <Card
            bordered
            style={{
              width: '100%', borderRadius: 12, border: '1px solid #F0F0F0',
              background: '#FFFFFF', boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: '#F6FFED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DollarCircleFilled style={{ color: '#7CB305', fontSize: 30 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: '#6B7280', marginBottom: 4 }}>Total Telah Dibagikan</div>
                <div style={{ fontWeight: 700, fontSize: 30, color: '#111928' }}>
                  {formatRupiah(totalDistribusi)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* MAIN TABLE */}
      <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Riwayat Distribusi" key="list">
            <Table
              dataSource={distributions}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: "Belum ada riwayat pembagian hasil." }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default function ProfitDistributionPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Viewer']}>
      <ProfitDistributionContent />
    </ProtectedRoute>
  );
}