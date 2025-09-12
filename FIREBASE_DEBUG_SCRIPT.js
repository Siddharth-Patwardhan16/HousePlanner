// Firebase Debug Script
// Run this in your React Native app to test Firebase connection

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const testFirebaseConnection = async () => {
  console.log('🔍 Testing Firebase Connection...');
  
  try {
    // Test 1: Check if Firebase is initialized
    console.log('✅ Firebase initialized successfully');
    
    // Test 2: Check authentication
    const user = auth().currentUser;
    if (user) {
      console.log('✅ User authenticated:', user.email);
    } else {
      console.log('❌ No user authenticated');
      return;
    }
    
    // Test 3: Check user document
    const userDoc = await firestore()
      .collection('users')
      .doc(user.uid)
      .get();
    
    if (userDoc.exists) {
      console.log('✅ User document exists:', userDoc.data());
    } else {
      console.log('❌ User document does not exist');
      return;
    }
    
    const userData = userDoc.data();
    
    // Test 4: Check family document
    if (userData.familyId) {
      const familyDoc = await firestore()
        .collection('families')
        .doc(userData.familyId)
        .get();
      
      if (familyDoc.exists) {
        console.log('✅ Family document exists:', familyDoc.data());
      } else {
        console.log('❌ Family document does not exist');
        return;
      }
    } else {
      console.log('❌ User has no familyId');
      return;
    }
    
    // Test 5: Test tasks query (without orderBy to avoid index issues)
    try {
      const tasksSnapshot = await firestore()
        .collection('tasks')
        .where('familyId', '==', userData.familyId)
        .limit(5)
        .get();
      
      console.log('✅ Tasks query successful:', tasksSnapshot.docs.length, 'tasks found');
    } catch (error) {
      console.log('❌ Tasks query failed:', error.message);
    }
    
    // Test 6: Test inventory query
    try {
      const inventorySnapshot = await firestore()
        .collection('inventory')
        .where('familyId', '==', userData.familyId)
        .limit(5)
        .get();
      
      console.log('✅ Inventory query successful:', inventorySnapshot.docs.length, 'items found');
    } catch (error) {
      console.log('❌ Inventory query failed:', error.message);
    }
    
    console.log('🎉 Firebase connection test completed!');
    
  } catch (error) {
    console.log('❌ Firebase connection test failed:', error);
  }
};

// Usage: Call this function from your app
// import { testFirebaseConnection } from './FIREBASE_DEBUG_SCRIPT';
// testFirebaseConnection();



