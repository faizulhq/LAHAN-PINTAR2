'use client';

// --- IMPORTS ---
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';

// Icons
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight, 
  ChevronDown,
} from 'lucide-react';
import { GiMoneyStack, GiPayMoney, GiReceiveMoney } from 'react-icons/gi';
import { FaArrowTrendUp, FaMoneyBills, FaMoneyBillTransfer } from 'react-icons/fa6';
import { RiBillLine } from 'react-icons/ri';
import { AiFillDollarCircle } from 'react-icons/ai';

// UI Libraries
import { Card, Carousel, Typography } from 'antd'; 
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Internal Components & API
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore'; 
import * as reportingAPI from '@/lib/api/reporting';
import { getAssets } from '@/lib/api/asset';
import { getProjects } from '@/lib/api/project';

// --- HELPERS ---
const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    : '-';

const formatJuta = (value) => {
  if (value === 0) return '0';
  if (!value) return '-';
  return `${Number(value) / 1000000} Jt`;
};

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

const CustomPrevArrow = ({ onClick }) => (
  <button
    className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/80 rounded-full shadow-lg hover:bg-white transition-opacity duration-300 opacity-0 group-hover:opacity-100"
    onClick={onClick}
    aria-label="Previous slide"
  >
    <ChevronLeft className="w-5 h-5 text-gray-800" />
  </button>
);

const CustomNextArrow = ({ onClick }) => (
  <button
    className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/80 rounded-full shadow-lg hover:bg-white transition-opacity duration-300 opacity-0 group-hover:opacity-100"
    onClick={onClick}
    aria-label="Next slide"
  >
    <ChevronRight className="w-5 h-5 text-gray-800" />
  </button>
);

// === KOMPONEN RINCIAN DANA PROYEK - DENGAN INDIKATOR POOL ===
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

  return (
    <div className="group relative bg-white border border-gray-200 shadow-md rounded-lg p-6 w-full h-full">
      <h2 className="text-[22px] font-bold text-gray-900 mb-4">
        Rincian Dana Berdasarkan Proyek
      </h2>

      <Carousel
        arrows={true}
        infinite={false}
        dotPosition="bottom"
        prevArrow={<CustomPrevArrow />}
        nextArrow={<CustomNextArrow />}
      >
        {data.map((projectData) => {
          const {
            project_id,
            project_name,
            anggaran,
            total_dana_masuk,
            total_pengeluaran,
          } = projectData;

          // === LOGIC UNTUK INDIKATOR POOL ===
          // Hitung penggunaan Dana Pool
          // Jika Pengeluaran > Dana Masuk, selisihnya diambil dari Pool
          const poolUsage = Math.max(0, total_pengeluaran - total_dana_masuk);
          const isUsingPool = poolUsage > 0;

          // Kita hitung Sisa Budget untuk chart kedua, agar valid meski pakai Dana Pool
          const sisaBudget = Math.max(0, anggaran - total_pengeluaran);

          const fundingData = [
            {
              name: 'Pendanaan',
              'Dana Masuk': total_dana_masuk,
              'Sisa Anggaran': Math.max(0, anggaran - total_dana_masuk),
            },
          ];

          const expenseData = [
            {
              name: 'Realisasi',
              'Pengeluaran': total_pengeluaran,
              'Sisa Budget': sisaBudget,
            },
          ];

          const fundingPercent =
            anggaran > 0 ? ((total_dana_masuk / anggaran) * 100).toFixed(0) : 0;
          
          const expensePercent =
            anggaran > 0
              ? ((total_pengeluaran / anggaran) * 100).toFixed(0)
              : 0;
          
          const sisaBudgetPercent =
            anggaran > 0
              ? ((sisaBudget / anggaran) * 100).toFixed(0)
              : 0;

          return (
            <div key={project_id}>
              <div className="flex flex-col gap-1">
                {/* === HEADER DENGAN INDIKATOR POOL === */}
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-[16px] font-medium text-gray-900">
                    {project_name}
                  </h3>
                  {/* INDIKATOR: MUNCUL JIKA PAKAI DANA POOL */}
                  {isUsingPool && (
                    <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-orange-200">
                      Subsidi Pool: {formatRupiah(poolUsage)}
                    </span>
                  )}
                </div>
                
                <p className="text-[16px] text-gray-600">
                  Anggaran: {formatRupiah(anggaran)}
                </p>
                <p className="text-[16px] text-gray-600">
                  Total Dana Masuk: {formatRupiah(total_dana_masuk)}
                </p>
              </div>

              {/* Chart 1: Pendanaan (Green) */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1 text-sm font-semibold">
                  <span className="text-green-700 bg-[#E3FEE1] rounded-md pt-1 pb-1 pl-2.5 pr-2.5">
                    {fundingPercent}% Terpenuhi
                  </span>
                  <span className="text-gray-500 bg-[#E5E7EB] rounded-md pt-1 pb-1 pl-2.5 pr-2.5">
                    {Math.max(0, 100 - fundingPercent)}%
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={40}>
                  <BarChart
                    layout="vertical"
                    data={fundingData}
                    stackOffset="expand"
                  >
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="Dana Masuk"
                      stackId="a"
                      fill="#22c55e"
                      radius={[4, 0, 0, 4]}
                    />
                    <Bar
                      dataKey="Sisa Anggaran"
                      stackId="a"
                      fill="#e5e7eb"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-sm mt-1">
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

              {/* Chart 2: Pengeluaran (Blue/Purple) */}
              <div className="mb-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-blue-700 bg-[#E1EFFE] rounded-md pt-1 pb-1 pl-2.5 pr-2.5">
                    {expensePercent}% Terpakai
                  </span>
                  <span className="text-purple-700 bg-[#E5E7EB] rounded-md pt-1 pb-1 pl-2.5 pr-2.5">
                    {sisaBudgetPercent}% Sisa Budget
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={40}>
                  <BarChart
                    layout="vertical"
                    data={expenseData}
                    stackOffset="expand"
                  >
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="Pengeluaran"
                      stackId="b"
                      fill="#3b82f6"
                      radius={[4, 0, 0, 4]}
                    />
                    <Bar
                      dataKey="Sisa Budget"
                      stackId="b"
                      fill="#c4b5fd"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-sm mt-1">
                  <p className="text-gray-700">
                    Pengeluaran:{' '}
                    <span className="font-semibold text-blue-700">
                      {formatRupiah(total_pengeluaran)}
                    </span>
                  </p>
                  <p className="text-gray-700">
                    Sisa Budget:{' '}
                    <span className="font-semibold text-purple-700">
                      {formatRupiah(sisaBudget)}
                    </span>
                  </p>
                </div>
              </div>

              {/* === FOOTER MESSAGE DINAMIS === */}
              <div className="mt-4 p-2 bg-gray-50 rounded border border-gray-100 text-[11px] text-gray-500 text-center italic">
                {isUsingPool 
                  ? "⚠️ Proyek ini menggunakan sebagian Dana Umum."
                  : "✅ Proyek ini sepenuhnya didanai oleh sumber dana terikat."
                }
              </div>
            </div>
          );
        })}
      </Carousel>
    </div>
  );
};

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
      <div className="text-gray-600 text-lg font-semibold">{title}</div>
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

const Table = ({ columns, dataSource, rowKey, isLoading }) => (
  <div className="overflow-x-auto">
    <div className="w-full min-w-full" style={{ borderCollapse: 'collapse' }}>
      <div className="bg-gray-50 flex">
        {columns.map((col, idx) => (
          <div
            key={idx}
            className="px-4 py-3.5 text-sm font-medium text-gray-900"
            style={{
              flex: col.width || 1,
              minWidth: col.width || 120,
              textAlign: col.align || 'left',
            }}
          >
            {col.title}
          </div>
        ))}
      </div>
      <div>
        {isLoading && (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        )}
        {!isLoading && (!dataSource || dataSource.length === 0) && (
          <div className="text-center p-8 text-gray-500">Tidak ada data</div>
        )}
        {!isLoading &&
          dataSource?.map((row, idx) => (
            <div
              key={row[rowKey] || idx}
              className="flex border-b hover:bg-gray-50 transition-colors"
            >
              {columns.map((col, colIdx) => (
                <div
                  key={colIdx}
                  className="px-4 py-3 text-sm text-gray-700"
                  style={{
                    flex: col.width || 1,
                    minWidth: col.width || 120,
                    textAlign: col.align || 'left',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {col.render
                    ? col.render(row[col.dataIndex], row)
                    : row[col.dataIndex]}
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  </div>
);

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
      <div className=" text-center py-8" style={{ height: `${height}px` }}>
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
        <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatJuta}
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
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

  const formatXAxis = (tickItem) => {
    return moment(tickItem, 'YYYY-MM').format('MMM');
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={formatXAxis}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatJuta}
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="income"
            name="Pendapatan"
            fill="#2B72FB"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expense"
            name="Pengeluaran"
            fill="#CF1322"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

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
    if (percent < 0.1) return null;

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
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

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          width: '100%',
          marginTop: '-40px',
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

function ReportingContent() {
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const isOperator = userRole === 'Operator';

  const filterParams = useMemo(
    () => ({
      asset: selectedAsset === 'all' ? undefined : selectedAsset,
      project: selectedProject === 'all' ? undefined : selectedProject,
      period: selectedPeriod === 'all' ? undefined : selectedPeriod,
    }),
    [selectedAsset, selectedProject, selectedPeriod]
  );

  const { data: assetOptionsData, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assetsForFilter'],
    queryFn: getAssets,
  });
  const { data: projectOptionsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projectsForFilter'],
    queryFn: getProjects,
  });

  const periodOptions = [
    { value: 'all', label: 'Semua Periode' },
    { value: '2025', label: 'Tahun 2025' },
    { value: '2025-Q4', label: 'Kuartal 4 2025' },
    { value: '2025-Q3', label: 'Kuartal 3 2025' },
    { value: '2025-12', label: 'Desember 2025' },
    { value: '2025-11', label: 'November 2025' },
    { value: '2025-10', label: 'Oktober 2025' },
  ];

  const {
    data: reportData,
    isLoading: isLoadingReport,
    isError: isErrorReport,
  } = useQuery({
    queryKey: ['financialReport', filterParams],
    queryFn: () => reportingAPI.getFinancialReport(filterParams),
  });
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
  const { data: fundingProgress, isLoading: isLoadingFunding } = useQuery({
    queryKey: ['fundingProgress', filterParams],
    queryFn: () => reportingAPI.getFundingProgress(filterParams),
  });

  const isLoading = isLoadingReport || isLoadingAssets || isLoadingProjects;

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

  const donutChartData = [
    { name: 'Total Pengeluaran', value: ringkasanDana.total_pengeluaran || 0 },
    { name: 'Cash on Hand', value: ringkasanDana.sisa_dana || 0 },
  ];

  const categoryChartData = useMemo(
    () =>
      categoryData?.map((item) => ({
        category: item.category || 'Lainnya',
        amount: item.total,
      })) || [],
    [categoryData]
  );

  const incomeExpenseChartData = useMemo(
    () =>
      (incomeExpense || []).map((item) => ({
        name: item.month || item.name,
        income: item.income,
        expense: item.expense,
      })),
    [incomeExpense]
  );

  const getProjectName = () => {
    if (selectedProject === 'all') return 'Ringkasan Semua Proyek';
    if (isLoadingProjects || !projectOptionsData)
      return 'Memuat Nama Proyek...';
    return (
      projectOptionsData.find((p) => p.id.toString() === selectedProject)
        ?.name || 'Proyek Terpilih'
    );
  };

  const totalInvestorPages = Math.ceil(
    (investorYield?.length || 0) / itemsPerPage
  );
  const paginatedInvestorYield =
    investorYield?.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ) || [];

  const expenseColumns = [
    { title: 'Kategori', dataIndex: 'category', key: 'category' },
    {
      title: 'Jumlah',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => formatRupiah(val),
      align: 'right',
    },
    { title: 'Deskripsi', dataIndex: 'description', key: 'description' },
    {
      title: 'Bukti Url',
      dataIndex: 'proof_url',
      key: 'proof_url',
      render: (url) =>
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {url.length > 30 ? `${url.substring(0, 30)}...` : url}
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: 'Tanggal',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Proyek',
      dataIndex: 'project',
      key: 'project',
      render: (text, record) => text || record.project || '-',
    },
  ];

  const monthlySummaryColumns = [
    { title: 'Bulan', dataIndex: 'name', key: 'name' },
    {
      title: 'Pendapatan',
      dataIndex: 'income',
      key: 'income',
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
      title: 'Laba Bersih',
      dataIndex: 'income',
      key: 'net_profit',
      render: (income, record) => formatRupiah(income - record.expense),
      align: 'right',
      className: 'font-semibold',
    },
    {
      title: 'Margin (%)',
      dataIndex: 'income',
      key: 'margin',
      render: (income, record) => {
        const net = income - record.expense;
        const margin = income > 0 ? (net / income) * 100 : 0;
        return `${margin.toFixed(1)}%`;
      },
      align: 'right',
    },
  ];

  const investorColumns = [
    { title: 'Investor', dataIndex: 'investor', key: 'investor' },
    {
      title: 'Total Investasi',
      dataIndex: 'total_funding',
      key: 'total_funding',
      render: (val) => formatRupiah(val),
      align: 'right',
    },
    {
      title: 'Total Bagi Hasil',
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
    {
      title: 'Unit Kepemilikan',
      dataIndex: 'units',
      key: 'units',
      render: (val, record) =>
        `${record.units || 0} unit (${record.percentage || 0}%)`,
      align: 'right',
    },
    {
      title: 'Periode',
      dataIndex: 'period',
      key: 'period',
      align: 'right',
    },
  ];

  const resetFilters = () => {
    setSelectedAsset('all');
    setSelectedProject('all');
    setSelectedPeriod('all');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-8">
        <h1 className="text-3xl font-bold text-gray-900">Laporan Keuangan</h1>
        <p className="text-gray-600 text-base mt-1.5">
          Analisis komprehensif kinerja keuangan dan operasional
        </p>

        <div className="flex flex-wrap gap-4 mt-6">
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

      <div className="px-8 py-6 space-y-8">
        {(isLoading || isLoadingReport) && (
          <div className="text-center p-10">Memuat data laporan...</div>
        )}
        {!isLoading && isErrorReport && (
          <div className="text-center p-10 text-red-600">
            Gagal memuat laporan
          </div>
        )}

        {!isLoading && !isErrorReport && reportData && (
          <>
            {!isOperator && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                Ringkasan Dana
              </h2>
              {isLoadingReport ? (
                <div className="text-center p-8">Loading...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <Card styles={{ body: { padding: '24px' } }} className="border-gray-200 shadow-md rounded-lg">
                      <Statistic
                        title="Total Dana Masuk"
                        value={formatRupiah(ringkasanDana.total_dana_masuk)}
                        icon={GiReceiveMoney}
                        iconColor="#7CB305"
                      />
                    </Card>
                    <Card styles={{ body: { padding: '24px' } }} className="border-gray-200 shadow-md rounded-lg">
                      <Statistic
                        title="Total Pengeluaran"
                        value={formatRupiah(ringkasanDana.total_pengeluaran)}
                        icon={GiPayMoney}
                        iconColor="#1C64F2"
                      />
                    </Card>
                  </div>
                  <Card styles={{ body: { padding: '24px' } }} className="border-gray-200 shadow-md rounded-lg">
                    <Statistic
                      title="Cash on Hand"
                      value={formatRupiah(ringkasanDana.sisa_dana)}
                      icon={GiMoneyStack}
                      iconColor="#9061F9"
                    />
                  </Card>
                </>
              )}
            </section>
            )}

            {!isOperator && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card className="h-full border-gray-200 shadow-md rounded-lg">
                  <h2 className="text-[22px]">Persentase Penggunaan Dana</h2>
                  <DonutChart
                    data={donutChartData}
                    colors={['#1C64F2', '#9061F9']}
                    isLoading={isLoadingReport}
                  />
                </Card>
              </div>

              <div className="lg:col-span-2">
                <RincianDanaProyek
                  data={rincianProyek}
                  isLoading={isLoadingRincianProyek}
                />
              </div>
            </div>
            )}

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                Pengeluaran
              </h2>

              <Card
                className="mb-6 border-gray-200 shadow-md rounded-lg w-full max-w-[453px]"
                styles={{
                  body: {
                    padding: '16px',
                    height: '118px',
                    boxSizing: 'border-box',
                  }
                }}
                loading={isLoadingReport}
              >
                <div className="flex flex-row items-center gap-7 h-full">
                  <div className="shrink-0 w-[34px] h-[34px] flex items-center justify-center">
                    <GiPayMoney size={34} style={{ color: '#1C64F2' }} />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div
                      className="font-bold text-[31px] text-[#CF1322] leading-tight"
                    >
                      {formatRupiah(ringkasanDana.total_pengeluaran)}
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid mt-5 grid-cols-1 lg:grid-rows-2 gap-6">
                <div className="bg-gray-50 rounded-lg">
                  <Card className="h-full border-gray-200 shadow-md rounded-lg">
                    <h2 className="text-[22px] pt-0 text-black-700 mb-8">
                      Pengeluaran Per Kategori
                    </h2>
                    <SimpleBarChart
                      data={categoryChartData}
                      dataKey="amount"
                      xKey="category"
                      height={300}
                      isLoading={isLoadingCategory}
                    />
                  </Card>
                </div>
                <div className="bg-gray-50 rounded-lg">
                  <Card className="h-full border-gray-200 shadow-md rounded-lg">
                    <h2 className="text-[22px] mb-5">
                      Top 5 Pengeluaran Terbesar
                    </h2>
                    <Table
                      dataSource={topExpenses}
                      columns={expenseColumns}
                      rowKey="id"
                      isLoading={isLoadingTopExpenses}
                    />
                  </Card>
                </div>
              </div>
            </section>

            {!isOperator && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                Laba Rugi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-rows-2 gap-6 mb-6">
                <Card styles={{ body: { padding: '24px' } }} className="border-gray-200 shadow-md rounded-lg">
                  <Statistic
                    title="Total Pendapatan"
                    value={formatRupiah(totalYield)}
                    icon={AiFillDollarCircle}
                    iconColor="#7CB305"
                  />
                </Card>
                <Card styles={{ body: { padding: '24px' } }} className="border-gray-200 shadow-md rounded-lg">
                  <Statistic
                    title="Total Pengeluaran"
                    value={formatRupiah(ringkasanDana.total_pengeluaran)}
                    icon={GiPayMoney}
                    iconColor="#F5222D"
                    valueStyle={{ color: '#F5222D' }}
                  />
                </Card>
                <Card styles={{ body: { padding: '24px' } }} className="border-gray-200 shadow-md rounded-lg">
                  <Statistic
                    title="Net Profit"
                    value={formatRupiah(yieldData?.hasil_bersih)}
                    icon={FaArrowTrendUp}
                    iconColor="#1C64F2"
                    valueStyle={{ color: '#111928' }}
                  />
                </Card>
                <Card styles={{ body: { padding: '24px' } }} className="border-gray-200 shadow-md rounded-lg">
                  <Statistic
                    title="Margin Laba (%)"
                    value={`${yieldData?.margin_laba || 0}%`}
                    icon={RiBillLine}
                    iconColor="#9061F9"
                  />
                </Card>
              </div>

              <div className="bg-gray-50 rounded-lg">
                <Card className="border-gray-200 shadow-md rounded-lg">
                  <h2 className="text-[22px] mb-5">
                    Pendapatan vs Pengeluaran (Bulanan)
                  </h2>
                  <GroupedBarChart
                    data={incomeExpenseChartData}
                    height={300}
                    isLoading={isLoadingIncomeExpense}
                  />
                </Card>
              </div>
            </section>
            )}

            {!isOperator && (
            <section>
              <div className="bg-gray-50 rounded-lg">
                <Card className="border-gray-200 shadow-md rounded-lg">
                  <h2 className="text-2xl font-bold text-gray-900 mb-5">
                    Ringkasan Keuangan Bulanan
                  </h2>
                  <Table
                    dataSource={incomeExpenseChartData}
                    columns={monthlySummaryColumns}
                    rowKey="name"
                    isLoading={isLoadingIncomeExpense}
                  />
                </Card>
              </div>
            </section>
            )}

            {!isOperator && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-5">Yield</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <Card styles={{ body: { padding: '24px' } }} className="border-gray-200 shadow-md rounded-lg">
                    <Statistic
                      title="Total Investasi Investor"
                      value={formatRupiah(yieldData?.total_investasi)}
                      icon={FaMoneyBillTransfer}
                      iconColor="#7CB305"
                    />
                  </Card>
                </div>
                <Card styles={{ body: { padding: '24px' } }} className="border-gray-200 shadow-md rounded-lg">
                  <Statistic
                    title="Total Bagi Hasil Investor"
                    value={formatRupiah(yieldData?.total_hasil_produksi)}
                    icon={GiPayMoney}
                    iconColor="#1C64F2"
                  />
                </Card>
                <Card styles={{ body: { padding: '24px' } }} className="border-gray-200 shadow-md rounded-lg">
                  <Statistic
                    title="Yield (%)"
                    value={formatRupiah(yieldData?.hasil_bersih)}
                    icon={FaMoneyBills}
                    iconColor="#9061F9"
                  />
                </Card>
              </div>
              <div className="bg-gray-50 rounded-lg">
                <Card className="border-gray-200 shadow-md rounded-lg">
                  <h2 className="text-2xl font-bold text-gray-900 mb-5">
                    Investor Yield%
                  </h2>
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
              </div>
            </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function LaporanPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Operator', 'Viewer']}>
      <ReportingContent />
    </ProtectedRoute>
  );
}