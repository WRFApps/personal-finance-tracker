
import React, { useState, useContext, useEffect, ChangeEvent } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { Budget, Period } from '../types.ts';
import Input from './ui/Input.tsx';
import Select from './ui/Select.tsx';
import Button from './ui/Button.tsx';
import { getFirstDayOfCurrentMonth } from '../constants.ts';

const BudgetFormScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = ReactRouterDOM.useNavigate();
  const { id } = ReactRouterDOM.useParams<{ id?: string }>();

  const [categoryId, setCategoryId] = useState<string>('');
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [startDateMonth, setStartDateMonth] = useState<string>(getFirstDayOfCurrentMonth().substring(0, 7)); // YYYY-MM
  const [rolloverEnabled, setRolloverEnabled] = useState<boolean>(false); // New state for rollover
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && context?.budgets) {
      const budgetToEdit = context.budgets.find(b => b.id === id);
      if (budgetToEdit) {
        setCategoryId(budgetToEdit.categoryId);
        setLimitAmount(budgetToEdit.limitAmount.toString());
        setStartDateMonth(budgetToEdit.startDate.substring(0, 7));
        setRolloverEnabled(budgetToEdit.rolloverEnabled || false); // Set rollover state
      } else {
        context.notifyError("Budget not found!"); 
        navigate('/budgets');
      }
    } else {
        // Reset for new form
        setCategoryId(context?.categories?.[0]?.id || '');
        setLimitAmount('');
        setStartDateMonth(getFirstDayOfCurrentMonth().substring(0,7));
        setRolloverEnabled(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing, context?.budgets, context?.categories, navigate]);
  
  useEffect(() => {
    if (!isEditing && context?.categories && context.categories.length > 0 && !categoryId) {
        setCategoryId(context.categories[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, context?.categories]);


  if (!context) return <div className="flex items-center justify-center min-h-screen"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i><span className="ml-3 text-lg">Loading context...</span></div>;
  const { categories, addBudget, updateBudget, getCategoryName, notifyError } = context;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!categoryId) newErrors.categoryId = 'Category is required.';
    if (!limitAmount || isNaN(parseFloat(limitAmount)) || parseFloat(limitAmount) <= 0) {
      newErrors.limitAmount = 'Limit amount must be a positive number.';
    }
    if (!startDateMonth) newErrors.startDateMonth = 'Budget month is required.';
    else {
      const monthYearRegex = /^\d{4}-\d{2}$/;
      if (!monthYearRegex.test(startDateMonth)) {
        newErrors.startDateMonth = 'Month format must be YYYY-MM.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const budgetData: Omit<Budget, 'id' | 'period'> & { period?: Period } = { // Include rolloverEnabled
      categoryId,
      limitAmount: parseFloat(limitAmount),
      startDate: `${startDateMonth}-01`, 
      rolloverEnabled, // Add rolloverEnabled to data
    };

    let navigateAfter = true;
    if (isEditing && id) {
      updateBudget({ ...budgetData, id, period: Period.MONTHLY }); // toast handled in App.tsx
    } else {
      const existing = context.budgets.find(b => b.categoryId === categoryId && b.startDate.substring(0, 7) === startDateMonth);
      if (existing) {
        setErrors(prev => ({...prev, startDateMonth: `A budget for ${getCategoryName(categoryId)} for ${startDateMonth} already exists.`}));
        notifyError(`A budget for ${getCategoryName(categoryId)} for ${startDateMonth} already exists.`);
        navigateAfter = false; 
      } else {
        addBudget(budgetData); // toast handled in App.tsx
      }
    }
    
    if(navigateAfter) {
      navigate('/budgets');
    }
  };

  const categoryOptions = categories.map(cat => ({ value: cat.id, label: cat.name }));

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-gray-200">
      <h2 className="text-2xl sm:text-3xl font-bold text-dark mb-6 sm:mb-8 text-center">
        {isEditing ? 'Edit Budget' : 'Add New Budget'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Select
          label="Category"
          id="categoryId"
          value={categoryId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value)}
          options={categoryOptions}
          error={errors.categoryId}
          placeholder="Select a category"
          required
        />
        <Input
          label="Limit Amount"
          type="number"
          id="limitAmount"
          value={limitAmount}
          onChange={e => setLimitAmount(e.target.value)}
          error={errors.limitAmount}
          placeholder="0.00"
          step="0.01"
          min="0.01"
          required
          leftIcon={<i className="fas fa-dollar-sign text-gray-400"></i>}
        />
        <Input
          label="Budget Month (YYYY-MM)"
          type="month"
          id="startDateMonth"
          value={startDateMonth}
          onChange={e => setStartDateMonth(e.target.value)}
          error={errors.startDateMonth}
          required
        />
        <div className="flex items-center pt-2">
          <input
            type="checkbox"
            id="rolloverEnabled"
            checked={rolloverEnabled}
            onChange={e => setRolloverEnabled(e.target.checked)}
            className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="rolloverEnabled" className="ml-2 text-sm font-medium text-gray-700">
            Enable Rollover (carry forward surplus/deficit to next month's budget limit)
          </label>
        </div>
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
          <Button type="button" variant="light" onClick={() => navigate('/budgets')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" leftIcon={<i className={`fas ${isEditing ? 'fa-save' : 'fa-plus-circle'} mr-1.5`}></i>}>
            {isEditing ? 'Save Changes' : 'Add Budget'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BudgetFormScreen;
    