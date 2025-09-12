import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import 'react-native-gesture-handler';
import { createStackNavigator } from '@react-navigation/stack';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';

import SignUpScreen from './src/screens/Authentication/SignUpScreen';
import LoginScreen from './src/screens/Authentication/LoginScreen';
import FamilyManagementScreen from './src/screens/FamilyManagementScreen';
import NewHomeScreen from './src/screens/NewHomeScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ShoppingScreen from './src/screens/ShoppingScreen';
import TasksScreen from './src/screens/TasksScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// This is the navigator shown AFTER a user is logged in and has a family
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Inventory') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'check-circle' : 'check-circle-outline';
          } else if (route.name === 'Shopping') {
            iconName = focused ? 'basket' : 'basket-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'cog' : 'cog-outline';
          }

          return <Icon name={iconName as string} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E9ECEF',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Home" component={NewHomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Shopping" component={ShoppingScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}



const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const authSubscriber = auth().onAuthStateChanged(userAuth => {
      setUser(userAuth);
      if (!userAuth) {
        setUserData(null);
        setInitializing(false);
        return;
      }

      // Fetch user data from Firestore
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
            setInitializing(false);
          },
          error => {
            console.error('Error fetching user data:', error);
            setUserData(null);
            setInitializing(false);
          },
        );

      return userDocSubscriber;
    });

    return authSubscriber;
  }, []);

  const handleFamilyJoined = () => {
    // Refresh user data to get updated familyId
    if (user) {
      firestore()
        .collection('users')
        .doc(user.uid)
        .get()
        .then(doc => {
          if (doc.exists()) {
            setUserData(doc.data());
          }
        });
    }
  };

  const handleFamilyCreated = () => {
    // Refresh user data to get updated familyId
    if (user) {
      firestore()
        .collection('users')
        .doc(user.uid)
        .get()
        .then(doc => {
          if (doc.exists()) {
            setUserData(doc.data());
          }
        });
    }
  };


  if (initializing) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          userData?.familyId ? (
            <Stack.Screen name="AppTabs" component={AppTabs} options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="FamilyManagement" options={{ headerShown: false }}>
              {(props) => (
                <FamilyManagementScreen
                  {...props}
                  onFamilyJoined={handleFamilyJoined}
                  onFamilyCreated={handleFamilyCreated}
                />
              )}
            </Stack.Screen>
          )
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
