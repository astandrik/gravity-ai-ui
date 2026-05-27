export function readDesignFeedbackErrorMessage(
  body: unknown,
  status: number,
): string {
  if (isObject(body)) {
    const error = body.error;

    if (typeof error === "string") {
      return error;
    }

    if (isObject(error) && typeof error.message === "string") {
      return error.message;
    }
  }

  return `Feedback failed with ${status}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
