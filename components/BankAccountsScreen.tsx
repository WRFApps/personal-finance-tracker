
import React, { useContext, useState, useMemo, useEffect, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { BankAccount, Transaction, TransactionType, PaymentMethod } from '../types.ts';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx'; // For date filters
import Select from './ui/Select.tsx'; // For account selector
import CollapsibleSection from './ui/CollapsibleSection.tsx'; // Import reusable component
import InterBankTransferModal from './InterBankTransferModal.tsx'; 
import { formatDateReadable, getFirstDayOfCurrentMonth } from '../constants.ts';

// jsPDF is available globally via window.jspdf.jsPDF due to script tag in index.html


const BankAccountsScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);

  // State for Inter-Bank Transfer History
  const [transferHistoryStartDate, setTransferHistoryStartDate] = useState<string>(getFirstDayOfCurrentMonth());
  const [transferHistoryEndDate, setTransferHistoryEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // State for Account Transaction History
  const [selectedHistoryAccountId, setSelectedHistoryAccountId] = useState<string>('');
  const [historyStartDate, setHistoryStartDate] = useState<string>(getFirstDayOfCurrentMonth());
  const [historyEndDate, setHistoryEndDate] = useState<string>(new Date().toISOString().split('T')[0]);


  if (!context) return <div className="text-center py-10">Loading context...</div>;
  const { bankAccounts, deleteBankAccount, isLoading, formatCurrency, transactions, getBankAccountById, getCategoryName, categories, notifySuccess, notifyWarning } = context;

  const handleDeleteClick = (account: BankAccount) => {
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteBankAccount(accountToDelete.id); 
    }
    setShowDeleteModal(false);
    setAccountToDelete(null);
  };

  const interBankTransferOutCategory = useMemo(() => {
    return categories.find(cat => cat.name === "Inter-Bank Transfer Out");
  }, [categories]);
  
  const interBankTransferInCategory = useMemo(() => {
    return categories.find(cat => cat.name === "Inter-Bank Transfer In");
  }, [categories]);

  const interBankTransferHistory = useMemo(() => {
    if (!interBankTransferOutCategory) return [];
    const startDate = new Date(transferHistoryStartDate + 'T00:00:00');
    const endDate = new Date(transferHistoryEndDate + 'T23:59:59');
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date + 'T00:00:00');
        return t.categoryId === interBankTransferOutCategory.id &&
               transactionDate >= startDate &&
               transactionDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, interBankTransferOutCategory, transferHistoryStartDate, transferHistoryEndDate]);


  const accountTransactionHistory = useMemo(() => {
    if (!selectedHistoryAccountId) return [];
    const startDate = new Date(historyStartDate + 'T00:00:00');
    const endDate = new Date(historyEndDate + 'T23:59:59');

    return transactions
        .filter(t => {
            const transactionDate = new Date(t.date + 'T00:00:00');
            return t.bankAccountId === selectedHistoryAccountId &&
                   transactionDate >= startDate &&
                   transactionDate <= endDate;
        })
        .map(t => {
            let typeForAccount: 'Inflow' | 'Outflow' = 'Inflow'; // Default
            if (t.type === TransactionType.INCOME) { // Direct income to account
                typeForAccount = 'Inflow';
            } else if (t.type === TransactionType.EXPENSE) {
                // If it's an expense AND paid from this bank account (not cash/credit card)
                if (t.paymentMethod === PaymentMethod.BANK_TRANSFER || t.paymentMethod === PaymentMethod.CHEQUE) {
                    typeForAccount = 'Outflow';
                } else if (t.categoryId === interBankTransferOutCategory?.id) { // Transfer out from this account
                    typeForAccount = 'Outflow';
                } else if (t.categoryId === interBankTransferInCategory?.id) { // Transfer in to this account
                     typeForAccount = 'Inflow';
                }
            }
             // Special case for cash to bank transfers (always inflow for the target bank)
            const cashToBankCategory = categories.find(c => c.id === 'cat_sys_cash_to_bank');
            if (t.categoryId === cashToBankCategory?.id && t.bankAccountId === selectedHistoryAccountId) {
                 typeForAccount = 'Inflow';
            }


            return { ...t, typeForAccount };
        })
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedHistoryAccountId, historyStartDate, historyEndDate, categories, interBankTransferOutCategory, interBankTransferInCategory]);
  
  const bankAccountOptions = [{ value: '', label: 'Select an Account' }, ...bankAccounts.map(ba => ({value: ba.id, label: `${ba.accountName} (${ba.bankName})`}))];


  const handleExportAccountHistoryCSV = () => {
    if (!selectedHistoryAccountId) { notifyWarning("Please select an account first."); return; }
    if (accountTransactionHistory.length === 0) { notifyWarning("No transactions to export for the selected account and period."); return; }

    const headers = ['Date', 'Description', 'Category', 'Type (Account Flow)', 'Amount'];
    const csvRows = [headers.join(',')];
    accountTransactionHistory.forEach(t => {
      const row = [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`, 
        getCategoryName(t.categoryId),
        t.typeForAccount,
        (t.typeForAccount === 'Inflow' ? '+' : '-') + t.amount.toString()
      ];
      csvRows.push(row.join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const selectedAccountName = getBankAccountById(selectedHistoryAccountId)?.accountName.replace(/\s+/g, '_') || 'account';
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${selectedAccountName}_history_${historyStartDate}_to_${historyEndDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notifySuccess("Account transaction history exported to CSV!");
    }
  };

  const handleExportAccountHistoryPDF = () => {
    if (!selectedHistoryAccountId) { notifyWarning("Please select an account first."); return; }
    if (accountTransactionHistory.length === 0) { notifyWarning("No transactions to export for the selected account and period."); return; }
    
    const doc = new (window as any).jspdf.jsPDF();
    const accountName = getBankAccountById(selectedHistoryAccountId)?.accountName || "Account";
    doc.setFontSize(18);
    doc.text(`${accountName} - Transaction History`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Period: ${formatDateReadable(historyStartDate)} to ${formatDateReadable(historyEndDate)}`, 14, 29);

    const tableColumn = ["Date", "Description", "Category", "Type (Flow)", "Amount"];
    const tableRows: any[][] = [];
    accountTransactionHistory.forEach(t => {
      tableRows.push([
        formatDateReadable(t.date),
        t.description,
        getCategoryName(t.categoryId),
        t.typeForAccount,
        (t.typeForAccount === 'Inflow' ? '+' : '-') + formatCurrency(t.amount)
      ]);
    });
    (doc as any).autoTable({ head: [tableColumn], body: tableRows, startY: 35, theme: 'striped', headStyles: { fillColor: [30, 136, 229] } });
    const pdfAccountName = accountName.replace(/\s+/g, '_');
    doc.save(`${pdfAccountName}_history_${historyStartDate}_to_${historyEndDate}.pdf`);
    notifySuccess("Account transaction history exported to PDF!");
  };


  if (isLoading) return <div className="text-center py-10">Loading bank accounts...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-dark dark:text-gray-100">Manage Bank Accounts</h2>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
            <Button variant="secondary" onClick={() => setShowTransferModal(true)} leftIcon={<i className="fas fa-exchange-alt"></i>}>
                Inter-Bank Transfer
            </Button>
            <Link to="/bank-accounts/new">
              <Button variant="primary" leftIcon={<i className="fas fa-plus"></i>}>Add New Bank Account</Button>
            </Link>
        </div>
      </div>

      {bankAccounts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <i className="fas fa-university text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
            <p className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-2">No Bank Accounts Found.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Add your bank accounts to track balances and transfers.</p>
            <Link to="/bank-accounts/new">
                <Button variant="secondary" leftIcon={<i className="fas fa-plus-circle"></i>}>Add Your First Account</Button>
            </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bank</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Balance</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {bankAccounts.map(acc => (
                <tr key={acc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{acc.accountName}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{acc.bankName}</td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${acc.currentBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(acc.currentBalance)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/bank-accounts/edit/${acc.id}`)} title="Edit Account">
                      <i className="fas fa-pencil-alt"></i>
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteClick(acc)} title="Delete Account">
                      <i className="fas fa-trash-alt"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete Bank Account"
      >
        <p className="text-gray-700 dark:text-gray-200">Are you sure you want to delete the account: <strong className="font-semibold">{accountToDelete?.accountName} ({accountToDelete?.bankName})</strong>?</p>
        <p className="text-sm text-red-500 dark:text-red-400 mt-1">This action cannot be undone. Ensure this account is not in use by transactions or recorded payments.</p>
        <div className="mt-6 flex justify-end space-x-3">
           <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
           <Button variant="danger" onClick={confirmDelete} leftIcon={<i className="fas fa-trash-alt"></i>}>Delete</Button>
        </div>
      </Modal>

      {showTransferModal && (
        <InterBankTransferModal 
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
        />
      )}

      {/* Account Transaction History Section */}
      <CollapsibleSection title="Account Transaction History" icon="fa-list-alt" defaultOpen={false} className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
          <Select
            label="Select Account"
            id="historyAccountId"
            value={selectedHistoryAccountId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedHistoryAccountId(e.target.value)}
            options={bankAccountOptions}
            containerClassName="mb-0 lg:col-span-2"
          />
          <Input
            label="Start Date"
            type="date"
            id="historyStartDateBA"
            value={historyStartDate}
            onChange={e => setHistoryStartDate(e.target.value)}
            containerClassName="mb-0"
          />
          <Input
            label="End Date"
            type="date"
            id="historyEndDateBA"
            value={historyEndDate}
            onChange={e => setHistoryEndDate(e.target.value)}
            containerClassName="mb-0"
            min={historyStartDate || undefined}
          />
        </div>
         <div className="mb-4 flex flex-col sm:flex-row justify-end items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportAccountHistoryCSV} leftIcon={<i className="fas fa-file-csv"></i>} disabled={!selectedHistoryAccountId || accountTransactionHistory.length === 0}>
                Download CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAccountHistoryPDF} leftIcon={<i className="fas fa-file-pdf"></i>} disabled={!selectedHistoryAccountId || accountTransactionHistory.length === 0}>
                Download PDF
            </Button>
        </div>

        {!selectedHistoryAccountId ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Please select a bank account to view its transaction history.</p>
        ) : accountTransactionHistory.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No transactions found for this account in the selected period.</p>
        ) : (
          <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Description</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Type (Flow)</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {accountTransactionHistory.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDateReadable(t.date)}</td>
                    <td className="px-4 py-3 whitespace-normal max-w-xs text-sm">{t.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{getCategoryName(t.categoryId)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${t.typeForAccount === 'Inflow' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{t.typeForAccount}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${t.typeForAccount === 'Inflow' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.typeForAccount === 'Inflow' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>


      <CollapsibleSection title="Inter-Bank Transfer History (Outgoing)" icon="fa-history" defaultOpen={false} className="mt-8">
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <Input
                label="Start Date"
                type="date"
                id="transferHistoryStartDate"
                value={transferHistoryStartDate}
                onChange={e => setTransferHistoryStartDate(e.target.value)}
                containerClassName="mb-0"
            />
            <Input
                label="End Date"
                type="date"
                id="transferHistoryEndDate"
                value={transferHistoryEndDate}
                onChange={e => setTransferHistoryEndDate(e.target.value)}
                containerClassName="mb-0"
                min={transferHistoryStartDate || undefined}
            />
        </div>
        {interBankTransferHistory.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <i className="fas fa-exchange-alt text-4xl text-gray-400 dark:text-gray-500 mb-3"></i>
                <p className="text-gray-600 dark:text-gray-300">No inter-bank transfers found for the selected date range.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">From Account</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Details (To Account / Notes)</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {interBankTransferHistory.map(t => {
                            const fromAccount = getBankAccountById(t.bankAccountId || '');
                            return (
                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDateReadable(t.date)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100">
                                        {fromAccount ? `${fromAccount.accountName} (${fromAccount.bankName})` : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-normal text-sm text-gray-600 dark:text-gray-300">{t.description}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-danger dark:text-red-400 font-semibold">
                                        {formatCurrency(t.amount)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
      </CollapsibleSection>

    </div>
  );
};

export default BankAccountsScreen;
