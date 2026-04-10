import { HAND_CONNECTIONS } from '@mediapipe/hands';

/**
 * Renders MediaPipe hand landmarks and hand skeleton on a canvas.
 */
export class LandmarkRenderer {
  /**
   * @param {HTMLCanvasElement} canvasElement Overlay canvas used to draw landmarks.
   */
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
  }

  /**
   * Draws the 21-point hand skeleton and wrist dot for detected hands.
   *
   * @param {Array<Array<{x:number,y:number,z:number}>>} multiHandLandmarks Landmark sets from MediaPipe.
  * @param {{state?: string, armX?: number, lastDx?: number, lastVx?: number}} [debugInfo] Gesture debug metadata.
   * @returns {void}
   */
  draw(multiHandLandmarks, debugInfo = {}) {
    const { canvas, ctx } = this;
    if (!ctx) return;

    const video = /** @type {HTMLVideoElement | null} */ (canvas.previousElementSibling);
    if (video && video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    } else {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!multiHandLandmarks?.length) return;

    const fallbackConnections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17],
    ];
    const connections = Array.from(HAND_CONNECTIONS ?? []);
    const validConnections = connections.length ? connections : fallbackConnections;

    for (const landmarks of multiHandLandmarks) {
      const width = canvas.width;
      const height = canvas.height;

      ctx.strokeStyle = 'rgba(100,200,255,0.7)';
      ctx.lineWidth = 2;

      for (const [a, b] of validConnections) {
        const pointA = landmarks[a];
        const pointB = landmarks[b];
        if (!pointA || !pointB) continue;

        ctx.beginPath();
        ctx.moveTo(pointA.x * width, pointA.y * height);
        ctx.lineTo(pointB.x * width, pointB.y * height);
        ctx.stroke();
      }

      for (let i = 0; i < landmarks.length; i += 1) {
        const x = landmarks[i].x * width;
        const y = landmarks[i].y * height;
        ctx.beginPath();
        ctx.arc(x, y, i === 0 ? 6 : 3, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#fff' : '#4aaeff';
        ctx.fill();
      }
    }

    const classifierState = debugInfo.state ?? 'IDLE';
    const dx = debugInfo.lastDx ?? 0;
    const vx = debugInfo.lastVx ?? 0;
    ctx.font = '16px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`state: ${classifierState}`, 12, 24);
    ctx.fillText(`dx: ${dx.toFixed(3)}  vx: ${vx.toFixed(3)}`, 12, 44);
  }
}