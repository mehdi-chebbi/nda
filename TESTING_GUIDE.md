# Quick Testing Guide

## Pre-Testing Setup

### 1. Clear Old Cache
```bash
# Delete old cache to force fresh sync
rm -f /home/z/my-project/project/data/cache.json

# Optionally, remove old gcf folder
rm -rf /home/z/my-project/project/docs/gcf
```

### 2. Start the App
```bash
cd /home/z/my-project/project
npm install  # if not already installed
npm start
```

## Test Scenarios

### Test 1: Initial Sync (Fresh Install)
**Steps:**
1. Clear cache as above
2. Start the app
3. Navigate to Resources page
4. Click "Refresh" button

**Expected Results:**
- Shows "Syncing with server..." message
- Downloads files from all 4 categories
- Displays success message with count
- Documents appear in grid with thumbnails

**Verify:**
- Check `docs/policy/` contains PDFs
- Check `docs/project-readiness/` contains PDFs
- Check `docs/templates/` (if any files)
- Check `docs/deliverable/` contains PDFs
- Check `data/thumbnails/` contains images
- Check `data/cache.json` has new structure

---

### Test 2: Category Filtering
**Steps:**
1. On Resources page
2. Use category dropdown

**Test Each Category:**
- All Documents → Shows all files
- Policy & Regulation → Shows only policy files
- Project Readiness → Shows only project-readiness files
- Templates → Shows only templates (if any)
- Deliverables → Shows only deliverable files

**Verify:**
- Category badge shows correct name/color
- File count matches expectation

---

### Test 3: Search Functionality
**Steps:**
1. Type in search box
2. Try different terms

**Test Searches:**
- "policy" → Should find policy documents
- "module" → Should find training modules
- "gcf" → Should find GCF-related docs
- "framework" → Should find framework documents

**Verify:**
- Results include matching titles
- Results include matching descriptions
- Category filters still work with search

---

### Test 4: Document Cards
**Steps:**
1. View document cards in grid
2. Hover over cards

**Verify:**
- Thumbnail image displays at top (200px height)
- Category badge shows correct color
- Title matches `displayName` from manifest
- Description shows full text (clamped to 4 lines)
- File size and date displayed
- "Open PDF" button works

**Thumbnail Colors by Category:**
- Policy: #0d4a2e (dark green)
- Project Readiness: #156642 (green)
- Templates: #c9a227 (gold)
- Deliverables: #dbb84a (light gold)

---

### Test 5: Opening PDFs
**Steps:**
1. Click "Open PDF" on any document

**Expected Results:**
- PDF opens in system default viewer
- No error messages

---

### Test 6: Sync Progress
**Steps:**
1. Clear cache
2. Click Refresh
3. Watch progress indicators

**Verify:**
- Shows "Downloading file X of Y"
- Shows filename (using `displayName`)
- Shows progress bar with percentage
- Updates in real-time

---

### Test 7: Error Handling

#### Scenario A: Server Offline
**Steps:**
1. Stop your server
2. Click Refresh

**Expected:**
- Shows "Sync Failed" message
- Error explains the issue
- Can click "View Documents" to see cached files

#### Scenario B: Missing Thumbnail
**Steps:**
1. Manually delete a thumbnail from `data/thumbnails/`
2. Refresh the page

**Expected:**
- Document card still displays
- No thumbnail shown (graceful fallback)
- No error in UI

---

### Test 8: Incremental Sync
**Steps:**
1. Complete initial sync
2. Click Refresh again

**Expected:**
- Shows "All documents are up to date"
- No files downloaded

**Steps (with update):**
1. Add a new file to server
2. Update `manifest.json`
3. Click Refresh

**Expected:**
- Downloads only the new file
- Shows "Successfully synced 1 file"

---

### Test 9: Cache Structure
**Steps:**
1. After sync, check `data/cache.json`

**Verify Structure:**
```json
{
  "policy": [...],
  "project-readiness": [...],
  "templates": [...],
  "deliverable": [...],
  "lastSync": "ISO-8601-timestamp"
}
```

**Verify Document Entry:**
```json
{
  "id": "pol-xxxxx",
  "title": "Display Name",
  "description": "Full description",
  "file": "policy/filename.pdf",
  "size": "123.4 KB",
  "date": "2026-02-05",
  "remoteModified": "2026-02-05T09:44:37.458Z",
  "thumbnail": "pol-xxxxx.png",
  "syncStatus": "success"
}
```

---

### Test 10: Navigation
**Steps:**
1. Navigate between Home, Resources, About, Contact

**Verify:**
- Pages transition smoothly
- Active nav item highlighted
- Resources page loads documents correctly

---

## Console Logs (Debug Mode)

Open DevTools (Ctrl+Shift+I) and watch for:

### Successful Sync:
```
App starting...
Server URL: http://192.168.2.120
Manifest fetched successfully
Found X files to download
[1/X] Downloading: filename.pdf
Download successful: filename.pdf
Thumbnail downloaded successfully: xxx.png
=== Sync complete ===
Downloaded: X, Failed: 0, Total: X
```

### Error Cases:
```
Error fetching manifest: ...
Error downloading file: ...
```

---

## File Verification

### After Sync, Check:

**PDF Files:**
```bash
ls -lh docs/policy/
ls -lh docs/project-readiness/
ls -lh docs/templates/
ls -lh docs/deliverable/
```

**Thumbnails:**
```bash
ls -lh data/thumbnails/
```

**Cache:**
```bash
cat data/cache.json | jq '.'
```

---

## Performance Notes

- **Large PDFs**: May take time to download (check progress bar)
- **Many Thumbnails**: Initial sync may be slower
- **Search**: Instant filtering (client-side)
- **Cache Loading**: Near-instant after first sync

---

## Common Issues & Solutions

### Issue: "Sync Failed"
**Solution:**
1. Check server is running at 192.168.2.120
2. Verify manifest.json is accessible
3. Check network connectivity

### Issue: No thumbnails showing
**Solution:**
1. Check `data/thumbnails/` folder exists
2. Verify thumbnail URLs in manifest are correct
3. Check console for thumbnail download errors

### Issue: Wrong category colors
**Solution:**
1. Check `CATEGORY_INFO` in renderer.js
2. Verify category names match manifest

### Issue: Documents not showing after sync
**Solution:**
1. Check `data/cache.json` exists and is valid JSON
2. Verify PDFs are in correct folders
3. Check browser console for errors

---

## Success Criteria

✅ All 4 categories visible and functional
✅ Documents sync from new server
✅ Thumbnails download and display
✅ Search works across all categories
✅ Filtering works correctly
✅ PDFs open successfully
✅ Error handling works gracefully
✅ Cache structure is correct
✅ UI shows proper metadata
✅ Progress indicators work

---

## Production Deployment Checklist

- [ ] Test on Windows (if deploying to Windows)
- [ ] Test on macOS (if deploying to macOS)
- [ ] Verify server URL is correct for production
- [ ] Test with actual production manifest
- [ ] Verify thumbnail generation on server
- [ ] Test with large PDF files (>10MB)
- [ ] Test with many documents (>50)
- [ ] Verify offline behavior (cache only)
- [ ] Test app updates (migration from old version)
- [ ] Document user instructions
