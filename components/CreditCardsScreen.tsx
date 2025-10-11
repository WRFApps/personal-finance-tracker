
import React, { useContext, useState, useMemo, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { CreditCard, Transaction, PaymentMethod } from '../types.ts';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx'; 
import Select from './ui/Select.tsx';
import Input from './ui/Input.tsx';
import CollapsibleSection from './ui/CollapsibleSection.tsx';
import CreditCardPaymentModal from './CreditCardPaymentModal.tsx';
import { formatDateReadable, getFirstDayOfCurrentMonth } from '../constants.ts';

// jsPDF is available globally via window.jspdf.jsPDF due to script tag in index.html

const CreditCardsScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [cardForPayment, setCardForPayment] = useState<CreditCard | null>(null);

  // State for Card Transaction History
  const [selectedHistoryCardId, setSelectedHistoryCardId] = useState<string>('');
  const [historyStartDate, setHistoryStartDate] = useState<string>(getFirstDayOfCurrentMonth());
  const [historyEndDate, setHistoryEndDate] = useState<string>(new Date().toISOString().split('T')[0]);


  if (!context) return <div className="text-center py-10">Loading context...</div>;
  const { creditCards, deleteCreditCard, isLoading, formatCurrency, transactions, getCategoryName, notifySuccess, notifyWarning } = context;

  const handleDeleteClick = (card: CreditCard) => {
    setCardToDelete(card);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (cardToDelete) {
      deleteCreditCard(cardToDelete.id); 
    }
    setShowDeleteModal(false);
    setCardToDelete(null);
  };

  const handleRecordPaymentClick = (card: CreditCard) => {
    setCardForPayment(card);
    setShowPaymentModal(true);
  };
  
  const cardTransactionHistory = useMemo(() => {
    if (!selectedHistoryCardId) return [];
    const startDate = new Date(historyStartDate + 'T00:00:00');
    const endDate = new Date(historyEndDate + 'T23:59:59');

    return transactions.filter(t => {
        const transactionDate = new Date(t.date + 'T00:00:00');
        return t.paymentMethod === PaymentMethod.CREDIT_CARD && 
               t.creditCardId === selectedHistoryCardId &&
               transactionDate >= startDate &&
               transactionDate <= endDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedHistoryCardId, historyStartDate, historyEndDate]);

  const cardOptions = [{ value: '', label: 'Select a Card' }, ...creditCards.map(cc => ({value: cc.id, label: `${cc.name} (${cc.bankName})`}))];

  const handleExportCardHistoryCSV = () => {
    if (!selectedHistoryCardId) { notifyWarning("Please select a card first."); return; }
    if (cardTransactionHistory.length === 0) { notifyWarning("No transactions to export for the selected card and period."); return; }
    
    const headers = ['Date', 'Description', 'Category', 'Amount'];
    const csvRows = [headers.join(',')];
    cardTransactionHistory.forEach(t => {
      const row = [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        getCategoryName(t.categoryId),
        t.amount.toString() // All are expenses for the card
      ];
      csvRows.push(row.join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const selectedCardName = creditCards.find(c=>c.id === selectedHistoryCardId)?.name.replace(/\s+/g, '_') || 'card';
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${selectedCardName}_history_${historyStartDate}_to_${historyEndDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      notifySuccess("Card transaction history exported to CSV!");
    }
  };

  const handleExportCardHistoryPDF = () => {
    if (!selectedHistoryCardId) { notifyWarning("Please select a card first."); return; }
    if (cardTransactionHistory.length === 0) { notifyWarning("No transactions to export for the selected card and period."); return; }

    const doc = new (window as any).jspdf.jsPDF();
    const cardName = creditCards.find(c=>c.id === selectedHistoryCardId)?.name || "Card";
    doc.setFontSize(18);
    doc.text(`${cardName} - Transaction History`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Period: ${formatDateReadable(historyStartDate)} to ${formatDateReadable(historyEndDate)}`, 14, 29);

    const tableColumn = ["Date", "Description", "Category", "Amount"];
    const tableRows: any[][] = [];
    cardTransactionHistory.forEach(t => {
      tableRows.push([
        formatDateReadable(t.date),
        t.description,
        getCategoryName(t.categoryId),
        formatCurrency(t.amount)
      ]);
    });
    (doc as any).autoTable({ head: [tableColumn], body: tableRows, startY: 35, theme: 'striped', headStyles: { fillColor: [106, 27, 154] } }); // Purple color for credit cards
    const pdfCardName = cardName.replace(/\s+/g, '_');
    doc.save(`${pdfCardName}_history_${historyStartDate}_to_${historyEndDate}.pdf`);
    notifySuccess("Card transaction history exported to PDF!");
  };


  if (isLoading) return <div className="text-center py-10">Loading credit cards...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-dark dark:text-gray-100">Manage Credit Cards</h2>
        <Link to="/credit-cards/new">
          <Button variant="primary" leftIcon={<i className="fas fa-plus"></i>}>Add New Credit Card</Button>
        </Link>
      </div>

      {creditCards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <i className="fas fa-credit-card text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
            <p className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-2">No Credit Cards Found.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Add your credit cards to manage limits, balances, and payments.</p>
            <Link to="/credit-cards/new">
                <Button variant="secondary" leftIcon={<i className="fas fa-plus-circle"></i>}>Add Your First Card</Button>
            </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Card Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bank</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Credit Limit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Available Balance</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statement Day</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Day</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {creditCards.map(card => (
                <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{card.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{card.bankName}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(card.creditLimit)}</td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${card.availableBalance / card.creditLimit < 0.2 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {formatCurrency(card.availableBalance)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{card.statementDate || 'N/A'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{card.dueDate || 'N/A'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1">
                    <Button variant="secondary" size="sm" onClick={() => handleRecordPaymentClick(card)} title="Record Payment" disabled={card.availableBalance >= card.creditLimit}>
                        <i className="fas fa-dollar-sign"></i>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/credit-cards/edit/${card.id}`)} title="Edit Card">
                      <i className="fas fa-pencil-alt"></i>
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteClick(card)} title="Delete Card">
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
        title="Confirm Delete Credit Card"
      >
        <p className="text-gray-700 dark:text-gray-200">Are you sure you want to delete the card: <strong className="font-semibold">{cardToDelete?.name} ({cardToDelete?.bankName})</strong>?</p>
        <p className="text-sm text-red-500 dark:text-red-400 mt-1">This action cannot be undone. Ensure this card is not in use by transactions or recorded payments.</p>
        <div className="mt-6 flex justify-end space-x-3">
           <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
           <Button variant="danger" onClick={confirmDelete} leftIcon={<i className="fas fa-trash-alt"></i>}>Delete</Button>
        </div>
      </Modal>

      {showPaymentModal && cardForPayment && (
        <CreditCardPaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
                setShowPaymentModal(false);
                setCardForPayment(null);
            }}
            creditCard={cardForPayment}
        />
      )}

      {/* Card Transaction History Section */}
      <CollapsibleSection title="Card Transaction History" icon="fa-credit-card" defaultOpen={false} className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
          <Select
            label="Select Card"
            id="historyCardId"
            value={selectedHistoryCardId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedHistoryCardId(e.target.value)}
            options={cardOptions}
            containerClassName="mb-0 lg:col-span-2"
          />
          <Input
            label="Start Date"
            type="date"
            id="historyStartDateCC"
            value={historyStartDate}
            onChange={e => setHistoryStartDate(e.target.value)}
            containerClassName="mb-0"
          />
          <Input
            label="End Date"
            type="date"
            id="historyEndDateCC"
            value={historyEndDate}
            onChange={e => setHistoryEndDate(e.target.value)}
            containerClassName="mb-0"
            min={historyStartDate || undefined}
          />
        </div>
         <div className="mb-4 flex flex-col sm:flex-row justify-end items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCardHistoryCSV} leftIcon={<i className="fas fa-file-csv"></i>} disabled={!selectedHistoryCardId || cardTransactionHistory.length === 0}>
                Download CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCardHistoryPDF} leftIcon={<i className="fas fa-file-pdf"></i>} disabled={!selectedHistoryCardId || cardTransactionHistory.length === 0}>
                Download PDF
            </Button>
        </div>

        {!selectedHistoryCardId ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Please select a credit card to view its transaction history.</p>
        ) : cardTransactionHistory.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No transactions found for this card in the selected period.</p>
        ) : (
          <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Description</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Category</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {cardTransactionHistory.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDateReadable(t.date)}</td>
                    <td className="px-4 py-3 whitespace-normal max-w-xs text-sm">{t.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{getCategoryName(t.categoryId)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
};

export default CreditCardsScreen;
