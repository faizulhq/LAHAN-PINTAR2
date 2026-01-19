'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Row, Col, Card, Input, Select, Button, Typography, Space, Tag, Flex,
  Modal, Form, DatePicker, InputNumber, message, Spin, Skeleton
} from 'antd';
import {
  PlusCircleOutlined, DollarCircleFilled
} from '@ant-design/icons';
import { PiFileTextFill } from 'react-icons/pi';
import { MdLocationPin } from 'react-icons/md';
import { TbArrowsMaximize } from 'react-icons/tb';
import { BiSolidCalendar } from 'react-icons/bi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { getAssets, createAsset, updateAsset, deleteAsset } from '@/lib/api/asset';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const ASSET_TYPE_PROPS = {
  'bangunan': { text: 'Bangunan', color: 'blue' },
  'lahan': { text: 'Lahan', color: 'red' },
  'ternak': { text: 'Ternak', color: 'green' },
  'alat': { text: 'Alat', color: 'purple' },
};

// Sinkronisasi dengan Backend models.py
const OWNERSHIP_STATUS_CHOICES = {
  'full_ownership': 'Full Ownership',
  'partial_ownership': 'Partial Ownership',
  'investor_owned': 'Investor Owned',
  'leashold': 'Leased (Sewa)',
  'under_construction': 'Under Construction',
  'personal_ownership': 'Personal Ownership',
};

const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => value != null ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';
const getAssetTypeProps = (type) => ASSET_TYPE_PROPS[type] || { text: type, color: 'default' };

const StatCard = ({ title, value, icon, loading, format = "number", iconColor }) => {
  const displayValue = () => {
    if (loading) return <Skeleton.Input active size="small" style={{ width: 120, height: 38 }} />;
    if (format === 'rupiah') return formatRupiah(value);
    return Number(value).toLocaleString('id-ID');
  };

  return (
    <Card styles={{ body: { padding: '16px' } }} style={{ borderRadius: '12px', border: '1px solid #F0F0F0', boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px', height: '100%' }}>
        <div style={{ flexShrink: 0, color: iconColor || '#7CB305', fontSize: '34px', display: 'flex', alignItems: 'center' }}>
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '10px 0' }}>
          <Text style={{ fontSize: '18px', fontWeight: 600, color: '#585858' }}>{title}</Text>
          <Text style={{ fontSize: '31px', fontWeight: 700, color: '#111928' }}>{displayValue()}</Text>
        </div>
      </div>
    </Card>
  );
};

const AssetCard = ({ asset, onDetail, onEdit, canEdit }) => {
  const typeProps = getAssetTypeProps(asset.type);

  return (
    <Card hoverable style={{ border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: '12px' }}>
        <Title level={5} style={{ margin: 0, fontWeight: 500, fontSize: '18px', color: '#111928' }}>
          {asset.name}
        </Title>
      </Flex>

      <Flex justify="space-between" align="center" style={{ marginBottom: '12px' }}>
        <Tag color={typeProps.color} style={{ padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
          {typeProps.text}
        </Tag>
        <Text style={{ fontWeight: 500, fontSize: '16px', color: '#7CB305' }}>
          {formatRupiah(asset.value)}
        </Text>
      </Flex>

      <Space direction="vertical" style={{ width: '100%', marginTop: '12px' }} size={12}>
        <Flex align="center" gap={4}>
          <MdLocationPin style={{ color: '#CF1322', fontSize: '24px' }} />
          <Text type="secondary">{asset.location}</Text>
        </Flex>
        <Flex align="center" gap={4}>
          <TbArrowsMaximize style={{ color: '#D46B08', fontSize: '24px' }} />
          <Text type="secondary">{asset.size}m²</Text>
        </Flex>
        <Flex align="center" gap={4}>
          <BiSolidCalendar style={{ color: '#531DAB', fontSize: '24px' }} />
          <Text type="secondary">{formatDate(asset.acquisition_date)}</Text>
        </Flex>
      </Space>

      <Flex gap={20} style={{ paddingTop: '24px' }}>
        <Button 
          style={{ flex: 1, height: '40px', border: '1px solid #237804', borderRadius: '8px', color: '#237804' }}
          onClick={() => onDetail(asset)}
        >
          Detail
        </Button>
        {canEdit && (
          <Button 
            style={{ flex: 1, height: '40px', background: '#237804', borderRadius: '8px', color: '#FFFFFF' }}
            onClick={() => onEdit(asset)}
          >
            Edit
          </Button>
        )}
      </Flex>
    </Card>
  );
};

const AssetFormModal = ({ open, editingAsset, form, onCancel, onSubmit, isSubmitting }) => {
  // Reset form hanya saat modal benar-benar terbuka
  useEffect(() => {
    if (open) {
      if (editingAsset) {
        form.setFieldsValue({
          ...editingAsset,
          acquisition_date: editingAsset.acquisition_date ? moment(editingAsset.acquisition_date) : null,
          landowner: editingAsset.landowner || '' 
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingAsset, form]);

  return (
    <Modal
      title={editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose={true}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 24 }}>
        <Form.Item label="Nama Aset" name="name" rules={[{ required: true }]}>
          <Input placeholder="Contoh: Lahan Jagung Blok A" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
              <Form.Item label="Tipe Aset" name="type" rules={[{ required: true }]}>
                  <Select placeholder="Pilih tipe">
                  {Object.entries(ASSET_TYPE_PROPS).map(([value, { text }]) => (
                      <Option key={value} value={value}>{text}</Option>
                  ))}
                  </Select>
              </Form.Item>
          </Col>
          <Col span={12}>
              <Form.Item label="Status Kepemilikan" name="ownership_status" rules={[{ required: true }]}>
                  <Select placeholder="Pilih status">
                  {Object.entries(OWNERSHIP_STATUS_CHOICES).map(([value, text]) => (
                      <Option key={value} value={value}>{text}</Option>
                  ))}
                  </Select>
              </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Lokasi" name="location" rules={[{ required: true }]}>
          <Input placeholder="Alamat atau Koordinat" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
              <Form.Item label="Ukuran (m²)" name="size" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
          </Col>
          <Col span={12}>
              <Form.Item label="Nilai Estimasi (Rp)" name="value" rules={[{ required: true }]}>
                  <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  />
              </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Tanggal Akuisisi" name="acquisition_date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item 
          label="Nama Pemilik Lahan (Landowner)" 
          name="landowner" 
          rules={[{ required: false }]}
          tooltip="Nama orang/pihak yang memiliki lahan ini (jika sewa/kerjasama)."
        >
          <Input placeholder="Contoh: Bapak H. Udin" />
        </Form.Item>

        <Form.Item 
          label="% Bagi Hasil Pemilik" 
          name="landowner_share_percentage"
          initialValue={10}
          rules={[{ required: true }]}
        >
          <InputNumber 
            style={{ width: '100%' }} 
            min={0} max={100} 
            formatter={value => `${value}%`} 
            parser={value => value.replace('%', '')} 
          />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: 32 }}>
          <Space>
            <Button onClick={onCancel}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} style={{ background: '#237804' }}>
              {editingAsset ? 'Perbarui' : 'Simpan'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

function AssetManagementContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('semua');
  const [form] = Form.useForm();

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role; 
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  const pageTitle = canEdit ? "Manajemen Aset" : "Daftar Aset";
  const pageDesc = canEdit ? "Kelola aset fisik lahan dan peralatan." : "Daftar aset yang dikelola.";

  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const mutationConfig = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
      setEditingAsset(null);
      message.success('Data aset berhasil disimpan');
    },
    onError: (err) => message.error('Gagal menyimpan data: ' + (err.response?.data?.detail || err.message))
  };

  const createMutation = useMutation({ mutationFn: createAsset, ...mutationConfig });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateAsset(id, data), ...mutationConfig });
  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      message.success('Aset dihapus');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });

  const handleAddAsset = () => {
    setEditingAsset(null);
    setIsModalOpen(true);
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  // [FIX] Convert data ke FormData sebelum kirim ke API
  const handleFormSubmit = async (values) => {
    const formData = new FormData();
    
    formData.append('name', values.name);
    formData.append('type', values.type);
    formData.append('ownership_status', values.ownership_status);
    formData.append('location', values.location);
    formData.append('size', values.size || 0);
    formData.append('value', values.value || 0);
    
    if (values.acquisition_date) {
      formData.append('acquisition_date', values.acquisition_date.format('YYYY-MM-DD'));
    }

    formData.append('landowner', values.landowner || '');
    formData.append('landowner_share_percentage', values.landowner_share_percentage || 0);

    // Jika nanti ada upload file:
    // if (values.image) formData.append('image', values.image.file);

    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleViewDetail = (asset) => {
    router.push(`/admin/asset/${asset.id}`);
  };

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

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928', fontWeight: 700, fontSize: '30px' }}>{pageTitle}</Title>
          <Text style={{ fontSize: '16px', color: '#727272' }}>{pageDesc}</Text>
        </div>
        {canEdit && (
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            size="large"
            style={{ backgroundColor: '#237804', borderRadius: '24px' }}
            onClick={handleAddAsset}
          >
            Tambah Aset
          </Button>
        )}
      </Flex>

      <StatisticsCards stats={stats} isLoading={isLoadingAssets} />

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Search
              placeholder="Cari Aset..."
              allowClear
              size="large"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Select value={selectedType} style={{ width: '100%' }} size="large" onChange={setSelectedType}>
              <Option value="semua">Semua Tipe</Option>
              {Object.entries(ASSET_TYPE_PROPS).map(([value, { text }]) => (
                <Option key={value} value={value}>{text}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {isLoadingAssets ? <Spin size="large"><div style={{ padding: 50, textAlign: 'center' }} /></Spin> : (
        <Row gutter={[24, 24]}>
          {filteredAssets.length > 0 ? (
            filteredAssets.map((asset) => (
              <Col xs={24} lg={12} key={asset.id}>
                <AssetCard
                  asset={asset}
                  onDetail={handleViewDetail}
                  onEdit={handleEditAsset}
                  onDelete={deleteMutation}
                  canEdit={canEdit}
                />
              </Col>
            ))
          ) : (
            <Col span={24}><Text>Tidak ada aset ditemukan.</Text></Col>
          )}
        </Row>
      )}

      <AssetFormModal
        open={isModalOpen}
        editingAsset={editingAsset}
        form={form}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}

const StatisticsCards = ({ stats, isLoading }) => (
  <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
    <Col xs={24} lg={8}>
      <StatCard title="Total Aset" value={stats.total} icon={<PiFileTextFill />} loading={isLoading} iconColor="#0958D9" />
    </Col>
    <Col xs={24} lg={8}>
      <StatCard title="Total Nilai" value={stats.value} icon={<DollarCircleFilled />} loading={isLoading} format="rupiah" iconColor="#7CB305" />
    </Col>
    <Col xs={24} lg={8}>
      <StatCard title="Lokasi" value={stats.locations} icon={<MdLocationPin />} loading={isLoading} iconColor="#CF1322" />
    </Col>
  </Row>
);

export default function AssetPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Viewer']}>
      <AssetManagementContent />
    </ProtectedRoute>
  );
}