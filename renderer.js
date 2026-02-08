// ===== Global State =====
let currentPage = 'home';
let allDocuments = {};
let filteredDocuments = [];
let isSyncing = false;
let currentWorkshop = null; // For workshop detail view
let currentImageIndex = 0; // For image carousel

// Define the categories
const CATEGORIES = ['policy', 'project-readiness', 'templates', 'deliverable', 'workshops'];

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
  'workshops': 'workshops'
};

// ===== DOM Elements =====
const navItems = document.querySelectorAll('.nav-item');
const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
const dropdownItems = document.querySelectorAll('.dropdown-item');
const pages = document.querySelectorAll('.page');
const searchFilter = document.getElementById('search-filter');

// ===== Electron IPC =====
const { ipcRenderer } = require('electron');

// ===== Navigation =====
function initNavigation() {
  // Regular nav items
  navItems.forEach(item => {
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

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
  });
}

function navigateToPage(pageName) {
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
  pages.forEach(page => {
    page.classList.toggle('active', page.id === `page-${pageName}`);
  });

  currentPage = pageName;

  // Load page-specific data
  if (PAGE_CATEGORY_MAP[pageName]) {
    loadDocumentsForPage(pageName);
  }
  
  // Special handling for workshops page
  if (pageName === 'workshops') {
    loadWorkshops();
  } else if (pageName === 'workshop-detail') {
    // Don't reload when navigating to detail view
  }
}

// ===== Document Management =====
async function loadDocumentsForPage(pageName) {
  const category = PAGE_CATEGORY_MAP[pageName];
  if (!category) return;

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
  if (filteredDocuments.length === 0) {
    showEmptyState();
    return;
  }

  const container = document.querySelector(`#page-${currentPage} #documents-container`);
  if (!container) return;

  container.innerHTML = `
    <div class="documents-grid">
      ${await Promise.all(filteredDocuments.map(doc => renderDocumentCard(doc))).then(cards => cards.join(''))}
    </div>
  `;
}

async function renderDocumentCard(doc) {
  const categoryInfo = CATEGORY_INFO[doc.category] || { label: doc.category, color: '#666' };
  const description = doc.description || `PDF document from the ${categoryInfo.label} collection.`;
  
  // Try to get thumbnail
  let thumbnailHtml = '';
  if (doc.thumbnail) {
    const thumbnailResult = await ipcRenderer.invoke('get-thumbnail', doc.thumbnail);
    if (thumbnailResult.exists) {
      thumbnailHtml = `<div class="document-thumbnail"><img src="${thumbnailResult.data}" alt="${escapeHtml(doc.title)}"></div>`;
    }
  }

  return `
    <div class="document-card">
      ${thumbnailHtml}
      <div class="document-header">
        <span class="document-category" style="background: ${categoryInfo.color}">${categoryInfo.label}</span>
        <h3 class="document-title">${escapeHtml(doc.title)}</h3>
        <div class="document-meta">${doc.date || 'No date'} • ${doc.size || 'Unknown size'}</div>
      </div>
      <div class="document-body">
        <p class="document-description">${escapeHtml(description)}</p>
        <div class="document-footer">
          <button class="btn btn-primary btn-full" onclick="openPdf('${escapeHtml(doc.file)}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Open PDF
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
  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>${page === 'workshops' ? 'Loading workshops...' : 'Loading documents...'}</p>
    </div>
  `;
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
        showSyncSuccess(result.downloaded, result.failed, result.message);
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

function showSyncSuccess(downloaded, failed, message) {
  const container = document.querySelector(`#page-${currentPage} #documents-container`);
  if (!container) return;

  const isSuccess = failed === 0;

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
  const container = document.querySelector(`#page-${currentPage} #documents-container`);
  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading documents...</p>
    </div>
  `;
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
  const container = document.querySelector(`#page-${currentPage} #documents-container`);
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

// Handle sync error from IPC
ipcRenderer.on('sync-error', (event, error) => {
  console.log('Sync error:', error);
  // Error is already handled in syncWithServer function
});

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Renderer process started');
  
  initNavigation();
  console.log('Navigation initialized');
});
