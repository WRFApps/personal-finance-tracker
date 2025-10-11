
import React, { useState, useContext, useEffect, ChangeEvent } from 'react';
import { AppContext } from '../App.tsx';
import { BankAccount } from '../types.ts';
import Modal from './ui/Modal.tsx';
import Input from './ui/Input.tsx';
import Select from './ui/Select.tsx';
import Button from './ui/Button.tsx';

interface InterBankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InterBankTransferModal: React.FC<InterBankTransferModalProps> = ({ isOpen, onClose }) => {
  const context = useContext(AppContext);

  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setFromAccountId('');
      setToAccountId('');
      setAmount('');
      setTransferDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  if (!context) return null;
  const { bankAccounts, performInterBankTransfer, formatCurrency } = context;

  const handleSubmit = () => {
    setError('');
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Transfer amount must be a positive number.');
      return;
    }
    if (!fromAccountId) {
      setError('Please select the account to transfer from.');
      return;
    }
    if (!toAccountId) {
      setError('Please select the account to transfer to.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('From and To accounts cannot be the same.');
      return;
    }
    if (!transferDate) {
      setError('Transfer date is required.');
      return;
    }

    const fromAccount = bankAccounts.find(acc => acc.id === fromAccountId);
    if (fromAccount && fromAccount.currentBalance < parsedAmount) {
      setError(`Insufficient funds in ${fromAccount.accountName}. Current balance: ${formatCurrency(fromAccount.currentBalance)}.`);
      return;
    }

    performInterBankTransfer(fromAccountId, toAccountId, parsedAmount, transferDate, notes.trim());
    onClose();
  };

  const accountOptions = bankAccounts.map(ba => ({ 
    value: ba.id, 
    label: `${ba.accountName} (${ba.bankName}) - Bal: ${formatCurrency(ba.currentBalance)}` 
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Inter-Bank Account Transfer">
      <div className="space-y-4">
        <Select
          label="From Account"
          id="fromAccountId"
          value={fromAccountId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setFromAccountId(e.target.value)}
          options={accountOptions}
          placeholder="Select source account"
          required
        />
        <Select
          label="To Account"
          id="toAccountId"
          value={toAccountId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setToAccountId(e.target.value)}
          options={accountOptions.filter(opt => opt.value !== fromAccountId)} // Prevent selecting same account
          placeholder="Select destination account"
          required
        />
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
          placeholder="e.g., Savings contribution"
        />
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="light" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} leftIcon={<i className="fas fa-exchange-alt"></i>}>Confirm Transfer</Button>
      </div>
    </Modal>
  );
};

export default InterBankTransferModal;
