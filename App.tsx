
import React, { useState, createContext, useEffect, ChangeEvent, useCallback, useMemo, FormEvent } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import useLocalStorage from './hooks/useLocalStorage.ts';
import { ToastContainer, toast, ToastOptions } from 'react-toastify'; // Added react-toastify imports
import { GoogleGenAI } from "@google/genai"; // For potential global AI client

import {
  Category,
  Transaction,
  Budget,
  TransactionType,
  Period,
  Currency,
  PaymentMethod,
  Receivable,
  ReceivablePayment,
  ReceivableStatus,
  Payable,
  PayablePayment,
  PayableStatus,
  CreditCard,
  BankAccount,
  LongTermLiability,
  LongTermLiabilityPayment,
  LiabilityType,
  ShortTermLiability,
  ShortTermLiabilityPayment,
  ShortTermLiabilityStatus,
  ShortTermLiabilityPaymentStructure,
  NonCurrentAsset,
  FinancialGoal,
  GoalContribution,
  RecurringTransaction,
  RecurringFrequency,
  NetWorthSnapshot,
  UserSettings,
  NonCurrentAssetType,
  NonCurrentAssetDetailsOtherInvestment,
  DailyCashFlowProjection,
  CashFlowProjectionEvent,
  AppStateBackupV1,
  ReceivableStats,
  PayableStats,
  LongTermLiabilityStats,
  ShortTermLiabilityCalculatedStats,
  SearchResults,
  SearchResultItem,
  ScannedReceiptData,
  DashboardWidgetConfigItem,
  TransactionSplit, // Added TransactionSplit
  AppContextType
} from './types.ts';
import {
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  DEFAULT_CURRENCY,
  CURRENCY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  INITIAL_RECEIVABLES,
  INITIAL_PAYABLES,
  INITIAL_CREDIT_CARDS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_LONG_TERM_LIABILITIES,
  INITIAL_SHORT_TERM_LIABILITIES,
  INITIAL_NON_CURRENT_ASSETS,
  INITIAL_FINANCIAL_GOALS,
  INITIAL_RECURRING_TRANSACTIONS,
  INITIAL_NET_WORTH_HISTORY,
  INITIAL_USER_SETTINGS,
  DEFAULT_APP_CATEGORIES,
  DEFAULT_DASHBOARD_WIDGET_CONFIG,
  calculateNextDueDate,
  calculateReceivableStats,
  calculatePayableStats,
  calculateLongTermLiabilityStats,
  calculateShortTermLiabilityStats,
  getTaxYearDateRange,
  formatNumberAccounting,
  getFirstDayOfCurrentMonth
} from './constants.ts';

import DashboardScreen from './components/DashboardScreen.tsx';
import TransactionFormScreen from './components/TransactionFormScreen.tsx';
import TransactionsListScreen from './components/TransactionsListScreen.tsx';
import BudgetsScreen from './components/BudgetsScreen.tsx';
import BudgetFormScreen from './components/BudgetFormScreen.tsx';
import CategoriesScreen from './components/CategoriesScreen.tsx';
import ReceivablesScreen from './components/ReceivablesScreen.tsx';
import ReceivableFormScreen from './components/ReceivableFormScreen.tsx';
import PayablesScreen from './components/PayablesScreen.tsx';
import PayableFormScreen from './components/PayableFormScreen.tsx';
import CreditCardsScreen from './components/CreditCardsScreen.tsx';
import CreditCardFormScreen from './components/CreditCardFormScreen.tsx';
import BankAccountsScreen from './components/BankAccountsScreen.tsx';
import BankAccountFormScreen from './components/BankAccountFormScreen.tsx';
import LiabilitiesScreen from './components/LiabilitiesScreen.tsx';
import NonCurrentLiabilitiesScreen from './components/NonCurrentLiabilitiesScreen.tsx';
import LongTermLiabilityFormScreen from './components/NonCurrentLiabilityFormScreen.tsx';
import ShortTermLiabilityFormScreen from './components/ShortTermLiabilityFormScreen.tsx';
import NonCurrentAssetsScreen from './components/NonCurrentAssetsScreen.tsx';
import NonCurrentAssetFormScreen from './components/NonCurrentAssetFormScreen.tsx';
import Select from './components/ui/Select.tsx';
import Input from './components/ui/Input.tsx';
import GlobalSearchModal from './components/GlobalSearchModal.tsx';
import ReceiptScannerModal from './components/ReceiptScannerModal.tsx';
import DashboardCustomizationModal from './components/DashboardCustomizationModal.tsx';



// New Screen Imports
import GoalsScreen from './components/GoalsScreen.tsx';
import GoalFormScreen from './components/GoalFormScreen.tsx';
import RecurringTransactionsScreen from './components/RecurringTransactionsScreen.tsx';
import RecurringTransactionFormScreen from './components/RecurringTransactionFormScreen.tsx';
import NetWorthReportScreen from './components/NetWorthReportScreen.tsx';
import ReportsScreen from './components/ReportsScreen.tsx';


export const AppContext = createContext<AppContextType | null>(null);

const TOAST_CONFIG: ToastOptions = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
};

const Navbar: React.FC = () => {
  const location = ReactRouterDOM.useLocation();
  const context = React.useContext(AppContext);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { path: '/transactions', label: 'Transactions', icon: 'fa-exchange-alt' },
    { path: '/recurring', label: 'Recurring', icon: 'fa-redo-alt' },
    { path: '/budgets', label: 'Budgets', icon: 'fa-wallet' },
    { path: '/goals', label: 'Goals', icon: 'fa-bullseye' },
    { path: '/assets', label: 'Assets', icon: 'fa-gem' },
    { path: '/receivables', label: 'Receivables', icon: 'fa-hand-holding-usd' },
    { path: '/payables', label: 'Payables', icon: 'fa-file-invoice-dollar' },
    { path: '/liabilities', label: 'Liabilities', icon: 'fa-landmark' },
    { path: '/credit-cards', label: 'Credit Cards', icon: 'fa-credit-card' },
    { path: '/bank-accounts', label: 'Bank Accounts', icon: 'fa-university' },
    { path: '/categories', label: 'Categories', icon: 'fa-tags' },
    { path: '/net-worth', label: 'Net Worth', icon: 'fa-chart-line' },
    { path: '/reports', label: 'Reports', icon: 'fa-file-alt' },
  ];

  const handleCurrencyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (context) {
      context.setSelectedCurrency(event.target.value as Currency);
    }
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (context && context.searchQuery.trim()) {
        context.performSearch(context.searchQuery.trim());
    }
  };

  return (
    <nav className="bg-dark text-white p-3 sm:p-4 shadow-lg sticky top-0 z-40">
      <div className="container mx-auto flex flex-wrap justify-between items-center gap-y-2">
        <ReactRouterDOM.Link to="/" className="text-xl sm:text-2xl font-bold text-primary hover:opacity-90 transition-opacity flex-shrink-0">
          <i className="fas fa-chart-pie mr-2"></i>Finance Tracker
        </ReactRouterDOM.Link>

        {context && (
            <form onSubmit={handleSearchSubmit} className="w-full md:w-auto md:flex-grow md:max-w-xs lg:max-w-sm order-3 md:order-2">
                <Input
                    type="search"
                    placeholder="Search everywhere..."
                    value={context.searchQuery}
                    onChange={(e) => context.setSearchQuery(e.target.value)}
                    className="bg-gray-700 text-white border-gray-600 focus:ring-primary focus:border-primary text-sm py-1.5 h-9 placeholder-gray-400"
                    containerClassName="mb-0 w-full"
                    aria-label="Global search"
                    leftIcon={<i className="fas fa-search text-gray-400"></i>}
                />
            </form>
        )}

        <div className="order-2 md:order-3 w-full md:w-auto flex justify-between items-center">
             <ul className="flex space-x-1 items-center overflow-x-auto pb-1 sm:pb-0">
                {navItems.map(item => (
                <li key={item.path}>
                    <ReactRouterDOM.NavLink
                    to={item.path}
                    title={item.label}
                    className={({ isActive }) =>
                        `flex items-center space-x-1.5 px-2 py-1.5 text-xs sm:text-sm rounded-md transition-colors duration-200 ease-in-out hover:bg-gray-700 ${isActive ? 'bg-primary text-white font-semibold shadow-inner' : 'hover:text-primary'}`
                    }
                    >
                    <i className={`fas ${item.icon} w-4 text-center`}></i>
                    <span className="hidden md:inline">{item.label}</span>
                    </ReactRouterDOM.NavLink>
                </li>
                ))}
            </ul>
             {context && (
                <div className="sm:ml-4 flex-shrink-0 flex items-center space-x-1.5" title="Change Display Currency">
                    <i className="fas fa-coins text-gray-600 hover:text-primary transition-colors" aria-hidden="true"></i>
                    <Select
                        id="currencySelector"
                        value={context.selectedCurrency}
                        onChange={handleCurrencyChange}
                        options={CURRENCY_OPTIONS}
                        containerClassName="mb-0 text-sm"
                        className="bg-white text-gray-700 border border-gray-300 focus:ring-primary focus:border-primary text-xs sm:text-sm py-1.5 h-9 hover:bg-gray-50"
                        aria-label="Select Currency"
                    />
                </div>
            )}
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', INITIAL_CATEGORIES);
  const [rawTransactions, setRawTransactions] = useLocalStorage<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', INITIAL_BUDGETS);
  const [selectedCurrency, setSelectedCurrency] = useLocalStorage<Currency>('selectedCurrency', DEFAULT_CURRENCY);
  const [receivables, setReceivables] = useLocalStorage<Receivable[]>('receivables', INITIAL_RECEIVABLES);
  const [payables, setPayables] = useLocalStorage<Payable[]>('payables', INITIAL_PAYABLES);
  const [creditCards, setCreditCards] = useLocalStorage<CreditCard[]>('creditCards', INITIAL_CREDIT_CARDS);
  const [bankAccounts, setBankAccounts] = useLocalStorage<BankAccount[]>('bankAccounts', INITIAL_BANK_ACCOUNTS);
  const [longTermLiabilities, setLongTermLiabilities] = useLocalStorage<LongTermLiability[]>('longTermLiabilities', INITIAL_LONG_TERM_LIABILITIES);
  const [shortTermLiabilities, setShortTermLiabilities] = useLocalStorage<ShortTermLiability[]>('shortTermLiabilities', INITIAL_SHORT_TERM_LIABILITIES);
  const [nonCurrentAssets, setNonCurrentAssets] = useLocalStorage<NonCurrentAsset[]>('nonCurrentAssets', INITIAL_NON_CURRENT_ASSETS);
  const [financialGoals, setFinancialGoals] = useLocalStorage<FinancialGoal[]>('financialGoals', INITIAL_FINANCIAL_GOALS);
  const [recurringTransactions, setRecurringTransactions] = useLocalStorage<RecurringTransaction[]>('recurringTransactions', INITIAL_RECURRING_TRANSACTIONS);
  const [netWorthHistory, setNetWorthHistory] = useLocalStorage<NetWorthSnapshot[]>('netWorthHistory', INITIAL_NET_WORTH_HISTORY);
  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>('userSettings', INITIAL_USER_SETTINGS);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResults>({});
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isReceiptScannerModalOpen, setIsReceiptScannerModalOpen] = useState<boolean>(false);
  const [isDashboardCustomizationModalOpen, setIsDashboardCustomizationModalOpen] = useState<boolean>(false);


  const [isLoading, setIsLoading] = useState<boolean>(true); // For initial load simulation

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Adjust as needed
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { // Seed default categories if none exist
    if (categories.length === 0) {
      const uniqueDefaultCategories = DEFAULT_APP_CATEGORIES.filter(
        defaultCat => !INITIAL_CATEGORIES.some(initCat => initCat.id === defaultCat.id)
      );
      setCategories([...INITIAL_CATEGORIES, ...uniqueDefaultCategories]);
    }
  }, [categories, setCategories]);
  
  useEffect(() => { // Ensure user settings have default dashboard widgets if missing
    if (!userSettings.dashboardWidgets || userSettings.dashboardWidgets.length === 0) {
        setUserSettings(prev => ({...prev, dashboardWidgets: DEFAULT_DASHBOARD_WIDGET_CONFIG}));
    } else {
        // Check if all default widgets are present, add if not
        const currentWidgetIds = new Set(userSettings.dashboardWidgets.map(w => w.id));
        const missingWidgets = DEFAULT_DASHBOARD_WIDGET_CONFIG.filter(dw => !currentWidgetIds.has(dw.id));
        if (missingWidgets.length > 0) {
            let maxOrder = Math.max(0, ...userSettings.dashboardWidgets.map(w => w.order));
            const newWidgetsToAdd = missingWidgets.map(mw => ({
                ...mw,
                order: ++maxOrder, // Assign new order
                isVisible: mw.isVisible // Use default visibility
            }));
            setUserSettings(prev => ({
                ...prev,
                dashboardWidgets: [...prev.dashboardWidgets, ...newWidgetsToAdd].sort((a,b) => a.order - b.order)
            }));
        }
    }
  }, [userSettings, setUserSettings]);


  // Currency formatting function
  const formatCurrency = useCallback((amount: number, currency?: Currency): string => {
    return formatNumberAccounting(amount, currency || selectedCurrency, {style: 'currency'});
  }, [selectedCurrency]);

  const formatAccountingNumber = useCallback((amount: number): string => {
    return formatNumberAccounting(amount, undefined, {style: 'decimal'});
  }, []);

  // Toast Notifications
  const notifySuccess = useCallback((message: string) => toast.success(message, TOAST_CONFIG), []);
  const notifyError = useCallback((message: string) => toast.error(message, TOAST_CONFIG), []);
  const notifyWarning = useCallback((message: string) => toast.warning(message, TOAST_CONFIG), []);
  const notifyInfo = useCallback((message: string) => toast.info(message, TOAST_CONFIG), []);


  // Balance Calculations
   const cashBalance = useMemo(() => {
    let balance = 0;
    rawTransactions.forEach(t => {
        if (t.paymentMethod === PaymentMethod.CASH) {
            if (t.type === TransactionType.INCOME) balance += t.amount;
            else balance -= t.amount;
        }
    });
    // Adjust for cash transfers to bank
    const cashToBankCategory = categories.find(c => c.id === 'cat_sys_cash_to_bank');
    if(cashToBankCategory){
        rawTransactions.forEach(t => {
            if(t.categoryId === cashToBankCategory.id && t.type === TransactionType.EXPENSE){ // Expense from cash, Income to bank
                balance -=t.amount;
            }
        });
    }
    return balance;
  }, [rawTransactions, categories]);

  const transactions = useMemo(() => {
    return rawTransactions.map(t => {
      // const isFullyPaid = (paidAmount: number, totalAmount: number) => paidAmount >= totalAmount; // Commented out as not used
      
      if (t.recurringTransactionId) {
          const rt = recurringTransactions.find(r => r.id === t.recurringTransactionId);
          if (rt && !rt.isActive && rt.lastProcessedDate && new Date(t.date) > new Date(rt.lastProcessedDate)) {
              // Potentially hide or mark transactions generated after a recurring one was paused
              // For now, just include them. Logic to "undo" or "ignore" can be complex.
          }
      }
      
      // For receivables/payables linked transactions, update their status based on transaction details
      // (This part is more complex if a single transaction could pay multiple items, currently 1-to-1 link assumed by transactionId in payment)
      // For simplicity, this effect is primarily handled when adding payments directly to receivables/payables.
      return t;
    });
  }, [rawTransactions, recurringTransactions]);


  // Category Operations
  const addCategory = useCallback((name: string, defaultTaxRelevance: 'income' | 'deduction' | 'none' = 'none') => {
    const newCategory: Category = { id: Date.now().toString(), name, defaultTaxRelevance };
    setCategories(prev => [...prev, newCategory]);
    notifySuccess(`Category "${name}" added successfully.`);
  }, [setCategories, notifySuccess]);

  const updateCategory = useCallback((id: string, name: string, defaultTaxRelevance: 'income' | 'deduction' | 'none') => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, name, defaultTaxRelevance } : cat));
    notifySuccess(`Category "${name}" updated.`);
  }, [setCategories, notifySuccess]);

 const deleteCategory = useCallback((id: string) => {
    const isUsedInTransactions = transactions.some(t => t.categoryId === id || (t.isSplit && t.splits?.some(s => s.categoryId === id)));
    const isUsedInBudgets = budgets.some(b => b.categoryId === id);
    const isUsedInRecurring = recurringTransactions.some(rt => rt.categoryId === id);

    if (isUsedInTransactions || isUsedInBudgets || isUsedInRecurring) {
      notifyWarning("Cannot delete category. It is currently in use by transactions, budgets, or recurring transactions.");
      return;
    }
    setCategories(prev => prev.filter(cat => cat.id !== id));
    notifySuccess("Category deleted.");
  }, [transactions, budgets, recurringTransactions, setCategories, notifyWarning, notifySuccess]);

  const getCategoryName = useCallback((id: string | undefined) => {
    if (!id) return "Uncategorized";
    const category = categories.find(cat => cat.id === id);
    return category ? category.name : "Unknown Category";
  }, [categories]);

  const getCategoryById = useCallback((id: string | undefined) => {
    if (!id) return undefined;
    return categories.find(cat => cat.id === id);
  }, [categories]);

  // Transaction Operations
  const addTransaction = useCallback((transactionData: Omit<Transaction, 'id'>): string => {
    const newTransactionId = Date.now().toString() + Math.random().toString(36).substring(2, 7); // More unique ID
    const newTransaction: Transaction = { ...transactionData, id: newTransactionId };
    setRawTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    if (newTransaction.bankAccountId) {
        setBankAccounts(prevBankAccounts => prevBankAccounts.map(acc => {
            if (acc.id === newTransaction.bankAccountId) {
                let newBalance = acc.currentBalance;
                if (newTransaction.type === TransactionType.INCOME) newBalance += newTransaction.amount;
                else if (newTransaction.type === TransactionType.EXPENSE && (newTransaction.paymentMethod === PaymentMethod.BANK_TRANSFER || newTransaction.paymentMethod === PaymentMethod.CHEQUE)) newBalance -= newTransaction.amount;
                return { ...acc, currentBalance: newBalance };
            }
            return acc;
        }));
    }
    if (newTransaction.creditCardId && newTransaction.paymentMethod === PaymentMethod.CREDIT_CARD && newTransaction.type === TransactionType.EXPENSE) {
        setCreditCards(prevCreditCards => prevCreditCards.map(card => {
            if (card.id === newTransaction.creditCardId) return { ...card, availableBalance: card.availableBalance - newTransaction.amount };
            return card;
        }));
    }
    notifySuccess(`Transaction "${transactionData.description}" added successfully.`);
    return newTransactionId; // Return the ID of the new transaction
  }, [setRawTransactions, setBankAccounts, setCreditCards, notifySuccess]);

  const updateTransaction = useCallback((updatedTransactionData: Transaction) => {
    const oldTransaction = rawTransactions.find(t => t.id === updatedTransactionData.id);
    if (!oldTransaction) { notifyError("Failed to update transaction: Original transaction not found."); return; }

    setRawTransactions(prev => prev.map(t => t.id === updatedTransactionData.id ? updatedTransactionData : t).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    // Revert old transaction's impact
    if (oldTransaction.bankAccountId) {
        setBankAccounts(prevBankAccounts => prevBankAccounts.map(acc => {
            if (acc.id === oldTransaction.bankAccountId) {
                let balanceAdjustment = 0;
                if (oldTransaction.type === TransactionType.INCOME) balanceAdjustment -= oldTransaction.amount;
                else if (oldTransaction.type === TransactionType.EXPENSE && (oldTransaction.paymentMethod === PaymentMethod.BANK_TRANSFER || oldTransaction.paymentMethod === PaymentMethod.CHEQUE)) balanceAdjustment += oldTransaction.amount;
                return { ...acc, currentBalance: acc.currentBalance + balanceAdjustment };
            }
            return acc;
        }));
    }
    if (oldTransaction.creditCardId && oldTransaction.paymentMethod === PaymentMethod.CREDIT_CARD && oldTransaction.type === TransactionType.EXPENSE) {
        setCreditCards(prevCreditCards => prevCreditCards.map(card => {
            if (card.id === oldTransaction.creditCardId) return { ...card, availableBalance: card.availableBalance + oldTransaction.amount };
            return card;
        }));
    }
    // Apply new transaction's impact
    if (updatedTransactionData.bankAccountId) {
        setBankAccounts(prevBankAccounts => prevBankAccounts.map(acc => {
            if (acc.id === updatedTransactionData.bankAccountId) {
                let balanceAdjustment = 0;
                if (updatedTransactionData.type === TransactionType.INCOME) balanceAdjustment += updatedTransactionData.amount;
                else if (updatedTransactionData.type === TransactionType.EXPENSE && (updatedTransactionData.paymentMethod === PaymentMethod.BANK_TRANSFER || updatedTransactionData.paymentMethod === PaymentMethod.CHEQUE)) balanceAdjustment -= updatedTransactionData.amount;
                return { ...acc, currentBalance: acc.currentBalance + balanceAdjustment };
            }
            return acc;
        }));
    }
    if (updatedTransactionData.creditCardId && updatedTransactionData.paymentMethod === PaymentMethod.CREDIT_CARD && updatedTransactionData.type === TransactionType.EXPENSE) {
        setCreditCards(prevCreditCards => prevCreditCards.map(card => {
            if (card.id === updatedTransactionData.creditCardId) return { ...card, availableBalance: card.availableBalance - updatedTransactionData.amount };
            return card;
        }));
    }
    notifySuccess(`Transaction "${updatedTransactionData.description}" updated successfully.`);
  }, [rawTransactions, setRawTransactions, setBankAccounts, setCreditCards, notifyError, notifySuccess]);

  const deleteTransaction = useCallback((id: string) => {
    const transactionToDelete = rawTransactions.find(t => t.id === id);
    if (!transactionToDelete) {
      notifyError("Failed to delete transaction: Transaction not found.");
      return;
    }

    let linkedItemsRemovedMessages: string[] = [];

    // Check and update Receivables
    const updatedReceivables = receivables.map(rec => {
      const paymentIndex = rec.payments.findIndex(p => p.transactionId === id);
      if (paymentIndex > -1) {
        const updatedPayments = rec.payments.filter(p => p.transactionId !== id);
        const updatedReceivable = { ...rec, payments: updatedPayments };
        const stats = calculateReceivableStats(updatedReceivable);
        linkedItemsRemovedMessages.push(`Linked payment for receivable "${rec.debtorName}" removed.`);
        return { ...updatedReceivable, status: stats.status };
      }
      return rec;
    });
    if (linkedItemsRemovedMessages.length > 0) setReceivables(updatedReceivables);

    // Check and update Payables
    const initialPayableMessagesCount = linkedItemsRemovedMessages.length;
    const updatedPayables = payables.map(pay => {
      const paymentIndex = pay.payments.findIndex(p => p.transactionId === id);
      if (paymentIndex > -1) {
        const updatedPayments = pay.payments.filter(p => p.transactionId !== id);
        const updatedPayable = { ...pay, payments: updatedPayments };
        const stats = calculatePayableStats(updatedPayable);
        linkedItemsRemovedMessages.push(`Linked payment for payable to "${pay.creditorName}" removed.`);
        return { ...updatedPayable, status: stats.status };
      }
      return pay;
    });
    if (linkedItemsRemovedMessages.length > initialPayableMessagesCount) setPayables(updatedPayables);

    // Check and update LongTermLiabilities
    const initialLTLiabilityMessagesCount = linkedItemsRemovedMessages.length;
    const updatedLongTermLiabilities = longTermLiabilities.map(ltl => {
      const paymentIndex = ltl.payments.findIndex(p => p.transactionId === id);
      if (paymentIndex > -1) {
        const updatedPayments = ltl.payments.filter(p => p.transactionId !== id);
        linkedItemsRemovedMessages.push(`Linked payment for long-term liability "${ltl.name}" removed.`);
        return { ...ltl, payments: updatedPayments };
      }
      return ltl;
    });
    if (linkedItemsRemovedMessages.length > initialLTLiabilityMessagesCount) setLongTermLiabilities(updatedLongTermLiabilities);
    
    // Check and update ShortTermLiabilities
    const initialSTLiabilityMessagesCount = linkedItemsRemovedMessages.length;
    const updatedShortTermLiabilities = shortTermLiabilities.map(stl => {
      const paymentIndex = stl.payments.findIndex(p => p.transactionId === id);
      if (paymentIndex > -1) {
        const updatedPayments = stl.payments.filter(p => p.transactionId !== id);
        const updatedLiability = { ...stl, payments: updatedPayments };
        const stats = calculateShortTermLiabilityStats(updatedLiability);
        linkedItemsRemovedMessages.push(`Linked payment for short-term liability "${stl.name}" removed.`);
        return { ...updatedLiability, status: stats.status };
      }
      return stl;
    });
    if (linkedItemsRemovedMessages.length > initialSTLiabilityMessagesCount) setShortTermLiabilities(updatedShortTermLiabilities);

    // Check and update FinancialGoals
    const initialGoalMessagesCount = linkedItemsRemovedMessages.length;
    const updatedFinancialGoals = financialGoals.map(goal => {
      const contributionIndex = goal.contributions.findIndex(c => c.transactionId === id);
      if (contributionIndex > -1) {
        const updatedContributions = goal.contributions.filter(c => c.transactionId !== id);
        const newCurrentAmount = updatedContributions.reduce((sum, c) => sum + c.amount, 0);
        let achievedDate = goal.achievedDate;
        if (newCurrentAmount >= goal.targetAmount && !goal.achievedDate) achievedDate = new Date().toISOString().split('T')[0];
        else if (newCurrentAmount < goal.targetAmount && goal.achievedDate) achievedDate = undefined;
        linkedItemsRemovedMessages.push(`Linked contribution for goal "${goal.name}" removed.`);
        return { ...goal, contributions: updatedContributions, currentAmount: newCurrentAmount, achievedDate };
      }
      return goal;
    });
    if (linkedItemsRemovedMessages.length > initialGoalMessagesCount) setFinancialGoals(updatedFinancialGoals);


    // Original deletion logic for transaction and account balances
    setRawTransactions(prev => prev.filter(t => t.id !== id));
    if (transactionToDelete.bankAccountId) {
      setBankAccounts(prevBankAccounts => prevBankAccounts.map(acc => {
        if (acc.id === transactionToDelete.bankAccountId) {
          let balanceAdjustment = 0;
          if (transactionToDelete.type === TransactionType.INCOME) balanceAdjustment -= transactionToDelete.amount;
          else if (transactionToDelete.type === TransactionType.EXPENSE && (transactionToDelete.paymentMethod === PaymentMethod.BANK_TRANSFER || transactionToDelete.paymentMethod === PaymentMethod.CHEQUE)) balanceAdjustment += transactionToDelete.amount;
          return { ...acc, currentBalance: acc.currentBalance + balanceAdjustment };
        }
        return acc;
      }));
    }
    if (transactionToDelete.creditCardId && transactionToDelete.paymentMethod === PaymentMethod.CREDIT_CARD && transactionToDelete.type === TransactionType.EXPENSE) {
      setCreditCards(prevCreditCards => prevCreditCards.map(card => {
        if (card.id === transactionToDelete.creditCardId) return { ...card, availableBalance: card.availableBalance + transactionToDelete.amount };
        return card;
      }));
    }
    
    let finalMessage = `Transaction "${transactionToDelete.description}" deleted.`;
    if (linkedItemsRemovedMessages.length > 0) {
      finalMessage += ` ${linkedItemsRemovedMessages.join(' ')}`;
      notifyWarning(finalMessage, {...TOAST_CONFIG, autoClose: 5000});
    } else {
      notifySuccess(finalMessage);
    }

  }, [rawTransactions, setRawTransactions, setBankAccounts, setCreditCards, 
      receivables, setReceivables, payables, setPayables, 
      longTermLiabilities, setLongTermLiabilities, shortTermLiabilities, setShortTermLiabilities,
      financialGoals, setFinancialGoals,
      notifyError, notifySuccess, notifyWarning]);
  
  // Budget Operations
  const addBudget = useCallback((budgetData: Omit<Budget, 'id' | 'period'>) => {
    const newBudget: Budget = { ...budgetData, id: Date.now().toString(), period: Period.MONTHLY };
    setBudgets(prev => [...prev, newBudget].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
    notifySuccess(`Budget for "${getCategoryName(budgetData.categoryId)}" added.`);
  }, [setBudgets, notifySuccess, getCategoryName]);

  const updateBudget = useCallback((updatedBudget: Budget) => {
    setBudgets(prev => prev.map(b => b.id === updatedBudget.id ? updatedBudget : b).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
    notifySuccess(`Budget for "${getCategoryName(updatedBudget.categoryId)}" updated.`);
  }, [setBudgets, notifySuccess, getCategoryName]);

  const deleteBudget = useCallback((id: string) => {
    const budgetToDelete = budgets.find(b => b.id === id);
    setBudgets(prev => prev.filter(b => b.id !== id));
    if(budgetToDelete) notifySuccess(`Budget for "${getCategoryName(budgetToDelete.categoryId)}" deleted.`);
  }, [budgets, setBudgets, notifySuccess, getCategoryName]);
  
  // Receivable Operations
  const addReceivable = useCallback((data: Omit<Receivable, 'id' | 'payments' | 'status' | 'createdAt'>) => {
    const newReceivable: Receivable = { ...data, id: Date.now().toString(), payments: [], status: ReceivableStatus.PENDING, createdAt: new Date().toISOString().split('T')[0] };
    setReceivables(prev => [...prev, newReceivable]);
    notifySuccess(`Receivable from "${data.debtorName}" added.`);
  }, [setReceivables, notifySuccess]);

  const updateReceivable = useCallback((data: Omit<Receivable, 'payments' | 'status' | 'createdAt'> & { id: string }) => {
    setReceivables(prev => prev.map(r => {
      if (r.id === data.id) {
        const updatedReceivable = { ...r, ...data };
        const stats = calculateReceivableStats(updatedReceivable);
        return { ...updatedReceivable, status: stats.status };
      }
      return r;
    }));
    notifySuccess(`Receivable from "${data.debtorName}" updated.`);
  }, [setReceivables, notifySuccess]);

  const deleteReceivable = useCallback((id: string) => {
    const receivable = receivables.find(r => r.id === id);
    if (receivable && receivable.payments.length > 0) { notifyWarning("Cannot delete receivable with existing payments. Please remove payments first or create a credit note transaction."); return; }
    setReceivables(prev => prev.filter(r => r.id !== id));
    if (receivable) notifySuccess(`Receivable from "${receivable.debtorName}" deleted.`);
  }, [receivables, setReceivables, notifyWarning, notifySuccess]);

  const addReceivablePayment = useCallback((receivableId: string, paymentData: Omit<ReceivablePayment, 'id' | 'receivableId' | 'transactionId'>) => {
    setReceivables(prev => prev.map(r => {
      if (r.id === receivableId) {
        let generatedTransactionId: string | undefined = undefined;
        if (paymentData.bankAccountId || paymentData.paymentMethod === PaymentMethod.CASH) {
           generatedTransactionId = addTransaction({ date: paymentData.date, description: `Payment received for: ${r.description} (from ${r.debtorName})`, amount: paymentData.amount, type: TransactionType.INCOME, categoryId: 'cat_inc_other', paymentMethod: paymentData.paymentMethod || PaymentMethod.BANK_TRANSFER, bankAccountId: paymentData.bankAccountId, payee: r.debtorName, isTaxRelevant: false, notes: paymentData.notes });
        }
        const newPayment: ReceivablePayment = { ...paymentData, id: Date.now().toString(), receivableId, transactionId: generatedTransactionId };
        const updatedPayments = [...r.payments, newPayment];
        const updatedReceivable = { ...r, payments: updatedPayments };
        const stats = calculateReceivableStats(updatedReceivable);
        
        notifySuccess(`Payment of ${formatCurrency(paymentData.amount)} for "${r.debtorName}" recorded.`);
        if (stats.status === ReceivableStatus.PAID) notifyInfo(`Receivable from "${r.debtorName}" is now fully paid!`);
        return { ...updatedReceivable, status: stats.status };
      }
      return r;
    }));
  }, [setReceivables, addTransaction, formatCurrency, notifySuccess, notifyInfo]);

  const getReceivableById = useCallback((id: string) => receivables.find(r => r.id === id), [receivables]);


  // Payable Operations
  const addPayable = useCallback((data: Omit<Payable, 'id' | 'payments' | 'status' | 'createdAt'>) => {
    const newPayable: Payable = { ...data, id: Date.now().toString(), payments: [], status: PayableStatus.PENDING, createdAt: new Date().toISOString().split('T')[0] };
    setPayables(prev => [...prev, newPayable]);
    notifySuccess(`Payable to "${data.creditorName}" added.`);
  }, [setPayables, notifySuccess]);

  const updatePayable = useCallback((data: Omit<Payable, 'payments' | 'status' | 'createdAt'> & {id: string}) => {
    setPayables(prev => prev.map(p => {
      if (p.id === data.id) {
        const updatedPayable = { ...p, ...data };
        const stats = calculatePayableStats(updatedPayable);
        return { ...updatedPayable, status: stats.status };
      }
      return p;
    }));
    notifySuccess(`Payable to "${data.creditorName}" updated.`);
  }, [setPayables, notifySuccess]);

  const deletePayable = useCallback((id: string) => {
    const payable = payables.find(p => p.id === id);
    if (payable && payable.payments.length > 0) { notifyWarning("Cannot delete payable with existing payments. Please remove payments first."); return; }
    setPayables(prev => prev.filter(p => p.id !== id));
    if(payable) notifySuccess(`Payable to "${payable.creditorName}" deleted.`);
  }, [payables, setPayables, notifyWarning, notifySuccess]);

  const addPayablePayment = useCallback((payableId: string, paymentData: Omit<PayablePayment, 'id' | 'payableId' | 'transactionId'>) => {
    setPayables(prev => prev.map(p => {
      if (p.id === payableId) {
        const generatedTransactionId = addTransaction({ date: paymentData.date, description: `Payment made for: ${p.description} (to ${p.creditorName})`, amount: paymentData.amount, type: TransactionType.EXPENSE, categoryId: 'cat_exp_loan_repayments_general', paymentMethod: paymentData.paymentMethod || PaymentMethod.BANK_TRANSFER, bankAccountId: paymentData.bankAccountId, creditCardId: paymentData.creditCardId, payee: p.creditorName, isTaxRelevant: false, notes: paymentData.notes });
        const newPayment: PayablePayment = { ...paymentData, id: Date.now().toString(), payableId, transactionId: generatedTransactionId };
        const updatedPayments = [...p.payments, newPayment];
        const updatedPayable = { ...p, payments: updatedPayments };
        const stats = calculatePayableStats(updatedPayable);
        notifySuccess(`Payment of ${formatCurrency(paymentData.amount)} to "${p.creditorName}" recorded.`);
        if (stats.status === PayableStatus.PAID) notifyInfo(`Payable to "${p.creditorName}" is now fully paid!`);
        return { ...updatedPayable, status: stats.status };
      }
      return p;
    }));
  }, [setPayables, addTransaction, formatCurrency, notifySuccess, notifyInfo]);

  const getPayableById = useCallback((id: string) => payables.find(p => p.id === id), [payables]);

  // Credit Card Operations
  const addCreditCard = useCallback((cardData: Omit<CreditCard, 'id' | 'availableBalance'> & { availableBalance?: number }) => {
    const newCard: CreditCard = { ...cardData, id: Date.now().toString(), availableBalance: cardData.availableBalance !== undefined ? cardData.availableBalance : cardData.creditLimit };
    setCreditCards(prev => [...prev, newCard]);
    notifySuccess(`Credit card "${cardData.name}" added.`);
  }, [setCreditCards, notifySuccess]);

  const updateCreditCard = useCallback((card: CreditCard) => {
    setCreditCards(prev => prev.map(c => c.id === card.id ? card : c));
    notifySuccess(`Credit card "${card.name}" updated.`);
  }, [setCreditCards, notifySuccess]);

  const deleteCreditCard = useCallback((id: string) => {
    const isUsedInTransactions = transactions.some(t => t.creditCardId === id);
    const isUsedInRecurring = recurringTransactions.some(rt => rt.creditCardId === id);
    if (isUsedInTransactions || isUsedInRecurring) { notifyWarning("Cannot delete credit card. It's linked to existing transactions or recurring transactions."); return; }
    const card = creditCards.find(c=> c.id === id);
    setCreditCards(prev => prev.filter(c => c.id !== id));
    if(card) notifySuccess(`Credit card "${card.name}" deleted.`);
  }, [transactions, recurringTransactions, creditCards, setCreditCards, notifyWarning, notifySuccess]);

  const getCreditCardById = useCallback((id: string) => creditCards.find(c => c.id === id), [creditCards]);

  const recordCreditCardPayment = useCallback((creditCardId: string, paymentAmount: number, paymentMethodUsed: PaymentMethod, date: string, bankAccountId?: string, notes?: string) => {
    const cardBeingPaid = creditCards.find(cc => cc.id === creditCardId);
    const payingBankAccount = bankAccountId ? bankAccounts.find(ba => ba.id === bankAccountId) : null;

    if (!cardBeingPaid) { notifyError("Credit card not found."); return; }
    if (paymentMethodUsed === PaymentMethod.BANK_TRANSFER && !payingBankAccount) { notifyError("Source bank account for payment not found."); return; }
    if (payingBankAccount && payingBankAccount.currentBalance < paymentAmount) { notifyError(`Insufficient funds in ${payingBankAccount.accountName}.`); return; }
    
    const actualAmountToRestore = Math.min(paymentAmount, cardBeingPaid.creditLimit - cardBeingPaid.availableBalance);
    if (actualAmountToRestore <= 0 && paymentAmount > 0) { notifyInfo(`Card "${cardBeingPaid.name}" already has full available credit or payment exceeds outstanding. No payment processed.`); return; }

    // Not capturing transactionId here as CC payments are their own flow, not like a payable.
    addTransaction({ date, description: `Credit Card Payment: ${cardBeingPaid.name}`, amount: paymentAmount, type: TransactionType.EXPENSE, categoryId: 'cat_sys_cc_payment', paymentMethod: paymentMethodUsed, bankAccountId: bankAccountId, payee: cardBeingPaid.bankName, isTaxRelevant: false, notes: notes || `Payment for ${cardBeingPaid.name}` });
    setCreditCards(prevCards => prevCards.map(cc => cc.id === creditCardId ? { ...cc, availableBalance: Math.min(cc.creditLimit, cc.availableBalance + actualAmountToRestore) } : cc ));
    notifySuccess(`Payment of ${formatCurrency(paymentAmount)} to "${cardBeingPaid.name}" recorded.`);
  }, [creditCards, bankAccounts, addTransaction, setCreditCards, notifyError, notifyInfo, notifySuccess, formatCurrency]);
  
  // Bank Account Operations
  const addBankAccount = useCallback((accountData: Omit<BankAccount, 'id'>) => {
    const newAccount: BankAccount = { ...accountData, id: Date.now().toString() };
    setBankAccounts(prev => [...prev, newAccount]);
    notifySuccess(`Bank account "${accountData.accountName}" added.`);
  }, [setBankAccounts, notifySuccess]);

  const updateBankAccount = useCallback((account: BankAccount) => {
    setBankAccounts(prev => prev.map(acc => acc.id === account.id ? account : acc));
    notifySuccess(`Bank account "${account.accountName}" updated.`);
  }, [setBankAccounts, notifySuccess]);

  const deleteBankAccount = useCallback((id: string) => {
    const isUsedInTransactions = transactions.some(t => t.bankAccountId === id);
    const isUsedInRecurring = recurringTransactions.some(rt => rt.bankAccountId === id);
    const isUsedInReceivablePayments = receivables.some(r => r.payments.some(p => p.bankAccountId === id));
    const isUsedInPayablePayments = payables.some(p => p.payments.some(p => p.bankAccountId === id));
    const isUsedInLTLPayments = longTermLiabilities.some(l => l.payments.some(p => p.bankAccountId === id));
    const isUsedInSTLPayments = shortTermLiabilities.some(s => s.payments.some(p => p.bankAccountId === id));
    const isUsedInUserSettings = userSettings.emergencyFundAccountIds.includes(id);

    if (isUsedInTransactions || isUsedInRecurring || isUsedInReceivablePayments || isUsedInPayablePayments || isUsedInLTLPayments || isUsedInSTLPayments || isUsedInUserSettings) { notifyWarning("Cannot delete bank account. It's linked to transactions, recurring transactions, payments, or user settings."); return; }
    const acc = bankAccounts.find(ba=>ba.id === id);
    setBankAccounts(prev => prev.filter(ba => ba.id !== id));
    if (acc) notifySuccess(`Bank account "${acc.accountName}" deleted.`);
  }, [transactions, recurringTransactions, receivables, payables, longTermLiabilities, shortTermLiabilities, userSettings, bankAccounts, setBankAccounts, notifyWarning, notifySuccess]);

  const getBankAccountById = useCallback((id: string | undefined) => {
    if (!id) return undefined;
    return bankAccounts.find(acc => acc.id === id);
  }, [bankAccounts]);
  
  const transferCashToBank = useCallback((amountToTransfer: number, targetBankAccountId: string, transferDate: string, transferNotes?: string) => {
    if (amountToTransfer > cashBalance) { notifyError("Transfer amount exceeds available cash balance."); return; }
    const targetAccount = bankAccounts.find(acc => acc.id === targetBankAccountId);
    if (!targetAccount) { notifyError("Target bank account not found."); return; }

    addTransaction({ date: transferDate, description: `Cash deposit to ${targetAccount.accountName}`, amount: amountToTransfer, type: TransactionType.EXPENSE, categoryId: 'cat_sys_cash_to_bank', paymentMethod: PaymentMethod.CASH, payee: targetAccount.bankName, notes: transferNotes });
    addTransaction({ date: transferDate, description: `Cash deposited from hand`, amount: amountToTransfer, type: TransactionType.INCOME, categoryId: 'cat_sys_cash_to_bank', paymentMethod: PaymentMethod.BANK_TRANSFER, bankAccountId: targetBankAccountId, payee: "Self (Cash Deposit)", notes: transferNotes });
    notifySuccess(`${formatCurrency(amountToTransfer)} transferred from cash to ${targetAccount.accountName}.`);
  }, [cashBalance, bankAccounts, addTransaction, notifyError, notifySuccess, formatCurrency]);
  
  const performInterBankTransfer = useCallback((fromAccountId: string, toAccountId: string, amount: number, date: string, notes?: string) => {
    const fromAccount = bankAccounts.find(acc => acc.id === fromAccountId);
    const toAccount = bankAccounts.find(acc => acc.id === toAccountId);

    if (!fromAccount || !toAccount) { notifyError("One or both bank accounts not found."); return; }
    if (fromAccount.currentBalance < amount) { notifyError(`Insufficient funds in ${fromAccount.accountName}.`); return; }

    addTransaction({ date, description: `Transfer to ${toAccount.accountName} ${notes ? '- ' + notes : ''}`, amount, type: TransactionType.EXPENSE, categoryId: 'cat_sys_inter_bank_out', paymentMethod: PaymentMethod.BANK_TRANSFER, bankAccountId: fromAccountId, payee: toAccount.bankName, notes });
    addTransaction({ date, description: `Transfer from ${fromAccount.accountName} ${notes ? '- ' + notes : ''}`, amount, type: TransactionType.INCOME, categoryId: 'cat_sys_inter_bank_in', paymentMethod: PaymentMethod.BANK_TRANSFER, bankAccountId: toAccountId, payee: fromAccount.bankName, notes });
    notifySuccess(`Transfer of ${formatCurrency(amount)} from ${fromAccount.accountName} to ${toAccount.accountName} successful.`);
  }, [bankAccounts, addTransaction, notifyError, notifySuccess, formatCurrency]);


  // Long-Term Liability Operations
  const addLongTermLiability = useCallback((data: Omit<LongTermLiability, 'id' | 'payments' | 'createdAt'>) => {
    const newLiability: LongTermLiability = { ...data, id: Date.now().toString(), payments: [], createdAt: new Date().toISOString().split('T')[0] };
    setLongTermLiabilities(prev => [...prev, newLiability]);
    notifySuccess(`Long-term liability "${data.name}" added.`);
  }, [setLongTermLiabilities, notifySuccess]);

  const updateLongTermLiability = useCallback((data: Omit<LongTermLiability, 'payments' | 'createdAt'> & {id: string}) => {
    setLongTermLiabilities(prev => prev.map(l => l.id === data.id ? { ...l, ...data } : l));
    notifySuccess(`Long-term liability "${data.name}" updated.`);
  }, [setLongTermLiabilities, notifySuccess]);

  const deleteLongTermLiability = useCallback((id: string) => {
    const liability = longTermLiabilities.find(l=>l.id === id);
    if(liability && liability.payments.length > 0) { notifyWarning("Cannot delete liability with payments. Remove payments first."); return; }
    setLongTermLiabilities(prev => prev.filter(l => l.id !== id));
    if (liability) notifySuccess(`Long-term liability "${liability.name}" deleted.`);
  }, [longTermLiabilities, setLongTermLiabilities, notifyWarning, notifySuccess]);

  const addLongTermLiabilityPayment = useCallback((liabilityId: string, paymentData: Omit<LongTermLiabilityPayment, 'id' | 'liabilityId' | 'transactionId'>) => {
    setLongTermLiabilities(prev => prev.map(l => {
      if (l.id === liabilityId) {
        const generatedTransactionId = addTransaction({ date: paymentData.date, description: `Payment for ${l.name}`, amount: paymentData.amount, type: TransactionType.EXPENSE, categoryId: 'cat_exp_loan_repayments_general', paymentMethod: paymentData.paymentMethod || PaymentMethod.BANK_TRANSFER, bankAccountId: paymentData.bankAccountId, creditCardId: paymentData.creditCardId, payee: l.lender, notes: paymentData.notes });
        const newPayment: LongTermLiabilityPayment = { ...paymentData, id: Date.now().toString(), liabilityId, transactionId: generatedTransactionId };
        notifySuccess(`Payment of ${formatCurrency(paymentData.amount)} for "${l.name}" recorded.`);
        return { ...l, payments: [...l.payments, newPayment] };
      }
      return l;
    }));
  }, [setLongTermLiabilities, addTransaction, formatCurrency, notifySuccess]);

  const getLongTermLiabilityById = useCallback((id: string) => longTermLiabilities.find(l => l.id === id), [longTermLiabilities]);

  // Short-Term Liability Operations
  const addShortTermLiability = useCallback((data: Omit<ShortTermLiability, 'id' | 'payments' | 'status' | 'createdAt'>) => {
    const newLiability: ShortTermLiability = { ...data, id: Date.now().toString(), payments: [], status: ShortTermLiabilityStatus.PENDING, createdAt: new Date().toISOString().split('T')[0] };
    setShortTermLiabilities(prev => [...prev, newLiability]);
    notifySuccess(`Short-term liability "${data.name}" added.`);
  }, [setShortTermLiabilities, notifySuccess]);

  const updateShortTermLiability = useCallback((data: Omit<ShortTermLiability, 'payments' | 'status' | 'createdAt'> & {id: string}) => {
    setShortTermLiabilities(prev => prev.map(l => {
        if (l.id === data.id) {
            const updatedLiability = {...l, ...data};
            const stats = calculateShortTermLiabilityStats(updatedLiability);
            return {...updatedLiability, status: stats.status};
        }
        return l;
    }));
    notifySuccess(`Short-term liability "${data.name}" updated.`);
  }, [setShortTermLiabilities, notifySuccess]);

  const deleteShortTermLiability = useCallback((id: string) => {
    const liability = shortTermLiabilities.find(l=>l.id === id);
    if(liability && liability.payments.length > 0) { notifyWarning("Cannot delete liability with payments. Remove payments first."); return; }
    setShortTermLiabilities(prev => prev.filter(l => l.id !== id));
    if (liability) notifySuccess(`Short-term liability "${liability.name}" deleted.`);
  }, [shortTermLiabilities, setShortTermLiabilities, notifyWarning, notifySuccess]);

  const addShortTermLiabilityPayment = useCallback((liabilityId: string, paymentData: Omit<ShortTermLiabilityPayment, 'id' | 'liabilityId' | 'transactionId'>) => {
    setShortTermLiabilities(prev => prev.map(l => {
      if (l.id === liabilityId) {
        const generatedTransactionId = addTransaction({ date: paymentData.date, description: `Payment for ${l.name}`, amount: paymentData.amount, type: TransactionType.EXPENSE, categoryId: 'cat_exp_loan_repayments_general', paymentMethod: paymentData.paymentMethod || PaymentMethod.BANK_TRANSFER, bankAccountId: paymentData.bankAccountId, creditCardId: paymentData.creditCardId, payee: l.lender, notes: paymentData.notes });
        const newPayment: ShortTermLiabilityPayment = { ...paymentData, id: Date.now().toString(), liabilityId, transactionId: generatedTransactionId };
        const updatedPayments = [...l.payments, newPayment];
        const updatedLiability = { ...l, payments: updatedPayments };
        const stats = calculateShortTermLiabilityStats(updatedLiability);
        notifySuccess(`Payment of ${formatCurrency(paymentData.amount)} for "${l.name}" recorded.`);
        if (stats.status === ShortTermLiabilityStatus.PAID) notifyInfo(`Liability "${l.name}" is now fully paid!`);
        return { ...updatedLiability, status: stats.status };
      }
      return l;
    }));
  }, [setShortTermLiabilities, addTransaction, formatCurrency, notifySuccess, notifyInfo]);

  const getShortTermLiabilityById = useCallback((id: string) => shortTermLiabilities.find(l => l.id === id), [shortTermLiabilities]);


  // Non-Current Asset Operations
  const addNonCurrentAsset = useCallback((data: Omit<NonCurrentAsset, 'id'>) => {
    const newAsset: NonCurrentAsset = { ...data, id: Date.now().toString() };
    setNonCurrentAssets(prev => [...prev, newAsset]);
    notifySuccess(`Asset "${data.name}" added.`);
  }, [setNonCurrentAssets, notifySuccess]);

  const updateNonCurrentAsset = useCallback((asset: NonCurrentAsset) => {
    setNonCurrentAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
    notifySuccess(`Asset "${asset.name}" updated.`);
  }, [setNonCurrentAssets, notifySuccess]);

  const deleteNonCurrentAsset = useCallback((id: string) => {
    const asset = nonCurrentAssets.find(a=> a.id === id);
    setNonCurrentAssets(prev => prev.filter(a => a.id !== id));
    if(asset) notifySuccess(`Asset "${asset.name}" deleted.`);
  }, [nonCurrentAssets, setNonCurrentAssets, notifySuccess]);

  const getNonCurrentAssetById = useCallback((id: string) => nonCurrentAssets.find(a => a.id === id), [nonCurrentAssets]);
  
  // Financial Goal Operations
  const addFinancialGoal = useCallback((data: Omit<FinancialGoal, 'id' | 'currentAmount' | 'createdAt' | 'contributions'>) => {
    const newGoal: FinancialGoal = { ...data, id: Date.now().toString(), currentAmount: 0, createdAt: new Date().toISOString().split('T')[0], contributions: [] };
    setFinancialGoals(prev => [...prev, newGoal]);
    notifySuccess(`Financial goal "${data.name}" added.`);
  }, [setFinancialGoals, notifySuccess]);

  const updateFinancialGoal = useCallback((data: Omit<FinancialGoal, 'currentAmount' | 'createdAt' | 'contributions' | 'achievedDate'> & { id: string; achievedDate?: string }) => {
    setFinancialGoals(prev => prev.map(g => {
        if (g.id === data.id) {
            const updatedGoal = { ...g, name: data.name, targetAmount: data.targetAmount, deadline: data.deadline, notes: data.notes };
            if (data.achievedDate !== undefined) updatedGoal.achievedDate = data.achievedDate;
            else if (updatedGoal.currentAmount >= updatedGoal.targetAmount && !updatedGoal.achievedDate) updatedGoal.achievedDate = new Date().toISOString().split('T')[0];
            else if (updatedGoal.currentAmount < updatedGoal.targetAmount && updatedGoal.achievedDate) updatedGoal.achievedDate = undefined;
            return updatedGoal;
        }
        return g;
    }));
    notifySuccess(`Financial goal "${data.name}" updated.`);
  }, [setFinancialGoals, notifySuccess]);

  const deleteFinancialGoal = useCallback((id: string) => {
    const goal = financialGoals.find(g=>g.id === id);
    setFinancialGoals(prev => prev.filter(g => g.id !== id));
    if(goal) notifySuccess(`Financial goal "${goal.name}" deleted.`);
  }, [financialGoals, setFinancialGoals, notifySuccess]);

  const addGoalContribution = useCallback((goalId: string, contributionData: Omit<GoalContribution, 'id' | 'goalId' | 'transactionId'>, createTransactionDetails?: { bankAccountId?: string, paymentMethod: PaymentMethod }) => {
    setFinancialGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        let generatedTransactionId: string | undefined = undefined;
        if(createTransactionDetails) { 
            generatedTransactionId = addTransaction({ date: contributionData.date, description: `Contribution to goal: ${g.name}`, amount: contributionData.amount, type: TransactionType.EXPENSE, categoryId: 'cat_sys_goal_contrib', paymentMethod: createTransactionDetails.paymentMethod, bankAccountId: createTransactionDetails.bankAccountId, payee: "Financial Goal", notes: `Contribution for "${g.name}". ${contributionData.notes || ''}`.trim(), isTaxRelevant: false }); 
        }
        const newContribution: GoalContribution = { ...contributionData, id: Date.now().toString(), goalId, transactionId: generatedTransactionId };
        const updatedContributions = [...g.contributions, newContribution];
        const newCurrentAmount = updatedContributions.reduce((sum, c) => sum + c.amount, 0);
        let achievedDate = g.achievedDate;
        if (newCurrentAmount >= g.targetAmount && !g.achievedDate) { achievedDate = new Date().toISOString().split('T')[0]; notifySuccess(`Goal "${g.name}" achieved! Congratulations!`); }
        notifySuccess(`Contribution of ${formatCurrency(contributionData.amount)} to goal "${g.name}" recorded.`);
        return { ...g, contributions: updatedContributions, currentAmount: newCurrentAmount, achievedDate };
      }
      return g;
    }));
  }, [setFinancialGoals, addTransaction, formatCurrency, notifySuccess]);

  const getFinancialGoalById = useCallback((id: string) => financialGoals.find(g => g.id === id), [financialGoals]);
  
  // Recurring Transaction Operations
  const addRecurringTransaction = useCallback((data: Omit<RecurringTransaction, 'id' | 'nextDueDate' | 'isActive' | 'lastProcessedDate'>) => {
    const nextDueDate = calculateNextDueDate(data);
    const newRt: RecurringTransaction = { ...data, id: Date.now().toString(), nextDueDate, isActive: true, lastProcessedDate: undefined };
    setRecurringTransactions(prev => [...prev, newRt].sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()));
    notifySuccess(`Recurring transaction "${data.description}" added.`);
  }, [setRecurringTransactions, notifySuccess]);

  const updateRecurringTransaction = useCallback((rt: RecurringTransaction) => {
    const updatedRt = {...rt, nextDueDate: calculateNextDueDate(rt)};
    setRecurringTransactions(prev => prev.map(r => r.id === updatedRt.id ? updatedRt : r).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()));
    notifySuccess(`Recurring transaction "${rt.description}" updated.`);
  }, [setRecurringTransactions, notifySuccess]);

  const deleteRecurringTransaction = useCallback((id: string) => {
    const rt = recurringTransactions.find(r => r.id === id);
    setRecurringTransactions(prev => prev.filter(r => r.id !== id));
    if (rt) notifySuccess(`Recurring transaction "${rt.description}" deleted.`);
  }, [recurringTransactions, setRecurringTransactions, notifySuccess]);

  const getRecurringTransactionById = useCallback((id: string) => recurringTransactions.find(rt => rt.id === id), [recurringTransactions]);

  const processRecurringTransactions = useCallback((idsToProcess: string[]) => {
    let processedCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const newTransactionsGenerated: Transaction[] = [];
    const updatedRts = recurringTransactions.map(rt => {
        if (idsToProcess.includes(rt.id) && rt.isActive && new Date(rt.nextDueDate) <= new Date(todayStr+"T23:59:59")) {
            newTransactionsGenerated.push({ id: `txn_rt_${rt.id}_${rt.nextDueDate}_${Date.now()}`, date: rt.nextDueDate, description: rt.description, amount: rt.amount, type: rt.type, categoryId: rt.categoryId, paymentMethod: rt.paymentMethod, creditCardId: rt.creditCardId, bankAccountId: rt.bankAccountId, recurringTransactionId: rt.id, isTaxRelevant: !!(categories.find(c => c.id === rt.categoryId)?.defaultTaxRelevance !== 'none'), payee: "Recurring", notes: rt.notes });
            processedCount++;
            let newIsActive: boolean = rt.isActive; // Explicitly type as boolean
            let newNextDueDate = calculateNextDueDate({...rt, lastProcessedDate: rt.nextDueDate});
            if (rt.endDate && new Date(newNextDueDate) > new Date(rt.endDate+"T23:59:59")) { newIsActive = false; newNextDueDate = rt.endDate; }
            return { ...rt, lastProcessedDate: rt.nextDueDate, nextDueDate: newNextDueDate, isActive: newIsActive };
        }
        return rt;
    });

    if (newTransactionsGenerated.length > 0) {
      newTransactionsGenerated.forEach(txn => addTransaction(txn)); // Use addTransaction to handle balance updates
      setRecurringTransactions(updatedRts.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()));
      notifySuccess(`${processedCount} recurring transaction(s) processed successfully!`);
    } else {
      notifyInfo("No recurring transactions were due for processing or selected.");
    }
  }, [recurringTransactions, categories, addTransaction, setRecurringTransactions, notifySuccess, notifyInfo]);

  // Net Worth Calculations
  const calculateNetWorth = useCallback((): { netWorth: number; totalAssets: number; totalLiabilities: number } => {
    const totalBankBalances = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const totalReceivablesVal = receivables.reduce((sum, r) => sum + calculateReceivableStats(r).remaining, 0);
    const totalNonCurrentAssetsValue = nonCurrentAssets.reduce((sum, asset) => sum + (asset.currentValue ?? asset.acquisitionCost), 0);
    const totalAssets = totalBankBalances + cashBalance + totalReceivablesVal + totalNonCurrentAssetsValue;

    const totalPayablesVal = payables.reduce((sum, p) => sum + calculatePayableStats(p).remaining, 0);
    const totalCreditCardDebt = creditCards.reduce((sum, card) => sum + (card.creditLimit - card.availableBalance), 0);
    const totalLongTermDebt = longTermLiabilities.reduce((sum, l) => sum + calculateLongTermLiabilityStats(l).remainingBalance, 0);
    const totalShortTermDebt = shortTermLiabilities.reduce((sum, l) => sum + calculateShortTermLiabilityStats(l).remaining, 0);
    const totalLiabilities = totalPayablesVal + totalCreditCardDebt + totalLongTermDebt + totalShortTermDebt;
    const netWorth = totalAssets - totalLiabilities;
    return { netWorth, totalAssets, totalLiabilities };
  }, [bankAccounts, cashBalance, receivables, nonCurrentAssets, payables, creditCards, longTermLiabilities, shortTermLiabilities]);

  const recordNetWorthSnapshot = useCallback(() => {
    const { netWorth, totalAssets, totalLiabilities } = calculateNetWorth();
    const today = new Date().toISOString().split('T')[0];
    const existingSnapshotToday = netWorthHistory.find(s => s.date === today);
    if (existingSnapshotToday) {
        setNetWorthHistory(prev => prev.map(s => s.id === existingSnapshotToday.id ? {...s, netWorth, assets: totalAssets, liabilities: totalLiabilities } : s));
        notifyInfo("Net worth snapshot for today already exists. It has been updated with current values.");
    } else {
        const newSnapshot: NetWorthSnapshot = { id: Date.now().toString(), date: today, netWorth, assets: totalAssets, liabilities: totalLiabilities };
        setNetWorthHistory(prev => [...prev, newSnapshot].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        notifySuccess("Net worth snapshot recorded successfully!");
    }
  }, [calculateNetWorth, netWorthHistory, setNetWorthHistory, notifyInfo, notifySuccess]);
  
  // Reporting & Settings
  const exportTransactionsToCSV = useCallback(() => {
    if (transactions.length === 0) { notifyWarning("No transactions to export."); return; }
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Payment Method', 'Bank Account', 'Credit Card', 'Tax Relevant', 'Payee'];
    const csvRows = [headers.join(',')];
    transactions.forEach(t => {
      const row = [ t.date, `"${t.description.replace(/"/g, '""')}"`, t.amount.toString(), t.type, getCategoryName(t.categoryId), t.paymentMethod, t.bankAccountId ? getBankAccountById(t.bankAccountId)?.accountName || 'N/A' : '', t.creditCardId ? getCreditCardById(t.creditCardId)?.name || 'N/A' : '', t.isTaxRelevant ? 'Yes' : 'No', `"${t.payee?.replace(/"/g, '""') || ''}"` ];
      csvRows.push(row.join(','));
    });
    const csvString = csvRows.join('\n'); const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a");
    if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", `transactions_export_${new Date().toISOString().split('T')[0]}.csv`); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); notifySuccess("Transactions exported to CSV!"); }
  }, [transactions, getCategoryName, getBankAccountById, getCreditCardById, notifyWarning, notifySuccess]);
  
  const getTaxSummaryData = useCallback((taxYear: string): { income: Array<{ categoryName: string; totalAmount: number; transactions: Transaction[] }>; expenses: Array<{ categoryName: string; totalAmount: number; transactions: Transaction[] }> } => {
    const range = getTaxYearDateRange(taxYear); if (!range) return { income: [], expenses: [] };
    const relevantTransactions = transactions.filter(t => t.date >= range.startDate && t.date <= range.endDate && t.isTaxRelevant);
    const incomeSummary: { [categoryId: string]: { categoryName: string; totalAmount: number; transactions: Transaction[] } } = {};
    const expenseSummary: { [categoryId: string]: { categoryName: string; totalAmount: number; transactions: Transaction[] } } = {};
    relevantTransactions.forEach(t => {
        const category = getCategoryById(t.categoryId); if (!category) return; 
        if (t.type === TransactionType.INCOME && category.defaultTaxRelevance === 'income') { if (!incomeSummary[category.id]) incomeSummary[category.id] = { categoryName: category.name, totalAmount: 0, transactions: [] }; incomeSummary[category.id].totalAmount += t.amount; incomeSummary[category.id].transactions.push(t);
        } else if (t.type === TransactionType.EXPENSE && category.defaultTaxRelevance === 'deduction') { if (!expenseSummary[category.id]) expenseSummary[category.id] = { categoryName: category.name, totalAmount: 0, transactions: [] }; expenseSummary[category.id].totalAmount += t.amount; expenseSummary[category.id].transactions.push(t); }
    });
    return { income: Object.values(incomeSummary), expenses: Object.values(expenseSummary) };
  }, [transactions, getCategoryById]);
  
  const updateUserSettings = useCallback((settings: Partial<UserSettings>) => {
    setUserSettings(prev => ({ ...prev, ...settings }));
    notifySuccess("User settings updated!");
  }, [setUserSettings, notifySuccess]);

  const calculateCashFlowProjection = useCallback((daysToProject: number, selectedAccountIds: string[]): DailyCashFlowProjection[] => {
    const projections: DailyCashFlowProjection[] = []; let currentSimulatedBalance = 0;
    selectedAccountIds.forEach(accId => { if (accId === 'cash') currentSimulatedBalance += cashBalance; else { const account = bankAccounts.find(ba => ba.id === accId); if (account) currentSimulatedBalance += account.currentBalance; } });
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 0; i < daysToProject; i++) {
        const projectionDate = new Date(today); projectionDate.setDate(today.getDate() + i); const projectionDateStr = projectionDate.toISOString().split('T')[0];
        const dailyEvents: CashFlowProjectionEvent[] = []; let endOfDayBalance = currentSimulatedBalance;
        recurringTransactions.forEach(rt => { if (rt.isActive && rt.nextDueDate === projectionDateStr) { let involvesSelectedAccount = false; if (rt.bankAccountId && selectedAccountIds.includes(rt.bankAccountId)) involvesSelectedAccount = true; else if (rt.paymentMethod === PaymentMethod.CASH && selectedAccountIds.includes('cash')) involvesSelectedAccount = true; if (involvesSelectedAccount) { const amount = rt.type === TransactionType.INCOME ? rt.amount : -rt.amount; dailyEvents.push({ description: rt.description, amount: Math.abs(rt.amount), type: rt.type === TransactionType.INCOME ? 'inflow' : 'outflow' }); endOfDayBalance += amount; } } });
        payables.forEach(p => { const stats = calculatePayableStats(p); if(stats.status !== PayableStatus.PAID && p.dueDate === projectionDateStr) { if (selectedAccountIds.length > 0) { dailyEvents.push({ description: `Payable: ${p.creditorName} - ${p.description}`, amount: stats.remaining, type: 'outflow'}); endOfDayBalance -= stats.remaining; } } });
        receivables.forEach(r => { const stats = calculateReceivableStats(r); if(stats.status !== ReceivableStatus.PAID && r.dueDate === projectionDateStr) { if (selectedAccountIds.length > 0) { dailyEvents.push({ description: `Receivable: ${r.debtorName} - ${r.description}`, amount: stats.remaining, type: 'inflow'}); endOfDayBalance += stats.remaining; } } });
        projections.push({ date: projectionDateStr, startOfDayBalance: currentSimulatedBalance, events: dailyEvents, endOfDayBalance: endOfDayBalance }); currentSimulatedBalance = endOfDayBalance;
    }
    return projections;
  }, [cashBalance, bankAccounts, recurringTransactions, payables, receivables]);

  const exportAllDataToJson = useCallback(() => {
    const backupData: AppStateBackupV1 = { categories, rawTransactions, budgets, selectedCurrency, receivables, payables, creditCards, bankAccounts, longTermLiabilities, shortTermLiabilities, nonCurrentAssets, financialGoals, recurringTransactions, netWorthHistory, userSettings, cashBalance };
    const jsonData = JSON.stringify(backupData, null, 2); const blob = new Blob([jsonData], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `finance_tracker_backup_${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    notifySuccess("All application data exported successfully!");
  }, [categories, rawTransactions, budgets, selectedCurrency, receivables, payables, creditCards, bankAccounts, longTermLiabilities, shortTermLiabilities, nonCurrentAssets, financialGoals, recurringTransactions, netWorthHistory, userSettings, cashBalance, notifySuccess]);

  const importAllDataFromJson = useCallback(async (jsonDataString: string): Promise<boolean> => {
    try {
        const parsedData = JSON.parse(jsonDataString) as AppStateBackupV1;
        if (!parsedData.categories || !parsedData.rawTransactions || !parsedData.userSettings) throw new Error("Invalid backup file structure.");
        const confirmed = window.confirm( "WARNING: Importing data will overwrite ALL existing application data. This action cannot be undone. Are you sure you want to proceed?" );
        if (!confirmed) { notifyInfo("Data import cancelled by user."); return false; }
        setCategories(parsedData.categories || INITIAL_CATEGORIES); setRawTransactions(parsedData.rawTransactions || INITIAL_TRANSACTIONS); setBudgets(parsedData.budgets || INITIAL_BUDGETS); setSelectedCurrency(parsedData.selectedCurrency || DEFAULT_CURRENCY); setReceivables(parsedData.receivables || INITIAL_RECEIVABLES); setPayables(parsedData.payables || INITIAL_PAYABLES); setCreditCards(parsedData.creditCards || INITIAL_CREDIT_CARDS); setBankAccounts(parsedData.bankAccounts || INITIAL_BANK_ACCOUNTS); setLongTermLiabilities(parsedData.longTermLiabilities || INITIAL_LONG_TERM_LIABILITIES); setShortTermLiabilities(parsedData.shortTermLiabilities || INITIAL_SHORT_TERM_LIABILITIES); setNonCurrentAssets(parsedData.nonCurrentAssets || INITIAL_NON_CURRENT_ASSETS); setFinancialGoals(parsedData.financialGoals || INITIAL_FINANCIAL_GOALS); setRecurringTransactions(parsedData.recurringTransactions || INITIAL_RECURRING_TRANSACTIONS); setNetWorthHistory(parsedData.netWorthHistory || INITIAL_NET_WORTH_HISTORY); setUserSettings(parsedData.userSettings || INITIAL_USER_SETTINGS);
        notifySuccess("Data imported successfully! The application will now reload to apply changes.");
        return true;
    } catch (e: any) { console.error("Error importing data:", e); notifyError(`Import failed: ${e.message || "Invalid JSON file or data structure."}`); return false; }
  }, [setCategories, setRawTransactions, setBudgets, setSelectedCurrency, setReceivables, setPayables, setCreditCards, setBankAccounts, setLongTermLiabilities, setShortTermLiabilities, setNonCurrentAssets, setFinancialGoals, setRecurringTransactions, setNetWorthHistory, setUserSettings, notifyInfo, notifySuccess, notifyError]);

  const performSearch = useCallback((query: string) => {
      if (!query.trim()) { setSearchResults({}); setIsSearchModalOpen(false); return; }
      const lowerQuery = query.toLowerCase(); const results: SearchResults = {};
      results["Transactions"] = transactions.filter(t => t.description.toLowerCase().includes(lowerQuery) || (t.payee && t.payee.toLowerCase().includes(lowerQuery)) || getCategoryName(t.categoryId).toLowerCase().includes(lowerQuery) ).map(t => ({ id: t.id, type: 'Transaction', name: t.description, description: `${formatCurrency(t.amount)} on ${t.date} (${getCategoryName(t.categoryId)})`, path: `/transactions/edit/${t.id}`, icon: 'fa-exchange-alt' }));
      results["Categories"] = categories.filter(c => c.name.toLowerCase().includes(lowerQuery)).map(c => ({ id: c.id, type: 'Category', name: c.name, path: '/categories', icon: 'fa-tags' }));
      results["Budgets"] = budgets.filter(b => getCategoryName(b.categoryId).toLowerCase().includes(lowerQuery)).map(b => ({ id: b.id, type: 'Budget', name: `Budget for ${getCategoryName(b.categoryId)} (${b.startDate.substring(0,7)})`, description: `Limit: ${formatCurrency(b.limitAmount)}`, path: `/budgets/edit/${b.id}`, icon: 'fa-wallet' }));
      results["Financial Goals"] = financialGoals.filter(g => g.name.toLowerCase().includes(lowerQuery) || (g.notes && g.notes.toLowerCase().includes(lowerQuery))).map(g => ({ id: g.id, type: 'Financial Goal', name: g.name, description: `Target: ${formatCurrency(g.targetAmount)}, Saved: ${formatCurrency(g.currentAmount)}`, path: `/goals/edit/${g.id}`, icon: 'fa-bullseye' }));
      results["Bank Accounts"] = bankAccounts.filter(ba => ba.accountName.toLowerCase().includes(lowerQuery) || ba.bankName.toLowerCase().includes(lowerQuery)).map(ba => ({ id: ba.id, type: 'Bank Account', name: ba.accountName, description: `${ba.bankName} - Bal: ${formatCurrency(ba.currentBalance)}`, path: `/bank-accounts/edit/${ba.id}`, icon: 'fa-university'}));
      results["Credit Cards"] = creditCards.filter(cc => cc.name.toLowerCase().includes(lowerQuery) || cc.bankName.toLowerCase().includes(lowerQuery)).map(cc => ({ id: cc.id, type: 'Credit Card', name: cc.name, description: `${cc.bankName} - Avail: ${formatCurrency(cc.availableBalance)}`, path: `/credit-cards/edit/${cc.id}`, icon: 'fa-credit-card'}));
      setSearchResults(results); setIsSearchModalOpen(true);
  }, [transactions, categories, budgets, financialGoals, bankAccounts, creditCards, getCategoryName, formatCurrency]);

  const closeSearchModal = useCallback(() => setIsSearchModalOpen(false), []);
  const openReceiptScannerModal = useCallback(() => setIsReceiptScannerModalOpen(true), []);
  const openDashboardCustomizationModal = useCallback(() => setIsDashboardCustomizationModalOpen(true), []);
  const updateDashboardWidgetSettings = useCallback((widgets: DashboardWidgetConfigItem[]) => { setUserSettings(prev => ({...prev, dashboardWidgets: widgets })); notifySuccess("Dashboard layout updated!"); }, [setUserSettings, notifySuccess]);

  const appContextValue: AppContextType = {
    categories, addCategory, updateCategory, deleteCategory, getCategoryName, getCategoryById,
    transactions, addTransaction, updateTransaction, deleteTransaction,
    budgets, addBudget, updateBudget, deleteBudget,
    selectedCurrency, setSelectedCurrency, formatCurrency, formatAccountingNumber,
    receivables, addReceivable, updateReceivable, deleteReceivable, addReceivablePayment, getReceivableById,
    payables, addPayable, updatePayable, deletePayable, addPayablePayment, getPayableById,
    creditCards, addCreditCard, updateCreditCard, deleteCreditCard, getCreditCardById, recordCreditCardPayment,
    bankAccounts, addBankAccount, updateBankAccount, deleteBankAccount, getBankAccountById, transferCashToBank, performInterBankTransfer,
    longTermLiabilities, addLongTermLiability, updateLongTermLiability, deleteLongTermLiability, addLongTermLiabilityPayment, getLongTermLiabilityById,
    shortTermLiabilities, addShortTermLiability, updateShortTermLiability, deleteShortTermLiability, addShortTermLiabilityPayment, getShortTermLiabilityById,
    nonCurrentAssets, addNonCurrentAsset, updateNonCurrentAsset, deleteNonCurrentAsset, getNonCurrentAssetById,
    financialGoals, addFinancialGoal, updateFinancialGoal, deleteFinancialGoal, addGoalContribution, getFinancialGoalById,
    recurringTransactions, addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction, getRecurringTransactionById, processRecurringTransactions,
    netWorthHistory, recordNetWorthSnapshot, calculateNetWorth,
    exportTransactionsToCSV, getTaxSummaryData, userSettings, updateUserSettings, calculateCashFlowProjection, exportAllDataToJson, importAllDataFromJson,
    cashBalance, isLoading,
    searchQuery, setSearchQuery, searchResults, isSearchModalOpen, performSearch, closeSearchModal,
    notifySuccess, notifyError, notifyWarning, notifyInfo,
    openReceiptScannerModal,
    openDashboardCustomizationModal, updateDashboardWidgetSettings,
  };

  return (
    <AppContext.Provider value={appContextValue}>
      <ReactRouterDOM.HashRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-3 sm:p-6">
            <ReactRouterDOM.Routes>
              <ReactRouterDOM.Route path="/" element={<DashboardScreen />} />
              <ReactRouterDOM.Route path="/transactions" element={<TransactionsListScreen />} />
              <ReactRouterDOM.Route path="/transactions/new" element={<TransactionFormScreen />} />
              <ReactRouterDOM.Route path="/transactions/edit/:id" element={<TransactionFormScreen />} />
              <ReactRouterDOM.Route path="/budgets" element={<BudgetsScreen />} />
              <ReactRouterDOM.Route path="/budgets/new" element={<BudgetFormScreen />} />
              <ReactRouterDOM.Route path="/budgets/edit/:id" element={<BudgetFormScreen />} />
              <ReactRouterDOM.Route path="/categories" element={<CategoriesScreen />} />
              <ReactRouterDOM.Route path="/receivables" element={<ReceivablesScreen />} />
              <ReactRouterDOM.Route path="/receivables/new" element={<ReceivableFormScreen />} />
              <ReactRouterDOM.Route path="/receivables/edit/:id" element={<ReceivableFormScreen />} />
              <ReactRouterDOM.Route path="/payables" element={<PayablesScreen />} />
              <ReactRouterDOM.Route path="/payables/new" element={<PayableFormScreen />} />
              <ReactRouterDOM.Route path="/payables/edit/:id" element={<PayableFormScreen />} />
              <ReactRouterDOM.Route path="/credit-cards" element={<CreditCardsScreen />} />
              <ReactRouterDOM.Route path="/credit-cards/new" element={<CreditCardFormScreen />} />
              <ReactRouterDOM.Route path="/credit-cards/edit/:id" element={<CreditCardFormScreen />} />
              <ReactRouterDOM.Route path="/bank-accounts" element={<BankAccountsScreen />} />
              <ReactRouterDOM.Route path="/bank-accounts/new" element={<BankAccountFormScreen />} />
              <ReactRouterDOM.Route path="/bank-accounts/edit/:id" element={<BankAccountFormScreen />} />
              <ReactRouterDOM.Route path="/liabilities" element={<LiabilitiesScreen />} />
              <ReactRouterDOM.Route path="/liabilities/long-term/new" element={<LongTermLiabilityFormScreen />} />
              <ReactRouterDOM.Route path="/liabilities/long-term/edit/:id" element={<LongTermLiabilityFormScreen />} />
              <ReactRouterDOM.Route path="/liabilities/short-term/new" element={<ShortTermLiabilityFormScreen />} />
              <ReactRouterDOM.Route path="/liabilities/short-term/edit/:id" element={<ShortTermLiabilityFormScreen />} />
              <ReactRouterDOM.Route path="/assets" element={<NonCurrentAssetsScreen />} />
              <ReactRouterDOM.Route path="/assets/new" element={<NonCurrentAssetFormScreen />} />
              <ReactRouterDOM.Route path="/assets/edit/:id" element={<NonCurrentAssetFormScreen />} />
              <ReactRouterDOM.Route path="/goals" element={<GoalsScreen />} />
              <ReactRouterDOM.Route path="/goals/new" element={<GoalFormScreen />} />
              <ReactRouterDOM.Route path="/goals/edit/:id" element={<GoalFormScreen />} />
              <ReactRouterDOM.Route path="/recurring" element={<RecurringTransactionsScreen />} />
              <ReactRouterDOM.Route path="/recurring/new" element={<RecurringTransactionFormScreen />} />
              <ReactRouterDOM.Route path="/recurring/edit/:id" element={<RecurringTransactionFormScreen />} />
              <ReactRouterDOM.Route path="/net-worth" element={<NetWorthReportScreen />} />
              <ReactRouterDOM.Route path="/reports" element={<ReportsScreen />} />
              {/* Add other routes here */}
            </ReactRouterDOM.Routes>
          </main>
          <ToastContainer />
          {isSearchModalOpen && <GlobalSearchModal />}
          {isReceiptScannerModalOpen && <ReceiptScannerModal isOpen={isReceiptScannerModalOpen} onClose={() => setIsReceiptScannerModalOpen(false)} />}
          {isDashboardCustomizationModalOpen && <DashboardCustomizationModal isOpen={isDashboardCustomizationModalOpen} onClose={() => setIsDashboardCustomizationModalOpen(false)}/>}

        </div>
      </ReactRouterDOM.HashRouter>
    </AppContext.Provider>
  );
};

export default App;
