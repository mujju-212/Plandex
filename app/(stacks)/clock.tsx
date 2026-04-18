import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
    useWindowDimensions,
    Vibration,
    View
} from 'react-native';
import {
    ALARM_ACTION_SNOOZE,
    ALARM_ACTION_STOP,
    ALARM_CHANNEL_ID,
    ALARM_NOTIFICATION_CATEGORY_ID,
    cancelAlarmReminders,
    requestNotificationPermissions,
    scheduleAlarmReminders,
} from '../../src/services/notificationService';
import { useClockStore } from '../../src/stores/useClockStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { typography } from '../../src/theme/typography';
import { Alarm, CreateAlarmInput, DAY_LABELS, TimerMode } from '../../src/types/clock.types';

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
const ALARM_SNOOZE_MINUTES = 5;

function getDocumentPickerModule() {
  try {
    return require('expo-document-picker') as typeof import('expo-document-picker');
  } catch {
    return null;
  }
}

function getHapticsModule() {
  try {
    return require('expo-haptics') as typeof import('expo-haptics');
  } catch {
    return null;
  }
}

function getAudioModule() {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-av') as typeof import('expo-av');
  } catch {
    return null;
  }
}

function getFileSystemModule() {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
  } catch {
    return null;
  }
}

function getNotificationsModule() {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return null;
  }
}

// expo-screen-orientation is intentionally NOT required here.
// On New Architecture (newArchEnabled:true / Bridgeless) builds, JSI's
// requireNativeModule throws synchronously before any try/catch can
// intercept it when the native module isn't registered — causing a crash.
// The fullscreen layout already adapts via useWindowDimensions(), so
// locking orientation is a nice-to-have, not a requirement.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function lockOrientationSafe(_mode: 'landscape' | 'default') {
  // No-op: orientation locking removed to prevent New Architecture crash.
}

function normalizeParamValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toTwelveHourParts(hour24: number): { hour12: number; meridiem: number } {
  const meridiem = hour24 >= 12 ? 1 : 0;
  const hour12 = ((hour24 + 11) % 12) + 1;
  return { hour12, meridiem };
}

function toTwentyFourHour(hour12: number, meridiem: number): number {
  const normalized = hour12 % 12;
  return meridiem === 1 ? normalized + 12 : normalized;
}

function formatAlarmTime12(hour24: number, minute: number): string {
  const { hour12, meridiem } = toTwelveHourParts(hour24);
  const suffix = meridiem === 1 ? 'PM' : 'AM';
  return `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${suffix}`;
}

/* ── Scroll Drum Picker ── */
const ScrollPicker = React.memo(({ items, selected, onChange, tc, width = 80 }: {
  items: { label: string; value: number }[];
  selected: number;
  onChange: (v: number) => void;
  tc: any;
  width?: number;
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
    <View style={{ height: PICKER_H, width, overflow: 'hidden' }}>
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
ScrollPicker.displayName = 'ScrollPicker';

/* ── Flip Digit with animation ── */
const FlipDigit = React.memo(({ value, prevValue, color, size, overrideWidth }: { value: string; prevValue: string; color: string; size: 'normal' | 'fullscreen'; overrideWidth?: number }) => {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const prevRef = useRef(prevValue);
  // Allow flip animation on both iOS and Android.
  // useNativeDriver:false is already set below which avoids the known
  // rotateX crash in some Android release builds.
  const canAnimateFlip = Platform.OS !== 'web';
  const digitW = overrideWidth ?? (size === 'fullscreen' ? Math.min(SCREEN_H / 4, 150) : Math.min((SCREEN_W - 80) / 6, 65));
  const digitH = digitW * 1.5;
  const fontSize = digitW * 1.15;
  const bgColor = '#1A1A1A';
  const textColor = color;

  useEffect(() => {
    if (!canAnimateFlip) {
      prevRef.current = value;
      return;
    }

    if (value !== prevRef.current) {
      flipAnim.setValue(0);
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 300,
        // Native driver + rotateX can be unstable on some Android release builds.
        useNativeDriver: false,
      }).start();
      prevRef.current = value;
    }
  }, [value, canAnimateFlip]);

  const topFlipRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-90deg'],
  });

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

  // Shared text style — no lineHeight, use includeFontPadding:false for Android
  const digitTextStyle = {
    fontSize,
    color: textColor,
    fontWeight: '800' as const,
    fontVariant: ['tabular-nums' as const],
    textAlign: 'center' as const,
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  };

  // Top-half rendering: outer clip (height 50%) + inner full-height container centered
  const TopHalfText = ({ char }: { char: string }) => (
    <View style={{ width: digitW, height: digitH / 2, overflow: 'hidden' }}>
      <View style={{ height: digitH, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={digitTextStyle}>{char}</Text>
      </View>
    </View>
  );

  // Bottom-half rendering: outer clip (height 50%) + inner positioned from bottom
  const BottomHalfText = ({ char }: { char: string }) => (
    <View style={{ width: digitW, height: digitH / 2, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', bottom: 0, width: digitW, height: digitH, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={digitTextStyle}>{char}</Text>
      </View>
    </View>
  );

  const staticBottomChar = canAnimateFlip ? prevValue : value;

  return (
    <View style={[{ width: digitW, height: digitH, marginHorizontal: size === 'fullscreen' ? 4 : 2 }]}>
      {/* Static top - new value (revealed when flip card goes) */}
      <View style={[dStyles.halfStatic, dStyles.topHalf, { backgroundColor: bgColor, borderTopLeftRadius: digitW * 0.15, borderTopRightRadius: digitW * 0.15 }]}>
        <TopHalfText char={value} />
      </View>

      {/* Static bottom - old value (behind flip card) */}
      <View style={[dStyles.halfStatic, dStyles.bottomHalf, { backgroundColor: bgColor, opacity: 0.92, borderBottomLeftRadius: digitW * 0.15, borderBottomRightRadius: digitW * 0.15 }]}>
        <BottomHalfText char={staticBottomChar} />
      </View>

      {canAnimateFlip && (
        <>
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
            <TopHalfText char={prevValue} />
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
            <BottomHalfText char={value} />
          </Animated.View>
        </>
      )}

      {/* Divider line */}
      <View style={[dStyles.divider, { top: digitH / 2 - 0.5 }]} />
    </View>
  );
});
FlipDigit.displayName = 'FlipDigit';

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
const Sep = ({ color, size, overrideDotSize, overrideWidth }: { color: string; size: 'normal' | 'fullscreen'; overrideDotSize?: number; overrideWidth?: number }) => {
  const dotSize = overrideDotSize ?? (size === 'fullscreen' ? 12 : 8);
  const sepW = overrideWidth ?? (size === 'fullscreen' ? (overrideDotSize ? overrideDotSize * 2.5 : 30) : 20);
  const sepGap = size === 'fullscreen' ? (overrideDotSize ? overrideDotSize * 1.2 : 14) : 8;
  return (
    <View style={[styles.sepContainer, { width: sepW, gap: sepGap }]}>
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
  const params = useLocalSearchParams<{
    alarmId?: string | string[];
    alarmAction?: string | string[];
    alarmTrigger?: string | string[];
  }>();
  const tc = useThemeStore().colors;
  const { alarms, loadAlarms, addAlarm, updateAlarm, deleteAlarm, toggleAlarm } = useClockStore();
  const isExpoGo = Constants.appOwnership === 'expo';

  const [mode, setMode] = useState<TimerMode>('clock');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef<any>(null);
  const [alarmSupportNote, setAlarmSupportNote] = useState<string | null>(null);
  const lastAlarmTriggerRef = useRef<Record<number, string>>({});
  const lastHandledNotificationRef = useRef<string>('');
  const activeAlarmSoundRef = useRef<any>(null);
  const snoozeTimeoutsRef = useRef<Record<number, any>>({});
  const [activeRingingAlarm, setActiveRingingAlarm] = useState<Alarm | null>(null);
  const [showRingingAlarmModal, setShowRingingAlarmModal] = useState(false);

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
  const [alarmHour12, setAlarmHour12] = useState(7);
  const [alarmMeridiem, setAlarmMeridiem] = useState(0); // 0 = AM, 1 = PM
  const [alarmMinute, setAlarmMinute] = useState(0);
  const [alarmLabel, setAlarmLabel] = useState('');
  const [alarmDays, setAlarmDays] = useState<number[]>([]);
  const [alarmTone, setAlarmTone] = useState('default');
  const [customToneName, setCustomToneName] = useState('');
  const [customToneUri, setCustomToneUri] = useState('');
  const [editingAlarmId, setEditingAlarmId] = useState<number | null>(null);

  // Dynamic dimensions for fullscreen landscape support
  const { width: winW, height: winH } = useWindowDimensions();

  const hourItems = React.useMemo(() => Array.from({ length: 12 }, (_, i) => ({ label: (i + 1).toString().padStart(2, '0'), value: i + 1 })), []);
  const minuteItems = React.useMemo(() => Array.from({ length: 60 }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i })), []);
  const meridiemItems = React.useMemo(() => [
    { label: 'AM', value: 0 },
    { label: 'PM', value: 1 },
  ], []);

  useEffect(() => { loadAlarms(); }, []);

  useEffect(() => {
    let active = true;

    const setupAlarmNotifications = async () => {
      if (Platform.OS === 'web') {
        if (active) {
          setAlarmSupportNote('Alarms ring only while this screen is open on web.');
        }
        return;
      }

      if (isExpoGo) {
        if (active) {
          setAlarmSupportNote('Expo Go does not support background alarm notifications. Keep Clock open for in-app alarms.');
        }
        return;
      }

      const granted = await requestNotificationPermissions();
      if (!active) return;

      if (!granted) {
        setAlarmSupportNote('Allow notifications to run alarms in background.');
      } else {
        setAlarmSupportNote(null);
      }
    };

    setupAlarmNotifications();

    return () => {
      active = false;
    };
  }, [isExpoGo]);

  useEffect(() => {
    alarms.forEach((alarm) => {
      if (alarm.is_enabled) {
        scheduleAlarmReminders(alarm).catch(() => { });
      } else {
        cancelAlarmReminders(alarm.id).catch(() => { });
      }
    });
  }, [alarms]);

  const clearSnoozeTimeoutForAlarm = useCallback((alarmId: number) => {
    const timeoutId = snoozeTimeoutsRef.current[alarmId];
    if (!timeoutId) return;
    clearTimeout(timeoutId);
    delete snoozeTimeoutsRef.current[alarmId];
  }, []);

  const stopActiveAlarmSound = useCallback(async () => {
    const sound = activeAlarmSoundRef.current;
    activeAlarmSoundRef.current = null;
    if (!sound) return;

    try {
      await sound.stopAsync();
    } catch { }

    try {
      await sound.unloadAsync();
    } catch { }
  }, []);

  const stopActiveAlarmVibration = useCallback(() => {
    if (Platform.OS === 'web') return;
    try {
      Vibration.cancel();
    } catch { }
  }, []);

  const clearActiveRingingUI = useCallback(() => {
    setShowRingingAlarmModal(false);
    setActiveRingingAlarm(null);
  }, []);

  const stopAlarmNow = useCallback(async () => {
    await stopActiveAlarmSound();
    stopActiveAlarmVibration();
  }, [stopActiveAlarmSound, stopActiveAlarmVibration]);

  const playCustomAlarmSound = useCallback(async (alarm: Alarm): Promise<boolean> => {
    const toneName = (alarm.sound_name || '').toLowerCase();
    if (toneName === 'vibrate only') return false;
    if (!alarm.sound_uri) return false;

    const AV = getAudioModule();
    if (!AV?.Audio?.Sound?.createAsync) return false;

    await stopActiveAlarmSound();

    try {
      await AV.Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
    } catch { }

    try {
      const { sound } = await AV.Audio.Sound.createAsync(
        { uri: alarm.sound_uri },
        {
          shouldPlay: true,
          isLooping: true,
          volume: 1.0,
        }
      );

      activeAlarmSoundRef.current = sound;
      return true;
    } catch {
      return false;
    }
  }, [stopActiveAlarmSound]);

  const ringAlarm = useCallback(async (alarm: Alarm, source: 'auto' | 'notification' | 'snooze' = 'auto') => {
    await stopAlarmNow();

    setMode('alarm');
    setIsFullscreen(false);
    setShowControls(true);
    setActiveRingingAlarm(alarm);
    setShowRingingAlarmModal(true);

    if (Platform.OS !== 'web') {
      try {
        const Haptics = getHapticsModule();
        if (Haptics?.notificationAsync) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      } catch { }

      if (alarm.vibrate) {
        try {
          Vibration.vibrate([0, 800, 600], true);
        } catch { }
      }
    }

    const playedCustomSound = await playCustomAlarmSound(alarm);
    const alarmMessage = alarm.label?.trim() || 'Alarm time';

    if (!playedCustomSound && !isExpoGo && Platform.OS !== 'web' && source !== 'notification') {
      const Notifications = getNotificationsModule();
      if (Notifications?.scheduleNotificationAsync) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '⏰ Alarm',
              body: alarmMessage,
              data: { type: 'alarm', alarmId: alarm.id, alarmLabel: alarmMessage },
              categoryIdentifier: ALARM_NOTIFICATION_CATEGORY_ID,
              sound: true,
            },
            trigger: null,
          });
        } catch { }
      }
    }

    if (!alarm.repeat_days || alarm.repeat_days.length === 0) {
      try {
        await updateAlarm(alarm.id, { is_enabled: false });
      } catch { }
    }
  }, [isExpoGo, playCustomAlarmSound, stopAlarmNow, updateAlarm]);

  const scheduleSnoozeAlarm = useCallback(async (alarm: Alarm) => {
    clearSnoozeTimeoutForAlarm(alarm.id);

    const snoozeMs = ALARM_SNOOZE_MINUTES * 60 * 1000;

    if (Platform.OS === 'web' || isExpoGo) {
      snoozeTimeoutsRef.current[alarm.id] = setTimeout(() => {
        ringAlarm(alarm, 'snooze').catch(() => { });
      }, snoozeMs);
      return;
    }

    const Notifications = getNotificationsModule();
    if (!Notifications?.scheduleNotificationAsync) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Snoozed Alarm',
          body: alarm.label?.trim() || 'Alarm time',
          data: { type: 'alarm', alarmId: alarm.id, snoozed: true },
          categoryIdentifier: ALARM_NOTIFICATION_CATEGORY_ID,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(Date.now() + snoozeMs),
          channelId: ALARM_CHANNEL_ID,
        },
      });
    } catch { }
  }, [clearSnoozeTimeoutForAlarm, isExpoGo, ringAlarm]);

  const handleStopAlarm = useCallback(async () => {
    await stopAlarmNow();
    clearActiveRingingUI();
  }, [clearActiveRingingUI, stopAlarmNow]);

  const handleSnoozeAlarm = useCallback(async () => {
    if (!activeRingingAlarm) return;

    const alarmToSnooze = activeRingingAlarm;
    await stopAlarmNow();
    clearActiveRingingUI();
    await scheduleSnoozeAlarm(alarmToSnooze);

    if (Platform.OS === 'web') {
      window.alert(`Alarm snoozed for ${ALARM_SNOOZE_MINUTES} minutes.`);
    }
  }, [activeRingingAlarm, clearActiveRingingUI, scheduleSnoozeAlarm, stopAlarmNow]);

  useEffect(() => {
    return () => {
      stopAlarmNow().catch(() => { });
      Object.keys(snoozeTimeoutsRef.current).forEach((alarmId) => {
        clearSnoozeTimeoutForAlarm(Number(alarmId));
      });
    };
  }, [clearSnoozeTimeoutForAlarm, stopAlarmNow]);

  useEffect(() => {
    const alarmIdRaw = normalizeParamValue(params.alarmId);
    if (!alarmIdRaw) return;

    const alarmAction = normalizeParamValue(params.alarmAction) || 'open';
    const alarmTrigger = normalizeParamValue(params.alarmTrigger) || '';
    const dedupeKey = `${alarmIdRaw}:${alarmAction}:${alarmTrigger}`;
    if (lastHandledNotificationRef.current === dedupeKey) return;

    const alarmId = Number(alarmIdRaw);
    if (!Number.isFinite(alarmId)) return;

    const alarm = alarms.find((item) => item.id === alarmId);
    if (!alarm) return;

    lastHandledNotificationRef.current = dedupeKey;

    if (alarmAction === ALARM_ACTION_STOP) {
      handleStopAlarm().catch(() => { });
      return;
    }

    if (alarmAction === ALARM_ACTION_SNOOZE) {
      scheduleSnoozeAlarm(alarm).catch(() => { });
      return;
    }

    ringAlarm(alarm, 'notification').catch(() => { });
  }, [
    alarms,
    handleStopAlarm,
    params.alarmAction,
    params.alarmId,
    params.alarmTrigger,
    ringAlarm,
    scheduleSnoozeAlarm,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = new Date();
      const hh = current.getHours();
      const mm = current.getMinutes();
      const weekday = current.getDay();
      const minuteKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

      alarms.forEach((alarm) => {
        if (!alarm.is_enabled) return;
        if (alarm.hour !== hh || alarm.minute !== mm) return;
        if (alarm.repeat_days && alarm.repeat_days.length > 0 && !alarm.repeat_days.includes(weekday)) return;
        if (lastAlarmTriggerRef.current[alarm.id] === minuteKey) return;

        lastAlarmTriggerRef.current[alarm.id] = minuteKey;
        ringAlarm(alarm).catch(() => { });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms, ringAlarm]);

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

  const clearLaps = () => setLaps([]);

  /* ── Alarms ── */
  const handleImportCustomTone = async () => {
    try {
      const DocumentPicker = getDocumentPickerModule();
      if (!DocumentPicker?.getDocumentAsync) {
        Alert.alert('Unavailable', 'Custom tone import is not available in this build.');
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const sourceUri = asset.uri;
        let persistedUri = sourceUri;

        const FileSystem = getFileSystemModule();
        if (FileSystem?.documentDirectory && FileSystem.copyAsync && sourceUri) {
          const dir = `${FileSystem.documentDirectory}alarm-tones`;
          try {
            await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
          } catch { }

          const safeName = (asset.name || `tone-${Date.now()}.mp3`).replace(/[^a-zA-Z0-9._-]/g, '_');
          const targetUri = `${dir}/${Date.now()}-${safeName}`;

          try {
            await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
            persistedUri = targetUri;
          } catch {
            // Keep original URI as fallback.
          }
        }

        setCustomToneName(asset.name || 'Custom Tone');
        setCustomToneUri(persistedUri);
        setAlarmTone('custom');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to import audio file');
    }
  };

  const resetAlarmForm = () => {
    setAlarmLabel('');
    setAlarmHour12(7);
    setAlarmMeridiem(0);
    setAlarmMinute(0);
    setAlarmDays([]);
    setAlarmTone('default');
    setCustomToneName('');
    setCustomToneUri('');
    setEditingAlarmId(null);
  };

  const openCreateAlarm = () => {
    resetAlarmForm();
    setShowAlarmModal(true);
  };

  const openEditAlarm = (alarm: typeof alarms[number]) => {
    const { hour12, meridiem } = toTwelveHourParts(alarm.hour);

    setEditingAlarmId(alarm.id);
    setAlarmHour12(hour12);
    setAlarmMeridiem(meridiem);
    setAlarmMinute(alarm.minute);
    setAlarmLabel(alarm.label || '');
    setAlarmDays(alarm.repeat_days || []);

    if (alarm.sound_uri) {
      setAlarmTone('custom');
      setCustomToneUri(alarm.sound_uri);
      setCustomToneName(alarm.sound_name || 'Custom Tone');
    } else {
      const tone = ALARM_TONES.find(t => t.name.toLowerCase() === (alarm.sound_name || '').toLowerCase());
      setAlarmTone(tone?.id || 'default');
      setCustomToneName('');
      setCustomToneUri('');
    }

    setShowAlarmModal(true);
  };

  const handleSaveAlarm = async () => {
    const isCustom = alarmTone === 'custom' && !!customToneUri;
    const hour = toTwentyFourHour(alarmHour12, alarmMeridiem);

    const payload: CreateAlarmInput = {
      hour,
      minute: alarmMinute,
      label: alarmLabel.trim() || undefined,
      repeat_days: alarmDays,
      vibrate: true,
      sound_name: isCustom ? customToneName : (ALARM_TONES.find(t => t.id === alarmTone)?.name || 'Default'),
      sound_uri: isCustom ? customToneUri : undefined,
    };

    try {
      if (editingAlarmId) {
        await updateAlarm(editingAlarmId, payload);
      } else {
        await addAlarm(payload);
      }
      setShowAlarmModal(false);
      resetAlarmForm();
    } catch (e: any) {
      Alert.alert('Alarm', e?.message || 'Failed to save alarm');
    }
  };

  const handleToggleAlarm = async (id: number) => {
    try {
      await toggleAlarm(id);
    } catch (e: any) {
      Alert.alert('Alarm', e?.message || 'Failed to update alarm');
    }
  };

  const handleDeleteAlarm = (id: number) => {
    const deleteAndCancel = async () => {
      try {
        await deleteAlarm(id);
        await cancelAlarmReminders(id);
      } catch (e: any) {
        Alert.alert('Alarm', e?.message || 'Failed to delete alarm');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this alarm?')) deleteAndCancel();
    } else {
      Alert.alert('Delete', 'Delete this alarm?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAndCancel },
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

  useEffect(() => {
    if (!isFullscreen) {
      void lockOrientationSafe('default');
      return;
    }

    void lockOrientationSafe('landscape');

    return () => {
      void lockOrientationSafe('default');
    };
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
                <View style={styles.lapHeaderRow}>
                  <Text style={[styles.lapHeader, { color: tc.textSecondary }]}>Laps</Text>
                  <TouchableOpacity onPress={clearLaps}>
                    <Text style={[styles.clearLapsText, { color: tc.primary }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
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
            {alarmSupportNote && (
              <View style={[styles.alarmNotice, { borderColor: tc.warning + '55', backgroundColor: tc.warning + '18' }]}>
                <MaterialIcons name="info-outline" size={16} color={tc.warning} />
                <Text style={[styles.alarmNoticeText, { color: tc.textSecondary }]}>{alarmSupportNote}</Text>
              </View>
            )}

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
                      {formatAlarmTime12(alarm.hour, alarm.minute)}
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
                      onPress={() => handleToggleAlarm(alarm.id)}
                    >
                      <View style={[
                        styles.toggleKnob,
                        alarm.is_enabled ? { transform: [{ translateX: 18 }] } : {},
                      ]} />
                    </TouchableOpacity>
                    <View style={styles.alarmActions}>
                      <TouchableOpacity onPress={() => openEditAlarm(alarm)} hitSlop={8}>
                        <MaterialIcons name="edit" size={18} color={tc.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteAlarm(alarm.id)} hitSlop={8}>
                        <MaterialIcons name="delete-outline" size={18} color={tc.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity
              style={[styles.addAlarmBtn, { backgroundColor: tc.primary }]}
              onPress={openCreateAlarm}
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
            {(() => {
              // Calculate digit sizing based on current window dimensions
              const isLandscape = winW > winH;
              const rowHorizontalPadding = isLandscape ? 20 : 14;
              const digitMargin = isLandscape ? 2 : 1;
              const separatorWidth = isLandscape ? 26 : 22;
              const availW = Math.max(
                220,
                winW - rowHorizontalPadding * 2 - separatorWidth * 2 - digitMargin * 2 * 6,
              );
              const maxDigitW = Math.floor(availW / 6);
              // Also cap by height so digits don't overflow vertically
              const maxByHeight = Math.floor((winH - (isLandscape ? 72 : 160)) / 1.5);
              const fsDigitW = Math.max(34, Math.min(maxDigitW, maxByHeight));
              const fsDotSize = Math.max(6, Math.floor(fsDigitW / 9));
              return (
                <>
                  <View style={styles.fullscreenDigitRow}>
                    <FlipDigit value={digits[0]} prevValue={prevDigitsRef.current[0]} color={digitColor} size="fullscreen" overrideWidth={fsDigitW} />
                    <FlipDigit value={digits[1]} prevValue={prevDigitsRef.current[1]} color={digitColor} size="fullscreen" overrideWidth={fsDigitW} />
                    <Sep color={digitColor} size="fullscreen" overrideDotSize={fsDotSize} overrideWidth={separatorWidth} />
                    <FlipDigit value={digits[2]} prevValue={prevDigitsRef.current[2]} color={digitColor} size="fullscreen" overrideWidth={fsDigitW} />
                    <FlipDigit value={digits[3]} prevValue={prevDigitsRef.current[3]} color={digitColor} size="fullscreen" overrideWidth={fsDigitW} />
                    <Sep color={digitColor} size="fullscreen" overrideDotSize={fsDotSize} overrideWidth={separatorWidth} />
                    <FlipDigit value={digits[4]} prevValue={prevDigitsRef.current[4]} color={digitColor} size="fullscreen" overrideWidth={fsDigitW} />
                    <FlipDigit value={digits[5]} prevValue={prevDigitsRef.current[5]} color={digitColor} size="fullscreen" overrideWidth={fsDigitW} />
                  </View>
                  {mode === 'clock' && (
                    <Text style={[styles.fullscreenDate, { color: tc.textSecondary, fontSize: isLandscape ? typography.sizes.xl : typography.sizes.lg }]}>
                      {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                  )}
                </>
              );
            })()}
            {showControls && (
              <TouchableOpacity style={[styles.exitFullscreenBtn, { backgroundColor: tc.cardBackground }]} onPress={toggleFullscreen}>
                <MaterialIcons name="fullscreen-exit" size={28} color={tc.textPrimary} />
                <Text style={[styles.exitFullscreenText, { color: tc.textPrimary }]}>Tap to exit</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Active Alarm Modal */}
      <Modal
        visible={showRingingAlarmModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          handleStopAlarm().catch(() => { });
        }}
      >
        <View style={styles.ringingOverlay}>
          <View style={[styles.ringingCard, { backgroundColor: tc.cardBackground }]}> 
            <MaterialIcons name="alarm" size={44} color={tc.primary} />
            <Text style={[styles.ringingTitle, { color: tc.textPrimary }]}>Alarm Ringing</Text>
            <Text style={[styles.ringingTime, { color: tc.textPrimary }]}>
              {activeRingingAlarm ? formatAlarmTime12(activeRingingAlarm.hour, activeRingingAlarm.minute) : '--:--'}
            </Text>
            <Text style={[styles.ringingLabel, { color: tc.textSecondary }]}>
              {activeRingingAlarm?.label?.trim() || 'Alarm time'}
            </Text>

            <View style={styles.ringingActionsRow}>
              <TouchableOpacity
                style={[styles.ringingActionBtn, { backgroundColor: tc.warning }]}
                onPress={() => {
                  handleSnoozeAlarm().catch(() => { });
                }}
              >
                <MaterialIcons name="snooze" size={18} color="#FFF" />
                <Text style={styles.ringingActionText}>Snooze {ALARM_SNOOZE_MINUTES}m</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ringingActionBtn, { backgroundColor: tc.danger }]}
                onPress={() => {
                  handleStopAlarm().catch(() => { });
                }}
              >
                <MaterialIcons name="alarm-off" size={18} color="#FFF" />
                <Text style={styles.ringingActionText}>Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Alarm Create Modal */}
      <Modal visible={showAlarmModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: tc.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.textPrimary }]}>{editingAlarmId ? 'Edit Alarm' : 'New Alarm'}</Text>
              <TouchableOpacity onPress={() => { setShowAlarmModal(false); resetAlarmForm(); }}>
                <MaterialIcons name="close" size={24} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Time Picker - Scroll Drums */}
            <View style={styles.timePickerRow}>
              <ScrollPicker items={hourItems} selected={alarmHour12} onChange={setAlarmHour12} tc={tc} />
              <Text style={[styles.timeSep, { color: tc.textPrimary }]}>:</Text>
              <ScrollPicker items={minuteItems} selected={alarmMinute} onChange={setAlarmMinute} tc={tc} />
              <ScrollPicker items={meridiemItems} selected={alarmMeridiem} onChange={setAlarmMeridiem} tc={tc} width={90} />
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
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
            {/* Custom Tone Import */}
            <TouchableOpacity
              style={[
                styles.customToneBtn,
                { borderColor: tc.border },
                alarmTone === 'custom' && customToneUri ? { backgroundColor: tc.primary + '20', borderColor: tc.primary } : {},
              ]}
              onPress={handleImportCustomTone}
            >
              <MaterialIcons name="file-upload" size={18} color={alarmTone === 'custom' ? tc.primary : tc.textSecondary} />
              <Text style={[styles.customToneBtnText, { color: alarmTone === 'custom' ? tc.primary : tc.textSecondary }]}>
                {alarmTone === 'custom' && customToneName ? customToneName : 'Import Custom Tone'}
              </Text>
              {alarmTone === 'custom' && customToneName ? (
                <MaterialIcons name="check-circle" size={16} color={tc.primary} />
              ) : null}
            </TouchableOpacity>

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
              <Text style={styles.saveBtnText}>{editingAlarmId ? 'Update Alarm' : 'Save Alarm'}</Text>
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
    maxWidth: '100%',
    paddingHorizontal: 12,
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
  lapHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lapHeader: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  clearLapsText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold as any },
  lapRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  lapNum: { fontSize: typography.sizes.sm },
  lapTime: { fontSize: typography.sizes.sm, fontVariant: ['tabular-nums'] },
  alarmSection: { paddingTop: 16 },
  alarmNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  alarmNoticeText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
  alarmCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  alarmLeft: { flex: 1 },
  alarmTime: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  alarmLabel: { fontSize: typography.sizes.sm, marginTop: 2 },
  dayRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  dayLabel: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold as any },
  alarmRight: { alignItems: 'flex-end', gap: 12 },
  alarmActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleBtn: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3 },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
  addAlarmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 8,
  },
  addAlarmBtnText: { color: '#FFF', fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12, fontSize: typography.sizes.md },
  ringingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ringingCard: {
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
  },
  ringingTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
  },
  ringingTime: {
    fontSize: 42,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  ringingLabel: {
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  ringingActionsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  ringingActionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ringingActionText: {
    color: '#FFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold as any,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16, height: PICKER_H },
  timeSep: { fontSize: 32, fontWeight: '700' },
  tonePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  toneText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium as any },
  customToneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14,
    borderWidth: 1, borderStyle: 'dashed', marginBottom: 16,
  },
  customToneBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium as any, flex: 1 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: typography.sizes.md, marginBottom: 12 },
  fieldLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, marginBottom: 8 },
  daySelector: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  dayBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayBtnText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semiBold as any },
  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
});
