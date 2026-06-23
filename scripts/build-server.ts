import { execSync, ExecSyncOptions } from "child_process";
import fs from "fs";
import path from "path";

const isWindows = process.platform === "win32";
const shell = isWindows ? "cmd.exe" : "/bin/sh";
const pyInstaller = isWindows
  ? ".venv\\Scripts\\pyinstaller.exe"
  : ".venv/bin/pyinstaller";
const serverDir = path.join(__dirname, "../server");
const privateKeyRelativePath = path.join("keys", "lbdc_private_key.pem");
const privateKeyPath = path.join(serverDir, privateKeyRelativePath);
const addDataSeparator = isWindows ? ";" : ":";
const privateKeyData = `--add-data "${privateKeyRelativePath}${addDataSeparator}keys"`;

if (!fs.existsSync(privateKeyPath)) {
  console.error(
    `Missing private key: ${privateKeyPath}\n` +
      "Place lbdc_private_key.pem in server/keys before running npm run build:server.",
  );
  process.exit(1);
}

const options: ExecSyncOptions = {
  cwd: serverDir,
  stdio: "inherit",
  shell,
};

const hiddenImports = [
  "uvicorn.logging",
  "uvicorn.loops",
  "uvicorn.loops.auto",
  "uvicorn.protocols",
  "uvicorn.protocols.http",
  "uvicorn.protocols.http.auto",
  "uvicorn.protocols.websockets",
  "uvicorn.protocols.websockets.auto",
  "uvicorn.lifespan",
  "uvicorn.lifespan.on",
]
  .map((i) => `--hidden-import=${i}`)
  .join(" ");

execSync(
  `${pyInstaller} --onefile ${hiddenImports} ${privateKeyData} --name lbdc_server app/main.py`,
  options,
);

// Copy .env to dist
const src = path.join(__dirname, "../server/.env");
const dest = path.join(__dirname, "../server/dist/.env");

if (isWindows) {
  execSync(`copy "${src}" "${dest}"`, { shell });
} else {
  execSync(`cp "${src}" "${dest}"`, { shell });
}
