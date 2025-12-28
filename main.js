const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const https = require('https');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);

let mainWindow;

// Handle paths correctly for both development and production
const isDev = !app.isPackaged;
// When using asar, unpacked files are in app.asar.unpacked
const appPath = isDev ? __dirname : path.join(process.resourcesPath, 'app.asar.unpacked');
const CACHE_FILE = path.join(appPath, 'data', 'cache.json');

// Hardcoded server configuration
const SERVER_BASE_URL = 'http://192.168.1.9:8000';
const MANIFEST_URL = `${SERVER_BASE_URL}/manifest.json`;
const REQUEST_TIMEOUT = 30000; // 30 seconds

console.log('App starting...');
console.log('isDev:', isDev);
console.log('__dirname:', __dirname);
console.log('appPath:', appPath);
console.log('process.resourcesPath:', process.resourcesPath);
console.log('Server URL:', SERVER_BASE_URL);

function createWindow() {
  console.log('Creating window...');
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    show: false, // Don't show until ready
    center: true, // Center on screen
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      enableRemoteModule: false
    },
    autoHideMenuBar: true,
    title: 'Readiness Eritrea - National Designated Authority',
    backgroundColor: '#f5f3ef'
  });

  // Use path.join to ensure correct path in both dev and production
  const indexPath = path.join(__dirname, 'index.html');
  console.log('Loading index.html from:', indexPath);
  console.log('File exists:', fs.existsSync(indexPath));
  
  mainWindow.loadFile(indexPath)
    .then(() => {
      console.log('loadFile succeeded');
    })
    .catch(err => {
      console.error('loadFile failed:', err);
      mainWindow.show(); // Show window even on error
    });

  // Fallback: Show window after 3 seconds if it hasn't loaded
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('Window not visible after 3 seconds, forcing show');
      mainWindow.show();
      mainWindow.focus();
    }
  }, 3000);

  // Debug: log window events
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully');
    mainWindow.show(); // Show window after content is loaded
    mainWindow.focus(); // Bring window to front
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Window failed to load:', errorCode, errorDescription);
    mainWindow.show(); // Show the window anyway
    // Show error in window
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #1a1a1a;
            color: white;
          }
          .error-box {
            background: #2d2d2d;
            padding: 40px;
            border-radius: 8px;
            text-align: center;
            max-width: 500px;
          }
          h1 { color: #e74c3c; }
          code { background: #3d3d3d; padding: 10px; border-radius: 4px; display: block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>Loading Failed</h1>
          <p>Could not load index.html</p>
          <p><strong>Error Code:</strong> ${errorCode}</p>
          <p><strong>Description:</strong> ${errorDescription}</p>
          <code>Path: ${indexPath}</code>
          <code>__dirname: ${__dirname}</code>
          <code>Exists: ${fs.existsSync(indexPath)}</code>
        </div>
      </body>
      </html>
    `));
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('Window crashed!');
  });

  mainWindow.on('unresponsive', () => {
    console.error('Window is unresponsive!');
  });
  
  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Force show window after creation (backup)
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready-to-show event fired');
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  console.log('App is ready');
  
  // Create necessary folders and data directory
  createDirectories();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Create required directories if they don't exist
function createDirectories() {
  const docsPath = path.join(appPath, 'docs');
  const gcfPath = path.join(docsPath, 'gcf');
  const policyPath = path.join(docsPath, 'policy');
  const dataPath = path.join(appPath, 'data');
  const assetsPath = path.join(appPath, 'assets');

  const directories = [docsPath, gcfPath, policyPath, dataPath, assetsPath];

  directories.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('Created directory:', dir);
      }
    } catch (err) {
      console.error('Error creating directory:', dir, err);
    }
  });
}

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for file operations

// Open PDF file
ipcMain.handle('open-pdf', async (event, filePath) => {
  try {
    const fullPath = path.join(appPath, 'docs', filePath);
    
    console.log('Opening PDF:', fullPath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error('PDF file not found:', fullPath);
      return { success: false, error: 'File not found' };
    }

    // Open PDF in default PDF viewer
    const result = await shell.openPath(fullPath);
    
    if (result) {
      console.error('Error opening PDF:', result);
      return { success: false, error: result };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error opening PDF:', error);
    return { success: false, error: error.message };
  }
});

// Check if PDF exists
ipcMain.handle('check-pdf-exists', async (event, filePath) => {
  try {
    const fullPath = path.join(appPath, 'docs', filePath);
    const exists = fs.existsSync(fullPath);
    console.log('Check PDF exists:', fullPath, exists);
    return { exists };
  } catch (error) {
    console.error('Error checking PDF:', error);
    return { exists: false };
  }
});

// Get cached documents (for initial load)
ipcMain.handle('get-cached-documents', async () => {
  try {
    console.log('Reading cache from:', CACHE_FILE);
    
    // Check if cache exists
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = await readFile(CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(cacheData);
      console.log('Cache loaded:', parsed);
      return parsed;
    }

    console.log('No cache file found');
    // No cache yet, return empty
    return { gcf: [], policy: [] };
  } catch (error) {
    console.error('Error reading cache:', error);
    return { gcf: [], policy: [] };
  }
});

// Scan docs folder for PDFs automatically and save to cache
ipcMain.handle('scan-documents', async () => {
  try {
    const docsPath = path.join(appPath, 'docs');
    const gcfPath = path.join(docsPath, 'gcf');
    const policyPath = path.join(docsPath, 'policy');

    console.log('Scanning documents from:', docsPath);

    const documents = {
      gcf: [],
      policy: []
    };

    const scanDirectory = async (dirPath, category) => {
      if (!fs.existsSync(dirPath)) {
        console.log('Directory does not exist:', dirPath);
        return;
      }

      const files = await readdir(dirPath, { withFileTypes: true });
      console.log(`Found ${files.length} files in ${dirPath}`);

      for (const file of files) {
        if (file.isFile() && file.name.toLowerCase().endsWith('.pdf')) {
          const filePath = path.join(dirPath, file.name);
          const stats = fs.statSync(filePath);

          // Format file size
          const formatFileSize = (bytes) => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
          };

          // Generate display name from filename
          const displayName = file.name
            .replace(/\.pdf$/i, '')
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

          documents[category].push({
            id: `${category}-${file.name}`,
            title: displayName,
            description: '', // Auto-detected, no description
            file: path.relative(docsPath, filePath).replace(/\\/g, '/'),
            size: formatFileSize(stats.size),
            date: stats.mtime.toISOString().split('T')[0]
          });
        }
      }
    };

    await scanDirectory(gcfPath, 'gcf');
    await scanDirectory(policyPath, 'policy');

    console.log('Scanned documents:', documents);

    // Save to cache
    await writeFile(CACHE_FILE, JSON.stringify(documents, null, 2), 'utf-8');
    console.log('Cache saved to:', CACHE_FILE);

    return { success: true, documents };
  } catch (error) {
    console.error('Error scanning documents:', error);
    return { success: false, error: error.message, documents: { gcf: [], policy: [] } };
  }
});

// Handle page navigation
ipcMain.handle('navigate-to', async (event, page) => {
  if (mainWindow) {
    mainWindow.webContents.send('page-change', page);
  }
  return { success: true };
});

// ===== Remote Server Sync Handlers =====

// Fetch manifest from remote server
async function fetchManifest() {
  try {
    console.log('Fetching manifest from:', MANIFEST_URL);

    const response = await fetch(MANIFEST_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const manifest = await response.json();

    // Validate manifest structure
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('Invalid manifest format: not an object');
    }

    if (!Array.isArray(manifest.gcf)) {
      throw new Error('Invalid manifest format: gcf is not an array');
    }

    if (!Array.isArray(manifest.policy)) {
      throw new Error('Invalid manifest format: policy is not an array');
    }

    console.log('Manifest fetched successfully:', manifest);
    return { success: true, manifest };
  } catch (error) {
    console.error('Error fetching manifest:', error);
    return { success: false, error: error.message };
  }
}

// Format file size for display
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Generate display name from filename
function generateDisplayName(filename) {
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Compare remote files with local cache to determine what needs downloading
function compareFiles(manifest, localCache) {
  const toDownload = [];
  const localGcf = localCache.gcf || [];
  const localPolicy = localCache.policy || [];

  // Build lookup maps for local files
  const localGcfMap = new Map(localGcf.map(doc => [doc.file, doc]));
  const localPolicyMap = new Map(localPolicy.map(doc => [doc.file, doc]));

  // Check GCF files
  manifest.gcf.forEach(file => {
    const localFile = localGcfMap.get(`gcf/${file.name}`);
    const needsDownload = !localFile || localFile.syncStatus === 'failed' ||
                          new Date(file.modified) > new Date(localFile.remoteModified || localFile.date);

    if (needsDownload) {
      toDownload.push({
        category: 'gcf',
        name: file.name,
        size: file.size,
        modified: file.modified,
        url: `${SERVER_BASE_URL}/docs/gcf/${file.name}`,
        localPath: path.join(appPath, 'docs', 'gcf', file.name),
        relativePath: `gcf/${file.name}`,
        reason: !localFile ? 'new' : (localFile.syncStatus === 'failed' ? 'retry' : 'updated')
      });
    }
  });

  // Check Policy files
  manifest.policy.forEach(file => {
    const localFile = localPolicyMap.get(`policy/${file.name}`);
    const needsDownload = !localFile || localFile.syncStatus === 'failed' ||
                          new Date(file.modified) > new Date(localFile.remoteModified || localFile.date);

    if (needsDownload) {
      toDownload.push({
        category: 'policy',
        name: file.name,
        size: file.size,
        modified: file.modified,
        url: `${SERVER_BASE_URL}/docs/policy/${file.name}`,
        localPath: path.join(appPath, 'docs', 'policy', file.name),
        relativePath: `policy/${file.name}`,
        reason: !localFile ? 'new' : (localFile.syncStatus === 'failed' ? 'retry' : 'updated')
      });
    }
  });

  return toDownload;
}

// Download a single file from the remote server
async function downloadFile(fileInfo, onProgress) {
  try {
    console.log('Downloading file:', fileInfo.name, 'from:', fileInfo.url);

    const response = await fetch(fileInfo.url, {
      method: 'GET',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : null;
    let downloadedBytes = 0;

    const chunks = [];
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      downloadedBytes += value.length;

      // Report progress
      if (onProgress && totalBytes) {
        const percent = Math.round((downloadedBytes / totalBytes) * 100);
        onProgress(fileInfo.name, percent);
      }
    }

    // Combine chunks and write to file
    const buffer = Buffer.concat(chunks);

    // Ensure directory exists
    const dir = path.dirname(fileInfo.localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('Created directory:', dir);
    }

    await writeFile(fileInfo.localPath, buffer);

    // Verify file was written
    if (!fs.existsSync(fileInfo.localPath)) {
      throw new Error('File was not written successfully');
    }

    const stats = fs.statSync(fileInfo.localPath);

    console.log('File downloaded successfully:', fileInfo.name, 'Size:', stats.size, 'bytes');

    return {
      success: true,
      size: stats.size,
      displayName: generateDisplayName(fileInfo.name),
      date: stats.mtime.toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Error downloading file:', fileInfo.name, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Update cache with downloaded file info
function updateCacheWithFile(cache, category, fileInfo, downloadResult) {
  const categoryArray = cache[category];
  if (!categoryArray) {
    console.error('Invalid category:', category);
    return cache;
  }

  // Find existing file in cache or create new entry
  const existingIndex = categoryArray.findIndex(doc => doc.file === fileInfo.relativePath);

  const docEntry = {
    id: `${category}-${fileInfo.name}`,
    title: downloadResult.displayName,
    description: '',
    file: fileInfo.relativePath,
    size: formatFileSize(downloadResult.size),
    date: downloadResult.date,
    remoteModified: fileInfo.modified,
    syncStatus: 'success'
  };

  if (existingIndex >= 0) {
    categoryArray[existingIndex] = docEntry;
  } else {
    categoryArray.push(docEntry);
  }

  return cache;
}

// Sync with remote server
ipcMain.handle('sync-remote-documents', async (event) => {
  console.log('=== Starting remote document sync ===');

  try {
    // Step 1: Fetch manifest
    const manifestResult = await fetchManifest();

    if (!manifestResult.success) {
      return {
        success: false,
        stage: 'fetch-manifest',
        error: manifestResult.error,
        message: `Failed to fetch manifest: ${manifestResult.error}`
      };
    }

    // Step 2: Load current cache
    let localCache;
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const cacheData = await readFile(CACHE_FILE, 'utf-8');
        localCache = JSON.parse(cacheData);
        console.log('Local cache loaded');
      } else {
        localCache = { gcf: [], policy: [] };
        console.log('No local cache, starting fresh');
      }
    } catch (error) {
      console.error('Error loading cache, starting fresh:', error);
      localCache = { gcf: [], policy: [] };
    }

    // Step 3: Compare and determine what to download
    const toDownload = compareFiles(manifestResult.manifest, localCache);

    if (toDownload.length === 0) {
      console.log('All documents are up to date');
      return {
        success: true,
        stage: 'complete',
        message: 'All documents are up to date',
        downloaded: 0,
        failed: 0,
        total: 0
      };
    }

    console.log(`Found ${toDownload.length} files to download`);

    // Send initial status to renderer
    if (mainWindow) {
      mainWindow.webContents.send('sync-status', {
        stage: 'downloading',
        total: toDownload.length,
        current: 0,
        file: '',
        percent: 0
      });
    }

    // Step 4: Download files one by one
    let downloaded = 0;
    let failed = 0;

    for (let i = 0; i < toDownload.length; i++) {
      const fileInfo = toDownload[i];

      console.log(`[${i + 1}/${toDownload.length}] Downloading:`, fileInfo.name);

      // Update status before download
      if (mainWindow) {
        mainWindow.webContents.send('sync-status', {
          stage: 'downloading',
          total: toDownload.length,
          current: i + 1,
          file: fileInfo.name,
          percent: 0
        });
      }

      const downloadResult = await downloadFile(fileInfo, (filename, percent) => {
        // Send progress updates
        if (mainWindow) {
          mainWindow.webContents.send('sync-progress', {
            file: filename,
            percent: percent
          });
        }
      });

      if (downloadResult.success) {
        console.log('Download successful:', fileInfo.name);
        downloaded++;

        // Update cache with downloaded file info
        localCache = updateCacheWithFile(localCache, fileInfo.category, fileInfo, downloadResult);
      } else {
        console.error('Download failed:', fileInfo.name, downloadResult.error);
        failed++;

        // Mark file as failed in cache for retry
        const categoryArray = localCache[fileInfo.category];
        const existingIndex = categoryArray.findIndex(doc => doc.file === fileInfo.relativePath);

        if (existingIndex >= 0) {
          categoryArray[existingIndex].syncStatus = 'failed';
        } else {
          categoryArray.push({
            id: `${fileInfo.category}-${fileInfo.name}`,
            title: generateDisplayName(fileInfo.name),
            description: '',
            file: fileInfo.relativePath,
            size: formatFileSize(fileInfo.size),
            date: new Date(fileInfo.modified).toISOString().split('T')[0],
            remoteModified: fileInfo.modified,
            syncStatus: 'failed'
          });
        }
      }
    }

    // Step 5: Save updated cache
    localCache.lastSync = new Date().toISOString();
    await writeFile(CACHE_FILE, JSON.stringify(localCache, null, 2), 'utf-8');
    console.log('Cache updated and saved');

    // Send completion status
    if (mainWindow) {
      mainWindow.webContents.send('sync-complete', {
        downloaded,
        failed,
        total: toDownload.length
      });
    }

    console.log('=== Sync complete ===');
    console.log(`Downloaded: ${downloaded}, Failed: ${failed}, Total: ${toDownload.length}`);

    return {
      success: true,
      stage: 'complete',
      message: failed > 0
        ? `Synced ${downloaded} files, ${failed} failed. Click refresh to retry.`
        : `Successfully synced ${downloaded} files`,
      downloaded,
      failed,
      total: toDownload.length
    };
  } catch (error) {
    console.error('Sync error:', error);

    // Send error status
    if (mainWindow) {
      mainWindow.webContents.send('sync-error', {
        message: error.message
      });
    }

    return {
      success: false,
      stage: 'error',
      error: error.message,
      message: `Sync failed: ${error.message}`
    };
  }
});

// Log unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});