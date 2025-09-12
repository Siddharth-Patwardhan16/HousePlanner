import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Button, TextInput, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  Card, 
  useTheme, 
  Provider as PaperProvider,
  Surface
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
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

interface FamilyManagementScreenProps {
  onFamilyJoined: () => void;
  onFamilyCreated: () => void;
}

const FamilyManagementScreen = ({ onFamilyJoined, onFamilyCreated }: FamilyManagementScreenProps) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [joiningFamily, setJoiningFamily] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [initializing, setInitializing] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const authSubscriber = auth().onAuthStateChanged(userAuth => {
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
              setUserData(documentSnapshot.data() as UserData);
            } else {
              setUserData(null);
            }
            setInitializing(false);
          },
          error => {
            console.error('Error fetching user data:', error);
            Alert.alert('Error', 'Failed to load user data. Please try again.');
            setInitializing(false);
          },
        );

      return userDocSubscriber;
    });

    return authSubscriber;
  }, []);

  const handleCreateFamily = async () => {
    if (!user) return;

    setCreatingFamily(true);

    try {
      const inviteCode = generateInviteCode();
      const familyRef = firestore().collection('families').doc();

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
        [{ text: 'OK', onPress: onFamilyCreated }]
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

      if (familyData.members && familyData.members.includes(user.uid)) {
        Alert.alert('Error', 'You are already a member of this family.');
        return;
      }

      const batch = firestore().batch();

      const userRef = firestore().collection('users').doc(user.uid);
      batch.update(userRef, {
        familyId: familyId,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      batch.update(familyDoc.ref, {
        members: firestore.FieldValue.arrayUnion(user.uid),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      setInviteCode('');
      Alert.alert('Success', 'You have joined the family successfully!', [
        { text: 'OK', onPress: onFamilyJoined }
      ]);
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

  if (initializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconButton icon="alert-circle" size={60} iconColor="#ff6b6b" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>
            Could not find your user data. This usually happens if you are logged
            in with an old account created before the database was set up.
          </Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Please Log Out and Sign Up Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Header */}
            <Card style={styles.headerCard}>
              <Card.Content>
                <View style={styles.header}>
                  <Surface style={styles.headerIcon} elevation={2}>
                    <Icon name="people" size={40} color={theme.colors.primary} />
                  </Surface>
                  <Text style={styles.title}>Family Management</Text>
                  <Text style={styles.subtitle}>
                    Create a new family or join an existing one
                  </Text>
                </View>
              </Card.Content>
            </Card>

            {/* Create Family Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Icon name="add-circle" size={24} color={theme.colors.primary} />
                  <Text style={styles.cardTitle}>Create a New Family</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Start your own family group and invite others to join.
                </Text>
                <Button
                  mode="contained"
                  onPress={handleCreateFamily}
                  disabled={creatingFamily}
                  loading={creatingFamily}
                  style={styles.primaryButton}
                >
                  {creatingFamily ? 'Creating Family...' : 'Create a Family'}
                </Button>
              </Card.Content>
            </Card>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

            {/* Join Family Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Icon name="people-outline" size={24} color={theme.colors.primary} />
                  <Text style={styles.cardTitle}>Join an Existing Family</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Enter the invite code provided by your family head.
                </Text>
                <View style={styles.inputContainer}>
                  <Icon name="key-outline" size={20} color="#888" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Invite Code"
                    placeholderTextColor="#888"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="characters"
                    maxLength={6}
                    editable={!joiningFamily}
                  />
                </View>
                <Button
                  mode="outlined"
                  onPress={handleJoinFamily}
                  disabled={joiningFamily}
                  loading={joiningFamily}
                  style={styles.secondaryButton}
                >
                  {joiningFamily ? 'Joining Family...' : 'Join Family'}
                </Button>
              </Card.Content>
            </Card>

            {/* Logout Button */}
            <Card style={styles.logoutCard}>
              <Card.Content>
                <Button
                  mode="text"
                  onPress={handleLogout}
                  icon="logout"
                  textColor="#ff6b6b"
                  style={styles.logoutButton}
                >
                  Log Out
                </Button>
              </Card.Content>
            </Card>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 4,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  logoutCard: {
    marginTop: 16,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9ECEF',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default FamilyManagementScreen;

