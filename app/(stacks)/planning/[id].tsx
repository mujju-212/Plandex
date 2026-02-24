import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
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
import { usePlanningStore } from '../../../src/stores/usePlanningStore';
import { useThemeStore } from '../../../src/stores/useThemeStore';
import { typography } from '../../../src/theme/typography';
import { PlanningNote } from '../../../src/types/planning.types';

const SCREEN_W = Dimensions.get('window').width;

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tc = useThemeStore().colors;
  const store = usePlanningStore();
  const { currentProject, notes, files, loadProjectDetail, addNote, updateNote, deleteNote, addFile, deleteFile } = store;

  const [tab, setTab] = useState<'notes' | 'files'>('notes');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<PlanningNote | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    if (id) loadProjectDetail(Number(id));
  }, [id]);

  const projectColor = currentProject?.color || '#4F46E5';

  /* ── Notes ── */
  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    if (editingNote) {
      await updateNote(editingNote.id, noteTitle.trim() || '', noteContent.trim());
    } else {
      await addNote(Number(id), noteTitle.trim() || undefined, noteContent.trim());
    }
    setShowNoteModal(false);
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
  };

  const openEditNote = (note: PlanningNote) => {
    setEditingNote(note);
    setNoteTitle(note.title || '');
    setNoteContent(note.content);
    setShowNoteModal(true);
  };

  const confirmDeleteNote = (noteId: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this note?')) deleteNote(noteId);
    } else {
      Alert.alert('Delete Note', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteNote(noteId) },
      ]);
    }
  };

  /* ── Files ── */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const name = asset.uri.split('/').pop() || 'image';
    const ext = name.split('.').pop()?.toLowerCase();
    const fileType = asset.type === 'video' ? 'video' : 'image';
    await addFile({
      project_id: Number(id),
      file_name: name,
      file_uri: asset.uri,
      file_type: fileType,
      file_size: asset.fileSize || 0,
    });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const doc = result.assets[0];
    const ext = doc.name.split('.').pop()?.toLowerCase();
    let fileType: 'pdf' | 'document' | 'audio' | 'other' = 'other';
    if (ext === 'pdf') fileType = 'pdf';
    else if (['doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext || '')) fileType = 'document';
    else if (['mp3', 'wav', 'aac', 'm4a'].includes(ext || '')) fileType = 'audio';
    await addFile({
      project_id: Number(id),
      file_name: doc.name,
      file_uri: doc.uri,
      file_type: fileType,
      file_size: doc.size || 0,
    });
  };

  const confirmDeleteFile = (fileId: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this file?')) deleteFile(fileId);
    } else {
      Alert.alert('Remove File', 'Remove this file from the project?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteFile(fileId) },
      ]);
    }
  };

  const getFileIcon = (type: string): string => {
    switch (type) {
      case 'image': return 'image';
      case 'video': return 'videocam';
      case 'pdf': return 'picture-as-pdf';
      case 'audio': return 'audiotrack';
      case 'document': return 'description';
      default: return 'insert-drive-file';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ── Export ZIP ── */
  const handleExport = async () => {
    if (Platform.OS === 'web') {
      window.alert('ZIP export is available on mobile devices');
      return;
    }
    try {
      const JSZip = require('jszip');
      const zip = new JSZip();

      // Add notes as text files
      notes.forEach((note, i) => {
        const title = note.title || `Note ${i + 1}`;
        zip.file(`notes/${title}.txt`, note.content);
      });

      // Add files
      for (const file of files) {
        try {
          const base64 = await FileSystem.readAsStringAsync(file.file_uri, { encoding: FileSystem.EncodingType.Base64 });
          zip.file(`files/${file.file_name}`, base64, { base64: true });
        } catch { /* skip missing files */ }
      }

      const base64Zip = await zip.generateAsync({ type: 'base64' });
      const zipUri = FileSystem.documentDirectory + `${currentProject?.title || 'project'}_export.zip`;
      await FileSystem.writeAsStringAsync(zipUri, base64Zip, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(zipUri);
    } catch (err) {
      Alert.alert('Export Failed', 'Could not create ZIP file');
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
        <View style={styles.headerCenter}>
          <MaterialIcons name={(currentProject?.icon as any) || 'folder'} size={22} color={projectColor} />
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]} numberOfLines={1}>
            {currentProject?.title || 'Project'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleExport} hitSlop={8}>
          <MaterialIcons name="ios-share" size={22} color={tc.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderColor: tc.border }]}>
        {(['notes', 'files'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && { borderBottomColor: projectColor, borderBottomWidth: 3 }]}
            onPress={() => setTab(t)}
          >
            <MaterialIcons name={t === 'notes' ? 'description' : 'attach-file'} size={18} color={tab === t ? projectColor : tc.textSecondary} />
            <Text style={[styles.tabText, { color: tab === t ? projectColor : tc.textSecondary }]}>
              {t === 'notes' ? `Notes (${notes.length})` : `Files (${files.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tab === 'notes' ? (
          notes.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="note-add" size={48} color={tc.border} />
              <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No notes yet</Text>
            </View>
          ) : (
            notes.map(note => (
              <TouchableOpacity
                key={note.id}
                style={[styles.noteCard, { backgroundColor: tc.cardBackground }]}
                onPress={() => openEditNote(note)}
                activeOpacity={0.7}
              >
                <View style={styles.noteHeader}>
                  <Text style={[styles.noteTitle, { color: tc.textPrimary }]}>{note.title || 'Untitled'}</Text>
                  <TouchableOpacity onPress={() => confirmDeleteNote(note.id)} hitSlop={8}>
                    <MaterialIcons name="delete-outline" size={18} color={tc.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.noteContent, { color: tc.textSecondary }]} numberOfLines={3}>
                  {note.content}
                </Text>
              </TouchableOpacity>
            ))
          )
        ) : (
          <>
            {/* Add file buttons */}
            <View style={styles.addFileRow}>
              <TouchableOpacity
                style={[styles.addFileBtn, { backgroundColor: projectColor + '15', borderColor: projectColor }]}
                onPress={pickImage}
              >
                <MaterialIcons name="photo-library" size={22} color={projectColor} />
                <Text style={[styles.addFileBtnText, { color: projectColor }]}>Photo/Video</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addFileBtn, { backgroundColor: projectColor + '15', borderColor: projectColor }]}
                onPress={pickDocument}
              >
                <MaterialIcons name="upload-file" size={22} color={projectColor} />
                <Text style={[styles.addFileBtnText, { color: projectColor }]}>Document</Text>
              </TouchableOpacity>
            </View>

            {files.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="cloud-upload" size={48} color={tc.border} />
                <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No files yet</Text>
              </View>
            ) : (
              files.map(file => (
                <View key={file.id} style={[styles.fileCard, { backgroundColor: tc.cardBackground }]}>
                  {file.file_type === 'image' ? (
                    <Image source={{ uri: file.file_uri }} style={styles.fileThumbnail} />
                  ) : (
                    <View style={[styles.fileIconBox, { backgroundColor: projectColor + '15' }]}>
                      <MaterialIcons name={getFileIcon(file.file_type) as any} size={24} color={projectColor} />
                    </View>
                  )}
                  <View style={styles.fileInfo}>
                    <Text style={[styles.fileName, { color: tc.textPrimary }]} numberOfLines={1}>{file.file_name}</Text>
                    <Text style={[styles.fileMeta, { color: tc.textSecondary }]}>
                      {file.file_type.toUpperCase()} · {formatSize(file.file_size)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmDeleteFile(file.id)} hitSlop={8}>
                    <MaterialIcons name="close" size={18} color={tc.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Note FAB (notes tab only) */}
      {tab === 'notes' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: projectColor }]}
          onPress={() => { setEditingNote(null); setNoteTitle(''); setNoteContent(''); setShowNoteModal(true); }}
        >
          <MaterialIcons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Note Modal */}
      <Modal visible={showNoteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: tc.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.textPrimary }]}>
                {editingNote ? 'Edit Note' : 'New Note'}
              </Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <MaterialIcons name="close" size={24} color={tc.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: tc.background, color: tc.textPrimary, borderColor: tc.border }]}
              placeholder="Title (optional)"
              placeholderTextColor={tc.textSecondary}
              value={noteTitle}
              onChangeText={setNoteTitle}
            />

            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: tc.background, color: tc.textPrimary, borderColor: tc.border },
              ]}
              placeholder="Write your note..."
              placeholderTextColor={tc.textSecondary}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: projectColor }]} onPress={handleSaveNote}>
              <Text style={styles.saveBtnText}>{editingNote ? 'Update' : 'Save'}</Text>
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
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any },
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: 20,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12, fontSize: typography.sizes.md },
  /* Notes */
  noteCard: { padding: 16, borderRadius: 14, marginBottom: 12 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semiBold as any, flex: 1 },
  noteContent: { fontSize: typography.sizes.sm, lineHeight: 20 },
  /* Files */
  addFileRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  addFileBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed',
  },
  addFileBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  fileCard: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 10, gap: 12,
  },
  fileThumbnail: { width: 48, height: 48, borderRadius: 10 },
  fileIconBox: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1 },
  fileName: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold as any },
  fileMeta: { fontSize: typography.sizes.xs, marginTop: 2 },
  /* FAB */
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: typography.sizes.md, marginBottom: 12 },
  textArea: { height: 160 },
  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any },
});
