# Application Update - New Category Structure

## Overview
Updated the NDA application to support the new 4-category structure from the production server, replacing the old 2-category system (gcf, policy) with the new structure (policy, project-readiness, templates, deliverable).

## Changes Made

### 1. main.js - Backend (Electron Main Process)

#### Server Configuration
- **Changed server URL** from `http://localhost:3000` to `http://192.168.2.120`
- Manifest endpoint remains: `/docs/manifest.json`

#### Categories
- Removed: `gcf`
- Added: `project-readiness`, `templates`, `deliverable`
- Kept: `policy`
- Total: 4 categories

#### Directory Structure
New local folders created under `docs/`:
- `docs/policy/`
- `docs/project-readiness/`
- `docs/templates/`
- `docs/deliverable/`

New thumbnail storage:
- `data/thumbnails/` - Stores downloaded thumbnail images

#### Key Functions Updated

**fetchManifest()**
- Now validates all 4 categories in the manifest
- Checks for arrays in: `policy`, `project-readiness`, `templates`, `deliverable`

**compareFiles()**
- Updated to handle all 4 categories
- Uses `id` field instead of filename for comparison
- Downloads thumbnails alongside PDFs

**downloadFile()**
- No major changes, but now works with new category structure

**downloadThumbnail()** (NEW)
- Downloads thumbnail images from server
- Saves to `data/thumbnails/`
- Fails gracefully if thumbnail unavailable

**updateCacheWithFile()**
- Stores new metadata fields:
  - `id` - Unique identifier from manifest
  - `title` - Uses `displayName` from manifest
  - `description` - Full description from manifest
  - `thumbnail` - Thumbnail filename (if available)
  - `remoteModified` - Server's modified timestamp
  - `syncStatus` - Track sync success/failure

**IPC Handlers**
- `get-cached-documents` - Returns structure for all 4 categories
- `get-thumbnail` (NEW) - Returns thumbnail as base64 data URL
- `sync-remote-documents` - Updated for new categories

### 2. renderer.js - Frontend

#### Constants
- Added `CATEGORIES` array with all 4 categories
- Added `CATEGORY_INFO` object with display names and colors:
  - `policy`: "Policy & Regulation" (#0d4a2e)
  - `project-readiness`: "Project Readiness" (#156642)
  - `templates`: "Templates" (#c9a227)
  - `deliverable`: "Deliverables" (#dbb84a)

#### Functions Updated

**loadDocuments()**
- Initializes all 4 categories if missing from cache
- Counts total documents across all categories

**filterDocuments()**
- Filters by any of the 4 categories
- Searches through titles and descriptions

**renderDocumentCard()** (MAJOR UPDATE)
- Now async to support thumbnail loading
- Displays thumbnail image at top of card (if available)
- Uses category-specific colors from `CATEGORY_INFO`
- Shows `displayName` instead of generated title
- Shows full `description` from manifest
- Falls back gracefully if thumbnail missing

**renderDocuments()**
- Updated to handle async `renderDocumentCard()`

#### New IPC Handler
- `get-thumbnail` - Fetches thumbnail as base64 data URL

### 3. index.html - UI Structure

#### Category Filter Dropdown
Updated options from:
```html
<option value="all">All Documents</option>
<option value="gcf">GCF Documents</option>
<option value="policy">Policy & Regulation</option>
```

To:
```html
<option value="all">All Documents</option>
<option value="policy">Policy & Regulation</option>
<option value="project-readiness">Project Readiness</option>
<option value="templates">Templates</option>
<option value="deliverable">Deliverables</option>
```

#### Page Subtitle
Changed from:
"Access GCF and Policy & Regulation documents"

To:
"Access Policy, Project Readiness, Templates, and Deliverable documents"

### 4. styles.css - Styling

#### New Styles Added

**.document-thumbnail**
- Width: 100%
- Height: 200px
- Background color
- Centered content
- Overflow hidden
- Bottom border

**.document-thumbnail img**
- 100% width and height
- Object-fit: cover
- Object-position: top

These styles create a 200px tall thumbnail area at the top of each document card.

## Manifest Structure

The app now expects this manifest structure:

```json
{
  "policy": [
    {
      "id": "pol-xxxxx",
      "name": "filename.pdf",
      "displayName": "Human Readable Title",
      "size": 123456,
      "modified": "2026-02-05T09:44:37.458Z",
      "category": "policy",
      "description": "Full document description...",
      "thumbnail": "/thumbnails/pol-xxxxx.png"
    }
  ],
  "project-readiness": [...],
  "templates": [...],
  "deliverable": [...],
  "lastUpdated": "2026-02-05T09:53:44.081Z"
}
```

## Cache Structure

New cache format in `data/cache.json`:

```json
{
  "policy": [
    {
      "id": "pol-xxxxx",
      "title": "Human Readable Title",
      "description": "Full document description...",
      "file": "policy/filename.pdf",
      "size": "120.5 KB",
      "date": "2026-02-05",
      "remoteModified": "2026-02-05T09:44:37.458Z",
      "thumbnail": "pol-xxxxx.png",
      "syncStatus": "success"
    }
  ],
  "project-readiness": [],
  "templates": [],
  "deliverable": [],
  "lastSync": "2026-02-05T10:00:00.000Z"
}
```

## Breaking Changes

⚠️ **No backward compatibility** - The cache format has changed completely. Old cache files will be ignored.

## File Download URLs

Files are downloaded from:
- PDFs: `http://192.168.2.120/docs/{category}/{filename}`
- Thumbnails: `http://192.168.2.120{thumbnail_path}`

## Testing Checklist

- [ ] Verify all 4 categories appear in filter dropdown
- [ ] Test syncing from new server (192.168.2.120)
- [ ] Verify PDFs download to correct folders
- [ ] Verify thumbnails download and display
- [ ] Test search functionality across all categories
- [ ] Test category filtering
- [ ] Verify document cards show correct metadata
- [ ] Test opening PDFs
- [ ] Verify error handling for missing thumbnails
- [ ] Verify sync retry logic for failed downloads

## Migration Notes

If you have an old version of the app:
1. Clear/delete `data/cache.json` to force fresh sync
2. Old `docs/gcf/` folder can be deleted (no longer used)
3. Thumbnails will be automatically downloaded on first sync
4. All PDFs will be re-downloaded based on manifest

## Server Requirements

Ensure your server at `http://192.168.2.120` has:
- `/docs/manifest.json` with all 4 categories
- PDF files in: `/docs/policy/`, `/docs/project-readiness/`, `/docs/templates/`, `/docs/deliverable/`
- Thumbnails in: `/thumbnails/` (optional but recommended)
- Proper CORS headers if needed
- All `modified` timestamps in ISO 8601 format

## Next Steps

1. Update server manifest to use new category structure
2. Move PDFs to appropriate category folders
3. Generate/update thumbnails
4. Test the application with the new server
5. Deploy updated application to users
