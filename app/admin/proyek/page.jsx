// Di app/admin/proyek/page.jsx
'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation'; // TAMBAH INI
import {
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Typography,
  Flex,
  Space,
  message,
  Spin,
  Alert,
  Card,
  Row,
  Col,
  Select,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DollarCircleFilled,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@/lib/api/project';
import { getAssets } from '@/lib/api/asset';
import { BsCalculatorFill } from 'react-icons/bs';
import { BiSolidCalendar } from 'react-icons/bi';
import { MdLocationPin } from 'react-icons/md';

const { Title, Text } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const formatRupiah = (value) => {
  if (value == null) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return moment(dateString).format('DD/MM/YYYY');
};

function ProjectManagementContent() {
  const router = useRouter(); 
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsset, setFilterAsset] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [form] = Form.useForm();

  // Fetch Projects
  const { data: projects, isLoading: isLoadingProjects, isError, error } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  // Fetch Assets
  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      setIsModalOpen(false);
      setEditingProject(null);
      form.resetFields();
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal melakukan aksi'}`);
    },
  };

  const createMutation = useMutation({
    mutationFn: createProject,
    ...mutationOptions,
    onSuccess: (...args) => {
      message.success('Proyek berhasil ditambahkan');
      mutationOptions.onSuccess(...args);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProject(id, data),
    ...mutationOptions,
    onSuccess: (...args) => {
      message.success('Proyek berhasil diperbarui');
      mutationOptions.onSuccess(...args);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      message.success('Proyek berhasil dihapus');
      queryClient.invalidateQueries(['projects']);
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus proyek'}`);
    },
  });

  const showAddModal = () => {
    setEditingProject(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const showEditModal = (project) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      description: project.description,
      dates: [moment(project.start_date), moment(project.end_date)],
      budget: parseFloat(project.budget),
      asset: project.asset,
    });
    setIsModalOpen(true);
  };

  // TAMBAH FUNGSI INI (menggantikan showDetailModal)
  const handleGoToDetail = (projectId) => {
    router.push(`/admin/proyek/${projectId}`);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    form.resetFields();
  };

  const handleFormSubmit = (values) => {
    const projectData = {
      name: values.name,
      description: values.description,
      start_date: values.dates[0].format('YYYY-MM-DD'),
      end_date: values.dates[1].format('YYYY-MM-DD'),
      budget: values.budget,
      asset: values.asset,
    };

    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data: projectData });
    } else {
      createMutation.mutate(projectData);
    }
  };

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(project => {
      const matchSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchAsset = filterAsset === 'all' || project.asset === parseInt(filterAsset);
     
      return matchSearch && matchAsset;
    });
  }, [projects, searchTerm, filterAsset]);

  const totalProjects = filteredProjects.length;
  const totalBudget = filteredProjects.reduce((sum, p) => sum + parseFloat(p.budget || 0), 0);
  const totalLocations = new Set(filteredProjects.map(p => p.name)).size;

  const isLoading = isLoadingProjects || isLoadingAssets;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '30px' }}>
            Manajemen Proyek
          </Title>
          <Text type="secondary" style={{ fontSize: '14px', color: '#6B7280' }}>
            Kelola proyek-proyek yang terkait dengan aset tertentu
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{
            backgroundColor: '#237804',
            borderColor: '#237804',
            borderRadius: '8px',
            height: '40px',
            fontSize: '16px',
            fontWeight: 400,
          }}
          onClick={showAddModal}
          loading={createMutation.isPending || updateMutation.isPending}
        >
          Tambah Proyek
        </Button>
      </Flex>

      {/* Filter Asset */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: '14px', color: '#111928', display: 'block', marginBottom: 8 }}>
          Filter Asset
        </Text>
        <Select
          value={filterAsset}
          style={{ width: 200 }}
          onChange={(value) => setFilterAsset(value)}
          loading={isLoadingAssets}
        >
          <Option value="all">Semua Asset</Option>
          {assets?.map(asset => (
            <Option key={asset.id} value={asset.id}>{asset.name}</Option>
          ))}
        </Select>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <Statistic
              title={<Text style={{ color: '#585858', fontSize: '18px', fontWeight: 600 }}>Total Proyek</Text>}
              value={totalProjects}
              prefix={<BsCalculatorFill style={{ color: '#3B82F6' }} />}
              valueStyle={{ color: '#111928', fontSize: '31px', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <Statistic
              title={<Text style={{ color: '#585858', fontSize: '18px', fontWeight: 600 }}>Total Anggaran</Text>}
              value={formatRupiah(totalBudget)}
              prefix={<DollarCircleFilled style={{ color: '#7CB305' }} />}
              valueStyle={{ color: '#111928', fontSize: '31px', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <Statistic
              title={<Text style={{ color: '#585858', fontSize: '18px', fontWeight: 600 }}>Lokasi</Text>}
              value={totalLocations}
              prefix={<MdLocationPin style={{ color: '#EF4444' }} />}
              valueStyle={{ color: '#111928', fontSize: '31px', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Pencarian & Filter */}
      <Card style={{ marginBottom: 24, borderRadius: '8px' }}>
        <Text
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: '24px',
            color: '#111928',
            display: 'block',
            marginBottom: 16
          }}
        >
          Pencarian dan Filter
        </Text>
        <Flex gap={200} wrap="wrap" align="center">
          <Search
            placeholder="Cari Proyek..."
            allowClear
            size="large"
            prefix={<SearchOutlined style={{ color: '#237804' }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: 300, maxWidth: 900 }}
          />
          <Select
            value={filterType}
            size="large"
            style={{ width: 200 }}
            onChange={(value) => setFilterType(value)}
          >
            <Option value="all">Semua Tipe</Option>
          </Select>
        </Flex>
      </Card>

      {/* Loading & Error States */}
      {isLoading && (
        <Flex justify="center" align="center" style={{ minHeight: 300 }}>
          <Spin size="large" />
        </Flex>
      )}
      {isError && (
        <Alert
          message="Error Memuat Data"
          description={error.message}
          type="error"
          showIcon
          closable
        />
      )}

      {/* Grid Cards Proyek */}
      {!isLoading && !isError && (
        <Row gutter={[24, 24]}>
          {filteredProjects.map((project) => (
            <Col xs={24} sm={24} md={12} lg={12} xl={12} key={project.id}>
              <Card
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  height: '211px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0px 2px 4px -2px rgba(0, 0, 0, 0.05), 0px 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                styles={{
                  padding: '4px 4px 16px 4px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Title level={5} style={{
                    margin: 0,
                    marginBottom: 8,
                    color: '#111928',
                    fontSize: '16px',
                    fontWeight: 600
                  }}>
                    {project.name}
                  </Title>
                  <Text
                    strong
                    style={{
                      fontSize: '16px',
                      color: '#7CB305',
                      display: 'block',
                      marginBottom: 12,
                    }}
                  >
                    {formatRupiah(project.budget)}
                  </Text>
                  <Flex align="center" gap={4} style={{ marginBottom: 'auto' }}>
                    <BiSolidCalendar style={{ color: '#531DAB', fontSize: '18px' }} />
                    <Text style={{ color: '#6B7280', fontSize: '14px' }}>
                      {formatDate(project.start_date)}
                    </Text>
                  </Flex>
                  <Flex gap={8} style={{ marginTop: 16 }}>
                    {/* UBAH onClick BUTTON DETAIL INI */}
                    <Button
                      style={{
                        flex: 1,
                        borderRadius: '6px',
                        border: '1px solid #237804',
                        color: '#237804',
                        fontWeight: 500,
                      }}
                      onClick={() => handleGoToDetail(project.id)}
                    >
                      Detail
                    </Button>
                    <Button
                      type="primary"
                      style={{
                        flex: 1,
                        backgroundColor: '#237804',
                        borderColor: '#237804',
                        borderRadius: '6px',
                        fontWeight: 500,
                      }}
                      onClick={() => showEditModal(project)}
                    >
                      Edit
                    </Button>
                  </Flex>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredProjects.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Tidak ada proyek yang sesuai dengan filter
          </Text>
        </Card>
      )}

      {/* Modal Tambah/Edit Proyek */}
      <Modal
        title={editingProject ? 'Edit Proyek' : 'Tambah Proyek Baru'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
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
              <Button onClick={handleCancel}>Batal</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
                style={{ backgroundColor: '#237804', borderColor: '#237804' }}
              >
                {editingProject ? 'Simpan Perubahan' : 'Tambah Proyek'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* HAPUS MODAL DETAIL PROYEK - TIDAK DIPAKAI LAGI */}
    </div>
  );
}

export default function ProjectPage() {
  return (
    <ProtectedRoute>
      <ProjectManagementContent />
    </ProtectedRoute>
  );
}