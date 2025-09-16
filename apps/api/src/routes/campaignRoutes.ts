import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
    createCampaign,
    joinCampaign,
    updateSeatAI,
    assignSeat,
    addSeatsToActiveCampaign,
    listCampaigns,
    removePlayerFromCampaign,
    transferGMOwnership,
    updateCampaign,
    regenerateRoomCode,
    getSeatsForCampaign,
    getCharactersByCampaign,
} from "../repositories.js";
import { extractTokenFromHeader, verifyToken } from "../auth.js";
import { campaignsCol, getDb } from "../mongo.js";
import { SeatAssignment } from "@dnd-ai/types";
import { FastifyRequest } from "fastify";

declare module "fastify" {
    interface FastifyRequest {
        user?: { id: string }; // Extend FastifyRequest to include user property
    }
}

export async function campaignRoutes(fastify: FastifyInstance) {
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
            description: z.string().optional(),
            isPrivate: z.boolean().optional(),
            gmIsHuman: z.boolean(),
            gmAIModelId: z.string().optional(),
            seatCount: z.number().int().min(1).max(8),
            aiEnabledDefault: z.boolean().optional(),
            characterEditMode: z.enum(["strict", "collaborative", "sandbox"]).optional(),
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

        try {
            const parsed = schema.parse(req.body);
            const res = await joinCampaign(parsed, user);
            if (!res) return reply.status(404).send({ error: "Campaign not found" });
            return res;
        } catch (error: any) {
            if (error.message.includes("Campaign is full")) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes("Campaign creators cannot join")) {
                return reply.status(403).send({ error: error.message });
            }
            return reply.status(400).send({ error: "Failed to join campaign" });
        }
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
        const body = z
            .object({ seatId: z.string(), playerId: z.string().optional() })
            .parse(req.body);
        const ok = await assignSeat({
            campaignId: params.id,
            seatId: body.seatId,
            playerId: body.playerId,
        });
        if (!ok) return reply.status(400).send({ error: "Assign failed" });
        return { ok: true };
    });

    fastify.post("/campaigns/:id/seats/add", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const params = z.object({ id: z.string() }).parse(req.params);
        const body = z
            .object({ additionalSeatCount: z.number().int().min(1).max(4) })
            .parse(req.body);

        const campaigns = await listCampaigns();
        const campaign = campaigns.find((c) => c.id === params.id);
        if (!campaign || campaign.createdBy !== user.id) {
            return reply.status(403).send({ error: "Only the GM can add seats to the campaign" });
        }

        const ok = await addSeatsToActiveCampaign(params.id, body.additionalSeatCount);
        if (!ok)
            return reply.status(400).send({
                error: "Failed to add seats. Campaign may not exist or seat limit exceeded.",
            });
        return { ok: true };
    });

    fastify.post("/campaigns/:id/remove-player", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const params = z.object({ id: z.string() }).parse(req.params);
        const body = z
            .object({
                playerId: z.string(),
                preserveCharacter: z.boolean().optional().default(false),
            })
            .parse(req.body);

        try {
            const ok = await removePlayerFromCampaign(
                {
                    campaignId: params.id,
                    playerId: body.playerId,
                    preserveCharacter: body.preserveCharacter,
                },
                user,
            );

            if (!ok) return reply.status(400).send({ error: "Failed to remove player" });
            return { ok: true };
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    fastify.post("/campaigns/:id/transfer-gm", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const params = z.object({ id: z.string() }).parse(req.params);
        const body = z.object({ newGMPlayerId: z.string() }).parse(req.body);

        const ok = await transferGMOwnership(
            {
                campaignId: params.id,
                newGMPlayerId: body.newGMPlayerId,
            },
            user,
        );

        if (!ok) return reply.status(400).send({ error: "Failed to transfer GM ownership" });
        return { ok: true };
    });

    fastify.put("/campaigns/:id", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const params = z.object({ id: z.string() }).parse(req.params);
        const body = z
            .object({
                name: z.string().optional(),
                description: z.string().optional(),
                isPrivate: z.boolean().optional(),
                status: z.enum(["planning", "active", "completed", "archived"]).optional(),
            })
            .parse(req.body);

        const ok = await updateCampaign(
            {
                campaignId: params.id,
                ...body,
            },
            user,
        );

        if (!ok) return reply.status(400).send({ error: "Failed to update campaign" });
        return { ok: true };
    });

    fastify.post("/campaigns/:id/regenerate-code", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const params = z.object({ id: z.string() }).parse(req.params);

        try {
            const result = await regenerateRoomCode(
                {
                    campaignId: params.id,
                },
                user,
            );

            if (!result) return reply.status(400).send({ error: "Failed to regenerate room code" });
            return result;
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    });

    fastify.get("/my-campaigns", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        try {
            const campaigns = await listCampaigns();
            const myCampaigns = campaigns.filter((campaign: any) => campaign.createdBy === user.id);
            return myCampaigns;
        } catch (error: any) {
            return reply.status(500).send({ error: "Failed to fetch campaigns" });
        }
    });

    fastify.get("/campaigns", async () => await listCampaigns());

    fastify.get("/campaigns/:id/characters", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const params = z.object({ id: z.string() }).parse(req.params);

        try {
            const characters = await getCharactersByCampaign(params.id, user);
            return { characters };
        } catch (error: any) {
            if (error.message.includes("Campaign not found")) {
                return reply.status(404).send({ error: error.message });
            }
            return reply.status(403).send({ error: error.message });
        }
    });

    fastify.get("/campaigns/:id/seats", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const params = z.object({ id: z.string() }).parse(req.params);

        try {
            const seats = await getSeatsForCampaign(params.id, user);
            if (!seats) {
                return reply.status(404).send({ error: "Campaign not found or access denied" });
            }
            return { seats };
        } catch (error: any) {
            return reply.status(500).send({ error: "Failed to fetch seats" });
        }
    });

    fastify.get("/campaigns/:campaignId/user-role", async (request: FastifyRequest, reply) => {
        const { campaignId } = request.params as { campaignId: string };
        const token = extractTokenFromHeader(request.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const db = await getDb();
        const campaign = await campaignsCol(db).findOne({ id: campaignId });
        if (!campaign) {
            return reply.status(404).send({ error: "Campaign not found" });
        }

        const gmSeat = campaign.seats.find((seat: SeatAssignment) => seat.role === "gm");
        const isGM = gmSeat?.humanPlayerId === user.id || campaign.createdBy === user.id;

        return reply.send({ isGM });
    });
}
