import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import FAB from '../../../src/components/common/FAB';
import { usePlanningStore } from '../../../src/stores/usePlanningStore';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { typography } from '../../../src/theme/typography';
import { PROJECT_COLORS, PROJECT_ICONS } from '../../../src/types/planning.types';

export default function PlanningScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { projects, loadProjects, addProject, deleteProject, isLoading } = usePlanningStore();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(PROJECT_ICONS[0]);

  useEffect(() => { loadProjects(); }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedColor(PROJECT_COLORS[0]);
    setSelectedIcon(PROJECT_ICONS[0]);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      const msg = 'Please enter a project name';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Required', msg);
      return;
    }
    try {
      const project = await addProject({
        title: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        icon: selectedIcon,
      });
      setShowModal(false);
      resetForm();
      router.push(`/planning/${project.id}` as any);
    } catch { }
  };

  const handleDelete = (id: number) => {
    const doDelete = async () => { await deleteProject(id); };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this project and all its contents?')) doDelete();
    } else {
      Alert.alert('Delete Project', 'This will delete all notes and files in this project.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Planning</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="folder-open" size={64} color={tc.border} />
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No projects yet</Text>
            <Text style={[styles.emptySubText, { color: tc.textSecondary }]}>
              Create a project to organize notes, images, PDFs & more
            </Text>
          </View>
        ) : (
          projects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={[styles.projectCard, { backgroundColor: tc.cardBackground }]}
              onPress={() => router.push(`/planning/${project.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.projectIcon, { backgroundColor: project.color + '20' }]}>
                <MaterialIcons name={project.icon as any || 'folder'} size={24} color={project.color} />
              </View>
              <View style={styles.projectContent}>
                <Text style={[styles.projectName, { color: tc.textPrimary }]}>{project.title}</Text>
                {project.description && (
                  <Text style={[styles.projectDesc, { color: tc.textSecondary }]} numberOfLines={1}>
                    {project.description}
                  </Text>
                )}
                <View style={styles.projectMeta}>
                  <View style={styles.metaBadge}>
                    <MaterialIcons name="description" size={12} color={tc.textSecondary} />
                    <Text style={[styles.metaText, { color: tc.textSecondary }]}>{project.notes_count || 0} notes</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <MaterialIcons name="attach-file" size={12} color={tc.textSecondary} />
                    <Text style={[styles.metaText, { color: tc.textSecondary }]}>{project.files_count || 0} files</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(project.id)} hitSlop={8}>
                <MaterialIcons name="delete-outline" size={20} color={tc.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB onPress={() => setShowModal(true)} />

      {/* Create Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: tc.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.textPrimary }]}>New Project</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                <MaterialIcons name="close" size={24} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: tc.background, color: tc.textPrimary, borderColor: tc.border }]}
              placeholder="Project name"
              placeholderTextColor={tc.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={[styles.input, { backgroundColor: tc.background, color: tc.textPrimary, borderColor: tc.border }]}
              placeholder="Description (optional)"
              placeholderTextColor={tc.textSecondary}
              value={description}
              onChangeText={setDescription}
            />

            {/* Color Picker */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {PROJECT_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorDot, { backgroundColor: color }, selectedColor === color && styles.colorDotSelected]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <MaterialIcons name="check" size={14} color="#FFF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Icon Picker */}
            <Text style={[styles.fieldLabel, { color: tc.textSecondary }]}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {PROJECT_ICONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconBtn,
                    { backgroundColor: tc.background, borderColor: tc.border },
                    selectedIcon === icon && { backgroundColor: selectedColor + '20', borderColor: selectedColor },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <MaterialIcons name={icon as any} size={22} color={selectedIcon === icon ? selectedColor : tc.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: selectedColor }]} onPress={handleCreate}>
              <Text style={styles.saveBtnText}>Create Project</Text>
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
    paddingHorizontal: 20, paddingTop: 30, paddingBottom: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold as any },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  projectCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, gap: 14,
  },
  projectIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  projectContent: { flex: 1 },
  projectName: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
  projectDesc: { fontSize: typography.sizes.sm, marginTop: 2 },
  projectMeta: { flexDirection: 'row', gap: 16, marginTop: 6 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: typography.sizes.xs },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { marginTop: 16, fontSize: typography.sizes.lg, fontWeight: typography.weights.semiBold as any },
  emptySubText: { marginTop: 8, fontSize: typography.sizes.sm, textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: typography.sizes.md, marginBottom: 12 },
  fieldLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any, marginBottom: 8, marginTop: 4 },
  pickerRow: { marginBottom: 16, maxHeight: 50 },
  colorDot: { width: 36, height: 36, borderRadius: 18, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  colorDotSelected: { borderWidth: 3, borderColor: '#333' },
  iconBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
});
