import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Card from '../../../src/components/common/Card';
import { useHabitStore } from '../../../src/stores/useHabitStore';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { HabitCategory, HabitFrequency, HabitTimeOfDay } from '../../../src/types/habit.types';

const CATEGORIES: { label: string; value: HabitCategory; icon: string; color: string }[] = [
  { label: 'Health', value: 'health', icon: 'favorite', color: '#E91E63' },
  { label: 'Fitness', value: 'fitness', icon: 'fitness-center', color: '#00BCD4' },
  { label: 'Learning', value: 'learning', icon: 'school', color: '#2196F3' },
  { label: 'Productivity', value: 'productivity', icon: 'trending-up', color: '#FF9800' },
  { label: 'Mindfulness', value: 'mindfulness', icon: 'self-improvement', color: '#9C27B0' },
  { label: 'Creative', value: 'creative', icon: 'brush', color: '#FF5722' },
];

const HABIT_COLORS = ['#00BFA5', '#2196F3', '#E91E63', '#FF9800', '#9C27B0', '#4CAF50', '#FF5722', '#607D8B'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CreateHabitScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { addHabit } = useHabitStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('health');
  const [habitColor, setHabitColor] = useState('#00BFA5');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [specificDays, setSpecificDays] = useState<number[]>([]);
  const [timesPerWeek, setTimesPerWeek] = useState('3');
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>('anytime');
  const [reminderTime, setReminderTime] = useState('');

  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      setReminderTime(`${hours}:${minutes}`);
    }
  };

  const toggleDay = (day: number) => {
    setSpecificDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    try {
      await addHabit({
        title: title.trim(), description: description.trim() || undefined,
        category, frequency_type: frequency, color: habitColor,
        specific_days: frequency === 'specific_days' ? specificDays : undefined,
        times_per_week: frequency === 'x_per_week' ? parseInt(timesPerWeek) || 3 : undefined,
        time_of_day: timeOfDay,
        reminder_time: reminderTime || undefined,
      });
      router.back();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><MaterialIcons name="arrow-back" size={28} color={tc.textPrimary} /></Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>New Habit</Text>
        <Pressable style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Save</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <TextInput style={[styles.titleInput, { color: tc.textPrimary }]} placeholder="Habit title" placeholderTextColor={tc.textSecondary} value={title} onChangeText={setTitle} />
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
          {HABIT_COLORS.map(c => (<Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, habitColor === c && [styles.colorDotActive, { borderColor: tc.textPrimary }]]} onPress={() => setHabitColor(c)} />))}
        </View>

        <Text style={[styles.label, { color: tc.textSecondary }]}>Frequency</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          {([['daily', 'Daily'], ['specific_days', 'Specific Days'], ['x_per_week', 'X per Week']] as const).map(([v, l]) => (
            <Pressable key={v} style={[styles.chip, { backgroundColor: tc.cardBackground, borderColor: tc.border }, frequency === v && { backgroundColor: tc.primary, borderColor: tc.primary }]} onPress={() => setFrequency(v)}>
              <Text style={[styles.chipText, { color: tc.textSecondary }, frequency === v && { color: '#FFF' }]}>{l}</Text>
            </Pressable>
          ))}
        </View>

        {frequency === 'specific_days' && (
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
            {DAYS.map((d, i) => (
              <Pressable key={d} style={[styles.dayChip, { backgroundColor: tc.cardBackground, borderColor: tc.border }, specificDays.includes(i + 1) && { backgroundColor: tc.primary, borderColor: tc.primary }]} onPress={() => toggleDay(i + 1)}>
                <Text style={[styles.dayChipText, { color: tc.textSecondary }, specificDays.includes(i + 1) && { color: '#FFF' }]}>{d}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {frequency === 'x_per_week' && (
          <Card style={styles.card}>
            <View style={styles.fieldRow}>
              <MaterialIcons name="repeat" size={20} color={tc.primary} />
              <Text style={[styles.fieldLabel, { color: tc.textPrimary }]}>Times/week</Text>
              <TextInput style={[styles.fieldInput, { width: 50, textAlign: 'center', color: tc.textPrimary, backgroundColor: tc.background }]} value={timesPerWeek} onChangeText={setTimesPerWeek} keyboardType="numeric" />
            </View>
          </Card>
        )}

        <Text style={[styles.label, { color: tc.textSecondary }]}>Time of Day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
          {([['morning', '🌅 Morning'], ['afternoon', '☀️ Afternoon'], ['evening', '🌙 Evening'], ['anytime', '⏰ Anytime']] as const).map(([v, l]) => (
            <Pressable key={v} style={[styles.chip, { backgroundColor: tc.cardBackground, borderColor: tc.border }, timeOfDay === v && { backgroundColor: tc.primary, borderColor: tc.primary }]} onPress={() => setTimeOfDay(v)}>
              <Text style={[styles.chipText, { color: tc.textSecondary }, timeOfDay === v && { color: '#FFF' }]}>{l}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: tc.textSecondary }]}>Reminder</Text>
        <Card style={styles.card}>
          <View style={styles.fieldRow}>
            <MaterialIcons name="notifications" size={20} color={tc.warning} />
            <Text style={[styles.fieldLabel, { color: tc.textPrimary }]}>Time</Text>
            {Platform.OS === 'web' ? (
              <input type="time" value={reminderTime} onChange={(e: any) => setReminderTime(e.target.value)} style={{ flex: 1, fontSize: 14, color: tc.textPrimary, backgroundColor: tc.background, border: 'none', borderRadius: 10, padding: '8px 12px', textAlign: 'right', outline: 'none', fontFamily: 'inherit' } as any} placeholder="Optional" />
            ) : (
              <Pressable onPress={() => { if (reminderTime) { const [h, m] = reminderTime.split(':'); const d = new Date(); d.setHours(parseInt(h), parseInt(m)); setTempDate(d); } else { setTempDate(new Date()); } setShowTimePicker(true); }} style={{ flex: 1 }}>
                <Text style={[styles.fieldInput, { color: reminderTime ? tc.textPrimary : tc.textSecondary, backgroundColor: tc.background }]}>
                  {reminderTime || 'Optional'}
                </Text>
              </Pressable>
            )}
          </View>
        </Card>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Time Picker for Mobile */}
      {Platform.OS !== 'web' && showTimePicker && (
        <DateTimePicker value={tempDate} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleTimeChange} />
      )}

      <View style={styles.bottomBar}>
        <Pressable onPress={handleSave}>
          <LinearGradient colors={['#00BFA5', '#009688']} style={styles.mainSaveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.mainSaveText}>Create Habit</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  headerTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary },
  saveBtn: { backgroundColor: '#00BFA5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: '#FFF', fontWeight: typography.weights.bold as any, fontSize: typography.sizes.sm },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  card: { padding: 0, marginVertical: 4 },
  titleInput: { padding: 16, fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 16 },
  descInput: { padding: 16, height: 70, fontSize: typography.sizes.md, color: colors.textPrimary },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.sizes.sm, color: colors.textSecondary, fontWeight: typography.weights.medium as any },
  chipActiveText: { color: '#FFF' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: colors.textPrimary },
  dayChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold as any, color: colors.textSecondary },
  dayChipTextActive: { color: '#FFF' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  fieldLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium as any, color: colors.textPrimary, minWidth: 80 },
  fieldInput: { flex: 1, fontSize: typography.sizes.sm, color: colors.textPrimary, textAlign: 'right', backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  bottomBar: { position: 'absolute', bottom: 32, left: 20, right: 20 },
  mainSaveGradient: { paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  mainSaveText: { color: '#FFF', fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any },
});
