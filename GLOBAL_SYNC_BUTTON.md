# Global Sync Button Feature

## Overview
Added a single global sync button in the navbar that triggers server synchronization without leaving the current page. The sync process is displayed in a clean modal popup with no progress bars or detailed status.

---

## What Changed

### Before
- Each page (Policy, Templates, Deliverables, Workshops) had its own refresh button
- Sync would show inline progress bars and status on the page
- User stayed on the same page but UI was cluttered with sync controls

### After
- **Single sync button in the navbar** (right side, separated by a divider)
- Clicking shows a **simple modal popup** with:
  - Spinning icon while syncing
  - Success/error icon when complete
  - Simple message
  - Statistics (downloaded/removed counts)
  - Close button
- User stays on the current page throughout the sync
- No progress bars or detailed file-by-file status

---

## UI Changes

### Navbar

Added global sync button at the end of the navigation menu:

```
[Home] [About NDA] [GCF ▼] [Readiness Eritrea ▼] [Partners] | [⟳ Sync]
```

**Features:**
- Separated from navigation items by a vertical divider
- Subtle background and border to distinguish it
- Slight scale animation on hover
- Same height as other nav items
- Sync icon (refresh/rotate arrow)

### Sync Modal

A centered modal popup that appears when sync is triggered:

#### While Syncing
```
┌─────────────────────────────┐
│         [ ⟳ ]              │
│                             │
│        Syncing...          │
│   Please wait while we     │
│   sync with the server.    │
└─────────────────────────────┘
```

- Spinning refresh icon
- "Syncing..." title
- Simple message
- No close button (until complete)

#### On Success (with changes)
```
┌─────────────────────────────┐
│         [ ✓ ]              │
│                             │
│      Sync Complete!        │
│  Successfully synced       │
│  documents with the        │
│  server.                   │
│                             │
│  ┌─────────────────────┐   │
│  │ 5 downloaded,       │   │
│  │ 2 removed           │   │
│  └─────────────────────┘   │
│                             │
│        [ Close ]           │
└─────────────────────────────┘
```

- Green checkmark icon
- "Sync Complete!" title
- Success message
- Statistics box showing downloaded/removed counts
- Close button appears

#### On Success (up to date)
```
┌─────────────────────────────┐
│         [ ✓ ]              │
│                             │
│       Up to Date           │
│  All documents are already │
│  up to date with the       │
│  server.                   │
│                             │
│  ┌─────────────────────┐   │
│  │ 0 downloaded,       │   │
│  │ 0 removed           │   │
│  └─────────────────────┘   │
│                             │
│        [ Close ]           │
└─────────────────────────────┘
```

- Green checkmark icon
- "Up to Date" title
- Message explaining no changes needed
- Shows 0 downloaded, 0 removed
- Close button appears

#### On Error
```
┌─────────────────────────────┐
│         [ ✗ ]              │
│                             │
│       Sync Failed          │
│  Failed to sync with the   │
│  server. Please try again. │
│                             │
│        [ Close ]           │
└─────────────────────────────┘
```

- Red X icon
- "Sync Failed" title
- Error message
- No statistics shown
- Close button appears

---

## Technical Implementation

### 1. HTML Changes

#### Navbar Button
```html
<!-- Global Sync Button -->
<div class="nav-separator"></div>
<button id="global-sync-btn" class="nav-item nav-sync-btn">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21.5 2v6h-6M21.34 5.5A10 10 0 1 1 11.26 2.25"></path>
    </svg>
    <span>Sync</span>
</button>
```

#### Sync Modal
```html
<div id="sync-modal" class="sync-modal">
    <div class="sync-modal-content">
        <div class="sync-modal-icon" id="sync-modal-icon">
            <!-- Three icons: syncing, success, error -->
        </div>
        <h3 id="sync-modal-title">Syncing...</h3>
        <p id="sync-modal-message">...</p>
        <div id="sync-modal-stats" class="sync-modal-stats">
            <span id="sync-modal-downloaded">0</span> downloaded,
            <span id="sync-modal-removed">0</span> removed
        </div>
        <button id="sync-modal-close" class="btn btn-primary" onclick="closeSyncModal()">Close</button>
    </div>
</div>
```

### 2. CSS Changes

#### Navbar Separator
```css
.nav-separator {
    width: 1px;
    background: rgba(255, 255, 255, 0.2);
    margin: 0 var(--spacing-md);
}
```

#### Sync Button Styling
```css
.nav-sync-btn {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-bg-white);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-sync-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
}
```

#### Modal Styling
```css
.sync-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 1000;
    justify-content: center;
    align-items: center;
    animation: fadeIn 0.2s ease;
}

.sync-modal.active {
    display: flex;
}

.sync-modal-content {
    background: var(--color-bg-white);
    padding: var(--spacing-2xl);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    text-align: center;
    max-width: 400px;
    width: 90%;
    animation: slideUp 0.3s ease;
}
```

#### Icon States
```css
.sync-modal-icon.syncing { background: var(--color-bg-secondary); }
.sync-modal-icon.success { background: #dcfce7; }
.sync-modal-icon.success svg { color: #16a34a; }
.sync-modal-icon.error { background: #fee2e2; }
.sync-modal-icon.error svg { color: #dc2626; }
```

#### Spinning Animation
```css
.sync-spinner {
    width: 40px;
    height: 40px;
    color: var(--color-primary);
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

### 3. JavaScript Changes (renderer.js)

#### Global State
```javascript
let globalSyncInProgress = false;
```

#### Show Modal Function
```javascript
function showSyncModal() {
  // Reset to syncing state
  // Show spinner icon
  // Hide success/error icons
  // Hide stats and close button
  // Add 'active' class to modal
}
```

#### Update Success Function
```javascript
function updateSyncModalSuccess(downloaded, removed, failed) {
  // Show success or error icon based on failed count
  // Update title and message
  // Update statistics
  // Show stats and close button
}
```

#### Update Error Function
```javascript
function updateSyncModalError(errorMessage) {
  // Show error icon
  // Update title and message
  // Hide stats
  // Show close button
}
```

#### Close Modal Function
```javascript
function closeSyncModal() {
  // Remove 'active' class from modal
  // Refresh current page content if on a document page
}
```

#### Trigger Sync Function
```javascript
async function triggerGlobalSync() {
  if (globalSyncInProgress) return;

  showSyncModal();

  try {
    const result = await ipcRenderer.invoke('sync-remote-documents');

    if (result.success) {
      // Reload cache
      // Update modal with success
    } else {
      updateSyncModalError(result.message);
    }
  } catch (error) {
    updateSyncModalError(error.message);
  }
}
```

#### Event Listener
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const globalSyncBtn = document.getElementById('global-sync-btn');
  if (globalSyncBtn) {
    globalSyncBtn.addEventListener('click', triggerGlobalSync);
  }
});
```

---

## User Experience

### Flow

1. **User clicks "Sync" button** in navbar
2. **Modal appears** with spinning icon and "Syncing..." message
3. **Sync runs** in background (no visible progress)
4. **When complete:**
   - Icon changes to ✓ or ✗
   - Title and message update
   - Statistics appear (if applicable)
   - Close button appears
5. **User clicks "Close"**
6. **Modal disappears**
7. **Current page refreshes** to show updated content (if on a document page)

### Key UX Decisions

1. **No progress bar** - User doesn't need to see file-by-file progress
2. **Simple messages** - Clear, concise status updates
3. **Stay on current page** - No navigation disruption
4. **Statistics only on completion** - Shows results, not progress
5. **Close button only when done** - Prevents premature dismissal
6. **Automatic refresh on close** - Ensures content is up to date

---

## Icon System

The modal uses three different icons:

### 1. Syncing Icon (Spinner)
- Animated rotating arrow
- Green color (primary theme)
- Spins continuously while syncing

### 2. Success Icon (Checkmark)
- Checkmark in circle
- Green color (#16a34a)
- Shown when sync completes without errors

### 3. Error Icon (X)
- X in circle
- Red color (#dc2626)
- Shown when sync fails

All icons are SVG and scale properly.

---

## Colors and States

### Syncing State
- Icon background: Light gray (`var(--color-bg-secondary)`)
- Icon color: Primary green
- Title: "Syncing..."
- Message: "Please wait while we sync with the server."

### Success State
- Icon background: Light green (`#dcfce7`)
- Icon color: Green (`#16a34a`)
- Title: "Sync Complete!" or "Up to Date"
- Message: Varies based on results
- Stats: Green numbers

### Error State
- Icon background: Light red (`#fee2e2`)
- Icon color: Red (`#dc2626`)
- Title: "Sync Failed"
- Message: Error details
- No stats shown

---

## Messages

### Syncing
- "Syncing..."
- "Please wait while we sync with the server."

### Success (with changes)
- "Sync Complete!"
- "Successfully synced documents with the server."
- "Successfully downloaded new documents."
- "Removed outdated documents."

### Success (no changes)
- "Up to Date"
- "All documents are already up to date with the server."

### Success (with errors)
- "Sync Complete (with errors)"
- "X file(s) failed to sync. Click refresh to try again."

### Error
- "Sync Failed"
- "Failed to sync with the server. Please try again."
- "An unexpected error occurred"

---

## Responsive Design

The modal is fully responsive:

- **Desktop:** 400px max-width, centered
- **Mobile/Tablet:** 90% width, centered
- **Padding:** Scales with spacing variables
- **Icons:** Fixed size for consistency
- **Text:** Wraps properly on small screens

---

## Accessibility

### Keyboard Navigation
- Sync button is keyboard accessible
- Close button is keyboard accessible
- Modal can be dismissed with Escape key (future enhancement)

### Screen Reader Support
- Clear titles and messages
- Icon states are indicated by text
- Statistics are read as text

### Visual Feedback
- High contrast colors for icons
- Clear visual distinction between states
- Animation for syncing state

---

## Files Modified

1. **index.html**
   - Added global sync button in navbar
   - Added sync modal HTML structure
   - Added three icons (syncing, success, error)

2. **styles.css**
   - Added `.nav-separator` styles
   - Added `.nav-sync-btn` styles
   - Added `.sync-modal` and all modal component styles
   - Added animation keyframes
   - Added icon state styles

3. **renderer.js**
   - Added global sync state variable
   - Added `showSyncModal()` function
   - Added `updateSyncModalSuccess()` function
   - Added `updateSyncModalError()` function
   - Added `closeSyncModal()` function
   - Added `triggerGlobalSync()` function
   - Added event listener for global sync button

---

## Future Enhancements

### Possible Improvements
1. **Keyboard dismiss** - Allow closing modal with Escape key
2. **Click outside to close** - Dismiss modal by clicking backdrop (when done)
3. **Last sync time** - Show "Last synced: X minutes ago" in button tooltip
4. **Auto-hide success** - Option to auto-close success modal after delay
5. **Sync in background** - Allow navigation away from current page during sync
6. **Sync history** - Keep track of recent sync results

### Not Implemented (by design)
- Progress bars - Too much detail for simple sync
- File-by-file status - Unnecessary for this use case
- Cancel button - Sync is typically quick enough to not need cancellation
- Multiple sync modes - Only one sync mode needed

---

## Testing

### Test Cases

1. **Basic Sync**
   - Click sync button
   - Verify modal appears
   - Wait for completion
   - Verify success state
   - Click close
   - Verify page refreshes

2. **Up to Date**
   - Run sync when already up to date
   - Verify "Up to Date" message
   - Verify 0 downloaded, 0 removed

3. **With Downloads**
   - Add files to server
   - Run sync
   - Verify correct download count
   - Verify files appear on page

4. **With Removals**
   - Remove files from server
   - Run sync
   - Verify correct removal count
   - Verify files removed from page

5. **Error Handling**
   - Stop server
   - Run sync
   - Verify error message
   - Verify error icon

6. **Button State**
   - Try clicking sync while syncing
   - Verify button doesn't trigger another sync
   - Verify only one modal appears

7. **Page Refresh**
   - Start on Policy page
   - Run sync
   - Close modal
   - Verify Policy page refreshes

8. **Responsive**
   - Test on mobile view
   - Verify modal fits screen
   - Verify text wraps properly

---

## Summary

✅ **Single sync button in navbar**
✅ **Clean modal popup for sync status**
✅ **No progress bars or detailed status**
✅ **User stays on current page**
✅ **Clear success/error feedback**
✅ **Shows downloaded/removed statistics**
✅ **Fully responsive**
✅ **Accessible keyboard navigation**
✅ **Smooth animations**

The global sync button provides a simple, elegant way to sync with the server without cluttering the UI with multiple refresh buttons or complex progress indicators. Users can sync from anywhere in the app and stay on their current page.

---

**Date:** 2026-02-08
**Author:** Z.ai Code
**Version:** 1.0 - Global Sync Button
