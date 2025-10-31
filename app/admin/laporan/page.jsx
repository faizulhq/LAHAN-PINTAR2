'use client';

// --- IMPORTS ---
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment'; // Dikembalikan

// Icons
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
// === ICON DIKEMBALIKAN SESUAI PERMINTAAN ===
import { GiMoneyStack, GiPayMoney, GiReceiveMoney } from 'react-icons/gi';
import { FaMoneyBills, FaMoneyBillTransfer } from 'react-icons/fa6';
// ==========================================

// UI Libraries
import { Card } from 'antd';
// Impor Recharts (DIPERTAHANKAN)
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Internal Components & API
import ProtectedRoute from '@/components/ProtectedRoute';
import * as reportingAPI from '@/lib/api/reporting';
import { getAssets } from '@/lib/api/asset';
import { getProjects } from '@/lib/api/project';

// --- HELPERS ---

/**
 * Memformat angka menjadi string mata uang Rupiah.
 */
const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    : '-';

/**
 * Custom Tooltip untuk Recharts (format Rupiah)
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-300 shadow-lg rounded-md p-3 text-sm">
        <p className="font-bold text-gray-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {formatRupiah(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Custom Tooltip untuk Pie Chart
 */
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white border border-gray-300 shadow-lg rounded-md p-3 text-sm">
        <p className="font-bold" style={{ color: data.color }}>
          {data.name}: {formatRupiah(data.value)} ({data.payload.percent}%)
        </p>
      </div>
    );
  }
  return null;
};

// --- UI COMPONENTS ---

/**
 * Kartu untuk menampilkan rincian dana proyek dengan progress bar.
 * (Ini adalah komponen RincianDanaProyek DENGAN RECHARTS)
 */
const RincianDanaProyek = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 shadow-md rounded-lg p-6 w-full h-full">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 shadow-md rounded-lg p-6 w-full h-full">
        <h2 className="text-[22px] font-bold text-gray-900 mb-4">
          Rincian Dana Berdasarkan Proyek
        </h2>
        <p className="text-gray-500 text-center py-8">Tidak ada data proyek</p>
      </div>
    );
  }

  const projectData = data[0];
  const {
    project_name,
    anggaran,
    total_dana_masuk,
    total_pengeluaran,
    sisa_dana,
  } = projectData;

  // Data untuk chart pendanaan
  const fundingData = [
    {
      name: 'Pendanaan',
      'Dana Masuk': total_dana_masuk,
      'Sisa Anggaran': Math.max(0, anggaran - total_dana_masuk),
    },
  ];

  // Data untuk chart pengeluaran
  const expenseData = [
    {
      name: 'Pengeluaran',
      Pengeluaran: total_pengeluaran,
      'Sisa Dana': sisa_dana,
    },
  ];

  const fundingPercent =
    anggaran > 0 ? ((total_dana_masuk / anggaran) * 100).toFixed(0) : 0;
  const expensePercent =
    total_dana_masuk > 0
      ? ((total_pengeluaran / total_dana_masuk) * 100).toFixed(0)
      : 0;
  // Perhitungan sisa dana persen yang benar
  const sisaDanaPercent =
    total_dana_masuk > 0
      ? ((sisa_dana / total_dana_masuk) * 100).toFixed(0)
      : 0;

  return (
    <div className="bg-white border border-gray-200 shadow-md rounded-lg p-6 w-full h-full">
      <h2 className="text-[22px] font-bold text-gray-900 mb-4">
        Rincian Dana Berdasarkan Proyek
      </h2>

      <div className="flex flex-col gap-1 mb-5">
        <h3 className="text-[16px] font-medium text-gray-900">
          {project_name}
        </h3>
        <p className="text-[16px] text-gray-600">
          Anggaran: {formatRupiah(anggaran)}
        </p>
        <p className="text-[16px] text-gray-600">
          Total Dana Masuk: {formatRupiah(total_dana_masuk)}
        </p>
      </div>

      {/* Chart Pendanaan */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1 text-sm font-semibold">
          <span className="text-green-700">Dana Masuk: {fundingPercent}%</span>
          <span className="text-gray-500">
            Sisa Anggaran: {100 - fundingPercent}%
          </span>
        </div>
        <ResponsiveContainer width="100%" height={40}>
          <BarChart layout="vertical" data={fundingData} stackOffset="expand">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Dana Masuk" stackId="a" fill="#22c55e" radius={[4, 0, 0, 4]} />
            <Bar
              dataKey="Sisa Anggaran"
              stackId="a"
              fill="#e5e7eb"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-sm mt-1">
          <p className="text-gray-700">
            Total Dana Masuk:{' '}
            <span className="font-semibold text-green-700">
              {formatRupiah(total_dana_masuk)}
            </span>
          </p>
          <p className="text-gray-700">
            Anggaran:{' '}
            <span className="font-semibold text-gray-900">
              {formatRupiah(anggaran)}
            </span>
          </p>
        </div>
      </div>

      {/* Chart Pengeluaran */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1 text-sm font-semibold">
          <span className="text-blue-700">Pengeluaran: {expensePercent}%</span>
          <span className="text-purple-700">
            Sisa Dana: {sisaDanaPercent}%
          </span>
        </div>
        <ResponsiveContainer width="100%" height={40}>
          <BarChart layout="vertical" data={expenseData} stackOffset="expand">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Pengeluaran" stackId="b" fill="#3b82f6" radius={[4, 0, 0, 4]} />
            <Bar dataKey="Sisa Dana" stackId="b" fill="#c4b5fd" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-sm mt-1">
          <p className="text-gray-700">
            Pengeluaran:{' '}
            <span className="font-semibold text-blue-700">
              {formatRupiah(total_pengeluaran)}
            </span>
          </p>
          <p className="text-gray-700">
            Sisa:{' '}
            <span className="font-semibold text-purple-700">
              {formatRupiah(sisa_dana)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Komponen statistik sederhana dengan ikon.
 */
const Statistic = ({
  title,
  value,
  icon: Icon,
  iconColor,
  valueStyle = {},
  suffix,
}) => (
  <div className="flex items-start gap-6" style={{ alignItems: 'center' }}>
    {Icon && (
      <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center">
        <Icon size={34} style={{ color: iconColor }} />
      </div>
    )}
    <div className="flex-1">
      <div className="text-gray-600 text-lg font-semibold mb-2">{title}</div>
      <div
        className="text-3xl font-bold text-gray-900 flex items-center gap-3"
        style={valueStyle}
      >
        {value}
        {suffix}
      </div>
    </div>
  </div>
);

/**
 * Komponen tabel kustom sederhana.
 */
const Table = ({ columns, dataSource, rowKey, isLoading }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((col, idx) => (
            <th
              key={idx}
              className="px-4 py-3.5 text-left text-sm font-medium text-gray-900 border-b"
            >
              {col.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {isLoading && (
          <tr>
            <td colSpan={columns.length} className="text-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            </td>
          </tr>
        )}
        {!isLoading && (!dataSource || dataSource.length === 0) && (
          <tr>
            <td colSpan={columns.length} className="text-center p-8 text-gray-500">
              Tidak ada data
            </td>
          </tr>
        )}
        {!isLoading &&
          dataSource?.map((row, idx) => (
            <tr
              key={row[rowKey] || idx}
              className="border-b hover:bg-gray-50 transition-colors"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className="px-4 py-3 text-xs text-gray-700"
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.render
                    ? col.render(row[col.dataIndex], row)
                    : row[col.dataIndex]}
                </td>
              ))}
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

/**
 * Komponen Tag (label) kustom.
 */
const Tag = ({ children, color = 'default' }) => {
  const colorMap = {
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    default: 'bg-gray-100 text-gray-700 border-gray-300',
  };
  return (
    <span
      className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${
        colorMap[color] || colorMap.default
      }`}
    >
      {children}
    </span>
  );
};

/**
 * Komponen Bar Chart sederhana (manual).
 */
// --- GANTI KOMPONEN LAMA DENGAN RECHARTS ---
const SimpleBarChart = ({
  data,
  dataKey,
  xKey,
  height = 300,
  colors = [
    '#2B72FB',
    '#64BDC6',
    '#EECA34',
    '#FE6A35',
    '#FA4B42',
    '#EE60E0',
  ],
  isLoading,
}) => {
  if (isLoading)
    return (
      <div className="text-center py-8" style={{ height: `${height}px` }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  if (!data || data.length === 0)
    return (
      <div
        className="text-gray-500 text-center py-8"
        style={{ height: `${height}px` }}
      >
        Tidak ada data
      </div>
    );

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey}
            angle={-45}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 10 }}
          />
          <YAxis tickFormatter={formatRupiah} tick={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={dataKey} name="Jumlah">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Komponen Grouped Bar Chart (manual).
 */
// --- GANTI KOMPONEN LAMA DENGAN RECHARTS ---
const GroupedBarChart = ({ data, height = 300, isLoading }) => {
  if (isLoading)
    return (
      <div className="text-center py-8" style={{ height: `${height}px` }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  if (!data || data.length === 0)
    return (
      <div
        className="text-gray-500 text-center py-8"
        style={{ height: `${height}px` }}
      >
        Tidak ada data
      </div>
    );

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatRupiah} tick={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar
            dataKey="income"
            name="Pendapatan"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expense"
            name="Pengeluaran"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Komponen Donut Chart kustom (manual SVG).
 */
// --- GANTI KOMPONEN LAMA DENGAN RECHARTS ---
const DonutChart = ({
  data,
  colors = ['#1C64F2', '#9061F9'],
  isLoading,
}) => {
  if (isLoading)
    return (
      <div className="text-center py-8" style={{ height: '300px' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  if (!data || data.length === 0)
    return (
      <div
        className="text-gray-500 text-center py-8"
        style={{ height: '300px' }}
      >
        Tidak ada data
      </div>
    );

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  if (total === 0)
    return (
      <div
        className="text-gray-500 text-center py-8"
        style={{ height: '300px' }}
      >
        Tidak ada data
      </div>
    );

  const chartData = data.map((item) => ({
    ...item,
    percent: total > 0 ? ((item.value / total) * 100).toFixed(0) : 0,
  }));

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }) => {
     // Hanya tampilkan label jika persentase cukup besar
    if (percent < 10) return null;
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-semibold text-sm"
      >
        {`${percent}%`}
      </text>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        width: '100%',
        height: '300px',
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={5}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          width: '100%',
          marginTop: '-40px', // Tarik legend ke atas
        }}
      >
        {chartData.map((item, idx) => (
          <div
            key={`legend-${idx}`}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                background: colors[idx % colors.length],
                borderRadius: '50%',
              }}
            ></div>
            <span
              style={{
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '12px',
                color: '#6B7280',
              }}
            >
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
// --- BATAS KOMPONEN BARU ---


/**
 * Komponen Paginasi sederhana.
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded-md ${
            currentPage === page
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// --- MAIN CONTENT COMPONENT ---

function ReportingContent() {
  // --- STATE UNTUK FILTER ---
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- BUAT OBJEK PARAMETER FILTER ---
  const filterParams = useMemo(
    () => ({
      asset: selectedAsset === 'all' ? undefined : selectedAsset,
      project: selectedProject === 'all' ? undefined : selectedProject,
      period: selectedPeriod === 'all' ? undefined : selectedPeriod,
    }),
    [selectedAsset, selectedProject, selectedPeriod]
  );

  // --- FETCH DATA DROPDOWN FILTER ---
  const { data: assetOptionsData, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assetsForFilter'],
    queryFn: getAssets,
  });
  const { data: projectOptionsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projectsForFilter'],
    queryFn: getProjects,
  });

  // Periode statis
  const periodOptions = [
    { value: 'all', label: 'Semua Periode' },
    { value: '2025', label: 'Tahun 2025' },
    { value: '2025-Q4', label: 'Kuartal 4 2025' },
    { value: '2025-Q3', label: 'Kuartal 3 2025' },
    { value: '2025-12', label: 'Desember 2025' },
    { value: '2025-11', label: 'November 2025' },
    { value: '2025-10', label: 'Oktober 2025' },
  ];

  // --- FETCH DATA LAPORAN ---
  const {
    data: reportData,
    isLoading: isLoadingReport,
    isError: isErrorReport,
  } = useQuery({
    queryKey: ['financialReport', filterParams],
    queryFn: () => reportingAPI.getFinancialReport(filterParams),
  });
  // Ambil data rincian proyek dari API
  const { data: rincianProyek, isLoading: isLoadingRincianProyek } = useQuery({
    queryKey: ['rincianDanaProyek', filterParams],
    queryFn: () => reportingAPI.getRincianDanaPerProyek(filterParams),
  });
  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['expenseByCategory', filterParams],
    queryFn: () => reportingAPI.getExpenseByCategory(filterParams),
  });
  const { data: topExpenses, isLoading: isLoadingTopExpenses } = useQuery({
    queryKey: ['topExpenses', filterParams],
    queryFn: () => reportingAPI.getTopExpenses(filterParams),
  });
  const { data: incomeExpense, isLoading: isLoadingIncomeExpense } = useQuery({
    queryKey: ['incomeVsExpense', filterParams],
    queryFn: () => reportingAPI.getIncomeVsExpense(filterParams),
  });
  const { data: quarterlyData, isLoading: isLoadingQuarterly } = useQuery({
    queryKey: ['quarterlyReport', filterParams],
    queryFn: () => reportingAPI.getQuarterlyReport(filterParams),
  });
  const { data: yieldData, isLoading: isLoadingYield } = useQuery({
    queryKey: ['yieldReport', filterParams],
    queryFn: () => reportingAPI.getYieldReport(filterParams),
  });
  const { data: investorYield, isLoading: isLoadingInvestorYield } = useQuery({
    queryKey: ['investorYield', filterParams],
    queryFn: () => reportingAPI.getInvestorYield(filterParams),
  });
  // Data ini sepertinya tidak terpakai di implementasi yg sudah diperbaiki,
  // namun tetap di-fetch jika diperlukan di masa depan.
  const { data: fundingProgress, isLoading: isLoadingFunding } = useQuery({
    queryKey: ['fundingProgress', filterParams],
    queryFn: () => reportingAPI.getFundingProgress(filterParams),
  });

  const isLoading = isLoadingReport || isLoadingAssets || isLoadingProjects;

  // --- Variabel Data Olahan ---
  const ringkasanDana = reportData?.ringkasan_dana || {};
  const labaRugi = reportData?.laba_rugi || {};
  const totalYield = reportData?.total_yield || 0;

  const labaRugiStatus = labaRugi?.Status;
  const LabaRugiIcon =
    labaRugiStatus === 'Laba'
      ? ArrowUpRight
      : labaRugiStatus === 'Rugi'
      ? ArrowDownRight
      : TrendingUp;
  const labaRugiColor =
    labaRugiStatus === 'Laba'
      ? '#7CB305'
      : labaRugiStatus === 'Rugi'
      ? '#CF1322'
      : '#8c8c8c';
  const labaRugiTagColor =
    labaRugiStatus === 'Laba'
      ? 'success'
      : labaRugiStatus === 'Rugi'
      ? 'error'
      : 'default';

  // Data untuk Donut Chart - URUTAN: Total Pengeluaran (Biru), Cash on Hand (Ungu)
  const donutChartData = [
    { name: 'Total Pengeluaran', value: ringkasanDana.total_pengeluaran || 0 },
    { name: 'Cash on Hand', value: ringkasanDana.sisa_dana || 0 },
  ];

  // Data untuk Simple Bar Chart Kategori
  const categoryChartData = useMemo(
    () =>
      categoryData?.map((item) => ({
        category: item.category || 'Lainnya',
        amount: item.total,
      })) || [],
    [categoryData]
  );

  // Data untuk Grouped Bar Chart Income vs Expense
  const incomeExpenseChartData = useMemo(() =>
    (incomeExpense || []).map((item) => ({
      name: item.month || item.name,
      income: item.income,
      expense: item.expense,
    })), [incomeExpense]);

  // Mendapatkan nama proyek terpilih untuk judul kartu
  const getProjectName = () => {
    if (selectedProject === 'all') return 'Ringkasan Semua Proyek';
    if (isLoadingProjects || !projectOptionsData) return 'Memuat Nama Proyek...';
    return (
      projectOptionsData.find((p) => p.id.toString() === selectedProject)
        ?.name || 'Proyek Terpilih'
    );
  };

  // Pagination logic Investor Yield
  const totalInvestorPages = Math.ceil(
    (investorYield?.length || 0) / itemsPerPage
  );
  const paginatedInvestorYield =
    investorYield?.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ) || [];

  // Definisi Kolom Tabel
  const expenseColumns = [
    {
      title: 'Tanggal',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('DD/MM/YYYY'), // Menggunakan moment
    },
    { title: 'Kategori', dataIndex: 'category', key: 'category' },
    { title: 'Deskripsi', dataIndex: 'description', key: 'description' },
    {
      title: 'Aset/Proyek',
      dataIndex: 'asset',
      key: 'asset',
      render: (text, record) => text || record.project || '-',
    },
    {
      title: 'Jumlah',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => formatRupiah(val),
      align: 'right',
    },
  ];
  const quarterlyColumns = [
    { title: 'Kuartal', dataIndex: 'quarter', key: 'quarter' },
    {
      title: 'Pendanaan',
      dataIndex: 'funding',
      key: 'funding',
      render: (val) => formatRupiah(val),
      align: 'right',
    },
    {
      title: 'Pengeluaran',
      dataIndex: 'expense',
      key: 'expense',
      render: (val) => formatRupiah(val),
      align: 'right',
    },
    {
      title: 'Yield',
      dataIndex: 'yield',
      key: 'yield',
      render: (val) => formatRupiah(val),
      align: 'right',
    },
    {
      title: 'Laba Bersih',
      dataIndex: 'net_profit',
      key: 'net_profit',
      render: (val) => formatRupiah(val),
      align: 'right',
      className: 'font-semibold',
    },
  ];
  const investorColumns = [
    { title: 'Investor', dataIndex: 'investor', key: 'investor' },
    {
      title: 'Total Pendanaan',
      dataIndex: 'total_funding',
      key: 'total_funding',
      render: (val) => formatRupiah(val),
      align: 'right',
    },
    {
      title: 'Total Yield',
      dataIndex: 'total_yield',
      key: 'total_yield',
      render: (val) => formatRupiah(val),
      align: 'right',
    },
    {
      title: 'Yield (%)',
      dataIndex: 'yield_percent',
      key: 'yield_percent',
      render: (val) => `${val}%`,
      align: 'right',
      className: 'font-semibold text-blue-600',
    },
  ];

  // Handler reset filter
  const resetFilters = () => {
    setSelectedAsset('all');
    setSelectedProject('all');
    setSelectedPeriod('all');
    setCurrentPage(1);
  };

  // --- RENDER JSX ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Laporan Keuangan</h1>
        <p className="text-gray-600 text-base mt-1.5">
          Analisis komprehensif kinerja keuangan dan operasional
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-6">
          {/* Filter Aset */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Aset
            </label>
            <div className="relative">
              <select
                value={selectedAsset}
                onChange={(e) => {
                  setSelectedAsset(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={isLoadingAssets}
                className="appearance-none block w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer disabled:bg-gray-100"
              >
                <option value="all">Semua Aset</option>
                {Array.isArray(assetOptionsData) &&
                  assetOptionsData.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {/* Filter Proyek */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Proyek
            </label>
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={isLoadingProjects}
                className="appearance-none block w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer disabled:bg-gray-100"
              >
                <option value="all">Semua Proyek</option>
                {Array.isArray(projectOptionsData) &&
                  projectOptionsData.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {/* Filter Periode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Periode
            </label>
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none block w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer"
              >
                {periodOptions.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {/* Reset Button */}
          {(selectedAsset !== 'all' ||
            selectedProject !== 'all' ||
            selectedPeriod !== 'all') && (
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-md transition-colors"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-6 space-y-8">
        {(isLoading || isLoadingReport) && ( // Tampilkan loading
          <div className="text-center p-10">Memuat data laporan...</div>
        )}
        {!isLoading && isErrorReport && ( // Tampilkan error
          <div className="text-center p-10 text-red-600">
            Gagal memuat laporan
          </div>
        )}

        {!isLoading && !isErrorReport && reportData && ( // Tampilkan konten jika data sukses dimuat
          <>
            {/* Ringkasan Dana */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                Ringkasan Dana
              </h2>
              {isLoadingReport ? (
                <div className="text-center p-8">Loading...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <Card>
                      <Statistic
                        title="Total Dana Masuk"
                        value={formatRupiah(ringkasanDana.total_dana_masuk)}
                        icon={GiReceiveMoney} // === DIKEMBALIKAN ===
                        iconColor="#7CB305"
                      />
                    </Card>
                    <Card>
                      <Statistic
                        title="Total Pengeluaran"
                        value={formatRupiah(ringkasanDana.total_pengeluaran)}
                        icon={GiPayMoney} // === DIKEMBALIKAN ===
                        iconColor="#1C64F2"
                      />
                    </Card>
                  </div>
                  <Card>
                    <Statistic
                      title="Cash on Hand"
                      value={formatRupiah(ringkasanDana.sisa_dana)}
                      icon={GiMoneyStack} // === DIKEMBALIKAN ===
                      iconColor="#9061F9"
                    />
                  </Card>
                </>
              )}
            </section>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card title="Persentase Penggunaan Dana">
                  <DonutChart
                    data={donutChartData}
                    colors={['#1C64F2', '#9061F9']}
                    isLoading={isLoadingReport}
                  />
                </Card>
              </div>

              <div className="lg:col-span-2">
                {/* Komponen Rincian Dana Proyek yang baru */}
                <RincianDanaProyek
                  data={rincianProyek}
                  isLoading={isLoadingRincianProyek}
                />
              </div>
            </div>

            {/* Pengeluaran Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                Pengeluaran
              </h2>
              
              {/* === CARD PENGELUARAN BARU (SESUAI GAMBAR) === */}
              {/* Card ini mengambil style dari CSS Anda: p-4 (16px), gap-7 (28px), h-118px, max-w-453px */}
              <Card
                className="mb-6 rounded-xl border border-gray-100 w-full max-w-[453px]"
                bodyStyle={{ padding: '16px', height: '118px', boxSizing: 'border-box' }}
                loading={isLoadingReport} // Tambahkan loading state
              >
                {/* CSS: display: flex, flex-direction: row, align-items: center, gap: 28px
                  Tailwind: flex flex-row items-center gap-7 (Tailwind 7 = 1.75rem = 28px) 
                */}
                <div className="flex flex-row items-center gap-7 h-full">
                  {/* Ikon */}
                  <div className="shrink-0 w-[34px] h-[34px] flex items-center justify-center">
                    <GiPayMoney size={34} style={{ color: '#1C64F2' }} /> {/* Ikon Biru */}
                  </div>
                  {/* Konten Value */}
                  <div className="flex-1 flex flex-col justify-center">
                    <div 
                      className="font-bold text-[31px] text-[#CF1322] leading-[1.25]" // 31px, bold, Teks Merah
                      style={{ fontFamily: 'Inter, sans-serif' }} // Sesuai CSS
                    >
                      {formatRupiah(ringkasanDana.total_pengeluaran)}
                    </div>
                  </div>
                </div>
              </Card>
              {/* ============================================== */}

              <div className="grid mt-5 grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Pengeluaran Per Kategori">
                  {/* Komponen SimpleBarChart yang baru */}
                  <SimpleBarChart
                    data={categoryChartData}
                    dataKey="amount"
                    xKey="category"
                    height={300}
                    isLoading={isLoadingCategory}
                  />
                </Card>
                <Card title="Top 5 Pengeluaran Terbesar">
                  <Table
                    dataSource={topExpenses}
                    columns={expenseColumns}
                    rowKey="id"
                    isLoading={isLoadingTopExpenses}
                  />
                </Card>
              </div>
            </section>

            {/* Laba Rugi Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                Laba Rugi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                  <Statistic
                    title="Total Pendapatan"
                    value={formatRupiah(totalYield)}
                    icon={TrendingUp}
                    iconColor="#7CB305"
                  />
                </Card>
                <Card>
                  <Statistic
                    title="Total Pengeluaran"
                    value={formatRupiah(ringkasanDana.total_pengeluaran)}
                    icon={TrendingDown}
                    iconColor="#F5222D"
                    valueStyle={{ color: '#F5222D' }}
                  />
                </Card>
                <Card>
                  <Statistic
                    title="Net Profit"
                    value={formatRupiah(yieldData?.hasil_bersih)}
                    icon={LabaRugiIcon}
                    iconColor={labaRugiColor}
                    valueStyle={{ color: labaRugiColor }}
                    suffix={<Tag color={labaRugiTagColor}>{labaRugiStatus}</Tag>}
                  />
                </Card>
                <Card>
                  <Statistic
                    title="Margin Laba (%)"
                    value={`${yieldData?.margin_laba || 0}%`}
                    icon={PieChartIcon}
                    iconColor="#1C64F2"
                  />
                </Card>
              </div>
              <Card title="Pendapatan vs Pengeluaran">
                {/* Komponen GroupedBarChart yang baru */}
                <GroupedBarChart
                  data={incomeExpenseChartData}
                  height={300}
                  isLoading={isLoadingIncomeExpense}
                />
              </Card>
            </section>

            {/* Ringkasan Per Kuartal */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                Ringkasan Keuangan Per Kuartal
              </h2>
              <Card>
                <Table
                  dataSource={quarterlyData}
                  columns={quarterlyColumns}
                  rowKey="quarter"
                  isLoading={isLoadingQuarterly}
                />
              </Card>
            </section>

            {/* Yield Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-5">Yield</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <Statistic
                    title="Total Investasi"
                    value={formatRupiah(yieldData?.total_investasi)}
                    icon={FaMoneyBillTransfer} // === DIKEMBALIKAN ===
                    iconColor="#7CB305"
                  />
                </Card>
                <Card>
                  <Statistic
                    title="Total Hasil Produksi"
                    value={formatRupiah(yieldData?.total_hasil_produksi)}
                    icon={FaMoneyBills} // === DIKEMBALIKAN ===
                    iconColor="#1C64F2"
                  />
                </Card>
                <Card>
                  <Statistic
                    title="Hasil Bersih"
                    value={formatRupiah(yieldData?.hasil_bersih)}
                    icon={DollarSign}
                    iconColor="#9061F9"
                  />
                </Card>
              </div>
              <Card title="Investor Yield %">
                <Table
                  dataSource={paginatedInvestorYield}
                  columns={investorColumns}
                  rowKey="investor"
                  isLoading={isLoadingInvestorYield}
                />
                {totalInvestorPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalInvestorPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// --- PAGE EXPORT ---

export default function LaporanPage() {
  return (
    <ProtectedRoute>
      <ReportingContent />
    </ProtectedRoute>
  );
}