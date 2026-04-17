import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import PrioritySelector from '../../../src/components/common/PrioritySelector';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { useTodoStore } from '../../../src/stores/useTodoStore';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';

type DateType = 'none' | 'single' | 'range';

const formatDisplayTime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 'Select time';
  const [h, m] = trimmed.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return trimmed;

  const date = new Date();
  date.setHours(h, m, 0, 0);
  return `${format(date, 'h:mm a')} (${trimmed})`;
};

export default function TodoEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { todos, updateTodo } = useTodoStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dateType, setDateType] = useState<DateType>('none');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [tags, setTags] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    if (id) {
      const found = todos.find(t => t.id === Number(id));
      if (found) {
        setTitle(found.title);
        setDescription(found.description || '');
        setPriority(found.priority as any);
        setDateType((found.date_type || 'none') as DateType);
        setStartDate(found.start_date || format(new Date(), 'yyyy-MM-dd'));
        setEndDate(found.end_date || '');
        setDueTime(found.due_time || '');
        setTags((found.tags || []).join(', '));
      }
    }
  }, [id, todos]);

  const handleDateChange = (
    _event: any,
    selectedDate?: Date,
    type?: 'start' | 'end' | 'time'
  ) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
      setShowTimePicker(false);
    }

    if (!selectedDate || !type) return;

    if (type === 'start') {
      setStartDate(format(selectedDate, 'yyyy-MM-dd'));
      return;
    }

    if (type === 'end') {
      setEndDate(format(selectedDate, 'yyyy-MM-dd'));
      return;
    }

    setDueTime(format(selectedDate, 'HH:mm'));
  };

  const openStartDatePicker = () => {
    setTempDate(startDate ? new Date(startDate) : new Date());
    setShowStartDatePicker(true);
  };

  const openEndDatePicker = () => {
    setTempDate(endDate ? new Date(endDate) : new Date());
    setShowEndDatePicker(true);
  };

  const openTimePicker = () => {
    if (dueTime) {
      const [hours, minutes] = dueTime.split(':').map(Number);
      if (Number.isFinite(hours) && Number.isFinite(minutes)) {
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        setTempDate(date);
      } else {
        setTempDate(new Date());
      }
    } else {
      setTempDate(new Date());
    }
    setShowTimePicker(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    try {
      if (dateType === 'range' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start.getTime() > end.getTime()) {
          Alert.alert('Error', 'Start date cannot be after end date');
          return;
        }
      }

      await updateTodo(Number(id), {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        date_type: dateType,
        start_date: dateType !== 'none' ? startDate : undefined,
        end_date: dateType === 'range' ? endDate || undefined : undefined,
        due_time: dueTime.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="close" size={24} color={tc.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Edit Task</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.label, { color: tc.textSecondary }]}>Title</Text>
        <TextInput
          style={[styles.input, { backgroundColor: tc.cardBackground, color: tc.textPrimary, borderColor: tc.border }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Task title"
          placeholderTextColor={tc.textSecondary}
        />

        <Text style={[styles.label, { color: tc.textSecondary }]}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: tc.cardBackground, color: tc.textPrimary, borderColor: tc.border }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add details..."
          placeholderTextColor={tc.textSecondary}
          multiline
          numberOfLines={4}
        />

        <Text style={[styles.label, { color: tc.textSecondary }]}>Priority</Text>
        <PrioritySelector selected={priority} onSelect={setPriority} />

        <Text style={[styles.label, { color: tc.textSecondary }]}>Schedule</Text>
        <View style={styles.scheduleTypeRow}>
          {([
            { key: 'none', label: 'No Date', icon: 'block' },
            { key: 'single', label: 'Single', icon: 'today' },
            { key: 'range', label: 'Range', icon: 'date-range' },
          ] as const).map((option) => (
            <Pressable
              key={option.key}
              style={[
                styles.scheduleTypeChip,
                { backgroundColor: tc.cardBackground, borderColor: tc.border },
                dateType === option.key && { backgroundColor: tc.primary, borderColor: tc.primary },
              ]}
              onPress={() => setDateType(option.key)}
            >
              <MaterialIcons name={option.icon as any} size={14} color={dateType === option.key ? '#FFF' : tc.textSecondary} />
              <Text style={[styles.scheduleTypeText, { color: dateType === option.key ? '#FFF' : tc.textSecondary }]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {dateType !== 'none' && (
          <>
            <Text style={[styles.label, { color: tc.textSecondary }]}>Date</Text>
            <View style={[styles.scheduleCard, { backgroundColor: tc.cardBackground, borderColor: tc.border }]}> 
              <View style={styles.scheduleFieldRow}>
                <MaterialIcons name="calendar-today" size={18} color={tc.primary} />
                <Text style={[styles.scheduleFieldLabel, { color: tc.textPrimary }]}>
                  {dateType === 'range' ? 'Start' : 'Date'}
                </Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e: any) => setStartDate(e.target.value)}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: tc.textPrimary,
                      backgroundColor: tc.background,
                      border: 'none',
                      borderRadius: 10,
                      padding: '8px 12px',
                      textAlign: 'right',
                      outline: 'none',
                      fontFamily: 'inherit',
                    } as any}
                  />
                ) : (
                  <Pressable onPress={openStartDatePicker} style={{ flex: 1 }}>
                    <Text style={[styles.scheduleFieldValue, { color: tc.textPrimary, backgroundColor: tc.background }]}>
                      {startDate ? format(new Date(startDate), 'MMM dd, yyyy') : 'Select date'}
                    </Text>
                  </Pressable>
                )}
              </View>

              {dateType === 'range' && (
                <>
                  <View style={[styles.scheduleDivider, { backgroundColor: tc.border }]} />
                  <View style={styles.scheduleFieldRow}>
                    <MaterialIcons name="event" size={18} color={tc.warning} />
                    <Text style={[styles.scheduleFieldLabel, { color: tc.textPrimary }]}>End</Text>
                    {Platform.OS === 'web' ? (
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e: any) => setEndDate(e.target.value)}
                        style={{
                          flex: 1,
                          fontSize: 14,
                          color: tc.textPrimary,
                          backgroundColor: tc.background,
                          border: 'none',
                          borderRadius: 10,
                          padding: '8px 12px',
                          textAlign: 'right',
                          outline: 'none',
                          fontFamily: 'inherit',
                        } as any}
                      />
                    ) : (
                      <Pressable onPress={openEndDatePicker} style={{ flex: 1 }}>
                        <Text style={[styles.scheduleFieldValue, { color: endDate ? tc.textPrimary : tc.textSecondary, backgroundColor: tc.background }]}>
                          {endDate ? format(new Date(endDate), 'MMM dd, yyyy') : 'Optional'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </>
              )}
            </View>
          </>
        )}

        <Text style={[styles.label, { color: tc.textSecondary }]}>Due Time</Text>
        <View style={[styles.scheduleCard, { backgroundColor: tc.cardBackground, borderColor: tc.border }]}> 
          <View style={styles.scheduleFieldRow}>
            <MaterialIcons name="access-time" size={18} color={tc.primary} />
            <Text style={[styles.scheduleFieldLabel, { color: tc.textPrimary }]}>Time</Text>
            {Platform.OS === 'web' ? (
              <input
                type="time"
                value={dueTime}
                onChange={(e: any) => setDueTime(e.target.value)}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: tc.textPrimary,
                  backgroundColor: tc.background,
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 12px',
                  textAlign: 'right',
                  outline: 'none',
                  fontFamily: 'inherit',
                } as any}
              />
            ) : (
              <Pressable onPress={openTimePicker} style={{ flex: 1 }}>
                <Text style={[styles.scheduleFieldValue, { color: dueTime ? tc.textPrimary : tc.textSecondary, backgroundColor: tc.background }]}>
                  {formatDisplayTime(dueTime)}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <Text style={[styles.label, { color: tc.textSecondary }]}>Tags (comma-separated)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: tc.cardBackground, color: tc.textPrimary, borderColor: tc.border }]}
          value={tags}
          onChangeText={setTags}
          placeholder="work, personal"
          placeholderTextColor={tc.textSecondary}
        />

        <Pressable onPress={handleSave} style={styles.saveBtn}>
          <LinearGradient
            colors={[tc.gradientStart, tc.gradientEnd]}
            style={styles.saveGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>

      {Platform.OS !== 'web' && showStartDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => handleDateChange(event, date, 'start')}
        />
      )}

      {Platform.OS !== 'web' && showEndDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => handleDateChange(event, date, 'end')}
        />
      )}

      {Platform.OS !== 'web' && showTimePicker && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => handleDateChange(event, date, 'time')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  headerBtn: { padding: 8, borderRadius: 20, backgroundColor: colors.cardBackground },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary },
  scrollContent: { padding: 20 },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, color: colors.textSecondary, marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: colors.cardBackground, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: typography.sizes.md, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  scheduleTypeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  scheduleTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scheduleTypeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold as any },
  scheduleCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  scheduleFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scheduleFieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
    minWidth: 48,
  },
  scheduleFieldValue: {
    flex: 1,
    fontSize: typography.sizes.sm,
    textAlign: 'right',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  scheduleDivider: { height: 1, marginLeft: 14 },
  textArea: { height: 100, textAlignVertical: 'top' as const },
  saveBtn: { marginTop: 32, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  saveGradient: { paddingVertical: 16, borderRadius: 30, alignItems: 'center' as const },
  saveBtnText: { color: '#FFF', fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any },
});
