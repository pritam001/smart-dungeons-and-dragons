import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
    isValidDiceNotation,
    rollDiceForCharacter,
    rollPresetDice,
    rollCustomDice,
    getDiceSuggestions,
} from "../diceRoller.js";
import { getCampaignRollHistory } from "../repositories.js";
import { extractTokenFromHeader, verifyToken } from "../auth.js";

export async function diceRoutes(fastify: FastifyInstance) {
    fastify.post("/roll/character", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const schema = z.object({
            characterId: z.string(),
            notation: z.string(),
            rollType: z
                .enum([
                    "damage",
                    "attack",
                    "ability-check",
                    "saving-throw",
                    "skill-check",
                    "initiative",
                    "hit-dice",
                    "death-save",
                    "custom",
                ])
                .optional(),
            skillOrSave: z.string().optional(),
            advantage: z.boolean().optional(),
            disadvantage: z.boolean().optional(),
            customModifier: z.number().optional(),
            description: z.string().optional(),
        });

        try {
            const parsed = schema.parse(req.body);

            if (!isValidDiceNotation(parsed.notation)) {
                return reply.status(400).send({ error: "Invalid dice notation" });
            }

            const roll = await rollDiceForCharacter(parsed as any, user.id);
            return { roll };
        } catch (error: any) {
            return reply.status(400).send({ error: error.message || "Failed to roll dice" });
        }
    });

    fastify.post("/roll/preset/:type", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const paramsSchema = z.object({
            type: z.enum([
                "attack",
                "save",
                "skill",
                "ability",
                "initiative",
                "death-save",
                "hit-dice",
            ]),
        });

        const bodySchema = z.object({
            characterId: z.string(),
            ability: z.string().optional(),
            advantage: z.boolean().optional(),
            disadvantage: z.boolean().optional(),
        });

        try {
            const params = paramsSchema.parse(req.params);
            const body = bodySchema.parse(req.body);

            const roll = await rollPresetDice(
                body.characterId,
                params.type,
                body.ability,
                body.advantage,
                body.disadvantage,
            );

            return { roll };
        } catch (error: any) {
            return reply.status(400).send({ error: error.message || "Failed to roll dice" });
        }
    });

    fastify.post("/roll/custom", async (req, reply) => {
        const schema = z.object({
            notation: z.string(),
            advantage: z.boolean().optional(),
            disadvantage: z.boolean().optional(),
            description: z.string().optional(),
        });

        try {
            const parsed = schema.parse(req.body);

            if (!isValidDiceNotation(parsed.notation)) {
                return reply.status(400).send({ error: "Invalid dice notation" });
            }

            const roll = await rollCustomDice(
                parsed.notation,
                parsed.advantage,
                parsed.disadvantage,
                parsed.description,
            );

            return { roll };
        } catch (error: any) {
            return reply.status(400).send({ error: error.message || "Failed to roll dice" });
        }
    });

    fastify.get("/dice/suggestions", async () => {
        return { suggestions: getDiceSuggestions() };
    });

    fastify.get("/campaigns/:id/rolls", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const params = z.object({ id: z.string() }).parse(req.params);
        const query = z.object({ limit: z.string().optional() }).parse(req.query);
        try {
            const limit = query.limit ? parseInt(query.limit) : 50;
            const rolls = await getCampaignRollHistory(params.id, user, limit);
            return { rolls };
        } catch (error: any) {
            return reply.status(400).send({ error: error.message || "Failed to get roll history" });
        }
    });
}
