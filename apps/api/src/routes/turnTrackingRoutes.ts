import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
    setTurnOrder,
    advanceTurn,
    skipTurn,
    reorderTurnOrder,
    getTurnOrder,
} from "../repositories.js";
import { extractTokenFromHeader, verifyToken } from "../auth.js";

export async function turnTrackingRoutes(fastify: FastifyInstance) {
    fastify.get("/campaigns/:id/turn-order", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) return reply.status(401).send({ error: "Authorization token required" });
        const user = await verifyToken(token);
        if (!user) return reply.status(401).send({ error: "Invalid token" });
        const paramsSchema = z.object({ id: z.string() });
        try {
            const params = paramsSchema.parse(req.params);
            const turnOrderDetails = await getTurnOrder(params.id, user);
            if (!turnOrderDetails) return reply.status(404).send({ error: "Turn order not found" });

            return {
                turnOrder: turnOrderDetails.turnOrder,
                currentTurnIndex: turnOrderDetails.currentTurnIndex,
                roundNumber: turnOrderDetails.roundNumber,
            };
        } catch (error: any) {
            return reply.status(400).send({ error: error.message || "Failed to fetch turn order" });
        }
    });

    fastify.post("/campaigns/:id/turn-order", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) return reply.status(401).send({ error: "Authorization token required" });
        const user = await verifyToken(token);
        if (!user) return reply.status(401).send({ error: "Invalid token" });
        const paramsSchema = z.object({ id: z.string() });
        const bodySchema = z.object({ turnOrder: z.array(z.string()) });
        try {
            const params = paramsSchema.parse(req.params);
            const body = bodySchema.parse(req.body);
            const ok = await setTurnOrder(params.id, body.turnOrder, user);
            if (!ok) return reply.status(400).send({ error: "Failed to set turn order" });

            return { ok: true };
        } catch (error: any) {
            return reply.status(400).send({ error: error.message || "Failed to set turn order" });
        }
    });

    fastify.post("/campaigns/:id/advance-turn", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) return reply.status(401).send({ error: "Authorization token required" });
        const user = await verifyToken(token);
        if (!user) return reply.status(401).send({ error: "Invalid token" });
        const paramsSchema = z.object({ id: z.string() });
        try {
            const params = paramsSchema.parse(req.params);
            const ok = await advanceTurn(params.id, user);
            if (!ok) return reply.status(400).send({ error: "Failed to advance turn" });
            return { ok: true };
        } catch (error: any) {
            return reply.status(400).send({ error: error.message || "Failed to advance turn" });
        }
    });

    fastify.post("/campaigns/:id/skip-turn", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) return reply.status(401).send({ error: "Authorization token required" });
        const user = await verifyToken(token);
        if (!user) return reply.status(401).send({ error: "Invalid token" });
        const paramsSchema = z.object({ id: z.string() });
        try {
            const params = paramsSchema.parse(req.params);
            const ok = await skipTurn(params.id, user);
            if (!ok) return reply.status(400).send({ error: "Failed to skip turn" });
            return { ok: true };
        } catch (error: any) {
            return reply.status(400).send({ error: error.message || "Failed to skip turn" });
        }
    });

    fastify.post("/campaigns/:id/reorder-turn-order", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) return reply.status(401).send({ error: "Authorization token required" });
        const user = await verifyToken(token);
        if (!user) return reply.status(401).send({ error: "Invalid token" });
        const paramsSchema = z.object({ id: z.string() });
        const bodySchema = z.object({ turnOrder: z.array(z.string()) });
        try {
            const params = paramsSchema.parse(req.params);
            const body = bodySchema.parse(req.body);
            const ok = await reorderTurnOrder(params.id, body.turnOrder, user);
            if (!ok) return reply.status(400).send({ error: "Failed to reorder turn order" });
            return { ok: true };
        } catch (error: any) {
            return reply
                .status(400)
                .send({ error: error.message || "Failed to reorder turn order" });
        }
    });
}
