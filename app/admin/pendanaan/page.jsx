// Di app/admin/pendanaan/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, DatePicker, InputNumber, Select,
  Typography, Flex, Space, Popconfirm, message, Spin, Alert, Card, Tag,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, BankOutlined,
  // --- Ganti ikon kontak ---
  InfoCircleOutlined, // Untuk Contact Info
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getFundings, createFunding, updateFunding, deleteFunding,
} from '@/lib/api/funding';
import { getFundingSources, createFundingSource } from '@/lib/api/funding_source';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// Helper format
const formatRupiah = (value) => value ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';
const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';

// Mapping Status (Sudah Benar)
const statusColors = { available: 'blue', allocated: 'orange', used: 'red' };
const statusLabels = { available: 'Tersedia', allocated: 'Teralokasi', used: 'Terpakai' };

// --- PERBAIKAN FINAL v2: Mapping Tipe Sumber Dana Sesuai Model Backend ---
const SOURCE_TYPE_MAP = {
  'foundation': 'Yayasan',
  'csr': 'CSR',
  'investor': 'Investor',
  // Tambahkan 'lainnya' jika diperlukan, tapi backend tidak punya 'other'
};


// --- MODAL FORM SUMBER DANA BARU (Dengan Perbaikan Field) ---
const FundingSourceFormModal = ({ open, onCancel, onSubmit, isSubmitting, form }) => (
  <Modal
    title="Tambah Sumber Dana Baru" open={open} onCancel={onCancel} footer={null}
    width={500} zIndex={1001} destroyOnClose
  >
    <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 24 }}>
      <Form.Item label="Nama Sumber Dana" name="name" rules={[{ required: true, message: 'Nama wajib diisi' }]}>
        <Input prefix={<BankOutlined />} placeholder="cth: Yayasan XYZ, PT ABC (CSR)" />
      </Form.Item>
      <Form.Item label="Tipe Sumber" name="type" rules={[{ required: true, message: 'Tipe wajib dipilih' }]}>
        {/* --- Gunakan value lowercase sesuai SOURCE_TYPE_MAP --- */}
        <Select placeholder="Pilih tipe sumber dana">
          {Object.entries(SOURCE_TYPE_MAP).map(([value, label]) => (
            <Option key={value} value={value}>{label}</Option>
          ))}
        </Select>
      </Form.Item>
      {/* --- PERBAIKAN: Gunakan field 'contact_info' (TextArea) dan buat wajib --- */}
      <Form.Item label="Info Kontak" name="contact_info" rules={[{ required: true, message: 'Info kontak wajib diisi' }]}>
        <Input.TextArea
           prefix={<InfoCircleOutlined />} // Ganti ikon jika perlu
           placeholder="Masukkan detail kontak (cth: Nama PIC, No HP, Email, Alamat)"
           rows={4}
        />
      </Form.Item>
      {/* Hapus field contact_person, contact_email, notes */}
      <Form.Item style={{ textAlign: 'right', marginTop: 16, marginBottom: 0 }}>
        <Space>
          <Button onClick={onCancel}>Batal</Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Simpan Sumber Dana
          </Button>
        </Space>
      </Form.Item>
    </Form>
  </Modal>
);


// Komponen Utama Halaman Pendanaan (Sisanya sama seperti refactor v1)
function FundingManagementContent() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFunding, setEditingFunding] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('semua');
  const [selectedStatus, setSelectedStatus] = useState('semua');
  const [form] = Form.useForm();
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [sourceForm] = Form.useForm();

  // Fetch Data
  const { data: fundings, isLoading: isLoadingFundings, isError: isErrorFundings, error: errorFundings } = useQuery({ queryKey: ['fundings'], queryFn: getFundings });
  const { data: fundingSources, isLoading: isLoadingSources, isError: isErrorSources, error: errorSources } = useQuery({ queryKey: ['fundingSources'], queryFn: getFundingSources });

  const sourceMap = React.useMemo(() => {
    if (!fundingSources) return {};
    return fundingSources.reduce((acc, source) => { acc[source.id] = source.name; return acc; }, {});
  }, [fundingSources]);

  // Mutasi Pendanaan
  const mutationOptions = {
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fundings'] }); setIsModalOpen(false); setEditingFunding(null); form.resetFields(); },
    onError: (err) => { message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal'}`); },
  };
  const createMutation = useMutation({ mutationFn: createFunding, ...mutationOptions, onSuccess: (...args) => { message.success('Pendanaan berhasil ditambahkan'); mutationOptions.onSuccess(...args); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateFunding(id, data), ...mutationOptions, onSuccess: (...args) => { message.success('Pendanaan berhasil diperbarui'); mutationOptions.onSuccess(...args); } });
  const deleteMutation = useMutation({ mutationFn: deleteFunding, onSuccess: () => { message.success('Pendanaan berhasil dihapus'); queryClient.invalidateQueries({ queryKey: ['fundings'] }); }, onError: (err) => { message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`); } });

  // Mutasi Sumber Dana
  const createSourceMutation = useMutation({
    mutationFn: createFundingSource,
    onSuccess: (newSource) => {
      message.success(`Sumber Dana "${newSource.name}" berhasil ditambahkan`);
      queryClient.invalidateQueries({ queryKey: ['fundingSources'] });
      setIsSourceModalOpen(false);
      sourceForm.resetFields();
      form.setFieldsValue({ source: newSource.id });
    },
    onError: (err) => {
      let errorMsg = 'Gagal menambahkan sumber dana.';
      if (err.response?.data) {
        const errors = err.response.data;
        const messages = Object.entries(errors).map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(', ')}`).join('; ');
        errorMsg = messages || 'Gagal menambahkan sumber dana.';
      } else { errorMsg = err.message || 'Gagal menambahkan sumber dana.'; }
      message.error(`Error: ${errorMsg}`, 6);
    }
  });

  // Handlers Modal Pendanaan
  const showAddModal = () => { setEditingFunding(null); form.resetFields(); setIsModalOpen(true); };
  const showEditModal = (funding) => { setEditingFunding(funding); form.setFieldsValue({ source: funding.source, amount: parseFloat(funding.amount), date_received: moment(funding.date_received), purpose: funding.purpose, status: funding.status }); setIsModalOpen(true); };
  const handleCancel = () => { setIsModalOpen(false); setEditingFunding(null); form.resetFields(); };
  const handleFormSubmit = (values) => {
    const fundingData = { source: values.source, amount: values.amount, date_received: values.date_received.format('YYYY-MM-DD'), purpose: values.purpose, status: values.status };
    if (editingFunding) { updateMutation.mutate({ id: editingFunding.id, data: fundingData }); } else { createMutation.mutate(fundingData); }
  };
  const handleDelete = (id) => { deleteMutation.mutate(id); };

  // Handlers Modal Sumber Dana
  const handleShowSourceModal = () => { setIsSourceModalOpen(true); };
  const handleCancelSourceModal = () => { setIsSourceModalOpen(false); sourceForm.resetFields(); };
  const handleSourceFormSubmit = (values) => { createSourceMutation.mutate(values); };

  // Filter Data
  const filteredFundings = React.useMemo(() => {
    if (!fundings) return [];
    return fundings.filter(f => {
      const sourceName = sourceMap[f.source] || '';
      const matchesSearch = sourceName.toLowerCase().includes(searchTerm.toLowerCase()) || (f.purpose && f.purpose.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSource = selectedSource === 'semua' || f.source === parseInt(selectedSource);
      const matchesStatus = selectedStatus === 'semua' || f.status === selectedStatus;
      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [fundings, searchTerm, selectedSource, selectedStatus, sourceMap]);

  // Kolom Tabel
  const columns = [
    { title: 'Sumber Dana', dataIndex: 'source', key: 'source', render: (sourceId) => sourceMap[sourceId] || 'Tidak Diketahui', sorter: (a, b) => (sourceMap[a.source] || '').localeCompare(sourceMap[b.source] || ''), filters: fundingSources ? [...fundingSources.map(s => ({ text: s.name, value: s.id }))] : [], onFilter: (value, record) => record.source === value },
    { title: 'Jumlah', dataIndex: 'amount', key: 'amount', render: (text) => formatRupiah(text), sorter: (a, b) => parseFloat(a.amount) - parseFloat(b.amount), align: 'right' },
    { title: 'Tgl Diterima', dataIndex: 'date_received', key: 'date_received', render: (text) => formatDate(text), sorter: (a, b) => moment(a.date_received).unix() - moment(b.date_received).unix() },
    { title: 'Tujuan', dataIndex: 'purpose', key: 'purpose', ellipsis: true },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => (<Tag color={statusColors[status] || 'default'}>{statusLabels[status] || status}</Tag>), filters: [{ text: 'Tersedia', value: 'available' }, { text: 'Teralokasi', value: 'allocated' }, { text: 'Terpakai', value: 'used' }], onFilter: (value, record) => record.status === value },
    { title: 'Aksi', key: 'action', render: (_, record) => (<Space size="middle"><Button icon={<EditOutlined />} onClick={() => showEditModal(record)} /><Popconfirm title="Hapus Pendanaan" description="Yakin hapus data ini?" onConfirm={() => handleDelete(record.id)} okText="Ya" cancelText="Tidak" okButtonProps={{ danger: true, loading: deleteMutation.isPending && deleteMutation.variables === record.id }}><Button danger icon={<DeleteOutlined />} /></Popconfirm></Space>), align: 'center' },
  ];

  const isLoading = isLoadingFundings || isLoadingSources;

  return (
    <>
      {/* Header Halaman */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div><Title level={2} style={{ margin: 0, color: '#111928' }}><BankOutlined style={{ marginRight: '8px' }} /> Manajemen Pendanaan</Title><Text type="secondary" style={{ fontSize: '16px' }}>Kelola sumber dan alokasi dana.</Text></div>
        <Button type="primary" icon={<PlusOutlined />} size="large" style={{ backgroundColor: '#237804', borderRadius: '24px', height: 'auto', padding: '8px 16px', fontSize: '16px' }} onClick={showAddModal} loading={createMutation.isPending || updateMutation.isPending}>Tambah Pendanaan</Button>
      </Flex>

      {/* Filter & Search */}
      <Card style={{ marginBottom: 24 }}>
         <Flex gap="middle" wrap="wrap">
            <Search placeholder="Cari sumber/tujuan..." allowClear enterButton={<Button type="primary" icon={<SearchOutlined />} style={{backgroundColor: '#237804'}} />} size="large" onChange={(e) => setSearchTerm(e.target.value)} style={{ flexGrow: 1, minWidth: 250 }} />
            <Select defaultValue="semua" size="large" style={{ minWidth: 200 }} onChange={(value) => setSelectedSource(value)} loading={isLoadingSources} placeholder="Filter Sumber">
                <Option value="semua">Semua Sumber</Option>
                {fundingSources?.map(s => <Option key={s.id} value={s.id.toString()}>{s.name}</Option>)}
            </Select>
             <Select defaultValue="semua" size="large" style={{ minWidth: 150 }} onChange={(value) => setSelectedStatus(value)} placeholder="Filter Status">
                <Option value="semua">Semua Status</Option>
                <Option value="available">Tersedia</Option>
                <Option value="allocated">Teralokasi</Option>
                <Option value="used">Terpakai</Option>
            </Select>
         </Flex>
      </Card>

      {/* Tabel Data */}
      {isLoading && <Spin size="large"><div style={{ padding: 50, textAlign: 'center' }} /></Spin>}
      {(isErrorFundings || isErrorSources) && !isLoading && <Alert message="Error Memuat Data" description={errorFundings?.message || errorSources?.message} type="error" showIcon />}
      {!isLoading && !isErrorFundings && !isErrorSources && (
        <Card bodyStyle={{ padding: 0 }}>
            <Table columns={columns} dataSource={filteredFundings} rowKey="id" loading={deleteMutation.isPending} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 'max-content' }} />
        </Card>
      )}

      {/* Modal Tambah/Edit Pendanaan (Utama) */}
      <Modal title={editingFunding ? 'Edit Pendanaan' : 'Tambah Pendanaan Baru'} open={isModalOpen} onCancel={handleCancel} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 24 }}>
          <Form.Item name="source" label="Sumber Dana" rules={[{ required: true, message: 'Sumber harus dipilih!' }]}>
            <Select placeholder="Pilih sumber dana" loading={isLoadingSources} showSearch optionFilterProp="children" filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
              {/* --- PERBAIKAN: Tampilkan label dari SOURCE_TYPE_MAP --- */}
              {fundingSources?.map(s => <Option key={s.id} value={s.id}>{s.name} ({SOURCE_TYPE_MAP[s.type] || s.type})</Option>)}
            </Select>
          </Form.Item>
          <Button type="link" icon={<PlusOutlined />} onClick={handleShowSourceModal} style={{ paddingLeft: 0, marginTop: '-16px', marginBottom: '16px' }} loading={createSourceMutation.isPending}>Tambah Sumber Dana Baru</Button>
          <Form.Item name="amount" label="Jumlah (Rp)" rules={[{ required: true, message: 'Jumlah tidak boleh kosong!' }]}>
            <InputNumber style={{ width: '100%' }} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/\$\s?|(,*)/g, '')} min={0} placeholder="Masukkan jumlah dana" />
          </Form.Item>
          <Form.Item name="date_received" label="Tanggal Diterima" rules={[{ required: true, message: 'Tanggal harus dipilih!' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY"/>
          </Form.Item>
          <Form.Item name="purpose" label="Tujuan/Deskripsi" rules={[{ required: true, message: 'Tujuan tidak boleh kosong!' }]}>
            <Input.TextArea rows={3} placeholder="Jelaskan tujuan pendanaan" />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Status harus dipilih!' }]}>
            <Select placeholder="Pilih status dana" defaultValue="available">
              <Option value="available">Tersedia</Option>
              <Option value="allocated">Teralokasi</Option>
              <Option value="used">Terpakai</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: 32 }}>
            <Space><Button onClick={handleCancel}>Batal</Button><Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} style={{backgroundColor: '#237804'}}>{editingFunding ? 'Simpan Perubahan' : 'Tambah Pendanaan'}</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Tambah Sumber Dana (Kedua) */}
      <FundingSourceFormModal open={isSourceModalOpen} form={sourceForm} onCancel={handleCancelSourceModal} onSubmit={handleSourceFormSubmit} isSubmitting={createSourceMutation.isPending} />
    </>
  );
}

// Bungkus dengan ProtectedRoute
export default function FundingPage() {
  return ( <ProtectedRoute> <FundingManagementContent /> </ProtectedRoute> );
}