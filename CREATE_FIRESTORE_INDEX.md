# Create Required Firestore Index

## Problem
The app is getting this error:
```
The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/houseplanner-3e35b/firestore/indexes?create_composite=...
```

## Solution

### Method 1: Use the Direct Link (Fastest)
1. **Click this link**: https://console.firebase.google.com/v1/r/project/houseplanner-3e35b/firestore/indexes?create_composite=ClBwcm9qZWN0cy9ob3VzZXBsYW5uZXItM2UzNWIvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3Rhc2tzL2luZGV4ZXMvXxABGgwKCGZhbWlseUlkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg

2. **Click "Create Index"** button
3. **Wait for the index to build** (2-5 minutes)
4. **Test your app** - the error should be gone

### Method 2: Manual Creation
1. **Go to**: https://console.firebase.google.com
2. **Select project**: houseplanner-3e35b
3. **Go to**: Firestore Database → Indexes
4. **Click**: "Create Index"
5. **Collection ID**: `tasks`
6. **Fields**:
   - `familyId` (Ascending)
   - `createdAt` (Descending)
7. **Click**: "Create"
8. **Wait for completion**

### Method 3: Using Firebase CLI
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize Firebase
firebase init firestore

# Deploy indexes
firebase deploy --only firestore:indexes
```

## What This Index Does
This index allows queries that:
- Filter by `familyId` (exact match)
- Order by `createdAt` (descending)

This is exactly what your app needs for the tasks query.

## After Creating the Index
1. **Wait 2-5 minutes** for the index to build
2. **Restart your app** if needed
3. **The error should disappear**
4. **Tasks should load properly**

## Verification
Once the index is created, you should see:
- ✅ No more "failed-precondition" errors
- ✅ Tasks load successfully
- ✅ App works without Firebase errors



