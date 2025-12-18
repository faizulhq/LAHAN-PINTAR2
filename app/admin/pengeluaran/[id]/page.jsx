'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Button, Typography, Space, Tag, Flex, Spin, Alert, Descriptions, Row, Col,
  Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DollarCircleFilled, LinkOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { GiPayMoney } from 'react-icons/gi';
import { MdLocationPin } from 'react-icons/md';
import { BiSolidCalendar } from 'react-icons/bi';
import { FaMoneyBillWave } from 'react-icons/fa6';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { getExpense, updateExpense, deleteExpense } from '@/lib/api/expense';
import { getProjects } from '@/lib/api/project';
import { getAssets } from '@/lib/api/asset';
import { getFundings } from '@/lib/api/funding';
import { getFundingSources } from '@/lib/api/funding_source';

const { Title, Text } = Typography;
const { Option } = Select;

const EXPENSE_CATEGORIES = {
  'Proyek': 'Proyek',
  'Operasional': 'Operasional',
  'Pembelian': 'Pembelian',
};

const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => value != null ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';

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

const ExpenseFormModal = ({
  open, expense, form, projects, fundings, fundingMap,
  onCancel, onSubmit, isSubmitting
}) => {
  const selectedProject = Form.useWatch('project_id', form);

  const filteredFundingOptions = useMemo(() => {
    if (!fundings) return [];

    return fundings.filter(f => {
      const fProjectId = typeof f.project === 'object' && f.project !== null ? f.project.id : f.project;
      const isPoolFund = !fProjectId;
      const isProjectFund = selectedProject && fProjectId === selectedProject;
      const isStatusEligible = f.status !== 'used' || (expense && expense.funding_id === f.id);

      if (selectedProject) {
        return (isPoolFund || isProjectFund) && isStatusEligible;
      } else {
        return isPoolFund && isStatusEligible;
      }
    });
  }, [fundings, selectedProject, expense]);

  useEffect(() => {
    if (!open) return;
    const currentFunding = form.getFieldValue('funding_id');
    if (currentFunding) {
       const isValid = filteredFundingOptions.some(f => f.id === currentFunding);
       if (!isValid) form.setFieldValue('funding_id', null);
    }
  }, [selectedProject, open, expense, form, filteredFundingOptions]);

  return (
    <Modal
      title="Edit Pengeluaran"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onSubmit} 
        style={{ marginTop: 24 }} 
        initialValues={{
          ...expense,
          date: expense?.date ? moment(expense.date) : null
        }}
      >
        <Form.Item name="category" label="Kategori" rules={[{ required: true, message: 'Kategori wajib dipilih' }]}>
          <Select placeholder="Pilih kategori pengeluaran">
            {Object.entries(EXPENSE_CATEGORIES).map(([value, text]) => (
              <Option key={value} value={value}>{text}</Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="amount" label="Jumlah (Rp)" rules={[{ required: true, message: 'Jumlah wajib diisi' }]}>
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Masukkan jumlah"
                min={0}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/Rp\s?|(\.*)/g, '').replace(/,/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="date" label="Tanggal" rules={[{ required: true, message: 'Tanggal wajib diisi' }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Deskripsi" rules={[{ required: true, message: 'Deskripsi wajib diisi' }]}>
          <Input.TextArea rows={3} placeholder="Jelaskan detail pengeluaran" />
        </Form.Item>

        <Form.Item name="project_id" label="Proyek Terkait (Opsional)">
          <Select placeholder="Pilih proyek (kosongkan untuk operasional umum)" showSearch optionFilterProp="children" allowClear>
            {projects?.map(p => (
              <Option key={p.id} value={p.id}>{p.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item 
          name="funding_id" 
          label="Sumber Dana" 
          rules={[{ required: true, message: 'Sumber dana wajib dipilih' }]}
          help={
             selectedProject && filteredFundingOptions.length === 0 
             ? <span style={{color: '#faad14'}}>Tidak ada dana tersedia (Pool maupun Proyek).</span> 
             : <span style={{color: '#727272', fontSize: '12px'}}>Menampilkan Dana Proyek & Dana Pool (Umum).</span>
          }
        >
          <Select 
            placeholder="Pilih dana"
            showSearch 
            optionFilterProp="children"
            disabled={selectedProject && filteredFundingOptions.length === 0}
          >
            {filteredFundingOptions.map(f => {
               const fProjectId = typeof f.project === 'object' && f.project !== null ? f.project.id : f.project;
               const labelType = fProjectId ? '(Khusus Proyek Ini)' : '(Pool / Umum)';
               return (
                  <Option key={f.id} value={f.id}>
                    {fundingMap[f.id] || `Dana ID: ${f.id}`} <span style={{color: fProjectId ? '#237804' : '#0958D9', fontSize: '12px'}}>{labelType}</span>
                  </Option>
               );
            })}
          </Select>
        </Form.Item>

        <Form.Item 
          label="URL Bukti (Opsional)" 
          name="proof_url"
          rules={[{ type: 'url', message: 'Masukkan URL yang valid' }]}
        >
          <Input
            placeholder="https://drive.google.com/file/d/..."
            prefix={<LinkOutlined />}
          />
        </Form.Item>

        <Form.Item style={{marginBottom: 0}}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} style={{ backgroundColor: '#237804', borderColor: '#237804' }}>
              Simpan Perubahan
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

function ExpenseDetailContent() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const expenseId = params.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin', 'Operator'].includes(userRole);

  const { data: expense, isLoading: isLoadingExpense, isError, error } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => getExpense(expenseId),
  });

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const { data: fundings, isLoading: isLoadingFundings } = useQuery({
    queryKey: ['fundings'],
    queryFn: getFundings,
  });

  const { data: fundingSources } = useQuery({
    queryKey: ['fundingSources'],
    queryFn: getFundingSources,
  });

  const project = projects?.find(p => p.id === expense?.project_id);
  const asset = assets?.find(a => a.id === project?.asset);
  const funding = fundings?.find(f => f.id === expense?.funding_id);
  const fundingSource = fundingSources?.find(fs => fs.id === funding?.source);

  const isLoading = isLoadingExpense || isLoadingProjects || isLoadingAssets || isLoadingFundings;

  const fundingMap = React.useMemo(() => {
    if (!fundings || !fundingSources) return {};
    const sourceMap = fundingSources.reduce((acc, s) => {
      acc[s.id] = s.name;
      return acc;
    }, {});
    return fundings.reduce((acc, f) => {
      acc[f.id] = `${sourceMap[f.source] || 'Unknown'} - ${formatRupiah(f.amount)}`;
      return acc;
    }, {});
  }, [fundings, fundingSources]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateExpense(id, data),
    onSuccess: () => {
      message.success('Pengeluaran berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['expense'] });
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Terjadi kesalahan'}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      message.success('Pengeluaran berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      router.push('/admin/pengeluaran');
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`);
    }
  });

  const handleBack = () => {
    router.push('/admin/pengeluaran');
  };

  const handleEdit = () => {
    if (!expense) return;
    
    form.setFieldsValue({
      category: expense.category,
      amount: parseFloat(expense.amount),
      date: expense.date ? moment(expense.date) : null,
      description: expense.description,
      project_id: expense.project_id,
      funding_id: expense.funding_id,
      proof_url: expense.proof_url || '',
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
      date: values.date ? values.date.format('YYYY-MM-DD') : null,
      proof_url: values.proof_url || null,
    };

    updateMutation.mutate({ id: expense.id, data: formData });
  };

  const handleDelete = () => {
     deleteMutation.mutate(expense.id);
  };

  if (isLoading) {
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
        description={error?.message || 'Gagal memuat data pengeluaran'}
        type="error"
        showIcon
      />
    );
  }

  if (!expense) {
    return (
      <Alert
        message="Pengeluaran Tidak Ditemukan"
        description="Pengeluaran yang Anda cari tidak tersedia"
        type="warning"
        showIcon
      />
    );
  }

  const categoryLabel = EXPENSE_CATEGORIES[expense.category] || expense.category;
  
  const getCategoryColor = () => {
    switch (expense.category) {
      case 'Operasional':
        return 'blue';
      case 'Proyek':
        return 'green';
      case 'Pembelian':
        return 'red';
      default:
        return 'default';
    }
  };

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
              Detail Pengeluaran
            </Title>
            <Text style={{
              fontSize: '16px',
              fontWeight: 500,
              color: '#727272',
              lineHeight: '19px',
            }}>
              Informasi lengkap mengenai pengeluaran
            </Text>
          </div>
        </Flex>
        
        {canEdit && (
          <Space>
            <Popconfirm
                title="Hapus Pengeluaran?"
                description="Yakin hapus data ini?"
                onConfirm={handleDelete}
                okText="Ya, Hapus"
                cancelText="Batal"
                okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            >
                <Button danger icon={<DeleteOutlined />} size="large" style={{borderRadius: 24}}>Hapus</Button>
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
              Edit Pengeluaran
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
            <Flex justify="space-between" align="start" style={{ marginBottom: 24 }}>
              <div>
                <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
                  {expense.description}
                </Title>
                <Tag
                  color={getCategoryColor()}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  {categoryLabel}
                </Tag>
              </div>
              <Text style={{
                fontWeight: 600,
                fontSize: '24px',
                color: '#CF1322',
              }}>
                - {formatRupiah(expense.amount)}
              </Text>
            </Flex>

            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Flex align="center" gap={12}>
                <BiSolidCalendar style={{ color: '#531DAB', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>
                    Tanggal Pengeluaran
                  </Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>
                    {formatDate(expense.date)}
                  </Text>
                </div>
              </Flex>

              <Flex align="center" gap={12}>
                <MdLocationPin style={{ color: '#CF1322', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>
                    Proyek Terkait
                  </Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>
                    {project?.name || '(Umum / Operasional)'}
                  </Text>
                </div>
              </Flex>

              <Flex align="center" gap={12}>
                <FaMoneyBillWave style={{ color: '#7CB305', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>
                    Sumber Dana
                  </Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>
                    {fundingSource?.name || '-'}
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
              <Descriptions.Item label="Kategori">
                <Text style={{ fontWeight: 500 }}>
                  {categoryLabel}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Jumlah">
                <Text strong style={{ fontSize: '16px', color: '#CF1322' }}>
                  {formatRupiah(expense.amount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal">
                <Text style={{ fontWeight: 500 }}>
                  {formatDate(expense.date)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Deskripsi">
                <Text style={{ fontWeight: 500 }}>
                  {expense.description}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Proyek">
                <Text style={{ fontWeight: 500 }}>
                  {project?.name || '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Aset Terkait">
                <Text style={{ fontWeight: 500 }}>
                  {asset?.name || '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Sumber Dana">
                <Text style={{ fontWeight: 500 }}>
                  {fundingSource?.name || '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Jumlah Dana">
                <Text style={{ fontWeight: 500, color: '#7CB305' }}>
                  {formatRupiah(funding?.amount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Bukti">
                {expense.proof_url ? (
                  <a
                    href={expense.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontWeight: 500, color: '#1890ff' }}
                  >
                    Lihat Bukti
                  </a>
                ) : (
                  <Text style={{ fontWeight: 500, color: '#999' }}>-</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size={24}>
            <InfoCard
              icon={<DollarCircleFilled />}
              label="Total Pengeluaran"
              value={formatRupiah(expense.amount)}
              iconColor="#CF1322"
            />
            
            <InfoCard
              icon={<GiPayMoney />}
              label="Sumber Dana"
              value={fundingSource?.name || '-'}
              iconColor="#7CB305"
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
                  <Text style={{ color: '#6B7280' }}>ID Pengeluaran</Text>
                  <Text style={{ fontWeight: 600 }}>#{expense.id}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>Kategori</Text>
                  <Text style={{ fontWeight: 600 }}>{categoryLabel}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>Status</Text>
                  <Tag color="red">Pengeluaran</Tag>
                </Flex>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>Aset</Text>
                  <Text style={{ fontWeight: 600 }}>{asset?.name || '-'}</Text>
                </Flex>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      {canEdit && (
        <ExpenseFormModal
          open={isModalOpen}
          expense={expense}
          form={form}
          projects={projects}
          fundings={fundings}
          fundingMap={fundingMap}
          onCancel={handleModalCancel}
          onSubmit={handleFormSubmit}
          isSubmitting={updateMutation.isPending}
        />
      )}
    </>
  );
}

export default function ExpenseDetailPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <ExpenseDetailContent />
    </ProtectedRoute>
  );
}