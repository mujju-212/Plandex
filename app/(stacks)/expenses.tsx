import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function ExpensesScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const {
    expenses, categories, summary,
    loadExpenses, loadCategories, loadSummary,
    addExpense, deleteExpense,
  } = useExpenseStore();

  const [activeTab, setActiveTab] = useState<'list' | 'summary'>('list');
  const [showModal, setShowModal] = useState(false);
  const [expenseType, setExpenseType] = useState<ExpenseType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [filterCategory, setFilterCategory] = useState<number | null>(null);

  const now = new Date();
  const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
  const monthEnd = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd');

  useEffect(() => {
    loadCategories();
    loadExpenses({ startDate: monthStart, endDate: monthEnd });
    loadSummary(monthStart, monthEnd);
  }, []);

  const filteredExpenses = filterCategory
    ? expenses.filter(e => e.category_id === filterCategory)
    : expenses;

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategoryId(null);
    setPaymentMethod('cash');
    setExpenseType('expense');
  };

  const handleSave = async () => {
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      const msg = 'Please enter a valid amount';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid', msg);
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
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      setShowModal(false);
      resetForm();
      loadSummary(monthStart, monthEnd);
    } catch { }
  };

  const handleDelete = (id: number) => {
    const doDelete = async () => {
      await deleteExpense(id);
      loadSummary(monthStart, monthEnd);
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
        <TouchableOpacity onPress={() => setShowModal(true)} style={[styles.addBtn, { backgroundColor: tc.primary }]}>
          <MaterialIcons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      {summary && (
        <LinearGradient
          colors={[tc.gradientStart, tc.gradientEnd] as any}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.summaryLabel}>This Month</Text>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: tc.cardBackground, borderColor: tc.border }, !filterCategory && { backgroundColor: tc.primary, borderColor: tc.primary }]}
            onPress={() => setFilterCategory(null)}
          >
            <Text style={[styles.filterText, { color: !filterCategory ? '#FFF' : tc.textSecondary }]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, { backgroundColor: tc.cardBackground, borderColor: tc.border }, filterCategory === cat.id && { backgroundColor: cat.color + '30', borderColor: cat.color }]}
              onPress={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
            >
              <Text style={[styles.filterText, { color: filterCategory === cat.id ? cat.color : tc.textSecondary }]}>
                {cat.icon} {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'list' ? (
          filteredExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={64} color={tc.border} />
              <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No transactions this month</Text>
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
                  <Text style={{ fontSize: 20 }}>{exp.category_icon || '💰'}</Text>
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
          /* Category Breakdown */
          summary?.byCategory && summary.byCategory.length > 0 ? (
            summary.byCategory.map((cat, i) => (
              <View key={i} style={[styles.catCard, { backgroundColor: tc.cardBackground }]}>
                <View style={styles.catHeader}>
                  <Text style={{ fontSize: 20 }}>{cat.icon || '📦'}</Text>
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
          )
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: tc.cardBackground }]}>
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
                onPress={() => setExpenseType('expense')}
              >
                <Text style={[styles.typeText, { color: expenseType === 'expense' ? '#FFF' : tc.textSecondary }]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, expenseType === 'income' && { backgroundColor: tc.success }]}
                onPress={() => setExpenseType('income')}
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
              placeholder="Description (optional)"
              placeholderTextColor={tc.textSecondary}
              value={description}
              onChangeText={setDescription}
            />

            {/* Category */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, { borderColor: tc.border }, categoryId === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                  onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                >
                  <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                  <Text style={[styles.catChipText, { color: categoryId === cat.id ? cat.color : tc.textSecondary }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

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
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { marginHorizontal: 20, borderRadius: 20, padding: 20, marginBottom: 16 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: typography.sizes.sm, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryBlock: { flex: 1, alignItems: 'center' },
  summaryAmount: { color: '#FFF', fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any },
  summarySubLabel: { color: 'rgba(255,255,255,0.7)', fontSize: typography.sizes.xs, marginTop: 2 },
  summaryDivider: { width: 1, height: 30 },
  tabBar: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  filterBar: { maxHeight: 48, marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
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
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8, gap: 6 },
  catChipText: { fontSize: typography.sizes.sm },
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  paymentBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 6 },
  paymentText: { fontSize: typography.sizes.sm },
  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
});
