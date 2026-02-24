import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
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

    const navigate = (path: string) => {
        onClose();
        setTimeout(() => router.push(path as any), 150);
    };

    const handleExport = async () => {
        try {
            const json = await exportAllData();
            downloadJSON(json, `myplanner_backup_${new Date().toISOString().split('T')[0]}.json`);
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

    const handleClear = () => {
        if (typeof window !== 'undefined' && window.confirm('Delete ALL data? This cannot be undone.')) {
            clearAllData();
            onClose();
        }
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={[styles.drawer, { backgroundColor: tc.background }]}>
                    {/* Profile Header */}
                    <LinearGradient colors={[tc.gradientStart, tc.gradientEnd]} style={styles.profileSection} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>M</Text>
                        </View>
                        <Text style={styles.profileName}>Mujju</Text>
                        <Text style={styles.profileLevel}>Level 1 · Beginner</Text>
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
                        <View style={[styles.menuItem]}>
                            <MaterialIcons name="dark-mode" size={20} color={tc.primary} />
                            <Text style={[styles.menuLabel, { color: tc.textPrimary, flex: 1 }]}>Dark Mode</Text>
                            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: tc.border, true: tc.primary }} thumbColor="#FFF" />
                        </View>
                        <View style={[styles.menuItem]}>
                            <MaterialIcons name="notifications" size={20} color={tc.primary} />
                            <Text style={[styles.menuLabel, { color: tc.textPrimary, flex: 1 }]}>Notifications</Text>
                            <Switch value={notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ false: tc.border, true: tc.primary }} thumbColor="#FFF" />
                        </View>

                        {/* Data */}
                        <Text style={[styles.sectionLabel, { color: tc.textSecondary }]}>DATA</Text>
                        <SidebarItem icon="cloud-download" label="Export Data" onPress={handleExport} tc={tc} />
                        <SidebarItem icon="cloud-upload" label="Import Data" onPress={handleImport} tc={tc} />
                        <SidebarItem icon="delete-outline" label="Clear All Data" onPress={handleClear} tc={tc} danger />

                        <View style={{ height: 30 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

function SidebarItem({ icon, label, onPress, tc, danger }: { icon: string; label: string; onPress: () => void; tc: any; danger?: boolean }) {
    return (
        <Pressable style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.6 : 1, cursor: 'pointer' as any }]} onPress={onPress}>
            <MaterialIcons name={icon as any} size={20} color={danger ? tc.danger : tc.primary} />
            <Text style={[styles.menuLabel, { color: danger ? tc.danger : tc.textPrimary }]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, flexDirection: 'row' },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    drawer: { position: 'absolute' as const, left: 0, top: 0, bottom: 0, width: 280, elevation: 10, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10 },
    profileSection: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 24, gap: 4 },
    avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 8 },
    avatarText: { fontSize: 20, fontWeight: '700' as any, color: '#FFF' },
    profileName: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any, color: '#FFF' },
    profileLevel: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.7)' },
    menuScroll: { flex: 1, paddingHorizontal: 12 },
    sectionLabel: { fontSize: 11, fontWeight: typography.weights.bold as any, letterSpacing: 1.5, marginTop: 20, marginBottom: 4, paddingHorizontal: 12 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
    menuLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium as any },
});
