# Server Sync Feature - Implementation Complete

## Overview
The remote server sync feature has been successfully implemented. When the user clicks the Refresh button, the app will now sync documents from your HTTP server.

---

## Server Configuration (HARDCODED)

**Server URL:** `http://192.168.1.9:8000`
**Manifest URL:** `http://192.168.1.9:8000/manifest.json`

To change the server URL, edit `main.js` line 20:
```javascript
const SERVER_BASE_URL = 'http://YOUR_NEW_IP:PORT';
```

---

## Server Requirements

### 1. Folder Structure
```
Server Root (http://192.168.1.9:8000/)
├── manifest.json          # File manifest
└── docs/
    ├── gcf/
    │   ├── testing.pdf
    │   └── ... (more PDFs)
    └── policy/
        ├── sample.pdf
        └── ... (more PDFs)
```

### 2. manifest.json Format
```json
{
  "gcf": [
    {
      "name": "testing.pdf",
      "size": 18810,
      "modified": "2025-12-27T17:53:00Z"
    }
  ],
  "policy": [
    {
      "name": "sample.pdf",
      "size": 18810,
      "modified": "2025-12-27T17:53:00Z"
    }
  ]
}
```

**Important:** When you add/update files, you must update the `modified` timestamp in manifest.json!

---

## How It Works

### Sync Flow
1. **Fetch Manifest** - Gets file list from `http://192.168.1.9:8000/manifest.json`
2. **Compare Files** - Compares with local cache to determine what needs downloading
3. **Download One-by-One** - Downloads files sequentially with progress updates
4. **Update Cache** - Saves new/updated file info to cache
5. **Display Results** - Shows success/error status

### Download Triggers
A file will be downloaded if:
- ✅ It's NEW (not in local cache)
- ✅ It's UPDATED (remote modified date > local modified date)
- ✅ Previous download FAILED (marked as failed in cache)

---

## UI States

### 1. Syncing (Progress)
```
┌─────────────────────────────┐
│      ⟳ Syncing...         │
│  Downloading file 1 of 2  │
│      testing.pdf           │
│  ███████████░░░░░░░ 60%  │
│          60%              │
└─────────────────────────────┘
```

### 2. Sync Complete (Success)
```
┌─────────────────────────────┐
│        ✓ Success!          │
│  Successfully synced 2     │
│      files                │
│  ┌─────────┐             │
│  │    2    │ Downloaded  │
│  └─────────┘             │
└─────────────────────────────┘
```

### 3. Sync Complete (With Errors)
```
┌─────────────────────────────┐
│     ⚠ Partial Success     │
│  Synced 1 files, 1       │
│      failed.              │
│  ┌─────────┐ ┌─────────┐ │
│  │    1    │ │    1    │ │
│  │Downloaded│ │ Failed  │ │
│  └─────────┘ └─────────┘ │
│  Failed files will be      │
│  retried on next refresh  │
└─────────────────────────────┘
```

### 4. Up to Date
```
┌─────────────────────────────┐
│        ℹ Sync Info        │
│  All documents are up to   │
│         date             │
└─────────────────────────────┘
```

### 5. Sync Failed
```
┌─────────────────────────────┐
│        ✗ Sync Failed      │
│  Failed to fetch manifest: │
│  Connection refused        │
│  Click Refresh to try      │
│         again             │
└─────────────────────────────┘
```

---

## Error Handling

### Network Errors
- Server offline → Shows error message
- Timeout (30s) → Shows error message
- Invalid manifest → Shows error message

### Download Errors
- Missing file on server → Marks as failed, continues
- Corrupt download → Marks as failed, continues
- Disk write error → Shows error message

### Retry Logic
- Failed files are marked in cache with `syncStatus: 'failed'`
- Next refresh will retry only failed files
- No need to restart the app

---

## Testing Scenarios

### Test 1: Initial Sync (Fresh App)
1. Clear `data/cache.json` (delete it)
2. Start the app
3. Navigate to Resources
4. Should auto-sync and download all files

### Test 2: Refresh (No Changes)
1. App has all files synced
2. Click Refresh
3. Should show "All documents are up to date"

### Test 3: New File Added
1. Add `new-file.pdf` to server
2. Update `manifest.json` with new file
3. Click Refresh in app
4. Should download only the new file

### Test 4: File Updated
1. Modify `testing.pdf` on server
2. Update `modified` date in `manifest.json`
3. Click Refresh in app
4. Should download updated file

### Test 5: Server Offline
1. Stop your http-server
2. Click Refresh in app
3. Should show "Sync Failed" error
4. Start server again
5. Click Refresh → Should sync successfully

### Test 6: Retry Failed Downloads
1. Delete a file on server (but keep in manifest)
2. Click Refresh → Sync will fail for that file
3. Restore file to server
4. Click Refresh → Should retry and succeed

---

## Cache File Structure

After sync, `data/cache.json` will look like:
```json
{
  "gcf": [
    {
      "id": "gcf-testing.pdf",
      "title": "Testing",
      "description": "",
      "file": "gcf/testing.pdf",
      "size": "18.4 KB",
      "date": "2025-12-27",
      "remoteModified": "2025-12-27T17:53:00Z",
      "syncStatus": "success"
    }
  ],
  "policy": [
    {
      "id": "policy-sample.pdf",
      "title": "Sample",
      "description": "",
      "file": "policy/sample.pdf",
      "size": "18.4 KB",
      "date": "2025-12-27",
      "remoteModified": "2025-12-27T17:53:00Z",
      "syncStatus": "success"
    }
  ],
  "lastSync": "2025-12-27T18:00:00.000Z"
}
```

---

## Files Modified

### 1. main.js
- Added server URL configuration (lines 19-22)
- Added `fetchManifest()` function
- Added `compareFiles()` function
- Added `downloadFile()` function with progress tracking
- Added `updateCacheWithFile()` function
- Added `sync-remote-documents` IPC handler
- Added IPC event emissions for progress updates

### 2. renderer.js
- Added `isSyncing` state flag
- Modified `loadDocuments()` to use server sync
- Modified `refreshDocuments()` to call server sync
- Added `syncWithServer()` function
- Added `showSyncProgress()` and `showSyncProgressUpdate()`
- Added `showSyncSuccess()`, `showSyncInfo()`, `showSyncError()`
- Added IPC listeners for sync events

### 3. styles.css
- Added `.sync-progress-container` styles
- Added `.progress-bar-container` and `.progress-bar`
- Added `.sync-result-container` styles
- Added `.sync-success`, `.sync-partial`, `.sync-info`, `.sync-error`
- Added `.sync-stats`, `.sync-stat` styles

### 4. data/cache.json
- Added `lastSync` field
- Documents will have `remoteModified` and `syncStatus` fields after sync

---

## Important Notes

1. **Server IP Changes:** If your server IP changes, update line 20 in `main.js`

2. **Manifest Updates:** Always update `manifest.json` when adding/modifying files

3. **File Size:** Currently max 3 files as per your requirement, but the code handles unlimited files

4. **Timeout:** Each request has a 30-second timeout

5. **No Environment Variables:** Server URL is hardcoded as requested

6. **Logging:** All sync operations are logged to console (check DevTools for debugging)

---

## Running the App

### On Windows (Your Machine)
```powershell
cd "C:\Users\mehdi\OneDrive\Desktop\New folder (3)"
npm install
npm start
```

### Or if you have the project in the cloned folder
```powershell
cd /path/to/project
npm install
npm start
```

---

## Debugging

To see sync logs:
1. Open the app
2. Press `Ctrl+Shift+I` (or `Cmd+Option+I` on Mac) to open DevTools
3. Go to Console tab
4. Click Refresh in the app
5. Watch the sync progress logs

---

## Next Steps

1. **Ensure your server is running** on `http://192.168.1.9:8000`
2. **Verify manifest.json** is accessible at `http://192.168.1.9:8000/manifest.json`
3. **Run the app** and navigate to Resources
4. **Click Refresh** to sync documents

Everything is ready to test! 🚀
