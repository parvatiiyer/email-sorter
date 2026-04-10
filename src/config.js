/**
 * Shared runtime configuration for gesture tracking and classification.
 *
 * @typedef {Object} AppConfig
 * @property {number} SWIPE_THRESHOLD Minimum horizontal velocity threshold for swipe gestures.
 * @property {number} GESTURE_COOLDOWN_MS Cooldown window between accepted gesture events.
 * @property {number} MAX_HANDS Maximum number of hands to track per frame.
 * @property {number} MODEL_COMPLEXITY MediaPipe model complexity setting.
 * @property {number} MIN_DETECTION_CONFIDENCE Minimum confidence for hand detection.
 * @property {number} MIN_TRACKING_CONFIDENCE Minimum confidence for hand landmark tracking.
 */

/** @type {AppConfig} */
export const CONFIG = {
  SWIPE_THRESHOLD: 0.25,
  GESTURE_COOLDOWN_MS: 800,
  MAX_HANDS: 2,
  MODEL_COMPLEXITY: 1,
  MIN_DETECTION_CONFIDENCE: 0.7,
  MIN_TRACKING_CONFIDENCE: 0.5,
};