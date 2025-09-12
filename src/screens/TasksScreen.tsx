import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
  ToastAndroid,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
// Using default React Native date picker for better Android compatibility

// Interfaces
interface Task {
  id: string;
  title: string;
  dueDate: string;
  assignee: string;
  assignedBy: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  familyId: string;
  createdAt?: any;
  updatedAt?: any;
}

interface TaskItemProps {
  item: Task;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onReturnTask: (id: string) => void;
  isCompletedTab: boolean;
}

// Real data will be loaded from Firestore

const getPriorityStyle = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high': return { bar: styles.priorityHigh, icon: 'alert-circle' };
    case 'medium': return { bar: styles.priorityMedium, icon: 'time' };
    case 'low': return { bar: styles.priorityLow, icon: 'checkmark-circle' };
    default: return { bar: {}, icon: 'ellipse' };
  }
};

// Show toast notification
const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // For iOS, you might want to use a different toast library
    Alert.alert('', message, [{ text: 'OK' }]);
  }
};

// A dedicated component for each task item for better organization
const TaskItem = ({ item, onToggleTask, onDeleteTask, onReturnTask, isCompletedTab }: TaskItemProps) => {
  const priorityStyle = getPriorityStyle(item.priority);

  const handleTaskAction = () => {
    if (isCompletedTab) {
      // For completed tasks, show options to return or delete
      Alert.alert(
        'Task Options',
        `What would you like to do with "${item.title}"?`,
        [
          {
            text: 'Return to Active',
            onPress: () => {
              onReturnTask(item.id);
              showToast('Task returned to active tasks');
            },
          },
          {
            text: 'Delete Task',
            style: 'destructive',
            onPress: () => {
              onDeleteTask(item.id);
              showToast('Task deleted');
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      // For active tasks, confirm completion
      Alert.alert(
        'Mark as Completed',
        `Are you sure you want to mark "${item.title}" as completed?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Complete',
            onPress: () => {
              onToggleTask(item.id);
              showToast('Task marked as completed!');
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.taskCard}>
      <View style={[styles.priorityBar, priorityStyle.bar]} />
      <TouchableOpacity style={styles.checkbox} onPress={handleTaskAction}>
        <Icon 
          name={item.completed ? 'checkmark-circle' : 'ellipse-outline'} 
          size={24} 
          color={item.completed ? '#10B981' : '#8A8A8E'} 
        />
      </TouchableOpacity>
      <View style={styles.taskDetails}>
        <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
          {item.title}
        </Text>
        <View style={styles.taskMeta}>
          <Icon name="person-outline" size={14} color="#8A8A8E" />
          <Text style={styles.taskMetaText}>{item.assignee} - {item.assignedBy}</Text>
          <Icon name="calendar-outline" size={14} color="#8A8A8E" style={{ marginLeft: 12 }} />
          <Text style={styles.taskMetaText}>{item.dueDate}</Text>
        </View>
      </View>
      {isCompletedTab && (
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => {
            Alert.alert(
              'Delete Task',
              `Are you sure you want to delete "${item.title}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => {
                    onDeleteTask(item.id);
                    showToast('Task deleted');
                  }
                },
              ]
            );
          }}
        >
          <Icon name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Add Task Modal Component
const AddTaskModal = ({ visible, onClose, onAddTask, familyMembers = [] }: {
  visible: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'familyId' | 'assignedBy'>) => void;
  familyMembers?: string[];
}) => {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (event: DateTimePickerEvent, pickedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (pickedDate) {
      setSelectedDate(pickedDate);
      setDueDate(pickedDate.toISOString().split('T')[0]);
    }
    if (Platform.OS === 'ios') {
      // On iOS, keep the picker open until user confirms
      if (event.type === 'dismissed') {
        setShowDatePicker(false);
      }
    }
  };

  const handleAssigneeSelect = (member: string) => {
    setAssignee(member);
    setShowAssigneePicker(false);
  };


  const handleSubmit = () => {
    if (!title.trim() || !assignee.trim() || !dueDate.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newTask = {
      title: title.trim(),
      assignee: assignee.trim(),
      dueDate,
      priority,
      completed: false,
    };

    onAddTask(newTask);
    
    // Reset form
    setTitle('');
    setAssignee('');
    setDueDate('');
    setPriority('medium');
    setSelectedDate(new Date());
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setAssignee('');
    setDueDate('');
    setPriority('medium');
    setSelectedDate(new Date());
    setShowDatePicker(false);
    setShowAssigneePicker(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={resetForm}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={resetForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Task</Text>
            <TouchableOpacity onPress={resetForm} style={styles.closeButton}>
              <Icon name="close" size={24} color="#8A8A8E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Task Title *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter task title"
                placeholderTextColor="#8A8A8E"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Assignee *</Text>
              <TouchableOpacity
                style={[styles.pickerButton, assignee && styles.pickerButtonSelected]}
                onPress={() => setShowAssigneePicker(true)}
              >
                <View style={styles.pickerButtonContent}>
                  {assignee ? (
                    <View style={styles.assigneeDisplay}>
                      <View style={styles.assigneeAvatar}>
                        <Text style={styles.assigneeAvatarText}>
                          {assignee.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.pickerButtonText}>{assignee}</Text>
                    </View>
                  ) : (
                    <Text style={[styles.pickerButtonText, styles.pickerButtonPlaceholder]}>
                      Select assignee
                    </Text>
                  )}
                </View>
                <Icon name="chevron-down" size={20} color="#8A8A8E" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Due Date *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.pickerButtonText, !dueDate && styles.pickerButtonPlaceholder]}>
                  {dueDate || 'Select due date'}
                </Text>
                <Icon name="calendar-outline" size={20} color="#8A8A8E" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityButtons}>
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      priority === p && { backgroundColor: '#000000', borderColor: '#000000' },
                      priority !== p && p === 'high' && styles.priorityHigh,
                      priority !== p && p === 'medium' && styles.priorityMedium,
                      priority !== p && p === 'low' && styles.priorityLow,
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      priority === p && { color: '#FFFFFF', fontWeight: '600' }
                    ]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Native Date Picker */}
          {showDatePicker && (
            <Modal
              visible={showDatePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.pickerOverlay}>
                <View style={styles.datePickerModal}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Select Due Date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Icon name="close" size={24} color="#8A8A8E" />
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    style={styles.datePicker}
                  />
                  {Platform.OS === 'android' && (
                    <View style={styles.datePickerFooter}>
                      <TouchableOpacity
                        style={styles.confirmDateButton}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.confirmDateButtonText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </Modal>
          )}

          {/* Assignee Picker Modal */}
          {showAssigneePicker && (
            <Modal
              visible={showAssigneePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowAssigneePicker(false)}
            >
              <TouchableOpacity 
                style={styles.pickerOverlay}
                activeOpacity={1}
                onPress={() => setShowAssigneePicker(false)}
              >
                <TouchableOpacity 
                  style={styles.modernPickerModal}
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Select Assignee</Text>
                    <TouchableOpacity onPress={() => setShowAssigneePicker(false)}>
                      <Icon name="close" size={24} color="#8A8A8E" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerList}>
                    {familyMembers.length > 0 ? (
                      familyMembers.map((member, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.modernPickerItem, assignee === member && styles.modernPickerItemSelected]}
                          onPress={() => handleAssigneeSelect(member)}
                        >
                          <View style={styles.pickerItemContent}>
                            <View style={[styles.pickerItemAvatar, assignee === member && styles.pickerItemAvatarSelected]}>
                              <Text style={[styles.pickerItemAvatarText, assignee === member && styles.pickerItemAvatarTextSelected]}>
                                {member.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.pickerItemInfo}>
                              <Text style={[styles.pickerItemText, assignee === member && styles.pickerItemTextSelected]}>
                                {member}
                              </Text>
                              <Text style={[styles.pickerItemSubtext, assignee === member && styles.pickerItemSubtextSelected]}>
                                Family Member
                              </Text>
                            </View>
                          </View>
                          {assignee === member && (
                            <Icon name="checkmark-circle" size={24} color="#4A90E2" />
                          )}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.emptyPickerState}>
                        <Icon name="people-outline" size={48} color="#C7C7CC" />
                        <Text style={styles.emptyPickerText}>No family members found</Text>
                        <Text style={styles.emptyPickerSubtext}>
                          Make sure you're part of a family to assign tasks
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
              <Text style={styles.addButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

const TasksScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('today');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [_user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user data and tasks from Firestore
  useEffect(() => {
    const authSubscriber = auth().onAuthStateChanged(userAuth => {
      setUser(userAuth);
      if (!userAuth) {
        setLoading(false);
        return;
      }

      const userDocSubscriber = firestore()
        .collection('users')
        .doc(userAuth.uid)
        .onSnapshot(
          documentSnapshot => {
            if (documentSnapshot.exists()) {
              setUserData(documentSnapshot.data());
            } else {
              setUserData(null);
            }
            setLoading(false);
          },
          error => {
            console.error('Error fetching user data:', error);
            setLoading(false);
          },
        );

      return userDocSubscriber;
    });

    return authSubscriber;
  }, []);

  // Load tasks from Firestore
  useEffect(() => {
    if (userData?.familyId) {
      const tasksSubscriber = firestore()
        .collection('tasks')
        .where('familyId', '==', userData.familyId)
        .onSnapshot(
          querySnapshot => {
            const tasksData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Task));
            // Filter out tasks with invalid dates
            const validTasks = tasksData.filter(task => {
              // Validate date format (should be YYYY-MM-DD)
              if (!task.dueDate || typeof task.dueDate !== 'string') return false;
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              return dateRegex.test(task.dueDate);
            });
            
            // Sort by createdAt in descending order (newest first)
            validTasks.sort((a, b) => {
              const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
              const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
              return bTime.getTime() - aTime.getTime();
            });
            
            setTasks(validTasks);
          },
          error => {
            console.error('Error fetching tasks:', error);
            setTasks([]);
          }
        );

      return tasksSubscriber;
    } else {
      setTasks([]);
    }
  }, [userData?.familyId]);

  // Load family members
  useEffect(() => {
    if (userData?.familyId) {
      const familySubscriber = firestore()
        .collection('families')
        .doc(userData.familyId)
        .onSnapshot(
          familyDoc => {
            if (familyDoc.exists()) {
              const familyData = familyDoc.data();
              if (familyData?.members) {
                // Fetch user names for each member
                const memberPromises = familyData.members.map((memberId: string) =>
                  firestore()
                    .collection('users')
                    .doc(memberId)
                    .get()
                    .then(doc => doc.exists() ? doc.data()?.email?.split('@')[0] || 'Unknown' : 'Unknown')
                );
                
                Promise.all(memberPromises).then(memberNames => {
                  setFamilyMembers(memberNames.filter(name => name !== 'Unknown'));
                });
              }
            }
          },
          error => {
            console.error('Error fetching family members:', error);
            setFamilyMembers([]);
          }
        );

      return familySubscriber;
    } else {
      setFamilyMembers([]);
    }
  }, [userData?.familyId]);

  const onToggleTask = async (id: string) => {
    try {
      const taskRef = firestore().collection('tasks').doc(id);
      const task = tasks.find(t => t.id === id);
      
      if (task) {
        await taskRef.update({
          completed: !task.completed,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Failed to update task');
    }
  };

  const onDeleteTask = async (id: string) => {
    try {
      await firestore().collection('tasks').doc(id).delete();
      showToast('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Failed to delete task');
    }
  };

  const onReturnTask = async (id: string) => {
    try {
      await firestore().collection('tasks').doc(id).update({
        completed: false,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      showToast('Task returned to active tasks!');
    } catch (error) {
      console.error('Error returning task:', error);
      showToast('Failed to return task');
    }
  };

  const onAddTask = async (newTaskData: Omit<Task, 'id' | 'familyId' | 'assignedBy'>) => {
    if (!userData?.familyId) {
      showToast('You must be part of a family to add tasks');
      return;
    }

    // Get current user's name for assignedBy field
    const currentUserName = userData?.email?.split('@')[0] || 'Unknown';

    try {
      await firestore().collection('tasks').add({
        ...newTaskData,
        assignedBy: currentUserName,
        familyId: userData.familyId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      showToast('Task added successfully!');
    } catch (error) {
      console.error('Error adding task:', error);
      showToast('Failed to add task');
    }
  };

  const renderEmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon 
        name={activeTab === 'completed' ? 'checkmark-done-circle-outline' : 'list-outline'} 
        size={60} 
        color="#D1D5DB" 
      />
      <Text style={styles.emptyText}>
        {activeTab === 'completed' ? 'No completed tasks yet!' : 'All clear for now!'}
      </Text>
      <Text style={styles.emptySubText}>
        {activeTab === 'completed' 
          ? 'Complete some tasks to see them here.' 
          : 'Add a new task using the '+' button.'
        }
      </Text>
    </View>
  );

  const getFilteredTasks = () => {
    const today = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
    switch (activeTab) {
      case 'today':
        return tasks.filter(task => task.dueDate === today && !task.completed);
      case 'upcoming':
        return tasks.filter(task => task.dueDate > today && !task.completed);
      case 'completed':
        return tasks.filter(task => task.completed);
      default:
        return [];
    }
  };

  const getTabCount = (tab: string) => {
    const today = new Date().toISOString().split('T')[0];
    switch (tab) {
      case 'today':
        return tasks.filter(task => task.dueDate === today && !task.completed).length;
      case 'upcoming':
        return tasks.filter(task => task.dueDate > today && !task.completed).length;
      case 'completed':
        return tasks.filter(task => task.completed).length;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData?.familyId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="people-outline" size={60} color="#C7C7CC" />
          <Text style={styles.errorTitle}>No Family</Text>
          <Text style={styles.errorText}>
            You need to join or create a family to manage tasks.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <Text style={styles.headerSubtitle}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        {[
          { key: 'today', label: 'Today' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'completed', label: 'Completed' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, activeTab === tab.key && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.activeTabBadgeText]}>
                {getTabCount(tab.key)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={getFilteredTasks()}
        renderItem={({ item }) => (
          <TaskItem 
            item={item} 
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
            onReturnTask={onReturnTask}
            isCompletedTab={activeTab === 'completed'}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyListComponent}
      />

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setIsAddModalVisible(true)}
      >
        <Icon name="add-outline" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Task Modal */}
      <AddTaskModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAddTask={onAddTask}
        familyMembers={familyMembers}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#1C1C1E' },
  headerSubtitle: { fontSize: 16, color: '#8A8A8E', marginTop: 4 },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
  },
  tab: { 
    paddingVertical: 12, 
    borderBottomWidth: 2, 
    borderColor: 'transparent',
    alignItems: 'center',
  },
  activeTab: { borderColor: '#4A90E2' },
  tabText: { fontSize: 16, color: '#8A8A8E', fontWeight: '500' },
  activeTabText: { color: '#4A90E2', fontWeight: '600' },
  tabBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: '#4A90E2',
  },
  tabBadgeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeTabBadgeText: {
    color: '#FFFFFF',
  },
  listContainer: { paddingHorizontal: 24, paddingBottom: 80 },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  priorityBar: { width: 4, height: '100%', marginRight: 12, borderRadius: 2 },
  priorityHigh: { backgroundColor: '#EF4444' }, // Red
  priorityMedium: { backgroundColor: '#F59E0B' }, // Amber/Orange
  priorityLow: { backgroundColor: '#10B981' }, // Green
  checkbox: { marginRight: 12 },
  taskDetails: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#8A8A8E' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  taskMetaText: { marginLeft: 4, fontSize: 13, color: '#8A8A8E' },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8A8A8E',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FFFFFF',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  priorityButtonActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#EBF8FF',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  priorityButtonTextActive: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  addButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  pickerButtonPlaceholder: {
    color: '#8A8A8E',
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333333',
  },
  pickerItemTextSelected: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  datePickerContainer: {
    padding: 20,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  dateHint: {
    fontSize: 14,
    color: '#8A8A8E',
    marginBottom: 16,
  },
  dateButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  datePicker: {
    width: '100%',
    height: 200,
  },
  datePickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '95%',
    maxHeight: '70%',
    marginTop: 50,
    padding: 20,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  datePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmDateButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmDateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerButtonSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F9FF',
  },
  pickerButtonContent: {
    flex: 1,
  },
  assigneeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  assigneeAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modernPickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '70%',
    marginTop: 80,
  },
  modernPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modernPickerItemSelected: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  pickerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickerItemAvatarSelected: {
    backgroundColor: '#4A90E2',
  },
  pickerItemAvatarText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerItemAvatarTextSelected: {
    color: '#FFFFFF',
  },
  pickerItemInfo: {
    flex: 1,
  },
  pickerItemSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  pickerItemSubtextSelected: {
    color: '#4A90E2',
  },
  emptyPickerState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyPickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPickerSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TasksScreen;