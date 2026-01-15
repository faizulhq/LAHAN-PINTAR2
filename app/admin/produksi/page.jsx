'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Modal, Form, Select, InputNumber, DatePicker,
  Input, Typography, Flex, Space, message, Spin, Alert, Card, Row, Col,
  Tag, Skeleton, Descriptions, Popconfirm, Divider
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
import useAuthStore from '@/lib/store/authStore';
import {
  getProductions, createProduction, patchProduction, deleteProduction
} from '@/lib/api/production';
import { getAssets } from '@/lib/api/asset';
import { getProducts, createProduct } from '@/lib/api/product';

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
  terjual: { label: 'Dijual', color: '#057A55' },
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
  const type = ASSET_TYPE_MAP[production.asset_details?.type] || { label: 'Umum', color: '#1E429F' };
  
  // Ambil nama & unit dari relasi product_details (Backend Baru)
  const productName = production.product_details?.name || production.name || 'Produk Tanpa Nama';
  const productUnit = production.product_details?.unit || production.unit || '';

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
              display: 'inline-flex', justifyContent: 'center', alignItems: 'center', padding: '4px 10px',
              background: '#E1EFFE', borderRadius: '6px',
            }}>
              <Text style={{ fontWeight: 600, fontSize: '14px', lineHeight: '17px', color: '#1E429F' }}>
                {type.label}
              </Text>
            </div>
            <div style={{
              display: 'inline-flex', justifyContent: 'center', alignItems: 'center', padding: '4px 10px',
              background: status.label === 'Dijual' ? '#DEF7EC' : '#E1EFFE', borderRadius: '6px',
            }}>
              <Text style={{ fontWeight: 600, fontSize: '14px', lineHeight: '17px', color: status.label === 'Dijual' ? '#057A55' : '#1E429F' }}>
                {status.label}
              </Text>
            </div>
          </Space>
          
          <Title level={4} style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 600, lineHeight: '24px', color: '#111928' }}>
            {productName}
          </Title>
          
          <Text style={{ fontSize: '16px', fontWeight: 500, lineHeight: '19px', color: '#111928', display: 'block', marginBottom: '16px' }}>
            {formatDate(production.date)}
          </Text>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#727272', display: 'block', marginBottom: '10px' }}>
                Kuantitas
              </Text>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#111928' }}>
                {Number(production.quantity).toLocaleString('id-ID')} {productUnit}
              </Text>
            </div>
            <div>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#727272', display: 'block', marginBottom: '10px' }}>
                Estimasi Harga/Unit
              </Text>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#111928' }}>
                {formatRupiah(production.unit_price)}
              </Text>
            </div>
            <div>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#727272', display: 'block', marginBottom: '10px' }}>
                Nilai Total
              </Text>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#7CB305' }}>
                {formatRupiah(production.quantity * production.unit_price)}
              </Text>
            </div>
          </div>
          
          <Space>
            {canEdit && (
              <Button
                style={{
                  minWidth: '128px', height: '40px', background: '#237804', borderColor: '#237804',
                  borderRadius: '8px', color: '#FFFFFF', fontSize: '14px', fontWeight: 500,
                }}
                onClick={() => onEditClick(production)}
              >
                Edit
              </Button>
            )}
            {canEdit && (
               <Popconfirm title="Hapus data ini?" onConfirm={() => onDelete(production.id)} okText="Ya" cancelText="Batal">
                  <Button danger icon={<DeleteOutlined />} style={{ borderRadius: '8px', height: '40px' }} />
               </Popconfirm>
            )}
          </Space>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Text style={{ fontSize: '24px', fontWeight: 700, color: '#7CB305', display: 'block', lineHeight: '29px', marginBottom: '0px' }}>
            {formatRupiah(production.quantity * production.unit_price)}
          </Text>
          <Text style={{ fontSize: '14px', fontWeight: 500, color: '#727272', display: 'block' }}>
             Total Estimasi
          </Text>
        </div>
      </div>
    </Card>
  );
};

// =================================================================
// === KOMPONEN MODAL TAMBAH/EDIT ===
// =================================================================
const ProductionModal = ({ visible, onClose, initialData, form, assets, isLoadingAssets, products, isLoadingProducts }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewProductMode, setIsNewProductMode] = useState(false);
  
  const isEditMode = Boolean(initialData);

  const mutationOptions = {
    onSuccess: () => {
      message.success(isEditMode ? 'Produksi berhasil diperbarui' : 'Produksi berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refresh produk juga
      onClose();
    },
    onError: (err) => {
      console.error("Error:", err);
      message.error(`Gagal menyimpan: ${err.response?.data?.detail || 'Terjadi kesalahan'}`);
    },
    onSettled: () => setIsSubmitting(false),
  };

  const createMutation = useMutation({ mutationFn: createProduction, ...mutationOptions });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => patchProduction(id, data), ...mutationOptions });
  const createProductMutation = useMutation({ mutationFn: createProduct });

  // Handle Dropdown Produk Change
  const handleProductChange = (value) => {
    if (value === 'NEW_PRODUCT') {
      setIsNewProductMode(true);
    } else {
      setIsNewProductMode(false);
    }
  };

  useEffect(() => {
    if (visible) {
      if (isEditMode && initialData) {
        setIsNewProductMode(false);
        form.setFieldsValue({
          ...initialData,
          date: moment(initialData.date, 'YYYY-MM-DD'),
          quantity: parseFloat(initialData.quantity),
          unit_price: parseFloat(initialData.unit_price),
          status: initialData.status,
          // Mapping product ID. Pastikan backend mengirim ID produk.
          product: initialData.product || initialData.product_details?.id 
        });
      } else {
        form.resetFields();
        setIsNewProductMode(false);
        form.setFieldValue('status', 'stok');
      }
    }
  }, [visible, initialData, form, isEditMode]);

  const onFinish = async (values) => {
    setIsSubmitting(true);
    try {
      let finalProductId = values.product;

      // 1. Flow Buat Produk Baru
      if (isNewProductMode) {
        const newProductRes = await createProductMutation.mutateAsync({
          name: values.new_product_name,
          unit: values.new_product_unit,
          current_stock: 0 
        });
        finalProductId = newProductRes.id;
        message.success('Master produk baru dibuat');
      }

      // 2. Simpan Produksi
      const payload = {
        asset: values.asset,
        product: finalProductId, 
        quantity: values.quantity,
        unit_price: values.unit_price,
        date: values.date.format('YYYY-MM-DD'),
        status: values.status,
      };
      
      if (isEditMode) {
        updateMutation.mutate({ id: initialData.id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch (error) {
      console.error("Gagal simpan:", error);
      message.error("Gagal memproses data.");
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEditMode ? 'Edit Produksi' : 'Catat Hasil Panen'}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
        
        {/* Dropdown Produk */}
        <Form.Item
          name="product"
          label="Pilih Produk Hasil Panen"
          rules={[{ required: true, message: 'Produk wajib dipilih' }]}
        >
          <Select
            showSearch
            placeholder="Pilih produk dari gudang..."
            loading={isLoadingProducts}
            onChange={handleProductChange}
            optionFilterProp="children"
            filterOption={(input, option) => 
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="NEW_PRODUCT" style={{ color: '#237804', fontWeight: 'bold' }}>
              + Buat Produk Baru
            </Option>
            {products?.map(p => (
              <Option key={p.id} value={p.id} label={p.name}>
                {p.name} (Unit: {p.unit})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Input Tambahan Jika Produk Baru */}
        {isNewProductMode && (
          <div style={{ background: '#F6FFED', padding: '16px', borderRadius: '8px', border: '1px solid #B7EB8F', marginBottom: '24px' }}>
            <Text strong style={{ color: '#237804', display: 'block', marginBottom: '12px' }}>
              📦 Pendaftaran Produk Baru ke Gudang
            </Text>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="new_product_name"
                  label="Nama Produk Baru"
                  rules={[{ required: isNewProductMode, message: 'Nama produk baru wajib diisi' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="Contoh: Jagung Manis" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="new_product_unit"
                  label="Satuan Unit"
                  rules={[{ required: isNewProductMode, message: 'Satuan wajib diisi' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="Contoh: Kg, Liter, Ikat" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        <Form.Item
          name="asset"
          label="Aset Terkait (Sumber Panen)"
          rules={[{ required: true, message: 'Aset wajib dipilih' }]}
        >
          <Select
            showSearch
            placeholder="Pilih lahan/aset penghasil"
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
              label="Kuantitas Hasil"
              rules={[{ required: true, message: 'Kuantitas wajib diisi' }]}
            >
              <InputNumber min={0} className="w-full" placeholder="cth: 500" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="unit_price"
              label="Estimasi Harga Satuan (Rp)"
              rules={[{ required: true, message: 'Harga wajib diisi' }]}
            >
              <InputNumber
                className="w-full"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                min={0}
                placeholder="0"
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="date"
              label="Tanggal Panen"
              rules={[{ required: true, message: 'Tanggal harus dipilih!' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY"/>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status Barang"
              rules={[{ required: true, message: 'Status wajib dipilih' }]}
            >
              <Select placeholder="Pilih status">
                <Option value="stok">Masuk Stok (Gudang)</Option>
                <Option value="terjual">Langsung Terjual</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ textAlign: 'right', marginTop: 32 }}>
          <Space>
            <Button onClick={onClose}>Batal</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              style={{ backgroundColor: '#237804', borderColor: '#237804' }}
            >
              {isEditMode ? 'Simpan Perubahan' : 'Simpan Data'}
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

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin', 'Operator'].includes(userRole);

  let titleText = "Laporan Hasil Produksi";
  let subText = "Pantau hasil panen dan nilai produksi dari aset.";

  if (canEdit) {
    titleText = "Manajemen Produksi";
    subText = "Kelola hasil produksi ternak dan lahan";
  }

  // --- QUERY DATA ---
  
  // 1. Ambil Produk (Untuk Modal & Filter jika perlu)
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts
  });

  // 2. Ambil Aset (Untuk Filter & Modal)
  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets
  });
  
  // 3. Ambil Produksi (Data Utama)
  // Filter akan dilakukan di client side atau backend tergantung API.
  // Di sini kita kirim params, jika backend support filtering.
  const filterParams = useMemo(() => ({
    asset: selectedAsset === 'all' ? undefined : selectedAsset,
    search: searchTerm || undefined,
    // type: selectedType, // Jika backend support filter by product type
  }), [selectedAsset, searchTerm]);

  const { data: productions, isLoading: isLoadingProductions, isError, error } = useQuery({
    queryKey: ['productions', filterParams],
    queryFn: () => getProductions(filterParams),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduction,
    onSuccess: () => {
      message.success('Data produksi berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['productions'] });
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`);
    }
  });

  // --- CLIENT SIDE FILTERING & STATS CALCULATION ---
  // (Karena API Reporting sudah dihapus)
  
  const filteredProductions = useMemo(() => {
      if (!productions) return [];
      return productions.filter(p => {
          // Filter Status
          if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
          // Filter Aset (Jika backend belum filter)
          if (selectedAsset !== 'all' && p.asset !== parseInt(selectedAsset)) return false;
          // Filter Search (Nama Produk)
          if (searchTerm) {
              const pName = p.product_details?.name || p.name || '';
              if (!pName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
          }
          return true;
      });
  }, [productions, selectedStatus, selectedAsset, searchTerm]);

  const stats = useMemo(() => {
      if (!filteredProductions) return { total_produksi: 0, nilai_total: 0, terjual: 0, stok: 0 };
      
      return filteredProductions.reduce((acc, curr) => {
          const val = (parseFloat(curr.quantity) * parseFloat(curr.unit_price)) || 0;
          
          acc.total_produksi += parseFloat(curr.quantity);
          acc.nilai_total += val;
          
          if (curr.status === 'terjual') acc.terjual += val;
          if (curr.status === 'stok') acc.stok += val;
          
          return acc;
      }, { total_produksi: 0, nilai_total: 0, terjual: 0, stok: 0 });
  }, [filteredProductions]);


  // --- HANDLERS ---

  const showAddModal = () => {
    setEditingProduction(null);
    form.resetFields();
    setIsModalOpen(true);
  };
  
  const showEditModal = (production) => {
    setEditingProduction(production);
    setIsModalOpen(true);
  };
  
  const handleViewDetail = (id) => {
    // router.push(`/admin/produksi/${id}`); 
    message.info("Fitur detail sedang dikembangkan");
  };
  
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingProduction(null);
    form.resetFields();
  };
  
  const isLoadingInitialData = isLoadingProductions || isLoadingAssets || isLoadingProducts;
  
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928', fontWeight: 700, fontSize: '30px', lineHeight: '125%' }}>
            {titleText}
          </Title>
          <Text style={{ fontSize: '16px', fontWeight: 500, color: '#727272', lineHeight: '19px' }}>
            {subText}
          </Text>
        </div>
        
        {canEdit && (
           <Button
             type="primary"
             icon={<PlusCircleOutlined />}
             size="large"
             style={{ backgroundColor: '#237804', borderColor: '#237804', borderRadius: '24px', height: '40px', padding: '8px 16px', fontSize: '16px' }}
             onClick={showAddModal}
           >
             Tambah Produksi
           </Button>
        )}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Text style={{ fontSize: '20px', fontWeight: 500, display: 'block', marginBottom: '8px', color: '#111928' }}>
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

      <div style={{ display: 'flex', gap: '18px', marginBottom: '24px' }}>
        <div style={{ flex: 1 }}>
          <StatCard title="Total Volume" value={stats.total_produksi} icon={<LuWheat />} loading={isLoadingProductions} iconColor="#7CB305" />
        </div>
        <div style={{ flex: 1 }}>
          <StatCard title="Nilai Total" value={stats.nilai_total} icon={<BiMoneyWithdraw />} loading={isLoadingProductions} format="rupiah" iconColor="#CF1322" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '18px', marginBottom: '24px' }}>
        <div style={{ flex: 1 }}>
          <StatCard title="Nilai Terjual" value={stats.terjual} icon={<FaArrowTrendUp />} loading={isLoadingProductions} format="rupiah" iconColor="#1C64F2" />
        </div>
        <div style={{ flex: 1 }}>
          <StatCard title="Nilai Stok" value={stats.stok} icon={<BsBox2Fill />} loading={isLoadingProductions} format="rupiah" iconColor="#9061F9" />
        </div>
      </div>

      <Card style={{ marginBottom: 24, border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1)' }}>
        <Title level={4} style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 500, color: '#111928' }}>
          Pencarian & Filter
        </Title>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '412px', background: '#FFFFFF', border: '1px solid #D9D9D9', borderRadius: '8px', overflow: 'hidden' }}>
            <Input
              placeholder="Cari Produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', flex: 1, padding: '8px 12px', fontSize: '16px' }}
              suffix={searchTerm && <CloseCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.25)', cursor: 'pointer' }} onClick={() => setSearchTerm('')} />}
            />
            <Button type="primary" icon={<SearchOutlined />} style={{ background: '#237804', border: '1px solid #237804', borderRadius: '0px 2px 2px 0px', height: '40px', width: '46px' }} />
          </div>
          
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

      <Card style={{ marginBottom: 24, border: '1px solid #E5E7EB', borderRadius: '8px' }}>
        <Title level={4} style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 700, color: '#111928' }}>
          Daftar Produksi
        </Title>

        {isLoadingInitialData && (
          <div style={{ textAlign: 'center', padding: '48px' }}><Spin size="large" /></div>
        )}
        
        {isError && !isLoadingInitialData && (
          <Alert message="Error Memuat Data" description={error?.message} type="error" showIcon />
        )}
        
        {!isLoadingInitialData && !isError && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredProductions && filteredProductions.length > 0 ? (
              filteredProductions.map(prod => (
                <ProductionCard
                  key={prod.id}
                  production={prod}
                  onEditClick={showEditModal}
                  onDetailClick={handleViewDetail}
                  onDelete={deleteMutation.mutate}
                  canEdit={canEdit}
                />
              ))
            ) : (
              <div style={{ border: '1px dashed #d9d9d9', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: '16px', color: '#727272' }}>
                  Tidak ada data produksi ditemukan.
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
        products={products}
        isLoadingProducts={isLoadingProducts}
      />
    </>
  );
}

export default function ProductionPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <ProductionManagementContent />
    </ProtectedRoute>
  );
}