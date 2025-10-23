// Di app/admin/pendanaan/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select, // Untuk Source & Status
  Typography,
  Flex,
  Space,
  Popconfirm,
  message,
  Spin,
  Alert,
  Card,
  Tag,    // Untuk Status
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BankOutlined, // Ikon Pendanaan
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getFundings,
  createFunding,
  updateFunding,
  deleteFunding,
} from '@/lib/api/funding'; //
import { getFundingSources } from '@/lib/api/funding_source'; //

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// Helper format
const formatRupiah = (value) => value ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';
const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';

// Mapping Status ke Warna Tag
const statusColors = {
  avaliable: 'blue',
  allocated: 'orange',
  used: 'red',
};
const statusLabels = {
  avaliable: 'Tersedia',
  allocated: 'Teralokasi',
  used: 'Terpakai',
};


// Komponen Utama Halaman Pendanaan
function FundingManagementContent() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFunding, setEditingFunding] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('semua');
  const [selectedStatus, setSelectedStatus] = useState('semua');
  const [form] = Form.useForm();

  // 1. Fetch Data Pendanaan & Sumber Pendanaan
  const { data: fundings, isLoading: isLoadingFundings, isError: isErrorFundings, error: errorFundings } = useQuery({
    queryKey: ['fundings'],
    queryFn: getFundings,
  });

  const { data: fundingSources, isLoading: isLoadingSources, isError: isErrorSources, error: errorSources } = useQuery({
    queryKey: ['fundingSources'],
    queryFn: getFundingSources,
  });

  // Buat map dari ID sumber ke nama sumber untuk tampilan tabel
  const sourceMap = React.useMemo(() => {
    if (!fundingSources) return {};
    return fundingSources.reduce((acc, source) => {
      acc[source.id] = source.name;
      return acc;
    }, {});
  }, [fundingSources]);


  // 2. Mutasi (Tambah, Edit, Hapus)
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries(['fundings']);
      setIsModalOpen(false);
      setEditingFunding(null);
      form.resetFields();
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal'}`);
    },
  };

  const createMutation = useMutation({
    mutationFn: createFunding,
    ...mutationOptions,
    onSuccess: (...args) => { message.success('Pendanaan berhasil ditambahkan'); mutationOptions.onSuccess(...args); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateFunding(id, data),
    ...mutationOptions,
     onSuccess: (...args) => { message.success('Pendanaan berhasil diperbarui'); mutationOptions.onSuccess(...args); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFunding,
    onSuccess: () => { message.success('Pendanaan berhasil dihapus'); queryClient.invalidateQueries(['fundings']); },
    onError: (err) => { message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`); },
  });

  // 3. Handler Tombol dan Modal
  const showAddModal = () => {
    setEditingFunding(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const showEditModal = (funding) => {
    setEditingFunding(funding);
    form.setFieldsValue({
      source: funding.source, // ID sumber
      amount: parseFloat(funding.amount),
      date_received: moment(funding.date_received),
      purpose: funding.purpose,
      status: funding.status,
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => { setIsModalOpen(false); setEditingFunding(null); form.resetFields(); };

  const handleFormSubmit = (values) => {
    const fundingData = {
      source: values.source, // Kirim ID sumber
      amount: values.amount,
      date_received: values.date_received.format('YYYY-MM-DD'),
      purpose: values.purpose,
      status: values.status,
    };

    if (editingFunding) {
      updateMutation.mutate({ id: editingFunding.id, data: fundingData });
    } else {
      createMutation.mutate(fundingData);
    }
  };

  const handleDelete = (id) => { deleteMutation.mutate(id); };

  // 4. Filter Data
  const filteredFundings = React.useMemo(() => {
    if (!fundings) return [];
    return fundings.filter(f => {
      const sourceName = sourceMap[f.source] || '';
      const matchesSearch = sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            f.purpose.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSource = selectedSource === 'semua' || f.source === parseInt(selectedSource); // source ID is integer
      const matchesStatus = selectedStatus === 'semua' || f.status === selectedStatus;
      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [fundings, searchTerm, selectedSource, selectedStatus, sourceMap]);

  // 5. Kolom Tabel
  const columns = [
    {
      title: 'Sumber Dana',
      dataIndex: 'source',
      key: 'source',
      render: (sourceId) => sourceMap[sourceId] || 'Tidak Diketahui',
      sorter: (a, b) => (sourceMap[a.source] || '').localeCompare(sourceMap[b.source] || ''),
      // Filter dropdown untuk sumber
      filters: fundingSources ? [
        ...fundingSources.map(s => ({ text: s.name, value: s.id }))
      ] : [],
      onFilter: (value, record) => record.source === value,
    },
    {
      title: 'Jumlah',
      dataIndex: 'amount',
      key: 'amount',
      render: (text) => formatRupiah(text),
      sorter: (a, b) => parseFloat(a.amount) - parseFloat(b.amount),
      align: 'right',
    },
     {
      title: 'Tgl Diterima',
      dataIndex: 'date_received',
      key: 'date_received',
      render: (text) => formatDate(text),
      sorter: (a, b) => moment(a.date_received).unix() - moment(b.date_received).unix(),
    },
    {
      title: 'Tujuan',
      dataIndex: 'purpose',
      key: 'purpose',
      ellipsis: true, // Tampilkan ... jika teks terlalu panjang
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      ),
      filters: [
        { text: 'Tersedia', value: 'avaliable' },
        { text: 'Teralokasi', value: 'allocated' },
        { text: 'Terpakai', value: 'used' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          <Popconfirm
            title="Hapus Pendanaan"
            description="Yakin hapus data ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya" cancelText="Tidak"
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
      align: 'center',
    },
  ];

  return (
    <>
      {/* Header Halaman */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}><BankOutlined /> Manajemen Pendanaan</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>Kelola sumber dan alokasi dana.</Text>
        </div>
        <Button
          type="primary" icon={<PlusOutlined />} size="large"
          style={{ backgroundColor: '#237804', borderRadius: '24px', height: 'auto', padding: '8px 16px', fontSize: '16px' }}
          onClick={showAddModal} loading={createMutation.isPending || updateMutation.isPending}
        >
          Tambah Pendanaan
        </Button>
      </Flex>

      {/* Filter & Search */}
      <Card style={{ marginBottom: 24 }}>
         <Flex gap="middle" wrap="wrap">
            <Search
                placeholder="Cari sumber/tujuan..."
                allowClear enterButton={<Button type="primary" icon={<SearchOutlined />} style={{backgroundColor: '#237804'}} />}
                size="large" onChange={(e) => setSearchTerm(e.target.value)} style={{ flexGrow: 1, minWidth: 250 }}
            />
            <Select
                defaultValue="semua" size="large" style={{ minWidth: 200 }} onChange={(value) => setSelectedSource(value)}
                loading={isLoadingSources} placeholder="Filter Sumber"
            >
                <Option value="semua">Semua Sumber</Option>
                {fundingSources?.map(s => <Option key={s.id} value={s.id.toString()}>{s.name}</Option>)}
            </Select>
             <Select
                defaultValue="semua" size="large" style={{ minWidth: 150 }} onChange={(value) => setSelectedStatus(value)}
                placeholder="Filter Status"
            >
                <Option value="semua">Semua Status</Option>
                <Option value="avaliable">Tersedia</Option>
                <Option value="allocated">Teralokasi</Option>
                <Option value="used">Terpakai</Option>
            </Select>
         </Flex>
      </Card>

      {/* Tabel Data */}
      {(isLoadingFundings || isLoadingSources) && <Spin size="large"><div style={{ padding: 50 }} /></Spin>}
      {(isErrorFundings || isErrorSources) && <Alert message="Error Memuat Data" description={errorFundings?.message || errorSources?.message} type="error" showIcon />}
      {!isLoadingFundings && !isErrorFundings && !isLoadingSources && !isErrorSources && (
        <Card>
            <Table
                columns={columns}
                dataSource={filteredFundings}
                rowKey="id"
                loading={isLoadingFundings || deleteMutation.isPending}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }} // Agar tabel bisa scroll horizontal jika perlu
            />
        </Card>
      )}

      {/* Modal Tambah/Edit */}
      <Modal
        title={editingFunding ? 'Edit Pendanaan' : 'Tambah Pendanaan Baru'}
        open={isModalOpen} onCancel={handleCancel} footer={null} destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 24 }}>
          <Form.Item name="source" label="Sumber Dana" rules={[{ required: true, message: 'Sumber harus dipilih!' }]}>
            <Select placeholder="Pilih sumber dana" loading={isLoadingSources}>
              {fundingSources?.map(s => <Option key={s.id} value={s.id}>{s.name} ({s.type})</Option>)}
            </Select>
          </Form.Item>
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
            <Select placeholder="Pilih status dana">
              <Option value="avaliable">Tersedia</Option>
              <Option value="allocated">Teralokasi</Option>
              <Option value="used">Terpakai</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: 32 }}>
            <Space>
              <Button onClick={handleCancel}>Batal</Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} style={{backgroundColor: '#237804'}}>
                {editingFunding ? 'Simpan Perubahan' : 'Tambah Pendanaan'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// Bungkus dengan ProtectedRoute
export default function FundingPage() {
  return (
    <ProtectedRoute>
      <FundingManagementContent />
    </ProtectedRoute>
  );
}