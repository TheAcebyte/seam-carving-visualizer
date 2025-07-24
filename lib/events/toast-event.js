import EventChannel from "/lib/events/core.js";

/** @import { Toast } from "/components/toaster/toaster.js" */

/** @type {EventChannel<Toast>} */
const toastEvent = new EventChannel();

export default toastEvent;
