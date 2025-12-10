import cv2
import mediapipe as mp
import numpy as np
from gestures import detect_grasp

mp_hands = mp.solutions.hands


class CameraProcessor:
    def __init__(self, device_index: int = 0):
        self.cap = cv2.VideoCapture(device_index)
        if not self.cap.isOpened():
            print(f"Failed to open camera device {device_index}")
            self.cap = None
        self.hands = mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.frame_rgb = None

    def get_frame_and_gesture(self):
        if self.cap is None or not self.cap.isOpened():
            return None, None
        try:
            ok, frame_bgr = self.cap.read()
            if not ok:
                return None, None
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            results = self.hands.process(frame_rgb)

            gesture = None
            if results.multi_hand_landmarks:
                hand_landmarks = results.multi_hand_landmarks[0]
                # Extract wrist (landmark 0) normalized position
                wrist = hand_landmarks.landmark[0]
                is_grabbing = detect_grasp(hand_landmarks)
                gesture = {
                    'wrist_x': float(wrist.x),
                    'wrist_y': float(wrist.y),
                    'is_grabbing': bool(is_grabbing),
                    'detected': True,
                }
                # Draw landmarks for visualization
                mp.solutions.drawing_utils.draw_landmarks(
                    frame_bgr, hand_landmarks, mp_hands.HAND_CONNECTIONS
                )
            else:
                gesture = {
                    'wrist_x': 0.5,
                    'wrist_y': 0.5,
                    'is_grabbing': False,
                    'detected': False,
                }
            return frame_bgr, gesture
        except Exception as e:
            print(f"Error in get_frame_and_gesture: {e}")
            return None, None

    def __del__(self):
        try:
            self.cap.release()
        except Exception:
            pass
