import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {logout} from '../api/authApi';
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from '../api/taskApi';
import {API_BASE_URL} from '../config/api';
import type {TaskItem} from '../types/task';
import {getApiErrorMessage} from '../utils/apiError';

type Props = {
  onSignedOut: () => void;
};

const emptyDraft = (): Omit<TaskItem, 'id'> => ({
  title: '',
  description: '',
  completed: false,
  dueAt: null,
});

export default function HomeScreen({onSignedOut}: Props) {
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TaskItem | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftCompleted, setDraftCompleted] = useState(false);
  const [draftDue, setDraftDue] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTasks = useCallback(async () => {
    setBanner(null);
    try {
      const list = await fetchTasks();
      setTasks(list);
    } catch (e) {
      setBanner(getApiErrorMessage(e, 'Could not load tasks.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const openCreate = () => {
    setEditing(null);
    const d = emptyDraft();
    setDraftTitle(d.title ?? '');
    setDraftDescription(d.description ?? '');
    setDraftCompleted(d.completed);
    setDraftDue(d.dueAt ? d.dueAt.slice(0, 10) : '');
    setEditorOpen(true);
  };

  const openEdit = (item: TaskItem) => {
    setEditing(item);
    setDraftTitle(item.title);
    setDraftDescription(item.description ?? '');
    setDraftCompleted(item.completed);
    setDraftDue(item.dueAt ? String(item.dueAt).slice(0, 10) : '');
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
  };

  const saveEditor = async () => {
    const title = draftTitle.trim();
    if (!title) {
      setBanner('Title is required.');
      return;
    }
    setSaving(true);
    setBanner(null);
    const dueAt =
      draftDue.trim() === ''
        ? null
        : new Date(draftDue.trim() + 'T12:00:00').toISOString();
    try {
      if (editing) {
        await updateTask({
          ...editing,
          title,
          description: draftDescription,
          completed: draftCompleted,
          dueAt,
        });
      } else {
        await createTask({
          title,
          description: draftDescription,
          completed: draftCompleted,
          dueAt,
        });
      }
      closeEditor();
      await loadTasks();
    } catch (e) {
      setBanner(getApiErrorMessage(e, 'Could not save task.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleCompleted = async (item: TaskItem) => {
    setBanner(null);
    try {
      await updateTask({...item, completed: !item.completed});
      setTasks(prev =>
        prev.map(t =>
          t.id === item.id ? {...t, completed: !item.completed} : t,
        ),
      );
    } catch (e) {
      setBanner(getApiErrorMessage(e, 'Could not update task.'));
      await loadTasks();
    }
  };

  const confirmDelete = (item: TaskItem) => {
    Alert.alert(
      'Delete task',
      `Remove “${item.title}”?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(item.id);
              setTasks(prev => prev.filter(t => t.id !== item.id));
            } catch (e) {
              setBanner(getApiErrorMessage(e, 'Could not delete task.'));
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  const handleSignOut = async () => {
    await logout();
    onSignedOut();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingLabel}>Loading tasks…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My tasks</Text>
          <Text style={styles.headerMeta} numberOfLines={1}>
            {API_BASE_URL}
          </Text>
        </View>
        <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
      </View>

      {banner ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      ) : null}

      <FlatList
        data={tasks}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyBody}>
              Pull to refresh or add a task with the button below.
            </Text>
          </View>
        }
        renderItem={({item}) => (
          <Pressable
            style={({pressed}) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => openEdit(item)}>
            <View style={styles.cardRow}>
              <Switch
                value={item.completed}
                onValueChange={() => toggleCompleted(item)}
                trackColor={{false: '#e2e8f0', true: '#93c5fd'}}
                thumbColor={item.completed ? '#2563eb' : '#f4f4f5'}
              />
              <View style={styles.cardBody}>
                <Text
                  style={[
                    styles.cardTitle,
                    item.completed && styles.cardTitleDone,
                  ]}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                {item.dueAt ? (
                  <Text style={styles.cardDue}>
                    Due {String(item.dueAt).slice(0, 10)}
                  </Text>
                ) : null}
              </View>
              <Pressable
                hitSlop={12}
                style={styles.deleteHit}
                onPress={() => confirmDelete(item)}>
                <Text style={styles.deleteGlyph}>×</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />

      <Pressable
        style={[styles.fab, {bottom: 24 + insets.bottom}]}
        onPress={openCreate}>
        <Text style={styles.fabPlus}>+</Text>
      </Pressable>

      <Modal
        visible={editorOpen}
        animationType="slide"
        transparent
        onRequestClose={closeEditor}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}>
          <Pressable style={styles.modalScrim} onPress={closeEditor} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {editing ? 'Edit task' : 'New task'}
            </Text>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.field}
              value={draftTitle}
              onChangeText={setDraftTitle}
              placeholder="What do you need to do?"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.field, styles.fieldMultiline]}
              value={draftDescription}
              onChangeText={setDraftDescription}
              placeholder="Optional details"
              placeholderTextColor="#94a3b8"
              multiline
            />

            <Text style={styles.fieldLabel}>Due date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.field}
              value={draftDue}
              onChangeText={setDraftDue}
              placeholder="2026-05-20"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
            />

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Completed</Text>
              <Switch
                value={draftCompleted}
                onValueChange={setDraftCompleted}
                trackColor={{false: '#e2e8f0', true: '#93c5fd'}}
                thumbColor={draftCompleted ? '#2563eb' : '#f4f4f5'}
              />
            </View>

            <View style={styles.sheetActions}>
              <Pressable style={styles.secondaryBtn} onPress={closeEditor}>
                <Text style={styles.secondaryLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, saving && styles.btnDisabled]}
                onPress={saveEditor}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryLabel}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#f1f5f9'},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingLabel: {marginTop: 12, color: '#64748b', fontSize: 15},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {fontSize: 22, fontWeight: '700', color: '#0f172a'},
  headerMeta: {fontSize: 11, color: '#94a3b8', marginTop: 2, maxWidth: 220},
  signOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  signOutLabel: {fontSize: 14, fontWeight: '600', color: '#475569'},
  banner: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  bannerText: {color: '#b91c1c', fontSize: 14},
  listContent: {padding: 16, paddingBottom: 100},
  empty: {paddingVertical: 48, alignItems: 'center'},
  emptyTitle: {fontSize: 18, fontWeight: '600', color: '#334155'},
  emptyBody: {
    marginTop: 8,
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {opacity: 0.92},
  cardRow: {flexDirection: 'row', alignItems: 'flex-start'},
  cardBody: {flex: 1, marginLeft: 10},
  cardTitle: {fontSize: 16, fontWeight: '600', color: '#0f172a'},
  cardTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
    fontWeight: '500',
  },
  cardDesc: {marginTop: 4, fontSize: 14, color: '#64748b', lineHeight: 20},
  cardDue: {marginTop: 6, fontSize: 12, color: '#3b82f6', fontWeight: '500'},
  deleteHit: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  deleteGlyph: {fontSize: 26, color: '#cbd5e1', lineHeight: 28},
  fab: {
    position: 'absolute',
    right: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e40af',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPlus: {fontSize: 32, color: '#fff', marginTop: -2, fontWeight: '300'},
  modalBackdrop: {flex: 1, justifyContent: 'flex-end'},
  modalScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
  },
  sheetTitle: {fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 16},
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  field: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 14,
    backgroundColor: '#f8fafc',
  },
  fieldMultiline: {minHeight: 88, textAlignVertical: 'top'},
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  secondaryLabel: {fontSize: 16, fontWeight: '600', color: '#475569'},
  primaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    minWidth: 100,
    alignItems: 'center',
  },
  btnDisabled: {opacity: 0.6},
  primaryLabel: {fontSize: 16, fontWeight: '600', color: '#fff'},
});
