
import React, { useContext, useState, useMemo, useEffect, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { LongTermLiability, LongTermLiabilityPayment, ShortTermLiability, ShortTermLiabilityPayment, ShortTermLiabilityStatus, LiabilityType, PaymentMethod, BankAccount, CreditCard, ShortTermLiabilityPaymentStructure, LongTermLiabilityStats, ShortTermLiabilityCalculatedStats } from '../types.ts';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import Select from './ui/Select.tsx';
import { formatDateReadable, calculateLongTermLiabilityStats, calculateShortTermLiabilityStats, PAYMENT_METHOD_OPTIONS } from '../constants.ts';

// AddLongTermLiabilityPaymentModal 
const AddLongTermLiabilityPaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (paymentData: Omit<LongTermLiabilityPayment, 'id' | 'liabilityId'>) => void;
  liability: LongTermLiability | null;
}> = ({ isOpen, onClose, onAddPayment, liability }) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [creditCardId, setCreditCardId] = useState<string>('');
  const [error, setError] = useState('');
  const context = useContext(AppContext);

  useEffect(() => {
    if (isOpen && liability) {
      setAmount(liability.monthlyPayment > 0 ? liability.monthlyPayment.toFixed(2) : '');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setPaymentMethod(PaymentMethod.BANK_TRANSFER);
      setBankAccountId(context?.bankAccounts?.[0]?.id || '');
      setCreditCardId('');
      setError('');
    }
  }, [isOpen, liability, context?.bankAccounts]);
  
  useEffect(() => { 
    setBankAccountId('');
    setCreditCardId('');
  }, [paymentMethod]);


  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Amount must be positive.'); return; }
    if (!date) { setError('Date is required.'); return; }
    if (paymentMethod === PaymentMethod.BANK_TRANSFER && !bankAccountId) { setError('Bank account required.'); return; }
    if (paymentMethod === PaymentMethod.CREDIT_CARD && !creditCardId) { setError('Credit card required.'); return; }
    setError('');
    onAddPayment({ amount: parsedAmount, date, notes, paymentMethod, bankAccountId: bankAccountId || undefined, creditCardId: creditCardId || undefined });
    onClose();
  };

  if (!liability || !context) return null;
  const { bankAccounts, creditCards, formatCurrency } = context;
  const bankAccountOptions = bankAccounts.map(ba => ({ value: ba.id, label: `${ba.accountName} (${formatCurrency(ba.currentBalance)})`}));
  const creditCardOptions = creditCards.map(cc => ({ value: cc.id, label: `${cc.name} (Avail: ${formatCurrency(cc.availableBalance)})`}));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Payment for ${liability.name}`}>
      <div className="space-y-4">
        <Input label="Payment Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} error={error.includes('Amount')?error:undefined} required />
        <Input label="Payment Date" type="date" value={date} onChange={e => setDate(e.target.value)} error={error.includes('Date')?error:undefined} required />
        <Select label="Payment Method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} options={PAYMENT_METHOD_OPTIONS} required />
        {paymentMethod === PaymentMethod.BANK_TRANSFER && <Select label="From Bank Account" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} options={bankAccountOptions} placeholder="Select account" error={error.includes('Bank')?error:undefined} required />}
        {paymentMethod === PaymentMethod.CREDIT_CARD && <Select label="With Credit Card" value={creditCardId} onChange={e => setCreditCardId(e.target.value)} options={creditCardOptions} placeholder="Select card" error={error.includes('Card')?error:undefined} required />}
        <Input label="Notes (Optional)" type="text" value={notes} onChange={e => setNotes(e.target.value)} />
        {error && !error.includes('Amount') &&!error.includes('Date') &&!error.includes('Bank') &&!error.includes('Card') && <p className="text-xs text-danger dark:text-red-400">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end space-x-3"> <Button variant="light" onClick={onClose}>Cancel</Button> <Button variant="primary" onClick={handleSubmit}>Add Payment</Button> </div>
    </Modal>
  );
};

const AddShortTermLiabilityPaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (paymentData: Omit<ShortTermLiabilityPayment, 'id' | 'liabilityId'>) => void;
  liability: ShortTermLiability | null;
  liabilityStats: ShortTermLiabilityCalculatedStats | null; 
}> = ({ isOpen, onClose, onAddPayment, liability, liabilityStats }) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [creditCardId, setCreditCardId] = useState<string>('');
  const [error, setError] = useState('');
  const context = useContext(AppContext);

  useEffect(() => {
    if (isOpen && liability && liabilityStats) {
      setAmount(liabilityStats.remaining > 0 ? liabilityStats.remaining.toFixed(2) : '');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setPaymentMethod(PaymentMethod.BANK_TRANSFER);
      setBankAccountId(context?.bankAccounts?.[0]?.id || '');
      setCreditCardId('');
      setError('');
    }
  }, [isOpen, liability, liabilityStats, context?.bankAccounts]);

  useEffect(() => { 
    setBankAccountId('');
    setCreditCardId('');
  }, [paymentMethod]);
  
  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Amount must be positive.'); return; }
    if (!date) { setError('Date is required.'); return; }
    if (liabilityStats && parsedAmount > liabilityStats.remaining) { setError(`Amount exceeds remaining balance of ${context?.formatCurrency(liabilityStats.remaining)}.`); return; }
    if (paymentMethod === PaymentMethod.BANK_TRANSFER && !bankAccountId) { setError('Bank account required.'); return; }
    if (paymentMethod === PaymentMethod.CREDIT_CARD && !creditCardId) { setError('Credit card required.'); return; }
    setError('');
    onAddPayment({ amount: parsedAmount, date, notes, paymentMethod, bankAccountId: bankAccountId || undefined, creditCardId: creditCardId || undefined });
    onClose();
  };

  if (!liability || !liabilityStats || !context) return null;
  const { bankAccounts, creditCards, formatCurrency } = context;
  const bankAccountOptions = bankAccounts.map(ba => ({ value: ba.id, label: `${ba.accountName} (${formatCurrency(ba.currentBalance)})`}));
  const creditCardOptions = creditCards.map(cc => ({ value: cc.id, label: `${cc.name} (Avail: ${formatCurrency(cc.availableBalance)})`}));


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Payment for ${liability.name}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Remaining: {formatCurrency(liabilityStats.remaining)}</p>
      <div className="space-y-4">
        <Input label="Payment Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} error={error.includes('Amount')||error.includes('balance')?error:undefined} required />
        <Input label="Payment Date" type="date" value={date} onChange={e => setDate(e.target.value)} error={error.includes('Date')?error:undefined} required />
        <Select label="Payment Method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} options={PAYMENT_METHOD_OPTIONS} required />
        {paymentMethod === PaymentMethod.BANK_TRANSFER && <Select label="From Bank Account" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} options={bankAccountOptions} placeholder="Select account" error={error.includes('Bank')?error:undefined} required />}
        {paymentMethod === PaymentMethod.CREDIT_CARD && <Select label="With Credit Card" value={creditCardId} onChange={e => setCreditCardId(e.target.value)} options={creditCardOptions} placeholder="Select card" error={error.includes('Card')?error:undefined} required />}
        <Input label="Notes (Optional)" type="text" value={notes} onChange={e => setNotes(e.target.value)} />
        {error && !error.includes('Amount') &&!error.includes('Date') &&!error.includes('Bank') &&!error.includes('Card') &&!error.includes('balance') && <p className="text-xs text-danger dark:text-red-400">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end space-x-3"> <Button variant="light" onClick={onClose}>Cancel</Button> <Button variant="primary" onClick={handleSubmit}>Add Payment</Button> </div>
    </Modal>
  );
};


interface WhatIfPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  liabilityName: string;
  remainingBalance: number;
  currentMonthlyPayment: number; 
  formatCurrency: (amount: number) => string;
}

const WhatIfPaymentModal: React.FC<WhatIfPaymentModalProps> = ({ isOpen, onClose, liabilityName, remainingBalance, currentMonthlyPayment, formatCurrency }) => {
    const [extraPayment, setExtraPayment] = useState<string>('');
    const [estimatedResult, setEstimatedResult] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setExtraPayment('');
            setEstimatedResult(null);
        }
    }, [isOpen]);

    const calculateEstimate = () => {
        const extra = parseFloat(extraPayment);
        if (isNaN(extra) || extra <= 0) {
            setEstimatedResult("Please enter a valid extra payment amount.");
            return;
        }

        let message = "";
        if (currentMonthlyPayment > 0) {
            const originalMonths = Math.ceil(remainingBalance / currentMonthlyPayment);
            const newTotalPayment = currentMonthlyPayment + extra;
            const newMonths = Math.ceil(remainingBalance / newTotalPayment);

            if (newMonths < originalMonths) {
                const monthsSaved = originalMonths - newMonths;
                message = `With an extra ${formatCurrency(extra)}/month (total ${formatCurrency(newTotalPayment)}/month), you could pay off this liability ~${monthsSaved} month(s) sooner (approx. ${newMonths} months total instead of ~${originalMonths} months).`;
            } else {
                message = `This extra payment may not significantly reduce the payoff time with the current monthly payment. Estimated payoff remains ~${originalMonths} months.`;
            }
        } else { 
            const newMonths = Math.ceil(remainingBalance / extra);
            message = `By paying ${formatCurrency(extra)}/month, you could pay off this liability in ~${newMonths} month(s).`;
        }
        setEstimatedResult(message);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`What-if Extra Payment: ${liabilityName}`} size="md">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Remaining Balance: <strong className="text-dark dark:text-gray-100">{formatCurrency(remainingBalance)}</strong></p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Current Regular Monthly Payment: <strong className="text-dark dark:text-gray-100">{formatCurrency(currentMonthlyPayment)}</strong></p>
            <Input 
                label="Proposed Extra Monthly Payment"
                type="number"
                value={extraPayment}
                onChange={e => {setExtraPayment(e.target.value); setEstimatedResult(null);}}
                placeholder="e.g., 50"
                min="0.01"
                step="0.01"
                leftIcon={<i className="fas fa-plus-circle text-gray-400 dark:text-gray-500"></i>}
            />
            <Button onClick={calculateEstimate} variant="secondary" className="mt-4 w-full" disabled={!extraPayment} leftIcon={<i className="fas fa-calculator"></i>}>
                Calculate Estimate
            </Button>
            {estimatedResult && <p className="mt-4 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md shadow-sm">{estimatedResult}</p>}
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">Note: This is a simplified estimation. It does not account for compounding interest changes, specific loan amortization schedules, or other fees. For precise figures, consult your lender or a financial advisor.</p>
             <div className="mt-6 flex justify-end">
                <Button variant="light" onClick={onClose}>Close</Button>
            </div>
        </Modal>
    );
};


type LiabilitySortStrategy = 'default' | 'snowball' | 'avalanche';

type LongTermLiabilityWithStats = LongTermLiability & LongTermLiabilityStats;
type ShortTermLiabilityWithStats = ShortTermLiability & { stats: ShortTermLiabilityCalculatedStats };


const LiabilitiesScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'long-term' | 'short-term'>('long-term');
  const [sortStrategy, setSortStrategy] = useState<LiabilitySortStrategy>('default');
  
  const [showDeleteLTLModal, setShowDeleteLTLModal] = useState<boolean>(false);
  const [ltlToDelete, setLtlToDelete] = useState<LongTermLiability | null>(null);
  const [showAddLTLPaymentModal, setShowAddLTLPaymentModal] = useState<boolean>(false);
  const [ltlForPayment, setLtlForPayment] = useState<LongTermLiability | null>(null);
  const [expandedLTLId, setExpandedLTLId] = useState<string | null>(null);
  const [showWhatIfLTLModal, setShowWhatIfLTLModal] = useState<boolean>(false);
  const [ltlForWhatIf, setLtlForWhatIf] = useState<LongTermLiability | null>(null);

  const [showDeleteSTLModal, setShowDeleteSTLModal] = useState<boolean>(false);
  const [stlToDelete, setStlToDelete] = useState<ShortTermLiability | null>(null);
  const [showAddSTLPaymentModal, setShowAddSTLPaymentModal] = useState<boolean>(false);
  const [stlForPayment, setStlForPayment] = useState<ShortTermLiability | null>(null);
  const [stlStatsForPayment, setStlStatsForPayment] = useState<ShortTermLiabilityCalculatedStats | null>(null);
  const [expandedSTLId, setExpandedSTLId] = useState<string | null>(null);
  const [showWhatIfSTLModal, setShowWhatIfSTLModal] = useState<boolean>(false);
  const [stlForWhatIf, setStlForWhatIf] = useState<ShortTermLiability | null>(null);
  const [stlStatsForWhatIf, setStlStatsForWhatIf] = useState<ShortTermLiabilityCalculatedStats | null>(null);

  if (!context) return <div className="text-center py-10">Loading context...</div>;
  const { 
    longTermLiabilities, deleteLongTermLiability, addLongTermLiabilityPayment, 
    shortTermLiabilities, deleteShortTermLiability, addShortTermLiabilityPayment, 
    isLoading, formatCurrency, getBankAccountById, getCreditCardById 
  } = context;

  const handleDeleteLTLClick = (liability: LongTermLiability) => { setLtlToDelete(liability); setShowDeleteLTLModal(true); };
  const confirmDeleteLTL = () => { if (ltlToDelete) deleteLongTermLiability(ltlToDelete.id); setShowDeleteLTLModal(false); setLtlToDelete(null); };
  const handleAddLTLPaymentClick = (liability: LongTermLiability) => { setLtlForPayment(liability); setShowAddLTLPaymentModal(true); };
  const handleSaveLTLPayment = (paymentData: Omit<LongTermLiabilityPayment, 'id' | 'liabilityId'>) => { if (ltlForPayment) addLongTermLiabilityPayment(ltlForPayment.id, paymentData); setShowAddLTLPaymentModal(false); setLtlForPayment(null); };
  const toggleLTLPaymentsList = (id: string) => setExpandedLTLId(expandedLTLId === id ? null : id);
  const handleWhatIfLTLClick = (liability: LongTermLiability) => { setLtlForWhatIf(liability); setShowWhatIfLTLModal(true); };

  const handleDeleteSTLClick = (liability: ShortTermLiability) => { setStlToDelete(liability); setShowDeleteSTLModal(true); };
  const confirmDeleteSTL = () => { if (stlToDelete) deleteShortTermLiability(stlToDelete.id); setShowDeleteSTLModal(false); setStlToDelete(null); };
  const handleAddSTLPaymentClick = (liability: ShortTermLiability, stats: ShortTermLiabilityCalculatedStats) => { setStlForPayment(liability); setStlStatsForPayment(stats); setShowAddSTLPaymentModal(true); };
  const handleSaveSTLPayment = (paymentData: Omit<ShortTermLiabilityPayment, 'id' | 'liabilityId'>) => { if (stlForPayment) addShortTermLiabilityPayment(stlForPayment.id, paymentData); setShowAddSTLPaymentModal(false); setStlForPayment(null); setStlStatsForPayment(null);};
  const toggleSTLPaymentsList = (id: string) => setExpandedSTLId(expandedSTLId === id ? null : id);
  const handleWhatIfSTLClick = (liability: ShortTermLiability, stats: ShortTermLiabilityCalculatedStats) => { setStlForWhatIf(liability); setStlStatsForWhatIf(stats); setShowWhatIfSTLModal(true); };

  
  const sortLiabilities = <T extends { createdAt: string; interestRate?: number }>(
    items: T[],
    getRemainingBalance: (item: T) => number
  ): T[] => {
    const sortedItems = [...items];
    switch (sortStrategy) {
      case 'snowball':
        return sortedItems.sort((a, b) => getRemainingBalance(a) - getRemainingBalance(b));
      case 'avalanche':
        return sortedItems.sort((a, b) => (b.interestRate ?? 0) - (a.interestRate ?? 0));
      case 'default':
      default:
        return sortedItems.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };


  const longTermLiabilitiesWithStatsMemo = useMemo((): LongTermLiabilityWithStats[] => {
    const itemsWithStats = longTermLiabilities.map(l => ({ ...l, ...calculateLongTermLiabilityStats(l) }));
    return sortLiabilities(itemsWithStats, item => item.remainingBalance);
  }, [longTermLiabilities, sortStrategy]);

  const shortTermLiabilitiesWithStatsMemo = useMemo((): ShortTermLiabilityWithStats[] => {
    const itemsWithStats = shortTermLiabilities.map(l => ({ ...l, stats: calculateShortTermLiabilityStats(l) }));
    return sortLiabilities(itemsWithStats, item => item.stats.remaining);
  }, [shortTermLiabilities, sortStrategy]);
  
  const getSTLStatusColor = (status: ShortTermLiabilityStatus): string => {
    switch (status) {
      case ShortTermLiabilityStatus.PAID: return 'text-secondary bg-secondary/10 border border-secondary/20 dark:bg-secondary/20 dark:text-green-300 dark:border-secondary/50';
      case ShortTermLiabilityStatus.PENDING: return 'text-blue-600 bg-blue-500/10 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/50';
      case ShortTermLiabilityStatus.PARTIALLY_PAID: return 'text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/50';
      case ShortTermLiabilityStatus.OVERDUE: return 'text-danger bg-danger/10 border border-danger/20 dark:bg-danger/20 dark:text-red-300 dark:border-danger/50';
      case ShortTermLiabilityStatus.UPCOMING: return 'text-teal-600 bg-teal-500/10 border border-teal-500/20 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/50';
      default: return 'text-gray-600 bg-gray-500/10 border border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/50';
    }
  };

  if (isLoading) return <div className="text-center py-10">Loading liabilities...</div>;

  const sortOptions = [
    { value: 'default', label: 'Sort by: Default (Recent)' },
    { value: 'snowball', label: 'Sort by: Snowball (Lowest Balance)' },
    { value: 'avalanche', label: 'Sort by: Avalanche (Highest Interest)' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-dark dark:text-gray-100">Manage Liabilities</h2>
        <Link to={activeTab === 'long-term' ? '/liabilities/long-term/new' : '/liabilities/short-term/new'}>
          <Button variant="primary" leftIcon={<i className="fas fa-plus"></i>}>
            Add New {activeTab === 'long-term' ? 'Long-Term' : 'Short-Term'} Liability
          </Button>
        </Link>
      </div>

      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {['long-term', 'short-term'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'long-term' | 'short-term')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none
                          ${activeTab === tab ? 'border-primary text-primary dark:text-primary-light' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}`}
            >
              {tab === 'long-term' ? 'Long-Term Liabilities' : 'Short-Term Liabilities'}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <Select 
            id="sortStrategy" 
            label="Debt Payoff Strategy Focus:"
            value={sortStrategy}
            onChange={e => setSortStrategy(e.target.value as LiabilitySortStrategy)}
            options={sortOptions}
            containerClassName="max-w-xs w-full sm:w-auto mb-0"
            className="py-1.5 text-sm"
        />
        {sortStrategy === 'avalanche' && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-0 sm:ml-3">Note: Avalanche sort considers interest rates. Add rates for best results.</p>}
      </div>

      {activeTab === 'long-term' && (
        <div>
          {longTermLiabilitiesWithStatsMemo.length === 0 ? (
             <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <i className="fas fa-landmark text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
                <p className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-2">No Long-Term Liabilities.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Track mortgages, car loans, or other long-term debts here.</p>
                <Link to="/liabilities/long-term/new">
                    <Button variant="secondary" leftIcon={<i className="fas fa-plus-circle"></i>}>Add Long-Term Liability</Button>
                </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name/Lender (Interest)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Original Amt.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monthly Pymt.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Remaining</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Start Date</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {longTermLiabilitiesWithStatsMemo.map(l => (
                      <React.Fragment key={l.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          <div>{l.name}</div> <div className="text-xs text-gray-500 dark:text-gray-400">{l.lender}{l.interestRate ? ` (${l.interestRate.toFixed(2)}%)` : ''}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{l.type}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(l.originalAmount)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-blue-600 dark:text-blue-400">{formatCurrency(l.monthlyPayment)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                          <button onClick={() => toggleLTLPaymentsList(l.id)} className="hover:underline focus:outline-none disabled:text-gray-400 dark:disabled:text-gray-500 disabled:no-underline" title={l.payments.length > 0 ? "View Payments" : "No payments yet"} disabled={l.payments.length === 0}>
                              {formatCurrency(l.totalPaid)}
                              {l.payments.length > 0 && <i className={`fas fa-chevron-down fa-xs ml-1 transform transition-transform ${expandedLTLId === l.id ? 'rotate-180' : ''}`}></i>}
                          </button>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${l.remainingBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{formatCurrency(l.remainingBalance)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDateReadable(l.startDate)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1">
                          {l.remainingBalance > 0 && <Button iconOnly variant="secondary" size="xs" onClick={() => handleAddLTLPaymentClick(l)} title="Add Payment"><i className="fas fa-dollar-sign"></i></Button>}
                          <Button iconOnly variant="secondary" size="xs" onClick={() => handleWhatIfLTLClick(l)} title="What-if Extra Payment?"><i className="fas fa-calculator"></i></Button>
                          <Button iconOnly variant="outline" size="xs" onClick={() => navigate(`/liabilities/long-term/edit/${l.id}`)} title="Edit Liability"><i className="fas fa-pencil-alt"></i></Button>
                          <Button iconOnly variant="danger" size="xs" onClick={() => handleDeleteLTLClick(l)} title="Delete Liability"><i className="fas fa-trash-alt"></i></Button>
                        </td>
                      </tr>
                      {expandedLTLId === l.id && l.payments.length > 0 && (
                           <tr><td colSpan={8} className="p-3 bg-gray-50 dark:bg-gray-700/30"><div className="text-sm text-gray-700 dark:text-gray-200">
                               <h4 className="font-semibold mb-1">Payment History:</h4><ul className="list-disc pl-5 space-y-1">
                                   {l.payments.map(p => (<li key={p.id}>{formatDateReadable(p.date)}: {formatCurrency(p.amount)}
                                       {p.paymentMethod && ` (Method: ${p.paymentMethod}`}
                                       {p.bankAccountId && getBankAccountById(p.bankAccountId) && `, Bank: ${getBankAccountById(p.bankAccountId)?.accountName}`}
                                       {p.creditCardId && getCreditCardById(p.creditCardId) && `, Card: ${getCreditCardById(p.creditCardId)?.name}`}
                                       {p.paymentMethod && `)`}
                                       {p.notes && <span className="text-xs text-gray-500 dark:text-gray-400 italic"> - {p.notes}</span>}</li>))}</ul></div></td></tr>
                       )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </div>)}

      {activeTab === 'short-term' && ( <div>
          {shortTermLiabilitiesWithStatsMemo.length === 0 ? (
             <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <i className="fas fa-file-contract text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
                <p className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-2">No Short-Term Liabilities.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Track smaller loans, credit card debts, or other short-term obligations.</p>
                 <Link to="/liabilities/short-term/new">
                    <Button variant="secondary" leftIcon={<i className="fas fa-plus-circle"></i>}>Add Short-Term Liability</Button>
                </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name/Lender (Interest)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Original Amt.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date / Next Pymt.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Remaining</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {shortTermLiabilitiesWithStatsMemo.map(l => (
                      <React.Fragment key={l.id}> <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                         <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          <div>{l.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{l.lender}{l.interestRate ? ` (${l.interestRate.toFixed(2)}%)` : ''}</div>
                          {l.paymentStructure === ShortTermLiabilityPaymentStructure.INSTALLMENTS && l.stats.monthlyInstallmentAmount && (
                            <div className="text-xs text-blue-500 dark:text-blue-400">Pymt: {formatCurrency(l.stats.monthlyInstallmentAmount)}/mo</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(l.originalAmount)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {l.paymentStructure === ShortTermLiabilityPaymentStructure.INSTALLMENTS && l.stats.nextInstallmentDueDate 
                            ? `${formatDateReadable(l.stats.nextInstallmentDueDate)} (Next Installment)` 
                            : formatDateReadable(l.dueDate)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                           <button onClick={() => toggleSTLPaymentsList(l.id)} className="hover:underline focus:outline-none disabled:text-gray-400 dark:disabled:text-gray-500 disabled:no-underline" title={l.payments.length > 0 ? "View Payments" : "No payments yet"} disabled={l.payments.length === 0}>
                              {formatCurrency(l.stats.paid)}
                              {l.payments.length > 0 && <i className={`fas fa-chevron-down fa-xs ml-1 transform transition-transform ${expandedSTLId === l.id ? 'rotate-180' : ''}`}></i>}
                          </button>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${l.stats.remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{formatCurrency(l.stats.remaining)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-xs">
                          <span className={`px-2 py-1 font-semibold leading-tight rounded-full ${getSTLStatusColor(l.stats.status)}`}>{l.stats.status}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1">
                          {l.stats.status !== ShortTermLiabilityStatus.PAID && <Button iconOnly variant="secondary" size="xs" onClick={() => handleAddSTLPaymentClick(l, l.stats)} title="Add Payment"><i className="fas fa-dollar-sign"></i></Button>}
                          {l.stats.status !== ShortTermLiabilityStatus.PAID && (l.stats.monthlyInstallmentAmount || l.paymentStructure === ShortTermLiabilityPaymentStructure.SINGLE) && 
                              <Button iconOnly variant="secondary" size="xs" onClick={() => handleWhatIfSTLClick(l, l.stats)} title="What-if Extra Payment?"><i className="fas fa-calculator"></i></Button>
                          }
                          <Button iconOnly variant="outline" size="xs" onClick={() => navigate(`/liabilities/short-term/edit/${l.id}`)} title="Edit Liability"><i className="fas fa-pencil-alt"></i></Button>
                          <Button iconOnly variant="danger" size="xs" onClick={() => handleDeleteSTLClick(l)} title="Delete Liability"><i className="fas fa-trash-alt"></i></Button>
                        </td>
                    </tr>
                    {expandedSTLId === l.id && l.payments.length > 0 && (
                        <tr><td colSpan={7} className="p-3 bg-gray-50 dark:bg-gray-700/30"><div className="text-sm text-gray-700 dark:text-gray-200">
                            <h4 className="font-semibold mb-1">Payment History:</h4><ul className="list-disc pl-5 space-y-1">
                                {l.payments.map(p => (<li key={p.id}>{formatDateReadable(p.date)}: {formatCurrency(p.amount)}
                                    {p.paymentMethod && ` (Method: ${p.paymentMethod}`}
                                    {p.bankAccountId && getBankAccountById(p.bankAccountId) && `, Bank: ${getBankAccountById(p.bankAccountId)?.accountName}`}
                                    {p.creditCardId && getCreditCardById(p.creditCardId) && `, Card: ${getCreditCardById(p.creditCardId)?.name}`}
                                    {p.paymentMethod && `)`}
                                    {p.notes && <span className="text-xs text-gray-500 dark:text-gray-400 italic"> - {p.notes}</span>}</li>))}</ul></div></td></tr>
                    )}
                    </React.Fragment> );
                })}
                </tbody>
              </table>
            </div>
          )}
      </div>)}
      
      {ltlToDelete && (<Modal isOpen={showDeleteLTLModal} onClose={() => setShowDeleteLTLModal(false)} title="Confirm Delete Long-Term Liability"> <p>Are you sure you want to delete the liability: <strong>{ltlToDelete?.name}</strong>?</p> <div className="mt-6 flex justify-end space-x-3"><Button variant="light" onClick={() => setShowDeleteLTLModal(false)}>Cancel</Button><Button variant="danger" onClick={confirmDeleteLTL} leftIcon={<i className="fas fa-trash-alt"></i>}>Delete</Button></div> </Modal>)}
      {ltlForPayment && <AddLongTermLiabilityPaymentModal isOpen={showAddLTLPaymentModal} onClose={() => setShowAddLTLPaymentModal(false)} onAddPayment={handleSaveLTLPayment} liability={ltlForPayment} />}

      {stlToDelete && (<Modal isOpen={showDeleteSTLModal} onClose={() => setShowDeleteSTLModal(false)} title="Confirm Delete Short-Term Liability"> <p>Are you sure you want to delete the liability: <strong>{stlToDelete?.name}</strong>?</p> <div className="mt-6 flex justify-end space-x-3"><Button variant="light" onClick={() => setShowDeleteSTLModal(false)}>Cancel</Button><Button variant="danger" onClick={confirmDeleteSTL} leftIcon={<i className="fas fa-trash-alt"></i>}>Delete</Button></div> </Modal>)}
      {stlForPayment && stlStatsForPayment && <AddShortTermLiabilityPaymentModal isOpen={showAddSTLPaymentModal} onClose={() => { setShowAddSTLPaymentModal(false); setStlForPayment(null); setStlStatsForPayment(null);}} onAddPayment={handleSaveSTLPayment} liability={stlForPayment} liabilityStats={stlStatsForPayment} />}

      {ltlForWhatIf && <WhatIfPaymentModal isOpen={showWhatIfLTLModal} onClose={() => setShowWhatIfLTLModal(false)} liabilityName={ltlForWhatIf.name} remainingBalance={calculateLongTermLiabilityStats(ltlForWhatIf).remainingBalance} currentMonthlyPayment={ltlForWhatIf.monthlyPayment} formatCurrency={formatCurrency} />}
      
      {stlForWhatIf && stlStatsForWhatIf && (
        <WhatIfPaymentModal 
            isOpen={showWhatIfSTLModal} 
            onClose={() => setShowWhatIfSTLModal(false)} 
            liabilityName={stlForWhatIf.name} 
            remainingBalance={stlStatsForWhatIf.remaining} 
            currentMonthlyPayment={
                stlForWhatIf.paymentStructure === ShortTermLiabilityPaymentStructure.INSTALLMENTS && stlStatsForWhatIf.monthlyInstallmentAmount 
                ? stlStatsForWhatIf.monthlyInstallmentAmount 
                : 0 
            } 
            formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

export default LiabilitiesScreen;
