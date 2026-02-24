import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import FAB from '../../src/components/common/FAB';
import { useNoteStore } from '../../src/stores/useNoteStore';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { typography } from '../../src/theme/typography';
import { NOTE_COLORS } from '../../src/types/note.types';

export default function NotesScreen() {
  const router = useRouter();
  const tc = useThemeStore().colors;
  const { notes, loadNotes, addNote, updateNote, deleteNote, togglePin, isLoading } = useNoteStore();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadNotes(); }, []);

  const filteredNotes = searchQuery
    ? notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : notes;

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedColor(NOTE_COLORS[0]);
    setEditId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (note: typeof notes[0]) => {
    setTitle(note.title);
    setContent(note.content);
    setSelectedColor(note.color);
    setEditId(note.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    try {
      if (editId) {
        await updateNote(editId, { title: title.trim(), content: content.trim(), color: selectedColor });
      } else {
        await addNote({ title: title.trim(), content: content.trim(), color: selectedColor });
      }
      setShowModal(false);
      resetForm();
    } catch { }
  };

  const handleDelete = (id: number) => {
    const doDelete = async () => { await deleteNote(id); };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this note?')) doDelete();
    } else {
      Alert.alert('Delete Note', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const getContrastText = (bg: string) => {
    const hex = bg.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#1a1a2e' : '#FFFFFF';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.background }]}>  
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Sticky Notes</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: tc.cardBackground }]}>
        <MaterialIcons name="search" size={20} color={tc.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: tc.textPrimary }]}
          placeholder="Search notes..."
          placeholderTextColor={tc.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={18} color={tc.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Notes Grid */}
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="sticky-note-2" size={64} color={tc.border} />
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
              {searchQuery ? 'No matching notes' : 'No notes yet. Tap + to create one!'}
            </Text>
          </View>
        ) : (
          <View style={styles.gridRow}>
            {filteredNotes.map((note) => {
              const textColor = getContrastText(note.color);
              return (
                <TouchableOpacity
                  key={note.id}
                  style={[styles.noteCard, { backgroundColor: note.color }]}
                  onPress={() => openEdit(note)}
                  activeOpacity={0.8}
                >
                  {note.is_pinned && (
                    <MaterialIcons name="push-pin" size={16} color={textColor} style={styles.pinIcon} />
                  )}
                  {note.title ? (
                    <Text style={[styles.noteTitle, { color: textColor }]} numberOfLines={2}>
                      {note.title}
                    </Text>
                  ) : null}
                  <Text style={[styles.noteContent, { color: textColor + 'CC' }]} numberOfLines={6}>
                    {note.content}
                  </Text>
                  <View style={styles.noteActions}>
                    <TouchableOpacity onPress={() => togglePin(note.id)} hitSlop={8}>
                      <MaterialIcons
                        name={note.is_pinned ? 'push-pin' : 'outlined-flag'}
                        size={18}
                        color={textColor + '99'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(note.id)} hitSlop={8}>
                      <MaterialIcons name="delete-outline" size={18} color={textColor + '99'} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB onPress={openCreate} />

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: tc.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.textPrimary }]}>
                {editId ? 'Edit Note' : 'New Note'}
              </Text>
              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                <MaterialIcons name="close" size={24} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: tc.background, color: tc.textPrimary, borderColor: tc.border }]}
              placeholder="Title (optional)"
              placeholderTextColor={tc.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.input, styles.contentInput, { backgroundColor: tc.background, color: tc.textPrimary, borderColor: tc.border }]}
              placeholder="Write your note..."
              placeholderTextColor={tc.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            {/* Color Picker */}
            <Text style={[styles.colorLabel, { color: tc.textSecondary }]}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
              {NOTE_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorDotSelected,
                  ]}
                  onPress={() => setSelectedColor(c)}
                >
                  {selectedColor === c && (
                    <MaterialIcons name="check" size={16} color={getContrastText(c)} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Preview */}
            <View style={[styles.preview, { backgroundColor: selectedColor }]}>
              <Text style={[styles.previewText, { color: getContrastText(selectedColor) }]}>
                {title || content || 'Preview'}
              </Text>
            </View>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: tc.primary }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{editId ? 'Update' : 'Create'}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: typography.sizes.md, padding: 0 },
  grid: { paddingHorizontal: 12 },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  noteCard: {
    width: '48%',
    minHeight: 140,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    position: 'relative',
  },
  pinIcon: { position: 'absolute', top: 10, right: 10 },
  noteTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    marginBottom: 6,
  },
  noteContent: {
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    flex: 1,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { marginTop: 16, fontSize: typography.sizes.md, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: typography.sizes.md,
    marginBottom: 12,
  },
  contentInput: { height: 120, textAlignVertical: 'top' },
  colorLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold as any,
    marginBottom: 8,
  },
  colorRow: { marginBottom: 16, maxHeight: 50 },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#333',
  },
  preview: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    minHeight: 50,
  },
  previewText: { fontSize: typography.sizes.sm },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
  },
});
