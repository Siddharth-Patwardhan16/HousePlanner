import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  Provider as PaperProvider,
  Portal,
  Dialog,
  Searchbar,
  Checkbox,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

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

const InventoryScreen = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  // Form states
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('');
  const [isLowStock, setIsLowStock] = useState(false);


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
        .collection('inventory')
        .where('familyId', '==', userData.familyId)
        .onSnapshot(
          querySnapshot => {
            const items = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as InventoryItem));
            setInventoryItems(items);
            setLoading(false);
          },
          error => {
            console.error('Error fetching inventory items:', error);
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
      if (editingItem) {
        // Update existing item
        await firestore().collection('inventory').doc(editingItem.id).update({
          name: name.trim(),
          quantity: quantity.trim(),
          category: category.trim(),
          isLowStock: isLowStock,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        Alert.alert('Success', 'Inventory item updated successfully');
      } else {
        // Add new item
        await firestore().collection('inventory').add({
          name: name.trim(),
          quantity: quantity.trim(),
          category: category.trim(),
          isLowStock: isLowStock,
          familyId: userData.familyId,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        Alert.alert('Success', 'Inventory item added successfully');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      Alert.alert('Error', 'Failed to save inventory item');
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity);
    setCategory(item.category);
    setIsLowStock(item.isLowStock);
    setIsEditModalVisible(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this inventory item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('inventory').doc(itemId).delete();
            } catch (error) {
              console.error('Error deleting inventory item:', error);
              Alert.alert('Error', 'Failed to delete inventory item');
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
    setIsLowStock(false);
    setIsAddModalVisible(false);
    setIsEditModalVisible(false);
    setEditingItem(null);
  };

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = inventoryItems.filter(item => item.isLowStock).length;
  const categoryCount = new Set(inventoryItems.map(item => item.category)).size;

  if (loading) {
    return (
      <PaperProvider theme={theme}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="bodyLarge" style={styles.loadingText}>Loading inventory...</Text>
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
            {/* Header */}
            <Card style={styles.headerCard}>
              <Card.Content>
                <Text variant="headlineMedium" style={styles.headerTitle}>Inventory Management</Text>
                <Text variant="bodyLarge" style={styles.headerSubtitle}>Track your household items</Text>
              </Card.Content>
            </Card>

            {/* Search Bar */}
            <Searchbar
              placeholder="Search items or categories..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchBar}
            />

            {/* Stats */}
            <View style={styles.statsContainer}>
              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <Text variant="headlineSmall" style={styles.statNumber}>{inventoryItems.length}</Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>Total Items</Text>
                </Card.Content>
              </Card>
              <Card style={[styles.statCard, styles.lowStockCard]}>
                <Card.Content style={styles.statContent}>
                  <Text variant="headlineSmall" style={[styles.statNumber, styles.lowStockNumber]}>{lowStockCount}</Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>Low Stock</Text>
                </Card.Content>
              </Card>
              <Card style={[styles.statCard, styles.categoryCard]}>
                <Card.Content style={styles.statContent}>
                  <Text variant="headlineSmall" style={[styles.statNumber, styles.categoryNumber]}>{categoryCount}</Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>Categories</Text>
                </Card.Content>
              </Card>
            </View>

            {/* Add Item Button */}
            <Button
              mode="contained"
              onPress={() => setIsAddModalVisible(true)}
              style={styles.addButton}
              contentStyle={styles.addButtonContent}
              icon="plus"
            >
              Add New Item
            </Button>

            {/* Items List */}
            <View style={styles.itemsList}>
              {filteredItems.map(item => (
                <Card key={item.id} style={styles.itemCard}>
                  <View style={[styles.priorityBar, item.isLowStock && styles.priorityBarLowStock]} />
                  <Card.Content>
                    <View style={styles.itemContent}>
                      <View style={styles.itemLeft}>
                        <View style={styles.itemIcon}>
                          <Text variant="headlineSmall">📦</Text>
                        </View>
                        <View style={styles.itemInfo}>
                          <View style={styles.itemHeader}>
                            <Text variant="titleMedium" style={styles.itemName}>{item.name}</Text>
                          </View>
                          <Text variant="bodyMedium" style={styles.itemDetails}>
                            {item.quantity} • {item.category}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.itemActions}>
                        <TouchableOpacity onPress={() => handleEditItem(item)}>
                          <Icon
                            name="pencil-outline"
                            size={20}
                            color={theme.colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                          <Icon
                            name="trash-outline"
                            size={20}
                            color="#FF6B6B"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}

              {filteredItems.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text variant="displaySmall" style={styles.emptyText}>No items found</Text>
                  <Text variant="bodyLarge" style={styles.emptySubtext}>Try adjusting your search or add new items</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Add Item Dialog */}
        <Portal>
          <Dialog visible={isAddModalVisible} onDismiss={resetForm}>
            <Dialog.Title>Add Inventory Item</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView contentContainerStyle={styles.dialogContent}>
                <TextInput
                  label="Item Name *"
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Enter item name"
                />

                <TextInput
                  label="Quantity *"
                  value={quantity}
                  onChangeText={setQuantity}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g., 2 kg, 1 pack, 5 pieces"
                />

                <TextInput
                  label="Category *"
                  value={category}
                  onChangeText={setCategory}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g., Cleaning, Food, Personal Care"
                />

                <View style={styles.checkboxContainer}>
                  <Checkbox
                    status={isLowStock ? 'checked' : 'unchecked'}
                    onPress={() => setIsLowStock(!isLowStock)}
                  />
                  <Text variant="bodyLarge" style={styles.checkboxLabel}>Mark as low stock</Text>
                </View>
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={resetForm}>Cancel</Button>
              <Button mode="contained" onPress={handleAddItem}>Add Item</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Edit Item Dialog */}
          <Dialog visible={isEditModalVisible} onDismiss={resetForm}>
            <Dialog.Title>Edit Inventory Item</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView contentContainerStyle={styles.dialogContent}>
                <TextInput
                  label="Item Name *"
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Enter item name"
                />

                <TextInput
                  label="Quantity *"
                  value={quantity}
                  onChangeText={setQuantity}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g., 2 kg, 1 pack, 5 pieces"
                />

                <TextInput
                  label="Category *"
                  value={category}
                  onChangeText={setCategory}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g., Cleaning, Food, Personal Care"
                />

                <View style={styles.checkboxContainer}>
                  <Checkbox
                    status={isLowStock ? 'checked' : 'unchecked'}
                    onPress={() => setIsLowStock(!isLowStock)}
                  />
                  <Text variant="bodyLarge" style={styles.checkboxLabel}>Mark as low stock</Text>
                </View>
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={resetForm}>Cancel</Button>
              <Button mode="contained" onPress={handleAddItem}>Update Item</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 4,
  },
  headerTitle: {
    marginBottom: 4,
  },
  headerSubtitle: {
    opacity: 0.7,
  },
  searchBar: {
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  lowStockCard: {
    backgroundColor: '#FFEBEE',
  },
  categoryCard: {
    backgroundColor: '#E8F5E8',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    marginBottom: 4,
  },
  statLabel: {
    opacity: 0.7,
  },
  lowStockNumber: {
    color: '#FF6B6B',
  },
  categoryNumber: {
    color: '#4CAF50',
  },
  addButton: {
    marginBottom: 24,
    elevation: 2,
    borderRadius: 12,
  },
  addButtonContent: {
    paddingVertical: 8,
  },
  itemsList: {
    gap: 16,
    paddingBottom: 20,
  },
  itemCard: {
    elevation: 2,
    marginBottom: 12,
    borderRadius: 12,
    position: 'relative',
  },
  priorityBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  priorityBarLowStock: {
    backgroundColor: '#EF4444',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 52,
    height: 52,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  itemName: {
    flex: 1,
    marginRight: 12,
    marginBottom: 2,
  },
  itemDetails: {
    opacity: 0.7,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.6,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.5,
  },
  // Dialog styles
  dialogContent: {
    paddingHorizontal: 16,
  },
  input: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
});

export default InventoryScreen;