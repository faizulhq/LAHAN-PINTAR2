'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Input, Select,
  Typography, Flex, Space, Popconfirm, message, Spin, Alert, Card, Tag
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, HomeOutlined
} from '@ant-design/icons';
import { HiUsers } from 'react-icons/hi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import {
  getUsers, createUser, updateUser, deleteUser
} from '@/lib/api/user';
import { getRoles } from '@/lib/api/role';
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

function UserManagementContent() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('semua');
  const [form] = Form.useForm();

  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  // Fetch role list
  const { data: roles = [], isLoading: isRolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setEditingUser(null);
      form.resetFields();
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.detail || 
                       JSON.stringify(err.response?.data) || 
                       err.message || 'Gagal';
      message.error(`Error: ${errorMsg}`);
    },
  };

  const createMutation = useMutation({
    mutationFn: createUser,
    ...mutationOptions,
    onSuccess: (...args) => {
      message.success('User berhasil ditambahkan');
      mutationOptions.onSuccess(...args);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    ...mutationOptions,
    onSuccess: (...args) => {
      message.success('User berhasil diperbarui');
      mutationOptions.onSuccess(...args);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success('User berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.error || err.message || 'Gagal menghapus'}`);
    },
  });

  const showAddModal = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const showEditModal = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role?.id || user.role,
      phone: user.profile?.phone,
      address: user.profile?.address,
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleFormSubmit = (values) => {
    // Pastikan data role dikirim sebagai ID
    const userData = {
      username: values.username,
      email: values.email,
      role: values.role,
      profile: {
        phone: values.phone,
        address: values.address,
      },
    };
    if (values.password) userData.password = values.password;

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: userData });
    } else {
      if (!values.password) {
        message.error('Password wajib diisi untuk user baru!');
        return;
      }
      createMutation.mutate(userData);
    }
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      // Perhatikan: user.role mungkin objek {id, name}
      const roleName = user.role?.name || user.role;
      const matchesRole = selectedRole === 'semua' || roleName === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  const roleOptions = roles.map((role) => ({ value: role.id, label: role.name }));

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (username) => (
        <Space>
          <UserOutlined />
          <Text strong>{username}</Text>
        </Space>
      ),
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const value = role?.name || role;
        return <Tag color="blue">{value}</Tag>;
      },
      filters: [{ text: 'Semua Role', value: 'semua' }, ...roles.map(role => ({ text: role.name, value: role.name }))],
      onFilter: (value, record) => {
        if (value === 'semua') return true;
        return (record.role?.name || record.role) === value;
      },
    },
    {
      title: 'Phone',
      dataIndex: ['profile', 'phone'],
      key: 'phone',
      render: (text) => text || <span style={{ color: '#aaa' }}>—</span>,
    },
    {
      title: 'Address',
      dataIndex: ['profile', 'address'],
      key: 'address',
      render: (text) => text || <span style={{ color: '#aaa' }}>—</span>,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        const isSelf = record.id === currentUser?.id;
        return (
          <Space size="small">
            <Button 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => showEditModal(record)}
              disabled={isSelf}
            />
            <Popconfirm
              title="Hapus User?"
              description={isSelf ? "Tidak dapat menghapus akun sendiri!" : "Yakin hapus user ini?"}
              onConfirm={() => handleDelete(record.id)}
              okText="Ya"
              cancelText="Tidak"
              okButtonProps={{ danger: true, loading: deleteMutation.isPending, disabled: isSelf }}
              disabled={isSelf}
            >
              <Button size="small" danger icon={<DeleteOutlined />} disabled={isSelf} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}>
            <HiUsers style={{ marginRight: '8px', verticalAlign: 'middle', fontSize: '24px' }} />
            Manajemen User
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Kelola semua user, role, dan profile mereka (Superadmin only).
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
          Tambah User
        </Button>
      </Flex>

      <Card style={{ marginBottom: 24 }}>
        <Flex gap="middle" wrap="wrap">
          <Search
            placeholder="Cari username atau email..."
            allowClear
            enterButton={<Button type="primary" icon={<SearchOutlined />} style={{ backgroundColor: '#237804' }} />}
            size="large"
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flexGrow: 1, minWidth: 250 }}
          />
          <Select
            defaultValue="semua"
            size="large"
            style={{ minWidth: 200 }}
            onChange={(value) => setSelectedRole(value)}
            loading={isRolesLoading}
          >
            <Option value="semua">Semua Role</Option>
            {roles && roles.map((role) => (
              <Option key={role.id} value={role.name}>{role.name}</Option>
            ))}
          </Select>
        </Flex>
      </Card>

      {isLoading && <Spin size="large"><div style={{ padding: 50 }} /></Spin>}
      {isError && <Alert message="Error" description={error?.message} type="error" showIcon />}

      {!isLoading && !isError && (
        <Card bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={isLoading || deleteMutation.isPending}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1200 }}
          />
        </Card>
      )}

      <Modal
        title={editingUser ? 'Edit User' : 'Tambah User Baru'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 24 }}>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Username wajib diisi!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Masukkan username" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email wajib diisi!' },
              { type: 'email', message: 'Format email tidak valid!' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Masukkan email" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Role wajib dipilih!' }]}
          >
            <Select placeholder="Pilih role user" loading={isRolesLoading}>
              {roles && roles.map((role) => (
                <Option key={role.id} value={role.id}>{role.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input prefix={<PhoneOutlined />} placeholder="Masukkan nomor telepon" />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address"
          >
            <Input prefix={<HomeOutlined />} placeholder="Masukkan alamat" />
          </Form.Item>
          <Form.Item
            name="password"
            label={editingUser ? 'Password Baru (Opsional)' : 'Password'}
            rules={editingUser ? [] : [
              { required: true, message: 'Password wajib diisi!' },
              { min: 8, message: 'Password minimal 8 karakter!' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Masukkan password" />
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
                {editingUser ? 'Simpan Perubahan' : 'Tambah User'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default function UserManagementPage() {
  return (
    <ProtectedRoute>
      <UserManagementContent />
    </ProtectedRoute>
  );
}