// ===== Global State =====
let currentPage = 'home';
let allDocuments = { gcf: [], policy: [] };
let filteredDocuments = [];
let isSyncing = false;

// ===== DOM Elements =====
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const categoryFilter = document.getElementById('category-filter');
const searchFilter = document.getElementById('search-filter');
const documentsContainer = document.getElementById('documents-container');

// ===== Electron IPC =====
const { ipcRenderer } = require('electron');

// ===== Navigation =====
function initNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateToPage(page);
        });
    });
}

function navigateToPage(pageName) {
    // Update active nav item
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });

    // Show/hide pages
    pages.forEach(page => {
        page.classList.toggle('active', page.id === `page-${pageName}`);
    });

    currentPage = pageName;

    // Load page-specific data
    if (pageName === 'resources') {
        loadDocuments();
    }
}

// ===== Document Management =====
async function loadDocuments() {
    showLoading();

    try {
        // First, try to load from cache (fast)
        const cachedDocs = await ipcRenderer.invoke('get-cached-documents');
        allDocuments = cachedDocs;

        if (allDocuments && (allDocuments.gcf.length > 0 || allDocuments.policy.length > 0)) {
            // Cache has data, display it
            filterDocuments();
        } else {
            // No cache or empty, sync from server
            await syncWithServer();
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

function filterDocuments() {
    const category = categoryFilter.value;
    const searchTerm = searchFilter.value.toLowerCase().trim();

    // Get all documents
    let documents = [];
    
    if (category === 'all' || category === 'gcf') {
        documents = [...documents, ...allDocuments.gcf.map(doc => ({ ...doc, category: 'gcf' }))];
    }
    
    if (category === 'all' || category === 'policy') {
        documents = [...documents, ...allDocuments.policy.map(doc => ({ ...doc, category: 'policy' }))];
    }

    // Apply search filter
    if (searchTerm) {
        documents = documents.filter(doc => {
            const title = doc.title.toLowerCase();
            const description = doc.description.toLowerCase();
            return title.includes(searchTerm) || description.includes(searchTerm);
        });
    }

    filteredDocuments = documents;
    renderDocuments();
}

function renderDocuments() {
    if (filteredDocuments.length === 0) {
        showEmptyState();
        return;
    }

    documentsContainer.innerHTML = `
        <div class="documents-grid">
            ${filteredDocuments.map(doc => renderDocumentCard(doc)).join('')}
        </div>
    `;
}

function renderDocumentCard(doc) {
    const categoryLabel = doc.category === 'gcf' ? 'GCF Document' : 'Policy & Regulation';
    const categoryColor = doc.category === 'gcf' ? 'var(--color-primary)' : 'var(--color-secondary)';
    const description = doc.description || `PDF document from the ${doc.category === 'gcf' ? 'GCF' : 'Policy'} collection.`;

    return `
        <div class="document-card">
            <div class="document-header">
                <span class="document-category" style="background: ${categoryColor}">${categoryLabel}</span>
                <h3 class="document-title">${escapeHtml(doc.title)}</h3>
                <div class="document-meta">${doc.date || 'No date'} • ${doc.size || 'Unknown size'}</div>
            </div>
            <div class="document-body">
                <p class="document-description">${escapeHtml(description)}</p>
                <div class="document-footer">
                    <button class="btn btn-primary" onclick="openPdf('${escapeHtml(doc.file)}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        Open PDF
                    </button>
                    <button class="btn btn-secondary" onclick="downloadPdf('${escapeHtml(doc.file)}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download
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

async function downloadPdf(filePath) {
    try {
        const result = await ipcRenderer.invoke('check-pdf-exists', filePath);
        
        if (!result.exists) {
            alert('PDF file not found.');
            return;
        }

        // Trigger download (same as opening, user can save from PDF viewer)
        await openPdf(filePath);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF. Please try again.');
    }
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
            allDocuments = cachedDocs;

            // Show success message first
            if (result.stage === 'complete' && result.total > 0) {
                showSyncSuccess(result.downloaded, result.failed, result.message);
                // Auto-dismiss success message and show documents after 2 seconds
                setTimeout(() => {
                    filterDocuments();
                }, 2000);
            } else if (result.total === 0) {
                showSyncInfo(result.message);
                // Auto-dismiss info message and show documents after 2 seconds
                setTimeout(() => {
                    filterDocuments();
                }, 2000);
            } else {
                // Immediately show documents if no special message needed
                filterDocuments();
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
    documentsContainer.innerHTML = `
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
    const isSuccess = failed === 0;

    documentsContainer.innerHTML = `
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
            <button class="btn btn-primary" style="margin-top: var(--spacing-lg); max-width: 200px;" onclick="filterDocuments()">
                View Documents
            </button>
        </div>
    `;
}

function showSyncInfo(message) {
    documentsContainer.innerHTML = `
        <div class="sync-result-container sync-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <h3>Sync Info</h3>
            <p>${escapeHtml(message)}</p>
            <button class="btn btn-primary" style="margin-top: var(--spacing-lg); max-width: 200px;" onclick="filterDocuments()">
                View Documents
            </button>
        </div>
    `;
}

function showSyncError(message) {
    documentsContainer.innerHTML = `
        <div class="sync-result-container sync-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <h3>Sync Failed</h3>
            <p>${escapeHtml(message)}</p>
            <p class="sync-retry-hint">Click Refresh to try again.</p>
            <button class="btn btn-primary" style="margin-top: var(--spacing-lg); max-width: 200px;" onclick="filterDocuments()">
                View Documents
            </button>
        </div>
    `;
}

// ===== UI States =====
function showLoading() {
    documentsContainer.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading documents...</p>
        </div>
    `;
}

function showEmptyState() {
    documentsContainer.innerHTML = `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <h3>No documents found</h3>
            <p>Try adjusting your filters or search terms.</p>
        </div>
    `;
}

function showError(message) {
    documentsContainer.innerHTML = `
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
categoryFilter.addEventListener('change', filterDocuments);
searchFilter.addEventListener('input', debounce(filterDocuments, 300));

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
