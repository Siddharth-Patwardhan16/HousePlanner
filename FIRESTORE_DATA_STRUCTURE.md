# Firestore Data Structure Guide

This document outlines the expected data structure for the HousePlanner app to work with real Firestore data.

## Collections

### 1. `users` Collection
```javascript
{
  uid: "firebase_auth_uid",
  email: "user@example.com",
  familyId: "family_document_id_or_null",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 2. `families` Collection
```javascript
{
  name: "Family Name",
  head: "user_uid_of_family_head",
  members: ["user_uid_1", "user_uid_2", "user_uid_3"],
  inviteCode: "ABC123",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 3. `tasks` Collection
```javascript
{
  title: "Task Title",
  dueDate: "2025-01-15", // YYYY-MM-DD format
  assignee: "User Name",
  assignedBy: "User Name",
  completed: false,
  priority: "high" | "medium" | "low",
  familyId: "family_document_id",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 4. `inventory` Collection
```javascript
{
  name: "Item Name",
  quantity: "2",
  category: "Category Name",
  isLowStock: true | false,
  familyId: "family_document_id",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

## Testing Data

To test the app, you can manually add some sample data to Firestore:

### Sample Family
1. Create a family document in the `families` collection
2. Add the family ID to your user document's `familyId` field

### Sample Tasks
1. Create task documents in the `tasks` collection
2. Set `familyId` to match your family ID
3. Use today's date for `dueDate` to see them in "Today's Tasks"

### Sample Inventory
1. Create inventory documents in the `inventory` collection
2. Set `familyId` to match your family ID
3. Set `isLowStock: true` to see them in "Low on Stock"

## Security Rules

Make sure your Firestore security rules allow:
- Users to read/write their own user document
- Family members to read family data
- Family members to read/write tasks and inventory for their family

Example rules:
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

