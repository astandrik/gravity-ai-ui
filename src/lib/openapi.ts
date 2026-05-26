import { toPublicUrl } from "@/lib/base-path";

export function buildOpenApiDocument() {
  const serverUrl = toPublicUrl("/").replace(/\/$/, "");

  return {
    openapi: "3.1.0",
    info: {
      title: "Gravity AI UI API",
      version: "1.0.0",
      description:
        "API, MCP, and discovery surfaces for Gravity AI UI, an agent-ready generator for validated A2UI and Gravity UI product interfaces.",
      contact: {
        name: "Gravity AI UI",
        url: toPublicUrl("/docs"),
      },
      license: {
        name: "Apache-2.0",
      },
    },
    servers: [{ url: serverUrl }],
    tags: [
      { name: "Agent", description: "Interface generation and refinement." },
      { name: "Feedback", description: "Publish liked generated interfaces." },
      { name: "MCP", description: "Streamable HTTP MCP transport." },
      { name: "Discovery", description: "Agent-readable discovery metadata." },
    ],
    paths: {
      "/api/agent": {
        post: {
          operationId: "streamGravityInterface",
          tags: ["Agent"],
          summary: "Stream generated Gravity UI interface events",
          description:
            "Accepts a prompt or action request and returns Server-Sent Events with status, A2UI messages, composed payload snapshots, errors, and a final done event.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AgentRequest" },
                examples: {
                  prompt: {
                    value: {
                      kind: "prompt",
                      conversationId: "demo-conversation",
                      prompt: "Build a deployment review dashboard",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "SSE stream of agent events.",
              content: {
                "text/event-stream": {
                  schema: { type: "string" },
                },
              },
              headers: rateLimitHeaders(),
            },
            "400": problemResponse("Invalid agent request."),
            "503": problemResponse("Generator configuration unavailable."),
          },
        },
      },
      "/api/design-feedback": {
        post: {
          operationId: "publishDesignFeedback",
          tags: ["Feedback"],
          summary: "Publish liked interface feedback to the public gallery",
          description:
            "Stores a liked composed interface payload and schedules gallery thumbnail generation. Current public demo accepts only positive published feedback from the app flow.",
          parameters: [
            {
              name: "Idempotency-Key",
              in: "header",
              required: false,
              schema: { type: "string", minLength: 1, maxLength: 200 },
              description:
                "Optional caller-provided retry key. The current demo documents the header for agent retry planning; durable idempotency is not enforced.",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DesignFeedbackRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Feedback was stored and a gallery id was created.",
              headers: rateLimitHeaders(),
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["feedbackId", "galleryId", "rating", "createdAtMs"],
                    properties: {
                      feedbackId: { type: "string" },
                      galleryId: { type: "string" },
                      rating: { type: "integer", const: 1 },
                      createdAtMs: { type: "integer" },
                    },
                  },
                },
              },
            },
            "400": problemResponse("Invalid design feedback."),
            "503": problemResponse("Feedback storage unavailable."),
          },
        },
      },
      "/mcp": mcpPathItem("callMcpServer"),
      "/.well-known/mcp": mcpPathItem("callWellKnownMcpServer"),
      "/openapi.json": {
        get: {
          operationId: "getOpenApiSpec",
          tags: ["Discovery"],
          summary: "Fetch the OpenAPI 3.1 document",
          responses: {
            "200": jsonResponse("#/components/schemas/OpenApiDocument"),
          },
        },
      },
      "/.well-known/oauth-authorization-server": {
        get: {
          operationId: "getOAuthAuthorizationServerMetadata",
          tags: ["Discovery"],
          summary: "Fetch OAuth authorization server metadata",
          responses: {
            "200": jsonResponse(
              "#/components/schemas/OAuthAuthorizationServerMetadata",
            ),
          },
        },
      },
      "/.well-known/oauth-protected-resource": {
        get: {
          operationId: "getOAuthProtectedResourceMetadata",
          tags: ["Discovery"],
          summary: "Fetch OAuth protected-resource metadata",
          responses: {
            "200": jsonResponse("#/components/schemas/OAuthProtectedResourceMetadata"),
          },
        },
      },
      "/.well-known/oauth-protected-resource/mcp": {
        get: {
          operationId: "getMcpOAuthProtectedResourceMetadata",
          tags: ["Discovery"],
          summary: "Fetch MCP protected-resource metadata",
          responses: {
            "200": jsonResponse("#/components/schemas/OAuthProtectedResourceMetadata"),
          },
        },
      },
    },
    components: {
      securitySchemes: {
        OAuth2Metadata: {
          type: "oauth2",
          description:
            "Discovery metadata is published for agent compatibility. Token issuance is disabled in the current public demo.",
          flows: {
            authorizationCode: {
              authorizationUrl: toPublicUrl("/oauth/authorize"),
              tokenUrl: toPublicUrl("/oauth/token"),
              scopes: {
                "interface:generate": "Generate and refine interfaces.",
                "interface:read": "Read public gallery interfaces.",
              },
            },
          },
        },
      },
      schemas: {
        AgentRequest: {
          oneOf: [
            { $ref: "#/components/schemas/PromptAgentRequest" },
            { $ref: "#/components/schemas/ActionAgentRequest" },
          ],
        },
        PromptAgentRequest: {
          type: "object",
          additionalProperties: false,
          required: ["kind", "conversationId", "prompt"],
          properties: {
            kind: { type: "string", const: "prompt" },
            conversationId: { type: "string", minLength: 1, maxLength: 120 },
            prompt: { type: "string", minLength: 1, maxLength: 6000 },
            conversationContext: { $ref: "#/components/schemas/ConversationContext" },
          },
        },
        ActionAgentRequest: {
          type: "object",
          additionalProperties: false,
          required: ["kind", "conversationId", "surfaceId", "action"],
          properties: {
            kind: { type: "string", const: "action" },
            conversationId: { type: "string", minLength: 1, maxLength: 120 },
            surfaceId: { type: "string", minLength: 1, maxLength: 80 },
            action: {},
            context: {},
            dataModel: {},
            conversationContext: { $ref: "#/components/schemas/ConversationContext" },
          },
        },
        ConversationContext: {
          type: "object",
          additionalProperties: false,
          properties: {
            history: {
              type: "array",
              maxItems: 12,
              items: { $ref: "#/components/schemas/ConversationHistoryItem" },
            },
            latestSurfaceId: { type: "string", minLength: 1, maxLength: 80 },
            latestPayload: { $ref: "#/components/schemas/ComposedInterfacePayload" },
            latestDataModel: {},
          },
        },
        ConversationHistoryItem: {
          type: "object",
          additionalProperties: false,
          required: ["role", "text"],
          properties: {
            role: { type: "string", enum: ["user", "assistant"] },
            text: { type: "string", minLength: 1, maxLength: 2000 },
            surfaceId: { type: "string", minLength: 1, maxLength: 80 },
          },
        },
        ComposedInterfacePayload: {
          type: "object",
          additionalProperties: false,
          required: ["sequence", "surfaceId", "root", "nodes"],
          properties: {
            sequence: { type: "integer", minimum: 0, maximum: 10000 },
            surfaceId: { type: "string", minLength: 1, maxLength: 80 },
            dataModel: {},
            root: {
              type: "object",
              required: ["component"],
              properties: {
                component: { type: "string", enum: ["Column", "Row"] },
                props: { type: "object" },
              },
            },
            nodes: {
              type: "array",
              maxItems: 120,
              items: {
                type: "object",
                required: ["id", "component"],
                properties: {
                  id: { type: "string" },
                  parentId: { type: ["string", "null"] },
                  order: { type: "integer", minimum: 0 },
                  component: { type: "string" },
                  props: { type: "object" },
                },
              },
            },
          },
        },
        DesignFeedbackRequest: {
          type: "object",
          additionalProperties: false,
          required: ["conversationId", "turnId", "rating", "publish", "payload"],
          properties: {
            conversationId: { type: "string", minLength: 1, maxLength: 120 },
            turnId: { type: "string", minLength: 1, maxLength: 160 },
            rating: { type: "integer", const: 1 },
            publish: { type: "boolean", const: true },
            prompt: { type: "string", maxLength: 6000 },
            payload: { $ref: "#/components/schemas/ComposedInterfacePayload" },
            messages: { type: "array", maxItems: 12, items: {} },
            dataModel: {},
            conversationContext: { type: "object" },
          },
        },
        JsonRpcRequest: {
          type: "object",
          required: ["jsonrpc", "method"],
          properties: {
            jsonrpc: { type: "string", const: "2.0" },
            id: { type: ["string", "number", "null"] },
            method: { type: "string" },
            params: { type: "object" },
          },
        },
        JsonRpcResponse: {
          type: "object",
          required: ["jsonrpc"],
          properties: {
            jsonrpc: { type: "string", const: "2.0" },
            id: { type: ["string", "number", "null"] },
            result: {},
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "integer" },
                message: { type: "string" },
              },
            },
          },
        },
        ProblemDetails: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                docs: { type: "string", format: "uri" },
                issues: {},
              },
            },
          },
        },
        OAuthAuthorizationServerMetadata: {
          type: "object",
          required: ["issuer", "authorization_endpoint", "token_endpoint"],
          properties: {
            issuer: { type: "string", format: "uri" },
            authorization_endpoint: { type: "string", format: "uri" },
            token_endpoint: { type: "string", format: "uri" },
            response_types_supported: { type: "array", items: { type: "string" } },
            grant_types_supported: { type: "array", items: { type: "string" } },
            code_challenge_methods_supported: {
              type: "array",
              items: { type: "string" },
            },
            scopes_supported: { type: "array", items: { type: "string" } },
          },
        },
        OAuthProtectedResourceMetadata: {
          type: "object",
          required: ["resource"],
          properties: {
            resource: { type: "string", format: "uri" },
            authorization_servers: { type: "array", items: { type: "string" } },
            scopes_supported: { type: "array", items: { type: "string" } },
            bearer_methods_supported: { type: "array", items: { type: "string" } },
            resource_name: { type: "string" },
            resource_documentation: { type: "string", format: "uri" },
          },
        },
        OpenApiDocument: {
          type: "object",
          description: "OpenAPI 3.1 document.",
        },
      },
    },
  } as const;
}

function mcpPathItem(operationId: string) {
  return {
    post: {
      operationId,
      tags: ["MCP"],
      summary: "Call the Gravity AI UI MCP server",
      description:
        "Streamable HTTP MCP endpoint. Send JSON-RPC requests with Accept: application/json, text/event-stream.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/JsonRpcRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "JSON-RPC response.",
          headers: rateLimitHeaders(),
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/JsonRpcResponse" },
            },
          },
        },
        "403": problemResponse("Forbidden origin."),
        "405": problemResponse("Method not allowed."),
        "500": problemResponse("Internal MCP server error."),
      },
    },
  };
}

function jsonResponse(schemaRef: string) {
  return {
    description: "JSON response.",
    content: {
      "application/json": {
        schema: { $ref: schemaRef },
      },
    },
  };
}

function problemResponse(description: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ProblemDetails" },
      },
    },
  };
}

function rateLimitHeaders() {
  return {
    "RateLimit-Limit": {
      schema: { type: "integer" },
      description: "Documented request budget for agent clients.",
    },
    "RateLimit-Remaining": {
      schema: { type: "integer" },
      description: "Remaining requests in the current window when enforced.",
    },
    "RateLimit-Reset": {
      schema: { type: "integer" },
      description: "Seconds until the current window resets when enforced.",
    },
  };
}
