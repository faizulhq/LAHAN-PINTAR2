// Di app/login/page.jsx
'use client';
import React from 'react';
import { Form, Input, Button, Card, Typography, Flex, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useLogin } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Gunakan Link Next.js untuk navigasi

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const loginMutation = useLogin();

  const handleSubmit = (values) => {
    console.log('🔐 Attempting login with:', values);
    loginMutation.mutate(values); // Kirim { username, password }
  };

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <Flex vertical align="center" gap="middle" style={{ marginBottom: 24 }}>
          <AppstoreOutlined style={{ fontSize: 48, color: '#237804' }} />
          <Title level={3} style={{ margin: 0 }}>Login Lahan Pintar</Title>
        </Flex>

        {loginMutation.isError && (
          <Alert
            message="Login Gagal"
            description={loginMutation.error.response?.data?.error || loginMutation.error.message || 'Periksa kembali username dan password.'}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 24 }}
          />
        )}

        {loginMutation.isSuccess && (
           <Alert
            message="Login Berhasil"
            description="Mengalihkan ke dashboard..."
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}


        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          requiredMark={false} // Opsional: hilangkan tanda bintang merah
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Username tidak boleh kosong!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Masukkan username Anda" size="large"/>
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password tidak boleh kosong!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Masukkan password Anda" size="large"/>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block // Tombol full width
              size="large"
              style={{ background: '#237804', borderColor: '#237804' }}
              loading={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Memproses...' : 'Login'}
            </Button>
          </Form.Item>
        </Form>

        <Text style={{ textAlign: 'center', display: 'block' }}>
          Belum punya akun?{' '}
          <Link href="/register" style={{ color: '#237804', fontWeight: 'bold' }}>
            Daftar di sini
          </Link>
        </Text>
      </Card>
    </Flex>
  );
}