'use client';
import React, { useMemo, useState } from 'react';
import {
  Row, Col, Card, Select, Tabs, List, Typography, Divider, Tag, Spin, Alert, Empty, Table, Button, Popconfirm, Tooltip, message, Space
} from 'antd';
import { DollarCircleFilled, CheckCircleOutlined, DeleteOutlined, UserOutlined, PieChartOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getProfitDistributions, updateProfitDistribution, deleteProfitDistribution } from '@/lib/api/profit_distribution';
import { getDistributionDetails } from '@/lib/api/distribution_detail';
import { getProductions } from '@/lib/api/production';
import { getAssets } from '@/lib/api/asset';
import { getInvestors } from '@/lib/api/investor';
import { HiUserGroup } from 'react-icons/hi';
import useAuthStore from '@/lib/store/authStore';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// --- Helper Formatting ---
const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : 'Rp 0';

const formatShortDate = (dateString) =>
  dateString ? moment(dateString).format('DD MMM YYYY') : '-';

const getPeriodText = (distribution) => {
  if (distribution.period) {
    if (distribution.period.match(/[A-Za-z]+\s+\d{4}/)) {
      return distribution.period;
    }
    return formatShortDate(distribution.period);
  }
  return formatShortDate(distribution.created_at);
};

function ProfitDistributionContent() {
  const queryClient = useQueryClient();
  const [assetFilter, setAssetFilter] = useState(null);
  const [activeTab, setActiveTab] = useState('ringkasan');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const isInvestor = userRole === 'Investor';
  const isViewer = userRole === 'Viewer';
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  let titleText = "Bagi Hasil";
  let subText = "Kelola dan pantau distribusi keuntungan kepada investor";

  if (isInvestor) {
    titleText = "Bagi Hasil Anda";
    subText = "Pantau dividen dan keuntungan bersih dari investasi Anda.";
  }

  // --- DATA FETCHING ---
  const { data: distributions = [], isLoading: loadingDist, isError: errorDist } = useQuery({
    queryKey: ['profitDistributions'],
    queryFn: getProfitDistributions,
  });

  const { data: details = [], isLoading: loadingDetails } = useQuery({
    queryKey: ['distributionDetails'],
    queryFn: getDistributionDetails,
    enabled: !!distributions,
  });

  const { data: productions = [], isLoading: loadingProductions } = useQuery({
    queryKey: ['productions'],
    queryFn: getProductions,
  });

  const { data: assets = [], isLoading: loadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const { data: investors = [], isLoading: loadingInvestors } = useQuery({
    queryKey: ['investors'],
    queryFn: getInvestors,
  });

  // --- MUTATIONS ---
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateProfitDistribution(id, { status }),
    onSuccess: () => {
      message.success('Status distribusi berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['profitDistributions'] });
    },
    onError: (err) => message.error(`Gagal update status: ${err.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfitDistribution,
    onSuccess: () => {
      message.success('Data distribusi berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['profitDistributions'] });
    },
    onError: (err) => message.error(`Gagal menghapus data: ${err.message}`)
  });

  // --- HANDLERS ---
  const handleMarkAsDistributed = (id) => updateStatusMutation.mutate({ id, status: 'Distributed' });
  const handleDelete = (id) => deleteMutation.mutate(id);

  // [FIX] DEFINISI isLoading YANG SEBELUMNYA HILANG
  const isLoading = loadingDist || loadingDetails || loadingProductions || loadingAssets || loadingInvestors;
  const isError = errorDist;

  // --- DATA PROCESSING ---
  const assetMap = useMemo(() => (assets || []).reduce((acc, a) => ({ ...acc, [a.id]: a.name }), {}), [assets]);
  const productionMap = useMemo(() => (productions || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {}), [productions]);
  const investorMap = useMemo(() => (investors || []).reduce((acc, inv) => ({ ...acc, [inv.id]: inv.username || inv.name }), {}), [investors]);

  // Logic Mapping Detail ke Distribusi
  const detailsByDist = useMemo(() => {
    const map = {};
    (details || []).forEach(d => {
      // Handle jika 'distribution' dikirim sebagai Object atau ID
      const distId = typeof d.distribution === 'object' ? d.distribution?.id : d.distribution;
      
      if (distId) {
        if (!map[distId]) map[distId] = [];
        map[distId].push(d);
      }
    });
    
    // Fallback jika API details kosong, cek nested
    if ((details || []).length === 0) {
      (distributions || []).forEach(dist => {
        if (dist.details && dist.details.length > 0) {
          map[dist.id] = dist.details;
        }
      });
    }
    return map;
  }, [details, distributions]);

  const filteredDistributions = useMemo(() => {
    if (!assetFilter) return distributions;
    const prodIds = (productions || []).filter(p => p.asset === assetFilter).map(p => p.id);
    return (distributions || []).filter(d => prodIds.includes(d.production));
  }, [distributions, productions, assetFilter]);

  // Statistik (Original)
  const totalDistribution = useMemo(() => {
    return (filteredDistributions || []).reduce((sum, d) => sum + Number(d.investor_share || 0), 0);
  }, [filteredDistributions]);

  const totalInvestorUnique = useMemo(() => {
    const ids = new Set();
    filteredDistributions.forEach(dist => {
      const distDetails = detailsByDist[dist.id] || [];
      distDetails.forEach(dd => {
        const invId = typeof dd.investor === 'object' ? dd.investor?.id : dd.investor;
        if(invId) ids.add(invId);
      });
    });
    return ids.size > 0 ? ids.size : (investors || []).length || 0;
  }, [filteredDistributions, detailsByDist, investors]);

  const latestDistributions = useMemo(() => {
    return (filteredDistributions || [])
      .slice()
      .sort((a, b) => moment(b.created_at).unix() - moment(a.created_at).unix())
      .slice(0, 6)
      .map(d => ({
        ...d,
        periodText: getPeriodText(d),
        investorCount: (detailsByDist[d.id] || []).length,
        investorAmount: Number(d.investor_share || 0),
        landownerAmount: Number(d.landowner_share || 0),
        netProfit: Number(d.net_profit || 0),
        productionInfo: productionMap[d.production],
      }));
  }, [filteredDistributions, detailsByDist, productionMap]);

  const selectedDistribution = useMemo(() => {
    if (selectedPeriod === 'all') return null;
    return filteredDistributions.find(d => d.id === selectedPeriod);
  }, [filteredDistributions, selectedPeriod]);

  // Logic Tampilkan Nama Investor Asli
  const detailInvestorData = useMemo(() => {
    if (selectedPeriod === 'all') {
      const allDetails = [];
      filteredDistributions.forEach(dist => {
        const distDetails = detailsByDist[dist.id] || [];
        distDetails.forEach((d, idx) => {
          let invName = d.investor_name;
          if (!invName) {
             const invId = typeof d.investor === 'object' ? d.investor?.id : d.investor;
             invName = investorMap[invId] || `Investor #${invId}`;
          }

          allDetails.push({
            key: `${dist.id}-${d.id || idx}`,
            investor: invName,
            persentase: Number(d.ownership_percentage || 0),
            jumlah: Number(d.amount_received || 0),
            status: dist.status || 'Pending',
            periode: getPeriodText(dist),
          });
        });
      });
      return allDetails;
    }
    if (!selectedPeriod) return [];
    
    return (detailsByDist[selectedPeriod] || []).map((d, idx) => {
      let invName = d.investor_name;
      if (!invName) {
         const invId = typeof d.investor === 'object' ? d.investor?.id : d.investor;
         invName = investorMap[invId] || `Investor #${invId}`;
      }

      return {
        key: d.id || idx,
        investor: invName,
        persentase: Number(d.ownership_percentage || 0),
        jumlah: Number(d.amount_received || 0),
        status: selectedDistribution?.status || 'Pending',
      };
    });
  }, [selectedPeriod, detailsByDist, selectedDistribution, filteredDistributions, investorMap]);

  const getStatusTag = (status) => (
    status === 'Distributed' ? <Tag color="green">Completed</Tag> : <Tag color="orange">Pending</Tag>
  );

  const tabStyle = `
    .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn { color: #7CB305 !important; }
    .ant-tabs-ink-bar { background: #7CB305 !important; }
    .ant-tabs-tab:hover .ant-tabs-tab-btn { color: #7CB305 !important; }
  `;

  if (isLoading) return <Spin size="large" tip="Memuat data..." style={{ width: '100%', padding: 80 }} />;
  if (isError) return <Alert message="Gagal memuat data" type="error" showIcon />;

  return (
    <div style={{ padding: 24 }}>
      <style>{tabStyle}</style>

      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontWeight: 700, fontSize: '30px', color: '#111928', marginBottom: '8px' }}>
          {titleText}
        </Title>
        <Text type="secondary">{subText}</Text>
      </div>

      {/* FILTER */}
      <div style={{ marginBottom: 24, maxWidth: 300 }}>
        <Title level={5} style={{ fontWeight: 500, fontSize: '20px', color: '#111928', marginBottom: '8px' }}>
          Filter Asset
        </Title>
        <Select
          placeholder="Pilih Asset"
          allowClear
          style={{ width: '100%' }}
          value={assetFilter}
          onChange={setAssetFilter}
        >
          {assets.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
        </Select>
      </div>

      {/* STATISTICS (2 Card Original) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card
            bordered
            style={{
              width: '100%', minHeight: 118, borderRadius: 12, border: '1px solid #F0F0F0',
              background: '#FFFFFF', boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DollarCircleFilled style={{ color: '#7CB305', fontSize: 30 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: '#6B7280', marginBottom: 4 }}>Total Distribusi</div>
                <div style={{ fontWeight: 700, fontSize: 30, color: '#111928', wordBreak: 'break-word' }}>
                  {formatRupiah(totalDistribution)}
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card
            bordered
            style={{
              width: '100%', minHeight: 118, borderRadius: 12, border: '1px solid #F0F0F0',
              background: '#FFFFFF', boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HiUserGroup style={{ color: '#1E3A8A', fontSize: 30 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: '#6B7280', marginBottom: 4 }}>Total Investor</div>
                <div style={{ fontWeight: 700, fontSize: 30, color: '#111928' }}>{totalInvestorUnique}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider style={{ marginTop: 18, marginBottom: 18 }} />

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* TAB 1: RINGKASAN */}
        <TabPane tab="Ringkasan" key="ringkasan">
          <Title level={4} style={{ marginBottom: 16 }}>Distribusi Terbaru</Title>
          {latestDistributions.length === 0 ? <Empty description="Belum ada data" /> : (
            <List
              dataSource={latestDistributions}
              renderItem={item => (
                <List.Item style={{ border: '1px solid #F0F0F0', borderRadius: 8, marginBottom: 12, padding: 16 }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>{item.periodText}</Text>
                      <div style={{ color: '#6B7280', marginTop: 4 }}>
                        <Space direction="vertical" size={0}>
                          <Text style={{ fontSize: 13 }}>Omzet: <span style={{ color: '#111928', fontWeight: 500 }}>{formatRupiah(item.netProfit)}</span></Text>
                          <Text style={{ fontSize: 13, color: '#DC2626' }}>Landowner: - {formatRupiah(item.landownerAmount)}</Text>
                        </Space>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#7CB305', fontSize: 20 }}>{formatRupiah(item.investorAmount)}</div>
                      <div style={{ marginTop: 4 }}>{getStatusTag(item.status)}</div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </TabPane>

        {/* TAB 2: PERIODE DISTRIBUSI (Table) */}
        <TabPane tab="Periode Distribusi" key="periode">
          <Table
            dataSource={(filteredDistributions || [])
                .slice()
                .sort((a, b) => moment(b.created_at).unix() - moment(a.created_at).unix())
                .map((d, idx) => ({
                  key: d.id || idx,
                  id: d.id,
                  periode: getPeriodText(d),
                  labaBersih: Number(d.net_profit || 0),
                  landownerShare: Number(d.landowner_share || 0),
                  investorShare: Number(d.investor_share || 0),
                  status: d.status || 'Pending',
                }))}
            columns={[
              { title: 'Periode', dataIndex: 'periode', key: 'periode', render: (t) => <b>{t}</b> },
              { title: 'Laba Bersih', dataIndex: 'labaBersih', key: 'labaBersih', render: (v) => formatRupiah(v) },
              { 
                title: 'Jatah Landowner', 
                dataIndex: 'landownerShare', 
                key: 'landownerShare', 
                render: (v) => {
                    const isZero = v === 0;
                    return (
                        <Tooltip title={isZero ? "Milik Sendiri" : "Potongan Sewa"}>
                            <span style={{ color: isZero ? '#9CA3AF' : '#DC2626' }}>{formatRupiah(v)}</span>
                        </Tooltip>
                    )
                }
              },
              { title: 'Total Distribusi', dataIndex: 'investorShare', key: 'investorShare', render: (v) => <b style={{ color: '#059669' }}>{formatRupiah(v)}</b> },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              {
                title: 'Aksi', key: 'aksi', render: (_, record) => (
                  <Space>
                    {canEdit && record.status !== 'Distributed' && (
                      <Popconfirm title="Tandai Selesai?" onConfirm={() => handleMarkAsDistributed(record.id)} okText="Ya" cancelText="Batal">
                        <Button type="text" icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
                      </Popconfirm>
                    )}
                    {canEdit && (
                      <Popconfirm title="Hapus Data?" onConfirm={() => handleDelete(record.id)} okText="Hapus" cancelText="Batal" okButtonProps={{ danger: true }}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    )}
                  </Space>
                )
              }
            ]}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 800 }}
          />
        </TabPane>

        {/* TAB 3: DETAIL INVESTOR */}
        <TabPane tab="Detail Investor" key="detail">
          <Row justify="space-between" style={{ marginBottom: 16 }}>
            <Col><Title level={4}>Detail Distribusi</Title></Col>
            <Col>
              <Select placeholder="Pilih Periode" style={{ width: 200 }} value={selectedPeriod} onChange={setSelectedPeriod}>
                <Option value="all">Semua Periode</Option>
                {filteredDistributions.map(d => (
                  <Option key={d.id} value={d.id}>{getPeriodText(d)}</Option>
                ))}
              </Select>
            </Col>
          </Row>
          
          <Table
            dataSource={detailInvestorData}
            locale={{ emptyText: <Empty description="Belum ada data detail investor" /> }}
            columns={[
              { 
                title: 'Investor', 
                dataIndex: 'investor', 
                key: 'investor',
                render: (text) => (
                  <Space>
                    <UserOutlined style={{ color: '#1890ff' }} /> 
                    <span style={{ fontWeight: 600 }}>{text}</span>
                  </Space>
                )
              },
              ...(selectedPeriod === 'all' ? [{ title: 'Periode', dataIndex: 'periode', key: 'periode' }] : []),
              { 
                title: 'Persentase', 
                dataIndex: 'persentase', 
                key: 'persentase',
                render: (v) => (
                  <Space>
                    <PieChartOutlined style={{ color: '#faad14' }} />
                    {v.toFixed(2)}%
                  </Space>
                )
              },
              { 
                title: 'Jumlah', 
                dataIndex: 'jumlah', 
                key: 'jumlah', 
                render: (v) => <span style={{ color: '#389e0d', fontWeight: 'bold' }}>{formatRupiah(v)}</span> 
              },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
            ]}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 800 }}
          />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default function ProfitDistributionPage() {
  return (
    <ProtectedRoute>
      <ProfitDistributionContent />
    </ProtectedRoute>
  );
}