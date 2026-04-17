import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useExpenseStore } from '../../src/stores/useExpenseStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { typography } from '../../src/theme/typography';
import { ExpenseType, PaymentMethod } from '../../src/types/expense.types';

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'cash', label: 'Cash', icon: 'payments' },
  { key: 'card', label: 'Card', icon: 'credit-card' },
  { key: 'upi', label: 'UPI', icon: 'qr-code' },
  { key: 'bank_transfer', label: 'Bank', icon: 'account-balance' },
  { key: 'other', label: 'Other', icon: 'more-horiz' },
];

const MONTHLY_BUDGETS_KEY = 'expense_monthly_budgets';
const CATEGORY_TYPE_PREFS_KEY = 'expense_category_type_prefs';
type CategoryScope = ExpenseType | 'both';

const CATEGORY_ICON_CHOICES = [
  'category',
  'shopping-bag',
  'restaurant',
  'directions-car',
  'home',
  'favorite',
  'movie',
  'school',
  'work',
  'attach-money',
  'payments',
  'savings',
  'sports-esports',
  'pets',
  'local-hospital',
  'travel-explore',
  'receipt-long',
  'card-giftcard',
];

const CATEGORY_COLOR_CHOICES = [
  '#4CAF50',
  '#FF7043',
  '#42A5F5',
  '#AB47BC',
  '#26A69A',
  '#FFA726',
  '#EF5350',
  '#5C6BC0',
  '#78909C',
  '#F9A825',
  '#EC407A',
  '#66BB6A',
];

const LEGACY_AUTO_INCOME_CATEGORY_NAMES = new Set([
  'salary',
  'freelance',
  'business',
  'investment',
  'bonus',
  'gift',
  'refund',
  'other income',
]);

const parseIsoDateString = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

  const [year, month, day] = trimmed.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const csvEscape = (value: string | number | null | undefined) => {
  const safe = `${value ?? ''}`.replace(/"/g, '""');
  return `"${safe}"`;
};

export default function ExpensesScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const {
    expenses, categories, summary,
    loadExpenses, loadCategories, loadSummary, getSummaryForRange,
    addExpense, deleteExpense, addCategory,
  } = useExpenseStore();

  const [activeTab, setActiveTab] = useState<'list' | 'summary'>('list');
  const [showModal, setShowModal] = useState(false);
  const [expenseType, setExpenseType] = useState<ExpenseType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [transactionDateInput, setTransactionDateInput] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showTransactionDatePicker, setShowTransactionDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterExpenseType, setFilterExpenseType] = useState<'all' | ExpenseType>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'all' | PaymentMethod>('all');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [monthlyBudgets, setMonthlyBudgets] = useState<Record<string, number>>({});
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState('');
  const [previousSummary, setPreviousSummary] = useState<typeof summary>(null);
  const [categoryTypePrefs, setCategoryTypePrefs] = useState<Record<string, CategoryScope>>({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('category');
  const [newCategoryColor, setNewCategoryColor] = useState('#4CAF50');
  const [newCategoryType, setNewCategoryType] = useState<CategoryScope>('expense');

  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthLabel = format(currentMonth, 'MMMM yyyy');
  const monthKey = format(currentMonth, 'yyyy-MM');
  const isCurrentMonth = format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');
  const previousMonthLabel = format(subMonths(currentMonth, 1), 'MMMM yyyy');

  const activeBudget = monthlyBudgets[monthKey] ?? 0;
  const budgetProgress = activeBudget > 0 ? Math.min(((summary?.totalExpense || 0) / activeBudget) * 100, 100) : 0;
  const remainingBudget = activeBudget > 0 ? activeBudget - (summary?.totalExpense || 0) : null;

  const categoryUsageById = useMemo(() => {
    const usage = new Map<number, { hasIncome: boolean; hasExpense: boolean; count: number }>();

    expenses.forEach((exp) => {
      if (exp.category_id == null) return;

      const existing = usage.get(exp.category_id) ?? { hasIncome: false, hasExpense: false, count: 0 };

      if (exp.expense_type === 'income') {
        existing.hasIncome = true;
      } else {
        existing.hasExpense = true;
      }

      existing.count += 1;
      usage.set(exp.category_id, existing);
    });

    return usage;
  }, [expenses]);

  const categoryTypeById = useMemo(() => {
    const map = new Map<number, CategoryScope>();

    categories.forEach((cat) => {
      const preferredType = categoryTypePrefs[String(cat.id)];
      const usage = categoryUsageById.get(cat.id);
      const hasIncomeTx = Boolean(usage?.hasIncome);
      const hasExpenseTx = Boolean(usage?.hasExpense);

      if (hasIncomeTx && hasExpenseTx) {
        map.set(cat.id, 'both');
      } else if (preferredType) {
        map.set(cat.id, preferredType);
      } else if (hasIncomeTx) {
        map.set(cat.id, 'income');
      } else if (hasExpenseTx) {
        map.set(cat.id, 'expense');
      } else {
        map.set(cat.id, cat.is_default ? 'expense' : 'both');
      }
    });

    return map;
  }, [categories, categoryTypePrefs, categoryUsageById]);

  const categoriesByType = useMemo(() => {
    const expenseCategories = categories.filter(cat => {
      const t = categoryTypeById.get(cat.id);
      return t === 'expense' || t === 'both';
    });
    const incomeCategories = categories.filter(cat => {
      const t = categoryTypeById.get(cat.id);
      return t === 'income' || t === 'both';
    });

    return {
      expense: expenseCategories,
      income: incomeCategories,
    };
  }, [categories, categoryTypeById]);

  const formCategories = useMemo(() => {
    const sorted = [...categoriesByType[expenseType]].filter((cat) => {
      const isLegacyAutoIncome = cat.is_default && LEGACY_AUTO_INCOME_CATEGORY_NAMES.has(cat.name.trim().toLowerCase());
      if (!isLegacyAutoIncome) return true;

      const hasTransactions = (categoryUsageById.get(cat.id)?.count ?? 0) > 0;
      const hasPreference = Boolean(categoryTypePrefs[String(cat.id)]);
      return hasTransactions || hasPreference;
    });

    sorted.sort((a, b) => {
      const defaultOrder = Number(a.is_default) - Number(b.is_default);
      if (defaultOrder !== 0) return defaultOrder;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [categoriesByType, categoryTypePrefs, categoryUsageById, expenseType]);
  const categoriesWithTransactions = useMemo(
    () => categories.filter(cat => (categoryUsageById.get(cat.id)?.count ?? 0) > 0),
    [categories, categoryUsageById],
  );
  const selectedCategoryType = categoryId ? categoryTypeById.get(categoryId) || 'both' : null;

  const listFilterCategories = useMemo(() => {
    const base = categoriesWithTransactions.length > 0 ? categoriesWithTransactions : categories;

    if (filterExpenseType === 'all') return base;

    return base.filter((cat) => {
      const t = categoryTypeById.get(cat.id);
      return t === 'both' || t === filterExpenseType;
    });
  }, [categories, categoriesWithTransactions, categoryTypeById, filterExpenseType]);

  useEffect(() => {
    let active = true;

    const loadCategoryTypePreferences = async () => {
      try {
        const raw = await AsyncStorage.getItem(CATEGORY_TYPE_PREFS_KEY);
        if (!raw || !active) return;
        const parsed = JSON.parse(raw) as Record<string, CategoryScope>;
        if (parsed && typeof parsed === 'object') {
          setCategoryTypePrefs(parsed);
        }
      } catch { }
    };

    loadCategoryTypePreferences();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setNewCategoryType((current) => (current === 'both' ? current : expenseType));
  }, [expenseType]);

  useEffect(() => {
    let active = true;

    const loadBudgetMap = async () => {
      try {
        const raw = await AsyncStorage.getItem(MONTHLY_BUDGETS_KEY);
        if (!raw || !active) return;
        const parsed = JSON.parse(raw) as Record<string, number>;
        if (parsed && typeof parsed === 'object') {
          setMonthlyBudgets(parsed);
        }
      } catch { }
    };

    loadBudgetMap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setMonthlyBudgetInput(activeBudget > 0 ? String(activeBudget) : '');
  }, [activeBudget, monthKey]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    let active = true;

    const loadMonthData = async () => {
      await loadExpenses({ startDate: monthStart, endDate: monthEnd });
      await loadSummary(monthStart, monthEnd);

      const previousMonth = subMonths(currentMonth, 1);
      const previousStart = format(startOfMonth(previousMonth), 'yyyy-MM-dd');
      const previousEnd = format(endOfMonth(previousMonth), 'yyyy-MM-dd');
      const previous = await getSummaryForRange(previousStart, previousEnd);

      if (active) {
        setPreviousSummary(previous);
      }
    };

    loadMonthData();
    setFilterCategory(null);

    return () => {
      active = false;
    };
  }, [currentMonth, getSummaryForRange, loadExpenses, loadSummary, monthEnd, monthStart]);

  useEffect(() => {
    if (!categoryId) return;
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    if (!selectedCategory) return;
    const selectedType = categoryTypeById.get(selectedCategory.id);
    if (selectedType && selectedType !== 'both' && selectedType !== expenseType) {
      setCategoryId(null);
    }
  }, [categoryId, categories, categoryTypeById, expenseType]);

  const filteredExpenses = useMemo(() => {
    const minAmount = Number.parseFloat(filterMinAmount);
    const maxAmount = Number.parseFloat(filterMaxAmount);
    const hasMinAmount = Number.isFinite(minAmount);
    const hasMaxAmount = Number.isFinite(maxAmount);

    return expenses.filter((exp) => {
      if (filterCategory && exp.category_id !== filterCategory) return false;
      if (filterExpenseType !== 'all' && exp.expense_type !== filterExpenseType) return false;
      if (filterPaymentMethod !== 'all' && exp.payment_method !== filterPaymentMethod) return false;

      if (hasMinAmount && exp.amount < minAmount) return false;
      if (hasMaxAmount && exp.amount > maxAmount) return false;

      if (filterFromDate.trim() && exp.date < filterFromDate.trim()) return false;
      if (filterToDate.trim() && exp.date > filterToDate.trim()) return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      return (
        exp.title.toLowerCase().includes(q) ||
        (exp.notes || '').toLowerCase().includes(q) ||
        (exp.category_name || '').toLowerCase().includes(q) ||
        exp.payment_method.toLowerCase().includes(q) ||
        String(exp.amount).includes(q)
      );
    });
  }, [
    expenses,
    filterCategory,
    filterExpenseType,
    filterFromDate,
    filterMaxAmount,
    filterMinAmount,
    filterPaymentMethod,
    filterToDate,
    searchQuery,
  ]);

  const resetForm = () => {
    const now = new Date();
    setAmount('');
    setDescription('');
    setCategoryId(null);
    setPaymentMethod('cash');
    setExpenseType('expense');
    setTransactionDate(now);
    setTransactionDateInput(format(now, 'yyyy-MM-dd'));
    setShowTransactionDatePicker(false);
  };

  const handleTransactionDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTransactionDatePicker(false);
    }
    if (!selectedDate) return;
    setTransactionDate(selectedDate);
    setTransactionDateInput(format(selectedDate, 'yyyy-MM-dd'));
  };

  const handleSaveBudget = async () => {
    const trimmed = monthlyBudgetInput.trim();
    const parsed = Number.parseFloat(trimmed);
    const nextMap = { ...monthlyBudgets };

    if (!trimmed) {
      delete nextMap[monthKey];
      setMonthlyBudgets(nextMap);
      await AsyncStorage.setItem(MONTHLY_BUDGETS_KEY, JSON.stringify(nextMap));
      return;
    }

    if (!Number.isFinite(parsed) || parsed < 0) {
      const msg = 'Enter a valid monthly budget amount';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid Budget', msg);
      return;
    }

    nextMap[monthKey] = parsed;
    setMonthlyBudgets(nextMap);
    await AsyncStorage.setItem(MONTHLY_BUDGETS_KEY, JSON.stringify(nextMap));
  };

  const clearAdvancedFilters = () => {
    setFilterExpenseType('all');
    setFilterPaymentMethod('all');
    setFilterMinAmount('');
    setFilterMaxAmount('');
    setFilterFromDate('');
    setFilterToDate('');
  };

  const handleExportTransactions = async () => {
    if (filteredExpenses.length === 0) {
      const msg = 'No transactions to export for current filters';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Export', msg);
      return;
    }

    const csv = [
      ['Date', 'Type', 'Title', 'Category', 'Payment Method', 'Amount', 'Notes'].map(csvEscape).join(','),
      ...filteredExpenses.map(exp => [
        csvEscape(exp.date),
        csvEscape(exp.expense_type),
        csvEscape(exp.title),
        csvEscape(exp.category_name || 'Uncategorized'),
        csvEscape(exp.payment_method),
        csvEscape(exp.amount),
        csvEscape(exp.notes || ''),
      ].join(',')),
    ].join('\n');

    const filename = `expenses-${monthKey}.csv`;

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Expenses',
      });
      return;
    }

    Alert.alert('Exported', `Saved to ${fileUri}`);
  };

  const persistCategoryTypePrefs = async (nextPrefs: Record<string, CategoryScope>) => {
    setCategoryTypePrefs(nextPrefs);
    await AsyncStorage.setItem(CATEGORY_TYPE_PREFS_KEY, JSON.stringify(nextPrefs));
  };

  const setCategoryTypePreference = async (targetCategoryId: number, targetType: CategoryScope) => {
    const nextPrefs = { ...categoryTypePrefs };
    const key = String(targetCategoryId);

    if (targetType === 'both') {
      delete nextPrefs[key];
    } else {
      nextPrefs[key] = targetType;
    }

    await persistCategoryTypePrefs(nextPrefs);
  };

  const handleAddCustomCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      const msg = 'Enter a category label';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Category', msg);
      return;
    }

    const exists = categories.some((cat) => cat.name.trim().toLowerCase() === name.toLowerCase());
    if (exists) {
      const msg = 'A category with this label already exists';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Category', msg);
      return;
    }

    try {
      const createdCategory = await addCategory(name, newCategoryIcon, newCategoryColor);
      const nextPrefs = { ...categoryTypePrefs };
      const prefKey = String(createdCategory.id);

      if (newCategoryType === 'both') {
        delete nextPrefs[prefKey];
      } else {
        nextPrefs[prefKey] = newCategoryType;
      }

      await persistCategoryTypePrefs(nextPrefs);
      await loadCategories();

      setCategoryId(createdCategory.id);
      setNewCategoryName('');
      setNewCategoryType(expenseType);
    } catch {
      const msg = 'Failed to add category';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Category', msg);
    }
  };

  const handleSave = async () => {
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      const msg = 'Please enter a valid amount';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid', msg);
      return;
    }

    const parsedDate = parseIsoDateString(transactionDateInput);
    if (!parsedDate) {
      const msg = 'Please enter a valid date in YYYY-MM-DD format';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid Date', msg);
      return;
    }

    try {
      await addExpense({
        amount: amtNum,
        title: description.trim() || 'Transaction',
        notes: description.trim() || undefined,
        category_id: categoryId || undefined,
        expense_type: expenseType,
        payment_method: paymentMethod,
        date: format(parsedDate, 'yyyy-MM-dd'),
      });
      setShowModal(false);
      resetForm();
      await loadExpenses({ startDate: monthStart, endDate: monthEnd });
      await loadSummary(monthStart, monthEnd);
    } catch { }
  };

  const handleDelete = (id: number) => {
    const doDelete = async () => {
      await deleteExpense(id);
      await loadExpenses({ startDate: monthStart, endDate: monthEnd });
      await loadSummary(monthStart, monthEnd);
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this entry?')) doDelete();
    } else {
      Alert.alert('Delete', 'Remove this entry?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const comparisonData = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: 'Expense',
        current: summary.totalExpense,
        previous: previousSummary?.totalExpense || 0,
        color: tc.danger,
      },
      {
        label: 'Income',
        current: summary.totalIncome,
        previous: previousSummary?.totalIncome || 0,
        color: tc.success,
      },
      {
        label: 'Saving',
        current: summary.balance,
        previous: previousSummary?.balance || 0,
        color: tc.primary,
      },
    ];
  }, [previousSummary, summary, tc.danger, tc.primary, tc.success]);

  const comparisonMax = useMemo(() => {
    const maxValue = Math.max(...comparisonData.flatMap(item => [Math.abs(item.current), Math.abs(item.previous)]), 1);
    return maxValue;
  }, [comparisonData]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterExpenseType !== 'all') count += 1;
    if (filterPaymentMethod !== 'all') count += 1;
    if (filterMinAmount.trim()) count += 1;
    if (filterMaxAmount.trim()) count += 1;
    if (filterFromDate.trim()) count += 1;
    if (filterToDate.trim()) count += 1;
    return count;
  }, [filterExpenseType, filterFromDate, filterMaxAmount, filterMinAmount, filterPaymentMethod, filterToDate]);

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Expenses</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={[styles.headerActionBtn, { backgroundColor: tc.cardBackground, borderColor: tc.border }]}
          >
            <MaterialIcons name="filter-list" size={18} color={tc.textPrimary} />
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: tc.primary }]}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExportTransactions}
            style={[styles.headerActionBtn, { backgroundColor: tc.cardBackground, borderColor: tc.border }]}
          >
            <MaterialIcons name="ios-share" size={18} color={tc.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowModal(true)} style={[styles.addBtn, { backgroundColor: tc.primary }]}>
            <MaterialIcons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.monthNavigator, { backgroundColor: tc.cardBackground }]}>
          <TouchableOpacity style={styles.monthNavBtn} onPress={() => setCurrentMonth(prev => subMonths(prev, 1))}>
            <MaterialIcons name="chevron-left" size={22} color={tc.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: tc.textPrimary }]}>{monthLabel}</Text>
          <TouchableOpacity
            style={[styles.monthNavBtn, isCurrentMonth && { opacity: 0.4 }]}
            onPress={() => setCurrentMonth(prev => addMonths(prev, 1))}
            disabled={isCurrentMonth}
          >
            <MaterialIcons name="chevron-right" size={22} color={tc.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: tc.cardBackground, borderColor: tc.border }]}>
          <MaterialIcons name="search" size={18} color={tc.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: tc.textPrimary }]}
            placeholder="Search transactions"
            placeholderTextColor={tc.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={tc.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Summary Card */}
        {summary && (
          <LinearGradient
            colors={[tc.gradientStart, tc.gradientEnd] as any}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.summaryLabel}>{monthLabel}</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryAmount}>{formatCurrency(summary.totalExpense)}</Text>
                <Text style={styles.summarySubLabel}>Spent</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
              <View style={styles.summaryBlock}>
                <Text style={styles.summaryAmount}>{formatCurrency(summary.totalIncome)}</Text>
                <Text style={styles.summarySubLabel}>Income</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
              <View style={styles.summaryBlock}>
                <Text style={[styles.summaryAmount, { color: summary.balance >= 0 ? '#4ADE80' : '#FF6B6B' }]}> 
                  {formatCurrency(Math.abs(summary.balance))}
                </Text>
                <Text style={styles.summarySubLabel}>{summary.balance >= 0 ? 'Saved' : 'Over'}</Text>
              </View>
            </View>
          </LinearGradient>
        )}

        <View style={[styles.budgetCard, { backgroundColor: tc.cardBackground, borderColor: tc.border }]}> 
          <View style={styles.budgetHeaderRow}>
            <Text style={[styles.budgetTitle, { color: tc.textPrimary }]}>Monthly Budget</Text>
            <Text style={[styles.budgetValue, { color: tc.textPrimary }]}> 
              {activeBudget > 0 ? formatCurrency(activeBudget) : 'Not set'}
            </Text>
          </View>
          <View style={styles.budgetInputRow}>
            <TextInput
              style={[styles.budgetInput, { borderColor: tc.border, color: tc.textPrimary, backgroundColor: tc.background }]}
              placeholder="Set budget for this month"
              placeholderTextColor={tc.textSecondary}
              value={monthlyBudgetInput}
              onChangeText={setMonthlyBudgetInput}
              keyboardType="numeric"
            />
            <TouchableOpacity style={[styles.budgetSaveBtn, { backgroundColor: tc.primary }]} onPress={handleSaveBudget}>
              <Text style={styles.budgetSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          {activeBudget > 0 && (
            <>
              <View style={[styles.budgetProgressTrack, { backgroundColor: tc.border }]}>
                <View
                  style={[
                    styles.budgetProgressFill,
                    {
                      width: `${budgetProgress}%`,
                      backgroundColor: remainingBudget !== null && remainingBudget < 0 ? tc.danger : tc.success,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.budgetHint, { color: remainingBudget !== null && remainingBudget < 0 ? tc.danger : tc.textSecondary }]}> 
                {remainingBudget !== null && remainingBudget >= 0
                  ? `${formatCurrency(remainingBudget)} left`
                  : `${formatCurrency(Math.abs(remainingBudget || 0))} over budget`}
              </Text>
            </>
          )}
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: tc.cardBackground }]}>
          {(['list', 'summary'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: tc.primary }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? '#FFF' : tc.textSecondary }]}> 
                {tab === 'list' ? 'Transactions' : 'By Category'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Filter */}
        {activeTab === 'list' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
            <TouchableOpacity
              style={[styles.filterChip, { backgroundColor: tc.cardBackground, borderColor: tc.border }, !filterCategory && { backgroundColor: tc.primary, borderColor: tc.primary }]}
              onPress={() => setFilterCategory(null)}
            >
              <Text style={[styles.filterText, { color: !filterCategory ? '#FFF' : tc.textSecondary }]}>All</Text>
            </TouchableOpacity>
            {listFilterCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterChip, { backgroundColor: tc.cardBackground, borderColor: tc.border }, filterCategory === cat.id && { backgroundColor: cat.color + '30', borderColor: cat.color }]}
                onPress={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
              >
                <View style={styles.filterChipInner}>
                  <MaterialIcons
                    name={(cat.icon || 'category') as any}
                    size={14}
                    color={filterCategory === cat.id ? cat.color : tc.textSecondary}
                  />
                  <Text style={[styles.filterText, { color: filterCategory === cat.id ? cat.color : tc.textSecondary }]}>
                    {cat.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {activeTab === 'list' ? (
          filteredExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={64} color={tc.border} />
              <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No transactions in {monthLabel}</Text>
            </View>
          ) : (
            filteredExpenses.map(exp => (
              <TouchableOpacity
                key={exp.id}
                style={[styles.expenseCard, { backgroundColor: tc.cardBackground }]}
                onPress={() => handleDelete(exp.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.expenseIcon, { backgroundColor: (exp.category_color || tc.primary) + '20' }]}>
                  <MaterialIcons
                    name={(exp.category_icon || 'attach-money') as any}
                    size={20}
                    color={exp.category_color || tc.primary}
                  />
                </View>
                <View style={styles.expenseContent}>
                  <Text style={[styles.expenseDesc, { color: tc.textPrimary }]}>
                    {exp.title || exp.category_name || 'Transaction'}
                  </Text>
                  <Text style={[styles.expenseMeta, { color: tc.textSecondary }]}>
                    {format(new Date(exp.date), 'MMM d')} • {exp.payment_method || 'cash'}
                  </Text>
                </View>
                <Text style={[
                  styles.expenseAmount,
                  { color: exp.expense_type === 'income' ? tc.success : tc.danger },
                ]}>
                  {exp.expense_type === 'income' ? '+' : '-'}{formatCurrency(exp.amount)}
                </Text>
              </TouchableOpacity>
            ))
          )
        ) : (
          <>
            <View style={[styles.comparisonCard, { backgroundColor: tc.cardBackground }]}> 
              <Text style={[styles.comparisonTitle, { color: tc.textPrimary }]}>Monthly Comparison</Text>
              <Text style={[styles.comparisonSubtitle, { color: tc.textSecondary }]}>{monthLabel} vs {previousMonthLabel}</Text>

              {comparisonData.map((item) => {
                const currentWidth = `${(Math.abs(item.current) / comparisonMax) * 100}%`;
                const previousWidth = `${(Math.abs(item.previous) / comparisonMax) * 100}%`;

                return (
                  <View key={item.label} style={styles.comparisonRow}>
                    <View style={styles.comparisonLabelRow}>
                      <Text style={[styles.comparisonMetric, { color: tc.textPrimary }]}>{item.label}</Text>
                      <Text style={[styles.comparisonMetricValue, { color: tc.textSecondary }]}>
                        {formatCurrency(item.current)} / {formatCurrency(item.previous)}
                      </Text>
                    </View>
                    <View style={[styles.comparisonTrack, { backgroundColor: tc.border }]}> 
                      <View style={[styles.comparisonCurrentBar, { width: currentWidth as any, backgroundColor: item.color }]} />
                    </View>
                    <View style={[styles.comparisonTrack, { backgroundColor: tc.border }]}> 
                      <View style={[styles.comparisonPreviousBar, { width: previousWidth as any, borderColor: item.color }]} />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Category Breakdown */}
            {summary?.byCategory && summary.byCategory.length > 0 ? (
              summary.byCategory.map((cat, i) => (
              <View key={i} style={[styles.catCard, { backgroundColor: tc.cardBackground }]}>
                <View style={styles.catHeader}>
                  <MaterialIcons
                    name={(cat.icon || 'category') as any}
                    size={20}
                    color={cat.color || tc.primary}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.catName, { color: tc.textPrimary }]}>{cat.category}</Text>
                    <View style={[styles.progressBar, { backgroundColor: tc.border }]}>
                      <View style={[styles.progressFill, { width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: cat.color || tc.primary }]} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.catAmount, { color: tc.textPrimary }]}>{formatCurrency(cat.total)}</Text>
                    <Text style={[styles.catPercent, { color: tc.textSecondary }]}>{cat.percentage.toFixed(1)}%</Text>
                  </View>
                </View>
              </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="pie-chart" size={64} color={tc.border} />
                <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No data to show</Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView
            style={[styles.modalContent, { backgroundColor: tc.cardBackground }]}
            contentContainerStyle={styles.modalContentScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.textPrimary }]}>Add Transaction</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                <MaterialIcons name="close" size={24} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Type Toggle */}
            <View style={[styles.typeToggle, { backgroundColor: tc.background }]}>
              <TouchableOpacity
                style={[styles.typeBtn, expenseType === 'expense' && { backgroundColor: tc.danger }]}
                onPress={() => {
                  setExpenseType('expense');
                  setCategoryId(null);
                }}
              >
                <Text style={[styles.typeText, { color: expenseType === 'expense' ? '#FFF' : tc.textSecondary }]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, expenseType === 'income' && { backgroundColor: tc.success }]}
                onPress={() => {
                  setExpenseType('income');
                  setCategoryId(null);
                }}
              >
                <Text style={[styles.typeText, { color: expenseType === 'income' ? '#FFF' : tc.textSecondary }]}>Income</Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={[styles.amountRow, { backgroundColor: tc.background, borderColor: tc.border }]}>
              <Text style={[styles.currencySymbol, { color: tc.textSecondary }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: tc.textPrimary }]}
                placeholder="0.00"
                placeholderTextColor={tc.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            {/* Description */}
            <TextInput
              style={[styles.input, { backgroundColor: tc.background, color: tc.textPrimary, borderColor: tc.border }]}
              placeholder="Label / notes (optional)"
              placeholderTextColor={tc.textSecondary}
              value={description}
              onChangeText={setDescription}
            />

            {/* Date */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Date</Text>
            <View style={styles.dateInputRow}>
              <TextInput
                style={[styles.dateInput, { backgroundColor: tc.background, color: tc.textPrimary, borderColor: tc.border }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={tc.textSecondary}
                value={transactionDateInput}
                onChangeText={(value) => {
                  setTransactionDateInput(value);
                  const parsed = parseIsoDateString(value);
                  if (parsed) {
                    setTransactionDate(parsed);
                  }
                }}
              />
              {Platform.OS !== 'web' && (
                <TouchableOpacity
                  style={[styles.datePickerBtn, { borderColor: tc.border, backgroundColor: tc.background }]}
                  onPress={() => setShowTransactionDatePicker(true)}
                >
                  <MaterialIcons name="calendar-month" size={18} color={tc.primary} />
                </TouchableOpacity>
              )}
            </View>

            {Platform.OS !== 'web' && showTransactionDatePicker && (
              <DateTimePicker
                value={transactionDate}
                mode="date"
                display="default"
                onChange={handleTransactionDateChange}
              />
            )}

            {/* Category */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {formCategories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, { borderColor: tc.border }, categoryId === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                  onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                >
                  <MaterialIcons
                    name={(cat.icon || 'category') as any}
                    size={16}
                    color={categoryId === cat.id ? cat.color : tc.textSecondary}
                  />
                  <Text style={[styles.catChipText, { color: categoryId === cat.id ? cat.color : tc.textSecondary }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {formCategories.length === 0 && (
              <Text style={[styles.noCategoryText, { color: tc.textSecondary }]}>No {expenseType} categories available</Text>
            )}

            {categoryId && selectedCategoryType && (
              <>
                <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Selected Category Type</Text>
                <View style={styles.inlineFilterRow}>
                  {(['expense', 'income', 'both'] as CategoryScope[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.inlineFilterChip,
                        { borderColor: tc.border, backgroundColor: tc.background },
                        selectedCategoryType === type && { borderColor: tc.primary, backgroundColor: tc.primary + '20' },
                      ]}
                      onPress={() => {
                        if (!categoryId) return;
                        setCategoryTypePreference(categoryId, type);
                      }}
                    >
                      <Text style={[styles.inlineFilterText, { color: selectedCategoryType === type ? tc.primary : tc.textSecondary }]}>
                        {type === 'both' ? 'Both' : type === 'income' ? 'Income' : 'Expense'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={[styles.createCategoryCard, { backgroundColor: tc.background, borderColor: tc.border }]}> 
              <Text style={[styles.createCategoryTitle, { color: tc.textPrimary }]}>Create Your Category</Text>
              <TextInput
                style={[styles.input, { backgroundColor: tc.cardBackground, color: tc.textPrimary, borderColor: tc.border }]}
                placeholder="Category label"
                placeholderTextColor={tc.textSecondary}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />

              <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Type label</Text>
              <View style={styles.inlineFilterRow}>
                {(['expense', 'income', 'both'] as CategoryScope[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.inlineFilterChip,
                      { borderColor: tc.border, backgroundColor: tc.cardBackground },
                      newCategoryType === type && { borderColor: tc.primary, backgroundColor: tc.primary + '20' },
                    ]}
                    onPress={() => setNewCategoryType(type)}
                  >
                    <Text style={[styles.inlineFilterText, { color: newCategoryType === type ? tc.primary : tc.textSecondary }]}>
                      {type === 'both' ? 'Both' : type === 'income' ? 'Income' : 'Expense'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconChoiceRow}>
                {CATEGORY_ICON_CHOICES.map((iconName) => (
                  <TouchableOpacity
                    key={iconName}
                    style={[
                      styles.iconChoiceChip,
                      { borderColor: tc.border, backgroundColor: tc.cardBackground },
                      newCategoryIcon === iconName && { borderColor: tc.primary, backgroundColor: tc.primary + '20' },
                    ]}
                    onPress={() => setNewCategoryIcon(iconName)}
                  >
                    <MaterialIcons
                      name={iconName as any}
                      size={18}
                      color={newCategoryIcon === iconName ? tc.primary : tc.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Color</Text>
              <View style={styles.colorPaletteRow}>
                {CATEGORY_COLOR_CHOICES.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorDot,
                      { backgroundColor: color, borderColor: newCategoryColor === color ? tc.textPrimary : 'transparent' },
                    ]}
                    onPress={() => setNewCategoryColor(color)}
                  />
                ))}
              </View>

              <TouchableOpacity style={[styles.addCategoryBtn, { backgroundColor: tc.primary }]} onPress={handleAddCustomCategory}>
                <Text style={styles.addCategoryBtnText}>Add Category</Text>
              </TouchableOpacity>
            </View>

            {/* Payment Method */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Payment Method</Text>
            <View style={styles.paymentRow}>
              {PAYMENT_METHODS.map(pm => (
                <TouchableOpacity
                  key={pm.key}
                  style={[styles.paymentBtn, { borderColor: tc.border }, paymentMethod === pm.key && { backgroundColor: tc.primary + '20', borderColor: tc.primary }]}
                  onPress={() => setPaymentMethod(pm.key)}
                >
                  <MaterialIcons name={pm.icon as any} size={18} color={paymentMethod === pm.key ? tc.primary : tc.textSecondary} />
                  <Text style={[styles.paymentText, { color: paymentMethod === pm.key ? tc.primary : tc.textSecondary }]}>{pm.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: tc.primary }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showFilterModal} animationType="fade" transparent>
        <View style={styles.filterOverlay}>
          <View style={[styles.filterModalCard, { backgroundColor: tc.cardBackground }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.textPrimary }]}>Advanced Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialIcons name="close" size={24} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Type</Text>
            <View style={styles.inlineFilterRow}>
              {(['all', 'expense', 'income'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.inlineFilterChip,
                    { borderColor: tc.border, backgroundColor: tc.background },
                    filterExpenseType === type && { borderColor: tc.primary, backgroundColor: tc.primary + '20' },
                  ]}
                  onPress={() => setFilterExpenseType(type)}
                >
                  <Text style={[styles.inlineFilterText, { color: filterExpenseType === type ? tc.primary : tc.textSecondary }]}>
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                style={[
                  styles.inlineFilterChip,
                  { borderColor: tc.border, backgroundColor: tc.background, marginRight: 8 },
                  filterPaymentMethod === 'all' && { borderColor: tc.primary, backgroundColor: tc.primary + '20' },
                ]}
                onPress={() => setFilterPaymentMethod('all')}
              >
                <Text style={[styles.inlineFilterText, { color: filterPaymentMethod === 'all' ? tc.primary : tc.textSecondary }]}>All</Text>
              </TouchableOpacity>
              {PAYMENT_METHODS.map((pm) => (
                <TouchableOpacity
                  key={pm.key}
                  style={[
                    styles.inlineFilterChip,
                    { borderColor: tc.border, backgroundColor: tc.background, marginRight: 8 },
                    filterPaymentMethod === pm.key && { borderColor: tc.primary, backgroundColor: tc.primary + '20' },
                  ]}
                  onPress={() => setFilterPaymentMethod(pm.key)}
                >
                  <Text style={[styles.inlineFilterText, { color: filterPaymentMethod === pm.key ? tc.primary : tc.textSecondary }]}>{pm.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.inlineAmountRow}>
              <View style={styles.inlineAmountField}>
                <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Min Amount</Text>
                <TextInput
                  style={[styles.filterInput, { borderColor: tc.border, color: tc.textPrimary, backgroundColor: tc.background }]}
                  value={filterMinAmount}
                  onChangeText={setFilterMinAmount}
                  placeholder="0"
                  placeholderTextColor={tc.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inlineAmountField}>
                <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Max Amount</Text>
                <TextInput
                  style={[styles.filterInput, { borderColor: tc.border, color: tc.textPrimary, backgroundColor: tc.background }]}
                  value={filterMaxAmount}
                  onChangeText={setFilterMaxAmount}
                  placeholder="Any"
                  placeholderTextColor={tc.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inlineAmountRow}>
              <View style={styles.inlineAmountField}>
                <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>From Date</Text>
                <TextInput
                  style={[styles.filterInput, { borderColor: tc.border, color: tc.textPrimary, backgroundColor: tc.background }]}
                  value={filterFromDate}
                  onChangeText={setFilterFromDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={tc.textSecondary}
                />
              </View>
              <View style={styles.inlineAmountField}>
                <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>To Date</Text>
                <TextInput
                  style={[styles.filterInput, { borderColor: tc.border, color: tc.textPrimary, backgroundColor: tc.background }]}
                  value={filterToDate}
                  onChangeText={setFilterToDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={tc.textSecondary}
                />
              </View>
            </View>

            <View style={styles.filterActionsRow}>
              <TouchableOpacity
                style={[styles.filterActionBtn, { borderColor: tc.border, backgroundColor: tc.background }]}
                onPress={clearAdvancedFilters}
              >
                <Text style={[styles.filterActionText, { color: tc.textSecondary }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterActionBtn, { backgroundColor: tc.primary }]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.filterActionPrimaryText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 30, paddingBottom: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' as any },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold as any,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: typography.sizes.md, paddingVertical: 10 },
  pageScroll: { flex: 1 },
  pageContent: { paddingBottom: 12 },
  summaryCard: { marginHorizontal: 20, borderRadius: 20, padding: 20, marginBottom: 16 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: typography.sizes.sm, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryBlock: { flex: 1, alignItems: 'center' },
  summaryAmount: { color: '#FFF', fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any },
  summarySubLabel: { color: 'rgba(255,255,255,0.7)', fontSize: typography.sizes.xs, marginTop: 2 },
  summaryDivider: { width: 1, height: 30 },
  budgetCard: {
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  budgetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  budgetTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any },
  budgetValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
  budgetInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  budgetInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: typography.sizes.sm,
  },
  budgetSaveBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  budgetSaveText: { color: '#FFF', fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  budgetProgressTrack: { height: 7, borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  budgetProgressFill: { height: '100%', borderRadius: 4 },
  budgetHint: { fontSize: typography.sizes.xs, marginTop: 6 },
  tabBar: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  filterBar: { marginBottom: 8 },
  filterContent: { paddingHorizontal: 20, gap: 8, paddingVertical: 4, alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterChipInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterText: { fontSize: typography.sizes.sm },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  expenseCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10, gap: 12,
  },
  expenseIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  expenseContent: { flex: 1 },
  expenseDesc: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium as any },
  expenseMeta: { fontSize: typography.sizes.xs, marginTop: 2 },
  expenseAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
  comparisonCard: { borderRadius: 14, padding: 14, marginBottom: 12 },
  comparisonTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any },
  comparisonSubtitle: { fontSize: typography.sizes.xs, marginTop: 2, marginBottom: 10 },
  comparisonRow: { marginBottom: 10 },
  comparisonLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  comparisonMetric: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  comparisonMetricValue: { fontSize: typography.sizes.xs },
  comparisonTrack: { height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  comparisonCurrentBar: { height: '100%', borderRadius: 4 },
  comparisonPreviousBar: { height: '100%', borderRadius: 4, borderWidth: 1, backgroundColor: 'transparent' },
  catCard: { padding: 14, borderRadius: 14, marginBottom: 10 },
  catHeader: { flexDirection: 'row', alignItems: 'center' },
  catName: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any },
  catAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
  catPercent: { fontSize: typography.sizes.xs },
  progressBar: { height: 6, borderRadius: 3, marginTop: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { marginTop: 16, fontSize: typography.sizes.md, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalContentScroll: { paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any },
  typeToggle: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  typeText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  amountRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginBottom: 12 },
  currencySymbol: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '700' as any, paddingVertical: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: typography.sizes.md, marginBottom: 12 },
  fieldLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, marginBottom: 8 },
  dateInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.sizes.sm,
  },
  datePickerBtn: {
    borderWidth: 1,
    borderRadius: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8, gap: 6 },
  catChipText: { fontSize: typography.sizes.sm },
  noCategoryText: { fontSize: typography.sizes.sm, marginTop: -8, marginBottom: 12 },
  createCategoryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  createCategoryTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
    marginBottom: 10,
  },
  iconChoiceRow: { marginBottom: 8 },
  iconChoiceChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  addCategoryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
  },
  addCategoryBtnText: {
    color: '#FFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
  },
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  paymentBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 6 },
  paymentText: { fontSize: typography.sizes.sm },
  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  filterModalCard: {
    borderRadius: 16,
    padding: 18,
  },
  inlineFilterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  inlineFilterChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineFilterText: { fontSize: typography.sizes.sm },
  inlineAmountRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  inlineAmountField: { flex: 1 },
  filterInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: typography.sizes.sm,
    marginBottom: 10,
  },
  filterActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  filterActionBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  filterActionText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  filterActionPrimaryText: { color: '#FFF', fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
});
