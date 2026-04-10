/**
 * @typedef {'SWIPE_RIGHT' | 'SWIPE_LEFT' | 'TWO_FINGER_OPEN' | 'NONE'} GestureType
 */

/**
 * @typedef {Object} GestureEvent
 * @property {GestureType} type Detected gesture type.
 */

/**
 * Lightweight gesture classifier scaffold.
 * Keeps placeholder state for future velocity and finger-pose logic.
 */
export class GestureClassifier {
  /**
   * @param {import('../config.js').CONFIG} config Runtime gesture configuration.
   */
  constructor(config) {
    this.config = config;
    /** @type {Array<{x:number,y:number,t:number}>} */
    this.history = [];
    this.state = 'IDLE';
    this.armX = null;
    this.armY = null;
    this.armTime = null;
    this.lastFireTime = 0;
    this.twoFrames = 0;

    this.COOLDOWN_MS = 1500;
    this.ARM_STILL_MS = 200;
    this.ARM_STILL_DIST = 0.06;
    this.TWO_FINGER_HOLD = 15;
    this.SWIPE_MIN_DX = 0.12;   // easier distance
    this.SWIPE_MIN_VX = 0.15;   // easier speed
    this.HORIZ_RATIO = 1.2;     // allow slight diagonal motion

    this.lastDx = 0;
    this.lastVx = 0;
  }

  /**
   * Classifies a gesture from current multi-hand landmarks.
   *
   * @param {Array<Array<{x:number,y:number,z:number}>>} multiHandLandmarks Landmark sets from MediaPipe Hands.
   * @returns {GestureEvent} Classified gesture event.
   */
  classify(multiHandLandmarks) {
    const now = Date.now();

    if (now - this.lastFireTime < this.COOLDOWN_MS) {
      return { type: 'NONE' };
    }

    if (!multiHandLandmarks?.length) {
      this.history = [];
      this.state = 'IDLE';
      this.armX = null;
      this.armY = null;
      this.armTime = null;
      this.twoFrames = 0;
      this.lastDx = 0;
      this.lastVx = 0;
      return { type: 'NONE' };
    }

    const lm = multiHandLandmarks[0];
    if (!lm || lm.length < 21) {
      return { type: 'NONE' };
    }

    const palmX = [0, 5, 9, 13, 17].reduce((sum, index) => sum + lm[index].x, 0) / 5;
    const palmY = [0, 5, 9, 13, 17].reduce((sum, index) => sum + lm[index].y, 0) / 5;

    if (this._isTwoFinger(lm)) {
      this.twoFrames += 1;
      if (this.twoFrames >= this.TWO_FINGER_HOLD) {
        this.twoFrames = 0;
        this.state = 'IDLE';
        this.history = [];
        this.armX = null;
        this.armY = null;
        this.armTime = null;
        this.lastDx = 0;
        this.lastVx = 0;
        this.lastFireTime = now;
        return { type: 'TWO_FINGER_OPEN' };
      }

      return { type: 'NONE' };
    }

    this.twoFrames = 0;

    this.history.push({ x: palmX, y: palmY, t: now });
    if (this.history.length > 30) {
      this.history.shift();
    }

    if (this.state === 'IDLE') {
      const window = this.history.filter((point) => now - point.t < this.ARM_STILL_MS);
      if (window.length >= 5) {
        const xs = window.map((point) => point.x);
        const spread = Math.max(...xs) - Math.min(...xs);
        if (spread < this.ARM_STILL_DIST) {
          this.state = 'ARMED';
          this.armX = palmX;
          this.armY = palmY;
          this.armTime = now;
          this.history = [];
          this.lastDx = 0;
          this.lastVx = 0;
        }
      }

      return { type: 'NONE' };
    }

    if (this.state === 'ARMED') {
      if (this.armX === null || this.armY === null || this.armTime === null) {
        this.state = 'IDLE';
        this.history = [];
        this.lastDx = 0;
        this.lastVx = 0;
        return { type: 'NONE' };
      }

      const dx = palmX - this.armX;
      const dy = palmY - this.armY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const { vx } = this._velocity();
      this.lastDx = dx;
      this.lastVx = vx;

      if (absDy > absDx * 0.8 && absDy > 0.05) {
        this.state = 'IDLE';
        this.history = [];
        this.armX = null;
        this.armY = null;
        this.armTime = null;
        this.lastDx = 0;
        this.lastVx = 0;
        return { type: 'NONE' };
      }

      console.log(
        "dx:", dx.toFixed(3),
        "vx:", vx.toFixed(3)
      );
      
      if (dx > this.SWIPE_MIN_DX && vx > this.SWIPE_MIN_VX && absDx > absDy * this.HORIZ_RATIO) {
        this.state = 'IDLE';
        this.history = [];
        this.armX = null;
        this.armY = null;
        this.armTime = null;
        this.lastFireTime = now;
        return { type: 'SWIPE_RIGHT' };
      }

      if (dx < -this.SWIPE_MIN_DX && vx < -this.SWIPE_MIN_VX && absDx > absDy * this.HORIZ_RATIO) {
        this.state = 'IDLE';
        this.history = [];
        this.armX = null;
        this.armY = null;
        this.armTime = null;
        this.lastFireTime = now;
        return { type: 'SWIPE_LEFT' };
      }

      if (now - this.armTime > 1500) {
        this.state = 'IDLE';
        this.history = [];
        this.armX = null;
        this.armY = null;
        this.armTime = null;
        this.lastDx = 0;
        this.lastVx = 0;
      }

      return { type: 'NONE' };
    }

    return { type: 'NONE' };
  }

  /**
   * Counts extended fingers for a single detected hand.
   *
   * @private
   * @param {Array<{x:number,y:number,z:number}>} landmarks One hand's 21 landmarks.
   * @returns {number} Number of fingers considered extended.
   */
  _isTwoFinger(lm) {
    const margin = 0.04;
    const indexUp = lm[8].y < lm[6].y - margin;
    const middleUp = lm[12].y < lm[10].y - margin;
    const ringDown = lm[16].y > lm[14].y + margin;
    const pinkyDown = lm[20].y > lm[18].y + margin;
    return indexUp && middleUp && ringDown && pinkyDown;
  }

  /**
   * Computes wrist velocity from tracked history.
   *
   * @private
   * @returns {{vx:number, vy:number}} Velocity vector in normalized coordinates per frame.
   */
  _velocity() {
    if (this.history.length < 4) {
      return { vx: 0, vy: 0 };
    }

    const recent = this.history.slice(-3);
    const older = this.history.slice(-8, -5);

    if (!older.length) {
      return { vx: 0, vy: 0 };
    }

    const rx = recent.reduce((sum, point) => sum + point.x, 0) / recent.length;
    const ox = older.reduce((sum, point) => sum + point.x, 0) / older.length;
    const ry = recent.reduce((sum, point) => sum + point.y, 0) / recent.length;
    const oy = older.reduce((sum, point) => sum + point.y, 0) / older.length;
    const dt = Math.max((recent[recent.length - 1].t - older[0].t) / 1000, 0.001);

    return {
      vx: (rx - ox) / dt,
      vy: (ry - oy) / dt,
    };
  }
}