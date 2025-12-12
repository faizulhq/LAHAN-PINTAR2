'use client';

import React from 'react';
import {
  Card, Typography, Spin, Alert, Row, Col, Descriptions, Button, Flex, Space
} from 'antd';
import { AiFillSetting } from 'react-icons/ai';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { UserOutlined, MailOutlined, UserSwitchOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

function SettingsContent() {
  const user = useAuthStore((state) => state.user);
  const isLoading = !user;

  // Helper untuk mengambil nama role dengan aman
  const getRoleName = (roleData) => {
    if (!roleData) return '-';
    // Jika object, ambil .name. Jika string, return langsung.
    return typeof roleData === 'object' ? roleData.name : roleData;
  };

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}>
              <AiFillSetting style={{ marginRight: '8px', verticalAlign: 'middle', fontSize: '24px' }}/> Pengaturan Akun
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>Lihat informasi akun Anda.</Text>
        </div>
      </Flex>

      {isLoading && <Spin size="large"><div style={{ padding: 50 }} /></Spin>}

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
                  {/* [PERBAIKAN] Render nama role, bukan objectnya */}
                  {getRoleName(user.role)}
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

      {!isLoading && !user && (
         <Alert message="Error" description="Gagal memuat informasi pengguna." type="error" showIcon />
      )}
    </>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}