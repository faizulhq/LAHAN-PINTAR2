// Di app/register/page.jsx
'use client';
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Flex, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useRegister } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const registerMutation = useRegister();
  const [error, setError] = useState(''); // State error kustom untuk validasi frontend

  const handleSubmit = (values) => {
    setError(''); // Bersihkan error sebelumnya
    if (values.password !== values.password2) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    console.log('📝 Attempting registration with:', values);
    // Kirim data yang dibutuhkan backend, default role akan dihandle backend
    registerMutation.mutate(
      { username: values.username, email: values.email, password: values.password, password2: values.password2 },
      {
         onError: (err) => {
          // Menampilkan error validasi dari server jika ada
          const serverErrors = err.response?.data;
          if (serverErrors && typeof serverErrors === 'object') {
            const errorMessages = Object.entries(serverErrors)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('\n');
            setError(errorMessages || 'Registrasi gagal.');
          } else {
             setError(err.message || 'Registrasi gagal. Silakan coba lagi.');
          }
        },
      }
    );
  };

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <Flex vertical align="center" gap="middle" style={{ marginBottom: 24 }}>
          <AppstoreOutlined style={{ fontSize: 48, color: '#237804' }} />
          <Title level={3} style={{ margin: 0 }}>Buat Akun Baru</Title>
        </Flex>

        {(error || registerMutation.isError) && !registerMutation.isSuccess && (
          <Alert
            message="Registrasi Gagal"
            description={error || registerMutation.error?.message || 'Terjadi kesalahan.'}
            type="error"
            showIcon
            closable
            onClose={() => setError('')} // Bersihkan error kustom saat ditutup
            style={{ marginBottom: 24, whiteSpace: 'pre-wrap' }} // pre-wrap agar \n dari server error terbaca
          />
        )}

         {registerMutation.isSuccess && (
           <Alert
            message="Registrasi Berhasil"
            description="Mengalihkan ke dashboard..."
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          form={form}
          name="register"
          onFinish={handleSubmit}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Username tidak boleh kosong!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Masukkan username" size="large"/>
          </Form.Item>

           <Form.Item
            name="email"
            label="Email"
            rules={[
                { required: true, message: 'Email tidak boleh kosong!' },
                { type: 'email', message: 'Format email tidak valid!'}
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Masukkan alamat email" size="large"/>
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password tidak boleh kosong!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Masukkan password" size="large"/>
          </Form.Item>

          <Form.Item
            name="password2"
            label="Konfirmasi Password"
            dependencies={['password']} // Bergantung pada field password
            rules={[
                { required: true, message: 'Konfirmasi password tidak boleh kosong!' },
                // Validasi langsung di Form.Item
                ({ getFieldValue }) => ({
                    validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                    }
                    return Promise.reject(new Error('Konfirmasi password tidak cocok!'));
                    },
                }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Masukkan ulang password" size="large"/>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{ background: '#237804', borderColor: '#237804' }}
              loading={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Mendaftarkan...' : 'Register'}
            </Button>
          </Form.Item>
        </Form>

        <Text style={{ textAlign: 'center', display: 'block' }}>
          Sudah punya akun?{' '}
          <Link href="/login" style={{ color: '#237804', fontWeight: 'bold' }}>
            Login di sini
          </Link>
        </Text>
      </Card>
    </Flex>
  );
}