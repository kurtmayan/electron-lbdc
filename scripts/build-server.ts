import { execSync, ExecSyncOptions } from "child_process";
import path from "path";

const isWindows = process.platform === "win32";
const shell = isWindows ? "cmd.exe" : "/bin/sh";
const pyInstaller = isWindows
  ? ".venv\\Scripts\\pyinstaller.exe"
  : ".venv/bin/pyinstaller";

const options: ExecSyncOptions = {
  cwd: path.join(__dirname, "../server"),
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
  `${pyInstaller} --onefile --windowed ${hiddenImports} --name lbdc_server app/main.py`,
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
