import { app, BrowserWindow } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { spawn, ChildProcess, exec } from "child_process";
import fs from "fs";
import express from "express";
import { Server } from "http";

let expressServer: Server | null = null;

let backendProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

const FRONTEND_PORT = 4173; // vite preview default port
const BACKEND_PORT = 8000;

/**
 * Check if users and biometric devices already exist in the database
 */
async function checkDatabaseSetup(): Promise<boolean> {
  return new Promise((resolve) => {
    const pythonScript = `
import sys
sys.path.insert(0, '${path.join(app.getAppPath(), "server").replace(/\\/g, "\\\\")}')

try:
    from app.core.database import SessionLocal
    from app.core.models import BiometricInformation, User
    
    db = SessionLocal()
    user_exists = db.query(User).first() is not None
    biometric_exists = db.query(BiometricInformation).first() is not None
    db.close()
    
    if user_exists and biometric_exists:
        print('READY')
    else:
        print('SETUP_NEEDED')
except Exception as e:
    print('ERROR')
`;

    const python = spawn("python", ["-c", pythonScript], {
      cwd: path.join(app.getAppPath(), "server"),
    });

    let output = "";

    python.stdout.on("data", (data) => {
      output += data.toString().trim();
    });

    python.on("close", (code) => {
      resolve(output.includes("READY"));
    });

    python.on("error", () => {
      resolve(false);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      python.kill();
      resolve(false);
    }, 5000);
  });
}

/**
 * STEP 1: start FastAPI backend ONLY
 */
function startBackend(showWindow: boolean = true) {
  console.log("==============================");
  console.log("STEP 1: Starting backend...");

  const exePath = fs.existsSync(
    path.join(process.resourcesPath, "lbdc_server.exe"),
  )
    ? path.join(process.resourcesPath, "lbdc_server.exe")
    : path.join(app.getAppPath(), "server/dist/lbdc_server.exe");

  console.log("Backend path:", exePath);
  console.log("File exists:", fs.existsSync(exePath));
  console.log("Show window:", showWindow);

  if (!fs.existsSync(exePath)) {
    throw new Error(`Backend EXE not found: ${exePath}`);
  }

  if (showWindow) {
    // Show terminal window for setup
    backendProcess = spawn(
      "cmd.exe",
      ["/c", "start", "cmd.exe", "/k", exePath],
      {
        cwd: path.dirname(exePath),
        shell: false,
      },
    );
  } else {
    // Run backend silently in background using start /b (Windows detached process)
    backendProcess = spawn("cmd.exe", ["/c", "start", "/b", exePath], {
      cwd: path.dirname(exePath),
      detached: true,
      windowsHide: true,
      stdio: "ignore",
    });
    backendProcess?.unref();
  }

  backendProcess?.on("error", (err) => console.error("❌ Backend error:", err));
  backendProcess?.on("exit", (code) => console.log("⚠️ Backend exited:", code));

  console.log("STEP 1 DONE");
}

/**
 * STEP 2: start frontend
 *
 * - DEV (not packaged):  spawn `vite preview` inside front-end-client/
 *                        (make sure you've run `vite build` first)
 * - PROD (packaged EXE): same thing but cwd points to the bundled copy
 *                        inside resources/front-end-client/
 */
function startFrontend() {
  console.log("==============================");
  console.log("STEP 2: Starting frontend...");

  const distPath = app.isPackaged
    ? path.join(process.resourcesPath, "dist") // ✅ matches extraResource output
    : path.join(app.getAppPath(), "./client/dist");

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

  expressServer = server.listen(FRONTEND_PORT, () => {
    console.log(`✔ Frontend served at http://localhost:${FRONTEND_PORT}`);
  });

  console.log("STEP 2 DONE");
}

/**
 * STEP 3: wait for a port to be ready
 */
async function waitForPort(port: number) {
  console.log(`Waiting for port ${port}...`);

  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.ok || res.status < 500) {
        console.log(`✔ port ${port} ready`);
        return;
      }
    } catch {
      // not ready yet
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error(`Port ${port} failed to start after 30 seconds`);
}

/**
 * STEP 4: open window
 */
function createWindow() {
  console.log("==============================");
  console.log("STEP 4: creating window...");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    icon: path.join(__dirname, "../resources/icon.ico"),
  });

  mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);

  // Open DevTools in dev mode
  // if (!app.isPackaged) {
  //   mainWindow.webContents.openDevTools();
  // }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

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
      // Setup needed - show terminal with CLI
      console.log("Database setup needed - showing CLI terminal");
      startBackend(true);
      await waitForPort(BACKEND_PORT);
    } else {
      // Setup already complete - run backend silently
      console.log("✔ Database already set up, starting backend silently");
      startBackend(false);
      await waitForPort(BACKEND_PORT);
    }

    startFrontend();
    await waitForPort(FRONTEND_PORT);
    createWindow();
  } catch (err) {
    console.error("Boot failed:", err);
    app.quit();
  }
}

if (started) {
  app.quit();
}

app.on("ready", boot);

/**
 * Cleanup — kill all child processes on exit
 */
function killAll() {
  if (expressServer) {
    expressServer.close();
    expressServer = null;
  }

  if (backendProcess?.pid) {
    try {
      exec(`taskkill /PID ${backendProcess.pid} /T /F`);
    } catch {
      // Process might already be dead
    }
    backendProcess = null;
  }

  // Also kill any lbdc_server processes
  exec(`taskkill /IM lbdc_server.exe /T /F 2>nul`, { shell: "cmd.exe" });
  exec(`taskkill /IM main.exe /T /F 2>nul`, { shell: "cmd.exe" });
}

app.on("window-all-closed", () => {
  killAll();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  killAll();
});
