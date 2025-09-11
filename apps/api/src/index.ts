import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import { snapshotRegistry } from "./aiModels.js";
import {
    createCampaign,
    joinCampaign,
    updateSeatAI,
    assignSeat,
    listCampaigns,
} from "./repositories.js";

const fastify = Fastify({ logger: true });
await fastify.register(cors, { origin: true });

fastify.get("/health", async () => ({ ok: true }));

fastify.get("/models", async () => snapshotRegistry());

fastify.post("/campaigns", async (req, reply) => {
    const schema = z.object({
        name: z.string().min(1),
        gmIsHuman: z.boolean(),
        gmAIModelId: z.string().optional(),
        seatCount: z.number().int().min(1).max(8),
        aiEnabledDefault: z.boolean().optional(),
        creatorDisplayName: z.string().min(1),
    });
    const parsed = schema.parse(req.body);
    if (!parsed.gmIsHuman && !parsed.gmAIModelId) {
        return reply.status(400).send({ error: "gmAIModelId required if gmIsHuman=false" });
    }
    const res = createCampaign(
        {
            name: parsed.name,
            gmIsHuman: parsed.gmIsHuman,
            gmAIModelId: parsed.gmAIModelId,
            seatCount: parsed.seatCount,
            aiEnabledDefault: parsed.aiEnabledDefault,
        },
        parsed.creatorDisplayName,
    );
    return res;
});

fastify.post("/campaigns/join", async (req, reply) => {
    const schema = z.object({ roomCode: z.string().min(4), playerDisplayName: z.string().min(1) });
    const parsed = schema.parse(req.body);
    const res = joinCampaign(parsed);
    if (!res) return reply.status(404).send({ error: "Not found" });
    return res;
});

fastify.post("/campaigns/:id/seat/ai", async (req, reply) => {
    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z
        .object({
            seatId: z.string(),
            ai: z.object({
                enabled: z.boolean(),
                modelId: z.string().optional(),
                personaPreset: z.string().optional(),
            }),
        })
        .parse(req.body);
    const ok = updateSeatAI({ campaignId: params.id, seatId: body.seatId, ai: body.ai });
    if (!ok) return reply.status(400).send({ error: "Update failed" });
    return { ok: true };
});

fastify.post("/campaigns/:id/seat/human", async (req, reply) => {
    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ seatId: z.string(), playerId: z.string().optional() }).parse(req.body);
    const ok = assignSeat({ campaignId: params.id, seatId: body.seatId, playerId: body.playerId });
    if (!ok) return reply.status(400).send({ error: "Assign failed" });
    return { ok: true };
});

fastify.get("/campaigns", async () => listCampaigns());

const port = Number(process.env.PORT || 13333);
fastify.listen({ port, host: "0.0.0.0" }).catch((err) => {
    fastify.log.error(err);
    process.exit(1);
});
