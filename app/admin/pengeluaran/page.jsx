// File: faizulhq/lahan-pintar2/LAHAN-PINTAR2-9ebe2a759744e60857214f21d26b1c7ae9d0c9aa/app/admin/pengeluaran/page.jsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Select, InputNumber, DatePicker,
  Input, Typography, Flex, Space, Popconfirm, message, Spin, Alert, Card, Tag, Upload
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UploadOutlined,
  MoneyCollectOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore'; // Impor useAuthStore
import {
  getExpenses, createExpense, updateExpense, deleteExpense,
} from '@/lib/api/expense';
// ... (impor API relasi Anda tetap sama) ...
import { getProjects } from '@/lib/api/project';
import { getAssets } from '@/lib/api/asset';
import { getFundings } from '@/lib/api/funding';
import { getFundingSources } from '@/lib/api/funding_source';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

// ... (Helper format dan kategori Anda tetap sama) ...
const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => value ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';

const expenseCategories = {
    'material': 'Material',
    'tenaga kerja': 'Tenaga Kerja',
    'transport': 'Transport',
    'feed': 'Pakan',
    'perawatan': 'Perawatan',
    'tools': 'Alat dan Perlengkapan',
    'other': 'Lain-Lain',
};

// Komponen Utama Halaman Pengeluaran
function ExpenseManagementContent() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  // --- Ambil data user dari store ---
  const user = useAuthStore((state) => state.user);
  const isAdmin = useMemo(() => user?.role === 'Admin' || user?.role === 'Superadmin', [user]);

  // --- Fetch Data --- (tetap sama)
  const { data: expenses, isLoading: isLoadingExpenses, isError: isErrorExpenses, error: errorExpenses } = useQuery({
    queryKey: ['expenses'], queryFn: getExpenses,
  });
  // ... (sisa fetch data relasi tetap sama) ...
  const { data: projects, isLoading: isLoadingProjects } = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const { data: assets, isLoading: isLoadingAssets } = useQuery({ queryKey: ['assets'], queryFn: getAssets });
  const { data: fundings, isLoading: isLoadingFundings } = useQuery({ queryKey: ['fundings'], queryFn: getFundings });
  const { data: fundingSources, isLoading: isLoadingSources } = useQuery({ queryKey: ['fundingSources'], queryFn: getFundingSources });

  // --- Data Mapping --- (tetap sama)
  const projectMap = useMemo(() => projects ? projects.reduce((acc, p) => { acc[p.id] = p.name; return acc; }, {}) : {}, [projects]);
  const assetMap = useMemo(() => assets ? assets.reduce((acc, a) => { acc[a.id] = a.name; return acc; }, {}) : {}, [assets]);
  const sourceMap = useMemo(() => fundingSources ? fundingSources.reduce((acc, s) => { acc[s.id] = s.name; return acc; }, {}) : {}, [fundingSources]);
  const fundingMap = useMemo(() => {
     if (!fundings || !sourceMap) return {};
     return fundings.reduce((acc, f) => {
         acc[f.id] = `${sourceMap[f.source] || 'Unknown'} - ${formatRupiah(f.amount)}`;
         return acc;
     }, {});
  }, [fundings, sourceMap]);
  
  // --- Mutasi --- (tetap sama)
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsModalOpen(false); setEditingExpense(null); form.resetFields(); setFileList([]);
    },
    onError: (err) => { message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal'}`); },
  };
  const createMutation = useMutation({ mutationFn: createExpense, ...mutationOptions, onSuccess: (...args) => { message.success('Pengeluaran berhasil ditambahkan'); mutationOptions.onSuccess(...args); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateExpense(id, data), ...mutationOptions, onSuccess: (...args) => { message.success('Pengeluaran berhasil diperbarui'); mutationOptions.onSuccess(...args); } });
  const deleteMutation = useMutation({ mutationFn: deleteExpense, onSuccess: () => { message.success('Pengeluaran berhasil dihapus'); queryClient.invalidateQueries({ queryKey: ['expenses'] }); }, onError: (err) => { message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`); } });

  // --- Handlers --- (tetap sama)
  const showAddModal = () => { setEditingExpense(null); form.resetFields(); setFileList([]); setIsModalOpen(true); };
  const showEditModal = (expense) => {
    // ... (sisa handler tetap sama) ...
    setEditingExpense(expense);
    setFileList([]); 
    form.setFieldsValue({
      category: expense.category,
      amount: parseFloat(expense.amount),
      date: moment(expense.date),
      description: expense.description,
      project_id: expense.project_id,
      funding_id: expense.funding_id,
      asset_id: expense.asset_id,
    });
    setIsModalOpen(true);
  };
  const handleCancel = () => { setIsModalOpen(false); setEditingExpense(null); form.resetFields(); setFileList([]); };
  const handleFormSubmit = async (values) => {
    // ... (sisa handler tetap sama) ...
    const proofUrlPlaceholder = fileList.length > 0 ? `/path/to/proof/${fileList[0].name}` : (editingExpense?.proof_url || null);

    const expenseData = {
      category: values.category,
      amount: values.amount,
      date: values.date.format('YYYY-MM-DD'),
      description: values.description,
      proof_url: proofUrlPlaceholder,
      project_id: values.project_id,
      funding_id: values.funding_id,
      asset_id: values.asset_id,
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: expenseData });
    } else {
      createMutation.mutate(expenseData);
    }
  };
  const handleDelete = (id) => { deleteMutation.mutate(id); };

  // --- Filter --- (tetap sama)
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'semua' || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, selectedCategory]);

  // --- Kolom Tabel (DENGAN MODIFIKASI) ---
  const columns = [
    // ... (kolom lain tetap sama) ...
    { title: 'Tanggal', dataIndex: 'date', key: 'date', render: formatDate, sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(), width: 120 },
    {
      title: 'Kategori', dataIndex: 'category', key: 'category',
      render: (cat) => expenseCategories[cat] || cat,
      filters: Object.entries(expenseCategories).map(([value, text]) => ({ text, value })),
      onFilter: (value, record) => record.category === value,
      width: 150,
    },
    { title: 'Deskripsi', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Jumlah', dataIndex: 'amount', key: 'amount', render: formatRupiah, sorter: (a, b) => parseFloat(a.amount) - parseFloat(b.amount), align: 'right', width: 150 },
    { title: 'Proyek', dataIndex: 'project_id', key: 'project_id', render: (id) => projectMap[id] || `ID ${id}`, width: 150, ellipsis: true },
    { title: 'Aset', dataIndex: 'asset_id', key: 'asset_id', render: (id) => assetMap[id] || `ID ${id}`, width: 150, ellipsis: true },
    { title: 'Dana', dataIndex: 'funding_id', key: 'funding_id', render: (id) => fundingMap[id] || `ID ${id}`, width: 200, ellipsis: true },
    {
      title: 'Bukti', dataIndex: 'proof_url', key: 'proof_url', width: 100, align: 'center',
      render: (url) => url ? <a href={url} target="_blank" rel="noopener noreferrer"><Button size="small">Lihat</Button></a> : '-',
    },
    {
      title: 'Aksi', key: 'action', width: 120, align: 'center', fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {/* --- MODIFIKASI DI SINI --- */}
          {isAdmin && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => showEditModal(record)} />
              <Popconfirm title="Hapus Pengeluaran?" onConfirm={() => handleDelete(record.id)} okText="Ya" cancelText="Tidak" okButtonProps={{ danger: true, loading: deleteMutation.isPending }}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
          {/* Jika bukan admin, kolom aksi akan kosong */}
        </Space>
      ),
    },
  ];

  const isLoadingInitialData = isLoadingExpenses || isLoadingProjects || isLoadingAssets || isLoadingFundings || isLoadingSources;
  const isErrorInitialData = isErrorExpenses || !projects || !assets || !fundings || !fundingSources;

  // --- Upload Props --- (tetap sama)
  const uploadProps = {
    onRemove: (file) => { setFileList(current => current.filter(f => f.uid !== file.uid)); },
    beforeUpload: (file) => { setFileList([file]); return false; },
    fileList,
    maxCount: 1,
  };

  return (
    <>
      {/* ... (Header, Filter, Search, Loading, Modal Anda tetap sama) ... */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}><MoneyCollectOutlined /> Manajemen Pengeluaran</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>Catat dan kelola semua biaya operasional.</Text>
        </div>
        <Button
          type="primary" icon={<PlusOutlined />} size="large"
          style={{ backgroundColor: '#237804', borderRadius: '24px', height: 'auto', padding: '8px 16px', fontSize: '16px' }}
          onClick={showAddModal} loading={createMutation.isPending || updateMutation.isPending}
        >
          Tambah Pengeluaran
        </Button>
      </Flex>

      <Card style={{ marginBottom: 24 }}>
         <Flex gap="middle" wrap="wrap">
            <Search
                placeholder="Cari deskripsi..." allowClear
                enterButton={<Button type="primary" icon={<SearchOutlined />} style={{backgroundColor: '#237804'}} />}
                size="large" onChange={(e) => setSearchTerm(e.target.value)} style={{ flexGrow: 1, minWidth: 250 }}
            />
            <Select
                defaultValue="semua" size="large" style={{ minWidth: 200 }} onChange={(value) => setSelectedCategory(value)}
                placeholder="Filter Kategori" allowClear
            >
                <Option value="semua">Semua Kategori</Option>
                {Object.entries(expenseCategories).map(([value, text]) => <Option key={value} value={value}>{text}</Option>)}
            </Select>
         </Flex>
      </Card>

      {isLoadingInitialData && <Spin size="large"><div style={{ padding: 50 }} /></Spin>}
      {isErrorInitialData && !isLoadingInitialData && <Alert message="Error Memuat Data Awal" description={errorExpenses?.message || 'Gagal memuat data relasi'} type="error" showIcon />}
      {!isLoadingInitialData && !isErrorInitialData && (
         <Card bodyStyle={{ padding: 0 }}>
            <Table
                columns={columns}
                dataSource={Array.isArray(filteredExpenses) ? filteredExpenses : []}
                rowKey="id"
                loading={isLoadingExpenses || deleteMutation.isPending}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: 1300 }}
            />
         </Card>
      )}

      <Modal
        title={editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
        open={isModalOpen} onCancel={handleCancel} footer={null} destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 24 }}>
          {/* ... (Semua Form.Item Anda tetap sama) ... */}
          <Form.Item name="category" label="Kategori" rules={[{ required: true, message: 'Kategori harus dipilih!' }]}>
            <Select placeholder="Pilih kategori pengeluaran">
              {Object.entries(expenseCategories).map(([value, text]) => <Option key={value} value={value}>{text}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Jumlah (Rp)" rules={[{ required: true, message: 'Jumlah tidak boleh kosong!' }]}>
            <InputNumber style={{ width: '100%' }} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/\$\s?|(,*)/g, '')} min={0} placeholder="Masukkan jumlah biaya" />
          </Form.Item>
           <Form.Item name="date" label="Tanggal Pengeluaran" rules={[{ required: true, message: 'Tanggal harus dipilih!' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY"/>
          </Form.Item>
           <Form.Item name="description" label="Deskripsi" rules={[{ required: true, message: 'Deskripsi tidak boleh kosong!' }]}>
            <Input.TextArea rows={3} placeholder="Jelaskan detail pengeluaran" />
          </Form.Item>
          <Form.Item name="project_id" label="Proyek Terkait" rules={[{ required: true, message: 'Proyek harus dipilih!' }]}>
            <Select placeholder="Pilih proyek" loading={isLoadingProjects} showSearch optionFilterProp="children">
              {projects?.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
            </Select>
          </Form.Item>
           <Form.Item name="asset_id" label="Aset Terkait" rules={[{ required: true, message: 'Aset harus dipilih!' }]}>
            <Select placeholder="Pilih aset" loading={isLoadingAssets} showSearch optionFilterProp="children">
              {assets?.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
            </Select>
          </Form.Item>
           <Form.Item name="funding_id" label="Sumber Dana Digunakan" rules={[{ required: true, message: 'Sumber dana harus dipilih!' }]}>
            <Select placeholder="Pilih sumber dana yang digunakan" loading={isLoadingFundings || isLoadingSources} showSearch optionFilterProp="children">
              {fundings?.map(f => <Option key={f.id} value={f.id}>{fundingMap[f.id]}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="proof_upload" label="Upload Bukti (Opsional)">
             <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>Pilih File</Button>
            </Upload>
            {editingExpense?.proof_url && fileList.length === 0 && (
                <Text type="secondary" style={{display: 'block', marginTop: 8}}>Bukti tersimpan: <a href={editingExpense.proof_url} target="_blank" rel="noopener noreferrer">Lihat</a></Text>
            )}
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: 32 }}>
            <Space>
              <Button onClick={handleCancel}>Batal</Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} style={{backgroundColor: '#237804'}}>
                {editingExpense ? 'Simpan Perubahan' : 'Tambah Pengeluaran'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default function ExpensePage() {
  return (
    <ProtectedRoute>
      <ExpenseManagementContent />
    </ProtectedRoute>
  );
}