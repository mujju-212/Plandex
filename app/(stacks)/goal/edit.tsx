import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Card from '../../../src/components/common/Card';
import { useGoalStore } from '../../../src/stores/useGoalStore';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { GoalCategory, GoalDuration, GoalPriority, GoalType } from '../../../src/types/goal.types';

const CATEGORIES: { label: string; value: GoalCategory; icon: string; color: string }[] = [
  { label: 'Health', value: 'health', icon: 'favorite', color: '#E91E63' },
  { label: 'Career', value: 'career', icon: 'work', color: '#FF9800' },
  { label: 'Finance', value: 'finance', icon: 'account-balance', color: '#4CAF50' },
  { label: 'Learning', value: 'learning', icon: 'school', color: '#2196F3' },
  { label: 'Personal', value: 'personal', icon: 'person', color: '#9C27B0' },
  { label: 'Fitness', value: 'fitness', icon: 'fitness-center', color: '#00BCD4' },
  { label: 'Creative', value: 'creative', icon: 'brush', color: '#FF5722' },
];

const GOAL_COLORS = ['#4CAF50', '#2196F3', '#E91E63', '#FF9800', '#9C27B0', '#00BCD4', '#FF5722', '#607D8B'];

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark, colors: tc } = useThemeStore();
  const { goals, updateGoal } = useGoalStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('personal');
  const [goalType, setGoalType] = useState<GoalType>('achievement');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [duration, setDuration] = useState<GoalDuration>('monthly');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [goalColor, setGoalColor] = useState('#4CAF50');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    if (id) {
      const goal = goals.find(g => g.id === Number(id));
      if (goal) {
        setTitle(goal.title);
        setDescription(goal.description || '');
        setCategory(goal.category as GoalCategory);
        setGoalType(goal.goal_type as GoalType);
        setTargetValue(goal.target_value ? String(goal.target_value) : '');
        setUnit(goal.unit || '');
        setDuration(goal.duration_type as GoalDuration);
        setPriority(goal.priority as GoalPriority);
        setGoalColor(goal.color);
        setStartDate(goal.start_date || format(new Date(), 'yyyy-MM-dd'));
        setEndDate(goal.end_date || '');
      }
    }
  }, [id, goals]);

  const handleDateChange = (event: any, selectedDate?: Date, type?: 'start' | 'end') => {
    if (Platform.OS === 'android') {
      if (type === 'start') setShowStartDatePicker(false);
      if (type === 'end') setShowEndDatePicker(false);
    }
    if (selectedDate) {
      if (type === 'start') setStartDate(format(selectedDate, 'yyyy-MM-dd'));
      if (type === 'end') setEndDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    try {
      await updateGoal(Number(id), {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        goal_type: goalType,
        target_value: goalType === 'measurable' && targetValue ? parseFloat(targetValue) : undefined,
        unit: unit || undefined,
        duration_type: duration,
        priority,
        color: goalColor,
        start_date: startDate,
        end_date: endDate || undefined,
      });
      router.back();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}><MaterialIcons name="close" size={24} color={tc.textPrimary} /></Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Edit Goal</Text>
        <Pressable style={[styles.saveBtn, { backgroundColor: tc.primary }]} onPress={handleSave}><Text style={styles.saveBtnText}>Save</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <TextInput style={[styles.titleInput, { color: tc.textPrimary }]} placeholder="Goal title" placeholderTextColor={tc.textSecondary} value={title} onChangeText={setTitle} />
          <View style={[styles.divider, { backgroundColor: tc.border }]} />
          <TextInput style={[styles.descInput, { color: tc.textPrimary }]} placeholder="Description (optional)" placeholderTextColor={tc.textSecondary} value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
        </Card>

        <Text style={[styles.label, { color: tc.textSecondary }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CATEGORIES.map(c => (
            <Pressable key={c.value} style={[styles.chip, { backgroundColor: tc.cardBackground, borderColor: tc.border }, category === c.value && { backgroundColor: c.color, borderColor: c.color }]} onPress={() => setCategory(c.value)}>
              <MaterialIcons name={c.icon as any} size={14} color={category === c.value ? '#FFF' : c.color} />
              <Text style={[styles.chipText, { color: tc.textSecondary }, category === c.value && { color: '#FFF' }]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: tc.textSecondary }]}>Color</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
          {GOAL_COLORS.map(c => (<Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, goalColor === c && [styles.colorDotActive, { borderColor: tc.textPrimary }]]} onPress={() => setGoalColor(c)} />))}
        </View>

        <Text style={[styles.label, { color: tc.textSecondary }]}>Goal Type</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          {([['achievement', 'Achievement'], ['measurable', 'Measurable']] as const).map(([v, l]) => (
            <Pressable key={v} style={[styles.chip, { backgroundColor: tc.cardBackground, borderColor: tc.border }, goalType === v && { backgroundColor: tc.primary, borderColor: tc.primary }]} onPress={() => setGoalType(v)}>
              <Text style={[styles.chipText, { color: tc.textSecondary }, goalType === v && { color: '#FFF' }]}>{l}</Text>
            </Pressable>
          ))}
        </View>

        {goalType === 'measurable' && (
          <Card style={styles.card}>
            <View style={styles.fieldRow}>
              <MaterialIcons name="track-changes" size={20} color={tc.primary} />
              <Text style={[styles.fieldLabel, { color: tc.textPrimary }]}>Target</Text>
              <TextInput style={[styles.fieldInput, { width: 80, color: tc.textPrimary, backgroundColor: tc.background }]} value={targetValue} onChangeText={setTargetValue} keyboardType="numeric" placeholder="e.g. 10" placeholderTextColor={tc.textSecondary} />
              <TextInput style={[styles.fieldInput, { width: 80, color: tc.textPrimary, backgroundColor: tc.background }]} value={unit} onChangeText={setUnit} placeholder="unit" placeholderTextColor={tc.textSecondary} />
            </View>
          </Card>
        )}

        <Text style={[styles.label, { color: tc.textSecondary }]}>Priority</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          {([['low', 'Low', tc.success], ['medium', 'Medium', tc.warning], ['high', 'High', tc.danger]] as const).map(([v, l, c]) => (
            <Pressable key={v} style={[styles.chip, { backgroundColor: tc.cardBackground, borderColor: tc.border }, priority === v && { backgroundColor: c, borderColor: c }]} onPress={() => setPriority(v)}>
              <Text style={[styles.chipText, { color: tc.textSecondary }, priority === v && { color: '#FFF' }]}>{l}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: tc.textSecondary }]}>Duration</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          {([['weekly', 'Weekly'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['yearly', 'Yearly'], ['custom', 'Custom']] as const).map(([v, l]) => (
            <Pressable key={v} style={[styles.chip, { backgroundColor: tc.cardBackground, borderColor: tc.border }, duration === v && { backgroundColor: tc.primary, borderColor: tc.primary }]} onPress={() => setDuration(v)}>
              <Text style={[styles.chipText, { color: tc.textSecondary }, duration === v && { color: '#FFF' }]}>{l}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: tc.textSecondary }]}>Dates</Text>
        <Card style={styles.card}>
          <View style={styles.fieldRow}>
            <MaterialIcons name="calendar-today" size={20} color={tc.primary} />
            <Text style={[styles.fieldLabel, { color: tc.textPrimary }]}>Start</Text>
            {Platform.OS === 'web' ? (
              <input type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} style={{ flex: 1, fontSize: 14, color: tc.textPrimary, backgroundColor: tc.background, border: 'none', borderRadius: 10, padding: '8px 12px', textAlign: 'right', outline: 'none', fontFamily: 'inherit' } as any} />
            ) : (
              <Pressable onPress={() => { setTempDate(new Date(startDate)); setShowStartDatePicker(true); }} style={{ flex: 1 }}>
                <Text style={[styles.fieldInput, { color: tc.textPrimary, backgroundColor: tc.background }]}>
                  {format(new Date(startDate), 'MMM dd, yyyy')}
                </Text>
              </Pressable>
            )}
          </View>
          <View style={[styles.divider, { backgroundColor: tc.border }]} />
          <View style={styles.fieldRow}>
            <MaterialIcons name="event" size={20} color={tc.warning} />
            <Text style={[styles.fieldLabel, { color: tc.textPrimary }]}>End</Text>
            {Platform.OS === 'web' ? (
              <input type="date" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} style={{ flex: 1, fontSize: 14, color: tc.textPrimary, backgroundColor: tc.background, border: 'none', borderRadius: 10, padding: '8px 12px', textAlign: 'right', outline: 'none', fontFamily: 'inherit' } as any} placeholder="Optional" />
            ) : (
              <Pressable onPress={() => { setTempDate(endDate ? new Date(endDate) : new Date()); setShowEndDatePicker(true); }} style={{ flex: 1 }}>
                <Text style={[styles.fieldInput, { color: endDate ? tc.textPrimary : tc.textSecondary, backgroundColor: tc.background }]}>
                  {endDate ? format(new Date(endDate), 'MMM dd, yyyy') : 'Optional'}
                </Text>
              </Pressable>
            )}
          </View>
        </Card>

        <View style={{ height: 120 }} />
      </ScrollView>

      {Platform.OS !== 'web' && showStartDatePicker && (
        <DateTimePicker value={tempDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} themeVariant={isDark ? 'dark' : 'light'} onChange={(event, date) => handleDateChange(event, date, 'start')} />
      )}
      {Platform.OS !== 'web' && showEndDatePicker && (
        <DateTimePicker value={tempDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} themeVariant={isDark ? 'dark' : 'light'} onChange={(event, date) => handleDateChange(event, date, 'end')} />
      )}

      <View style={styles.bottomBar}>
        <Pressable onPress={handleSave}>
          <LinearGradient colors={[tc.gradientStart, tc.gradientEnd]} style={styles.mainSaveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.mainSaveText}>Save Changes</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  headerBtn: { padding: 8, borderRadius: 20, backgroundColor: colors.cardBackground },
  headerTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: '#FFF', fontWeight: typography.weights.bold as any, fontSize: typography.sizes.sm },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  card: { padding: 0, marginVertical: 4 },
  titleInput: { padding: 16, fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 16 },
  descInput: { padding: 16, height: 70, fontSize: typography.sizes.md, color: colors.textPrimary },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border },
  chipText: { fontSize: typography.sizes.sm, color: colors.textSecondary, fontWeight: typography.weights.medium as any },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: colors.textPrimary },
  fieldRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  fieldLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium as any, color: colors.textPrimary, minWidth: 60 },
  fieldInput: { flex: 1, fontSize: typography.sizes.sm, color: colors.textPrimary, textAlign: 'right', backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  bottomBar: { position: 'absolute', bottom: 32, left: 20, right: 20 },
  mainSaveGradient: { paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  mainSaveText: { color: '#FFF', fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any },
});
