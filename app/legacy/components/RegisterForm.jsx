'use client';
import { Form, Input, Select, Button, message } from 'antd';
import { UserOutlined, LockOutlined, UserAddOutlined, MailOutlined } from '@ant-design/icons';

export default function RegisterForm({ onRegister, loading }) {
  const onFinish = async values => {
    if (values.password !== values.password2) {
      message.error('Password dan konfirmasi password tidak cocok!');
      return;
    }
    try {
      // await onRegister(values);
      await onRegister(values).then((_) => message.success("Registrasi berhasil."));
    } catch {
      message.error('Registrasi gagal.');
    }
  };

  return (
    <Form name="register" onFinish={onFinish} layout="vertical" autoComplete="off">
      <Form.Item
        name="username"
        rules={[{ required: true, message: 'Masukkan username!' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Username" />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: 'Masukkan email!' },
          { type: 'email', message: 'Email tidak valid!' },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="Email" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Masukkan password!' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
      </Form.Item>

      <Form.Item
        name="password2"
        rules={[{ required: true, message: 'Konfirmasi password!' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
      </Form.Item>

      <Form.Item name="role" initialValue="user">
        <Select
          options={[
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' },
          ]}
        />
      </Form.Item>

      <Form.Item>
        <Button
          icon={<UserAddOutlined />}
          type="primary"
          htmlType="submit"
          block
          loading={loading}
        >
          Register
        </Button>
      </Form.Item>
    </Form>
  );
}
