import { objectType, toName } from "./app.helpers";

/**
 * An array to store application error handlers.
 */
let errorHandlers = [];

/**
 * Handles app errors by transforming the error and executing any registered error handlers.
 * @param {Error} err - Original error.
 * @param {any} app - The application where the error occurred.
 * @param {string} newStatus - The new status of the application.
 */
export function handleAppError(err, app, newStatus) {
  const transformedErr = transformErr(err, app, newStatus);

  if (errorHandlers.length) {
    errorHandlers.forEach((handler) => handler(transformedErr));
  } else {
    setTimeout(() => {
      throw transformedErr;
    });
  }
}

/**
 * Adds an error handler to the application error handlers array.
 * @param {function} handler - The function to handle application errors.
 * @throws {Error} Will throw an error if handler is not a function.
 */
export function addErrorHandler(handler) {
  if (typeof handler !== "function") {
    throw Error(
      formatErrorMessage(
        28,
        __DEV__ && "a single-spa error handler must be a function"
      )
    );
  }

  errorHandlers.push(handler);
}

/**
 * Removes an error handler from the application error handlers array.
 * @param {function} handler - The function to remove from the application error handlers.
 * @returns {boolean} Indicates whether an error handler was actually removed.
 * @throws {Error} Will throw an error if handler is not a function.
 */
export function removeErrorHandler(handler) {
  if (typeof handler !== "function") {
    throw Error(
      formatErrorMessage(
        29,
        __DEV__ && "a single-spa error handler must be a function"
      )
    );
  }

  let removedSomething = false;
  errorHandlers = errorHandlers.filter((h) => {
    const isHandler = h === handler;
    removedSomething = removedSomething || isHandler;
    return !isHandler;
  });

  return removedSomething;
}

/**
 * Formats error messages to be displayed.
 * @param {number|string} code - The error code.
 * @param {string} msg - The error message.
 * @param {Array} args - Additional arguments to be included in the message.
 * @returns {string} The formatted message.
 */
export function formatErrorMessage(code, msg, ...args) {
  return `single-spa minified message #${code}: ${
    msg ? msg + " " : ""
  }See https://single-spa.js.org/error/?code=${code}${
    args.length ? `&arg=${args.join("&arg=")}` : ""
  }`;
}

/**
 * Transforms the error message of the error object to include more details about the error.
 * @param {Error|any} ogErr - The original Error to transform.
 * @param {any} appOrParcel - The application or parcel where the error occurred.
 * @param {string} newStatus - The new status of the application or parcel.
 * @returns {Error|any} The transformed Error.
 */
export function transformErr(ogErr, appOrParcel, newStatus) {
  const errPrefix = `${objectType(appOrParcel)} '${toName(
    appOrParcel
  )}' died in status ${appOrParcel.status}: `;

  let result;

  if (ogErr instanceof Error) {
    try {
      ogErr.message = errPrefix + ogErr.message;
    } catch (err) {
      /* Some errors have read-only message properties, in which case there is nothing
       * that we can do.
       */
    }
    result = ogErr;
  } else {
    console.warn(
      formatErrorMessage(
        30,
        __DEV__ &&
          `While ${appOrParcel.status}, '${toName(
            appOrParcel
          )}' rejected its lifecycle function promise with a non-Error. This will cause stack traces to not be accurate.`,
        appOrParcel.status,
        toName(appOrParcel)
      )
    );
    try {
      result = Error(errPrefix + JSON.stringify(ogErr));
    } catch (err) {
      // If it's not an Error and you can't stringify it, then what else can you even do to it?
      result = ogErr;
    }
  }

  result.appOrParcelName = toName(appOrParcel);

  // We set the status after transforming the error so that the error message
  // references the state the application was in before the status change.
  appOrParcel.status = newStatus;

  return result;
}
