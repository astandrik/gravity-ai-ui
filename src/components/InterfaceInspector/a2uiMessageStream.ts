export type A2uiMessageUpdateMode = "append" | "replace" | "same";

export function getA2uiMessageUpdateMode<T>(
  previousMessages: readonly T[],
  nextMessages: readonly T[],
): A2uiMessageUpdateMode {
  if (previousMessages.length === 0) {
    return nextMessages.length === 0 ? "same" : "append";
  }

  if (nextMessages.length < previousMessages.length) {
    return "replace";
  }

  for (let index = 0; index < previousMessages.length; index += 1) {
    if (previousMessages[index] !== nextMessages[index]) {
      return "replace";
    }
  }

  return nextMessages.length === previousMessages.length ? "same" : "append";
}
