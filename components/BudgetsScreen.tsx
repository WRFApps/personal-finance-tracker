
import React, { useContext, useState, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { Budget, TransactionType } from '../types.ts';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx';
import ProgressBar from './ui/ProgressBar.tsx';
import { formatMonthYear, getCurrentMonthYear } from '../constants.ts';

const BudgetsScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = ReactRouterDOM.useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  if (!context) return <div className="flex items-center justify-center min-h-screen"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i><span className="ml-3 text-lg">Loading context...</span></div>;
  const { budgets, deleteBudget, getCategoryName, transactions, isLoading, formatCurrency } = context;

  const handleDeleteClick = (budget: Budget) => {
    setBudgetToDelete(budget);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (budgetToDelete) {
      deleteBudget(budgetToDelete.id);
    }
    setShowDeleteModal(false);
    setBudgetToDelete(null);
  };

  const budgetsWithSpending = useMemo(() => {
    // Sort budgets by start date so previous month's budget is found correctly
    const sortedBudgets = [...budgets].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return sortedBudgets.map(currentBudget => {
      const budgetMonthYear = currentBudget.startDate.substring(0, 7);
      const spent = transactions
        .filter(t => t.categoryId === currentBudget.categoryId &&
                     t.type === TransactionType.EXPENSE &&
                     t.date.startsWith(budgetMonthYear))
        .reduce((sum, t) => sum + t.amount, 0);

      let effectiveLimit = currentBudget.limitAmount;
      let rolloverAmountApplied = 0;

      if (currentBudget.rolloverEnabled) {
        const currentMonthDate = new Date(currentBudget.startDate + "T00:00:00");
        const prevMonthDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1);
        const prevMonthYearStr = `${prevMonthDate.getFullYear()}-${(prevMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const previousMonthBudget = sortedBudgets.find(
          b => b.categoryId === currentBudget.categoryId && 
               b.startDate.startsWith(prevMonthYearStr) &&
               b.rolloverEnabled // Only consider previous budget if it also had rollover enabled
        );

        if (previousMonthBudget) {
          const prevMonthSpent = transactions
            .filter(t => t.categoryId === previousMonthBudget.categoryId &&
                         t.type === TransactionType.EXPENSE &&
                         t.date.startsWith(prevMonthYearStr))
            .reduce((sum, t) => sum + t.amount, 0);
          rolloverAmountApplied = previousMonthBudget.limitAmount - prevMonthSpent; // Can be positive (surplus) or negative (deficit)
          effectiveLimit += rolloverAmountApplied;
        }
      }
      
      effectiveLimit = Math.max(0, effectiveLimit); // Ensure effective limit isn't negative due to large deficit rollover

      const progress = effectiveLimit > 0 ? Math.min(100, (spent / effectiveLimit) * 100) : (spent > 0 ? 100 : 0);
      const remaining = effectiveLimit - spent;
      
      let statusText = "";
      if (spent > effectiveLimit) statusText = "Overspent";
      else if (progress >= 90) statusText = "Nearing Limit"; // Changed from 80 to 90 for more visual diff
      else if (progress > 0 || spent > 0) statusText = "On Track"; // Updated to consider if any spending happened even if limit is 0 after rollover
      else statusText = "Not Started";


      return {
        ...currentBudget,
        spent,
        progress,
        remaining,
        effectiveLimit,
        rolloverAmountApplied,
        statusText,
      };
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()); // Final sort by most recent
  }, [budgets, transactions]);


  if (isLoading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i><span className="ml-3 text-xl">Loading budgets...</span></div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-dark dark:text-gray-100">Manage Budgets</h2>
        <ReactRouterDOM.Link to="/budgets/new">
          <Button variant="primary" leftIcon={<i className="fas fa-plus mr-1.5"></i>}>Add New Budget</Button>
        </ReactRouterDOM.Link>
      </div>

      {budgetsWithSpending.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <i className="fas fa-wallet text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
            <p className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-2">No Budgets Created Yet.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Start planning your finances by setting up your first budget.</p>
            <ReactRouterDOM.Link to="/budgets/new">
                <Button variant="secondary" leftIcon={<i className="fas fa-plus-circle"></i>}>Create First Budget</Button>
            </ReactRouterDOM.Link>
        </div>
      ) : (
        <div className="space-y-5">
          {budgetsWithSpending.map(budget => (
            <div key={budget.id} className="p-4 sm:p-5 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-primary dark:text-primary-light">{getCategoryName(budget.categoryId)}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">For {formatMonthYear(budget.startDate)}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Original Limit: {formatCurrency(budget.limitAmount)}
                    {budget.rolloverEnabled && budget.rolloverAmountApplied !== 0 && (
                      <span className={`ml-2 text-xs italic ${budget.rolloverAmountApplied > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        ({budget.rolloverAmountApplied > 0 ? '+' : ''}{formatCurrency(budget.rolloverAmountApplied)} rollover)
                      </span>
                    )}
                  </p>
                  {budget.rolloverEnabled && <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">Effective Limit: {formatCurrency(budget.effectiveLimit)}</p>}
                </div>
                <div className="mt-2 sm:mt-0 flex space-x-2 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/budgets/edit/${budget.id}`)}
                    title="Edit Budget"
                  >
                    <i className="fas fa-edit mr-1 sm:mr-1.5"></i> Edit
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleDeleteClick(budget)}
                    title="Delete Budget"
                  >
                    <i className="fas fa-trash mr-1 sm:mr-1.5"></i> Delete
                  </Button>
                </div>
              </div>
              <ProgressBar 
                value={budget.progress} 
                color={budget.spent > budget.effectiveLimit ? '#EF4444' : (budget.progress >= 90 ? '#F59E0B' : '#10B981')}
                showPercentageText={true}
                height="h-3"
              />
              <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1.5">
                <span>Spent: {formatCurrency(budget.spent)}</span>
                <span className={`font-medium ${budget.remaining < 0 ? 'text-danger' : (budget.remaining < budget.effectiveLimit * 0.1 ? 'text-warning' : 'text-gray-700 dark:text-gray-200')}`}>
                  Remaining: {formatCurrency(budget.remaining)}
                </span>
              </div>
               {budget.statusText && (
                <p className={`text-xs mt-1 font-medium ${
                    budget.statusText === "Overspent" ? "text-danger" :
                    budget.statusText === "Nearing Limit" ? "text-warning" :
                    budget.statusText === "On Track" ? "text-secondary" : "text-gray-500 dark:text-gray-400"
                }`}>
                    Status: {budget.statusText}
                </p>
            )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete Budget"
      >
        <p className="text-gray-700 dark:text-gray-200">Are you sure you want to delete the budget for <strong className="font-semibold">{budgetToDelete ? getCategoryName(budgetToDelete.categoryId) : ''}</strong> for <strong className="font-semibold">{budgetToDelete ? formatMonthYear(budgetToDelete.startDate) : ''}</strong>?</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This action cannot be undone.</p>
        <div className="mt-6 flex justify-end space-x-3">
           <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
           <Button variant="danger" onClick={confirmDelete} leftIcon={<i className="fas fa-trash-alt mr-1.5"></i>}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default BudgetsScreen;
