'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Row, Col, Card, Input, Select, Button, Typography, Space, Tag, Flex,
  Modal, Form, DatePicker, InputNumber, message, Spin, Alert, Popconfirm, Descriptions, Skeleton
} from 'antd';
import {
  PlusOutlined, SearchOutlined,
  EditOutlined, DeleteOutlined, EyeOutlined, UploadOutlined,
  UserOutlined, PhoneOutlined, BankOutlined,
  DollarCircleFilled,
  PlusCircleOutlined
} from '@ant-design/icons';
import { PiFileTextFill } from 'react-icons/pi';
import { RiMoneyDollarCircleFill } from 'react-icons/ri';
import { MdLocationPin } from 'react-icons/md';
import { TbArrowsMaximize } from 'react-icons/tb';
import { BiSolidCalendar } from 'react-icons/bi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore'; // [RBAC] Import Auth Store
import { getAssets, createAsset, updateAsset, deleteAsset, getOwners, createOwner } from '@/lib/api/asset';

const { Title, Text } = Typography;
const { Search } = Input;
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

// ==================== COMPONENTS ====================

// Stat Card Component
const StatCard = ({ title, value, icon, loading, format = "number", iconColor }) => {
  const displayValue = () => {
    if (loading) return <Skeleton.Input active size="small" style={{ width: 120, height: 38 }} />;
    if (format === 'rupiah') return formatRupiah(value);
    return Number(value).toLocaleString('id-ID');
  };

  return (
    <Card 
      bodyStyle={{ padding: '16px' }} 
      style={{
        background: '#FFFFFF',
        border: '1px solid #F0F0F0',
        borderRadius: '12px',
        boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1), 0px 1px 4px rgba(12, 12, 13, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px', height: '100%' }}>
        <div 
          style={{
            flexShrink: 0,
            color: iconColor || '#7CB305',
            fontSize: '34px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '10px 0' }}>
          <Text 
            style={{ 
              fontSize: '18px', 
              fontWeight: 600, 
              color: '#585858',
              lineHeight: '150%',
            }}
          >
            {title}
          </Text>
          <Text 
            style={{ 
              fontSize: '31px', 
              fontWeight: 700, 
              color: '#111928',
              lineHeight: '125%',
            }}
          >
            {displayValue()}
          </Text>
        </div>
      </div>
    </Card>
  );
};

// Statistics Cards Component
const StatisticsCards = ({ stats, isLoading }) => (
  <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
    <Col xs={24} lg={8}>
      <StatCard 
        title="Total Aset"
        value={stats.total}
        icon={<PiFileTextFill />}
        loading={isLoading}
        iconColor="#0958D9"
      />
    </Col>
    <Col xs={24} lg={8}>
      <StatCard 
        title="Total Nilai"
        value={stats.value}
        icon={<DollarCircleFilled />}
        loading={isLoading}
        format="rupiah"
        iconColor="#7CB305"
      />
    </Col>
    <Col xs={24} lg={8}>
      <StatCard 
        title="Lokasi"
        value={stats.locations}
        icon={<MdLocationPin />}
        loading={isLoading}
        iconColor="#CF1322"
      />
    </Col>
  </Row>
);

// Asset Card Component (Modified with RBAC)
const AssetCard = ({ asset, onDetail, onEdit, onDelete, canEdit }) => { // [RBAC] Terima prop canEdit
  const typeProps = getAssetTypeProps(asset.type);
  const isDeleting = onDelete.isPending && onDelete.variables === asset.id;

  return (
    <Card 
      hoverable
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: '12px' }}>
        <Title 
          level={5} 
          style={{ 
            margin: 0,
            fontWeight: 500,
            fontSize: '18px',
            lineHeight: '22px',
            color: '#111928',
          }}
        >
          {asset.name}
        </Title>
      </Flex>

      <Flex justify="space-between" align="center" style={{ marginBottom: '12px' }}>
        <Tag 
          color={typeProps.color}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            lineHeight: '17px',
          }}
        >
          {typeProps.text}
        </Tag>
        <Text 
          style={{ 
            fontWeight: 500,
            fontSize: '16px',
            lineHeight: '19px',
            color: '#7CB305',
          }}
        >
          {formatRupiah(asset.value)}
        </Text>
      </Flex>

      <Space 
        direction="vertical" 
        style={{ width: '100%', marginTop: '12px' }} 
        size={12}
      >
        <Flex align="center" gap={4}>
          <MdLocationPin style={{ color: '#CF1322', fontSize: '24px', flexShrink: 0 }} />
          <Text 
            style={{ 
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '150%',
              color: '#6B7280',
            }}
          >
            {asset.location}
          </Text>
        </Flex>
        <Flex align="center" gap={4}>
          <TbArrowsMaximize style={{ color: '#D46B08', fontSize: '24px', flexShrink: 0 }} />
          <Text 
            style={{ 
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '150%',
              color: '#6B7280',
            }}
          >
            {asset.size}m²
          </Text>
        </Flex>
        <Flex align="center" gap={4}>
          <BiSolidCalendar style={{ color: '#531DAB', fontSize: '24px', flexShrink: 0 }} />
          <Text 
            style={{ 
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '150%',
              color: '#6B7280',
            }}
          >
            {formatDate(asset.acquisition_date)}
          </Text>
        </Flex>
      </Space>

      <Flex gap={20} style={{ paddingTop: '24px' }}>
        <Button 
          onClick={() => onDetail(asset)}
          style={{ 
            flex: 1,
            height: '40px',
            border: '1px solid #237804',
            borderRadius: '8px',
            fontWeight: 500,
            fontSize: '14px',
            color: '#237804',
            background: 'transparent',
          }}
        >
          Detail
        </Button>
        
        {/* [RBAC] Tombol Edit disembunyikan jika user tidak punya akses edit */}
        {canEdit && (
          <Button 
            onClick={() => onEdit(asset)}
            style={{ 
              flex: 1,
              height: '40px',
              background: '#237804',
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '14px',
              color: '#FFFFFF',
              border: 'none',
            }}
          >
            Edit
          </Button>
        )}
      </Flex>
    </Card>
  );
};

// Search and Filter Component
const SearchFilter = ({ searchTerm, onSearchChange, selectedType, onTypeChange }) => (
  <Card style={{ marginBottom: 24 }}>
    <Title level={4} style={{ marginTop: 0 }}>Pencarian & Filter</Title>
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <Search
          placeholder="Cari Aset..."
          allowClear
          enterButton={<Button type="primary" icon={<SearchOutlined />} style={{ backgroundColor: '#237804' }} />}
          size="large"
          onChange={(e) => onSearchChange(e.target.value)}
          value={searchTerm}
        />
      </Col>
      <Col xs={24} lg={8}>
        <Select value={selectedType} style={{ width: '100%' }} size="large" onChange={onTypeChange}>
          <Option value="semua">Semua Tipe</Option>
          {Object.entries(ASSET_TYPE_PROPS).map(([value, { text }]) => (
            <Option key={value} value={value}>{text}</Option>
          ))}
        </Select>
      </Col>
    </Row>
  </Card>
);

// Owner Form Modal
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

// Asset Form Modal
const AssetFormModal = ({ 
  open, editingAsset, form, owners, isLoadingOwners, 
  onCancel, onSubmit, isSubmitting, onAddOwner 
}) => (
  <Modal
    title={editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}
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
        initialValue={10}
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
            {editingAsset ? 'Perbarui' : 'Simpan'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  </Modal>
);

// ==================== MAIN COMPONENT ====================
function AssetManagementContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('semua');
  const [form] = Form.useForm();
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [ownerForm] = Form.useForm();

  // [RBAC] Ambil data user dari store
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role; 
  // Definisikan siapa yang boleh edit/tambah/hapus
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  // [LOGIKA JUDUL DINAMIS]
  const pageTitle = canEdit ? "Manajemen Aset" : "Daftar Aset";
  const pageDesc = canEdit 
    ? "Kelola semua aset fisik yang dimiliki"
    : "Lihat daftar aset fisik dan status operasionalnya.";

  // Data Fetching
  const { data: assets, isLoading: isLoadingAssets, isError: isErrorAssets, error: errorAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const { data: owners, isLoading: isLoadingOwners } = useQuery({
    queryKey: ['owners'],
    queryFn: getOwners,
    enabled: canEdit // Hanya fetch owner jika user berhak edit (optimasi)
  });

  // Mutations
  const mutationConfig = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
      form.resetFields();
      setEditingAsset(null);
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Terjadi kesalahan'}`);
    }
  };

  const createMutation = useMutation({
    mutationFn: createAsset,
    ...mutationConfig,
    onSuccess: (...args) => {
      message.success('Aset berhasil ditambahkan');
      mutationConfig.onSuccess(...args);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAsset(id, data),
    ...mutationConfig,
    onSuccess: (...args) => {
      message.success('Aset berhasil diperbarui');
      mutationConfig.onSuccess(...args);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      message.success('Aset berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus aset'}`);
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
  const handleAddAsset = () => {
    setEditingAsset(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
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
    setEditingAsset(null);
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

    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleViewDetail = (asset) => {
    router.push(`/admin/asset/${asset.id}`);
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

  // Computed Values
  const stats = useMemo(() => {
    if (!assets) return { total: 0, value: 0, locations: 0 };
    const totalValue = assets.reduce((acc, asset) => acc + parseFloat(asset.value || 0), 0);
    const uniqueLocations = new Set(assets.map(asset => asset.location)).size;
    return { total: assets.length, value: totalValue, locations: uniqueLocations };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'semua' || asset.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [assets, searchTerm, selectedType]);

  const isLoadingInitialData = isLoadingAssets || isLoadingOwners;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Render
  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div className='gap-[6px]'>
          {/* [UBAH DI SINI] Gunakan variabel pageTitle & pageDesc */}
          <Title level={2} style={{ margin: 0, color: '#111928', fontWeight: 700, fontSize: '30px', lineHeight: '125%' }}>
            {pageTitle}
          </Title>
          <Text style={{ fontSize: '16px', fontWeight: 500, color: '#727272', lineHeight: '19px' }}>
            {pageDesc}
          </Text>
        </div>
        
        {/* [RBAC] Tombol Tambah Aset HANYA muncul jika canEdit (Admin/Superadmin) */}
        {canEdit && (
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            size="large"
            style={{ backgroundColor: '#237804', borderRadius: '24px', height: 'auto', padding: '8px 16px', fontSize: '16px' }}
            onClick={handleAddAsset}
            loading={isSubmitting}
          >
            Tambah Aset
          </Button>
        )}
      </Flex>

      <StatisticsCards stats={stats} isLoading={isLoadingAssets} />

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />

      {isLoadingInitialData && <Spin size="large"><div style={{ padding: 50, textAlign: 'center', width: '100%' }} /></Spin>}
      
      {isErrorAssets && !isLoadingInitialData && (
        <Alert message="Error Memuat Data" description={errorAssets?.message || 'Gagal memuat data'} type="error" showIcon />
      )}

      {!isLoadingInitialData && !isErrorAssets && (
        <Row gutter={[24, 24]}>
          {filteredAssets.length > 0 ? (
            filteredAssets.map((asset) => (
              <Col xs={24} lg={12} key={asset.id}>
                <AssetCard
                  asset={asset}
                  onDetail={handleViewDetail}
                  onEdit={handleEditAsset}
                  onDelete={deleteMutation}
                  canEdit={canEdit} // [RBAC] Pass permission ke AssetCard
                />
              </Col>
            ))
          ) : (
            <Col span={24}><Text>Tidak ada data aset ditemukan.</Text></Col>
          )}
        </Row>
      )}

      <AssetFormModal
        open={isModalOpen}
        editingAsset={editingAsset}
        form={form}
        owners={owners}
        isLoadingOwners={isLoadingOwners}
        onCancel={handleModalCancel}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        onAddOwner={handleShowOwnerModal}
      />

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

export default function AssetPage() {
  return (
    // [RBAC] Operator tidak boleh masuk sini, Investor & Viewer BOLEH (Read Only)
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Viewer']}>
      <AssetManagementContent />
    </ProtectedRoute>
  );
}