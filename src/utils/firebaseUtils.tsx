import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface UserData {
  uid: string;
  email: string;
  familyId: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export interface FamilyData {
  id: string;
  name: string;
  head: string;
  members: string[];
  inviteCode: string;
  createdAt?: any;
  updatedAt?: any;
}

// Helper function to create or update user data
export const createOrUpdateUserData = async (userData: Partial<UserData>) => {
  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    const userRef = firestore().collection('users').doc(user.uid);
    await userRef.set(
      {
        ...userData,
        uid: user.uid,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    console.log('User data created/updated successfully');
    return true;
  } catch (error) {
    console.error('Error creating/updating user data:', error);
    throw error;
  }
};

// Helper function to get user data
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await firestore().collection('users').doc(uid).get();
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Helper function to check if user exists in Firestore
export const checkUserExists = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await firestore().collection('users').doc(uid).get();
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};

// Debug function to log current user state
export const debugUserState = async () => {
  const user = auth().currentUser;
  if (!user) {
    console.log('No authenticated user');
    return;
  }

  console.log('Current user:', {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
  });

  const userExists = await checkUserExists(user.uid);
  console.log('User exists in Firestore:', userExists);

  if (userExists) {
    const userData = await getUserData(user.uid);
    console.log('User data:', userData);
  }
};
