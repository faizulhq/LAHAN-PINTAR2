'use client';
import { useState } from 'react';
import * as authAPI from '@/lib/api/auth';
import * as projectAPI from '@/lib/api/project';
import * as assetAPI from '@/lib/api/asset';
import * as investorAPI from '@/lib/api/investor';
import * as fundingSourceAPI from '@/lib/api/funding_source';
import * as fundingAPI from '@/lib/api/funding';
import * as ownershipAPI from '@/lib/api/ownership';
import * as productionAPI from '@/lib/api/production';
import * as profitDistributionAPI from '@/lib/api/profit_distribution';
import * as expenseAPI from '@/lib/api/expense';
import * as distributionDetailAPI from '@/lib/api/distribution_detail';
import * as dashboardAPI from '@/lib/api/dashboard';
import * as reportingAPI from '@/lib/api/reporting';

const ResultCard = ({ title, status, data, error }) => {
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isLoading = status === 'loading';

  let backgroundColor = '#f0f0f0';
  if (isSuccess) backgroundColor = '#e8f5e9';
  if (isError) backgroundColor = '#ffebee';

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', margin: '10px 0', backgroundColor }}>
      <h3 style={{ padding: '10px 15px', borderBottom: '1px solid #ccc', margin: 0 }}>
        {title} - {isLoading ? 'Loading...' : isSuccess ? '✅ Success' : isError ? '❌ Error' : 'Idle'}
      </h3>
      {data && <pre style={{ padding: '10px 15px', overflow: 'auto', maxHeight: '150px' }}>{JSON.stringify(data, null, 2)}</pre>}
      {error && <pre style={{ padding: '10px 15px', overflow: 'auto', color: '#d32f2f' }}>{JSON.stringify(error, null, 2)}</pre>}
    </div>
  );
};

export default function TestAllApiPage() {
  const [results, setResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const setTestResult = (key, status, data = null, error = null) => {
    setResults((prev) => ({
      ...prev,
      [key]: { status, data, error },
    }));
  };

  const handleLogin = async () => {
    const key = 'login';
    setTestResult(key, 'loading');
    try {
      const username = 'testuser_' + Date.now();
      const password = 'testpassword123';
      
      await authAPI.register({
        username: username,
        email: `${username}@example.com`,
        password: password,
        password2: password,
        role: 'Viewer'
      });

      const response = await authAPI.login({ username, password });
      setTestResult(key, 'success', response.data);
      return true;
    } catch (err) {
      console.error('Login Error:', err.response?.data || err.message);
      setTestResult(key, 'error', null, err.response?.data || err.message);
      return false;
    }
  };

  const handleTestAllGet = async () => {
    setIsLoading(true);
    setResults({});

    const loggedIn = await handleLogin();
    if (!loggedIn) {
      setIsLoading(false);
      return;
    }

    const tests = [
      { key: 'getProjects', fn: projectAPI.getProjects },
      { key: 'getAssets', fn: assetAPI.getAssets },
      { key: 'getOwners', fn: assetAPI.getOwners },
      { key: 'getInvestors', fn: investorAPI.getInvestors },
      { key: 'getFundingSources', fn: fundingSourceAPI.getFundingSources },
      { key: 'getFundings', fn: fundingAPI.getFundings },
      { key: 'getOwnerships', fn: ownershipAPI.getOwnerships },
      { key: 'getProductions', fn: productionAPI.getProductions },
      { key: 'getProfitDistributions', fn: profitDistributionAPI.getProfitDistributions },
      { key: 'getExpenses', fn: expenseAPI.getExpenses },
      { key: 'getDistributionDetails', fn: distributionDetailAPI.getDistributionDetails },
      { key: 'getDashboardData', fn: dashboardAPI.getDashboardData },
      { key: 'getFinancialReport', fn: reportingAPI.getFinancialReport },
    ];

    for (const test of tests) {
      setTestResult(test.key, 'loading');
    }

    const results = await Promise.allSettled(
      tests.map(test => test.fn())
    );

    results.forEach((result, index) => {
      const key = tests[index].key;
      if (result.status === 'fulfilled') {
        // Cek jika data adalah array kosong, yang juga sukses
        const data = result.value.data || result.value;
        setTestResult(key, 'success', data);
      } else {
        console.error(`Error [${key}]:`, result.reason.response?.data || result.reason.message);
        setTestResult(key, 'error', null, result.reason.response?.data || result.reason.message);
      }
    });

    setIsLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🧪 Test All API Endpoints</h1>
      <p>Test ini akan (1) Register user baru, (2) Login via cookie, (3) Menjalankan semua fungsi GET dari 13 file API.</p>
      
      <button 
        onClick={handleTestAllGet} 
        disabled={isLoading}
        style={{ padding: '15px 30px', fontSize: '18px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px' }}
      >
        {isLoading ? 'Testing...' : '🚀 Test All GET Endpoints'}
      </button>

      <div style={{ marginTop: '20px' }}>
        <ResultCard title="Login (Register + Login)" {...results['login']} />
        
        <h2>Hasil Test GET Endpoints</h2>
        {Object.keys(results).filter(k => k !== 'login').map(key => (
          <ResultCard key={key} title={key} {...results[key]} />
        ))}
      </div>
    </div>
  );
}