'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Button, Typography, Space, Tag, Flex, Spin, Alert, Descriptions, Row, Col,
  Modal, Form, Input, Select, DatePicker, InputNumber, message,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, PlusOutlined,
  UserOutlined, PhoneOutlined, BankOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { FaMoneyBillTransfer, FaMoneyBills } from 'react-icons/fa6';
import { GiPayMoney } from 'react-icons/gi';
import { PiFileTextFill } from 'react-icons/pi';
import { BiSolidCalendar } from 'react-icons/bi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore'; // [RBAC] Import Auth

import { getProjects } from '@/lib/api/project';
import {
  getFundingSources,
  createFundingSource,
} from '@/lib/api/funding_source';
import {
  getFunding,
  updateFunding,
  createFunding,
} from '@/lib/api/funding';

const { Title, Text } = Typography;
const { Option } = Select;

// =================================================================
// === HELPERS ===
// =================================================================

const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    : 'Rp 0';

const formatTanggal = (dateStr) => {
  if (!dateStr) return '-';
  return moment(dateStr, 'YYYY-MM-DD').format('D/M/YYYY');
};

const getStatusProps = (status) => {
  let text = status;
  switch (status) {
    case 'available': text = 'Tersedia'; break;
    case 'allocated': text = 'Dialokasikan'; break;
    case 'used': text = 'Digunakan'; break;
    default: text = status || 'N/A';
  }
  
  const style = {
    background: '#E1EFFE', 
    color: '#1E429F', 
    border: 'none', 
    fontWeight: 600, 
    fontSize: '14px', 
    padding: '4px 10px', 
    borderRadius: '6px',
    lineHeight: '17px',
  };

  if (status === 'used') {
    style.background = '#F3F4F6';
    style.color = '#374151';
  } else if (status === 'allocated') {
    style.background = '#FEF3C7';
    style.color = '#92400E';
  }

  return { text, style }; 
};

const SOURCE_TYPE_MAP = {
  'foundation': 'Yayasan',
  'csr': 'CSR',
  'investor': 'Investor',
};

const getSourceTypeProps = (type) => {
  let text = type;
  let style = {
    background: '#E1EFFE', 
    color: '#1E429F', 
    border: 'none', 
    fontWeight: 600, 
    fontSize: '14px', 
    padding: '4px 10px', 
    borderRadius: '6px',
    lineHeight: '17px',
  };
  
  text = SOURCE_TYPE_MAP[type] || type || 'Lainnya';
  
  if (!SOURCE_TYPE_MAP[type]) {
    style.background = '#F3F4F6'; 
    style.color = '#374151';
  }
  
  return { text, style }; 
};

// =================================================================
// === INFO CARD COMPONENT ===
// =================================================================
const InfoCard = ({ icon, label, value, iconColor }) => (
  <Card 
    style={{
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
    }}
  >
    <Flex align="center" gap={16}>
      <div style={{ color: iconColor, fontSize: '32px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <Text style={{ fontSize: '14px', color: '#6B7280', display: 'block' }}>
          {label}
        </Text>
        <Text style={{ fontSize: '20px', fontWeight: 600, color: '#111928' }}>
          {value}
        </Text>
      </div>
    </Flex>
  </Card>
);

// ... (Modal FundingSourceFormModal dan FundingModal - Sama seperti file page.jsx) ...
// Anda bisa memisahkan Modal ke file components sendiri agar reusable, tapi untuk sekarang
// Anda bisa copy-paste modal yang sama dari file page.jsx ke sini jika ingin fitur Edit di halaman detail.

// =================================================================
// === MAIN COMPONENT ===
// =================================================================
function FundingDetailContent() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const fundingId = params.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // [RBAC] Check Role
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  const { data: funding, isLoading: isLoadingFunding, isError, error } = useQuery({
    queryKey: ['funding', fundingId],
    queryFn: () => getFunding(fundingId),
    enabled: !!fundingId,
  });

  const handleBack = () => {
    router.push('/admin/pendanaan');
  };

  const handleEdit = () => {
    // Implementasi logika edit (buka modal)
    // Anda perlu menyalin FundingModal ke file ini atau import dari components terpisah
    message.info("Fitur edit dari detail page (implementasi sama dengan list page)");
  };

  if (isLoadingFunding) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert 
        message="Error Memuat Data" 
        description={error?.message || 'Gagal memuat data pendanaan'} 
        type="error" 
        showIcon 
      />
    );
  }

  if (!funding) {
    return (
      <Alert 
        message="Pendanaan Tidak Ditemukan" 
        description="Data pendanaan yang Anda cari tidak tersedia" 
        type="warning" 
        showIcon 
      />
    );
  }
  
  const statusProps = getStatusProps(funding.status);
  const sourceTypeProps = getSourceTypeProps(funding.source_type);

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
        <Flex align="center" gap={16}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            style={{ 
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
          />
          <div>
            <Title level={2} style={{ 
              margin: 0, 
              color: '#111928',
              fontWeight: 700,
              fontSize: '30px',
              lineHeight: '125%',
            }}>
              Detail Pendanaan
            </Title>
            <Text style={{ 
              fontSize: '16px',
              fontWeight: 500,
              color: '#727272',
              lineHeight: '19px', 
            }}>
              Informasi lengkap mengenai alokasi dana
            </Text>
          </div>
        </Flex>
        
        {/* [RBAC] Tombol Edit disembunyikan */}
        {canEdit && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="large"
            style={{ 
              backgroundColor: '#237804', 
              borderRadius: '24px', 
              height: 'auto', 
              padding: '8px 16px', 
              fontSize: '16px' 
            }}
            onClick={handleEdit}
          >
            Edit Pendanaan
          </Button>
        )}
      </Flex>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
              marginBottom: 24,
            }}
          >
            <Flex justify="space-between" align="start" style={{ marginBottom: 24 }} wrap='wrap' gap={8}>
              <div>
                <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
                  {funding.project_name}
                </Title>
                <Space wrap>
                  <Tag style={statusProps.style}>
                    {statusProps.text}
                  </Tag>
                  <Tag style={sourceTypeProps.style}>
                    {sourceTypeProps.text}
                  </Tag>
                </Space>
              </div>
              <Text style={{ 
                fontWeight: 600,
                fontSize: '24px',
                color: '#7CB305',
                flexShrink: 0
              }}>
                {formatRupiah(funding.amount)}
              </Text>
            </Flex>

            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Flex align="start" gap={12}>
                <PiFileTextFill style={{ color: '#0958D9', fontSize: '24px', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>
                    Tujuan / Deskripsi
                  </Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>
                    {funding.purpose}
                  </Text>
                </div>
              </Flex>

              <Flex align="center" gap={12}>
                <BankOutlined style={{ color: '#D46B08', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>
                    Sumber Dana
                  </Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>
                    {funding.source_name}
                  </Text>
                </div>
              </Flex>

              <Flex align="center" gap={12}>
                <BiSolidCalendar style={{ color: '#531DAB', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>
                    Tanggal Diterima
                  </Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>
                    {formatTanggal(funding.date_received)}
                  </Text>
                </div>
              </Flex>
            </Space>
          </Card>

          <Card 
            title="Informasi Detail"
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Proyek Terkait">
                <Text style={{ fontWeight: 500 }}>
                  {funding.project_name}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Sumber Dana">
                <Text style={{ fontWeight: 500 }}>
                  {funding.source_name || '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tipe Sumber">
                <Tag style={sourceTypeProps.style}>
                  {sourceTypeProps.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag style={statusProps.style}>
                  {statusProps.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tujuan / Deskripsi">
                <Text style={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                  {funding.purpose || '-'}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size={24}>
            <InfoCard
              icon={<FaMoneyBillTransfer size={32} />}
              label="Total Dana Masuk"
              value={formatRupiah(funding.amount)}
              iconColor="#7CB305"
            />
            
            <InfoCard
              icon={<GiPayMoney size={32} />}
              label="Dana Terpakai"
              value={formatRupiah(funding.total_terpakai)}
              iconColor="#CF1322"
            />

            <InfoCard
              icon={<FaMoneyBills size={32} />}
              label="Sisa Dana"
              value={formatRupiah(funding.sisa_dana)}
              iconColor="#1D4ED8"
            />

            <Card 
              title="Informasi Tambahan"
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>ID Pendanaan</Text>
                  <Text style={{ fontWeight: 600 }}>#{funding.id}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>Persen Terpakai</Text>
                  <Text style={{ fontWeight: 600 }}>{parseFloat(funding.persen_terpakai).toFixed(1)}%</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>Status</Text>
                  <Tag style={statusProps.style}>{statusProps.text}</Tag>
                </Flex>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </>
  );
}

export default function FundingDetailPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Viewer']}>
      <FundingDetailContent />
    </ProtectedRoute>
  );
}