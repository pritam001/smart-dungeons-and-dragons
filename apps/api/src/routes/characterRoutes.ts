import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
    createCharacter,
    getCharacter,
    updateCharacterAsPlayer,
    getCharactersByPlayer,
    getCharacterEditPermissions,
    updateCharacterAsGM,
} from "../repositories.js";
import { extractTokenFromHeader, verifyToken } from "../auth.js";

export async function characterRoutes(fastify: FastifyInstance) {
    fastify.post("/characters", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const schema = z.object({
            name: z.string().min(1).max(100),
            race: z.object({
                name: z.string(),
                subrace: z.string().optional(),
                abilityScoreIncrease: z.object({
                    strength: z.number().optional(),
                    dexterity: z.number().optional(),
                    constitution: z.number().optional(),
                    intelligence: z.number().optional(),
                    wisdom: z.number().optional(),
                    charisma: z.number().optional(),
                }),
                traits: z.array(z.string()),
                languages: z.array(z.string()),
                proficiencies: z.array(z.string()),
            }),
            characterClass: z.object({
                name: z.string(),
                level: z.number().int().min(1).max(20),
                hitDie: z.string(),
                primaryAbility: z.enum([
                    "strength",
                    "dexterity",
                    "constitution",
                    "intelligence",
                    "wisdom",
                    "charisma",
                ]),
                savingThrowProficiencies: z.array(
                    z.enum([
                        "strength",
                        "dexterity",
                        "constitution",
                        "intelligence",
                        "wisdom",
                        "charisma",
                    ]),
                ),
                skillProficiencies: z.array(
                    z.enum([
                        "acrobatics",
                        "animalHandling",
                        "arcana",
                        "athletics",
                        "deception",
                        "history",
                        "insight",
                        "intimidation",
                        "investigation",
                        "medicine",
                        "nature",
                        "perception",
                        "performance",
                        "persuasion",
                        "religion",
                        "sleightOfHand",
                        "stealth",
                        "survival",
                    ]),
                ),
                features: z.array(z.string()),
            }),
            background: z.object({
                name: z.string(),
                description: z.string(),
                skillProficiencies: z.array(z.string()),
                toolProficiencies: z.array(z.string()),
                languages: z.array(z.string()),
                features: z.array(z.string()),
            }),
            stats: z.object({
                strength: z.number().int().min(1).max(30),
                dexterity: z.number().int().min(1).max(30),
                constitution: z.number().int().min(1).max(30),
                intelligence: z.number().int().min(1).max(30),
                wisdom: z.number().int().min(1).max(30),
                charisma: z.number().int().min(1).max(30),
            }),
        });

        try {
            const parsed = schema.parse(req.body);
            const character = await createCharacter(parsed, user);
            return character;
        } catch (error) {
            return reply.status(400).send({ error: "Invalid input" });
        }
    });

    fastify.get("/characters/:id", async (req, reply) => {
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
            const character = await getCharacter(params.id, user);
            if (!character) {
                return reply.status(404).send({ error: "Character not found" });
            }
            return character;
        } catch (error: any) {
            return reply.status(403).send({ error: error.message });
        }
    });

    fastify.put("/characters/:id/player-update", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const params = z.object({ id: z.string() }).parse(req.params);

        const schema = z.object({
            name: z.string().min(1).max(100).optional(),
            backstory: z.string().optional(),
            personality: z
                .object({
                    traits: z.array(z.string()).optional(),
                    ideals: z.array(z.string()).optional(),
                    bonds: z.array(z.string()).optional(),
                    flaws: z.array(z.string()).optional(),
                })
                .optional(),
            appearance: z
                .object({
                    age: z.number().optional(),
                    height: z.number().optional(),
                    weight: z.number().optional(),
                    eyes: z.string().optional(),
                    skin: z.string().optional(),
                    hair: z.string().optional(),
                    description: z.string().optional(),
                })
                .optional(),
        });

        try {
            const updates = schema.parse(req.body);
            if (updates.appearance) {
                if (typeof updates.appearance.height === "string") {
                    const parsedHeight = Number(updates.appearance.height);
                    updates.appearance.height = isNaN(parsedHeight) ? undefined : parsedHeight;
                }
                if (typeof updates.appearance.weight === "string") {
                    const parsedWeight = Number(updates.appearance.weight);
                    updates.appearance.weight = isNaN(parsedWeight) ? undefined : parsedWeight;
                }
            }
            const character = await updateCharacterAsPlayer(params.id, updates, user);
            if (!character) {
                return reply.status(404).send({ error: "Character not found" });
            }
            return character;
        } catch (error: any) {
            if (error.message.includes("Access denied")) {
                return reply.status(403).send({ error: error.message });
            }
            return reply
                .status(400)
                .send({ error: `Failed to update character: ${error.message}` });
        }
    });

    fastify.get("/my-characters", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const characters = await getCharactersByPlayer(user);
        return { characters };
    });

    fastify.put("/characters/:id", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        console.log("[PUT /characters/:id] token:", token);
        if (!token) {
            console.log("[PUT /characters/:id] No token provided");
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        console.log("[PUT /characters/:id] user:", user);
        if (!user) {
            console.log("[PUT /characters/:id] Invalid token");
            return reply.status(401).send({ error: "Invalid token" });
        }

        const params = z.object({ id: z.string() }).parse(req.params);
        console.log("[PUT /characters/:id] params:", params);
        // Use the same schema as player update for now
        const schema = z.object({
            name: z.string().min(1).max(100).optional(),
            backstory: z.string().optional(),
            personality: z
                .object({
                    traits: z.array(z.string()).optional(),
                    ideals: z.array(z.string()).optional(),
                    bonds: z.array(z.string()).optional(),
                    flaws: z.array(z.string()).optional(),
                })
                .optional(),
            appearance: z
                .object({
                    age: z.number().optional(),
                    height: z.number().optional(),
                    weight: z.number().optional(),
                    eyes: z.string().optional(),
                    skin: z.string().optional(),
                    hair: z.string().optional(),
                    description: z.string().optional(),
                })
                .optional(),
        });
        try {
            const updates = schema.parse(req.body);
            console.log("[PUT /characters/:id] updates:", updates);
            const character = await updateCharacterAsPlayer(params.id, updates, user);
            console.log("[PUT /characters/:id] updateCharacterAsPlayer result:", character);
            if (!character) {
                console.log("[PUT /characters/:id] Character not found");
                return reply.status(404).send({ error: "Character not found" });
            }
            return character;
        } catch (error: any) {
            console.log("[PUT /characters/:id] error:", error);
            if (error.message && error.message.includes("Access denied")) {
                return reply.status(403).send({ error: error.message });
            }
            return reply
                .status(400)
                .send({ error: `Failed to update character: ${error.message}` });
        }
    });

    fastify.get("/characters/:id/permissions", async (req, reply) => {
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
            const permissions = await getCharacterEditPermissions(params.id, user);
            return permissions;
        } catch (error: any) {
            if (error.message.includes("not found")) {
                return reply.status(404).send({ error: error.message });
            }
            return reply.status(403).send({ error: error.message });
        }
    });

    fastify.put("/characters/:id/gm-update", async (req, reply) => {
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return reply.status(401).send({ error: "Authorization token required" });
        }

        const user = await verifyToken(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid token" });
        }

        const params = z.object({ id: z.string() }).parse(req.params);
        // GM update schema (includes mechanical changes)
        const schema = z.object({
            name: z.string().min(1).max(100).optional(),
            level: z.number().int().min(1).max(20).optional(),
            experiencePoints: z.number().int().min(0).optional(),
            stats: z
                .object({
                    strength: z.number().int().min(1).max(30).optional(),
                    dexterity: z.number().int().min(1).max(30).optional(),
                    constitution: z.number().int().min(1).max(30).optional(),
                    intelligence: z.number().int().min(1).max(30).optional(),
                    wisdom: z.number().int().min(1).max(30).optional(),
                    charisma: z.number().int().min(1).max(30).optional(),
                })
                .optional(),
            hitPoints: z
                .object({
                    current: z.number().int().min(0).optional(),
                    maximum: z.number().int().min(1).optional(),
                    temporary: z.number().int().min(0).optional(),
                })
                .optional(),
            equipment: z
                .object({
                    weapons: z.array(z.string()).optional(),
                    armor: z.array(z.string()).optional(),
                    tools: z.array(z.string()).optional(),
                    other: z.array(z.string()).optional(),
                })
                .optional(),
            currency: z
                .object({
                    copper: z.number().int().min(0).optional(),
                    silver: z.number().int().min(0).optional(),
                    gold: z.number().int().min(0).optional(),
                    platinum: z.number().int().min(0).optional(),
                })
                .optional(),
            personality: z
                .object({
                    traits: z.array(z.string()).optional(),
                    ideals: z.array(z.string()).optional(),
                    bonds: z.array(z.string()).optional(),
                    flaws: z.array(z.string()).optional(),
                })
                .optional(),
            appearance: z
                .object({
                    age: z.number().optional(),
                    height: z.number().optional(),
                    weight: z.number().optional(),
                    eyes: z.string().optional(),
                    skin: z.string().optional(),
                    hair: z.string().optional(),
                    description: z.string().optional(),
                })
                .optional(),
            backstory: z.string().optional(),
        });
        try {
            const updates = schema.parse(req.body);
            if (updates.appearance) {
                if (typeof updates.appearance.height === "string") {
                    const parsedHeight = Number(updates.appearance.height);
                    updates.appearance.height = isNaN(parsedHeight) ? undefined : parsedHeight;
                }
                if (typeof updates.appearance.weight === "string") {
                    const parsedWeight = Number(updates.appearance.weight);
                    updates.appearance.weight = isNaN(parsedWeight) ? undefined : parsedWeight;
                }
            }
            const character = await updateCharacterAsGM(params.id, updates, user);
            if (!character) {
                return reply.status(404).send({ error: "Character not found" });
            }
            return character;
        } catch (error: any) {
            if (error.message.includes("Access denied")) {
                return reply.status(403).send({ error: error.message });
            }
            return reply
                .status(400)
                .send({ error: `Failed to update character: ${error.message}` });
        }
    });

    // Additional character routes can be added here...
}
