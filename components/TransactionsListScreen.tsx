
import React, { useContext, useState, useMemo, ChangeEvent, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { Transaction, TransactionType, PaymentMethod } from '../types.ts';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import Select from './ui/Select.tsx';
import { formatDateReadable, PAYMENT_METHOD_OPTIONS } from '../constants.ts';

// jsPDF is available globally via window.jspdf.jsPDF due to script tag in index.html

type SortKey = 'date' | 'description' | 'amount' | 'categoryId';
interface SortConfig {
  key: SortKey;
  direction: 'ascending' | 'descending';
}

const ITEMS_PER_PAGE = 20; 

interface TransactionsListLocationState {
  filterCategoryId?: string;
  filterStartDate?: string;
  filterEndDate?: string;
  filterType?: TransactionType | string; // Allow string for type from state
}

const TransactionsListScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = ReactRouterDOM.useNavigate();
  const location = ReactRouterDOM.useLocation(); // Added useLocation

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterMinAmount, setFilterMinAmount] = useState<string>('');
  const [filterMaxAmount, setFilterMaxAmount] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [filterType, setFilterType] = useState<string>(''); 
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('');
  const [filterIsTaxRelevant, setFilterIsTaxRelevant] = useState<string>(''); 

  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'date', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState<number>(1);


  if (!context) return <div className="flex items-center justify-center min-h-screen"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i><span className="ml-3 text-lg">Loading context...</span></div>;
  const { transactions, deleteTransaction, getCategoryName, isLoading, formatCurrency, getBankAccountById, getCreditCardById, categories, openReceiptScannerModal, notifySuccess, notifyWarning, notifyInfo } = context;

  // Apply filters from navigation state
  useEffect(() => {
    const navState = location.state as TransactionsListLocationState | null;
    if (navState && (navState.filterCategoryId || navState.filterStartDate || navState.filterEndDate || navState.filterType)) {
      let filtersApplied = false;
      if (navState.filterCategoryId) { setFilterCategoryId(navState.filterCategoryId); filtersApplied = true; }
      if (navState.filterStartDate) { setFilterStartDate(navState.filterStartDate); filtersApplied = true; }
      if (navState.filterEndDate) { setFilterEndDate(navState.filterEndDate); filtersApplied = true; }
      if (navState.filterType) { setFilterType(navState.filterType as string); filtersApplied = true; }
      
      // Clear the state to prevent re-applying on refresh or back navigation to this screen
      navigate(location.pathname, { replace: true, state: null });
      if (filtersApplied) notifyInfo("Filters applied from dashboard drill-down.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]); // Only depend on location.state

  useEffect(() => { setCurrentPage(1); }, [filterStartDate, filterEndDate, filterMinAmount, filterMaxAmount, filterCategoryId, filterType, filterPaymentMethod, filterIsTaxRelevant, sortConfig]);

  const isAnyFilterActive = useMemo(() => {
    return Boolean(filterStartDate || filterEndDate || filterMinAmount || filterMaxAmount || filterCategoryId || filterType || filterPaymentMethod || filterIsTaxRelevant);
  }, [filterStartDate, filterEndDate, filterMinAmount, filterMaxAmount, filterCategoryId, filterType, filterPaymentMethod, filterIsTaxRelevant]);


  const processedTransactionsData = useMemo(() => {
    let filtered = [...transactions];

    if (filterStartDate) filtered = filtered.filter(t => t.date >= filterStartDate);
    if (filterEndDate) filtered = filtered.filter(t => t.date <= filterEndDate);
    if (filterMinAmount) filtered = filtered.filter(t => t.amount >= parseFloat(filterMinAmount));
    if (filterMaxAmount) filtered = filtered.filter(t => t.amount <= parseFloat(filterMaxAmount));
    
    if (filterCategoryId) {
        filtered = filtered.filter(t => {
            if (t.isSplit && t.splits) {
                return t.splits.some(s => s.categoryId === filterCategoryId);
            }
            return t.categoryId === filterCategoryId;
        });
    }
    if (filterType) filtered = filtered.filter(t => t.type === filterType);
    if (filterPaymentMethod) filtered = filtered.filter(t => t.paymentMethod === filterPaymentMethod);
    if (filterIsTaxRelevant) {
        if (filterIsTaxRelevant === 'yes') filtered = filtered.filter(t => t.isTaxRelevant);
        if (filterIsTaxRelevant === 'no') filtered = filtered.filter(t => !t.isTaxRelevant);
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: string | number = a[sortConfig.key];
        let bValue: string | number = b[sortConfig.key];

        if (sortConfig.key === 'categoryId') { // Sorting by primary category if not split
            aValue = getCategoryName(a.categoryId);
            bValue = getCategoryName(b.categoryId);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (sortConfig.key === 'date') { 
            return sortConfig.direction === 'ascending' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    
    const totalFilteredItems = filtered.length;
    const totalPages = Math.ceil(totalFilteredItems / ITEMS_PER_PAGE);
    const paginatedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return { paginatedTransactions: paginatedItems, totalPages, totalFilteredItems, allFilteredTransactions: filtered };

  }, [transactions, filterStartDate, filterEndDate, filterMinAmount, filterMaxAmount, filterCategoryId, filterType, filterPaymentMethod, filterIsTaxRelevant, sortConfig, getCategoryName, currentPage]);

  const { paginatedTransactions, totalPages, totalFilteredItems, allFilteredTransactions } = processedTransactionsData;


  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
        setSortConfig({ key: 'date', direction: 'descending' }); 
        return;
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return <i className="fas fa-sort text-gray-300 dark:text-gray-500 ml-1"></i>;
    return sortConfig.direction === 'ascending' ? <i className="fas fa-sort-up ml-1 text-primary"></i> : <i className="fas fa-sort-down ml-1 text-primary"></i>;
  };

  const resetFilters = () => {
    setFilterStartDate(''); setFilterEndDate(''); setFilterMinAmount(''); setFilterMaxAmount('');
    setFilterCategoryId(''); setFilterType(''); setFilterPaymentMethod(''); setFilterIsTaxRelevant('');
    setSortConfig({ key: 'date', direction: 'descending' });
    setCurrentPage(1);
  };

  const handleDeleteClick = (transaction: Transaction) => { 
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };
  const confirmDelete = () => { 
    if (transactionToDelete) {
        deleteTransaction(transactionToDelete.id);
    }
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  };
  
  const categoryOptions = [{value: '', label: 'All Categories'}, ...categories.map(c => ({value: c.id, label: c.name}))];
  const typeOptions = [{value: '', label: 'All Types'}, {value: TransactionType.INCOME, label: 'Income'}, {value: TransactionType.EXPENSE, label: 'Expense'}];
  const paymentMethodFilterOptions = [{value: '', label: 'All Methods'}, ...PAYMENT_METHOD_OPTIONS];
  const taxRelevantOptions = [{value: '', label: 'All (Tax Status)'}, {value: 'yes', label: 'Tax Relevant: Yes'}, {value: 'no', label: 'Tax Relevant: No'}];

  const handlePreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  const handleExportToCSV = () => {
    if (!filterStartDate || !filterEndDate) {
      notifyWarning("Date range is required for CSV export. Please select a start and end date.");
      return;
    }
    if (allFilteredTransactions.length === 0) {
      notifyWarning("No transactions to export based on current filters.");
      return;
    }
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category (Primary/Split Details)', 'Payment Method', 'Bank Account', 'Credit Card', 'Tax Relevant', 'Payee', 'Notes'];
    const csvRows = [headers.join(',')];
    allFilteredTransactions.forEach(t => {
      const mainCategory = t.isSplit ? 'Split Transaction' : getCategoryName(t.categoryId);
      let splitDetails = '';
      if (t.isSplit && t.splits) {
        splitDetails = t.splits.map(s => `${getCategoryName(s.categoryId)}: ${s.amount}${s.description ? ' ('+s.description+')' : ''}`).join('; ');
      }
      const categoryColumn = t.isSplit ? `${mainCategory} [${splitDetails}]` : mainCategory;

      const row = [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`, 
        t.amount.toString(),
        t.type,
        `"${categoryColumn.replace(/"/g, '""')}"`,
        t.paymentMethod,
        t.bankAccountId ? getBankAccountById(t.bankAccountId)?.accountName || 'N/A' : '',
        t.creditCardId ? getCreditCardById(t.creditCardId)?.name || 'N/A' : '',
        t.isTaxRelevant ? 'Yes' : 'No',
        `"${t.payee?.replace(/"/g, '""') || ''}"`,
        `"${t.notes?.replace(/"/g, '""') || ''}"`
      ];
      csvRows.push(row.join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `transactions_export_${filterStartDate}_to_${filterEndDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notifySuccess("Filtered transactions exported to CSV!");
    }
  };

  const handleExportToPDF = () => {
    if (!filterStartDate || !filterEndDate) {
      notifyWarning("Date range is required for PDF export. Please select a start and end date.");
      return;
    }
    if (allFilteredTransactions.length === 0) {
      notifyWarning("No transactions to export based on current filters.");
      return;
    }
    const doc = new (window as any).jspdf.jsPDF(); 
    doc.setFontSize(18);
    doc.text("Transaction Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 29);
    doc.text(`Filters Applied - Date Range: ${formatDateReadable(filterStartDate)} to ${formatDateReadable(filterEndDate)}`, 14, 34);


    const tableColumn = ["Date", "Description", "Category", "Type", "Amount"];
    const tableRows: any[][] = [];

    allFilteredTransactions.forEach(t => {
      const categoryDisplay = t.isSplit && t.splits 
        ? t.splits.map(s => `${getCategoryName(s.categoryId)} (${formatCurrency(s.amount)})`).join(', ')
        : getCategoryName(t.categoryId);
      const transactionData = [
        formatDateReadable(t.date),
        t.description + (t.payee ? ` (Payee: ${t.payee})` : ''),
        categoryDisplay,
        t.type,
        formatCurrency(t.amount)
      ];
      tableRows.push(transactionData);
    });

    (doc as any).autoTable({ 
      head: [tableColumn],
      body: tableRows,
      startY: 40, 
      theme: 'striped', 
      headStyles: { fillColor: [22, 160, 133] }, 
      margin: { top: 30 }, 
      columnStyles: { 2: { cellWidth: 'auto'} }, // Make category column wider if needed
    });
    
    doc.save(`transactions_report_${filterStartDate}_to_${filterEndDate}.pdf`);
    notifySuccess("Filtered transactions exported to PDF!");
  };


  if (isLoading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i><span className="ml-3 text-xl">Loading transactions...</span></div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-dark dark:text-gray-100">All Transactions</h2>
        <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" size="sm" onClick={openReceiptScannerModal} leftIcon={<i className="fas fa-camera"></i>} title="Scan a new receipt">Scan Receipt</Button>
            <ReactRouterDOM.Link to="/transactions/new" state={{type: TransactionType.EXPENSE}}>
             <Button variant="danger" size="sm" leftIcon={<i className="fas fa-minus-circle"></i>}>New Expense</Button>
            </ReactRouterDOM.Link>
            <ReactRouterDOM.Link to="/transactions/new" state={{type: TransactionType.INCOME}}>
             <Button variant="secondary" size="sm" leftIcon={<i className="fas fa-plus-circle"></i>}>New Income</Button>
            </ReactRouterDOM.Link>
        </div>
      </div>
      
      <div className="mb-4 flex flex-col sm:flex-row justify-end items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleExportToCSV} leftIcon={<i className="fas fa-file-csv"></i>} title="Download filtered transactions as CSV">
            Download CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportToPDF} leftIcon={<i className="fas fa-file-pdf"></i>} title="Download filtered transactions as PDF">
            Download PDF
        </Button>
      </div>


      <div className="mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
        <h3 className="text-md sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center">
            <i className="fas fa-filter mr-2 text-primary"></i>Filters & Sort
            {isAnyFilterActive && <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary rounded-full">Active</span>}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          <Input type="date" label="Start Date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} containerClassName="mb-0" />
          <Input type="date" label="End Date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} containerClassName="mb-0" min={filterStartDate || undefined} />
          <Input type="number" label="Min Amount" placeholder="0.00" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} containerClassName="mb-0" />
          <Input type="number" label="Max Amount" placeholder="e.g. 1000" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} containerClassName="mb-0" />
          <Select label="Category" value={filterCategoryId} onChange={e => setFilterCategoryId(e.target.value)} options={categoryOptions} containerClassName="mb-0" />
          <Select label="Type" value={filterType} onChange={e => setFilterType(e.target.value)} options={typeOptions} containerClassName="mb-0" />
          <Select label="Payment Method" value={filterPaymentMethod} onChange={e => setFilterPaymentMethod(e.target.value)} options={paymentMethodFilterOptions} containerClassName="mb-0" />
          <Select label="Tax Relevant" value={filterIsTaxRelevant} onChange={e => setFilterIsTaxRelevant(e.target.value)} options={taxRelevantOptions} containerClassName="mb-0" />
          <Button onClick={resetFilters} variant="light" size="sm" className="mt-auto h-10 sm:col-span-full md:col-span-1 xl:col-span-1 self-end">
            <i className="fas fa-undo mr-1"></i>Reset All
          </Button>
        </div>
      </div>


      {transactions.length === 0 && !isAnyFilterActive ? (
         <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <i className="fas fa-exchange-alt text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
            <p className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-2">No Transactions Yet!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Start by adding your income or expenses to see them here.</p>
            <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={openReceiptScannerModal} leftIcon={<i className="fas fa-camera"></i>}>Scan Receipt</Button>
                <ReactRouterDOM.Link to="/transactions/new" state={{ type: TransactionType.EXPENSE }}>
                    <Button variant="danger" leftIcon={<i className="fas fa-minus-circle"></i>}>Add Expense</Button>
                </ReactRouterDOM.Link>
                <ReactRouterDOM.Link to="/transactions/new" state={{ type: TransactionType.INCOME }}>
                    <Button variant="secondary" leftIcon={<i className="fas fa-plus-circle"></i>}>Add Income</Button>
                </ReactRouterDOM.Link>
            </div>
        </div>
      ) : paginatedTransactions.length === 0 && isAnyFilterActive ? (
         <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <i className="fas fa-filter text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
            <p className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-2">No Transactions Match Your Filters</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Try adjusting your search criteria or reset the filters to see all transactions.</p>
            <Button onClick={resetFilters} variant="secondary" leftIcon={<i className="fas fa-undo"></i>}>
                Reset Filters
            </Button>
        </div>
      ) : (
        <>
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky-header">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" onClick={() => requestSort('date')}>Date {getSortIndicator('date')}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" onClick={() => requestSort('description')}>Description / Payee</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" onClick={() => requestSort('categoryId')}>Category {getSortIndicator('categoryId')}</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" onClick={() => requestSort('amount')}>Amount {getSortIndicator('amount')}</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTransactions.map(t => (
                <tr key={t.id} className={`transition-colors 
                                odd:bg-white even:bg-gray-50 
                                dark:odd:bg-gray-800 dark:even:bg-gray-700/70 
                                hover:bg-gray-100 dark:hover:bg-gray-600/50`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDateReadable(t.date)}</td>
                  <td className="px-4 py-3 whitespace-normal max-w-xs text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {t.description}
                    {t.payee && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Payee: {t.payee}</p>}
                    <div className="flex items-center mt-1 space-x-2">
                        {t.isTaxRelevant && <i className="fas fa-file-invoice-dollar text-emerald-500 text-xs" title="Tax Relevant"></i>}
                        {t.attachment && (
                            <a href={t.attachment.dataUrl} download={t.attachment.fileName} target="_blank" rel="noopener noreferrer" title={`View/Download Attachment: ${t.attachment.fileName}`}>
                                <i className="fas fa-paperclip text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light text-xs"></i>
                            </a>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {t.isSplit && t.splits ? (
                        <ul className="list-disc list-inside text-xs">
                            {t.splits.map(split => (
                                <li key={split.id} title={split.description || getCategoryName(split.categoryId)}>
                                    {getCategoryName(split.categoryId)}: {formatCurrency(split.amount)}
                                </li>
                            ))}
                        </ul>
                    ) : getCategoryName(t.categoryId)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>{t.paymentMethod}</div>
                    {t.bankAccountId && <div className="text-xs text-gray-400 dark:text-gray-500">{getBankAccountById(t.bankAccountId)?.accountName}</div>}
                    {t.creditCardId && <div className="text-xs text-gray-400 dark:text-gray-500">{getCreditCardById(t.creditCardId)?.name}</div>}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${t.type === TransactionType.INCOME ? 'text-secondary' : 'text-danger'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium space-x-1">
                    <Button iconOnly variant="outline" size="xs" onClick={() => navigate(`/transactions/edit/${t.id}`)} title="Edit Transaction">
                      <i className="fas fa-pencil-alt"></i>
                    </Button>
                    <Button iconOnly variant="danger" size="xs" onClick={() => handleDeleteClick(t)} title="Delete Transaction">
                      <i className="fas fa-trash-alt"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <div className="mb-2 sm:mb-0">
                    Page {currentPage} of {totalPages} (Total: {totalFilteredItems} transactions)
                </div>
                <div className="flex space-x-2">
                    <Button onClick={handlePreviousPage} disabled={currentPage === 1} variant="light" size="sm" leftIcon={<i className="fas fa-chevron-left"></i>}>
                        Previous
                    </Button>
                    <Button onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0} variant="light" size="sm" rightIcon={<i className="fas fa-chevron-right"></i>}>
                        Next
                    </Button>
                </div>
            </div>
        )}
        </>
      )}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete Transaction"
      >
        <p className="text-gray-700 dark:text-gray-200">Are you sure you want to delete this transaction: <strong className="font-semibold">{transactionToDelete?.description} ({formatCurrency(transactionToDelete?.amount || 0)})</strong>?</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This action cannot be undone.</p>
        <div className="mt-6 flex justify-end space-x-3">
           <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
           <Button variant="danger" onClick={confirmDelete} leftIcon={<i className="fas fa-trash-alt"></i>}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default TransactionsListScreen;
