/**
 * errorHandler.js
 *
 * Central error classification utility for BibleCast frontend.
 * Converts raw Axios errors into typed AppError objects so that
 * every component can render the right icon, colour, and message
 * without duplicating logic.
 *
 * Error kinds:
 *   "network"    – No response received (server unreachable / CORS / offline)
 *   "server"     – HTTP 5xx (server crashed, unhandled exception, etc.)
 *   "auth"       – HTTP 401 / 403 (unauthenticated or forbidden)
 *   "validation" – HTTP 422 (Laravel validation bag)
 *   "client"     – HTTP 4xx other (bad request, not found, rate-limit…)
 *   "unknown"    – Anything else
 */

// ─── Error kinds ────────────────────────────────────────────────────────────
export const ERROR_KIND = {
  NETWORK:    'network',
  SERVER:     'server',
  AUTH:       'auth',
  VALIDATION: 'validation',
  CLIENT:     'client',
  UNKNOWN:    'unknown',
};

// ─── Human-readable defaults per kind ───────────────────────────────────────
const KIND_DEFAULTS = {
  [ERROR_KIND.NETWORK]:
    'Cannot reach the BibleCast server. Check your connection or try again shortly.',
  [ERROR_KIND.SERVER]:
    'The server encountered an error. This is not your fault — please try again or contact support.',
  [ERROR_KIND.AUTH]:
    'You are not authorised to perform this action. Please sign in again.',
  [ERROR_KIND.VALIDATION]:
    'Some fields are invalid. Please correct them and resubmit.',
  [ERROR_KIND.CLIENT]:
    'The request could not be completed. Please check your input and try again.',
  [ERROR_KIND.UNKNOWN]:
    'An unexpected error occurred. Please try again.',
};

/**
 * AppError — structured error object used throughout the app.
 *
 * @property {string}   kind       – One of ERROR_KIND values
 * @property {string}   message    – Primary human-readable message
 * @property {Object}   fields     – Per-field validation messages (422 only)
 * @property {number|null} status  – HTTP status code (null for network errors)
 * @property {Error}    original   – Original JS error for debugging
 */
export class AppError {
  constructor({ kind, message, fields = {}, status = null, original }) {
    this.kind     = kind;
    this.message  = message;
    this.fields   = fields;   // { email: ['Email is taken.'], password: [...] }
    this.status   = status;
    this.original = original;
  }

  /** True when this is a server-side fault (not the user's fault) */
  get isServerFault() {
    return this.kind === ERROR_KIND.NETWORK || this.kind === ERROR_KIND.SERVER;
  }

  /** True when the error carries per-field validation details */
  get hasFieldErrors() {
    return Object.keys(this.fields).length > 0;
  }
}

// ─── Main classifier ─────────────────────────────────────────────────────────

/**
 * classifyError(err) → AppError
 *
 * Pass any caught error (Axios error or plain Error) and get back
 * a fully classified AppError ready to render.
 */
export function classifyError(err) {
  // ── No response: network / CORS / server down ─────────────────────────
  if (!err.response) {
    return new AppError({
      kind:     ERROR_KIND.NETWORK,
      message:  KIND_DEFAULTS[ERROR_KIND.NETWORK],
      status:   null,
      original: err,
    });
  }

  const { status, data } = err.response;

  // ── 5xx Server errors ─────────────────────────────────────────────────
  if (status >= 500) {
    const message =
      data?.message ||
      `Server error (${status}). Our team has been notified. Please try again.`;
    return new AppError({
      kind:     ERROR_KIND.SERVER,
      message,
      status,
      original: err,
    });
  }

  // ── 401 / 403 Auth errors ─────────────────────────────────────────────
  if (status === 401 || status === 403) {
    const message =
      data?.message || KIND_DEFAULTS[ERROR_KIND.AUTH];
    return new AppError({
      kind:     ERROR_KIND.AUTH,
      message,
      status,
      original: err,
    });
  }

  // ── 422 Validation errors (Laravel) ──────────────────────────────────
  if (status === 422) {
    // Laravel returns { message: '...', errors: { field: ['msg', ...] } }
    const rawFields = data?.errors || {};
    // Flatten each field's first message for convenience
    const fields = Object.fromEntries(
      Object.entries(rawFields).map(([field, msgs]) => [field, msgs[0] ?? msgs])
    );
    const message =
      data?.message ||
      Object.values(fields)[0] ||    // show first field error as headline
      KIND_DEFAULTS[ERROR_KIND.VALIDATION];
    return new AppError({
      kind:     ERROR_KIND.VALIDATION,
      message,
      fields,
      status,
      original: err,
    });
  }

  // ── Other 4xx Client errors ───────────────────────────────────────────
  if (status >= 400 && status < 500) {
    const message =
      data?.message || KIND_DEFAULTS[ERROR_KIND.CLIENT];
    return new AppError({
      kind:     ERROR_KIND.CLIENT,
      message,
      status,
      original: err,
    });
  }

  // ── Fallback ──────────────────────────────────────────────────────────
  return new AppError({
    kind:     ERROR_KIND.UNKNOWN,
    message:  err.message || KIND_DEFAULTS[ERROR_KIND.UNKNOWN],
    status:   status ?? null,
    original: err,
  });
}
