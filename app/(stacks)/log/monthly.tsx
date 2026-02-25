import { MaterialIcons } from '@expo/vector-icons';
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLogStore } from '../../../src/stores/useLogStore';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';

export default function MonthlyLogScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { logs, loadLogs } = useLogStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reflection, setReflection] = useState('');
  const [rating, setRating] = useState(7);

  const monthLabel = format(currentMonth, 'MMMM yyyy');
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  useEffect(() => { loadLogs(); }, []);

  // Count daily logs in this month
  const monthLogs = logs.filter(l => {
    const d = new Date(l.date);
    return d >= monthStart && d <= monthEnd;
  });
  const avgRating = monthLogs.length > 0
    ? (monthLogs.reduce((s, l) => s + (l.overall_rating || 0), 0) / monthLogs.length).toFixed(1)
    : '—';
  const daysLogged = monthLogs.length;
  const totalDays = endOfMonth(currentMonth).getDate();

  const handleSave = async () => {
    Alert.alert('Saved!', 'Your monthly reflection has been saved.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Monthly Review</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Month Navigation */}
      <View style={[styles.dateSelector, { backgroundColor: tc.cardBackground }]}>
        <Pressable onPress={goToPreviousMonth} style={styles.arrow}>
          <MaterialIcons name="chevron-left" size={28} color={tc.textSecondary} />
        </Pressable>
        <Text style={[styles.dateText, { color: tc.textPrimary }]}>{monthLabel}</Text>
        <Pressable onPress={goToNextMonth} style={styles.arrow}>
          <MaterialIcons name="chevron-right" size={28} color={tc.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
            <Text style={[styles.statValue, { color: tc.primary }]}>{daysLogged}/{totalDays}</Text>
            <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Days Logged</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
            <Text style={[styles.statValue, { color: tc.warning }]}>{avgRating}</Text>
            <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Avg Rating</Text>
          </View>
        </View>

        {/* Reflection */}
        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>Monthly Reflection</Text>
        <View style={[styles.journalCard, { backgroundColor: tc.cardBackground }]}>
          <TextInput
            style={[styles.journalInput, { color: tc.textPrimary }]}
            placeholder="Reflect on your month. What were the highlights? What do you want to improve next month?"
            placeholderTextColor={tc.textSecondary}
            value={reflection}
            onChangeText={setReflection}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Rating */}
        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>Rate your month</Text>
        <View style={[styles.ratingCard, { backgroundColor: tc.cardBackground }]}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <Pressable key={n} onPress={() => setRating(n)} style={styles.starBtn}>
                <MaterialIcons name={n <= rating ? 'star' : 'star-border'} size={28} color={n <= rating ? tc.warning : tc.border} />
              </Pressable>
            ))}
          </View>
          <Text style={[styles.ratingText, { color: tc.textPrimary }]}>{rating}/10</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Save */}
      <View style={styles.bottomContainer}>
        <Pressable style={styles.mainSaveBtn} onPress={handleSave}>
          <LinearGradient colors={[tc.gradientStart, tc.gradientEnd]} style={styles.mainSaveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <MaterialIcons name="save" size={22} color="#FFF" />
            <Text style={styles.mainSaveText}>Save Review</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 30, paddingBottom: 8 },
  headerBtn: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any },
  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 16, marginBottom: 8 },
  dateText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any },
  arrow: { padding: 8 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  statCard: { flex: 1, alignItems: 'center' as const, paddingVertical: 18, borderRadius: 16, gap: 4 },
  statValue: { fontSize: 28, fontWeight: typography.weights.bold as any },
  statLabel: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium as any },
  sectionLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, textTransform: 'uppercase' as const, letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  journalCard: { borderRadius: 16, padding: 4, minHeight: 180 },
  journalInput: { padding: 16, fontSize: typography.sizes.md, lineHeight: 24, minHeight: 160 },
  ratingCard: { borderRadius: 16, padding: 20, alignItems: 'center' as const },
  starsRow: { flexDirection: 'row', gap: 2 },
  starBtn: { padding: 2 },
  ratingText: { marginTop: 8, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any },
  bottomContainer: { position: 'absolute' as const, bottom: 20, left: 20, right: 20 },
  mainSaveBtn: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  mainSaveGradient: { paddingVertical: 16, borderRadius: 30, alignItems: 'center' as const, flexDirection: 'row', justifyContent: 'center' as const, gap: 8 },
  mainSaveText: { color: '#FFF', fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any },
});
