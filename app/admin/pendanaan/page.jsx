'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import moment from 'moment';

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

import {
  PlusCircleOutlined,
  PlusOutlined,
  BankOutlined,
  InfoCircleOutlined,
  FilterOutlined 
} from '@ant-design/icons';
import { FaMoneyBillTransfer, FaMoneyBills } from 'react-icons/fa6';
import { GiPayMoney } from 'react-icons/gi';
import { ChevronDown } from 'lucide-react';

import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore'; 
// HAPUS IMPORT YANG HILANG DI BE
// import { getFinancialReport } from '@/lib/api/reporting';
import { getAssets } from '@/lib/api/asset';
// import { getProjects } from '@/lib/api/project';
// import { getFundingSources... } 
import {
  getFundings,
  createFunding,
  updateFunding,
} from '@/lib/api/funding';

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
    case 'available': text = 'Tersedia'; break;
    case 'allocated': text = 'Dialokasikan'; break;
    case 'used': text = 'Digunakan'; break;
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

// Map manual tipe karena master source dihapus
const SOURCE_TYPE_MAP = {
  'foundation': 'Yayasan',
  'csr': 'CSR',
  'investor': 'Investor',
  'bank': 'Bank',
  'personal': 'Pribadi',
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
  
  text = SOURCE_TYPE_MAP[type] || type || 'Umum';
  
  if (!SOURCE_TYPE_MAP[type]) {
    style.background = '#F3F4F6'; 
    style.color = '#374151';
  }
  
  return { text, style }; 
};

// MODAL UTAMA: CREATE/EDIT FUNDING
const FundingModal = ({ visible, onClose, initialData, form }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(initialData);

  const createMutation = useMutation({
    mutationFn: createFunding,
    onSuccess: () => {
      message.success('Pendanaan berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['fundings'] });
      onClose();
    },
    onError: (err) => {
      console.error("Error creating funding:", err);
      message.error('Gagal menambahkan pendanaan.');
    },
    onSettled: () => setIsSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: updateFunding,
    onSuccess: () => {
      message.success('Pendanaan berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['fundings'] });
      onClose();
    },
    onError: (err) => {
      console.error("Error updating funding:", err);
      message.error('Gagal memperbarui pendanaan.');
    },
    onSettled: () => setIsSubmitting(false),
  });
  
  useEffect(() => {
    if (visible) {
      if (isEditMode && initialData) {
        form.setFieldsValue({
          ...initialData,
          date_received: moment(initialData.date_received, 'YYYY-MM-DD'),
          source_name: initialData.source_name || initialData.source, // String Name
          type: initialData.type || 'investor'
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
      project: null, // Hapus relasi project
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
            {/* INPUT MANUAL SUMBER DANA */}
            <Form.Item
              name="source_name"
              label="Nama Sumber Dana / Investor"
              rules={[{ required: true, message: 'Sumber dana harus diisi' }]}
            >
              <Input placeholder="Contoh: Bank BRI / Bapak Budi" />
            </Form.Item>
          </Col>
          <Col span={12}>
             <Form.Item
              name="type"
              label="Tipe Sumber"
              rules={[{ required: true }]}
            >
              <Select placeholder="Pilih tipe">
                 {Object.entries(SOURCE_TYPE_MAP).map(([key, label]) => (
                    <Option key={key} value={key}>{label}</Option>
                 ))}
              </Select>
            </Form.Item>
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
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
           <Col span={12}>
            <Form.Item
              name="date_received"
              label="Tanggal Diterima"
              rules={[{ required: true, message: 'Tanggal harus diisi' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
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

// STATS CARD COMPONENT (Visual)
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

// RINGKASAN CARD COMPONENT (Logic visualisasi data grouping)
const RingkasanCard = ({ data, loading }) => (
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
        {data.map((item, index) => {
          const sourceType = getSourceTypeProps(item.source_type);
          
          return (
            <div key={index} style={{ marginBottom: '12px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Tag style={{ ...sourceType.style }}>
                    {sourceType.text}
                  </Tag>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>
                    {item.source_name}
                  </Text>
                </div>
                <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>
                    {formatRupiah(item.totalAmount)}
                </Text>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <Progress
                  percent={100} // Selalu 100 karena konsep terpakai vs sisa agak bias di global, kita visual full bar saja sebagai representasi
                  strokeColor="#1A56DB"
                  trailColor="#E5E7EB"
                  showInfo={false}
                  strokeWidth={6}
                />
              </div>
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

// FUNDING ITEM CARD
const FundingCard = ({ funding, onEditClick, canEdit }) => { 
  const status = getStatusProps(funding.status);
  const sourceType = getSourceTypeProps(funding.type || 'investor');
  
  // Karena field source adalah string, kita pakai itu
  const sourceNameDisplay = funding.source_name || funding.source || 'Sumber Umum';

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
            
            <Tag style={{ ...sourceType.style }}>
              {sourceType.text}
            </Tag>
            
            <Tag style={status.style}>
              {status.text}
            </Tag>
          </div>
          <Title 
            level={5} 
            style={{ 
              fontSize: '20px', 
              fontWeight: 600, 
              color: '#111928',
              lineHeight: '24px',
              margin: 0
            }}
          >
            {sourceNameDisplay}
          </Title>
          <Text 
            style={{ 
              fontSize: '16px', 
              fontWeight: 500, 
              color: '#111928',
              lineHeight: '19px'
            }}
          >
            {funding.purpose || 'Pendanaan Umum'}
          </Text>
          <Text type="secondary">
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
              fontSize: '16px', 
              fontWeight: 500, 
              color: '#7CB305',
              lineHeight: '19px',
              marginBottom: 0
            }}
          >
            {formatRupiah(funding.amount)}
          </Text>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        paddingTop: '14px'
      }}>
        {canEdit && (
          <Button 
            style={{ 
              width: '128px',
              height: '40px',
              background: '#237804',
              borderColor: '#237804',
              borderRadius: '8px',
              color: '#FFFFFF',
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

// MAIN CONTENT
function PendanaanContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); 

  const [modalVisible, setModalVisible] = useState(false);
  const [editingFunding, setEditingFunding] = useState(null);
  
  const [form] = Form.useForm();
  
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  let pageTitle = "Laporan Pendanaan";
  let pageDesc = "Ringkasan aliran dana masuk dan penggunaannya.";

  if (canEdit) {
    pageTitle = "Manajemen Pendanaan";
    pageDesc = "Kelola semua sumber pendanaan global";
  }

  // --- HAPUS LOGIC REPORTING ---
  // const { data: reportData } = useQuery...

  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
    staleTime: 1000 * 60 * 5,
  });

  const { data: rawFundings, isLoading: isLoadingFundings } = useQuery({
    queryKey: ['fundings'],
    queryFn: () => getFundings({}),
  });
  
  const fundings = useMemo(() => {
    if (!rawFundings) return [];
    let filtered = rawFundings;
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(f => f.status === selectedStatus);
    }
    return filtered;
  }, [rawFundings, selectedStatus]);

  // Kalkulasi Ringkasan Manual
  const ringkasanData = useMemo(() => {
    if (!fundings) return [];
    
    const summary = new Map();
    
    fundings.forEach(funding => {
      const sourceName = funding.source_name || 'Tanpa Sumber';
      const sourceType = funding.type || 'investor';
      
      if (!summary.has(sourceName)) {
        summary.set(sourceName, {
          source_name: sourceName,
          source_type: sourceType,
          totalAmount: 0,
        });
      }
      
      const current = summary.get(sourceName);
      current.totalAmount += parseFloat(funding.amount);
    });
    
    return Array.from(summary.values());
  }, [fundings]);

  // Kalkulasi Stats Manual
  const stats = useMemo(() => {
      if(!rawFundings) return { total_dana_masuk: 0 };
      const total = rawFundings.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
      return { total_dana_masuk: total };
  }, [rawFundings]);

  const assetOptions = useMemo(() => {
    const options = [
      { value: 'all', label: 'Tampilkan Semua' }, 
    ];
    if (assets) {
      assets.forEach(asset => {
        options.push({ value: asset.id, label: asset.name });
      });
    }
    return options;
  }, [assets]);

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'available', label: 'Tersedia' },
    { value: 'allocated', label: 'Dialokasikan' },
    { value: 'used', label: 'Digunakan' },
  ];

  const handleOpenModal = (funding) => {
    setEditingFunding(funding);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingFunding(null);
    form.resetFields();
  };
  
  return (
    <div style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100vh' }}> 
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '24px',
        gap: '16px'
      }}>
        <div>
          <Title level={2} style={{ fontSize: '30px', fontWeight: 700, color: '#111928', lineHeight: '38px', margin: 0, marginBottom: '6px' }}>
            {pageTitle}
          </Title>
          <Text style={{ fontSize: '16px', fontWeight: 500, color: '#727272', lineHeight: '19px' }}>
            {pageDesc}
          </Text>
        </div>
        
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

      <Card bodyStyle={{ padding: '20px' }} style={{ marginBottom: '24px', borderRadius: '12px', border: '1px solid #F0F0F0', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        <Row gutter={[16, 16]} align="middle">
          {/* <Col xs={24} md={12} lg={8}>
             FILTER ASET BISA DIHIDUPKAN JIKA API SUPPORT
          </Col> */}
          <Col xs={24} md={12} lg={8}>
            <Text style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>
              Filter Status Dana
            </Text>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statusOptions}
              suffixIcon={<FilterOutlined />}
              style={{ width: '100%', height: '42px' }}
              size="large"
            />
          </Col>
        </Row>
      </Card>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '18px' }}>
          <StatCard
            title="Total Pendanaan"
            value={stats.total_dana_masuk}
            icon={<FaMoneyBillTransfer size={34} />}
            bgColor="#7CB305"
            loading={isLoadingFundings}
          />
        </div>
      </div>

    <Row gutter={[0, 24]}>
    <Col xs={24}> 
        <RingkasanCard 
          data={ringkasanData} 
          loading={isLoadingFundings} 
        />
    </Col>
    
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
            Daftar Pendanaan
        </Title>
        
        <Spin spinning={isLoadingFundings}>
            {fundings && fundings.length > 0 ? (
            <div>
                {fundings.map(funding => (
                <FundingCard 
                    key={funding.id} 
                    funding={funding} 
                    canEdit={canEdit} 
                    onEditClick={handleOpenModal}
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
            {isLoadingFundings && rawFundings === undefined && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Skeleton active paragraph={{ rows: 4 }} />
                <Skeleton active paragraph={{ rows: 4 }} />
            </div>
            )}
        </Spin>
        </Card>
    </Col>
    </Row>
            
      <FundingModal 
        visible={modalVisible} 
        onClose={handleCloseModal} 
        initialData={editingFunding} 
        form={form}
      />
    </div>
  );
}

export default function PendanaanPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Viewer']}>
      <PendanaanContent />
    </ProtectedRoute>
  );
}