// Di app/admin/kepemilikan/page.jsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Select, InputNumber, DatePicker,
  Typography, Flex, Space, message, Spin, Alert, Card, Row, Col,
} from 'antd';
import {
  PlusOutlined, EditOutlined, EyeOutlined, TeamOutlined,
  DollarOutlined, AppstoreOutlined, PercentageOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getOwnerships, createOwnership, updateOwnership,
} from '@/lib/api/ownership';
import { getInvestors } from '@/lib/api/investor';
import { getAssets } from '@/lib/api/asset';
import { getFundings } from '@/lib/api/funding';
import { getFundingSources } from '@/lib/api/funding_source';
import { HiUserGroup } from 'react-icons/hi';
import { BiSolidBox } from 'react-icons/bi';
import { FaMoneyBill1, FaMoneyBillTransfer } from 'react-icons/fa6';

const { Title, Text } = Typography;
const { Option } = Select;

const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

const COLORS = ['#1C64F2', '#16BDCA', '#9061F9', '#f5222d', '#722ed1', '#13c2c2'];

function OwnershipManagementContent() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingOwnership, setEditingOwnership] = useState(null);
  const [viewingOwnership, setViewingOwnership] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState('semua');
  const [form] = Form.useForm();

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

  const fundingMap = useMemo(() => {
    if (!fundings) return {};
    return fundings.reduce((acc, funding) => { acc[funding.id] = funding; return acc; }, {});
  }, [fundings]);

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
    });
    setIsModalOpen(true);
  };

  const showDetailModal = (ownership) => {
    setViewingOwnership(ownership);
    setIsDetailModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingOwnership(null);
    form.resetFields();
  };

  const handleDetailCancel = () => {
    setIsDetailModalOpen(false);
    setViewingOwnership(null);
  };

  const handleFormSubmit = (values) => {
    const ownershipData = {
      investor: values.investor,
      asset: values.asset,
      funding: values.funding,
      units: values.units,
      investment_date: values.investment_date.format('YYYY-MM-DD'),
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
    <>
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}>
            Manajemen Kepemilikan
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Kelola unit kepemilikan dan porsi investor
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
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
      </Flex>

      {/* Filter */}
      <Card style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>Filter Aset</Text>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">Kandang Ayam</Text>
            </div>
            <Select
              value={selectedAsset}
              style={{ width: '100%' }}
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
      </Card>

      {/* Cards Statistik */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Flex align="center" gap={12}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '8px',
                backgroundColor: '#e6f7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HiUserGroup style={{ fontSize: 24, color: '#1890ff' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Total Investor</Text>
                <Title level={4} style={{ margin: 0 }}>{statistics.totalInvestors}</Title>
              </div>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Flex align="center" gap={12}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '8px',
                backgroundColor: '#f0f5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BiSolidBox style={{ fontSize: 24, color: '#597ef7' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Total Unit</Text>
                <Title level={4} style={{ margin: 0 }}>{statistics.totalUnits}</Title>
              </div>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Flex align="center" gap={12}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '8px',
                backgroundColor: '#f6ffed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaMoneyBillTransfer style={{ fontSize: 24, color: '#52c41a' }} />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Total Investasi</Text>
                <Title level={4} style={{ margin: 0, fontSize: 16 }}>
                  {formatRupiah(statistics.totalInvestment)}
                </Title>
              </div>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Flex align="center" gap={12}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '8px',
                backgroundColor: '#fff7e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaMoneyBill1 style={{ fontSize: 24, color: '#fa8c16' }} />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Nilai per Unit</Text>
                <Title level={4} style={{ margin: 0, fontSize: 16 }}>
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
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${value.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
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
              ownershipSummary.map((item, index) => (
                <Card 
                  key={index} 
                  size="small" 
                  style={{ marginBottom: 12, backgroundColor: '#fafafa' }}
                >
                  <Flex justify="space-between" align="start">
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ display: 'block' }}>{item.name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.units.toLocaleString('id-ID')} unit • {formatRupiah(item.investment)}
                      </Text>
                    </div>
                    <div style={{
                      backgroundColor: ['#e6f7ff', '#f6ffed', '#fff7e6'][index % 3],
                      color: ['#3521ebff', '#11d4a3ff', '#a914faff'][index % 3],
                      padding: '2px 12px',
                      borderRadius: '12px',
                      fontSize: 14,
                      fontWeight: 600
                    }}>
                      {item.percentage.toFixed(0)}%
                    </div>
                  </Flex>
                  <div style={{ 
                    marginTop: 8,
                    height: 6,
                    backgroundColor: '#e8e8e8',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${item.percentage}%`,
                      height: '100%',
                      backgroundColor: COLORS[index % COLORS.length],
                      borderRadius: 3
                    }} />
                  </div>
                </Card>
              ))
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

      {/* Tabel Daftar Investor */}
      {!isLoadingInitialData && !isErrorInitialData && (
        <Card title="Daftar Investor">
          {filteredOwnerships.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              {filteredOwnerships.map((ownership, index) => (
                <Card 
                  key={ownership.id}
                  size="small" 
                  style={{ marginBottom: 12, borderLeft: '3px solid #52c41a' }}
                >
                  <Row gutter={[16, 8]} align="middle">
                    <Col xs={24} sm={12} md={5}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Investor</Text>
                      <Text strong>{ownership.investor_name || '-'}</Text>
                      <div style={{
                        display: 'inline-block',
                        marginLeft: 8,
                        padding: '2px 8px',
                        backgroundColor: '#eeeeeeff',
                        borderRadius: '4px',
                        Color: '#2715f1ff',
                        fontSize: 11
                      }}>
                        Aktif
                      </div>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Unit Kepemilikan</Text>
                      <Text strong>{ownership.units?.toLocaleString('id-ID') || '0'}</Text>
                    </Col>
                    <Col xs={12} sm={6} md={3}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Persentase</Text>
                      <Text strong style={{ color: '#020202ff' }}>
                        {ownership.ownership_percentage?.toFixed(0) || '0'}%
                      </Text>
                    </Col>
                    <Col xs={12} sm={12} md={5}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Total Investasi</Text>
                      <Text strong style={{ color: '#090908ff' }}>
                        {formatRupiah(ownership.total_investment)}
                      </Text>
                    </Col>
                    <Col xs={12} sm={6} md={4}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Tanggal Bergabung</Text>
                      <Text>{formatDate(ownership.investment_date)}</Text>
                    </Col>
                    <Col xs={24} sm={6} md={4}>
                      <Space size="small" wrap>
                        <Button 
                          size="medium" 
                          onClick={() => showDetailModal(ownership)}
                        >
                          Detail
                        </Button>
                        <Button 
                          size="medium"
                          type="primary"
                          onClick={() => showEditModal(ownership)}
                          style={{ backgroundColor: '#058214ff', borderColor: '#52c41a' }}
                        >
                          Edit
                        </Button>
                      </Space>
                    </Col>
                  </Row>
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
        title={editingOwnership ? 'Edit Kepemilikan' : 'Tambah Kepemilikan Baru'}
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
          <Form.Item
            name="investor"
            label="Investor"
            rules={[{ required: true, message: 'Investor harus dipilih!' }]}
          >
            <Select
              placeholder="Pilih investor"
              loading={isLoadingInvestors}
              showSearch
              optionFilterProp="children"
              size="large"
            >
              {investors?.map(inv => (
                <Option key={inv.id} value={inv.id}>
                  {inv.username || `Investor ${inv.id}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="asset"
            label="Aset"
            rules={[{ required: true, message: 'Aset harus dipilih!' }]}
          >
            <Select
              placeholder="Pilih aset"
              loading={isLoadingAssets}
              showSearch
              optionFilterProp="children"
              size="large"
            >
              {assets?.map(a => (
                <Option key={a.id} value={a.id}>
                  {a.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="funding"
            label="Pendanaan Terkait"
            rules={[{ required: true, message: 'Pendanaan harus dipilih!' }]}
          >
            <Select
              placeholder="Pilih pendanaan terkait"
              loading={isLoadingFundings || isLoadingSources}
              showSearch
              optionFilterProp="children"
              size="large"
            >
              {fundings?.map(f => (
                <Option key={f.id} value={f.id}>
                  {sourceMap[f.source] || `Sumber ID ${f.source}`} - {formatRupiah(f.amount)} ({formatDate(f.date_received)})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="units"
            label="Jumlah Unit"
            rules={[{ required: true, message: 'Unit tidak boleh kosong!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="Masukkan jumlah unit"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="investment_date"
            label="Tanggal Investasi"
            rules={[{ required: true, message: 'Tanggal harus dipilih!' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: 32, marginBottom: 0 }}>
            <Space>
              <Button onClick={handleCancel} size="large">
                Batal
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                size="large"
              >
                {editingOwnership ? 'Simpan Perubahan' : 'Tambah Kepemilikan'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Detail */}
      <Modal
        title="Detail Kepemilikan"
        open={isDetailModalOpen}
        onCancel={handleDetailCancel}
        footer={[
          <Button key="close" onClick={handleDetailCancel} size="large">
            Tutup
          </Button>
        ]}
        width={600}
      >
        {viewingOwnership && (
          <div style={{ marginTop: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card size="small">
                  <Text type="secondary">Investor</Text>
                  <Title level={5} style={{ margin: '4px 0 0 0' }}>
                    {viewingOwnership.investor_name || '-'}
                  </Title>
                </Card>
              </Col>
              <Col span={24}>
                <Card size="small">
                  <Text type="secondary">Aset</Text>
                  <Title level={5} style={{ margin: '4px 0 0 0' }}>
                    {viewingOwnership.asset_name || '-'}
                  </Title>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Text type="secondary">Unit Kepemilikan</Text>
                  <Title level={5} style={{ margin: '4px 0 0 0' }}>
                    {viewingOwnership.units?.toLocaleString('id-ID') || '0'}
                  </Title>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Text type="secondary">Persentase</Text>
                  <Title level={5} style={{ margin: '4px 0 0 0' }}>
                    {viewingOwnership.ownership_percentage?.toFixed(2) || '0'}%
                  </Title>
                </Card>
              </Col>
              <Col span={24}>
                <Card size="small">
                  <Text type="secondary">Total Investasi</Text>
                  <Title level={5} style={{ margin: '4px 0 0 0', color: '#52c41a' }}>
                    {formatRupiah(viewingOwnership.total_investment)}
                  </Title>
                </Card>
              </Col>
              <Col span={24}>
                <Card size="small">
                  <Text type="secondary">Sumber Dana</Text>
                  <Title level={5} style={{ margin: '4px 0 0 0' }}>
                    {sourceMap[fundingMap[viewingOwnership.funding]?.source] || '-'}
                  </Title>
                </Card>
              </Col>
              <Col span={24}>
                <Card size="small">
                  <Text type="secondary">Tanggal Bergabung</Text>
                  <Title level={5} style={{ margin: '4px 0 0 0' }}>
                    {formatDate(viewingOwnership.investment_date)}
                  </Title>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function OwnershipPage() {
  return (
    <ProtectedRoute>
      <OwnershipManagementContent />
    </ProtectedRoute>
  );
}