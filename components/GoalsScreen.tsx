
import React, { useContext, useState, useMemo, useEffect, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { FinancialGoal, GoalContribution, Transaction, TransactionType, PaymentMethod } from '../types.ts';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import ProgressBar from './ui/ProgressBar.tsx';
import { formatDateReadable } from '../constants.ts';
import Select from './ui/Select.tsx';

// GoalContributionModal (no changes needed for this feature set) - Kept for brevity
interface GoalContributionModalProps { isOpen: boolean; onClose: () => void; goal: FinancialGoal; onAddContribution: (goalId: string, contribution: Omit<GoalContribution, 'id' | 'goalId'>, createTransaction?: { bankAccountId?: string, paymentMethod: PaymentMethod }) => void; }
const GoalContributionModal: React.FC<GoalContributionModalProps> = ({ isOpen, onClose, goal, onAddContribution }) => {
  const context = useContext(AppContext);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [createLinkedTransaction, setCreateLinkedTransaction] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [bankAccountId, setBankAccountId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
      setCreateLinkedTransaction(false);
      setPaymentMethod(PaymentMethod.BANK_TRANSFER);
      setBankAccountId(context?.bankAccounts?.[0]?.id || '');
    }
  }, [isOpen, context?.bankAccounts]);

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    if (!date) {
      setError('Date is required.');
      return;
    }
    if (createLinkedTransaction && paymentMethod === PaymentMethod.BANK_TRANSFER && !bankAccountId) {
        setError('Please select a bank account for the transaction.');
        return;
    }

    const contributionData: Omit<GoalContribution, 'id' | 'goalId'> = { 
        amount: parsedAmount, 
        date, 
        notes 
    };
    
    const transactionDetails = createLinkedTransaction ? { bankAccountId: paymentMethod === PaymentMethod.BANK_TRANSFER ? bankAccountId : undefined, paymentMethod } : undefined;
    onAddContribution(goal.id, contributionData, transactionDetails); // Toast for contribution success is handled in App.tsx
    onClose();
  };

  if (!context) return null;
  const { bankAccounts, formatCurrency } = context;
  const bankAccountOptions = bankAccounts.map(ba => ({ value: ba.id, label: `${ba.accountName} (${ba.bankName}) - Bal: ${formatCurrency(ba.currentBalance)}` }));
  const paymentMethodOptions = [
      {value: PaymentMethod.BANK_TRANSFER, label: "Bank Transfer"},
      {value: PaymentMethod.CASH, label: "Cash"},
  ];


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Contribution to ${goal.name}`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">Target: {formatCurrency(goal.targetAmount)}, Saved: {formatCurrency(goal.currentAmount)}</p>
        <Input label="Contribution Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} error={error.includes('Amount') ? error : undefined} required />
        <Input label="Contribution Date" type="date" value={date} onChange={e => setDate(e.target.value)} error={error.includes('Date') ? error : undefined} required />
        <Input label="Notes (Optional)" type="text" value={notes} onChange={e => setNotes(e.target.value)} />

        <div className="flex items-center mt-4">
            <input type="checkbox" id="createLinkedTransaction" checked={createLinkedTransaction} onChange={e => setCreateLinkedTransaction(e.target.checked)} className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600" />
            <label htmlFor="createLinkedTransaction" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Create a linked expense transaction for this contribution</label>
        </div>

        {createLinkedTransaction && (
            <div className="pl-6 mt-2 space-y-3 border-l-2 border-gray-200 dark:border-gray-600 ml-2">
                <Select label="Payment Method for Transaction" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} options={paymentMethodOptions} />
                {paymentMethod === PaymentMethod.BANK_TRANSFER && (
                    <Select label="Pay from Bank Account" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} options={bankAccountOptions} placeholder="Select bank account" error={error.includes('bank account') ? error : undefined} required/>
                )}
            </div>
        )}
        {error && !error.includes('Amount') && !error.includes('Date') && !error.includes('bank account') && <p className="text-xs text-danger dark:text-red-400">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="light" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Add Contribution</Button>
      </div>
    </Modal>
  );
};


const GoalCard: React.FC<{ goal: FinancialGoal; onContribute: (goal: FinancialGoal) => void; onEdit: (id: string) => void; onDelete: (goal: FinancialGoal) => void; formatCurrency: (amount: number) => string; }> = 
({ goal, onContribute, onEdit, onDelete, formatCurrency }) => {
    const [prospectiveContribution, setProspectiveContribution] = useState<string>('');
    const [projection, setProjection] = useState<string | null>(null);

    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const isAchieved = goal.currentAmount >= goal.targetAmount;

    useEffect(() => { // Calculate projection when prospectiveContribution or goal details change
        if (!prospectiveContribution || isAchieved) {
            setProjection(null); // Clear projection if no input or goal achieved
            return;
        }
        const contrib = parseFloat(prospectiveContribution);
        if (isNaN(contrib) || contrib <= 0) {
            setProjection("Please enter a valid positive contribution amount.");
            return;
        }
        const remainingAmount = goal.targetAmount - goal.currentAmount;
        if (remainingAmount <= 0) { // Should be covered by isAchieved but good to double check
            setProjection("Goal already achieved!");
            return;
        }
        const monthsToGoal = Math.ceil(remainingAmount / contrib);
        const today = new Date();
        const targetDate = new Date(today.setMonth(today.getMonth() + monthsToGoal));
        
        let projectionMessage = `~${monthsToGoal} month(s) (around ${formatDateReadable(targetDate.toISOString().split('T')[0])}).`;
        if (goal.deadline) {
            const deadlineDate = new Date(goal.deadline + "T00:00:00");
            if (targetDate > deadlineDate) {
                projectionMessage += ` This is after your deadline of ${formatDateReadable(goal.deadline)}.`;
            } else {
                 projectionMessage += ` This is before your deadline of ${formatDateReadable(goal.deadline)}.`;
            }
        }
        setProjection(projectionMessage);
    }, [prospectiveContribution, goal.targetAmount, goal.currentAmount, goal.deadline, isAchieved]);


    return (
        <div className={`p-6 border rounded-lg shadow-lg flex flex-col justify-between ${isAchieved ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
        <div>
            <div className="flex justify-between items-start mb-2">
            <h3 className={`text-xl font-semibold ${isAchieved ? 'text-green-700 dark:text-green-300' : 'text-primary dark:text-primary-light'}`}>{goal.name}</h3>
            {isAchieved && <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 dark:text-green-200 dark:bg-green-700 rounded-full">Achieved!</span>}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Target: {formatCurrency(goal.targetAmount)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Saved: {formatCurrency(goal.currentAmount)} ({progress.toFixed(1)}%)</p>
            <ProgressBar value={progress} color={isAchieved ? '#10B981' : (progress > 70 ? '#3B82F6' : '#F59E0B')} />
            {goal.deadline && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Deadline: {formatDateReadable(goal.deadline)}</p>}
            {goal.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Notes: {goal.notes}</p>}

            {!isAchieved && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Project Payoff:</p>
                    <Input 
                        type="number" 
                        placeholder="Monthly Contribution" 
                        value={prospectiveContribution}
                        onChange={e => setProspectiveContribution(e.target.value)}
                        containerClassName="mb-1"
                        className="text-xs py-1"
                        min="0.01"
                        step="0.01"
                    />
                    {projection && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{projection}</p>}
                </div>
            )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2 justify-end">
            {!isAchieved && (
            <Button variant="secondary" size="sm" onClick={() => onContribute(goal)} leftIcon={<i className="fas fa-donate"></i>}>
                Contribute
            </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onEdit(goal.id)} leftIcon={<i className="fas fa-edit"></i>}>
            Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(goal)} leftIcon={<i className="fas fa-trash"></i>}>
            Delete
            </Button>
        </div>
        </div>
    );
};

const GoalsScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);
  const [showContributionModal, setShowContributionModal] = useState<boolean>(false);
  const [goalForContribution, setGoalForContribution] = useState<FinancialGoal | null>(null);


  if (!context) return <div className="text-center py-10">Loading context...</div>;
  const { financialGoals, deleteFinancialGoal, addGoalContribution, isLoading, formatCurrency, addTransaction, categories } = context;

  const handleDeleteClick = (goal: FinancialGoal) => {
    setGoalToDelete(goal);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (goalToDelete) {
      deleteFinancialGoal(goalToDelete.id); // Toast handled in App.tsx
    }
    setShowDeleteModal(false);
    setGoalToDelete(null);
  };

  const handleContributeClick = (goal: FinancialGoal) => {
    setGoalForContribution(goal);
    setShowContributionModal(true);
  };

  const handleAddContributionWithTransaction = (
    goalId: string, 
    contribution: Omit<GoalContribution, 'id' | 'goalId'>, 
    createTransactionDetails?: { bankAccountId?: string, paymentMethod: PaymentMethod }
    ) => {
        // addGoalContribution in App.tsx now handles the toast for successful contribution & goal achievement.
        addGoalContribution(goalId, contribution, createTransactionDetails); 
  };


  const sortedGoals = useMemo(() => {
    return [...financialGoals].sort((a, b) => {
        const aAchieved = a.currentAmount >= a.targetAmount;
        const bAchieved = b.currentAmount >= b.targetAmount;
        if (aAchieved && !bAchieved) return 1; // Achieved goals at the bottom
        if (!aAchieved && bAchieved) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Then by creation date
    });
  }, [financialGoals]);

  if (isLoading) return <div className="text-center py-10">Loading financial goals...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-dark dark:text-gray-100">Financial Goals</h2>
        <Link to="/goals/new">
          <Button variant="primary" leftIcon={<i className="fas fa-plus"></i>}>Set New Goal</Button>
        </Link>
      </div>

      {sortedGoals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <i className="fas fa-bullseye text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
            <p className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-2">No Goals Yet?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Achieve your dreams by setting financial goals and tracking your progress.</p>
            <Link to="/goals/new">
                <Button variant="secondary" leftIcon={<i className="fas fa-plus-circle"></i>}>Set Your First Goal</Button>
            </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGoals.map(goal => (
            <GoalCard 
                key={goal.id} 
                goal={goal} 
                onContribute={handleContributeClick}
                onEdit={(id) => navigate(`/goals/edit/${id}`)}
                onDelete={handleDeleteClick}
                formatCurrency={formatCurrency}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Delete Goal">
        <p className="dark:text-gray-200">Are you sure you want to delete the goal: <strong>{goalToDelete?.name}</strong>?</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This will also remove all contributions made to this goal. This action cannot be undone.</p>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete Goal</Button>
        </div>
      </Modal>

      {showContributionModal && goalForContribution && (
        <GoalContributionModal 
            isOpen={showContributionModal}
            onClose={() => { setShowContributionModal(false); setGoalForContribution(null);}}
            goal={goalForContribution}
            onAddContribution={handleAddContributionWithTransaction}
        />
      )}
    </div>
  );
};

export default GoalsScreen;
