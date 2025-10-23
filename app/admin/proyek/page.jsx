// Di app/admin/proyek/page.jsx
'use client';

import React, { useState } from 'react';
import {
  Table,        // Menggunakan Tabel untuk data Proyek
  Button,
  Modal,        // Untuk form Tambah/Edit
  Form,
  Input,
  DatePicker,   // Untuk Start/End Date
  InputNumber,  // Untuk Budget
  Typography,
  Flex,
  Space,
  Popconfirm,   // Konfirmasi Hapus
  message,      // Notifikasi Sukses/Gagal
  Spin,         // Loading indicator
  Alert,        // Error indicator
  Card,         // Box Filter
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment'; // Untuk format tanggal
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@/lib/api/project'; //

const { Title, Text } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

// Fungsi helper format Rupiah
const formatRupiah = (value) => {
  if (value == null) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

// Fungsi helper format Tanggal
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return moment(dateString).format('DD/MM/YYYY');
};


// Komponen Utama Halaman Proyek
function ProjectManagementContent() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null); // null = Tambah, object = Edit
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm(); // Untuk mengelola form di modal

  // 1. Fetch Data Proyek
  const { data: projects, isLoading, isError, error } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects, //
  });

  // 2. Mutasi (Tambah, Edit, Hapus)
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']); // Refresh data tabel
      setIsModalOpen(false); // Tutup modal
      setEditingProject(null); // Reset mode edit
      form.resetFields(); // Bersihkan form
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal melakukan aksi'}`);
    },
  };

  const createMutation = useMutation({
    mutationFn: createProject, //
    ...mutationOptions,
    onSuccess: (...args) => {
      message.success('Proyek berhasil ditambahkan');
      mutationOptions.onSuccess(...args);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProject(id, data), //
    ...mutationOptions,
     onSuccess: (...args) => {
      message.success('Proyek berhasil diperbarui');
      mutationOptions.onSuccess(...args);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject, //
    onSuccess: () => {
      message.success('Proyek berhasil dihapus');
      queryClient.invalidateQueries(['projects']);
    },
     onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus proyek'}`);
    },
  });

  // 3. Handler Tombol dan Modal
  const showAddModal = () => {
    setEditingProject(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const showEditModal = (project) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      description: project.description,
      dates: [moment(project.start_date), moment(project.end_date)],
      budget: parseFloat(project.budget), // Pastikan budget adalah angka
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    form.resetFields();
  };

  const handleFormSubmit = (values) => {
    const projectData = {
      name: values.name,
      description: values.description,
      start_date: values.dates[0].format('YYYY-MM-DD'),
      end_date: values.dates[1].format('YYYY-MM-DD'),
      budget: values.budget,
    };

    if (editingProject) {
      // Mode Edit
      updateMutation.mutate({ id: editingProject.id, data: projectData });
    } else {
      // Mode Tambah
      createMutation.mutate(projectData);
    }
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  // 4. Filter Data untuk Pencarian
   const filteredProjects = React.useMemo(() => {
    if (!projects) return [];
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);


  // 5. Definisi Kolom Tabel
  const columns = [
    {
      title: 'Nama Proyek',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Tanggal Mulai',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (text) => formatDate(text),
      sorter: (a, b) => moment(a.start_date).unix() - moment(b.start_date).unix(),
    },
    {
      title: 'Tanggal Selesai',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (text) => formatDate(text),
       sorter: (a, b) => moment(a.end_date).unix() - moment(b.end_date).unix(),
    },
    {
      title: 'Anggaran',
      dataIndex: 'budget',
      key: 'budget',
      render: (text) => formatRupiah(text),
      sorter: (a, b) => parseFloat(a.budget) - parseFloat(b.budget),
      align: 'right', // Rata kanan untuk angka
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Hapus Proyek"
            description="Apakah Anda yakin ingin menghapus proyek ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya, Hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
          >
            <Button danger icon={<DeleteOutlined />}>
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
      align: 'center',
    },
  ];

  return (
    <>
      {/* 1. Page Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}>
            Manajemen Proyek
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Kelola semua proyek yang sedang berjalan atau sudah selesai.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ backgroundColor: '#237804', borderRadius: '24px', height: 'auto', padding: '8px 16px', fontSize: '16px' }}
          onClick={showAddModal}
          loading={createMutation.isPending || updateMutation.isPending}
        >
          Tambah Proyek
        </Button>
      </Flex>

      {/* 2. Box Pencarian */}
       <Card style={{ marginBottom: 24 }}>
        <Search
            placeholder="Cari nama proyek..."
            allowClear
            enterButton={<Button type="primary" icon={<SearchOutlined />} style={{backgroundColor: '#237804'}} />}
            size="large"
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 400 }}
         />
      </Card>


      {/* 3. Tabel Data Proyek */}
      {isLoading && <Spin size="large"><div style={{ padding: 50 }} /></Spin>}
      {isError && <Alert message="Error Memuat Data" description={error.message} type="error" showIcon closable />}
      {!isLoading && !isError && (
        <Card>
            <Table
            columns={columns}
            dataSource={filteredProjects}
            rowKey="id"
            loading={isLoading || deleteMutation.isPending}
            pagination={{ pageSize: 10 }} // Atur jumlah item per halaman
            />
        </Card>
      )}

      {/* 4. Modal Tambah/Edit Proyek */}
      <Modal
        title={editingProject ? 'Edit Proyek' : 'Tambah Proyek Baru'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null} // Footer diatur di dalam Form
        destroyOnHidden // Reset form saat modal ditutup
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="Nama Proyek"
            rules={[{ required: true, message: 'Nama proyek tidak boleh kosong!' }]}
          >
            <Input placeholder="Masukkan nama proyek" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Deskripsi"
            rules={[{ required: true, message: 'Deskripsi tidak boleh kosong!' }]}
          >
            <Input.TextArea rows={4} placeholder="Masukkan deskripsi singkat proyek" />
          </Form.Item>
          <Form.Item
            name="dates"
            label="Periode Proyek"
            rules={[{ required: true, message: 'Tanggal mulai dan selesai harus dipilih!' }]}
          >
            <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY"/>
          </Form.Item>
           <Form.Item
            name="budget"
            label="Anggaran (Rp)"
            rules={[{ required: true, message: 'Anggaran tidak boleh kosong!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
              placeholder="Masukkan total anggaran proyek"
            />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: 32 }}>
            <Space>
              <Button onClick={handleCancel}>Batal</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
                style={{backgroundColor: '#237804'}}
              >
                {editingProject ? 'Simpan Perubahan' : 'Tambah Proyek'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// Bungkus Halaman dengan ProtectedRoute
export default function ProjectPage() {
  return (
    <ProtectedRoute>
      <ProjectManagementContent />
    </ProtectedRoute>
  );
}