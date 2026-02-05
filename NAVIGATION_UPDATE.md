# Navigation Structure Update

## Overview
Completely restructured the navigation to better organize content with dropdown menus and dedicated pages for each document category.

## New Navigation Structure

### Top-Level Menu Items
1. **Home** - Landing page with hero, mission, and focus areas
2. **About NDA** - Information about the National Designated Authority
3. **GCF** (Dropdown) - Green Climate Fund resources
   - Policy
   - Project Readiness
   - Templates
4. **Readiness Eritrea** (Dropdown) - Eritrea-specific content
   - Deliverables
   - Workshops
5. **Coordination & Partners** - Partnership information

## Pages and Document Categories

### 1. Home (`/home`)
- Hero section with statistics
- Mission cards
- Focus areas grid
- No documents displayed

### 2. About NDA (`/about`)
- Who We Are
- Our Role
- The Readiness Program
- Our Partners
- No documents displayed

### 3. Policy (`/policy`) ← Shows `policy` category docs
- **Document Category:** `policy`
- GCF Policy & Regulation Documents
- Search functionality
- Refresh button for sync

### 4. Project Readiness (`/project-readiness`) ← Shows `project-readiness` category docs
- **Document Category:** `project-readiness`
- GCF Project Readiness Documents
- Search functionality
- Refresh button for sync

### 5. Templates (`/templates`) ← Shows `templates` category docs
- **Document Category:** `templates`
- GCF Document Templates
- Search functionality
- Refresh button for sync

### 6. Deliverables (`/deliverables`) ← Shows `deliverable` category docs
- **Document Category:** `deliverable`
- Readiness Eritrea Project Deliverables
- Search functionality
- Refresh button for sync

### 7. Workshops (`/workshops`)
- Capacity Building Workshops and Training
- Workshop cards with:
  - Eritrea GCF Capacity Building Workshop (October 2025)
  - In-Person Training Sessions (August 2025)
- Training modules overview
- **No documents displayed** (static content)

### 8. Coordination & Partners (`/partners`)
- Coordination Framework
  - Government Ministries
  - Civil Society
  - International Partners
  - Private Sector
- Key Partners
  - Green Climate Fund (GCF)
  - United Nations Development Programme (UNDP)
  - Ministry of Land, Water and Environment (MLWE)
- Contact Information
- **No documents displayed** (static content)

## Navigation Features

### Dropdown Menus
- **GCF Dropdown:**
  - Icon: Document icon
  - Items: Policy, Project Readiness, Templates
  - Arrow rotates on open/close

- **Readiness Eritrea Dropdown:**
  - Icon: Layers icon
  - Items: Deliverables, Workshops
  - Arrow rotates on open/close

### Behavior
- Click dropdown trigger to open menu
- Click outside to close all dropdowns
- Dropdown items highlight on hover
- Active page is highlighted in navigation
- Smooth animations for dropdown open/close

### Active States
- Regular nav items: `.nav-item.active` shows gold background
- Dropdown triggers: Highlighted when any child is active
- Dropdown items: `.dropdown-item.active` shows active styling

## Document Loading Logic

### Page-to-Category Mapping
```javascript
const PAGE_CATEGORY_MAP = {
  'policy': 'policy',
  'project-readiness': 'project-readiness',
  'templates': 'templates',
  'deliverables': 'deliverable'
};
```

### Auto-Load on Navigation
When user navigates to a document page:
1. Check if page has a mapped category
2. Load documents for that category from cache
3. Filter and display only that category's documents
4. Search works within that category only

### Sync Behavior
- Sync is per-page (synchronizes all categories in background)
- After sync, only current page's documents are displayed
- Refresh button triggers sync
- Progress messages appear in current page's document container

## Files Modified

### 1. index.html
- Replaced old navigation with new dropdown structure
- Removed old "Resources" and "Contact" pages
- Added new pages:
  - Policy
  - Project Readiness
  - Templates
  - Deliverables
  - Workshops
  - Coordination & Partners
- Each document page has:
  - Page header with title and subtitle
  - Search input (no category filter - it's page-specific)
  - Refresh button
  - Documents container

### 2. renderer.js
- Added dropdown navigation logic
- Implemented `PAGE_CATEGORY_MAP` for page-to-category routing
- Updated `loadDocumentsForPage()` to load specific category per page
- Updated search to work within current page's documents
- Added event listeners for dropdown interactions
- Fixed typo in empty state SVG (`</lineline>` → `</polyline>`)

### 3. styles.css
- Added dropdown navigation styles:
  - `.nav-dropdown`
  - `.dropdown-trigger`
  - `.dropdown-menu`
  - `.dropdown-item`
  - `.dropdown-arrow` (with rotation animation)
- Added workshops page styles:
  - `.workshops-content`
  - `.workshop-card`
  - `.workshop-header`
  - `.workshop-body`
  - `.workshop-highlights`
  - `.workshop-modules`
  - `.modules-grid`
- Added partners page styles:
  - `.partners-content`
  - `.partners-section`
  - `.coordination-grid`
  - `.coordination-card`
  - `.partners-list`
  - `.partner-item`
  - `.partner-logo`
- Updated responsive styles for new layouts
- Footer styles adapted for main content

## Category Filter Removal

**Before:** Single Resources page with category dropdown filter
**After:** Separate pages for each category, no filter needed

### Benefits:
- Clearer navigation structure
- Dedicated URLs for each category
- Better UX (one click vs. select from dropdown)
- Easier to share specific category links

## Search Functionality

### Behavior
- Search is scoped to current page's documents only
- No category filter needed (page defines category)
- Debounced (300ms) for performance

### Example:
- On "Policy" page → Searches only `policy` documents
- On "Deliverables" page → Searches only `deliverable` documents

## Styling Consistency

### Color Coding
Documents maintain their category-specific colors:
- Policy: #0d4a2e (dark green)
- Project Readiness: #156642 (green)
- Templates: #c9a227 (gold)
- Deliverables: #dbb84a (light gold)

These colors appear on:
- Category badges on document cards
- Active navigation highlighting
- Page accents and borders

## Responsive Design

### Desktop (>1024px)
- Full navigation menu
- Dropdowns work on hover/click
- Multi-column grids

### Tablet (768px-1024px)
- Navigation adapts
- Grids adjust to 2 columns
- Dropdowns remain functional

### Mobile (<768px)
- Navigation wraps
- Dropdowns full width
- Single column grids
- Stacked layouts for cards

## Testing Checklist

- [ ] Home page displays correctly
- [ ] About NDA page displays correctly
- [ ] GCF dropdown opens and closes properly
- [ ] Readiness Eritrea dropdown opens and closes properly
- [ ] Policy page shows only policy documents
- [ ] Project Readiness page shows only project-readiness documents
- [ ] Templates page shows only templates documents
- [ ] Deliverables page shows only deliverable documents
- [ ] Workshops page displays static content correctly
- [ ] Partners page displays static content correctly
- [ ] Search works on each document page
- [ ] Refresh sync works on each document page
- [ ] Dropdown items highlight current page
- [ ] Navigation active states work correctly
- [ ] Responsive design works on mobile/tablet

## Migration Notes

### No Data Migration Needed
- Document categories remain the same
- Cache structure unchanged
- All existing documents will display correctly

### User Impact
- Users will see new navigation structure
- Same documents, better organized
- Each category has its own dedicated page
- More intuitive content discovery

## URL Structure

Pages are identified by `data-page` attributes:
- `home`
- `about`
- `policy`
- `project-readiness`
- `templates`
- `deliverables`
- `workshops`
- `partners`

Future enhancement: Could map to actual URLs for browser history support.

## Next Steps

1. Test all navigation paths
2. Verify document display on each page
3. Test dropdown menus on different screen sizes
4. Verify search functionality
5. Test sync behavior on each page
6. Check responsive behavior
7. Deploy to users

## Summary

The new navigation structure provides:
✅ Better content organization
✅ Clearer information hierarchy
✅ Dedicated pages for each document category
✅ Intuitive dropdown menus
✅ Improved user experience
✅ Maintained functionality (sync, search, thumbnails)
✅ Responsive design
✅ Consistent styling
