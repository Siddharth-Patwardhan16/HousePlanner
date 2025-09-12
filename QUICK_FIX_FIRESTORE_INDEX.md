# Quick Fix for Firestore Index Error

## The Problem
Your app is showing this error:
```
The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/houseplanner-3e35b/firestore/indexes?create_composite=...
```

## The Solution (2 minutes)

### Step 1: Create the Index
1. **Click this direct link**: https://console.firebase.google.com/v1/r/project/houseplanner-3e35b/firestore/indexes?create_composite=ClBwcm9qZWN0cy9ob3VzZXBsYW5uZXItM2UzNWIvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3Rhc2tzL2luZGV4ZXMvXxABGgwKCGZhbWlseUlkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg

2. **Click "Create Index"** button
3. **Wait 2-5 minutes** for the index to build

### Step 2: Test Your App
1. **Restart your app** if it's running
2. **The error should disappear**
3. **Tasks should load properly**

## What This Index Does
- **Collection**: `tasks`
- **Fields**: `familyId` (Ascending), `createdAt` (Descending)
- **Purpose**: Allows your app to query tasks by family and sort by creation date

## Alternative Method (If the link doesn't work)
1. Go to https://console.firebase.google.com
2. Select project: `houseplanner-3e35b`
3. Go to Firestore Database → Indexes
4. Click "Create Index"
5. Collection ID: `tasks`
6. Add fields:
   - `familyId` (Ascending)
   - `createdAt` (Descending)
7. Click "Create"

## After Creating the Index
- ✅ No more "failed-precondition" errors
- ✅ Tasks load successfully
- ✅ App works without Firebase errors
- ✅ All Firebase queries work properly

The deprecation warning you saw is just a warning and won't break your app. The main issue is the missing Firestore index.



