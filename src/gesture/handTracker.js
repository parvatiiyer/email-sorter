import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { CONFIG } from '../config.js';
import { GestureClassifier } from './gestureClassifier.js';
import { LandmarkRenderer } from './landmarkRenderer.js';

/**
 * MediaPipe Hands tracker scaffold.
 * Wires video input, hand landmark callbacks, and gesture emission.
 */
export class HandTracker {
  /**
   * @param {HTMLVideoElement} videoEl Source video element for camera frames.
   * @param {HTMLCanvasElement} overlayEl Overlay canvas for drawing landmarks.
   * @param {(gestureEvent: {type: 'SWIPE_RIGHT' | 'SWIPE_LEFT' | 'TWO_FINGER_OPEN' | 'NONE'}) => void} onGesture Gesture callback.
   */
  constructor(videoEl, overlayEl, onGesture) {
    this.videoEl = videoEl;
    this.overlayEl = overlayEl;
    this.onGesture = onGesture;
    this.classifier = new GestureClassifier(CONFIG);
    this.renderer = new LandmarkRenderer(overlayEl);
    this.camera = null;
    this.hands = null;
    this._connections = HAND_CONNECTIONS;
  }

  /**
   * Initializes MediaPipe Hands, applies CONFIG settings, and starts camera processing.
   *
   * @returns {Promise<void>} Resolves when startup routine has been invoked.
   */
  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
    });

    this.videoEl.srcObject = stream;

    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    this.hands.setOptions({
      maxNumHands: CONFIG.MAX_HANDS,
      modelComplexity: CONFIG.MODEL_COMPLEXITY,
      minDetectionConfidence: CONFIG.MIN_DETECTION_CONFIDENCE,
      minTrackingConfidence: CONFIG.MIN_TRACKING_CONFIDENCE,
    });

    this.hands.onResults((results) => this._onResults(results));

    this.camera = new Camera(this.videoEl, {
      onFrame: async () => {
        if (!this.hands) return;
        await this.hands.send({ image: this.videoEl });
      },
      width: 640,
      height: 480,
    });

    await this.camera.start();
  }

  /**
   * Stops camera capture and hand processing.
   *
   * @returns {void}
   */
  stop() {
    this.camera?.stop();
    this.camera = null;

    this.hands?.close();
    this.hands = null;

    const stream = /** @type {MediaStream | null} */ (this.videoEl.srcObject);
    stream?.getTracks().forEach((track) => track.stop());
    this.videoEl.srcObject = null;
  }

  /**
   * Handles MediaPipe results, classifies gestures, renders landmarks, and emits gesture events.
   *
   * @private
   * @param {{multiHandLandmarks?: Array<Array<{x:number,y:number,z:number}>>}} results Frame results from MediaPipe Hands.
   * @returns {void}
   */
  _onResults(results) {
    const multiHandLandmarks = results?.multiHandLandmarks ?? [];
    const primary = multiHandLandmarks[0];
    const palmX = primary
      ? [0, 5, 9, 13, 17].reduce((sum, index) => sum + primary[index].x, 0) / 5
      : 0;
    const armX = this.classifier.armX ?? 0;

    this.renderer.draw(multiHandLandmarks, {
      state: this.classifier.state,
      armX,
      lastDx: this.classifier.state === 'ARMED' ? palmX - armX : this.classifier.lastDx ?? 0,
      lastVx: this.classifier.lastVx ?? 0,
    });

    if (!multiHandLandmarks.length) return;

    const gesture = this.classifier.classify(multiHandLandmarks);
    if (gesture.type !== 'NONE') {
      this.onGesture(gesture);
    }
  }
}