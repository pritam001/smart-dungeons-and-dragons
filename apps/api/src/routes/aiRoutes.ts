import { FastifyInstance } from "fastify";
import { getGeminiSuggestions } from "../aiGemini.js";
import { AISuggestionRequest } from "@dnd-ai/types";

export async function aiRoutes(fastify: FastifyInstance) {
    fastify.post("/ai/suggest", async (request, reply) => {
        const apiKey = process.env.GEMINI_API_KEY;
        fastify.log.info({ apiKeyPresent: !!apiKey }, "Received /ai/suggest request");
        fastify.log.info({ body: request.body }, "Request body");
        if (!apiKey) {
            fastify.log.error("Gemini API key not configured");
            return reply.status(500).send({ error: "Gemini API key not configured" });
        }
        const body = request.body as AISuggestionRequest;
        try {
            const result = await getGeminiSuggestions(apiKey, body);
            fastify.log.info({ result }, "AI suggestion response");
            return reply.send(result);
        } catch (err: any) {
            fastify.log.error({ error: err }, "AI suggestion error");
            return reply.status(500).send({ error: err.message || "AI suggestion error" });
        }
    });
}
