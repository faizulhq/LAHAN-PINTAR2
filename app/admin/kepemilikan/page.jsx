'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Modal, Form, Select, InputNumber, DatePicker,
  Typography, Flex, Space, message, Spin, Alert, Card, Row, Col
} from 'antd';
import {
  PlusOutlined as AntPlusOutlined,
} from '@ant-design/icons';

// Import Icon
import { HiUserGroup as IconUserGroup } from 'react-icons/hi';
import { BiSolidBox as IconBox } from 'react-icons/bi';
import { FaMoneyBillTransfer as IconTransfer, FaMoneyBill1 as IconMoney } from 'react-icons/fa6';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getOwnerships, createOwnership, updateOwnership,
} from '@/lib/api/ownership';
import { getInvestors } from '@/lib/api/investor';
import { getAssets } from '@/lib/api/asset';
import { getFundings } from '@/lib/api/funding';
import { getFundingSources } from '@/lib/api/funding_source';
import useAuthStore from '@/lib/store/authStore';

const { Title, Text } = Typography;
const { Option } = Select;

const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const COLORS = ['#1C64F2', '#16BDCA', '#9061F9', '#f5222d', '#722ed1', '#13c2c2'];

function OwnershipManagementContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOwnership, setEditingOwnership] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState('semua');
  const [form] = Form.useForm();

  // [RBAC] Logic Hak Akses & Judul Dinamis
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);
  const isInvestor = userRole === 'Investor';

  let titleText = "Data Kepemilikan";
  let subText = "Informasi kepemilikan aset dan saham.";

  if (canEdit) {
    titleText = "Manajemen Kepemilikan";
    subText = "Kelola unit kepemilikan dan porsi investor.";
  } else if (isInvestor) {
    titleText = "Portofolio Saya";
    subText = "Ringkasan aset dan saham yang Anda miliki.";
  }

  // --- Fetch Data ---
  const { data: ownerships, isLoading: isLoadingOwnerships, isError: isErrorOwnerships, error: errorOwnerships } = useQuery({
    queryKey: ['ownerships'],
    queryFn: getOwnerships,
  });
  const { data: investors, isLoading: isLoadingInvestors } = useQuery({ queryKey: ['investors'], queryFn: getInvestors });
  const { data: assets, isLoading: isLoadingAssets } = useQuery({ queryKey: ['assets'], queryFn: getAssets });
  const { data: fundings, isLoading: isLoadingFundings } = useQuery({ queryKey: ['fundings'], queryFn: getFundings });
  const { data: fundingSources, isLoading: isLoadingSources } = useQuery({ queryKey: ['fundingSources'], queryFn: getFundingSources });

  // --- Data Mapping ---
  const sourceMap = useMemo(() => {
    if (!fundingSources) return {};
    return fundingSources.reduce((acc, source) => { acc[source.id] = source.name; return acc; }, {});
  }, [fundingSources]);

  // --- Mutasi ---
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerships'] });
      setIsModalOpen(false);
      setEditingOwnership(null);
      form.resetFields();
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal'}`);
    },
  };

  const createMutation = useMutation({
    mutationFn: createOwnership,
    ...mutationOptions,
    onSuccess: (...args) => {
      message.success('Kepemilikan berhasil ditambahkan');
      mutationOptions.onSuccess(...args);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateOwnership(id, data),
    ...mutationOptions,
    onSuccess: (...args) => {
      message.success('Kepemilikan berhasil diperbarui');
      mutationOptions.onSuccess(...args);
    }
  });

  // --- Handlers ---
  const showAddModal = () => {
    setEditingOwnership(null);
    form.resetFields();
    // Default status Active saat tambah
    form.setFieldsValue({ status: 'Active' });
    setIsModalOpen(true);
  };

  const showEditModal = (ownership) => {
    setEditingOwnership(ownership);
    form.setFieldsValue({
      investor: ownership.investor,
      asset: ownership.asset,
      funding: ownership.funding,
      units: ownership.units,
      investment_date: moment(ownership.investment_date),
      status: ownership.status || 'Active' // [PERUBAHAN] Set status ke form
    });
    setIsModalOpen(true);
  };

  const handleDetailClick = (ownershipId) => {
    router.push(`/admin/kepemilikan/${ownershipId}`);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingOwnership(null);
    form.resetFields();
  };

  const handleFormSubmit = (values) => {
    const ownershipData = {
      investor: values.investor,
      asset: values.asset || null, 
      funding: values.funding,
      units: values.units,
      investment_date: values.investment_date.format('YYYY-MM-DD'),
      status: values.status || 'Active' // [PERUBAHAN] Kirim status ke backend
    };

    if (editingOwnership) {
      updateMutation.mutate({ id: editingOwnership.id, data: ownershipData });
    } else {
      createMutation.mutate(ownershipData);
    }
  };

  // --- Filter Data ---
  const filteredOwnerships = useMemo(() => {
    if (!ownerships) return [];
    let data = ownerships;
    if (selectedAsset !== 'semua') {
      data = data.filter(o => o.asset === parseInt(selectedAsset));
    }
    return data;
  }, [ownerships, selectedAsset]);

  // --- Statistik ---
  const statistics = useMemo(() => {
    if (!filteredOwnerships) return {
      totalInvestors: 0,
      totalUnits: 0,
      totalInvestment: 0,
      valuePerUnit: 0
    };
    const uniqueInvestors = new Set();
    let totalUnits = 0;
    let totalInvestment = 0;

    filteredOwnerships.forEach(ownership => {
      uniqueInvestors.add(ownership.investor);
      totalUnits += Number(ownership.units) || 0;
      totalInvestment += Number(ownership.total_investment) || 0;
    });

    const valuePerUnit = totalUnits > 0 ? totalInvestment / totalUnits : 0;

    return {
      totalInvestors: uniqueInvestors.size,
      totalUnits,
      totalInvestment,
      valuePerUnit
    };
  }, [filteredOwnerships]);

  // --- Komposisi Kepemilikan (untuk Pie Chart) ---
  const ownershipComposition = useMemo(() => {
    if (!filteredOwnerships) return [];

    const totalUnits = filteredOwnerships.reduce((sum, o) => sum + (o.units || 0), 0);

    const composition = {};
    filteredOwnerships.forEach(ownership => {
      const investorName = ownership.investor_name || `investor ${ownership.investor}`;
      const investorId = ownership.investor;

      if(!composition[investorId]) {
        composition[investorId] = {
          name: investorName,
          percentage: 0,
          units: 0,
          investment: 0
        };
      }

      composition[investorId].units += ownership.units || 0;
      composition[investorId].investment += Number(ownership.total_investment)
    });

    const result= Object.values(composition).map(item => ({
      ...item,
      percentage: totalUnits > 0 ? (item.units / totalUnits) * 100 : 0
    }));
    return result.sort((a, b) => b.percentage - a.percentage);
  }, [filteredOwnerships]);

  // --- Data untuk Pie Chart ---
  const pieChartData = useMemo(() => {
    return ownershipComposition.map(item => ({
      name: item.name,
      value: item.percentage
    }));
  }, [ownershipComposition]);

  // --- Ringkasan Kepemilikan (untuk List) ---
  const ownershipSummary = useMemo(() => {
    return ownershipComposition.slice(0, 3); // Top 3
  }, [ownershipComposition]);

  const isLoadingInitialData = isLoadingOwnerships || isLoadingInvestors || isLoadingAssets || isLoadingFundings || isLoadingSources;
  const isErrorInitialData = isErrorOwnerships || !investors || !assets || !fundings || !fundingSources;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' ,fontWeight: 700, fontSize: '30px'}}>
            {titleText}
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            {subText}
          </Text>
        </div>
        {canEdit && (
          <Button
            type="primary"
            icon={<AntPlusOutlined />}
            size="large"
            onClick={showAddModal}
            loading={createMutation.isPending || updateMutation.isPending}
            style={{
              backgroundColor: '#237804',
              borderColor: '#237804',
              borderRadius: '6px',
              fontWeight: 500
            }}
          >
            Tambah Investor
          </Button>
        )}
      </Flex>

      {/* Filter */}
        <Text strong style={{ display: 'block', marginBottom: 12, fontSize: '20px' }}>Filter Aset</Text>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Select
              value={selectedAsset}
              style={{ width: '30%' }}
              onChange={(value) => setSelectedAsset(value)}
              loading={isLoadingAssets}
              placeholder="Pilih Aset"
              size="large"
            >
              <Option value="semua">Semua Aset</Option>
              {assets?.map(a => (
                <Option key={a.id} value={String(a.id)}>{a.name}</Option>
              ))}
            </Select>
          </Col>
        </Row>

      {/* Cards Statistik */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16, marginTop: 16 }}>
        <Col xs={24} sm={12} lg={12}>
          <Card>
            <Flex align="center" gap={12}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconUserGroup style={{ fontSize: 30, color: '#1C64F2' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 18, color: '#111928' }}>Total Investor</Text>
                <Title level={4} style={{ margin: 0, fontSize: '31px' }}>{statistics.totalInvestors}</Title>
              </div>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Card>
            <Flex align="center" gap={12}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconBox style={{ fontSize: 30, color: '#9061F9' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 18, color: '#111928' }}>Total Unit</Text>
                <Title level={4} style={{ margin: 0, fontSize: '31px', fontWeight: 600 }}>{statistics.totalUnits}</Title>
              </div>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Card>
            <Flex align="center" gap={12}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconTransfer style={{ fontSize: 30, color: '#7CB305' }} />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <Text type="secondary" style={{ fontSize: 18, color: '#111928' }}>Total Investasi</Text>
                <Title level={4} style={{ margin: 0, fontSize: 31 }}>
                  {formatRupiah(statistics.totalInvestment)}
                </Title>
              </div>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Card>
            <Flex align="center" gap={12}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconMoney style={{ fontSize: 30, color: '#CF1322' }} />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <Text type="secondary" style={{ fontSize: 18, color: '#111928' }}>Nilai per Unit</Text>
                <Title level={4} style={{ margin: 0, fontSize: 31 }}>
                  {formatRupiah(statistics.valuePerUnit)}
                </Title>
              </div>
            </Flex>
          </Card>
        </Col>
      </Row>

      {/* Komposisi & Ringkasan */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
        <Card title="Komposisi Kepemilikan" style={{ height: '100%' }}>
          {pieChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}\n${value.toFixed(0)}%`}
                    outerRadius={100}
                    innerRadius={0}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '24px', 
                marginTop: '16px',
                flexWrap: 'wrap'
              }}>
                {pieChartData.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: COLORS[index % COLORS.length]
                    }} />
                    <Text style={{ fontSize: '14px' }}>{entry.name}</Text>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">Belum ada data kepemilikan</Text>
            </div>
          )}
        </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Ringkasan Kepemilikan" style={{ height: '100%' }}>
            {ownershipSummary.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {ownershipSummary.map((item, index) => (
                  <div key={index}>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                      <div>
                        <Text strong style={{ display: 'block', fontSize: 16, marginBottom: 4 }}>
                          {item.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 16 }}>
                          {item.units.toLocaleString('id-ID')} unit • {formatRupiah(item.investment)}
                        </Text>
                      </div>
                      <div style={{
                        backgroundColor: ['#E6F4FF', '#F6FFED', '#FFF0F6'][index % 3],
                        color: ['#1C64F2', '#16BDCA', '#9061F9'][index % 3],
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: 14,
                        fontWeight: 600,
                        minWidth: 50,
                        textAlign: 'center'
                      }}>
                        {item.percentage.toFixed(0)}%
                      </div>
                    </Flex>
                    <div style={{ 
                      height: 8,
                      backgroundColor: '#F0F0F0',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${item.percentage}%`,
                        height: '100%',
                        backgroundColor: COLORS[index % COLORS.length],
                        borderRadius: 4,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                      Bergabung: {formatDate(ownershipSummary[index]?.investment_date || filteredOwnerships[index]?.investment_date)}
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">Belum ada data ringkasan</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Loading dan Error */}
      {isLoadingInitialData && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      )}

      {isErrorInitialData && !isLoadingInitialData && (
        <Alert
          message="Error Memuat Data"
          description={errorOwnerships?.message || 'Gagal memuat data'}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Daftar Investor */}
      {!isLoadingInitialData && !isErrorInitialData && (
        <Card title="Daftar Investor" style={{ marginTop: 16 }}>
          {filteredOwnerships.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredOwnerships.map((ownership, index) => (
                <Card 
                  key={ownership.id}
                  style={{ 
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    border: '1px solid #f0f0f0'
                  }}
                >
                  {/* Header Section dengan Nama dan Badge Status Dinamis */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 20 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text strong style={{ fontSize: 20 }}>
                        {ownership.investor_name || '-'}
                      </Text>
                      {/* [PERUBAHAN] Tag Status Dinamis dari DB */}
                      <div style={{
                        padding: '2px 12px',
                        backgroundColor: ownership.status === 'Active' ? '#E1EFFE' : '#FDE8E8',
                        borderRadius: '4px',
                        color: ownership.status === 'Active' ? '#1E429F' : '#9B1C1C',
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        {ownership.status === 'Active' ? 'Aktif' : 'Non-Aktif'}
                      </div>
                    </div>
                  </div>

                  {/* Data Grid - 4 Kolom dalam 1 Baris */}
                  <Row gutter={[24, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={12} sm={12} md={6}>
                      <div>
                        <Text type="secondary" style={{ 
                          fontSize: 12, 
                          display: 'block', 
                          marginBottom: 6,
                          lineHeight: '20px'
                        }}>
                          Unit Kepemilikan
                        </Text>
                        <Text strong style={{ fontSize: 14, lineHeight: '22px' }}>
                          {ownership.units?.toLocaleString('id-ID') || '0'}
                        </Text>
                      </div>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <div>
                        <Text type="secondary" style={{ 
                          fontSize: 12, 
                          display: 'block', 
                          marginBottom: 6,
                          lineHeight: '20px'
                        }}>
                          Persentase
                        </Text>
                        <Text strong style={{ fontSize: 14, lineHeight: '22px' }}>
                          {ownership.ownership_percentage?.toFixed(0) || '0'}%
                        </Text>
                      </div>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <div>
                        <Text type="secondary" style={{ 
                          fontSize: 12, 
                          display: 'block', 
                          marginBottom: 6,
                          lineHeight: '20px'
                        }}>
                          Total Investasi
                        </Text>
                        <Text strong style={{ fontSize: 14, lineHeight: '22px' }}>
                          {formatRupiah(ownership.total_investment)}
                        </Text>
                      </div>
                    </Col>
                    <Col xs={12} sm={12} md={6}>
                      <div>
                        <Text type="secondary" style={{ 
                          fontSize: 12, 
                          display: 'block', 
                          marginBottom: 6,
                          lineHeight: '20px'
                        }}>
                          Tanggal Bergabung
                        </Text>
                        <Text style={{ fontSize: 14, lineHeight: '22px' }}>
                          {formatDate(ownership.investment_date)}
                        </Text>
                      </div>
                    </Col>
                  </Row>

                  {/* Action Buttons */}
                  <div>
                    <Space size={8}>
                      <Button 
                        size="middle"
                        style={{ 
                          borderColor: '#237804',
                          color: '#237804',
                          minWidth: '100px',
                          height: '36px',
                          borderRadius: '6px',
                          fontWeight: 400
                        }}
                        onClick={() => handleDetailClick(ownership.id)}
                      >
                        Detail
                      </Button>
                      
                      {/* [RBAC] Tombol Edit */}
                      {canEdit && (
                        <Button 
                          size="middle"
                          type="primary"
                          onClick={() => showEditModal(ownership)}
                          style={{ 
                            backgroundColor: '#237804', 
                            borderColor: '#237804',
                            minWidth: '100px',
                            height: '36px',
                            borderRadius: '6px',
                            fontWeight: 400
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </Space>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">Belum ada data investor</Text>
            </div>
          )}
        </Card>
      )}

      {/* Modal Tambah/Edit */}
      <Modal
        title={editingOwnership ? 'Edit Kepemilikan' : 'Tambah Kepemilikan'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          style={{ marginTop: 24 }}
        >
          <Form.Item name="investor" label="Investor" rules={[{ required: true, message: 'Investor harus dipilih!' }]}>
            <Select placeholder="Pilih investor" showSearch size="large">
              {investors?.map(inv => (
                <Option key={inv.id} value={inv.id}>{inv.username || `Investor ${inv.id}`}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="asset" label="Aset (Opsional)">
            <Select placeholder="Pilih aset (Kosongkan untuk Dana Mengendap)" showSearch size="large" allowClear>
              {assets?.map(a => (
                <Option key={a.id} value={a.id}>{a.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          {/* [PERUBAHAN] Input Status di Modal Utama */}
          <Form.Item name="status" label="Status Kepemilikan" rules={[{ required: true, message: 'Status harus dipilih!' }]}>
            <Select placeholder="Pilih status" size="large">
              <Option value="Active">Active (Aktif)</Option>
              <Option value="Inactive">Inactive (Non-Aktif)</Option>
            </Select>
          </Form.Item>

          <Form.Item name="funding" label="Pendanaan Terkait" rules={[{ required: true, message: 'Pendanaan harus dipilih!' }]}>
            <Select placeholder="Pilih pendanaan" showSearch size="large">
              {fundings?.map(f => (
                <Option key={f.id} value={f.id}>
                  {/* Gunakan Optional Chaining untuk sourceMap */}
                  {sourceMap?.[f.source] || `Sumber ID ${f.source}`} - {formatRupiah(f.amount)} ({formatDate(f.date_received)})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="units" label="Jumlah Unit" rules={[{ required: true, message: 'Unit tidak boleh kosong!' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="Masukkan jumlah unit" size="large" />
          </Form.Item>
          <Form.Item name="investment_date" label="Tanggal Investasi" rules={[{ required: true, message: 'Tanggal harus dipilih!' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: 32, marginBottom: 0 }}>
            <Space>
              <Button onClick={handleCancel} size="large">Batal</Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} 
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} size="large">
                Simpan Perubahan
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default function OwnershipPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Viewer']}>
      <OwnershipManagementContent />
    </ProtectedRoute>
  );
}