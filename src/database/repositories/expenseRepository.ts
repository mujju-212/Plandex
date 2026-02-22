import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { CreateExpenseInput, Expense, ExpenseCategory, ExpenseFilter, ExpenseSummary, UpdateExpenseInput } from '../../types/expense.types';
import { getDB } from '../database';

const EXPENSE_KEY = 'expenses';
const CATEGORY_KEY = 'expense_categories';

const getWebExpenses = async (): Promise<Expense[]> => { const r = await AsyncStorage.getItem(EXPENSE_KEY); return r ? JSON.parse(r) : []; };
const saveWebExpenses = async (e: Expense[]) => AsyncStorage.setItem(EXPENSE_KEY, JSON.stringify(e));
const getWebCategories = async (): Promise<ExpenseCategory[]> => { const r = await AsyncStorage.getItem(CATEGORY_KEY); return r ? JSON.parse(r) : []; };
const saveWebCategories = async (c: ExpenseCategory[]) => AsyncStorage.setItem(CATEGORY_KEY, JSON.stringify(c));

const mapExpenseRow = (row: any): Expense => ({
  ...row,
  is_recurring: !!row.is_recurring,
  tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
});
const mapCatRow = (row: any): ExpenseCategory => ({ ...row, is_default: !!row.is_default });

class ExpenseRepository {
  // ── Categories ──
  async getCategories(): Promise<ExpenseCategory[]> {
    if (Platform.OS === 'web') return getWebCategories();
    const db = getDB();
    const rows = await db.getAllAsync('SELECT * FROM expense_categories ORDER BY name');
    return rows.map(mapCatRow);
  }

  async addCategory(name: string, icon: string, color: string, budgetLimit?: number): Promise<ExpenseCategory> {
    if (Platform.OS === 'web') {
      const cats = await getWebCategories();
      const cat: ExpenseCategory = { id: Date.now(), name, icon, color, budget_limit: budgetLimit || null, is_default: false, created_at: new Date().toISOString() };
      await saveWebCategories([...cats, cat]);
      return cat;
    }
    const db = getDB();
    const r = await db.runAsync('INSERT INTO expense_categories (name, icon, color, budget_limit) VALUES (?, ?, ?, ?)', [name, icon, color, budgetLimit || null]);
    const row = await db.getFirstAsync('SELECT * FROM expense_categories WHERE id = ?', [r.lastInsertRowId]);
    return mapCatRow(row);
  }

  // ── Expenses ──
  async insert(input: CreateExpenseInput): Promise<Expense> {
    if (Platform.OS === 'web') {
      const all = await getWebExpenses();
      const e: Expense = {
        id: Date.now(), category_id: input.category_id || null, title: input.title, amount: input.amount,
        expense_type: input.expense_type || 'expense', date: input.date, notes: input.notes || null,
        payment_method: input.payment_method || 'cash', is_recurring: input.is_recurring || false,
        tags: input.tags || [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      await saveWebExpenses([e, ...all]);
      return e;
    }
    const db = getDB();
    const r = await db.runAsync(
      'INSERT INTO expenses (category_id, title, amount, expense_type, date, notes, payment_method, is_recurring, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [input.category_id || null, input.title, input.amount, input.expense_type || 'expense', input.date, input.notes || null, input.payment_method || 'cash', input.is_recurring ? 1 : 0, JSON.stringify(input.tags || [])]
    );
    return (await this.findById(r.lastInsertRowId))!;
  }

  async findAll(filter?: ExpenseFilter): Promise<Expense[]> {
    if (Platform.OS === 'web') {
      let exps = await getWebExpenses();
      if (filter?.startDate) exps = exps.filter(e => e.date >= filter.startDate!);
      if (filter?.endDate) exps = exps.filter(e => e.date <= filter.endDate!);
      if (filter?.category_id) exps = exps.filter(e => e.category_id === filter.category_id);
      if (filter?.expense_type) exps = exps.filter(e => e.expense_type === filter.expense_type);
      return exps.sort((a, b) => b.date.localeCompare(a.date));
    }
    const db = getDB();
    let sql = `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
               FROM expenses e LEFT JOIN expense_categories c ON e.category_id = c.id`;
    const conditions: string[] = [];
    const params: any[] = [];
    if (filter?.startDate) { conditions.push('e.date >= ?'); params.push(filter.startDate); }
    if (filter?.endDate) { conditions.push('e.date <= ?'); params.push(filter.endDate); }
    if (filter?.category_id) { conditions.push('e.category_id = ?'); params.push(filter.category_id); }
    if (filter?.expense_type) { conditions.push('e.expense_type = ?'); params.push(filter.expense_type); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY e.date DESC, e.created_at DESC LIMIT 500';
    const rows = await db.getAllAsync(sql, params);
    return rows.map(mapExpenseRow);
  }

  async findById(id: number): Promise<Expense | null> {
    if (Platform.OS === 'web') { const all = await getWebExpenses(); return all.find(e => e.id === id) || null; }
    const db = getDB();
    const row = await db.getFirstAsync(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e LEFT JOIN expense_categories c ON e.category_id = c.id WHERE e.id = ?`, [id]
    );
    return row ? mapExpenseRow(row) : null;
  }

  async update(id: number, input: UpdateExpenseInput): Promise<Expense> {
    if (Platform.OS === 'web') {
      const all = await getWebExpenses();
      const idx = all.findIndex(e => e.id === id);
      if (idx === -1) throw new Error('Expense not found');
      all[idx] = { ...all[idx], ...input, updated_at: new Date().toISOString() } as Expense;
      await saveWebExpenses(all);
      return all[idx];
    }
    const db = getDB();
    const sets: string[] = [];
    const params: any[] = [];
    if (input.category_id !== undefined) { sets.push('category_id = ?'); params.push(input.category_id); }
    if (input.title !== undefined) { sets.push('title = ?'); params.push(input.title); }
    if (input.amount !== undefined) { sets.push('amount = ?'); params.push(input.amount); }
    if (input.expense_type !== undefined) { sets.push('expense_type = ?'); params.push(input.expense_type); }
    if (input.date !== undefined) { sets.push('date = ?'); params.push(input.date); }
    if (input.notes !== undefined) { sets.push('notes = ?'); params.push(input.notes); }
    if (input.payment_method !== undefined) { sets.push('payment_method = ?'); params.push(input.payment_method); }
    if (input.tags !== undefined) { sets.push('tags = ?'); params.push(JSON.stringify(input.tags)); }
    sets.push('updated_at = CURRENT_TIMESTAMP');
    await db.runAsync(`UPDATE expenses SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    return (await this.findById(id))!;
  }

  async delete(id: number): Promise<void> {
    if (Platform.OS === 'web') { const all = await getWebExpenses(); await saveWebExpenses(all.filter(e => e.id !== id)); return; }
    const db = getDB();
    await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
  }

  async getSummary(startDate: string, endDate: string): Promise<ExpenseSummary> {
    const all = await this.findAll({ startDate, endDate });
    const categories = await this.getCategories();
    const catLookup = new Map(categories.map(c => [c.id, c]));

    const totalExpense = all.filter(e => e.expense_type === 'expense').reduce((s, e) => s + e.amount, 0);
    const totalIncome = all.filter(e => e.expense_type === 'income').reduce((s, e) => s + e.amount, 0);
    const catMap = new Map<string, { color: string; icon: string; total: number }>();
    all.filter(e => e.expense_type === 'expense').forEach(e => {
      const cat = e.category_id ? catLookup.get(e.category_id) : undefined;
      const key = (e as any).category_name || cat?.name || 'Other';
      const color = (e as any).category_color || cat?.color || '#78909C';
      const icon = (e as any).category_icon || cat?.icon || 'more-horiz';
      const prev = catMap.get(key) || { color, icon, total: 0 };
      prev.total += e.amount;
      catMap.set(key, prev);
    });
    const byCategory = Array.from(catMap.entries()).map(([category, v]) => ({
      category, ...v, percentage: totalExpense > 0 ? (v.total / totalExpense) * 100 : 0,
    })).sort((a, b) => b.total - a.total);
    return { totalExpense, totalIncome, balance: totalIncome - totalExpense, byCategory };
  }
}

export const expenseRepository = new ExpenseRepository();
