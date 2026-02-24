import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useMoodStore } from '../../src/stores/useMoodStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { typography } from '../../src/theme/typography';
import { MOOD_ACTIVITIES, MOOD_COLORS, MOOD_EMOJIS, MoodType } from '../../src/types/mood.types';

const MOODS: { key: MoodType; emoji: string; label: string }[] = [
  { key: 'amazing', emoji: MOOD_EMOJIS.amazing, label: 'Amazing' },
  { key: 'good', emoji: MOOD_EMOJIS.good, label: 'Good' },
  { key: 'okay', emoji: MOOD_EMOJIS.okay, label: 'Okay' },
  { key: 'bad', emoji: MOOD_EMOJIS.bad, label: 'Bad' },
  { key: 'terrible', emoji: MOOD_EMOJIS.terrible, label: 'Terrible' },
];

const ENERGY_LEVELS = [1, 2, 3, 4, 5];

export default function MoodScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { entries, todayMood, streak, loadEntries, loadTodayMood, addEntry, deleteEntry } = useMoodStore();
  const [activeTab, setActiveTab] = useState<'checkin' | 'history'>('checkin');
  const [selectedMood, setSelectedMood] = useState<MoodType>('okay');
  const [energyLevel, setEnergyLevel] = useState(3);
  const [notes, setNotes] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  useEffect(() => {
    loadEntries();
    loadTodayMood();
  }, []);

  useEffect(() => {
    if (todayMood) {
      setSelectedMood(todayMood.mood);
      setEnergyLevel(todayMood.energy_level || 3);
      setNotes(todayMood.notes || '');
      setSelectedActivities(todayMood.activities || []);
    }
  }, [todayMood]);

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev =>
      prev.includes(activity) ? prev.filter(a => a !== activity) : [...prev, activity]
    );
  };

  const getMoodScore = (mood: MoodType): number => {
    const scores: Record<MoodType, number> = { amazing: 5, good: 4, okay: 3, bad: 2, terrible: 1 };
    return scores[mood];
  };

  const handleSave = async () => {
    try {
      await addEntry({
        date: new Date().toISOString().split('T')[0],
        mood: selectedMood,
        mood_score: getMoodScore(selectedMood),
        energy_level: energyLevel,
        notes: notes.trim() || undefined,
        activities: selectedActivities.length > 0 ? selectedActivities : undefined,
      });
      const msg = 'Your mood has been recorded!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Saved!', msg);
      loadTodayMood();
      loadEntries();
    } catch { }
  };

  const handleDelete = (id: number) => {
    const doDelete = async () => { await deleteEntry(id); loadEntries(); };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this mood entry?')) doDelete();
    } else {
      Alert.alert('Delete Entry', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Mood Tracker</Text>
        <View style={[styles.streakBadge, { backgroundColor: tc.cardBackground }]}>
          <Text style={{ fontSize: 14 }}>🔥</Text>
          <Text style={[styles.streakText, { color: tc.textPrimary }]}>{streak}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: tc.cardBackground }]}>
        {(['checkin', 'history'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { backgroundColor: tc.primary }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? '#FFF' : tc.textSecondary }]}>
              {tab === 'checkin' ? 'Check In' : 'History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'checkin' ? (
          <>
            {/* Mood Selector */}
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>How are you feeling?</Text>
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.moodBtn,
                    { backgroundColor: tc.cardBackground, borderColor: tc.border },
                    selectedMood === m.key && { backgroundColor: MOOD_COLORS[m.key] + '30', borderColor: MOOD_COLORS[m.key] },
                  ]}
                  onPress={() => setSelectedMood(m.key)}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, { color: selectedMood === m.key ? MOOD_COLORS[m.key] : tc.textSecondary }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Energy Level */}
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Energy Level</Text>
            <View style={styles.energyRow}>
              {ENERGY_LEVELS.map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.energyBtn,
                    { backgroundColor: tc.cardBackground, borderColor: tc.border },
                    energyLevel === level && { backgroundColor: tc.primary + '30', borderColor: tc.primary },
                  ]}
                  onPress={() => setEnergyLevel(level)}
                >
                  <Text style={[styles.energyText, { color: energyLevel === level ? tc.primary : tc.textSecondary }]}>
                    {'⚡'.repeat(level)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Activities */}
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>What did you do today?</Text>
            <View style={styles.activityGrid}>
              {MOOD_ACTIVITIES.map(act => (
                <TouchableOpacity
                  key={act}
                  style={[
                    styles.activityChip,
                    { backgroundColor: tc.cardBackground, borderColor: tc.border },
                    selectedActivities.includes(act) && { backgroundColor: tc.primary + '20', borderColor: tc.primary },
                  ]}
                  onPress={() => toggleActivity(act)}
                >
                  <Text style={[styles.activityText, { color: selectedActivities.includes(act) ? tc.primary : tc.textSecondary }]}>
                    {act}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Notes</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: tc.cardBackground, color: tc.textPrimary, borderColor: tc.border }]}
              placeholder="How was your day? (optional)"
              placeholderTextColor={tc.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />

            {/* Save Button */}
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: tc.primary }]} onPress={handleSave}>
              <MaterialIcons name="check" size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>{todayMood ? 'Update Mood' : 'Save Mood'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* History */}
            {entries.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="mood" size={64} color={tc.border} />
                <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No mood entries yet</Text>
              </View>
            ) : (
              entries.map(entry => (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.historyCard, { backgroundColor: tc.cardBackground }]}
                  onPress={() => handleDelete(entry.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.historyMoodBadge, { backgroundColor: MOOD_COLORS[entry.mood] + '20' }]}>
                    <Text style={styles.historyEmoji}>{MOOD_EMOJIS[entry.mood]}</Text>
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={[styles.historyDate, { color: tc.textPrimary }]}>
                      {format(new Date(entry.date), 'EEE, MMM d')}
                    </Text>
                    <Text style={[styles.historyMood, { color: MOOD_COLORS[entry.mood] }]}>
                      {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                      {entry.energy_level ? ` • ${'⚡'.repeat(entry.energy_level)}` : ''}
                    </Text>
                    {entry.notes && (
                      <Text style={[styles.historyNotes, { color: tc.textSecondary }]} numberOfLines={2}>
                        {entry.notes}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  scrollContent: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold as any,
    marginBottom: 12,
    marginTop: 8,
  },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  moodBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
    width: '18%',
  },
  moodEmoji: { fontSize: 28, marginBottom: 4 },
  moodLabel: { fontSize: 11, fontWeight: '600' as any },
  energyRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  energyBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  energyText: { fontSize: 14 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  activityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  activityText: { fontSize: typography.sizes.sm },
  notesInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: typography.sizes.md,
    height: 100,
    marginBottom: 20,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 20,
  },
  saveBtnText: { color: '#FFF', fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { marginTop: 16, fontSize: typography.sizes.md, textAlign: 'center' },
  historyCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 14,
    alignItems: 'center',
  },
  historyMoodBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEmoji: { fontSize: 24 },
  historyContent: { flex: 1 },
  historyDate: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any },
  historyMood: { fontSize: typography.sizes.sm, marginTop: 2 },
  historyNotes: { fontSize: typography.sizes.xs, marginTop: 4 },
});
