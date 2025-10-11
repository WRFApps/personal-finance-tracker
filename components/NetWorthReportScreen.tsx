
import React, { useContext, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../App.tsx';
import Button from './ui/Button.tsx';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { formatDateReadable } from '../constants.ts';

Chart.register(...registerables);

const NetWorthReportScreen: React.FC = () => {
  const context = useContext(AppContext);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  if (!context) return <div className="text-center py-10">Loading context...</div>;
  const { 
    calculateNetWorth, 
    recordNetWorthSnapshot, 
    netWorthHistory, 
    isLoading, 
    formatCurrency,
    bankAccounts,
    transactions, // For cash balance calculation
    receivables,
    payables,
    creditCards,
    longTermLiabilities,
    shortTermLiabilities,
    nonCurrentAssets
  } = context;

  const { netWorth, totalAssets, totalLiabilities } = useMemo(() => calculateNetWorth(), [
      bankAccounts, transactions, receivables, payables, creditCards, 
      longTermLiabilities, shortTermLiabilities, nonCurrentAssets, calculateNetWorth
    ]);
    
  useEffect(() => {
    if (chartRef.current && netWorthHistory.length > 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: 'line',
          data: {
            labels: netWorthHistory.map(s => formatDateReadable(s.date)),
            datasets: [
              {
                label: 'Net Worth',
                data: netWorthHistory.map(s => s.netWorth),
                borderColor: '#3B82F6', // primary
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.1,
              },
              {
                label: 'Total Assets',
                data: netWorthHistory.map(s => s.assets),
                borderColor: '#10B981', // secondary
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: false,
                tension: 0.1,
                hidden: true, // Optionally hide by default
              },
              {
                label: 'Total Liabilities',
                data: netWorthHistory.map(s => s.liabilities),
                borderColor: '#EF4444', // danger
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: false,
                tension: 0.1,
                hidden: true, // Optionally hide by default
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: false } }, // Allow negative net worth
            plugins: { 
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw as number)}` }}
            }
          },
        };
        chartInstanceRef.current = new Chart(ctx, chartConfig);
      }
    }
     return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [netWorthHistory, formatCurrency]);

  if (isLoading) return <div className="text-center py-10">Loading net worth data...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-dark dark:text-gray-100">Net Worth Report</h2>
        <Button onClick={recordNetWorthSnapshot} variant="secondary" leftIcon={<i className="fas fa-camera"></i>}>
          Record Current Net Worth Snapshot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-1">Total Assets</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalAssets)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-1">Total Liabilities</h3>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalLiabilities)}</p>
        </div>
        <div className={`${netWorth >= 0 ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-orange-50 dark:bg-orange-900/30'} p-6 rounded-lg shadow`}>
          <h3 className={`text-lg font-semibold ${netWorth >=0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'} mb-1`}>Current Net Worth</h3>
          <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>{formatCurrency(netWorth)}</p>
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-semibold text-dark dark:text-gray-100 mb-4">Net Worth Over Time</h3>
        {netWorthHistory.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <i className="fas fa-chart-line text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
            <p className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-2">No Net Worth History.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Record a snapshot of your current net worth to start tracking its progress over time.</p>
            <Button onClick={recordNetWorthSnapshot} variant="secondary" leftIcon={<i className="fas fa-camera"></i>}>
                Record First Snapshot
            </Button>
          </div>
        ) : (
          <div className="relative h-80 md:h-96 w-full bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg shadow-inner">
            <canvas ref={chartRef}></canvas>
          </div>
        )}
      </div>
       {netWorthHistory.length > 0 && (
         <div className="overflow-x-auto mt-6">
            <h4 className="text-xl font-semibold text-dark dark:text-gray-100 mb-3">Snapshot History</h4>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Date</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Assets</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Liabilities</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Net Worth</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {netWorthHistory.slice().reverse().map(snapshot => ( // Show most recent first
                        <tr key={snapshot.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDateReadable(snapshot.date)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">{formatCurrency(snapshot.assets)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">{formatCurrency(snapshot.liabilities)}</td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${snapshot.netWorth >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>{formatCurrency(snapshot.netWorth)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
       )}

    </div>
  );
};

export default NetWorthReportScreen;
