
import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { BankAccount } from '../types.ts';
import Input from './ui/Input.tsx';
import Button from './ui/Button.tsx';

const BankAccountFormScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [accountName, setAccountName] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [currentBalance, setCurrentBalance] = useState<string>('0'); 
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && context?.getBankAccountById) {
      const accountToEdit = context.getBankAccountById(id!);
      if (accountToEdit) {
        setAccountName(accountToEdit.accountName);
        setBankName(accountToEdit.bankName);
        setCurrentBalance(accountToEdit.currentBalance.toString());
        setNotes(accountToEdit.notes || '');
      } else {
        alert("Bank Account not found!");
        navigate('/bank-accounts');
      }
    }
  }, [id, isEditing, context, navigate]);

  if (!context) return <div>Loading context...</div>;
  const { addBankAccount, updateBankAccount } = context;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!accountName.trim()) newErrors.accountName = 'Account name is required.';
    if (!bankName.trim()) newErrors.bankName = 'Bank name is required.';
    if (currentBalance === '' || isNaN(parseFloat(currentBalance))) { 
      newErrors.currentBalance = 'Current balance must be a valid number.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const accountData: Omit<BankAccount, 'id'> = {
      accountName: accountName.trim(),
      bankName: bankName.trim(),
      currentBalance: parseFloat(currentBalance),
      notes: notes.trim(),
    };

    if (isEditing && id) {
      updateBankAccount({ ...accountData, id });
    } else {
      addBankAccount(accountData);
    }
    navigate('/bank-accounts');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-dark mb-8 text-center">
        {isEditing ? 'Edit Bank Account' : 'Add New Bank Account'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Account Name"
          type="text"
          id="accountName"
          value={accountName}
          onChange={e => setAccountName(e.target.value)}
          error={errors.accountName}
          placeholder="e.g., Main Checking, Savings Account"
          required
        />
        <Input
          label="Bank Name"
          type="text"
          id="bankName"
          value={bankName}
          onChange={e => setBankName(e.target.value)}
          error={errors.bankName}
          placeholder="e.g., Chase, Wells Fargo"
          required
        />
        <Input
          label={isEditing ? "Current Balance" : "Initial Balance"}
          type="number"
          id="currentBalance"
          value={currentBalance}
          onChange={e => setCurrentBalance(e.target.value)}
          error={errors.currentBalance}
          placeholder="0.00"
          step="0.01"
          required
        />
        <Input
            label="Notes (Optional)"
            type="text"
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g., Primary account for salary"
        />
        <div className="flex items-center justify-end space-x-4 pt-4">
          <Button type="button" variant="light" onClick={() => navigate('/bank-accounts')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" leftIcon={<i className={`fas ${isEditing ? 'fa-save' : 'fa-plus-circle'}`}></i>}>
            {isEditing ? 'Save Changes' : 'Add Bank Account'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BankAccountFormScreen;
