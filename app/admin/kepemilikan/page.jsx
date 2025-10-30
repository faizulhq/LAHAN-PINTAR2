// Di app/admin/kepemilikan/page.jsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Select, InputNumber, DatePicker,
  Typography, Flex, Space, Popconfirm, message, Spin, Alert, Card, Progress,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UsergroupAddOutlined, PercentageOutlined, // <-- Tambah ikon persen
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
import { getFundingSources } from '@/lib/api/funding_source'; // Tetap diperlukan untuk map

const { Title, Text } = Typography;
const { Option } = Select;

const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => value ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';

// --- Mapping Tipe Sumber Dana (untuk dropdown Pendanaan) ---
// (Gunakan mapping yang sesuai dengan backend FundingSource Anda)
const SOURCE_TYPE_MAP = {
  'foundation': 'Yayasan',
  'csr': 'CSR',
  'investor': 'Investor',
};

function OwnershipManagementContent() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOwnership, setEditingOwnership] = useState(null);
  const [selectedInvestor, setSelectedInvestor] = useState('semua');
  const [selectedAsset, setSelectedAsset] = useState('semua');
  const [form] = Form.useForm();

  // --- Fetch Data ---
  const { data: ownerships, isLoading: isLoadingOwnerships, isError: isErrorOwnerships, error: errorOwnerships } = useQuery({ queryKey: ['ownerships'], queryFn: getOwnerships });
  const { data: investors, isLoading: isLoadingInvestors } = useQuery({ queryKey: ['investors'], queryFn: getInvestors });
  const { data: assets, isLoading: isLoadingAssets } = useQuery({ queryKey: ['assets'], queryFn: getAssets });
  const { data: fundings, isLoading: isLoadingFundings } = useQuery({ queryKey: ['fundings'], queryFn: getFundings });
  const { data: fundingSources, isLoading: isLoadingSources } = useQuery({ queryKey: ['fundingSources'], queryFn: getFundingSources }); // Diperlukan untuk sourceMap

  // --- Data Mapping (Memoized) ---
  const sourceMap = useMemo(() => {
    if (!fundingSources) return {};
    return fundingSources.reduce((acc, source) => { acc[source.id] = source.name; return acc; }, {});
  }, [fundingSources]);

  const investorMap = useMemo(() => {
    if (!investors) return {};
    return investors.reduce((acc, inv) => { acc[inv.id] = inv.username || `Investor ${inv.id}`; return acc; }, {});
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
    onError: (err) => {
      // Menampilkan error lebih detail
      let errorMsg = 'Gagal menyimpan kepemilikan.';
      if (err.response?.data) {
        const errors = err.response.data;
        // Cek jika error adalah format dictionary (umum dari DRF)
        if (typeof errors === 'object' && !Array.isArray(errors)) {
           const messages = Object.entries(errors)
             .map(([field, fieldErrors]) => `${field}: ${Array.isArray(fieldErrors) ? fieldErrors.join(', ') : fieldErrors}`)
             .join('; ');
           errorMsg = messages || 'Gagal menyimpan kepemilikan.';
        } else if (errors.detail) { // Cek jika ada 'detail'
            errorMsg = errors.detail;
        } else if (typeof errors === 'string') { // Jika error hanya string
            errorMsg = errors;
        }
      } else {
        errorMsg = err.message || 'Gagal menyimpan kepemilikan.';
      }
      message.error(`Error: ${errorMsg}`, 6);
    },
  };
  const createMutation = useMutation({ mutationFn: createOwnership, ...mutationOptions, onSuccess: (...args) => { message.success('Kepemilikan berhasil ditambahkan'); mutationOptions.onSuccess(...args); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateOwnership(id, data), ...mutationOptions, onSuccess: (...args) => { message.success('Kepemilikan berhasil diperbarui'); mutationOptions.onSuccess(...args); } });
  const deleteMutation = useMutation({ mutationFn: deleteOwnership, onSuccess: () => { message.success('Kepemilikan berhasil dihapus'); queryClient.invalidateQueries({ queryKey: ['ownerships'] }); }, onError: (err) => { message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`); } });

  // --- Handlers ---
  const showAddModal = () => { setEditingOwnership(null); form.resetFields(); setIsModalOpen(true); };
  const showEditModal = (ownership) => {
    setEditingOwnership(ownership);
    form.setFieldsValue({
      investor: ownership.investor,
      asset: ownership.asset,
      funding: ownership.funding,
      units: ownership.units,
      // --- TAMBAHAN: Set value ownership_percentage ---
      ownership_percentage: parseFloat(ownership.ownership_percentage), // Pastikan float
      investment_date: moment(ownership.investment_date),
    });
    setIsModalOpen(true);
  };
  const handleCancel = () => { setIsModalOpen(false); setEditingOwnership(null); form.resetFields(); };

  const handleFormSubmit = (values) => {
    const ownershipData = {
      investor: values.investor,
      asset: values.asset,
      funding: values.funding,
      units: values.units,
      // --- TAMBAHAN: Kirim ownership_percentage ---
      ownership_percentage: values.ownership_percentage,
      // Backend mungkin otomatis set date_acquired, tapi investment_date bisa jadi beda
      investment_date: values.investment_date.format('YYYY-MM-DD'),
    };
    if (editingOwnership) { updateMutation.mutate({ id: editingOwnership.id, data: ownershipData }); }
    else { createMutation.mutate(ownershipData); }
  };
  const handleDelete = (id) => { deleteMutation.mutate(id); };

  // Filter Data
  const filteredOwnerships = useMemo(() => {
    if (!ownerships) return [];
    let data = ownerships;
    if (selectedInvestor !== 'semua') { data = data.filter(o => o.investor === parseInt(selectedInvestor)); }
    if (selectedAsset !== 'semua') { data = data.filter(o => o.asset === parseInt(selectedAsset)); }
    return data;
  }, [ownerships, selectedInvestor, selectedAsset]);

  // --- Kolom Tabel ---
  const columns = [
     { title: 'Investor', dataIndex: 'investor', key: 'investor', render: (investorId) => investorMap[investorId] || `ID: ${investorId}`, sorter: (a, b) => (investorMap[a.investor] || '').localeCompare(investorMap[b.investor] || ''), filters: investors ? Object.entries(investorMap).map(([id, name]) => ({ text: name, value: parseInt(id) })) : [], onFilter: (value, record) => record.investor === value },
     { title: 'Aset', dataIndex: 'asset', key: 'asset', render: (assetId) => assetMap[assetId] || `ID: ${assetId}`, sorter: (a, b) => (assetMap[a.asset] || '').localeCompare(assetMap[b.asset] || ''), filters: assets ? Object.entries(assetMap).map(([id, name]) => ({ text: name, value: parseInt(id) })) : [], onFilter: (value, record) => record.asset === value },
     { title: 'Unit', dataIndex: 'units', key: 'units', sorter: (a, b) => a.units - b.units, align: 'right' },
     {
       title: 'Persentase',
       // --- PERBAIKAN: Typo dataIndex ---
       dataIndex: 'ownership_percentage',
       key: 'ownership_percentage',
       render: (percent) => <Progress percent={parseFloat(percent || 0).toFixed(2)} size="small" />,
       sorter: (a, b) => (parseFloat(a.ownership_percentage || 0)) - (parseFloat(b.ownership_percentage || 0)),
       align: 'center', width: 120
     },
     { title: 'Tgl Investasi', dataIndex: 'investment_date', key: 'investment_date', render: (text) => formatDate(text), sorter: (a, b) => moment(a.investment_date).unix() - moment(b.investment_date).unix() },
     { title: 'Aksi', key: 'action', render: (_, record) => (<Space size="middle"><Button icon={<EditOutlined />} onClick={() => showEditModal(record)} /><Popconfirm title="Hapus Kepemilikan?" description="Yakin hapus data ini?" onConfirm={() => handleDelete(record.id)} okText="Ya" cancelText="Tidak" okButtonProps={{ danger: true, loading: deleteMutation.isPending && deleteMutation.variables === record.id }}><Button danger icon={<DeleteOutlined />} /></Popconfirm></Space>), align: 'center', fixed: 'right' },
  ];

  const isLoadingInitialData = isLoadingOwnerships || isLoadingInvestors || isLoadingAssets || isLoadingFundings || isLoadingSources;
  const isErrorInitialData = isErrorOwnerships || !investors || !assets || !fundings || !fundingSources; // Cek semua dependensi data

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928' }}><UsergroupAddOutlined style={{ marginRight: '8px' }} /> Manajemen Kepemilikan</Title>
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
              {/* Pastikan investors adalah array sebelum map */}
              {Array.isArray(investors) && investors.map(inv => <Option key={inv.id} value={String(inv.id)}>{investorMap[inv.id]}</Option>)}
            </Select>
             <Select
              defaultValue="semua" size="large" style={{ minWidth: 250, flexGrow: 1 }} onChange={(value) => setSelectedAsset(value)}
              loading={isLoadingAssets} placeholder="Filter Aset" allowClear
            >
              <Option value="semua">Semua Aset</Option>
              {Array.isArray(assets) && assets.map(a => <Option key={a.id} value={String(a.id)}>{a.name}</Option>)}
            </Select>
         </Flex>
      </Card>

      {/* Loading & Error Handling */}
      {isLoadingInitialData && <Spin size="large"><div style={{ padding: 50, textAlign: 'center' }} /></Spin>}
      {isErrorInitialData && !isLoadingInitialData && <Alert message="Error Memuat Data Awal" description={errorOwnerships?.message || 'Gagal memuat data relasi'} type="error" showIcon />}

      {/* Tabel */}
      {!isLoadingInitialData && !isErrorInitialData && (
         <Card bodyStyle={{ padding: 0 }}>
            <Table
              columns={columns}
              dataSource={Array.isArray(filteredOwnerships) ? filteredOwnerships : []}
              rowKey="id"
              loading={isLoadingOwnerships || deleteMutation.isPending}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              scroll={{ x: 'max-content' }}
            />
         </Card>
      )}

      {/* Modal Tambah/Edit */}
      <Modal
        title={editingOwnership ? 'Edit Kepemilikan' : 'Tambah Kepemilikan Baru'}
        open={isModalOpen} onCancel={handleCancel} footer={null}
        destroyOnClose // Ganti destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 24 }}>
          <Form.Item name="investor" label="Investor" rules={[{ required: true, message: 'Investor harus dipilih!' }]}>
            <Select placeholder="Pilih investor" loading={isLoadingInvestors} showSearch optionFilterProp="children">
              {Array.isArray(investors) && investors.map(inv => <Option key={inv.id} value={inv.id}>{investorMap[inv.id]}</Option>)}
            </Select>
          </Form.Item>
           <Form.Item name="asset" label="Aset" rules={[{ required: true, message: 'Aset harus dipilih!' }]}>
            <Select placeholder="Pilih aset" loading={isLoadingAssets} showSearch optionFilterProp="children">
              {Array.isArray(assets) && assets.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
            </Select>
          </Form.Item>
           <Form.Item name="funding" label="Pendanaan Terkait" rules={[{ required: true, message: 'Pendanaan harus dipilih!' }]}>
            <Select placeholder="Pilih pendanaan terkait" loading={isLoadingFundings || isLoadingSources} showSearch optionFilterProp="children">
              {Array.isArray(fundings) && fundings.map(f => (
                <Option key={f.id} value={f.id}>
                  {/* Teks Option yang sudah diperbaiki sebelumnya */}
                  {f.purpose || 'Tanpa Tujuan'} - {formatRupiah(f.amount)}
                  ({sourceMap[f.source] || 'Unknown'}, {formatDate(f.date_received)})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="units" label="Jumlah Unit" rules={[{ required: true, message: 'Unit tidak boleh kosong!' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="Masukkan jumlah unit" />
          </Form.Item>

          {/* --- FIELD BARU: Ownership Percentage --- */}
          <Form.Item
             name="ownership_percentage"
             label="Persentase Kepemilikan (%)"
             rules={[{ required: true, message: 'Persentase wajib diisi!' }]}
             tooltip="Persentase dari Pendanaan Terkait yang dialokasikan"
           >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              precision={2} // Izinkan 2 angka desimal
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
              placeholder="Masukkan persentase (0-100)"
            />
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