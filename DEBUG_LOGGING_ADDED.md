# Debug Logging Added

## Purpose
Added comprehensive logging to track navigation, page states, and sync operations to diagnose the "blank page" issue.

## What Was Logged

### 1. Navigation Logging (`navigateToPage`)
```
=== NAVIGATION START ===
Navigating to: [pageName]
Current page before navigation: [currentPage]
Updating page visibility...
Page [pageId]: [shown/hidden] → [shown/hidden]
...
Current page after navigation: [currentPage]
=== NAVIGATION END ===
```

Shows:
- Which page is being navigated to
- What the current page was before navigation
- Which pages are shown/hidden
- What the current page is after navigation

### 2. Document Loading Logging (`loadDocumentsForPage`)
```
=== loadDocumentsForPage START ===
Page name: [pageName]
Category: [category]
```

Shows:
- The page being loaded
- The corresponding category
- If category exists in PAGE_CATEGORY_MAP

### 3. UI State Logging (`showLoading`, `showError`)
```
showLoading() called for: #page-[currentPage] #documents-container
  Container found: true/false
  Loading state set
```

Shows:
- Which container is being targeted
- If the container exists in DOM
- When the loading state is set

### 4. Render Logging (`renderDocuments`)
```
=== renderDocuments START ===
Current page: [currentPage]
Filtered documents count: [number]
Container selector: #page-[currentPage] #documents-container
Container found: true/false
Rendering document cards...
Documents rendered successfully
=== renderDocuments END ===
```

Shows:
- Current page during render
- Number of documents to render
- Container selector being used
- If container was found
- When rendering completes

### 5. Modal Logging (`showSyncModal`, `closeSyncModal`)
```
=== closeSyncModal START ===
Current page when closing modal: [currentPage]
PAGE_CATEGORY_MAP[currentPage]: [category]
Modal hidden
Refreshing documents page for category: [category]
=== closeSyncModal END ===
```

Shows:
- What page is active when modal closes
- If the page maps to a category
- What refresh action is taken

### 6. Sync Trigger Logging (`triggerGlobalSync`)
```
=== triggerGlobalSync START ===
Global sync in progress: true/false
Current page when sync triggered: [currentPage]
Showing sync modal...
Calling sync-remote-documents IPC...
Sync result: {...}
Sync successful, reloading cache...
Cache reloaded
Updating modal with success state...
=== triggerGlobalSync END ===
```

Shows:
- If a sync is already running
- What page user was on when they clicked sync
- Sync process steps
- Final result

### 7. Initialization Logging (`DOMContentLoaded`)
```
=== DOMContentLoaded ===
Renderer process started
Initial current page: [currentPage]
Navigation initialized
Global sync button initialized
All pages in DOM:
  - page-home (active: true)
  - page-about (active: false)
  - page-policy (active: false)
  ...
=== Initialization Complete ===
```

Shows:
- All pages that exist in the DOM
- Which page is initially active
- When initialization completes

## How to Use the Logs

### Step 1: Open Developer Console
1. Open the app
2. Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
3. Go to the **Console** tab

### Step 2: Clear Console
Click the clear button (🚫) to clean up previous logs

### Step 3: Trigger the Issue
1. Navigate to a page (e.g., Policy)
2. Click the Sync button in navbar
3. Wait for sync to complete
4. Click Close on the modal
5. Observe if page goes blank

### Step 4: Analyze the Logs

Look for these patterns:

#### Normal Flow:
```
=== DOMContentLoaded ===
Initial current page: home
...

=== NAVIGATION START ===
Navigating to: policy
Current page before navigation: home
...
Page page-policy: hidden → shown
Current page after navigation: policy
=== NAVIGATION END ===

=== loadDocumentsForPage START ===
Page name: policy
Category: policy
showLoading() called for: #page-policy #documents-container
  Container found: true
  Loading state set
...

=== renderDocuments START ===
Current page: policy
Filtered documents count: 5
Container found: true
Documents rendered successfully
=== renderDocuments END ===
```

#### Sync Flow:
```
=== triggerGlobalSync START ===
Current page when sync triggered: policy
Showing sync modal...
...

Sync result: { success: true, downloaded: 0, removed: 0, ... }

=== closeSyncModal START ===
Current page when closing modal: policy
PAGE_CATEGORY_MAP[currentPage]: policy
Refreshing documents page for category: policy

=== loadDocumentsForPage START ===
Page name: policy
...
```

#### Problem Flow (if blank page occurs):
```
=== closeSyncModal START ===
Current page when closing modal: policy
Refreshing documents page for category: policy

=== loadDocumentsForPage START ===
Page name: policy
Category: policy

showLoading() called for: #page-[WRONG PAGE] #documents-container
  Container not found!
```

Or:

```
=== renderDocuments START ===
Current page: [WRONG PAGE]
Container selector: #page-[WRONG PAGE] #documents-container
Container found: false
```

## What to Look For

### 1. Page Variable Issues
- Does `currentPage` match the actual visible page?
- Does `currentPage` change unexpectedly?

### 2. Container Issues
- Are containers being found?
- Is the selector correct?

### 3. Navigation Issues
- Are pages showing/hiding correctly?
- Is the wrong page becoming active?

### 4. Timing Issues
- Does the page change before the modal closes?
- Does the modal close before the page refreshes?

## Common Issues and What the Logs Will Show

### Issue 1: Wrong Page Being Refreshed
**Symptom:** You're on Policy but a different page refreshes

**Logs show:**
```
=== closeSyncModal START ===
Current page when closing modal: policy
Refreshing documents page for category: policy

=== renderDocuments START ===
Current page: about  ← WRONG!
```

### Issue 2: Container Not Found
**Symptom:** Blank page after sync

**Logs show:**
```
showLoading() called for: #page-policy #documents-container
  Container not found!
```

### Issue 3: Page Visibility Issue
**Symptom:** Blank page, wrong content showing

**Logs show:**
```
Page page-policy: hidden → shown
Page page-about: shown → shown  ← TWO pages shown!
```

## Files Modified

### renderer.js
Added logging to:
- `navigateToPage()` - Navigation tracking
- `loadDocumentsForPage()` - Document loading
- `showLoading()` (both versions) - UI state
- `showError()` - Error display
- `renderDocuments()` - Rendering process
- `closeSyncModal()` - Modal closing
- `triggerGlobalSync()` - Sync trigger
- `DOMContentLoaded` - Initialization

## Next Steps

After running the app with these logs:

1. **Reproduce the issue** - Navigate to a page, click sync, close modal
2. **Copy the console output** - All logs from when you click sync to when the page goes blank
3. **Share the logs** - This will show exactly where the issue occurs
4. **Identify the problem** - Based on the patterns above

## Summary

✅ **Comprehensive logging added** to track:
- Navigation changes
- Page states
- Container selection
- Rendering process
- Sync flow
- Modal interactions

✅ **Easy to diagnose** the blank page issue by:
- Seeing what page is active
- What containers are targeted
- If containers exist
- When things go wrong

The logs will make it clear exactly where the issue is occurring in the flow.

---

**Date:** 2026-02-08
**Author:** Z.ai Code
**Purpose:** Debug logging for blank page issue
