import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { CreditCard } from '../types.ts';
import Input from './ui/Input.tsx';
import Button from './ui/Button.tsx';

const CreditCardFormScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [name, setName] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [creditLimit, setCreditLimit] = useState<string>('');
  const [availableBalance, setAvailableBalance] = useState<string>('');
  const [statementDate, setStatementDate] = useState<string>(''); 
  const [dueDate, setDueDate] = useState<string>(''); 
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && context?.getCreditCardById && id) {
      const cardToEdit = context.getCreditCardById(id);
      if (cardToEdit) {
        setName(cardToEdit.name);
        setBankName(cardToEdit.bankName);
        setCreditLimit(cardToEdit.creditLimit.toString());
        setAvailableBalance(cardToEdit.availableBalance.toString());
        setStatementDate(cardToEdit.statementDate?.toString() || '');
        setDueDate(cardToEdit.dueDate?.toString() || '');
        setNotes(cardToEdit.notes || '');
      } else {
        alert("Credit Card not found!");
        navigate('/credit-cards');
      }
    }
  }, [id, isEditing, context, navigate]);

  // Auto-fill available balance if credit limit is entered for a new card
  useEffect(() => {
    if (!isEditing && creditLimit && !availableBalance) {
      const parsedCreditLimit = parseFloat(creditLimit);
      if (!isNaN(parsedCreditLimit) && parsedCreditLimit > 0) {
        setAvailableBalance(creditLimit);
      }
    }
  }, [creditLimit, isEditing, availableBalance]);


  if (!context) return <div>Loading context...</div>;
  const { addCreditCard, updateCreditCard } = context;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Card name is required.';
    if (!bankName.trim()) newErrors.bankName = 'Bank name is required.';
    
    const parsedCreditLimit = parseFloat(creditLimit);
    if (!creditLimit || isNaN(parsedCreditLimit) || parsedCreditLimit <= 0) {
      newErrors.creditLimit = 'Credit limit must be a positive number.';
    }

    const parsedAvailableBalance = parseFloat(availableBalance);
    if (availableBalance === '' || isNaN(parsedAvailableBalance) || parsedAvailableBalance < 0) {
      newErrors.availableBalance = 'Available balance must be a non-negative number.';
    } else if (!isNaN(parsedCreditLimit) && parsedAvailableBalance > parsedCreditLimit) {
      newErrors.availableBalance = 'Available balance cannot exceed credit limit.';
    }
    
    if (statementDate) {
        const sd = parseInt(statementDate);
        if (isNaN(sd) || sd < 1 || sd > 31) newErrors.statementDate = 'Statement day must be between 1 and 31.';
    }
    if (dueDate) {
        const dd = parseInt(dueDate);
        if (isNaN(dd) || dd < 1 || dd > 31) newErrors.dueDate = 'Due day must be between 1 and 31.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cardData: Omit<CreditCard, 'id'> = {
      name: name.trim(),
      bankName: bankName.trim(),
      creditLimit: parseFloat(creditLimit),
      availableBalance: parseFloat(availableBalance),
      statementDate: statementDate ? parseInt(statementDate) : undefined,
      dueDate: dueDate ? parseInt(dueDate) : undefined,
      notes: notes.trim(),
    };

    if (isEditing && id) {
      updateCreditCard({ ...cardData, id });
    } else {
      addCreditCard(cardData);
    }
    navigate('/credit-cards');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-dark mb-8 text-center">
        {isEditing ? 'Edit Credit Card' : 'Add New Credit Card'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Card Name"
          type="text"
          id="cardName"
          value={name}
          onChange={e => setName(e.target.value)}
          error={errors.name}
          placeholder="e.g., Visa Gold, Everyday Cashback"
          required
        />
        <Input
          label="Bank Name"
          type="text"
          id="bankName"
          value={bankName}
          onChange={e => setBankName(e.target.value)}
          error={errors.bankName}
          placeholder="e.g., HSBC, Citibank"
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
            label="Credit Limit"
            type="number"
            id="creditLimit"
            value={creditLimit}
            onChange={e => setCreditLimit(e.target.value)}
            error={errors.creditLimit}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
            />
            <Input
            label="Available Balance"
            type="number"
            id="availableBalance"
            value={availableBalance}
            onChange={e => setAvailableBalance(e.target.value)}
            error={errors.availableBalance}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
            label="Statement Day (1-31, Optional)"
            type="number"
            id="statementDate"
            value={statementDate}
            onChange={e => setStatementDate(e.target.value)}
            error={errors.statementDate}
            placeholder="e.g., 15"
            min="1" max="31"
            />
            <Input
            label="Due Day (1-31, Optional)"
            type="number"
            id="dueDate"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            error={errors.dueDate}
            placeholder="e.g., 5"
            min="1" max="31"
            />
        </div>
        <Input
            label="Notes (Optional)"
            type="text"
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g., Used for online shopping"
        />
        <div className="flex items-center justify-end space-x-4 pt-4">
          <Button type="button" variant="light" onClick={() => navigate('/credit-cards')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" leftIcon={<i className={`fas ${isEditing ? 'fa-save' : 'fa-plus-circle'}`}></i>}>
            {isEditing ? 'Save Changes' : 'Add Credit Card'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreditCardFormScreen;