'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, Card, InputNumber, Button, Table, Row, Col, 
  Statistic, Alert, DatePicker, message, Space, Popconfirm, Divider, Tag, Flex 
} from 'antd';
import { 
  CalculatorOutlined, SaveOutlined, DeleteOutlined, 
  HistoryOutlined, PieChartOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { 
  getDistributions, createDistribution, deleteDistribution, previewDistribution 
} from '@/lib/api/profit_distribution';

const { Title, Text } = Typography;

const formatRupiah = (val) => val != null ? `Rp ${Number(val).toLocaleString('id-ID', {maximumFractionDigits: 0})}` : 'Rp 0';

// --- KOMPONEN FORM ---
// app/admin/bagi-hasil/page.jsx

const DistributionForm = ({ onSave, isSaving }) => {
  const [amount, setAmount] = useState(null);
  const [date, setDate] = useState(moment());
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (amount && amount > 0) {
        setLoadingPreview(true);
        try {
          const res = await previewDistribution(amount);
          setPreviewData(res);
        } catch (error) {
          console.error("Preview failed", error);
        } finally {
          setLoadingPreview(false);
        }
      } else {
        setPreviewData(null);
      }
    }, 600); 
    return () => clearTimeout(timer);
  }, [amount]);

  const handleSubmit = () => {
    if (!amount || amount <= 0) return message.error("Masukkan nominal valid");
    onSave({ 
      total_distributed: amount, // Key disamakan dengan model backend
      date: date.format('YYYY-MM-DD'),
    });
  };

  const columns = [
    { title: 'Nama Investor', dataIndex: 'name', key: 'name' },
    { title: 'Kepemilikan', dataIndex: 'portion_info', key: 'portion_info', align: 'center' },
    { 
      title: 'Nominal Diterima', 
      dataIndex: 'amount', 
      key: 'amount', 
      align: 'right', 
      render: (val) => <Text strong style={{color: '#237804'}}>{formatRupiah(val)}</Text> 
    },
  ];

  return (
    <Card 
      title={<Space><CalculatorOutlined /> Kalkulator Pembagian Keuntungan</Space>}
      style={{ border: '1px solid #B7EB8F', background: '#F6FFED', borderRadius: 12 }}
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
           <Text strong>Nominal Yang Akan Dibagikan</Text>
           <InputNumber
              style={{ width: '100%', height: 45, fontSize: 18, marginTop: 8 }}
              prefix="Rp"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              value={amount}
              onChange={setAmount}
           />
           
           {previewData && (
             <Card size="small" style={{marginTop: 16, background: '#fff'}}>
                <Statistic 
                  title="Potongan Jatah Landowner" 
                  value={previewData.summary.landowner_total} 
                  prefix="-" 
                  valueStyle={{color: '#cf1322', fontSize: 16}} 
                  formatter={(val) => formatRupiah(val)}
                />
                <Divider style={{margin: '8px 0'}} />
                <Statistic 
                  title="Net Untuk Investor" 
                  value={previewData.summary.investor_net_pool} 
                  valueStyle={{color: '#0958d9', fontSize: 16}} 
                  formatter={(val) => formatRupiah(val)}
                />
             </Card>
           )}
        </Col>
        
        <Col xs={24} md={16}>
           <Table 
              dataSource={previewData?.investor_breakdown || []} 
              columns={columns} 
              rowKey="name"
              pagination={{ pageSize: 5 }}
              loading={loadingPreview}
              size="small"
              bordered
              title={() => <Text strong>Rincian Pembagian Per Investor</Text>}
           />
           <div style={{textAlign: 'right', marginTop: 16}}>
             <Button 
                type="primary" 
                size="large" 
                onClick={handleSubmit} 
                loading={isSaving}
                style={{background: '#237804', borderRadius: 24}}
             >
                Simpan & Distribusikan
             </Button>
           </div>
        </Col>
      </Row>
    </Card>
  );
};

// --- MAIN PAGE ---
function ProfitDistributionContent() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const role = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin', 'Operator'].includes(role);

  const { data: history, isLoading } = useQuery({
    queryKey: ['distributions'],
    queryFn: getDistributions
  });

  const createMutation = useMutation({
    mutationFn: createDistribution,
    onSuccess: () => {
      message.success("Bagi hasil berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['distributions'] });
    },
    onError: (err) => message.error(err.response?.data?.detail || "Gagal menyimpan")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDistribution,
    onSuccess: () => {
      message.success("Data dihapus");
      queryClient.invalidateQueries({ queryKey: ['distributions'] });
    },
    onError: () => message.error("Gagal menghapus")
  });

  const columns = [
    { title: 'Tanggal', dataIndex: 'date', render: (d) => moment(d).format('DD MMM YYYY') },
    { title: 'Total Dana', dataIndex: 'total_distributed', 
      render: (val) => <Text strong style={{color: '#0958D9'}}>{formatRupiah(val)}</Text> 
    },
    { title: 'Dibuat', dataIndex: 'created_at', render: (d) => moment(d).format('DD/MM/YYYY HH:mm') },
    { title: 'Aksi', key: 'action', align: 'center',
      render: (_, record) => canEdit && (
        <Popconfirm title="Hapus riwayat ini?" onConfirm={() => deleteMutation.mutate(record.id)}>
           <Button danger type="text" icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  return (
    <>
      <div style={{marginBottom: 24}}>
        <Title level={2} style={{ margin: 0 }}>Bagi Hasil (Profit Distribution)</Title>
        <Text type="secondary">Bagikan keuntungan usaha kepada investor & landowner secara otomatis.</Text>
      </div>

      {canEdit ? (
         <DistributionForm onSave={createMutation.mutate} isSaving={createMutation.isPending} />
      ) : (
         <Alert message="Anda hanya memiliki akses melihat riwayat." type="info" showIcon style={{marginBottom: 24}} />
      )}

      <Card 
        title={<Space><HistoryOutlined /> Riwayat Pembagian</Space>} 
        style={{borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}
      >
         <Table 
            dataSource={history || []} 
            columns={columns} 
            rowKey="id" 
            loading={isLoading}
            pagination={{ pageSize: 10 }}
         />
      </Card>
    </>
  );
}

export default function ProfitDistributionPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <ProfitDistributionContent />
    </ProtectedRoute>
  );
}