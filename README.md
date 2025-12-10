# EduTEA PyVision

Desktop & Web app that uses Python (OpenCV + MediaPipe + Flask-SocketIO) for hand tracking and gesture detection, and HTML/JS for the UI to control letters via wrist position and grasp.

## 🌐 Live Demo

**Frontend (GitHub Pages):** https://dev-mjbs.github.io/EduTEA/

> ⚠️ **Currently:** Frontend-only (backend needs to be deployed)  
> **See [DEPLOY.md](DEPLOY.md) for quick 3-step backend deployment on Render (free)**

## Features
- 📹 Camera capture via OpenCV
- ✋ Hand landmarks via MediaPipe Hands
- 👊 Grasp (closed fist) & pinch detection
- 🎥 MJPEG video stream to frontend
- ⚡ Low-latency gesture data via WebSocket (Flask-SocketIO)
- 🎮 HTML/JS canvas for interactive letters
- 🎊 Confetti celebration on word completion

## Quick Start (macOS/Linux, zsh/bash)

### 1) Clone & Setup virtualenv
```zsh
git clone https://github.com/Dev-MJBS/EduTEA.git
cd EduTEA/EduTEA_PyVision
python3 -m venv .venv
source .venv/bin/activate
```

### 2) Install dependencies
```zsh
pip install -r requirements.txt
```

### 3) Run backend server locally
```zsh
python app.py
```
Server starts at `http://127.0.0.1:5010/`. Open this URL in your browser.

### 4) (Optional) Run frontend from GitHub Pages
If you want to use the hosted frontend instead:
1. Make sure backend is running
2. Update backend URL in browser console or script (currently hardcoded to localhost)
3. Visit https://dev-mjbs.github.io/EduTEA/

## 🚀 Deployment

### Backend Deployment

#### Option 1: Render (Free tier, auto-sleep)
1. Push to GitHub
2. Go to [render.com](https://render.com)
3. Create Web Service → GitHub → select this repo
4. Set start command: `gunicorn --worker-class eventlet -w 1 app:app`
5. Deploy
6. Get URL: `https://your-service.onrender.com`

#### Option 2: Railway
1. Go to [railway.app](https://railway.app)
2. New Project → GitHub repo
3. Add Python service
4. Set start: `gunicorn --worker-class eventlet -w 1 app:app`
5. Deploy and get URL

#### Option 3: Heroku (legacy, freemium)
1. `pip install heroku`
2. `heroku login && heroku create your-app-name`
3. `git push heroku main`
4. Heroku auto-reads `Procfile` and deploys

### Frontend Deployment (GitHub Pages)

Already configured! GitHub Actions auto-deploys `docs/` folder on every push to `main`.

**To update backend URL for remote deployment:**

Edit `docs/script.js` (or `static/script.js`), look for the Socket.IO connection:
```javascript
const socket = io(BACKEND_URL);
```
Add at the top:
```javascript
const BACKEND_URL = window.location.hostname === 'localhost' 
  ? 'http://127.0.0.1:5010'
  : 'https://your-backend.onrender.com';
```

## Project Structure
```
EduTEA_PyVision/
  app.py                 # Flask + SocketIO backend
  camera.py              # OpenCV + MediaPipe hands processing
  gestures.py            # Grasp detection helper
  requirements.txt       # Python dependencies
  Procfile               # Deploy config for Render/Heroku
  static/
    script.js            # Frontend game logic
    style.css            # Frontend styling
  templates/
    index.html           # Backend-served HTML
  docs/                  # GitHub Pages frontend (auto-synced)
    index.html
    script.js
    style.css
  .github/
    workflows/
      deploy-pages.yml   # Auto-deploy to GitHub Pages
  README.md
```

## How It Works

1. **Backend (Python)**
   - Captures camera frame via OpenCV
   - Detects hand landmarks with MediaPipe
   - Extracts wrist position (normalized 0-1) and grasp state
   - Streams gesture data via WebSocket
   - Serves MJPEG video feed

2. **Frontend (HTML/JS)**
   - Receives gesture data over WebSocket
   - Maps wrist position to canvas cursor
   - Detects grab/release for drag-and-drop
   - Validates letter placement order
   - Shows confetti on win

## Gesture Controls

| Gesture | Action |
|---------|--------|
| **Wrist movement** | Move cursor over letters |
| **Close hand** (2+ fingers folded) | Grab & drag letter |
| **Open hand** | Release letter into slot |
| **Pinch** (thumb + index close) | Alternative grab |

## Troubleshooting

### "Cannot connect to backend"
- Backend must be running locally or deployed
- Check CORS is enabled (now included in `app.py`)
- Frontend URL must match backend origin

### "Hand not detected"
- Improve lighting
- Get closer to camera (~0.5–1m away)
- Check camera permissions

### "Letter won't enter slot"
- Check console logs (F12 → Console)
- Hand grasp might not be stable
- Try slower movements

### "Gesture too sensitive/not sensitive"
Edit thresholds in `gestures.py`:
```python
# Line ~40: adjust folded_count threshold (lower = more sensitive)
if _distance(lm[tip_id], lm[mcp_id]) < 0.12:  # increase/decrease 0.12
```

## Development Notes

- **Threading:** Flask-SocketIO uses threading async mode for macOS/Safari compatibility
- **CORS:** Enabled for all origins (can restrict to frontend domain if needed)
- **Camera lock:** Thread-safe camera access to prevent conflicts

## License
MIT

## Author
[@Dev-MJBS](https://github.com/Dev-MJBS)

