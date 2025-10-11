
import React, { useContext, useState, ChangeEvent, useRef, useEffect, useMemo } from 'react';
import { AppContext } from '../App.tsx';
import Button from './ui/Button.tsx';
import Select from './ui/Select.tsx';
import Input from './ui/Input.tsx';
import { Transaction, TransactionType } from '../types.ts';
import { formatDateReadable, getTaxYearDateRange, getFirstDayOfCurrentMonth } from '../constants.ts';
import CollapsibleSection from './ui/CollapsibleSection.tsx'; 

// LeaseLoanCalculatorComponent (no changes needed for this specific feature)
const LeaseLoanCalculatorComponent: React.FC = () => {
    const [loanAmount, setLoanAmount] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [loanTerm, setLoanTerm] = useState('');
    const [monthlyPayment, setMonthlyPayment] = useState<string | null>(null);
    const [totalPrincipal, setTotalPrincipal] = useState<string | null>(null);
    const [totalInterest, setTotalInterest] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const context = useContext(AppContext);

    const calculatePayment = () => {
        setError('');
        setMonthlyPayment(null);
        setTotalPrincipal(null);
        setTotalInterest(null);

        const P = parseFloat(loanAmount);
        const r_annual = parseFloat(interestRate);
        const t_years = parseFloat(loanTerm);

        if (isNaN(P) || P <= 0) { setError('Loan Amount must be positive.'); return; }
        if (isNaN(r_annual) || r_annual < 0) { setError('Annual Interest Rate must be non-negative.'); return; }
        if (isNaN(t_years) || t_years <= 0) { setError('Loan Term must be positive.'); return; }
        
        const n_months = t_years * 12;
        setTotalPrincipal(P.toFixed(2));

        if (r_annual === 0) {
            const M = P / n_months;
            setMonthlyPayment(M.toFixed(2));
            setTotalInterest('0.00');
        } else {
            const r_monthly = r_annual / 100 / 12;
            const M = P * (r_monthly * Math.pow(1 + r_monthly, n_months)) / (Math.pow(1 + r_monthly, n_months) - 1);
            if (isNaN(M) || !isFinite(M)) {
                setError('Could not calculate payment. Check inputs.');
                return;
            }
            setMonthlyPayment(M.toFixed(2));
            const totalPaid = M * n_months;
            setTotalInterest((totalPaid - P).toFixed(2));
        }
    };
    return (
        <div className="space-y-3 p-1">
            <Input label="Loan Amount (Principal)" type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} placeholder="e.g., 10000" step="0.01" min="0.01" />
            <Input label="Annual Interest Rate (%)" type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="e.g., 5" step="0.01" min="0" />
            <Input label="Loan Term (Years)" type="number" value={loanTerm} onChange={e => setLoanTerm(e.target.value)} placeholder="e.g., 5" step="1" min="1" />
            <Button onClick={calculatePayment} variant="secondary" className="w-full sm:w-auto" leftIcon={<i className="fas fa-calculator"></i>}>Calculate</Button>
            {error && <p className="text-xs text-danger dark:text-red-400 mt-2">{error}</p>}
            {monthlyPayment !== null && context && (
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md space-y-1">
                    <p className="text-sm font-semibold text-primary dark:text-primary-light">Estimated Monthly Payment: {context.formatCurrency(parseFloat(monthlyPayment))}</p>
                    {totalPrincipal !== null && <p className="text-xs text-gray-600 dark:text-gray-300">Total Principal Paid: {context.formatCurrency(parseFloat(totalPrincipal))}</p>}
                    {totalInterest !== null && <p className="text-xs text-gray-600 dark:text-gray-300">Total Interest Paid: {context.formatCurrency(parseFloat(totalInterest))}</p>}
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">Note: This is an estimation. Actual lender terms may vary.</p>
                </div>
            )}
        </div>
    );
};

interface PayeeSpendingData {
  payeeName: string;
  totalAmount: number;
  transactionCount: number;
}

const ReportsScreen: React.FC = () => {
  const context = useContext(AppContext);
  
  const [selectedTaxYear, setSelectedTaxYear] = useState<string>("");
  const [taxSummaryData, setTaxSummaryData] = useState<{ income: Array<{ categoryName: string; totalAmount: number; transactions: Transaction[] }>; expenses: Array<{ categoryName: string; totalAmount: number; transactions: Transaction[] }> } | null>(null);
  
  const [importedFileContent, setImportedFileContent] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // State for Payee Report
  const [payeeReportStartDate, setPayeeReportStartDate] = useState<string>(getFirstDayOfCurrentMonth());
  const [payeeReportEndDate, setPayeeReportEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calculatedPayeeSpendingData, setCalculatedPayeeSpendingData] = useState<PayeeSpendingData[]>([]);


  useEffect(() => { 
    if (!selectedTaxYear) {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; 
        if (currentMonth >= 4) { 
            setSelectedTaxYear(`${currentYear}/${currentYear + 1}`);
        } else {
            setSelectedTaxYear(`${currentYear - 1}/${currentYear}`);
        }
    }
  }, [selectedTaxYear]);


  if (!context) return <div className="flex items-center justify-center min-h-screen"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i><span className="ml-3 text-lg">Loading context...</span></div>;
  const { transactions, exportTransactionsToCSV, isLoading, getTaxSummaryData, formatCurrency, getCategoryName, exportAllDataToJson, importAllDataFromJson, notifyWarning, notifySuccess, notifyError, notifyInfo } = context;

  const taxYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const options = [];
    if (new Date().getMonth() >= 3) { 
        options.push({ value: `${currentYear}/${currentYear + 1}`, label: `${currentYear}/${currentYear + 1} (Apr ${currentYear} - Mar ${currentYear + 1})` });
    } else { 
         options.push({ value: `${currentYear - 1}/${currentYear}`, label: `${currentYear - 1}/${currentYear} (Apr ${currentYear-1} - Mar ${currentYear})` });
    }
    for (let i = 0; i < 5; i++) {
        const endYear = (new Date().getMonth() >= 3) ? currentYear - i : currentYear -1 - i;
        const startYear = endYear - 1;
        if (!options.find(opt => opt.value === `${startYear}/${endYear}`)) { 
             options.push({ value: `${startYear}/${endYear}`, label: `${startYear}/${endYear} (Apr ${startYear} - Mar ${endYear})` });
        }
    }
    return options.sort((a,b) => b.value.localeCompare(a.value)); 
  }, []);
  
  const handleGenerateTaxSummary = () => {
    if (!selectedTaxYear) {
      notifyWarning("Please select a tax year.");
      return;
    }
    const summary = getTaxSummaryData(selectedTaxYear);
    setTaxSummaryData(summary);
    notifySuccess("Tax summary generated!");
  };

  const exportTaxSummaryToCSV = () => {
    if (!taxSummaryData || (!taxSummaryData.income.length && !taxSummaryData.expenses.length)) {
      notifyWarning("No tax summary data to export. Please generate the summary first.");
      return;
    }
    const rows = [["Type", "Category", "Transaction Date", "Description", "Payee", "Amount"]];
    
    const processItems = (items: Array<{ categoryName: string; totalAmount: number; transactions: Transaction[] }>, type: string) => {
        items.forEach(cat => {
            cat.transactions.forEach(t => {
                rows.push([
                    type, 
                    cat.categoryName, 
                    t.date, 
                    `"${t.description.replace(/"/g, '""')}"`, 
                    `"${t.payee?.replace(/"/g, '""') || ''}"`, 
                    t.amount.toString()
                ]);
            });
        });
    };

    processItems(taxSummaryData.income, "Income");
    processItems(taxSummaryData.expenses, "Expense (Potential Deduction)");
    
    const grandTotalIncome = taxSummaryData.income.reduce((sum, item) => sum + item.totalAmount, 0);
    const grandTotalDeductions = taxSummaryData.expenses.reduce((sum, item) => sum + item.totalAmount, 0);
    rows.push([]); 
    rows.push(["Grand Total Taxable Income", "", "", "", "", grandTotalIncome.toString()]);
    rows.push(["Grand Total Potential Deductions", "", "", "", "", grandTotalDeductions.toString()]);


    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tax_summary_${selectedTaxYear.replace('/', '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifySuccess("Tax summary exported to CSV!");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImportedFileContent(e.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      setImportedFileContent(null);
    }
  };

  const handleImportData = async () => {
    if (!importedFileContent) {
      notifyWarning("Please select a backup file to import.");
      return;
    }
    setIsImporting(true);
    const success = await importAllDataFromJson(importedFileContent); 
    // Toasts for success/error are handled within importAllDataFromJson
    
    if (success) {
      // The success toast within importAllDataFromJson already mentions the reload.
      setTimeout(() => window.location.reload(), 3500); // Give user time to read toast
    }
    setIsImporting(false);
    setImportedFileContent(null); 
    if (importFileInputRef.current) {
      importFileInputRef.current.value = ""; 
    }
  };

  const handleGeneratePayeeReport = () => {
    if (!payeeReportStartDate || !payeeReportEndDate) {
      notifyWarning("Please select both start and end dates for the payee report.");
      return;
    }
    if (new Date(payeeReportStartDate) > new Date(payeeReportEndDate)) {
        notifyWarning("Start date cannot be after end date for the payee report.");
        return;
    }

    const payeeMap: { [payee: string]: { totalAmount: number; transactionCount: number } } = {};

    transactions.forEach(t => {
        if (t.payee && t.type === TransactionType.EXPENSE && t.date >= payeeReportStartDate && t.date <= payeeReportEndDate) {
            const payeeKey = t.payee.trim().toLowerCase();
            if (!payeeMap[payeeKey]) {
                payeeMap[payeeKey] = { totalAmount: 0, transactionCount: 0 };
            }
            payeeMap[payeeKey].totalAmount += t.amount;
            payeeMap[payeeKey].transactionCount += 1;
        }
    });
    
    const reportData = Object.entries(payeeMap)
        .map(([payeeNameKey, data]) => {
            // Attempt to find original casing for payee name from first transaction
            const originalPayeeCasing = transactions.find(t => t.payee?.trim().toLowerCase() === payeeNameKey)?.payee || payeeNameKey;
            return {
                payeeName: originalPayeeCasing,
                ...data,
            };
        })
        .sort((a, b) => b.totalAmount - a.totalAmount);

    setCalculatedPayeeSpendingData(reportData);
    if(reportData.length > 0) notifySuccess("Spending by Payee report generated!");
    else notifyInfo("No spending data found for the selected payees and period.");
  };


  if (isLoading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i><span className="ml-3 text-xl">Loading reports...</span></div>;

  return (
    <div className="space-y-8">
      <header className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6">
        <h2 className="text-2xl sm:text-3xl font-semibold text-dark dark:text-gray-100">Financial Reports & Tools</h2>
      </header>

      <CollapsibleSection title="Transaction Data Export" icon="fa-file-csv" defaultOpen={false}>
        <div className="p-1">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Export all your transaction data to a CSV file for external analysis or record-keeping.</p>
            <Button onClick={exportTransactionsToCSV} variant="primary" leftIcon={<i className="fas fa-download"></i>}>
                Export All Transactions to CSV
            </Button>
        </div>
      </CollapsibleSection>
      
      <CollapsibleSection title="Tax Summary Report" icon="fa-landmark" defaultOpen={false}>
        <div className="space-y-4 p-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">Generate a summary of potentially tax-relevant income and expenses for a specific tax year (typically April 1st to March 31st for Sri Lanka).</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <Select
                    label="Select Tax Year"
                    id="taxYearSelector"
                    value={selectedTaxYear}
                    onChange={e => setSelectedTaxYear(e.target.value)}
                    options={taxYearOptions}
                    containerClassName="mb-0"
                />
                <Button onClick={handleGenerateTaxSummary} variant="secondary" className="w-full sm:w-auto" leftIcon={<i className="fas fa-calculator"></i>}>Generate Summary</Button>
            </div>

            {taxSummaryData && (
            <div className="mt-6 space-y-4">
                <div className="flex justify-end">
                    <Button onClick={exportTaxSummaryToCSV} variant="outline" size="sm" leftIcon={<i className="fas fa-file-excel"></i>}>Export Summary to CSV</Button>
                </div>
                <div>
                <h4 className="text-lg font-semibold text-green-600 mb-2">Potentially Taxable Income</h4>
                {taxSummaryData.income.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                    {taxSummaryData.income.map(item => (
                        <li key={`inc-${item.categoryName}`}>
                        <strong>{item.categoryName}:</strong> {formatCurrency(item.totalAmount)} ({item.transactions.length} transaction(s))
                        </li>
                    ))}
                    <li className="font-bold mt-2">Total Taxable Income: {formatCurrency(taxSummaryData.income.reduce((sum, item) => sum + item.totalAmount, 0))}</li>
                    </ul>
                ) : <p className="text-sm text-gray-500 dark:text-gray-400">No taxable income found for this period.</p>}
                </div>
                <div>
                <h4 className="text-lg font-semibold text-blue-600 mb-2">Potential Deductions</h4>
                {taxSummaryData.expenses.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                    {taxSummaryData.expenses.map(item => (
                        <li key={`exp-${item.categoryName}`}>
                        <strong>{item.categoryName}:</strong> {formatCurrency(item.totalAmount)} ({item.transactions.length} transaction(s))
                        </li>
                    ))}
                    <li className="font-bold mt-2">Total Potential Deductions: {formatCurrency(taxSummaryData.expenses.reduce((sum, item) => sum + item.totalAmount, 0))}</li>
                    </ul>
                ) : <p className="text-sm text-gray-500 dark:text-gray-400">No potential deductions found for this period.</p>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">Disclaimer: This summary is based on data you entered and default category tax relevance. It is for informational purposes only and NOT professional tax advice. Consult a tax advisor for accurate filings.</p>
            </div>
            )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Spending by Payee/Merchant" icon="fa-store" defaultOpen={false}>
        <div className="space-y-4 p-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">Analyze your spending with specific payees or merchants within a date range.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <Input label="Start Date" type="date" value={payeeReportStartDate} onChange={e => setPayeeReportStartDate(e.target.value)} containerClassName="mb-0" />
                <Input label="End Date" type="date" value={payeeReportEndDate} onChange={e => setPayeeReportEndDate(e.target.value)} containerClassName="mb-0" min={payeeReportStartDate || undefined} />
                <Button onClick={handleGeneratePayeeReport} variant="secondary" className="w-full sm:w-auto" leftIcon={<i className="fas fa-chart-pie"></i>}>Generate Payee Report</Button>
            </div>
             {calculatedPayeeSpendingData.length > 0 && (
                <div className="mt-6 max-h-96 overflow-y-auto">
                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Top Spending by Payee ({formatDateReadable(payeeReportStartDate)} - {formatDateReadable(payeeReportEndDate)}):</h4>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {calculatedPayeeSpendingData.map(item => (
                            <li key={item.payeeName} className="py-2.5 px-1 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700/30 rounded-md">
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.payeeName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.transactionCount} transaction(s)</p>
                                </div>
                                <span className="text-sm font-semibold text-danger">{formatCurrency(item.totalAmount)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {calculatedPayeeSpendingData.length === 0 && payeeReportStartDate && payeeReportEndDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">No spending data found for payees in the selected period, or payees were not specified in transactions.</p>
            )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Loan & Lease Payment Calculator" icon="fa-calculator" defaultOpen={false}>
            <LeaseLoanCalculatorComponent />
      </CollapsibleSection>

      <CollapsibleSection title="Data Backup & Restore" icon="fa-database" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
            <div className="space-y-3">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">Backup All Application Data</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">Create a JSON backup file of all your financial data. Store this file securely.</p>
                <Button onClick={exportAllDataToJson} variant="primary" leftIcon={<i className="fas fa-cloud-download-alt"></i>}>
                    Export All Data (.json)
                </Button>
            </div>
            <div className="space-y-3">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">Restore Application Data</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">Restore data from a previously created JSON backup file. <strong className="text-danger">Warning: This will overwrite ALL current data in the application.</strong></p>
                <Input 
                    type="file" 
                    accept=".json" 
                    onChange={handleFileChange} 
                    inputRef={importFileInputRef}
                    containerClassName="mb-0"
                    className="text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary dark:file:bg-primary/80 dark:file:text-white hover:file:bg-primary/20"
                />
                <Button 
                    onClick={handleImportData} 
                    variant="danger" 
                    isLoading={isImporting}
                    disabled={!importedFileContent || isImporting}
                    leftIcon={<i className="fas fa-cloud-upload-alt"></i>}
                >
                    {isImporting ? "Importing..." : "Import from .json File"}
                </Button>
            </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default ReportsScreen;
