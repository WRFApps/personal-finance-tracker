import React, { useState, useContext, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { LongTermLiability, LiabilityType } from '../types.ts'; // Updated type
import Input from './ui/Input.tsx';
import Select from './ui/Select.tsx';
import Button from './ui/Button.tsx';
import { LIABILITY_TYPE_OPTIONS } from '../constants.ts';

const LongTermLiabilityFormScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [name, setName] = useState<string>('');
  const [type, setType] = useState<LiabilityType>(LiabilityType.OTHER);
  const [lender, setLender] = useState<string>('');
  const [originalAmount, setOriginalAmount] = useState<string>('');
  const [monthlyPayment, setMonthlyPayment] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && context?.getLongTermLiabilityById) { // Updated context function name
      const liabilityToEdit = context.getLongTermLiabilityById(id!);
      if (liabilityToEdit) {
        setName(liabilityToEdit.name);
        setType(liabilityToEdit.type);
        setLender(liabilityToEdit.lender);
        setOriginalAmount(liabilityToEdit.originalAmount.toString());
        setMonthlyPayment(liabilityToEdit.monthlyPayment.toString());
        setStartDate(liabilityToEdit.startDate);
        setEndDate(liabilityToEdit.endDate || '');
        setInterestRate(liabilityToEdit.interestRate?.toString() || '');
        setNotes(liabilityToEdit.notes || '');
      } else {
        alert("Long-Term Liability not found!");
        navigate('/liabilities'); // Navigate to the main liabilities screen
      }
    }
  }, [id, isEditing, context, navigate]);

  if (!context) return <div>Loading context...</div>;
  const { addLongTermLiability, updateLongTermLiability } = context; // Updated context functions

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Liability name is required.';
    if (!type) newErrors.type = 'Liability type is required.';
    if (!lender.trim()) newErrors.lender = 'Lender/Vendor name is required.';
    if (!originalAmount || isNaN(parseFloat(originalAmount)) || parseFloat(originalAmount) <= 0) {
      newErrors.originalAmount = 'Original amount must be a positive number.';
    }
    if (!monthlyPayment || isNaN(parseFloat(monthlyPayment)) || parseFloat(monthlyPayment) <= 0) {
      newErrors.monthlyPayment = 'Monthly payment must be a positive number.';
    }
    if (!startDate) newErrors.startDate = 'Start date is required.';
    if (endDate && new Date(endDate) < new Date(startDate)) {
        newErrors.endDate = 'End date cannot be before start date.';
    }
    if (interestRate && (isNaN(parseFloat(interestRate)) || parseFloat(interestRate) < 0)) {
        newErrors.interestRate = 'Interest rate must be a non-negative number.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const liabilityData: Omit<LongTermLiability, 'id' | 'payments' | 'createdAt'> = {
      name: name.trim(),
      type,
      lender: lender.trim(),
      originalAmount: parseFloat(originalAmount),
      monthlyPayment: parseFloat(monthlyPayment),
      startDate,
      endDate: endDate || undefined,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      notes: notes.trim()
    };
    
    if (isEditing && id) {
      updateLongTermLiability({ ...liabilityData, id });
    } else {
      addLongTermLiability(liabilityData);
    }
    navigate('/liabilities'); // Navigate to the main liabilities screen
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-dark mb-8 text-center">
        {isEditing ? 'Edit Long-Term Liability' : 'Add New Long-Term Liability'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Liability Name"
          type="text"
          id="liabilityName"
          value={name}
          onChange={e => setName(e.target.value)}
          error={errors.name}
          placeholder="e.g., Mortgage - 123 Main St, Car Loan - Toyota Camry"
          required
        />
        <Select
          label="Liability Type"
          id="liabilityType"
          value={type}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setType(e.target.value as LiabilityType)}
          options={LIABILITY_TYPE_OPTIONS}
          error={errors.type}
          required
        />
        <Input
          label="Lender / Vendor"
          type="text"
          id="lender"
          value={lender}
          onChange={e => setLender(e.target.value)}
          error={errors.lender}
          placeholder="e.g., City Bank, Toyota Financial Services"
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
            label="Original Amount"
            type="number"
            id="originalAmount"
            value={originalAmount}
            onChange={e => setOriginalAmount(e.target.value)}
            error={errors.originalAmount}
            placeholder="0.00"
            step="0.01" min="0.01" required
            />
            <Input
            label="Monthly Payment"
            type="number"
            id="monthlyPayment"
            value={monthlyPayment}
            onChange={e => setMonthlyPayment(e.target.value)}
            error={errors.monthlyPayment}
            placeholder="0.00"
            step="0.01" min="0.01" required
            />
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
            label="Start Date"
            type="date"
            id="startDate"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            error={errors.startDate}
            required
            />
            <Input
            label="End Date (Optional)"
            type="date"
            id="endDate"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            error={errors.endDate}
            />
        </div>
        <Input
            label="Interest Rate (%, Optional)"
            type="number"
            id="interestRate"
            value={interestRate}
            onChange={e => setInterestRate(e.target.value)}
            error={errors.interestRate}
            placeholder="e.g., 5.5 for 5.5%"
            step="0.01" min="0"
        />
        <Input
            label="Notes (Optional)"
            type="text"
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            containerClassName="mb-0"
            placeholder="e.g., Loan account number, specific terms"
        />

        <div className="flex items-center justify-end space-x-4 pt-4">
          <Button type="button" variant="light" onClick={() => navigate('/liabilities')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" leftIcon={<i className={`fas ${isEditing ? 'fa-save' : 'fa-plus-circle'}`}></i>}>
            {isEditing ? 'Save Changes' : 'Add Liability'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LongTermLiabilityFormScreen;