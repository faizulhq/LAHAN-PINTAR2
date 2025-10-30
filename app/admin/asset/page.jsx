// File: app/admin/asset/page.jsx
'use client';
import React, { useState, useMemo } from 'react';
import {
  Row, Col, Card, Statistic, Input, Select, Button, Typography, Space, Tag, Flex,
  Modal, Form, DatePicker, InputNumber, Upload, message, Spin, Alert, Popconfirm, Descriptions
} from 'antd';
import {
  FileTextOutlined, DollarOutlined, EnvironmentOutlined, PlusOutlined, SearchOutlined,
  ArrowsAltOutlined, CalendarOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UploadOutlined,
  // --- IMPORT IKON BARU UNTUK FORM OWNER ---
  UserOutlined, PhoneOutlined, BankOutlined, HomeOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
// --- IMPORT FUNGSI API BARU ---
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

// Asset Card Component (Tidak Berubah)
const AssetCard = ({ asset, onDetail, onEdit, onDelete }) => {
  const typeProps = getAssetTypeProps(asset.type);
  const isDeleting = onDelete.isPending && onDelete.variables === asset.id;

  return (
    <Card hoverable>
      {/* Header */}
      <Flex justify="space-between" align="start" gap="middle">
        <Space direction="vertical" align="start">
          <Title level={5} style={{ margin: 0 }}>{asset.name}</Title>
          <Tag color={typeProps.color}>{typeProps.text}</Tag>
        </Space>
        <Text style={{ color: '#7CB305', fontSize: '16px', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {formatRupiah(asset.value)}
        </Text>
      </Flex>

      {/* Info */}
      <Space direction="vertical" style={{ marginTop: 24, marginBottom: 24, width: '100%' }} size="middle">
        <Space><EnvironmentOutlined style={{ color: '#CF1322' }} /><Text type="secondary">{asset.location}</Text></Space>
        <Space><ArrowsAltOutlined style={{ color: '#D46B08' }} /><Text type="secondary">{asset.size} m²</Text></Space>
        <Space><CalendarOutlined style={{ color: '#531DAB' }} /><Text type="secondary">{formatDate(asset.acquisition_date)}</Text></Space>
      </Space>

      {/* Actions */}
      <Flex gap="small" justify="space-between">
        <Button icon={<EyeOutlined />} onClick={() => onDetail(asset)} style={{ flexGrow: 1 }}>Detail</Button>
        <Button icon={<EditOutlined />} onClick={() => onEdit(asset)} style={{ flexGrow: 1 }}>Edit</Button>
        <Popconfirm
          title="Hapus Aset"
          description={`Yakin ingin menghapus "${asset.name}"?`}
          onConfirm={() => onDelete.mutate(asset.id)}
          okText="Ya"
          cancelText="Batal"
          okButtonProps={{ danger: true, loading: isDeleting }}
        >
          <Button danger icon={<DeleteOutlined />} style={{ flexGrow: 1 }} loading={isDeleting} />
        </Popconfirm>
      </Flex>
    </Card>
  );
};

// Statistics Cards Component (Tidak Berubah)
const StatisticsCards = ({ stats, isLoading }) => (
  <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
    <Col xs={24} lg={8}>
      <Card hoverable>
        <Statistic
          title={<Text style={{ fontSize: '18px', color: '#585858' }}>Total Aset</Text>}
          value={stats.total}
          loading={isLoading}
          valueStyle={{ fontSize: '31px', color: '#111928' }}
          prefix={<FileTextOutlined style={{ color: '#0958D9', fontSize: '34px', marginRight: '16px' }} />}
        />
      </Card>
    </Col>
    <Col xs={24} lg={8}>
      <Card hoverable>
        <Statistic
          title={<Text style={{ fontSize: '18px', color: '#585858' }}>Total Nilai</Text>}
          value={stats.value.toLocaleString('id-ID')}
          prefix="Rp "
          loading={isLoading}
          valueStyle={{ fontSize: '31px', color: '#111928' }}
        />
      </Card>
    </Col>
    <Col xs={24} lg={8}>
      <Card hoverable>
        <Statistic
          title={<Text style={{ fontSize: '18px', color: '#585858' }}>Lokasi</Text>}
          value={stats.locations}
          loading={isLoading}
          valueStyle={{ fontSize: '31px', color: '#111928' }}
          prefix={<EnvironmentOutlined style={{ color: '#CF1322', fontSize: '34px', marginRight: '16px' }} />}
        />
      </Card>
    </Col>
  </Row>
);

// Search and Filter Component (Tidak Berubah)
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

// --- MODAL FORM OWNER BARU ---
const OwnerFormModal = ({ open, onCancel, onSubmit, isSubmitting, form }) => (
  <Modal
    title="Tambah Pemilik Lahan Baru"
    open={open}
    onCancel={onCancel}
    footer={null} // Footer kustom di dalam form
    width={500}
    zIndex={1001} // Pastikan modal ini di atas modal Aset
    destroyOnClose // Reset form saat ditutup
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

// Asset Form Modal Component (Telah Direfactor)
const AssetFormModal = ({ 
  open, editingAsset, form, fileList, owners, isLoadingOwners, 
  onCancel, onSubmit, isSubmitting, onFileChange, 
  // --- PROPS BARU ---
  onAddOwner 
}) => (
  <Modal
    title={editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}
    open={open}
    onCancel={onCancel}
    footer={null}
    width={600}
    zIndex={1000} // zIndex default
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

      {/* --- FORM ITEM LANDOWNER (DIREFACTOR) --- */}
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
      {/* --- TOMBOL TAMBAH OWNER BARU --- */}
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

      <Form.Item label="Dokumen">
        <Upload 
          fileList={fileList}
          beforeUpload={(file) => {
            onFileChange([file]);
            return false;
          }}
          onRemove={() => onFileChange([])}
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>Upload Dokumen</Button>
        </Upload>
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

// Asset Detail Modal Component (Tidak Berubah)
const AssetDetailModal = ({ open, asset, onCancel }) => (
  <Modal
    title="Detail Aset"
    open={open}
    onCancel={onCancel}
    footer={<Button onClick={onCancel}>Tutup</Button>}
    width={600}
  >
    {asset && (
      <Descriptions bordered column={1} size="small" style={{ marginTop: 24 }}>
        <Descriptions.Item label="Nama">{asset.name}</Descriptions.Item>
        <Descriptions.Item label="Tipe">{getAssetTypeProps(asset.type).text}</Descriptions.Item>
        <Descriptions.Item label="Lokasi">{asset.location}</Descriptions.Item>
        <Descriptions.Item label="Ukuran">{asset.size} m²</Descriptions.Item>
        <Descriptions.Item label="Nilai">{formatRupiah(asset.value)}</Descriptions.Item>
        <Descriptions.Item label="Tanggal Akuisisi">{formatDate(asset.acquisition_date)}</Descriptions.Item>
        <Descriptions.Item label="Status Kepemilikan">
          {OWNERSHIP_STATUS_CHOICES[asset.ownership_status] || asset.ownership_status}
        </Descriptions.Item>
        <Descriptions.Item label="Pemilik Lahan">
          {asset.landowner_name || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="% Bagi Hasil Pemilik">
          {asset.landowner_share_percentage ? `${asset.landowner_share_percentage}%` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Total Investasi">
          {formatRupiah(asset.total_investment || 0)}
        </Descriptions.Item>
        <Descriptions.Item label="Dokumen">{asset.document_url || '-'}</Descriptions.Item>
      </Descriptions>
    )}
  </Modal>
);

// ==================== MAIN COMPONENT (Telah Direfactor) ====================
function AssetManagementContent() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailAsset, setDetailAsset] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('semua');
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  
  // --- STATE BARU UNTUK MODAL OWNER ---
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [ownerForm] = Form.useForm();

  // ========== DATA FETCHING ==========
  const { data: assets, isLoading: isLoadingAssets, isError: isErrorAssets, error: errorAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const { data: owners, isLoading: isLoadingOwners } = useQuery({
    queryKey: ['owners'],
    queryFn: getOwners
  });

  // ========== MUTATIONS ==========
  const mutationConfig = {
    // Konfigurasi default untuk create/update ASET
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
      form.resetFields();
      setFileList([]);
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
  
  // --- MUTASI BARU UNTUK CREATE OWNER ---
  const createOwnerMutation = useMutation({
    mutationFn: createOwner,
    onSuccess: (newOwner) => {
      message.success(`Pemilik Lahan "${newOwner.nama}" berhasil ditambahkan`);
      // 1. Refresh daftar owner di query cache
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      // 2. Tutup modal owner
      setIsOwnerModalOpen(false);
      ownerForm.resetFields();
      // 3. (OPSIONAL TAPI BAGUS) Otomatis pilih owner baru di form Aset
      form.setFieldsValue({ landowner: newOwner.id });
    },
    onError: (err) => {
      let errorMsg = 'Gagal menambahkan pemilik.';
      if (err.response?.data) {
        const errors = err.response.data;
        const firstKey = Object.keys(errors)[0];
        if (firstKey && Array.isArray(errors[firstKey])) {
          errorMsg = `${errors[firstKey][0]}`; // Tampilkan pesan error spesifik
        } else if (errors.detail) {
          errorMsg = errors.detail;
        }
      } else {
        errorMsg = err.message;
      }
      message.error(`Error: ${errorMsg}`);
    }
  });

  // ========== HANDLERS ==========
  
  // Handlers untuk Modal Aset
  const handleAddAsset = () => {
    setEditingAsset(null);
    form.resetFields();
    setFileList([]);
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
      landowner: asset.landowner, // ID landowner
      landowner_share_percentage: asset.landowner_share_percentage || 10,
    });
    setFileList(asset.document_url ? [{ uid: '-1', name: asset.document_url, status: 'done' }] : []);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingAsset(null);
    form.resetFields();
    setFileList([]);
  };

  const handleFormSubmit = async (values) => {
    const formData = {
      ...values,
      acquisition_date: values.acquisition_date ? values.acquisition_date.format('YYYY-MM-DD') : null,
      // Cek jika fileList berisi file baru (punya originFileObj) atau file lama (tidak punya)
      document_url: fileList.length > 0 ? (fileList[0].originFileObj ? fileList[0].name : editingAsset?.document_url) : null,
    };
    
    // Hapus landowner jika nilainya null/undefined (jika user clear pilihan)
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
    // Map ID landowner ke nama untuk ditampilkan di detail
    const landownerName = owners?.find(o => o.id === asset.landowner)?.nama;
    setDetailAsset({ ...asset, landowner_name: landownerName });
    setIsDetailModalOpen(true);
  };
  
  // --- HANDLERS BARU UNTUK MODAL OWNER ---
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

  // ========== COMPUTED VALUES ==========
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
  
  // (ownerMap tidak lagi diperlukan karena DetailModal menerima nama)

  const isLoadingInitialData = isLoadingAssets || isLoadingOwners;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ========== RENDER ==========
  return (
    <>
      {/* Page Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}>
            <FileTextOutlined style={{ marginRight: '8px' }} /> Manajemen Aset
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>Kelola semua aset fisik yang dimiliki</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ backgroundColor: '#237804', borderRadius: '24px', height: 'auto', padding: '8px 16px', fontSize: '16px' }}
          onClick={handleAddAsset}
          loading={isSubmitting}
        >
          Tambah Aset
        </Button>
      </Flex>

      {/* Statistics */}
      <StatisticsCards stats={stats} isLoading={isLoadingAssets} />

      {/* Search & Filter */}
      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />

      {/* Asset List */}
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
                />
              </Col>
            ))
          ) : (
            <Col span={24}><Text>Tidak ada data aset ditemukan.</Text></Col>
          )}
        </Row>
      )}

      {/* --- RENDER SEMUA MODAL --- */}
      <AssetFormModal
        open={isModalOpen}
        editingAsset={editingAsset}
        form={form}
        fileList={fileList}
        owners={owners}
        isLoadingOwners={isLoadingOwners}
        onCancel={handleModalCancel}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        onFileChange={setFileList}
        // --- PROP BARU DITERUSKAN ---
        onAddOwner={handleShowOwnerModal}
      />

      <AssetDetailModal
        open={isDetailModalOpen}
        asset={detailAsset}
        onCancel={() => setIsDetailModalOpen(false)}
      />
      
      {/* --- MODAL OWNER BARU DIRENDER DI SINI --- */}
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
    <ProtectedRoute>
      <AssetManagementContent />
    </ProtectedRoute>
  );
}