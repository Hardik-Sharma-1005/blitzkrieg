from __future__ import annotations

import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_URL = "http://127.0.0.1:5173"
BACKEND_HEALTH_URL = "http://127.0.0.1:8000/api/health"
STARTUP_TIMEOUT_SECONDS = 30


def backend_python() -> str:
    windows_venv_python = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
    unix_venv_python = BACKEND_DIR / ".venv" / "bin" / "python"
    if windows_venv_python.is_file():
        interpreter = str(windows_venv_python)
    elif unix_venv_python.is_file():
        interpreter = str(unix_venv_python)
    else:
        interpreter = sys.executable

    version = subprocess.run(
        [interpreter, "-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    major, minor = (int(part) for part in version.split(".", maxsplit=1))
    if (major, minor) < (3, 12):
        raise RuntimeError(
            f"JD Analytics requires Python 3.12 or newer; the selected backend interpreter is {version}. "
            "Create backend/.venv with Python 3.12+ and install backend/requirements.txt there."
        )
    return interpreter


def start_backend() -> subprocess.Popen[bytes]:
    return subprocess.Popen(
        [backend_python(), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=BACKEND_DIR,
    )


def start_frontend() -> subprocess.Popen[bytes]:
    if os.name == "nt":
        npm_command = shutil.which("npm.cmd") or shutil.which("npm")
        if not npm_command:
            raise RuntimeError("npm was not found. Install Node.js/npm and try again.")
        command = f'"{npm_command}" run dev -- --host 127.0.0.1 --port 5173 --strictPort'
        return subprocess.Popen(command, cwd=ROOT, shell=True)

    npm_command = shutil.which("npm")
    if not npm_command:
        raise RuntimeError("npm was not found. Install Node.js/npm and try again.")
    return subprocess.Popen(
        [npm_command, "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173", "--strictPort"],
        cwd=ROOT,
    )


def responds(url: str) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=0.5) as response:
            return 200 <= response.status < 400
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def wait_until_ready(processes: list[tuple[str, subprocess.Popen[bytes], str]]) -> bool:
    deadline = time.monotonic() + STARTUP_TIMEOUT_SECONDS
    pending = {name: url for name, _, url in processes}
    while pending and time.monotonic() < deadline:
        for name, process, url in processes:
            if name not in pending:
                continue
            if process.poll() is not None:
                print(f"{name} exited during startup (code {process.returncode}).", file=sys.stderr)
                return False
            if responds(url):
                print(f"{name} is ready.")
                del pending[name]
        if pending:
            time.sleep(0.25)
    if pending:
        print(f"Timed out waiting for: {', '.join(pending)}.", file=sys.stderr)
        return False
    return True


def stop_process(process: subprocess.Popen[bytes]) -> None:
    if process.poll() is not None:
        return
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    else:
        process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()


def main() -> int:
    if not (ROOT / "node_modules").is_dir():
        print("Frontend packages are missing. Run `npm install` in the project folder first.", file=sys.stderr)
        return 1
    if not (BACKEND_DIR / ".env").is_file():
        print("Note: backend/.env is missing. Add OPENROUTER_API_KEY there before requesting an extraction.")

    processes: list[tuple[str, subprocess.Popen[bytes], str]] = []
    try:
        backend = start_backend()
        processes.append(("Backend", backend, BACKEND_HEALTH_URL))
        frontend = start_frontend()
        processes.append(("Frontend", frontend, FRONTEND_URL))
        if not wait_until_ready(processes):
            return 1
        print(f"\nRADIX Talent Match is running at {FRONTEND_URL}")
        print("Press Ctrl+C to stop the frontend and backend.")
        webbrowser.open(FRONTEND_URL)
        while True:
            for name, process, _ in processes:
                if process.poll() is not None:
                    print(f"{name} stopped (code {process.returncode}). Shutting down the other service.")
                    return process.returncode or 1
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nStopping the local website…")
        return 0
    except (OSError, RuntimeError) as exc:
        print(f"Could not start the local website: {exc}", file=sys.stderr)
        return 1
    finally:
        for _, process, _ in reversed(processes):
            stop_process(process)


if __name__ == "__main__":
    raise SystemExit(main())
