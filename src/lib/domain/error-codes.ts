export const ERROR_CODES = {
  INVALID_INPUT: "INVALID_INPUT",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  CALENDAR_AUTH_EXPIRED: "CALENDAR_AUTH_EXPIRED",
  CALENDAR_API_ERROR: "CALENDAR_API_ERROR",
  SLOT_UNAVAILABLE: "SLOT_UNAVAILABLE",
  BOOKING_LOCK_FAILED: "BOOKING_LOCK_FAILED",
  EMAIL_SEND_FAILED: "EMAIL_SEND_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  code: ErrorCode;
  status: number;

  constructor(code: ErrorCode, status: number, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}
