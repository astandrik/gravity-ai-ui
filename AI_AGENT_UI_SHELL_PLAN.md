# AI-Agent UI Shell MVP Plan

## Summary

- Replace `/` with a dark Gravity UI agent shell: chat timeline, prompt composer, streaming status, and rendered A2UI surfaces per assistant turn.
- Use A2UI React/web core packages as the client renderer foundation, but expose only a custom Gravity-only catalog: `Column`, `Row`, `Card`, `Text`, `Button`, `TextField`, `CheckBox`, `ChoicePicker`, `Divider`.
- Use OpenAI Responses API with streaming function-call events to progressively emit complete A2UI messages.

References:

- [A2UI React renderer](https://github.com/google/A2UI/tree/main/renderers/react)
- [A2UI protocol](https://github.com/google/A2UI)
- [OpenAI function-call streaming](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI model guidance](https://developers.openai.com/api/docs/models/compare)

## Key Changes

- Add dependencies via npm: `@a2ui/react@0.10.0`, `@a2ui/web_core@0.10.0`, `openai@6.38.0`, `zod@3.25.76`.
- Add `POST /api/agent` in `src/app/api/agent/route.ts`.
  - Request body: `{ kind: "prompt", conversationId, prompt }` or `{ kind: "action", conversationId, surfaceId, action, context?, dataModel? }`.
  - Response: `text/event-stream` with events `status`, `a2ui`, `error`, `done`.
- Add server-side OpenAI adapter under `src/lib/agent/*`.
  - Reads `OPENAI_API_KEY`.
  - Uses `OPENAI_MODEL || "gpt-5.5"`.
  - Sets `store: false`.
  - Defines one tool: `emit_a2ui_message({ sequence: number, messageJson: string })`.
  - On `response.function_call_arguments.done`, parse `messageJson`, validate with Zod, then stream one `a2ui` SSE event.
- Add Gravity A2UI catalog and validators.
  - Reject unknown components, HTML/Markdown/Image/iframe-like content, unknown actions, invalid child references, duplicate IDs, and any surface without a `root`.
  - Map allowed A2UI components to existing Gravity UI exports through `src/components/GravityUI/GravityUI.tsx`.
- Replace current home scaffold in `src/app/page.tsx` with the shell.
  - Client component owns local transcript state.
  - Uses `fetch` POST + ReadableStream SSE parser, not `EventSource`, because prompts/actions require POST.
  - Surface actions post back as `kind: "action"` and append streamed results to the same conversation.

## Behavior

- The shell starts with an empty conversation and a compact prompt composer.
- A user prompt creates a pending assistant turn, opens the SSE stream, and renders A2UI messages as soon as each validated tool call completes.
- Invalid generated messages are never rendered. The server emits `error`, then a deterministic local Gravity card explaining that the generated UI failed validation.
- No persistence, auth, file upload, external tools, or multi-user session storage in MVP. Refresh clears state.

## Test Plan

- Unit-test A2UI validators: accepts valid surface/message sequences; rejects unknown components, duplicate IDs, missing `root`, broken child refs, and disallowed media/HTML fields.
- Unit-test SSE helpers and OpenAI event accumulator with mocked `response.function_call_arguments.done` events.
- Unit-test API route behavior for missing `OPENAI_API_KEY`, valid mocked stream, invalid generated message, and action requests.
- Run `npm run lint`, `npm test`, `npm run typecheck`, `npm run build`.
- Browser-verify `/`: prompt submission, progressive status, rendered Gravity surface, validation error fallback, and responsive layout.

## Assumptions

- First version is a UI-composer agent, not a general assistant.
- Progressive UI means message-level progression: render each complete validated A2UI message as it arrives, not unsafe partial JSON rendering.
- `gpt-5.5` is the default model because current OpenAI docs recommend it as the flagship starting point; `OPENAI_MODEL` can override it.
