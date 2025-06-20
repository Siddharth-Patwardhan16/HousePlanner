# Firestore Database Setup Guide

## Overview

This guide will help you set up and troubleshoot your Firestore database for the HousePlanner app.

## What Was Fixed

### 1. SignUpScreen Issues

- **Problem**: User data wasn't being created in Firestore during signup
- **Solution**: Added proper Firestore document creation with user data
- **Key Changes**:
  - Added async/await pattern
  - Created user document in Firestore after successful authentication
  - Added proper error handling and loading states
  - Added timestamps for tracking

### 2. LoginScreen Issues

- **Problem**: Overwriting existing user data on every login
- **Solution**: Check if user document exists before creating
- **Key Changes**:
  - Check if user document exists in Firestore
  - Only create document if it doesn't exist (for legacy users)
  - Added proper error handling

### 3. HomeScreen Issues

- **Problem**: Typo in collection name and missing error handling
- **Solution**: Fixed collection name and added comprehensive error handling
- **Key Changes**:
  - Fixed 'familes' → 'families' collection name
  - Added error handling for Firestore operations
  - Added loading states for family creation
  - Improved user feedback

## Firestore Database Structure

### Collections

#### 1. `users` Collection

```javascript
{
  uid: "user_uid_from_firebase_auth",
  email: "user@example.com",
  familyId: "family_document_id_or_null",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

#### 2. `families` Collection

```javascript
{
  name: "Family Name",
  head: "user_uid_of_family_head",
  members: ["user_uid_1", "user_uid_2"],
  inviteCode: "ABC123",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

## Testing Steps

### 1. Test New User Signup

1. Open the app
2. Go to Sign Up screen
3. Create a new account with email and password
4. Check Firebase Console → Firestore → users collection
5. Verify user document was created

### 2. Test Existing User Login

1. Log out if logged in
2. Go to Login screen
3. Login with existing credentials
4. Check Firebase Console → Firestore → users collection
5. Verify user document exists and wasn't overwritten

### 3. Test Family Creation

1. Login with any user
2. Click "Create a Family" button
3. Check Firebase Console → Firestore → families collection
4. Verify family document was created
5. Check users collection to verify familyId was updated

## Firebase Console Setup

### 1. Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (houseplanner-3e35b)
3. Go to Firestore Database in the left sidebar
4. Click "Create Database"
5. Choose "Start in test mode" for development
6. Select a location (choose closest to your users)

### 2. Set Up Security Rules

Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Family members can read family data, head can write
    match /families/{familyId} {
      allow read: if request.auth != null &&
        request.auth.uid in resource.data.members;
      allow write: if request.auth != null &&
        request.auth.uid == resource.data.head;
    }
  }
}
```

### 3. Enable Authentication

1. Go to Authentication in Firebase Console
2. Click "Get Started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider

## Debugging Tools

### 1. Use the Debug Function

Add this to any screen for debugging:

```javascript
import { debugUserState } from '../utils/firebaseUtils';

// Call this function to see current user state
debugUserState();
```

### 2. Check Console Logs

Look for these log messages:

- "User account created & signed in!"
- "Created user document for existing user"
- "User document already exists"
- "User document found, setting data."
- "User document does not exist in Firestore!"

### 3. Firebase Console Monitoring

1. Go to Firestore Database
2. Check the "users" collection
3. Check the "families" collection
4. Look for any error messages in the console

## Common Issues and Solutions

### Issue 1: "Could not find your user data"

**Cause**: User authenticated but no document in Firestore
**Solution**: The updated LoginScreen will now create the document automatically

### Issue 2: User data not appearing in Firestore

**Cause**: Firestore not enabled or security rules blocking access
**Solution**:

1. Enable Firestore Database
2. Check security rules
3. Verify Firebase configuration

### Issue 3: Family creation fails

**Cause**: Typo in collection name or missing permissions
**Solution**: Fixed collection name from 'familes' to 'families'

### Issue 4: App crashes on startup

**Cause**: Missing Firebase configuration
**Solution**: Verify google-services.json is properly configured

## Next Steps

1. **Test the app** with the updated code
2. **Check Firebase Console** to verify data is being created
3. **Monitor console logs** for any errors
4. **Test both new user signup and existing user login**
5. **Test family creation functionality**

## Support

If you're still experiencing issues:

1. Check the console logs for error messages
2. Verify Firebase Console shows the correct project
3. Ensure Firestore Database is enabled
4. Check that security rules allow read/write operations
5. Verify your google-services.json file is up to date
