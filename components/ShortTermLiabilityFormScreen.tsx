
import React, { useState, useContext, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { ShortTermLiability, ShortTermLiabilityPaymentStructure } from '../types.ts';
import Input from './ui/Input.tsx';
import Select from './ui/Select.tsx';
import Button from './ui/Button.tsx';

const ShortTermLiabilityFormScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [name, setName] = useState<string>('');
  const [lender, setLender] = useState<string>('');
  const [originalAmount, setOriginalAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  
  const [paymentStructure, setPaymentStructure] = useState<ShortTermLiabilityPaymentStructure>(ShortTermLiabilityPaymentStructure.SINGLE);
  const [numberOfInstallments, setNumberOfInstallments] = useState<string>('');
  const [paymentDayOfMonth, setPaymentDayOfMonth] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>(''); // New state for interest rate
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedMonthlyInstallment, setCalculatedMonthlyInstallment] = useState<number | null>(null);

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && context?.getShortTermLiabilityById && id) {
      const liabilityToEdit = context.getShortTermLiabilityById(id);
      if (liabilityToEdit) {
        setName(liabilityToEdit.name);
        setLender(liabilityToEdit.lender);
        setOriginalAmount(liabilityToEdit.originalAmount.toString());
        setDueDate(liabilityToEdit.dueDate);
        setNotes(liabilityToEdit.notes || '');
        setPaymentStructure(liabilityToEdit.paymentStructure || ShortTermLiabilityPaymentStructure.SINGLE);
        setNumberOfInstallments(liabilityToEdit.numberOfInstallments?.toString() || '');
        setPaymentDayOfMonth(liabilityToEdit.paymentDayOfMonth?.toString() || '');
        setInterestRate(liabilityToEdit.interestRate?.toString() || ''); // Set interest rate
      } else {
        alert("Short-Term Liability not found!");
        navigate('/liabilities');
      }
    }
  }, [id, isEditing, context, navigate]);

  useEffect(() => {
    if (paymentStructure === ShortTermLiabilityPaymentStructure.INSTALLMENTS && originalAmount && numberOfInstallments) {
      const parsedAmount = parseFloat(originalAmount);
      const parsedInstallments = parseInt(numberOfInstallments);
      if (!isNaN(parsedAmount) && parsedAmount > 0 && !isNaN(parsedInstallments) && parsedInstallments > 0) {
        setCalculatedMonthlyInstallment(parsedAmount / parsedInstallments);
      } else {
        setCalculatedMonthlyInstallment(null);
      }
    } else {
      setCalculatedMonthlyInstallment(null);
    }
  }, [paymentStructure, originalAmount, numberOfInstallments]);

  if (!context) return <div>Loading context...</div>;
  const { addShortTermLiability, updateShortTermLiability, formatCurrency } = context;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Liability name is required.';
    if (!lender.trim()) newErrors.lender = 'Lender/Creditor name is required.';
    if (!originalAmount || isNaN(parseFloat(originalAmount)) || parseFloat(originalAmount) <= 0) {
      newErrors.originalAmount = 'Original amount must be a positive number.';
    }
    if (!dueDate) newErrors.dueDate = 'Due date / Final due date is required.';

    if (paymentStructure === ShortTermLiabilityPaymentStructure.INSTALLMENTS) {
      if (!numberOfInstallments || isNaN(parseInt(numberOfInstallments)) || parseInt(numberOfInstallments) <= 0) {
        newErrors.numberOfInstallments = 'Number of installments must be a positive integer.';
      }
      if (!paymentDayOfMonth || isNaN(parseInt(paymentDayOfMonth)) || parseInt(paymentDayOfMonth) < 1 || parseInt(paymentDayOfMonth) > 31) {
        newErrors.paymentDayOfMonth = 'Payment day must be between 1 and 31.';
      }
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

    const baseLiabilityData = {
      name: name.trim(),
      lender: lender.trim(),
      originalAmount: parseFloat(originalAmount),
      dueDate, // This is final due date for installments
      notes: notes.trim(),
      paymentStructure,
      interestRate: interestRate ? parseFloat(interestRate) : undefined, // Add interest rate
    };

    let fullLiabilityData: Omit<ShortTermLiability, 'id' | 'payments' | 'status' | 'createdAt'>;

    if (paymentStructure === ShortTermLiabilityPaymentStructure.INSTALLMENTS) {
      fullLiabilityData = {
        ...baseLiabilityData,
        numberOfInstallments: parseInt(numberOfInstallments),
        paymentDayOfMonth: parseInt(paymentDayOfMonth),
      };
    } else {
      fullLiabilityData = {
        ...baseLiabilityData,
        numberOfInstallments: undefined,
        paymentDayOfMonth: undefined,
      };
    }
    
    if (isEditing && id) {
      updateShortTermLiability({ ...fullLiabilityData, id });
    } else {
      addShortTermLiability(fullLiabilityData);
    }
    navigate('/liabilities'); 
  };
  
  const paymentStructureOptions = [
      { value: ShortTermLiabilityPaymentStructure.SINGLE, label: 'Single Payment' },
      { value: ShortTermLiabilityPaymentStructure.INSTALLMENTS, label: 'Installment Plan' },
  ];

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-dark mb-8 text-center">
        {isEditing ? 'Edit Short-Term Liability' : 'Add New Short-Term Liability'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Liability Name"
          type="text"
          id="liabilityName"
          value={name}
          onChange={e => setName(e.target.value)}
          error={errors.name}
          placeholder="e.g., Credit Card Balance Transfer, Short Loan"
          required
        />
        <Input
          label="Lender / Creditor"
          type="text"
          id="lender"
          value={lender}
          onChange={e => setLender(e.target.value)}
          error={errors.lender}
          placeholder="e.g., Amex, Store Credit"
          required
        />
        <Input
          label="Original Amount"
          type="number"
          id="originalAmount"
          value={originalAmount}
          onChange={e => setOriginalAmount(e.target.value)}
          error={errors.originalAmount}
          placeholder="0.00"
          step="0.01"
          min="0.01"
          required
        />
        
        <Select
            label="Payment Structure"
            id="paymentStructure"
            value={paymentStructure}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setPaymentStructure(e.target.value as ShortTermLiabilityPaymentStructure);
                if (e.target.value === ShortTermLiabilityPaymentStructure.SINGLE) {
                    setNumberOfInstallments('');
                    setPaymentDayOfMonth('');
                }
            }}
            options={paymentStructureOptions}
        />

        {paymentStructure === ShortTermLiabilityPaymentStructure.INSTALLMENTS && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Number of Installments"
                        type="number"
                        id="numberOfInstallments"
                        value={numberOfInstallments}
                        onChange={e => setNumberOfInstallments(e.target.value)}
                        error={errors.numberOfInstallments}
                        placeholder="e.g., 12"
                        min="1"
                        step="1"
                        required
                    />
                    <Input
                        label="Payment Day of Month"
                        type="number"
                        id="paymentDayOfMonth"
                        value={paymentDayOfMonth}
                        onChange={e => setPaymentDayOfMonth(e.target.value)}
                        error={errors.paymentDayOfMonth}
                        placeholder="e.g., 15"
                        min="1"
                        max="31"
                        step="1"
                        required
                    />
                </div>
                {calculatedMonthlyInstallment !== null && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                        Calculated Monthly Installment: <strong>{formatCurrency(calculatedMonthlyInstallment)}</strong>
                    </div>
                )}
                <Input
                    label="Interest Rate (%, Optional for Installments)"
                    type="number"
                    id="interestRateSTL"
                    value={interestRate}
                    onChange={e => setInterestRate(e.target.value)}
                    error={errors.interestRate}
                    placeholder="e.g., 12.5 for 12.5%"
                    step="0.01" min="0"
                />
            </>
        )}
         {paymentStructure === ShortTermLiabilityPaymentStructure.SINGLE && (
             <Input
                label="Interest Rate (%, Optional for Single Payment)"
                type="number"
                id="interestRateSTLSingle"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                error={errors.interestRate}
                placeholder="e.g., 10 for 10%"
                step="0.01" min="0"
            />
         )}


        <Input
          label={paymentStructure === ShortTermLiabilityPaymentStructure.INSTALLMENTS ? "Final Due Date" : "Due Date"}
          type="date"
          id="dueDate"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          error={errors.dueDate}
          required
        />
        <Input
            label="Notes (Optional)"
            type="text"
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g., Reference number, purpose"
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

export default ShortTermLiabilityFormScreen;
