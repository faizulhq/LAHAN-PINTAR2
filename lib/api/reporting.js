import axiosClient from './axiosClient';

export const getFinancialReport = async (params) => {
  const response = await axiosClient.get('/api/reporting/laporan-keuangan/', { params });
  return response.data;
};

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