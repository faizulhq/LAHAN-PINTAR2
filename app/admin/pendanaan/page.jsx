'use client';

// --- IMPORTS ---
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import moment from 'moment';

// ANTD Components
import {
  Button,
  Select,
  Card,
  Progress,
  Typography,
  Row,
  Col,
  Spin,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  message,
  Tag,
  Skeleton,
  Space,
  Descriptions,
  Alert,
} from 'antd';

// Icons
import {
  PlusCircleOutlined,
  PlusOutlined,
  BankOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { FaMoneyBillTransfer, FaMoneyBills } from 'react-icons/fa6';
import { GiPayMoney } from 'react-icons/gi';
import { ChevronDown } from 'lucide-react';

// API IMPORTS
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore'; // [RBAC] Import Auth
import { getFinancialReport } from '@/lib/api/reporting';
import { getAssets } from '@/lib/api/asset';
import { getProjects } from '@/lib/api/project';
import {
  getFundingSources,
  createFundingSource,
  getFundingSource,
} from '@/lib/api/funding_source';
import {
  getFundings,
  createFunding,
  updateFunding,
} from '@/lib/api/funding';

// --- HELPERS ---
const { Title, Text } = Typography;
const { Option } = Select;

const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    : '-';

const formatTanggal = (dateStr) => {
  if (!dateStr) return '-';
  return moment(dateStr, 'YYYY-MM-DD').format('D/M/YYYY');
};

const getStatusProps = (status) => {
  let text = status;
  switch (status) {
    case 'available': text = 'tersedia'; break;
    case 'allocated': text = 'dialokasikan'; break;
    case 'used': text = 'digunakan'; break;
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
    onSuccess: () => {
      message.success('Pendanaan berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['fundings'] });
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
// === MODAL DETAIL SUMBER DANA (Tetap ada) ===
// =================================================================
const FundingSourceDetailModal = ({ visible, onClose, sourceId }) => {
  const { data: source, isLoading, isError, error } = useQuery({
    queryKey: ['fundingSource', sourceId],
    queryFn: () => getFundingSource(sourceId),
    enabled: !!sourceId, 
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Modal
      title="Detail Sumber Pendanaan"
      open={visible}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Tutup</Button>]}
      width={600}
      destroyOnClose
    >
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Spin size="large" />
        </div>
      )}
      {isError && (
        <Alert
          message="Gagal Mengambil Data"
          description={error?.message || 'Terjadi kesalahan saat mengambil detail sumber dana.'}
          type="error"
          showIcon
        />
      )}
      {source && !isLoading && !isError && (
        <Descriptions bordered layout="vertical" column={1}>
          <Descriptions.Item label="Nama Sumber Dana">
            <Text strong style={{ fontSize: '16px' }}>{source.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Tipe Sumber">
            <Tag style={getSourceTypeProps(source.type).style}>
              {getSourceTypeProps(source.type).text}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Informasi Kontak">
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {source.contact_info}
            </div>
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
};


// =================================================================
// === KOMPONEN STAT CARD ===
// =================================================================
const StatCard = ({ title, value, icon, bgColor, loading }) => (
  <Card 
    bodyStyle={{ padding: '24px' }} 
    style={{
      background: '#FFFFFF',
      border: '1px solid #F0F0F0',
      boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1), 0px 1px 4px rgba(12, 12, 13, 0.05)',
      borderRadius: '12px',
      gap: '28px'
    }}
  >
    {loading ? (
      <Skeleton active avatar paragraph={{ rows: 1 }} />
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px', height: '100%' }}>
        <div 
          style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: bgColor
          }}
        >
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Text 
            style={{ 
              fontSize: '18px', 
              fontWeight: 600, 
              color: '#585858',
              lineHeight: '150%',
              marginBottom: 0
            }}
          >
            {title}
          </Text>
          <Text 
            style={{ 
              fontSize: '31px', 
              fontWeight: 700, 
              color: '#111928',
              lineHeight: '125%'
            }}
          >
            {formatRupiah(value)}
          </Text>
        </div>
      </div>
    )}
  </Card>
);

// =================================================================
// === KOMPONEN RINGKASAN CARD ===
// =================================================================
const RingkasanCard = ({ data, loading, onSourceClick }) => (
  <Card 
    bodyStyle={{ padding: '24px' }} 
    style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
      borderRadius: '8px',
      height: '100%'
    }}
  >
    <Title 
      level={5} 
      style={{ 
        fontFamily: 'Inter, sans-serif',
        fontSize: '22px', 
        fontWeight: 700, 
        color: '#111928',
        lineHeight: '28px',
        margin: 0,
        marginBottom: '20px'
      }}
    >
      Ringkasan Pendanaan per Sumber
    </Title>
    <Spin spinning={loading}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!loading && data.length === 0 && (
          <Text type="secondary">Belum ada data pendanaan.</Text>
        )}
        {data.map((item) => {
          const sourceType = getSourceTypeProps(item.source_type);
          
          return (
            <div key={item.source_name} style={{ marginBottom: '12px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Tag 
                    style={{ ...sourceType.style, cursor: 'pointer' }}
                    onClick={() => onSourceClick(item.source_id)} // <-- Klik Tag di sini
                  >
                    {sourceType.text}
                  </Tag>
                  <Text 
                    style={{ 
                      // fontFamily: 'Inter, sans-serif',
                      fontSize: '16px', 
                      fontWeight: 500, 
                      color: '#111928',
                      lineHeight: '19px'
                    }}
                  >
                    {formatRupiah(item.totalAmount)}
                  </Text>
                </div>
                <Text 
                  style={{ 
                    // fontFamily: 'Inter, sans-serif',
                    fontSize: '16px', 
                    fontWeight: 500, 
                    color: '#727272',
                    lineHeight: '19px'
                  }}
                >
                  {item.percent.toFixed(1)}% Terpakai
                </Text>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <Progress
                  percent={item.percent}
                  strokeColor="#1A56DB"
                  trailColor="#E5E7EB"
                  showInfo={false}
                  strokeWidth={6}
                />
              </div>
              <Text 
                style={{ 
                  // fontFamily: 'Inter, sans-serif',
                  fontSize: '16px', 
                  fontWeight: 500, 
                  color: '#727272',
                  lineHeight: '19px'
                }}
              >
                Terpakai {formatRupiah(item.totalTerpakai)}
              </Text>
            </div>
          );
        })}
        {loading && data.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Skeleton active paragraph={{ rows: 2 }} />
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        )}
      </div>
    </Spin>
  </Card>
);

// =================================================================
// === KOMPONEN FUNDING CARD (PERBAIKAN TOMBOL DETAIL) ===
// =================================================================
const FundingCard = ({ funding, onEditClick, onSourceClick, onDetailClick, canEdit }) => { // [RBAC] Tambah prop canEdit
  const status = getStatusProps(funding.status);
  const sourceType = getSourceTypeProps(funding.source_type);
  
  return (
    <div 
      style={{
        padding: '20px',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.15))',
        borderRadius: '8px',
        marginBottom: '10px'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            
            <Tag 
              style={{ ...sourceType.style, cursor: 'pointer' }}
              onClick={() => onSourceClick(funding.source)} // <-- Klik Tag = Detail SUMBER
            >
              {sourceType.text}
            </Tag>
            
            <Tag style={status.style}>
              {status.text}
            </Tag>
          </div>
          <Title 
            level={5} 
            style={{ 
              // fontFamily: 'Inter, sans-serif',
              fontSize: '20px', 
              fontWeight: 600, 
              color: '#111928',
              lineHeight: '24px',
              margin: 0
            }}
          >
            {funding.project_name || "Model Awal Pembangunan"}
          </Title>
          <Text 
            style={{ 
              // fontFamily: 'Inter, sans-serif',
              fontSize: '16px', 
              fontWeight: 500, 
              color: '#111928',
              lineHeight: '19px'
            }}
          >
            Tanggal: {formatTanggal(funding.date_received)}
          </Text>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-end',
          marginLeft: '16px'
        }}>
          <Text 
            style={{ 
              // fontFamily: 'Inter, sans-serif',
              fontSize: '16px', 
              fontWeight: 500, 
              color: '#7CB305',
              lineHeight: '19px',
              marginBottom: 0
            }}
          >
            {formatRupiah(funding.amount)}
          </Text>
          <Text 
            style={{ 
              // fontFamily: 'Inter, sans-serif',
              fontSize: '16px', 
              fontWeight: 500, 
              color: '#727272',
              lineHeight: '19px'
            }}
          >
            Tersisa {formatRupiah(funding.sisa_dana)}
          </Text>
        </div>
      </div>
      <div style={{ marginBottom: '14px' }}>
        <Progress
          percent={parseFloat(funding.persen_terpakai.toFixed(1))}
          strokeColor="#1A56DB"
          trailColor="#E5E7EB"
          showInfo={true}
          strokeWidth={6}
          format={(percent) => (
            <span style={{ 
              // fontFamily: 'Inter, sans-serif',
              fontSize: '12px', 
              color: '#6B7280', 
              fontWeight: 500,
              lineHeight: '18px'
            }}>
              {percent}%
            </span>
          )}
        />
      </div>
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        paddingTop: '14px'
      }}>
        <Button 
          style={{ 
            width: '128px',
            height: '40px',
            border: '1px solid #237804',
            borderRadius: '8px',
            color: '#237804',
            // fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '21px'
          }}
          onClick={() => onDetailClick(funding.id)} // <-- PERBAIKAN: Klik Tombol = Detail PENDANAAN
        >
          Detail
        </Button>
        
        {/* [RBAC] Tombol Edit hanya jika canEdit=true */}
        {canEdit && (
          <Button 
            style={{ 
              width: '128px',
              height: '40px',
              background: '#237804',
              borderColor: '#237804',
              borderRadius: '8px',
              color: '#FFFFFF',
              // fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '21px'
            }}
            onClick={() => onEditClick(funding)}
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
};


// =================================================================
// === KOMPONEN KONTEN UTAMA HALAMAN (DIMODIFIKASI) ===
// =================================================================
function PendanaanContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFunding, setEditingFunding] = useState(null);
  
  const [form] = Form.useForm();
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [sourceForm] = Form.useForm();
  
  const [detailSourceId, setDetailSourceId] = useState(null);
  
  // [RBAC] Cek Role
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  // Data Fetching
  const { data: reportData, isLoading: isLoadingReport } = useQuery({
    queryKey: ['financialReport', selectedAsset],
    queryFn: () => getFinancialReport({ asset: selectedAsset === 'all' ? undefined : selectedAsset }),
    staleTime: 1000 * 60,
  });

  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
    staleTime: 1000 * 60 * 5,
  });

  const { data: fundings, isLoading: isLoadingFundings } = useQuery({
    queryKey: ['fundings', selectedAsset],
    queryFn: () => getFundings({ asset_id: selectedAsset === 'all' ? undefined : selectedAsset }),
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

  // Data Processing
  const ringkasanData = useMemo(() => {
    if (!fundings) return [];
    
    const summary = new Map();
    
    fundings.forEach(funding => {
      const sourceName = funding.source_name || 'Tanpa Sumber';
      const sourceType = funding.source_type || 'unknown';
      const sourceId = funding.source;
      
      if (!summary.has(sourceName)) {
        summary.set(sourceName, {
          source_name: sourceName,
          source_type: sourceType,
          source_id: sourceId,
          totalAmount: 0,
          totalTerpakai: 0,
        });
      }
      
      const current = summary.get(sourceName);
      current.totalAmount += parseFloat(funding.amount);
      current.totalTerpakai += parseFloat(funding.total_terpakai);
    });
    
    return Array.from(summary.values()).map(item => ({
      ...item,
      percent: item.totalAmount > 0 ? (item.totalTerpakai / item.totalAmount) * 100 : 0,
    }));

  }, [fundings]);

  const assetOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'Semua Asset' }];
    if (assets) {
      assets.forEach(asset => {
        options.push({ value: asset.id, label: asset.name });
      });
    }
    return options;
  }, [assets]);

  const stats = reportData?.ringkasan_dana || {};
  const isLoadingStats = isLoadingReport;

  // Handlers
  const handleOpenModal = (funding) => {
    setEditingFunding(funding);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingFunding(null);
    form.resetFields();
  };
  
  const handleShowSourceModal = () => { setIsSourceModalOpen(true); };
  const handleCancelSourceModal = () => { setIsSourceModalOpen(false); sourceForm.resetFields(); };
  const handleSourceFormSubmit = (values) => { createSourceMutation.mutate(values); };
  
  // Handler untuk Detail SUMBER (dari Tag)
  const handleOpenSourceDetail = (id) => { setDetailSourceId(id); };
  const handleCloseSourceDetail = () => { setDetailSourceId(null); };

  // --- HANDLER BARU: Untuk Detail PENDANAAN (dari tombol "Detail") ---
  const handleOpenFundingDetail = (id) => {
    router.push(`/admin/pendanaan/${id}`);
  };

  // Render
  return (
    <div style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100vh' }}> 
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '24px',
        gap: '16px'
      }}>
        <div>
          <Title 
            level={2} 
            style={{ 
              // fontFamily: 'Inter, sans-serif',
              fontSize: '30px', 
              fontWeight: 700, 
              color: '#111928',
              lineHeight: '38px',
              margin: 0,
              marginBottom: '6px'
            }}
          >
            Manajemen Pendanaan
          </Title>
          <Text 
            style={{ 
              // fontFamily: 'Inter, sans-serif',
              fontSize: '16px', 
              fontWeight: 500, 
              color: '#727272',
              lineHeight: '19px'
            }}
          >
            Kelola semua sumber pendanaan dan alokasi dana
          </Text>
        </div>
        
        {/* [RBAC] Tombol Tambah hanya untuk Admin/Superadmin */}
        {canEdit && (
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            style={{ 
              background: '#237804',
              borderColor: '#237804',
              borderRadius: '24px',
              height: '40px',
              padding: '8px 16px',
              // fontFamily: 'Roboto, sans-serif',
              fontWeight: 400,
              fontSize: '16px',
              boxShadow: '0px 2px 0px rgba(0, 0, 0, 0.043)',
              lineHeight: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => handleOpenModal(null)}
          >
            Tambah Pendanaan
          </Button>
        )}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '24px' }}>
        <Text 
          style={{ 
            // fontFamily: 'Inter, sans-serif',
            fontSize: '20px', 
            fontWeight: 500, 
            color: '#111928',
            lineHeight: '24px',
            marginBottom: '8px',
            display: 'block'
          }}
        >
          Filter Asset
        </Text>
        <Select
          value={selectedAsset}
          onChange={setSelectedAsset}
          loading={isLoadingAssets}
          options={assetOptions}
          suffixIcon={<ChevronDown size={12} />}
          style={{ 
            width: 200,
            height: '40px',
            // fontFamily: 'Roboto, sans-serif'
          }}
          size="large"
        />
      </div>

      {/* Stat Cards */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '18px' }}>
          <StatCard
            title="Total Pendanaan"
            value={stats.total_dana_masuk}
            icon={<FaMoneyBillTransfer size={34} />}
            bgColor="#7CB305"
            loading={isLoadingStats}
          />
        </div>
        <Row gutter={18}>
          <Col xs={24} sm={12}>
            <StatCard
              title="Dana Terpakai"
              value={stats.total_pengeluaran}
              icon={<GiPayMoney size={34} />}
              bgColor="#1C64F2"
              loading={isLoadingStats}
            />
          </Col>
          <Col xs={24} sm={12}>
            <StatCard
              title="Dana Tersisa"
              value={stats.sisa_dana}
              icon={<FaMoneyBills size={34} />}
              bgColor="#9061F9"
              loading={isLoadingStats}
            />
          </Col>
        </Row>
      </div>

      {/* Main Content */}
    <Row gutter={[0, 24]}>
    {/* Ringkasan - Atas */}
    <Col xs={24}> 
        <RingkasanCard 
          data={ringkasanData} 
          loading={isLoadingFundings} 
          onSourceClick={handleOpenSourceDetail} // <-- Pass handler u/ detail SUMBER
        />
    </Col>
    
    {/* List Pendanaan - Bawah */}
    <Col xs={24}> 
        <Card 
        bodyStyle={{ padding: '24px' }} 
        style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
            borderRadius: '8px'
        }}
        >
        <Title 
            level={5} 
            style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '22px', 
            fontWeight: 700, 
            color: '#111928',
            lineHeight: '28px',
            margin: 0,
            marginBottom: '20px'
            }}
        >
            Pendanaan per Sumber
        </Title>
        
        <Spin spinning={isLoadingFundings}>
            {fundings && fundings.length > 0 ? (
            <div>
                {fundings.map(funding => (
                <FundingCard 
                    key={funding.id} 
                    funding={funding} 
                    canEdit={canEdit} // [RBAC] Pass canEdit
                    onEditClick={handleOpenModal}
                    onSourceClick={handleOpenSourceDetail} // <-- handler u/ detail SUMBER (dari Tag)
                    onDetailClick={handleOpenFundingDetail} // <-- handler u/ detail PENDANAAN (dari Tombol)
                />
                ))}
            </div>
            ) : (
            !isLoadingFundings && (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <Text type="secondary">
                    Tidak ada data pendanaan untuk filter ini.
                </Text>
                </div>
            )
            )}
            {isLoadingFundings && fundings === undefined && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Skeleton active paragraph={{ rows: 4 }} />
                <Skeleton active paragraph={{ rows: 4 }} />
            </div>
            )}
        </Spin>
        </Card>
    </Col>
    </Row>
            
      {/* Modal Edit/Tambah PENDANAAN */}
      <FundingModal 
        visible={modalVisible} 
        onClose={handleCloseModal} 
        initialData={editingFunding} 
        form={form}
        handleShowSourceModal={handleShowSourceModal}
      />

      {/* Modal Tambah SUMBER DANA */}
      <FundingSourceFormModal 
        open={isSourceModalOpen} 
        form={sourceForm} 
        onCancel={handleCancelSourceModal} 
        onSubmit={handleSourceFormSubmit} 
        isSubmitting={createSourceMutation.isPending} 
      />
      
      {/* Modal Detail SUMBER DANA (dari Tag) */}
      <FundingSourceDetailModal
        visible={!!detailSourceId}
        onClose={handleCloseSourceDetail}
        sourceId={detailSourceId}
      />
    </div>
  );
}

export default function PendanaanPage() {
  return (
    // [RBAC] Operator tidak boleh akses
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Viewer']}>
      <PendanaanContent />
    </ProtectedRoute>
  );
}