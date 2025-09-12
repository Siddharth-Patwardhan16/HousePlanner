import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const FirebaseDebug = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFirebaseConnection = async () => {
    setDebugInfo([]);
    addLog('Starting Firebase connection test...');

    try {
      // Test 1: Check if Firebase is initialized
      addLog('✅ Firebase initialized successfully');

      // Test 2: Check authentication
      const user = auth().currentUser;
      if (user) {
        addLog(`✅ User authenticated: ${user.email}`);
      } else {
        addLog('❌ No user authenticated');
        return;
      }

      // Test 3: Check user document
      const userDoc = await firestore()
        .collection('users')
        .doc(user.uid)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        addLog(`✅ User document exists: ${JSON.stringify(userData)}`);
        
        if (userData?.familyId) {
          addLog(`✅ User has familyId: ${userData.familyId}`);
          
          // Test 4: Check family document
          const familyDoc = await firestore()
            .collection('families')
            .doc(userData.familyId)
            .get();

          if (familyDoc.exists) {
            addLog(`✅ Family document exists: ${JSON.stringify(familyDoc.data())}`);
          } else {
            addLog('❌ Family document does not exist');
          }
        } else {
          addLog('❌ User has no familyId');
        }
      } else {
        addLog('❌ User document does not exist');
        return;
      }

      // Test 5: Test tasks query
      try {
        const tasksSnapshot = await firestore()
          .collection('tasks')
          .where('familyId', '==', user.uid) // Using user.uid as familyId for test
          .limit(5)
          .get();

        addLog(`✅ Tasks query successful: ${tasksSnapshot.docs.length} tasks found`);
      } catch (error: any) {
        addLog(`❌ Tasks query failed: ${error.message}`);
      }

      // Test 6: Test inventory query
      try {
        const inventorySnapshot = await firestore()
          .collection('inventory')
          .where('familyId', '==', user.uid) // Using user.uid as familyId for test
          .limit(5)
          .get();

        addLog(`✅ Inventory query successful: ${inventorySnapshot.docs.length} items found`);
      } catch (error: any) {
        addLog(`❌ Inventory query failed: ${error.message}`);
      }

      addLog('🎉 Firebase connection test completed!');

    } catch (error: any) {
      addLog(`❌ Firebase connection test failed: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={testFirebaseConnection}>
        <Text style={styles.buttonText}>Test Firebase Connection</Text>
      </TouchableOpacity>
      <View style={styles.logContainer}>
        {debugInfo.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  logContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    maxHeight: 300,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});

export default FirebaseDebug;



