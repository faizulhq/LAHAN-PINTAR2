// Di app/admin/kepemilikan/page.jsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Select, InputNumber, DatePicker,
  Typography, Flex, Space, Popconfirm, message, Spin, Alert, Card, Progress,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UsergroupAddOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getOwnerships, createOwnership, updateOwnership, deleteOwnership,
} from '@/lib/api/ownership';
import { getInvestors } from '@/lib/api/investor';
import { getAssets } from '@/lib/api/asset';
import { getFundings } from '@/lib/api/funding';
import { getFundingSources } from '@/lib/api/funding_source';

const { Title, Text } = Typography;
const { Option } = Select;

const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => value ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';

function OwnershipManagementContent() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOwnership, setEditingOwnership] = useState(null);
  const [selectedInvestor, setSelectedInvestor] = useState('semua');
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

  // --- Data Mapping (Memoized) ---
  const sourceMap = useMemo(() => {
    if (!fundingSources) return {};
    return fundingSources.reduce((acc, source) => { acc[source.id] = source.name; return acc; }, {});
  }, [fundingSources]);

  const investorMap = useMemo(() => {
    if (!investors) return {};
     // Coba akses username langsung, jika tidak ada fallback ke ID
     return investors.reduce((acc, inv) => {
        acc[inv.id] = inv.username || `Investor ${inv.id}`;
        return acc;
     }, {});
  }, [investors]);


  const assetMap = useMemo(() => {
    if (!assets) return {};
    return assets.reduce((acc, asset) => { acc[asset.id] = asset.name; return acc; }, {});
  }, [assets]);

  // --- Mutasi ---
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerships'] });
      setIsModalOpen(false); setEditingOwnership(null); form.resetFields();
    },
    onError: (err) => { message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal'}`); },
  };
  const createMutation = useMutation({ mutationFn: createOwnership, ...mutationOptions, onSuccess: (...args) => { message.success('Kepemilikan berhasil ditambahkan'); mutationOptions.onSuccess(...args); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateOwnership(id, data), ...mutationOptions, onSuccess: (...args) => { message.success('Kepemilikan berhasil diperbarui'); mutationOptions.onSuccess(...args); } });
  const deleteMutation = useMutation({ mutationFn: deleteOwnership, onSuccess: () => { message.success('Kepemilikan berhasil dihapus'); queryClient.invalidateQueries({ queryKey: ['ownerships'] }); }, onError: (err) => { message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`); } });

  // --- Handlers ---
  const showAddModal = () => { setEditingOwnership(null); form.resetFields(); setIsModalOpen(true); };
  const showEditModal = (ownership) => {
    setEditingOwnership(ownership);
    form.setFieldsValue({
      investor: ownership.investor, asset: ownership.asset, funding: ownership.funding,
      units: ownership.units, investment_date: moment(ownership.investment_date),
    });
    setIsModalOpen(true);
  };
  const handleCancel = () => { setIsModalOpen(false); setEditingOwnership(null); form.resetFields(); };
  const handleFormSubmit = (values) => {
    const ownershipData = {
      investor: values.investor, asset: values.asset, funding: values.funding,
      units: values.units, investment_date: values.investment_date.format('YYYY-MM-DD'),
    };
    if (editingOwnership) { updateMutation.mutate({ id: editingOwnership.id, data: ownershipData }); }
    else { createMutation.mutate(ownershipData); }
  };
  const handleDelete = (id) => { deleteMutation.mutate(id); };

  // --- PERBAIKAN FILTER DATA ---
  const filteredOwnerships = useMemo(() => {
    // Selalu mulai dengan array kosong jika data belum siap
    if (!ownerships) return [];

    let data = ownerships; // Salin data asli

    // Filter berdasarkan Investor
    if (selectedInvestor !== 'semua') {
      data = data.filter(o => o.investor === parseInt(selectedInvestor));
    }

    // Filter berdasarkan Asset
    if (selectedAsset !== 'semua') {
      data = data.filter(o => o.asset === parseInt(selectedAsset));
    }

    // Pastikan selalu mengembalikan array
    return data;

  }, [ownerships, selectedInvestor, selectedAsset]); // Pastikan dependensi benar

  // --- Kolom Tabel ---
  const columns = [
     {
      title: 'Investor', dataIndex: 'investor', key: 'investor',
      render: (investorId) => investorMap[investorId] || `ID: ${investorId}`,
      sorter: (a, b) => (investorMap[a.investor] || '').localeCompare(investorMap[b.investor] || ''),
      filters: investors ? Object.entries(investorMap).map(([id, name]) => ({ text: name, value: parseInt(id) })) : [],
      onFilter: (value, record) => record.investor === value,
    },
    {
      title: 'Aset', dataIndex: 'asset', key: 'asset',
      render: (assetId) => assetMap[assetId] || `ID: ${assetId}`,
      sorter: (a, b) => (assetMap[a.asset] || '').localeCompare(assetMap[b.asset] || ''),
      filters: assets ? Object.entries(assetMap).map(([id, name]) => ({ text: name, value: parseInt(id) })) : [],
      onFilter: (value, record) => record.asset === value,
    },
     { title: 'Unit', dataIndex: 'units', key: 'units', sorter: (a, b) => a.units - b.units, align: 'right' },
    {
      title: 'Persentase', dataIndex: 'ownership_precentage', key: 'ownership_precentage',
      render: (percent) => <Progress percent={parseFloat(percent?.toFixed(2) || 0)} size="small" />,
      sorter: (a, b) => (a.ownership_precentage || 0) - (b.ownership_precentage || 0),
      align: 'center', width: 120 // Beri lebar tetap agar progress bar tidak aneh
    },
    { title: 'Tgl Investasi', dataIndex: 'investment_date', key: 'investment_date', render: (text) => formatDate(text), sorter: (a, b) => moment(a.investment_date).unix() - moment(b.investment_date).unix() },
    {
      title: 'Aksi', key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          <Popconfirm title="Hapus Kepemilikan?" description="Yakin hapus data ini?" onConfirm={() => handleDelete(record.id)} okText="Ya" cancelText="Tidak" okButtonProps={{ danger: true, loading: deleteMutation.isPending }}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
      align: 'center', fixed: 'right', // Buat kolom aksi tetap terlihat saat scroll
    },
  ];

  const isLoadingInitialData = isLoadingOwnerships || isLoadingInvestors || isLoadingAssets || isLoadingFundings || isLoadingSources;
  const isErrorInitialData = isErrorOwnerships || !investors || !assets || !fundings || !fundingSources;

  // Console log untuk debug akhir
  // console.log('Final filteredOwnerships passed to Table:', filteredOwnerships);

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}><UsergroupAddOutlined /> Manajemen Kepemilikan</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>Kelola data kepemilikan aset oleh investor.</Text>
        </div>
        <Button
          type="primary" icon={<PlusOutlined />} size="large"
          style={{ backgroundColor: '#237804', borderRadius: '24px', height: 'auto', padding: '8px 16px', fontSize: '16px' }}
          onClick={showAddModal} loading={createMutation.isPending || updateMutation.isPending}
        >
          Tambah Kepemilikan
        </Button>
      </Flex>

      <Card style={{ marginBottom: 24 }}>
         <Flex gap="middle" wrap="wrap">
            <Select
                defaultValue="semua" size="large" style={{ minWidth: 250, flexGrow: 1 }} onChange={(value) => setSelectedInvestor(value)}
                loading={isLoadingInvestors} placeholder="Filter Investor" allowClear
            >
                <Option value="semua">Semua Investor</Option>
                {/* Pastikan investorMap sudah siap */}
                {investors?.map(inv => <Option key={inv.id} value={String(inv.id)}>{investorMap[inv.id]}</Option>)}
            </Select>
             <Select
                defaultValue="semua" size="large" style={{ minWidth: 250, flexGrow: 1 }} onChange={(value) => setSelectedAsset(value)}
                loading={isLoadingAssets} placeholder="Filter Aset" allowClear
            >
                <Option value="semua">Semua Aset</Option>
                {assets?.map(a => <Option key={a.id} value={String(a.id)}>{a.name}</Option>)}
            </Select>
         </Flex>
      </Card>

      {/* Tampilkan Loading atau Error jika fetch awal gagal */}
      {isLoadingInitialData && <Spin size="large"><div style={{ padding: 50 }} /></Spin>}
      {isErrorInitialData && !isLoadingInitialData && <Alert message="Error Memuat Data Awal" description={errorOwnerships?.message || 'Gagal memuat data investor/aset/sumber dana'} type="error" showIcon />}

      {/* Tampilkan Tabel hanya jika fetch awal berhasil */}
      {!isLoadingInitialData && !isErrorInitialData && (
         <Card>
            <Table
                columns={columns}
                // Pastikan dataSource selalu array
                dataSource={Array.isArray(filteredOwnerships) ? filteredOwnerships : []}
                rowKey="id"
                loading={isLoadingOwnerships || deleteMutation.isPending} // Loading spesifik untuk ownerships
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
            />
         </Card>
      )}

      {/* Modal */}
      <Modal
        title={editingOwnership ? 'Edit Kepemilikan' : 'Tambah Kepemilikan Baru'}
        open={isModalOpen} onCancel={handleCancel} footer={null}
        destroyOnHidden // Perbaiki warning deprecation
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 24 }}>
          <Form.Item name="investor" label="Investor" rules={[{ required: true, message: 'Investor harus dipilih!' }]}>
            <Select placeholder="Pilih investor" loading={isLoadingInvestors} showSearch optionFilterProp="children">
              {investors?.map(inv => <Option key={inv.id} value={inv.id}>{investorMap[inv.id]}</Option>)}
            </Select>
          </Form.Item>
           <Form.Item name="asset" label="Aset" rules={[{ required: true, message: 'Aset harus dipilih!' }]}>
            <Select placeholder="Pilih aset" loading={isLoadingAssets} showSearch optionFilterProp="children">
              {assets?.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
            </Select>
          </Form.Item>
           <Form.Item name="funding" label="Pendanaan Terkait" rules={[{ required: true, message: 'Pendanaan harus dipilih!' }]}>
            <Select placeholder="Pilih pendanaan terkait" loading={isLoadingFundings || isLoadingSources} showSearch optionFilterProp="children">
              {fundings?.map(f => (
                <Option key={f.id} value={f.id}>
                  {sourceMap[f.source] || `Sumber ID ${f.source}`} - {formatRupiah(f.amount)} ({formatDate(f.date_received)})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="units" label="Jumlah Unit" rules={[{ required: true, message: 'Unit tidak boleh kosong!' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="Masukkan jumlah unit" />
          </Form.Item>
          <Form.Item name="investment_date" label="Tanggal Investasi" rules={[{ required: true, message: 'Tanggal harus dipilih!' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY"/>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: 32 }}>
            <Space>
              <Button onClick={handleCancel}>Batal</Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} style={{backgroundColor: '#237804'}}>
                {editingOwnership ? 'Simpan Perubahan' : 'Tambah Kepemilikan'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
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