import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Plus, Folder, Edit2, Trash2, Check } from 'lucide-react-native';
import { useSettings } from '../utils/settings';
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  type ConversationFolder,
} from '../utils/bookmarks';

interface FolderManagerProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onFolderSelect?: (folderId: string) => void;
}

const FOLDER_COLORS = [
  '#1E2D3D',
  '#2563EB',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
];

const FOLDER_ICONS = ['folder', 'book', 'heart', 'star', 'bookmark'];

export function FolderManager({
  visible,
  userId,
  onClose,
  onFolderSelect,
}: FolderManagerProps) {
  const { theme } = useSettings();
  const [folders, setFolders] = useState<ConversationFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: FOLDER_COLORS[0],
    icon: 'folder',
  });

  useEffect(() => {
    if (visible) {
      loadFolders();
    }
  }, [visible, userId]);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const data = await getFolders(userId);
      setFolders(data);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    setLoading(true);
    try {
      const newFolder = await createFolder(
        userId,
        formData.name.trim(),
        formData.color,
        formData.icon
      );

      if (newFolder) {
        setFolders(prev => [...prev, newFolder]);
        setShowCreateForm(false);
        setFormData({
          name: '',
          color: FOLDER_COLORS[0],
          icon: 'folder',
        });
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      Alert.alert('Error', 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFolder = async (folderId: string) => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    setLoading(true);
    try {
      const success = await updateFolder(folderId, {
        name: formData.name.trim(),
        color: formData.color,
        icon: formData.icon,
      });

      if (success) {
        setFolders(prev =>
          prev.map(f =>
            f.id === folderId
              ? { ...f, name: formData.name.trim(), color: formData.color, icon: formData.icon }
              : f
          )
        );
        setEditingId(null);
        setFormData({
          name: '',
          color: FOLDER_COLORS[0],
          icon: 'folder',
        });
      }
    } catch (error) {
      console.error('Error updating folder:', error);
      Alert.alert('Error', 'Failed to update folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folderName}"? Conversations in this folder will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await deleteFolder(folderId);
              if (success) {
                setFolders(prev => prev.filter(f => f.id !== folderId));
              }
            } catch (error) {
              console.error('Error deleting folder:', error);
              Alert.alert('Error', 'Failed to delete folder');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const startEdit = (folder: ConversationFolder) => {
    setEditingId(folder.id);
    setFormData({
      name: folder.name,
      color: folder.color,
      icon: folder.icon,
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      color: FOLDER_COLORS[0],
      icon: 'folder',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <Folder size={24} color={theme.primary} strokeWidth={2} />
            <Text style={[styles.headerTitle, { color: theme.text }]}>Folders</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={theme.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Create Folder Button */}
          {!showCreateForm && !editingId && (
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowCreateForm(true)}
            >
              <Plus size={20} color="#fff" strokeWidth={2} />
              <Text style={styles.createButtonText}>Create New Folder</Text>
            </TouchableOpacity>
          )}

          {/* Create/Edit Form */}
          {(showCreateForm || editingId) && (
            <View style={[styles.form, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                {editingId ? 'Edit Folder' : 'New Folder'}
              </Text>

              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.name}
                onChangeText={name => setFormData(prev => ({ ...prev, name }))}
                placeholder="Folder name"
                placeholderTextColor={theme.inputPlaceholder}
              />

              <Text style={[styles.label, { color: theme.textSecondary }]}>Color</Text>
              <View style={styles.colorPicker}>
                {FOLDER_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      formData.color === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, color }))}
                  >
                    {formData.color === color && (
                      <Check size={16} color="#fff" strokeWidth={3} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton, { borderColor: theme.border }]}
                  onPress={cancelEdit}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.saveButton, { backgroundColor: theme.primary }]}
                  onPress={() =>
                    editingId ? handleUpdateFolder(editingId) : handleCreateFolder()
                  }
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingId ? 'Update' : 'Create'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Folders List */}
          {loading && folders.length === 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}

          {!loading && folders.length === 0 && !showCreateForm && (
            <View style={styles.emptyContainer}>
              <Folder size={64} color={theme.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No folders yet
              </Text>
              <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
                Create folders to organize your conversations
              </Text>
            </View>
          )}

          {folders.length > 0 && (
            <View style={styles.foldersList}>
              {folders.map(folder => (
                <View
                  key={folder.id}
                  style={[
                    styles.folderItem,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.folderColor, { backgroundColor: folder.color }]} />
                  <View style={styles.folderContent}>
                    <Text style={[styles.folderName, { color: theme.text }]}>
                      {folder.name}
                    </Text>
                  </View>
                  <View style={styles.folderActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => startEdit(folder)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Edit2 size={18} color={theme.textSecondary} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteFolder(folder.id, folder.name)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={18} color={theme.error} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    minHeight: 44,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  foldersList: {
    gap: 12,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  folderColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  folderContent: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '500',
  },
  folderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
});
