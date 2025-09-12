import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  Provider as PaperProvider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const theme = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const userCredentials = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      const user = userCredentials.user;
      console.log('Logged in with:', user.email);

      // Check if user document exists in Firestore
      const userDoc = await firestore().collection('users').doc(user.uid).get();

      if (!userDoc.exists) {
        // Create user document if it doesn't exist (for legacy users)
        await firestore().collection('users').doc(user.uid).set({
          email: email,
          uid: user.uid,
          familyId: null,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log('Created user document for existing user');
      } else {
        console.log('User document already exists');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Invalid email address');
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'User not found');
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Invalid password');
      } else {
        Alert.alert('Error', 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

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
              <Card.Content style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>Welcome Back!</Text>
                <Text variant="bodyLarge" style={styles.subtitle}>Sign in to your account</Text>
              </Card.Content>
            </Card>

            {/* Form Card */}
            <Card style={styles.formCard}>
              <Card.Content>
                {/* Email Input */}
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  left={<Icon name="mail-outline" size={20} color="#666" />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />

                {/* Password Input */}
                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  left={<Icon name="lock-closed-outline" size={20} color="#666" />}
                  right={<Icon 
                    name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                    size={20}
                    color="#666"
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  />}
                  secureTextEntry={!isPasswordVisible}
                  style={styles.input}
                />

                {/* Login Button */}
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                {/* Footer Link to Sign Up */}
                <View style={styles.signupContainer}>
                  <Text variant="bodyMedium" style={styles.signupText}>Don't have an account?</Text>
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('SignUp')}
                    style={styles.signupButton}
                  >
                    Sign Up
                  </Button>
                </View>
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
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerCard: {
    marginBottom: 20,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  formCard: {
    elevation: 4,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    marginRight: 8,
  },
  signupButton: {
    marginLeft: -8,
  },
});

export default LoginScreen;
