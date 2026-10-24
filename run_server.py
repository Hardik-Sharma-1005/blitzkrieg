"""
RADIX Talent Match Hackathon - Launch Role 2 Resume Parsing API Server.
Run: python run_server.py
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import uvicorn

if __name__ == "__main__":
    print("=" * 70)
    print("Starting RADIX Role 2 (Resume Parsing) API Server...")
    print("Server URL : http://127.0.0.1:8000")
    print("Swagger UI : http://127.0.0.1:8000/docs")
    print("Endpoint   : POST /api/parse-resume")
    print("=" * 70)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True, app_dir=BACKEND_DIR)
