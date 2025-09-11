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
import { registerUser, loginUser, verifyToken, extractTokenFromHeader } from "./auth.js";

const fastify = Fastify({ logger: true });
await fastify.register(cors, { origin: true });

fastify.get("/health", async () => ({ ok: true }));

fastify.get("/models", async () => snapshotRegistry());

// Auth routes
fastify.post("/auth/register", async (req, reply) => {
    const schema = z.object({
        username: z.string().min(3).max(50),
        password: z.string().min(6),
        displayName: z.string().min(1).max(100),
    });

    try {
        const parsed = schema.parse(req.body);
        const result = await registerUser(parsed);

        if ("error" in result) {
            return reply.status(400).send(result);
        }

        return result;
    } catch (error) {
        return reply.status(400).send({ error: "Invalid input" });
    }
});

fastify.post("/auth/login", async (req, reply) => {
    const schema = z.object({
        username: z.string().min(1),
        password: z.string().min(1),
    });

    try {
        const parsed = schema.parse(req.body);
        const result = await loginUser(parsed);

        if ("error" in result) {
            return reply.status(401).send(result);
        }

        return result;
    } catch (error) {
        return reply.status(400).send({ error: "Invalid input" });
    }
});

fastify.get("/auth/me", async (req, reply) => {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
        return reply.status(401).send({ error: "Authorization token required" });
    }

    const user = await verifyToken(token);
    if (!user) {
        return reply.status(401).send({ error: "Invalid token" });
    }

    return { user };
});

fastify.post("/campaigns", async (req, reply) => {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
        return reply.status(401).send({ error: "Authorization token required" });
    }

    const user = await verifyToken(token);
    if (!user) {
        return reply.status(401).send({ error: "Invalid token" });
    }

    const schema = z.object({
        name: z.string().min(1),
        gmIsHuman: z.boolean(),
        gmAIModelId: z.string().optional(),
        seatCount: z.number().int().min(1).max(8),
        aiEnabledDefault: z.boolean().optional(),
    });

    const parsed = schema.parse(req.body);
    if (!parsed.gmIsHuman && !parsed.gmAIModelId) {
        return reply.status(400).send({ error: "gmAIModelId required if gmIsHuman=false" });
    }

    const res = await createCampaign(parsed, user);
    return res;
});

fastify.post("/campaigns/join", async (req, reply) => {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
        return reply.status(401).send({ error: "Authorization token required" });
    }

    const user = await verifyToken(token);
    if (!user) {
        return reply.status(401).send({ error: "Invalid token" });
    }

    const schema = z.object({
        roomCode: z.string().min(4),
        playerDisplayName: z.string().optional(),
    });
    const parsed = schema.parse(req.body);
    const res = await joinCampaign(parsed, user);
    if (!res) return reply.status(404).send({ error: "Campaign not found" });
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
    const ok = await updateSeatAI({ campaignId: params.id, seatId: body.seatId, ai: body.ai });
    if (!ok) return reply.status(400).send({ error: "Update failed" });
    return { ok: true };
});

fastify.post("/campaigns/:id/seat/human", async (req, reply) => {
    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ seatId: z.string(), playerId: z.string().optional() }).parse(req.body);
    const ok = await assignSeat({
        campaignId: params.id,
        seatId: body.seatId,
        playerId: body.playerId,
    });
    if (!ok) return reply.status(400).send({ error: "Assign failed" });
    return { ok: true };
});

fastify.get("/campaigns", async () => await listCampaigns());

const port = Number(process.env.PORT || 13333);
fastify.listen({ port, host: "0.0.0.0" }).catch((err) => {
    fastify.log.error(err);
    process.exit(1);
});
