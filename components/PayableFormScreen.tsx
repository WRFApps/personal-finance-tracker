
import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { Payable } from '../types.ts';
import Input from './ui/Input.tsx';
import Button from './ui/Button.tsx';

const PayableFormScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [creditorName, setCreditorName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && context?.getPayableById && id) {
      const payableToEdit = context.getPayableById(id);
      if (payableToEdit) {
        setCreditorName(payableToEdit.creditorName);
        setDescription(payableToEdit.description);
        setTotalAmount(payableToEdit.totalAmount.toString());
        setDueDate(payableToEdit.dueDate);
      } else {
        alert("Payable not found!");
        navigate('/payables');
      }
    }
  }, [id, isEditing, context, navigate]);

  if (!context) return <div>Loading context...</div>;
  const { addPayable, updatePayable } = context;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!creditorName.trim()) newErrors.creditorName = 'Creditor name is required.';
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

    const payableData = { 
      creditorName: creditorName.trim(),
      description: description.trim(),
      totalAmount: parseFloat(totalAmount),
      dueDate,
    };

    if (isEditing && id) {
      updatePayable({ ...payableData, id });
    } else {
      addPayable(payableData);
    }
    navigate('/payables');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-dark mb-8 text-center">
        {isEditing ? 'Edit Payable' : 'Add New Payable'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Creditor Name"
          type="text"
          id="creditorName"
          value={creditorName}
          onChange={e => setCreditorName(e.target.value)}
          error={errors.creditorName}
          placeholder="e.g., Utility Company, Landlord"
          required
        />
        <Input
          label="Description"
          type="text"
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          error={errors.description}
          placeholder="e.g., Electricity Bill, Rent for May"
          required
        />
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
        <div className="flex items-center justify-end space-x-4 pt-4">
          <Button type="button" variant="light" onClick={() => navigate('/payables')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" leftIcon={<i className={`fas ${isEditing ? 'fa-save' : 'fa-plus-circle'}`}></i>}>
            {isEditing ? 'Save Changes' : 'Add Payable'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PayableFormScreen;
