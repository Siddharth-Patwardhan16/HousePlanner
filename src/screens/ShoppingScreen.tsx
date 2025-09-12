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
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  familyId: string;
  createdAt?: any;
  updatedAt?: any;
}

const ShoppingScreen = () => {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    const authSubscriber = auth().onAuthStateChanged(user => {
      if (user) {
        const userDocSubscriber = firestore()
          .collection('users')
          .doc(user.uid)
          .onSnapshot(doc => {
            if (doc.exists()) {
              setUserData(doc.data());
            }
          });
        return userDocSubscriber;
      }
    });
    return authSubscriber;
  }, []);

  useEffect(() => {
    if (userData?.familyId) {
      const unsubscribe = firestore()
        .collection('shopping')
        .where('familyId', '==', userData.familyId)
        .onSnapshot(
          querySnapshot => {
            const items = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as ShoppingItem));
            setShoppingItems(items);
            setLoading(false);
          },
          error => {
            console.error('Error fetching shopping items:', error);
            setLoading(false);
          }
        );
      return unsubscribe;
    }
  }, [userData?.familyId]);

  const handleAddItem = async () => {
    if (!name.trim() || !quantity.trim() || !category.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!userData?.familyId) {
      Alert.alert('Error', 'No family found');
      return;
    }

    try {
      await firestore().collection('shopping').add({
        name: name.trim(),
        quantity: quantity.trim(),
        category: category.trim(),
        priority,
        familyId: userData.familyId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Success', 'Shopping item added successfully');
      resetForm();
    } catch (error) {
      console.error('Error adding shopping item:', error);
      Alert.alert('Error', 'Failed to add shopping item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this shopping item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('shopping').doc(itemId).delete();
            } catch (error) {
              console.error('Error deleting shopping item:', error);
              Alert.alert('Error', 'Failed to delete shopping item');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setName('');
    setQuantity('');
    setCategory('');
    setPriority('medium');
    setIsAddModalVisible(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#10B981';
    }
  };


  const filteredItems = shoppingItems.filter(item => {
    switch (activeTab) {
      case 'high': return item.priority === 'high';
      case 'medium': return item.priority === 'medium';
      case 'low': return item.priority === 'low';
      default: return true;
    }
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading shopping list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping List</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All ({shoppingItems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'high' && styles.activeTab]}
          onPress={() => setActiveTab('high')}
        >
          <Text style={[styles.tabText, activeTab === 'high' && styles.activeTabText]}>
            High ({shoppingItems.filter(item => item.priority === 'high').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'medium' && styles.activeTab]}
          onPress={() => setActiveTab('medium')}
        >
          <Text style={[styles.tabText, activeTab === 'medium' && styles.activeTabText]}>
            Medium ({shoppingItems.filter(item => item.priority === 'medium').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'low' && styles.activeTab]}
          onPress={() => setActiveTab('low')}
        >
          <Text style={[styles.tabText, activeTab === 'low' && styles.activeTabText]}>
            Low ({shoppingItems.filter(item => item.priority === 'low').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemLeft}>
              <View
                style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>
                  {item.quantity} • {item.category}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteItem(item.id)}
            >
              <Icon name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="basket-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>No shopping items yet</Text>
            <Text style={styles.emptySubtext}>Add items you need to buy</Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />

      {/* Add Item Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Shopping Item</Text>
              <TouchableOpacity onPress={resetForm}>
                <Icon name="close-outline" size={24} color="#8A8A8E" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Item Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter item name"
                  placeholderTextColor="#8A8A8E"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="e.g., 2 kg, 1 pack, 5 pieces"
                  placeholderTextColor="#8A8A8E"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category *</Text>
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="e.g., Groceries, Electronics, Clothes"
                  placeholderTextColor="#8A8A8E"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.priorityContainer}>
                  {(['low', 'medium', 'high'] as const).map(priorityOption => (
                    <TouchableOpacity
                      key={priorityOption}
                      style={[
                        styles.priorityButton,
                        priority === priorityOption && { backgroundColor: '#000000', borderColor: '#000000' },
                        priority !== priorityOption && priorityOption === 'high' && styles.priorityHigh,
                        priority !== priorityOption && priorityOption === 'medium' && styles.priorityMedium,
                        priority !== priorityOption && priorityOption === 'low' && styles.priorityLow,
                      ]}
                      onPress={() => setPriority(priorityOption)}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          priority === priorityOption && { color: '#FFFFFF', fontWeight: '600' }
                        ]}
                      >
                        {priorityOption.charAt(0).toUpperCase() + priorityOption.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
                <Text style={styles.addItemButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4A90E2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 20,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  priorityContainer: {
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
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  priorityHigh: { backgroundColor: '#EF4444' }, // Red
  priorityMedium: { backgroundColor: '#F59E0B' }, // Amber/Orange
  priorityLow: { backgroundColor: '#10B981' }, // Green
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  addItemButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  addItemButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ShoppingScreen;



