
import React, { useState, useContext, useEffect, ChangeEvent, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { Transaction, TransactionType, Category, PaymentMethod, ScannedReceiptData, TransactionSplit } from '../types.ts';
import Input from './ui/Input.tsx';
import Select from './ui/Select.tsx';
import Button from './ui/Button.tsx';
import { PAYMENT_METHOD_OPTIONS } from '../constants.ts';
import DashboardScreen from "./DashboardScreen";
import TransactionsListScreen from "./TransactionsListScreen";



interface TransactionFormLocationState {
  type?: TransactionType;
  scannedData?: ScannedReceiptData;
}

const TransactionFormScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = ReactRouterDOM.useNavigate();
  const { id } = ReactRouterDOM.useParams<{ id?: string }>();
  const location = ReactRouterDOM.useLocation();
  
  const locationState = location.state as TransactionFormLocationState | null;
  const initialTypeFromState = locationState?.type;
  const initialScannedData = locationState?.scannedData;

  const [date, setDate] = useState<string>(initialScannedData?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>(initialScannedData?.merchant || initialScannedData?.rawText?.split('\n')[0] || ''); // Use merchant, then first line of raw, then empty
  const [amount, setAmount] = useState<string>(initialScannedData?.amount || '');
  const [type, setType] = useState<TransactionType>(initialScannedData?.type || initialTypeFromState || TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState<string>(''); // Used if not split
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [creditCardId, setCreditCardId] = useState<string>('');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [isTaxRelevant, setIsTaxRelevant] = useState<boolean>(false);
  const [payee, setPayee] = useState<string>(initialScannedData?.merchant || ''); // Use merchant as payee
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [currentAttachmentInfo, setCurrentAttachmentInfo] = useState<{fileName: string; type: string; dataUrl?: string} | null>(null);

  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [splits, setSplits] = useState<TransactionSplit[]>([{ id: Date.now().toString(), categoryId: '', amount: 0, description: '' }]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [splitErrors, setSplitErrors] = useState<Record<string, Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && context?.transactions && id) {
      const transactionToEdit = context.transactions.find(t => t.id === id);
      if (transactionToEdit) {
        setDate(transactionToEdit.date);
        setDescription(transactionToEdit.description);
        setAmount(transactionToEdit.amount.toString());
        setType(transactionToEdit.type);
        setPaymentMethod(transactionToEdit.paymentMethod);
        setCreditCardId(transactionToEdit.creditCardId || '');
        setBankAccountId(transactionToEdit.bankAccountId || '');
        setIsTaxRelevant(transactionToEdit.isTaxRelevant || false);
        setPayee(transactionToEdit.payee || '');
        if (transactionToEdit.attachment) {
            setCurrentAttachmentInfo({ fileName: transactionToEdit.attachment.fileName, type: transactionToEdit.attachment.type, dataUrl: transactionToEdit.attachment.dataUrl });
        } else { setCurrentAttachmentInfo(null); }
        setAttachmentFile(null);

        setIsSplit(transactionToEdit.isSplit || false);
        if (transactionToEdit.isSplit && transactionToEdit.splits && transactionToEdit.splits.length > 0) {
            setSplits(transactionToEdit.splits.map(s => ({...s, id: s.id || Date.now().toString() + Math.random().toString(36).substring(2,7) })));
        } else {
            setCategoryId(transactionToEdit.categoryId || '');
            setSplits([{ id: Date.now().toString(), categoryId: '', amount: 0, description: '' }]);
        }
      } else { context.notifyError("Transaction not found!"); navigate('/');}
    } else if (initialTypeFromState && !initialScannedData) { setType(initialTypeFromState); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing, context?.transactions, navigate, initialTypeFromState, initialScannedData]);
  
  useEffect(() => { 
    if (context?.categories && context.categories.length > 0 && !isSplit) {
        const selectedCategoryObj = context.categories.find(c => c.id === categoryId);
        if (!isEditing && !categoryId && context.categories.length > 0 && !initialScannedData) {
            const defaultCategory = type === TransactionType.INCOME 
                ? context.categories.find(c => c.name.toLowerCase() === 'salary') || context.categories.find(c => c.defaultTaxRelevance === 'income')
                : context.categories.find(c => c.name.toLowerCase() === 'groceries') || context.categories.find(c => c.defaultTaxRelevance === 'none' || c.defaultTaxRelevance === 'deduction');
            const firstAvailableCategory = context.categories[0];
            const categoryToSet = defaultCategory || firstAvailableCategory;
            if (categoryToSet) {
                setCategoryId(categoryToSet.id);
                setIsTaxRelevant(categoryToSet.defaultTaxRelevance !== 'none' && !!categoryToSet.defaultTaxRelevance);
            }
        } else if (selectedCategoryObj) { 
             setIsTaxRelevant(selectedCategoryObj.defaultTaxRelevance !== 'none' && !!selectedCategoryObj.defaultTaxRelevance);
        }
    } else if (isSplit) { // For split transactions, tax relevance is on main transaction, not individual splits
        // No category-based tax relevance for the main transaction if split
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, categoryId, context?.categories, type, initialScannedData, isSplit]);

  useEffect(() => {
    if (paymentMethod !== PaymentMethod.CREDIT_CARD) setCreditCardId('');
    if (type === TransactionType.INCOME && (paymentMethod === PaymentMethod.CASH || paymentMethod === PaymentMethod.OTHER)) {
        setBankAccountId('');
    } else if (type === TransactionType.EXPENSE && ![PaymentMethod.BANK_TRANSFER, PaymentMethod.CHEQUE].includes(paymentMethod)) {
        setBankAccountId('');
    }
  }, [paymentMethod, type]);

  const totalSplitAmount = useMemo(() => {
    if (!isSplit) return parseFloat(amount) || 0;
    return splits.reduce((sum, split) => sum + (Number(split.amount) || 0), 0);
  }, [isSplit, splits, amount]);

  useEffect(() => {
    if (isSplit) {
        setAmount(totalSplitAmount.toFixed(2));
    }
  }, [isSplit, totalSplitAmount, setAmount]);


  if (!context) return <div className="flex items-center justify-center min-h-screen"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i><span className="ml-3 text-lg">Loading context...</span></div>;
  const { categories, addTransaction, updateTransaction, creditCards, bankAccounts, getCategoryById, notifyError } = context;

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newCatId = e.target.value;
    setCategoryId(newCatId);
    const category = getCategoryById(newCatId);
    if (category && !isSplit) { // Only update tax relevance if not split, based on main category
        setIsTaxRelevant(category.defaultTaxRelevance !== 'none' && !!category.defaultTaxRelevance);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 1024 * 1024 * 2) { // Increased to 2MB for flexibility
            setErrors(prev => ({...prev, attachment: "File is too large. Max 2MB allowed."}));
            setAttachmentFile(null); setCurrentAttachmentInfo(null);
            if (event.target) event.target.value = ''; 
            return;
        }
        setErrors(prev => ({...prev, attachment: undefined})); 
        setAttachmentFile(file);
        const reader = new FileReader();
        reader.onloadend = () => { setCurrentAttachmentInfo({ fileName: file.name, type: file.type, dataUrl: reader.result as string }); };
        reader.readAsDataURL(file);
    } else { setAttachmentFile(null); }
  };
  const removeAttachment = () => { setAttachmentFile(null); setCurrentAttachmentInfo(null); const fileInput = document.getElementById('attachment') as HTMLInputElement; if (fileInput) fileInput.value = ''; };

  const handleSplitChange = (index: number, field: keyof TransactionSplit, value: string | number) => {
    const newSplits = [...splits];
    (newSplits[index] as any)[field] = field === 'amount' ? (value === '' ? 0 : parseFloat(value as string)) : value;
    setSplits(newSplits);
  };
  const addSplit = () => setSplits([...splits, { id: Date.now().toString() + Math.random().toString(36).substring(2,7), categoryId: '', amount: 0, description: '' }]);
  const removeSplit = (index: number) => { if (splits.length > 1) setSplits(splits.filter((_, i) => i !== index)); };


  const validate = (): boolean => { 
    const newErrors: Record<string, string> = {};
    const newSplitErrors: Record<string, Record<string, string>> = {};
    if (!date) newErrors.date = 'Date is required.';
    if (!description.trim()) newErrors.description = 'Description is required.';
    
    const parsedTotalAmount = parseFloat(amount);
    if (!isSplit && (!amount || isNaN(parsedTotalAmount) || parsedTotalAmount <= 0)) {
      newErrors.amount = 'Amount must be a positive number.';
    } else if (isSplit && (isNaN(totalSplitAmount) || totalSplitAmount <= 0)) {
      newErrors.amount = 'Total split amount must be positive.';
    }
    
    if (!isSplit && !categoryId) newErrors.categoryId = 'Category is required.';
    if (paymentMethod === PaymentMethod.CREDIT_CARD && !creditCardId) newErrors.creditCardId = 'Credit card is required for this payment method.';
    if ( ((type === TransactionType.INCOME && (paymentMethod === PaymentMethod.BANK_TRANSFER || paymentMethod === PaymentMethod.CHEQUE)) || (type === TransactionType.EXPENSE && (paymentMethod === PaymentMethod.BANK_TRANSFER || paymentMethod === PaymentMethod.CHEQUE))) && !bankAccountId ) {
        newErrors.bankAccountId = 'Bank account is required for this payment method.';
    }
    if (attachmentFile && attachmentFile.size > 1024 * 1024 * 2) newErrors.attachment = "Attachment is too large. Max 2MB allowed.";

    if (isSplit) {
        splits.forEach((split, index) => {
            const currentSplitErrors: Record<string,string> = {};
            if (!split.categoryId) currentSplitErrors.categoryId = 'Category required.';
            if (split.amount <= 0) currentSplitErrors.amount = 'Amount > 0.';
            if(Object.keys(currentSplitErrors).length > 0) newSplitErrors[split.id] = currentSplitErrors;
        });
        if (splits.reduce((sum, s) => sum + s.amount, 0) <=0 && splits.length > 0) { // Check total if splits exist
            newErrors.splits = "Total of splits must be greater than 0.";
        }
    }
    
    setErrors(newErrors);
    setSplitErrors(newSplitErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newSplitErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    let finalBankAccountId = bankAccountId;
    if(type === TransactionType.INCOME && ![PaymentMethod.BANK_TRANSFER, PaymentMethod.CHEQUE].includes(paymentMethod)) finalBankAccountId = ''; 
    else if (type === TransactionType.EXPENSE && ![PaymentMethod.BANK_TRANSFER, PaymentMethod.CHEQUE].includes(paymentMethod)) finalBankAccountId = '';

    const trimmedPayee = payee.trim();
    const attachmentData = currentAttachmentInfo?.dataUrl ? { fileName: currentAttachmentInfo.fileName, dataUrl: currentAttachmentInfo.dataUrl, type: currentAttachmentInfo.type } : undefined;
    
    const finalAmount = isSplit ? totalSplitAmount : parseFloat(amount);

    const transactionData: Omit<Transaction, 'id'> = {
      date, description, amount: finalAmount, type, 
      categoryId: isSplit ? undefined : categoryId, 
      paymentMethod,
      creditCardId: paymentMethod === PaymentMethod.CREDIT_CARD ? creditCardId : undefined,
      bankAccountId: finalBankAccountId || undefined,
      isTaxRelevant,
      attachment: attachmentData,
      payee: trimmedPayee.length > 0 ? trimmedPayee : undefined, 
      isSplit,
      splits: isSplit ? splits.map(s => ({...s, amount: Number(s.amount)})) : undefined,
    };

    try {
      if (isEditing && id) updateTransaction({ ...transactionData, id });
      else addTransaction(transactionData);
      navigate('/transactions');
    } catch (err) { console.error("Submission error:", err); notifyError("Failed to save transaction. Please try again.");
    } finally { setIsSubmitting(false); }
  };

  const categoryOptions = categories.map(cat => ({ value: cat.id, label: cat.name }));
  const creditCardOptions = creditCards.map(cc => ({ value: cc.id, label: `${cc.name} (${cc.bankName})` }));
  const bankAccountOptions = bankAccounts.map(ba => ({ value: ba.id, label: `${ba.accountName} (${ba.bankName})`}));
  const typeOptions = [{value: TransactionType.INCOME, label: "Income"}, {value: TransactionType.EXPENSE, label: "Expense"}];

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl sm:text-3xl font-bold text-dark dark:text-gray-100 mb-6 sm:mb-8 text-center">
        {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
        {initialScannedData && !isEditing && <span className="block text-sm text-primary dark:text-primary-light mt-1">(From Scanned Receipt)</span>}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="Date" type="date" id="date" value={date} onChange={e => setDate(e.target.value)} error={errors.date} required autoFocus/>
            <Input label="Total Amount" type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} error={errors.amount} placeholder="0.00" step="0.01" min="0.01" required={!isSplit} disabled={isSplit} leftIcon={<i className="fas fa-dollar-sign text-gray-400 dark:text-gray-500"></i>} title={isSplit ? "Total amount calculated from splits" : "Enter total transaction amount"}/>
        </div>
        <Input label="Description" type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} error={errors.description} placeholder="e.g., Groceries from Supermarket" required />
        
        <div className="flex items-center">
            <input type="checkbox" id="isSplit" checked={isSplit} onChange={e => setIsSplit(e.target.checked)} className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded"/>
            <label htmlFor="isSplit" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Split Transaction (multiple categories)</label>
        </div>

        {isSplit && (
            <div className="space-y-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/30">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">Split Details:</h4>
                {errors.splits && <p className="text-xs text-danger">{errors.splits}</p>}
                {splits.map((split, index) => (
                    <div key={split.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start p-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                        <div className="sm:col-span-5">
                           <Select label={`Category ${index + 1}`} value={split.categoryId} onChange={e => handleSplitChange(index, 'categoryId', e.target.value)} options={categoryOptions} placeholder="Select category" containerClassName="mb-0" error={splitErrors[split.id]?.categoryId} required/>
                        </div>
                        <div className="sm:col-span-4">
                           <Input label={`Amount ${index + 1}`} type="number" value={split.amount.toString()} onChange={e => handleSplitChange(index, 'amount', e.target.value)} placeholder="0.00" step="0.01" min="0.01" containerClassName="mb-0" error={splitErrors[split.id]?.amount} required leftIcon={<i className="fas fa-dollar-sign text-gray-400 dark:text-gray-500 text-xs"></i>} />
                        </div>
                         <div className="sm:col-span-2">
                            <Input label={`Desc. ${index + 1} (Opt.)`} type="text" value={split.description || ''} onChange={e => handleSplitChange(index, 'description', e.target.value)} placeholder="Split notes" containerClassName="mb-0" />
                        </div>
                        <div className="sm:col-span-1 flex items-end justify-end h-full">
                           {splits.length > 1 && <Button type="button" variant="danger" size="xs" onClick={() => removeSplit(index)} iconOnly title="Remove split" className="mt-auto self-center"><i className="fas fa-times"></i></Button>}
                        </div>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addSplit} leftIcon={<i className="fas fa-plus"></i>}>Add Another Split</Button>
            </div>
        )}

        {!isSplit && (
            <Select label="Category" id="categoryId" value={categoryId} onChange={handleCategoryChange} options={categoryOptions} error={errors.categoryId} placeholder="Select a category" required />
        )}
        
        <Input label="Payee / Merchant (Optional)" type="text" id="payee" value={payee} onChange={e => setPayee(e.target.value)} placeholder="e.g., Walmart, Starbucks" />
        <Select label="Type" id="type" value={type} onChange={(e: ChangeEvent<HTMLSelectElement>) => setType(e.target.value as TransactionType)} options={typeOptions} error={errors.type} required />
        <Select label="Payment Method" id="paymentMethod" value={paymentMethod} onChange={(e: ChangeEvent<HTMLSelectElement>) => setPaymentMethod(e.target.value as PaymentMethod)} options={PAYMENT_METHOD_OPTIONS} error={errors.paymentMethod} required />
        
        {paymentMethod === PaymentMethod.CREDIT_CARD && ( <div className="animate-fadeIn"> <Select label="Credit Card Used" id="creditCardId" value={creditCardId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setCreditCardId(e.target.value)} options={creditCardOptions} error={errors.creditCardId} placeholder="Select credit card" required={paymentMethod === PaymentMethod.CREDIT_CARD} /> </div> )}
        {( (type === TransactionType.INCOME && (paymentMethod === PaymentMethod.BANK_TRANSFER || paymentMethod === PaymentMethod.CHEQUE)) || (type === TransactionType.EXPENSE && (paymentMethod === PaymentMethod.BANK_TRANSFER || paymentMethod === PaymentMethod.CHEQUE)) ) && ( <div className="animate-fadeIn"> <Select label={type === TransactionType.INCOME ? "Deposit to Bank Account" : "Pay from Bank Account"} id="bankAccountId" value={bankAccountId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setBankAccountId(e.target.value)} options={bankAccountOptions} error={errors.bankAccountId} placeholder="Select bank account" required /> </div> )}
        
        <div>
            <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Attach Receipt/Document (Optional)</label>
            <Input type="file" id="attachment" onChange={handleFileChange} containerClassName="mb-1" className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary dark:file:bg-primary/80 dark:file:text-white hover:file:bg-primary/20 dark:hover:file:bg-primary/70 cursor-pointer"/>
            <p className="text-xs text-gray-500 dark:text-gray-400">Keep attachments small (&lt;2MB recommended due to browser storage limits).</p>
            {currentAttachmentInfo && ( <div className="mt-2 flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"> <span className="text-gray-700 dark:text-gray-200 truncate" title={currentAttachmentInfo.fileName}> <i className="fas fa-paperclip mr-2 text-gray-500 dark:text-gray-400"></i> {currentAttachmentInfo.fileName} ({currentAttachmentInfo.type}) </span> <Button type="button" variant="danger" size="xs" onClick={removeAttachment} iconOnly title="Remove Attachment"> <i className="fas fa-times"></i> </Button> </div> )}
            {errors.attachment && <p className="mt-1.5 text-xs text-danger">{errors.attachment}</p>}
        </div>

        <div className="flex items-center pt-2">
            <input type="checkbox" id="isTaxRelevant" checked={isTaxRelevant} onChange={e => setIsTaxRelevant(e.target.checked)} className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-900" aria-labelledby="taxRelevantLabel"/>
            <label htmlFor="isTaxRelevant" id="taxRelevantLabel" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex items-center">Mark as potentially tax-relevant <i className="fas fa-info-circle text-gray-400 dark:text-gray-500 ml-1.5 hover:text-gray-600 dark:hover:text-gray-400" title="Check this if this transaction might be relevant for your tax filings (e.g., business expense, specific income types, donations). If not split, default is based on category settings. If split, this applies to the whole transaction."></i> </label>
        </div>
        
        <style>{`.animate-fadeIn { animation: fadeIn 0.3s ease-in-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <Button type="button" variant="light" onClick={() => navigate('/transactions')}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<i className={`fas ${isEditing ? 'fa-save' : 'fa-plus-circle'} mr-1.5`}></i>}> {isEditing ? 'Save Changes' : 'Add Transaction'} </Button>
        </div>
      </form>
    </div>
  );
};

export default TransactionFormScreen;
