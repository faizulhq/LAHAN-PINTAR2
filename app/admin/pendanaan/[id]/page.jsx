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

// =================================================================
// === MODAL TAMBAH SUMBER DANA ===
// =================================================================
const FundingSourceFormModal = ({ open, onCancel, onSubmit, isSubmitting, form }) => (
  <Modal
    title="Tambah Sumber Dana Baru" open={open} onCancel={onCancel} footer={null}
    width={500} zIndex={1001} destroyOnClose
  >
    <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 24 }}>
      <Form.Item label="Nama Sumber Dana" name="name" rules={[{ required: true, message: 'Nama wajib diisi' }]}>
        <Input prefix={<BankOutlined />} placeholder="cth: Yayasan XYZ, PT ABC (CSR)" />
      </Form.Item>
      <Form.Item label="Tipe Sumber" name="type" rules={[{ required: true, message: 'Tipe wajib dipilih' }]}>
        <Select placeholder="Pilih tipe sumber dana">
          {Object.entries(SOURCE_TYPE_MAP).map(([value, label]) => (
            <Option key={value} value={value}>{label}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item label="Info Kontak" name="contact_info" rules={[{ required: true, message: 'Info kontak wajib diisi' }]}>
        <Input.TextArea
          prefix={<InfoCircleOutlined />}
          placeholder="Masukkan detail kontak (cth: Nama PIC, No HP, Email, Alamat)"
          rows={4}
        />
      </Form.Item>
      <Form.Item style={{ textAlign: 'right', marginTop: 16, marginBottom: 0 }}>
        <Space>
          <Button onClick={onCancel}>Batal</Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting} style={{ background: '#237804', borderColor: '#237804' }}>
            Simpan Sumber Dana
          </Button>
        </Space>
      </Form.Item>
    </Form>
  </Modal>
);

// =================================================================
// === MODAL EDIT PENDANAAN ===
// =================================================================
const FundingModal = ({ visible, onClose, initialData, form, handleShowSourceModal }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(initialData);

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    staleTime: 1000 * 60 * 5,
  });
  
  const { data: sources, isLoading: isLoadingSources } = useQuery({
    queryKey: ['fundingSources'],
    queryFn: getFundingSources,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: createFunding,
    onSuccess: () => {
      message.success('Pendanaan berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['fundings'] });
      queryClient.invalidateQueries({ queryKey: ['funding'] });
      queryClient.invalidateQueries({ queryKey: ['financialReport'] });
      onClose();
    },
    onError: (err) => {
      console.error("Error creating funding:", err);
      message.error('Gagal menambahkan pendanaan. Cek konsol untuk detail.');
    },
    onSettled: () => setIsSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: updateFunding,
    onSuccess: (data) => {
      message.success('Pendanaan berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['fundings'] });
      queryClient.invalidateQueries({ queryKey: ['funding', data.id] });
      queryClient.invalidateQueries({ queryKey: ['financialReport'] });
      onClose();
    },
    onError: (err) => {
      console.error("Error updating funding:", err);
      message.error('Gagal memperbarui pendanaan. Cek konsol untuk detail.');
    },
    onSettled: () => setIsSubmitting(false),
  });
  
  useEffect(() => {
    if (visible) {
      if (isEditMode && initialData) {
        form.setFieldsValue({
          ...initialData,
          date_received: moment(initialData.date_received, 'YYYY-MM-DD'),
          source: initialData.source,
          project: initialData.project,
        });
      } else {
        form.resetFields();
        form.setFieldValue('status', 'available');
      }
    }
  }, [visible, initialData, form, isEditMode]);

  const onFinish = (values) => {
    setIsSubmitting(true);
    const payload = {
      ...values,
      date_received: values.date_received.format('YYYY-MM-DD'),
    };
    
    if (isEditMode) {
      updateMutation.mutate({ id: initialData.id, fundingData: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Modal
      title={isEditMode ? 'Edit Pendanaan' : 'Tambah Pendanaan Baru'}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="mt-6"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="project"
              label="Proyek Terkait"
              rules={[{ required: true, message: 'Proyek harus diisi' }]}
            >
              <Select
                showSearch
                placeholder="Pilih proyek"
                loading={isLoadingProjects}
                optionFilterProp="children"
                options={projects?.map(p => ({ value: p.id, label: p.name }))}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="source"
              label="Sumber Dana"
              rules={[{ required: true, message: 'Sumber dana harus diisi' }]}
            >
              <Select
                showSearch
                placeholder="Pilih sumber dana"
                loading={isLoadingSources}
                optionFilterProp="children"
                options={sources?.map(s => ({ value: s.id, label: `${s.name} (${SOURCE_TYPE_MAP[s.type] || s.type})` }))}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
            
            <Button 
              type="link" 
              icon={<PlusOutlined />} 
              onClick={handleShowSourceModal}
              style={{ paddingLeft: 0, marginTop: '-16px', marginBottom: '16px' }}
            >
              Tambah Sumber Dana Baru
            </Button>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="amount"
              label="Jumlah Pendanaan (Rp)"
              rules={[{ required: true, message: 'Jumlah harus diisi' }]}
            >
              <InputNumber
                min={0}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => (value || '').replace(/\$\s?|(,*)/g, '')}
                className="w-full"
                placeholder='Contoh: 50000000'
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="date_received"
              label="Tanggal Diterima"
              rules={[{ required: true, message: 'Tanggal harus diisi' }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="purpose"
          label="Tujuan/Deskripsi"
          rules={[{ required: true, message: 'Tujuan harus diisi' }]}
        >
          <Input.TextArea rows={3} placeholder="Mis: Dana operasional untuk Model Awal Pembangunan" />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Status harus diisi' }]}
        >
          <Select
            placeholder="Pilih status"
            options={[
              { value: 'available', label: 'Tersedia' },
              { value: 'allocated', label: 'Dialokasikan' },
              { value: 'used', label: 'Digunakan' },
            ]}
          />
        </Form.Item>

        <Form.Item className="mt-6 mb-0 text-right">
          <Button onClick={onClose} style={{ marginRight: 8 }} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting} style={{ background: '#237804', borderColor: '#237804' }}>
            {isEditMode ? 'Simpan Perubahan' : 'Simpan'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};


// =================================================================
// === MAIN COMPONENT ===
// =================================================================
function FundingDetailContent() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const fundingId = params.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [editingFunding, setEditingFunding] = useState(null);
  const [form] = Form.useForm();
  const [sourceForm] = Form.useForm();

  const { data: funding, isLoading: isLoadingFunding, isError, error } = useQuery({
    queryKey: ['funding', fundingId],
    queryFn: () => getFunding(fundingId),
    enabled: !!fundingId,
  });

  const createSourceMutation = useMutation({
    mutationFn: createFundingSource,
    onSuccess: (newSource) => {
      message.success(`Sumber Dana "${newSource.name}" berhasil ditambahkan`);
      queryClient.invalidateQueries({ queryKey: ['fundingSources'] });
      setIsSourceModalOpen(false);
      sourceForm.resetFields();
      form.setFieldsValue({ source: newSource.id });
    },
    onError: (err) => {
      let errorMsg = 'Gagal menambahkan sumber dana.';
      if (err.response?.data) {
        const errors = err.response.data;
        const messages = Object.entries(errors).map(([field, fieldErrors]) => `${field}: ${fieldErrors.join('; ')}`).join('; ');
        errorMsg = messages || 'Gagal menambahkan sumber dana.';
      } else { errorMsg = err.message || 'Gagal menambahkan sumber dana.'; }
      message.error(`Error: ${errorMsg}`, 6);
    }
  });

  const handleBack = () => {
    router.push('/admin/pendanaan');
  };

  const handleEdit = () => {
    if (!funding) return;
    setEditingFunding(funding);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingFunding(null);
    form.resetFields();
  };

  const handleShowSourceModal = () => {
    setIsSourceModalOpen(true);
  };

  const handleCancelSourceModal = () => {
    setIsSourceModalOpen(false);
    sourceForm.resetFields();
  };

  const handleSourceFormSubmit = (values) => {
    createSourceMutation.mutate(values);
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

      <FundingModal
        visible={isModalOpen}
        onClose={handleModalCancel}
        initialData={editingFunding}
        form={form}
        handleShowSourceModal={handleShowSourceModal}
      />

      <FundingSourceFormModal
        open={isSourceModalOpen}
        form={sourceForm}
        onCancel={handleCancelSourceModal}
        onSubmit={handleSourceFormSubmit}
        isSubmitting={createSourceMutation.isPending}
      />
    </>
  );
}

export default function FundingDetailPage() {
  return (
    <ProtectedRoute>
      <FundingDetailContent />
    </ProtectedRoute>
  );
}