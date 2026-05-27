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
          parameters: [apiVersionParameter()],
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
              description:
                "SSE stream of agent events. Generator configuration errors are emitted as SSE error events.",
              content: {
                "text/event-stream": {
                  schema: { type: "string" },
                },
              },
              headers: rateLimitHeaders(),
            },
            "400": agentProblemResponse("Invalid agent request."),
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
            apiVersionParameter(),
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
            "400": agentProblemResponse("Invalid design feedback."),
            "503": agentProblemResponse("Feedback storage unavailable."),
          },
        },
      },
      "/mcp": mcpPathItem("callMcpServer"),
      "/.well-known/mcp": wellKnownMcpPathItem(),
      "/.well-known/mcp.json": {
        get: {
          operationId: "getMcpWellKnownDocument",
          tags: ["Discovery", "MCP"],
          summary: "Fetch MCP well-known compatibility metadata",
          responses: {
            "200": jsonResponse("#/components/schemas/McpWellKnownDocument"),
          },
        },
      },
      "/.well-known/agent.json": {
        get: {
          operationId: "getAgentDiscovery",
          tags: ["Discovery"],
          summary: "Fetch generic agent discovery metadata",
          responses: {
            "200": jsonResponse("#/components/schemas/AgentDiscovery"),
          },
        },
      },
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
      "/.well-known/openid-configuration": {
        get: {
          operationId: "getOpenIdConfiguration",
          tags: ["Discovery"],
          summary: "Fetch OpenID Provider configuration",
          responses: {
            "200": jsonResponse("#/components/schemas/OpenIdConfiguration"),
          },
        },
      },
      "/oauth/authorize": {
        get: {
          operationId: "authorizeOAuthClient",
          tags: ["Discovery"],
          summary: "OAuth authorization endpoint placeholder",
          description:
            "Returns structured oauth_not_enabled JSON while token issuance is disabled in the public demo.",
          responses: {
            "501": problemResponse("OAuth authorization is not enabled."),
          },
        },
      },
      "/oauth/token": {
        post: {
          operationId: "issueOAuthToken",
          tags: ["Discovery"],
          summary: "OAuth token endpoint placeholder",
          description:
            "Returns structured oauth_not_enabled JSON while token issuance is disabled in the public demo.",
          responses: {
            "501": problemResponse("OAuth token issuance is not enabled."),
          },
        },
        get: {
          operationId: "rejectOAuthTokenGet",
          tags: ["Discovery"],
          summary: "Reject unsupported OAuth token GET requests",
          responses: {
            "405": problemResponse("OAuth token endpoint requires POST."),
          },
        },
      },
      "/oauth/userinfo": {
        get: {
          operationId: "getOAuthUserInfo",
          tags: ["Discovery"],
          summary: "OpenID UserInfo endpoint placeholder",
          description:
            "Returns structured oauth_not_enabled JSON while bearer-token enforcement is disabled in the public demo.",
          responses: {
            "501": problemResponse("OpenID UserInfo is not enabled."),
          },
        },
        post: {
          operationId: "postOAuthUserInfo",
          tags: ["Discovery"],
          summary: "OpenID UserInfo endpoint placeholder",
          description:
            "Returns structured oauth_not_enabled JSON while bearer-token enforcement is disabled in the public demo.",
          responses: {
            "501": problemResponse("OpenID UserInfo is not enabled."),
          },
        },
      },
    },
    components: {
      parameters: {
        ApiVersionHeader: {
          name: "API-Version",
          in: "header",
          required: false,
          schema: { type: "string", enum: ["1"], default: "1" },
          description:
            "Optional API version selector. The current public API version is 1 and responses echo API-Version: 1.",
        },
      },
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
        ValidationErrorResponse: {
          type: "object",
          required: ["error", "issues"],
          properties: {
            error: { type: "string" },
            issues: {
              type: "object",
              additionalProperties: true,
              description:
                "Validation details from Zod flatten(), including formErrors and fieldErrors.",
            },
          },
        },
        SimpleErrorResponse: {
          type: "object",
          required: ["error"],
          properties: {
            error: { type: "string" },
          },
        },
        McpServerCard: {
          type: "object",
          additionalProperties: false,
          required: [
            "name",
            "title",
            "description",
            "version",
            "websiteUrl",
            "serverUrl",
            "transport",
            "tools",
          ],
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            version: { type: "string" },
            websiteUrl: { type: "string", format: "uri" },
            serverUrl: { type: "string", format: "uri" },
            transport: { type: "string", const: "streamable-http" },
            tools: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "title", "description", "readOnly"],
                properties: {
                  name: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  readOnly: { type: "boolean" },
                },
              },
            },
          },
        },
        AgentDiscovery: {
          type: "object",
          required: ["name", "description", "url", "openapi", "mcp", "capabilities"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            url: { type: "string", format: "uri" },
            documentation: { type: "string", format: "uri" },
            openapi: { type: "string", format: "uri" },
            llms: { type: "string", format: "uri" },
            markdown: { type: "string", format: "uri" },
            oauth: { type: "object" },
            mcp: { type: "object" },
            capabilities: { type: "array", items: { type: "string" } },
          },
        },
        McpWellKnownDocument: {
          type: "object",
          required: [
            "name",
            "title",
            "description",
            "version",
            "websiteUrl",
            "serverUrl",
            "serverCard",
            "openapi",
            "transport",
            "tools",
            "servers",
          ],
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            version: { type: "string" },
            websiteUrl: { type: "string", format: "uri" },
            serverUrl: { type: "string", format: "uri" },
            serverCard: { type: "string", format: "uri" },
            openapi: { type: "string", format: "uri" },
            transport: { type: "string", const: "streamable-http" },
            tools: { type: "array", items: { type: "object" } },
            servers: { type: "array", items: { type: "object" } },
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
          required: [
            "issuer",
            "authorization_endpoint",
            "token_endpoint",
            "jwks_uri",
            "response_types_supported",
            "grant_types_supported",
            "token_endpoint_auth_methods_supported",
            "code_challenge_methods_supported",
            "scopes_supported",
            "service_documentation",
          ],
          properties: {
            issuer: { type: "string", format: "uri" },
            authorization_endpoint: { type: "string", format: "uri" },
            token_endpoint: { type: "string", format: "uri" },
            jwks_uri: { type: "string", format: "uri" },
            response_types_supported: { type: "array", items: { type: "string" } },
            grant_types_supported: { type: "array", items: { type: "string" } },
            token_endpoint_auth_methods_supported: {
              type: "array",
              items: { type: "string" },
            },
            code_challenge_methods_supported: {
              type: "array",
              items: { type: "string" },
            },
            scopes_supported: { type: "array", items: { type: "string" } },
            service_documentation: { type: "string", format: "uri" },
          },
        },
        OpenIdConfiguration: {
          allOf: [
            { $ref: "#/components/schemas/OAuthAuthorizationServerMetadata" },
            {
              type: "object",
              required: [
                "userinfo_endpoint",
                "subject_types_supported",
                "id_token_signing_alg_values_supported",
                "claims_supported",
              ],
              properties: {
                userinfo_endpoint: { type: "string", format: "uri" },
                subject_types_supported: {
                  type: "array",
                  items: { type: "string" },
                },
                id_token_signing_alg_values_supported: {
                  type: "array",
                  items: { type: "string" },
                },
                claims_supported: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          ],
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

function wellKnownMcpPathItem() {
  return {
    post: mcpPostOperation("callWellKnownMcpServer"),
    get: {
      operationId: "getWellKnownMcpServerCard",
      tags: ["Discovery", "MCP"],
      summary: "Fetch the Gravity AI UI MCP server card",
      responses: {
        "200": jsonResponse("#/components/schemas/McpServerCard"),
      },
    },
  };
}

function mcpPathItem(operationId: string) {
  return {
    get: methodNotAllowedOperation("rejectMcpGet"),
    post: mcpPostOperation(operationId),
    delete: methodNotAllowedOperation("rejectMcpDelete"),
  };
}

function mcpPostOperation(operationId: string) {
  return {
    operationId,
    tags: ["MCP"],
    summary: "Call the Gravity AI UI MCP server",
    parameters: [apiVersionParameter()],
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
      "403": jsonRpcErrorResponse("Forbidden origin."),
      "500": jsonRpcErrorResponse("Internal MCP server error."),
    },
  };
}

function methodNotAllowedOperation(operationId: string) {
  return {
    operationId,
    tags: ["MCP"],
    summary: "Reject unsupported MCP method",
    responses: {
      "405": jsonRpcErrorResponse("Method not allowed."),
    },
  };
}

function apiVersionParameter() {
  return { $ref: "#/components/parameters/ApiVersionHeader" };
}

function jsonResponse(
  schemaRef: string,
  description = "JSON response.",
  headers?: Record<string, unknown>,
) {
  return {
    description,
    ...(headers ? { headers } : {}),
    content: {
      "application/json": {
        schema: { $ref: schemaRef },
      },
    },
  };
}

function jsonRpcErrorResponse(description: string) {
  return jsonResponse(
    "#/components/schemas/JsonRpcResponse",
    description,
    rateLimitHeaders(),
  );
}

function agentProblemResponse(description: string) {
  return jsonResponse(
    "#/components/schemas/ProblemDetails",
    description,
    rateLimitHeaders(),
  );
}

function problemResponse(description: string) {
  return jsonResponse("#/components/schemas/ProblemDetails", description);
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
    "API-Version": {
      schema: { type: "string", enum: ["1"] },
      description: "Current public API version.",
    },
  };
}
