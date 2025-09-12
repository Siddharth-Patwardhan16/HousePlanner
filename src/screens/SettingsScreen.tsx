import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, Modal } from 'react-native';
import { 
  Button, 
  Card, 
  useTheme, 
  Provider as PaperProvider,
  Surface,
  Divider
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface UserData {
  uid: string;
  email: string;
  familyId: string | null;
}

interface FamilyData {
  id: string;
  name: string;
  head: string;
  members: string[];
  inviteCode: string;
  createdAt?: any;
  updatedAt?: any;
}

interface FamilyMember {
  uid: string;
  email: string;
  familyId: string | null;
}

interface SettingsScreenProps {
  navigation?: any;
}

const SettingsScreen = ({ navigation }: SettingsScreenProps) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [familyData, setFamilyData] = useState<FamilyData | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
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
            setInitializing(false);
          },
        );

      return userDocSubscriber;
    });

    return authSubscriber;
  }, []);

  useEffect(() => {
    if (userData?.familyId) {
      const familySubscriber = firestore()
        .collection('families')
        .doc(userData.familyId)
        .onSnapshot(async familyDoc => {
          if (familyDoc.exists()) {
            const currentFamilyData = familyDoc.data() as FamilyData;
            setFamilyData({ ...currentFamilyData, id: familyDoc.id });

            const memberUIDs: string[] = currentFamilyData?.members || [];
            if (memberUIDs.length > 0) {
              const usersSnapshot = await firestore()
                .collection('users')
                .where('uid', 'in', memberUIDs)
                .get();

              const membersData = usersSnapshot.docs.map(doc => doc.data() as FamilyMember);
              setFamilyMembers(membersData);
            }
          }
        });

      return familySubscriber;
    }
  }, [userData?.familyId]);

  const handleLogout = () => {
    auth().signOut();
  };

  const handleLeaveFamily = () => {
    if (!user || !userData?.familyId || !familyData) return;

    Alert.alert(
      'Leave Family',
      'Are you sure you want to leave this family? You will need an invite code to join again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: confirmLeaveFamily }
      ]
    );
  };

  const confirmLeaveFamily = async () => {
    if (!user || !userData?.familyId || !familyData) return;

    try {
      const batch = firestore().batch();

      // Remove user from family members
      const familyRef = firestore().collection('families').doc(familyData.id);
      batch.update(familyRef, {
        members: firestore.FieldValue.arrayRemove(user.uid),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Remove familyId from user
      const userRef = firestore().collection('users').doc(user.uid);
      batch.update(userRef, {
        familyId: null,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();
      Alert.alert('Success', 'You have left the family successfully.');
    } catch (error) {
      console.error('Error leaving family:', error);
      Alert.alert('Error', 'Failed to leave family. Please try again.');
    }
  };

  const handleRemoveMember = (memberUid: string, memberEmail: string) => {
    if (!user || !familyData || familyData.head !== user.uid) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberEmail} from the family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => confirmRemoveMember(memberUid) }
      ]
    );
  };

  const confirmRemoveMember = async (memberUid: string) => {
    if (!user || !familyData || familyData.head !== user.uid) return;

    try {
      const batch = firestore().batch();

      // Remove member from family
      const familyRef = firestore().collection('families').doc(familyData.id);
      batch.update(familyRef, {
        members: firestore.FieldValue.arrayRemove(memberUid),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Remove familyId from member
      const memberRef = firestore().collection('users').doc(memberUid);
      batch.update(memberRef, {
        familyId: null,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();
      Alert.alert('Success', 'Member removed successfully.');
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert('Error', 'Failed to remove member. Please try again.');
    }
  };

  const copyInviteCode = () => {
    if (familyData?.inviteCode) {
      // In a real app, you'd use Clipboard from @react-native-clipboard/clipboard
      Alert.alert('Invite Code', `Share this code with family members: ${familyData.inviteCode}`);
    }
  };

  const settingsOptions = [
    {
      id: 'profile',
      icon: 'person-outline',
      title: 'Profile Management',
      description: 'Edit your personal information',
      action: () => console.log('Navigate to profile'),
      show: true
    },
    {
      id: 'family',
      icon: 'people-outline',
      title: 'Family Members',
      description: familyData ? `${familyMembers.length} members` : 'No family joined',
      action: () => setShowFamilyModal(true),
      show: true
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      title: 'Notifications',
      description: 'Configure alerts and reminders',
      action: () => console.log('Navigate to notifications'),
      show: true
    },
    {
      id: 'logout',
      icon: 'log-out-outline',
      title: 'Log Out',
      description: 'Sign out of your account',
      action: handleLogout,
      isDestructive: true,
      show: true
    }
  ];

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
            Could not load your data. Please try again.
          </Text>
        </View>
      </SafeAreaView>
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
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Manage your account and preferences</Text>
              </Card.Content>
            </Card>

            {/* User Profile Card */}
            <Card style={styles.profileCard}>
              <Card.Content>
                <View style={styles.profileContent}>
                  <Surface style={styles.avatar} elevation={2}>
                    <Text style={styles.avatarText}>
                      {userData.email.charAt(0).toUpperCase()}
                    </Text>
                  </Surface>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{userData.email.split('@')[0]}</Text>
                    <Text style={styles.profileEmail}>{userData.email}</Text>
                    <Text style={styles.profileRole}>
                      {familyData?.head === user.uid ? 'Family Head' : 'Family Member'}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Settings Options */}
            <Card style={styles.optionsCard}>
              <Card.Content>
                {settingsOptions.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.optionItem}
                    onPress={option.action}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[
                        styles.optionIcon,
                        { backgroundColor: option.isDestructive ? 'rgba(255, 107, 107, 0.1)' : 'rgba(74, 144, 226, 0.1)' }
                      ]}>
                        <Icon 
                          name={option.icon} 
                          size={20} 
                          color={option.isDestructive ? '#FF6B6B' : '#4A90E2'} 
                        />
                      </View>
                      <View style={styles.optionText}>
                        <Text style={[
                          styles.optionTitle,
                          { color: option.isDestructive ? '#FF6B6B' : '#333' }
                        ]}>
                          {option.title}
                        </Text>
                        <Text style={styles.optionDescription}>{option.description}</Text>
                      </View>
                    </View>
                    <Icon name="chevron-forward-outline" size={20} color="#C7C7CC" />
                  </TouchableOpacity>
                ))}
              </Card.Content>
            </Card>

            {/* App Info */}
            <Card style={styles.appInfoCard}>
              <Card.Content>
                <Text style={styles.appName}>Household Hub</Text>
                <Text style={styles.appVersion}>Version 1.0.0</Text>
                <Text style={styles.appDescription}>Simplify your family's daily life</Text>
              </Card.Content>
            </Card>

            {/* Support Links */}
            <Card style={styles.supportCard}>
              <Card.Content>
                <TouchableOpacity style={styles.supportButton}>
                  <Text style={styles.supportButtonText}>Help & Support</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.supportButton}>
                  <Text style={styles.supportButtonText}>Privacy Policy</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>

      {/* Family Management Modal */}
      <Modal
        visible={showFamilyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFamilyModal(false)}>
              <IconButton icon="close" size={24} iconColor="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Family Management</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {familyData ? (
              <>
                {/* Family Info */}
                <View style={styles.familyInfoCard}>
                  <Text style={styles.familyName}>{familyData.name}</Text>
                  <Text style={styles.familyCode}>Invite Code: {familyData.inviteCode}</Text>
                  <TouchableOpacity style={styles.copyButton} onPress={copyInviteCode}>
                    <IconButton icon="content-copy" size={16} iconColor="#4A90E2" />
                    <Text style={styles.copyButtonText}>Copy Code</Text>
                  </TouchableOpacity>
                </View>

                {/* Family Members */}
                <View style={styles.membersSection}>
                  <Text style={styles.membersTitle}>Family Members ({familyMembers.length})</Text>
                  {familyMembers.map(member => (
                    <View key={member.uid} style={styles.memberItem}>
                      <View style={styles.memberLeft}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>
                            {member.email.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{member.email.split('@')[0]}</Text>
                          <Text style={styles.memberEmail}>{member.email}</Text>
                          {familyData.head === member.uid && (
                            <Text style={styles.memberRole}>Head</Text>
                          )}
                        </View>
                      </View>
                      {familyData.head === user.uid && member.uid !== user.uid && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveMember(member.uid, member.email)}
                        >
                          <IconButton icon="delete" size={16} iconColor="#FF6B6B" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                {/* Leave Family Button */}
                <TouchableOpacity style={styles.leaveFamilyButton} onPress={handleLeaveFamily}>
                  <IconButton icon="logout" size={20} iconColor="#FF6B6B" />
                  <Text style={styles.leaveFamilyText}>Leave Family</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noFamilyContainer}>
                <IconButton icon="account-group" size={60} iconColor="#C7C7CC" />
                <Text style={styles.noFamilyTitle}>No Family Joined</Text>
                <Text style={styles.noFamilyText}>
                  You need to join or create a family to manage family members.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 4,
  },
  profileCard: {
    marginBottom: 16,
    elevation: 4,
  },
  optionsCard: {
    marginBottom: 16,
    elevation: 4,
  },
  appInfoCard: {
    marginBottom: 16,
    elevation: 4,
  },
  supportCard: {
    marginBottom: 16,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
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
  },
  header: {
    paddingTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  appInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 12,
    color: '#999',
  },
  supportContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  supportButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  supportButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  familyInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  familyName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  familyCode: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
    marginLeft: 4,
  },
  membersSection: {
    marginBottom: 20,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
  },
  leaveFamilyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  leaveFamilyText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
    marginLeft: 8,
  },
  noFamilyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noFamilyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noFamilyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
});

export default SettingsScreen;
