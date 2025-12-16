'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button, Card, Typography, Flex, Space, Spin, Alert, Tag,
  Modal, Form, Select, InputNumber, DatePicker, Row, Col, message, Popconfirm
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, CalendarOutlined,
  DeleteOutlined, BankOutlined, ClockCircleOutlined,
  CheckCircleOutlined, DollarOutlined, AppstoreOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getOwnership, updateOwnership, deleteOwnership } from '@/lib/api/ownership';
import { getInvestor } from '@/lib/api/investor';
import { getAsset } from '@/lib/api/asset';
import { getFunding } from '@/lib/api/funding';
import { getFundingSource } from '@/lib/api/funding_source';
import { getInvestors } from '@/lib/api/investor';
import { getAssets } from '@/lib/api/asset';
import { getFundings } from '@/lib/api/funding';
import { HiUserGroup } from 'react-icons/hi';
import { BiSolidBox } from 'react-icons/bi';
import { FaMoneyBillTransfer } from 'react-icons/fa6';
import { MdLocationPin } from 'react-icons/md';
import useAuthStore from '@/lib/store/authStore';

const { Title, Text } = Typography;
const { Option } = Select;

const formatDate = (dateString) => dateString ? moment(dateString).format('DD MMMM YYYY') : '-';
const formatDateShort = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const calculateDaysBetween = (startDate) => {
  if (!startDate) return 0;
  const start = moment(startDate);
  const now = moment();
  return now.diff(start, 'days');
};

const getStatusColor = (percentage) => {
  if (percentage >= 50) return '#10b981';
  if (percentage >= 25) return '#f59e0b';
  return '#ef4444';
};

const StatCard = ({ icon, label, value, color, suffix }) => (
  <Card style={{ height: '100%', borderRadius: '12px' }}>
    <Flex align="center" gap={12}>
      <div style={{
        width: 56, height: 56, borderRadius: '12px',
        backgroundColor: `${color}15`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text type="secondary" style={{ fontSize: 14, display: 'block' }}>{label}</Text>
        <Title level={4} style={{ margin: 0, fontSize: 24, wordBreak: 'break-word' }}>
          {value}{suffix}
        </Title>
      </div>
    </Flex>
  </Card>
);

const TimelineItem = ({ title, date, description, color, isLast }) => (
  <div style={{ display: 'flex', gap: 16 }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color }} />
      {!isLast && <div style={{ width: 2, flex: 1, backgroundColor: '#d1d5db', marginTop: 4 }} />}
    </div>
    <div style={{ paddingBottom: isLast ? 0 : 24, flex: 1 }}>
      <Text strong style={{ display: 'block', fontSize: 16, marginBottom: 4 }}>{title}</Text>
      <Text type="secondary" style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>{date}</Text>
      <Text style={{ fontSize: 14, color: '#6b7280' }}>{description}</Text>
    </div>
  </div>
);

function OwnershipDetailContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const ownershipId = params.id;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form] = Form.useForm();

  // [RBAC] Logic Hak Akses
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  const { data: ownershipData, isLoading: loadingOwnership } = useQuery({
    queryKey: ['ownership', ownershipId],
    queryFn: () => getOwnership(ownershipId),
    enabled: !!ownershipId
  });

  const { data: investorData } = useQuery({
    queryKey: ['investor', ownershipData?.investor],
    queryFn: () => getInvestor(ownershipData.investor),
    enabled: !!ownershipData?.investor
  });

  const { data: assetData } = useQuery({
    queryKey: ['asset', ownershipData?.asset],
    queryFn: () => getAsset(ownershipData.asset),
    enabled: !!ownershipData?.asset
  });

  const { data: fundingData } = useQuery({
    queryKey: ['funding', ownershipData?.funding],
    queryFn: () => getFunding(ownershipData.funding),
    enabled: !!ownershipData?.funding
  });

  const { data: fundingSourceData } = useQuery({
    queryKey: ['fundingSource', fundingData?.source],
    queryFn: () => getFundingSource(fundingData.source),
    enabled: !!fundingData?.source
  });

  const { data: allInvestors } = useQuery({ queryKey: ['investors'], queryFn: getInvestors });
  const { data: allAssets } = useQuery({ queryKey: ['assets'], queryFn: getAssets });
  const { data: allFundings } = useQuery({ queryKey: ['fundings'], queryFn: getFundings });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateOwnership(id, data),
    onSuccess: () => {
      message.success('Kepemilikan berhasil diperbarui');
      queryClient.invalidateQueries(['ownership', ownershipId]);
      setIsEditModalOpen(false);
      form.resetFields();
    },
    onError: (err) => message.error(`Error: ${err.message}`)
  });

  // [PERBAIKAN] Tambahkan Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteOwnership,
    onSuccess: () => {
      message.success('Data kepemilikan berhasil dihapus');
      queryClient.invalidateQueries(['ownerships']); // Refresh list
      router.push('/admin/kepemilikan'); // Redirect ke list
    },
    onError: (err) => message.error(`Gagal menghapus: ${err.message}`)
  });

  const showEditModal = () => {
    if (ownershipData) {
      form.setFieldsValue({
        investor: ownershipData.investor,
        asset: ownershipData.asset,
        funding: ownershipData.funding,
        units: ownershipData.units,
        investment_date: moment(ownershipData.investment_date)
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = (values) => {
    const data = {
      investor: values.investor,
      asset: values.asset || null, // [PERBAIKAN] Kirim null jika kosong
      funding: values.funding,
      units: values.units,
      investment_date: values.investment_date.format('YYYY-MM-DD')
    };
    updateMutation.mutate({ id: ownershipId, data });
  };

  if (loadingOwnership) {
    return <div style={{ padding: 24, textAlign: 'center', minHeight: 400 }}><Spin size="large" /></div>;
  }

  if (!ownershipData) {
    return <div style={{ padding: 24 }}><Alert message="Data tidak ditemukan" type="error" showIcon /></div>;
  }

  const joinDurationDays = calculateDaysBetween(ownershipData.investment_date);
  const ownershipProgress = ownershipData.ownership_percentage || 0;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
        <Space direction="vertical" size={0}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ padding: 0, marginBottom: 8, color: '#237804', fontWeight: 500 }}>
            Kembali
          </Button>
          <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: 30 }}>Detail Kepemilikan</Title>
          <Text type="secondary" style={{ fontSize: 14 }}>Informasi lengkap tentang kepemilikan investasi</Text>
        </Space>
        
        {/* [RBAC] Tombol Edit & Hapus */}
        {canEdit && (
          <Space>
            {/* Tombol Hapus */}
            <Popconfirm
                title="Hapus Data Kepemilikan?"
                description="Tindakan ini tidak dapat dibatalkan."
                onConfirm={() => deleteMutation.mutate(ownershipId)}
                okText="Ya, Hapus"
                cancelText="Batal"
                okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            >
                <Button 
                    danger 
                    size="large" 
                    icon={<DeleteOutlined />} 
                    style={{ borderRadius: 8 }}
                >
                    Hapus
                </Button>
            </Popconfirm>

            {/* Tombol Edit */}
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="large"
              onClick={showEditModal}
              style={{ backgroundColor: '#237804', borderColor: '#237804', borderRadius: 8 }}
            >
              Edit Data
            </Button>
          </Space>
        )}
      </Flex>

      {/* --- KONTEN DETAIL SAMA SEPERTI SEBELUMNYA --- */}
      <Card title={<Flex align="center" gap={8}><HiUserGroup style={{ fontSize: 24, color: '#3b82f6' }} /><Text strong style={{ fontSize: 18 }}>Informasi Investor</Text></Flex>} style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Nama Investor</Text><Text strong style={{ fontSize: 18 }}>{investorData?.username || ownershipData.investor_name || '-'}</Text></div>
            <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Email</Text><Text style={{ fontSize: 16 }}>{investorData?.email || '-'}</Text></div>
            <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Nomor Telepon</Text><Text style={{ fontSize: 16 }}>{investorData?.phone_number || '-'}</Text></div>
            <div><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>ID Investor</Text><Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>#{ownershipData.investor}</Tag></div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Tanggal Bergabung</Text><Flex align="center" gap={8}><CalendarOutlined style={{ color: '#3b82f6' }} /><Text style={{ fontSize: 16 }}>{formatDate(ownershipData.investment_date)}</Text></Flex></div>
            <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Durasi Investasi</Text><Flex align="center" gap={8}><ClockCircleOutlined style={{ color: '#10b981' }} /><Text style={{ fontSize: 16 }}>{joinDurationDays} hari ({Math.floor(joinDurationDays / 30)} bulan)</Text></Flex></div>
            <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>ID Kepemilikan</Text><Tag color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>#{ownershipData.id}</Tag></div>
            <div><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Status</Text><Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>Aktif</Tag></div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}><StatCard icon={<BiSolidBox style={{ fontSize: 24, color: '#9333ea' }} />} label="Total Unit" value={ownershipData.units?.toLocaleString('id-ID') || '0'} /></Col>
        <Col xs={24} sm={12} lg={8}><StatCard icon={<FaMoneyBillTransfer style={{ fontSize: 24, color: '#10b981' }} />} label="Total Investasi" value={formatRupiah(ownershipData.total_investment)} /></Col>
        <Col xs={24} sm={12} lg={8}><StatCard icon={<DollarOutlined style={{ fontSize: 24, color: '#f59e0b' }} />} label="Nilai per Unit" value={formatRupiah(ownershipData.total_investment / (ownershipData.units || 1))} /></Col>
      </Row>

      <Card title={<Flex align="center" gap={8}><AppstoreOutlined style={{ fontSize: 24, color: '#9333ea' }} /><Text strong style={{ fontSize: 18 }}>Informasi Aset</Text></Flex>} style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Nama Aset</Text><Text strong style={{ fontSize: 18 }}>{assetData?.name || ownershipData.asset_name || '-'}</Text></div>
            <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Tipe Aset</Text><Tag color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>{assetData?.asset_type || 'Properti'}</Tag></div>
            <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Lokasi Aset</Text><Flex align="start" gap={8}><MdLocationPin style={{ fontSize: 16, color: '#9333ea', marginTop: 4 }} /><Text style={{ fontSize: 16 }}>{assetData?.location || '-'}</Text></Flex></div>
            <div><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>ID Aset</Text><Tag color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>#{ownershipData.asset}</Tag></div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 16 }}>
              <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>Progress Kepemilikan</Text>
              <div style={{ marginBottom: 8 }}><Text strong style={{ fontSize: 16 }}>{ownershipProgress.toFixed(1)}%</Text></div>
              <div style={{ width: '100%', height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${ownershipProgress}%`, height: '100%', backgroundColor: getStatusColor(ownershipProgress), transition: 'width 0.3s ease' }} /></div>
              <div style={{ marginTop: 8 }}><Text type="secondary" style={{ fontSize: 12 }}>{ownershipData.units || 0} unit</Text></div>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={<Flex align="center" gap={8}><BankOutlined style={{ fontSize: 24, color: '#10b981' }} /><Text strong style={{ fontSize: 18 }}>Informasi Pendanaan</Text></Flex>} style={{ height: '100%', borderRadius: 12 }}>
            <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Sumber Dana</Text><Text strong style={{ fontSize: 16 }}>{fundingSourceData?.name || '-'}</Text></div>
            <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Total Pendanaan</Text><Text strong style={{ fontSize: 18, color: '#10b981' }}>{formatRupiah(fundingData?.amount)}</Text></div>
            <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Tanggal Pendanaan</Text><Flex align="center" gap={8}><CalendarOutlined style={{ color: '#3b82f6' }} /><Text style={{ fontSize: 16 }}>{formatDate(fundingData?.date_received)}</Text></Flex></div>
            <div style={{ marginBottom: 16 }}><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>ID Pendanaan</Text><Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>#{ownershipData.funding}</Tag></div>
            <div><Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>Rasio Investment</Text><div style={{ width: '100%', height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${fundingData?.amount ? (ownershipData.total_investment / fundingData.amount * 100) : 0}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s ease' }} /></div><Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>{fundingData?.amount ? ((ownershipData.total_investment / fundingData.amount * 100).toFixed(1)) : 0}%</Text></div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<Flex align="center" gap={8}><ClockCircleOutlined style={{ fontSize: 24, color: '#3b82f6' }} /><Text strong style={{ fontSize: 18 }}>Timeline Investasi</Text></Flex>} style={{ height: '100%', borderRadius: 12 }}>
            <TimelineItem title="Pendanaan Diterima" date={formatDate(fundingData?.date_received)} description={formatRupiah(fundingData?.amount)} color="#10b981" />
            <TimelineItem title="Investasi Dimulai" date={formatDate(ownershipData.investment_date)} description={`${ownershipData.units || 0} unit dibeli`} color="#3b82f6" />
            <TimelineItem title="Status Saat Ini" date="Aktif" description={`Durasi: ${Math.floor(joinDurationDays / 30)} bulan`} color="#f59e0b" isLast />
          </Card>
        </Col>
      </Row>

      {/* Modal Edit */}
      <Modal title="Edit Kepemilikan" open={isEditModalOpen} onCancel={() => setIsEditModalOpen(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleEditSubmit} style={{ marginTop: 24 }}>
          <Form.Item name="investor" label="Investor" rules={[{ required: true, message: 'Investor harus dipilih!' }]}><Select placeholder="Pilih investor" showSearch size="large">{allInvestors?.map(inv => (<Option key={inv.id} value={inv.id}>{inv.username || `Investor ${inv.id}`}</Option>))}</Select></Form.Item>
          {/* [PERBAIKAN] Field Aset jadi Opsional */}
          <Form.Item name="asset" label="Aset (Opsional)"><Select placeholder="Pilih aset (Kosongkan untuk Dana Mengendap)" showSearch size="large" allowClear>{allAssets?.map(a => (<Option key={a.id} value={a.id}>{a.name}</Option>))}</Select></Form.Item>
          <Form.Item name="funding" label="Pendanaan Terkait" rules={[{ required: true, message: 'Pendanaan harus dipilih!' }]}><Select placeholder="Pilih pendanaan" showSearch size="large">{allFundings?.map(f => (<Option key={f.id} value={f.id}>{formatRupiah(f.amount)} - {formatDateShort(f.date_received)}</Option>))}</Select></Form.Item>
          <Form.Item name="units" label="Jumlah Unit" rules={[{ required: true, message: 'Unit tidak boleh kosong!' }]}><InputNumber style={{ width: '100%' }} min={1} placeholder="Masukkan jumlah unit" size="large" /></Form.Item>
          <Form.Item name="investment_date" label="Tanggal Investasi" rules={[{ required: true, message: 'Tanggal harus dipilih!' }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" /></Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: 32, marginBottom: 0 }}><Space><Button onClick={() => setIsEditModalOpen(false)} size="large">Batal</Button><Button type="primary" htmlType="submit" loading={updateMutation.isPending} style={{ backgroundColor: '#237804', borderColor: '#237804' }} size="large">Simpan Perubahan</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default function OwnershipDetailPage() {
  return (
    <ProtectedRoute>
      <OwnershipDetailContent />
    </ProtectedRoute>
  );
}