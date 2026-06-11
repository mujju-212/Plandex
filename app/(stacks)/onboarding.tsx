import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, TextInput, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    icon: 'auto-awesome',
    title: 'Welcome to MyPlanner',
    desc: 'Your all-in-one personal planner with AI-powered insights.',
    color: '#667eea',
  },
  {
    icon: 'check-circle',
    title: 'Track Tasks & Events',
    desc: 'Create todos with priority, dates, and recurring schedules. Add events with location and categories.',
    color: '#4CAF50',
  },
  {
    icon: 'flag',
    title: 'Set Goals & Build Habits',
    desc: 'Define measurable goals with milestones. Track daily habits with streak counters.',
    color: '#FF9800',
  },
  {
    icon: 'create',
    title: 'Daily Journaling',
    desc: 'Log your day with mood tracking, ratings, and reflections. Review weekly and monthly summaries.',
    color: '#E91E63',
  },
  {
    icon: 'emoji-events',
    title: 'Earn XP & Badges',
    desc: 'Gamified productivity — earn XP for every action, level up, and unlock achievements.',
    color: '#9C27B0',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');

  const isLast = step === STEPS.length;
  const current = STEPS[step];

  const handleFinish = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {!isLast ? (
        <View style={styles.slideContainer}>
          <LinearGradient colors={[current.color, current.color + 'CC']} style={styles.iconCircle}>
            <MaterialIcons name={current.icon as any} size={48} color="#FFF" />
          </LinearGradient>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.desc}>{current.desc}</Text>

          {/* Dots */}
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, step === i && { backgroundColor: current.color, width: 24 }]} />
            ))}
          </View>

          <View style={styles.navRow}>
            {step > 0 && (
              <Pressable style={styles.backButton} onPress={() => setStep(s => s - 1)}>
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            )}
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => setStep(s => s + 1)}>
              <LinearGradient colors={[current.color, current.color + 'DD']} style={styles.nextBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.nextText}>{step === STEPS.length - 1 ? 'Get Started' : 'Next'}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </Pressable>
          </View>

          <Pressable style={styles.skipBtn} onPress={handleFinish}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.slideContainer}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.iconCircle}>
            <MaterialIcons name="person" size={48} color="#FFF" />
          </LinearGradient>
          <Text style={styles.title}>What{"'"}s your name?</Text>
          <TextInput style={styles.nameInput} value={name} onChangeText={setName} placeholder="Enter your name" placeholderTextColor={colors.textSecondary} />

          <Pressable onPress={handleFinish}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.nextBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.nextText}>Let{"'"}s Go!</Text>
              <MaterialIcons name="rocket-launch" size={20} color="#FFF" />
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  slideContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 16 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  title: { fontSize: 28, fontWeight: typography.weights.bold as any, color: colors.textPrimary, textAlign: 'center' },
  desc: { fontSize: typography.sizes.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, maxWidth: 340 },
  dots: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  navRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 16 },
  backButton: { paddingVertical: 12, paddingHorizontal: 20 },
  backText: { color: colors.textSecondary, fontSize: typography.sizes.md, fontWeight: typography.weights.medium as any },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 30 },
  nextText: { color: '#FFF', fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
  skipBtn: { position: 'absolute', top: 20, right: 20, padding: 10 },
  skipText: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  nameInput: { width: '100%', maxWidth: 340, backgroundColor: colors.cardBackground, borderRadius: 16, padding: 16, fontSize: typography.sizes.lg, color: colors.textPrimary, textAlign: 'center', marginVertical: 16, borderWidth: 2, borderColor: colors.border },
});
