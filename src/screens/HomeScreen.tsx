// In src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Button, TextInput } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface UserData {
  uid: string;
  email: string;
  familyId: string | null;
}

const generateInviteCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

const HomeScreen = () => {
  const [Initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [joiningFamily, setJoiningFamily] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [familyMembers, setFamilyMembers] = useState<UserData[]>([]);
  const [familyData, setFamilyData] = useState<{ inviteCode: string } | null>(
    null,
  );

  useEffect(() => {
    const authSubscriber = auth().onAuthStateChanged(userAuth => {
      setUser(userAuth);

      // If there's no user, we're not loading anymore.
      if (!userAuth) {
        setInitializing(false);
        return;
      }

      // If we have a user, THEN we fetch their data.
      const userDocSubscriber = firestore()
        .collection('users')
        .doc(userAuth.uid)
        .onSnapshot(
          documentSnapshot => {
            if (documentSnapshot.exists()) {
              console.log('User document found, setting data.');
              setUserData(documentSnapshot.data() as UserData);
            } else {
              console.log('User document does not exist in Firestore!');
              setUserData(null); // Explicitly set to null if not found
            }
            setInitializing(false); // We are done loading
          },
          error => {
            console.error('Error fetching user data:', error);
            Alert.alert('Error', 'Failed to load user data. Please try again.');
            setInitializing(false);
          },
        );

      return userDocSubscriber; // Unsubscribe from Firestore on cleanup
    });

    return authSubscriber; // Unsubscribe from Auth on cleanup
  }, []);

  useEffect(() => {
    if (userData?.familyId) {
      //setup a constant listener on family documents
      const subscriber = firestore()
        .collection('familes')
        .doc(userData.familyId)
        .onSnapshot(async familyDoc => {
          if (familyDoc.exists()) {
            const currentFamilyData = familyDoc.data();
            //store family data like invite code
            setFamilyData({ inviteCode: currentFamilyData?.inviteCode });

            const memberUIDs: string[] = currentFamilyData?.members || [];

            if (memberUIDs.length > 0) {
              const usersnapshot = await firestore()
                .collection('users')
                .where('uid', 'in', memberUIDs)
                .get();

                const membersData = 
            }
          }
        });
    }
  });

  const handleCreateFamily = async () => {
    if (!user) return;

    setCreatingFamily(true);

    try {
      const inviteCode = generateInviteCode();
      const familyRef = firestore().collection('families').doc(); // Fixed typo: 'familes' -> 'families'

      const batch = firestore().batch();

      batch.set(familyRef, {
        name: `${user.email}'s Family`,
        head: user.uid,
        members: [user.uid],
        inviteCode: inviteCode,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      const userRef = firestore().collection('users').doc(user.uid);
      batch.update(userRef, {
        familyId: familyRef.id,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();
      Alert.alert(
        'Success',
        `Your family group has been created. Your invite code is ${inviteCode}`,
      );
    } catch (error: any) {
      console.error('Error creating family:', error);
      Alert.alert('Error', 'Failed to create family. Please try again.');
    } finally {
      setCreatingFamily(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!user || !userData) {
      Alert.alert('Error', 'No user data found. Please try again.');
      return;
    }

    // Check if user already has a family
    if (userData.familyId) {
      Alert.alert(
        'Error',
        'You are already part of a family. Please leave your current family first.',
      );
      return;
    }

    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code.');
      return;
    }

    setJoiningFamily(true);

    try {
      const familyRef = firestore().collection('families');
      const querySnapshot = await familyRef
        .where('inviteCode', '==', inviteCode.toUpperCase())
        .get();

      if (querySnapshot.empty) {
        Alert.alert('Error', 'Invalid invite code. Please try again.');
        return;
      }

      const familyDoc = querySnapshot.docs[0];
      const familyData = familyDoc.data();
      const familyId = familyDoc.id;

      // Check if user is already a member
      if (familyData.members && familyData.members.includes(user.uid)) {
        Alert.alert('Error', 'You are already a member of this family.');
        return;
      }

      // Use a batch to update the user and the family
      const batch = firestore().batch();

      // Update the user document
      const userRef = firestore().collection('users').doc(user.uid);
      batch.update(userRef, {
        familyId: familyId,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update the family document to add the new member
      // Using arrayUnion to add the new member to the family array without duplicates
      batch.update(familyDoc.ref, {
        members: firestore.FieldValue.arrayUnion(user.uid),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      // Clear the invite code input
      setInviteCode('');

      Alert.alert('Success', 'You have joined the family successfully!');
    } catch (error: any) {
      console.error('Error joining family:', error);
      Alert.alert('Error', 'Failed to join family. Please try again.');
    } finally {
      setJoiningFamily(false);
    }
  };

  const handleLogout = () => {
    auth().signOut();
  };

  if (Initializing) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Error</Text>
        <Text
          style={{ textAlign: 'center', marginHorizontal: 20, lineHeight: 20 }}
        >
          Could not find your user data. This usually happens if you are logged
          in with an old account created before the database was set up.
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            title="Please Log Out and Sign Up Again"
            color="red"
            onPress={handleLogout}
          />
        </View>
      </View>
    );
  }

  if (!userData.familyId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>
          You're not part of a family group yet.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create a New Family</Text>
          <Text style={styles.cardDescription}>
            Start your own family group and invite others to join.
          </Text>
          <Button
            title={creatingFamily ? 'Creating Family...' : 'Create a Family'}
            onPress={handleCreateFamily}
            disabled={creatingFamily}
          />
        </View>

        <Text style={styles.orText}>OR</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Join an Existing Family</Text>
          <Text style={styles.cardDescription}>
            Enter the invite code provided by your family head.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Invite Code"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            maxLength={6}
            editable={!joiningFamily}
          />
          <Button
            title={joiningFamily ? 'Joining Family...' : 'Join Family'}
            onPress={handleJoinFamily}
            disabled={joiningFamily}
          />
        </View>

        <View style={styles.logoutButton}>
          <Button title="LogOut" color="red" onPress={handleLogout} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome To Your Family</Text>
      <Text>Your Family Id is: {userData.familyId}</Text>
      {/* Future features like inventory and other stuff will be displayed here */}
      <View style={styles.logoutButton}>
        <Button title="LogOut" color="red" onPress={handleLogout} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 20,
    width: '80%',
  },
  logoutButton: {
    position: 'absolute',
    bottom: 40,
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    color: '#666',
  },
  orText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#666',
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default HomeScreen;
