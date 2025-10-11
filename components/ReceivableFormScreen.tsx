
import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { Receivable } from '../types.ts';
import Input from './ui/Input.tsx';
import Button from './ui/Button.tsx';

const ReceivableFormScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [debtorName, setDebtorName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && context?.getReceivableById) {
      const receivableToEdit = context.getReceivableById(id!);
      if (receivableToEdit) {
        setDebtorName(receivableToEdit.debtorName);
        setDescription(receivableToEdit.description);
        setTotalAmount(receivableToEdit.totalAmount.toString());
        setDueDate(receivableToEdit.dueDate);
      } else {
        console.error("Receivable not found!"); // Changed from alert
        navigate('/receivables');
      }
    }
  }, [id, isEditing, context, navigate]);

  if (!context) return <div className="flex items-center justify-center min-h-screen"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i><span className="ml-3 text-lg">Loading context...</span></div>;
  const { addReceivable, updateReceivable } = context;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!debtorName.trim()) newErrors.debtorName = 'Debtor name is required.';
    if (!description.trim()) newErrors.description = 'Description is required.';
    if (!totalAmount || isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
      newErrors.totalAmount = 'Total amount must be a positive number.';
    }
    if (!dueDate) newErrors.dueDate = 'Due date is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const receivableData = {
      debtorName: debtorName.trim(),
      description: description.trim(),
      totalAmount: parseFloat(totalAmount),
      dueDate,
    };

    if (isEditing && id) {
      updateReceivable({ ...receivableData, id });
    } else {
      addReceivable(receivableData);
    }
    navigate('/receivables');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-gray-200">
      <h2 className="text-2xl sm:text-3xl font-bold text-dark mb-6 sm:mb-8 text-center">
        {isEditing ? 'Edit Receivable' : 'Add New Receivable'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Debtor Name"
          type="text"
          id="debtorName"
          value={debtorName}
          onChange={e => setDebtorName(e.target.value)}
          error={errors.debtorName}
          placeholder="e.g., John Doe, Client Corp"
          required
        />
        <Input
          label="Description"
          type="text"
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          error={errors.description}
          placeholder="e.g., Invoice #123, Freelance Work"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
            label="Total Amount"
            type="number"
            id="totalAmount"
            value={totalAmount}
            onChange={e => setTotalAmount(e.target.value)}
            error={errors.totalAmount}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
            leftIcon={<i className="fas fa-dollar-sign text-gray-400"></i>}
            />
            <Input
            label="Due Date"
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            error={errors.dueDate}
            required
            />
        </div>
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
          <Button type="button" variant="light" onClick={() => navigate('/receivables')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" leftIcon={<i className={`fas ${isEditing ? 'fa-save' : 'fa-plus-circle'} mr-1.5`}></i>}>
            {isEditing ? 'Save Changes' : 'Add Receivable'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReceivableFormScreen;
