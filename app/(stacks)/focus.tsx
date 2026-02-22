import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useClockStore } from '../../src/stores/useClockStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useTodoStore } from '../../src/stores/useTodoStore';
import { typography } from '../../src/theme/typography';

const SCREEN_W = Dimensions.get('window').width;
const CIRCLE_SIZE = SCREEN_W * 0.65;

const PRESETS = [
  { label: 'Pomodoro', work: 25, break_: 5 },
  { label: 'Long Focus', work: 50, break_: 10 },
  { label: 'Short Burst', work: 15, break_: 3 },
];

export default function FocusScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { sessions, loadSessions, startSession, endSession, todayFocusMinutes, loadTodayFocus } = useClockStore();
  const { todos, loadTodos } = useTodoStore();

  const [preset, setPreset] = useState(PRESETS[0]);
  const [isWorking, setIsWorking] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [linkedTodo, setLinkedTodo] = useState<number | null>(null);
  const [showTodos, setShowTodos] = useState(false);
  const [tab, setTab] = useState<'timer' | 'history'>('timer');
  const intervalRef = useRef<any>(null);
  const sessionIdRef = useRef<number | null>(null);

  useEffect(() => { loadSessions(); loadTodayFocus(); loadTodos(); }, []);

  // Keep ref in sync with state for closure-safe access
  useEffect(() => { sessionIdRef.current = currentSessionId; }, [currentSessionId]);

  const selectPreset = (p: typeof PRESETS[0]) => {
    if (running) return;
    setPreset(p);
    setTotalSeconds(p.work * 60);
    setRemaining(p.work * 60);
    setIsWorking(true);
  };

  const startFocus = async () => {
    setRunning(true);
    if (!currentSessionId && isWorking) {
      try {
        const session = await startSession({
          session_type: 'pomodoro',
          duration_minutes: preset.work,
          linked_todo_id: linkedTodo || undefined,
        });
        setCurrentSessionId(session.id);
      } catch { }
    }
  };

  const pauseFocus = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
  };

  const resetFocus = async () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    const sid = sessionIdRef.current;
    if (sid) {
      const elapsed = totalSeconds - remaining;
      await endSession(sid, elapsed, 'cancelled');
      setCurrentSessionId(null);
    }
    setRemaining(preset.work * 60);
    setTotalSeconds(preset.work * 60);
    setIsWorking(true);
  };

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [running]);

  const handlePhaseComplete = async () => {
    setRunning(false);
    if (isWorking) {
      // Work phase done — use ref to get fresh session ID
      const sid = sessionIdRef.current;
      if (sid) {
        await endSession(sid, preset.work * 60, 'completed');
        setCurrentSessionId(null);
        loadTodayFocus();
      }
      setPomodoroCount(c => c + 1);
      const msg = 'Work session complete! Time for a break.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('🎉 Done!', msg);
      setIsWorking(false);
      setTotalSeconds(preset.break_ * 60);
      setRemaining(preset.break_ * 60);
    } else {
      // Break done
      const msg = 'Break over! Ready for another round?';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('☕ Break Over', msg);
      setIsWorking(true);
      setTotalSeconds(preset.work * 60);
      setRemaining(preset.work * 60);
    }
  };

  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  const phaseColor = isWorking ? tc.primary : tc.success;
  const accentHighlight = isWorking ? tc.primary + '20' : tc.success + '20';

  const pendingTodos = todos.filter(t => t.status !== 'completed');
  const recentSessions = sessions.slice(0, 20);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Focus Mode</Text>
        <View style={styles.headerRight}>
          <MaterialIcons name="local-fire-department" size={20} color={tc.primary} />
          <Text style={[styles.todayMin, { color: tc.textPrimary }]}>{todayFocusMinutes}m</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['timer', 'history'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && { backgroundColor: phaseColor + '18' }]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, { color: tab === t ? phaseColor : tc.textSecondary }]}>
              {t === 'timer' ? 'Timer' : 'History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tab === 'timer' ? (
          <>
            {/* Presets */}
            <View style={styles.presetRow}>
              {PRESETS.map(p => (
                <TouchableOpacity
                  key={p.label}
                  style={[
                    styles.presetChip,
                    { borderColor: tc.border },
                    preset.label === p.label && { backgroundColor: phaseColor, borderColor: phaseColor },
                  ]}
                  onPress={() => selectPreset(p)}
                >
                  <Text style={[
                    styles.presetText,
                    { color: preset.label === p.label ? '#FFF' : tc.textSecondary },
                  ]}>{p.label}</Text>
                  <Text style={[
                    styles.presetDuration,
                    { color: preset.label === p.label ? '#FFF' : tc.textSecondary },
                  ]}>{p.work}/{p.break_}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Timer Circle */}
            <View style={styles.timerContainer}>
              <View style={[styles.timerOuter, { borderColor: tc.border }]}>
                {/* Progress arc (simple ring) */}
                <View style={[
                  styles.progressRing,
                  {
                    borderColor: phaseColor,
                    borderWidth: 6,
                    opacity: 0.2,
                  },
                ]} />
                <View style={[
                  styles.progressRing,
                  {
                    borderColor: phaseColor,
                    borderWidth: 6,
                    borderRightColor: 'transparent',
                    borderBottomColor: progress > 0.25 ? phaseColor : 'transparent',
                    borderLeftColor: progress > 0.5 ? phaseColor : 'transparent',
                    borderTopColor: progress > 0.75 ? phaseColor : 'transparent',
                    transform: [{ rotate: '-90deg' }],
                  },
                ]} />
                <View style={[styles.timerInner, { backgroundColor: tc.background }]}>
                  <Text style={[styles.phaseLabel, { color: phaseColor }]}>
                    {isWorking ? 'FOCUS' : 'BREAK'}
                  </Text>
                  <Text style={[styles.timerText, { color: tc.textPrimary }]}>
                    {pad(minutes)}:{pad(seconds)}
                  </Text>
                  <Text style={[styles.pomCount, { color: tc.textSecondary }]}>
                    🍅 × {pomodoroCount}
                  </Text>
                </View>
              </View>
            </View>

            {/* Controls */}
            <View style={styles.controlRow}>
              {running ? (
                <>
                  <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: tc.cardBackground }]} onPress={resetFocus}>
                    <MaterialIcons name="stop" size={28} color={tc.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.mainBtn, { backgroundColor: phaseColor }]} onPress={pauseFocus}>
                    <MaterialIcons name="pause" size={36} color="#FFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {remaining < totalSeconds && (
                    <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: tc.cardBackground }]} onPress={resetFocus}>
                      <MaterialIcons name="replay" size={24} color={tc.textPrimary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.mainBtn, { backgroundColor: phaseColor }]} onPress={startFocus}>
                    <MaterialIcons name="play-arrow" size={36} color="#FFF" />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Link to Todo */}
            <TouchableOpacity
              style={[styles.linkTodo, { backgroundColor: tc.cardBackground }]}
              onPress={() => setShowTodos(!showTodos)}
            >
              <MaterialIcons name="link" size={18} color={tc.textSecondary} />
              <Text style={[styles.linkTodoText, { color: tc.textSecondary }]}>
                {linkedTodo
                  ? `Linked: ${pendingTodos.find(t => t.id === linkedTodo)?.title || 'Task'}`
                  : 'Link to a todo (optional)'}
              </Text>
              <MaterialIcons name={showTodos ? 'expand-less' : 'expand-more'} size={20} color={tc.textSecondary} />
            </TouchableOpacity>

            {showTodos && (
              <View style={[styles.todoList, { backgroundColor: tc.cardBackground }]}>
                <TouchableOpacity
                  style={[styles.todoItem, linkedTodo === null && { backgroundColor: phaseColor + '10' }]}
                  onPress={() => { setLinkedTodo(null); setShowTodos(false); }}
                >
                  <Text style={[styles.todoItemText, { color: tc.textSecondary }]}>None</Text>
                </TouchableOpacity>
                {pendingTodos.slice(0, 10).map(todo => (
                  <TouchableOpacity
                    key={todo.id}
                    style={[styles.todoItem, linkedTodo === todo.id && { backgroundColor: phaseColor + '10' }]}
                    onPress={() => { setLinkedTodo(todo.id); setShowTodos(false); }}
                  >
                    <Text style={[styles.todoItemText, { color: tc.textPrimary }]} numberOfLines={1}>{todo.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
                <Text style={[styles.statValue, { color: phaseColor }]}>{pomodoroCount}</Text>
                <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Sessions</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
                <Text style={[styles.statValue, { color: phaseColor }]}>{pomodoroCount * preset.work}</Text>
                <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Minutes</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: tc.cardBackground }]}>
                <Text style={[styles.statValue, { color: phaseColor }]}>{todayFocusMinutes}</Text>
                <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Today Total</Text>
              </View>
            </View>
          </>
        ) : (
          /* History Tab */
          <>
            {recentSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="history" size={48} color={tc.border} />
                <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No sessions yet</Text>
              </View>
            ) : (
              recentSessions.map(session => (
                <View key={session.id} style={[styles.sessionCard, { backgroundColor: tc.cardBackground }]}>
                  <View style={[
                    styles.sessionStatus,
                    { backgroundColor: session.status === 'completed' ? tc.success : session.status === 'cancelled' ? tc.danger : tc.warning },
                  ]} />
                  <View style={styles.sessionInfo}>
                    <Text style={[styles.sessionType, { color: tc.textPrimary }]}>
                      {session.session_type === 'pomodoro' ? '🍅 Pomodoro' : '⏱️ Custom'} · {session.duration_minutes}min
                    </Text>
                    <Text style={[styles.sessionDate, { color: tc.textSecondary }]}>
                      {format(new Date(session.started_at), 'MMM d, h:mm a')}
                    </Text>
                  </View>
                  <View style={styles.sessionRight}>
                    <Text style={[styles.sessionDuration, { color: tc.textPrimary }]}>
                      {Math.floor((session.actual_seconds || 0) / 60)}m
                    </Text>
                    <Text style={[styles.sessionStatusText, {
                      color: session.status === 'completed' ? tc.success : session.status === 'cancelled' ? tc.danger : tc.warning
                    }]}>
                      {session.status}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 30, paddingBottom: 8,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  todayMin: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold as any },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, gap: 8, marginBottom: 8 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  presetChip: {
    flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center',
  },
  presetText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  presetDuration: { fontSize: typography.sizes.xs, marginTop: 2 },
  timerContainer: { alignItems: 'center', marginVertical: 16 },
  timerOuter: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute', width: CIRCLE_SIZE - 16, height: CIRCLE_SIZE - 16,
    borderRadius: (CIRCLE_SIZE - 16) / 2,
  },
  timerInner: {
    width: CIRCLE_SIZE - 32, height: CIRCLE_SIZE - 32, borderRadius: (CIRCLE_SIZE - 32) / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  phaseLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold as any, letterSpacing: 2, marginBottom: 4 },
  timerText: { fontSize: 52, fontWeight: '800', fontVariant: ['tabular-nums'] },
  pomCount: { marginTop: 4, fontSize: typography.sizes.md },
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginVertical: 16 },
  ctrlBtn: {
    width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  mainBtn: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  linkTodo: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16,
    paddingVertical: 12, borderRadius: 12, marginBottom: 4,
  },
  linkTodoText: { flex: 1, fontSize: typography.sizes.sm },
  todoList: { borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  todoItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.05)' },
  todoItemText: { fontSize: typography.sizes.sm },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statCard: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center' },
  statValue: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any },
  statLabel: { fontSize: typography.sizes.xs, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12, fontSize: typography.sizes.md },
  sessionCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10 },
  sessionStatus: { width: 4, height: 36, borderRadius: 2, marginRight: 12 },
  sessionInfo: { flex: 1 },
  sessionType: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  sessionDate: { fontSize: typography.sizes.xs, marginTop: 2 },
  sessionRight: { alignItems: 'flex-end' },
  sessionDuration: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
  sessionStatusText: { fontSize: typography.sizes.xs, marginTop: 2, textTransform: 'capitalize' },
});
