'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Button, Typography, Space, Tag, Flex, Spin, Alert, Descriptions, Row, Col,
  Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { FaBoxesStacked, FaBox, FaArrowTrendUp } from 'react-icons/fa6';
import { BiMoneyWithdraw } from 'react-icons/bi';
import { BsBox2Fill } from 'react-icons/bs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import {
  getProduction, patchProduction, deleteProduction
} from '@/lib/api/production';
import { getAssets } from '@/lib/api/asset';

const { Title, Text } = Typography;
const { Option } = Select;

// =================================================================
// === HELPERS & CONSTANTS ===
// =================================================================
const formatDate = (dateString) => dateString ? moment(dateString).format('D/M/YYYY') : '-';

const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    : 'Rp 0';

const STATUS_MAP = {
  stok: { label: 'Stok', color: '#1E429F', bgColor: '#E1EFFE' },
  terjual: { label: 'Dijual', color: '#057A55', bgColor: '#DEF7EC' },
};

const ASSET_TYPE_MAP = {
  lahan: { label: 'Lahan', color: '#0A529E', bgColor: '#E1EFFE' },
  alat: { label: 'Alat', color: '#90450A', bgColor: '#FEF3C7' },
  bangunan: { label: 'Bangunan', color: '#0A529E', bgColor: '#E1EFFE' },
  ternak: { label: 'Ternak', color: '#057A55', bgColor: '#DEF7EC' },
};

const getStatusProps = (status) => {
  return STATUS_MAP[status] || { label: status, color: '#374151', bgColor: '#F3F4F6' };
};

const getAssetTypeProps = (type) => {
  return ASSET_TYPE_MAP[type] || { label: type, color: '#374151', bgColor: '#F3F4F6' };
};

// =================================================================
// === KOMPONEN INFO CARD (Style dari detail Aset) ===
// =================================================================
const InfoCard = ({ icon, label, value, iconColor }) => (
  <Card 
    style={{
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
    }}
  >
    <Flex align="center" gap={16}>
      <div style={{ color: iconColor, fontSize: '32px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <Text style={{ fontSize: '14px', color: '#6B7280', display: 'block' }}>
          {label}
        </Text>
        <Text style={{ fontSize: '20px', fontWeight: 600, color: '#111928' }}>
          {value}
        </Text>
      </div>
    </Flex>
  </Card>
);

// =================================================================
// === KOMPONEN MODAL EDIT (Diambil dari production/page.jsx) ===
// =================================================================
const ProductionModal = ({ visible, onClose, initialData, form, assets, isLoadingAssets, isAdmin }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(initialData);

  const updateMutation = useMutation({ 
    mutationFn: ({ id, data }) => patchProduction(id, data), 
    onSuccess: (data) => {
      message.success('Produksi berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      queryClient.invalidateQueries({ queryKey: ['production', data.id] });
      queryClient.invalidateQueries({ queryKey: ['productionStats'] });
      onClose();
    },
    onError: (err) => {
      console.error("Error:", err);
      message.error('Gagal menyimpan. Cek konsol untuk detail.');
    },
    onSettled: () => setIsSubmitting(false),
  });

  useEffect(() => {
    if (visible && isEditMode && initialData) {
      form.setFieldsValue({
        ...initialData,
        date: moment(initialData.date, 'YYYY-MM-DD'),
        quantity: parseFloat(initialData.quantity),
        unit_price: parseFloat(initialData.unit_price),
        asset: initialData.asset,
      });
    }
  }, [visible, initialData, form, isEditMode]);

  const onFinish = (values) => {
    setIsSubmitting(true);
    const payload = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
    };
    
    updateMutation.mutate({ id: initialData.id, data: payload });
  };

  return (
    <Modal
      title="Edit Produksi"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
        <Form.Item
          name="name"
          label="Nama Produk/Hasil"
          rules={[{ required: true, message: 'Nama produk wajib diisi' }]}
        >
          <Input placeholder="cth: Telur Ayam Omega 3" />
        </Form.Item>

        <Form.Item
          name="asset"
          label="Aset Terkait"
          rules={[{ required: true, message: 'Aset wajib dipilih' }]}
        >
          <Select
            showSearch
            placeholder="Pilih aset penghasil"
            loading={isLoadingAssets}
            optionFilterProp="children"
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={assets?.map(a => ({ value: a.id, label: `${a.name} (${a.type})` }))}
          />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="quantity"
              label="Kuantitas"
              rules={[{ required: true, message: 'Kuantitas wajib diisi' }]}
            >
              <InputNumber min={0} className="w-full" placeholder="cth: 500" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="unit"
              label="Unit"
              rules={[{ required: true, message: 'Unit wajib diisi' }]}
            >
              <Input placeholder="cth: Kg, Liter, Ekor" />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="unit_price"
              label="Harga per Unit (Rp)"
              rules={[{ required: true, message: 'Harga wajib diisi' }]}
            >
              <InputNumber
                className="w-full"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                min={0}
                placeholder="Masukkan harga jual per unit"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="date"
              label="Tanggal Produksi"
              rules={[{ required: true, message: 'Tanggal harus dipilih!' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY"/>
            </Form.Item>
          </Col>
        </Row>

        {isAdmin && (
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Status wajib dipilih' }]}
          >
            <Select placeholder="Pilih status produksi">
              <Option value="stok">Stok</Option>
              <Option value="terjual">Terjual</Option>
            </Select>
          </Form.Item>
        )}

        <Form.Item style={{ textAlign: 'right', marginTop: 32 }}>
          <Space>
            <Button onClick={onClose}>Batal</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              style={{ backgroundColor: '#237804', borderColor: '#237804' }}
            >
              Simpan Perubahan
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// =================================================================
// === KOMPONEN UTAMA HALAMAN DETAIL ===
// =================================================================
function ProductionDetailContent() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const productionId = params.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState(null);
  const [form] = Form.useForm();

  const user = useAuthStore((state) => state.user);
  const isAdmin = useMemo(() => user?.role === 'Admin' || user?.role === 'Superadmin', [user]);

  const { data: production, isLoading: isLoadingProduction, isError, error } = useQuery({
    queryKey: ['production', productionId],
    queryFn: () => getProduction(productionId),
    enabled: !!productionId,
  });

  const { data: assets, isLoading: isLoadingAssets } = useQuery({ 
    queryKey: ['assets'], 
    queryFn: getAssets 
  });

  const deleteMutation = useMutation({ 
    mutationFn: deleteProduction, 
    onSuccess: () => { 
      message.success('Data produksi berhasil dihapus'); 
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      queryClient.invalidateQueries({ queryKey: ['productionStats'] });
      router.push('/admin/produksi');
    }, 
    onError: (err) => { 
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`); 
    } 
  });

  const handleBack = () => {
    router.push('/admin/produksi');
  };

  const handleEdit = () => {
    if (!production) return;
    setEditingProduction(production);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingProduction(null);
    form.resetFields();
  };

  const handleDelete = () => {
    deleteMutation.mutate(productionId);
  };

  if (isLoadingProduction || isLoadingAssets) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert 
        message="Error Memuat Data" 
        description={error?.message || 'Gagal memuat data produksi'} 
        type="error" 
        showIcon 
      />
    );
  }

  if (!production) {
    return (
      <Alert 
        message="Produksi Tidak Ditemukan" 
        description="Data produksi yang Anda cari tidak tersedia" 
        type="warning" 
        showIcon 
      />
    );
  }

  const statusProps = getStatusProps(production.status);
  const assetTypeProps = getAssetTypeProps(production.asset_type);

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
        <Flex align="center" gap={16}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            style={{ border: '1px solid #E5E7EB', borderRadius: '8px' }}
          />
          <div>
            <Title level={2} style={{ 
              margin: 0, 
              color: '#111928',
              fontWeight: 700,
              fontSize: '30px',
              lineHeight: '125%',
            }}>
              Detail Produksi
            </Title>
            <Text style={{ 
              fontSize: '16px',
              fontWeight: 500,
              color: '#727272',
              lineHeight: '19px', 
            }}>
              Informasi lengkap mengenai hasil produksi
            </Text>
          </div>
        </Flex>
        {isAdmin && (
          <Space>
            <Popconfirm 
              key="delete"
              title="Hapus Produksi?" 
              description="Yakin hapus data ini?" 
              onConfirm={handleDelete}
              okText="Ya, Hapus" 
              cancelText="Batal" 
              okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="large"
                style={{ 
                  borderRadius: '24px', 
                  height: 'auto', 
                  padding: '8px 16px', 
                  fontSize: '16px' 
                }}
              >
                Hapus
              </Button>
            </Popconfirm>
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="large"
              style={{ 
                backgroundColor: '#237804', 
                borderRadius: '24px', 
                height: 'auto', 
                padding: '8px 16px', 
                fontSize: '16px' 
              }}
              onClick={handleEdit}
            >
              Edit Produksi
            </Button>
          </Space>
        )}
      </Flex>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
              marginBottom: 24,
            }}
          >
            <Flex justify="space-between" align="start" style={{ marginBottom: 24 }} wrap='wrap' gap={8}>
              <div>
                <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
                  {production.name}
                </Title>
                <Space wrap>
                  <Tag style={{ 
                    background: assetTypeProps.bgColor, 
                    color: assetTypeProps.color, 
                    border: 'none', fontWeight: 600, fontSize: '14px', 
                    padding: '4px 10px', borderRadius: '6px'
                  }}>
                    {assetTypeProps.label}
                  </Tag>
                  <Tag style={{ 
                    background: statusProps.bgColor, 
                    color: statusProps.color, 
                    border: 'none', fontWeight: 600, fontSize: '14px', 
                    padding: '4px 10px', borderRadius: '6px'
                  }}>
                    {statusProps.label}
                  </Tag>
                </Space>
              </div>
              <Text style={{ 
                fontWeight: 600,
                fontSize: '24px',
                color: '#7CB305',
                flexShrink: 0
              }}>
                {formatRupiah(production.total_value)}
              </Text>
            </Flex>

            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Flex align="center" gap={12}>
                <BsBox2Fill style={{ color: '#0958D9', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>
                    Aset Penghasil
                  </Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>
                    {production.asset_name}
                  </Text>
                </div>
              </Flex>
              <Flex align="center" gap={12}>
                <CalendarOutlined style={{ color: '#531DAB', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>
                    Tanggal Produksi
                  </Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>
                    {formatDate(production.date)}
                  </Text>
                </div>
              </Flex>
            </Space>
          </Card>

          <Card 
            title="Informasi Rinci"
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Nama Produk">{production.name}</Descriptions.Item>
              <Descriptions.Item label="Aset Terkait">{production.asset_name}</Descriptions.Item>
              <Descriptions.Item label="Tanggal">{formatDate(production.date)}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag style={{ 
                    background: statusProps.bgColor, 
                    color: statusProps.color, 
                    border: 'none', fontWeight: 600,
                  }}>
                  {statusProps.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Kuantitas">{production.quantity} {production.unit}</Descriptions.Item>
              <Descriptions.Item label="Harga per Unit">{formatRupiah(production.unit_price)}</Descriptions.Item>
              <Descriptions.Item label="Total Nilai">
                <Text strong style={{ fontSize: '16px', color: '#7CB305' }}>
                  {formatRupiah(production.total_value)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size={24}>
            <InfoCard
              icon={<BiMoneyWithdraw />}
              label="Nilai Total Produksi"
              value={formatRupiah(production.total_value)}
              iconColor="#7CB305"
            />
            <InfoCard
              icon={<FaBoxesStacked />}
              label="Kuantitas"
              value={`${production.quantity} ${production.unit}`}
              iconColor="#1C64F2"
            />
            <InfoCard
              icon={<FaArrowTrendUp />}
              label="Harga per Unit"
              value={formatRupiah(production.unit_price)}
              iconColor="#9061F9"
            />
            
            <Card 
              title="Informasi Tambahan"
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>ID Produksi</Text>
                  <Text style={{ fontWeight: 600 }}>#{production.id}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>Tipe Aset</Text>
                  <Text style={{ fontWeight: 600 }}>{assetTypeProps.label}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>Status</Text>
                  <Tag style={{ 
                      background: statusProps.bgColor, 
                      color: statusProps.color, 
                      border: 'none', fontWeight: 600,
                    }}>
                    {statusProps.label}
                  </Tag>
                </Flex>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      <ProductionModal
        visible={isModalOpen}
        onClose={handleModalCancel}
        initialData={editingProduction}
        form={form}
        assets={assets}
        isLoadingAssets={isLoadingAssets}
        isAdmin={isAdmin}
      />
    </>
  );
}

export default function ProductionDetailPage() {
  return (
    <ProtectedRoute>
      <ProductionDetailContent />
    </ProtectedRoute>
  );
}