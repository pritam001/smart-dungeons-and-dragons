import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import { snapshotRegistry } from "./aiModels.js";
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
    createCharacter,
    getCharacter,
    updateCharacter,
    updateCharacterAsPlayer,
    updateCharacterAsGM,
    getCharacterEditPermissions,
    getCharactersByCampaign,
    getCharactersByPlayer,
    rollDiceForCharacter,
    rollCustomDice,
    rollPresetDice,
    getCampaignRollHistory,
} from "./repositories.js";
import { registerUser, loginUser, verifyToken, extractTokenFromHeader } from "./auth.js";
import { isValidDiceNotation, getDiceSuggestions } from "./diceRoller.js";

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
    const body = z.object({ seatId: z.string(), playerId: z.string().optional() }).parse(req.body);
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
    const body = z.object({ additionalSeatCount: z.number().int().min(1).max(4) }).parse(req.body);

    // Verify the user is the GM of this campaign
    const campaigns = await listCampaigns();
    const campaign = campaigns.find((c) => c.id === params.id);
    if (!campaign || campaign.createdBy !== user.id) {
        return reply.status(403).send({ error: "Only the GM can add seats to the campaign" });
    }

    const ok = await addSeatsToActiveCampaign(params.id, body.additionalSeatCount);
    if (!ok)
        return reply
            .status(400)
            .send({ error: "Failed to add seats. Campaign may not exist or seat limit exceeded." });
    return { ok: true };
});

fastify.get("/campaigns", async () => await listCampaigns());

// Remove player from campaign
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

// Transfer GM ownership
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

// Update campaign details
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

// Regenerate room code
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

// Get campaigns created by current user (for GMs)
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

// Character routes
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
        campaignId: z.string().optional(),
        seatId: z.string().optional(),
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
            subclass: z.string().optional(),
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
        appearance: z
            .object({
                age: z.number().optional(),
                height: z.string().optional(),
                weight: z.string().optional(),
                eyes: z.string().optional(),
                skin: z.string().optional(),
                hair: z.string().optional(),
                description: z.string().optional(),
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
        backstory: z.string().optional(),
    });

    try {
        const parsed = schema.parse(req.body);

        // Convert to CreateCharacterRequest format with proper defaults
        const characterData: any = {
            ...parsed,
            personality: parsed.personality
                ? {
                      traits: parsed.personality.traits || [],
                      ideals: parsed.personality.ideals || [],
                      bonds: parsed.personality.bonds || [],
                      flaws: parsed.personality.flaws || [],
                  }
                : undefined,
            appearance: parsed.appearance
                ? {
                      age: parsed.appearance.age || 25,
                      height: parsed.appearance.height || "5'8\"",
                      weight: parsed.appearance.weight || "150 lbs",
                      eyes: parsed.appearance.eyes || "Brown",
                      skin: parsed.appearance.skin || "Medium",
                      hair: parsed.appearance.hair || "Brown",
                      description: parsed.appearance.description || "",
                  }
                : undefined,
        };

        const character = await createCharacter(characterData, user);
        return character;
    } catch (error: any) {
        if (
            error.message.includes("Campaign not found") ||
            error.message.includes("Seat not found") ||
            error.message.includes("occupied")
        ) {
            return reply.status(400).send({ error: error.message });
        }
        return reply.status(400).send({ error: "Invalid character data" });
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

fastify.put("/characters/:id", async (req, reply) => {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
        return reply.status(401).send({ error: "Authorization token required" });
    }

    const user = await verifyToken(token);
    if (!user) {
        return reply.status(401).send({ error: "Invalid token" });
    }

    const params = z.object({ id: z.string() }).parse(req.params);

    // Get permissions to determine what can be updated
    try {
        const permissions = await getCharacterEditPermissions(params.id, user);

        // Build schema based on permissions
        const allowedFields: any = {};

        if (permissions.canEditName) {
            allowedFields.name = z.string().min(1).max(100).optional();
        }
        if (permissions.canEditBackstory) {
            allowedFields.backstory = z.string().optional();
        }
        if (permissions.canEditPersonality) {
            allowedFields.personality = z
                .object({
                    traits: z.array(z.string()).optional(),
                    ideals: z.array(z.string()).optional(),
                    bonds: z.array(z.string()).optional(),
                    flaws: z.array(z.string()).optional(),
                })
                .optional();
        }
        if (permissions.canEditAppearance) {
            allowedFields.appearance = z
                .object({
                    age: z.number().optional(),
                    height: z.string().optional(),
                    weight: z.string().optional(),
                    eyes: z.string().optional(),
                    skin: z.string().optional(),
                    hair: z.string().optional(),
                    description: z.string().optional(),
                })
                .optional();
        }
        if (permissions.canEditLevel) {
            allowedFields.level = z.number().int().min(1).max(20).optional();
        }
        if (permissions.canEditExperience) {
            allowedFields.experiencePoints = z.number().int().min(0).optional();
        }
        if (permissions.canEditHitPoints) {
            allowedFields.hitPoints = z
                .object({
                    current: z.number().int().min(0),
                    maximum: z.number().int().min(1),
                    temporary: z.number().int().min(0),
                })
                .optional();
        }
        if (permissions.canEditEquipment) {
            allowedFields.equipment = z
                .object({
                    weapons: z.array(z.string()).optional(),
                    armor: z.array(z.string()).optional(),
                    tools: z.array(z.string()).optional(),
                    other: z.array(z.string()).optional(),
                })
                .optional();
        }
        if (permissions.canEditCurrency) {
            allowedFields.currency = z
                .object({
                    copper: z.number().int().min(0).optional(),
                    silver: z.number().int().min(0).optional(),
                    gold: z.number().int().min(0).optional(),
                    platinum: z.number().int().min(0).optional(),
                })
                .optional();
        }
        if (permissions.canEditStats) {
            allowedFields.stats = z
                .object({
                    strength: z.number().int().min(1).max(30).optional(),
                    dexterity: z.number().int().min(1).max(30).optional(),
                    constitution: z.number().int().min(1).max(30).optional(),
                    intelligence: z.number().int().min(1).max(30).optional(),
                    wisdom: z.number().int().min(1).max(30).optional(),
                    charisma: z.number().int().min(1).max(30).optional(),
                })
                .optional();
        }

        const schema = z.object(allowedFields);
        const updates = schema.parse(req.body);

        // Route to appropriate update function based on permissions
        if (permissions.isGM) {
            const character = await updateCharacterAsGM(params.id, updates as any, user);
            if (!character) {
                return reply.status(404).send({ error: "Character not found" });
            }
            return character;
        } else {
            const character = await updateCharacterAsPlayer(params.id, updates as any, user);
            if (!character) {
                return reply.status(404).send({ error: "Character not found" });
            }
            return character;
        }
    } catch (error: any) {
        if (error.message.includes("not found")) {
            return reply.status(404).send({ error: error.message });
        }
        if (error.message.includes("Access denied")) {
            return reply.status(403).send({ error: error.message });
        }
        return reply.status(400).send({ error: "Invalid update data or insufficient permissions" });
    }
});

// Get character edit permissions
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

// Player-safe character update
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

    // Player-safe update schema (roleplay/appearance only)
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
                height: z.string().optional(),
                weight: z.string().optional(),
                eyes: z.string().optional(),
                skin: z.string().optional(),
                hair: z.string().optional(),
                description: z.string().optional(),
            })
            .optional(),
    });

    try {
        const updates = schema.parse(req.body);
        const character = await updateCharacterAsPlayer(params.id, updates, user);
        if (!character) {
            return reply.status(404).send({ error: "Character not found" });
        }
        return character;
    } catch (error: any) {
        if (error.message.includes("Access denied")) {
            return reply.status(403).send({ error: error.message });
        }
        return reply.status(400).send({ error: "Invalid update data" });
    }
});

// GM character update (includes mechanical stats)
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
                height: z.string().optional(),
                weight: z.string().optional(),
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
        const character = await updateCharacterAsGM(params.id, updates, user);
        if (!character) {
            return reply.status(404).send({ error: "Character not found" });
        }
        return character;
    } catch (error: any) {
        if (error.message.includes("Access denied")) {
            return reply.status(403).send({ error: error.message });
        }
        return reply.status(400).send({ error: "Invalid update data" });
    }
});

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

// Dice Rolling Endpoints
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

        const roll = await rollDiceForCharacter(parsed as any, user);
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

        // Get character to validate access
        const character = await getCharacter(body.characterId, user);
        if (!character) {
            return reply.status(404).send({ error: "Character not found" });
        }

        const roll = await rollPresetDice(
            character,
            params.type,
            body.ability as any,
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

fastify.get("/campaigns/:id/rolls", async (req, reply) => {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
        return reply.status(401).send({ error: "Authorization token required" });
    }

    const user = await verifyToken(token);
    if (!user) {
        return reply.status(401).send({ error: "Invalid token" });
    }

    const paramsSchema = z.object({
        id: z.string(),
    });

    const querySchema = z.object({
        limit: z.string().optional(),
    });

    try {
        const params = paramsSchema.parse(req.params);
        const query = querySchema.parse(req.query);

        const limit = query.limit ? parseInt(query.limit) : 50;
        const rolls = await getCampaignRollHistory(params.id, user, limit);

        return { rolls };
    } catch (error: any) {
        return reply.status(400).send({ error: error.message || "Failed to get roll history" });
    }
});

fastify.get("/dice/suggestions", async () => {
    return { suggestions: getDiceSuggestions() };
});

const port = Number(process.env.PORT || 13333);
fastify.listen({ port, host: "0.0.0.0" }).catch((err) => {
    fastify.log.error(err);
    process.exit(1);
});
