'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Modal, Form, Select, InputNumber, DatePicker,
  Input, Typography, Flex, Space, message, Spin, Alert, Card, Row, Col,
  Tag, Skeleton, Descriptions, Popconfirm
} from 'antd';
import {
  PlusOutlined, EditOutlined, SearchOutlined, DeleteOutlined, CloseCircleOutlined, PlusCircleOutlined
} from '@ant-design/icons';
import { LuWheat } from 'react-icons/lu';
import { FaBoxesStacked, FaMoneyBillWave, FaBox, FaArrowTrendUp } from 'react-icons/fa6';
import { BiMoneyWithdraw } from 'react-icons/bi';
import { BsBox2Fill } from 'react-icons/bs';
import { ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore'; // [RBAC] Import Auth
import {
  getProductions, createProduction, patchProduction, deleteProduction
} from '@/lib/api/production';
import { getProductionStats } from '@/lib/api/reporting';
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
  stok: { label: 'Stok', color: '#1E429F' },
  terjual: { label: 'Dijual', color: '#057A55' }, // Adjusted color for clarity
};

const ASSET_TYPE_MAP = {
  lahan: { label: 'Lahan', color: '#1E429F' },
  alat: { label: 'Alat', color: '#1E429F' },
  bangunan: { label: 'Bangunan', color: '#1E429F' },
  ternak: { label: 'Ternak', color: '#1E429F' },
};

// =================================================================
// === KOMPONEN STAT CARD ===
// =================================================================
const StatCard = ({ title, value, icon, loading, format = "number", iconColor }) => {
  const displayValue = () => {
    if (loading) return <Skeleton.Input active size="small" style={{ width: 120, height: 38 }} />;
    if (format === 'rupiah') return formatRupiah(value);
    return Number(value).toLocaleString('id-ID');
  };

  return (
    <Card
      bodyStyle={{ padding: '24px' }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #F0F0F0',
        borderRadius: '12px',
        boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1), 0px 1px 4px rgba(12, 12, 13, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px', height: '100%' }}>
        <div
          style={{
            flexShrink: 0,
            color: iconColor || '#7CB305',
            fontSize: '34px',
          }}
        >
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
          <Text
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#585858',
              lineHeight: '150%',
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: '30px',
              fontWeight: 700,
              color: '#111928',
              lineHeight: '125%',
            }}
          >
            {displayValue()}
          </Text>
        </div>
      </div>
    </Card>
  );
};

// =================================================================
// === KOMPONEN KARTU PRODUKSI ===
// =================================================================
const ProductionCard = ({ production, onEditClick, onDetailClick, onDelete, canEdit }) => { 
  const status = STATUS_MAP[production.status] || { label: production.status, color: '#1E429F' };
  const type = ASSET_TYPE_MAP[production.asset_type] || { label: production.asset_type, color: '#1E429F' };
  
  return (
    <Card
      bodyStyle={{ padding: '20px' }}
      style={{
        width: '100%',
        marginBottom: '0px',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Space size="small" style={{ marginBottom: '10px' }}>
            <div style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4px 10px',
              background: '#E1EFFE',
              borderRadius: '6px',
            }}>
              <Text style={{
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '17px',
                color: '#1E429F',
              }}>
                {type.label}
              </Text>
            </div>
            <div style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4px 10px',
              background: status.label === 'Dijual' ? '#DEF7EC' : '#E1EFFE',
              borderRadius: '6px',
            }}>
              <Text style={{
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '17px',
                color: status.label === 'Dijual' ? '#057A55' : '#1E429F',
              }}>
                {status.label}
              </Text>
            </div>
          </Space>
          
          <Title level={4} style={{
            margin: '0 0 10px 0',
            fontSize: '20px',
            fontWeight: 600,
            lineHeight: '24px',
            color: '#111928',
          }}>
            {production.name}
          </Title>
          
          <Text style={{
            fontSize: '16px',
            fontWeight: 500,
            lineHeight: '19px',
            color: '#111928',
            display: 'block',
            marginBottom: '16px',
          }}>
            {formatDate(production.date)}
          </Text>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div>
              <Text style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#727272',
                display: 'block',
                marginBottom: '10px',
              }}>
                Kuantitas
              </Text>
              <Text style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111928',
              }}>
                {production.quantity}{production.unit}
              </Text>
            </div>
            <div>
              <Text style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#727272',
                display: 'block',
                marginBottom: '10px',
              }}>
                Harga per Unit
              </Text>
              <Text style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111928',
              }}>
                {formatRupiah(production.unit_price)}
              </Text>
            </div>
            <div>
              <Text style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#727272',
                display: 'block',
                marginBottom: '10px',
              }}>
                Total Nilai
              </Text>
              <Text style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#7CB305',
              }}>
                {formatRupiah(production.total_value)}
              </Text>
            </div>
          </div>
          
          <Space>
            <Button
              style={{
                minWidth: '128px',
                height: '40px',
                border: '1px solid #237804',
                borderRadius: '8px',
                color: '#237804',
                fontSize: '14px',
                fontWeight: 500,
              }}
              onClick={() => onDetailClick(production.id)}
            >
              Detail
            </Button>
            
            {/* [RBAC] Tombol Edit hanya jika canEdit (Operator/Admin) */}
            {canEdit && (
              <Button
                style={{
                  minWidth: '128px',
                  height: '40px',
                  background: '#237804',
                  borderColor: '#237804',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onClick={() => onEditClick(production)}
              >
                Edit
              </Button>
            )}
          </Space>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#7CB305',
            display: 'block',
            lineHeight: '29px',
            marginBottom: '0px',
          }}>
            {formatRupiah(production.total_value)}
          </Text>
          <Text style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#727272',
            display: 'block',
          }}>
            {production.quantity}{production.unit}
          </Text>
        </div>
      </div>
    </Card>
  );
};

// =================================================================
// === KOMPONEN MODAL TAMBAH/EDIT ===
// =================================================================
const ProductionModal = ({ visible, onClose, initialData, form, assets, isLoadingAssets }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(initialData);

  const mutationOptions = {
    onSuccess: () => {
      message.success(isEditMode ? 'Produksi berhasil diperbarui' : 'Produksi berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      queryClient.invalidateQueries({ queryKey: ['productionStats'] });
      onClose();
    },
    onError: (err) => {
      console.error("Error:", err);
      message.error('Gagal menyimpan. Cek konsol untuk detail.');
    },
    onSettled: () => setIsSubmitting(false),
  };

  const createMutation = useMutation({ mutationFn: createProduction, ...mutationOptions });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => patchProduction(id, data),
    ...mutationOptions
  });

  useEffect(() => {
    if (visible) {
      if (isEditMode && initialData) {
        form.setFieldsValue({
          ...initialData,
          date: moment(initialData.date, 'YYYY-MM-DD'),
          quantity: parseFloat(initialData.quantity),
          unit_price: parseFloat(initialData.unit_price),
          // Pastikan status terset
          status: initialData.status 
        });
      } else {
        form.resetFields();
        form.setFieldValue('status', 'stok'); // Default status
      }
    }
  }, [visible, initialData, form, isEditMode]);

  const onFinish = (values) => {
    setIsSubmitting(true);
    const payload = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
    };
    
    if (isEditMode) {
      updateMutation.mutate({ id: initialData.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Modal
      title={isEditMode ? 'Edit Produksi' : 'Tambah Produksi Baru'}
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

        {/* [REVISI] Status sekarang bisa diakses oleh siapa saja yang membuka modal (Admin & Operator) */}
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

        <Form.Item style={{ textAlign: 'right', marginTop: 32 }}>
          <Space>
            <Button onClick={onClose}>Batal</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              style={{ backgroundColor: '#237804', borderColor: '#237804' }}
            >
              {isEditMode ? 'Simpan Perubahan' : 'Tambah Data'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// =================================================================
// === KOMPONEN UTAMA ===
// =================================================================
function ProductionManagementContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState(null);
  const [form] = Form.useForm();
  
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // [RBAC] Cek Role
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  
  const isAdmin = ['Admin', 'Superadmin'].includes(userRole);
  const isOperator = userRole === 'Operator';
  // canEdit digunakan untuk membuka modal. Jika modal terbuka, user bisa edit semua field (termasuk status)
  const canEdit = isAdmin || isOperator;

  // [LOGIKA JUDUL DINAMIS]
  let titleText = "Laporan Hasil Produksi";
  let subText = "Pantau hasil panen dan nilai produksi dari aset.";

  if (isAdmin) {
    titleText = "Manajemen Produksi";
    subText = "Kelola hasil produksi ternak dan lahan";
  } else if (isOperator) {
    titleText = "Catatan Produksi";
    subText = "Input hasil panen harian dan update status penjualan.";
  }

  const statsParams = useMemo(() => ({
    asset: selectedAsset === 'all' ? undefined : selectedAsset,
  }), [selectedAsset]);

  const filterParams = useMemo(() => ({
    asset: selectedAsset === 'all' ? undefined : selectedAsset,
    search: searchTerm || undefined,
    type: selectedType === 'all' ? undefined : selectedType,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  }), [selectedAsset, searchTerm, selectedType, selectedStatus]);

  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets
  });
  
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['productionStats', statsParams],
    queryFn: () => getProductionStats(statsParams),
  });
  
  const { data: productions, isLoading: isLoadingProductions, isError, error } = useQuery({
    queryKey: ['productions', filterParams],
    queryFn: () => getProductions(filterParams),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduction,
    onSuccess: () => {
      message.success('Data produksi berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      queryClient.invalidateQueries({ queryKey: ['productionStats'] });
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`);
    }
  });

  const showAddModal = () => {
    setEditingProduction(null);
    form.resetFields();
    setIsModalOpen(true);
  };
  
  const showEditModal = (production) => {
    setEditingProduction(production);
    form.setFieldsValue({
      ...production,
      date: moment(production.date),
      quantity: parseFloat(production.quantity),
      unit_price: parseFloat(production.unit_price),
    });
    setIsModalOpen(true);
  };
  
  const handleViewDetail = (id) => {
    router.push(`/admin/produksi/${id}`);
  };
  
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingProduction(null);
    form.resetFields();
  };
  
  const isLoadingInitialData = isLoadingProductions || isLoadingAssets;
  
  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928', fontWeight: 700, fontSize: '30px', lineHeight: '125%' }}>
            {titleText}
          </Title>
          <Text style={{ fontSize: '16px', fontWeight: 500, color: '#727272', lineHeight: '19px' }}>
            {subText}
          </Text>
        </div>
        
        {/* Tombol Tambah */}
        {canEdit && (
           <Button
             type="primary"
             icon={<PlusCircleOutlined />}
             size="large"
             style={{
               backgroundColor: '#237804',
               borderColor: '#237804',
               borderRadius: '24px',
               height: '40px',
               padding: '8px 16px',
               boxShadow: '0px 2px 0px rgba(0, 0, 0, 0.043)',
               fontSize: '16px',
             }}
             onClick={showAddModal}
           >
             Tambah Produksi
           </Button>
        )}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Text style={{
          fontSize: '20px',
          fontWeight: 500,
          display: 'block',
          marginBottom: '8px',
          color: '#111928',
          lineHeight: '24px',
        }}>
          Filter Asset
        </Text>
        <Select
          value={selectedAsset}
          onChange={setSelectedAsset}
          loading={isLoadingAssets}
          suffixIcon={<ChevronDown size={12} />}
          style={{ width: 200, height: '40px' }}
          size="large"
        >
          <Option value="all">Semua Asset</Option>
          {assets?.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
        </Select>
      </div>

      <div style={{
        display: 'flex',
        gap: '18px',
        marginBottom: '24px',
      }}>
        <div style={{ flex: 1 }}>
          <StatCard
            title="Total Produksi"
            value={stats?.total_produksi || 0}
            icon={<LuWheat />}
            loading={isLoadingStats}
            iconColor="#7CB305"
          />
        </div>
        <div style={{ flex: 1 }}>
          <StatCard
            title="Nilai Total"
            value={stats?.nilai_total || 0}
            icon={<BiMoneyWithdraw />}
            loading={isLoadingStats}
            format="rupiah"
            iconColor="#CF1322"
          />
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '18px',
        marginBottom: '24px',
      }}>
        <div style={{ flex: 1 }}>
          <StatCard
            title="Terjual"
            value={stats?.terjual || 0}
            icon={<FaArrowTrendUp />}
            loading={isLoadingStats}
            format="rupiah"
            iconColor="#1C64F2"
          />
        </div>
        <div style={{ flex: 1 }}>
          <StatCard
            title="Stok"
            value={stats?.stok || 0}
            icon={<BsBox2Fill />}
            loading={isLoadingStats}
            format="rupiah"
            iconColor="#9061F9"
          />
        </div>
      </div>

      <Card style={{
        marginBottom: 24,
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1), 0px 1px 4px rgba(12, 12, 13, 0.05)',
      }}>
        <Title level={4} style={{
          marginBottom: '20px',
          fontSize: '24px',
          fontWeight: 500,
          color: '#111928',
        }}>
          Pencarian & Filter
        </Title>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-between' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            maxWidth: '412px',
            background: '#FFFFFF',
            border: '1px solid #D9D9D9',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <Input
              placeholder="Cari Produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                flex: 1,
                padding: '8px 12px',
                fontSize: '16px',
                color: searchTerm ? 'rgba(0, 0, 0, 0.85)' : '#727272',
              }}
              suffix={searchTerm && <CloseCircleOutlined
                style={{ color: 'rgba(0, 0, 0, 0.25)', cursor: 'pointer' }}
                onClick={() => setSearchTerm('')}
              />}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              style={{
                background: '#237804',
                border: '1px solid #237804',
                borderRadius: '0px 2px 2px 0px',
                height: '40px',
                width: '46px',
                boxShadow: '0px 2px 0px rgba(0, 0, 0, 0.043)',
              }}
            />
          </div>
          
          <Select
            value={selectedType}
            size="large"
            style={{ width: 200, height: '40px' }}
            onChange={setSelectedType}
            placeholder="Semua Tipe"
            suffixIcon={<ChevronDown size={12} />}
          >
            <Option value="all">Semua Tipe</Option>
            {Object.entries(ASSET_TYPE_MAP).map(([val, {label}]) =>
              <Option key={val} value={val}>{label}</Option>
            )}
          </Select>
          
          <Select
            value={selectedStatus}
            size="large"
            style={{ width: 200, height: '40px' }}
            onChange={setSelectedStatus}
            placeholder="Semua Status"
            suffixIcon={<ChevronDown size={12} />}
          >
            <Option value="all">Semua Status</Option>
            {Object.entries(STATUS_MAP).map(([val, {label}]) =>
              <Option key={val} value={val}>{label}</Option>
            )}
          </Select>
        </div>
      </Card>

      <Card style={{
        marginBottom: 24,
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
      }}>
        <Title level={4} style={{
          marginBottom: '20px',
          fontSize: '22px',
          fontWeight: 700,
          color: '#111928',
        }}>
          Daftar Produksi
        </Title>

        {isLoadingInitialData && (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Spin size="large" />
          </div>
        )}
        
        {isError && !isLoadingInitialData && (
          <Alert
            message="Error Memuat Data"
            description={error?.message}
            type="error"
            showIcon
          />
        )}
        
        {!isLoadingInitialData && !isError && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {productions && productions.length > 0 ? (
              productions.map(prod => (
                <ProductionCard
                  key={prod.id}
                  production={prod}
                  onEditClick={showEditModal}
                  onDetailClick={handleViewDetail}
                  onDelete={deleteMutation.mutate}
                  canEdit={canEdit} // Pass permission
                />
              ))
            ) : (
              <div style={{
                border: '1px dashed #d9d9d9',
                borderRadius: '8px',
                padding: '32px',
                textAlign: 'center',
              }}>
                <Text type="secondary" style={{
                  fontSize: '16px',
                  color: '#727272',
                }}>
                  Tidak ada data produksi ditemukan untuk filter ini.
                </Text>
              </div>
            )}
          </div>
        )}
      </Card>

      <ProductionModal
        visible={isModalOpen}
        onClose={handleCancel}
        initialData={editingProduction}
        form={form}
        assets={assets}
        isLoadingAssets={isLoadingAssets}
        // isAdmin tidak lagi dibutuhkan untuk kontrol field status
      />
    </>
  );
}

export default function ProductionPage() {
  return (
    // [RBAC] Semua role boleh masuk (Investor/Viewer Read Only)
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <ProductionManagementContent />
    </ProtectedRoute>
  );
}