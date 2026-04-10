/**
 * @typedef {Object} Email
 * @property {string|number} id Unique identifier for the email.
 * @property {string} from Sender display string.
 * @property {string} subject Email subject line.
 * @property {string} preview Short preview text shown in the list.
 * @property {string} body Full email body content.
 */

/**
 * @typedef {(store: typeof emailStore) => void} StoreSubscriber
 */

/**
 * Minimal pub/sub email store scaffold.
 */
export const emailStore = {
    /** @type {Email[]} */
    emails: [],
    currentIndex: 0,
    /** @type {StoreSubscriber[]} */
    subscribers: [],
        openedEmail: null,

    /**
     * Subscribes a callback to store updates.
     *
     * @param {StoreSubscriber} fn Subscriber callback.
     * @returns {() => void} Unsubscribe function.
     */
    subscribe(fn) {
        this.subscribers.push(fn);
        return () => {
            this.subscribers = this.subscribers.filter((subscriber) => subscriber !== fn);
        };
    },

    /**
     * Notifies all subscribers of state changes.
     *
     * @returns {void}
     */
    notify() {
        this.subscribers.forEach((fn) => fn(this));
    },

  /**
   * Replaces the email collection.
   *
   * @param {Email[]} arr New email list.
   * @returns {Email[]} The updated email list.
   */
  setEmails(arr) {
        this.emails = Array.isArray(arr) ? arr : [];
        this.currentIndex = Math.min(this.currentIndex, Math.max(this.emails.length - 1, 0));
        this.openedEmail = null;
        this.notify();
        return this.emails;
    },

    /**
     * Sets the current focused email index.
     *
     * @param {number} index Target email index.
     * @returns {number} The current selected index.
     */
    setCurrent(index) {
        if (!this.emails.length) {
            this.currentIndex = 0;
            this.notify();
            return this.currentIndex;
        }

        const clampedIndex = Math.max(0, Math.min(index, this.emails.length - 1));
        this.currentIndex = clampedIndex;
        this.notify();
        return this.currentIndex;
    },

        /**
         * Sets currently opened email for detail preview.
         *
         * @param {Email | null} email Email to open in detail panel.
         * @returns {Email | null} Active opened email.
         */
        setOpenedEmail(email) {
            this.openedEmail = email ?? null;
            this.notify();
            return this.openedEmail;
        },
};