import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { useClockStore } from '../../src/stores/useClockStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { typography } from '../../src/theme/typography';
import { DAY_LABELS, TimerMode } from '../../src/types/clock.types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/* ── Alarm tone options ── */
const ALARM_TONES = [
  { id: 'default', name: 'Default' },
  { id: 'chime', name: 'Chime' },
  { id: 'bell', name: 'Bell' },
  { id: 'digital', name: 'Digital' },
  { id: 'gentle', name: 'Gentle Rise' },
  { id: 'birds', name: 'Morning Birds' },
  { id: 'radar', name: 'Radar' },
  { id: 'vibrate', name: 'Vibrate Only' },
];

const ITEM_H = 44;
const VISIBLE_ITEMS = 5;
const PICKER_H = ITEM_H * VISIBLE_ITEMS;

/* ── Scroll Drum Picker ── */
const ScrollPicker = React.memo(({ items, selected, onChange, tc }: {
  items: { label: string; value: number }[];
  selected: number;
  onChange: (v: number) => void;
  tc: any;
}) => {
  const flatRef = useRef<FlatList>(null);
  const scrolling = useRef(false);

  const dataWithPad = React.useMemo(() => {
    const pad = Math.floor(VISIBLE_ITEMS / 2);
    const top = Array.from({ length: pad }, (_, i) => ({ label: '', value: -i - 1, empty: true }));
    const bot = Array.from({ length: pad }, (_, i) => ({ label: '', value: -100 - i, empty: true }));
    return [...top, ...items.map(it => ({ ...it, empty: false })), ...bot];
  }, [items]);

  const initialIdx = items.findIndex(it => it.value === selected);

  useEffect(() => {
    if (!scrolling.current && flatRef.current && initialIdx >= 0) {
      setTimeout(() => flatRef.current?.scrollToIndex({ index: initialIdx, animated: false }), 50);
    }
  }, [selected]);

  const onMomentumEnd = (e: any) => {
    scrolling.current = false;
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    onChange(items[clamped].value);
  };

  return (
    <View style={{ height: PICKER_H, width: 80, overflow: 'hidden' }}>
      {/* Selection highlight */}
      <View style={{
        position: 'absolute',
        top: ITEM_H * Math.floor(VISIBLE_ITEMS / 2),
        left: 4, right: 4,
        height: ITEM_H,
        backgroundColor: tc.primary + '20',
        borderRadius: 10,
        zIndex: 0,
      }} />
      <FlatList
        ref={flatRef}
        data={dataWithPad}
        keyExtractor={(it) => String(it.value)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onScrollBeginDrag={() => { scrolling.current = true; }}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
        initialScrollIndex={Math.max(0, initialIdx)}
        renderItem={({ item }) => (
          <View style={{ height: ITEM_H, justifyContent: 'center', alignItems: 'center' }}>
            {!item.empty && (
              <Text style={{
                fontSize: item.value === selected ? 28 : 20,
                fontWeight: item.value === selected ? '700' : '400',
                color: item.value === selected ? tc.textPrimary : tc.textSecondary + '60',
                fontVariant: ['tabular-nums'],
              }}>
                {item.label}
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
});

/* ── Flip Digit with animation ── */
const FlipDigit = React.memo(({ value, prevValue, color, size }: { value: string; prevValue: string; color: string; size: 'normal' | 'fullscreen' }) => {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const prevRef = useRef(prevValue);
  const digitW = size === 'fullscreen' ? Math.min(SCREEN_H / 4, 120) : Math.min((SCREEN_W - 100) / 6, 60);
  const digitH = digitW * 1.5;
  const fontSize = digitW * 0.8;
  const bgColor = '#1A1A1A';
  const textColor = color;

  useEffect(() => {
    if (value !== prevRef.current) {
      flipAnim.setValue(0);
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      prevRef.current = value;
    }
  }, [value]);

  // Top half flips away (old value)
  const topFlipRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-90deg'],
  });

  // Bottom half flips in (new value)
  const bottomFlipRotate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['90deg', '90deg', '0deg'],
  });

  const topFlipOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const bottomFlipOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={[{ width: digitW, height: digitH, marginHorizontal: size === 'fullscreen' ? 4 : 2 }]}>
      {/* Static top - new value (revealed when flip card goes) */}
      <View style={[dStyles.halfStatic, dStyles.topHalf, { backgroundColor: bgColor, borderTopLeftRadius: digitW * 0.15, borderTopRightRadius: digitW * 0.15 }]}>
        <Text style={[dStyles.digitText, { fontSize, lineHeight: digitH, color: textColor }]}>{value}</Text>
      </View>

      {/* Static bottom - old value (behind flip card) */}
      <View style={[dStyles.halfStatic, dStyles.bottomHalf, { backgroundColor: bgColor, opacity: 0.92, borderBottomLeftRadius: digitW * 0.15, borderBottomRightRadius: digitW * 0.15 }]}>
        <Text style={[dStyles.digitText, { fontSize, lineHeight: digitH, color: textColor, top: -digitH / 2 }]}>{prevValue}</Text>
      </View>

      {/* Animated top flap (old value flipping away) */}
      <Animated.View style={[
        dStyles.halfStatic, dStyles.topHalf,
        {
          backgroundColor: bgColor,
          borderTopLeftRadius: digitW * 0.15,
          borderTopRightRadius: digitW * 0.15,
          transform: [{ perspective: 300 }, { rotateX: topFlipRotate }],
          opacity: topFlipOpacity,
          zIndex: 3,
          backfaceVisibility: 'hidden',
        },
      ]}>
        <Text style={[dStyles.digitText, { fontSize, lineHeight: digitH, color: textColor }]}>{prevValue}</Text>
      </Animated.View>

      {/* Animated bottom flap (new value flipping in) */}
      <Animated.View style={[
        dStyles.halfStatic, dStyles.bottomHalf,
        {
          backgroundColor: bgColor,
          opacity: bottomFlipOpacity,
          borderBottomLeftRadius: digitW * 0.15,
          borderBottomRightRadius: digitW * 0.15,
          transform: [{ perspective: 300 }, { rotateX: bottomFlipRotate }],
          zIndex: 2,
          backfaceVisibility: 'hidden',
        },
      ]}>
        <Text style={[dStyles.digitText, { fontSize, lineHeight: digitH, color: textColor, top: -digitH / 2 }]}>{value}</Text>
      </Animated.View>

      {/* Divider line */}
      <View style={[dStyles.divider, { top: digitH / 2 - 0.5 }]} />
    </View>
  );
});

const dStyles = StyleSheet.create({
  halfStatic: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  topHalf: {
    top: 0,
    height: '50%',
  },
  bottomHalf: {
    bottom: 0,
    height: '50%',
  },
  digitText: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  divider: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 10,
  },
});

/* ── Separator ── */
const Sep = ({ color, size }: { color: string; size: 'normal' | 'fullscreen' }) => {
  const dotSize = size === 'fullscreen' ? 12 : 8;
  return (
    <View style={[styles.sepContainer, { width: size === 'fullscreen' ? 30 : 20, gap: size === 'fullscreen' ? 14 : 8 }]}>
      <View style={[styles.sepDot, { backgroundColor: color, width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
      <View style={[styles.sepDot, { backgroundColor: color, width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
    </View>
  );
};

/* ── Mode badge ── */
const ModeTab = ({ mode, active, onPress, tc }: { mode: TimerMode; active: boolean; onPress: () => void; tc: any }) => {
  const icons: Record<TimerMode, string> = { clock: 'schedule', timer: 'hourglass-top', stopwatch: 'timer', alarm: 'alarm' };
  return (
    <TouchableOpacity
      style={[styles.modeTab, active && { backgroundColor: tc.primary + '20' }]}
      onPress={onPress}
    >
      <MaterialIcons name={icons[mode] as any} size={20} color={active ? tc.primary : tc.textSecondary} />
      <Text style={[styles.modeTabText, { color: active ? tc.primary : tc.textSecondary }]}>
        {mode.charAt(0).toUpperCase() + mode.slice(1)}
      </Text>
    </TouchableOpacity>
  );
};

export default function ClockScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { alarms, loadAlarms, addAlarm, updateAlarm, deleteAlarm, toggleAlarm } = useClockStore();

  const [mode, setMode] = useState<TimerMode>('clock');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef<any>(null);

  // Clock
  const [now, setNow] = useState(new Date());
  const [prevDigits, setPrevDigits] = useState<string[]>(['0', '0', '0', '0', '0', '0']);

  // Timer
  const [timerHrs, setTimerHrs] = useState(0);
  const [timerMins, setTimerMins] = useState(5);
  const [timerSecs, setTimerSecs] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);

  // Stopwatch
  const [swElapsed, setSwElapsed] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const swRef = useRef<any>(null);
  const swStart = useRef(0);

  // Alarm modal
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [alarmHour, setAlarmHour] = useState(7);
  const [alarmMinute, setAlarmMinute] = useState(0);
  const [alarmLabel, setAlarmLabel] = useState('');
  const [alarmDays, setAlarmDays] = useState<number[]>([]);
  const [alarmTone, setAlarmTone] = useState('default');

  const hourItems = React.useMemo(() => Array.from({ length: 24 }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i })), []);
  const minuteItems = React.useMemo(() => Array.from({ length: 60 }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i })), []);

  useEffect(() => { loadAlarms(); }, []);

  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  /* ── Timer logic ── */
  const startTimer = () => {
    const total = timerHrs * 3600 + timerMins * 60 + timerSecs;
    if (total <= 0) return;
    setTimerRemaining(total);
    setTimerRunning(true);
  };

  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            const msg = "Time's up!";
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Timer', msg);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [timerRunning]);

  const resetTimer = () => { setTimerRunning(false); setTimerRemaining(0); clearInterval(timerRef.current); };

  /* ── Stopwatch logic ── */
  const startStopwatch = () => {
    swStart.current = Date.now() - swElapsed;
    setSwRunning(true);
    swRef.current = setInterval(() => {
      setSwElapsed(Date.now() - swStart.current);
    }, 50);
  };

  const stopStopwatch = () => { clearInterval(swRef.current); setSwRunning(false); };

  const resetStopwatch = () => { clearInterval(swRef.current); setSwRunning(false); setSwElapsed(0); setLaps([]); };

  const addLap = () => { setLaps(prev => [swElapsed, ...prev]); };

  /* ── Alarms ── */
  const handleSaveAlarm = async () => {
    await addAlarm({
      hour: alarmHour,
      minute: alarmMinute,
      label: alarmLabel.trim() || undefined,
      repeat_days: alarmDays,
      vibrate: true,
      sound_name: ALARM_TONES.find(t => t.id === alarmTone)?.name || 'Default',
    });
    setShowAlarmModal(false);
    setAlarmLabel('');
    setAlarmHour(7);
    setAlarmMinute(0);
    setAlarmDays([]);
    setAlarmTone('default');
  };

  const handleDeleteAlarm = (id: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this alarm?')) deleteAlarm(id);
    } else {
      Alert.alert('Delete', 'Delete this alarm?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAlarm(id) },
      ]);
    }
  };

  /* ── Helpers ── */
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatMs = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}` : `${pad(m)}:${pad(s)}.${pad(cs)}`;
  };

  const getDigits = useCallback((): string[] => {
    if (mode === 'clock') {
      const h = pad(now.getHours());
      const m = pad(now.getMinutes());
      const s = pad(now.getSeconds());
      return [h[0], h[1], m[0], m[1], s[0], s[1]];
    }
    if (mode === 'timer') {
      const h = Math.floor(timerRemaining / 3600);
      const m = Math.floor((timerRemaining % 3600) / 60);
      const s = timerRemaining % 60;
      return [pad(h)[0], pad(h)[1], pad(m)[0], pad(m)[1], pad(s)[0], pad(s)[1]];
    }
    if (mode === 'stopwatch') {
      const totalSecs = Math.floor(swElapsed / 1000);
      const m = Math.floor(totalSecs / 60);
      const s = totalSecs % 60;
      const cs = Math.floor((swElapsed % 1000) / 10);
      return [pad(m)[0], pad(m)[1], pad(s)[0], pad(s)[1], pad(cs)[0], pad(cs)[1]];
    }
    return ['0', '0', '0', '0', '0', '0'];
  }, [mode, now, timerRemaining, swElapsed]);

  const digitColor = tc.primary;
  const digits = getDigits();

  // Track previous digits for flip animation
  const prevDigitsRef = useRef(digits);
  useEffect(() => {
    const timer = setTimeout(() => {
      prevDigitsRef.current = digits;
    }, 350); // slightly after animation duration
    return () => clearTimeout(timer);
  }, [digits]);

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    setShowControls(true);
  };

  const handleFullscreenTap = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    if (isFullscreen) {
      // Auto-hide controls after 3 seconds
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
      return () => { if (controlsTimeout.current) clearTimeout(controlsTimeout.current); };
    }
  }, [isFullscreen]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden={isFullscreen} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Clock</Text>
        {mode !== 'alarm' ? (
          <TouchableOpacity onPress={toggleFullscreen} style={styles.backBtn}>
            <MaterialIcons name="fullscreen" size={24} color={tc.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Mode Tabs */}
      <View style={styles.modeRow}>
        {(['clock', 'timer', 'stopwatch', 'alarm'] as TimerMode[]).map(m => (
          <ModeTab key={m} mode={m} active={mode === m} onPress={() => setMode(m)} tc={tc} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {mode !== 'alarm' && (
          <View style={styles.clockDisplay}>
            <View style={styles.digitRow}>
              <FlipDigit value={digits[0]} prevValue={prevDigitsRef.current[0]} color={digitColor} size="normal" />
              <FlipDigit value={digits[1]} prevValue={prevDigitsRef.current[1]} color={digitColor} size="normal" />
              <Sep color={digitColor} size="normal" />
              <FlipDigit value={digits[2]} prevValue={prevDigitsRef.current[2]} color={digitColor} size="normal" />
              <FlipDigit value={digits[3]} prevValue={prevDigitsRef.current[3]} color={digitColor} size="normal" />
              <Sep color={digitColor} size="normal" />
              <FlipDigit value={digits[4]} prevValue={prevDigitsRef.current[4]} color={digitColor} size="normal" />
              <FlipDigit value={digits[5]} prevValue={prevDigitsRef.current[5]} color={digitColor} size="normal" />
            </View>
            {mode === 'clock' && (
              <Text style={[styles.dateText, { color: tc.textSecondary }]}>
                {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            )}
          </View>
        )}

        {/* Timer Controls */}
        {mode === 'timer' && (
          <View style={styles.controlSection}>
            {!timerRunning && timerRemaining === 0 && (
              <View style={styles.timerSetRow}>
                {[
                  { label: 'Hrs', value: timerHrs, set: setTimerHrs, max: 23 },
                  { label: 'Min', value: timerMins, set: setTimerMins, max: 59 },
                  { label: 'Sec', value: timerSecs, set: setTimerSecs, max: 59 },
                ].map(item => (
                  <View key={item.label} style={styles.timerInput}>
                    <TouchableOpacity onPress={() => item.set(v => Math.min(item.max, v + 1))}>
                      <MaterialIcons name="keyboard-arrow-up" size={28} color={tc.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.timerValue, { color: tc.textPrimary }]}>{pad(item.value)}</Text>
                    <TouchableOpacity onPress={() => item.set(v => Math.max(0, v - 1))}>
                      <MaterialIcons name="keyboard-arrow-down" size={28} color={tc.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.timerLabel, { color: tc.textSecondary }]}>{item.label}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.btnRow}>
              {timerRunning ? (
                <>
                  <TouchableOpacity style={[styles.circleBtn, { backgroundColor: tc.danger }]} onPress={() => { setTimerRunning(false); clearInterval(timerRef.current); }}>
                    <MaterialIcons name="pause" size={28} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.circleBtn, { backgroundColor: tc.cardBackground }]} onPress={resetTimer}>
                    <MaterialIcons name="stop" size={28} color={tc.textPrimary} />
                  </TouchableOpacity>
                </>
              ) : timerRemaining > 0 ? (
                <>
                  <TouchableOpacity style={[styles.circleBtn, { backgroundColor: tc.primary }]} onPress={() => setTimerRunning(true)}>
                    <MaterialIcons name="play-arrow" size={28} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.circleBtn, { backgroundColor: tc.cardBackground }]} onPress={resetTimer}>
                    <MaterialIcons name="stop" size={28} color={tc.textPrimary} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[styles.circleBtn, { backgroundColor: tc.primary }]} onPress={startTimer}>
                  <MaterialIcons name="play-arrow" size={28} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Stopwatch Controls */}
        {mode === 'stopwatch' && (
          <View style={styles.controlSection}>
            <View style={styles.btnRow}>
              {swRunning ? (
                <>
                  <TouchableOpacity style={[styles.circleBtn, { backgroundColor: tc.cardBackground }]} onPress={addLap}>
                    <MaterialIcons name="flag" size={24} color={tc.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.circleBtn, { backgroundColor: tc.danger }]} onPress={stopStopwatch}>
                    <MaterialIcons name="pause" size={28} color="#FFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={[styles.circleBtn, { backgroundColor: tc.primary }]} onPress={startStopwatch}>
                    <MaterialIcons name="play-arrow" size={28} color="#FFF" />
                  </TouchableOpacity>
                  {swElapsed > 0 && (
                    <TouchableOpacity style={[styles.circleBtn, { backgroundColor: tc.cardBackground }]} onPress={resetStopwatch}>
                      <MaterialIcons name="replay" size={24} color={tc.textPrimary} />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
            {laps.length > 0 && (
              <View style={[styles.lapSection, { borderColor: tc.border }]}>
                <Text style={[styles.lapHeader, { color: tc.textSecondary }]}>Laps</Text>
                {laps.map((lap, i) => (
                  <View key={i} style={[styles.lapRow, { borderColor: tc.border }]}>
                    <Text style={[styles.lapNum, { color: tc.textSecondary }]}>Lap {laps.length - i}</Text>
                    <Text style={[styles.lapTime, { color: tc.textPrimary }]}>{formatMs(lap)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Alarm List */}
        {mode === 'alarm' && (
          <View style={styles.alarmSection}>
            {alarms.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="alarm" size={56} color={tc.border} />
                <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No alarms</Text>
              </View>
            ) : (
              alarms.map(alarm => (
                <View key={alarm.id} style={[styles.alarmCard, { backgroundColor: tc.cardBackground }]}>
                  <View style={styles.alarmLeft}>
                    <Text style={[styles.alarmTime, { color: alarm.is_enabled ? tc.textPrimary : tc.textSecondary }]}>
                      {pad(alarm.hour)}:{pad(alarm.minute)}
                    </Text>
                    {alarm.label && (
                      <Text style={[styles.alarmLabel, { color: tc.textSecondary }]}>{alarm.label}</Text>
                    )}
                    {alarm.sound_name && alarm.sound_name !== 'Default' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <MaterialIcons name="music-note" size={12} color={tc.textSecondary} />
                        <Text style={[styles.alarmLabel, { color: tc.textSecondary, marginTop: 0 }]}>{alarm.sound_name}</Text>
                      </View>
                    )}
                    {alarm.repeat_days && alarm.repeat_days.length > 0 && (
                      <View style={styles.dayRow}>
                        {DAY_LABELS.map((d, i) => (
                          <Text
                            key={d}
                            style={[
                              styles.dayLabel,
                              { color: alarm.repeat_days!.includes(i) ? tc.primary : tc.border },
                            ]}
                          >
                            {d}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={styles.alarmRight}>
                    <TouchableOpacity
                      style={[styles.toggleBtn, { backgroundColor: alarm.is_enabled ? tc.primary : tc.border }]}
                      onPress={() => toggleAlarm(alarm.id)}
                    >
                      <View style={[
                        styles.toggleKnob,
                        alarm.is_enabled ? { transform: [{ translateX: 18 }] } : {},
                      ]} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteAlarm(alarm.id)} hitSlop={8}>
                      <MaterialIcons name="delete-outline" size={18} color={tc.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity
              style={[styles.addAlarmBtn, { backgroundColor: tc.primary }]}
              onPress={() => setShowAlarmModal(true)}
            >
              <MaterialIcons name="add-alarm" size={22} color="#FFF" />
              <Text style={styles.addAlarmBtnText}>Add Alarm</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fullscreen Clock Modal */}
      <Modal visible={isFullscreen} animationType="fade" supportedOrientations={['portrait', 'landscape']}>
        <TouchableWithoutFeedback onPress={handleFullscreenTap}>
          <View style={[styles.fullscreenContainer, { backgroundColor: tc.background }]}>
            <StatusBar hidden />
            <View style={styles.fullscreenDigitRow}>
              <FlipDigit value={digits[0]} prevValue={prevDigitsRef.current[0]} color={digitColor} size="fullscreen" />
              <FlipDigit value={digits[1]} prevValue={prevDigitsRef.current[1]} color={digitColor} size="fullscreen" />
              <Sep color={digitColor} size="fullscreen" />
              <FlipDigit value={digits[2]} prevValue={prevDigitsRef.current[2]} color={digitColor} size="fullscreen" />
              <FlipDigit value={digits[3]} prevValue={prevDigitsRef.current[3]} color={digitColor} size="fullscreen" />
              <Sep color={digitColor} size="fullscreen" />
              <FlipDigit value={digits[4]} prevValue={prevDigitsRef.current[4]} color={digitColor} size="fullscreen" />
              <FlipDigit value={digits[5]} prevValue={prevDigitsRef.current[5]} color={digitColor} size="fullscreen" />
            </View>
            {mode === 'clock' && (
              <Text style={[styles.fullscreenDate, { color: tc.textSecondary }]}>
                {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            )}
            {showControls && (
              <TouchableOpacity style={[styles.exitFullscreenBtn, { backgroundColor: tc.cardBackground }]} onPress={toggleFullscreen}>
                <MaterialIcons name="fullscreen-exit" size={28} color={tc.textPrimary} />
                <Text style={[styles.exitFullscreenText, { color: tc.textPrimary }]}>Tap to exit</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Alarm Create Modal */}
      <Modal visible={showAlarmModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: tc.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.textPrimary }]}>New Alarm</Text>
              <TouchableOpacity onPress={() => setShowAlarmModal(false)}>
                <MaterialIcons name="close" size={24} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Time Picker - Scroll Drums */}
            <View style={styles.timePickerRow}>
              <ScrollPicker items={hourItems} selected={alarmHour} onChange={setAlarmHour} tc={tc} />
              <Text style={[styles.timeSep, { color: tc.textPrimary }]}>:</Text>
              <ScrollPicker items={minuteItems} selected={alarmMinute} onChange={setAlarmMinute} tc={tc} />
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: tc.background, color: tc.textPrimary, borderColor: tc.border }]}
              placeholder="Label (optional)"
              placeholderTextColor={tc.textSecondary}
              value={alarmLabel}
              onChangeText={setAlarmLabel}
            />

            {/* Alarm Tone Selector */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Alarm Tone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {ALARM_TONES.map(tone => (
                  <TouchableOpacity
                    key={tone.id}
                    style={[
                      styles.tonePill,
                      { borderColor: tc.border },
                      alarmTone === tone.id && { backgroundColor: tc.primary, borderColor: tc.primary },
                    ]}
                    onPress={() => setAlarmTone(tone.id)}
                  >
                    <MaterialIcons
                      name={tone.id === 'vibrate' ? 'vibration' : 'music-note'}
                      size={14}
                      color={alarmTone === tone.id ? '#FFF' : tc.textSecondary}
                    />
                    <Text style={[
                      styles.toneText,
                      { color: alarmTone === tone.id ? '#FFF' : tc.textSecondary },
                    ]}>{tone.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Day selector */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Repeat</Text>
            <View style={styles.daySelector}>
              {DAY_LABELS.map((d, i) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dayBtn,
                    { borderColor: tc.border },
                    alarmDays.includes(i) && { backgroundColor: tc.primary, borderColor: tc.primary },
                  ]}
                  onPress={() => setAlarmDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                >
                  <Text style={[styles.dayBtnText, { color: alarmDays.includes(i) ? '#FFF' : tc.textSecondary }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: tc.primary }]} onPress={handleSaveAlarm}>
              <Text style={styles.saveBtnText}>Save Alarm</Text>
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
    paddingHorizontal: 20, paddingTop: 30, paddingBottom: 8,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any },
  modeRow: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 6, marginBottom: 8,
  },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: 12,
  },
  modeTabText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold as any },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  clockDisplay: { alignItems: 'center', paddingVertical: 30 },
  digitRow: { flexDirection: 'row', alignItems: 'center' },
  sepContainer: { justifyContent: 'center', alignItems: 'center' },
  sepDot: {},
  dateText: { marginTop: 16, fontSize: typography.sizes.md },

  /* Fullscreen styles */
  fullscreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenDigitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullscreenDate: {
    marginTop: 24,
    fontSize: typography.sizes.lg,
    letterSpacing: 1,
  },
  exitFullscreenBtn: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    opacity: 0.85,
  },
  exitFullscreenText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
  },
  controlSection: { alignItems: 'center' },
  timerSetRow: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  timerInput: { alignItems: 'center' },
  timerValue: { fontSize: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
  timerLabel: { fontSize: typography.sizes.xs, marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 20, marginTop: 8 },
  circleBtn: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  lapSection: { width: '100%', marginTop: 24, borderTopWidth: 1, paddingTop: 12 },
  lapHeader: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, marginBottom: 8 },
  lapRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  lapNum: { fontSize: typography.sizes.sm },
  lapTime: { fontSize: typography.sizes.sm, fontVariant: ['tabular-nums'] },
  alarmSection: { paddingTop: 16 },
  alarmCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  alarmLeft: { flex: 1 },
  alarmTime: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  alarmLabel: { fontSize: typography.sizes.sm, marginTop: 2 },
  dayRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  dayLabel: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold as any },
  alarmRight: { alignItems: 'flex-end', gap: 12 },
  toggleBtn: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3 },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
  addAlarmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 8,
  },
  addAlarmBtnText: { color: '#FFF', fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12, fontSize: typography.sizes.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16, height: PICKER_H },
  timeSep: { fontSize: 32, fontWeight: '700' },
  tonePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  toneText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium as any },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: typography.sizes.md, marginBottom: 12 },
  fieldLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, marginBottom: 8 },
  daySelector: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  dayBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayBtnText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold as any },
  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
});
