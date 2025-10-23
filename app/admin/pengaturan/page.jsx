// Di app/admin/pengaturan/page.jsx
'use client';

import React from 'react';
import {
  Card, Typography, Spin, Alert, Row, Col, Descriptions, Button, Flex, Space // Descriptions untuk menampilkan info
} from 'antd';
// Impor ikon react-icons yang sesuai
import { AiFillSetting } from 'react-icons/ai';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore'; // Untuk mengambil data user
import { UserOutlined, MailOutlined, UserSwitchOutlined } from '@ant-design/icons'; // Ikon untuk detail

const { Title, Text, Paragraph } = Typography;

// Komponen Utama Halaman Pengaturan
function SettingsContent() {
  // Ambil data pengguna dari Zustand store
  const user = useAuthStore((state) => state.user);
  const isLoading = !user; // Anggap loading jika user belum ada di store

  return (
    <>
      {/* Header Halaman */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}>
              <AiFillSetting style={{ marginRight: '8px', verticalAlign: 'middle', fontSize: '24px' }}/> Pengaturan Akun
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>Lihat informasi akun Anda.</Text>
        </div>
        {/* Tidak ada tombol aksi utama di sini untuk saat ini */}
      </Flex>

      {/* Tampilan Loading */}
      {isLoading && <Spin size="large"><div style={{ padding: 50 }} /></Spin>}

      {/* Tampilan Data Pengguna */}
      {!isLoading && user && (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="Informasi Akun">
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label={<Space><UserOutlined /> Username</Space>}>
                  {user.username}
                </Descriptions.Item>
                <Descriptions.Item label={<Space><MailOutlined /> Email</Space>}>
                  {user.email}
                </Descriptions.Item>
                <Descriptions.Item label={<Space><UserSwitchOutlined /> Role</Space>}>
                  {user.role}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} md={12}>
             <Card title="Aksi Akun">
                 <Paragraph type="secondary">
                     Fitur untuk mengubah profil atau mengganti password akan tersedia di pembaruan selanjutnya.
                 </Paragraph>
                 <Space direction="vertical" style={{width: '100%'}}>
                    <Button block disabled>Ubah Profil</Button>
                    <Button block disabled>Ganti Password</Button>
                 </Space>
             </Card>
          </Col>
        </Row>
      )}

      {/* Tampilan Error jika user tidak ada (seharusnya tidak terjadi jika ProtectedRoute bekerja) */}
      {!isLoading && !user && (
         <Alert message="Error" description="Gagal memuat informasi pengguna." type="error" showIcon />
      )}
    </>
  );
}

// Bungkus dengan ProtectedRoute
export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}