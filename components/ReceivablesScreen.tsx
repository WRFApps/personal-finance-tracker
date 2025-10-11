
import React, { useContext, useState, useMemo, useEffect, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { Receivable, ReceivableStatus, ReceivablePayment, PaymentMethod, BankAccount } from '../types.ts';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import Select from './ui/Select.tsx';
import { formatDateReadable, calculateReceivableStats, PAYMENT_METHOD_OPTIONS } from '../constants.ts';

const AddPaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (paymentData: Omit<ReceivablePayment, 'id' | 'receivableId'>) => void;
  receivable: Receivable | null;
}> = ({ isOpen, onClose, onAddPayment, receivable }) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [error, setError] = useState('');
  const context = useContext(AppContext);

  useEffect(() => {
    if (isOpen && receivable) {
      const stats = calculateReceivableStats(receivable);
      setAmount(stats.remaining > 0 ? stats.remaining.toFixed(2) : '');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setPaymentMethod(PaymentMethod.CASH);
      setBankAccountId('');
      setError('');
    }
  }, [isOpen, receivable]);

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
    if (receivable && parsedAmount > calculateReceivableStats(receivable).remaining) {
         setError(`Payment amount cannot exceed remaining balance of ${context?.formatCurrency(calculateReceivableStats(receivable).remaining)}.`);
      return;
    }
    if ((paymentMethod === PaymentMethod.BANK_TRANSFER || paymentMethod === PaymentMethod.CHEQUE) && !bankAccountId) {
        setError('Please select a bank account for this payment method.');
        return;
    }
    setError('');

    const paymentData: Omit<ReceivablePayment, 'id' | 'receivableId'> = { 
        amount: parsedAmount, 
        date, 
        notes,
        paymentMethod,
        bankAccountId: (paymentMethod === PaymentMethod.BANK_TRANSFER || paymentMethod === PaymentMethod.CHEQUE) ? bankAccountId : undefined,
    };
    onAddPayment(paymentData);
    onClose();
  };
  
  if (!receivable || !context) return null;
  const { bankAccounts, formatCurrency } = context;
  const bankAccountOptions = bankAccounts.map(ba => ({ value: ba.id, label: `${ba.accountName} (${ba.bankName}) - Bal: ${formatCurrency(ba.currentBalance)}`}));
  const relevantPaymentMethods = PAYMENT_METHOD_OPTIONS.filter(
    pm => pm.value !== PaymentMethod.CREDIT_CARD 
  );


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Receive Payment for ${receivable.debtorName}`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Remaining Balance: <strong className="text-orange-600 dark:text-orange-400">{formatCurrency(calculateReceivableStats(receivable).remaining)}</strong>
        </p>
        <Input
          label="Payment Amount"
          type="number"
          id="paymentAmount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          error={error && (error.includes('Amount') || error.includes('balance')) ? error : undefined}
          placeholder="0.00"
          step="0.01"
          min="0.01"
          required
        />
        <Input
          label="Payment Date"
          type="date"
          id="paymentDate"
          value={date}
          onChange={e => setDate(e.target.value)}
          error={error && error.includes('Date') ? error : undefined}
          required
        />
        <Select
          label="Payment Method Received"
          id="paymentMethod"
          value={paymentMethod}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setPaymentMethod(e.target.value as PaymentMethod)}
          options={relevantPaymentMethods}
          required
        />
        {(paymentMethod === PaymentMethod.BANK_TRANSFER || paymentMethod === PaymentMethod.CHEQUE) && (
          <Select
            label="Deposit to Bank Account"
            id="bankAccountId"
            value={bankAccountId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setBankAccountId(e.target.value)}
            options={bankAccountOptions}
            placeholder="Select bank account"
            error={error && error.includes('bank account') ? error : undefined}
            required
          />
        )}
        <Input
          label="Notes (Optional)"
          type="text"
          id="paymentNotes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g., Received via Bank Transfer"
        />
         {error && !error.includes('Amount') && !error.includes('Date') && !error.includes('bank account') && !error.includes('balance') && <p className="mt-1 text-xs text-danger dark:text-red-400">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="light" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} leftIcon={<i className="fas fa-check-circle mr-1.5"></i>}>Receive Payment</Button>
      </div>
    </Modal>
  );
};


const ReceivablesScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [receivableToDelete, setReceivableToDelete] = useState<Receivable | null>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState<boolean>(false);
  const [receivableForPayment, setReceivableForPayment] = useState<Receivable | null>(null);
  const [expandedReceivableId, setExpandedReceivableId] = useState<string | null>(null);


  if (!context) return <div className="flex items-center justify-center min-h-screen"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i><span className="ml-3 text-lg">Loading context...</span></div>;
  const { receivables, deleteReceivable, addReceivablePayment, isLoading, formatCurrency, getBankAccountById } = context;

  const handleDeleteClick = (receivable: Receivable) => {
    setReceivableToDelete(receivable);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (receivableToDelete) {
      deleteReceivable(receivableToDelete.id);
    }
    setShowDeleteModal(false);
    setReceivableToDelete(null);
  };
  
  const handleAddPaymentClick = (receivable: Receivable) => {
    setReceivableForPayment(receivable);
    setShowAddPaymentModal(true);
  };

  const handleSavePayment = (paymentData: Omit<ReceivablePayment, 'id' | 'receivableId'>) => {
    if (receivableForPayment) {
      addReceivablePayment(receivableForPayment.id, paymentData);
    }
     setShowAddPaymentModal(false);
     setReceivableForPayment(null);
  };
  
  const togglePaymentsList = (receivableId: string) => {
    setExpandedReceivableId(expandedReceivableId === receivableId ? null : receivableId);
  };

  const receivablesWithStats = useMemo(() => {
    return receivables.map(r => ({
      ...r,
      ...calculateReceivableStats(r)
    })).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [receivables]);

  const getStatusColor = (status: ReceivableStatus): string => {
    switch (status) {
      case ReceivableStatus.PAID: return 'text-secondary bg-secondary/10 border border-secondary/30 dark:bg-secondary/20 dark:text-green-300 dark:border-secondary/50';
      case ReceivableStatus.PENDING: return 'text-blue-600 bg-blue-500/10 border border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/50';
      case ReceivableStatus.PARTIALLY_PAID: return 'text-yellow-600 bg-yellow-500/10 border border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/50';
      case ReceivableStatus.OVERDUE: return 'text-danger bg-danger/10 border border-danger/30 dark:bg-danger/20 dark:text-red-300 dark:border-danger/50';
      default: return 'text-gray-600 bg-gray-500/10 border border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/50';
    }
  };
  
  if (isLoading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i><span className="ml-3 text-xl">Loading receivables...</span></div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-dark dark:text-gray-100">Manage Receivables</h2>
        <Link to="/receivables/new">
          <Button variant="primary" leftIcon={<i className="fas fa-plus mr-1.5"></i>}>Add New Receivable</Button>
        </Link>
      </div>

      {receivablesWithStats.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <i className="fas fa-hand-holding-usd text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
            <p className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-2">No Receivables Yet.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Keep track of money owed to you by adding your first receivable item.</p>
            <Link to="/receivables/new">
                <Button variant="secondary" leftIcon={<i className="fas fa-plus-circle"></i>}>Add First Receivable</Button>
            </Link>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Debtor</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Total</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Received</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Remaining</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {receivablesWithStats.map(r => (
                <React.Fragment key={r.id}>
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{r.debtorName}</td>
                  <td className="px-3 py-4 whitespace-normal max-w-xs text-sm text-gray-700 dark:text-gray-300">{r.description}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(r.totalAmount)}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                    <button
                        onClick={() => togglePaymentsList(r.id)}
                        className="hover:underline focus:outline-none disabled:text-gray-400 dark:disabled:text-gray-500 disabled:no-underline"
                        title={r.payments.length > 0 ? "View Payments" : "No payments yet"}
                        disabled={r.payments.length === 0}
                        aria-expanded={expandedReceivableId === r.id}
                        aria-controls={`payments-${r.id}`}
                    >
                        {formatCurrency(r.paid)}
                        {r.payments.length > 0 && <i className={`fas fa-chevron-down fa-xs ml-1 transform transition-transform ${expandedReceivableId === r.id ? 'rotate-180' : ''}`}></i>}
                    </button>
                  </td>
                  <td className={`px-3 py-4 whitespace-nowrap text-sm text-right font-semibold ${r.remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{formatCurrency(r.remaining)}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDateReadable(r.dueDate)}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-center text-xs">
                     <span className={`px-2 py-1 font-semibold leading-tight rounded-full ${getStatusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1">
                     {r.status !== ReceivableStatus.PAID && (
                      <Button iconOnly variant="secondary" size="xs" onClick={() => handleAddPaymentClick(r)} title="Receive Payment">
                        <i className="fas fa-hand-holding-usd"></i>
                      </Button>
                    )}
                    <Button iconOnly variant="outline" size="xs" onClick={() => navigate(`/receivables/edit/${r.id}`)} title="Edit Receivable">
                      <i className="fas fa-pencil-alt"></i>
                    </Button>
                    <Button iconOnly variant="danger" size="xs" onClick={() => handleDeleteClick(r)} title="Delete Receivable">
                      <i className="fas fa-trash-alt"></i>
                    </Button>
                  </td>
                </tr>
                {expandedReceivableId === r.id && r.payments.length > 0 && (
                    <tr id={`payments-${r.id}`}>
                        <td colSpan={8} className="p-3 bg-gray-50/70 dark:bg-gray-700/30">
                            <div className="text-xs text-gray-700 dark:text-gray-200">
                                <h4 className="font-semibold mb-1.5 text-gray-600 dark:text-gray-300">Payment History:</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    {r.payments.map(p => (
                                        <li key={p.id}>
                                            {formatDateReadable(p.date)}: <strong className="text-green-600 dark:text-green-400">{formatCurrency(p.amount)}</strong>
                                            {p.paymentMethod && ` (Method: ${p.paymentMethod}`}
                                            {p.bankAccountId && getBankAccountById(p.bankAccountId) && `, Bank: ${getBankAccountById(p.bankAccountId)?.accountName}`}
                                            {p.paymentMethod && `)`}
                                            {p.notes && <span className="text-xs text-gray-500 dark:text-gray-400 italic"> - {p.notes}</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </td>
                    </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete Receivable"
      >
        <p className="text-gray-700 dark:text-gray-200">Are you sure you want to delete the receivable for <strong className="font-semibold">{receivableToDelete?.debtorName}</strong> ({receivableToDelete?.description})?</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This action cannot be undone.</p>
        <div className="mt-6 flex justify-end space-x-3">
           <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
           <Button variant="danger" onClick={confirmDelete} leftIcon={<i className="fas fa-trash-alt mr-1.5"></i>}>Delete</Button>
        </div>
      </Modal>
      
      {receivableForPayment && (
        <AddPaymentModal
            isOpen={showAddPaymentModal}
            onClose={() => {
                setShowAddPaymentModal(false);
                setReceivableForPayment(null);
            }}
            onAddPayment={handleSavePayment}
            receivable={receivableForPayment}
        />
      )}
    </div>
  );
};

export default ReceivablesScreen;
