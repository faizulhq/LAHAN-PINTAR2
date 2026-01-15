'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Modal, Form, Select, InputNumber, DatePicker,
  Input, Typography, Space, message, Spin, Alert, Card, Row, Col,
  Skeleton, Tag, Statistic
} from 'antd';
import {
  PlusCircleOutlined, SearchOutlined, CloseCircleOutlined,
  DollarCircleOutlined, ShoppingCartOutlined, UserOutlined
} from '@ant-design/icons';
import { FaMoneyBillWave, FaBoxOpen } from 'react-icons/fa6';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';

// API Imports
import { getSales, createSale, updateSale, deleteSale } from '@/lib/api/sales';
import { getProducts } from '@/lib/api/product';

const { Title, Text } = Typography;
const { Option } = Select;

// =================================================================
// === HELPERS ===
// =================================================================
const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 0 })}`
    : 'Rp 0';

const formatDate = (dateString) => dateString ? moment(dateString).format('D/M/YYYY') : '-';

// =================================================================
// === KOMPONEN STAT CARD (Sama persis dengan Produksi/Pengeluaran) ===
// =================================================================
const StatCard = ({ title, value, icon, loading, format = "rupiah", iconColor }) => {
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
        height: '100%'
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
// === KOMPONEN SALE CARD (Style mirip ProductionCard) ===
// =================================================================
const SaleCard = ({ item, onEdit, onDelete, canEdit }) => {
  const productName = item.product_details?.name || 'Produk Dihapus';
  const unit = item.product_details?.unit || 'Unit';

  return (
    <Card
      bodyStyle={{ padding: '20px' }}
      style={{
        width: '100%',
        marginBottom: '16px', // Jarak antar card
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* BAGIAN KIRI */}
        <div style={{ flex: 1 }}>
          <Space size="small" style={{ marginBottom: '10px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              background: '#E1EFFE',
              borderRadius: '6px',
            }}>
              <UserOutlined style={{ color: '#1E429F', marginRight: 6 }} />
              <Text style={{ fontWeight: 600, fontSize: '14px', color: '#1E429F' }}>
                {item.buyer_name}
              </Text>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              background: '#DEF7EC',
              borderRadius: '6px',
            }}>
              <Text style={{ fontWeight: 600, fontSize: '14px', color: '#057A55' }}>
                Terjual
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
            {productName}
          </Title>
          
          <Text style={{
            fontSize: '16px',
            fontWeight: 500,
            lineHeight: '19px',
            color: '#111928',
            display: 'block',
            marginBottom: '16px',
          }}>
            {formatDate(item.date)}
          </Text>
          
          {/* Info Detail Grid */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
            <div>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#727272', display: 'block', marginBottom: '4px' }}>
                Kuantitas
              </Text>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#111928' }}>
                {Number(item.quantity).toLocaleString('id-ID')} {unit}
              </Text>
            </div>
            <div>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#727272', display: 'block', marginBottom: '4px' }}>
                Harga Satuan
              </Text>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#111928' }}>
                {formatRupiah(item.price_per_unit)}
              </Text>
            </div>
          </div>
          
          <Space>
             {canEdit && (
               <>
                 <Button
                    style={{
                      minWidth: '100px', height: '40px',
                      border: '1px solid #237804', borderRadius: '8px',
                      color: '#237804', fontSize: '14px', fontWeight: 500
                    }}
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button 
                    danger
                    type="text"
                    onClick={() => onDelete(item.id)}
                  >
                    Hapus
                  </Button>
               </>
            )}
          </Space>
        </div>

        {/* BAGIAN KANAN (NILAI) */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#057A55', // Hijau Pendapatan
            display: 'block',
            lineHeight: '29px',
            marginBottom: '0px',
          }}>
            + {formatRupiah(item.total_price)}
          </Text>
          <Text style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#727272',
            display: 'block',
          }}>
            Total Pendapatan
          </Text>
        </div>
      </div>
    </Card>
  );
};

// =================================================================
// === MODAL FORM ===
// =================================================================
const SalesModal = ({ visible, onClose, initialData, products, isLoadingProducts }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProductStock, setSelectedProductStock] = useState(null);
  
  const isEdit = !!initialData;

  useEffect(() => {
    if (visible) {
      if (isEdit) {
        form.setFieldsValue({
          ...initialData,
          date: moment(initialData.date),
          product: initialData.product,
        });
        const prod = products?.find(p => p.id === initialData.product);
        if (prod) setSelectedProductStock(prod);
      } else {
        form.resetFields();
        setSelectedProductStock(null);
      }
    }
  }, [visible, initialData, form, products]);

  const handleProductChange = (val) => {
    const prod = products?.find(p => p.id === val);
    setSelectedProductStock(prod || null);
  };

  const mutation = useMutation({
    mutationFn: isEdit ? (data) => updateSale(initialData.id, data) : createSale,
    onSuccess: () => {
      message.success(isEdit ? 'Data penjualan diperbarui' : 'Penjualan berhasil dicatat');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refresh stok gudang
      onClose();
    },
    onError: (err) => {
      message.error(err.response?.data?.detail || 'Gagal menyimpan data');
    },
    onSettled: () => setIsSubmitting(false)
  });

  const onFinish = (values) => {
    setIsSubmitting(true);
    const payload = { ...values, date: values.date.format('YYYY-MM-DD') };
    mutation.mutate(payload);
  };

  return (
    <Modal
      title={isEdit ? "Edit Transaksi Penjualan" : "Catat Penjualan Baru"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
        
        <Form.Item
          name="product"
          label="Pilih Produk dari Gudang"
          rules={[{ required: true, message: 'Produk wajib dipilih' }]}
        >
          <Select
            placeholder="Pilih produk..."
            loading={isLoadingProducts}
            onChange={handleProductChange}
            showSearch
            optionFilterProp="children"
            size="large"
          >
            {products?.map(p => (
              <Option key={p.id} value={p.id} disabled={parseFloat(p.current_stock) <= 0}>
                {p.name} (Stok: {parseFloat(p.current_stock)} {p.unit})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedProductStock && (
           <div style={{ background: '#F6FFED', padding: '12px', border: '1px solid #B7EB8F', borderRadius: '6px', marginBottom: '24px' }}>
              <Text strong style={{ color: '#389E0D' }}>
                 Stok Tersedia: {parseFloat(selectedProductStock.current_stock)} {selectedProductStock.unit}
              </Text>
           </div>
        )}

        <Form.Item
          name="buyer_name"
          label="Nama Pembeli"
          rules={[{ required: true, message: 'Nama pembeli wajib diisi' }]}
        >
          <Input placeholder="Contoh: CV Pangan Makmur" size="large" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="quantity"
              label="Jumlah Terjual"
              rules={[
                { required: true, message: 'Wajib diisi' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!selectedProductStock || !value || isEdit) return Promise.resolve();
                    if (parseFloat(value) > parseFloat(selectedProductStock.current_stock)) {
                      return Promise.reject(new Error('Jumlah melebihi stok tersedia!'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="0" size="large" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="price_per_unit"
              label="Harga Satuan (Rp)"
              rules={[{ required: true, message: 'Wajib diisi' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                placeholder="0"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="date"
          label="Tanggal Transaksi"
          rules={[{ required: true }]}
          initialValue={moment()}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
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
              {isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// =================================================================
// === MAIN PAGE ===
// =================================================================
function SalesManagementContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const user = useAuthStore((state) => state.user);
  const role = user?.role?.name || user?.role;
  const canEdit = ['Superadmin', 'Admin', 'Operator'].includes(role);

  const { data: salesData, isLoading: loadingSales, isError, error } = useQuery({
    queryKey: ['sales', { search: searchTerm }],
    queryFn: () => getSales({ search: searchTerm })
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts
  });

  const queryClient = useQueryClient();

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Hapus data penjualan?',
      content: 'Data stok di gudang akan otomatis dikembalikan.',
      okText: 'Ya, Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await deleteSale(id);
          message.success('Data dihapus');
          queryClient.invalidateQueries({ queryKey: ['sales'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (error) {
          message.error('Gagal menghapus');
        }
      }
    });
  };

  // Kalkulasi Stats Sederhana (Client Side)
  const stats = useMemo(() => {
    if (!salesData) return { totalRevenue: 0, totalTx: 0 };
    return salesData.reduce((acc, curr) => ({
      totalRevenue: acc.totalRevenue + parseFloat(curr.total_price || 0),
      totalTx: acc.totalTx + 1
    }), { totalRevenue: 0, totalTx: 0 });
  }, [salesData]);

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928', fontWeight: 700, fontSize: '30px', lineHeight: '125%' }}>
            Manajemen Penjualan
          </Title>
          <Text style={{ fontSize: '16px', fontWeight: 500, color: '#727272', lineHeight: '19px' }}>
            Kelola barang keluar dan pendapatan penjualan.
          </Text>
        </div>
        {canEdit && (
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            size="large"
            style={{
              backgroundColor: '#237804', // Konsisten dengan Pengeluaran/Produksi
              borderColor: '#237804',
              borderRadius: '24px',
              height: '40px',
              padding: '8px 16px',
              fontSize: '16px',
              boxShadow: '0px 2px 0px rgba(0, 0, 0, 0.043)'
            }}
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          >
            Catat Penjualan
          </Button>
        )}
      </div>

      {/* STATS ROW */}
      <Row gutter={[18, 18]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12}>
          <StatCard
            title="Total Pendapatan (Revenue)"
            value={stats.totalRevenue}
            icon={<FaMoneyBillWave />}
            iconColor="#057A55"
            loading={loadingSales}
          />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard
            title="Total Transaksi"
            value={stats.totalTx}
            icon={<ShoppingCartOutlined />}
            iconColor="#1E429F"
            loading={loadingSales}
            format="number"
          />
        </Col>
      </Row>

      {/* FILTER & LIST CARD */}
      <Card style={{ marginBottom: 24, border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
             <Title level={4} style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#111928' }}>
                Riwayat Penjualan
             </Title>
             
             {/* SEARCH BAR (Mirip Produksi) */}
             <div style={{ display: 'flex', alignItems: 'center', maxWidth: '300px', width: '100%', background: '#FFFFFF', border: '1px solid #D9D9D9', borderRadius: '8px', overflow: 'hidden' }}>
                <Input
                  placeholder="Cari pembeli / produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: 'none', flex: 1, padding: '8px 12px', fontSize: '16px' }}
                  suffix={searchTerm && <CloseCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.25)', cursor: 'pointer' }} onClick={() => setSearchTerm('')} />}
                />
                <Button type="primary" icon={<SearchOutlined />} style={{ background: '#237804', borderRadius: '0px', height: '40px', width: '46px', border: 'none' }} />
             </div>
        </div>

        {loadingSales && (
          <div style={{ textAlign: 'center', padding: '48px' }}><Spin size="large" /></div>
        )}
        
        {isError && !loadingSales && (
           <Alert message="Error Memuat Data" description={error?.message} type="error" showIcon />
        )}

        {!loadingSales && !isError && (
          <div>
            {salesData?.length > 0 ? (
              salesData.map(item => (
                <SaleCard
                  key={item.id}
                  item={item}
                  canEdit={canEdit}
                  onEdit={(d) => { setEditingItem(d); setIsModalOpen(true); }}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div style={{ border: '1px dashed #d9d9d9', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: '16px', color: '#727272' }}>
                  Belum ada data penjualan.
                </Text>
              </div>
            )}
          </div>
        )}
      </Card>

      <SalesModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingItem}
        products={products}
        isLoadingProducts={loadingProducts}
      />
    </>
  );
}

export default function SalesPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <SalesManagementContent />
    </ProtectedRoute>
  );
}