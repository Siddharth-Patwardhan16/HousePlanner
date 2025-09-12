# Firestore Index Setup Guide

## Problem
You're getting a "failed precondition" error with "the query requires an index" because Firestore needs composite indexes for complex queries.

## Solution

### Method 1: Using Firebase Console (Recommended for immediate fix)

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: HousePlanner
3. **Navigate to Firestore Database**
4. **Click on "Indexes" tab**
5. **Click "Create Index"**

Create these indexes one by one:

#### Index 1: Tasks by familyId and createdAt
- **Collection ID**: `tasks`
- **Fields**:
  - `familyId` (Ascending)
  - `createdAt` (Descending)

#### Index 2: Tasks by familyId, dueDate, completed, and createdAt
- **Collection ID**: `tasks`
- **Fields**:
  - `familyId` (Ascending)
  - `dueDate` (Ascending)
  - `completed` (Ascending)
  - `createdAt` (Descending)

#### Index 3: Inventory by familyId, isLowStock, and createdAt
- **Collection ID**: `inventory`
- **Fields**:
  - `familyId` (Ascending)
  - `isLowStock` (Ascending)
  - `createdAt` (Descending)

### Method 2: Using Firebase CLI (For automated deployment)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project**:
   ```bash
   firebase init firestore
   ```

4. **Deploy the indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### Method 3: Quick Fix - Modify Queries (Temporary)

If you need an immediate fix, you can modify the queries to avoid the index requirement:

#### For TasksScreen.tsx:
```typescript
// Instead of:
.where('familyId', '==', userData.familyId)
.orderBy('createdAt', 'desc')

// Use:
.where('familyId', '==', userData.familyId)
// Remove orderBy temporarily, or sort in JavaScript
```

#### For NewHomeScreen.tsx:
```typescript
// Instead of:
.where('familyId', '==', userData.familyId)
.where('dueDate', '==', today)
.where('completed', '==', false)
.orderBy('createdAt', 'desc')

// Use:
.where('familyId', '==', userData.familyId)
.where('dueDate', '==', today)
.where('completed', '==', false)
// Remove orderBy temporarily
```

## Verification

After creating the indexes:

1. **Wait for index creation** (can take a few minutes)
2. **Test your app** - the queries should work without errors
3. **Check Firebase Console** - you should see the indexes listed under "Indexes" tab

## Common Queries That Need Indexes

- `where('field1', '==', value).orderBy('field2')`
- `where('field1', '==', value).where('field2', '==', value).orderBy('field3')`
- `where('field1', '==', value).where('field2', '==', value).where('field3', '==', value).orderBy('field4')`

## Notes

- **Single field queries** don't need indexes
- **Range queries** (`>`, `<`, `>=`, `<=`) need indexes
- **Array-contains** queries need indexes
- **Composite indexes** are needed for multiple field combinations
- **Order matters** in composite indexes - the order of fields in the index must match the query order

## Files Created

- `firestore.indexes.json` - Contains all required indexes
- `firebase.json` - Firebase configuration file
- `FIRESTORE_INDEX_SETUP.md` - This guide

