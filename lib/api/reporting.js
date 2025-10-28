import axiosClient from './axiosClient';

export const getFinancialReport = async () => {
  const response = await axiosClient.get('/api/reporting/laporan-keuangan/');
  return response.data;
};

export const getExpenseByCategory = async () => {
  const response = await axiosClient.get('/api/reporting/pengeluaran-per-kategori/');
  return response.data;
};

export const getTopExpenses = async () => {
  const response = await axiosClient.get('/api/reporting/top-pengeluaran/');
  return response.data;
};

export const getIncomeVsExpense = async () => {
  const response = await axiosClient.get('/api/reporting/pendapatan-vs-pengeluaran/');
  return response.data;
};

export const getQuarterlyReport = async () => {
  const response = await axiosClient.get('/api/reporting/ringkasan-kuartal/');
  return response.data;
};

export const getYieldReport = async () => {
  const response = await axiosClient.get('/api/reporting/yield-report/');
  return response.data;
};

export const getInvestorYield = async () => {
  const response = await axiosClient.get('/api/reporting/investor-yield/');
  return response.data;
};

export const getFundingProgress = async () => {
  const response = await axiosClient.get('/api/reporting/funding-progress/');
  return response.data;
};