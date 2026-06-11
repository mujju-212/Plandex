import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomTabBarProps, Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../../src/components/common/Card';
import Tag from '../../src/components/common/Tag';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { shadows } from '../../src/theme/shadows';
import { typography } from '../../src/theme/typography';

/* ─── Custom Floating Tab Bar ─── */
function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useThemeStore();

  const TAB_ICONS: Record<string, { lib: 'material' | 'feather'; name: string }> = {
    index:    { lib: 'material', name: 'home' },
    todos:    { lib: 'material', name: 'check-circle-outline' },
    logs:     { lib: 'material', name: 'insert-drive-file' },
    calendar: { lib: 'material', name: 'calendar-today' },
    more:     { lib: 'feather',  name: 'more-horizontal' },
  };

  // Routes that should never appear in the tab bar
  const HIDDEN_ROUTES = new Set(['explore']);
  const visibleRoutes = state.routes.filter(r => !HIDDEN_ROUTES.has(r.name));

  return (
    <View
      style={[
        styles.tabBarWrap,
        {
          bottom: Platform.OS === 'ios' ? 28 : 18,
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
      pointerEvents="box-none"
    >
      {visibleRoutes.map((route) => {
        const isFocused = state.index === state.routes.indexOf(route);
        const iconCfg = TAB_ICONS[route.name] ?? { lib: 'material', name: 'circle' };

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <View style={styles.tabInner}>
              {iconCfg.lib === 'material' ? (
                <MaterialIcons
                  name={iconCfg.name as any}
                  size={24}
                  color={isFocused ? colors.primary : colors.textSecondary}
                />
              ) : (
                <Feather
                  name={iconCfg.name as any}
                  size={22}
                  color={isFocused ? colors.primary : colors.textSecondary}
                />
              )}
              {isFocused && (
                <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ─── Tab Layout ─── */
export default function TabLayout() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const [quickAddChoice, setQuickAddChoice] = useState<'todo' | 'event' | 'note' | null>(null);
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);

  const quickAddOptions = useMemo(() => ([
    { key: 'todo' as const, label: 'Task',  icon: 'check-box' as const, route: '/todo/create' as const },
    { key: 'event' as const, label: 'Event', icon: 'event' as const,     route: '/event/create' as const },
    { key: 'note' as const, label: 'Note',  icon: 'note' as const,       route: '/notes' as const },
  ]), []);

  useEffect(() => {
    AsyncStorage.getItem('quick_add_last')
      .then((raw) => {
        if (raw === 'todo' || raw === 'event' || raw === 'note') setQuickAddChoice(raw);
      })
      .catch(() => {});
  }, []);

  const openQuickAdd = (choice: 'todo' | 'event' | 'note') => {
    setQuickAddChoice(choice);
    AsyncStorage.setItem('quick_add_last', choice).catch(() => {});
    setShowQuickAddMenu(false);
    const opt = quickAddOptions.find(o => o.key === choice);
    if (opt) router.push(opt.route as any);
  };

  const handleQuickAddPress = () => {
    if (!quickAddChoice) { setShowQuickAddMenu(true); return; }
    openQuickAdd(quickAddChoice);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
          animation: 'shift',
        }}
      >
        <Tabs.Screen name="index"    options={{ title: 'Home' }} />
        <Tabs.Screen name="todos"    options={{ title: 'Todos' }} />
        <Tabs.Screen name="logs"     options={{ title: 'Logs' }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
        <Tabs.Screen name="more"     options={{ title: 'More' }} />
        <Tabs.Screen name="explore"  options={{ href: null }} />
      </Tabs>

      {/* FAB */}
      <Pressable
        onPress={handleQuickAddPress}
        onLongPress={() => setShowQuickAddMenu(true)}
        style={({ pressed }) => [
          styles.quickAddBtn,
          {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            opacity: pressed ? 0.9 : 1,
            bottom: Platform.OS === 'ios' ? 108 : 98,
          },
        ]}
      >
        <MaterialIcons name="add" size={28} color="#FFF" />
      </Pressable>

      {/* Quick-add modal */}
      <Modal
        visible={showQuickAddMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuickAddMenu(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowQuickAddMenu(false)}>
          <Card
            style={[styles.quickAddMenu, { backgroundColor: colors.cardBackground }]}
            withShadow={false}
            withMargin={false}
          >
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Quick Add</Text>
              <Pressable onPress={() => setShowQuickAddMenu(false)} hitSlop={10}>
                <MaterialIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.menuChips}>
              {quickAddOptions.map((opt) => (
                <Tag
                  key={opt.key}
                  label={opt.label}
                  variant="chip"
                  selected={quickAddChoice === opt.key}
                  onPress={() => openQuickAdd(opt.key)}
                />
              ))}
            </View>
            <View style={styles.menuList}>
              {quickAddOptions.map((opt) => (
                <Pressable
                  key={`row-${opt.key}`}
                  onPress={() => openQuickAdd(opt.key)}
                  style={({ pressed }) => [
                    styles.menuRow,
                    { backgroundColor: pressed ? colors.border + '40' : 'transparent' },
                  ]}
                >
                  <View style={[styles.menuIcon, { backgroundColor: colors.primary + '18' }]}>
                    <MaterialIcons name={opt.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.menuRowText, { color: colors.textPrimary }]}>{opt.label}</Text>
                  {quickAddChoice === opt.key
                    ? <MaterialIcons name="check" size={20} color={colors.primary} />
                    : <View style={{ width: 20 }} />}
                </Pressable>
              ))}
            </View>
            <Text style={[styles.menuHint, { color: colors.textSecondary }]}>
              Tap to open. Long-press + to pick a different type.
            </Text>
          </Card>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Floating tab bar ── */
  tabBarWrap: {
    position: 'absolute',
    left: 40,
    right: 40,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',  // ← centers icon vertically
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  /* ── FAB ── */
  quickAddBtn: {
    position: 'absolute',
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadows.lg,
  },

  /* ── Quick-add modal ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  quickAddMenu: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 18,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
  },
  menuChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  menuList: { gap: 4, marginBottom: 10 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 10,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowText: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold as any,
  },
  menuHint: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
});
