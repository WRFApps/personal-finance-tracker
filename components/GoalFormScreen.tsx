
import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { FinancialGoal } from '../types.ts';
import Input from './ui/Input.tsx';
import Button from './ui/Button.tsx';

const GoalFormScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [name, setName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('0'); // Optional pre-fill if new
  const [deadline, setDeadline] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && context?.getFinancialGoalById && id) {
      const goalToEdit = context.getFinancialGoalById(id);
      if (goalToEdit) {
        setName(goalToEdit.name);
        setTargetAmount(goalToEdit.targetAmount.toString());
        setCurrentAmount(goalToEdit.currentAmount.toString());
        setDeadline(goalToEdit.deadline || '');
        setNotes(goalToEdit.notes || '');
      } else {
        alert("Financial Goal not found!");
        navigate('/goals');
      }
    } else {
        // Reset for new form
        setName('');
        setTargetAmount('');
        setCurrentAmount('0');
        setDeadline('');
        setNotes('');
    }
  }, [id, isEditing, context, navigate]);

  if (!context) return <div className="text-center py-10">Loading context...</div>;
  const { addFinancialGoal, updateFinancialGoal } = context;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Goal name is required.';
    if (!targetAmount || isNaN(parseFloat(targetAmount)) || parseFloat(targetAmount) <= 0) {
      newErrors.targetAmount = 'Target amount must be a positive number.';
    }
    const parsedCurrentAmount = parseFloat(currentAmount);
    // This validation for currentAmount is less critical now as the field will be disabled,
    // but it's good to keep if it were ever re-enabled without changing updateFinancialGoal.
    if (currentAmount && (isNaN(parsedCurrentAmount) || parsedCurrentAmount < 0)) {
      newErrors.currentAmount = 'Current amount must be a non-negative number.';
    } else if (!isNaN(parsedCurrentAmount) && !isNaN(parseFloat(targetAmount)) && parsedCurrentAmount > parseFloat(targetAmount)) {
      // This check is primarily for data integrity if currentAmount were somehow settable.
      // With a disabled field, this part of the validation becomes less user-facing.
      newErrors.currentAmount = 'Current amount cannot exceed target amount.';
    }
    if (deadline && new Date(deadline) < new Date(new Date().toISOString().split('T')[0])) {
        // Allow same day deadline
        if (new Date(deadline).toISOString().split('T')[0] !== new Date().toISOString().split('T')[0]){
             newErrors.deadline = 'Deadline cannot be in the past.';
        }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const goalData = { // This object matches the properties updateFinancialGoal expects (excluding id)
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      deadline: deadline || undefined,
      notes: notes.trim(),
    };

    if (isEditing && id) {
      updateFinancialGoal({ 
          ...goalData, 
          id
        });
    } else {
      addFinancialGoal({
          ...goalData,
          // For new goals, currentAmount is initialized to 0 by addFinancialGoal in App.tsx.
      });
    }
    navigate('/goals');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-dark mb-8 text-center">
        {isEditing ? 'Edit Financial Goal' : 'Add New Financial Goal'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Goal Name" type="text" id="goalName" value={name} onChange={e => setName(e.target.value)} error={errors.name} placeholder="e.g., Emergency Fund, Dream Vacation" required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Target Amount" type="number" id="targetAmount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} error={errors.targetAmount} placeholder="0.00" step="0.01" min="0.01" required />
            <Input 
              label="Current Amount (Saved)" 
              type="number" 
              id="currentAmount" 
              value={currentAmount} // Value is from state, populated on edit or '0' for new
              onChange={e => setCurrentAmount(e.target.value)} // onChange is benign for disabled field
              error={errors.currentAmount} 
              placeholder="0.00" 
              step="0.01" 
              min="0" 
              disabled={true} // Always disabled
              title="Current amount is managed by contributions." 
            />
        </div>
        <Input label="Deadline (Optional)" type="date" id="deadline" value={deadline} onChange={e => setDeadline(e.target.value)} error={errors.deadline} />
        <Input label="Notes (Optional)" type="text" id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Specific details about the goal" />
        
        <div className="flex items-center justify-end space-x-4 pt-4">
          <Button type="button" variant="light" onClick={() => navigate('/goals')}>Cancel</Button>
          <Button type="submit" variant="primary" leftIcon={<i className={`fas ${isEditing ? 'fa-save' : 'fa-plus-circle'}`}></i>}>
            {isEditing ? 'Save Changes' : 'Add Goal'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GoalFormScreen;
