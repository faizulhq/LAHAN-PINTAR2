'use client';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';

export default function LoginForm({ onLogin, loading }) {
  const onFinish = async values => {
    try {
      // await onLogin(values);
      await onLogin(values).then((_) => message.success("Login berhasil."));
    } catch (err) {
      message.error('Login gagal. Cek kembali kredensial Anda.');
    }
  };

  return (
    <Form name="login" onFinish={onFinish} layout="vertical" autoComplete="off">
      <Form.Item
        name="username"
        rules={[{ required: true, message: 'Masukkan username!' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Username" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Masukkan password!' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
      </Form.Item>

      <Form.Item>
        <Button
          icon={<LoginOutlined />}
          type="primary"
          htmlType="submit"
          block
          loading={loading}
        >
          Login
        </Button>
      </Form.Item>
    </Form>
  );
}
