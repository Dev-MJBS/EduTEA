import math
import mediapipe as mp

# MediaPipe Hands indexes for fingertips and their MCP joints
TIP_IDS = [8, 12, 16, 20]  # index, middle, ring, pinky fingertips
MCP_IDS = [5, 9, 13, 17]   # corresponding MCP joints
THUMB_TIP = 4
THUMB_IP = 3
INDEX_TIP = 8


def _distance(a, b):
    dx = a.x - b.x
    dy = a.y - b.y
    dz = a.z - b.z
    return math.sqrt(dx*dx + dy*dy + dz*dz)


def detect_grasp(hand_landmarks) -> bool:
    """Return True if the hand appears closed (fist or pinch).

    Heuristic (ultra-relaxed thresholds for reliable clicking):
    - Any 2+ fingers folded counts
    - Pinch (thumb + index close) counts
    """
    lm = hand_landmarks.landmark

    folded_count = 0
    for tip_id, mcp_id in zip(TIP_IDS, MCP_IDS):
        # Very relaxed: 0.12 threshold to catch almost any fold
        if _distance(lm[tip_id], lm[mcp_id]) < 0.12:
            folded_count += 1

    # Pinch: very relaxed thumb-to-index distance
    pinch = _distance(lm[THUMB_TIP], lm[INDEX_TIP]) < 0.08

    # Grasp if 2+ fingers folded OR pinch detected
    # INVERTED: Return the opposite (mão aberta = false, mão fechada = true)
    is_closed = folded_count >= 2 or pinch
    return not is_closed
