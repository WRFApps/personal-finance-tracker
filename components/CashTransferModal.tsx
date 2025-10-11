
import React, { useState, useContext, useEffect, ChangeEvent } from 'react';
import { AppContext } from '../App.tsx';
import { BankAccount } from '../types.ts';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import Select from './ui/Select.tsx';
import Button from './ui/Button.tsx';

interface CashTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCashBalance: number;
}

const CashTransferModal: React.FC<CashTransferModalProps> = ({ isOpen, onClose, currentCashBalance }) => {
  const context = useContext(AppContext);

  const [amount, setAmount] = useState('');
  const [targetBankAccountId, setTargetBankAccountId] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setTargetBankAccountId('');
      setTransferDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  if (!context) return null;
  const { bankAccounts, transferCashToBank, formatCurrency } = context;

  const bankAccountOptions = bankAccounts.map(ba => ({ value: ba.id, label: `${ba.accountName} (${ba.bankName}) - Bal: ${formatCurrency(ba.currentBalance)}` }));

  const handleSubmit = () => {
    setError('');
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Transfer amount must be a positive number.');
      return;
    }
    if (parsedAmount > currentCashBalance) {
      setError(`Transfer amount cannot exceed current cash balance of ${formatCurrency(currentCashBalance)}.`);
      return;
    }
    if (!targetBankAccountId) {
      setError('Please select a target bank account.');
      return;
    }
    if (!transferDate) {
      setError('Transfer date is required.');
      return;
    }

    transferCashToBank(parsedAmount, targetBankAccountId, transferDate, notes.trim());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Cash to Bank Account">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Current Cash Balance: <strong className="text-emerald-600">{formatCurrency(currentCashBalance)}</strong>
        </p>
        <Input
          label="Amount to Transfer"
          type="number"
          id="transferAmount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0.01"
          required
        />
        <Select
          label="To Bank Account"
          id="targetBankAccountId"
          value={targetBankAccountId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setTargetBankAccountId(e.target.value)}
          options={bankAccountOptions}
          placeholder="Select bank account"
          required
        />
        <Input
          label="Transfer Date"
          type="date"
          id="transferDate"
          value={transferDate}
          onChange={e => setTransferDate(e.target.value)}
          required
        />
        <Input
          label="Notes (Optional)"
          type="text"
          id="transferNotes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g., Monthly cash deposit"
        />
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="light" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} leftIcon={<i className="fas fa-exchange-alt"></i>}>Transfer</Button>
      </div>
    </Modal>
  );
};

export default CashTransferModal;
