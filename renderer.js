// ===== Global State =====
let currentPage = 'home';
let allDocuments = { gcf: [], policy: [] };
let filteredDocuments = [];

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
            // No cache or empty, scan fresh
            await refreshDocuments();
        }
    } catch (error) {
        console.error('Error loading documents:', error);
        showError('Failed to load documents. Please try again.');
    }
}

async function refreshDocuments() {
    showLoading();
    try {
        const result = await ipcRenderer.invoke('scan-documents');
        if (result.success) {
            allDocuments = result.documents;
            filterDocuments();
        } else {
            console.error('Error scanning documents:', result.error);
            showError('Failed to scan documents: ' + result.error);
        }
    } catch (error) {
        console.error('Error refreshing documents:', error);
        showError('Failed to refresh documents. Please try again.');
    }
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

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Renderer process started');
    initNavigation();
    console.log('Navigation initialized');
});
