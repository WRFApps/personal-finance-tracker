import React, { useState, useContext, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { RecurringTransaction, TransactionType, Category, PaymentMethod, RecurringFrequency } from '../types.ts';
import Input from './ui/Input.tsx';
import Select from './ui/Select.tsx';
import Button from './ui/Button.tsx';
import { PAYMENT_METHOD_OPTIONS, RECURRING_FREQUENCY_OPTIONS, calculateNextDueDate } from '../constants.ts';

interface RecurringFormLocationState {
  type?: TransactionType;
}

const RecurringTransactionFormScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();

  const locationState = location.state as RecurringFormLocationState | null;
  const initialTypeFromState = locationState?.type;

  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>(initialTypeFromState || TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [creditCardId, setCreditCardId] = useState<string>('');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  
  const [frequency, setFrequency] = useState<RecurringFrequency>(RecurringFrequency.MONTHLY);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState<string>(''); // For weekly
  const [dayOfMonth, setDayOfMonth] = useState<string>(''); // For monthly/yearly
  const [notes, setNotes] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && context?.getRecurringTransactionById && id) {
      const rtToEdit = context.getRecurringTransactionById(id);
      if (rtToEdit) {
        setDescription(rtToEdit.description);
        setAmount(rtToEdit.amount.toString());
        setType(rtToEdit.type);
        setCategoryId(rtToEdit.categoryId);
        setPaymentMethod(rtToEdit.paymentMethod);
        setCreditCardId(rtToEdit.creditCardId || '');
        setBankAccountId(rtToEdit.bankAccountId || '');
        setFrequency(rtToEdit.frequency);
        setStartDate(rtToEdit.startDate);
        setEndDate(rtToEdit.endDate || '');
        setDayOfWeek(rtToEdit.dayOfWeek?.toString() || '');
        setDayOfMonth(rtToEdit.dayOfMonth?.toString() || '');
        setNotes(rtToEdit.notes || '');
        setIsActive(rtToEdit.isActive);
      } else {
        alert("Recurring Transaction not found!");
        navigate('/recurring');
      }
    } else if (initialTypeFromState) {
        setType(initialTypeFromState);
    }
  }, [id, isEditing, context, navigate, initialTypeFromState]);

  useEffect(() => {
    if (paymentMethod !== PaymentMethod.CREDIT_CARD) setCreditCardId('');
    if (type === TransactionType.INCOME && paymentMethod === PaymentMethod.CASH) setBankAccountId('');
    else if (type === TransactionType.EXPENSE && paymentMethod !== PaymentMethod.BANK_TRANSFER) setBankAccountId('');
  }, [type, paymentMethod]);
  
  useEffect(() => { // Reset dayOfWeek/dayOfMonth when frequency changes
    if (frequency !== RecurringFrequency.WEEKLY) setDayOfWeek('');
    if (frequency !== RecurringFrequency.MONTHLY && frequency !== RecurringFrequency.YEARLY) setDayOfMonth('');
  }, [frequency]);


  if (!context) return <div className="text-center py-10">Loading context...</div>;
  const { categories, creditCards, bankAccounts, addRecurringTransaction, updateRecurringTransaction } = context;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!description.trim()) newErrors.description = 'Description is required.';
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) newErrors.amount = 'Amount must be a positive number.';
    if (!categoryId) newErrors.categoryId = 'Category is required.';
    if (paymentMethod === PaymentMethod.CREDIT_CARD && !creditCardId) newErrors.creditCardId = 'Credit card is required.';
    if ((type === TransactionType.INCOME && paymentMethod !== PaymentMethod.CASH && !bankAccountId) || (type === TransactionType.EXPENSE && paymentMethod === PaymentMethod.BANK_TRANSFER && !bankAccountId)) {
        newErrors.bankAccountId = 'Bank account is required for this payment method and type.';
    }
    if (!startDate) newErrors.startDate = 'Start date is required.';
    if (endDate && new Date(endDate) < new Date(startDate)) newErrors.endDate = 'End date cannot be before start date.';
    if (frequency === RecurringFrequency.WEEKLY && !dayOfWeek) newErrors.dayOfWeek = 'Day of week is required for weekly recurrence.';
    if ((frequency === RecurringFrequency.MONTHLY || frequency === RecurringFrequency.YEARLY) && !dayOfMonth) newErrors.dayOfMonth = 'Day of month is required for monthly/yearly recurrence.';
    if (dayOfMonth && (parseInt(dayOfMonth) < 1 || parseInt(dayOfMonth) > 31)) newErrors.dayOfMonth = 'Day of month must be between 1 and 31.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const baseRtData = {
      description: description.trim(),
      amount: parseFloat(amount),
      type,
      categoryId,
      paymentMethod,
      creditCardId: paymentMethod === PaymentMethod.CREDIT_CARD ? creditCardId : undefined,
      bankAccountId: ((type === TransactionType.INCOME && paymentMethod !== PaymentMethod.CASH) || (type === TransactionType.EXPENSE && paymentMethod === PaymentMethod.BANK_TRANSFER)) ? bankAccountId : undefined,
      frequency,
      startDate,
      endDate: endDate || undefined,
      dayOfWeek: frequency === RecurringFrequency.WEEKLY && dayOfWeek ? parseInt(dayOfWeek) : undefined,
      dayOfMonth: (frequency === RecurringFrequency.MONTHLY || frequency === RecurringFrequency.YEARLY) && dayOfMonth ? parseInt(dayOfMonth) : undefined,
      notes: notes.trim(),
    };

    if (isEditing && id) {
      const existingRt = context.getRecurringTransactionById(id);
      if(existingRt) {
        updateRecurringTransaction({ 
            ...existingRt, // Preserve nextDueDate, lastProcessedDate from existing
            ...baseRtData, // Override with form data
            isActive, // Explicitly pass isActive from form state
            nextDueDate: calculateNextDueDate({ // Recalculate next due date if relevant fields changed
                ...existingRt, ...baseRtData 
            }) 
        });
      }
    } else {
      addRecurringTransaction({...baseRtData});
    }
    navigate('/recurring');
  };

  const categoryOptions = categories.map(cat => ({ value: cat.id, label: cat.name }));
  const creditCardOptions = creditCards.map(cc => ({ value: cc.id, label: `${cc.name} (${cc.bankName})` }));
  const bankAccountOptions = bankAccounts.map(ba => ({ value: ba.id, label: `${ba.accountName} (${ba.bankName})`}));
  const typeOptions = [{ value: TransactionType.INCOME, label: 'Income' }, { value: TransactionType.EXPENSE, label: 'Expense' }];
  const dayOfWeekOptions = [ { value: '0', label: 'Sunday' }, { value: '1', label: 'Monday' }, { value: '2', label: 'Tuesday' }, { value: '3', label: 'Wednesday' }, { value: '4', label: 'Thursday' }, { value: '5', label: 'Friday' }, { value: '6', label: 'Saturday' }];
  const dayOfMonthOptions = Array.from({ length: 31 }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }));


  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-dark mb-8 text-center">{isEditing ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Description" type="text" value={description} onChange={e => setDescription(e.target.value)} error={errors.description} required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} error={errors.amount} step="0.01" min="0.01" required />
            <Select label="Type" value={type} onChange={e => setType(e.target.value as TransactionType)} options={typeOptions} required />
        </div>
        <Select label="Category" value={categoryId} onChange={e => setCategoryId(e.target.value)} options={categoryOptions} error={errors.categoryId} placeholder="Select category" required />
        <Select label="Payment Method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} options={PAYMENT_METHOD_OPTIONS} error={errors.paymentMethod} required />
        
        {paymentMethod === PaymentMethod.CREDIT_CARD && (
          <Select label="Credit Card" value={creditCardId} onChange={e => setCreditCardId(e.target.value)} options={creditCardOptions} error={errors.creditCardId} placeholder="Select credit card" required={paymentMethod === PaymentMethod.CREDIT_CARD} />
        )}
        {((type === TransactionType.INCOME && paymentMethod !== PaymentMethod.CASH) || (type === TransactionType.EXPENSE && paymentMethod === PaymentMethod.BANK_TRANSFER)) && (
          <Select label={type === TransactionType.INCOME ? "Deposit to Bank Account" : "Pay from Bank Account"} value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} options={bankAccountOptions} error={errors.bankAccountId} placeholder="Select bank account" required />
        )}

        <Select label="Frequency" value={frequency} onChange={e => setFrequency(e.target.value as RecurringFrequency)} options={RECURRING_FREQUENCY_OPTIONS} required />
        
        {frequency === RecurringFrequency.WEEKLY && (
            <Select label="Day of Week" value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} options={dayOfWeekOptions} error={errors.dayOfWeek} placeholder="Select day" required />
        )}
        {(frequency === RecurringFrequency.MONTHLY || frequency === RecurringFrequency.YEARLY) && (
            <Select label="Day of Month" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} options={dayOfMonthOptions} error={errors.dayOfMonth} placeholder="Select day" required />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} error={errors.startDate} required />
            <Input label="End Date (Optional)" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} error={errors.endDate} min={startDate}/>
        </div>
        <Input label="Notes (Optional)" type="text" value={notes} onChange={e => setNotes(e.target.value)} />
        
        {isEditing && (
            <div className="flex items-center">
                <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="form-checkbox h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded" />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">Active (will be processed)</label>
            </div>
        )}

        <div className="flex items-center justify-end space-x-4 pt-4">
          <Button type="button" variant="light" onClick={() => navigate('/recurring')}>Cancel</Button>
          <Button type="submit" variant="primary">{isEditing ? 'Save Changes' : 'Add Recurring Transaction'}</Button>
        </div>
      </form>
    </div>
  );
};

export default RecurringTransactionFormScreen;