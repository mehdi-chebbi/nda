// ===== Global State =====
let currentPage = 'home';
let allDocuments = {};
let filteredDocuments = [];
let isSyncing = false;
let currentWorkshop = null; // For workshop detail view
let currentImageIndex = 0; // For image carousel

// Define the categories
const CATEGORIES = ['policy', 'project-readiness', 'templates', 'deliverable', 'workshops'];

// Resources data for Project Readiness page
const RESOURCES_DATA = [
  {
    category: "Strategic Planning & Overview",
    links: [
      { title: "GCF in Brief: Readiness", url: "https://www.greenclimate.fund/document/gcf-brief-readiness" },
      { title: "Readiness Strategy 2024-2027", url: "https://www.greenclimate.fund/document/readiness-strategy-2024-2027" },
      { title: "Financing Modality for Country Support", url: "https://www.greenclimate.fund/readiness/country-window" },
      { title: "Readiness & Preparatory Financing Modality for DAE Support", url: "https://www.greenclimate.fund/readiness/dae-window" },
      { title: "Revised Readiness Results Management Framework (RRMF)", url: "https://www.greenclimate.fund/document/revised-readiness-results-management-framework-rrmf" },
      { title: "List of FWA holders", url: "https://www.greenclimate.fund/document/list-fwa-holders" },
    ]
  },
  {
    category: "Country Support Templates & Guides",
    links: [
      { title: "Guide for Countries to Access Readiness Support", url: "https://www.greenclimate.fund/document/guide-countries-access-readiness-support" },
      { title: "Guide for Countries on Strategic Planning of Readiness Support", url: "https://www.greenclimate.fund/document/guide-countries-strategic-planning-readiness-support" },
      { title: "Confirmation of Government Designated Agency Letter Template", url: "https://www.greenclimate.fund/document/confirmation-government-designated-agency-letter-template" },
      { title: "Country Readiness TOR Template", url: "https://www.greenclimate.fund/document/country-readiness-tor-template" },
      { title: "Direct Access Proposal Template - Country Support Window", url: "https://www.greenclimate.fund/document/direct-access-proposal-template-country-support-window" },
      { title: "Direct Access Financial Proposal Template", url: "https://www.greenclimate.fund/document/direct-access-financial-proposal-template" },
      { title: "Mini Tender Proposal Template", url: "https://www.greenclimate.fund/document/mini-tender-proposal-template" },
      { title: "Country Outcome Logframe", url: "https://www.greenclimate.fund/document/country-outcome-logframe" },
      { title: "Country and DAE Output Logframe", url: "https://www.greenclimate.fund/document/country-and-dae-output-logframe" },
      { title: "Letter of Financial Support for Multi-Country Proposals", url: "https://www.greenclimate.fund/document/letter-financial-support-multi-country-proposals" },
    ]
  },
  {
    category: "DAE (Direct Access Entity) Support",
    links: [
      { title: "Guide for Direct Access Entities to Access Readiness Support", url: "https://www.greenclimate.fund/document/guide-direct-access-entities-access-readiness-support" },
      { title: "DAE Readiness TOR Template", url: "https://www.greenclimate.fund/document/dae-readiness-tor-template" },
      { title: "Direct Access Proposal Template – DAE Support Window", url: "https://www.greenclimate.fund/document/direct-access-proposal-template-dae-support-window" },
    ]
  },
  {
    category: "Reporting, Audits & Compliance",
    links: [
      { title: "Readiness and Preparatory Support Completion Report Template", url: "https://www.greenclimate.fund/document/readiness-and-preparatory-support-completion-report-template" },
      { title: "Readiness Audit Terms of Reference Template", url: "https://www.greenclimate.fund/document/readiness-audit-terms-reference-template" },
      { title: "Readiness Audit Report Template", url: "https://www.greenclimate.fund/document/readiness-audit-report-template" },
      { title: "Letter of Request for Change of Approved Programme Proposal", url: "https://www.greenclimate.fund/document/letter-request-change-approved-readiness-and-preparatory-support-programme-proposal" },
      { title: "Financial Management Capacity Assessment Template (FMCA)", url: "https://www.greenclimate.fund/document/financial-management-capacity-assessment-template" },
      { title: "Guidance on Standardized Deliverables", url: "https://www.greenclimate.fund/document/guide-standardized-deliverables" },
      { title: "TOR for GCF Liaison Officer", url: "https://www.greenclimate.fund/document/tor-gcf-liaison-officer" },
    ]
  },
  {
    category: "Information Sessions & Events",
    links: [
      { title: "Info Session 1: Overview of Operational Modalities (2024-2027)", url: "https://www.greenclimate.fund/event/information-session-1-operational-modalities-2024-2027-strategy" },
      { title: "Info Session 3: Placement Scheme and Access Modalities", url: "https://www.greenclimate.fund/event/information-session-3-operational-modalities-2024-2027-strategy" },
    ]
  },
  {
    category: "Data Repository",
    links: [
      { title: "Readiness Data Repository", url: "https://data.greenclimate.fund/public/data/readiness" },
    ]
  }
];

// Category display names and colors
const CATEGORY_INFO = {
  'policy': {
    label: 'Policy & Regulation',
    color: '#0d4a2e'
  },
  'project-readiness': {
    label: 'Project Readiness',
    color: '#156642'
  },
  'templates': {
    label: 'Templates',
    color: '#c9a227'
  },
  'deliverable': {
    label: 'Deliverables',
    color: '#dbb84a'
  },
  'workshops': {
    label: 'Workshops',
    color: '#8B4513'
  }
};

// Page to category mapping
const PAGE_CATEGORY_MAP = {
  'policy': 'policy',
  'project-readiness': 'project-readiness',
  'templates': 'templates',
  'deliverables': 'deliverable',
};

// ===== DOM Elements =====
const navItems = document.querySelectorAll('.nav-item');
const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
const dropdownItems = document.querySelectorAll('.dropdown-item');
const pages = document.querySelectorAll('.page');
const searchFilter = document.getElementById('search-filter');

// ===== Electron IPC =====
const { ipcRenderer, shell } = require('electron');

// ===== Handle External Links =====
function initExternalLinks() {
  console.log('Initializing external link handlers...');
  
  // Handle all external links
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a[target="_blank"]');
    if (target && target.href) {
      e.preventDefault();
      shell.openExternal(target.href);
      console.log('Opening external link:', target.href);
    }
  });
  
  console.log('External link handlers initialized');
}

// ===== Navigation =====
function initNavigation() {
  // Regular nav items (exclude sync button)
  navItems.forEach(item => {
    // Skip the sync button - it has its own event listener
    if (item.classList.contains('nav-sync-btn')) {
      console.log('Skipping navigation for sync button');
      return;
    }

    if (!item.classList.contains('dropdown-trigger')) {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        navigateToPage(page);
      });
    }
  });

  // Dropdown triggers
  dropdownTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = trigger.parentElement;
      const isOpen = dropdown.classList.contains('open');
      
      // Close all dropdowns
      document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
      
      // Toggle current dropdown
      if (!isOpen) {
        dropdown.classList.add('open');
      }
    });
  });

  // Dropdown items
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      navigateToPage(page);
      // Close all dropdowns
      document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
    });
  });

  // Handle CTA buttons (like "Browse Documents")
  const ctaButtons = document.querySelectorAll('.btn-cta');
  console.log(`Initializing ${ctaButtons.length} CTA buttons`);
  ctaButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const page = btn.dataset.page;
      console.log('CTA button clicked, navigating to:', page);
      if (page && typeof navigateToPage === 'function') {
        navigateToPage(page);
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
  });
}

function navigateToPage(pageName) {
  console.log('=== NAVIGATION START ===');
  console.log('Navigating to:', pageName);
  console.log('Current page before navigation:', currentPage);

  // Update active nav item
  navItems.forEach(item => {
    if (!item.classList.contains('dropdown-trigger')) {
      item.classList.toggle('active', item.dataset.page === pageName);
    }
  });

  // Update dropdown trigger active state
  dropdownTriggers.forEach(trigger => {
    const dropdownItems = trigger.parentElement.querySelectorAll('.dropdown-item');
    const isActive = Array.from(dropdownItems).some(item => item.dataset.page === pageName);
    trigger.classList.toggle('active', isActive);
  });

  // Update dropdown items active state
  dropdownItems.forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });

  // Show/hide pages
  console.log('Updating page visibility...');
  pages.forEach(page => {
    const wasActive = page.classList.contains('active');
    const shouldBeActive = page.id === `page-${pageName}`;
    page.classList.toggle('active', shouldBeActive);
    if (wasActive !== shouldBeActive) {
      console.log(`Page ${page.id}: ${wasActive ? 'hidden' : 'shown'} → ${shouldBeActive ? 'shown' : 'hidden'}`);
    }
  });

  currentPage = pageName;
  console.log('Current page after navigation:', currentPage);

  // Load page-specific data
  if (PAGE_CATEGORY_MAP[pageName]) {
    console.log(`Loading documents for category: ${PAGE_CATEGORY_MAP[pageName]}`);
    loadDocumentsForPage(pageName);
  } else if (pageName === 'workshops') {
    console.log('Loading workshops...');
    loadWorkshops();
  }

  console.log('=== NAVIGATION END ===\n');
}

// ===== Document Management =====
async function loadDocumentsForPage(pageName) {
  console.log(`\n=== loadDocumentsForPage START ===`);
  console.log('Page name:', pageName);
  const category = PAGE_CATEGORY_MAP[pageName];
  console.log('Category:', category);

  showLoading();

  try {
    // Load from cache only
    const cachedDocs = await ipcRenderer.invoke('get-cached-documents');
    
    // Initialize all categories if not present
    CATEGORIES.forEach(cat => {
      if (!cachedDocs[cat]) {
        cachedDocs[cat] = [];
      }
    });
    
    allDocuments = cachedDocs;

    // Filter documents for this page's category
    const categoryDocs = allDocuments[category] || [];

    if (categoryDocs.length > 0) {
      filteredDocuments = categoryDocs.map(doc => ({ ...doc, category }));
      renderDocuments();
    } else {
      showEmptyStateWithHint();
    }
  } catch (error) {
    console.error('Error loading documents:', error);
    showError('Failed to load documents. Please try again.');
  }
}

async function refreshDocuments() {
  // Check if already syncing
  if (isSyncing) {
    console.log('Sync already in progress, ignoring refresh request');
    return;
  }

  await syncWithServer();
}

function filterDocuments(searchTerm) {
  if (!searchTerm) {
    // No search, show all documents for current page
    const category = PAGE_CATEGORY_MAP[currentPage];
    if (category) {
      filteredDocuments = (allDocuments[category] || []).map(doc => ({ ...doc, category }));
    }
  } else {
    // Apply search filter
    const term = searchTerm.toLowerCase().trim();
    filteredDocuments = filteredDocuments.filter(doc => {
      const title = (doc.title || '').toLowerCase();
      const description = (doc.description || '').toLowerCase();
      return title.includes(term) || description.includes(term);
    });
  }

  renderDocuments();
}

async function renderDocuments() {
  console.log(`\n=== renderDocuments START ===`);
  console.log('Current page:', currentPage);
  console.log('Filtered documents count:', filteredDocuments.length);

  if (filteredDocuments.length === 0) {
    console.log('No documents to render, showing empty state');
    showEmptyState();
    return;
  }

  const container = document.querySelector(`#page-${currentPage} #documents-container`);
  console.log(`Container selector: #page-${currentPage} #documents-container`);
  console.log('Container found:', !!container);

  if (!container) {
    console.error('Container not found!');
    return;
  }

  console.log('Rendering document cards...');
  container.innerHTML = `
    <div class="documents-grid">
      ${await Promise.all(filteredDocuments.map(doc => renderDocumentCard(doc))).then(cards => cards.join(''))}
    </div>
  `;
  console.log('Documents rendered successfully');
  console.log('=== renderDocuments END ===\n');
}

async function renderDocumentCard(doc) {
  const categoryInfo = CATEGORY_INFO[doc.category] || { label: doc.category, color: '#666' };
  const description = doc.description || `PDF document from the ${categoryInfo.label} collection.`;

  // Try to get thumbnail
  let thumbnailHtml = '';
  if (doc.thumbnail) {
    const thumbnailResult = await ipcRenderer.invoke('get-thumbnail', doc.thumbnail);
    if (thumbnailResult.exists) {
      thumbnailHtml = `<img src="${thumbnailResult.data}" alt="${escapeHtml(doc.title)}">`;
    }
  }

  // Fallback icon if no thumbnail
  if (!thumbnailHtml) {
    thumbnailHtml = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
    `;
  }

  return `
    <div class="document-card">
      <div class="document-thumbnail-wrapper">
        <div class="document-thumbnail-front">
          ${thumbnailHtml}
        </div>
        <div class="document-thumbnail-back">
          <div class="thumbnail-description">
            <p>${escapeHtml(description)}</p>
          </div>
        </div>
      </div>
      <div class="document-header">
        <span class="document-category" style="background: ${categoryInfo.color}">${categoryInfo.label}</span>
        <h3 class="document-title">${escapeHtml(doc.title)}</h3>
        <div class="document-meta">${doc.date || 'No date'} • ${doc.size || 'Unknown size'}</div>
      </div>
      <div class="document-body">
        <div class="document-footer">
          <button class="btn btn-primary btn-full" onclick="openDocumentDetailById('${doc.id}')">
            Learn More
          </button>
        </div>
      </div>
    </div>
  `;
}

async function openPdf(filePath) {
  try {
    const result = await ipcRenderer.invoke('open-pdf', filePath);

    if (!result.success) {
      alert('Failed to open PDF: ' + result.error);
    }
  } catch (error) {
    console.error('Error opening PDF:', error);
    alert('Failed to open PDF. Please try again.');
  }
}

// ===== Document Detail Functions =====
let currentDocument = null;

function openDocumentDetailById(docId) {
  // Find document in allDocuments
  let doc = null;

  for (const category of CATEGORIES) {
    const docs = allDocuments[category] || [];
    const found = docs.find(d => String(d.id) === String(docId));
    if (found) {
      doc = { ...found, category };
      break;
    }
  }

  if (doc) {
    openDocumentDetail(doc);
  } else {
    console.error('Document not found:', docId);
    alert('Document not found');
  }
}

async function openDocumentDetail(doc) {
  currentDocument = doc;

  // Navigate to detail page
  navigateToPage('document-detail');

  // Render document detail
  await renderDocumentDetail(doc);
}

async function renderDocumentDetail(doc) {
  const container = document.querySelector('#page-document-detail #document-detail-container');
  if (!container) return;

  const categoryInfo = CATEGORY_INFO[doc.category] || { label: doc.category, color: '#666' };
  const description = doc.description || `PDF document from ${categoryInfo.label} collection.`;

  // Get full thumbnail
  let thumbnailHtml = '';
  if (doc.thumbnail) {
    const thumbnailResult = await ipcRenderer.invoke('get-thumbnail', doc.thumbnail);
    if (thumbnailResult.exists) {
      thumbnailHtml = `
        <div class="document-detail-thumbnail">
          <img src="${thumbnailResult.data}" alt="${escapeHtml(doc.title)}">
        </div>
      `;
    }
  }

  // Fallback if no thumbnail
  if (!thumbnailHtml) {
    thumbnailHtml = `
      <div class="document-detail-thumbnail document-detail-no-thumbnail">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="document-detail-content">
      <button class="back-button" onclick="goBackToDocuments()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Documents
      </button>

      <div class="document-detail-main">
        ${thumbnailHtml}

        <div class="document-detail-info">
          <span class="document-detail-category" style="background: ${categoryInfo.color}">${categoryInfo.label}</span>

          <h1 class="document-detail-title">${escapeHtml(doc.title)}</h1>

          <div class="document-detail-date">
            <span class="date-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </span>
            ${doc.date || 'No date'}
          </div>

          <div class="document-detail-description">
            <p>${escapeHtml(description)}</p>
          </div>

          <button class="btn btn-primary btn-large document-detail-action" onclick="openPdfFromDetail()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            Open PDF
          </button>
        </div>
      </div>
    </div>
  `;
}

function openPdfFromDetail() {
  if (currentDocument && currentDocument.file) {
    openPdf(currentDocument.file);
  }
}

function goBackToDocuments() {
  // Navigate back to the appropriate document page based on category
  const categoryMap = {
    'policy': 'policy',
    'project-readiness': 'project-readiness',
    'templates': 'templates',
    'deliverable': 'deliverables'
  };

  if (currentDocument && currentDocument.category) {
    const page = categoryMap[currentDocument.category];
    if (page) {
      navigateToPage(page);
    }
  }
}

// ===== Workshop Functions =====
async function loadWorkshops() {
  showLoading('workshops');
  
  try {
    const cachedDocs = await ipcRenderer.invoke('get-cached-documents');
    const workshops = cachedDocs.workshops || [];
    
    allDocuments = cachedDocs;
    
    if (workshops.length > 0) {
      renderWorkshopGrid(workshops);
    } else {
      showEmptyWorkshopsState();
    }
  } catch (error) {
    console.error('Error loading workshops:', error);
    showErrorWorkshops('Failed to load workshops. Please try again.');
  }
}

async function renderWorkshopGrid(workshops) {
  const container = document.querySelector('#page-workshops #workshops-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="workshops-grid">
      ${await Promise.all(workshops.map(workshop => renderWorkshopCard(workshop))).then(cards => cards.join(''))}
    </div>
  `;
}

async function renderWorkshopCard(workshop) {
  // Get the first image (or any image) for the card
  const firstImage = workshop.images && workshop.images.length > 0 ? workshop.images[0] : null;
  
  let imageHtml = '';
  if (firstImage) {
    const imageResult = await ipcRenderer.invoke('get-workshop-images', [firstImage]);
    if (imageResult.success && imageResult.images.length > 0) {
      imageHtml = `<div class="workshop-card-image"><img src="${imageResult.images[0].data}" alt="${escapeHtml(workshop.title)}"></div>`;
    }
  }
  
  // Fallback if no image
  if (!imageHtml) {
    imageHtml = `
      <div class="workshop-card-image workshop-card-no-image">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      </div>
    `;
  }
  
  return `
    <div class="workshop-card">
      ${imageHtml}
      <div class="workshop-card-content">
        <h3 class="workshop-card-title">${escapeHtml(workshop.title)}</h3>
        <div class="workshop-card-date">${formatWorkshopDate(workshop.date)}</div>
        <button class="btn btn-primary workshop-card-button" onclick="openWorkshopDetail(${workshop.id})">
          Learn More
        </button>
      </div>
    </div>
  `;
}

async function openWorkshopDetail(workshopId) {
  const workshop = allDocuments.workshops?.find(w => String(w.id) === String(workshopId));
  if (!workshop) {
    console.error('Workshop not found:', workshopId);
    return;
  }
  
  currentWorkshop = workshop;
  currentImageIndex = 0;
  
  // Navigate to detail page
  navigateToPage('workshop-detail');
  
  // Render workshop detail
  await renderWorkshopDetail(workshop);
}

async function renderWorkshopDetail(workshop) {
  const container = document.querySelector('#page-workshop-detail #workshop-detail-container');
  if (!container) return;
  
  // Load all workshop images
  let imagesHtml = '';
  if (workshop.images && workshop.images.length > 0) {
    const imageResult = await ipcRenderer.invoke('get-workshop-images', workshop.images);
    
    if (imageResult.success && imageResult.images.length > 0) {
      // Build images array for carousel
      window.workshopImages = imageResult.images;
      
      imagesHtml = `
        <div class="workshop-gallery">
          <button class="gallery-nav gallery-prev" onclick="navigateGallery(-1)" ${imageResult.images.length <= 1 ? 'style="display:none"' : ''}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <div class="gallery-main">
            <img id="gallery-image" src="${imageResult.images[0].data}" alt="${escapeHtml(workshop.title)}">
            <div class="gallery-counter">${1} / ${imageResult.images.length}</div>
          </div>
          
          <button class="gallery-nav gallery-next" onclick="navigateGallery(1)" ${imageResult.images.length <= 1 ? 'style="display:none"' : ''}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        
        ${imageResult.images.length > 1 ? `
          <div class="gallery-dots">
            ${imageResult.images.map((_, idx) => `
              <button class="gallery-dot ${idx === 0 ? 'active' : ''}" onclick="goToGalleryImage(${idx})"></button>
            `).join('')}
          </div>
        ` : ''}
      `;
    }
  }
  
  // If no images, show placeholder
  if (!imagesHtml) {
    imagesHtml = `
      <div class="workshop-gallery workshop-gallery-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <p>No images available</p>
      </div>
    `;
  }
  
  container.innerHTML = `
    <div class="workshop-detail-content">
      <button class="back-button" onclick="navigateToPage('workshops')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Workshops
      </button>
      
      <h1 class="workshop-detail-title">${escapeHtml(workshop.title)}</h1>
      
      ${imagesHtml}
      
      <div class="workshop-description">
        <h2>Description</h2>
        <p>${escapeHtml(workshop.description || 'No description available.')}</p>
      </div>
      
      <div class="workshop-metadata">
        <h2>Details</h2>
        <div class="metadata-grid">
          <div class="metadata-item">
            <span class="metadata-label">Date:</span>
            <span class="metadata-value">${formatWorkshopDate(workshop.date)}</span>
          </div>
          ${workshop.createdBy ? `
            <div class="metadata-item">
              <span class="metadata-label">Created By:</span>
              <span class="metadata-value">${escapeHtml(workshop.createdBy)}</span>
            </div>
          ` : ''}
          <div class="metadata-item">
            <span class="metadata-label">Images:</span>
            <span class="metadata-value">${workshop.images ? workshop.images.length : 0}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function navigateGallery(direction) {
  if (!window.workshopImages || window.workshopImages.length <= 1) return;
  
  currentImageIndex += direction;
  
  // Wrap around
  if (currentImageIndex >= window.workshopImages.length) {
    currentImageIndex = 0;
  } else if (currentImageIndex < 0) {
    currentImageIndex = window.workshopImages.length - 1;
  }
  
  updateGalleryDisplay();
}

function goToGalleryImage(index) {
  if (!window.workshopImages || index < 0 || index >= window.workshopImages.length) return;
  
  currentImageIndex = index;
  updateGalleryDisplay();
}

function updateGalleryDisplay() {
  if (!window.workshopImages || !window.workshopImages[currentImageIndex]) return;
  
  const imageEl = document.getElementById('gallery-image');
  const counterEl = document.querySelector('.gallery-counter');
  const dots = document.querySelectorAll('.gallery-dot');
  
  if (imageEl) {
    imageEl.src = window.workshopImages[currentImageIndex].data;
  }
  
  if (counterEl) {
    counterEl.textContent = `${currentImageIndex + 1} / ${window.workshopImages.length}`;
  }
  
  // Update dots
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentImageIndex);
  });
}

function formatWorkshopDate(dateStr) {
  if (!dateStr) return 'No date';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function showLoading(page) {
  const pageSelector = page ? `#page-${page}` : `#page-${currentPage}`;
  const containerSelector = page === 'workshops' ? `${pageSelector} #workshops-container` : `${pageSelector} #documents-container`;
  const container = document.querySelector(containerSelector);
  console.log(`showLoading called for: ${containerSelector}`);
  if (!container) {
    console.log(`  Container not found!`);
    return;
  }

  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>${page === 'workshops' ? 'Loading workshops...' : 'Loading documents...'}</p>
    </div>
  `;
  console.log('  Loading state set');
}

function showEmptyWorkshopsState() {
  const container = document.querySelector('#page-workshops #workshops-container');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      <h3>No workshops available</h3>
      <p>Click the <strong>Refresh</strong> button to sync workshops from the server.</p>
    </div>
  `;
}

function showErrorWorkshops(message) {
  const container = document.querySelector('#page-workshops #workshops-container');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3>Error</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

// ===== Sync Functions =====
async function syncWithServer() {
  // Check if already syncing
  if (isSyncing) {
    console.log('Sync already in progress');
    return;
  }

  isSyncing = true;
  console.log('Starting sync with server...');

  try {
    const result = await ipcRenderer.invoke('sync-remote-documents');

    if (result.success) {
      // Sync completed successfully
      console.log('Sync result:', result);

      // Reload cache to get updated document list
      const cachedDocs = await ipcRenderer.invoke('get-cached-documents');
      
      // Initialize all categories if not present
      CATEGORIES.forEach(cat => {
        if (!cachedDocs[cat]) {
          cachedDocs[cat] = [];
        }
      });
      
      allDocuments = cachedDocs;

      // Show success message first
      if (result.stage === 'complete' && result.total > 0) {
        showSyncSuccess(result.downloaded, result.failed, result.removed || 0, result.message);
        // Auto-dismiss success message and show content after 2 seconds
        setTimeout(() => {
          if (currentPage === 'workshops') {
            loadWorkshops();
          } else {
            const category = PAGE_CATEGORY_MAP[currentPage];
            if (category) {
              filteredDocuments = (allDocuments[category] || []).map(doc => ({ ...doc, category }));
              renderDocuments();
            }
          }
        }, 2000);
      } else if (result.total === 0) {
        showSyncInfo(result.message);
        // Auto-dismiss info message and show content after 2 seconds
        setTimeout(() => {
          if (currentPage === 'workshops') {
            loadWorkshops();
          } else {
            const category = PAGE_CATEGORY_MAP[currentPage];
            if (category) {
              filteredDocuments = (allDocuments[category] || []).map(doc => ({ ...doc, category }));
              renderDocuments();
            }
          }
        }, 2000);
      } else {
        // Immediately show content if no special message needed
        if (currentPage === 'workshops') {
          loadWorkshops();
        } else {
          const category = PAGE_CATEGORY_MAP[currentPage];
          if (category) {
            filteredDocuments = (allDocuments[category] || []).map(doc => ({ ...doc, category }));
            renderDocuments();
          }
        }
      }
    } else {
      // Sync failed
      console.error('Sync failed:', result.error, 'Stage:', result.stage);
      showSyncError(result.message || 'Failed to sync with server');
    }
  } catch (error) {
    console.error('Sync error:', error);
    showSyncError('Failed to sync with server: ' + error.message);
  } finally {
    isSyncing = false;
  }
}

function showSyncProgress(status) {
  const container = document.querySelector(`#page-${currentPage} #documents-container`);
  if (!container) return;

  container.innerHTML = `
    <div class="sync-progress-container">
      <div class="spinner"></div>
      <h3>Syncing with server...</h3>
      <p>Downloading file ${status.current} of ${status.total}</p>
      <p class="sync-file-name">${escapeHtml(status.file)}</p>
      ${status.percent > 0 ? `
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${status.percent}%"></div>
        </div>
        <p class="sync-percent">${status.percent}%</p>
      ` : ''}
    </div>
  `;
}

function showSyncProgressUpdate(progress) {
  const percentEl = document.querySelector('.sync-percent');
  const barEl = document.querySelector('.progress-bar');
  const fileEl = document.querySelector('.sync-file-name');

  if (percentEl) percentEl.textContent = progress.percent + '%';
  if (barEl) barEl.style.width = progress.percent + '%';
  if (fileEl) fileEl.textContent = progress.file;
}

function showSyncSuccess(downloaded, failed, removed, message) {
  const container = document.querySelector(`#page-${currentPage} #documents-container`);
  if (!container) return;

  const isSuccess = failed === 0;
  const hasRemoved = removed > 0;

  container.innerHTML = `
    <div class="sync-result-container ${isSuccess ? 'sync-success' : 'sync-partial'}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${isSuccess
          ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
          : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
        }
      </svg>
      <h3>${isSuccess ? 'Sync Complete!' : 'Sync Complete (with errors)'}</h3>
      <p>${escapeHtml(message)}</p>
      <div class="sync-stats">
        <div class="sync-stat">
          <span class="sync-stat-number">${downloaded}</span>
          <span class="sync-stat-label">Downloaded</span>
        </div>
        ${hasRemoved ? `
          <div class="sync-stat sync-stat-removed">
            <span class="sync-stat-number">${removed}</span>
            <span class="sync-stat-label">Removed</span>
          </div>
        ` : ''}
        ${failed > 0 ? `
          <div class="sync-stat sync-stat-error">
            <span class="sync-stat-number">${failed}</span>
            <span class="sync-stat-label">Failed</span>
          </div>
        ` : ''}
      </div>
      ${failed > 0 ? `
        <p class="sync-retry-hint">Failed files will be retried on the next refresh.</p>
      ` : ''}
      ${hasRemoved ? `
        <p class="sync-removed-hint">Removed files are no longer available on the server.</p>
      ` : ''}
      <button class="btn btn-primary" style="margin-top: var(--spacing-lg); max-width: 200px;" onclick="filterDocumentsAndRender()">
        View Documents
      </button>
    </div>
  `;
}

function showSyncInfo(message) {
  const container = document.querySelector(`#page-${currentPage} #documents-container`);
  if (!container) return;

  container.innerHTML = `
    <div class="sync-result-container sync-info">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <h3>Sync Info</h3>
      <p>${escapeHtml(message)}</p>
      <button class="btn btn-primary" style="margin-top: var(--spacing-lg); max-width: 200px;" onclick="filterDocumentsAndRender()">
        View Documents
      </button>
    </div>
  `;
}

function showSyncError(message) {
  const container = document.querySelector(`#page-${currentPage} #documents-container`);
  if (!container) return;

  container.innerHTML = `
    <div class="sync-result-container sync-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <h3>Sync Failed</h3>
      <p>${escapeHtml(message)}</p>
      <p class="sync-retry-hint">Click Refresh to try again.</p>
      <button class="btn btn-primary" style="margin-top: var(--spacing-lg); max-width: 200px;" onclick="filterDocumentsAndRender()">
        View Documents
      </button>
    </div>
  `;
}

function filterDocumentsAndRender() {
  const category = PAGE_CATEGORY_MAP[currentPage];
  if (category) {
    filteredDocuments = (allDocuments[category] || []).map(doc => ({ ...doc, category }));
    renderDocuments();
  }
}

// ===== UI States =====
function showLoading() {
  const containerSelector = `#page-${currentPage} #documents-container`;
  console.log(`showLoading() called for: ${containerSelector}`);
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.log(`  Container not found!`);
    return;
  }

  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading documents...</p>
    </div>
  `;
  console.log('  Loading state set');
}

function showEmptyState() {
  const container = document.querySelector(`#page-${currentPage} #documents-container`);
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      <h3>No documents found</h3>
      <p>Try adjusting your search terms.</p>
    </div>
  `;
}

function showEmptyStateWithHint() {
  const container = document.querySelector(`#page-${currentPage} #documents-container`);
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      <h3>No documents available</h3>
      <p>Click the <strong>Refresh</strong> button to sync documents from the server.</p>
    </div>
  `;
}

function showError(message) {
  const containerSelector = `#page-${currentPage} #documents-container`;
  console.log(`showError called for: ${containerSelector}`);
  console.log('Error message:', message);
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.log('  Container not found!');
    return;
  }

  container.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3>Error</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
  console.log('  Error state set');
}

// ===== Utility Functions =====
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== Event Listeners =====

// Debounce function to prevent excessive filtering
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Search input handler
document.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'search-filter') {
    debounce(() => filterDocuments(e.target.value), 300)();
  }
});

// ===== Handle page changes from IPC =====
ipcRenderer.on('page-change', (event, page) => {
  navigateToPage(page);
});

// Handle sync status updates from IPC
ipcRenderer.on('sync-status', (event, status) => {
  console.log('Sync status:', status);
  showSyncProgress(status);
});

// Handle sync progress updates from IPC
ipcRenderer.on('sync-progress', (event, progress) => {
  console.log('Sync progress:', progress);
  showSyncProgressUpdate(progress);
});

// Handle sync completion from IPC
ipcRenderer.on('sync-complete', (event, result) => {
  console.log('Sync complete:', result);
  // Result is already handled in syncWithServer function
});

// Handle sync removed files notification
ipcRenderer.on('sync-removed', (event, data) => {
  console.log('Files removed:', data);
  if (data.count > 0) {
    console.log(`Removed ${data.count} files not on server:`, data.files);
  }
});

// Handle sync error from IPC
ipcRenderer.on('sync-error', (event, error) => {
  console.log('Sync error:', error);
  // Error is already handled in syncWithServer function
});

// ===== Global Sync Modal Functions =====
let globalSyncInProgress = false;

function showSyncModal() {
  const modal = document.getElementById('sync-modal');
  const icon = document.getElementById('sync-modal-icon');
  const title = document.getElementById('sync-modal-title');
  const message = document.getElementById('sync-modal-message');
  const stats = document.getElementById('sync-modal-stats');
  const closeBtn = document.getElementById('sync-modal-close');
  const syncingIcon = icon.querySelector('.syncing-icon');
  const successIcon = icon.querySelector('.success-icon');
  const errorIcon = icon.querySelector('.error-icon');

  // Reset modal state
  icon.className = 'sync-modal-icon syncing';
  syncingIcon.style.display = 'block';
  successIcon.style.display = 'none';
  errorIcon.style.display = 'none';
  title.textContent = 'Syncing...';
  message.textContent = 'Please wait while we sync with the server.';
  stats.style.display = 'none';
  closeBtn.style.display = 'none';

  // Show modal
  modal.classList.add('active');
  globalSyncInProgress = true;
}

function updateSyncModalSuccess(downloaded, removed, failed) {
  const icon = document.getElementById('sync-modal-icon');
  const title = document.getElementById('sync-modal-title');
  const message = document.getElementById('sync-modal-message');
  const stats = document.getElementById('sync-modal-stats');
  const closeBtn = document.getElementById('sync-modal-close');
  const downloadedEl = document.getElementById('sync-modal-downloaded');
  const removedEl = document.getElementById('sync-modal-removed');
  const syncingIcon = icon.querySelector('.syncing-icon');
  const successIcon = icon.querySelector('.success-icon');
  const errorIcon = icon.querySelector('.error-icon');

  // Update icon and styling
  icon.className = failed > 0 ? 'sync-modal-icon error' : 'sync-modal-icon success';
  syncingIcon.style.display = 'none';
  successIcon.style.display = failed > 0 ? 'none' : 'block';
  errorIcon.style.display = failed > 0 ? 'block' : 'none';

  // Update content
  if (failed > 0) {
    title.textContent = 'Sync Complete (with errors)';
    message.textContent = `${failed} file(s) failed to sync. Click refresh to try again.`;
  } else if (downloaded === 0 && removed === 0) {
    title.textContent = 'Up to Date';
    message.textContent = 'All documents are already up to date with the server.';
  } else {
    title.textContent = 'Sync Complete!';
    message.textContent = downloaded > 0 && removed > 0
      ? 'Successfully synced documents with the server.'
      : downloaded > 0
        ? 'Successfully downloaded new documents.'
        : 'Removed outdated documents.';
  }

  // Update stats
  downloadedEl.textContent = downloaded;
  removedEl.textContent = removed;
  stats.style.display = 'block';

  // Show close button
  closeBtn.style.display = 'inline-flex';

  globalSyncInProgress = false;
}

function updateSyncModalError(errorMessage) {
  const icon = document.getElementById('sync-modal-icon');
  const title = document.getElementById('sync-modal-title');
  const message = document.getElementById('sync-modal-message');
  const closeBtn = document.getElementById('sync-modal-close');
  const syncingIcon = icon.querySelector('.syncing-icon');
  const successIcon = icon.querySelector('.success-icon');
  const errorIcon = icon.querySelector('.error-icon');

  // Update icon and styling
  icon.className = 'sync-modal-icon error';
  syncingIcon.style.display = 'none';
  successIcon.style.display = 'none';
  errorIcon.style.display = 'block';
  title.textContent = 'Sync Failed';
  message.textContent = errorMessage || 'Failed to sync with the server. Please try again.';

  // Hide stats and show close button
  document.getElementById('sync-modal-stats').style.display = 'none';
  closeBtn.style.display = 'inline-flex';

  globalSyncInProgress = false;
}

function closeSyncModal() {
  console.log('\n=== closeSyncModal START ===');
  console.log('Current page when closing modal:', currentPage);
  console.log('PAGE_CATEGORY_MAP[currentPage]:', PAGE_CATEGORY_MAP[currentPage]);

  const modal = document.getElementById('sync-modal');
  modal.classList.remove('active');
  console.log('Modal hidden');

  // Refresh current page content if on a document page
  if (PAGE_CATEGORY_MAP[currentPage]) {
    console.log(`Refreshing documents page for category: ${PAGE_CATEGORY_MAP[currentPage]}`);
    loadDocumentsForPage(currentPage);
  } else if (currentPage === 'workshops') {
    console.log('Refreshing workshops page');
    loadWorkshops();
  } else {
    console.log(`No refresh needed for page: ${currentPage}`);
  }

  console.log('=== closeSyncModal END ===\n');
}

async function triggerGlobalSync() {
  console.log('\n=== triggerGlobalSync START ===');
  console.log('Global sync in progress:', globalSyncInProgress);
  console.log('Current page when sync triggered:', currentPage);

  if (globalSyncInProgress) {
    console.log('Global sync already in progress, ignoring');
    return;
  }

  console.log('Showing sync modal...');
  showSyncModal();

  try {
    console.log('Calling sync-remote-documents IPC...');
    const result = await ipcRenderer.invoke('sync-remote-documents');
    console.log('Sync result:', result);

    if (result.success) {
      console.log('Sync successful, reloading cache...');
      // Reload cache
      const cachedDocs = await ipcRenderer.invoke('get-cached-documents');
      CATEGORIES.forEach(cat => {
        if (!cachedDocs[cat]) {
          cachedDocs[cat] = [];
        }
      });
      allDocuments = cachedDocs;
      console.log('Cache reloaded');

      // Update modal with success
      console.log('Updating modal with success state...');
      updateSyncModalSuccess(
        result.downloaded || 0,
        result.removed || 0,
        result.failed || 0
      );
    } else {
      console.log('Sync failed:', result.message);
      updateSyncModalError(result.message || 'Sync failed');
    }
  } catch (error) {
    console.error('Global sync error:', error);
    updateSyncModalError(error.message || 'An unexpected error occurred');
  }

  console.log('=== triggerGlobalSync END ===\n');
}

// ===== Slideshow Functions =====
function initSlideshow() {
  console.log('Initializing slideshow...');

  // Wait for GSAP and jQuery to be available
  const checkLibraries = () => {
    if (typeof window.TweenMax !== 'undefined' && typeof window.$ !== 'undefined') {
      console.log('GSAP and jQuery loaded, initializing slideshow...');
      initializeSlideshowLogic();
    } else {
      console.log('Waiting for libraries...');
      setTimeout(checkLibraries, 100);
    }
  };

  checkLibraries();
}

function initializeSlideshowLogic() {
  const $ = window.$;
  const TweenMax = window.TweenMax;
  const Power3 = window.TweenMax ? window.TweenMax.Power3 : null;

  const slideshowDuration = 4000;
  const slideshow = $('.slideshow');
  const windowHeight = $(window).height();

  if (slideshow.length === 0) {
    console.log('No slideshow found on page');
    return;
  }

  function slideshowSwitch(slideshow, index, auto) {
    if (slideshow.data('wait')) return;

    var slides = slideshow.find('.slide');
    var activeSlide = slides.filter('.is-active');
    var activeSlideImage = activeSlide.find('.image-container');
    var newSlide = slides.eq(index);
    var newSlideImage = newSlide.find('.image-container');
    var newSlideContent = newSlide.find('.slide-content');
    var newSlideElements = newSlide.find('.caption > *');
    if (newSlide.is(activeSlide)) return;

    newSlide.addClass('is-new');
    var timeout = slideshow.data('timeout');
    clearTimeout(timeout);
    slideshow.data('wait', true);
    var transition = slideshow.attr('data-transition');

    if (transition == 'fade') {
      newSlide.css({
        display: 'block',
        zIndex: 2
      });
      newSlideImage.css({
        opacity: 0
      });

      TweenMax.to(newSlideImage, 1, {
        alpha: 1,
        onComplete: function() {
          newSlide.addClass('is-active').removeClass('is-new');
          activeSlide.removeClass('is-active');
          newSlide.css({ display: '', zIndex: '' });
          newSlideImage.css({ opacity: '' });
          slideshow.data('wait', false);
          if (auto) {
            timeout = setTimeout(function() {
              slideshowNext(slideshow, false, true);
            }, slideshowDuration);
            slideshow.data('timeout', timeout);
          }
        }
      });
    } else {
      var newSlideRight, newSlideLeft, newSlideImageRight, newSlideImageLeft,
          newSlideImageToRight, newSlideImageToLeft, newSlideContentLeft,
          newSlideContentRight, activeSlideImageLeft;

      if (newSlide.index() > activeSlide.index()) {
        newSlideRight = 0;
        newSlideLeft = 'auto';
        newSlideImageRight = -slideshow.width() / 8;
        newSlideImageLeft = 'auto';
        newSlideImageToRight = 0;
        newSlideImageToLeft = 'auto';
        newSlideContentLeft = 'auto';
        newSlideContentRight = 0;
        activeSlideImageLeft = -slideshow.width() / 4;
      } else {
        newSlideRight = '';
        newSlideLeft = 0;
        newSlideImageRight = 'auto';
        newSlideImageLeft = -slideshow.width() / 8;
        newSlideImageToRight = '';
        newSlideImageToLeft = 0;
        newSlideContentLeft = 0;
        newSlideContentRight = 'auto';
        activeSlideImageLeft = slideshow.width() / 4;
      }

      newSlide.css({
        display: 'block',
        width: 0,
        right: newSlideRight,
        left: newSlideLeft,
        zIndex: 2
      });

      newSlideImage.css({
        width: slideshow.width(),
        right: newSlideImageRight,
        left: newSlideImageLeft
      });

      newSlideContent.css({
        width: slideshow.width(),
        left: newSlideContentLeft,
        right: newSlideContentRight
      });

      activeSlideImage.css({
        left: 0
      });

      if (TweenMax && Power3) {
        TweenMax.set(newSlideElements, { y: 20, force3D: true });
        TweenMax.to(activeSlideImage, 1, {
          left: activeSlideImageLeft,
          ease: Power3.easeInOut
        });

        TweenMax.to(newSlide, 1, {
          width: slideshow.width(),
          ease: Power3.easeInOut
        });

        TweenMax.to(newSlideImage, 1, {
          right: newSlideImageToRight,
          left: newSlideImageToLeft,
          ease: Power3.easeInOut
        });

        TweenMax.staggerFromTo(newSlideElements, 0.8, { alpha: 0, y: 60 }, {
          alpha: 1,
          y: 0,
          ease: Power3.easeOut,
          force3D: true,
          delay: 0.6
        }, 0.1, function() {
          newSlide.addClass('is-active').removeClass('is-new');
          activeSlide.removeClass('is-active');
          newSlide.css({
            display: '',
            width: '',
            left: '',
            zIndex: ''
          });

          newSlideImage.css({
            width: '',
            right: '',
            left: ''
          });

          newSlideContent.css({
            width: '',
            left: ''
          });

          newSlideElements.css({
            opacity: '',
            transform: ''
          });

          activeSlideImage.css({
            left: ''
          });

          slideshow.data('wait', false);
          if (auto) {
            timeout = setTimeout(function() {
              slideshowNext(slideshow, false, true);
            }, slideshowDuration);
            slideshow.data('timeout', timeout);
          }
        });
      } else {
        console.error('TweenMax or Power3 not available');
        slideshow.data('wait', false);
      }
    }
  }

  function slideshowNext(slideshow, previous, auto) {
    var slides = slideshow.find('.slide');
    var activeSlide = slides.filter('.is-active');
    var newSlide = null;
    if (previous) {
      newSlide = activeSlide.prev('.slide');
      if (newSlide.length === 0) {
        newSlide = slides.last();
      }
    } else {
      newSlide = activeSlide.next('.slide');
      if (newSlide.length == 0)
        newSlide = slides.filter('.slide').first();
    }

    slideshowSwitch(slideshow, newSlide.index(), auto);
  }

  function homeSlideshowParallax() {
    var scrollTop = $(window).scrollTop();
    if (scrollTop > windowHeight) return;
    var inner = slideshow.find('.slideshow-inner');
    var newHeight = windowHeight - (scrollTop / 2);
    var newTop = scrollTop * 0.8;

    inner.css({
      transform: 'translateY(' + newTop + 'px)',
      height: newHeight
    });
  }

  $('.slide').addClass('is-loaded');

  $('.slideshow .arrows .arrow').on('click', function() {
    slideshowNext($(this).closest('.slideshow'), $(this).hasClass('prev'), true);
  });

  $('.slideshow .btn-slide').on('click', function(e) {
    e.preventDefault();
    const page = $(this).data('page');
    if (page && typeof navigateToPage === 'function') {
      navigateToPage(page);
    }
  });

  var timeout = setTimeout(function() {
    slideshowNext(slideshow, false, true);
  }, slideshowDuration);

  slideshow.data('timeout', timeout);

  if ($('.slideshow').length > 1) {
    $(window).on('scroll', homeSlideshowParallax);
  }

  console.log('Slideshow initialized successfully');
}

// ===== Scroll Animation Functions =====
function initScrollAnimations() {
  console.log('Initializing scroll animations...');

  // Create an Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        // Optional: unobserve after animating once
        // observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  // Observe all elements with animate-on-scroll class
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  animatedElements.forEach((el) => {
    observer.observe(el);
  });

  console.log(`Scroll animations initialized for ${animatedElements.length} elements`);
}

// ===== Stat Modal Functions =====
const STAT_INFO = {
  projects: {
    title: 'Projects Initiated',
    text: 'Eritrea has initiated over 15 climate-related projects in partnership with the Green Climate Fund and other international organizations. These projects span across adaptation, mitigation, and capacity building sectors, contributing to the country\'s sustainable development goals.'
  },
  funding: {
    title: 'Funding Mobilized',
    text: 'Over $2.5 million has been mobilized for climate action in Eritrea through various funding mechanisms including the GCF Readiness Programme, adaptation funds, and bilateral partnerships. This funding supports institutional strengthening, project development, and climate resilience initiatives.'
  },
  sectors: {
    title: 'Key Sectors',
    text: 'Eritrea focuses on 6 key sectors for climate action: Agriculture & Food Security, Water Resources, Energy, Health, Coastal Zones, and Ecosystems. These sectors are prioritized in the National Adaptation Plan and Nationally Determined Contributions.'
  },
  partners: {
    title: 'Strategic Partners',
    text: 'Eritrea collaborates with 8 strategic partners including the Green Climate Fund, UNDP, FAO, UNEP, African Development Bank, GIZ, IGAD, and OSS. These partnerships enable knowledge sharing, technical assistance, and financial support for climate initiatives.'
  }
};

function initStatCards() {
  console.log('Initializing stat cards...');
  
  const statCards = document.querySelectorAll('.stat-card-new[data-stat]');
  
  statCards.forEach(card => {
    card.addEventListener('click', () => {
      const statKey = card.getAttribute('data-stat');
      if (statKey && STAT_INFO[statKey]) {
        showStatModal(statKey);
      }
    });
  });
  
  console.log(`Stat cards initialized: ${statCards.length} cards`);
}

function showStatModal(statKey) {
  const modal = document.getElementById('stat-modal');
  const titleEl = document.getElementById('stat-modal-title');
  const textEl = document.getElementById('stat-modal-text');
  
  if (!modal || !titleEl || !textEl) {
    console.error('Stat modal elements not found');
    return;
  }
  
  const info = STAT_INFO[statKey];
  if (info) {
    titleEl.textContent = info.title;
    textEl.textContent = info.text;
    modal.classList.add('active');
  }
}

function closeStatModal() {
  const modal = document.getElementById('stat-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Close stat modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('stat-modal');
  if (modal && e.target === modal) {
    closeStatModal();
  }
});

// Close stat modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeStatModal();
  }
});

// ===== Tab Functions =====
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  // Update tab button states
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // Update tab content visibility
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabId}`);
  });

  // If switching to resources tab, render resources
  if (tabId === 'resources') {
    renderResources();
  }
}

// ===== Resources Functions =====
function renderResources() {
  const container = document.getElementById('resources-container');
  if (!container) {
    console.error('Resources container not found');
    return;
  }

  if (!RESOURCES_DATA || RESOURCES_DATA.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        <h3>No resources available</h3>
        <p>Check back later for updates.</p>
      </div>
    `;
    return;
  }

  let html = '';
  RESOURCES_DATA.forEach(section => {
    html += `
      <div class="resources-section">
        <div class="resources-category-header">
          <h3 class="resources-category-title">${escapeHtml(section.category)}</h3>
        </div>
        <div class="resources-grid">
          ${section.links.map(link => `
            <div class="resource-link-card" onclick="openResourceLink('${escapeHtml(link.url)}')">
              <div class="resource-link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </div>
              <div class="resource-link-content">
                <h4 class="resource-link-title">${escapeHtml(link.title)}</h4>
                <span class="resource-link-url">${escapeHtml(link.url)}</span>
              </div>
              <div class="resource-external-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function openResourceLink(url) {
  shell.openExternal(url);
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== DOMContentLoaded ===');
  console.log('Renderer process started');
  console.log('Initial current page:', currentPage);

  initNavigation();
  console.log('Navigation initialized');

  // Initialize tabs
  initTabs();
  console.log('Tabs initialized');

  // Initialize global sync button
  const globalSyncBtn = document.getElementById('global-sync-btn');
  if (globalSyncBtn) {
    globalSyncBtn.addEventListener('click', triggerGlobalSync);
    console.log('Global sync button initialized');
  }

  console.log('All pages in DOM:');
  pages.forEach(page => {
    console.log(`  - ${page.id} (active: ${page.classList.contains('active')})`);
  });

  // Initialize slideshow
  initSlideshow();

  // Initialize scroll animations for About page
  initScrollAnimations();

  // Initialize stat cards
  initStatCards();

  // Initialize external links
  initExternalLinks();

  console.log('=== Initialization Complete ===\n');
});
