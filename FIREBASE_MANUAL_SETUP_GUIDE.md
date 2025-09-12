# Firebase Manual Setup Guide - Step by Step

## Problem
You're experiencing Firebase query errors and need to set up Firestore indexes manually.

## Step-by-Step Solution

### Step 1: Access Firebase Console
1. **Open your browser** and go to: https://console.firebase.google.com
2. **Sign in** with your Google account
3. **Select your project**: "HousePlanner" (or whatever you named it)

### Step 2: Navigate to Firestore Database
1. **In the left sidebar**, click on "Firestore Database"
2. **Click on the "Indexes" tab** (next to "Data" and "Rules")
3. **You should see** any existing indexes or an empty list

### Step 3: Create Required Indexes

#### Index 1: Tasks by familyId and createdAt
1. **Click "Create Index"** button
2. **Collection ID**: Enter `tasks`
3. **Add fields**:
   - Field: `familyId`, Order: `Ascending`
   - Field: `createdAt`, Order: `Descending`
4. **Click "Create"**
5. **Wait for completion** (status will show "Building" then "Enabled")

#### Index 2: Tasks by familyId, dueDate, completed, and createdAt
1. **Click "Create Index"** button again
2. **Collection ID**: Enter `tasks`
3. **Add fields**:
   - Field: `familyId`, Order: `Ascending`
   - Field: `dueDate`, Order: `Ascending`
   - Field: `completed`, Order: `Ascending`
   - Field: `createdAt`, Order: `Descending`
4. **Click "Create"**
5. **Wait for completion**

#### Index 3: Inventory by familyId, isLowStock, and createdAt
1. **Click "Create Index"** button again
2. **Collection ID**: Enter `inventory`
3. **Add fields**:
   - Field: `familyId`, Order: `Ascending`
   - Field: `isLowStock`, Order: `Ascending`
   - Field: `createdAt`, Order: `Descending`
4. **Click "Create"**
5. **Wait for completion**

### Step 4: Verify Index Creation
1. **Check the Indexes tab** - you should see 3 new indexes
2. **All indexes should show "Enabled" status**
3. **Note the index names** (they'll be auto-generated)

### Step 5: Test Your App
1. **Run your React Native app**
2. **Try to add a task** - should work without errors
3. **Check the home screen** - should load tasks and inventory
4. **Monitor the console** for any remaining errors

### Step 6: If You Still Get Errors

#### Check Firestore Rules
1. **Go to "Rules" tab** in Firestore
2. **Make sure you have rules like**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /families/{familyId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.members;
      allow write: if request.auth != null && request.auth.uid == resource.data.head;
    }
    
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/families/$(resource.data.familyId)).data.members;
    }
    
    match /inventory/{itemId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/families/$(resource.data.familyId)).data.members;
    }
  }
}
```

#### Check Authentication
1. **Go to "Authentication" tab**
2. **Make sure users can sign up/sign in**
3. **Check if your test user exists**

#### Check Data Structure
1. **Go to "Data" tab** in Firestore
2. **Verify collections exist**: `users`, `families`, `tasks`, `inventory`
3. **Check if your user has a `familyId` field**

### Step 7: Debug Common Issues

#### Issue: "Permission denied"
- **Solution**: Check Firestore rules (Step 6)
- **Make sure**: User is authenticated and has proper permissions

#### Issue: "Document not found"
- **Solution**: Check if documents exist in Firestore
- **Make sure**: User document has `familyId` field

#### Issue: "Index not found"
- **Solution**: Wait for indexes to build (can take 5-10 minutes)
- **Check**: Index status in Firebase Console

#### Issue: "Invalid query"
- **Solution**: Check query syntax in your code
- **Make sure**: Field names match exactly

### Step 8: Alternative - Use Firebase CLI (Advanced)

If you prefer command line:

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase**:
   ```bash
   firebase init firestore
   ```

4. **Deploy indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### Step 9: Test Data Creation

If you need to create test data:

1. **Go to Firestore "Data" tab**
2. **Create a family document**:
   - Collection: `families`
   - Document ID: `test-family-1`
   - Fields:
     - `name`: "Test Family"
     - `head`: "your-user-id"
     - `members`: ["your-user-id"]
     - `inviteCode`: "TEST123"

3. **Update your user document**:
   - Collection: `users`
   - Document ID: "your-user-id"
   - Add field: `familyId`: "test-family-1"

4. **Create a test task**:
   - Collection: `tasks`
   - Document ID: "test-task-1"
   - Fields:
     - `title`: "Test Task"
     - `assignee`: "Test User"
     - `dueDate`: "2025-01-15"
     - `completed`: false
     - `priority`: "medium"
     - `familyId`: "test-family-1"
     - `createdAt`: (current timestamp)

### Step 10: Final Verification

1. **All indexes are "Enabled"**
2. **Firestore rules are correct**
3. **Test data exists**
4. **App runs without errors**
5. **Tasks can be created and viewed**

## Troubleshooting

### Still Getting Errors?
1. **Check browser console** for detailed error messages
2. **Check React Native console** for app-specific errors
3. **Verify Firebase project settings**
4. **Make sure you're using the correct Firebase config**

### Need Help?
- **Firebase Documentation**: https://firebase.google.com/docs
- **Firestore Indexes Guide**: https://firebase.google.com/docs/firestore/query-data/indexing
- **React Native Firebase**: https://rnfirebase.io/

## Summary

The main issue is that Firestore requires composite indexes for complex queries. By creating the 3 indexes mentioned above, your app should work perfectly. The process takes about 10-15 minutes total, with most time spent waiting for indexes to build.


