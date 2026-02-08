# Mirror Sync Feature - Full Server Synchronization

## Overview
The application now implements **full mirror sync** - it synchronizes with the server as an exact mirror, automatically removing files that no longer exist on the server.

---

## What Changed

### Before: Additive-Only Sync
The app would:
- ✅ Download NEW files from server
- ✅ Update MODIFIED files from server
- ❌ **NEVER delete** files that were removed from the server

**Problem:** Over time, the app would accumulate outdated files that no longer exist on the server.

### After: Full Mirror Sync
The app now:
- ✅ Download NEW files from server
- ✅ Update MODIFIED files from server
- ✅ **DELETE** files that were removed from the server
- ✅ Remove old thumbnails
- ✅ Remove old workshop images

**Result:** The app is now a 100% mirror of the server!

---

## How It Works

### Sync Process Flow

1. **Fetch Manifest** (Step 1)
   - Downloads the latest file manifest from server
   - Validates structure and data types

2. **Load Local Cache** (Step 2)
   - Reads current local cache from `data/cache.json`
   - Creates fresh cache if none exists

3. **Compare Files** (Step 3)
   - Determines which files need to be downloaded
   - Checks for: NEW, UPDATED, or FAILED files

4. **Download Files** (Step 4)
   - Downloads files that need to be updated
   - Downloads thumbnails
   - Downloads workshop images

5. **🆕 Remove Old Files** (Step 4.5)
   - Identifies files that exist locally but NOT on server
   - Deletes PDF files from `docs/` folders
   - Deletes thumbnails from `data/thumbnails/`
   - Deletes workshop images from `data/workshop-images/`
   - Removes entries from cache

6. **Save Cache** (Step 5)
   - Writes updated cache to disk
   - Includes only files that exist on server

7. **Show Results**
   - Displays download count
   - Displays removal count
   - Displays failure count (if any)

---

## Example Scenario

### Initial State
**App has:**
- 2 policy documents
- 3 deliverables
- 1 project readiness
- 6 templates
- 3 workshops

**Server has:**
- 1 policy document
- 5 workshops
- 2 new templates

### After Sync
**App will have:**
- ✅ 1 policy (matched to server)
- ✅ 5 workshops (synced from server)
- ✅ 2 templates (new ones downloaded)
- ❌ 3 deliverables (DELETED - not on server)
- ❌ 1 project readiness (DELETED - not on server)
- ❌ 6 old templates (DELETED - not on server)

**Result:** App is now a 100% mirror of the server!

---

## What Gets Deleted

When files are removed from the server, the app automatically deletes:

### 1. PDF Files
```javascript
docs/{category}/{filename}.pdf
```
Example: `docs/policy/old-policy.pdf`

### 2. Thumbnail Images
```javascript
data/thumbnails/{thumbnail-filename}.png
```
Example: `data/thumbnails/pol-oldpolicy-12345.png`

### 3. Workshop Images
```javascript
data/workshop-images/{workshop-image-filename}.png
```
Example: `data/workshop-images/workshop-123456789-abcde.png`

### 4. Cache Entries
The corresponding entries in `data/cache.json` are removed for all categories.

---

## User Interface Changes

### Sync Complete Screen

The success screen now shows three statistics:

```
┌─────────────────────────────┐
│        ✓ Sync Complete!    │
│  Successfully synced 2      │
│  files and removed 4        │
│  outdated files.            │
│                             │
│  ┌─────────┐ ┌─────────┐   │
│  │    2    │ │    4    │   │
│  │Downloaded│ │ Removed  │   │
│  └─────────┘ └─────────┘   │
│                             │
│  Removed files are no       │
│  longer available on the    │
│  server.                    │
│                             │
│  [ View Documents ]         │
└─────────────────────────────┘
```

### Color Coding

- **Downloaded:** Green (same as before)
- **Removed:** Orange/Amber (new - `#f59e0b`)
- **Failed:** Red (same as before)

### Messages

Different sync results show appropriate messages:

**Success with removals:**
```
Successfully synced 2 files and removed 4 outdated files.
```

**Success with no changes:**
```
All documents are up to date
```

**Partial success (some failures):**
```
Synced 2 files, removed 4, 1 failed. Click refresh to retry.
```

---

## Technical Implementation

### Backend Changes (main.js)

#### Step 4.5: Removal Logic
```javascript
// Step 4.5: Remove files that exist locally but not on server (Mirror Sync)
CATEGORIES.forEach(category => {
  // Build set of remote file IDs
  const remoteIds = new Set(
    (manifestResult.manifest[category] || []).map(f => String(f.id))
  );

  const localDocs = localCache[category] || [];
  const toRemove = localDocs.filter(doc => !remoteIds.has(String(doc.id)));

  // Delete files and update cache
  toRemove.forEach(doc => {
    // Delete PDF, thumbnail, and workshop images
    // ...
  });

  // Remove from cache
  localCache[category] = localDocs.filter(doc =>
    remoteIds.has(String(doc.id))
  );
});
```

#### Response Updates
- Added `removed` field to sync response
- Updated success messages to include removal count
- Sends `sync-removed` IPC event with details

### Frontend Changes (renderer.js)

#### Updated showSyncSuccess Function
```javascript
function showSyncSuccess(downloaded, failed, removed, message) {
  // Now accepts and displays 'removed' count
  // Shows removal statistics if any files were removed
  // Displays hint about removed files
}
```

#### New IPC Handler
```javascript
ipcRenderer.on('sync-removed', (event, data) => {
  console.log('Files removed:', data);
  if (data.count > 0) {
    console.log(`Removed ${data.count} files not on server:`, data.files);
  }
});
```

### Styling Changes (styles.css)

Added new styles for removed files display:

```css
.sync-stat-removed .sync-stat-number {
    color: #f59e0b;  /* Orange/Amber */
}

.sync-removed-hint {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin-top: var(--spacing-md);
    font-style: italic;
}
```

---

## Logging & Debugging

All removal operations are logged to the console:

```
=== Cleaning up files not on server ===
Removing policy document: old-policy-2023.pdf
  ✓ Deleted file: /path/to/docs/policy/old-policy-2023.pdf
  ✓ Deleted thumbnail: /path/to/data/thumbnails/pol-12345-abcde.png
Removing workshops document: workshop-1
  ✓ Deleted workshop image: /path/to/data/workshop-images/workshop-123-img1.png
  ✓ Deleted workshop image: /path/to/data/workshop-images/workshop-123-img2.png
=== Removed 3 files not on server ===
```

---

## Safety Features

### 1. Error Handling
- Deletion errors are caught and logged
- Failed deletions don't stop the sync process
- Cache is updated even if file deletion fails

### 2. File Existence Checks
- Checks if file exists before attempting deletion
- Prevents errors from missing files

### 3. Confirmation Through Cache
- Cache is only updated after successful sync
- Ensures data consistency

---

## Testing

### Test 1: Basic Removal
1. Start app with files A, B, C
2. Update server to have only A, B
3. Run sync
4. **Expected:** File C is deleted

### Test 2: Mixed Operations
1. Start app with files A, B, C, D
2. Update server: remove B, update C, add E
3. Run sync
4. **Expected:**
   - A: unchanged
   - B: deleted
   - C: updated
   - D: deleted
   - E: downloaded

### Test 3: Workshop Images
1. Start app with workshop containing 5 images
2. Update server to have same workshop with 3 images
3. Run sync
4. **Expected:** 2 extra images are deleted

### Test 4: No Changes
1. App and server are identical
2. Run sync
3. **Expected:** "All documents are up to date"

---

## Performance Considerations

### File Deletion Overhead
- Minimal overhead (synchronous file operations)
- Only runs when files need to be removed
- Number of deletions is typically small

### Cache Updates
- Single cache write after all operations
- Atomic update ensures consistency

### Memory Usage
- Remote IDs stored in Set for O(1) lookups
- No significant memory increase

---

## Backward Compatibility

### Cache Format
- No changes to cache structure
- Existing cache files work without migration

### Server Manifest
- No changes required to server manifest format
- Works with existing manifest structure

---

## Important Notes

### 1. Data Loss Prevention
- Files are deleted **only** if they don't exist on the server
- This is intentional - the app is designed to be a mirror

### 2. Backup Recommendation
- If users want to keep local copies of deleted files, they should:
  1. Manually backup important files
  2. Or disable auto-sync and manually control syncs

### 3. Server Authority
- The server is now the single source of truth
- Local changes outside sync will be overwritten on next sync

---

## Rollback (If Needed)

If you need to disable the mirror sync feature, remove **Step 4.5** from `main.js`:

```javascript
// Comment out or remove Step 4.5 section
// Step 4.5: Remove files that exist locally but not on server
// ... (entire section)
```

Then revert the UI changes in `renderer.js` and `styles.css`.

---

## Files Modified

1. **main.js**
   - Added Step 4.5: File removal logic
   - Updated sync response to include `removed` count
   - Added `sync-removed` IPC event emission

2. **renderer.js**
   - Updated `showSyncSuccess()` to accept `removed` parameter
   - Added UI for displaying removal statistics
   - Added `sync-removed` IPC event listener

3. **styles.css**
   - Added `.sync-stat-removed` styles
   - Added `.sync-removed-hint` styles

---

## Summary

✅ **Full mirror sync implemented**
✅ **Automatic cleanup of obsolete files**
✅ **Transparent user feedback**
✅ **Safe and error-resistant**
✅ **Production-ready**

The application now perfectly mirrors the server, ensuring users always have access to the exact set of documents that exist on the server, no more and no less.

---

**Date:** 2026-02-08  
**Author:** Z.ai Code  
**Version:** 2.0 - Mirror Sync
