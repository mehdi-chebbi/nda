const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);

let mainWindow;
const CACHE_FILE = path.join(__dirname, 'data', 'cache.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      enableRemoteModule: false
    },
    autoHideMenuBar: true,
    title: 'Readiness Eritrea - National Designated Authority'
  });

  console.log('Loading index.html from:', __dirname);
  mainWindow.loadFile('index.html');

  // Debug: log window creation
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Window failed to load:', errorCode, errorDescription);
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
          code { background: #3d3d3d; padding: 10px; border-radius: 4px; display: block; }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>Loading Failed</h1>
          <p>Could not load index.html</p>
          <p><strong>Error Code:</strong> ${errorCode}</p>
          <p><strong>Description:</strong> ${errorDescription}</p>
          <p><strong>Path:</strong> ${__dirname}/index.html</p>
        </div>
      </body>
      </html>
    `));
  });
  
  // In production, open DevTools only if needed
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
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
  const docsPath = path.join(__dirname, 'docs');
  const gcfPath = path.join(docsPath, 'gcf');
  const policyPath = path.join(docsPath, 'policy');
  const dataPath = path.join(__dirname, 'data');
  const assetsPath = path.join(__dirname, 'assets');

  const directories = [docsPath, gcfPath, policyPath, dataPath, assetsPath];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('Created directory:', dir);
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for file operations

// Open PDF file
ipcMain.handle('open-pdf', async (event, filePath) => {
  try {
    const fullPath = path.join(__dirname, 'docs', filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: 'File not found' };
    }

    // Open PDF in default PDF viewer
    await shell.openPath(fullPath);
    return { success: true };
  } catch (error) {
    console.error('Error opening PDF:', error);
    return { success: false, error: error.message };
  }
});

// Check if PDF exists
ipcMain.handle('check-pdf-exists', async (event, filePath) => {
  try {
    const fullPath = path.join(__dirname, 'docs', filePath);
    return { exists: fs.existsSync(fullPath) };
  } catch (error) {
    console.error('Error checking PDF:', error);
    return { exists: false };
  }
});

// Get cached documents (for initial load)
ipcMain.handle('get-cached-documents', async () => {
  try {
    // Check if cache exists
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = await readFile(CACHE_FILE, 'utf-8');
      return JSON.parse(cacheData);
    }

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
    const docsPath = path.join(__dirname, 'docs');
    const gcfPath = path.join(docsPath, 'gcf');
    const policyPath = path.join(docsPath, 'policy');

    const documents = {
      gcf: [],
      policy: []
    };

    const scanDirectory = async (dirPath, category) => {
      if (!fs.existsSync(dirPath)) {
        return;
      }

      const files = await readdir(dirPath, { withFileTypes: true });

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

    // Save to cache
    await writeFile(CACHE_FILE, JSON.stringify(documents, null, 2), 'utf-8');

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
