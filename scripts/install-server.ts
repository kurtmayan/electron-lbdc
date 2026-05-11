import { execSync, ExecSyncOptions } from "child_process";
import path from "path";

const isWindows = process.platform === "win32";
const shell = isWindows ? "cmd.exe" : "/bin/sh";
const python = isWindows ? "python" : "python3";
const pipPython = isWindows
  ? ".venv\\Scripts\\python.exe"
  : ".venv/bin/python3";

const options: ExecSyncOptions = {
  cwd: path.join(__dirname, "../server"),
  stdio: "inherit",
  shell,
};

execSync(`${python} -m venv .venv`, options);
execSync(`${pipPython} -m pip install -r requirements.txt`, options);
