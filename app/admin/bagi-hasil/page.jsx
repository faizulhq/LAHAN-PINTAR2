// app/admin/bagi-hasil/page.jsx
'use client';
import React, { useMemo, useState } from 'react';
import {
  Row, Col, Card, Select, Tabs, List, Avatar, Typography, Divider, Tag, Spin, Alert, Empty, Table
} from 'antd';
import { DollarCircleFilled } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  getProfitDistributions,
} from '@/lib/api/profit_distribution';
import { getDistributionDetails } from '@/lib/api/distribution_detail';
import { getProductions } from '@/lib/api/production';
import { getAssets } from '@/lib/api/asset';
import { getInvestors } from '@/lib/api/investor';
import { HiUserGroup } from 'react-icons/hi';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : 'Rp 0';

const formatShortDate = (dateString) =>
  dateString ? moment(dateString).format('MMMM YYYY') : '-';

const formatFullDate = (dateString) =>
  dateString ? moment(dateString).format('DD MMM YYYY, HH:mm') : '-';

// Get period from distribution (prefer period field, fallback to created_at)
const getPeriodText = (distribution) => {
  if (distribution.period) {
    // Jika period sudah dalam format "Oktober 2024", pakai langsung
    if (distribution.period.match(/[A-Za-z]+\s+\d{4}/)) {
      return distribution.period;
    }
    // Jika period dalam format date, convert ke nama bulan
    return formatShortDate(distribution.period);
  }
  return formatShortDate(distribution.created_at);
};

// ============================================
// MAIN COMPONENT
// ============================================
function ProfitDistributionContent() {
  const [assetFilter, setAssetFilter] = useState(null);
  const [activeTab, setActiveTab] = useState('ringkasan');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // ============================================
  // DATA FETCHING
  // ============================================
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

  const isLoading = loadingDist || loadingDetails || loadingProductions || loadingAssets || loadingInvestors;
  const isError = errorDist;

  // ============================================
  // DATA PROCESSING
  // ============================================
  const assetMap = useMemo(() =>
    (assets || []).reduce((acc, a) => {
      acc[a.id] = a.name;
      return acc;
    }, {}),
    [assets]
  );

  const productionMap = useMemo(() =>
    (productions || []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {}),
    [productions]
  );

  const investorMap = useMemo(() =>
    (investors || []).reduce((acc, inv) => {
      acc[inv.id] = inv.name;
      return acc;
    }, {}),
    [investors]
  );

  const detailsByDist = useMemo(() => {
    const map = {};
    (details || []).forEach(d => {
      const distId = d.distribution;
      if (!map[distId]) map[distId] = [];
      map[distId].push(d);
    });
    return map;
  }, [details]);

  const filteredDistributions = useMemo(() => {
    if (!assetFilter) return distributions;
    const prodIds = (productions || [])
      .filter(p => p.asset === assetFilter)
      .map(p => p.id);
    return (distributions || []).filter(d => prodIds.includes(d.production));
  }, [distributions, productions, assetFilter]);

  const totalDistribution = useMemo(() => {
    return (filteredDistributions || []).reduce((sum, d) =>
      sum + Number(d.net_profit || 0), 0
    );
  }, [filteredDistributions]);

  const totalInvestorUnique = useMemo(() => {
    const ids = new Set();
    (filteredDistributions || []).forEach(dist => {
      const det = detailsByDist[dist.id] || [];
      det.forEach(dd => ids.add(dd.investor));
    });
    if (ids.size > 0) return ids.size;
    return (investors || []).length || 0;
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
        productionInfo: productionMap[d.production],
      }));
  }, [filteredDistributions, detailsByDist, productionMap]);

  // Get detail for selected period
  const selectedDistribution = useMemo(() => {
    if (selectedPeriod === 'all') return null;
    return filteredDistributions.find(d => d.id === selectedPeriod);
  }, [filteredDistributions, selectedPeriod]);

  // Detail investor data with 'all' option
  const detailInvestorData = useMemo(() => {
    if (selectedPeriod === 'all') {
      // Gabungkan semua detail dari semua distribusi
      const allDetails = [];
      filteredDistributions.forEach(dist => {
        const distDetails = detailsByDist[dist.id] || [];
        distDetails.forEach(d => {
          allDetails.push({
            key: `${dist.id}-${d.id}`,
            investor: d.investor_name || investorMap[d.investor] || `Investor ${d.investor}`,
            persentase: Number(d.ownership_percentage || 0),
            jumlah: Number(d.amount_received || 0),
            status: dist.created_at,
            periode: getPeriodText(dist),
          });
        });
      });
      return allDetails;
    }
    // Single period
    if (!selectedPeriod) return [];
    return (detailsByDist[selectedPeriod] || []).map((d, idx) => ({
      key: d.id || idx,
      investor: d.investor_name || investorMap[d.investor] || `Investor ${d.investor}`,
      persentase: Number(d.ownership_percentage || 0),
      jumlah: Number(d.amount_received || 0),
      status: selectedDistribution?.created_at,
    }));
  }, [selectedPeriod, detailsByDist, selectedDistribution, filteredDistributions, investorMap]);

  // ============================================
  // STATUS TAG FUNCTION
  // ============================================
  const getStatusTag = (createdAt) => {
    if (!createdAt) {
      return <span style={{ color: '#727272', fontWeight: 500 }}>pending</span>;
    }
    const days = moment().diff(moment(createdAt), 'days');
    return days > 7
      ? <Tag color="green">Completed</Tag>
      : <span style={{ color: '#727272', fontWeight: 500 }}>pending</span>;
  };

  // ============================================
  // STYLE FOR GREEN TAB
  // ============================================
  const tabStyle = `
    .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
      color: #7CB305 !important;
    }
    .ant-tabs-ink-bar {
      background: #7CB305 !important;
    }
    .ant-tabs-tab:hover .ant-tabs-tab-btn {
      color: #7CB305 !important;
    }
  `;

  // ============================================
  // LOADING & ERROR STATES
  // ============================================
  if (isLoading) {
    return <Spin size="large" tip="Memuat data..." style={{ width: '100%', padding: 80 }} />;
  }

  if (isError) {
    return <Alert message="Gagal memuat data" type="error" showIcon />;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div style={{ padding: 24 }}>
      <style>{tabStyle}</style>

      {/* HEADER SECTION */}
      <div style={{ marginBottom: 24 }}>
        <Typography.Title
          level={2}
          style={{
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: '30px',
            lineHeight: '125%',
            letterSpacing: '0%',
            color: '#111928',
            marginBottom: '8px'
          }}
        >
          Bagi Hasil
        </Typography.Title>
        <Text type="secondary">
          Kelola dan pantau distribusi keuntungan kepada investor
        </Text>
      </div>

      {/* FILTER ASSET */}
      <div style={{ marginBottom: 24, maxWidth: 300 }}>
        <Typography.Title
          level={5}
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: '16px',
            color: '#111928',
            marginBottom: '8px'
          }}
        >
          Filter Asset
        </Typography.Title>
        <Select
          placeholder="Pilih Asset"
          allowClear
          style={{ width: '100%' }}
          value={assetFilter}
          onChange={(val) => setAssetFilter(val)}
        >
          {assets && assets.map(a => (
            <Option key={a.id} value={a.id}>{a.name}</Option>
          ))}
        </Select>
      </div>

      {/* STATISTICS CARDS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {/* CARD: TOTAL DISTRIBUSI */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card
            bordered
            style={{
              width: '100%',
              minHeight: 118,
              borderRadius: 12,
              border: '1px solid #F0F0F0',
              background: '#FFFFFF',
              boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
            }}
            styles={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <DollarCircleFilled style={{ color: '#7CB305', fontSize: 28 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: 16,
                    lineHeight: '150%',
                    color: '#6B7280',
                    marginBottom: 4,
                  }}
                >
                  Total Distribusi
                </div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 700,
                    fontSize: 24,
                    lineHeight: '125%',
                    color: '#111928',
                    wordBreak: 'break-word',
                  }}
                >
                  {formatRupiah(totalDistribution)}
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* CARD: TOTAL INVESTOR */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card
            bordered
            style={{
              width: '100%',
              minHeight: 118,
              borderRadius: 12,
              border: '1px solid #F0F0F0',
              background: '#FFFFFF',
              boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: '#EEF2FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <HiUserGroup style={{ color: '#1E3A8A', fontSize: 28 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: 16,
                    lineHeight: '150%',
                    color: '#6B7280',
                    marginBottom: 4,
                  }}
                >
                  Total Investor
                </div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 700,
                    fontSize: 24,
                    lineHeight: '125%',
                    color: '#111928',
                  }}
                >
                  {totalInvestorUnique}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider style={{ marginTop: 18, marginBottom: 18 }} />

      {/* TABS */}
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
        <TabPane tab="Ringkasan" key="ringkasan" />
        <TabPane tab="Periode Distribusi" key="periode" />
        <TabPane tab="Detail Investor" key="detail" />
      </Tabs>

      {/* TAB CONTENT */}
      <Card bodyStyle={{ padding: 24 }}>
        {/* TAB: RINGKASAN */}
        {activeTab === 'ringkasan' && (
          <div>
            <Typography.Title
              level={4}
              style={{
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: '22px',
                color: '#111928',
                marginBottom: '16px'
              }}
            >
              Distribusi Terbaru
            </Typography.Title>
            {latestDistributions.length === 0 ? (
              <Empty description="Belum ada distribusi" />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={latestDistributions}
                renderItem={item => (
                  <List.Item
                    style={{
                      border: '1px solid #F0F0F0',
                      background: '#FFFFFF',
                      boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
                      borderRadius: 8,
                      marginBottom: 12,
                      padding: 16,
                      alignItems: 'center',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <Text strong>{item.periodText}</Text>
                      <div style={{ color: '#6B7280', marginTop: 6 }}>
                        {(item.investorCount || 0)} Investor
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#7CB305', fontSize: 22 }}>
                        {formatRupiah(item.investorAmount)}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        {getStatusTag(item.created_at)}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </div>
        )}

        {/* TAB: PERIODE DISTRIBUSI */}
        {activeTab === 'periode' && (
          <div>
            <Typography.Title
              level={4}
              style={{
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: '22px',
                color: '#111928',
                marginBottom: '16px'
              }}
            >
              Semua Periode Distribusi
            </Typography.Title>
            <Table
              dataSource={(filteredDistributions || [])
                .slice()
                .sort((a, b) => moment(b.created_at).unix() - moment(a.created_at).unix())
                .map((d, idx) => ({
                  key: d.id || idx,
                  periode: getPeriodText(d),
                  labaBersih: Number(d.net_profit || 0),
                  totalDistribusi: Number(d.investor_share || 0),
                  investor: (detailsByDist[d.id] || []).length,
                  status: d.created_at,
                }))}
              columns={[
                {
                  title: 'Periode',
                  dataIndex: 'periode',
                  key: 'periode',
                  render: (text) => <span style={{ fontWeight: 600, color: '#111928' }}>{text}</span>
                },
                {
                  title: 'Laba Bersih',
                  dataIndex: 'labaBersih',
                  key: 'labaBersih',
                  render: (value) => <span style={{ color: '#111928' }}>{formatRupiah(value)}</span>
                },
                {
                  title: 'Total Distribusi',
                  dataIndex: 'totalDistribusi',
                  key: 'totalDistribusi',
                  render: (value) => <span style={{ color: '#111928' }}>{formatRupiah(value)}</span>
                },
                {
                  title: 'Investor',
                  dataIndex: 'investor',
                  key: 'investor',
                  render: (value) => <span style={{ color: '#111928' }}>{value}</span>
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (createdAt) => getStatusTag(createdAt)
                },
              ]}
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
                position: ['bottomLeft'],
              }}
              bordered={false}
              style={{
                background: '#FFFFFF',
              }}
              scroll={{ x: 800 }}
            />
          </div>
        )}

        {/* TAB: DETAIL INVESTOR */}
        {activeTab === 'detail' && (
          <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }} gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Typography.Title
                  level={4}
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 700,
                    fontSize: '22px',
                    color: '#111928',
                    margin: 0
                  }}
                >
                  Detail Distribusi
                </Typography.Title>
              </Col>
              {/* SELECT PERIODE */}
              <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                <Select
                  placeholder="Pilih Periode"
                  style={{ width: '100%', maxWidth: 250 }}
                  value={selectedPeriod}
                  onChange={(val) => setSelectedPeriod(val)}
                >
                  <Option key="all" value="all">Semua Periode</Option>
                  {(filteredDistributions || [])
                    .slice()
                    .sort((a, b) => moment(b.created_at).unix() - moment(a.created_at).unix())
                    .map(d => (
                      <Option key={d.id} value={d.id}>
                        {getPeriodText(d)}
                      </Option>
                    ))}
                </Select>
              </Col>
            </Row>

            {/* TABLE DETAIL INVESTOR */}
            <Table
              dataSource={detailInvestorData}
              columns={[
                {
                  title: 'Investor',
                  dataIndex: 'investor',
                  key: 'investor',
                  render: (text) => <span style={{ fontWeight: 600, color: '#111928' }}>{text}</span>
                },
                ...(selectedPeriod === 'all' ? [{
                  title: 'Periode',
                  dataIndex: 'periode',
                  key: 'periode',
                  render: (text) => <span style={{ color: '#111928' }}>{text}</span>
                }] : []),
                {
                  title: 'Persentase Kepemilikan',
                  dataIndex: 'persentase',
                  key: 'persentase',
                  render: (value) => <span style={{ color: '#111928' }}>{value.toFixed(0)}%</span>
                },
                {
                  title: 'Jumlah Distribusi',
                  dataIndex: 'jumlah',
                  key: 'jumlah',
                  render: (value) => <span style={{ color: '#111928' }}>{formatRupiah(value)}</span>
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (createdAt) => getStatusTag(createdAt)
                },
              ]}
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
                position: ['bottomLeft'],
              }}
              bordered={false}
              style={{
                background: '#FFFFFF',
              }}
              scroll={{ x: 800 }}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================
// EXPORT WITH PROTECTED ROUTE
// ============================================
export default function ProfitDistributionPage() {
  return (
    <ProtectedRoute>
      <ProfitDistributionContent />
    </ProtectedRoute>
  );
}