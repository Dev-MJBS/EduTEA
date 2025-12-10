# EduTEA PyVision

Desktop app that uses Python (OpenCV + MediaPipe + Flask-SocketIO) for hand tracking and gesture detection, and HTML/JS for the UI to control letters via wrist position and grasp.

## Features
- Camera capture via OpenCV
- Hand landmarks via MediaPipe Hands
- Grasp (closed fist) detection
- MJPEG video stream to frontend
- Low-latency gesture data via WebSocket (Flask-SocketIO)
- HTML/JS canvas for interactive letters

## Quick Start (macOS, zsh)

### 1) Create & activate virtualenv
```zsh
python3 -m venv .venv
source .venv/bin/activate
```

### 2) Install dependencies
```zsh
pip install -r requirements.txt
```

### 3) Run backend server
```zsh
python app.py
```
Server starts at `http://127.0.0.1:5000`. Open `http://127.0.0.1:5000/` in your browser.

## Packaging Options
- Electron (serve Flask locally; load HTML/JS in Electron)
- PyInstaller + PyWebView (embed a minimal browser)

See packaging notes at the end of this file.

## Project Structure
```
EduTEA_PyVision/
  app.py                 # Flask + SocketIO backend
  camera.py              # OpenCV + MediaPipe hands processing
  gestures.py            # Grasp detection helper
  requirements.txt       # Python dependencies
  static/
    script.js            # Frontend logic
  templates/
    index.html           # Frontend UI
  README.md
```

## Packaging Notes
- Electron: Create an Electron app that points to `http://127.0.0.1:5000/` or bundles the frontend and starts Python backend as a child process.
- PyInstaller: Use `pyinstaller --onefile app.py` and combine with `pywebview` to load `templates/index.html` and connect to the SocketIO endpoint.
# EduTEA
