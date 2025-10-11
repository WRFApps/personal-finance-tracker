import React, { useState, useContext, useEffect, ChangeEvent } from 'react';
import { AppContext } from '../App.tsx';
import { CreditCard, PaymentMethod } from '../types.ts'; // Added PaymentMethod
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import Select from './ui/Select.tsx';
import Button from './ui/Button.tsx';

interface CreditCardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditCard: CreditCard;
}

const CreditCardPaymentModal: React.FC<CreditCardPaymentModalProps> = ({ isOpen, onClose, creditCard }) => {
  const context = useContext(AppContext);

  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Pre-fill amount to pay off remaining balance or a common payment amount
      const usedAmount = creditCard.creditLimit - creditCard.availableBalance;
      setAmount(usedAmount > 0 ? usedAmount.toFixed(2) : '');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setBankAccountId(context?.bankAccounts?.[0]?.id || '');
      setNotes('');
      setError('');
    }
  }, [isOpen, creditCard, context?.bankAccounts]);

  if (!context) return null;
  const { bankAccounts, recordCreditCardPayment, formatCurrency } = context;

  const bankAccountOptions = bankAccounts.map(ba => ({ 
    value: ba.id, 
    label: `${ba.accountName} (${ba.bankName}) - Bal: ${formatCurrency(ba.currentBalance)}` 
  }));

  const handleSubmit = () => {
    setError('');
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Payment amount must be a positive number.');
      return;
    }
    if (!bankAccountId) {
      setError('Please select the bank account for payment.');
      return;
    }
    if (!paymentDate) {
      setError('Payment date is required.');
      return;
    }
    
    const payingBankAccount = bankAccounts.find(b => b.id === bankAccountId);
    if (payingBankAccount && payingBankAccount.currentBalance < parsedAmount) {
        setError(`Insufficient funds in ${payingBankAccount.accountName}. Current balance: ${formatCurrency(payingBankAccount.currentBalance)}.`);
        return;
    }

    // Check if payment exceeds amount needed to reach credit limit
    const maxPaymentAmount = creditCard.creditLimit - creditCard.availableBalance;
    if (parsedAmount > maxPaymentAmount && maxPaymentAmount > 0) { // only if there's something to pay
      setError(`Payment amount (${formatCurrency(parsedAmount)}) exceeds the outstanding balance of ${formatCurrency(maxPaymentAmount)}. Max payable is ${formatCurrency(maxPaymentAmount)}.`);
      return;
    }
     if (maxPaymentAmount <= 0 && parsedAmount > 0) {
      setError(`This card has no outstanding balance or is already at its limit. No payment needed.`);
      return;
    }

    // Corrected call to recordCreditCardPayment:
    // The payment method is BANK_TRANSFER as we are paying from a bank account.
    // bankAccountId is passed as the 5th argument.
    recordCreditCardPayment(creditCard.id, parsedAmount, PaymentMethod.BANK_TRANSFER, paymentDate, bankAccountId, notes.trim());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Payment for ${creditCard.name}`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Card: <strong className="text-indigo-600">{creditCard.name} ({creditCard.bankName})</strong>
        </p>
        <p className="text-sm text-gray-600">
          Available Balance: <strong className="text-green-600">{formatCurrency(creditCard.availableBalance)}</strong> / {formatCurrency(creditCard.creditLimit)}
        </p>
         <p className="text-sm text-gray-600">
          Outstanding: <strong className="text-red-600">{formatCurrency(Math.max(0, creditCard.creditLimit - creditCard.availableBalance))}</strong>
        </p>
        <Input
          label="Payment Amount"
          type="number"
          id="paymentAmount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0.01"
          required
        />
        <Select
          label="Pay From Bank Account"
          id="payingBankAccountId"
          value={bankAccountId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setBankAccountId(e.target.value)}
          options={bankAccountOptions}
          placeholder="Select bank account"
          required
        />
        <Input
          label="Payment Date"
          type="date"
          id="paymentDate"
          value={paymentDate}
          onChange={e => setPaymentDate(e.target.value)}
          required
        />
        <Input
          label="Notes (Optional)"
          type="text"
          id="paymentNotes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g., Monthly statement payment"
        />
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="light" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} leftIcon={<i className="fas fa-check-circle"></i>}>Confirm Payment</Button>
      </div>
    </Modal>
  );
};

export default CreditCardPaymentModal;