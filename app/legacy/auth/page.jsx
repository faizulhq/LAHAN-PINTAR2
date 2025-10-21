'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '@/app/legacy/lib/auth';
import { Typography, Button, Divider } from 'antd';
import { SwapRightOutlined } from '@ant-design/icons';

import LoginForm from '@/app/legacy/components/LoginForm';
import RegisterForm from '@/app/legacy/components/RegisterForm';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // login or register
  const [loading, setLoading] = useState(false);

  const handleLogin = async values => {
    setLoading(true);
    const user = await login(values.username, values.password);
    setLoading(false);
    router.push(user.role === 'admin' ? '/admin' : '/dashboard');
  };

  const handleRegister = async values => {
    setLoading(true);
    await register(values);
    setLoading(false);
    router.push('/dashboard');
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <Typography.Title level={2} className="text-center mb-6">
        {mode === 'login' ? 'Login' : 'Register'}
      </Typography.Title>

      {mode === 'login' ? (
        <LoginForm onLogin={handleLogin} loading={loading} />
      ) : (
        <RegisterForm onRegister={handleRegister} loading={loading} />
      )}

      <Divider />

      <Typography.Paragraph className="text-center">
        {mode === 'login' ? (
          <>
            Belum punya akun?{' '}
            <Button
              type="link"
              onClick={() => setMode('register')}
              icon={<SwapRightOutlined />}
            >
              Daftar di sini
            </Button>
          </>
        ) : (
          <>
            Sudah punya akun?{' '}
            <Button
              type="link"
              onClick={() => setMode('login')}
              icon={<SwapRightOutlined />}
            >
              Masuk di sini
            </Button>
          </>
        )}
      </Typography.Paragraph>
    </div>
  );
}
