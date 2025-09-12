import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Surface,
  useTheme,
  Provider as PaperProvider,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface UserData {
  uid: string;
  name: string;
  email: string;
  familyId: string | null;
}

interface Task {
  id: string;
  title: string;
  assignee: string;
  assignedBy: string;
  dueTime?: string;
  dueDate?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  familyId: string;
  createdAt?: any;
  updatedAt?: any;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  isLowStock: boolean;
  familyId: string;
  createdAt?: any;
  updatedAt?: any;
}

interface NewHomeScreenProps {
  navigation?: any;
}

const NewHomeScreen = ({ navigation }: NewHomeScreenProps) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [initializing, setInitializing] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const authSubscriber = auth().onAuthStateChanged(userAuth => {
      console.log('Auth state changed:', userAuth ? 'User logged in' : 'User logged out');
      setUser(userAuth);
      if (!userAuth) {
        setInitializing(false);
        return;
      }

      const userDocSubscriber = firestore()
        .collection('users')
        .doc(userAuth.uid)
        .onSnapshot(
          documentSnapshot => {
            if (documentSnapshot.exists()) {
              const userData = documentSnapshot.data() as UserData;
              console.log('User data loaded:', userData);
              setUserData(userData);
            } else {
              console.log('User document does not exist');
              setUserData(null);
            }
            setInitializing(false);
          },
          error => {
            console.error('Error fetching user data:', error);
            console.error('Error details:', error.code, error.message);
            setInitializing(false);
          },
        );

      return userDocSubscriber;
    });

    return authSubscriber;
  }, []);

  // Load real data from Firestore
  useEffect(() => {
    if (userData?.familyId) {
      console.log('Loading data for familyId:', userData.familyId);
      
      // Load recent tasks from Firestore (all incomplete tasks)
      const tasksSubscriber = firestore()
        .collection('tasks')
        .where('familyId', '==', userData.familyId)
        .where('completed', '==', false)
        .onSnapshot(
          querySnapshot => {
            const tasks = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Task));
            // Filter out completed tasks and tasks with invalid dates
            const incompleteTasks = tasks.filter(task => {
              if (task.completed) return false;
              
              // Validate date format (should be YYYY-MM-DD)
              if (!task.dueDate || typeof task.dueDate !== 'string') return false;
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              if (!dateRegex.test(task.dueDate)) return false;
              
              return true;
            });
            
            // Sort by createdAt in descending order and limit to 5
            incompleteTasks.sort((a, b) => {
              const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
              const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
              return bTime.getTime() - aTime.getTime();
            });
            setRecentTasks(incompleteTasks.slice(0, 5));
          },
          error => {
            console.error('Error fetching tasks:', error);
            console.error('Error details:', error.code, error.message);
            setRecentTasks([]);
          }
        );

      // Load low stock items from Firestore
      const inventorySubscriber = firestore()
        .collection('inventory')
        .where('familyId', '==', userData.familyId)
        .where('isLowStock', '==', true)
        .onSnapshot(
          querySnapshot => {
            console.log('Inventory query successful, found:', querySnapshot.docs.length, 'items');
            const items = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as InventoryItem));
            // Sort by createdAt in descending order and limit to 3
            items.sort((a, b) => {
              const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
              const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
              return bTime.getTime() - aTime.getTime();
            });
            setLowStockItems(items.slice(0, 3));
          },
          error => {
            console.error('Error fetching inventory:', error);
            console.error('Error details:', error.code, error.message);
            setLowStockItems([]);
          }
        );

      return () => {
        tasksSubscriber();
        inventorySubscriber();
      };
    } else {
            setRecentTasks([]);
      setLowStockItems([]);
    }
  }, [userData?.familyId]);

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFA726';
      case 'low': return '#66BB6A';
      default: return '#4A90E2';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (initializing) {
    return (
      <PaperProvider theme={theme}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.loadingContainer}>
            <Text variant="bodyLarge" style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  if (!userData) {
    return (
      <PaperProvider theme={theme}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.errorContainer}>
            <Text variant="displaySmall" style={styles.errorTitle}>Error</Text>
            <Text variant="bodyLarge" style={styles.errorText}>
              Could not load your data. Please try again.
            </Text>
          </View>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Greeting */}
            <Card style={styles.greetingCard}>
              <Card.Content>
                <Text variant="headlineMedium" style={styles.greeting}>
                  {getGreeting()}, {userData.name || userData.email.split('@')[0]}!
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>Here's what's happening today</Text>
              </Card.Content>
            </Card>

            {/* Recent Tasks */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text variant="titleLarge" style={styles.cardTitle}>Active Tasks</Text>
                  <Button mode="text" onPress={() => navigation?.navigate('Tasks')}>
                    View All
                  </Button>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.cardContent}>
                  {recentTasks.slice(0, 5).map(task => (
                    <View key={task.id} style={styles.taskItem}>
                      <View style={styles.taskLeft}>
                        <Chip 
                          mode="outlined"
                          style={[styles.priorityChip, { backgroundColor: getPriorityColor(task.priority) + '20' }]}
                          textStyle={[styles.priorityText, { color: getPriorityColor(task.priority) }]}
                        >
                          {task.priority.toUpperCase()}
                        </Chip>
                        <View style={styles.taskInfo}>
                          <Text variant="titleMedium" style={styles.taskTitle}>{task.title}</Text>
                          <Text variant="bodySmall" style={styles.taskTime}>
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'} • {task.assignee} - {task.assignedBy}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.avatarContainer}>
                        <Surface style={styles.avatar} elevation={2}>
                          <Text variant="labelMedium" style={styles.avatarText}>{getInitials(task.assignee)}</Text>
                        </Surface>
                      </View>
                    </View>
                  ))}
                  {recentTasks.length === 0 && (
                    <Text variant="bodyLarge" style={styles.emptyText}>No active tasks! All caught up 🎉</Text>
                  )}
                </View>
              </Card.Content>
            </Card>

            {/* Low Stock Items */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text variant="titleLarge" style={styles.cardTitle}>Low on Stock</Text>
                  <Button mode="text" onPress={() => navigation?.navigate('Inventory')}>
                    View All
                  </Button>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.cardContent}>
                  {lowStockItems.slice(0, 3).map(item => (
                    <View key={item.id} style={styles.stockItem}>
                      <View style={styles.stockLeft}>
                        <Chip 
                          mode="outlined" 
                          style={styles.lowStockChip}
                          textStyle={styles.lowStockChipText}
                        >
                          Low
                        </Chip>
                        <View style={styles.stockInfo}>
                          <Text variant="titleMedium" style={styles.stockName}>{item.name}</Text>
                          <Text variant="bodySmall" style={styles.stockDetails}>{item.quantity} • {item.category}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                  {lowStockItems.length === 0 && (
                    <Text variant="bodyLarge" style={styles.emptyText}>All stocked up! ✅</Text>
                  )}
                </View>
              </Card.Content>
            </Card>

            {/* Quick Actions */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.cardTitle}>Quick Actions</Text>
                <Divider style={styles.divider} />
                <View style={styles.quickActions}>
                  <Button
                    mode="outlined"
                    onPress={() => navigation?.navigate('Tasks')}
                    style={styles.quickActionButton}
                    contentStyle={styles.quickActionContent}
                    icon="check-circle"
                  >
                    Add Task
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => navigation?.navigate('Inventory')}
                    style={styles.quickActionButton}
                    contentStyle={styles.quickActionContent}
                    icon="package"
                  >
                    Add Item
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Space for bottom navigation
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    textAlign: 'center',
    lineHeight: 24,
  },
  greetingCard: {
    marginBottom: 16,
    elevation: 4,
  },
  greeting: {
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: '600',
  },
  divider: {
    marginVertical: 8,
  },
  cardContent: {
    paddingTop: 8,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  priorityChip: {
    marginRight: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    marginBottom: 4,
  },
  taskTime: {
    opacity: 0.7,
  },
  avatarContainer: {
    marginLeft: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  stockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  lowStockChip: {
    backgroundColor: '#FF6B6B',
  },
  lowStockChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  stockInfo: {
    flex: 1,
  },
  stockName: {
    marginBottom: 2,
  },
  stockDetails: {
    opacity: 0.7,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    opacity: 0.6,
  },
  quickActions: {
    flexDirection: 'row',
    paddingTop: 8,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    elevation: 2,
  },
  quickActionContent: {
    paddingVertical: 8,
  },
});

export default NewHomeScreen;
