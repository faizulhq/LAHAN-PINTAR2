'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Modal, Form, Select, InputNumber, DatePicker, Input, Typography, Flex, Space,
  message, Spin, Alert, Card, Row, Col, Skeleton, Tag, Upload
} from 'antd';
import {
  PlusCircleOutlined, LinkOutlined, SearchOutlined, CloseCircleOutlined, UploadOutlined, FileImageOutlined
} from '@ant-design/icons';
import { GiPayMoney } from 'react-icons/gi';
import { FaMoneyBillWave } from 'react-icons/fa6';
import { BiMoneyWithdraw } from 'react-icons/bi';
import { ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/lib/api/expense';
import { getProjects } from '@/lib/api/project';
import { getAssets } from '@/lib/api/asset';
import { getFundings } from '@/lib/api/funding';
import { getFundingSources } from '@/lib/api/funding_source';
import { getFinancialReport } from '@/lib/api/reporting';

const { Title, Text } = Typography;
const { Option } = Select;

const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : 'Rp 0';

const formatDate = (dateString) => dateString ? moment(dateString).format('D/M/YYYY') : '-';

const EXPENSE_CATEGORIES = {
  'Proyek': 'Proyek',
  'Operasional': 'Operasional',
  'Pembelian': 'Pembelian',
};

const calculateCategoryTotals = (expenses) => {
  if (!expenses) return { Operasional: 0, Proyek: 0, Pembelian: 0 };
  
  const totals = { Operasional: 0, Proyek: 0, Pembelian: 0 };
  
  expenses.forEach(exp => {
    const amount = parseFloat(exp.amount) || 0;
    const category = exp.category || 'Operasional';
    
    if (totals[category] !== undefined) {
      totals[category] += amount;
    }
  });
  
  return totals;
};

const StatCard = ({ title, value, icon, loading, iconColor }) => {
  const displayValue = () => {
    if (loading) return <Skeleton.Input active size="small" style={{ width: 120, height: 38 }} />;
    return formatRupiah(value);
  };

  return (
    <Card 
      bodyStyle={{ padding: '24px' }} 
      style={{
        background: '#FFFFFF',
        border: '1px solid #F0F0F0',
        borderRadius: '12px',
        boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <div style={{ flexShrink: 0, color: iconColor, fontSize: '34px' }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <Text style={{ fontSize: '18px', fontWeight: 600, color: '#585858', display: 'block' }}>
            {title}
          </Text>
          <Text style={{ fontSize: '31px', fontWeight: 700, color: '#111928' }}>
            {displayValue()}
          </Text>
        </div>
      </div>
    </Card>
  );
};

const ExpenseCard = ({ expense, onEditClick, onDetailClick, canEdit }) => {
  const categoryLabel = EXPENSE_CATEGORIES[expense.category] || expense.category;
  
  const getCategoryColor = () => {
    switch (expense.category) {
      case 'Operasional': return { background: '#E1EFFE', color: '#1E429F' };
      case 'Proyek': return { background: '#D5F5E3', color: '#27AE60' };
      case 'Pembelian': return { background: '#FFE1E1', color: '#E74C3C' };
      default: return { background: '#F3F4F6', color: '#6B7280' };
    }
  };
  
  const tagColor = getCategoryColor();
  
  return (
    <Card 
      bodyStyle={{ padding: '20px' }}
      style={{
        marginBottom: '16px',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Space size="small" style={{ marginBottom: '10px' }}>
            <Tag style={{ 
              background: tagColor.background, 
              color: tagColor.color, 
              border: 'none', 
              fontWeight: 600, 
              fontSize: '14px', 
              padding: '4px 10px', 
              borderRadius: '6px' 
            }}>
              {categoryLabel}
            </Tag>
          </Space>
          
          <Title level={4} style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 600, color: '#111928' }}>
            {expense.description}
          </Title>
          
          <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928', display: 'block', marginBottom: '20px' }}>
            Tanggal: {formatDate(expense.date)}
          </Text>
          
          <Space>
            <Button 
              style={{ 
                minWidth: '128px', height: '40px', border: '1px solid #237804', borderRadius: '8px',
                color: '#237804', fontSize: '14px', fontWeight: 500 
              }} 
              onClick={() => onDetailClick(expense.id)}
            >
              Detail
            </Button>
            
            {canEdit && (
              <Button 
                style={{ 
                  minWidth: '128px', height: '40px', background: '#237804', borderColor: '#237804',
                  borderRadius: '8px', color: '#FFFFFF', fontSize: '14px', fontWeight: 500 
                }} 
                onClick={() => onEditClick(expense)}
              >
                Edit
              </Button>
            )}
          </Space>
        </div>

        <div style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: '24px', fontWeight: 700, color: '#CF1322', display: 'block' }}>
            - {formatRupiah(expense.amount)}
          </Text>
        </div>
      </div>
    </Card>
  );
};

const ExpenseModal = ({ visible, onClose, initialData, form, projects, fundings, fundingMap }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(initialData);

  const selectedProject = Form.useWatch('project_id', form);

  const filteredFundingOptions = useMemo(() => {
    if (!fundings) return [];

    if (selectedProject) {
      return fundings.filter(f => {
        const fProjectId = typeof f.project === 'object' && f.project !== null ? f.project.id : f.project;
        const isEligible = f.status !== 'used' || (initialData && initialData.funding_id === f.id);
        return fProjectId === selectedProject && isEligible;
      });
    } else {
      return fundings.filter(f => !f.project && f.status !== 'used');
    }
  }, [fundings, selectedProject, initialData]);

  useEffect(() => {
    if (!visible) return;
    
    if (!initialData || (initialData && selectedProject !== initialData.project_id)) {
        form.setFieldValue('funding_id', null);
    }
  }, [selectedProject, visible, initialData, form]);

  const mutationOptions = {
    onSuccess: () => {
      message.success(isEditMode ? 'Pengeluaran berhasil diperbarui' : 'Pengeluaran berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financialReport'] });
      onClose();
    },
    onError: (err) => {
      console.error("Error:", err);
      const errorDetail = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message;
      message.error(`Error: ${errorDetail}`);
    },
    onSettled: () => setIsSubmitting(false),
  };

  const createMutation = useMutation({ mutationFn: createExpense, ...mutationOptions });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateExpense(id, data), ...mutationOptions });

  useEffect(() => {
    if (visible) {
      if (isEditMode && initialData) {
        form.setFieldsValue({
          category: initialData.category,
          amount: parseFloat(initialData.amount),
          date: moment(initialData.date),
          description: initialData.description,
          project_id: initialData.project_id,
          funding_id: initialData.funding_id,
          proof_url: initialData.proof_url,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialData, form, isEditMode]);

  const onFinish = (values) => {
    setIsSubmitting(true);
    const payload = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
      proof_url: values.proof_url || null,
    };
    
    if (isEditMode) {
      updateMutation.mutate({ id: initialData.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Modal
      title={isEditMode ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
        <Form.Item name="category" label="Kategori" rules={[{ required: true, message: 'Kategori harus dipilih!' }]}>
          <Select placeholder="Pilih kategori pengeluaran" size="large">
            {Object.entries(EXPENSE_CATEGORIES).map(([value, text]) => (
              <Option key={value} value={value}>{text}</Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
             <Form.Item name="amount" label="Jumlah (Rp)" rules={[{ required: true, message: 'Jumlah harus diisi!' }]}>
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                min={0}
                placeholder="Masukkan jumlah"
                size="large"
              />
            </Form.Item>
          </Col>
           <Col span={12}>
            <Form.Item name="date" label="Tanggal" rules={[{ required: true, message: 'Tanggal harus diisi!' }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Deskripsi" rules={[{ required: true, message: 'Deskripsi harus diisi!' }]}>
          <Input.TextArea rows={3} placeholder="Jelaskan detail pengeluaran" />
        </Form.Item>

        <Form.Item name="project_id" label="Proyek Terkait (Opsional)">
          <Select placeholder="Pilih proyek (kosongkan untuk operasional umum)" showSearch optionFilterProp="children" size="large" allowClear>
            {projects?.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
          </Select>
        </Form.Item>

        <Form.Item 
          name="funding_id" 
          label="Sumber Dana" 
          rules={[{ required: true, message: 'Sumber dana harus dipilih!' }]}
          help={selectedProject && filteredFundingOptions.length === 0 ? <span style={{color: '#faad14'}}>Tidak ada dana tersedia di proyek ini. Alokasikan dana terlebih dahulu.</span> : null}
        >
          <Select 
            placeholder={selectedProject ? "Pilih dana dari proyek ini" : "Pilih dana operasional (Belum Dialokasikan)"}
            showSearch 
            optionFilterProp="children" 
            size="large"
            disabled={selectedProject && filteredFundingOptions.length === 0}
          >
            {filteredFundingOptions.map(f => (
              <Option key={f.id} value={f.id}>
                {fundingMap[f.id] || f.source_name} {f.project ? '' : '(Umum)'}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item 
          name="proof_url" 
          label="URL Bukti (Opsional)"
          rules={[{ type: 'url', message: 'Masukkan URL yang valid' }]}
        >
          <Input prefix={<LinkOutlined />} placeholder="https://docs.google.com/..." size="large" />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: 32, marginBottom: 0 }}>
          <Space>
            <Button onClick={onClose}>Batal</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              style={{ backgroundColor: '#237804', borderColor: '#237804' }}
            >
              {isEditMode ? 'Simpan Perubahan' : 'Tambah Pengeluaran'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

function ExpenseManagementContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form] = Form.useForm();
  
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const isAdmin = ['Admin', 'Superadmin'].includes(userRole);
  const isOperator = userRole === 'Operator';
  const canEdit = ['Admin', 'Superadmin', 'Operator'].includes(userRole);

  let headerTitle = "Laporan Pengeluaran";
  let headerDesc = "Lihat rincian penggunaan biaya operasional.";

  if (isAdmin) {
    headerTitle = "Manajemen Pengeluaran";
    headerDesc = "Kelola semua pengeluaran operasional, proyek, dan pembelian";
  } else if (isOperator) {
    headerTitle = "Input Pengeluaran";
    headerDesc = "Catat pembelian barang dan biaya operasional harian di sini.";
  }

  const { data: reportData, isLoading: isLoadingReport } = useQuery({
    queryKey: ['financialReport', selectedAsset],
    queryFn: () => getFinancialReport({ asset: selectedAsset === 'all' ? undefined : selectedAsset }),
  });

  const { data: assets, isLoading: isLoadingAssets } = useQuery({ queryKey: ['assets'], queryFn: getAssets });
  const { data: projects, isLoading: isLoadingProjects } = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const { data: expenses, isLoading: isLoadingExpenses, isError, error } = useQuery({ 
    queryKey: ['expenses'], 
    queryFn: getExpenses 
  });
  const { data: fundings, isLoading: isLoadingFundings } = useQuery({ queryKey: ['fundings'], queryFn: getFundings });
  const { data: fundingSources } = useQuery({ queryKey: ['fundingSources'], queryFn: getFundingSources });

  const assetMap = useMemo(() => {
    if (!projects || !assets) return {};
    const aMap = assets.reduce((acc, a) => { acc[a.id] = a.name; return acc; }, {});
    return projects.reduce((acc, p) => { acc[p.id] = aMap[p.asset] || '-'; return acc; }, {});
  }, [projects, assets]);

  const sourceMap = useMemo(() => fundingSources ? fundingSources.reduce((acc, s) => { acc[s.id] = s.name; return acc; }, {}) : {}, [fundingSources]);
  
  const fundingMap = useMemo(() => {
    if (!fundings || !sourceMap) return {};
    return fundings.reduce((acc, f) => {
      acc[f.id] = `${sourceMap[f.source] || f.source_name || 'Unknown'} - ${formatRupiah(f.sisa_dana || f.amount)}`;
      return acc;
    }, {});
  }, [fundings, sourceMap]);

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      message.success('Pengeluaran berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financialReport'] });
    },
    onError: (err) => message.error(`Error: ${err.response?.data?.detail || err.message}`),
  });

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
      const matchesAsset = selectedAsset === 'all' || assetMap[e.project_id] === assets?.find(a => a.id === parseInt(selectedAsset))?.name;
      return matchesSearch && matchesCategory && matchesAsset;
    });
  }, [expenses, searchTerm, selectedCategory, selectedAsset, assetMap, assets]);

  const showAddModal = () => { 
    setEditingExpense(null); 
    form.resetFields(); 
    setIsModalOpen(true); 
  };

  const showEditModal = (expense) => { 
    setEditingExpense(expense); 
    setIsModalOpen(true); 
  };

  const handleViewDetail = (expenseId) => {
    router.push(`/admin/pengeluaran/${expenseId}`);
  };

  const handleCancel = () => { 
    setIsModalOpen(false); 
    setEditingExpense(null); 
    form.resetFields(); 
  };

  const stats = reportData?.ringkasan_dana || {};
  const categoryTotals = useMemo(() => calculateCategoryTotals(filteredExpenses), [filteredExpenses]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928', fontWeight: 700, fontSize: '30px' }}>
            {headerTitle}
          </Title>
          <Text style={{ fontSize: '16px', fontWeight: 500, color: '#727272' }}>
            {headerDesc}
          </Text>
        </div>
        
        {canEdit && (
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            size="large"
            style={{ 
              backgroundColor: '#237804', borderColor: '#237804', borderRadius: '24px',
              height: '40px', padding: '8px 16px', fontSize: '16px'
            }}
            onClick={showAddModal}
          >
            Tambah Pengeluaran
          </Button>
        )}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Text style={{ fontSize: '20px', fontWeight: 500, color: '#111928', display: 'block', marginBottom: '8px' }}>
          Filter Asset
        </Text>
        <Select
          value={selectedAsset}
          onChange={setSelectedAsset}
          loading={isLoadingAssets}
          suffixIcon={<ChevronDown size={12} />}
          style={{ width: 200, height: '40px' }}
          size="large"
        >
          <Option value="all">Semua Asset</Option>
          {assets?.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
        </Select>
      </div>

      <Row gutter={[18, 18]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12}>
          <StatCard 
            title="Total Pengeluaran" 
            value={stats.total_pengeluaran}
            icon={<GiPayMoney />}
            loading={isLoadingReport}
            iconColor="#0958D9"
          />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard 
            title="Operasional" 
            value={categoryTotals.Operasional}
            icon={<FaMoneyBillWave />}
            loading={isLoadingExpenses}
            iconColor="#1E429F"
          />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard 
            title="Proyek" 
            value={categoryTotals.Proyek}
            icon={<BiMoneyWithdraw />}
            loading={isLoadingExpenses}
            iconColor="#27AE60"
          />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard 
            title="Pembelian" 
            value={categoryTotals.Pembelian}
            icon={<GiPayMoney />}
            loading={isLoadingExpenses}
            iconColor="#E74C3C"
          />
        </Col>
      </Row>

      <Card style={{ marginBottom: 24, border: '1px solid #E5E7EB', borderRadius: '12px' }}>
        <Title level={4} style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 500, color: '#111928' }}>
          Pencarian & Filter
        </Title>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '412px', background: '#FFFFFF', border: '1px solid #D9D9D9', borderRadius: '8px', overflow: 'hidden' }}>
            <Input
              placeholder="Cari Deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', flex: 1, padding: '8px 12px', fontSize: '16px' }}
              suffix={searchTerm && <CloseCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.25)', cursor: 'pointer' }} onClick={() => setSearchTerm('')} />}
            />
            <Button type="primary" icon={<SearchOutlined />} style={{ background: '#237804', borderRadius: '0px 2px 2px 0px', height: '40px', width: '46px' }} />
          </div>
          
          <Select
            value={selectedCategory}
            size="large"
            style={{ width: 200, height: '40px' }}
            onChange={setSelectedCategory}
            placeholder="Semua Kategori"
            suffixIcon={<ChevronDown size={12} />}
          >
            <Option value="all">Semua Kategori</Option>
            {Object.entries(EXPENSE_CATEGORIES).map(([val, label]) => 
              <Option key={val} value={val}>{label}</Option>
            )}
          </Select>
        </div>
      </Card>

      <Card style={{ marginBottom: 24, border: '1px solid #E5E7EB', borderRadius: '8px' }}>
        <Title level={4} style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 700, color: '#111928' }}>
          Daftar Pengeluaran
        </Title>

        {(isLoadingExpenses || isLoadingProjects || isLoadingFundings) && (
          <div style={{ textAlign: 'center', padding: '48px' }}><Spin size="large" /></div>
        )}
        
        {isError && !isLoadingExpenses && (
          <Alert message="Error Memuat Data" description={error?.message} type="error" showIcon />
        )}
        
        {!isLoadingExpenses && !isError && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredExpenses && filteredExpenses.length > 0 ? (
              filteredExpenses.map(exp => (
                <ExpenseCard 
                  key={exp.id} 
                  expense={exp}
                  onEditClick={showEditModal}
                  onDetailClick={handleViewDetail}
                  canEdit={canEdit}
                />
              ))
            ) : (
              <div style={{ border: '1px dashed #d9d9d9', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: '16px', color: '#727272' }}>
                  Tidak ada data pengeluaran ditemukan.
                </Text>
              </div>
            )}
          </div>
        )}
      </Card>

      <ExpenseModal
        visible={isModalOpen}
        onClose={handleCancel}
        initialData={editingExpense}
        form={form}
        projects={projects}
        fundings={fundings}
        fundingMap={fundingMap}
      />
    </>
  );
}

export default function ExpensePage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <ExpenseManagementContent />
    </ProtectedRoute>
  );
}