'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Modal, Form, Select, InputNumber, DatePicker,
  Input, Typography, Space, message, Spin, Alert, Card, Row, Col,
  Tag, Skeleton, Popconfirm, List, Avatar, Statistic, Divider
} from 'antd';
import {
  PlusOutlined, EditOutlined, SearchOutlined, DeleteOutlined, 
  CloseCircleOutlined, PlusCircleOutlined, AppstoreOutlined, EyeOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { LuWheat } from 'react-icons/lu';
import { FaClipboardList } from 'react-icons/fa6';
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

// --- HELPERS ---
const formatDate = (dateString) => dateString ? moment(dateString).format('D/M/YYYY') : '-';

const ASSET_TYPE_MAP = {
  lahan: { label: 'Lahan', color: '#1E429F' },
  alat: { label: 'Alat', color: '#1E429F' },
  bangunan: { label: 'Bangunan', color: '#1E429F' },
  ternak: { label: 'Ternak', color: '#1E429F' },
};

// --- COMPONENTS ---

// 1. Stat Card (Fokus ke Kinerja Produksi)
const StatCard = ({ title, value, icon, loading, iconColor }) => (
  <Card
    bodyStyle={{ padding: '24px' }}
    style={{
      background: '#FFFFFF',
      border: '1px solid #F0F0F0',
      borderRadius: '12px',
      boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1)',
      height: '100%'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', height: '100%' }}>
      <div style={{ flexShrink: 0, color: iconColor || '#7CB305', fontSize: '34px' }}>
        {icon}
      </div>
      <div>
        <Text style={{ fontSize: '16px', fontWeight: 600, color: '#585858', display: 'block' }}>{title}</Text>
        <Text style={{ fontSize: '28px', fontWeight: 700, color: '#111928' }}>
           {loading ? '...' : Number(value).toLocaleString('id-ID')}
        </Text>
      </div>
    </div>
  </Card>
);

// 2. Info Stok Gudang (Dengan Header Total Stok)
const ProductStockSummary = ({ products, loading }) => {
  // Hitung total stok global di sini
  const totalStock = useMemo(() => {
    if (!products) return 0;
    return products.reduce((acc, curr) => acc + parseFloat(curr.current_stock || 0), 0);
  }, [products]);

  return (
    <Card
      title={<Space><AppstoreOutlined /> Ringkasan Stok Gudang</Space>}
      bodyStyle={{ padding: '0px' }}
      style={{ border: '1px solid #E5E7EB', borderRadius: '12px', marginTop: 24 }}
    >
      <Spin spinning={loading}>
        {/* Header Total Stok Global */}
        <div style={{ padding: '24px', background: '#F9FAFB', borderBottom: '1px solid #F0F0F0' }}>
            <Row align="middle" justify="space-between">
                <Col>
                    <Text type="secondary" style={{ fontSize: '14px' }}>Total Stok Tersedia (Global)</Text>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#D97706', marginTop: '4px' }}>
                        {Number(totalStock).toLocaleString('id-ID')} <span style={{fontSize: '16px', fontWeight: 400, color: '#6B7280'}}>Unit</span>
                    </div>
                </Col>
                <Col>
                    <ShopOutlined style={{ fontSize: '42px', color: '#FCD34D', opacity: 0.8 }} />
                </Col>
            </Row>
        </div>

        {/* List Produk */}
        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
          <List
            itemLayout="horizontal"
            dataSource={products || []}
            renderItem={(item) => (
              <List.Item style={{ padding: '12px 24px', borderBottom: '1px solid #F3F4F6' }}>
                <List.Item.Meta
                  avatar={<Avatar style={{ backgroundColor: '#E1EFFE', color: '#1E429F' }}>{item.name[0]}</Avatar>}
                  title={<Text strong>{item.name}</Text>}
                  description={<Text type="secondary">Unit: {item.unit}</Text>}
                />
                <div style={{textAlign: 'right'}}>
                  <Text strong style={{fontSize: '18px', color: '#237804'}}>
                    {Number(item.current_stock || 0).toLocaleString('id-ID')}
                  </Text>
                  <div style={{fontSize: '11px', color: '#727272'}}>Tersedia</div>
                </div>
              </List.Item>
            )}
          />
          {products?.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>Gudang Kosong</div>}
        </div>
      </Spin>
    </Card>
  );
};

// 3. Production Card
const ProductionCard = ({ production, onEditClick, onDetailClick, onDelete, canEdit }) => {
  const type = ASSET_TYPE_MAP[production.asset_details?.type] || { label: 'Umum', color: '#1E429F' };
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
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Space size="small" style={{ marginBottom: '10px' }}>
            <div style={{
              display: 'inline-flex', padding: '4px 10px',
              background: '#E1EFFE', borderRadius: '6px',
            }}>
              <Text style={{ fontWeight: 600, fontSize: '14px', color: '#1E429F' }}>
                {type.label}
              </Text>
            </div>
          </Space>
          
          <Title level={4} style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 600, color: '#111928' }}>
            {productName}
          </Title>
          
          <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928', display: 'block', marginBottom: '16px' }}>
            {formatDate(production.date)}
          </Text>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#727272', display: 'block', marginBottom: '4px' }}>
                Kuantitas Hasil
              </Text>
              <Text style={{ fontSize: '16px', fontWeight: 600, color: '#111928' }}>
                {Number(production.quantity).toLocaleString('id-ID')} {productUnit}
              </Text>
            </div>
            <div>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#727272', display: 'block', marginBottom: '4px' }}>
                Asal Aset
              </Text>
              <Text style={{ fontSize: '16px', fontWeight: 600, color: '#111928' }}>
                {production.asset_details?.name || '-'}
              </Text>
            </div>
          </div>
          
          <Space>
            <Button onClick={() => onDetailClick(production.id)} icon={<EyeOutlined />}>
                Detail
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  );
};

// 4. Modal
const ProductionModal = ({ visible, onClose, initialData, form, assets, isLoadingAssets, products, isLoadingProducts }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewProductMode, setIsNewProductMode] = useState(false);
  const isEditMode = Boolean(initialData);

  const mutationOptions = {
    onSuccess: () => {
      message.success(isEditMode ? 'Produksi diperbarui' : 'Produksi ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); 
      onClose();
    },
    onError: (err) => message.error(`Gagal menyimpan: ${err.response?.data?.detail || 'Terjadi kesalahan'}`),
    onSettled: () => setIsSubmitting(false),
  };

  const createMutation = useMutation({ mutationFn: createProduction, ...mutationOptions });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => patchProduction(id, data), ...mutationOptions });
  
  const createProductMutation = useMutation({ 
      mutationFn: createProduct,
      onSuccess: (newProduct) => {
          message.success('Produk baru berhasil dibuat!');
          queryClient.invalidateQueries({ queryKey: ['products'] });
          form.setFieldValue('product', newProduct.id); 
          setIsNewProductMode(false);
      },
      onError: () => message.error('Gagal membuat produk')
  });

  const handleSaveNewProduct = async () => {
      try {
          const values = await form.validateFields(['new_product_name', 'new_product_unit']);
          createProductMutation.mutate({ name: values.new_product_name, unit: values.new_product_unit, current_stock: 0 });
      } catch (e) {}
  };

  useEffect(() => {
    if (visible) {
      if (isEditMode && initialData) {
        setIsNewProductMode(false);
        form.setFieldsValue({
          asset: initialData.asset,
          product: initialData.product || initialData.product_details?.id,
          quantity: parseFloat(initialData.quantity),
          date: moment(initialData.date),
        });
      } else {
        form.resetFields();
        setIsNewProductMode(false);
      }
    }
  }, [visible, initialData, form, isEditMode]);

  const onFinish = (values) => {
    setIsSubmitting(true);
    const payload = {
      asset: values.asset,
      product: values.product,
      quantity: values.quantity,
      date: values.date.format('YYYY-MM-DD'),
      status: 'stok', 
      unit_price: 0, 
    };
    if (isEditMode) updateMutation.mutate({ id: initialData.id, data: payload });
    else createMutation.mutate(payload);
  };

  return (
    <Modal title={isEditMode ? 'Edit Hasil Panen' : 'Catat Hasil Panen'} open={visible} onCancel={onClose} footer={null} width={600} destroyOnClose>
      <Modal title="Tambah Produk Baru" open={isNewProductMode} onCancel={() => setIsNewProductMode(false)}
          footer={[
              <Button key="b" onClick={() => setIsNewProductMode(false)}>Batal</Button>,
              <Button key="s" type="primary" onClick={handleSaveNewProduct} loading={createProductMutation.isPending} style={{background: '#237804', borderColor: '#237804'}}>Simpan Produk</Button>
          ]} width={400} zIndex={1002} centered
      >
          <Form form={form} layout="vertical" component={false}>
             <div style={{ background: '#F6FFED', padding: '16px', borderRadius: '8px', border: '1px solid #B7EB8F', marginBottom: '24px' }}>
                <Text strong style={{ color: '#237804', display: 'block', marginBottom: '12px' }}>
                  📦 Pendaftaran Produk Baru ke Gudang
                </Text>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="new_product_name" label="Nama Produk Baru" rules={[{ required: isNewProductMode, message: 'Nama produk baru wajib diisi' }]}>
                      <Input placeholder="Contoh: Jagung Manis" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="new_product_unit" label="Satuan Unit" rules={[{ required: isNewProductMode, message: 'Satuan wajib diisi' }]}>
                      <Input placeholder="Contoh: Kg, Liter, Ikat" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
          </Form>
      </Modal>

      <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
        <Form.Item label="Pilih Produk" style={{marginBottom: 12}}>
             <div style={{ display: 'flex', gap: 8 }}>
                <Form.Item name="product" rules={[{ required: true, message: 'Wajib' }]} style={{ flex: 1, marginBottom: 0 }}>
                    <Select placeholder="Pilih produk..." showSearch optionFilterProp="children" loading={isLoadingProducts}>
                        {products?.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Select>
                </Form.Item>
                <Button icon={<PlusOutlined />} onClick={() => setIsNewProductMode(true)} title="Buat Produk Baru" />
             </div>
        </Form.Item>

        <Form.Item name="asset" label="Asal Lahan/Aset" rules={[{ required: true }]}>
          <Select placeholder="Pilih aset..." showSearch optionFilterProp="children" loading={isLoadingAssets}>
            {assets?.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
          </Select>
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="quantity" label="Kuantitas" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Jumlah" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="date" label="Tanggal" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY"/>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ textAlign: 'right', marginTop: 24, marginBottom: 0 }}>
          <Space>
            <Button onClick={onClose}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} style={{ background: '#237804', borderColor: '#237804' }}>
              Simpan
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// --- MAIN PAGE ---
function ProductionManagementContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState(null);
  const [form] = Form.useForm();
  
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin', 'Operator'].includes(userRole);

  const { data: products, isLoading: isLoadingProducts } = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const { data: assets, isLoading: isLoadingAssets } = useQuery({ queryKey: ['assets'], queryFn: getAssets });
  
  const filterParams = useMemo(() => ({
    asset: selectedAsset === 'all' ? undefined : selectedAsset,
    search: searchTerm || undefined,
  }), [selectedAsset, searchTerm]);

  const { data: productions, isLoading: isLoadingProductions, isError } = useQuery({
    queryKey: ['productions', filterParams],
    queryFn: () => getProductions(filterParams),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduction,
    onSuccess: () => { 
        message.success('Dihapus'); 
        queryClient.invalidateQueries({ queryKey: ['productions'] });
        queryClient.invalidateQueries({ queryKey: ['products'] }); 
    },
    onError: (err) => message.error('Gagal hapus')
  });

  const stats = useMemo(() => {
      // Hitung Total Volume dari RIWAYAT PRODUKSI (Kinerja)
      if (!productions) return { total_volume: 0, total_transaksi: 0 };
      return productions.reduce((acc, curr) => {
          acc.total_volume += parseFloat(curr.quantity || 0);
          acc.total_transaksi += 1;
          return acc;
      }, { total_volume: 0, total_transaksi: 0 });
  }, [productions]);

  const showAddModal = () => { setEditingProduction(null); form.resetFields(); setIsModalOpen(true); };
  const showEditModal = (prod) => { setEditingProduction(prod); setIsModalOpen(true); };
  const handleDetail = (id) => { router.push(`/admin/produksi/${id}`); };
  const handleCancel = () => { setIsModalOpen(false); form.resetFields(); };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontSize: '30px' }}>{canEdit ? "Manajemen Produksi" : "Laporan Produksi"}</Title>
          <Text style={{ color: '#727272' }}>Kelola hasil produksi ternak dan lahan</Text>
        </div>
        {canEdit && (
           <Button type="primary" icon={<PlusCircleOutlined />} size="large" onClick={showAddModal} style={{ background: '#237804', borderRadius: '24px' }}>
             Tambah Produksi
           </Button>
        )}
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
            {/* Stat Card 1: Total Volume dari RIWAYAT (Kinerja) */}
            <StatCard title="Total Volume Produksi" value={stats.total_volume} icon={<LuWheat />} loading={isLoadingProductions} />
        </Col>
        <Col xs={24} md={12}>
            {/* Stat Card 2: Frekuensi Produksi */}
            <StatCard title="Total Transaksi Produksi" value={stats.total_transaksi} icon={<FaClipboardList />} loading={isLoadingProductions} iconColor="#1E429F" />
        </Col>
      </Row>

      {/* Info Stok Real-time dari Gudang (Ada Header Totalnya) */}
      <ProductStockSummary products={products} loading={isLoadingProducts} />

      <Card style={{ marginTop: 24, border: '1px solid #E5E7EB', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <Title level={4} style={{ margin: 0 }}>Riwayat Produksi</Title>
            <Space>
                <Input placeholder="Cari..." prefix={<SearchOutlined />} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Select value={selectedAsset} onChange={setSelectedAsset} style={{ width: 150 }}>
                    <Option value="all">Semua Aset</Option>
                    {assets?.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
                </Select>
            </Space>
        </div>

        {isLoadingProductions ? <div style={{textAlign:'center', padding:40}}><Spin /></div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {productions?.length > 0 ? productions.map(prod => (
                    <ProductionCard
                        key={prod.id}
                        production={prod}
                        onEditClick={showEditModal}
                        onDetailClick={handleDetail}
                        onDelete={deleteMutation.mutate}
                        canEdit={canEdit}
                    />
                )) : <div style={{textAlign:'center', padding:20, color:'#999'}}>Tidak ada data</div>}
            </div>
        )}
      </Card>

      <ProductionModal
        visible={isModalOpen}
        onClose={handleCancel}
        initialData={editingProduction}
        form={form}
        assets={assets}
        products={products}
        isLoadingAssets={isLoadingAssets}
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