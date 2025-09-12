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

interface SignUpScreenProps {
  navigation: any;
}

const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  // Keep your existing handleSignUp logic
  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      const user = userCredential.user;
      await firestore().collection('users').doc(user.uid).set({
        name: name.trim(),
        email: email,
        uid: user.uid,
        familyId: null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log('User account created & signed in!');
      Alert.alert('Success', 'Account created successfully');
    } catch (error: any) {
      console.error('Sign up error:', error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'Email already in use');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Invalid email');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'Weak password');
      } else {
        Alert.alert(
          'Error',
          error.message || 'An error occurred during sign up',
        );
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
            {/* 1. The Header */}
            <Card style={styles.headerCard}>
              <Card.Content style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
                <Text variant="bodyLarge" style={styles.subtitle}>Let's get you started!</Text>
              </Card.Content>
            </Card>

            {/* 2. The Form Card */}
            <Card style={styles.formCard}>
              <Card.Content>
                {/* Name Input */}
                <TextInput
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  left={<Icon name="person-outline" size={20} color="#666" />}
                  autoCapitalize="words"
                  editable={!loading}
                  style={styles.input}
                />

                {/* Email Input */}
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  left={<Icon name="mail-outline" size={20} color="#666" />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
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
                  editable={!loading}
                  style={styles.input}
                />

                {/* Confirm Password Input */}
                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="outlined"
                  left={<Icon name="lock-closed-outline" size={20} color="#666" />}
                  right={<Icon 
                    name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                    size={20}
                    color="#666"
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  />}
                  secureTextEntry={!isPasswordVisible}
                  editable={!loading}
                  style={styles.input}
                />

                {/* Sign Up Button */}
                <Button
                  mode="contained"
                  onPress={handleSignUp}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>

                {/* Footer Link to Login */}
                <View style={styles.signupContainer}>
                  <Text variant="bodyMedium" style={styles.signupText}>Already have an account?</Text>
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('Login')}
                    style={styles.loginButton}
                  >
                    Login
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
  loginButton: {
    marginLeft: -8,
  },
});

export default SignUpScreen;
