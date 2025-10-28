// File: faizulhq/lahan-pintar2/LAHAN-PINTAR2-9ebe2a759744e60857214f21d26b1c7ae9d0c9aa/app/admin/produksi/page.jsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Select, InputNumber, DatePicker,
  Input, Typography, Flex, Space, Popconfirm, message, Spin, Alert, Card,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
} from '@ant-design/icons';
import { LuWheat } from 'react-icons/lu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore'; // Impor useAuthStore
import {
  getProductions, createProduction, patchProduction, deleteProduction,
} from '@/lib/api/production';
import { getAssets } from '@/lib/api/asset';

const { Title, Text } = Typography;
const { Option } = Select;

// ... (Helper format Anda tetap sama) ...
const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => value ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';
const formatNumber = (value) => value != null ? Number(value).toLocaleString('id-ID') : '0';

// Komponen Utama Halaman Produksi
function ProductionManagementContent() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState('semua');
  const [form] = Form.useForm();

  // --- Ambil data user dari store ---
  const user = useAuthStore((state) => state.user);
  const isAdmin = useMemo(() => user?.role === 'Admin' || user?.role === 'Superadmin', [user]);

  // --- Fetch Data --- (tetap sama)
  const { data: productions, isLoading: isLoadingProductions, isError: isErrorProductions, error: errorProductions } = useQuery({
    queryKey: ['productions'],
    queryFn: getProductions,
  });
  const { data: assets, isLoading: isLoadingAssets } = useQuery({ queryKey: ['assets'], queryFn: getAssets });

  // --- Data Mapping --- (tetap sama)
  const assetMap = useMemo(() => assets ? assets.reduce((acc, a) => { acc[a.id] = a.name; return acc; }, {}) : {}, [assets]);

  // --- Mutasi --- (tetap sama)
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      setIsModalOpen(false); setEditingProduction(null); form.resetFields();
    },
    onError: (err) => { message.error(`Error: ${err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message || 'Gagal'}`); },
  };
  const createMutation = useMutation({ mutationFn: createProduction, ...mutationOptions, onSuccess: (...args) => { message.success('Data produksi berhasil ditambahkan'); mutationOptions.onSuccess(...args); } });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => patchProduction(id, data),
    ...mutationOptions, onSuccess: (...args) => { message.success('Data produksi berhasil diperbarui'); mutationOptions.onSuccess(...args); }
  });
  const deleteMutation = useMutation({ mutationFn: deleteProduction, onSuccess: () => { message.success('Data produksi berhasil dihapus'); queryClient.invalidateQueries({ queryKey: ['productions'] }); }, onError: (err) => { message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`); } });

  // --- Handlers --- (tetap sama)
  const showAddModal = () => { setEditingProduction(null); form.resetFields(); setIsModalOpen(true); };
  const showEditModal = (production) => {
    // ... (sisa handler tetap sama) ...
    setEditingProduction(production);
    form.setFieldsValue({
      asset: production.asset,
      date: moment(production.date),
      quantity: parseFloat(production.quantity),
      unit: production.unit,
      unit_price: parseFloat(production.unit_price),
    });
    setIsModalOpen(true);
  };
  const handleCancel = () => { setIsModalOpen(false); setEditingProduction(null); form.resetFields(); };
  const handleFormSubmit = (values) => {
    // ... (sisa handler tetap sama) ...
    const productionData = {
      asset: values.asset,
      date: values.date.format('YYYY-MM-DD'),
      quantity: values.quantity,
      unit: values.unit,
      unit_price: values.unit_price,
    };
    if (editingProduction) { updateMutation.mutate({ id: editingProduction.id, data: productionData }); }
    else { createMutation.mutate(productionData); }
  };
  const handleDelete = (id) => { deleteMutation.mutate(id); };

  // --- Filter Data --- (tetap sama)
  const filteredProductions = useMemo(() => {
    if (!productions) return [];
    let data = productions;
    if (selectedAsset !== 'semua') {
      data = data.filter(p => p.asset === parseInt(selectedAsset));
    }
    return data;
  }, [productions, selectedAsset]);

  // --- Kolom Tabel (DENGAN MODIFIKASI) ---
  const columns = [
    // ... (kolom lain tetap sama) ...
    { title: 'Tanggal', dataIndex: 'date', key: 'date', render: formatDate, sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(), width: 120 },
    {
      title: 'Aset', dataIndex: 'asset', key: 'asset',
      render: (assetId) => assetMap[assetId] || `ID ${assetId}`,
      sorter: (a, b) => (assetMap[a.asset] || '').localeCompare(assetMap[b.asset] || ''),
      filters: assets ? Object.entries(assetMap).map(([id, name]) => ({ text: name, value: parseInt(id) })) : [],
      onFilter: (value, record) => record.asset === value,
    },
    { title: 'Kuantitas', dataIndex: 'quantity', key: 'quantity', render: formatNumber, sorter: (a, b) => parseFloat(a.quantity) - parseFloat(b.quantity), align: 'right' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 100 },
    { title: 'Harga/Unit', dataIndex: 'unit_price', key: 'unit_price', render: formatRupiah, sorter: (a, b) => parseFloat(a.unit_price) - parseFloat(b.unit_price), align: 'right' },
    { title: 'Total Nilai', dataIndex: 'total_value', key: 'total_value', render: formatRupiah, sorter: (a, b) => parseFloat(a.total_value) - parseFloat(b.total_value), align: 'right', width: 150 },
    {
      title: 'Aksi', key: 'action', width: 120, align: 'center', fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {/* --- MODIFIKASI DI SINI --- */}
          {isAdmin && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => showEditModal(record)} />
              <Popconfirm title="Hapus Data Produksi?" onConfirm={() => handleDelete(record.id)} okText="Ya" cancelText="Tidak" okButtonProps={{ danger: true, loading: deleteMutation.isPending }}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
          {/* Jika bukan admin, kolom aksi akan kosong */}
        </Space>
      ),
    },
  ];

  const isLoadingInitialData = isLoadingProductions || isLoadingAssets;
  const isErrorInitialData = isErrorProductions || !assets;

  return (
    <>
      {/* ... (Header, Filter, Search, Loading, Modal Anda tetap sama) ... */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}>
              <LuWheat style={{ marginRight: '8px', verticalAlign: 'middle', fontSize: '24px' }}/>
              Manajemen Produksi
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>Catat hasil produksi dari setiap aset.</Text>
        </div>
        <Button
          type="primary" icon={<PlusOutlined />} size="large"
          style={{ backgroundColor: '#237804', borderRadius: '24px', height: 'auto', padding: '8px 16px', fontSize: '16px' }}
          onClick={showAddModal} loading={createMutation.isPending || updateMutation.isPending}
        >
          Tambah Produksi
        </Button>
      </Flex>

      <Card style={{ marginBottom: 24 }}>
         <Flex gap="middle" wrap="wrap">
             <Select
                defaultValue="semua" size="large" style={{ minWidth: 250, flexGrow: 1 }} onChange={(value) => setSelectedAsset(value)}
                loading={isLoadingAssets} placeholder="Filter Aset" allowClear showSearch optionFilterProp='children'
            >
                <Option value="semua">Semua Aset</Option>
                {assets?.map(a => <Option key={a.id} value={String(a.id)}>{a.name}</Option>)}
            </Select>
         </Flex>
      </Card>

      {isLoadingInitialData && <Spin size="large"><div style={{ padding: 50 }} /></Spin>}
      {isErrorInitialData && !isLoadingInitialData && <Alert message="Error Memuat Data Awal" description={errorProductions?.message || 'Gagal memuat data aset'} type="error" showIcon />}

      {!isLoadingInitialData && !isErrorInitialData && (
         <Card bodyStyle={{ padding: 0 }}>
            <Table
                columns={columns}
                dataSource={Array.isArray(filteredProductions) ? filteredProductions : []}
                rowKey="id"
                loading={isLoadingProductions || deleteMutation.isPending}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: 1000 }}
            />
         </Card>
      )}

      <Modal
        title={editingProduction ? 'Edit Data Produksi' : 'Tambah Data Produksi Baru'}
        open={isModalOpen} onCancel={handleCancel} footer={null} destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 24 }}>
          {/* ... (Semua Form.Item Anda tetap sama) ... */}
          <Form.Item name="asset" label="Aset Penghasil" rules={[{ required: true, message: 'Aset harus dipilih!' }]}>
            <Select placeholder="Pilih aset" loading={isLoadingAssets} showSearch optionFilterProp="children">
              {assets?.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
            </Select>
          </Form.Item>
           <Form.Item name="date" label="Tanggal Produksi" rules={[{ required: true, message: 'Tanggal harus dipilih!' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY"/>
          </Form.Item>
          <Flex gap="middle">
             <Form.Item name="quantity" label="Kuantitas" rules={[{ required: true, message: 'Kuantitas tidak boleh kosong!' }]} style={{flexGrow: 1}}>
                <InputNumber style={{ width: '100%' }} min={0} placeholder="Jumlah hasil"/>
            </Form.Item>
             <Form.Item name="unit" label="Unit Satuan" rules={[{ required: true, message: 'Unit tidak boleh kosong!' }]} style={{width: '120px'}}>
                <Input placeholder="Kg, Liter, dll"/>
            </Form.Item>
          </Flex>
          <Form.Item name="unit_price" label="Harga per Unit (Rp)" rules={[{ required: true, message: 'Harga tidak boleh kosong!' }]}>
            <InputNumber style={{ width: '100%' }} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/\$\s?|(,*)/g, '')} min={0} placeholder="Masukkan harga jual per unit" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: 32 }}>
            <Space>
              <Button onClick={handleCancel}>Batal</Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} style={{backgroundColor: '#237804'}}>
                {editingProduction ? 'Simpan Perubahan' : 'Tambah Data'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default function ProductionPage() {
  return (
    <ProtectedRoute>
      <ProductionManagementContent />
    </ProtectedRoute>
  );
}