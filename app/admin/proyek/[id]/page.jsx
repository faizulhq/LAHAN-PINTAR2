'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Typography,
  Flex,
  Space,
  Spin,
  Alert,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  message,
  Divider,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  DollarCircleFilled,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getProjects, updateProject, deleteProject } from '@/lib/api/project';
import { getAssets } from '@/lib/api/asset';
import { BiSolidCalendar } from 'react-icons/bi';
import { MdLocationPin } from 'react-icons/md';
import { FaBuilding } from 'react-icons/fa';
import useAuthStore from '@/lib/store/authStore';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const formatRupiah = (value) => {
  if (value == null) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return moment(dateString).format('DD MMMM YYYY');
};

const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return '-';
  const start = moment(startDate);
  const end = moment(endDate);
  const days = end.diff(start, 'days');
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  
  if (months > 0) {
    return `${months} bulan ${remainingDays} hari`;
  }
  return `${days} hari`;
};

const getProjectStatus = (startDate, endDate) => {
  const now = moment();
  const start = moment(startDate);
  const end = moment(endDate);
  
  if (now.isBefore(start)) {
    return { status: 'Belum Dimulai', color: 'blue' };
  } else if (now.isAfter(end)) {
    return { status: 'Selesai', color: 'default' };
  } else {
    return { status: 'Sedang Berjalan', color: 'green' };
  }
};

const InfoItem = ({ icon, label, value }) => (
  <Card style={{ 
    backgroundColor: '#ffffff', 
    borderRadius: '8px', 
    border: '1px solid #E5E7EB',
    height: '100%'
  }}>
    <Flex align="center" gap={12}>
      <div style={{ 
        width: '48px', 
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <Space direction="vertical" size={2} style={{ flex: 1, minWidth: 0 }}>
        <Text type="secondary" style={{ fontSize: '13px', display: 'block' }}>{label}</Text>
        <Text strong style={{ fontSize: '16px', color: '#111928', display: 'block', wordBreak: 'break-word' }}>
          {value}
        </Text>
      </Space>
    </Flex>
  </Card>
);

function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = parseInt(params.id);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [form] = Form.useForm();

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  const { data: projects, isLoading: isLoadingProjects, isError, error } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const project = projects?.find(p => p.id === projectId);
  const asset = assets?.find(a => a.id === project?.asset);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProject(id, data),
    onSuccess: () => {
      message.success('Proyek berhasil diperbarui');
      queryClient.invalidateQueries(['projects']);
      setIsEditModalOpen(false);
      form.resetFields();
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal memperbarui proyek'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      message.success('Proyek berhasil dihapus');
      queryClient.invalidateQueries(['projects']);
      router.push('/admin/proyek');
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus proyek'}`);
    },
  });

  const showEditModal = () => {
    if (project) {
      form.setFieldsValue({
        name: project.name,
        description: project.description,
        dates: [moment(project.start_date), moment(project.end_date)],
        budget: parseFloat(project.budget),
        asset: project.asset,
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = (values) => {
    const projectData = {
      name: values.name,
      description: values.description,
      start_date: values.dates[0].format('YYYY-MM-DD'),
      end_date: values.dates[1].format('YYYY-MM-DD'),
      budget: values.budget,
      asset: values.asset,
    };
    updateMutation.mutate({ id: projectId, data: projectData });
  };

  const handleDelete = () => {
    deleteMutation.mutate(projectId);
  };

  const isLoading = isLoadingProjects || isLoadingAssets;

  if (isLoading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <Flex justify="center" align="center" style={{ minHeight: 400 }}>
          <Spin size="large" />
        </Flex>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <Alert
          message="Error Memuat Data"
          description={error.message}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <Alert
          message="Proyek Tidak Ditemukan"
          description="Proyek yang Anda cari tidak ditemukan."
          type="warning"
          showIcon
          action={
            <Button type="primary" onClick={() => router.push('/admin/proyek')}>
              Kembali ke Daftar Proyek
            </Button>
          }
        />
      </div>
    );
  }

  const projectStatus = getProjectStatus(project.start_date, project.end_date);
  const duration = calculateDuration(project.start_date, project.end_date);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
        <Space direction="vertical" size={0}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin/proyek')}
            style={{ padding: 0, marginBottom: 8, color: '#237804', fontWeight: 500 }}
          >
            Kembali ke Daftar Proyek
          </Button>
          <Title level={2} style={{ margin: 0, color: '#111928', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '30px' }}>
            Detail Proyek
          </Title>
          <Text type="secondary" style={{ fontSize: '14px', color: '#6B7280' }}>
            Informasi lengkap tentang proyek ini
          </Text>
        </Space>
        
        {canEdit && (
            <Space size="middle">
            <Button
                icon={<EditOutlined />}
                size="large"
                style={{
                borderRadius: '8px',
                height: '40px',
                fontSize: '16px',
                borderColor: '#237804',
                color: '#237804',
                }}
                onClick={showEditModal}
            >
                Edit Proyek
            </Button>
            <Button
                danger
                icon={<DeleteOutlined />}
                size="large"
                style={{
                borderRadius: '8px',
                height: '40px',
                fontSize: '16px',
                }}
                onClick={() => setIsDeleteModalOpen(true)}
            >
                Hapus
            </Button>
            </Space>
        )}
      </Flex>

      <Card
        style={{
          marginBottom: 24,
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#ffffff'
        }}
      >
        <Flex justify="space-between" align="start" wrap="wrap" gap={16}>
          <Space direction="vertical" size={8} style={{ flex: 1 }}>
            <Title level={3} style={{ margin: 0, color: '#111928', fontSize: '24px', fontWeight: 700 }}>
              {project.name}
            </Title>
            <Space>
                <Tag color={projectStatus.color} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {projectStatus.status}
                </Tag>
                <Tag color="cyan">Didukung Dana Pool</Tag>
            </Space>
          </Space>
          <Space direction="vertical" size={0} align="end">
            <Text type="secondary" style={{ fontSize: '14px' }}>Total Anggaran</Text>
            <Title level={2} style={{ margin: 0, color: '#000000', fontSize: '32px', fontWeight: 700 }}>
              {formatRupiah(project.budget)}
            </Title>
          </Space>
        </Flex>

        <Divider style={{ margin: '20px 0' }} />

        <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 24 }}>
          <Flex align="center" gap={8}>
            <FileTextOutlined style={{ color: '#237804', fontSize: '18px' }} />
            <Text strong style={{ fontSize: '16px', color: '#111928' }}>Deskripsi Proyek</Text>
          </Flex>
          <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6', display: 'block', marginLeft: 26 }}>
            {project.description}
          </Text>
        </Space>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px',
          marginTop: 24 
        }}>
          <Card style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '8px', 
            border: '1px solid #E5E7EB' 
          }}>
            <Flex align="center" gap={12}>
              <BiSolidCalendar style={{ color: '#3B82F6', fontSize: '48px' }} />
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: '13px' }}>Tanggal Mulai</Text>
                <Text strong style={{ fontSize: '16px', color: '#111928' }}>
                  {formatDate(project.start_date)}
                </Text>
              </Space>
            </Flex>
          </Card>

          <Card style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '8px', 
            border: '1px solid #E5E7EB' 
          }}>
            <Flex align="center" gap={12}>
              <CalendarOutlined style={{ color: '#F59E0B', fontSize: '48px' }} />
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: '13px' }}>Tanggal Selesai</Text>
                <Text strong style={{ fontSize: '16px', color: '#111928' }}>
                  {formatDate(project.end_date)}
                </Text>
              </Space>
            </Flex>
          </Card>

          <Card style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '8px', 
            border: '1px solid #E5E7EB' 
          }}>
            <Flex align="center" gap={12}>
              <ClockCircleOutlined style={{ color: '#8B5CF6', fontSize: '48px' }} />
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: '13px' }}>Durasi Proyek</Text>
                <Text strong style={{ fontSize: '16px', color: '#111928' }}>
                  {duration}
                </Text>
              </Space>
            </Flex>
          </Card>
        </div>
      </Card>

      {asset && (
        <Card
          style={{
            marginBottom: 24,
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#ffffff'
          }}
        >
          <Flex align="center" gap={10} style={{ marginBottom: 20 }}>
            <FaBuilding style={{ color: '#237804', fontSize: '40px' }} />
            <Title level={4} style={{ margin: 0, color: '#111928', fontSize: '20px', fontWeight: 600 }}>
              Aset Terkait
            </Title>
          </Flex>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <InfoItem
                icon={<FaBuilding style={{ color: '#16A34A', fontSize: '48px' }} />}
                label="Nama Aset"
                value={asset.name}
              />
            </Col>
            <Col xs={24} sm={12}>
              <InfoItem
                icon={<FileTextOutlined style={{ color: '#2563EB', fontSize: '48px' }} />}
                label="Tipe Aset"
                value={asset.type || '-'}
              />
            </Col>
            <Col xs={24} sm={12}>
              <InfoItem
                icon={<MdLocationPin style={{ color: '#EF4444', fontSize: '48px' }} />}
                label="Lokasi"
                value={asset.location}
              />
            </Col>
            <Col xs={24} sm={12}>
              <InfoItem
                icon={<DollarCircleFilled style={{ color: '#7CB305', fontSize: '48px' }} />}
                label="Nilai Aset"
                value={formatRupiah(asset.value)}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Card
        style={{
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#ffffff'
        }}
      >
        <Flex align="center" gap={10} style={{ marginBottom: 20 }}>
          <InfoCircleOutlined style={{ color: '#1D4ED8', fontSize: '40px' }} />
          <Title level={4} style={{ margin: 0, color: '#111928', fontSize: '20px', fontWeight: 600 }}>
            Informasi Tambahan
          </Title>
        </Flex>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <InfoItem
              icon={<InfoCircleOutlined style={{ color: '#7C3AED', fontSize: '48px' }} />}
              label="ID Proyek"
              value={`#${project.id}`}
            />
          </Col>
          <Col xs={24} sm={12}>
            <InfoItem
              icon={<CalendarOutlined style={{ color: '#EA580C', fontSize: '48px' }} />}
              label="Dibuat Pada"
              value={project.created_at ? formatDate(project.created_at) : '-'}
            />
          </Col>
        </Row>
      </Card>

      <Modal
        title="Edit Proyek"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="Nama Proyek"
            rules={[{ required: true, message: 'Nama proyek tidak boleh kosong!' }]}
          >
            <Input placeholder="Masukkan nama proyek" size="large" />
          </Form.Item>

          <Form.Item
            name="asset"
            label="Aset Terkait"
            rules={[{ required: true, message: 'Aset harus dipilih!' }]}
          >
            <Select
              placeholder="Pilih aset yang terkait proyek"
              loading={isLoadingAssets}
              showSearch
              optionFilterProp="children"
              size="large"
            >
              {assets?.map(asset => (
                <Option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.location})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Deskripsi"
            rules={[{ required: true, message: 'Deskripsi tidak boleh kosong!' }]}
          >
            <Input.TextArea rows={4} placeholder="Masukkan deskripsi singkat proyek" />
          </Form.Item>

          <Form.Item
            name="dates"
            label="Periode Proyek"
            rules={[{ required: true, message: 'Tanggal mulai dan selesai harus dipilih!' }]}
          >
            <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
          </Form.Item>

          <Form.Item
            name="budget"
            label="Anggaran (Rp)"
            rules={[{ required: true, message: 'Anggaran tidak boleh kosong!' }]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
              placeholder="Masukkan total anggaran proyek"
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: 32, marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsEditModalOpen(false)}>Batal</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateMutation.isPending}
                style={{ backgroundColor: '#237804', borderColor: '#237804' }}
              >
                Simpan Perubahan
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Konfirmasi Hapus"
        open={isDeleteModalOpen}
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Hapus"
        cancelText="Batal"
        okButtonProps={{ 
          danger: true, 
          loading: deleteMutation.isPending 
        }}
      >
        <Text>
          Apakah Anda yakin ingin menghapus proyek <strong>{project.name}</strong>? 
          Tindakan ini tidak dapat dibatalkan.
        </Text>
      </Modal>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <ProtectedRoute>
      <ProjectDetailContent />
    </ProtectedRoute>
  );
}