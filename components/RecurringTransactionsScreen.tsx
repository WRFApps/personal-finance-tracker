import React, { useContext, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { RecurringTransaction, TransactionType } from '../types.ts';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx';
import { formatDateReadable } from '../constants.ts';

const RecurringTransactionsScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [rtToDelete, setRtToDelete] = useState<RecurringTransaction | null>(null);

  if (!context) return <div className="text-center py-10">Loading context...</div>;
  const { recurringTransactions, deleteRecurringTransaction, getCategoryName, isLoading, formatCurrency, updateRecurringTransaction, notifySuccess } = context;

  const handleDeleteClick = (rt: RecurringTransaction) => {
    setRtToDelete(rt);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (rtToDelete) {
      deleteRecurringTransaction(rtToDelete.id); // Toast handled in App.tsx
    }
    setShowDeleteModal(false);
    setRtToDelete(null);
  };

  const toggleIsActive = (rt: RecurringTransaction) => {
    updateRecurringTransaction({ ...rt, isActive: !rt.isActive }); // Toast handled in App.tsx
    notifySuccess(`Recurring transaction '${rt.description}' ${!rt.isActive ? 'resumed' : 'paused'}.`);
  };

  const sortedRts = useMemo(() => {
    return [...recurringTransactions].sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }, [recurringTransactions]);

  if (isLoading) return <div className="text-center py-10">Loading recurring transactions...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-dark dark:text-gray-100">Recurring Transactions</h2>
        <div className="flex flex-wrap gap-2 items-center">
            <Link to="/recurring/new" state={{ type: TransactionType.EXPENSE }}>
                <Button variant="danger" size="sm" leftIcon={<i className="fas fa-minus-circle"></i>}>New Recurring Expense</Button>
            </Link>
            <Link to="/recurring/new" state={{ type: TransactionType.INCOME }}>
                <Button variant="secondary" size="sm" leftIcon={<i className="fas fa-plus-circle"></i>}>New Recurring Income</Button>
            </Link>
        </div>
      </div>

      {sortedRts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <i className="fas fa-redo-alt text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
            <p className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-2">No Recurring Transactions Set Up.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Automate your regular income and expenses by creating recurring transactions.</p>
            <Link to="/recurring/new">
                <Button variant="secondary" leftIcon={<i className="fas fa-plus-circle"></i>}>Create First Recurring Transaction</Button>
            </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Next Due</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Processed</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedRts.map(rt => (
                <tr key={rt.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!rt.isActive ? 'opacity-60 bg-gray-100 dark:bg-gray-700' : ''}`}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${rt.isActive ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300'}`}>
                      {rt.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{rt.description}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{getCategoryName(rt.categoryId)}</td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${rt.type === TransactionType.INCOME ? 'text-secondary dark:text-green-400' : 'text-danger dark:text-red-400'}`}>
                    {rt.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(rt.amount)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{rt.frequency}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDateReadable(rt.nextDueDate)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{rt.lastProcessedDate ? formatDateReadable(rt.lastProcessedDate) : 'Never'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1">
                    <Button 
                        variant={rt.isActive ? "warning" : "secondary"} 
                        size="sm" 
                        onClick={() => toggleIsActive(rt)} 
                        title={rt.isActive ? "Pause" : "Resume"}
                    >
                        <i className={`fas ${rt.isActive ? 'fa-pause-circle' : 'fa-play-circle'}`}></i>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/recurring/edit/${rt.id}`)} title="Edit">
                      <i className="fas fa-pencil-alt"></i>
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteClick(rt)} title="Delete">
                      <i className="fas fa-trash-alt"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Delete Recurring Transaction">
        <p className="dark:text-gray-200">Are you sure you want to delete the recurring transaction: <strong>{rtToDelete?.description}</strong>?</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This action cannot be undone and will stop future processing.</p>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default RecurringTransactionsScreen;