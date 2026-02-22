# Flip Clock

> Animated flip-digit clock with Timer, Stopwatch, and Alarm modes.

---

## Overview

The Flip Clock is a beautiful time display with 4 operational modes. It features animated digit flipping, fullscreen support with landscape rotation, and a full alarm manager with custom tone import.

**Screen:** `app/(stacks)/clock.tsx`  
**Store:** `useClockStore`  
**Tables:** `alarms`, `focus_sessions`

## Modes

### Clock Mode
- Real-time display updating every second
- 12-hour / 24-hour format toggle
- Shows hours, minutes, seconds as flip digits

### Timer Mode
- Configurable countdown duration
- Start / Pause / Reset controls
- Audio alert when timer completes

### Stopwatch Mode
- Count-up timer with precision
- Start / Stop / Reset / Lap controls
- Lap time tracking

### Alarm Mode
- Create multiple alarms with label
- Set hour and minute
- Enable/disable individual alarms
- Repeat days selection (Sun–Sat)
- Custom alarm tones (see below)
- Vibration toggle
- Sound playback via `expo-av`

## FlipDigit Component

The core visual element — each digit is displayed with a flip animation effect.

### Implementation Approach: Nested-View Clipping

```
┌──────────────────────┐
│     Top Half          │  ← Container with overflow:hidden, height = digitH/2
│  ┌────────────────┐   │     Inner view with full digit, only top half visible
│  │       8        │   │
│  └────────────────┘   │
├──────────────────────┤  ← 1px divider line
│     Bottom Half       │  ← Container with overflow:hidden, height = digitH/2
│  ┌────────────────┐   │     Inner view shifted up by -digitH/2
│  │       8        │   │
│  └────────────────┘   │
└──────────────────────┘
```

- Each half is an `overflow: 'hidden'` container
- The inner text view is positioned to show only the correct half
- Font size: `digitW * 1.15`
- `includeFontPadding: false` for precise vertical alignment

### Dynamic Sizing (Fullscreen)

Uses `useWindowDimensions()` for responsive sizing:

```typescript
const { width: winW, height: winH } = useWindowDimensions();
const isLandscape = winW > winH;

// Calculate max digit width from available space
const maxDigitW = (availableWidth - gaps) / digitCount;
// Cap by height
const maxByH = (availableHeight * 0.6) / aspectRatio;
const digitW = Math.min(maxDigitW, maxByH);
```

Recalculates automatically when device rotates between portrait and landscape.

### Landscape Support

- `supportedOrientations={['portrait', 'landscape']}` on the screen
- All digit dimensions recompute from window dimensions
- Layout adapts smoothly on rotation

## Custom Alarm Tones

Users can import custom audio files as alarm tones:

1. **Import Button:** Dashed-border button labeled "Import Custom Tone"
2. **File Picker:** Uses `expo-document-picker` with `type: 'audio/*'`
3. **Storage:** Selected file's `uri` saved as `sound_uri`, display name as `sound_name`
4. **Playback:** `expo-av` Audio API plays the custom URI when alarm triggers
5. **Fallback:** If no custom tone, uses default system alarm sound

### State Variables
```typescript
const [customToneName, setCustomToneName] = useState<string | null>(null);
const [customToneUri, setCustomToneUri] = useState<string | null>(null);
```

## Alarms Table

| Column | Type | Default | Description |
|---|---|---|---|
| `id` | INTEGER PK | AUTO | Unique identifier |
| `label` | TEXT | `'Alarm'` | Alarm name |
| `hour` | INTEGER | required | Hour (0-23) |
| `minute` | INTEGER | required | Minute (0-59) |
| `is_enabled` | BOOLEAN | 1 | Active toggle |
| `repeat_days` | TEXT | `'[]'` | JSON array `[0,1,2,3,4,5,6]` |
| `sound_uri` | TEXT | NULL | Custom tone file URI |
| `sound_name` | TEXT | `'Default'` | Display name |
| `vibrate` | BOOLEAN | 1 | Vibration toggle |
