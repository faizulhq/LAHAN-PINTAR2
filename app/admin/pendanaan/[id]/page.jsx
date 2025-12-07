'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Button, Typography, Space, Tag, Flex, Spin, Alert, Descriptions, Row, Col,
  Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, PlusOutlined, DeleteOutlined,
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
  deleteFunding, // Import deleteFunding
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
// === MODAL EDIT (Disisipkan dari List Page) ===
// =================================================================
const FundingModal = ({ visible, onClose, initialData, form, handleShowSourceModal }) => {
  const queryClient = useQueryClient();
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const { data: sources } = useQuery({ queryKey: ['fundingSources'], queryFn: getFundingSources });
  
  const mutation = useMutation({ 
      mutationFn: (vals) => updateFunding({ id: initialData.id, fundingData: vals }), 
      onSuccess: () => { 
          message.success('Pendanaan diperbarui'); 
          queryClient.invalidateQueries({ queryKey: ['funding'] }); 
          onClose(); 
      },
      onError: (err) => message.error(`Gagal: ${err.message}`)
  });
  
  const onFinish = (v) => mutation.mutate({ ...v, date_received: v.date_received.format('YYYY-MM-DD') });

  return (
    <Modal title="Edit Pendanaan" open={visible} onCancel={onClose} footer={null} width={700} centered destroyOnClose>
       <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{...initialData, date_received: moment(initialData?.date_received)}} style={{marginTop: 24}}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="project" label="Proyek" rules={[{required:true}]}><Select showSearch optionFilterProp="children">{projects?.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}</Select></Form.Item></Col>
            <Col span={12}>
                <Form.Item label="Sumber Dana">
                    <Space.Compact block>
                        <Form.Item name="source" noStyle rules={[{required:true}]}><Select showSearch optionFilterProp="children">{sources?.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}</Select></Form.Item>
                        <Button icon={<PlusOutlined />} onClick={handleShowSourceModal}/>
                    </Space.Compact>
                </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="amount" label="Jumlah (Rp)" rules={[{required:true}]}><InputNumber style={{width: '100%'}} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/,/g, '')}/></Form.Item></Col>
            <Col span={12}><Form.Item name="date_received" label="Tanggal" rules={[{required:true}]}><DatePicker style={{width: '100%'}} /></Form.Item></Col>
          </Row>
          <Form.Item name="purpose" label="Tujuan"><Input.TextArea /></Form.Item>
          <Form.Item name="status" label="Status"><Select><Option value="available">Tersedia</Option><Option value="allocated">Dialokasikan</Option><Option value="used">Digunakan</Option></Select></Form.Item>
          <Form.Item style={{textAlign:'right', marginBottom: 0}}><Space style={{ width: '100%', justifyContent: 'flex-end' }}><Button onClick={onClose}>Batal</Button><Button type="primary" htmlType="submit" loading={mutation.isPending}>Simpan Perubahan</Button></Space></Form.Item>
       </Form>
    </Modal>
  );
};

// =================================================================
// === MODAL ADD SOURCE (Disisipkan dari List Page) ===
// =================================================================
const FundingSourceFormModal = ({ open, onCancel, onSubmit, isSubmitting, form }) => (
    <Modal title="Tambah Sumber Dana" open={open} onCancel={onCancel} footer={null} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 24 }}>
        <Form.Item name="name" label="Nama" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="type" label="Tipe" rules={[{ required: true }]}><Select>{Object.entries(SOURCE_TYPE_MAP).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}</Select></Form.Item>
        <Form.Item name="contact_info" label="Kontak"><Input.TextArea /></Form.Item>
        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}><Space style={{ width: '100%', justifyContent: 'flex-end' }}><Button onClick={onCancel}>Batal</Button><Button type="primary" htmlType="submit" loading={isSubmitting}>Simpan</Button></Space></Form.Item>
      </Form>
    </Modal>
);

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
  const [form] = Form.useForm();
  const [sourceForm] = Form.useForm();

  // [RBAC] Check Role
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  const { data: funding, isLoading: isLoadingFunding, isError, error } = useQuery({
    queryKey: ['funding', fundingId],
    queryFn: () => getFunding(fundingId),
    enabled: !!fundingId,
  });

  // DELETE MUTATION
  const deleteMutation = useMutation({ 
      mutationFn: deleteFunding, 
      onSuccess: () => { message.success('Dihapus'); router.push('/admin/pendanaan'); },
      onError: (err) => message.error(`Gagal menghapus: ${err.message}`)
  });

  // CREATE SOURCE MUTATION
  const createSourceMutation = useMutation({ 
      mutationFn: createFundingSource, 
      onSuccess: (ns) => { message.success('Sumber ditambahkan'); queryClient.invalidateQueries({ queryKey: ['fundingSources'] }); setIsSourceModalOpen(false); form.setFieldsValue({ source: ns.id }); }
  });

  const handleBack = () => {
    router.push('/admin/pendanaan');
  };

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    deleteMutation.mutate(funding.id);
  };

  const handleShowSourceModal = () => setIsSourceModalOpen(true);
  const handleCancelSourceModal = () => { setIsSourceModalOpen(false); sourceForm.resetFields(); };
  const handleSourceFormSubmit = (values) => createSourceMutation.mutate(values);

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
        
        {/* [RBAC] Tombol Edit & Hapus */}
        {canEdit && (
          <Space>
             <Popconfirm 
                title="Hapus Pendanaan?" 
                description="Yakin hapus data ini?" 
                onConfirm={handleDelete} 
                okText="Ya, Hapus" 
                cancelText="Batal" 
                okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
             >
                <Button danger icon={<DeleteOutlined />} size="large" style={{ borderRadius: 24 }}>Hapus</Button>
             </Popconfirm>
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
          </Space>
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

      {canEdit && <FundingModal visible={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={funding} form={form} handleShowSourceModal={handleShowSourceModal} />}
      <FundingSourceFormModal open={isSourceModalOpen} form={sourceForm} onCancel={handleCancelSourceModal} onSubmit={handleSourceFormSubmit} isSubmitting={createSourceMutation.isPending} />
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