const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);

let mainWindow;

// Handle paths correctly for both development and production
const isDev = !app.isPackaged;
// When using asar, unpacked files are in app.asar.unpacked
const appPath = isDev ? __dirname : path.join(process.resourcesPath, 'app.asar.unpacked');
const CACHE_FILE = path.join(appPath, 'data', 'cache.json');

console.log('App starting...');
console.log('isDev:', isDev);
console.log('__dirname:', __dirname);
console.log('appPath:', appPath);
console.log('process.resourcesPath:', process.resourcesPath);

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

// Log unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});