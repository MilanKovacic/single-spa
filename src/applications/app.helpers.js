import { handleAppError } from "./app-errors.js";

// Application statuses constants that might be assigned/used in the lifecycle of a application
export const NOT_LOADED = "NOT_LOADED";
export const LOADING_SOURCE_CODE = "LOADING_SOURCE_CODE";
export const NOT_BOOTSTRAPPED = "NOT_BOOTSTRAPPED";
export const BOOTSTRAPPING = "BOOTSTRAPPING";
export const NOT_MOUNTED = "NOT_MOUNTED";
export const MOUNTING = "MOUNTING";
export const MOUNTED = "MOUNTED";
export const UPDATING = "UPDATING";
export const UNMOUNTING = "UNMOUNTING";
export const UNLOADING = "UNLOADING";
export const LOAD_ERROR = "LOAD_ERROR";
export const SKIP_BECAUSE_BROKEN = "SKIP_BECAUSE_BROKEN";

/**
 * Checks if the given app is currently active.
 * @param {any} app - The app to check its status.
 * @returns {boolean} True if the app status is MOUNTED, False otherwise.
 */
export function isActive(app) {
  return app.status === MOUNTED;
}

/**
 * Checks if the given app should be active based on the current window location.
 * @param {any} app - The app to check its activeWhen method.
 * @returns {boolean} True if the app activeWhen returns true, False if it throws an error or returns false. 
 */
export function shouldBeActive(app) {
  try {
    return app.activeWhen(window.location);
  } catch (err) {
    handleAppError(err, app, SKIP_BECAUSE_BROKEN);
    return false;
  }
}

/**
 * Returns the name of the app.
 * @param {any} app - The app to get its name.
 * @returns {string} The name of the app.
 */
export function toName(app) {
  return app.name;
}

/**
 * Checks if the given app or parcel is a parcel.
 * @param {any} appOrParcel - The app or parcel to check if it's a parcel.
 * @returns {boolean} True if unmountThisParcel property is present and truthy, false otherwise.
 */
export function isParcel(appOrParcel) {
  return Boolean(appOrParcel.unmountThisParcel);
}

/**
 * Returns the type of the given app or parcel.
 * @param {any} appOrParcel - The app or parcel to get its type.
 * @returns {string} "parcel" if it's a parcel, "application" if it's an application.
 */
export function objectType(appOrParcel) {
  return isParcel(appOrParcel) ? "parcel" : "application";
}
