import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useGamificationStore } from '../../stores/useGamificationStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { typography } from '../../theme/typography';
import { clearAllData, downloadJSON, exportAllData, importAllData, triggerImportDialog } from '../../utils/dataUtils';

type SidebarProps = {
    visible: boolean;
    onClose: () => void;
};

export default function Sidebar({ visible, onClose }: SidebarProps) {
    const router = useRouter();
    const { isDark, toggleTheme, colors: tc } = useThemeStore();
    const { notificationsEnabled, toggleNotifications } = useSettingsStore();
    const { currentLevel, levelTitle, totalXP, currentStreak, loadStats } = useGamificationStore();
    const [profileName, setProfileName] = useState('User');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

    const loadProfile = useCallback(async () => {
        try {
            const [name, photo] = await Promise.all([
                AsyncStorage.getItem('profile_name'),
                AsyncStorage.getItem('profile_photo_uri'),
            ]);
            setProfileName(name?.trim() ? name : 'User');
            setProfilePhoto(photo || null);
        } catch {
            setProfileName('User');
            setProfilePhoto(null);
        }
        loadStats();
    }, [loadStats]);

    useEffect(() => {
        if (visible) {
            loadProfile();
        }
    }, [visible, loadProfile]);

    const navigate = (path: string) => {
        onClose();
        setTimeout(() => router.push(path as any), 150);
    };

    const handleExport = async () => {
        try {
            const json = await exportAllData();
            downloadJSON(json, `plandex_backup_${new Date().toISOString().split('T')[0]}.json`);
            onClose();
        } catch (e: any) { }
    };

    const handleImport = async () => {
        try {
            const json = await triggerImportDialog();
            await importAllData(json);
            onClose();
        } catch (e: any) { }
    };

    const clearAll = async () => {
        try {
            await clearAllData();
            onClose();
        } catch {
            Alert.alert('Error', 'Failed to clear data. Please try again.');
        }
    };

    const handleClear = () => {
        const message = 'Delete ALL data? This cannot be undone.';

        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined' && typeof window.confirm === 'function' && window.confirm(message)) {
                void clearAll();
            }
            return;
        }

        Alert.alert('Clear All Data', message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => { void clearAll(); } },
        ]);
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={[styles.drawer, { backgroundColor: tc.background }]}>
                    {/* Profile Header */}
                    <LinearGradient
                        colors={[tc.gradientStart + 'EE', tc.gradientEnd + 'EE']}
                        style={styles.profileSection}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Pressable onPress={() => navigate('/profile')} style={styles.avatarWrap}>
                            <View style={styles.avatarCircle}>
                                {profilePhoto
                                    ? <Image source={{ uri: profilePhoto }} style={styles.avatarImage} contentFit="cover" />
                                    : <Text style={styles.avatarText}>{profileName.charAt(0).toUpperCase()}</Text>
                                }
                            </View>
                            {/* Edit badge */}
                            <View style={[styles.editBadge, { backgroundColor: tc.gradientEnd }]}>
                                <MaterialIcons name="edit" size={10} color="#FFF" />
                            </View>
                        </Pressable>
                        <View style={styles.profileMeta}>
                            <Text style={styles.profileName}>{profileName}</Text>
                            <Text style={styles.profileLevel}>Level {currentLevel} · {levelTitle}</Text>
                        </View>
                        {/* XP + Streak pills */}
                        <View style={styles.profileStatRow}>
                            <View style={styles.profileStatPill}>
                                <MaterialIcons name="bolt" size={13} color="#FFD54F" />
                                <Text style={styles.profileStatText}>{totalXP} XP</Text>
                            </View>
                            <View style={styles.profileStatPill}>
                                <MaterialIcons name="local-fire-department" size={13} color="#FF7043" />
                                <Text style={styles.profileStatText}>{currentStreak}d</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
                        {/* Navigation */}
                        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>NAVIGATE</Text>
                        <SidebarItem icon="home" label="Home" onPress={() => navigate('/')} tc={tc} />
                        <SidebarItem icon="check-circle-outline" label="Todos" onPress={() => navigate('/todos')} tc={tc} />
                        <SidebarItem icon="insert-drive-file" label="Daily Log" onPress={() => navigate('/logs')} tc={tc} />
                        <SidebarItem icon="calendar-today" label="Calendar" onPress={() => navigate('/calendar')} tc={tc} />

                        {/* Features */}
                        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>FEATURES</Text>
                        <SidebarItem icon="flag" label="Goals" onPress={() => navigate('/goal/create')} tc={tc} />
                        <SidebarItem icon="loop" label="Habits" onPress={() => navigate('/habit/create')} tc={tc} />
                        <SidebarItem icon="note" label="Sticky Notes" onPress={() => navigate('/notes')} tc={tc} />
                        <SidebarItem icon="mood" label="Mood Tracker" onPress={() => navigate('/mood')} tc={tc} />
                        <SidebarItem icon="account-balance-wallet" label="Expenses" onPress={() => navigate('/expenses')} tc={tc} />
                        <SidebarItem icon="view-column" label="Kanban Board" onPress={() => navigate('/kanban')} tc={tc} />
                        <SidebarItem icon="folder-special" label="Planning" onPress={() => navigate('/planning')} tc={tc} />
                        <SidebarItem icon="schedule" label="Flip Clock" onPress={() => navigate('/clock')} tc={tc} />
                        <SidebarItem icon="center-focus-strong" label="Focus Mode" onPress={() => navigate('/focus')} tc={tc} />
                        <SidebarItem icon="date-range" label="Weekly Review" onPress={() => navigate('/log/weekly')} tc={tc} />
                        <SidebarItem icon="calendar-today" label="Monthly Review" onPress={() => navigate('/log/monthly')} tc={tc} />
                        <SidebarItem icon="bar-chart" label="Analytics" onPress={() => navigate('/analytics')} tc={tc} />
                        <SidebarItem icon="emoji-events" label="Achievements" onPress={() => navigate('/achievements')} tc={tc} />
                        <SidebarItem icon="search" label="Search" onPress={() => navigate('/search')} tc={tc} />

                        {/* Preferences */}
                        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>PREFERENCES</Text>
                        <View style={styles.menuItem}>
                            <View style={[styles.menuIconWrap, { backgroundColor: tc.primary + '20' }]}>
                                <MaterialIcons name="dark-mode" size={18} color={tc.primary} />
                            </View>
                            <Text style={[styles.menuLabel, { color: tc.textPrimary, flex: 1 }]}>Dark Mode</Text>
                            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: tc.border, true: tc.primary }} thumbColor="#FFF" />
                        </View>
                        <View style={styles.menuItem}>
                            <View style={[styles.menuIconWrap, { backgroundColor: tc.primary + '20' }]}>
                                <MaterialIcons name="notifications" size={18} color={tc.primary} />
                            </View>
                            <Text style={[styles.menuLabel, { color: tc.textPrimary, flex: 1 }]}>Notifications</Text>
                            <Switch value={notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ false: tc.border, true: tc.primary }} thumbColor="#FFF" />
                        </View>

                        {/* Data */}
                        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>DATA</Text>
                        <SidebarItem icon="cloud-download" label="Export Data" onPress={handleExport} tc={tc} />
                        <SidebarItem icon="cloud-upload" label="Import Data" onPress={handleImport} tc={tc} />
                        <SidebarItem icon="delete-outline" label="Clear All Data" onPress={handleClear} tc={tc} danger />

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

function SidebarItem({ icon, label, onPress, tc, danger }: { icon: string; label: string; onPress: () => void; tc: any; danger?: boolean }) {
    return (
        <Pressable
            style={({ pressed }) => [styles.menuItem, { backgroundColor: pressed ? tc.primary + '10' : 'transparent', cursor: 'pointer' as any }]}
            onPress={onPress}
        >
            <View style={[styles.menuIconWrap, { backgroundColor: danger ? tc.danger + '15' : tc.primary + '15' }]}>
                <MaterialIcons name={icon as any} size={18} color={danger ? tc.danger : tc.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: danger ? tc.danger : tc.textPrimary }]}>{label}</Text>
            <MaterialIcons name="chevron-right" size={16} color={danger ? tc.danger + '80' : tc.textSecondary + '60'} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, flexDirection: 'row' },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    drawer: {
        position: 'absolute' as const,
        left: 0,
        top: 0,
        bottom: 0,
        width: 290,
        elevation: 24,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    profileSection: {
        paddingTop: 52,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    avatarWrap: {
        position: 'relative',
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    avatarCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        overflow: 'hidden' as const,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    avatarImage: { width: 60, height: 60, borderRadius: 30 },
    avatarText: { fontSize: 24, fontWeight: '700' as any, color: '#FFF' },
    profileMeta: { gap: 2 },
    profileName: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold as any,
        color: '#FFF',
    },
    profileLevel: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.75)' },
    profileStatRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    profileStatPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    profileStatText: {
        fontSize: 11,
        fontWeight: '600' as any,
        color: '#FFF',
    },
    menuScroll: { flex: 1, paddingHorizontal: 10, paddingTop: 4 },
    sectionLabel: {
        fontSize: 10,
        fontWeight: typography.weights.bold as any,
        letterSpacing: 1.5,
        marginTop: 18,
        marginBottom: 2,
        paddingHorizontal: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginVertical: 1,
    },
    menuIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: { flex: 1, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium as any },
});
