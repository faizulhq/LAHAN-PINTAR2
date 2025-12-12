'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Input, DatePicker, InputNumber, Select,
  Typography, Flex, Space, Popconfirm, message, Spin, Alert, Card
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
import { getAvailableUsersForInvestor } from '@/lib/api/user';
import useAuthStore from '@/lib/store/authStore'; // [RBAC]

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// Helper format
const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => value ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';

function InvestorManagementContent() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  // [RBAC]
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  // --- Fetch Data ---
  const { data: investors, isLoading, isError, error } = useQuery({
    queryKey: ['investors'],
    queryFn: getInvestors,
  });

  const { data: availableUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['availableUsersForInvestor'],
    queryFn: getAvailableUsersForInvestor,
    enabled: isModalOpen && !editingInvestor, 
  });

  // --- Mutasi ---
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      queryClient.invalidateQueries({ queryKey: ['availableUsersForInvestor'] });
      setIsModalOpen(false);
      setEditingInvestor(null);
      form.resetFields();
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.detail || 
                       JSON.stringify(err.response?.data) || 
                       err.message || 
                       'Gagal';
      message.error(`Error: ${errorMsg}`);
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
      queryClient.invalidateQueries({ queryKey: ['availableUsersForInvestor'] });
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
      // JANGAN set field 'user' saat edit
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
      total_investment: Number(values.total_investment), // Pastikan Number
    };

    if (editingInvestor) {
      updateMutation.mutate({ id: editingInvestor.id, data: investorData });
    } else {
      investorData.user = values.user;
      createMutation.mutate(investorData);
    }
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const filteredInvestors = useMemo(() => {
    if (!investors) return [];
    return investors.filter(inv => {
      const contactMatch = inv.contact?.toLowerCase().includes(searchTerm.toLowerCase());
      const usernameMatch = inv.username?.toLowerCase().includes(searchTerm.toLowerCase());
      return contactMatch || usernameMatch;
    });
  }, [investors, searchTerm]);

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (username) => (
        <Space>
          <UserOutlined />
          <Text strong>{username || '-'}</Text>
        </Space>
      ),
      sorter: (a, b) => (a.username || '').localeCompare(b.username || ''),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
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
    // [RBAC] Kolom Aksi hanya untuk Admin/Superadmin
    ...(canEdit ? [{
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
    }] : []),
  ];

  return (
    <div style={{ padding: '24px' }}>
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
        
        {canEdit && (
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
        )}
      </Flex>

      <Card style={{ marginBottom: 24 }}>
        <Search
          placeholder="Cari username, email, atau kontak..."
          allowClear
          enterButton={<Button type="primary" icon={<SearchOutlined />} style={{ backgroundColor: '#237804' }} />}
          size="large"
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </Card>

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
            scroll={{ x: 1000 }}
          />
        </Card>
      )}

      {canEdit && (
        <Modal
          title={editingInvestor ? 'Edit Investor' : 'Tambah Investor Baru'}
          open={isModalOpen}
          onCancel={handleCancel}
          footer={null}
          destroyOnClose
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 24 }}>
            {!editingInvestor && (
              <Form.Item
                name="user"
                label="Pilih User Account"
                rules={[{ required: true, message: 'User harus dipilih!' }]}
                tooltip="Pilih user yang akan dijadikan investor."
              >
                <Select
                  placeholder="Pilih user"
                  loading={isLoadingUsers}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    String(option.children).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {availableUsers?.map(user => {
                      const roleName = user.role?.name || user.role || 'No Role';
                      return (
                          <Option key={user.id} value={user.id}>
                            {`${user.username} (${user.email}) - ${roleName}`}
                          </Option>
                      );
                  })}
                </Select>
              </Form.Item>
            )}

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
      )}
    </div>
  );
}

export default function InvestorPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Viewer']}>
      <InvestorManagementContent />
    </ProtectedRoute>
  );
}