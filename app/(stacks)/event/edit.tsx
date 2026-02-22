import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Card from '../../../src/components/common/Card';
import { useEventStore } from '../../../src/stores/useEventStore';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { EventCategory } from '../../../src/types/event.types';

const CATEGORIES: { label: string; value: EventCategory; icon: string; color: string }[] = [
  { label: 'General', value: 'general', icon: 'event', color: '#1A73E8' },
  { label: 'Work', value: 'work', icon: 'work', color: '#FF9800' },
  { label: 'Personal', value: 'personal', icon: 'person', color: '#4CAF50' },
  { label: 'Health', value: 'health', icon: 'favorite', color: '#E91E63' },
  { label: 'Social', value: 'social', icon: 'people', color: '#9C27B0' },
];

const EVENT_COLORS = ['#1A73E8', '#E91E63', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4', '#FF5722', '#607D8B'];

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark, colors: tc } = useThemeStore();
  const { events, updateEvent } = useEventStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('general');
  const [eventColor, setEventColor] = useState('#1A73E8');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endTime, setEndTime] = useState('11:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recurringInterval, setRecurringInterval] = useState('1');
  const [recurringEndDate, setRecurringEndDate] = useState('');

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showRecurringEndPicker, setShowRecurringEndPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    if (id) {
      const event = events.find(e => e.id === Number(id));
      if (event) {
        setTitle(event.title);
        setDescription(event.description || '');
        setCategory(event.category as EventCategory);
        setEventColor(event.color);
        setLocation(event.location || '');
        setIsAllDay(event.is_all_day);
        setIsRecurring(event.is_recurring);
        try {
          const sd = new Date(event.start_datetime);
          setStartDate(format(sd, 'yyyy-MM-dd'));
          setStartTime(format(sd, 'HH:mm'));
        } catch { /* keep defaults */ }
        if (event.end_datetime) {
          try {
            const ed = new Date(event.end_datetime);
            setEndDate(format(ed, 'yyyy-MM-dd'));
            setEndTime(format(ed, 'HH:mm'));
          } catch { /* keep defaults */ }
        }
        if (event.recurring_pattern) {
          setRecurringType(event.recurring_pattern.type as any);
          setRecurringInterval(String(event.recurring_pattern.interval || 1));
          setRecurringEndDate(event.recurring_pattern.end_date || '');
        }
      }
    }
  }, [id, events]);

  const handleDateChange = (event: any, selectedDate?: Date, type?: string) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      setShowStartTimePicker(false);
      setShowEndDatePicker(false);
      setShowEndTimePicker(false);
      setShowRecurringEndPicker(false);
    }
    if (selectedDate && type) {
      if (type === 'startDate') setStartDate(format(selectedDate, 'yyyy-MM-dd'));
      else if (type === 'startTime') setStartTime(format(selectedDate, 'HH:mm'));
      else if (type === 'endDate') setEndDate(format(selectedDate, 'yyyy-MM-dd'));
      else if (type === 'endTime') setEndTime(format(selectedDate, 'HH:mm'));
      else if (type === 'recurringEnd') setRecurringEndDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Event title is required'); return; }
    try {
      const startDt = isAllDay ? `${startDate}T00:00:00` : `${startDate}T${startTime}:00`;
      const endDt = isAllDay ? `${endDate}T23:59:59` : `${endDate}T${endTime}:00`;
      await updateEvent(Number(id), {
        title: title.trim(),
        description: description.trim() || undefined,
        event_type: isAllDay ? 'full_day' : (startDate !== endDate ? 'multi_day' : 'single'),
        start_datetime: startDt,
        end_datetime: endDt,
        is_all_day: isAllDay,
        location: location.trim() || undefined,
        color: eventColor,
        category,
        is_recurring: isRecurring,
        recurring_pattern: isRecurring ? {
          type: recurringType,
          interval: parseInt(recurringInterval) || 1,
          end_date: recurringEndDate || undefined,
        } : undefined,
      });
      router.back();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to update event'); }
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}><MaterialIcons name="close" size={24} color={tc.textPrimary} /></Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Edit Event</Text>
        <Pressable style={[styles.saveBtn, { backgroundColor: tc.primary }]} onPress={handleSave}><Text style={styles.saveBtnText}>Save</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.inputCard}>
          <TextInput style={[styles.titleInput, { color: tc.textPrimary }]} placeholder="Event title" placeholderTextColor={tc.textSecondary} value={title} onChangeText={setTitle} />
          <View style={[styles.divider, { backgroundColor: tc.border }]} />
          <TextInput style={[styles.descInput, { color: tc.textPrimary }]} placeholder="Description (optional)" placeholderTextColor={tc.textSecondary} value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
        </Card>

        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATEGORIES.map(c => (
            <Pressable key={c.value} style={[styles.catChip, { backgroundColor: tc.cardBackground, borderColor: tc.border }, category === c.value && { backgroundColor: c.color, borderColor: c.color }]} onPress={() => setCategory(c.value)}>
              <MaterialIcons name={c.icon as any} size={16} color={category === c.value ? '#FFF' : c.color} />
              <Text style={[styles.catChipText, { color: tc.textSecondary }, category === c.value && { color: '#FFF' }]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>Color</Text>
        <View style={styles.colorRow}>
          {EVENT_COLORS.map(c => (
            <Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, eventColor === c && { borderWidth: 3, borderColor: tc.textPrimary }]} onPress={() => setEventColor(c)} />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>Date & Time</Text>
        <Card style={styles.inputCard}>
          <View style={styles.fieldRow}>
            <MaterialIcons name="wb-sunny" size={20} color={tc.primary} />
            <Text style={[styles.fieldLabel, { color: tc.textPrimary }]}>All Day</Text>
            <Switch value={isAllDay} onValueChange={setIsAllDay} trackColor={{ false: tc.border, true: tc.primaryLight }} thumbColor={isAllDay ? tc.primary : '#f4f3f4'} />
          </View>
          <View style={[styles.divider, { backgroundColor: tc.border }]} />
          <View style={styles.fieldRow}>
            <MaterialIcons name="calendar-today" size={20} color={tc.primary} />
            <Text style={[styles.fieldLabel, { color: tc.textPrimary }]}>Start</Text>
            {Platform.OS === 'web' ? (
              <input type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} style={{ flex: 1, fontSize: 14, color: tc.textPrimary, backgroundColor: tc.background, border: 'none', borderRadius: 10, padding: '8px 12px', textAlign: 'right', outline: 'none', fontFamily: 'inherit' } as any} />
            ) : (
              <Pressable onPress={() => { setTempDate(new Date(startDate)); setShowStartDatePicker(true); }} style={{ flex: 1 }}>
                <Text style={[styles.fieldInput, { color: tc.textPrimary, backgroundColor: tc.background }]}>{format(new Date(startDate), 'MMM dd, yyyy')}</Text>
              </Pressable>
            )}
            {!isAllDay && (Platform.OS === 'web' ? (
              <input type="time" value={startTime} onChange={(e: any) => setStartTime(e.target.value)} style={{ width: 100, fontSize: 14, color: tc.textPrimary, backgroundColor: tc.background, border: 'none', borderRadius: 10, padding: '8px 12px', textAlign: 'center', outline: 'none', fontFamily: 'inherit' } as any} />
            ) : (
              <Pressable onPress={() => { const [h, m] = startTime.split(':'); const d = new Date(); d.setHours(parseInt(h), parseInt(m)); setTempDate(d); setShowStartTimePicker(true); }} style={{ width: 70 }}>
                <Text style={[styles.fieldInput, { color: tc.textPrimary, backgroundColor: tc.background, textAlign: 'center' }]}>{startTime}</Text>
              </Pressable>
            ))}
          </View>
          <View style={[styles.divider, { backgroundColor: tc.border }]} />
          <View style={styles.fieldRow}>
            <MaterialIcons name="event" size={20} color={tc.warning} />
            <Text style={[styles.fieldLabel, { color: tc.textPrimary }]}>End</Text>
            {Platform.OS === 'web' ? (
              <input type="date" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} style={{ flex: 1, fontSize: 14, color: tc.textPrimary, backgroundColor: tc.background, border: 'none', borderRadius: 10, padding: '8px 12px', textAlign: 'right', outline: 'none', fontFamily: 'inherit' } as any} />
            ) : (
              <Pressable onPress={() => { setTempDate(new Date(endDate)); setShowEndDatePicker(true); }} style={{ flex: 1 }}>
                <Text style={[styles.fieldInput, { color: tc.textPrimary, backgroundColor: tc.background }]}>{format(new Date(endDate), 'MMM dd, yyyy')}</Text>
              </Pressable>
            )}
            {!isAllDay && (Platform.OS === 'web' ? (
              <input type="time" value={endTime} onChange={(e: any) => setEndTime(e.target.value)} style={{ width: 100, fontSize: 14, color: tc.textPrimary, backgroundColor: tc.background, border: 'none', borderRadius: 10, padding: '8px 12px', textAlign: 'center', outline: 'none', fontFamily: 'inherit' } as any} />
            ) : (
              <Pressable onPress={() => { const [h, m] = endTime.split(':'); const d = new Date(); d.setHours(parseInt(h), parseInt(m)); setTempDate(d); setShowEndTimePicker(true); }} style={{ width: 70 }}>
                <Text style={[styles.fieldInput, { color: tc.textPrimary, backgroundColor: tc.background, textAlign: 'center' }]}>{endTime}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>Location</Text>
        <Card style={styles.inputCard}>
          <View style={styles.fieldRow}>
            <MaterialIcons name="location-on" size={20} color={tc.danger} />
            <TextInput style={[styles.fieldInput, { flex: 1, color: tc.textPrimary, backgroundColor: tc.background }]} value={location} onChangeText={setLocation} placeholder="Add location..." placeholderTextColor={tc.textSecondary} />
          </View>
        </Card>

        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>Recurring</Text>
        <Card style={styles.inputCard}>
          <View style={styles.fieldRow}>
            <MaterialIcons name="repeat" size={20} color={tc.primary} />
            <Text style={[styles.fieldLabel, { color: tc.textPrimary }]}>Repeat</Text>
            <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ false: tc.border, true: tc.primaryLight }} thumbColor={isRecurring ? tc.primary : '#f4f3f4'} />
          </View>
          {isRecurring && (
            <>
              <View style={[styles.divider, { backgroundColor: tc.border }]} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recurringChips}>
                {(['daily', 'weekly', 'monthly'] as const).map(opt => (
                  <Pressable key={opt} style={[styles.miniChip, { backgroundColor: tc.background, borderColor: tc.border }, recurringType === opt && { backgroundColor: tc.primary, borderColor: tc.primary }]} onPress={() => setRecurringType(opt)}>
                    <Text style={[styles.miniChipText, { color: tc.textSecondary }, recurringType === opt && { color: '#FFF' }]}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={[styles.divider, { backgroundColor: tc.border }]} />
              <View style={styles.fieldRow}>
                <MaterialIcons name="loop" size={20} color={tc.textSecondary} />
                <Text style={[styles.fieldLabel, { color: tc.textPrimary }]}>Every</Text>
                <TextInput style={[styles.fieldInput, { width: 50, textAlign: 'center', color: tc.textPrimary, backgroundColor: tc.background }]} value={recurringInterval} onChangeText={setRecurringInterval} keyboardType="numeric" placeholder="1" placeholderTextColor={tc.textSecondary} />
                <Text style={[styles.fieldSuffix, { color: tc.textSecondary }]}>{recurringType === 'daily' ? 'day(s)' : recurringType === 'weekly' ? 'week(s)' : 'month(s)'}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: tc.border }]} />
              <View style={styles.fieldRow}>
                <MaterialIcons name="event-busy" size={20} color={tc.danger} />
                <Text style={[styles.fieldLabel, { color: tc.textPrimary }]}>Until</Text>
                {Platform.OS === 'web' ? (
                  <input type="date" value={recurringEndDate} onChange={(e: any) => setRecurringEndDate(e.target.value)} style={{ flex: 1, fontSize: 14, color: tc.textPrimary, backgroundColor: tc.background, border: 'none', borderRadius: 10, padding: '8px 12px', textAlign: 'right', outline: 'none', fontFamily: 'inherit' } as any} placeholder="Optional" />
                ) : (
                  <Pressable onPress={() => { setTempDate(recurringEndDate ? new Date(recurringEndDate) : new Date()); setShowRecurringEndPicker(true); }} style={{ flex: 1 }}>
                    <Text style={[styles.fieldInput, { color: recurringEndDate ? tc.textPrimary : tc.textSecondary, backgroundColor: tc.background }]}>
                      {recurringEndDate ? format(new Date(recurringEndDate), 'MMM dd, yyyy') : 'Optional'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </Card>

        <View style={{ height: 120 }} />
      </ScrollView>

      {Platform.OS !== 'web' && showStartDatePicker && (
        <DateTimePicker value={tempDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} themeVariant={isDark ? 'dark' : 'light'} onChange={(event, date) => handleDateChange(event, date, 'startDate')} />
      )}
      {Platform.OS !== 'web' && showStartTimePicker && (
        <DateTimePicker value={tempDate} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} themeVariant={isDark ? 'dark' : 'light'} onChange={(event, date) => handleDateChange(event, date, 'startTime')} />
      )}
      {Platform.OS !== 'web' && showEndDatePicker && (
        <DateTimePicker value={tempDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} themeVariant={isDark ? 'dark' : 'light'} onChange={(event, date) => handleDateChange(event, date, 'endDate')} />
      )}
      {Platform.OS !== 'web' && showEndTimePicker && (
        <DateTimePicker value={tempDate} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} themeVariant={isDark ? 'dark' : 'light'} onChange={(event, date) => handleDateChange(event, date, 'endTime')} />
      )}
      {Platform.OS !== 'web' && showRecurringEndPicker && (
        <DateTimePicker value={tempDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} themeVariant={isDark ? 'dark' : 'light'} onChange={(event, date) => handleDateChange(event, date, 'recurringEnd')} />
      )}

      <View style={styles.bottomContainer}>
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, color: colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  inputCard: { padding: 0, marginVertical: 4 },
  titleInput: { padding: 16, fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 16 },
  descInput: { padding: 16, height: 70, fontSize: typography.sizes.md, color: colors.textPrimary },
  chipRow: { gap: 8, paddingBottom: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border },
  catChipText: { fontSize: typography.sizes.sm, color: colors.textSecondary, fontWeight: typography.weights.medium as any },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  fieldLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium as any, color: colors.textPrimary, minWidth: 60 },
  fieldInput: { flex: 1, fontSize: typography.sizes.sm, color: colors.textPrimary, textAlign: 'right' as const, backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  fieldSuffix: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  recurringChips: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 8, paddingRight: 20 },
  miniChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  miniChipText: { fontSize: typography.sizes.xs, color: colors.textSecondary, fontWeight: typography.weights.medium as any },
  bottomContainer: { position: 'absolute', bottom: 32, left: 20, right: 20 },
  mainSaveGradient: { paddingVertical: 16, borderRadius: 30, alignItems: 'center' as const },
  mainSaveText: { color: '#FFF', fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any },
});
