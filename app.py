import base64
import io
import time
from threading import Thread, Lock

import cv2
import numpy as np
from flask import Flask, Response, render_template, jsonify, request
from flask_socketio import SocketIO
from flask_cors import CORS

from camera import CameraProcessor

app = Flask(__name__)
app.config['SECRET_KEY'] = 'edutea-secret'
# Enable CORS for GitHub Pages frontend
CORS(app)
# Use threading for broader compatibility (Safari sometimes has issues with eventlet)
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

cam_lock = Lock()
camera = CameraProcessor()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/health')
def health():
    return jsonify({"status": "ok"}), 200


@app.route('/start_game', methods=['POST'])
def start_game():
    data = request.get_json()
    word = data.get('word', '').strip().upper()
    if not word or len(word) < 3:
        return jsonify({"error": "Palavra inválida"}), 400
    # Here we could call GameManager.loadNewWord(word) if it existed
    # For now, just acknowledge
    return jsonify({"message": "Jogo iniciado com sucesso", "word": word}), 200


def mjpeg_generator():
    """Yield MJPEG frames from OpenCV capture."""
    while True:
        with cam_lock:
            frame_bgr, gesture = camera.get_frame_and_gesture()
        if frame_bgr is None:
            # Allow some time before retrying
            time.sleep(0.01)
            continue
        ret, jpeg = cv2.imencode('.jpg', frame_bgr)
        if not ret:
            continue
        frame = jpeg.tobytes()
        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")


@app.route('/video_feed')
def video_feed():
    resp = Response(mjpeg_generator(), mimetype='multipart/x-mixed-replace; boundary=frame')
    resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'
    return resp


@app.route('/frame_json')
def frame_json():
    """Return a single JPEG frame as base64 data URL for fallback rendering."""
    with cam_lock:
        frame_bgr, _ = camera.get_frame_and_gesture()
    if frame_bgr is None:
        return jsonify({"image": None}), 200
    ret, jpeg = cv2.imencode('.jpg', frame_bgr)
    if not ret:
        return jsonify({"image": None}), 200
    b64 = base64.b64encode(jpeg.tobytes()).decode('ascii')
    data_url = f"data:image/jpeg;base64,{b64}"
    return jsonify({"image": data_url}), 200


@socketio.on('connect')
def on_connect():
    # Optionally acknowledge
    pass


@socketio.on('disconnect')
def on_disconnect():
    pass


def gesture_stream_loop():
    """Continuously emit gesture data at low latency with grab smoothing."""
    grab_on_threshold = 2  # frames required to confirm grab
    grab_off_threshold = 2 # frames required to confirm release
    grab_frames = 0
    release_frames = 0
    stable_grab = False

    while True:
        try:
            with cam_lock:
                _, gesture = camera.get_frame_and_gesture()
            if gesture is not None:
                detected = bool(gesture.get('detected', False))
                raw_grab = bool(gesture.get('is_grabbing', False))

                if detected and raw_grab:
                    grab_frames = min(grab_on_threshold, grab_frames + 1)
                    release_frames = 0
                    if grab_frames >= grab_on_threshold:
                        stable_grab = True
                else:
                    release_frames = min(grab_off_threshold, release_frames + 1)
                    grab_frames = 0
                    if release_frames >= grab_off_threshold:
                        stable_grab = False

                # Emit stabilized grab state under the same key
                gesture['is_grabbing'] = stable_grab
                socketio.emit('gesture_data', gesture)

            # ~30-60 Hz; adjust as needed
            socketio.sleep(0.02)
        except Exception as e:
            print(f"Error in gesture_stream_loop: {e}")
            socketio.sleep(0.1)  # Wait a bit before retrying


if __name__ == '__main__':
    # Start background gesture emitter before serving
    socketio.start_background_task(target=gesture_stream_loop)
    # Choose default port; allow override by env FLASK_RUN_PORT
    import os
    port = int(os.environ.get('FLASK_RUN_PORT', '5010'))
    socketio.run(app, host='0.0.0.0', port=port)
