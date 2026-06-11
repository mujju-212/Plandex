import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useThemeStore } from '../../src/stores/useThemeStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors: tc, isDark, toggleTheme } = useThemeStore();
  const { notificationsEnabled, toggleNotifications, timeFormat, setTimeFormat, loadSettings } = useSettingsStore();
  const [gamification, setGamification] = React.useState(true);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: tc.cardBackground }]}>
          <View style={styles.row}><Text style={[styles.rowLabel, { color: tc.textPrimary }]}>Dark Mode</Text><Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: tc.border, true: tc.primary }} /></View>
          <View style={[styles.divider, { backgroundColor: tc.border }]} />
          <Pressable style={styles.row} onPress={() => { void setTimeFormat(timeFormat === '24h' ? '12h' : '24h'); }}>
            <Text style={[styles.rowLabel, { color: tc.textPrimary }]}>Time Format</Text>
            <Text style={[styles.rowValue, { color: tc.textSecondary }]}>{timeFormat === '24h' ? '24-hour' : '12-hour'}</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>Notifications</Text>
        <View style={[styles.card, { backgroundColor: tc.cardBackground }]}>
          <View style={styles.row}><Text style={[styles.rowLabel, { color: tc.textPrimary }]}>Enable Notifications</Text><Switch value={notificationsEnabled} onValueChange={() => { void toggleNotifications(); }} trackColor={{ false: tc.border, true: tc.primary }} /></View>
        </View>

        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>Features</Text>
        <View style={[styles.card, { backgroundColor: tc.cardBackground }]}>
          <View style={styles.row}><Text style={[styles.rowLabel, { color: tc.textPrimary }]}>Gamification</Text><Switch value={gamification} onValueChange={setGamification} trackColor={{ false: tc.border, true: tc.primary }} /></View>
        </View>

        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>About</Text>
        <View style={[styles.card, { backgroundColor: tc.cardBackground }]}>
          <View style={styles.row}><Text style={[styles.rowLabel, { color: tc.textPrimary }]}>Version</Text><Text style={[styles.rowValue, { color: tc.textSecondary }]}>1.0.0</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  headerBtn: { padding: 8, borderRadius: 20, backgroundColor: colors.cardBackground },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any, color: colors.textPrimary },
  content: { padding: 20 },
  sectionLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, color: colors.textSecondary, textTransform: 'uppercase' as const, marginBottom: 8, marginTop: 16 },
  card: { backgroundColor: colors.cardBackground, borderRadius: 14, padding: 4, overflow: 'hidden' as const },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, padding: 14 },
  rowLabel: { fontSize: typography.sizes.md, color: colors.textPrimary },
  rowValue: { fontSize: typography.sizes.md, color: colors.textSecondary },
});
