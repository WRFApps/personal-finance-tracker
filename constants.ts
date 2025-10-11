
import { 
    Category, Transaction, Budget, TransactionType, Period, Currency, CurrencyOption, PaymentMethod, 
    Receivable, ReceivablePayment, ReceivableStatus, Payable, PayablePayment, PayableStatus, 
    CreditCard, BankAccount, LongTermLiability, LongTermLiabilityPayment, LiabilityType, 
    ShortTermLiability, ShortTermLiabilityPayment, ShortTermLiabilityStatus, ShortTermLiabilityPaymentStructure, 
    NonCurrentAsset, NonCurrentAssetType, FinancialGoal, GoalContribution, RecurringTransaction, 
    NetWorthSnapshot, RecurringFrequency, UserSettings, NonCurrentAssetDetailsProperty, 
    NonCurrentAssetDetailsVehicle, NonCurrentAssetDetailsOtherInvestment, 
    NonCurrentAssetDetailsFixedDeposit, DashboardWidgetConfigItem,
    LongTermLiabilityStats
    // ShortTermLiabilityCalculatedStats // This comment was potentially misleading
} from './types.ts';
import type { ShortTermLiabilityCalculatedStats as STLCStatsType } from './types.ts'; // Import as type with an alias

// --- INITIAL EMPTY STATES ---
export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [];

export const INITIAL_CREDIT_CARDS: CreditCard[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGETS: Budget[] = [];

export const INITIAL_RECEIVABLES: Receivable[] = [];

export const INITIAL_PAYABLES: Payable[] = [];

export const INITIAL_LONG_TERM_LIABILITIES: LongTermLiability[] = [];

export const INITIAL_SHORT_TERM_LIABILITIES: ShortTermLiability[] = [];

export const INITIAL_NON_CURRENT_ASSETS: NonCurrentAsset[] = [];

export const INITIAL_FINANCIAL_GOALS: FinancialGoal[] = [];

export const INITIAL_RECURRING_TRANSACTIONS: RecurringTransaction[] = [];

export const INITIAL_NET_WORTH_HISTORY: NetWorthSnapshot[] = [];

export const DEFAULT_DASHBOARD_WIDGET_CONFIG: DashboardWidgetConfigItem[] = [
    { id: 'summary_cards', name: 'Summary Cards', isVisible: true, order: 1 },
    { id: 'financial_health_quick_check', name: 'Financial Health Quick Check', isVisible: true, order: 2 },
    { id: 'recent_transactions', name: 'Recent Transactions', isVisible: true, order: 3 },
    { id: 'active_budgets_overview', name: 'Active Budgets Overview', isVisible: true, order: 4 },
    { id: 'income_vs_expenditure_chart', name: 'Income vs Expenditure Chart (Last 6 Months)', isVisible: true, order: 5 },
    { id: 'expenditure_breakdown_pie_chart', name: 'Expenditure Breakdown Pie Chart', isVisible: true, order: 6 },
    { id: 'reminders_upcoming', name: 'Reminders & Upcoming', isVisible: true, order: 7 },
    { id: 'financial_goals_progress', name: 'Financial Goals Progress', isVisible: true, order: 8 },
    { id: 'cash_flow_projection', name: 'Cash Flow Projection', isVisible: false, order: 9 },
    { id: 'financial_health_settings', name: 'Financial Health Settings', isVisible: false, order: 10 },
];


export const INITIAL_USER_SETTINGS: UserSettings = {
    emergencyFundTargetMonths: 3, // Default target
    emergencyFundAccountIds: [],  // Empty by default
    grossMonthlyIncome: 0,        // Zero by default
    savingsRateTarget: 0,         // Zero by default
    dashboardWidgets: DEFAULT_DASHBOARD_WIDGET_CONFIG,
};


export const DEFAULT_CURRENCY: Currency = 'LKR';

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'LKR', label: 'LKR (රු)' },
];

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.CASH, label: "Cash" },
  { value: PaymentMethod.CHEQUE, label: "Cheque" },
  { value: PaymentMethod.BANK_TRANSFER, label: "Bank Transfer" },
  { value: PaymentMethod.CREDIT_CARD, label: "Credit Card" },
  { value: PaymentMethod.OTHER, label: "Other" },
];

export const LIABILITY_TYPE_OPTIONS: { value: LiabilityType; label: string }[] = [
  { value: LiabilityType.PERSONAL_LOAN, label: "Personal Loan" },
  { value: LiabilityType.HOUSING_LOAN, label: "Housing Loan" },
  { value: LiabilityType.CAR_LOAN, label: "Car Loan" },
  { value: LiabilityType.STUDENT_LOAN, label: "Student Loan" },
  { value: LiabilityType.LEASE_AGREEMENT, label: "Lease Agreement" },
  { value: LiabilityType.OTHER, label: "Other Non-Current Liability" },
];

export const NON_CURRENT_ASSET_TYPE_OPTIONS: { value: NonCurrentAssetType; label: string }[] = [
    { value: NonCurrentAssetType.PROPERTY, label: "Property (Land/Real Estate)"},
    { value: NonCurrentAssetType.BUILDING, label: "Building (Structure Only)"},
    { value: NonCurrentAssetType.VEHICLE, label: "Vehicle"},
    { value: NonCurrentAssetType.FIXED_DEPOSIT, label: "Fixed Deposit"},
    { value: NonCurrentAssetType.OTHER_INVESTMENT, label: "Other Investment (Stocks, Bonds, etc.)"},
];

export const RECURRING_FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
    { value: RecurringFrequency.DAILY, label: "Daily" },
    { value: RecurringFrequency.WEEKLY, label: "Weekly" },
    { value: RecurringFrequency.MONTHLY, label: "Monthly" },
    { value: RecurringFrequency.YEARLY, label: "Yearly" },
];

export const CATEGORY_TAX_RELEVANCE_OPTIONS: { value: Category['defaultTaxRelevance']; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'income', label: 'Taxable Income' },
    { value: 'deduction', label: 'Potential Deduction' },
];

// --- Default Application Categories ---
export const DEFAULT_APP_CATEGORIES: Category[] = [
  // System Categories (Essential for app functionality)
  { id: 'cat_sys_cash_to_bank', name: 'Cash to Bank Transfer', defaultTaxRelevance: 'none' },
  { id: 'cat_sys_inter_bank_out', name: 'Inter-Bank Transfer Out', defaultTaxRelevance: 'none' },
  { id: 'cat_sys_inter_bank_in', name: 'Inter-Bank Transfer In', defaultTaxRelevance: 'none' },
  { id: 'cat_sys_cc_payment', name: 'Credit Card Payment', defaultTaxRelevance: 'none' },
  { id: 'cat_sys_goal_contrib', name: 'Goal Contribution Transfer', defaultTaxRelevance: 'none' },

  // Income Categories
  { id: 'cat_inc_salary', name: 'Salary', defaultTaxRelevance: 'income' },
  { id: 'cat_inc_business', name: 'Business Income', defaultTaxRelevance: 'income' },
  { id: 'cat_inc_freelance', name: 'Freelance/Consulting Income', defaultTaxRelevance: 'income' },
  { id: 'cat_inc_investments', name: 'Investment Income', defaultTaxRelevance: 'income' },
  { id: 'cat_inc_rental', name: 'Rental Income', defaultTaxRelevance: 'income' },
  { id: 'cat_inc_remittances', name: 'Foreign Remittances', defaultTaxRelevance: 'none' }, // Tax relevance can vary
  { id: 'cat_inc_gifts_received', name: 'Gifts Received', defaultTaxRelevance: 'none' },
  { id: 'cat_inc_agricultural', name: 'Agricultural Income', defaultTaxRelevance: 'income' },
  { id: 'cat_inc_pension', name: 'Pension', defaultTaxRelevance: 'income' },
  { id: 'cat_inc_other', name: 'Other Income', defaultTaxRelevance: 'none' },

  // Expense Categories - General
  { id: 'cat_exp_housing_rent_mortgage', name: 'Housing (Rent/Mortgage)', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_groceries', name: 'Groceries', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_personal_care', name: 'Personal Care', defaultTaxRelevance: 'none' }, // e.g., toiletries, haircuts
  { id: 'cat_exp_entertainment', name: 'Entertainment', defaultTaxRelevance: 'none' }, // e.g., movies, dining out
  { id: 'cat_exp_clothing', name: 'Clothing & Apparel', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_subscriptions', name: 'Subscriptions', defaultTaxRelevance: 'none' }, // e.g., streaming, software
  { id: 'cat_exp_gifts_donations_given', name: 'Gifts & Donations (Given)', defaultTaxRelevance: 'deduction' },
  { id: 'cat_exp_home_maintenance', name: 'Home Maintenance & Repairs', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_travel_vacation', name: 'Travel & Vacation', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_pet_care', name: 'Pet Care', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_childcare', name: 'Childcare/Daycare', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_loan_repayments_general', name: 'Loan Repayments (General)', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_bank_charges', name: 'Bank Fees & Charges', defaultTaxRelevance: 'none' },

  // Expense Categories - Utilities (General + SL)
  { id: 'cat_exp_util_electricity', name: 'Utilities - Electricity Bill', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_util_water', name: 'Utilities - Water Bill', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_util_gas', name: 'Utilities - Cooking Gas', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_util_internet', name: 'Utilities - Internet/Broadband', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_util_mobile', name: 'Utilities - Mobile/Telephone Bill', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_util_tv', name: 'Utilities - TV Bill (Cable/Satellite)', defaultTaxRelevance: 'none' },

  // Expense Categories - Transportation (General + SL)
  { id: 'cat_exp_transport_fuel', name: 'Transportation - Fuel', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_transport_public', name: 'Transportation - Public Transport (Bus/Train)', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_transport_taxi_rideshare', name: 'Transportation - Taxi/Rideshare (Inc. Three-wheeler)', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_vehicle_maintenance', name: 'Transportation - Vehicle Maintenance & Repair', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_vehicle_insurance', name: 'Transportation - Vehicle Insurance', defaultTaxRelevance: 'deduction' },
  { id: 'cat_exp_vehicle_leasing', name: 'Transportation - Vehicle Leasing Payments', defaultTaxRelevance: 'none' },


  // Expense Categories - Healthcare (General + SL)
  { id: 'cat_exp_health_medical_fees', name: 'Healthcare - Medical/Doctor Fees (Inc. Channeling)', defaultTaxRelevance: 'deduction' },
  { id: 'cat_exp_health_pharmacy', name: 'Healthcare - Pharmacy/Medicines', defaultTaxRelevance: 'deduction' },
  { id: 'cat_exp_health_insurance', name: 'Healthcare - Health Insurance', defaultTaxRelevance: 'deduction' },
  { id: 'cat_exp_health_ayurvedic', name: 'Healthcare - Ayurvedic/Alternative', defaultTaxRelevance: 'none' },


  // Expense Categories - Education (General + SL)
  { id: 'cat_exp_edu_school_fees', name: 'Education - School/University Fees', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_edu_tuition_classes', name: 'Education - Tuition Classes', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_edu_books_supplies', name: 'Education - Books & Supplies', defaultTaxRelevance: 'none' },

  // Expense Categories - Sri Lankan Specific / Common
  { id: 'cat_exp_sl_property_tax_rates', name: 'Property Tax (Rates)', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_sl_festivals_alms', name: 'Festivals & Alms Giving (Dana)', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_sl_household_goods', name: 'Household Goods & Appliances', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_sl_communication_reload', name: 'Communication - Mobile Reload', defaultTaxRelevance: 'none' },
  { id: 'cat_exp_sl_spices_provisions', name: 'Groceries - Rice, Spices & Provisions', defaultTaxRelevance: 'none' }
];


// Helper to get current month in YYYY-MM format
export const getCurrentMonthYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

// Helper to get first day of current month in YYYY-MM-DD format
export const getFirstDayOfCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}-01`;
};

// Helper to format date string to a more readable format, e.g. July 20, 2024
export const formatDateReadable = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  // Ensure date is parsed as local by appending T00:00:00 if it's just a date string
  const dateToParse = dateString.includes('T') ? dateString : dateString + 'T00:00:00';
  const date = new Date(dateToParse);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Helper to get month and year from date string, e.g. July 2024
export const formatMonthYear = (dateString: string): string => {
  if (!dateString) return '';
  const dateToParse = dateString.includes('T') ? dateString : dateString + 'T00:00:00';
  const date = new Date(dateToParse);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};


// Updated formatNumberAccounting - this is now the primary number formatter
export const formatNumberAccounting = (
    amount: number, 
    currencyCode?: Currency, 
    options?: { style?: 'currency' | 'decimal'; minimumFractionDigits?: number; maximumFractionDigits?: number }
  ): string => {
    const { 
      style = currencyCode ? 'currency' : 'decimal', 
      minimumFractionDigits = 2, 
      maximumFractionDigits = 2 
    } = options || {};
  
    const formatterOptions: Intl.NumberFormatOptions = {
      style: style,
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: maximumFractionDigits,
    };
  
    if (style === 'currency' && currencyCode) {
      formatterOptions.currency = currencyCode;
    } else if (style === 'currency' && !currencyCode) {
      // Default to USD if style is currency but no code provided, or throw error
      // For this app, selectedCurrency context should handle it usually.
      formatterOptions.currency = DEFAULT_CURRENCY; 
    }
  
    return amount.toLocaleString('en-US', formatterOptions);
  };
  
// Deprecated - use formatNumberAccounting via context.formatCurrency or context.formatAccountingNumber
export const formatCurrencyString = (amount: number, currencyCode: Currency): string => {
  return formatNumberAccounting(amount, currencyCode, {style: 'currency'});
};


// --- Receivables Helpers ---
export const calculateReceivableStats = (receivable: Receivable): { paid: number, remaining: number, status: ReceivableStatus } => {
  const paid = receivable.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = receivable.totalAmount - paid;
  let status = ReceivableStatus.PENDING;

  if (paid >= receivable.totalAmount) {
    status = ReceivableStatus.PAID;
  } else if (paid > 0) {
    status = ReceivableStatus.PARTIALLY_PAID;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  const dueDateObj = new Date(receivable.dueDate + 'T00:00:00');
  if (status !== ReceivableStatus.PAID && dueDateObj < today && remaining > 0) {
    status = ReceivableStatus.OVERDUE;
  }
  return { paid, remaining, status };
};

// --- Payables Helpers ---
export const calculatePayableStats = (payable: Payable): { paid: number, remaining: number, status: PayableStatus } => {
  const paid = payable.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = payable.totalAmount - paid;
  let status = PayableStatus.PENDING;

  if (paid >= payable.totalAmount) {
    status = PayableStatus.PAID;
  } else if (paid > 0) {
    status = PayableStatus.PARTIALLY_PAID;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateObj = new Date(payable.dueDate + 'T00:00:00');
  if (status !== PayableStatus.PAID && dueDateObj < today && remaining > 0) {
    status = PayableStatus.OVERDUE;
  }
  return { paid, remaining, status };
};

// --- Long-Term Liabilities Helpers ---
export const calculateLongTermLiabilityStats = (liability: LongTermLiability): LongTermLiabilityStats => {
  const totalPaid = liability.payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = liability.originalAmount - totalPaid;
  const paymentsMadeCount = liability.payments.length;
  let estimatedMonthsToPayoff = 0;
  if (liability.monthlyPayment > 0 && remainingBalance > 0) {
    estimatedMonthsToPayoff = Math.ceil(remainingBalance / liability.monthlyPayment);
  }
  
  return { totalPaid, remainingBalance, paymentsMadeCount, estimatedMonthsToPayoff };
};

// --- Short-Term Liabilities Helpers ---
export const calculateShortTermLiabilityStats = (liability: ShortTermLiability): STLCStatsType => {
  const paid = liability.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = liability.originalAmount - paid;
  let status: ShortTermLiabilityStatus;

  let monthlyInstallmentAmount: number | undefined = undefined;
  let nextInstallmentDueDate: string | undefined = undefined;
  let installmentsPaidCount: number = 0;
  let isInstallmentOverdue: boolean | undefined = false;
  let estimatedMonthsToPayoff: number | undefined = undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const finalDueDate = new Date(liability.dueDate + 'T00:00:00');

  // 1. Determine base status
  if (paid >= liability.originalAmount) {
    status = ShortTermLiabilityStatus.PAID;
  } else if (paid > 0) {
    status = ShortTermLiabilityStatus.PARTIALLY_PAID;
  } else { // No payments made yet
    status = (finalDueDate < today) ? ShortTermLiabilityStatus.OVERDUE : ShortTermLiabilityStatus.UPCOMING;
  }

  // 2. Refine status based on installment logic
  if (liability.paymentStructure === ShortTermLiabilityPaymentStructure.INSTALLMENTS &&
      liability.numberOfInstallments && liability.numberOfInstallments > 0 &&
      liability.paymentDayOfMonth && liability.createdAt) {
    
    monthlyInstallmentAmount = liability.originalAmount / liability.numberOfInstallments;
    
    if (monthlyInstallmentAmount > 0) {
        let accuratelyPaidInstallments = 0;
        let cumulativePaidForInstallments = 0;
        const sortedPayments = [...liability.payments].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        for (const payment of sortedPayments) {
            cumulativePaidForInstallments += payment.amount;
            if (cumulativePaidForInstallments >= monthlyInstallmentAmount) {
                accuratelyPaidInstallments += Math.floor(cumulativePaidForInstallments / monthlyInstallmentAmount);
                cumulativePaidForInstallments = cumulativePaidForInstallments % monthlyInstallmentAmount; 
            }
        }
        installmentsPaidCount = accuratelyPaidInstallments;
    }

    if (status !== ShortTermLiabilityStatus.PAID) {
      if (installmentsPaidCount < liability.numberOfInstallments) {
        const loanStartDate = new Date(liability.createdAt + "T00:00:00");
        let nextDueDateCandidate = new Date(loanStartDate.getFullYear(), loanStartDate.getMonth(), liability.paymentDayOfMonth);
        
        for(let i = 0; i < installmentsPaidCount; i++){
          nextDueDateCandidate.setMonth(nextDueDateCandidate.getMonth() + 1);
        }
        
        while (
            (nextDueDateCandidate <= loanStartDate || (nextDueDateCandidate < today && paid >= (installmentsPaidCount + 1) * (monthlyInstallmentAmount || 0))) && 
            installmentsPaidCount < liability.numberOfInstallments
        ) {
            nextDueDateCandidate.setMonth(nextDueDateCandidate.getMonth() + 1);
            if (paid >= (installmentsPaidCount + 1) * (monthlyInstallmentAmount || 0)) { 
                 installmentsPaidCount++;
            }
            if (nextDueDateCandidate > finalDueDate || installmentsPaidCount >= liability.numberOfInstallments) break;
        }

        if (nextDueDateCandidate <= finalDueDate && installmentsPaidCount < liability.numberOfInstallments) {
          nextInstallmentDueDate = nextDueDateCandidate.toISOString().split('T')[0];
          estimatedMonthsToPayoff = liability.numberOfInstallments - installmentsPaidCount;
          if (nextDueDateCandidate < today) {
            isInstallmentOverdue = true;
            status = ShortTermLiabilityStatus.OVERDUE;
          } else {
            if (status !== ShortTermLiabilityStatus.OVERDUE && status !== ShortTermLiabilityStatus.PARTIALLY_PAID) {
                status = ShortTermLiabilityStatus.UPCOMING;
            }
          }
        } else if (installmentsPaidCount >= liability.numberOfInstallments && remaining <=0 ) {
            status = ShortTermLiabilityStatus.PAID;
            estimatedMonthsToPayoff = 0;
        }
      } else if (remaining <=0) {
            status = ShortTermLiabilityStatus.PAID;
            estimatedMonthsToPayoff = 0;
      }
    }
    
    if (installmentsPaidCount >= liability.numberOfInstallments && remaining > 0 && status !== ShortTermLiabilityStatus.PAID) {
        status = finalDueDate < today ? ShortTermLiabilityStatus.OVERDUE : ShortTermLiabilityStatus.PARTIALLY_PAID;
    }
  }

  // 3. Final OVERDUE check
  if (status !== ShortTermLiabilityStatus.PAID && finalDueDate < today && remaining > 0) {
    status = ShortTermLiabilityStatus.OVERDUE;
  }

  return { paid, remaining, status, monthlyInstallmentAmount, nextInstallmentDueDate, installmentsPaidCount, isInstallmentOverdue, estimatedMonthsToPayoff };
};


// --- Recurring Transaction Helpers ---
export const calculateNextDueDate = (rt: Omit<RecurringTransaction, 'id' | 'nextDueDate' | 'isActive'> | RecurringTransaction): string => {
    let baseDateStr = (rt as RecurringTransaction).lastProcessedDate || rt.startDate;
    if (!baseDateStr) baseDateStr = new Date().toISOString().split('T')[0]; 
    
    let baseDate = new Date(baseDateStr + 'T00:00:00'); 
    if (isNaN(baseDate.getTime())) { 
        baseDate = new Date(rt.startDate + 'T00:00:00');
    }
    
    let newDate = new Date(baseDate.getTime());
    // If lastProcessedDate is used, we want the *next* occurrence after that date
    if ((rt as RecurringTransaction).lastProcessedDate && (rt as RecurringTransaction).lastProcessedDate === baseDateStr) {
      // Move base to the actual "next" point based on frequency
      switch (rt.frequency) {
        case RecurringFrequency.DAILY: newDate.setDate(baseDate.getDate() + 1); break;
        case RecurringFrequency.WEEKLY: newDate.setDate(baseDate.getDate() + 7); break;
        case RecurringFrequency.MONTHLY: newDate.setMonth(baseDate.getMonth() + 1); break;
        case RecurringFrequency.YEARLY: newDate.setFullYear(baseDate.getFullYear() + 1); break;
      }
    } else if (!(rt as RecurringTransaction).lastProcessedDate) {
      // This is for the very first calculation from startDate
      // No initial advance needed if startDate is the target, unless dayOfWeek/dayOfMonth rules push it
    }


    switch (rt.frequency) {
        case RecurringFrequency.DAILY:
            // Already handled by initial advance if lastProcessedDate was today
            // If it's from startDate, it might be startDate itself or next day
            if (newDate < new Date(rt.startDate + 'T00:00:00')) newDate = new Date(rt.startDate + 'T00:00:00');
            else if ((rt as RecurringTransaction).lastProcessedDate !== rt.startDate && newDate.toISOString().split('T')[0] === rt.startDate) {
                 // no op, already set to startDate or advanced from it
            } else if ((rt as RecurringTransaction).lastProcessedDate) {
                // Already advanced by 1 day
            } else {
                // newDate might be startDate
            }
            break;
        case RecurringFrequency.WEEKLY:
            if (rt.dayOfWeek !== undefined) {
                let currentDay = newDate.getDay();
                let diff = rt.dayOfWeek - currentDay;
                if (diff < 0) diff += 7; // Ensure it's this week's day or next if already past
                newDate.setDate(newDate.getDate() + diff);
            } else { // If specific day is not set, already advanced by 7 if from lastProcessed
                // if from startDate and no dayOfWeek, it's just startDate + 7 days from last logic
            }
            break;
        case RecurringFrequency.MONTHLY:
            if (rt.dayOfMonth) {
                const lastDayOfNextMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
                newDate.setDate(Math.min(rt.dayOfMonth, lastDayOfNextMonth));
            } // If no dayOfMonth, it's just next month, same day (or end of month)
            break;
        case RecurringFrequency.YEARLY:
            if (rt.dayOfMonth) { 
                const targetMonth = new Date(rt.startDate + "T00:00:00").getMonth(); // Keep same month as start
                newDate.setMonth(targetMonth);
                const lastDayOfTargetMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
                newDate.setDate(Math.min(rt.dayOfMonth, lastDayOfTargetMonth));
            }
            break;
    }

    // Ensure next due date is not before the start date for the very first calculation
    const startDateObj = new Date(rt.startDate + 'T00:00:00');
    if (!(rt as RecurringTransaction).lastProcessedDate && newDate < startDateObj) {
        newDate = new Date(startDateObj); // Reset to startDate if complex logic put it before
        // Re-apply dayOfWeek/dayOfMonth rules from startDate
        if (rt.frequency === RecurringFrequency.WEEKLY && rt.dayOfWeek !== undefined) {
            let currentDay = newDate.getDay();
            let diff = rt.dayOfWeek - currentDay;
            if (diff < 0) diff += 7;
            newDate.setDate(newDate.getDate() + diff);
        } else if ((rt.frequency === RecurringFrequency.MONTHLY || rt.frequency === RecurringFrequency.YEARLY) && rt.dayOfMonth) {
            const lastDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
            newDate.setDate(Math.min(rt.dayOfMonth, lastDay));
            if (rt.frequency === RecurringFrequency.YEARLY) { // if it was yearly, ensure correct start month
                const startMonth = startDateObj.getMonth();
                newDate.setMonth(startMonth);
                const lastDayInCorrectMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
                newDate.setDate(Math.min(rt.dayOfMonth, lastDayInCorrectMonth));
            }
        }
    }
    
    if (rt.endDate) {
        const endDateObj = new Date(rt.endDate + 'T00:00:00');
        if (newDate > endDateObj) {
            return rt.endDate; 
        }
    }

    return newDate.toISOString().split('T')[0];
};


// Helper for Sri Lankan Tax Year (April 1 to March 31)
export const getTaxYearDateRange = (yearString: string): { startDate: string, endDate: string } | null => {
    // yearString format: "2023/2024"
    const parts = yearString.split('/');
    if (parts.length !== 2) return null;
    const startYear = parseInt(parts[0]);
    const endYear = parseInt(parts[1]);

    if (isNaN(startYear) || isNaN(endYear) || endYear !== startYear + 1) return null;

    const startDate = `${startYear}-04-01`;
    const endDate = `${endYear}-03-31`;
    return { startDate, endDate };
};

export type { STLCStatsType as ShortTermLiabilityCalculatedStats }; // Re-export the type using its alias
    