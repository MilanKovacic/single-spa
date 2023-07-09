import { assign } from "../utils/assign";
import { getProps } from "../lifecycles/prop.helpers";
import { objectType, toName } from "./app.helpers";
import { formatErrorMessage } from "./app-errors";

const defaultWarningMillis = 1000;

// Object containing default timeout configurations for various lifecycle methods
const globalTimeoutConfig = {
  bootstrap: {
    millis: 4000,
    dieOnTimeout: false,
    warningMillis: defaultWarningMillis,
  },
  mount: {
    millis: 3000,
    dieOnTimeout: false,
    warningMillis: defaultWarningMillis,
  },
  unmount: {
    millis: 3000,
    dieOnTimeout: false,
    warningMillis: defaultWarningMillis,
  },
  unload: {
    millis: 3000,
    dieOnTimeout: false,
    warningMillis: defaultWarningMillis,
  },
  update: {
    millis: 3000,
    dieOnTimeout: false,
    warningMillis: defaultWarningMillis,
  },
};

/**
 * Sets the maximum time allowed for the bootstrap lifecycle method.
 * @param {number} time - Maximum timeout.
 * @param {boolean} dieOnTimeout - Indicator whether to throw error on reaching timeout.
 * @param {number} warningMillis - Milleseconds to warn before reaching timeout.
 * @throws {Error} Will throw an error if time is not a positive number.
 */
export function setBootstrapMaxTime(time, dieOnTimeout, warningMillis) {
  if (typeof time !== "number" || time <= 0) {
    throw Error(
      formatErrorMessage(
        16,
        __DEV__ &&
          `bootstrap max time must be a positive integer number of milliseconds`
      )
    );
  }

  globalTimeoutConfig.bootstrap = {
    millis: time,
    dieOnTimeout,
    warningMillis: warningMillis || defaultWarningMillis,
  };
}

/**
 * Sets the maximum time allowed for the mount lifecycle method.
 * @param {number} time - Maximum timeout.
 * @param {boolean} dieOnTimeout - Indicator whether to throw error on reaching timeout.
 * @param {number} warningMillis - Milleseconds to warn before reaching timeout.
 * @throws {Error} Will throw an error if time is not a positive number.
 */
export function setMountMaxTime(time, dieOnTimeout, warningMillis) {
  if (typeof time !== "number" || time <= 0) {
    throw Error(
      formatErrorMessage(
        17,
        __DEV__ &&
          `mount max time must be a positive integer number of milliseconds`
      )
    );
  }

  globalTimeoutConfig.mount = {
    millis: time,
    dieOnTimeout,
    warningMillis: warningMillis || defaultWarningMillis,
  };
}

/**
 * Sets the maximum time allowed for the unmount lifecycle method.
 * @param {number} time - Maximum timeout.
 * @param {boolean} dieOnTimeout - Indicator whether to throw error on reaching timeout.
 * @param {number} warningMillis - Milleseconds to warn before reaching timeout.
 * @throws {Error} Will throw an error if time is not a positive number.
 */
export function setUnmountMaxTime(time, dieOnTimeout, warningMillis) {
  if (typeof time !== "number" || time <= 0) {
    throw Error(
      formatErrorMessage(
        18,
        __DEV__ &&
          `unmount max time must be a positive integer number of milliseconds`
      )
    );
  }

  globalTimeoutConfig.unmount = {
    millis: time,
    dieOnTimeout,
    warningMillis: warningMillis || defaultWarningMillis,
  };
}

/**
 * Sets the maximum time allowed for the unload lifecycle method.
 * @param {number} time - Maximum timeout.
 * @param {boolean} dieOnTimeout - Indicator whether to throw error on reaching timeout.
 * @param {number} warningMillis - Milleseconds to warn before reaching timeout.
 * @throws {Error} Will throw an error if time is not a positive number.
 */
export function setUnloadMaxTime(time, dieOnTimeout, warningMillis) {
  if (typeof time !== "number" || time <= 0) {
    throw Error(
      formatErrorMessage(
        19,
        __DEV__ &&
          `unload max time must be a positive integer number of milliseconds`
      )
    );
  }

  globalTimeoutConfig.unload = {
    millis: time,
    dieOnTimeout,
    warningMillis: warningMillis || defaultWarningMillis,
  };
}

/**
 * Returns a promise which will resolve when the provided lifecycle of the app/parcel completes within the reasonable time (defined in globalTimeoutConfig), or rejects/warns if lifecycle takes more time than expected.
 * @param {any} appOrParcel - Object representing the app or parcel.
 * @param {string} lifecycle - Name of the lifecycle.
 * @returns {Promise} Promise representing the completion of lifecycle.
 */
export function reasonableTime(appOrParcel, lifecycle) {
  const timeoutConfig = appOrParcel.timeouts[lifecycle];
  const warningPeriod = timeoutConfig.warningMillis;
  const type = objectType(appOrParcel);

  return new Promise((resolve, reject) => {
    let finished = false;
    let errored = false;

    appOrParcel[lifecycle](getProps(appOrParcel))
      .then((val) => {
        finished = true;
        resolve(val);
      })
      .catch((val) => {
        finished = true;
        reject(val);
      });

    setTimeout(() => maybeTimingOut(1), warningPeriod);
    setTimeout(() => maybeTimingOut(true), timeoutConfig.millis);

    const errMsg = formatErrorMessage(
      31,
      __DEV__ &&
        `Lifecycle function ${lifecycle} for ${type} ${toName(
          appOrParcel
        )} lifecycle did not resolve or reject for ${timeoutConfig.millis} ms.`,
      lifecycle,
      type,
      toName(appOrParcel),
      timeoutConfig.millis
    );

    function maybeTimingOut(shouldError) {
      if (!finished) {
        if (shouldError === true) {
          errored = true;
          if (timeoutConfig.dieOnTimeout) {
            reject(Error(errMsg));
          } else {
            console.error(errMsg);
            //don't resolve or reject, we're waiting this one out
          }
        } else if (!errored) {
          const numWarnings = shouldError;
          const numMillis = numWarnings * warningPeriod;
          console.warn(errMsg);
          if (numMillis + warningPeriod < timeoutConfig.millis) {
            setTimeout(() => maybeTimingOut(numWarnings + 1), warningPeriod);
          }
        }
      }
    }
  });
}

/**
 * Construct an object containing timeout configurations for each lifecycle, by merging the global default timeout configurations and the provided timeout configurations.
 * @param {any} timeouts - An optional object containing timeout configurations differing from the global defaults.
 * @returns {object} Object containing timeout configurations for each lifecycle.
 */
export function ensureValidAppTimeouts(timeouts) {
  const result = {};

  for (let key in globalTimeoutConfig) {
    result[key] = assign(
      {},
      globalTimeoutConfig[key],
      (timeouts && timeouts[key]) || {}
    );
  }

  return result;
}
