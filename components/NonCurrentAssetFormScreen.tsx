
import React, { useState, useContext, useEffect, ChangeEvent, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { NonCurrentAsset, NonCurrentAssetType, NonCurrentAssetDetailsProperty, NonCurrentAssetDetailsVehicle, NonCurrentAssetDetailsFixedDeposit, NonCurrentAssetDetailsOtherInvestment } from '../types.ts';
import Input from './ui/Input.tsx';
import Select from './ui/Select.tsx';
import Button from './ui/Button.tsx';
import { NON_CURRENT_ASSET_TYPE_OPTIONS } from '../constants.ts';

const NonCurrentAssetFormScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [name, setName] = useState<string>('');
  const [type, setType] = useState<NonCurrentAssetType>(NonCurrentAssetType.PROPERTY);
  const [acquisitionDate, setAcquisitionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [acquisitionCost, setAcquisitionCost] = useState<string>('');
  const [currentValue, setCurrentValue] = useState<string>('');
  const [currentValueDate, setCurrentValueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Type-specific details
  const [propertyDetails, setPropertyDetails] = useState<NonCurrentAssetDetailsProperty>({});
  const [vehicleDetails, setVehicleDetails] = useState<NonCurrentAssetDetailsVehicle>({});
  const [fdDetails, setFdDetails] = useState<NonCurrentAssetDetailsFixedDeposit>({});
  const [investmentDetails, setInvestmentDetails] = useState<NonCurrentAssetDetailsOtherInvestment>({ quantity: undefined, purchasePricePerUnit: undefined, currentPricePerUnit: undefined, purchaseDate: undefined });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && context?.getNonCurrentAssetById && id) {
      const assetToEdit = context.getNonCurrentAssetById(id);
      if (assetToEdit) {
        setName(assetToEdit.name);
        setType(assetToEdit.type);
        setAcquisitionDate(assetToEdit.acquisitionDate);
        setAcquisitionCost(assetToEdit.acquisitionCost.toString());
        setCurrentValue(assetToEdit.currentValue?.toString() || '');
        setCurrentValueDate(assetToEdit.currentValueDate || '');
        setNotes(assetToEdit.notes || '');

        if (assetToEdit.details) {
            switch (assetToEdit.type) {
                case NonCurrentAssetType.PROPERTY: case NonCurrentAssetType.BUILDING:
                    setPropertyDetails(assetToEdit.details as NonCurrentAssetDetailsProperty); break;
                case NonCurrentAssetType.VEHICLE:
                    setVehicleDetails(assetToEdit.details as NonCurrentAssetDetailsVehicle); break;
                case NonCurrentAssetType.FIXED_DEPOSIT:
                    setFdDetails(assetToEdit.details as NonCurrentAssetDetailsFixedDeposit); break;
                case NonCurrentAssetType.OTHER_INVESTMENT:
                    setInvestmentDetails(assetToEdit.details as NonCurrentAssetDetailsOtherInvestment); break;
            }
        }
      } else { alert("Non-Current Asset not found!"); navigate('/assets'); }
    } else if (!isEditing) {
        setPropertyDetails({}); setVehicleDetails({}); setFdDetails({});
        setInvestmentDetails({ quantity: undefined, purchasePricePerUnit: undefined, currentPricePerUnit: undefined, purchaseDate: undefined });
        setType(NonCurrentAssetType.PROPERTY);
    }
  }, [id, isEditing, context, navigate]);

  if (!context) return <div>Loading context...</div>;
  const { addNonCurrentAsset, updateNonCurrentAsset, formatCurrency } = context;

  // Calculations for Other Investments
  const calculatedAcquisitionCost = useMemo(() => {
    if (type === NonCurrentAssetType.OTHER_INVESTMENT && investmentDetails.quantity && investmentDetails.purchasePricePerUnit) {
        return investmentDetails.quantity * investmentDetails.purchasePricePerUnit;
    }
    return null;
  }, [type, investmentDetails.quantity, investmentDetails.purchasePricePerUnit]);

  const calculatedCurrentValue = useMemo(() => {
    if (type === NonCurrentAssetType.OTHER_INVESTMENT && investmentDetails.quantity && investmentDetails.currentPricePerUnit) {
        return investmentDetails.quantity * investmentDetails.currentPricePerUnit;
    }
    return null;
  }, [type, investmentDetails.quantity, investmentDetails.currentPricePerUnit]);

  const gainLoss = useMemo(() => {
    const acqCost = parseFloat(acquisitionCost) || calculatedAcquisitionCost || 0;
    const currVal = parseFloat(currentValue) || calculatedCurrentValue || 0;
    if (acqCost > 0 && currVal > 0) return currVal - acqCost;
    if (currVal > 0 && acqCost === 0 && type === NonCurrentAssetType.OTHER_INVESTMENT && calculatedAcquisitionCost) return currVal - calculatedAcquisitionCost; // if acquisition cost was auto-calc
    return null;
  }, [acquisitionCost, currentValue, calculatedAcquisitionCost, calculatedCurrentValue, type]);


  const validate = (): boolean => { 
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Asset name is required.';
    if (!type) newErrors.type = 'Asset type is required.';
    if (!acquisitionDate) newErrors.acquisitionDate = 'Acquisition date is required.';
    
    const acqCostNum = parseFloat(acquisitionCost);
    if (type !== NonCurrentAssetType.OTHER_INVESTMENT && (!acquisitionCost || isNaN(acqCostNum) || acqCostNum < 0)) {
        newErrors.acquisitionCost = 'Acquisition cost must be a non-negative number.';
    } else if (type === NonCurrentAssetType.OTHER_INVESTMENT && calculatedAcquisitionCost === null && (!acquisitionCost || isNaN(acqCostNum) || acqCostNum < 0)) {
         newErrors.acquisitionCost = 'Acquisition cost (or quantity & purchase price) must be provided and valid.';
    }


    const currValNum = parseFloat(currentValue);
    if (currentValue && (isNaN(currValNum) || currValNum < 0)) {
        newErrors.currentValue = 'Current value must be a non-negative number.';
    }
    if (currentValue && !currentValueDate && calculatedCurrentValue === null) {
        newErrors.currentValueDate = 'Date of current value is required if current value is entered (and not auto-calculated).';
    }
    if (currentValueDate && (!currentValue && calculatedCurrentValue === null)) {
         newErrors.currentValue = 'Current value is required if date of current value is entered (and not auto-calculated).';
    }
    if (currentValueDate && new Date(currentValueDate) < new Date(acquisitionDate)) {
        newErrors.currentValueDate = 'Current value date cannot be before acquisition date.';
    }

    if(type === NonCurrentAssetType.VEHICLE && vehicleDetails.year && (vehicleDetails.year < 1900 || vehicleDetails.year > new Date().getFullYear() + 1)){
        newErrors.vehicle_year = "Please enter a valid year for the vehicle."
    }
    if(type === NonCurrentAssetType.FIXED_DEPOSIT) {
        if(!fdDetails.institution?.trim()) newErrors.fd_institution = "Institution is required for Fixed Deposit.";
        if(!fdDetails.maturityDate) newErrors.fd_maturityDate = "Maturity date is required for Fixed Deposit.";
        if(fdDetails.interestRate && (isNaN(fdDetails.interestRate) || fdDetails.interestRate < 0)) newErrors.fd_interestRate = "Interest rate must be a non-negative number.";
    }
     if(type === NonCurrentAssetType.OTHER_INVESTMENT) {
        if( (investmentDetails.quantity && !investmentDetails.purchasePricePerUnit) || (!investmentDetails.quantity && investmentDetails.purchasePricePerUnit) ){
            newErrors.investment_calc = "Both quantity and purchase price/unit are needed to calculate acquisition cost automatically.";
        }
         if( (investmentDetails.quantity && !investmentDetails.currentPricePerUnit && currentValue === '') || (!investmentDetails.quantity && investmentDetails.currentPricePerUnit && currentValue === '') ){
            newErrors.investment_calc_current = "Both quantity and current price/unit are needed to calculate current value automatically if not manually entered.";
        }
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; 
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let details: NonCurrentAsset['details'];
    let finalAcquisitionCost = parseFloat(acquisitionCost);
    let finalCurrentValue = currentValue ? parseFloat(currentValue) : undefined;

    switch (type) {
        case NonCurrentAssetType.PROPERTY: case NonCurrentAssetType.BUILDING: details = propertyDetails; break;
        case NonCurrentAssetType.VEHICLE: details = vehicleDetails; break;
        case NonCurrentAssetType.FIXED_DEPOSIT: details = fdDetails; break;
        case NonCurrentAssetType.OTHER_INVESTMENT:
            details = investmentDetails;
            if (calculatedAcquisitionCost !== null && (isNaN(finalAcquisitionCost) || finalAcquisitionCost === 0)) {
                finalAcquisitionCost = calculatedAcquisitionCost;
            }
            if (calculatedCurrentValue !== null && (finalCurrentValue === undefined || finalCurrentValue === 0)) {
                finalCurrentValue = calculatedCurrentValue;
            }
            break;
        default: details = undefined;
    }

    const assetData: Omit<NonCurrentAsset, 'id'> = {
      name: name.trim(), type, acquisitionDate,
      acquisitionCost: finalAcquisitionCost,
      currentValue: finalCurrentValue,
      currentValueDate: finalCurrentValue ? (currentValueDate || new Date().toISOString().split('T')[0]) : undefined,
      notes: notes.trim(), details,
    };

    if (isEditing && id) updateNonCurrentAsset({ ...assetData, id });
    else addNonCurrentAsset(assetData);
    navigate('/assets');
  };
  
  const handleDetailChange = (assetType: NonCurrentAssetType, field: string, value: any) => {
    const parseNumeric = (val: string) => val === '' ? undefined : parseFloat(val);
    switch (assetType) {
        case NonCurrentAssetType.PROPERTY: case NonCurrentAssetType.BUILDING:
            setPropertyDetails(prev => ({ ...prev, [field]: value })); break;
        case NonCurrentAssetType.VEHICLE:
            setVehicleDetails(prev => ({ ...prev, [field]: field === 'year' ? (value ? parseInt(value) : undefined) : value })); break;
        case NonCurrentAssetType.FIXED_DEPOSIT:
            setFdDetails(prev => ({ ...prev, [field]: (field === 'interestRate' || field === 'principalAmount' || field === 'maturityAmount') ? parseNumeric(value) : value })); break;
        case NonCurrentAssetType.OTHER_INVESTMENT:
            setInvestmentDetails(prev => ({...prev, [field]: (field === 'quantity' || field === 'purchasePricePerUnit' || field === 'currentPricePerUnit') ? parseNumeric(value) : value })); break;
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-dark mb-8 text-center">
        {isEditing ? 'Edit Non-Current Asset' : 'Add New Non-Current Asset'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Asset Name" type="text" id="assetName" value={name} onChange={e => setName(e.target.value)} error={errors.name} placeholder="e.g., My House, Toyota Camry" required />
        <Select label="Asset Type" id="assetType" value={type} onChange={(e: ChangeEvent<HTMLSelectElement>) => setType(e.target.value as NonCurrentAssetType)} options={NON_CURRENT_ASSET_TYPE_OPTIONS} error={errors.type} required />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Acquisition Date" type="date" id="acquisitionDate" value={acquisitionDate} onChange={e => setAcquisitionDate(e.target.value)} error={errors.acquisitionDate} required />
            <Input label="Acquisition Cost" type="number" id="acquisitionCost" value={acquisitionCost} onChange={e => setAcquisitionCost(e.target.value)} error={errors.acquisitionCost} placeholder="0.00 or calculated" step="0.01" min="0" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Current Value (Optional)" type="number" id="currentValue" value={currentValue} onChange={e => setCurrentValue(e.target.value)} error={errors.currentValue} placeholder="0.00 or calculated" step="0.01" min="0"/>
            <Input label="Date of Current Value (Optional)" type="date" id="currentValueDate" value={currentValueDate} onChange={e => setCurrentValueDate(e.target.value)} error={errors.currentValueDate} disabled={!currentValue && !calculatedCurrentValue}/>
        </div>
        {errors.investment_calc && <p className="text-xs text-danger">{errors.investment_calc}</p>}
        {errors.investment_calc_current && <p className="text-xs text-danger">{errors.investment_calc_current}</p>}


        {/* Type-Specific Details Sections */}
        {(type === NonCurrentAssetType.PROPERTY || type === NonCurrentAssetType.BUILDING) && ( <fieldset className="border p-4 rounded-md mt-4"> <legend className="text-md font-semibold px-2 text-gray-700">Property/Building Details</legend> <Input label="Address" type="text" value={propertyDetails.address || ''} onChange={e => handleDetailChange(type, 'address', e.target.value)} containerClassName="mb-2"/> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <Input label="Land Area (e.g., 10 Perches)" type="text" value={propertyDetails.landArea || ''} onChange={e => handleDetailChange(type, 'landArea', e.target.value)} containerClassName="mb-0"/> <Input label="Building Area (e.g., 2000 sqft)" type="text" value={propertyDetails.buildingArea || ''} onChange={e => handleDetailChange(type, 'buildingArea', e.target.value)} containerClassName="mb-0"/> </div> </fieldset> )}
        {type === NonCurrentAssetType.VEHICLE && ( <fieldset className="border p-4 rounded-md mt-4"> <legend className="text-md font-semibold px-2 text-gray-700">Vehicle Details</legend> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <Input label="Make" type="text" value={vehicleDetails.make || ''} onChange={e => handleDetailChange(type, 'make', e.target.value)} containerClassName="mb-0"/> <Input label="Model" type="text" value={vehicleDetails.model || ''} onChange={e => handleDetailChange(type, 'model', e.target.value)} containerClassName="mb-0"/> <Input label="Year" type="number" value={vehicleDetails.year?.toString() || ''} onChange={e => handleDetailChange(type, 'year', e.target.value)} error={errors.vehicle_year} placeholder="YYYY" min="1900" max={new Date().getFullYear()+1} containerClassName="mb-0"/> <Input label="Registration Number" type="text" value={vehicleDetails.registrationNumber || ''} onChange={e => handleDetailChange(type, 'registrationNumber', e.target.value)} containerClassName="mb-0"/> </div> </fieldset> )}
        {type === NonCurrentAssetType.FIXED_DEPOSIT && ( <fieldset className="border p-4 rounded-md mt-4"> <legend className="text-md font-semibold px-2 text-gray-700">Fixed Deposit Details</legend> <Input label="Institution" type="text" value={fdDetails.institution || ''} onChange={e => handleDetailChange(type, 'institution', e.target.value)} error={errors.fd_institution} required containerClassName="mb-2"/> <Input label="Account Number (Optional)" type="text" value={fdDetails.accountNumber || ''} onChange={e => handleDetailChange(type, 'accountNumber', e.target.value)} containerClassName="mb-2"/> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <Input label="Principal Amount (if different)" type="number" value={fdDetails.principalAmount?.toString() || ''} onChange={e => handleDetailChange(type, 'principalAmount', e.target.value)} step="0.01" min="0" containerClassName="mb-0"/> <Input label="Interest Rate (Annual %)" type="number" value={fdDetails.interestRate?.toString() || ''} onChange={e => handleDetailChange(type, 'interestRate', e.target.value)} error={errors.fd_interestRate} step="0.01" min="0" placeholder="e.g., 5.5" containerClassName="mb-0"/> <Input label="Maturity Date" type="date" value={fdDetails.maturityDate || ''} onChange={e => handleDetailChange(type, 'maturityDate', e.target.value)} error={errors.fd_maturityDate} required containerClassName="mb-0"/> <Input label="Maturity Amount (Optional)" type="number" value={fdDetails.maturityAmount?.toString() || ''} onChange={e => handleDetailChange(type, 'maturityAmount', e.target.value)} step="0.01" min="0" containerClassName="mb-0"/> </div> </fieldset> )}
        
        {type === NonCurrentAssetType.OTHER_INVESTMENT && (
            <fieldset className="border p-4 rounded-md mt-4 space-y-4">
                <legend className="text-md font-semibold px-2 text-gray-700">Other Investment Details</legend>
                <Input label="Instrument Name" type="text" value={investmentDetails.instrumentName || ''} onChange={e => handleDetailChange(type, 'instrumentName', e.target.value)} placeholder="e.g., Apple Stock, Gold Bar" containerClassName="mb-0"/>
                <Input label="Institution (Optional)" type="text" value={investmentDetails.institution || ''} onChange={e => handleDetailChange(type, 'institution', e.target.value)} placeholder="e.g., Brokerage Firm, Bank" containerClassName="mb-0"/>
                <Input label="Purchase Date (Optional)" type="date" value={investmentDetails.purchaseDate || ''} onChange={e => handleDetailChange(type, 'purchaseDate', e.target.value)} containerClassName="mb-0"/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Quantity (Optional)" type="number" value={investmentDetails.quantity?.toString() || ''} onChange={e => handleDetailChange(type, 'quantity', e.target.value)} step="any" min="0" containerClassName="mb-0"/>
                    <Input label="Purchase Price/Unit (Optional)" type="number" value={investmentDetails.purchasePricePerUnit?.toString() || ''} onChange={e => handleDetailChange(type, 'purchasePricePerUnit', e.target.value)} step="any" min="0" containerClassName="mb-0"/>
                </div>
                 {calculatedAcquisitionCost !== null && <p className="text-sm text-gray-600">Calculated Acquisition Cost: {formatCurrency(calculatedAcquisitionCost)}</p>}
                <Input label="Current Price/Unit (Optional)" type="number" value={investmentDetails.currentPricePerUnit?.toString() || ''} onChange={e => handleDetailChange(type, 'currentPricePerUnit', e.target.value)} step="any" min="0" containerClassName="mb-0"/>
                 {calculatedCurrentValue !== null && <p className="text-sm text-gray-600">Calculated Current Value: {formatCurrency(calculatedCurrentValue)}</p>}
                 {gainLoss !== null && <p className={`text-sm font-semibold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>Calculated Gain/Loss: {formatCurrency(gainLoss)}</p>}
            </fieldset>
        )}

        <Input label="Notes (Optional)" type="text" id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Purchase details, condition" />
        
        <div className="flex items-center justify-end space-x-4 pt-4">
          <Button type="button" variant="light" onClick={() => navigate('/assets')}>Cancel</Button>
          <Button type="submit" variant="primary" leftIcon={<i className={`fas ${isEditing ? 'fa-save' : 'fa-plus-circle'}`}></i>}>
            {isEditing ? 'Save Changes' : 'Add Asset'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NonCurrentAssetFormScreen;
