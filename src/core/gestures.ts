/**
 * Gesture Recognition Module
 * Iron Man-style hologram control - 3D rotation, gestures, and actions
 */

import type { NormalizedLandmarkList } from '@mediapipe/hands';
import type { HandData } from './handtracker';

// Landmark indices for MediaPipe Hands
const LANDMARKS = {
    WRIST: 0,
    THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
    INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
    MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
    RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
    PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
};

export type GestureType =
    | 'open_palm'     // Open hand - 3D rotation control (Iron Man style)
    | 'index_point'   // Index finger extended - precise pointer
    | 'pinch'         // Thumb + index pinch - grab/select
    | 'closed_fist'   // Fist - explode/scatter
    | 'peace'         // Peace sign (index + middle) - slow motion
    | 'rock'          // Rock sign (index + pinky) - speed up
    | 'thumbs_up'     // Thumb up - reset to default
    | 'two_hand_spread' // Two hands spread - scale up
    | 'two_hand_close'  // Two hands close - scale down
    | 'two_hand_rotate' // Two hands - rotate with both
    | 'none';

export interface Point3D {
    x: number;
    y: number;
    z: number;
}

export interface HandRotation {
    pitch: number;  // Up/down rotation (-1 to 1)
    yaw: number;    // Left/right rotation (-1 to 1)
    roll: number;   // Tilt rotation (-1 to 1)
}

export interface GestureResult {
    gesture: GestureType;
    position: Point3D;
    strength: number;
    // Iron Man 3D control data
    rotation: HandRotation;        // Hand orientation for 3D rotation
    velocity: Point3D;             // Hand movement velocity
    palmFacing: 'camera' | 'away' | 'up' | 'down' | 'left' | 'right';
    // Two hand data
    twoHandDistance?: number;
    twoHandRotation?: number;      // Rotation angle between hands
}

/**
 * Calculate distance between two 3D points
 */
function distance3D(p1: Point3D, p2: Point3D): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);
}

function distance2D(p1: Point3D, p2: Point3D): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * Check if a finger is extended
 */
function isFingerExtended(landmarks: NormalizedLandmarkList, tipIdx: number, pipIdx: number): boolean {
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    const tipDist = distance2D(tip, landmarks[LANDMARKS.WRIST]);
    const pipDist = distance2D(pip, landmarks[LANDMARKS.WRIST]);
    return tipDist > pipDist * 1.1;
}

function isThumbExtended(landmarks: NormalizedLandmarkList): boolean {
    const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
    const thumbMcp = landmarks[LANDMARKS.THUMB_MCP];
    const indexMcp = landmarks[LANDMARKS.INDEX_MCP];
    return distance2D(thumbTip, indexMcp) > distance2D(thumbMcp, indexMcp) * 0.8;
}

/**
 * Calculate hand rotation from landmarks (Iron Man style)
 */
function calculateHandRotation(landmarks: NormalizedLandmarkList): HandRotation {
    const wrist = landmarks[LANDMARKS.WRIST];
    const middleMcp = landmarks[LANDMARKS.MIDDLE_MCP];
    const indexMcp = landmarks[LANDMARKS.INDEX_MCP];
    const pinkyMcp = landmarks[LANDMARKS.PINKY_MCP];

    // Pitch: angle from wrist to middle finger (up/down tilt)
    const palmVector = { x: middleMcp.x - wrist.x, y: middleMcp.y - wrist.y, z: middleMcp.z - wrist.z };
    const pitch = -palmVector.y * 2;  // Y axis inverted, scaled

    // Yaw: horizontal position of palm center (left/right)
    const palmCenterX = (indexMcp.x + pinkyMcp.x) / 2;
    const yaw = (palmCenterX - 0.5) * 2;  // Center is 0, edges are -1/+1

    // Roll: angle between index and pinky (hand tilt)
    const rollAngle = Math.atan2(pinkyMcp.y - indexMcp.y, pinkyMcp.x - indexMcp.x);
    const roll = rollAngle / (Math.PI / 2);  // Normalize to -1 to 1

    return {
        pitch: Math.max(-1, Math.min(1, pitch)),
        yaw: Math.max(-1, Math.min(1, yaw)),
        roll: Math.max(-1, Math.min(1, roll)),
    };
}

/**
 * Detect palm facing direction
 */
function detectPalmFacing(landmarks: NormalizedLandmarkList): GestureResult['palmFacing'] {
    const wrist = landmarks[LANDMARKS.WRIST];
    const middleMcp = landmarks[LANDMARKS.MIDDLE_MCP];
    const indexMcp = landmarks[LANDMARKS.INDEX_MCP];
    const pinkyMcp = landmarks[LANDMARKS.PINKY_MCP];

    // Z depth indicates facing camera or away
    const avgZ = (wrist.z + middleMcp.z) / 2;
    if (avgZ < -0.1) return 'camera';
    if (avgZ > 0.1) return 'away';

    // Check vertical orientation
    const palmY = middleMcp.y - wrist.y;
    if (palmY < -0.15) return 'up';
    if (palmY > 0.15) return 'down';

    // Check horizontal orientation
    const palmX = (indexMcp.x + pinkyMcp.x) / 2 - wrist.x;
    if (palmX < -0.1) return 'left';
    if (palmX > 0.1) return 'right';

    return 'camera';
}

/**
 * Get palm center position
 */
function getHandCenter(landmarks: NormalizedLandmarkList): Point3D {
    const wrist = landmarks[LANDMARKS.WRIST];
    const indexMcp = landmarks[LANDMARKS.INDEX_MCP];
    const pinkyMcp = landmarks[LANDMARKS.PINKY_MCP];
    return {
        x: (wrist.x + indexMcp.x + pinkyMcp.x) / 3,
        y: (wrist.y + indexMcp.y + pinkyMcp.y) / 3,
        z: (wrist.z + indexMcp.z + pinkyMcp.z) / 3,
    };
}

// Store previous positions for velocity calculation
let previousPositions: Map<string, Point3D> = new Map();
let lastUpdateTime = 0;

/**
 * Calculate hand velocity
 */
function calculateVelocity(handId: string, currentPos: Point3D): Point3D {
    const now = Date.now();
    const dt = (now - lastUpdateTime) / 1000;
    lastUpdateTime = now;

    const prevPos = previousPositions.get(handId);
    previousPositions.set(handId, currentPos);

    if (!prevPos || dt <= 0 || dt > 0.5) {
        return { x: 0, y: 0, z: 0 };
    }

    return {
        x: (currentPos.x - prevPos.x) / dt,
        y: (currentPos.y - prevPos.y) / dt,
        z: (currentPos.z - prevPos.z) / dt,
    };
}

/**
 * Detect single hand gesture with all finger states
 */
function detectSingleHandGesture(landmarks: NormalizedLandmarkList): { gesture: GestureType; strength: number } {
    const indexExtended = isFingerExtended(landmarks, LANDMARKS.INDEX_TIP, LANDMARKS.INDEX_PIP);
    const middleExtended = isFingerExtended(landmarks, LANDMARKS.MIDDLE_TIP, LANDMARKS.MIDDLE_PIP);
    const ringExtended = isFingerExtended(landmarks, LANDMARKS.RING_TIP, LANDMARKS.RING_PIP);
    const pinkyExtended = isFingerExtended(landmarks, LANDMARKS.PINKY_TIP, LANDMARKS.PINKY_PIP);
    const thumbExtended = isThumbExtended(landmarks);

    // Pinch check
    const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
    const indexTip = landmarks[LANDMARKS.INDEX_TIP];
    const pinchDist = distance3D(thumbTip, indexTip);

    if (pinchDist < 0.08) {
        return { gesture: 'pinch', strength: 1 - (pinchDist / 0.08) };
    }

    // Thumbs up (only thumb extended, pointing up)
    if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
        const thumbTipY = landmarks[LANDMARKS.THUMB_TIP].y;
        const wristY = landmarks[LANDMARKS.WRIST].y;
        if (thumbTipY < wristY - 0.1) {
            return { gesture: 'thumbs_up', strength: 0.9 };
        }
    }

    // Peace sign (index + middle extended)
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
        return { gesture: 'peace', strength: 0.9 };
    }

    // Rock sign (index + pinky extended)
    if (indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
        return { gesture: 'rock', strength: 0.9 };
    }

    // Open palm (all fingers extended) - Main Iron Man control
    if (indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended) {
        return { gesture: 'open_palm', strength: 1.0 };
    }

    // Closed fist
    if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
        return { gesture: 'closed_fist', strength: 0.9 };
    }

    // Index point (only index extended)
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
        return { gesture: 'index_point', strength: 0.9 };
    }

    return { gesture: 'none', strength: 0 };
}

/**
 * Main gesture recognition - Iron Man style
 */
export function recognizeGestures(hands: HandData[]): GestureResult {
    const defaultResult: GestureResult = {
        gesture: 'none',
        position: { x: 0.5, y: 0.5, z: 0 },
        strength: 0,
        rotation: { pitch: 0, yaw: 0, roll: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        palmFacing: 'camera',
    };

    if (hands.length === 0) {
        previousPositions.clear();
        return defaultResult;
    }

    // TWO HAND GESTURES
    if (hands.length === 2) {
        const center1 = getHandCenter(hands[0].landmarks);
        const center2 = getHandCenter(hands[1].landmarks);
        const handDistance = distance2D(center1, center2);

        // Calculate rotation angle between hands
        const angle = Math.atan2(center2.y - center1.y, center2.x - center1.x);

        // Calculate combined rotation from both hands
        const rot1 = calculateHandRotation(hands[0].landmarks);
        const rot2 = calculateHandRotation(hands[1].landmarks);
        const combinedRotation: HandRotation = {
            pitch: (rot1.pitch + rot2.pitch) / 2,
            yaw: (rot1.yaw + rot2.yaw) / 2,
            roll: angle / Math.PI,  // Use angle between hands for roll
        };

        const midPoint: Point3D = {
            x: (center1.x + center2.x) / 2,
            y: (center1.y + center2.y) / 2,
            z: (center1.z + center2.z) / 2,
        };

        const velocity = calculateVelocity('two_hand', midPoint);

        // Determine two-hand gesture type based on distance
        let gesture: GestureType = 'two_hand_rotate';
        if (handDistance > 0.5) {
            gesture = 'two_hand_spread';
        } else if (handDistance < 0.2) {
            gesture = 'two_hand_close';
        }

        return {
            gesture,
            position: midPoint,
            strength: 1,
            rotation: combinedRotation,
            velocity,
            palmFacing: 'camera',
            twoHandDistance: Math.min(handDistance / 0.6, 1),
            twoHandRotation: angle,
        };
    }

    // SINGLE HAND GESTURE
    const hand = hands[0];
    const { gesture, strength } = detectSingleHandGesture(hand.landmarks);
    const rotation = calculateHandRotation(hand.landmarks);
    const palmFacing = detectPalmFacing(hand.landmarks);

    // Get position based on gesture
    let position: Point3D;
    if (gesture === 'index_point') {
        position = { ...hand.landmarks[LANDMARKS.INDEX_TIP] };
    } else if (gesture === 'pinch') {
        const thumbTip = hand.landmarks[LANDMARKS.THUMB_TIP];
        const indexTip = hand.landmarks[LANDMARKS.INDEX_TIP];
        position = {
            x: (thumbTip.x + indexTip.x) / 2,
            y: (thumbTip.y + indexTip.y) / 2,
            z: (thumbTip.z + indexTip.z) / 2,
        };
    } else {
        position = getHandCenter(hand.landmarks);
    }

    const velocity = calculateVelocity('hand_0', position);

    return { gesture, position, strength, rotation, velocity, palmFacing };
}

// Display names for UI
export const GESTURE_DISPLAY_NAMES: Record<GestureType, string> = {
    'open_palm': '🖐️ Control',
    'index_point': '☝️ Point',
    'pinch': '🤏 Grab',
    'closed_fist': '✊ Explode',
    'peace': '✌️ Slow',
    'rock': '🤘 Fast',
    'thumbs_up': '👍 Reset',
    'two_hand_spread': '🙌 Expand',
    'two_hand_close': '👐 Compress',
    'two_hand_rotate': '🔄 Rotate',
    'none': '...',
};

// Action descriptions for each gesture
export const GESTURE_ACTIONS: Record<GestureType, string> = {
    'open_palm': 'Move hand to rotate shape in 3D',
    'index_point': 'Point to attract particles',
    'pinch': 'Grab and move particles',
    'closed_fist': 'Explode particles outward',
    'peace': 'Slow down time',
    'rock': 'Speed up motion',
    'thumbs_up': 'Reset shape to default',
    'two_hand_spread': 'Spread hands to expand',
    'two_hand_close': 'Close hands to compress',
    'two_hand_rotate': 'Rotate hands to spin shape',
    'none': 'Show hand to control',
};
