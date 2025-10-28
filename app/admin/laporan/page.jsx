'use client';

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GiMoneyStack, GiPayMoney, GiReceiveMoney } from 'react-icons/gi';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  DollarSign,
  BarChart3,
  PieChart,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import * as reportingAPI from '@/lib/api/reporting';
import { FaMoneyBills, FaMoneyBillTransfer } from 'react-icons/fa6';
import { FaMoneyBill } from 'react-icons/fa';

const formatRupiah = (value) => 
  value != null ? `Rp ${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'Rp 0';

const { data: reportData } = useQuery({
  queryKey: ['financialReport', selectedAsset, selectedProject, selectedPeriod],
  queryFn: () => getFinancialReport({ 
    asset: selectedAsset, 
    project: selectedProject, 
    period: selectedPeriod 
  })
});

// Card Component
const Card = ({ children, title, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-xl text-gray-900">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// Statistic Component
const Statistic = ({ title, value, icon: Icon, iconColor, valueStyle = {}, suffix }) => (
  <div className="flex items-start gap-6">
    {Icon && (
      <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" 
           style={{ backgroundColor: `${iconColor}15` }}>
        <Icon size={22} style={{ color: iconColor }} />
      </div>
    )}
    <div className="flex-1">
      <div className="text-gray-600 text-lg font-semibold mb-2">{title}</div>
      <div className="text-3xl font-bold text-gray-900 flex items-center gap-3" style={valueStyle}>
        {value}
        {suffix}
      </div>
    </div>
  </div>
);

// Table Component
const Table = ({ columns, dataSource, rowKey }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((col, idx) => (
            <th key={idx} className="px-4 py-3.5 text-left text-sm font-medium text-gray-900 border-b">
              {col.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataSource?.map((row, idx) => (
          <tr key={row[rowKey] || idx} className="border-b hover:bg-gray-50 transition-colors">
            {columns.map((col, colIdx) => (
              <td key={colIdx} className="px-4 py-3 text-xs text-gray-700" style={{ textAlign: col.align || 'left' }}>
                {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Progress Bar Component
const ProgressBar = ({ percent, color = '#7CB305' }) => (
  <div className="w-full bg-gray-200 rounded-full h-1.5">
    <div className="h-1.5 rounded-full transition-all" 
         style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}></div>
  </div>
);

// Tag Component
const Tag = ({ children, color = 'default' }) => {
  const colorMap = {
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    default: 'bg-gray-100 text-gray-700 border-gray-300',
  };
  return (
    <span className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${colorMap[color] || colorMap.default}`}>
      {children}
    </span>
  );
};

// Simple Bar Chart
const SimpleBarChart = ({ data, dataKey, xKey, height = 280, colors = ['#2B72FB', '#64BDC6', '#EECA34', '#FE6A35', '#FA4B42', '#EE60E0'] }) => {
  if (!data || data.length === 0) return (
    <div className="text-gray-500 text-center py-8">Tidak ada data</div>
  );
  
  const maxValue = Math.max(...data.map(d => d[dataKey]));
  
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-around h-full gap-3 pb-10">
        {data.map((item, idx) => {
          const barHeight = maxValue > 0 ? (item[dataKey] / maxValue) * 70 : 0;
          const barColor = colors[idx % colors.length];
          return (
            <div key={idx} className="flex flex-col items-center flex-1">
              <div 
                className="w-full rounded-t transition-all hover:opacity-80" 
                style={{ 
                  height: `${barHeight}%`, 
                  backgroundColor: barColor, 
                  minHeight: '30px',
                  maxWidth: '60px'
                }}
              ></div>
              <div className="text-xs text-gray-700 mt-3 text-center font-medium">
                {item[xKey]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Grouped Bar Chart
const GroupedBarChart = ({ data, height = 280 }) => {
  if (!data || data.length === 0) return (
    <div className="text-gray-500 text-center py-8">Tidak ada data</div>
  );
  
  const maxValue = Math.max(...data.flatMap(d => [d.income || 0, d.expense || 0]));
  
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex justify-end gap-4 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="font-medium">Pendapatan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="font-medium">Pengeluaran</span>
        </div>
      </div>
      <div className="flex items-end justify-around h-full gap-4 pb-10">
        {data.map((item, idx) => {
          const incomeHeight = maxValue > 0 ? ((item.income || 0) / maxValue) * 70 : 0;
          const expenseHeight = maxValue > 0 ? ((item.expense || 0) / maxValue) * 70 : 0;
          return (
            <div key={idx} className="flex flex-col items-center flex-1 max-w-[60px]">
              <div className="flex gap-1.5 w-full items-end justify-center">
                <div className="w-6 bg-blue-500 rounded-t" 
                     style={{ height: `${incomeHeight}%`, minHeight: '10px' }}>
                </div>
                <div className="w-6 bg-red-500 rounded-t" 
                     style={{ height: `${expenseHeight}%`, minHeight: '10px' }}>
                </div>
              </div>
              <div className="text-xs text-gray-700 mt-3 font-medium">{item.month}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Donut Chart
const DonutChart = ({ data, colors = ['#3B82F6', '#A855F7'] }) => {
  if (!data || data.length === 0) return (
    <div className="text-gray-500 text-center py-8">Tidak ada data</div>
  );
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const slices = data.map((item, idx) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const angle = total > 0 ? (item.value / total) * 360 : 0;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { 
      ...item, 
      percentage: percentage.toFixed(1), 
      startAngle, 
      angle, 
      color: colors[idx % colors.length] 
    };
  });
  
  return (
    <div className="flex flex-col items-center">
      <svg width="245" height="245" viewBox="0 0 200 200" className="mb-4">
        <circle cx="100" cy="100" r="70" fill="none" stroke="#f0f0f0" strokeWidth="30"/>
        {slices.map((slice, idx) => {
          if (slice.angle === 0) return null;
          const startAngle = slice.startAngle - 90;
          const endAngle = startAngle + slice.angle;
          const x1 = 100 + 70 * Math.cos((startAngle * Math.PI) / 180);
          const y1 = 100 + 70 * Math.sin((startAngle * Math.PI) / 180);
          const x2 = 100 + 70 * Math.cos((endAngle * Math.PI) / 180);
          const y2 = 100 + 70 * Math.sin((endAngle * Math.PI) / 180);
          const largeArc = slice.angle > 180 ? 1 : 0;
          return (
            <path 
              key={idx} 
              d={`M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`} 
              fill={slice.color} 
              opacity="0.9" 
            />
          );
        })}
        <circle cx="100" cy="100" r="45" fill="white"/>
        <text x="100" y="105" textAnchor="middle" className="text-2xl font-bold fill-gray-900">
          100%
        </text>
      </svg>
      <div className="flex gap-4">
        {slices.map((slice, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: slice.color }}></div>
            <span className="text-xs text-gray-700 font-medium">
              {slice.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map(page => (
        <button 
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 flex items-center justify-center border rounded ${
            currentPage === page 
              ? 'border-blue-500 bg-blue-500 text-white' 
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}
      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

function ReportingContent() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [topExpenses, setTopExpenses] = useState([]);
  const [incomeExpense, setIncomeExpense] = useState([]);
  const [quarterlyData, setQuarterlyData] = useState([]);
  const [yieldData, setYieldData] = useState(null);
  const [investorYield, setInvestorYield] = useState([]);
  const [fundingProgress, setFundingProgress] = useState(null);
  
  // Raw data for filtering
  const [rawExpenses, setRawExpenses] = useState([]);
  const [rawProductions, setRawProductions] = useState([]);
  
  // Filter states
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  
  // Options for filters
  const [assetOptions, setAssetOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [periodOptions, setPeriodOptions] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [report, category, top, income, quarterly, yield_, investor, funding] = await Promise.all([
          reportingAPI.getFinancialReport(),
          reportingAPI.getExpenseByCategory(),
          reportingAPI.getTopExpenses(),
          reportingAPI.getIncomeVsExpense(),
          reportingAPI.getQuarterlyReport(),
          reportingAPI.getYieldReport(),
          reportingAPI.getInvestorYield(),
          reportingAPI.getFundingProgress(),
        ]);
        
        setReportData(report);
        setCategoryData(category);
        setTopExpenses(top);
        setRawExpenses(top); // Store raw data
        setIncomeExpense(income);
        setQuarterlyData(quarterly);
        setYieldData(yield_);
        setInvestorYield(investor);
        setFundingProgress(funding);
        
        // Extract unique assets from expenses
        const assets = [...new Set(top.map(exp => exp.asset).filter(Boolean))];
        setAssetOptions(['all', ...assets]);
        
        // Extract unique projects (if available in data)
        const projects = [...new Set(top.map(exp => exp.funding).filter(Boolean))];
        setProjectOptions(['all', ...projects]);
        
        // Generate period options (quarters)
        const periods = ['all', 'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'];
        setPeriodOptions(periods);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Apply filters when filter values change
  useEffect(() => {
    if (!rawExpenses.length) return;
    
    let filtered = [...rawExpenses];
    
    // Filter by asset
    if (selectedAsset !== 'all') {
      filtered = filtered.filter(exp => exp.asset === selectedAsset);
    }
    
    // Filter by project
    if (selectedProject !== 'all') {
      filtered = filtered.filter(exp => exp.funding === selectedProject);
    }
    
    // Filter by period (based on date)
    if (selectedPeriod !== 'all') {
      const periodMap = {
        'Q1 2025': { start: '2025-01-01', end: '2025-03-31' },
        'Q2 2025': { start: '2025-04-01', end: '2025-06-30' },
        'Q3 2025': { start: '2025-07-01', end: '2025-09-30' },
        'Q4 2025': { start: '2025-10-01', end: '2025-12-31' },
      };
      
      const period = periodMap[selectedPeriod];
      if (period) {
        filtered = filtered.filter(exp => {
          const expDate = new Date(exp.date);
          const startDate = new Date(period.start);
          const endDate = new Date(period.end);
          return expDate >= startDate && expDate <= endDate;
        });
      }
    }
    
    // Update filtered data
    setTopExpenses(filtered);
    
    // Recalculate category data from filtered expenses
    const categoryMap = {};
    filtered.forEach(exp => {
      const cat = exp.category || 'Lainnya';
      categoryMap[cat] = (categoryMap[cat] || 0) + parseFloat(exp.amount || 0);
    });
    
    const newCategoryData = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount
    })).sort((a, b) => b.amount - a.amount);
    
    setCategoryData(newCategoryData);
    
    // Recalculate summary
    const totalExpense = filtered.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    if (reportData) {
      setReportData({
        ...reportData,
        ringkasan_dana: {
          ...reportData.ringkasan_dana,
          total_pengeluaran: totalExpense,
          sisa_dana: reportData.ringkasan_dana.total_dana_masuk - totalExpense
        }
      });
    }
    
    // Reset pagination
    setCurrentPage(1);
    
  }, [selectedAsset, selectedProject, selectedPeriod, rawExpenses]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );

  const ringkasanDana = reportData?.ringkasan_dana;
  const labaRugi = reportData?.laba_rugi;
  const labaRugiStatus = labaRugi?.Status;
  const labaRugiColor = labaRugiStatus === 'Laba' ? '#7CB305' : labaRugiStatus === 'Rugi' ? '#CF1322' : '#8c8c8c';
  const labaRugiTagColor = labaRugiStatus === 'Laba' ? 'success' : labaRugiStatus === 'Rugi' ? 'error' : 'default';

  // Pagination logic
  const totalPages = Math.ceil((investorYield?.length || 0) / itemsPerPage);
  const paginatedInvestorYield = investorYield.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const expenseColumns = [
    { 
      title: 'Tanggal', 
      dataIndex: 'date', 
      key: 'date', 
      render: (date) => new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
    },
    { title: 'Kategori', dataIndex: 'category', key: 'category' },
    { title: 'Deskripsi', dataIndex: 'description', key: 'description' },
    { 
      title: 'Aset/Proyek', 
      dataIndex: 'asset', 
      key: 'asset', 
      render: (text, record) => (
        <span className="text-blue-600 font-medium">{text || record.funding || '-'}</span>
      )
    },
    { 
      title: 'Jumlah', 
      dataIndex: 'amount', 
      key: 'amount', 
      render: (val) => <span className="font-semibold">{formatRupiah(val)}</span>, 
      align: 'right' 
    },
  ];

  const quarterlyColumns = [
    { title: 'Kuartal', dataIndex: 'quarter', key: 'quarter' },
    { 
      title: 'Pendanaan', 
      dataIndex: 'funding', 
      key: 'funding', 
      render: (val) => formatRupiah(val),
      align: 'right'
    },
    { 
      title: 'Pengeluaran', 
      dataIndex: 'expense', 
      key: 'expense', 
      render: (val) => formatRupiah(val),
      align: 'right'
    },
    { 
      title: 'Yield', 
      dataIndex: 'yield', 
      key: 'yield', 
      render: (val) => formatRupiah(val),
      align: 'right'
    },
    { 
      title: 'Laba Bersih', 
      dataIndex: 'net_profit', 
      key: 'net_profit', 
      render: (val) => <span className="font-semibold">{formatRupiah(val)}</span>,
      align: 'right'
    },
  ];

  const investorColumns = [
    { title: 'Investor', dataIndex: 'investor', key: 'investor' },
    { 
      title: 'Total Pendanaan', 
      dataIndex: 'total_funding', 
      key: 'total_funding', 
      render: (val) => formatRupiah(val),
      align: 'right'
    },
    { 
      title: 'Total Yield', 
      dataIndex: 'total_yield', 
      key: 'total_yield', 
      render: (val) => formatRupiah(val),
      align: 'right'
    },
    { 
      title: 'Yield (%)', 
      dataIndex: 'yield_percent', 
      key: 'yield_percent', 
      render: (val) => <span className="font-semibold text-blue-600">{val}%</span>,
      align: 'right'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Laporan Keuangan</h1>
        <p className="text-gray-600 text-base mt-1.5">
          Analisis komprehensif kinerja keuangan dan operasional
        </p>
        
        {/* Filters */}
        <div className="flex gap-4 mt-6">
          <div>
            <label className="block text-xl font-medium text-gray-900 mb-2">
              Filter Aset
            </label>
            <div className="relative">
              <select 
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="appearance-none px-3 py-2.5 pr-10 border border-gray-300 rounded-md text-sm bg-white min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Semua Aset</option>
                {assetOptions.filter(opt => opt !== 'all').map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xl font-medium text-gray-900 mb-2">
              Filter Proyek
            </label>
            <div className="relative">
              <select 
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="appearance-none px-3 py-2.5 pr-10 border border-gray-300 rounded-md text-sm bg-white min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Semua Proyek</option>
                {projectOptions.filter(opt => opt !== 'all').map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xl font-medium text-gray-900 mb-2">
              Filter Periode
            </label>
            <div className="relative">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="appearance-none px-3 py-2.5 pr-10 border border-gray-300 rounded-md text-sm bg-white min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {periodOptions.map(period => (
                  <option key={period} value={period}>
                    {period === 'all' ? 'Semua Periode' : period}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Reset Button */}
          {(selectedAsset !== 'all' || selectedProject !== 'all' || selectedPeriod !== 'all') && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedAsset('all');
                  setSelectedProject('all');
                  setSelectedPeriod('all');
                }}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
        
        {/* Active Filters Indicator */}
        {(selectedAsset !== 'all' || selectedProject !== 'all' || selectedPeriod !== 'all') && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Filter aktif:</span>
            {selectedAsset !== 'all' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                Aset: {selectedAsset}
              </span>
            )}
            {selectedProject !== 'all' && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md">
                Proyek: {selectedProject}
              </span>
            )}
            {selectedPeriod !== 'all' && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md">
                Periode: {selectedPeriod}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="px-8 py-6 space-y-8">
        {/* Ringkasan Dana */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Ringkasan Dana</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <Card>
              <Statistic 
                title="Total Dana Masuk" 
                value={formatRupiah(ringkasanDana?.total_dana_masuk)}
                icon={GiReceiveMoney}
                iconColor="#7CB305"
              />
            </Card>
            <Card>
              <Statistic 
                title="Total Pengeluaran" 
                value={formatRupiah(ringkasanDana?.total_pengeluaran)}
                icon={GiPayMoney}
                iconColor="#1C64F2"
              />
            </Card>
          </div>
          <Card>
            <Statistic 
              title="Cash on Hand" 
              value={formatRupiah(ringkasanDana?.sisa_dana)}
              icon={GiMoneyStack}
              iconColor="#9061F9"
            />
          </Card>
        </section>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Persentase Penggunaan Dana">
            <DonutChart 
              data={[
                { name: 'Dana Tersedia', value: ringkasanDana?.sisa_dana || 0 },
                { name: 'Dana Terpakai', value: ringkasanDana?.total_pengeluaran || 0 }
              ]} 
              colors={['#3B82F6', '#A855F7']}
            />
          </Card>
          
          <Card title="Rincian Dana Berdasarkan Proyek">
            {fundingProgress && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-semibold text-gray-900">Proyek A</span>
                  </div>
                  <div className="mb-2.5 space-y-1 text-sm text-gray-600">
                    <div>Anggaran: <span className="font-medium">{formatRupiah((fundingProgress.funding.amount || 0) + (fundingProgress.expense.amount || 0))}</span></div>
                    <div>Total Dana Masuk: <span className="font-medium text-green-600">{formatRupiah(fundingProgress.funding.amount)}</span></div>
                  </div>
                  <div className="flex justify-between mb-2.5 gap-3">
                    <Tag color="success">{fundingProgress.funding.percent}%</Tag>
                    <Tag color="default">{fundingProgress.expense.percent}%</Tag>
                  </div>
                  <ProgressBar percent={fundingProgress.funding.percent} color="#7CB305" />
                  <div className="flex justify-between mt-2.5 text-xs text-gray-600">
                    <span>Total Dana Masuk: {formatRupiah(fundingProgress.funding.amount)}</span>
                    <span>Anggaran: {formatRupiah((fundingProgress.funding.amount || 0) + (fundingProgress.expense.amount || 0))}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Pengeluaran Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Pengeluaran</h2>
          
          <Card className="mb-6">
            <Statistic 
              title="Total Pengeluaran" 
              value={formatRupiah(ringkasanDana?.total_pengeluaran)}
              icon={GiPayMoney}
              iconColor="#1C64F2"
            />
          </Card>

          <Card title="Pengeluaran Per Kategori" className="mb-6">
            <SimpleBarChart 
              data={categoryData} 
              dataKey="amount" 
              xKey="category" 
              colors={['#2B72FB', '#64BDC6', '#EECA34', '#FE6A35', '#FA4B42', '#EE60E0']}
              height={280}
            />
          </Card>

          <Card title="Top 5 Pengeluaran Terbesar">
            <Table 
              dataSource={topExpenses.slice(0, 5)} 
              columns={expenseColumns} 
              rowKey="id" 
            />
          </Card>
        </section>

        {/* Laba Rugi Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Laba Rugi</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <Card>
              <Statistic 
                title="Pendapatan" 
                value={formatRupiah(labaRugi?.Jumlah)}
                icon={labaRugiStatus === 'Laba' ? ArrowUpRight : ArrowDownRight}
                iconColor={labaRugiColor}
                valueStyle={{ color: labaRugiColor }}
                suffix={<Tag color={labaRugiTagColor}>{labaRugi?.Status}</Tag>}
              />
            </Card>
            <Card>
              <Statistic 
                title="Total Pengeluaran" 
                value={formatRupiah(ringkasanDana?.total_pengeluaran)}
                icon={GiPayMoney}
                iconColor="#CF1322"
                valueStyle={{ color: '#CF1322' }}
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <Card>
              <Statistic 
                title="Net Profit" 
                value={formatRupiah(yieldData?.hasil_bersih)}
                icon={TrendingUp}
                iconColor="#1C64F2"
                valueStyle={{ color: '#1C64F2' }}
              />
            </Card>
            <Card>
              <Statistic 
                title="Margin Laba (%)" 
                value={`${yieldData?.margin_laba || 0}%`}
                icon={BarChart3}
                iconColor="#9061F9"
                valueStyle={{ color: '#9061F9' }}
              />
            </Card>
          </div>

          <Card title="Pendapatan vs Pengeluaran">
            <GroupedBarChart data={incomeExpense} height={280} />
          </Card>
        </section>

        {/* Ringkasan Per Kuartal */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Ringkasan Keuangan Per Kuartal</h2>
          <Card>
            <Table 
              dataSource={quarterlyData} 
              columns={quarterlyColumns} 
              rowKey="quarter" 
            />
          </Card>
        </section>

        {/* Yield Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Yield</h2>
          
          <Card className="mb-6">
            <Statistic 
              title="Total Investasi Investor" 
              value={formatRupiah(yieldData?.total_investasi)}
              icon={FaMoneyBillTransfer}
              iconColor="#7CB305"
            />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <Card>
              <Statistic 
                title="Total Bagi Hasil Investor" 
                value={formatRupiah(ringkasanDana?.total_dana_masuk)}
                icon={GiPayMoney}
                iconColor="#1C64F2"
              />
            </Card>
            <Card>
              <Statistic 
                title="Total Yield" 
                value={formatRupiah(reportData?.total_yield)}
                icon={FaMoneyBills}
                iconColor="#9061F9"
              />
            </Card>
          </div>

          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <Card>
              <Statistic 
                title="Persentase ROI" 
                value={`${((reportData?.total_yield / yieldData?.total_investasi * 100) || 0).toFixed(1)}%`}
                icon={PieChart}
                iconColor="#1C64F2"
              />
            </Card>
            <Card>
              <Statistic 
                title="Jumlah Proyek" 
                value={quarterlyData?.length || 0}
                icon={BarChart3}
                iconColor="#9061F9"
              />
            </Card>
          </div> */}

          <Card title="Investor Yield %">
            <Table 
              dataSource={paginatedInvestorYield} 
              columns={investorColumns} 
              rowKey="investor" 
            />
            
            {totalPages > 1 && (<Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}

export default ReportingContent;