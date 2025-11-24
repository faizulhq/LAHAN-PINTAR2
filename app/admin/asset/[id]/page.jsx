'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Button, Typography, Space, Tag, Flex, Spin, Alert, Descriptions, Row, Col,
  Modal, Form, Input, Select, DatePicker, InputNumber, Upload, message
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DollarCircleFilled, UploadOutlined, PlusOutlined,
  UserOutlined, PhoneOutlined, BankOutlined
} from '@ant-design/icons';
import { MdLocationPin } from 'react-icons/md';
import { TbArrowsMaximize } from 'react-icons/tb';
import { BiSolidCalendar } from 'react-icons/bi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getAssets, getOwners, updateAsset, createOwner } from '@/lib/api/asset';

const { Title, Text } = Typography;
const { Option } = Select;

// ==================== CONSTANTS ====================
const ASSET_TYPE_PROPS = {
  'bangunan': { text: 'Bangunan', color: 'blue' },
  'lahan': { text: 'Lahan', color: 'red' },
  'ternak': { text: 'Ternak', color: 'green' },
  'alat': { text: 'Alat', color: 'purple' },
};

const OWNERSHIP_STATUS_CHOICES = {
  'full_ownership': 'Full Ownership',
  'partial_ownership': 'Partial Ownership',
  'investor_owned': 'Investor Owned',
  'leashold': 'Leased',
  'under_construction': 'Under Construction',
  'personal_ownership': 'Personal Ownership',
};

// ==================== HELPER FUNCTIONS ====================
const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => value != null ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';
const getAssetTypeProps = (type) => ASSET_TYPE_PROPS[type] || { text: type, color: 'default' };

// ==================== INFO CARD COMPONENT ====================
const InfoCard = ({ icon, label, value, iconColor }) => (
  <Card 
    style={{
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
    }}
  >
    <Flex align="center" gap={16}>
      <div style={{ color: iconColor, fontSize: '32px', flexShrink: 0 }}>
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

// ==================== OWNER FORM MODAL ====================
const OwnerFormModal = ({ open, onCancel, onSubmit, isSubmitting, form }) => (
  <Modal
    title="Tambah Pemilik Lahan Baru"
    open={open}
    onCancel={onCancel}
    footer={null}
    width={500}
    zIndex={1001}
    destroyOnClose
  >
    <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 24 }}>
      <Form.Item label="Nama Pemilik" name="nama" rules={[{ required: true, message: 'Nama wajib diisi' }]}>
        <Input prefix={<UserOutlined />} placeholder="Masukkan nama lengkap" />
      </Form.Item>
      <Form.Item label="Kontak (HP/Email)" name="kontak" rules={[{ required: true, message: 'Kontak wajib diisi' }]}>
        <Input prefix={<PhoneOutlined />} placeholder="cth: 08123456789" />
      </Form.Item>
      <Form.Item label="Alamat" name="alamat">
        <Input.TextArea placeholder="Masukkan alamat lengkap" rows={3} />
      </Form.Item>
      <Form.Item label="Bank" name="bank">
        <Input prefix={<BankOutlined />} placeholder="cth: BCA, Mandiri, BRI" />
      </Form.Item>
      <Form.Item label="No. Rekening" name="no_rekening">
        <Input placeholder="Masukkan nomor rekening" />
      </Form.Item>
      <Form.Item style={{ textAlign: 'right', marginTop: 16, marginBottom: 0 }}>
        <Space>
          <Button onClick={onCancel}>Batal</Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Simpan Pemilik
          </Button>
        </Space>
      </Form.Item>
    </Form>
  </Modal>
);

// ==================== ASSET FORM MODAL ====================
const AssetFormModal = ({ 
  open, asset, form, owners, isLoadingOwners, 
  onCancel, onSubmit, isSubmitting, onAddOwner 
}) => (
  <Modal
    title="Edit Aset"
    open={open}
    onCancel={onCancel}
    footer={null}
    width={600}
    zIndex={1000}
  >
    <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 24 }}>
      <Form.Item label="Nama Aset" name="name" rules={[{ required: true, message: 'Nama aset wajib diisi' }]}>
        <Input placeholder="Masukkan nama aset" />
      </Form.Item>

      <Form.Item label="Tipe Aset" name="type" rules={[{ required: true, message: 'Tipe aset wajib dipilih' }]}>
        <Select placeholder="Pilih tipe aset">
          {Object.entries(ASSET_TYPE_PROPS).map(([value, { text }]) => (
            <Option key={value} value={value}>{text}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Lokasi" name="location" rules={[{ required: true, message: 'Lokasi wajib diisi' }]}>
        <Input placeholder="Masukkan lokasi" />
      </Form.Item>

      <Form.Item label="Ukuran (m²)" name="size" rules={[{ required: true, message: 'Ukuran wajib diisi' }]}>
        <InputNumber style={{ width: '100%' }} placeholder="Masukkan ukuran" min={0} />
      </Form.Item>

      <Form.Item label="Nilai (Rp)" name="value" rules={[{ required: true, message: 'Nilai wajib diisi' }]}>
        <InputNumber 
          style={{ width: '100%' }} 
          placeholder="Masukkan nilai" 
          min={0}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value.replace(/Rp\s?|(\.*)/g, '').replace(/,/g, '')}
        />
      </Form.Item>

      <Form.Item label="Tanggal Akuisisi" name="acquisition_date" rules={[{ required: true, message: 'Tanggal wajib diisi' }]}>
        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
      </Form.Item>

      <Form.Item label="Status Kepemilikan" name="ownership_status" rules={[{ required: true, message: 'Status wajib dipilih' }]}>
        <Select placeholder="Pilih status kepemilikan">
          {Object.entries(OWNERSHIP_STATUS_CHOICES).map(([value, text]) => (
            <Option key={value} value={value}>{text}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item 
        label="Pemilik Lahan" 
        name="landowner"
        tooltip="Pemilik fisik lahan/aset yang akan dapat bagi hasil"
      >
        <Select 
          placeholder="Pilih pemilik lahan" 
          allowClear 
          loading={isLoadingOwners}
          showSearch
          optionFilterProp="children"
        >
          {owners?.map(owner => (
            <Option key={owner.id} value={owner.id}>
              {owner.nama} {owner.kontak && `(${owner.kontak})`}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Button 
        type="link" 
        icon={<PlusOutlined />} 
        onClick={onAddOwner} 
        style={{ paddingLeft: 0, marginTop: '-16px', marginBottom: '16px' }}
      >
        Tambah Pemilik Lahan Baru
      </Button>

      <Form.Item 
        label="% Bagi Hasil Pemilik" 
        name="landowner_share_percentage"
        tooltip="Persentase keuntungan untuk pemilik lahan (default 10%)"
        rules={[{ required: true, message: '% Bagi Hasil wajib diisi' }]}
      >
        <InputNumber 
          style={{ width: '100%' }} 
          min={0} 
          max={100} 
          formatter={value => `${value}%`}
          parser={value => value.replace('%', '')}
        />
      </Form.Item>

      <Form.Item 
        label="URL Dokumen" 
        name="document_url"
        tooltip="Link Google Drive, Dropbox, atau URL dokumen lainnya"
      >
        <Input 
          placeholder="https://drive.google.com/file/d/..." 
          prefix={<UploadOutlined />}
        />
      </Form.Item>

      <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>Batal</Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Perbarui
          </Button>
        </Space>
      </Form.Item>
    </Form>
  </Modal>
);

// ==================== MAIN COMPONENT ====================
function AssetDetailContent() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const assetId = params.id;

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [ownerForm] = Form.useForm();

  // Data Fetching
  const { data: assets, isLoading: isLoadingAssets, isError, error } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const { data: owners, isLoading: isLoadingOwners } = useQuery({
    queryKey: ['owners'],
    queryFn: getOwners
  });

  const asset = assets?.find(a => a.id === parseInt(assetId));
  const owner = owners?.find(o => o.id === asset?.landowner);
  
  const typeProps = asset ? getAssetTypeProps(asset.type) : null;
  const isLoading = isLoadingAssets || isLoadingOwners;

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAsset(id, data),
    onSuccess: () => {
      message.success('Aset berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Terjadi kesalahan'}`);
    }
  });

  const createOwnerMutation = useMutation({
    mutationFn: createOwner,
    onSuccess: (newOwner) => {
      message.success(`Pemilik Lahan "${newOwner.nama}" berhasil ditambahkan`);
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      setIsOwnerModalOpen(false);
      ownerForm.resetFields();
      form.setFieldsValue({ landowner: newOwner.id });
    },
    onError: (err) => {
      let errorMsg = 'Gagal menambahkan pemilik.';
      if (err.response?.data) {
        const errors = err.response.data;
        const firstKey = Object.keys(errors)[0];
        if (firstKey && Array.isArray(errors[firstKey])) {
          errorMsg = `${errors[firstKey][0]}`;
        } else if (errors.detail) {
          errorMsg = errors.detail;
        }
      } else {
        errorMsg = err.message;
      }
      message.error(`Error: ${errorMsg}`);
    }
  });

  // Handlers
  const handleBack = () => {
    router.push('/admin/asset');
  };

  const handleEdit = () => {
    if (!asset) return;
    
    form.setFieldsValue({
      name: asset.name,
      type: asset.type,
      location: asset.location,
      size: asset.size,
      value: asset.value,
      acquisition_date: asset.acquisition_date ? moment(asset.acquisition_date) : null,
      ownership_status: asset.ownership_status,
      landowner: asset.landowner,
      landowner_share_percentage: asset.landowner_share_percentage || 10,
      document_url: asset.document_url || '',
    });
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleFormSubmit = async (values) => {
    const formData = {
      ...values,
      acquisition_date: values.acquisition_date ? values.acquisition_date.format('YYYY-MM-DD') : null,
    };
    
    if (!formData.landowner) {
      formData.landowner = null;
    }

    updateMutation.mutate({ id: asset.id, data: formData });
  };

  const handleShowOwnerModal = () => {
    setIsOwnerModalOpen(true);
  };

  const handleCancelOwnerModal = () => {
    setIsOwnerModalOpen(false);
    ownerForm.resetFields();
  };

  const handleOwnerFormSubmit = (values) => {
    createOwnerMutation.mutate(values);
  };

  // Render Loading
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  // Render Error
  if (isError) {
    return (
      <Alert 
        message="Error Memuat Data" 
        description={error?.message || 'Gagal memuat data aset'} 
        type="error" 
        showIcon 
      />
    );
  }

  // Render Not Found
  if (!asset) {
    return (
      <Alert 
        message="Aset Tidak Ditemukan" 
        description="Aset yang Anda cari tidak tersedia" 
        type="warning" 
        showIcon 
      />
    );
  }

  return (
    <>
      {/* Header */}
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
              Detail Aset
            </Title>
            <Text style={{ 
              fontSize: '16px',
              fontWeight: 500,
              color: '#727272',
              lineHeight: '19px', 
            }}>
              Informasi lengkap mengenai aset
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
          loading={updateMutation.isPending}
        >
          Edit Aset
        </Button>
      </Flex>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Left Column - Main Info */}
        <Col xs={24} lg={16}>
          <Card 
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
              marginBottom: 24,
            }}
          >
            <Flex justify="space-between" align="start" style={{ marginBottom: 24 }}>
              <div>
                <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
                  {asset.name}
                </Title>
                <Tag 
                  color={typeProps.color}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  {typeProps.text}
                </Tag>
              </div>
              <Text style={{ 
                fontWeight: 600,
                fontSize: '24px',
                color: '#7CB305',
              }}>
                {formatRupiah(asset.value)}
              </Text>
            </Flex>

            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Flex align="center" gap={12}>
                <MdLocationPin style={{ color: '#CF1322', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>
                    Lokasi
                  </Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>
                    {asset.location}
                  </Text>
                </div>
              </Flex>

              <Flex align="center" gap={12}>
                <TbArrowsMaximize style={{ color: '#D46B08', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>
                    Ukuran
                  </Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>
                    {asset.size} m²
                  </Text>
                </div>
              </Flex>

              <Flex align="center" gap={12}>
                <BiSolidCalendar style={{ color: '#531DAB', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>
                    Tanggal Akuisisi
                  </Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>
                    {formatDate(asset.acquisition_date)}
                  </Text>
                </div>
              </Flex>
            </Space>
          </Card>

          {/* Detail Information */}
          <Card 
            title="Informasi Detail"
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Status Kepemilikan">
                <Text style={{ fontWeight: 500 }}>
                  {OWNERSHIP_STATUS_CHOICES[asset.ownership_status] || asset.ownership_status}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Pemilik Lahan">
                <Text style={{ fontWeight: 500 }}>
                  {owner?.nama || '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Kontak Pemilik">
                <Text style={{ fontWeight: 500 }}>
                  {owner?.kontak || '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="% Bagi Hasil Pemilik">
                <Text style={{ fontWeight: 500, color: '#7CB305' }}>
                  {asset.landowner_share_percentage ? `${asset.landowner_share_percentage}%` : '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Dokumen">
                {asset.document_url ? (
                  <a 
                    href={asset.document_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontWeight: 500, color: '#1890ff' }}
                  >
                    {asset.document_url.split('/').pop() || 'Lihat Dokumen'}
                  </a>
                ) : (
                  <Text style={{ fontWeight: 500, color: '#999' }}>-</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Right Column - Stats */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size={24}>
            <InfoCard
              icon={<DollarCircleFilled />}
              label="Total Investasi"
              value={formatRupiah(asset.total_investment || 0)}
              iconColor="#7CB305"
            />
            
            <InfoCard
              icon={<TbArrowsMaximize />}
              label="Luas Total"
              value={`${asset.size} m²`}
              iconColor="#D46B08"
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
                  <Text style={{ color: '#6B7280' }}>ID Aset</Text>
                  <Text style={{ fontWeight: 600 }}>#{asset.id}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>Tipe</Text>
                  <Text style={{ fontWeight: 600 }}>{typeProps.text}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>Status</Text>
                  <Tag color="green">Aktif</Tag>
                </Flex>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Edit Modal */}
      <AssetFormModal
        open={isModalOpen}
        asset={asset}
        form={form}
        owners={owners}
        isLoadingOwners={isLoadingOwners}
        onCancel={handleModalCancel}
        onSubmit={handleFormSubmit}
        isSubmitting={updateMutation.isPending}
        onAddOwner={handleShowOwnerModal}
      />

      {/* Owner Modal */}
      <OwnerFormModal
        open={isOwnerModalOpen}
        form={ownerForm}
        onCancel={handleCancelOwnerModal}
        onSubmit={handleOwnerFormSubmit}
        isSubmitting={createOwnerMutation.isPending}
      />
    </>
  );
}

export default function AssetDetailPage() {
  return (
    <ProtectedRoute>
      <AssetDetailContent />
    </ProtectedRoute>
  );
}