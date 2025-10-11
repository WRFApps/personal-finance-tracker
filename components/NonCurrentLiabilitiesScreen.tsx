import React, { useContext, useState, useMemo, useEffect, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { LongTermLiability, LongTermLiabilityPayment, ShortTermLiability, ShortTermLiabilityPayment, ShortTermLiabilityStatus, LiabilityType, PaymentMethod, BankAccount, CreditCard } from '../types.ts';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import Select from './ui/Select.tsx';
import { formatDateReadable, calculateLongTermLiabilityStats, calculateShortTermLiabilityStats, PAYMENT_METHOD_OPTIONS } from '../constants.ts';

// Modal for Long-Term Liability Payments
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
    if (isOpen) {
      setAmount(liability?.monthlyPayment.toString() || '');
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
    // Validation logic (amount, date, bank/card selection)
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    if (!date) { setError('Date is required.'); return; }
    if (paymentMethod === PaymentMethod.BANK_TRANSFER && !bankAccountId) { setError('Please select a bank account.'); return; }
    if (paymentMethod === PaymentMethod.CREDIT_CARD && !creditCardId) { setError('Please select a credit card.'); return; }
    setError('');

    onAddPayment({ 
        amount: parsedAmount, date, notes, paymentMethod,
        bankAccountId: paymentMethod === PaymentMethod.BANK_TRANSFER ? bankAccountId : undefined,
        creditCardId: paymentMethod === PaymentMethod.CREDIT_CARD ? creditCardId : undefined,
    });
    onClose();
  };

  if (!liability || !context) return null;
  const { bankAccounts, creditCards } = context;
  const bankAccountOptions = bankAccounts.map(ba => ({ value: ba.id, label: `${ba.accountName} (${ba.bankName})`}));
  const creditCardOptions = creditCards.map(cc => ({ value: cc.id, label: `${cc.name} (${cc.bankName})`}));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Payment for ${liability.name}`}>
      <div className="space-y-4">
        <Input label="Payment Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} error={error.includes('Amount') ? error : undefined} required />
        <Input label="Payment Date" type="date" value={date} onChange={e => setDate(e.target.value)} error={error.includes('Date') ? error : undefined} required />
        <Select label="Payment Method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} options={PAYMENT_METHOD_OPTIONS} required />
        {paymentMethod === PaymentMethod.BANK_TRANSFER && (
          <Select label="Pay from Bank Account" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} options={bankAccountOptions} placeholder="Select bank account" error={error.includes('bank account') ? error : undefined} required />
        )}
        {paymentMethod === PaymentMethod.CREDIT_CARD && (
          <Select label="Pay with Credit Card" value={creditCardId} onChange={e => setCreditCardId(e.target.value)} options={creditCardOptions} placeholder="Select credit card" error={error.includes('credit card') ? error : undefined} required />
        )}
        <Input label="Notes (Optional)" type="text" value={notes} onChange={e => setNotes(e.target.value)} />
        {error && !error.includes('Amount') && !error.includes('Date') && !error.includes('bank') && !error.includes('card') && <p className="text-xs text-danger">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="light" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Add Payment</Button>
      </div>
    </Modal>
  );
};


// Modal for Short-Term Liability Payments
const AddShortTermLiabilityPaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (paymentData: Omit<ShortTermLiabilityPayment, 'id' | 'liabilityId'>) => void;
  liability: ShortTermLiability | null;
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
      const stats = calculateShortTermLiabilityStats(liability);
      setAmount(stats.remaining > 0 ? stats.remaining.toFixed(2) : '');
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
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Amount must be a positive number.'); return; }
    if (!date) { setError('Date is required.'); return; }
    if (liability && parsedAmount > calculateShortTermLiabilityStats(liability).remaining) { setError(`Payment amount exceeds remaining balance of ${context?.formatCurrency(calculateShortTermLiabilityStats(liability).remaining)}.`); return; }
    if (paymentMethod === PaymentMethod.BANK_TRANSFER && !bankAccountId) { setError('Please select a bank account.'); return; }
    if (paymentMethod === PaymentMethod.CREDIT_CARD && !creditCardId) { setError('Please select a credit card.'); return; }
    setError('');
    
    onAddPayment({
        amount: parsedAmount, date, notes, paymentMethod,
        bankAccountId: paymentMethod === PaymentMethod.BANK_TRANSFER ? bankAccountId : undefined,
        creditCardId: paymentMethod === PaymentMethod.CREDIT_CARD ? creditCardId : undefined,
    });
    onClose();
  };

  if (!liability || !context) return null;
  const { bankAccounts, creditCards, formatCurrency } = context;
  const bankAccountOptions = bankAccounts.map(ba => ({ value: ba.id, label: `${ba.accountName} (${ba.bankName})`}));
  const creditCardOptions = creditCards.map(cc => ({ value: cc.id, label: `${cc.name} (${cc.bankName})`}));
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Payment for ${liability.name}`}>
        <p className="text-sm text-gray-500 mb-2">Remaining: {formatCurrency(calculateShortTermLiabilityStats(liability).remaining)}</p>
      <div className="space-y-4">
        <Input label="Payment Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} error={error.includes('Amount') || error.includes('balance') ? error : undefined} required />
        <Input label="Payment Date" type="date" value={date} onChange={e => setDate(e.target.value)} error={error.includes('Date') ? error : undefined} required />
        <Select label="Payment Method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} options={PAYMENT_METHOD_OPTIONS} required />
        {paymentMethod === PaymentMethod.BANK_TRANSFER && (
          <Select label="Pay from Bank Account" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} options={bankAccountOptions} placeholder="Select bank account" error={error.includes('bank account') ? error : undefined} required />
        )}
        {paymentMethod === PaymentMethod.CREDIT_CARD && (
          <Select label="Pay with Credit Card" value={creditCardId} onChange={e => setCreditCardId(e.target.value)} options={creditCardOptions} placeholder="Select credit card" error={error.includes('credit card') ? error : undefined} required />
        )}
        <Input label="Notes (Optional)" type="text" value={notes} onChange={e => setNotes(e.target.value)} />
        {error && !error.includes('Amount') && !error.includes('Date') && !error.includes('bank') && !error.includes('card') && !error.includes('balance') && <p className="text-xs text-danger">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="light" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Add Payment</Button>
      </div>
    </Modal>
  );
};


const LiabilitiesScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'long-term' | 'short-term'>('long-term');

  // States for Long-Term Liabilities
  const [showDeleteLTLModal, setShowDeleteLTLModal] = useState<boolean>(false);
  const [ltlToDelete, setLtlToDelete] = useState<LongTermLiability | null>(null);
  const [showAddLTLSModal, setShowAddLTLPaymentModal] = useState<boolean>(false);
  const [ltlForPayment, setLtlForPayment] = useState<LongTermLiability | null>(null);
  const [expandedLTLId, setExpandedLTLId] = useState<string | null>(null);

  // States for Short-Term Liabilities
  const [showDeleteSTLModal, setShowDeleteSTLModal] = useState<boolean>(false);
  const [stlToDelete, setStlToDelete] = useState<ShortTermLiability | null>(null);
  const [showAddSTLPaymentModal, setShowAddSTLPaymentModal] = useState<boolean>(false);
  const [stlForPayment, setStlForPayment] = useState<ShortTermLiability | null>(null);
  const [expandedSTLId, setExpandedSTLId] = useState<string | null>(null);


  if (!context) return <div className="text-center py-10">Loading context...</div>;
  const { 
    longTermLiabilities, deleteLongTermLiability, addLongTermLiabilityPayment, 
    shortTermLiabilities, deleteShortTermLiability, addShortTermLiabilityPayment, 
    isLoading, formatCurrency, getBankAccountById, getCreditCardById 
  } = context;

  // Long-Term Liability Handlers
  const handleDeleteLTLClick = (liability: LongTermLiability) => { setLtlToDelete(liability); setShowDeleteLTLModal(true); };
  const confirmDeleteLTL = () => { if (ltlToDelete) deleteLongTermLiability(ltlToDelete.id); setShowDeleteLTLModal(false); setLtlToDelete(null); };
  const handleAddLTLPaymentClick = (liability: LongTermLiability) => { setLtlForPayment(liability); setShowAddLTLPaymentModal(true); };
  const handleSaveLTLPayment = (paymentData: Omit<LongTermLiabilityPayment, 'id' | 'liabilityId'>) => { if (ltlForPayment) addLongTermLiabilityPayment(ltlForPayment.id, paymentData); setShowAddLTLPaymentModal(false); setLtlForPayment(null); };
  const toggleLTLPaymentsList = (id: string) => setExpandedLTLId(expandedLTLId === id ? null : id);

  // Short-Term Liability Handlers
  const handleDeleteSTLClick = (liability: ShortTermLiability) => { setStlToDelete(liability); setShowDeleteSTLModal(true); };
  const confirmDeleteSTL = () => { if (stlToDelete) deleteShortTermLiability(stlToDelete.id); setShowDeleteSTLModal(false); setStlToDelete(null); };
  const handleAddSTLPaymentClick = (liability: ShortTermLiability) => { setStlForPayment(liability); setShowAddSTLPaymentModal(true); };
  const handleSaveSTLPayment = (paymentData: Omit<ShortTermLiabilityPayment, 'id' | 'liabilityId'>) => { if (stlForPayment) addShortTermLiabilityPayment(stlForPayment.id, paymentData); setShowAddSTLPaymentModal(false); setStlForPayment(null); };
  const toggleSTLPaymentsList = (id: string) => setExpandedSTLId(expandedSTLId === id ? null : id);

  const longTermLiabilitiesWithStats = useMemo(() => {
    return longTermLiabilities.map(l => ({ ...l, ...calculateLongTermLiabilityStats(l) }))
                              .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [longTermLiabilities]);

  const shortTermLiabilitiesWithStats = useMemo(() => {
    return shortTermLiabilities.map(l => ({ ...l, ...calculateShortTermLiabilityStats(l) }))
                                .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [shortTermLiabilities]);
  
  const getSTLStatusColor = (status: ShortTermLiabilityStatus) => {
    switch (status) {
      case ShortTermLiabilityStatus.PAID: return 'text-secondary bg-secondary/10';
      case ShortTermLiabilityStatus.PENDING: return 'text-blue-500 bg-blue-500/10';
      case ShortTermLiabilityStatus.PARTIALLY_PAID: return 'text-yellow-500 bg-yellow-500/10';
      case ShortTermLiabilityStatus.OVERDUE: return 'text-danger bg-danger/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };


  if (isLoading) return <div className="text-center py-10">Loading liabilities...</div>;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-dark">Manage Liabilities</h2>
        <Link to={activeTab === 'long-term' ? '/liabilities/long-term/new' : '/liabilities/short-term/new'}>
          <Button variant="primary" leftIcon={<i className="fas fa-plus"></i>}>
            Add New {activeTab === 'long-term' ? 'Long-Term' : 'Short-Term'} Liability
          </Button>
        </Link>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('long-term')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none
                        ${activeTab === 'long-term' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Long-Term Liabilities
          </button>
          <button
            onClick={() => setActiveTab('short-term')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none
                        ${activeTab === 'short-term' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Short-Term Liabilities
          </button>
        </nav>
      </div>

      {/* Long-Term Liabilities Tab Content */}
      {activeTab === 'long-term' && (
        <div>
          {longTermLiabilitiesWithStats.length === 0 ? (
            <p className="text-gray-600 text-center py-10 text-lg">No long-term liabilities recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name/Lender</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Original Amt.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Pymt.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {longTermLiabilitiesWithStats.map(l => (
                    <React.Fragment key={l.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>{l.name}</div> <div className="text-xs text-gray-500">{l.lender}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{l.type}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-700">{formatCurrency(l.originalAmount)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-blue-600">{formatCurrency(l.monthlyPayment)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-green-600">
                        <button onClick={() => toggleLTLPaymentsList(l.id)} className="hover:underline focus:outline-none" title="View Payments" disabled={l.payments.length === 0}>
                            {formatCurrency(l.totalPaid)}
                            {l.payments.length > 0 && <i className={`fas fa-chevron-down fa-xs ml-1 transform transition-transform ${expandedLTLId === l.id ? 'rotate-180' : ''}`}></i>}
                        </button>
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${l.remainingBalance > 0 ? 'text-red-600' : 'text-gray-700'}`}>{formatCurrency(l.remainingBalance)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatDateReadable(l.startDate)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1">
                        {l.remainingBalance > 0 && <Button variant="secondary" size="sm" onClick={() => handleAddLTLPaymentClick(l)} title="Add Payment"><i className="fas fa-dollar-sign"></i></Button>}
                        <Button variant="outline" size="sm" onClick={() => navigate(`/liabilities/long-term/edit/${l.id}`)} title="Edit Liability"><i className="fas fa-pencil-alt"></i></Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteLTLClick(l)} title="Delete Liability"><i className="fas fa-trash-alt"></i></Button>
                      </td>
                    </tr>
                    {expandedLTLId === l.id && l.payments.length > 0 && (
                         <tr><td colSpan={8} className="p-3 bg-gray-50"><div className="text-sm text-gray-700">
                             <h4 className="font-semibold mb-1">Payment History:</h4><ul className="list-disc pl-5 space-y-1">
                                 {l.payments.map(p => (<li key={p.id}>{formatDateReadable(p.date)}: {formatCurrency(p.amount)}
                                     {p.paymentMethod && ` (Method: ${p.paymentMethod}`}
                                     {p.bankAccountId && getBankAccountById(p.bankAccountId) && `, Bank: ${getBankAccountById(p.bankAccountId)?.accountName}`}
                                     {p.creditCardId && getCreditCardById(p.creditCardId) && `, Card: ${getCreditCardById(p.creditCardId)?.name}`}
                                     {p.paymentMethod && `)`}
                                     {p.notes && <span className="text-xs text-gray-500 italic"> - {p.notes}</span>}</li>))}</ul></div></td></tr>
                     )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Short-Term Liabilities Tab Content */}
      {activeTab === 'short-term' && (
        <div>
          {shortTermLiabilitiesWithStats.length === 0 ? (
            <p className="text-gray-600 text-center py-10 text-lg">No short-term liabilities recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name/Lender</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Original Amt.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shortTermLiabilitiesWithStats.map(l => (
                    <React.Fragment key={l.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                       <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>{l.name}</div> <div className="text-xs text-gray-500">{l.lender}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-700">{formatCurrency(l.originalAmount)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatDateReadable(l.dueDate)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-green-600">
                         <button onClick={() => toggleSTLPaymentsList(l.id)} className="hover:underline focus:outline-none" title="View Payments" disabled={l.payments.length === 0}>
                            {formatCurrency(l.paid)}
                            {l.payments.length > 0 && <i className={`fas fa-chevron-down fa-xs ml-1 transform transition-transform ${expandedSTLId === l.id ? 'rotate-180' : ''}`}></i>}
                        </button>
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${l.remaining > 0 ? 'text-red-600' : 'text-gray-700'}`}>{formatCurrency(l.remaining)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-xs">
                        <span className={`px-2 py-1 font-semibold leading-tight rounded-full ${getSTLStatusColor(l.status)}`}>{l.status}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1">
                        {l.status !== ShortTermLiabilityStatus.PAID && <Button variant="secondary" size="sm" onClick={() => handleAddSTLPaymentClick(l)} title="Add Payment"><i className="fas fa-dollar-sign"></i></Button>}
                        <Button variant="outline" size="sm" onClick={() => navigate(`/liabilities/short-term/edit/${l.id}`)} title="Edit Liability"><i className="fas fa-pencil-alt"></i></Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteSTLClick(l)} title="Delete Liability"><i className="fas fa-trash-alt"></i></Button>
                      </td>
                    </tr>
                    {expandedSTLId === l.id && l.payments.length > 0 && (
                        <tr><td colSpan={7} className="p-3 bg-gray-50"><div className="text-sm text-gray-700">
                            <h4 className="font-semibold mb-1">Payment History:</h4><ul className="list-disc pl-5 space-y-1">
                                {l.payments.map(p => (<li key={p.id}>{formatDateReadable(p.date)}: {formatCurrency(p.amount)}
                                    {p.paymentMethod && ` (Method: ${p.paymentMethod}`}
                                    {p.bankAccountId && getBankAccountById(p.bankAccountId) && `, Bank: ${getBankAccountById(p.bankAccountId)?.accountName}`}
                                    {p.creditCardId && getCreditCardById(p.creditCardId) && `, Card: ${getCreditCardById(p.creditCardId)?.name}`}
                                    {p.paymentMethod && `)`}
                                    {p.notes && <span className="text-xs text-gray-500 italic"> - {p.notes}</span>}</li>))}</ul></div></td></tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Modals for Long-Term Liabilities */}
      <Modal isOpen={showDeleteLTLModal} onClose={() => setShowDeleteLTLModal(false)} title="Confirm Delete Long-Term Liability">
        <p>Are you sure you want to delete the liability: <strong>{ltlToDelete?.name}</strong>?</p>
        <div className="mt-6 flex justify-end space-x-3"><Button variant="light" onClick={() => setShowDeleteLTLModal(false)}>Cancel</Button><Button variant="danger" onClick={confirmDeleteLTL}>Delete</Button></div>
      </Modal>
      {ltlForPayment && <AddLongTermLiabilityPaymentModal isOpen={showAddLTLSModal} onClose={() => setShowAddLTLPaymentModal(false)} onAddPayment={handleSaveLTLPayment} liability={ltlForPayment} />}

      {/* Modals for Short-Term Liabilities */}
      <Modal isOpen={showDeleteSTLModal} onClose={() => setShowDeleteSTLModal(false)} title="Confirm Delete Short-Term Liability">
        <p>Are you sure you want to delete the liability: <strong>{stlToDelete?.name}</strong>?</p>
        <div className="mt-6 flex justify-end space-x-3"><Button variant="light" onClick={() => setShowDeleteSTLModal(false)}>Cancel</Button><Button variant="danger" onClick={confirmDeleteSTL}>Delete</Button></div>
      </Modal>
      {stlForPayment && <AddShortTermLiabilityPaymentModal isOpen={showAddSTLPaymentModal} onClose={() => setShowAddSTLPaymentModal(false)} onAddPayment={handleSaveSTLPayment} liability={stlForPayment} />}

    </div>
  );
};

export default LiabilitiesScreen;
