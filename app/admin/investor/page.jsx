// File: app/admin/investor/page.jsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Input, DatePicker, InputNumber,
  Typography, Flex, Space, Popconfirm, message, Spin, Alert, Card, Tag
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined
} from '@ant-design/icons';
import { HiUserGroup } from 'react-icons/hi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getInvestors, createInvestor, updateInvestor, deleteInvestor
} from '@/lib/api/investor';

const { Title, Text } = Typography;
const { Search } = Input;

// Helper format
const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => value ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';

// Komponen Utama Halaman Investor
function InvestorManagementContent() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  // --- Fetch Data ---
  const { data: investors, isLoading, isError, error } = useQuery({
    queryKey: ['investors'],
    queryFn: getInvestors,
  });

  // --- Mutasi ---
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      setIsModalOpen(false);
      setEditingInvestor(null);
      form.resetFields();
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal'}`);
    },
  };

  const createMutation = useMutation({
    mutationFn: createInvestor,
    ...mutationOptions,
    onSuccess: (...args) => {
      message.success('Investor berhasil ditambahkan');
      mutationOptions.onSuccess(...args);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateInvestor(id, data),
    ...mutationOptions,
    onSuccess: (...args) => {
      message.success('Investor berhasil diperbarui');
      mutationOptions.onSuccess(...args);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvestor,
    onSuccess: () => {
      message.success('Investor berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['investors'] });
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`);
    },
  });

  // --- Handlers ---
  const showAddModal = () => {
    setEditingInvestor(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const showEditModal = (investor) => {
    setEditingInvestor(investor);
    form.setFieldsValue({
      contact: investor.contact,
      join_date: moment(investor.join_date),
      total_investment: parseFloat(investor.total_investment),
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingInvestor(null);
    form.resetFields();
  };

  const handleFormSubmit = (values) => {
    const investorData = {
      contact: values.contact,
      join_date: values.join_date.format('YYYY-MM-DD'),
      total_investment: values.total_investment,
    };

    if (editingInvestor) {
      updateMutation.mutate({ id: editingInvestor.id, data: investorData });
    } else {
      createMutation.mutate(investorData);
    }
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  // --- Filter Data ---
  const filteredInvestors = useMemo(() => {
    if (!investors) return [];
    return investors.filter(inv => {
      const contactMatch = inv.contact?.toLowerCase().includes(searchTerm.toLowerCase());
      const userMatch = inv.user?.toString().includes(searchTerm);
      return contactMatch || userMatch;
    });
  }, [investors, searchTerm]);

  // --- Kolom Tabel ---
  const columns = [
    {
      title: 'User ID',
      dataIndex: 'user',
      key: 'user',
      render: (userId) => <Tag color="blue">User #{userId}</Tag>,
      width: 120,
    },
    {
      title: 'Kontak',
      dataIndex: 'contact',
      key: 'contact',
      ellipsis: true,
    },
    {
      title: 'Tanggal Bergabung',
      dataIndex: 'join_date',
      key: 'join_date',
      render: formatDate,
      sorter: (a, b) => moment(a.join_date).unix() - moment(b.join_date).unix(),
      width: 150,
    },
    {
      title: 'Total Investasi',
      dataIndex: 'total_investment',
      key: 'total_investment',
      render: formatRupiah,
      sorter: (a, b) => parseFloat(a.total_investment) - parseFloat(b.total_investment),
      align: 'right',
      width: 180,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          <Popconfirm
            title="Hapus Investor?"
            description="Yakin hapus data ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Header Halaman */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}>
            <HiUserGroup style={{ marginRight: '8px', verticalAlign: 'middle', fontSize: '24px' }} />
            Manajemen Investor
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Kelola data profil investor yang terdaftar.
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
          Tambah Investor
        </Button>
      </Flex>

      {/* Filter & Search */}
      <Card style={{ marginBottom: 24 }}>
        <Search
          placeholder="Cari kontak atau User ID..."
          allowClear
          enterButton={<Button type="primary" icon={<SearchOutlined />} style={{ backgroundColor: '#237804' }} />}
          size="large"
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </Card>

      {/* Tabel Data */}
      {isLoading && <Spin size="large"><div style={{ padding: 50 }} /></Spin>}
      {isError && !isLoading && (
        <Alert message="Error Memuat Data" description={error?.message} type="error" showIcon />
      )}

      {!isLoading && !isError && (
        <Card bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={Array.isArray(filteredInvestors) ? filteredInvestors : []}
            rowKey="id"
            loading={isLoading || deleteMutation.isPending}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 900 }}
          />
        </Card>
      )}

      {/* Modal Tambah/Edit */}
      <Modal
        title={editingInvestor ? 'Edit Investor' : 'Tambah Investor Baru'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 24 }}>
          <Form.Item
            name="contact"
            label="Kontak"
            rules={[{ required: true, message: 'Kontak tidak boleh kosong!' }]}
          >
            <Input.TextArea rows={3} placeholder="Email, telepon, atau info kontak lainnya" />
          </Form.Item>

          <Form.Item
            name="join_date"
            label="Tanggal Bergabung"
            rules={[{ required: true, message: 'Tanggal harus dipilih!' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="total_investment"
            label="Total Investasi (Rp)"
            rules={[{ required: true, message: 'Total investasi tidak boleh kosong!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
              placeholder="Masukkan total investasi"
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: 32 }}>
            <Space>
              <Button onClick={handleCancel}>Batal</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
                style={{ backgroundColor: '#237804' }}
              >
                {editingInvestor ? 'Simpan Perubahan' : 'Tambah Investor'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default function InvestorPage() {
  return (
    <ProtectedRoute>
      <InvestorManagementContent />
    </ProtectedRoute>
  );
}