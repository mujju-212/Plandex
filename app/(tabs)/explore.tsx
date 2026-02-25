import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEventStore } from '../../src/stores/useEventStore';
import { useGamificationStore } from '../../src/stores/useGamificationStore';
import { useGoalStore } from '../../src/stores/useGoalStore';
import { useHabitStore } from '../../src/stores/useHabitStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useTodoStore } from '../../src/stores/useTodoStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function ExploreScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  
  const { totalXP, currentLevel, levelTitle, currentStreak, loadStats } = useGamificationStore();
  const { todos, loadTodos } = useTodoStore();
  const { events, loadEvents } = useEventStore();
  const { goals, loadGoals } = useGoalStore();
  const { habits, loadHabits } = useHabitStore();

  useEffect(() => {
    loadStats();
    loadTodos();
    loadEvents();
    loadGoals();
    loadHabits();
  }, []);

  const features = [
    {
      id: 1,
      title: 'Todos',
      description: 'Organize tasks with priorities and deadlines',
      icon: 'check-circle',
      color: tc.primary,
      route: '/todos',
      stats: `${todos.filter(t => !t.completed_at).length} active`,
    },
    {
      id: 2,
      title: 'Calendar & Events',
      description: 'Schedule and manage your events',
      icon: 'event',
      color: '#FF6B6B',
      route: '/event',
      stats: `${events.filter(e => e.status === 'upcoming').length} upcoming`,
    },
    {
      id: 3,
      title: 'Goals',
      description: 'Set and achieve your goals with milestones',
      icon: 'flag',
      color: '#4ECDC4',
      route: '/goal',
      stats: `${goals.filter(g => g.status === 'in_progress').length} in progress`,
    },
    {
      id: 4,
      title: 'Habits',
      description: 'Build better habits with streak tracking',
      icon: 'fitness-center',
      color: '#FFD93D',
      route: '/habit',
      stats: `${habits.filter(h => h.is_active).length} active`,
    },
    {
      id: 5,
      title: 'Daily Logs',
      description: 'Journal your thoughts and activities',
      icon: 'book',
      color: '#95E1D3',
      route: '/logs',
      stats: 'Track your day',
    },
    {
      id: 6,
      title: 'Gamification',
      description: 'Earn XP, unlock badges, level up',
      icon: 'emoji-events',
      color: '#F38181',
      route: '/profile',
      stats: `Level ${currentLevel} • ${totalXP} XP`,
    },
  ];

  const FeatureCard = ({ feature }: any) => (
    <Pressable
      style={[styles.featureCard, { backgroundColor: tc.cardBackground }]}
      onPress={() => router.push(feature.route)}
    >
      <View style={[styles.iconContainer, { backgroundColor: feature.color + '20' }]}>
        <MaterialIcons name={feature.icon as any} size={32} color={feature.color} />
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: tc.textPrimary }]}>{feature.title}</Text>
        <Text style={[styles.featureDesc, { color: tc.textSecondary }]} numberOfLines={2}>
          {feature.description}
        </Text>
        <View style={styles.statsRow}>
          <MaterialIcons name="info" size={14} color={tc.textSecondary} />
          <Text style={[styles.statsText, { color: tc.textSecondary }]}>{feature.stats}</Text>
        </View>
      </View>
      <MaterialIcons name="arrow-forward-ios" size={20} color={tc.textSecondary} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <LinearGradient
          colors={[tc.gradientStart, tc.gradientEnd]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="explore" size={48} color="#FFF" />
          <Text style={styles.headerTitle}>Explore Features</Text>
          <Text style={styles.headerSubtitle}>
            Discover all the ways MyPlanner helps you stay organized
          </Text>
        </LinearGradient>

        {/* Gamification Quick Stats */}
        <View style={[styles.statsCard, { backgroundColor: tc.cardBackground }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: tc.primary + '20' }]}>
              <MaterialIcons name="stars" size={24} color={tc.primary} />
            </View>
            <Text style={[styles.statValue, { color: tc.textPrimary }]}>Level {currentLevel}</Text>
            <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{levelTitle}</Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: tc.border }]} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: tc.warning + '20' }]}>
              <MaterialIcons name="local-fire-department" size={24} color={tc.warning} />
            </View>
            <Text style={[styles.statValue, { color: tc.textPrimary }]}>{currentStreak} days</Text>
            <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Streak</Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: tc.border }]} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: tc.success + '20' }]}>
              <MaterialIcons name="playlist-add-check" size={24} color={tc.success} />
            </View>
            <Text style={[styles.statValue, { color: tc.textPrimary }]}>{totalXP}</Text>
            <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Total XP</Text>
          </View>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>All Features</Text>
          {features.map(feature => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 20 },
  
  headerGradient: {
    padding: 32,
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: typography.sizes.md,
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center' as const,
    paddingHorizontal: 20,
  },
  
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: { width: 1, backgroundColor: colors.border },
  
  featuresSection: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semiBold as any,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureContent: { flex: 1 },
  featureTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold as any,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statsText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
});
