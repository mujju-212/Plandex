import { create } from 'zustand';
import { expenseRepository } from '../database/repositories/expenseRepository';
import { CreateExpenseInput, Expense, ExpenseCategory, ExpenseFilter, ExpenseSummary, UpdateExpenseInput } from '../types/expense.types';

interface ExpenseState {
  expenses: Expense[];
  categories: ExpenseCategory[];
  summary: ExpenseSummary | null;
  isLoading: boolean;
  error: string | null;
  loadExpenses: (filter?: ExpenseFilter) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadSummary: (startDate: string, endDate: string) => Promise<void>;
  addExpense: (input: CreateExpenseInput) => Promise<Expense>;
  updateExpense: (id: number, input: UpdateExpenseInput) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  addCategory: (name: string, icon: string, color: string, budget?: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  categories: [],
  summary: null,
  isLoading: false,
  error: null,

  loadExpenses: async (filter?) => {
    try {
      set({ isLoading: true, error: null });
      const expenses = await expenseRepository.findAll(filter);
      set({ expenses, isLoading: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  loadCategories: async () => {
    try {
      const categories = await expenseRepository.getCategories();
      set({ categories });
    } catch (e: any) { set({ error: e.message }); }
  },

  loadSummary: async (startDate, endDate) => {
    try {
      const summary = await expenseRepository.getSummary(startDate, endDate);
      set({ summary });
    } catch (e: any) { set({ error: e.message }); }
  },

  addExpense: async (input) => {
    try {
      const expense = await expenseRepository.insert(input);
      set(s => ({ expenses: [expense, ...s.expenses], summary: null }));
      return expense;
    } catch (e: any) { set({ error: e.message }); throw e; }
  },

  updateExpense: async (id, input) => {
    try {
      const updated = await expenseRepository.update(id, input);
      set(s => ({ expenses: s.expenses.map(e => e.id === id ? updated : e), summary: null }));
    } catch (e: any) { set({ error: e.message }); }
  },

  deleteExpense: async (id) => {
    try {
      await expenseRepository.delete(id);
      set(s => ({ expenses: s.expenses.filter(e => e.id !== id), summary: null }));
    } catch (e: any) { set({ error: e.message }); }
  },

  addCategory: async (name, icon, color, budget?) => {
    try {
      const cat = await expenseRepository.addCategory(name, icon, color, budget);
      set(s => ({ categories: [...s.categories, cat] }));
    } catch (e: any) { set({ error: e.message }); }
  },
}));
