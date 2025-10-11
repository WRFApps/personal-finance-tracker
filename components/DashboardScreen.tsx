
import React, { useContext, useMemo, useState, useEffect, ChangeEvent, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { TransactionType, Budget, Transaction, Receivable, Payable, CreditCard, BankAccount, LongTermLiability, ShortTermLiability, PaymentMethod, ShortTermLiabilityPaymentStructure, ShortTermLiabilityStatus, NonCurrentAsset, FinancialGoal, RecurringTransaction, UserSettings, DailyCashFlowProjection, DashboardWidgetConfigItem, Period } from '../types.ts'; 
import Button from './ui/Button.tsx';
import ProgressBar from './ui/ProgressBar.tsx';
import Input from './ui/Input.tsx'; 
import CollapsibleSection from './ui/CollapsibleSection.tsx'; 
import CashTransferModal from './CashTransferModal.tsx';
import MonthlyComparisonChart from './MonthlyComparisonChart.tsx'; 
import { getCurrentMonthYear, formatMonthYear, formatDateReadable, calculateReceivableStats, calculatePayableStats, getFirstDayOfCurrentMonth, calculateLongTermLiabilityStats, calculateShortTermLiabilityStats } from '../constants.ts'; 
import type { ShortTermLiabilityCalculatedStats } from '../types.ts';
import { Chart, ChartConfiguration, registerables, TooltipItem, ChartEvent, ActiveElement } from 'chart.js'; // Added ChartEvent, ActiveElement

Chart.register(...registerables);

interface PieChartSliceData {
  categoryId: string; // Added categoryId
  categoryName: string;
  totalAmount: number;
  percentage: number;
  color: string;
}

const PIE_CHART_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7FDBFF', '#F012BE', '#01FF70', '#FFDC00', '#85144b'];

// ExpensePieChart Component (Widget)
const ExpensePieChartWidget: React.FC = () => {
    const context = useContext(AppContext);
    const navigate = ReactRouterDOM.useNavigate(); // Added for drill-down
    if (!context) return null;
    const { transactions, getCategoryName, formatCurrency } = context;

    const [expenditureStartDate, setExpenditureStartDate] = useState<string>(getFirstDayOfCurrentMonth());
    const [expenditureEndDate, setExpenditureEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    
    const expenditureBreakdownData = useMemo(() => {
        const filteredExpenses = transactions.filter(t => 
            t.type === TransactionType.EXPENSE &&
            t.date >= expenditureStartDate &&
            t.date <= expenditureEndDate
        );
        const groupedByCategory: { [categoryId: string]: number } = {};
        filteredExpenses.forEach(expense => {
            if(expense.isSplit && expense.splits) {
                expense.splits.forEach(split => {
                     groupedByCategory[split.categoryId] = (groupedByCategory[split.categoryId] || 0) + split.amount;
                });
            } else if (expense.categoryId) {
                 groupedByCategory[expense.categoryId] = (groupedByCategory[expense.categoryId] || 0) + expense.amount;
            }
        });
        return Object.entries(groupedByCategory)
            .map(([categoryId, totalAmount]) => ({
                categoryId, // Ensure categoryId is here
                categoryName: getCategoryName(categoryId),
                totalAmount
            }))
            .sort((a, b) => b.totalAmount - a.totalAmount);
    }, [transactions, expenditureStartDate, expenditureEndDate, getCategoryName]);

    const pieChartDataForDisplay = useMemo((): PieChartSliceData[] => {
        const totalExpensesForPeriod = expenditureBreakdownData.reduce((sum, item) => sum + item.totalAmount, 0);
        if (totalExpensesForPeriod === 0) return [];
        return expenditureBreakdownData.map((item, index) => ({
            ...item,
            categoryId: item.categoryId, // Pass categoryId
            percentage: (item.totalAmount / totalExpensesForPeriod) * 100,
            color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]
        }));
    }, [expenditureBreakdownData]);
  
    const chartJsPieData = useMemo(() => ({
        labels: pieChartDataForDisplay.map(d => d.categoryName),
        data: pieChartDataForDisplay.map(d => d.totalAmount),
        backgroundColors: pieChartDataForDisplay.map(d => d.color)
    }), [pieChartDataForDisplay]);

    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstanceRef.current) chartInstanceRef.current.destroy();
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: chartJsPieData.labels,
                        datasets: [{ label: 'Expenses', data: chartJsPieData.data, backgroundColor: chartJsPieData.backgroundColors, hoverOffset: 4 }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 }}},
                            tooltip: { callbacks: { label: (item: TooltipItem<'pie'>) => `${item.label || ''}: ${formatCurrency(item.raw as number)}` }}
                        },
                        onClick: (event: ChartEvent, elements: ActiveElement[]) => {
                            if (elements.length > 0) {
                                const clickedElementIndex = elements[0].index;
                                const clickedSliceData = pieChartDataForDisplay[clickedElementIndex];
                                if (clickedSliceData) {
                                    navigate('/transactions', {
                                        state: {
                                            filterCategoryId: clickedSliceData.categoryId,
                                            filterStartDate: expenditureStartDate,
                                            filterEndDate: expenditureEndDate,
                                            filterType: TransactionType.EXPENSE
                                        }
                                    });
                                }
                            }
                        }
                    }
                });
            }
        }
        return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy(); };
    }, [chartJsPieData, formatCurrency, navigate, pieChartDataForDisplay, expenditureStartDate, expenditureEndDate]);

    return (
        <CollapsibleSection title="Expenditure Breakdown by Category" icon="fa-chart-pie" defaultOpen={true}>
            <div className="flex flex-col sm:flex-row gap-4 mb-4 items-end">
                <Input type="date" label="Start Date" value={expenditureStartDate} onChange={e => setExpenditureStartDate(e.target.value)} containerClassName="mb-0 flex-grow" />
                <Input type="date" label="End Date" value={expenditureEndDate} onChange={e => setExpenditureEndDate(e.target.value)} containerClassName="mb-0 flex-grow" min={expenditureStartDate || undefined}/>
            </div>
            {chartJsPieData.labels.length === 0 ? (
                 <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-chart-pie text-3xl mb-2"></i>
                    <p>No expense data for the selected period.</p>
                </div>
            ) : (
                <div className="relative h-64 w-full mx-auto max-w-md cursor-pointer">
                    <canvas ref={chartRef}></canvas>
                </div>
            )}
            {pieChartDataForDisplay.length > 0 && (
                <ul className="mt-4 space-y-1 text-xs">
                    {pieChartDataForDisplay.map(item => (
                        <li key={item.categoryName} className="flex items-center">
                            <span style={{ backgroundColor: item.color }} className="w-3 h-3 rounded-full mr-2 inline-block"></span>
                            {item.categoryName}: {formatCurrency(item.totalAmount)} ({item.percentage.toFixed(1)}%)
                        </li>
                    ))}
                </ul>
            )}
        </CollapsibleSection>
    );
};

// Summary Cards Widget
const SummaryCardsWidget: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { formatCurrency, bankAccounts, creditCards, receivables, payables, calculateNetWorth, cashBalance } = context;
    const [isCashTransferModalOpen, setIsCashTransferModalOpen] = useState<boolean>(false);

    const totalBankBalance = useMemo(() => bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0), [bankAccounts]);
    const totalAvailableCredit = useMemo(() => creditCards.reduce((sum, card) => sum + card.availableBalance, 0), [creditCards]);
    const currentNetWorthDetails = useMemo(() => calculateNetWorth(), [calculateNetWorth]); 
    const totalOutstandingReceivables = useMemo(() => receivables.reduce((total, r) => total + calculateReceivableStats(r).remaining, 0), [receivables]);
    const totalOutstandingPayables = useMemo(() => payables.reduce((total, p) => total + calculatePayableStats(p).remaining, 0), [payables]);
    
    return (
        <>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <SummaryCard title="Net Worth" value={formatCurrency(currentNetWorthDetails.netWorth)} icon="fa-balance-scale-right" colorClass="bg-indigo-500 hover:bg-indigo-600" linkTo="/net-worth"/>
                <SummaryCard title="Cash Balance" value={formatCurrency(cashBalance)} icon="fa-money-bill-wave" colorClass="bg-green-500 hover:bg-green-600" actionButton={<Button size="xs" variant="light" className="text-green-700" onClick={() => setIsCashTransferModalOpen(true)}><i className="fas fa-exchange-alt mr-1"></i>Transfer</Button>}/>
                <SummaryCard title="Bank Accounts Total" value={formatCurrency(totalBankBalance)} icon="fa-university" colorClass="bg-blue-500 hover:bg-blue-600" linkTo="/bank-accounts"/>
                <SummaryCard title="Outstanding Receivables" value={formatCurrency(totalOutstandingReceivables)} icon="fa-hand-holding-usd" colorClass="bg-teal-500 hover:bg-teal-600" linkTo="/receivables"/>
                <SummaryCard title="Outstanding Payables" value={formatCurrency(totalOutstandingPayables)} icon="fa-file-invoice-dollar" colorClass="bg-orange-500 hover:bg-orange-600" linkTo="/payables"/>
                <SummaryCard title="Available Credit" value={formatCurrency(totalAvailableCredit)} icon="fa-credit-card" colorClass="bg-purple-500 hover:bg-purple-600" linkTo="/credit-cards"/>
            </section>
            {isCashTransferModalOpen && <CashTransferModal isOpen={isCashTransferModalOpen} onClose={() => setIsCashTransferModalOpen(false)} currentCashBalance={cashBalance} />}
        </>
    );
};


const SummaryCard: React.FC<{ title: string; value: string; icon: string; colorClass: string; linkTo?: string; actionButton?: React.ReactNode }> = ({ title, value, icon, colorClass, linkTo, actionButton }) => {
  const content = (
    <div className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ${colorClass} text-white min-h-[120px] flex flex-col justify-between`}>
      <div className="flex justify-between items-start">
        <h4 className="text-sm font-semibold uppercase tracking-wider">{title}</h4>
        <i className={`fas ${icon} text-2xl opacity-70`}></i>
      </div>
      <div className="flex justify-between items-end">
        <p className="text-2xl sm:text-3xl font-bold mt-1">{value}</p>
        {actionButton}
      </div>
    </div>
  );
  return linkTo ? <ReactRouterDOM.Link to={linkTo}>{content}</ReactRouterDOM.Link> : content;
};

// FinancialHealthQuickCheck Widget
const FinancialHealthQuickCheckWidget: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { transactions, userSettings, bankAccounts, cashBalance, formatCurrency, longTermLiabilities, shortTermLiabilities, getCategoryName } = context;
    const currentMonthYearStr = getCurrentMonthYear();

    const currentMonthTransactions = useMemo(() => transactions.filter(t => t.date.startsWith(currentMonthYearStr)), [transactions, currentMonthYearStr]);
    const currentMonthIncome = useMemo(() => currentMonthTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0), [currentMonthTransactions]);
    const currentMonthExpenses = useMemo(() => currentMonthTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0), [currentMonthTransactions]);
    const savingsRate = useMemo(() => (currentMonthIncome === 0 ? 0 : ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100), [currentMonthIncome, currentMonthExpenses]);
    const averageMonthlyExpenses = useMemo(() => { const months = 3; const data: { [k:string]: number } = {}; for(let i=0;i<months;i++){ const d=new Date(); d.setMonth(d.getMonth()-i); data[`${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`]=0; } transactions.forEach(t => { if(t.type===TransactionType.EXPENSE){ const mk=t.date.substring(0,7); if(data[mk]!==undefined) data[mk]+=t.amount; }}); const vals=Object.values(data); return vals.length === 0 ? 0 : vals.reduce((s,v)=>s+v,0)/vals.length; }, [transactions]);
    const emergencyFundDetails = useMemo(() => { const target = (userSettings.emergencyFundTargetMonths||3)*averageMonthlyExpenses; const current = bankAccounts.filter(ba => userSettings.emergencyFundAccountIds.includes(ba.id)).reduce((s,ba)=>s+ba.currentBalance,0) + (userSettings.emergencyFundAccountIds.includes('cash')?cashBalance:0); const prog = target>0?Math.min(100,(current/target)*100):(current>0?100:0); return {target,current,prog};}, [userSettings,averageMonthlyExpenses,bankAccounts,cashBalance]);
    const debtToIncomeRatio = useMemo(() => { if (!userSettings.grossMonthlyIncome||userSettings.grossMonthlyIncome===0)return null; const debt = longTermLiabilities.reduce((s,l)=>s+l.monthlyPayment,0)+shortTermLiabilities.filter(sl=>sl.paymentStructure===ShortTermLiabilityPaymentStructure.INSTALLMENTS&&calculateShortTermLiabilityStats(sl).monthlyInstallmentAmount).reduce((s,sl)=>s+(calculateShortTermLiabilityStats(sl).monthlyInstallmentAmount||0),0); return (debt/userSettings.grossMonthlyIncome)*100;},[userSettings.grossMonthlyIncome,longTermLiabilities,shortTermLiabilities]);

    return (
        <CollapsibleSection title="Financial Health Quick Check" icon="fa-heartbeat" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg shadow"><h4 className="font-semibold text-dark dark:text-gray-100 mb-2">This Month ({formatMonthYear(new Date().toISOString())})</h4><p className="text-sm text-green-600 dark:text-green-400">Income: {formatCurrency(currentMonthIncome)}</p><p className="text-sm text-red-600 dark:text-red-400">Expenses: {formatCurrency(currentMonthExpenses)}</p><p className={`text-sm font-medium ${currentMonthIncome-currentMonthExpenses>=0?'text-blue-600 dark:text-blue-400':'text-orange-500 dark:text-orange-400'}`}>Net: {formatCurrency(currentMonthIncome-currentMonthExpenses)}</p></div>
                <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg shadow"><h4 className="font-semibold text-dark dark:text-gray-100 mb-2">Savings Rate</h4><ProgressBar value={savingsRate} label={`${savingsRate.toFixed(1)}%`} color={savingsRate>(userSettings.savingsRateTarget||20)?'bg-green-500':(savingsRate>0?'bg-yellow-500':'bg-red-500')}/>{userSettings.savingsRateTarget&&<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Target: {userSettings.savingsRateTarget}%</p>}</div>
                <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg shadow"><h4 className="font-semibold text-dark dark:text-gray-100 mb-1">Emergency Fund</h4><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target: {formatCurrency(emergencyFundDetails.target)}</p><ProgressBar value={emergencyFundDetails.prog} label={`${formatCurrency(emergencyFundDetails.current)} (${emergencyFundDetails.prog.toFixed(0)}%)`} color={emergencyFundDetails.prog>=100?'bg-green-500':(emergencyFundDetails.prog>50?'bg-yellow-500':'bg-red-500')}/></div>
                {userSettings.grossMonthlyIncome > 0 && debtToIncomeRatio !== null && (<div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg shadow"><h4 className="font-semibold text-dark dark:text-gray-100 mb-2">Debt-to-Income</h4><p className={`text-2xl font-bold ${debtToIncomeRatio<20?'text-green-600':debtToIncomeRatio<36?'text-yellow-600':'text-red-600'}`}>{debtToIncomeRatio.toFixed(1)}%</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Based on: {formatCurrency(userSettings.grossMonthlyIncome)}</p></div>)}
            </div>
        </CollapsibleSection>
    );
};

// RecentTransactions Widget
const RecentTransactionsWidget: React.FC = () => {
    const context = useContext(AppContext);
    if(!context) return null;
    const { transactions, getCategoryName, formatCurrency } = context;
    const recentTransactions = useMemo(() => [...transactions].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,5),[transactions]);
    return (
        <CollapsibleSection title="Recent Transactions" icon="fa-history" defaultOpen={true} actionButton={<ReactRouterDOM.Link to="/transactions/new"><Button variant="primary" size="sm" leftIcon={<i className="fas fa-plus"></i>}>Add</Button></ReactRouterDOM.Link>}>
            {recentTransactions.length > 0 ? (<ul className="divide-y divide-gray-200 dark:divide-gray-700">{recentTransactions.map(t=>(<li key={t.id} className="py-3 flex justify-between items-center"><div><p className="text-sm font-medium text-dark dark:text-gray-100">{t.description}</p><p className="text-xs text-gray-500 dark:text-gray-400">{getCategoryName(t.categoryId)} - {formatDateReadable(t.date)}</p></div><span className={`text-sm font-semibold ${t.type===TransactionType.INCOME?'text-green-600 dark:text-green-400':'text-red-600 dark:text-red-400'}`}>{t.type===TransactionType.INCOME?'+':'-'}{formatCurrency(t.amount)}</span></li>))}</ul>) : <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet.</p>}
            <ReactRouterDOM.Link to="/transactions" className="text-sm text-primary hover:underline mt-3 block text-right">View All Transactions &rarr;</ReactRouterDOM.Link>
        </CollapsibleSection>
    );
};

// ActiveBudgetsOverview Widget
const ActiveBudgetsOverviewWidget: React.FC = () => {
    const context = useContext(AppContext);
    if(!context) return null;
    const { budgets, transactions, getCategoryName, formatCurrency } = context;
    const currentMonthYearStr = getCurrentMonthYear();
    const activeBudgetsSummary = useMemo(() => {
        const sortedBudgets=[...budgets].sort((a,b)=>new Date(a.startDate).getTime()-new Date(b.startDate).getTime());
        return sortedBudgets.filter(b=>b.startDate.startsWith(currentMonthYearStr)).map(cb=>{
            const spent=transactions.filter(t=>t.categoryId===cb.categoryId&&t.type===TransactionType.EXPENSE&&t.date.startsWith(cb.startDate.substring(0,7))).reduce((s,t)=>s+t.amount,0);
            let el=cb.limitAmount; let ra=0;
            if(cb.rolloverEnabled){const pmd=new Date(cb.startDate+"T00:00:00");const pvd=new Date(pmd.getFullYear(),pmd.getMonth()-1,1);const pys=`${pvd.getFullYear()}-${(pvd.getMonth()+1).toString().padStart(2,'0')}`; const pmb=sortedBudgets.find(b=>b.categoryId===cb.categoryId&&b.startDate.startsWith(pys)&&b.rolloverEnabled); if(pmb){const pms=transactions.filter(t=>t.categoryId===pmb.categoryId&&t.type===TransactionType.EXPENSE&&t.date.startsWith(pys)).reduce((s,t)=>s+t.amount,0); ra=pmb.limitAmount-pms; el+=ra;}}
            el=Math.max(0,el); const prog=el>0?Math.min(100,(spent/el)*100):(spent>0?100:0); return {...cb,spent,prog,effectiveLimit:el,rolloverAmountApplied:ra,remaining:el-spent};
        });
    },[budgets,transactions,currentMonthYearStr]);
    return (
        <CollapsibleSection title={`Active Budgets (${currentMonthYearStr})`} icon="fa-wallet" defaultOpen={true} actionButton={<ReactRouterDOM.Link to="/budgets/new"><Button variant="primary" size="sm" leftIcon={<i className="fas fa-plus"></i>}>Add</Button></ReactRouterDOM.Link>}>
            {activeBudgetsSummary.length>0?(<div className="space-y-4">{activeBudgetsSummary.map(b=>(<div key={b.id}><div className="flex justify-between text-sm mb-1"><span className="font-medium text-dark dark:text-gray-100">{getCategoryName(b.categoryId)}</span><span className="text-gray-600 dark:text-gray-300">{formatCurrency(b.spent)} / {formatCurrency(b.effectiveLimit)}</span></div><ProgressBar value={b.prog} color={b.spent>b.effectiveLimit?'bg-red-500':(b.prog>=90?'bg-yellow-500':'bg-blue-500')}/>{b.rolloverEnabled&&b.rolloverAmountApplied!==0&&(<p className={`text-xs italic mt-0.5 ${b.rolloverAmountApplied>0?'text-green-600 dark:text-green-400':'text-red-600 dark:text-red-400'}`}>({b.rolloverAmountApplied>0?'+':''}{formatCurrency(b.rolloverAmountApplied)} from prev.)</p>)}</div>))}</div>):<p className="text-sm text-gray-500 dark:text-gray-400">No budgets for this month.</p>}
            <ReactRouterDOM.Link to="/budgets" className="text-sm text-primary hover:underline mt-3 block text-right">View All Budgets &rarr;</ReactRouterDOM.Link>
        </CollapsibleSection>
    );
};

// IncomeVsExpenditureChart Widget
const IncomeVsExpenditureChartWidget: React.FC = () => {
    const context = useContext(AppContext);
    const navigate = ReactRouterDOM.useNavigate(); // Added for drill-down
    if(!context) return null;
    const { transactions } = context;

    const monthlyIncomeExpenditureData = useMemo(() => {
        const data: {labels: string[], incomeData: number[], expenseData: number[]} = {labels: [], incomeData: [], expenseData: []};
        const monthDataMap: Map<string, {income: number, expenses: number}> = new Map(); 
        const orderedMonthKeys: string[] = [];

        for(let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i, 1); 
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const monthKey = `${year}-${month}`;
            
            data.labels.push(formatMonthYear(d.toISOString()));
            monthDataMap.set(monthKey, {income:0, expenses:0});
            orderedMonthKeys.push(monthKey); // Store keys in chronological order
        }

        transactions.forEach(t => {
            const monthKey = t.date.substring(0,7); 
            if(monthDataMap.has(monthKey)) {
                const currentMonthData = monthDataMap.get(monthKey);
                if (currentMonthData) { // Check if currentMonthData is not undefined
                    if(t.type === TransactionType.INCOME) currentMonthData.income += t.amount;
                    else currentMonthData.expenses += t.amount;
                }
            }
        });
        
        data.incomeData = orderedMonthKeys.map(key => monthDataMap.get(key)?.income || 0);
        data.expenseData = orderedMonthKeys.map(key => monthDataMap.get(key)?.expenses || 0);
        
        return data;
    }, [transactions]);
    
    const handleBarChartClick = (monthYearLabel: string, barType: 'Income' | 'Expense') => {
        // This logic correctly finds the month index from "MonthName YYYY" string
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const [monthName, yearStr] = monthYearLabel.split(' ');
        const year = parseInt(yearStr);
        const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());

        if (monthIndex === -1) return; // Should not happen with formatMonthYear

        const startDate = new Date(year, monthIndex, 1).toISOString().split('T')[0];
        const endDate = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0]; 

        navigate('/transactions', {
            state: {
                filterType: barType === 'Income' ? TransactionType.INCOME : TransactionType.EXPENSE,
                filterStartDate: startDate,
                filterEndDate: endDate,
            },
        });
    };

    return (
        <CollapsibleSection title="Income vs Expenditure (Last 6 Months)" icon="fa-chart-bar" defaultOpen={true}>
            <MonthlyComparisonChart 
                labels={monthlyIncomeExpenditureData.labels} 
                incomeData={monthlyIncomeExpenditureData.incomeData} 
                expenseData={monthlyIncomeExpenditureData.expenseData} 
                onBarClick={handleBarChartClick}
            />
        </CollapsibleSection>
    );
};

// RemindersUpcoming Widget
const RemindersUpcomingWidget: React.FC = () => {
    const context = useContext(AppContext);
    if(!context) return null;
    const { creditCards, shortTermLiabilities, recurringTransactions, processRecurringTransactions, formatCurrency } = context;
    const creditCardReminders = useMemo(() => { const today=new Date();const cd=today.getDate();const nw=new Date(new Date().setDate(today.getDate()+7)).getDate();const cm=today.getMonth(); return creditCards.filter(cc=>{if(!cc.dueDate)return false;if(cc.dueDate===cd)return true;const dim=new Date(today.getFullYear(),cm+1,0).getDate();if(cd+7>dim){return(cc.dueDate>cd)||(cc.dueDate<=nw);}else{return cc.dueDate>cd&&cc.dueDate<=cd+7;}}).map(cc=>({id:cc.id,name:cc.name,dueDate:cc.dueDate,type:'Credit Card Due'}));},[creditCards]);
    const shortTermInstallmentReminders = useMemo(()=>shortTermLiabilities.map(stl=>({...stl,stats:calculateShortTermLiabilityStats(stl)})).filter(stl=>stl.stats.nextInstallmentDueDate&&new Date(stl.stats.nextInstallmentDueDate+"T00:00:00")<=new Date(new Date().setDate(new Date().getDate()+7))&&stl.stats.status!==ShortTermLiabilityStatus.PAID).map(stl=>({id:stl.id,name:stl.name,dueDate:stl.stats.nextInstallmentDueDate,amount:stl.stats.monthlyInstallmentAmount,type:'STL Installment Due'})),[shortTermLiabilities]);
    const upcomingRecurringTransactions = useMemo(()=>recurringTransactions.filter(rt=>rt.isActive&&new Date(rt.nextDueDate+"T00:00:00")<=new Date(new Date().setDate(new Date().getDate()+7))).sort((a,b)=>new Date(a.nextDueDate).getTime()-new Date(b.nextDueDate).getTime()),[recurringTransactions]);
    const dueRecurringTransactions = useMemo(()=>upcomingRecurringTransactions.filter(rt=>new Date(rt.nextDueDate+"T00:00:00")<=new Date(new Date().toISOString().split('T')[0]+"T23:59:59")),[upcomingRecurringTransactions]);
    const allRemindersCount = creditCardReminders.length+shortTermInstallmentReminders.length+dueRecurringTransactions.length;
    const handleProcessDueRecurring = ()=>{const ids=dueRecurringTransactions.map(rt=>rt.id);processRecurringTransactions(ids);};
    return (<CollapsibleSection title="Reminders & Upcoming" icon="fa-bell" defaultOpen={true} badgeCount={allRemindersCount}>{(creditCardReminders.length+shortTermInstallmentReminders.length+upcomingRecurringTransactions.length)===0?(<p className="text-sm text-gray-500 dark:text-gray-400">No reminders/upcoming (next 7 days).</p>):(<div className="space-y-3">{creditCardReminders.map(r=>(<div key={`cc-${r.id}`} className="p-2 bg-yellow-50 dark:bg-yellow-800/30 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-r-md"><p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">{r.name} payment due on {r.dueDate}{r.dueDate?(r.dueDate%10===1&&r.dueDate!==11?'st':r.dueDate%10===2&&r.dueDate!==12?'nd':r.dueDate%10===3&&r.dueDate!==13?'rd':'th'):''} of month.</p></div>))}{shortTermInstallmentReminders.map(r=>(<div key={`stl-${r.id}`} className="p-2 bg-orange-50 dark:bg-orange-800/30 border-l-4 border-orange-400 dark:border-orange-600 rounded-r-md"><p className="text-sm font-medium text-orange-700 dark:text-orange-300">{r.name} installment of {formatCurrency(r.amount||0)} due on {formatDateReadable(r.dueDate)}.</p></div>))}{upcomingRecurringTransactions.length>0&&(<div><h5 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Upcoming Recurring:</h5><ul className="space-y-1">{upcomingRecurringTransactions.map(rt=>(<li key={`rt-${rt.id}`} className={`p-1.5 rounded-md text-xs ${rt.type===TransactionType.INCOME?'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300':'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>{rt.description} ({formatCurrency(rt.amount)}) on {formatDateReadable(rt.nextDueDate)}{dueRecurringTransactions.some(drt=>drt.id===rt.id)&&<Button size="xs" variant="outline" className="ml-2 py-0.5 px-1 border-gray-400 text-gray-500 hover:bg-gray-200" onClick={handleProcessDueRecurring}>Process</Button>}</li>))}</ul></div>)}</div>)}</CollapsibleSection>);
};

// FinancialGoalsProgress Widget
const FinancialGoalsProgressWidget: React.FC = () => {
    const context = useContext(AppContext);
    if(!context) return null;
    const { financialGoals, formatCurrency } = context;
    const topFinancialGoals = useMemo(() => [...financialGoals].filter(g=>g.currentAmount<g.targetAmount).sort((a,b)=>{ const progA=a.targetAmount>0?(a.currentAmount/a.targetAmount):0; const progB=b.targetAmount>0?(b.currentAmount/b.targetAmount):0; return progB-progA; }).slice(0,3),[financialGoals]);
    return (
        <CollapsibleSection title="Financial Goals Progress" icon="fa-bullseye" defaultOpen={true} actionButton={<ReactRouterDOM.Link to="/goals/new"><Button variant="primary" size="sm" leftIcon={<i className="fas fa-plus"></i>}>Add Goal</Button></ReactRouterDOM.Link>}>
            {topFinancialGoals.length>0?(<div className="space-y-4">{topFinancialGoals.map(g=>(<div key={g.id}><div className="flex justify-between text-sm mb-1"><span className="font-medium text-dark dark:text-gray-100">{g.name}</span><span className="text-gray-600 dark:text-gray-300">{formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}</span></div><ProgressBar value={(g.currentAmount/g.targetAmount)*100}/></div>))}</div>):financialGoals.length>0&&financialGoals.every(g=>g.currentAmount>=g.targetAmount)?(<p className="text-sm text-green-600 dark:text-green-400">All goals achieved!</p>):(<p className="text-sm text-gray-500 dark:text-gray-400">No active goals. Set targets!</p>)}
            <ReactRouterDOM.Link to="/goals" className="text-sm text-primary hover:underline mt-3 block text-right">View All Goals &rarr;</ReactRouterDOM.Link>
        </CollapsibleSection>
    );
};

// CashFlowProjection Widget
const CashFlowProjectionWidget: React.FC = () => {
    const context = useContext(AppContext);
    if(!context) return null;
    const { bankAccounts, cashBalance, calculateCashFlowProjection, formatCurrency } = context;
    const [selectedProjectionAccountIds, setSelectedProjectionAccountIds] = useState<string[]>([]);
    const [projectionOutput, setProjectionOutput] = useState<DailyCashFlowProjection[]|null>(null);
    const [isProjecting, setIsProjecting] = useState<boolean>(false);
    const handleProjectCashFlow = async () => {setIsProjecting(true);setProjectionOutput(null);try{const data=await calculateCashFlowProjection(7,selectedProjectionAccountIds);setProjectionOutput(data);}catch(e){console.error(e);}finally{setIsProjecting(false);}};
    const handleProjectionAccountToggle = (id:string)=>{setSelectedProjectionAccountIds(p=>p.includes(id)?p.filter(i=>i!==id):[...p,id]);};
    return (<CollapsibleSection title="Cash Flow Projection (Next 7 Days)" icon="fa-binoculars" defaultOpen={false}><div className="space-y-3"><p className="text-sm text-gray-600 dark:text-gray-300">Select accounts to include:</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs"><div className="flex items-center"><input type="checkbox" id="proj-cash" checked={selectedProjectionAccountIds.includes('cash')} onChange={()=>handleProjectionAccountToggle('cash')} className="form-checkbox h-3.5 w-3.5 text-primary focus:ring-primary rounded"/><label htmlFor="proj-cash" className="ml-1.5 text-gray-700 dark:text-gray-300">Cash ({formatCurrency(cashBalance)})</label></div>{bankAccounts.map(acc=>(<div key={`proj-${acc.id}`} className="flex items-center"><input type="checkbox" id={`proj-${acc.id}`} checked={selectedProjectionAccountIds.includes(acc.id)} onChange={()=>handleProjectionAccountToggle(acc.id)} className="form-checkbox h-3.5 w-3.5 text-primary focus:ring-primary rounded"/><label htmlFor={`proj-${acc.id}`} className="ml-1.5 text-gray-700 dark:text-gray-300 truncate" title={`${acc.accountName} (${formatCurrency(acc.currentBalance)})`}>{acc.accountName} ({formatCurrency(acc.currentBalance)})</label></div>))}</div><Button onClick={handleProjectCashFlow} isLoading={isProjecting} disabled={isProjecting||selectedProjectionAccountIds.length===0} variant="secondary" leftIcon={<i className="fas fa-rocket"></i>}>Project</Button>{isProjecting&&<p className="text-sm text-blue-600 dark:text-blue-400">Calculating...</p>}{projectionOutput&&(<div className="mt-4 space-y-2 text-xs max-h-60 overflow-y-auto">{projectionOutput.map(d=>(<div key={d.date} className="p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50"><p className="font-semibold text-gray-800 dark:text-gray-100">{formatDateReadable(d.date)}: Start <span className={d.startOfDayBalance<0?'text-red-500':'text-green-500'}>{formatCurrency(d.startOfDayBalance)}</span> &rarr; End <span className={d.endOfDayBalance<0?'text-red-500':'text-green-500'}>{formatCurrency(d.endOfDayBalance)}</span></p>{d.events.length>0&&(<ul className="list-disc pl-4 mt-1 text-gray-600 dark:text-gray-300">{d.events.map((ev,i)=>(<li key={i} className={`${ev.type==='inflow'?'text-green-600 dark:text-green-400':'text-red-600 dark:text-red-400'}`}>{ev.description} ({formatCurrency(ev.amount)})</li>))}</ul>)}</div>))}</div>)}</div></CollapsibleSection>);
};

// FinancialHealthSettings Widget
const FinancialHealthSettingsWidget: React.FC = () => {
    const context = useContext(AppContext);
    if(!context) return null;
    const { userSettings, updateUserSettings, bankAccounts, cashBalance, formatCurrency } = context;
    const [localSettings, setLocalSettings] = useState<Partial<UserSettings>>(userSettings);
    const [efAccountIds, setEfAccountIds] = useState<string[]>(userSettings.emergencyFundAccountIds||[]);
    useEffect(()=>{setLocalSettings(userSettings);setEfAccountIds(userSettings.emergencyFundAccountIds||[]);},[userSettings]);
    const handleChange=(f:keyof UserSettings,v:string|number|string[])=>{setLocalSettings(p=>({...p,[f]:v===''?undefined:v}));};
    const handleEfAccChange=(id:string)=>{setEfAccountIds(p=>p.includes(id)?p.filter(i=>i!==id):[...p,id]);};
    const saveSettings=()=>{const s:Partial<UserSettings>={emergencyFundTargetMonths:localSettings.emergencyFundTargetMonths!==undefined?Number(localSettings.emergencyFundTargetMonths):userSettings.emergencyFundTargetMonths,grossMonthlyIncome:localSettings.grossMonthlyIncome!==undefined?Number(localSettings.grossMonthlyIncome):userSettings.grossMonthlyIncome,emergencyFundAccountIds:efAccountIds,savingsRateTarget:localSettings.savingsRateTarget!==undefined?Number(localSettings.savingsRateTarget):userSettings.savingsRateTarget,};updateUserSettings(s);};    
    return (<CollapsibleSection title="Financial Health Settings" icon="fa-cogs" defaultOpen={false}><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-1"><Input label="Gross Monthly Income" type="number" value={localSettings.grossMonthlyIncome?.toString()||''} onChange={e=>handleChange('grossMonthlyIncome',e.target.value)} placeholder="e.g., 50000" containerClassName="mb-0"/><Input label="EF Target (Months)" type="number" value={localSettings.emergencyFundTargetMonths?.toString()||''} onChange={e=>handleChange('emergencyFundTargetMonths',e.target.value)} placeholder="e.g., 3" min="0" containerClassName="mb-0"/><Input label="Savings Target (%)" type="number" value={localSettings.savingsRateTarget?.toString()||''} onChange={e=>handleChange('savingsRateTarget',e.target.value)} placeholder="e.g., 20" min="0" max="100" containerClassName="mb-0"/><div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">EF Accounts</label><div className="space-y-1"><div className="flex items-center"><input type="checkbox" id="ef-cash" checked={efAccountIds.includes('cash')} onChange={()=>handleEfAccChange('cash')} className="form-checkbox h-4 w-4 text-primary focus:ring-primary rounded"/><label htmlFor="ef-cash" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Cash ({formatCurrency(cashBalance)})</label></div>{bankAccounts.map(acc=>(<div key={acc.id} className="flex items-center"><input type="checkbox" id={`ef-${acc.id}`} checked={efAccountIds.includes(acc.id)} onChange={()=>handleEfAccChange(acc.id)} className="form-checkbox h-4 w-4 text-primary focus:ring-primary rounded"/><label htmlFor={`ef-${acc.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">{acc.accountName} ({formatCurrency(acc.currentBalance)})</label></div>))}</div></div></div><div className="mt-5 flex justify-end"><Button onClick={saveSettings} variant="primary" leftIcon={<i className="fas fa-save"></i>}>Save Settings</Button></div></CollapsibleSection>);
};


const DashboardScreen: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) return <div className="flex items-center justify-center min-h-screen"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i><span className="ml-3 text-lg">Loading context...</span></div>;
  const { isLoading, userSettings, openDashboardCustomizationModal } = context;

  const availableWidgets: Record<string, React.FC> = {
    summary_cards: SummaryCardsWidget,
    financial_health_quick_check: FinancialHealthQuickCheckWidget,
    recent_transactions: RecentTransactionsWidget,
    active_budgets_overview: ActiveBudgetsOverviewWidget,
    income_vs_expenditure_chart: IncomeVsExpenditureChartWidget,
    expenditure_breakdown_pie_chart: ExpensePieChartWidget,
    reminders_upcoming: RemindersUpcomingWidget,
    financial_goals_progress: FinancialGoalsProgressWidget,
    cash_flow_projection: CashFlowProjectionWidget,
    financial_health_settings: FinancialHealthSettingsWidget,
  };
  
  const visibleWidgets = useMemo(() => {
    return (userSettings.dashboardWidgets || [])
        .filter(widget => widget.isVisible)
        .sort((a, b) => a.order - b.order);
  }, [userSettings.dashboardWidgets]);


  if (isLoading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i><span className="ml-3 text-xl">Loading dashboard...</span></div>;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6 flex justify-between items-center">
        <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-dark dark:text-gray-100 mb-1">Dashboard</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Welcome back! Here's your financial overview.</p>
        </div>
        <Button 
            variant="outline" 
            size="sm" 
            onClick={openDashboardCustomizationModal}
            leftIcon={<i className="fas fa-edit"></i>}
            title="Customize Dashboard Layout"
        >
            Customize
        </Button>
      </header>
      
      {visibleWidgets.map(widgetConfig => {
        const WidgetComponent = availableWidgets[widgetConfig.id];
        return WidgetComponent ? <WidgetComponent key={widgetConfig.id} /> : null;
      })}

    </div>
  );
};
export default DashboardScreen;
    