# Bug Fix: Categories Not Displaying

## Problem
After syncing, only the "policy" category documents were displayed, even though all 30 files from all 4 categories (policy, project-readiness, deliverable, templates) were successfully downloaded.

## Root Cause
The `updateCacheWithFile` function was rejecting files from categories that didn't exist in the cache object. When:
1. Loading an old cache with only `gcf` and `policy` categories
2. Loading a fresh/empty cache

The function would encounter a missing category array and log "Invalid category: project-readiness" or "Invalid category: deliverable", then return without adding the document to the cache.

## Error Messages in Logs
```
Invalid category: project-readiness
Invalid category: deliverable
```

These appeared after every successful download from those categories.

## Solution
Modified `updateCacheWithFile` function to automatically initialize missing category arrays instead of rejecting them.

### Changes Made

**File:** `main.js`

**Before:**
```javascript
function updateCacheWithFile(cache, fileInfo, downloadResult) {
  const categoryArray = cache[fileInfo.category];
  if (!categoryArray) {
    console.error('Invalid category:', fileInfo.category);
    return cache;  // ❌ Returns without adding the file
  }
  // ... rest of function
}
```

**After:**
```javascript
function updateCacheWithFile(cache, fileInfo, downloadResult) {
  // Initialize category array if it doesn't exist
  if (!cache[fileInfo.category]) {
    cache[fileInfo.category] = [];  // ✅ Creates the array
  }

  const categoryArray = cache[fileInfo.category];
  // ... rest of function
}
```

**Also fixed in:** The error handling section for failed downloads (same issue).

## Impact
- ✅ All categories are now properly saved to cache
- ✅ All documents from all categories display correctly
- ✅ Works with fresh installs (empty cache)
- ✅ Works with old cache migrations
- ✅ No more "Invalid category" errors

## Testing
After applying the fix:

1. **Clear cache:**
   ```bash
   rm -f data/cache.json
   ```

2. **Restart app and sync:**
   ```bash
   npm start
   # Navigate to Resources
   # Click Refresh
   ```

3. **Verify:**
   - All 30 files download successfully
   - No "Invalid category" errors in console
   - All 4 categories show documents
   - Category filter works correctly

## Expected Results After Fix

### Cache Structure (data/cache.json)
```json
{
  "policy": [10 documents],
  "project-readiness": [8 documents],
  "templates": [],
  "deliverable": [12 documents],
  "lastSync": "2026-02-05T..."
}
```

### Document Counts
- Policy: 10 documents
- Project Readiness: 8 documents
- Templates: 0 documents (empty on server)
- Deliverable: 12 documents
- **Total: 30 documents** ✓

## Files Modified
- `main.js` - 2 locations updated (success path and error path)

## Deployment
This fix is backward compatible and will work with:
- Fresh installations
- Existing installations with old cache
- Existing installations with new cache

No additional migration steps needed.
