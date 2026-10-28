from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
DEFAULT_FRONTEND_PORT = 5174
BACKEND_HOST = "127.0.0.1"
DEFAULT_BACKEND_PORT = 8000
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


def backend_base_url(port: int) -> str:
    return f"http://{BACKEND_HOST}:{port}"


def backend_health_url(port: int) -> str:
    return f"{backend_base_url(port)}/api/health"


def start_backend(port: int) -> subprocess.Popen[bytes]:
    return subprocess.Popen(
        [backend_python(), "-m", "uvicorn", "app.main:app", "--host", BACKEND_HOST, "--port", str(port)],
        cwd=BACKEND_DIR,
    )


def start_frontend(port: int, api_url: str) -> subprocess.Popen[bytes]:
    frontend_env = os.environ.copy()
    frontend_env["VITE_JD_ANALYTICS_API_URL"] = api_url
    if os.name == "nt":
        npm_command = shutil.which("npm.cmd") or shutil.which("npm")
        if not npm_command:
            raise RuntimeError("npm was not found. Install Node.js/npm and try again.")
        command = f'"{npm_command}" run dev -- --host 127.0.0.1 --port {port} --strictPort'
        return subprocess.Popen(command, cwd=ROOT, shell=True, env=frontend_env)

    npm_command = shutil.which("npm")
    if not npm_command:
        raise RuntimeError("npm was not found. Install Node.js/npm and try again.")
    return subprocess.Popen(
        [npm_command, "run", "dev", "--", "--host", "127.0.0.1", "--port", str(port), "--strictPort"],
        cwd=ROOT,
        env=frontend_env,
    )


def responds(url: str) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=0.5) as response:
            return 200 <= response.status < 400
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def backend_supports_profile_assessments(port: int) -> bool:
    try:
        with urllib.request.urlopen(f"{backend_base_url(port)}/openapi.json", timeout=2) as response:
            schema = json.loads(response.read().decode("utf-8"))
        paths = schema.get("paths", {})
        required_paths = (
            "/api/profile-assessment/interview/question",
            "/api/profile-assessment/interview/evaluate",
            "/api/profile-assessment/sprint/challenge",
        )
        return all(path in paths for path in required_paths)
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, TypeError):
        return False


def port_is_in_use(port: int) -> bool:
    if os.name == "nt":
        # Windows may deny loopback probes in restricted shells, so inspect
        # the TCP listener table before attempting to bind the chosen port.
        try:
            result = subprocess.run(
                ["netstat", "-ano", "-p", "tcp"],
                capture_output=True,
                text=True,
                check=False,
            )
            for line in result.stdout.splitlines():
                columns = line.split()
                if len(columns) >= 4 and columns[0].upper() == "TCP":
                    local_address, state = columns[1], columns[3].upper()
                    if state == "LISTENING" and local_address.rsplit(":", 1)[-1] == str(port):
                        return True
        except OSError:
            pass
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.5):
            return True
    except OSError:
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
        print("Note: backend/.env is missing. JD Analytics needs OPENROUTER_API_KEY; resume parsing can still use local heuristics.")

    processes: list[tuple[str, subprocess.Popen[bytes], str]] = []
    try:
        backend_port = DEFAULT_BACKEND_PORT
        existing_backend = responds(backend_health_url(backend_port)) and backend_supports_profile_assessments(backend_port)
        if existing_backend:
            print("An up-to-date backend is already running; reusing it.")
        else:
            if port_is_in_use(backend_port):
                print("Port 8000 has an older backend or another service. Starting the updated backend on a free nearby port.")
                backend_port = next((port for port in range(DEFAULT_BACKEND_PORT + 1, DEFAULT_BACKEND_PORT + 11) if not port_is_in_use(port)), 0)
                if not backend_port:
                    print("No free backend port was found between 8001 and 8010.", file=sys.stderr)
                    return 1
            backend = start_backend(backend_port)
            processes.append(("Backend", backend, backend_health_url(backend_port)))
        frontend_port = next((port for port in range(DEFAULT_FRONTEND_PORT, DEFAULT_FRONTEND_PORT + 11) if not port_is_in_use(port)), 0)
        if not frontend_port:
            print(f"No free frontend port was found between {DEFAULT_FRONTEND_PORT} and {DEFAULT_FRONTEND_PORT + 10}.", file=sys.stderr)
            return 1
        if frontend_port != DEFAULT_FRONTEND_PORT:
            print(f"The default frontend port {DEFAULT_FRONTEND_PORT} is already in use. Starting the updated website on port {frontend_port}.")
        frontend_url = f"http://127.0.0.1:{frontend_port}"
        frontend = start_frontend(frontend_port, backend_base_url(backend_port))
        processes.append(("Frontend", frontend, frontend_url))
        if not wait_until_ready(processes):
            return 1
        print(f"\nRADIX Talent Match is running at {frontend_url}")
        print("Press Ctrl+C to stop the frontend and backend.")
        webbrowser.open(frontend_url)
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
