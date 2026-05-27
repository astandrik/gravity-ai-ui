import { describe, expect, it } from "vitest";
import { readDesignFeedbackErrorMessage } from "./feedbackError";

describe("readDesignFeedbackErrorMessage", () => {
  it("reads ProblemDetails messages returned by the feedback API", () => {
    expect(
      readDesignFeedbackErrorMessage(
        {
          error: {
            code: "feedback_storage_unavailable",
            message: "YDB is unavailable.",
          },
        },
        503,
      ),
    ).toBe("YDB is unavailable.");
  });

  it("keeps legacy string errors compatible", () => {
    expect(readDesignFeedbackErrorMessage({ error: "Invalid feedback." }, 400))
      .toBe("Invalid feedback.");
  });
});
