export type ExpenseType = 'expense' | 'income';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';

export interface ExpenseCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  budget_limit: number | null;
  is_default: boolean;
  created_at: string;
}

export interface Expense {
  id: number;
  category_id: number | null;
  title: string;
  amount: number;
  expense_type: ExpenseType;
  date: string;
  notes: string | null;
  payment_method: PaymentMethod;
  is_recurring: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface CreateExpenseInput {
  category_id?: number;
  title: string;
  amount: number;
  expense_type?: ExpenseType;
  date: string;
  notes?: string;
  payment_method?: PaymentMethod;
  is_recurring?: boolean;
  tags?: string[];
}

export interface UpdateExpenseInput {
  category_id?: number;
  title?: string;
  amount?: number;
  expense_type?: ExpenseType;
  date?: string;
  notes?: string;
  payment_method?: PaymentMethod;
  tags?: string[];
}

export interface ExpenseFilter {
  startDate?: string;
  endDate?: string;
  category_id?: number;
  expense_type?: ExpenseType;
}

export interface ExpenseSummary {
  totalExpense: number;
  totalIncome: number;
  balance: number;
  byCategory: { category: string; color: string; icon: string; total: number; percentage: number }[];
}
