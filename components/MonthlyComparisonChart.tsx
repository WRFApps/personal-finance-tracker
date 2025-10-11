
import React, { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration, registerables, ChartEvent, ActiveElement } from 'chart.js'; // Ensure 'chart.js' is installed or use global Chart

Chart.register(...registerables);

interface MonthlyComparisonChartProps {
  labels: string[]; // Month labels e.g., ["Jan 2023", "Feb 2023"]
  incomeData: number[];
  expenseData: number[];
  onBarClick?: (monthYear: string, type: 'Income' | 'Expense') => void; // Added for drill-down
}

const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({ labels, incomeData, expenseData, onBarClick }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy(); // Destroy previous chart instance
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Total Income',
                data: incomeData,
                backgroundColor: 'rgba(75, 192, 192, 0.6)', // Greenish
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
              {
                label: 'Total Expenditure',
                data: expenseData,
                backgroundColor: 'rgba(255, 99, 132, 0.6)', // Reddish
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function (value) {
                    if (typeof value === 'number') {
                        if (value >= 1000000) return (value / 1000000) + 'M';
                        if (value >= 1000) return (value / 1000) + 'K';
                    }
                    return value;
                  }
                }
              },
            },
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      // Ideally, use the app's formatCurrency function here
                      // For simplicity, using a basic formatter.
                      // The actual formatting should be handled by context.formatCurrency if possible,
                      // but TooltipItem type doesn't easily allow context access here without major refactor.
                       label += new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(context.parsed.y as number); 
                    }
                    return label;
                  }
                }
              }
            },
            onClick: (event: ChartEvent, elements: ActiveElement[]) => {
                if (elements.length > 0 && onBarClick) {
                    const element = elements[0];
                    const monthYearLabel = labels[element.index];
                    const datasetLabel = chartConfig.data.datasets[element.datasetIndex].label;
                    const type = datasetLabel === 'Total Income' ? 'Income' : 'Expense';
                    onBarClick(monthYearLabel, type);
                }
            },
          },
        };
        chartInstanceRef.current = new Chart(ctx, chartConfig);
      }
    }

    // Cleanup function to destroy chart on component unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [labels, incomeData, expenseData, onBarClick]);

  return (
    <div className="relative h-72 sm:h-96 w-full cursor-pointer"> {/* Adjust height as needed */}
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default MonthlyComparisonChart;
