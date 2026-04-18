import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LEVELS } from '../../src/services/gamificationService';
import { useGamificationStore } from '../../src/stores/useGamificationStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { typography } from '../../src/theme/typography';

export default function ProfileScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const [name, setName] = useState('User');
  const [profession, setProfession] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const { 
    totalXP, 
    currentLevel, 
    levelTitle, 
    currentStreak, 
    todosCompleted, 
    badges,
    loadStats,
  } = useGamificationStore();

  // XP progress calculation using LEVELS from gamificationService
  const currentLevelData = LEVELS.find(l => l.level === currentLevel) || LEVELS[0];
  const nextLevelData = LEVELS.find(l => l.level === currentLevel + 1) || null;
  const curMin = currentLevelData.min_xp;
  const nextMin = nextLevelData ? nextLevelData.min_xp : null;
  const xpIntoLevel = totalXP - curMin;
  const xpForNext = nextMin !== null ? nextMin - curMin : 1;
  const progressToNextLevel = nextMin !== null ? Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100)) : 100;

  useEffect(() => {
    loadStats();
    AsyncStorage.getItem('profile_name').then(v => { if (v) setName(v); });
    AsyncStorage.getItem('profile_profession').then(v => { if (v) setProfession(v); });
    AsyncStorage.getItem('profile_photo_uri').then(v => { if (v) setPhotoUri(v); });
  }, []);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      const msg = 'Please allow access to your photo library.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Permission required', msg);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      await AsyncStorage.setItem('profile_photo_uri', uri);
    }
  };

  const saveProfile = async () => {
    await AsyncStorage.setItem('profile_name', name.trim() || 'User');
    await AsyncStorage.setItem('profile_profession', profession);
    const msg = 'Profile updated!';
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Saved', msg);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: tc.cardBackground }]}>
          <MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <LinearGradient colors={[tc.gradientStart, tc.gradientEnd] as any} style={styles.avatar}>
            {photoUri
              ? <Image source={{ uri: photoUri }} style={styles.avatarPhoto} contentFit="cover" />
              : <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            }
          </LinearGradient>
          <Pressable style={[styles.editAvatarBtn, { backgroundColor: tc.primary, borderColor: tc.background }]} onPress={pickImage}>
            <MaterialIcons name="camera-alt" size={16} color="#FFF" />
          </Pressable>
        </View>

        {/* Gamification Stats Section */}
        <View style={[styles.gamificationCard, { backgroundColor: tc.cardBackground }]}>
          {/* Level & XP */}
          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <View style={[styles.levelBadge, { backgroundColor: tc.primary + '20' }]}>
                <MaterialIcons name="stars" size={20} color={tc.primary} />
                <Text style={[styles.levelNumber, { color: tc.primary }]}>Level {currentLevel}</Text>
              </View>
              <Text style={[styles.levelTitle, { color: tc.textPrimary }]}>{levelTitle}</Text>
            </View>
            <View style={styles.xpRow}>
              <Text style={[styles.xpText, { color: tc.textSecondary }]}>
                {totalXP} XP {nextMin !== null ? `• ${xpForNext - xpIntoLevel} XP to Level ${currentLevel + 1}` : ''}
              </Text>
            </View>
            {currentLevel < 10 && (
              <View style={[styles.progressBar, { backgroundColor: tc.border }]}>
                <View style={[styles.progressFill, { backgroundColor: tc.primary, width: `${progressToNextLevel}%` }]} />
              </View>
            )}
          </View>

          {/* Streak */}
          <View style={styles.streakSection}>
            <View style={[styles.streakCard, { backgroundColor: tc.warning + '10' }]}>
              <MaterialIcons name="local-fire-department" size={32} color={tc.warning} />
              <View style={styles.streakInfo}>
                <Text style={[styles.streakValue, { color: tc.textPrimary }]}>{currentStreak} Days</Text>
                <Text style={[styles.streakLabel, { color: tc.textSecondary }]}>Current Streak</Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={[styles.statsRow, { borderColor: tc.border + '50' }]}>
            <View style={styles.statItem}>
              <MaterialIcons name="check-circle" size={24} color={tc.success} />
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{todosCompleted}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Todos Done</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: tc.border }]} />
            <View style={styles.statItem}>
              <MaterialIcons name="emoji-events" size={24} color={tc.primary} />
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{badges.filter(b => b.unlocked).length}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Badges</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: tc.border }]} />
            <View style={styles.statItem}>
              <MaterialIcons name="star" size={24} color={tc.warning} />
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{totalXP}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Total XP</Text>
            </View>
          </View>

          {/* Badges Grid */}
          <View style={styles.badgesSection}>
            <Text style={[styles.badgesTitle, { color: tc.textPrimary }]}>Badges</Text>
            <View style={styles.badgesGrid}>
              {badges.map(badge => (
                <View 
                  key={badge.id} 
                  style={[
                    styles.badgeCard, 
                    { backgroundColor: tc.background },
                    !badge.unlocked && { opacity: 0.4 }
                  ]}
                >
                  <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
                    <MaterialIcons name={badge.icon as any} size={24} color={badge.unlocked ? badge.color : tc.textSecondary} />
                  </View>
                  {badge.unlocked && (
                    <View style={[styles.checkmark, { backgroundColor: tc.success }]}>
                      <MaterialIcons name="check" size={12} color="#FFF" />
                    </View>
                  )}
                  <Text style={[styles.badgeTitle, { color: tc.textPrimary }]} numberOfLines={1}>
                    {badge.title}
                  </Text>
                  <Text style={[styles.badgeDesc, { color: tc.textSecondary }]} numberOfLines={2}>
                    {badge.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Profile Edit Section */}
        <View style={styles.editSection}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Personal Information</Text>
          
          <Text style={[styles.label, { color: tc.textSecondary }]}>Name</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: tc.cardBackground, color: tc.textPrimary, borderColor: tc.border }]} 
            value={name} 
            onChangeText={setName} 
            placeholder="Your name" 
            placeholderTextColor={tc.textSecondary} 
          />

          <Text style={[styles.label, { color: tc.textSecondary }]}>Profession</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: tc.cardBackground, color: tc.textPrimary, borderColor: tc.border }]} 
            value={profession} 
            onChangeText={setProfession} 
            placeholder="e.g. Student, Developer" 
            placeholderTextColor={tc.textSecondary} 
          />

          <Pressable style={styles.saveBtn} onPress={saveProfile}>
            <LinearGradient colors={[tc.gradientStart, tc.gradientEnd]} style={styles.saveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.saveBtnText}>Save Profile</Text>
            </LinearGradient>
          </Pressable>
        </View>
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  headerBtn: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any },
  content: { padding: 20 },
  avatarSection: { position: 'relative' as const, marginBottom: 24, alignSelf: 'center' as const },
  avatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center' as const, justifyContent: 'center' as const, overflow: 'hidden' as const },
  avatarText: { fontSize: 40, fontWeight: '700' as const, color: '#FFF' },
  avatarPhoto: { width: 100, height: 100, borderRadius: 50 },
  editAvatarBtn: { position: 'absolute' as const, bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 3 },
  
  gamificationCard: { borderRadius: 16, padding: 16, marginBottom: 20 },
  
  levelSection: { marginBottom: 16 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  levelNumber: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
  levelTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any },
  xpRow: { marginBottom: 8 },
  xpText: { fontSize: typography.sizes.sm },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  
  streakSection: { marginBottom: 16 },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12 },
  streakInfo: { flex: 1 },
  streakValue: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any },
  streakLabel: { fontSize: typography.sizes.sm },
  
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 20, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1 },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any },
  statLabel: { fontSize: typography.sizes.xs },
  statDivider: { width: 1, height: 40 },
  
  badgesSection: { },
  badgesTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any, marginBottom: 12 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { width: '30%', aspectRatio: 1, borderRadius: 12, padding: 8, alignItems: 'center', justifyContent: 'center', position: 'relative' as const },
  badgeIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  checkmark: { position: 'absolute' as const, top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeTitle: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium as any, textAlign: 'center' as const },
  badgeDesc: { fontSize: 9, textAlign: 'center' as const, marginTop: 2 },
  
  editSection: { marginTop: 8 },
  sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any, marginBottom: 16 },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, marginBottom: 6, marginTop: 12 },
  input: { width: '100%' as any, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: typography.sizes.md, borderWidth: 1 },
  saveBtn: { width: '100%' as any, marginTop: 24 },
  saveGradient: { paddingVertical: 16, borderRadius: 30, alignItems: 'center' as const },
  saveBtnText: { color: '#FFF', fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any },
});
