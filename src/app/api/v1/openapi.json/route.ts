import { SITE } from "@/lib/api-core";
import { loadCatalog } from "@/lib/catalog-server";
import { CORS_HEADERS } from "@/lib/api-http";
import { generateSchema } from "@/lib/mcp";

export const runtime = "nodejs";

const error = { $ref: "#/components/schemas/Error" };
const errors = (...codes: number[]) =>
  Object.fromEntries(codes.map((c) => [String(c), { description: ERROR_TEXT[c] ?? "Error", content: { "application/json": { schema: error } } }]));
const ERROR_TEXT: Record<number, string> = {
  400: "Invalid input (error.code: bad_request, unknown_type)",
  401: "Missing, invalid or revoked API key (key_required, invalid_key)",
  403: "Plan limit (pro_format, pro_files) or suspended account",
  404: "Not found",
  429: "Rate limit (per minute) or AI credits used up (rate_limited)",
  502: "The AI call failed — no credits were used (ai_failed)",
  503: "Maintenance, API switched off or AI unavailable",
};

/** GET /api/v1/openapi.json — OpenAPI 3.1 description of the public API (ChatGPT Actions, Postman, codegen). */
export async function GET() {
  await loadCatalog();
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Prompt.Monster API",
      version: "1.0.0",
      description:
        "Turn a product idea into a production-grade master build prompt for AI coding tools. Prompt generation is free and deterministic; refine spends AI credits. Keys: " +
        `${SITE}/account/api — docs: ${SITE}/developers`,
      contact: { email: "hello@prompter.monster", url: `${SITE}/developers` },
    },
    servers: [{ url: SITE }],
    security: [{}, { bearerAuth: [] }],
    paths: {
      "/api/v1/types": {
        get: {
          operationId: "listProjectTypes",
          summary: "List project types",
          description: "Project types with a one-line description. Pass an id as projectType to generatePrompt.",
          parameters: [{ name: "lang", in: "query", required: false, schema: { type: "string", enum: ["EN", "TR"], default: "EN" } }],
          responses: {
            "200": {
              description: "Project types",
              content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/ProjectType" } } } } } },
            },
            ...errors(429, 503),
          },
        },
      },
      "/api/v1/types/{id}": {
        get: {
          operationId: "getTypePreset",
          summary: "Get a project type's preset",
          description: "Recommended experts, stack, v1 features, payments, monetization and compliance for a project type.",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Preset", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/TypePreset" } } } } } },
            ...errors(404, 429, 503),
          },
        },
      },
      "/api/v1/generate": {
        post: {
          operationId: "generatePrompt",
          summary: "Generate a master build prompt",
          description:
            "Builds the master prompt (or one prompt per expert, or Pro project files) from the idea. Free without a key: 3 experts, ChatGPT Markdown / Claude XML. No AI credits.",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/GenerateInput" } } } },
          responses: {
            "200": { description: "Generated prompt", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/GenerateResult" } } } } } },
            ...errors(400, 401, 403, 429, 503),
          },
        },
      },
      "/api/v1/refine": {
        post: {
          operationId: "refinePrompt",
          summary: "Refine a prompt with Claude",
          description: "Claude rewrites a build prompt into a strictly better version. Needs an API key; spends 3 AI credits of the key owner's plan.",
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RefineInput" } } } },
          responses: {
            "200": { description: "Improved prompt", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/RefineResult" } } } } } },
            ...errors(400, 401, 403, 429, 502, 503),
          },
        },
      },
      "/api/v1/shared/{slug}": {
        get: {
          operationId: "getSharedPrompt",
          summary: "Get a shared prompt",
          description: `A prompt someone shared at ${SITE}/p/{slug}.`,
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Shared prompt", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/SharedPrompt" } } } } } },
            ...errors(404, 429, 503),
          },
        },
      },
    },
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", description: "API key (pm_live_…) from /account/api" } },
      schemas: {
        Error: {
          type: "object",
          properties: { error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" } }, required: ["code", "message"] } },
        },
        ProjectType: {
          type: "object",
          properties: { id: { type: "string" }, name: { type: "string" }, category: { type: "string" }, badge: { type: "string" }, description: { type: "string" }, url: { type: "string" } },
          required: ["id", "name", "category"],
        },
        TypePreset: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            experts: { type: "array", items: { type: "string" } },
            stack: { type: "array", items: { type: "string" } },
            features: { type: "array", items: { type: "string" } },
            payments: { type: "array", items: { type: "string" } },
            monetization: { type: "array", items: { type: "string" } },
            compliance: { type: "array", items: { type: "string" } },
          },
        },
        GenerateInput: generateSchema(true, ["mega", "experts", "files"]),
        GenerateResult: {
          type: "object",
          properties: {
            plan: { type: "string", enum: ["free", "pro"] },
            name: { type: "string" },
            projectType: { type: "string" },
            projectTypeName: { type: "string" },
            format: { type: "string" },
            lang: { type: "string" },
            experts: { type: "array", items: { type: "string" } },
            header: { type: "string", description: "Short summary header of the master prompt" },
            megaPrompt: { type: "string", description: "output=mega" },
            prompts: { type: "object", additionalProperties: { type: "string" }, description: "output=experts: expert id → prompt" },
            files: { type: "object", additionalProperties: { type: "string" }, description: "output=files (Pro): path → file content" },
            notes: { type: "array", items: { type: "string" } },
            studioUrl: { type: "string" },
          },
        },
        RefineInput: {
          type: "object",
          properties: {
            prompt: { type: "string", minLength: 50, maxLength: 60000 },
            expertRole: { type: "string", default: "expert" },
            lang: { type: "string", enum: ["EN", "TR"], default: "EN" },
            format: { type: "string", default: "Claude XML" },
          },
          required: ["prompt"],
        },
        RefineResult: {
          type: "object",
          properties: {
            text: { type: "string" },
            remaining: { type: "integer" },
            credits: {
              type: "object",
              properties: {
                cost: { type: "integer" },
                remaining: { type: "integer" },
                limit: { type: "integer" },
                monthUsed: { type: ["integer", "null"] },
                monthLimit: { type: ["integer", "null"] },
                plan: { type: "string" },
              },
            },
          },
        },
        SharedPrompt: {
          type: "object",
          properties: {
            slug: { type: "string" },
            name: { type: "string" },
            projectType: { type: "string" },
            version: { type: "integer" },
            format: { type: "string" },
            lang: { type: "string" },
            experts: { type: "array", items: { type: "string" } },
            prompt: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  };
  return new Response(JSON.stringify(spec, null, 2), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
