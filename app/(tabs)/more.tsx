import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useFocusEffect, useRouter } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import * as Updates from 'expo-updates';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Sidebar from '../../src/components/common/Sidebar';
import { requestNotificationPermissions } from '../../src/services/notificationService';
import { useGamificationStore } from '../../src/stores/useGamificationStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { clearAllData, downloadJSON, exportAllData, importAllData, triggerImportDialog } from '../../src/utils/dataUtils';

interface MenuItemProps {
  icon: string;
  iconFamily?: 'material' | 'feather';
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}

function MenuItem({ icon, iconFamily = 'material', title, subtitle, onPress, rightElement, iconBg, iconColor }: MenuItemProps) {
  const IconComponent = iconFamily === 'feather' ? Feather : MaterialIcons;
  const tc = useThemeStore().colors;
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg || tc.primaryLight + '20' }]}>
        <IconComponent name={icon as any} size={20} color={iconColor || (iconBg ? '#FFF' : tc.primary)} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: tc.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: tc.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightElement || <MaterialIcons name="chevron-right" size={22} color={tc.textSecondary} />}
    </TouchableOpacity>
  );
}

export default function MoreTab() {
  const router = useRouter();
  const { isDark, toggleTheme, loadTheme, colors: themeColors } = useThemeStore();
  const { notificationsEnabled, toggleNotifications, loadSettings } = useSettingsStore();
  const { totalXP, currentLevel, levelTitle, currentStreak, todosCompleted, loadStats } = useGamificationStore();
  const [showSidebar, setShowSidebar] = React.useState(false);
  const [profileName, setProfileName] = useState('User');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    loadTheme();
    loadSettings();
    loadStats();
  }, []);

  const loadProfileData = useCallback(() => {
    AsyncStorage.getItem('profile_name').then(v => setProfileName(v || 'User'));
    AsyncStorage.getItem('profile_photo_uri').then(v => setProfilePhoto(v));
  }, []);

  useFocusEffect(loadProfileData);

  const handleExport = async () => {
    try {
      const json = await exportAllData();
      downloadJSON(json, `myplanner_backup_${new Date().toISOString().split('T')[0]}.json`);
      Alert.alert('Exported!', 'Your data has been downloaded as a JSON file.');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleImport = async () => {
    try {
      const json = await triggerImportDialog();
      await importAllData(json);
      Alert.alert('Imported!', 'Data restored. Restart the app to see changes.');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleClear = () => {
    Alert.alert('Clear All Data', 'This will permanently delete everything. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All', style: 'destructive', onPress: async () => {
          await clearAllData();
          Alert.alert('Cleared', 'All data has been deleted. Restart the app.');
        }
      },
    ]);
  };

  const handleToggleNotifications = async () => {
    const newVal = !notificationsEnabled;
    if (newVal) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
    }
    toggleNotifications();
  };

  const handleRateApp = async () => {
    try {
      // requestReview works in production builds; in Expo Go it may throw
      await StoreReview.requestReview();
    } catch {
      Alert.alert(
        'Rate App',
        'In-app review is only available in production builds. Thank you for wanting to rate MyPlanner!',
      );
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        title: 'MyPlanner - Your Productivity Partner',
        message:
          'Hey! Check out MyPlanner — it helps me stay organized with todos, habits, goals, and daily logs. It\'s completely offline and free! 🚀\n\nhttps://myplanner.app',
      });
    } catch { }
  };

  const APP_VERSION = '1.0.0';
  const GITHUB_REPO = 'https://github.com/mujju-212/myplanner';
  const CONTACT_EMAIL = 'mujju786492@gmail.com';
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const handleOpenRepo = () => {
    Linking.openURL(GITHUB_REPO);
  };

  const handleContactEmail = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=MyPlanner%20-%20Feedback`);
  };

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    try {
      // Try OTA update first (only works in production builds, not in dev/Expo Go)
      if (!__DEV__) {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          setCheckingUpdate(false);
          Alert.alert(
            'Update Downloaded! 🎉',
            'A new update has been downloaded and is ready to install.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Restart Now', onPress: () => Updates.reloadAsync() },
            ],
          );
          return;
        }
      }
      // Fallback: check GitHub releases for new APK versions
      const response = await fetch('https://api.github.com/repos/mujju-212/myplanner/releases/latest', {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      if (response.ok) {
        const release = await response.json();
        const latestVersion = (release.tag_name || '').replace(/^v/, '');
        if (latestVersion && latestVersion !== APP_VERSION) {
          Alert.alert(
            'Update Available! 🎉',
            `A new version (${latestVersion}) is available. You are on version ${APP_VERSION}.\n\n${release.name || ''}`,
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Download', onPress: () => Linking.openURL(release.html_url || `${GITHUB_REPO}/releases`) },
            ],
          );
          return;
        }
      }
      Alert.alert('Up to Date ✨', `You are running the latest version (${APP_VERSION}).`);
    } catch (e: any) {
      Alert.alert('Error', 'Unable to check for updates. Please try again later.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Sidebar visible={showSidebar} onClose={() => setShowSidebar(false)} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with menu button */}
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: themeColors.cardBackground }]} 
            onPress={() => setShowSidebar(true)}
          >
            <MaterialIcons name="menu" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        {/* Profile Card */}
        <LinearGradient
          colors={[themeColors.gradientStart, themeColors.gradientEnd] as any}
          style={styles.profileCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarCircle}>
            {profilePhoto
              ? <Image source={{ uri: profilePhoto }} style={styles.avatarImage} contentFit="cover" />
              : <Text style={styles.avatarText}>{profileName.charAt(0).toUpperCase()}</Text>
            }
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profileName}</Text>
            <Text style={styles.profileLevel}>Level {currentLevel} • {levelTitle}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <MaterialIcons name="edit" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats Row */}
        <View style={[styles.statsRow, { backgroundColor: themeColors.cardBackground }]}>
          <View style={styles.statBlock}>
            <Text style={[styles.statNumber, { color: themeColors.textPrimary }]}>{totalXP}</Text>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={[styles.statNumber, { color: themeColors.textPrimary }]}>{currentStreak}</Text>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={[styles.statNumber, { color: themeColors.textPrimary }]}>{todosCompleted}</Text>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Done</Text>
          </View>
        </View>

        {/* Features Section */}
        <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>Features</Text>
        <View style={[styles.menuGroup, { backgroundColor: themeColors.cardBackground }]}>
          <MenuItem icon="event" title="Events" subtitle="Manage your calendar events" onPress={() => router.push('/event')} />
          <MenuItem icon="flag" title="Goals" subtitle="View and track your goals" onPress={() => router.push('/goal')} />
          <MenuItem icon="loop" title="Habits" subtitle="View and build daily habits" onPress={() => router.push('/habit')} />
          <MenuItem icon="note" title="Sticky Notes" subtitle="Quick colorful notes" onPress={() => router.push('/notes' as any)} />
          <MenuItem icon="mood" title="Mood Tracker" subtitle="Track your daily mood" onPress={() => router.push('/mood' as any)} />
          <MenuItem icon="account-balance-wallet" title="Expenses" subtitle="Track spending & income" onPress={() => router.push('/expenses' as any)} />
          <MenuItem icon="view-column" title="Kanban Board" subtitle="Visual task workflow" onPress={() => router.push('/kanban' as any)} />
          <MenuItem icon="folder-special" title="Planning" subtitle="Project workspace & files" onPress={() => router.push('/planning' as any)} />
          <MenuItem icon="schedule" title="Flip Clock" subtitle="Clock, timer & stopwatch" onPress={() => router.push('/clock' as any)} />
          <MenuItem icon="center-focus-strong" title="Focus Mode" subtitle="Pomodoro focus timer" onPress={() => router.push('/focus' as any)} />
          <MenuItem icon="date-range" title="Weekly Review" subtitle="Review your week" onPress={() => router.push('/log/weekly')} />
          <MenuItem icon="calendar-today" title="Monthly Review" subtitle="Review your month" onPress={() => router.push('/log/monthly')} />
          <MenuItem icon="bar-chart" title="Analytics" subtitle="View your productivity insights" onPress={() => router.push('/analytics')} />
          <MenuItem icon="emoji-events" title="Achievements" subtitle="Badges and milestones" onPress={() => router.push('/achievements')} />
          <MenuItem icon="search" title="Search" subtitle="Find anything in your planner" onPress={() => router.push('/search')} />
        </View>

        {/* Preferences Section */}
        <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>Preferences</Text>
        <View style={[styles.menuGroup, { backgroundColor: themeColors.cardBackground }]}>
          <MenuItem
            icon="dark-mode"
            title="Dark Mode"
            subtitle={isDark ? 'On' : 'Off'}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            }
          />
          <MenuItem
            icon="notifications"
            title="Notifications"
            subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            }
          />
        </View>

        {/* Data Section */}
        <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>Data</Text>
        <View style={[styles.menuGroup, { backgroundColor: themeColors.cardBackground }]}>
          <MenuItem icon="download-cloud" iconFamily="feather" title="Export Data" subtitle="Download as JSON" onPress={handleExport} />
          <MenuItem icon="upload-cloud" iconFamily="feather" title="Import Data" subtitle="Restore from backup" onPress={handleImport} />
          <MenuItem icon="delete-outline" title="Clear All Data" subtitle="Delete everything" iconBg={themeColors.danger + '20'} iconColor={themeColors.danger} onPress={handleClear} />
        </View>

        {/* Help & Support Section */}
        <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>Help & Support</Text>
        <View style={[styles.menuGroup, { backgroundColor: themeColors.cardBackground }]}>
          <MenuItem icon="github" iconFamily="feather" title="GitHub Repo" subtitle="Source code & issues" onPress={handleOpenRepo} />
          <MenuItem icon="mail" iconFamily="feather" title="Contact Us" subtitle={CONTACT_EMAIL} onPress={handleContactEmail} />
        </View>

        {/* About Section */}
        <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>About</Text>
        <View style={[styles.menuGroup, { backgroundColor: themeColors.cardBackground }]}>
          <MenuItem icon="info" title="About MyPlanner" subtitle={`Version ${APP_VERSION}`} />
          <MenuItem
            icon="system-update"
            title="Check for Updates"
            subtitle="Get the latest version"
            onPress={handleCheckForUpdates}
            rightElement={
              checkingUpdate
                ? <ActivityIndicator size="small" color={themeColors.primary} />
                : <MaterialIcons name="chevron-right" size={22} color={themeColors.textSecondary} />
            }
          />
          <MenuItem icon="star" title="Rate App" subtitle="Love it? Leave a review!" onPress={handleRateApp} />
          <MenuItem icon="share" iconFamily="feather" title="Share with Friends" subtitle="Spread the word" onPress={handleShareApp} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  menuButton: {
    padding: 10,
    borderRadius: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    gap: 14,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: '#FFF',
  },
  profileLevel: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  menuGroup: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
