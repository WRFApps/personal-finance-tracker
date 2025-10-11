
import type { Dispatch, SetStateAction } from 'react';

export interface Category {
  id: string;
  name: string;
  defaultTaxRelevance?: 'income' | 'deduction' | 'none';
}

export enum TransactionType {
  INCOME = "Income",
  EXPENSE = "Expense",
}

export enum PaymentMethod {
  CASH = "Cash",
  CHEQUE = "Cheque",
  BANK_TRANSFER = "Bank Transfer",
  CREDIT_CARD = "Credit Card",
  OTHER = "Other",
}

export interface TransactionSplit {
  id: string; // For React keys mainly
  categoryId: string;
  amount: number;
  description?: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // Total amount of the transaction
  type: TransactionType;
  categoryId?: string; // Optional: Used if not split
  paymentMethod: PaymentMethod;
  creditCardId?: string;
  bankAccountId?: string;
  recurringTransactionId?: string;
  isTaxRelevant?: boolean;
  attachment?: { fileName: string; dataUrl: string; type: string };
  payee?: string;
  isSplit?: boolean;
  splits?: TransactionSplit[];
  notes?: string; // Added optional notes property
}

export enum Period {
  MONTHLY = "Monthly",
}

export interface Budget {
  id: string;
  categoryId: string;
  limitAmount: number;
  period: Period;
  startDate: string; // YYYY-MM-DD
  rolloverEnabled?: boolean;
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'CAD' | 'AUD' | 'LKR';

export interface CurrencyOption {
  value: Currency;
  label: string;
}

export enum ReceivableStatus {
  PENDING = "Pending",
  PARTIALLY_PAID = "Partially Paid",
  PAID = "Paid",
  OVERDUE = "Overdue",
}

export interface ReceivablePayment {
  id: string;
  receivableId: string;
  amount: number;
  date: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  bankAccountId?: string;
  transactionId?: string; 
}

export interface Receivable {
  id: string;
  debtorName: string;
  description: string;
  totalAmount: number;
  dueDate: string;
  payments: ReceivablePayment[];
  status: ReceivableStatus;
  createdAt: string;
}

export enum PayableStatus {
  PENDING = "Pending",
  PARTIALLY_PAID = "Partially Paid",
  PAID = "Paid",
  OVERDUE = "Overdue",
}

export interface PayablePayment {
  id: string;
  payableId: string;
  amount: number;
  date: string; 
  notes?: string;
  paymentMethod?: PaymentMethod;
  bankAccountId?: string;
  creditCardId?: string;
  transactionId?: string; 
}

export interface Payable {
  id: string;
  creditorName: string;
  description: string;
  totalAmount: number;
  dueDate: string; 
  payments: PayablePayment[];
  status: PayableStatus;
  createdAt: string; 
}

export interface CreditCard {
  id: string;
  name: string;
  bankName: string;
  creditLimit: number;
  availableBalance: number;
  statementDate?: number; 
  dueDate?: number; 
  notes?: string;
}

export interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  currentBalance: number;
  notes?: string;
}

export enum LiabilityType {
  PERSONAL_LOAN = "Personal Loan",
  HOUSING_LOAN = "Housing Loan",
  CAR_LOAN = "Car Loan",
  STUDENT_LOAN = "Student Loan",
  LEASE_AGREEMENT = "Lease Agreement",
  OTHER = "Other Non-Current Liability",
}

export interface LongTermLiabilityPayment {
  id: string;
  liabilityId: string;
  amount: number;
  date: string; 
  notes?: string;
  paymentMethod?: PaymentMethod;
  bankAccountId?: string;
  creditCardId?: string;
  transactionId?: string; 
}

export interface LongTermLiability {
  id: string;
  name: string;
  type: LiabilityType;
  lender: string;
  originalAmount: number;
  monthlyPayment: number;
  startDate: string; 
  endDate?: string; 
  interestRate?: number; 
  payments: LongTermLiabilityPayment[];
  notes?: string;
  createdAt: string; 
}

export enum ShortTermLiabilityStatus {
  UPCOMING = "Upcoming",
  PENDING = "Pending", 
  PARTIALLY_PAID = "Partially Paid",
  PAID = "Paid",
  OVERDUE = "Overdue",
}

export enum ShortTermLiabilityPaymentStructure {
  SINGLE = "Single Payment",
  INSTALLMENTS = "Installments",
}

export interface ShortTermLiabilityPayment {
  id: string;
  liabilityId: string;
  amount: number;
  date: string; 
  notes?: string;
  paymentMethod?: PaymentMethod;
  bankAccountId?: string;
  creditCardId?: string;
  transactionId?: string; 
}

export interface ShortTermLiability {
  id: string;
  name: string;
  lender: string;
  originalAmount: number;
  dueDate: string; 
  payments: ShortTermLiabilityPayment[];
  status: ShortTermLiabilityStatus;
  createdAt: string; 
  paymentStructure: ShortTermLiabilityPaymentStructure;
  numberOfInstallments?: number;
  paymentDayOfMonth?: number; 
  interestRate?: number; 
  notes?: string;
}

export enum NonCurrentAssetType {
  PROPERTY = "PROPERTY",
  BUILDING = "BUILDING",
  VEHICLE = "VEHICLE",
  FIXED_DEPOSIT = "FIXED_DEPOSIT",
  OTHER_INVESTMENT = "OTHER_INVESTMENT",
}

export interface NonCurrentAssetDetailsProperty {
  address?: string;
  landArea?: string; 
  buildingArea?: string; 
}
export interface NonCurrentAssetDetailsVehicle {
  make?: string;
  model?: string;
  year?: number;
  registrationNumber?: string;
}
export interface NonCurrentAssetDetailsFixedDeposit {
  institution?: string;
  accountNumber?: string;
  principalAmount?: number; 
  interestRate?: number; 
  maturityDate?: string; 
  maturityAmount?: number;
}
export interface NonCurrentAssetDetailsOtherInvestment {
  instrumentName?: string;
  quantity?: number;
  purchasePricePerUnit?: number;
  currentPricePerUnit?: number;
  purchaseDate?: string; 
  institution?: string; 
}

export interface NonCurrentAsset {
  id: string;
  name: string;
  type: NonCurrentAssetType;
  acquisitionDate: string; 
  acquisitionCost: number;
  currentValue?: number;
  currentValueDate?: string; 
  notes?: string;
  details?: NonCurrentAssetDetailsProperty | NonCurrentAssetDetailsVehicle | NonCurrentAssetDetailsFixedDeposit | NonCurrentAssetDetailsOtherInvestment;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string; 
  notes?: string;
  transactionId?: string; 
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; 
  notes?: string;
  createdAt: string; 
  contributions: GoalContribution[];
  achievedDate?: string; 
}

export enum RecurringFrequency {
  DAILY = "Daily",
  WEEKLY = "Weekly",
  MONTHLY = "Monthly",
  YEARLY = "Yearly",
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  paymentMethod: PaymentMethod;
  creditCardId?: string;
  bankAccountId?: string;
  frequency: RecurringFrequency;
  startDate: string; 
  endDate?: string; 
  dayOfWeek?: number; 
  dayOfMonth?: number; 
  nextDueDate: string; 
  isActive: boolean;
  lastProcessedDate?: string; 
  notes?: string;
}

export interface NetWorthSnapshot {
  id: string;
  date: string; 
  netWorth: number;
  assets: number;
  liabilities: number;
}

export interface DashboardWidgetConfigItem {
    id: string;
    name: string;
    isVisible: boolean;
    order: number;
}

export interface UserSettings {
  emergencyFundTargetMonths: number; 
  emergencyFundAccountIds: string[]; 
  grossMonthlyIncome: number;
  savingsRateTarget: number; 
  dashboardWidgets: DashboardWidgetConfigItem[];
}

export interface CashFlowProjectionEvent {
  description: string;
  amount: number;
  type: 'inflow' | 'outflow';
}
export interface DailyCashFlowProjection {
  date: string; 
  startOfDayBalance: number;
  events: CashFlowProjectionEvent[];
  endOfDayBalance: number;
}

export interface AppStateBackupV1 {
  categories: Category[];
  rawTransactions: Transaction[]; 
  budgets: Budget[];
  selectedCurrency: Currency;
  receivables: Receivable[];
  payables: Payable[];
  creditCards: CreditCard[];
  bankAccounts: BankAccount[];
  longTermLiabilities: LongTermLiability[];
  shortTermLiabilities: ShortTermLiability[];
  nonCurrentAssets: NonCurrentAsset[];
  financialGoals: FinancialGoal[];
  recurringTransactions: RecurringTransaction[];
  netWorthHistory: NetWorthSnapshot[];
  userSettings: UserSettings;
  cashBalance: number;
}

export interface SearchResultItem {
    id: string;
    type: string; 
    name: string; 
    description?: string; 
    path: string; 
    icon?: string; 
}
export interface SearchResults {
    [category: string]: SearchResultItem[]; 
}

export interface ScannedReceiptData {
    rawText?: string;
    merchant?: string;
    date?: string; 
    amount?: string; 
    type?: TransactionType; 
}

export interface ReceivableStats { paid: number; remaining: number; status: ReceivableStatus; }
export interface PayableStats { paid: number; remaining: number; status: PayableStatus; }
export interface LongTermLiabilityStats { totalPaid: number; remainingBalance: number; paymentsMadeCount: number; estimatedMonthsToPayoff: number;}
export interface ShortTermLiabilityCalculatedStats { paid: number; remaining: number; status: ShortTermLiabilityStatus; monthlyInstallmentAmount?: number; nextInstallmentDueDate?: string; installmentsPaidCount?: number; isInstallmentOverdue?: boolean; estimatedMonthsToPayoff?: number; }

export interface AppContextType {
  // Categories
  categories: Category[];
  addCategory: (name: string, defaultTaxRelevance?: 'income' | 'deduction' | 'none') => void;
  updateCategory: (id: string, name: string, defaultTaxRelevance?: 'income' | 'deduction' | 'none') => void;
  deleteCategory: (id: string) => void;
  getCategoryName: (id: string | undefined) => string; // Allow undefined for safety
  getCategoryById: (id: string | undefined) => Category | undefined; // Allow undefined

  // Transactions
  transactions: Transaction[];
  addTransaction: (transactionData: Omit<Transaction, 'id'>) => string; // Changed from void to string
  updateTransaction: (updatedTransactionData: Transaction) => void;
  deleteTransaction: (id: string) => void;

  // Budgets
  budgets: Budget[];
  addBudget: (budgetData: Omit<Budget, 'id' | 'period'>) => void;
  updateBudget: (updatedBudget: Budget) => void;
  deleteBudget: (id: string) => void;

  // Currency
  selectedCurrency: Currency;
  // FIX: Use Dispatch and SetStateAction directly to avoid React namespace error.
  setSelectedCurrency: Dispatch<SetStateAction<Currency>>;
  formatCurrency: (amount: number, currency?: Currency) => string;
  formatAccountingNumber: (amount: number) => string;

  // Receivables
  receivables: Receivable[];
  addReceivable: (data: Omit<Receivable, 'id' | 'payments' | 'status' | 'createdAt'>) => void;
  updateReceivable: (data: Omit<Receivable, 'payments' | 'status' | 'createdAt'> & {id: string}) => void;
  deleteReceivable: (id: string) => void;
  addReceivablePayment: (receivableId: string, paymentData: Omit<ReceivablePayment, 'id' | 'receivableId'>) => void;
  getReceivableById: (id: string) => Receivable | undefined;

  // Payables
  payables: Payable[];
  addPayable: (data: Omit<Payable, 'id' | 'payments' | 'status' | 'createdAt'>) => void;
  updatePayable: (data: Omit<Payable, 'payments' | 'status' | 'createdAt'> & {id: string}) => void;
  deletePayable: (id: string) => void;
  addPayablePayment: (payableId: string, paymentData: Omit<PayablePayment, 'id' | 'payableId'>) => void;
  getPayableById: (id: string) => Payable | undefined;

  // Credit Cards
  creditCards: CreditCard[];
  addCreditCard: (cardData: Omit<CreditCard, 'id' | 'availableBalance'> & { availableBalance?: number }) => void;
  updateCreditCard: (card: CreditCard) => void;
  deleteCreditCard: (id: string) => void;
  getCreditCardById: (id: string) => CreditCard | undefined;
  recordCreditCardPayment: (creditCardId: string, paymentAmount: number, paymentMethod: PaymentMethod, date: string, bankAccountId?: string, notes?: string) => void;
  
  // Bank Accounts
  bankAccounts: BankAccount[];
  addBankAccount: (accountData: Omit<BankAccount, 'id'>) => void;
  updateBankAccount: (account: BankAccount) => void;
  deleteBankAccount: (id: string) => void;
  getBankAccountById: (id: string | undefined) => BankAccount | undefined;
  transferCashToBank: (amountToTransfer: number, targetBankAccountId: string, transferDate: string, transferNotes?: string) => void;
  performInterBankTransfer: (fromAccountId: string, toAccountId: string, amount: number, date: string, notes?: string) => void;
  
  // Long-Term Liabilities
  longTermLiabilities: LongTermLiability[];
  addLongTermLiability: (data: Omit<LongTermLiability, 'id' | 'payments' | 'createdAt'>) => void;
  updateLongTermLiability: (data: Omit<LongTermLiability, 'payments' | 'createdAt'> & {id: string}) => void;
  deleteLongTermLiability: (id: string) => void;
  addLongTermLiabilityPayment: (liabilityId: string, paymentData: Omit<LongTermLiabilityPayment, 'id' | 'liabilityId'>) => void;
  getLongTermLiabilityById: (id: string) => LongTermLiability | undefined;

  // Short-Term Liabilities
  shortTermLiabilities: ShortTermLiability[];
  addShortTermLiability: (data: Omit<ShortTermLiability, 'id' | 'payments' | 'status' | 'createdAt'>) => void;
  updateShortTermLiability: (data: Omit<ShortTermLiability, 'payments' | 'status' | 'createdAt'> & {id: string}) => void;
  deleteShortTermLiability: (id: string) => void;
  addShortTermLiabilityPayment: (liabilityId: string, paymentData: Omit<ShortTermLiabilityPayment, 'id' | 'liabilityId'>) => void;
  getShortTermLiabilityById: (id: string) => ShortTermLiability | undefined;

  // Non-Current Assets
  nonCurrentAssets: NonCurrentAsset[];
  addNonCurrentAsset: (data: Omit<NonCurrentAsset, 'id'>) => void;
  updateNonCurrentAsset: (asset: NonCurrentAsset) => void;
  deleteNonCurrentAsset: (id: string) => void;
  getNonCurrentAssetById: (id: string) => NonCurrentAsset | undefined;

  // Financial Goals
  financialGoals: FinancialGoal[];
  addFinancialGoal: (data: Omit<FinancialGoal, 'id' | 'currentAmount' | 'createdAt' | 'contributions'>) => void;
  updateFinancialGoal: (data: Omit<FinancialGoal, 'currentAmount' | 'createdAt' | 'contributions' | 'achievedDate'> & { id: string; achievedDate?: string }) => void;
  deleteFinancialGoal: (id: string) => void;
  addGoalContribution: (goalId: string, contributionData: Omit<GoalContribution, 'id' | 'goalId'>, createTransactionDetails?: { bankAccountId?: string, paymentMethod: PaymentMethod }) => void;
  getFinancialGoalById: (id: string) => FinancialGoal | undefined;
  
  // Recurring Transactions
  recurringTransactions: RecurringTransaction[];
  addRecurringTransaction: (data: Omit<RecurringTransaction, 'id' | 'nextDueDate' | 'isActive' | 'lastProcessedDate'>) => void;
  updateRecurringTransaction: (rt: RecurringTransaction) => void;
  deleteRecurringTransaction: (id: string) => void;
  getRecurringTransactionById: (id: string) => RecurringTransaction | undefined;
  processRecurringTransactions: (idsToProcess: string[]) => void;

  // Net Worth
  netWorthHistory: NetWorthSnapshot[];
  recordNetWorthSnapshot: () => void;
  calculateNetWorth: () => { netWorth: number; totalAssets: number; totalLiabilities: number };
  
  // Reporting & Settings
  exportTransactionsToCSV: () => void;
  getTaxSummaryData: (taxYear: string) => { income: Array<{ categoryName: string; totalAmount: number; transactions: Transaction[] }>; expenses: Array<{ categoryName: string; totalAmount: number; transactions: Transaction[] }> };
  userSettings: UserSettings;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  calculateCashFlowProjection: (daysToProject: number, selectedAccountIds: string[]) => DailyCashFlowProjection[];
  exportAllDataToJson: () => void;
  importAllDataFromJson: (jsonDataString: string) => Promise<boolean>;

  // Misc
  cashBalance: number;
  isLoading: boolean;

  // Global Search
  searchQuery: string;
  // FIX: Use Dispatch and SetStateAction directly to avoid React namespace error.
  setSearchQuery: Dispatch<SetStateAction<string>>;
  searchResults: SearchResults;
  isSearchModalOpen: boolean;
  performSearch: (query: string) => void;
  closeSearchModal: () => void;

  // Toast Notifications
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  notifyWarning: (message: string) => void;
  notifyInfo: (message: string) => void;

  // OCR
  openReceiptScannerModal: () => void;

  // Dashboard Customization
  openDashboardCustomizationModal: () => void;
  updateDashboardWidgetSettings: (widgets: DashboardWidgetConfigItem[]) => void;
}