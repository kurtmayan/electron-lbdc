import {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog,
  Tray,
  nativeTheme,
} from "electron";
import path from "node:path";
import { spawn, ChildProcess, spawnSync } from "child_process";
import fs from "fs";
import express from "express";
import { Server } from "http";
import { autoUpdater } from "electron-updater";

let expressServer: Server | null = null;

let backendProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isShuttingDown = false; // Flag to prevent multiple shutdown calls
let isQuitRequested = false;
let focusWindowWhenReady = false;
let runAtStartup = true;

// Update tracking
let updateAvailable = false;
let updateVersion = "";
let isDownloading = false;

const FRONTEND_HOST = "localhost";
const FRONTEND_PORT = 4173; // Keep stable so renderer localStorage/session persist.
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;
const BACKEND_HOST = "127.0.0.1";
const BACKEND_PORT = 63210;
const IS_WINDOWS = process.platform === "win32";
const EXECUTABLE_NAME = IS_WINDOWS ? "lbdc_server.exe" : "lbdc_server";
const BACKGROUND_ARG = "--background";
const BACKGROUND_SETTINGS_FILE = "background-settings.json";
const LIGHT_BACKGROUND_COLOR = "#ffffff";
const ICON_FILE_NAME = process.platform === "darwin" ? "icon.icns" : "icon.ico";
const ICON_PATH = app.isPackaged
  ? path.join(process.resourcesPath, "resources", ICON_FILE_NAME)
  : path.join(app.getAppPath(), "resources", ICON_FILE_NAME);
const shouldStartHidden = process.argv.includes(BACKGROUND_ARG);
const hasSingleInstanceLock = app.requestSingleInstanceLock();

nativeTheme.themeSource = "light";
nativeTheme.on("updated", () => {
  nativeTheme.themeSource = "light";
});

if (!hasSingleInstanceLock) {
  app.exit(0);
} else {
  app.on("second-instance", () => {
    focusMainWindow();
  });
}

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    focusWindowWhenReady = true;
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }

  mainWindow.focus();
}

function setupBackgroundBehavior() {
  if (tray) {
    return;
  }

  const canManageStartup = IS_WINDOWS && app.isPackaged;
  const settingsPath = path.join(
    app.getPath("userData"),
    BACKGROUND_SETTINGS_FILE,
  );

  const syncStartupPreference = () => {
    try {
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      fs.writeFileSync(
        settingsPath,
        JSON.stringify({ runAtStartup }, null, 2),
        "utf8",
      );
    } catch (error) {
      console.error("Failed to save background settings:", error);
    }

    if (!canManageStartup) {
      return;
    }

    try {
      app.setLoginItemSettings({
        openAtLogin: runAtStartup,
        path: process.execPath,
        args: [BACKGROUND_ARG],
        enabled: runAtStartup,
        name: app.getName(),
      });
    } catch (error) {
      console.error("Failed to update run-at-startup setting:", error);
    }
  };

  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8")) as {
        runAtStartup?: unknown;
      };

      if (typeof settings.runAtStartup === "boolean") {
        runAtStartup = settings.runAtStartup;
      }
    }
  } catch (error) {
    console.error("Failed to load background settings:", error);
  }

  syncStartupPreference();

  try {
    tray = new Tray(ICON_PATH);
    tray.setToolTip("Mr. DIY - LOCAL is running in the background.");
    tray.on("click", () => {
      focusMainWindow();
    });

    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "Open Mr. DIY - LOCAL",
          click: () => {
            focusMainWindow();
          },
        },
        { type: "separator" as const },
        {
          label: "Run at Startup",
          type: "checkbox" as const,
          checked: runAtStartup,
          enabled: canManageStartup,
          click: (menuItem) => {
            runAtStartup = menuItem.checked;
            syncStartupPreference();
          },
        },
        { type: "separator" as const },
        {
          label: "Quit",
          click: () => {
            isQuitRequested = true;
            app.quit();
          },
        },
      ]),
    );
  } catch (error) {
    console.error("Failed to create tray:", error);
  }
}

/**
 * Check if database already exists
 */
async function checkDatabaseSetup(): Promise<boolean> {
  const appDataDir = path.join(app.getPath("userData"), "data");
  const dbPath = path.join(appDataDir, "bdc.db");

  // If database file exists, setup is already done
  return fs.existsSync(dbPath);
}

/**
 * STEP 1: start FastAPI backend ONLY
 */
function startBackend(showWindow = true) {
  console.log("==============================");
  console.log("STEP 1: Starting backend...");

  // With electron-builder extraResources, files are copied as-is:
  // - server/dist/lbdc_server.exe -> resources/server/dist/lbdc_server.exe (Windows)
  // - server/dist/lbdc_server -> resources/server/dist/lbdc_server (macOS/Linux)
  // - client/dist -> resources/client/dist
  const exePath = app.isPackaged
    ? path.join(process.resourcesPath, "server", "dist", EXECUTABLE_NAME)
    : path.join(app.getAppPath(), "server", "dist", EXECUTABLE_NAME);

  console.log("Backend path:", exePath);
  console.log("File exists:", fs.existsSync(exePath));
  console.log("Show window:", showWindow);
  console.log("Platform:", IS_WINDOWS ? "Windows" : "macOS/Linux");

  if (!fs.existsSync(exePath)) {
    throw new Error(`Backend executable not found: ${exePath}`);
  }

  // Create AppData directory for database (writable location)
  const appDataDir = path.join(app.getPath("userData"), "data");
  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir, { recursive: true });
  }

  // Copy .env file to AppData so server can read it
  const envSource = app.isPackaged
    ? path.join(process.resourcesPath, "server", "dist", ".env")
    : path.join(app.getAppPath(), "server", "dist", ".env");
  const envDest = path.join(appDataDir, ".env");

  try {
    if (fs.existsSync(envSource)) {
      fs.copyFileSync(envSource, envDest);
      console.log("Copied .env to:", envDest);
    }
  } catch (err) {
    console.error("Failed to copy .env:", err);
  }

  console.log("Server working directory:", appDataDir);

  if (showWindow) {
    // Show terminal/console window for setup
    if (IS_WINDOWS) {
      // Windows: Show cmd.exe window
      backendProcess = spawn(
        "cmd.exe",
        ["/c", "start", "cmd.exe", "/k", exePath],
        {
          cwd: appDataDir,
          shell: false,
        },
      );
    } else {
      // macOS/Linux: Open in terminal
      backendProcess = spawn(exePath, [], {
        cwd: appDataDir,
        detached: false,
        stdio: "inherit", // Show output in console
        shell: false,
      });
    }
  } else {
    // Run backend silently in background
    backendProcess = spawn(exePath, [], {
      cwd: appDataDir,
      detached: false,
      windowsHide: IS_WINDOWS,
      stdio: "ignore",
      shell: false,
    });
  }

  backendProcess?.on("error", (err) => console.error("❌ Backend error:", err));
  backendProcess?.on("exit", (code) => console.log("⚠️ Backend exited:", code));

  console.log("STEP 1 DONE");
}

/**
 * STEP 2: start frontend
 *
 * Serve the built React app on a stable localhost origin. The fixed port keeps
 * renderer localStorage/session data available across app restarts.
 */
async function startFrontend(): Promise<string> {
  console.log("==============================");
  console.log("STEP 2: Starting frontend...");

  // extraResources copies client/dist to resources/client/dist
  const distPath = app.isPackaged
    ? path.join(process.resourcesPath, "client", "dist")
    : path.join(app.getAppPath(), "client", "dist");

  console.log("Frontend dist path:", distPath);

  if (!fs.existsSync(distPath)) {
    throw new Error(`dist/ not found at: ${distPath}. Run "vite build" first.`);
  }

  const server = express();
  server.use(express.static(distPath));

  // Fallback to index.html for client-side routing (React Router etc.)
  server.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  return new Promise((resolve, reject) => {
    const httpServer = server.listen(FRONTEND_PORT, FRONTEND_HOST);
    expressServer = httpServer;

    httpServer.once("error", (error) => {
      if (expressServer === httpServer) {
        expressServer = null;
      }

      reject(error);
    });

    httpServer.once("listening", () => {
      console.log(`✔ Frontend served at ${FRONTEND_URL}`);
      console.log("STEP 2 DONE");
      resolve(FRONTEND_URL);
    });
  });
}

/**
 * STEP 3: wait for backend to be ready
 */
async function waitForBackend() {
  const backendUrl = `http://${BACKEND_HOST}:${BACKEND_PORT}/`;

  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(backendUrl, { method: "GET" });
      const body = (await res.json().catch(() => null)) as {
        Hello?: string;
      } | null;

      if (res.ok && body?.Hello === "World") {
        console.log(`✔ backend ready at ${backendUrl}`);
        return;
      }
    } catch {
      // not ready yet
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`Backend failed to start at ${backendUrl} after 15 seconds`);
}

/**
 * STEP 3b: verify the frontend server is serving the React app
 */
async function waitForFrontend(frontendUrl: string) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(frontendUrl, { method: "GET" });
      const html = await res.text();

      if (res.ok && html.includes('id="root"') && html.includes("/assets/")) {
        console.log(`✔ frontend ready at ${frontendUrl}`);
        return;
      }
    } catch {
      // not ready yet
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`Frontend failed to start at ${frontendUrl} after 15 seconds`);
}

/**
 * Reset app and delete all data
 */
async function resetApp() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const result = await dialog.showMessageBox(mainWindow, {
      type: "warning",
      title: "Reset Application?",
      message:
        "This will delete all your data and reset the app to a fresh state.",
      detail:
        "This action cannot be undone. All application data and database information will be permanently deleted. The app will restart automatically.",
      buttons: ["Cancel", "Reset"],
    });

    if (result.response === 1) {
      try {
        // Kill backend process first
        if (backendProcess?.pid) {
          try {
            process.kill(backendProcess.pid, "SIGKILL");
          } catch (e) {
            console.log("Backend process kill failed:", e);
          }
        }

        // Delete application data
        const appDataDir = path.join(app.getPath("userData"), "data");
        if (fs.existsSync(appDataDir)) {
          fs.rmSync(appDataDir, { recursive: true, force: true });
          console.log("Application data reset:", appDataDir);
        }

        // Restart the app
        console.log("Reset complete, restarting app...");
        app.relaunch();
        app.exit(0);
      } catch (error) {
        console.error("Error during reset:", error);
        dialog.showMessageBox(mainWindow!, {
          type: "error",
          title: "Error",
          message: "Failed to reset the application.",
        });
      }
    }
  }
}

/**
 * Create application menu with Version tab
 */
function createMenu() {
  const appVersion = app.getVersion();

  const versionLabel = updateAvailable
    ? `Update to v${updateVersion}`
    : "Check for Updates";

  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Reset App",
          click: () => {
            resetApp();
          },
        },
        { type: "separator" as const },
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            isQuitRequested = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: "Version",
      submenu: [
        {
          label: `Current: v${appVersion}`,
          enabled: false,
        },
        { type: "separator" as const },
        {
          label: versionLabel,
          click: () => {
            if (updateAvailable && !isDownloading) {
              installUpdate().catch((err) => {
                console.error("Failed to install update:", err);
              });
            } else {
              checkForUpdates().catch((err) => {
                console.error("Failed to check for updates:", err);
              });
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(
    template as Electron.MenuItemConstructorOptions[],
  );
  Menu.setApplicationMenu(menu);
  console.log("Menu created with Version tab");
}

/**
 * Show "no updates available" dialog
 */
function showNoUpdatesDialog() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "No Updates Available",
      message: "You're using the newest version 🎉",
      detail: `Current version: ${app.getVersion()}`,
    });
  }
}

/**
 * Check for updates
 */
async function checkForUpdates() {
  try {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

    const result = await autoUpdater.checkForUpdates();

    // If no update info is returned, show "no update" message
    if (!result || !result.updateInfo || !result.updateInfo.version) {
      showNoUpdatesDialog();
    }
  } catch (error) {
    console.error("Error checking for updates:", error);
    showNoUpdatesDialog();
  }
}

/**
 * Install the update
 */
async function installUpdate() {
  try {
    isDownloading = true;
    await autoUpdater.downloadUpdate();
  } catch (error) {
    console.error("Error installing update:", error);
    isDownloading = false;
  }
}

/**
 * Initialize updater events
 */
function initializeUpdater() {
  autoUpdater.on("update-available", (info) => {
    updateAvailable = true;
    updateVersion = info.version;
    console.log(`Update available: ${info.version}`);

    if (mainWindow) {
      mainWindow.webContents.send("update-available", {
        version: info.version,
      });
    }

    // Update menu
    createMenu();

    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "Update Available",
        message: `Version ${info.version} is available.`,
        detail: "Click the Version menu to install the update.",
        buttons: ["Install Now", "Later"],
      });
    }
  });

  autoUpdater.on("update-not-available", () => {
    showNoUpdatesDialog();
  });

  autoUpdater.on("download-progress", () => {
    // Progress tracking (silent in production)
  });

  autoUpdater.on("update-downloaded", () => {
    isDownloading = false;

    if (mainWindow) {
      dialog
        .showMessageBox(mainWindow, {
          type: "info",
          title: "Update Ready",
          message: "Update has been downloaded successfully.",
          detail: "The application will now restart to install the update.",
          buttons: ["Restart Now"],
        })
        .then(() => {
          autoUpdater.quitAndInstall();
        });
    } else {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on("error", (error) => {
    console.error("Update error:", error);
    isDownloading = false;
    showNoUpdatesDialog();
  });

  // Setup IPC handlers
  ipcMain.handle("check-for-updates", async () => {
    await checkForUpdates();
  });

  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });
}

/**
 * STEP 4: open window
 */
function createWindow(frontendUrl: string) {
  console.log("==============================");
  console.log("STEP 4: creating window...");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    show: !shouldStartHidden || focusWindowWhenReady,
    backgroundColor: LIGHT_BACKGROUND_COLOR,
    icon: ICON_PATH,
  });

  mainWindow.loadURL(frontendUrl);

  // Open DevTools in dev mode
  // if (!app.isPackaged) {
  //   mainWindow.webContents.openDevTools();
  // }

  mainWindow.on("close", (event) => {
    if (isQuitRequested || isShuttingDown) {
      return;
    }

    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (focusWindowWhenReady) {
    focusWindowWhenReady = false;
    focusMainWindow();
  }

  // Initialize updater
  initializeUpdater();

  console.log("STEP 4 DONE");
}

/**
 * Full startup sequence
 */
async function boot() {
  try {
    // Check if database is already set up
    const isReady = await checkDatabaseSetup();

    if (!isReady) {
      // Setup needed - run backend in background
      console.log("Database setup needed - starting backend in background");
      startBackend(false);
      await waitForBackend();
    } else {
      // Setup already complete - run backend silently
      startBackend(false);
      await waitForBackend();
    }

    const frontendUrl = await startFrontend();
    await waitForFrontend(frontendUrl);
    createWindow(frontendUrl);
  } catch (err) {
    console.error("Boot failed:", err);
    killAllSync();
    process.exit(1);
  }
}

if (hasSingleInstanceLock) {
  app.on("ready", () => {
    nativeTheme.themeSource = "light";
    setupBackgroundBehavior();
    // Create menu immediately when app is ready
    createMenu();
    boot();
  });
}

// Handle any uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  killAllSync();
  process.exit(1);
});

/**
 * Cleanup — kill all child processes on exit (SYNCHRONOUS)
 */
function killAllSync() {
  console.log("Killing all child processes...");

  // Close express server first
  if (expressServer) {
    try {
      expressServer.close();
    } catch (e) {
      console.log("Express server already closed");
    }
    expressServer = null;
  }

  // Kill backend process by PID directly
  if (backendProcess?.pid) {
    try {
      console.log(`Killing backend process PID: ${backendProcess.pid}`);
      process.kill(backendProcess.pid, "SIGKILL");
    } catch (e) {
      console.log("Backend process kill failed:", e);
    }
    backendProcess = null;
  }

  // Also try to kill by executable name (platform-specific)
  if (IS_WINDOWS) {
    // Windows: Use taskkill
    try {
      console.log("Force killing lbdc_server.exe...");
      const result = spawnSync("taskkill", ["/IM", "lbdc_server.exe", "/F"], {
        shell: false,
        stdio: "ignore",
        timeout: 3000,
        windowsHide: true,
      });
      console.log("taskkill lbdc_server result:", result.status);
    } catch (e) {
      console.log("Taskkill lbdc_server failed:", e);
    }

    // Kill any main.exe processes (Electron app itself)
    try {
      console.log("Force killing main.exe...");
      spawnSync("taskkill", ["/IM", "main.exe", "/F"], {
        shell: false,
        stdio: "ignore",
        timeout: 3000,
        windowsHide: true,
      });
    } catch (e) {
      console.log("Taskkill main failed:", e);
    }
  } else {
    // macOS/Linux: Use pkill or kill
    try {
      console.log("Force killing lbdc_server...");
      spawnSync("pkill", ["-9", "lbdc_server"], {
        stdio: "ignore",
        timeout: 3000,
      });
    } catch (e) {
      console.log("pkill lbdc_server failed:", e);
    }
  }

  console.log("Cleanup complete");
}

if (hasSingleInstanceLock) {
  app.on("window-all-closed", () => {
    // Keep the process alive so the backend scheduler can continue running.
  });

  app.on("before-quit", (event) => {
    // Prevent default quit to ensure our cleanup runs
    if (!isShuttingDown) {
      event.preventDefault();
      isShuttingDown = true;

      console.log("App shutting down...");

      // Kill all processes synchronously - NO ASYNC/AWAIT
      killAllSync();

      console.log("Calling process.exit(0)...");
      // Use process.exit() for hard exit, not app.exit()
      process.exit(0);
    }
  });
}
