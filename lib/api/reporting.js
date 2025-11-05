import axiosClient from './axiosClient';

export const getFinancialReport = async (params) => {
  // ... (fungsi yang ada)
  const response = await axiosClient.get('/api/reporting/laporan-keuangan/', { params });
  return response.data;
};

// ... (Semua fungsi get... Anda yang lain tetap di sini)
export const getRincianDanaPerProyek = async (params) => {
  const response = await axiosClient.get('/api/reporting/rincian-dana-per-proyek/', { params });
  return response.data;
};

export const getExpenseByCategory = async (params) => {
  const response = await axiosClient.get('/api/reporting/pengeluaran-per-kategori/', { params });
  return response.data;
};

export const getTopExpenses = async (params) => {
  const response = await axiosClient.get('/api/reporting/top-pengeluaran/', { params });
  return response.data;
};

export const getIncomeVsExpense = async (params) => {
  const response = await axiosClient.get('/api/reporting/pendapatan-vs-pengeluaran/', { params });
  return response.data;
};

export const getQuarterlyReport = async (params) => {
  const response = await axiosClient.get('/api/reporting/ringkasan-kuartal/', { params });
  return response.data;
};

export const getYieldReport = async (params) => {
  const response = await axiosClient.get('/api/reporting/yield-report/', { params });
  return response.data;
};

export const getInvestorYield = async (params) => {
  const response = await axiosClient.get('/api/reporting/investor-yield/', { params });
  return response.data;
};

export const getFundingProgress = async (params) => {
  const response = await axiosClient.get('/api/reporting/funding-progress/', { params });
  return response.data;
};

// --- TAMBAHAN BARU DI SINI ---
export const getProductionStats = async (params) => {
  // params akan berisi { asset }
  const response = await axiosClient.get('/api/reporting/production-statistics/', { params });
  return response.data;
};
// --- BATAS TAMBAHAN ---