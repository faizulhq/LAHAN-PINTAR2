// File: faizulhq/lahan-pintar2/LAHAN-PINTAR2-dfe2664682ace9537893ea0569b86e928b07e701/app/admin/pengeluaran/page.jsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Select, InputNumber, DatePicker,
  Input, Typography, Flex, Space, Popconfirm, message, Spin, Alert, Card, Tag
  // Hapus 'Upload'
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, 
  MoneyCollectOutlined, LinkOutlined // <-- Ganti UploadOutlined dengan LinkOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import {
  getExpenses, createExpense, updateExpense, deleteExpense,
} from '@/lib/api/expense';
import { getProjects } from '@/lib/api/project';
import { getAssets } from '@/lib/api/asset';
import { getFundings } from '@/lib/api/funding';
import { getFundingSources } from '@/lib/api/funding_source';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => value ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';

// --- DAPATKAN BASE URL BACKEND ---
// (Ini tidak lagi diperlukan jika Anda menyimpan URL lengkap)
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const expenseCategories = {
    'material': 'Material',
    'tenaga kerja': 'Tenaga Kerja',
    'transport': 'Transport',
    'feed': 'Pakan',
    'perawatan': 'Perawatan',
    'tools': 'Alat dan Perlengkapan',
    'other': 'Lain-Lain',
};

function ExpenseManagementContent() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [form] = Form.useForm();
  // const [fileList, setFileList] = useState([]); // <-- HAPUS State ini

  const user = useAuthStore((state) => state.user);
  const isAdmin = useMemo(() => user?.role === 'Admin' || user?.role === 'Superadmin', [user]);
  const isOperator = useMemo(() => user?.role === 'Operator', [user]);

  const enabledForAdminOrOperator = isAdmin || isOperator;

  const { data: expenses, isLoading: isLoadingExpenses, isError: isErrorExpenses, error: errorExpenses } = useQuery({
    queryKey: ['expenses'], queryFn: getExpenses,
  });
  
  const { data: projects, isLoading: isLoadingProjects } = useQuery({ 
    queryKey: ['projects'], 
    queryFn: getProjects,
    enabled: enabledForAdminOrOperator
  });
  const { data: assets, isLoading: isLoadingAssets } = useQuery({ 
    queryKey: ['assets'], 
    queryFn: getAssets,
    enabled: enabledForAdminOrOperator
  });
  const { data: fundings, isLoading: isLoadingFundings } = useQuery({ 
    queryKey: ['fundings'], 
    queryFn: getFundings,
    enabled: enabledForAdminOrOperator
  });
  const { data: fundingSources, isLoading: isLoadingSources } = useQuery({ 
    queryKey: ['fundingSources'], 
    queryFn: getFundingSources,
    enabled: enabledForAdminOrOperator
  });

  const projectAssetMap = useMemo(() => {
    if (!projects || !assets) return {};
    const assetMap = assets.reduce((acc, a) => { acc[a.id] = a.name; return acc; }, {});
    return projects.reduce((acc, p) => {
        acc[p.id] = assetMap[p.asset] || '-';
        return acc;
    }, {});
  }, [projects, assets]);

  const projectMap = useMemo(() => projects ? projects.reduce((acc, p) => { acc[p.id] = p.name; return acc; }, {}) : {}, [projects]);
  const sourceMap = useMemo(() => fundingSources ? fundingSources.reduce((acc, s) => { acc[s.id] = s.name; return acc; }, {}) : {}, [fundingSources]);
  const fundingMap = useMemo(() => {
     if (!fundings || !sourceMap) return {};
     return fundings.reduce((acc, f) => {
         acc[f.id] = `${sourceMap[f.source] || 'Unknown'} - ${formatRupiah(f.amount)}`;
         return acc;
     }, {});
  }, [fundings, sourceMap]);
  
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsModalOpen(false); setEditingExpense(null); form.resetFields(); 
      // setFileList([]); // <-- HAPUS
    },
    onError: (err) => { 
        const errorDetail = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message || 'Gagal';
        message.error(`Error: ${errorDetail}`); 
    },
  };
  const createMutation = useMutation({ mutationFn: createExpense, ...mutationOptions, onSuccess: (...args) => { message.success('Pengeluaran berhasil ditambahkan'); mutationOptions.onSuccess(...args); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateExpense(id, data), ...mutationOptions, onSuccess: (...args) => { message.success('Pengeluaran berhasil diperbarui'); mutationOptions.onSuccess(...args); } });
  const deleteMutation = useMutation({ mutationFn: deleteExpense, onSuccess: () => { message.success('Pengeluaran berhasil dihapus'); queryClient.invalidateQueries({ queryKey: ['expenses'] }); }, onError: (err) => { message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`); } });

  const showAddModal = () => { setEditingExpense(null); form.resetFields(); setIsModalOpen(true); };
  const showEditModal = (expense) => {
    setEditingExpense(expense);
    // setFileList([]); // <-- HAPUS
    
    form.setFieldsValue({
      category: expense.category,
      amount: parseFloat(expense.amount),
      date: moment(expense.date),
      description: expense.description,
      project_id: expense.project_id,
      funding_id: expense.funding_id,
      proof_url: expense.proof_url, // <-- TAMBAHKAN INI
    });
    setIsModalOpen(true);
  };
  const handleCancel = () => { setIsModalOpen(false); setEditingExpense(null); form.resetFields(); };
  
  // --- PERUBAHAN BESAR DI SINI (KEMBALI KE JSON) ---
  const handleFormSubmit = async (values) => {
    
    const expenseData = {
      category: values.category,
      amount: values.amount,
      date: values.date.format('YYYY-MM-DD'),
      description: values.description,
      proof_url: values.proof_url || null, // Ambil URL dari form
      project_id: values.project_id,
      funding_id: values.funding_id,
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: expenseData });
    } else {
      createMutation.mutate(expenseData);
    }
  };
  // --- BATAS PERUBAHAN ---

  const handleDelete = (id) => { deleteMutation.mutate(id); };

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'semua' || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, selectedCategory]);

  const columns = [
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
    { 
      title: 'Proyek', 
      dataIndex: 'project_id', 
      key: 'project_id', 
      render: (id) => projectMap[id] || `ID ${id}`, 
      width: 150, 
      ellipsis: true 
    },
    { 
      title: 'Aset', 
      dataIndex: 'project_id', 
      key: 'asset', 
      render: (id) => projectAssetMap[id] || '-', 
      width: 150, 
      ellipsis: true,
      hidden: isOperator, 
    },
    { 
      title: 'Dana', 
      dataIndex: 'funding_id', 
      key: 'funding_id', 
      render: (id) => fundingMap[id] || `ID ${id}`, 
      width: 200, 
      ellipsis: true,
      hidden: isOperator, 
    },
    {
      title: 'Bukti', 
      dataIndex: 'proof_url', // <-- Kembali ke proof_url
      key: 'proof_url', 
      width: 100, 
      align: 'center',
      // Pastikan URL-nya lengkap (https://...) agar bisa diklik
      render: (url) => url ? <a href={url} target="_blank" rel="noopener noreferrer"><Button size="small">Lihat</Button></a> : '-',
    },
    {
      title: 'Aksi', key: 'action', width: 120, align: 'center', fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {isAdmin && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => showEditModal(record)} />
              <Popconfirm title="Hapus Pengeluaran?" onConfirm={() => handleDelete(record.id)} okText="Ya" cancelText="Tidak" okButtonProps={{ danger: true, loading: deleteMutation.isPending }}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ].filter(col => !col.hidden);

  const isLoadingInitialData = isLoadingExpenses || (enabledForAdminOrOperator && (isLoadingProjects || isLoadingAssets || isLoadingFundings || isLoadingSources));
  const isErrorInitialData = isErrorExpenses;

  // const uploadProps = { ... }; // <-- HAPUS Variabel ini

  return (
    <>
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
        open={isModalOpen} onCancel={handleCancel} footer={null} destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 24 }}>
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
           <Form.Item name="funding_id" label="Sumber Dana Digunakan" rules={[{ required: true, message: 'Sumber dana harus dipilih!' }]}>
            <Select placeholder="Pilih sumber dana yang digunakan" loading={isLoadingFundings || isLoadingSources} showSearch optionFilterProp="children">
              {fundings?.map(f => <Option key={f.id} value={f.id}>{fundingMap[f.id]}</Option>)}
            </Select>
          </Form.Item>
          
          {/* --- PERUBAHAN: Ganti <Upload> menjadi <Input> --- */}
          <Form.Item 
            name="proof_url" 
            label="URL Bukti (Opsional)"
            rules={[{ type: 'url', message: 'Silakan masukkan URL yang valid' }]}
          >
             <Input prefix={<LinkOutlined />} placeholder="https://docs.google.com/..." />
          </Form.Item>
          {/* --- BATAS PERUBAHAN --- */}

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