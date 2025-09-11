import { nanoid } from "nanoid";
import { snapshotRegistry } from "./aiModels.js";
import {
    CampaignConfig,
    CreateCampaignRequest,
    CreateCampaignResponse,
    JoinCampaignRequest,
    JoinCampaignResponse,
    PlayerProfile,
    SeatAssignment,
    SeatRole,
    UpdateSeatAIRequest,
    UpdateSeatHumanAssignmentRequest,
    PublicUserProfile,
    CharacterSheet,
    CreateCharacterRequest,
    UpdateCharacterRequest,
    CharacterId,
    CampaignId,
    CharacterModifiers,
    CharacterSkills,
    CharacterSavingThrows,
    CharacterHitPoints,
    CharacterStats,
    RollRequest,
    CharacterRoll,
    CampaignRollHistory,
    DiceRoll,
} from "@dnd-ai/types";
import jwt from "jsonwebtoken";
import { getDb, campaignsCol, playersCol, charactersCol, rollHistoryCol } from "./mongo.js";
import { rollForCharacter, rollDice, DnDRoller } from "./diceRoller.js";

// Remove in-memory storage - now using MongoDB
// const campaigns = new Map<string, CampaignConfig>();
// const players = new Map<string, PlayerProfile>();

function generateRoomCode(): string {
    return nanoid(6).toUpperCase();
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change";

function makeGuestToken(playerId: string) {
    return jwt.sign({ sub: playerId, kind: "guest" }, JWT_SECRET, { expiresIn: "7d" });
}

export async function createCampaign(
    req: CreateCampaignRequest,
    user: PublicUserProfile,
): Promise<CreateCampaignResponse> {
    const db = await getDb();

    // Create player profile from user account
    const creator: PlayerProfile = {
        id: user.id,
        displayName: user.displayName,
        createdAt: new Date().toISOString(),
    };
    await playersCol(db).insertOne(creator);

    const roomCode = generateRoomCode();
    const availableModels = snapshotRegistry().models;
    const whitelist = availableModels.map((m) => m.id); // all allowed now

    const seats: SeatAssignment[] = [];

    // GM seat
    const gmSeat: SeatAssignment = {
        seatId: "gm",
        role: SeatRole.GAME_MASTER,
        humanPlayerId: req.gmIsHuman ? user.id : undefined,
        ai: !req.gmIsHuman ? { enabled: true, modelId: req.gmAIModelId } : { enabled: false },
    };
    seats.push(gmSeat);

    for (let i = 0; i < req.seatCount; i++) {
        seats.push({
            seatId: `p${i + 1}`,
            role: SeatRole.PLAYER,
            humanPlayerId: undefined, // player seats start unassigned
            ai: req.aiEnabledDefault ? { enabled: true } : { enabled: false },
        });
    }

    const campaign: CampaignConfig = {
        id: nanoid(),
        roomCode,
        name: req.name,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        seats,
        aiModelWhitelist: whitelist,
    };

    await campaignsCol(db).insertOne(campaign);
    const authToken = makeGuestToken(user.id);
    return { campaign, availableModels, selfPlayer: creator, authToken };
}

export async function joinCampaign(
    req: JoinCampaignRequest,
    user: PublicUserProfile,
): Promise<JoinCampaignResponse | undefined> {
    const db = await getDb();
    const campaign = await campaignsCol(db).findOne({ roomCode: req.roomCode.toUpperCase() });
    if (!campaign) return undefined;

    // Create player profile from user account
    const profile: PlayerProfile = {
        id: user.id,
        displayName: req.playerDisplayName || user.displayName,
        createdAt: new Date().toISOString(),
    };
    await playersCol(db).insertOne(profile);

    // Auto-assign to first available player seat
    const availableSeat = campaign.seats.find(
        (s) => s.role === SeatRole.PLAYER && !s.humanPlayerId,
    );
    if (availableSeat) {
        await campaignsCol(db).updateOne(
            { id: campaign.id, "seats.seatId": availableSeat.seatId },
            { $set: { "seats.$.humanPlayerId": user.id } },
        );

        // Update the campaign object to reflect the change
        const seatIndex = campaign.seats.findIndex((s) => s.seatId === availableSeat.seatId);
        if (seatIndex !== -1) {
            campaign.seats[seatIndex].humanPlayerId = user.id;
        }
    }

    const authToken = makeGuestToken(user.id);
    return {
        campaign,
        selfPlayer: profile,
        availableModels: snapshotRegistry().models.filter((m) =>
            campaign.aiModelWhitelist.includes(m.id),
        ),
        authToken,
    };
}

export async function updateSeatAI(req: UpdateSeatAIRequest): Promise<boolean> {
    const db = await getDb();
    const campaign = await campaignsCol(db).findOne({ id: req.campaignId });
    if (!campaign) return false;
    const seat = campaign.seats.find((s: SeatAssignment) => s.seatId === req.seatId);
    if (!seat) return false;
    if (req.ai.enabled && req.ai.modelId && !campaign.aiModelWhitelist.includes(req.ai.modelId))
        return false;

    // Update the seat in the campaign
    const updatedSeats = campaign.seats.map((s: SeatAssignment) =>
        s.seatId === req.seatId ? { ...s, ai: req.ai } : s,
    );

    const result = await campaignsCol(db).updateOne(
        { id: req.campaignId },
        { $set: { seats: updatedSeats } },
    );

    return result.modifiedCount > 0;
}

export async function assignSeat(req: UpdateSeatHumanAssignmentRequest): Promise<boolean> {
    const db = await getDb();
    const campaign = await campaignsCol(db).findOne({ id: req.campaignId });
    if (!campaign) return false;
    const seat = campaign.seats.find((s: SeatAssignment) => s.seatId === req.seatId);
    if (!seat) return false;

    // Update the seat in the campaign
    const updatedSeats = campaign.seats.map((s: SeatAssignment) =>
        s.seatId === req.seatId ? { ...s, humanPlayerId: req.playerId } : s,
    );

    const result = await campaignsCol(db).updateOne(
        { id: req.campaignId },
        { $set: { seats: updatedSeats } },
    );

    return result.modifiedCount > 0;
}

export async function listCampaigns(): Promise<CampaignConfig[]> {
    const db = await getDb();
    return await campaignsCol(db).find({}).toArray();
}

// Character Management Functions
export async function createCharacter(
    req: CreateCharacterRequest,
    user: PublicUserProfile,
): Promise<CharacterSheet> {
    const db = await getDb();

    // Verify campaign exists and user has access
    const campaign = await campaignsCol(db).findOne({ id: req.campaignId });
    if (!campaign) {
        throw new Error("Campaign not found");
    }

    // Verify seat exists and is available for this user
    const seat = campaign.seats.find((s) => s.seatId === req.seatId);
    if (!seat) {
        throw new Error("Seat not found");
    }

    if (seat.humanPlayerId && seat.humanPlayerId !== user.id) {
        throw new Error("Seat is occupied by another player");
    }

    // Calculate modifiers from stats
    const modifiers: CharacterModifiers = {
        strength: Math.floor((req.stats.strength - 10) / 2),
        dexterity: Math.floor((req.stats.dexterity - 10) / 2),
        constitution: Math.floor((req.stats.constitution - 10) / 2),
        intelligence: Math.floor((req.stats.intelligence - 10) / 2),
        wisdom: Math.floor((req.stats.wisdom - 10) / 2),
        charisma: Math.floor((req.stats.charisma - 10) / 2),
    };

    // Calculate proficiency bonus based on level
    const proficiencyBonus = Math.ceil(req.characterClass.level / 4) + 1;

    // Initialize skills with base modifiers
    const skills: CharacterSkills = {
        acrobatics: modifiers.dexterity,
        animalHandling: modifiers.wisdom,
        arcana: modifiers.intelligence,
        athletics: modifiers.strength,
        deception: modifiers.charisma,
        history: modifiers.intelligence,
        insight: modifiers.wisdom,
        intimidation: modifiers.charisma,
        investigation: modifiers.intelligence,
        medicine: modifiers.wisdom,
        nature: modifiers.intelligence,
        perception: modifiers.wisdom,
        performance: modifiers.charisma,
        persuasion: modifiers.charisma,
        religion: modifiers.intelligence,
        sleightOfHand: modifiers.dexterity,
        stealth: modifiers.dexterity,
        survival: modifiers.wisdom,
    };

    // Add proficiency bonuses for class and background skills
    const allSkillProficiencies = [
        ...req.characterClass.skillProficiencies,
        ...req.background.skillProficiencies,
    ];

    allSkillProficiencies.forEach((skill) => {
        if (skill in skills) {
            skills[skill as keyof CharacterSkills] += proficiencyBonus;
        }
    });

    // Initialize saving throws
    const savingThrows: CharacterSavingThrows = {
        strength: modifiers.strength,
        dexterity: modifiers.dexterity,
        constitution: modifiers.constitution,
        intelligence: modifiers.intelligence,
        wisdom: modifiers.wisdom,
        charisma: modifiers.charisma,
    };

    // Add proficiency to saving throws
    req.characterClass.savingThrowProficiencies.forEach((stat: keyof CharacterStats) => {
        savingThrows[stat] += proficiencyBonus;
    });

    // Calculate HP (class hit die + con modifier per level)
    const baseHitDie = parseInt(req.characterClass.hitDie.replace("d", ""));
    const hitPoints: CharacterHitPoints = {
        maximum:
            baseHitDie +
            modifiers.constitution +
            (req.characterClass.level - 1) *
                (Math.floor(baseHitDie / 2) + 1 + modifiers.constitution),
        current: 0, // Will be set to maximum after creation
        temporary: 0,
    };
    hitPoints.current = hitPoints.maximum;

    const character: CharacterSheet = {
        id: nanoid(),
        campaignId: req.campaignId,
        playerId: user.id,
        seatId: req.seatId,

        // Basic Information
        name: req.name,
        race: req.race,
        characterClass: req.characterClass,
        background: req.background,
        level: req.characterClass.level,
        experiencePoints: 0,

        // Core Stats
        stats: req.stats,
        modifiers,
        proficiencyBonus,

        // Combat Stats
        hitPoints,
        armorClass: 10 + modifiers.dexterity, // Base AC, will be modified by armor
        initiative: modifiers.dexterity,
        speed: 30, // Default speed, may be modified by race

        // Skills and Saves
        skills,
        savingThrows,
        skillProficiencies: allSkillProficiencies as (keyof CharacterSkills)[],
        savingThrowProficiencies: req.characterClass.savingThrowProficiencies,

        // Equipment and Inventory
        equipment: {
            weapons: [],
            armor: [],
            tools: [],
            other: [],
        },
        currency: {
            copper: 0,
            silver: 0,
            gold: 0,
            platinum: 0,
        },

        // Character Details
        personality: {
            traits: req.personality?.traits || [],
            ideals: req.personality?.ideals || [],
            bonds: req.personality?.bonds || [],
            flaws: req.personality?.flaws || [],
        },
        appearance: {
            age: req.appearance?.age || 25,
            height: req.appearance?.height || "5'8\"",
            weight: req.appearance?.weight || "150 lbs",
            eyes: req.appearance?.eyes || "Brown",
            skin: req.appearance?.skin || "Medium",
            hair: req.appearance?.hair || "Brown",
            description: req.appearance?.description || "",
        },
        backstory: req.backstory || "",

        // Metadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
    };

    // Store character in database
    await charactersCol(db).insertOne(character);

    // Update seat assignment to link this character
    const updatedSeats = campaign.seats.map((s) =>
        s.seatId === req.seatId ? { ...s, humanPlayerId: user.id, characterId: character.id } : s,
    );

    await campaignsCol(db).updateOne({ id: req.campaignId }, { $set: { seats: updatedSeats } });

    return character;
}

export async function getCharacter(
    characterId: CharacterId,
    user: PublicUserProfile,
): Promise<CharacterSheet | null> {
    const db = await getDb();
    const character = await charactersCol(db).findOne({ id: characterId });

    if (!character) return null;

    // Check if user owns this character
    if (character.playerId !== user.id) {
        throw new Error("Access denied: You can only view your own characters");
    }

    return character;
}

export async function updateCharacter(
    characterId: CharacterId,
    updates: UpdateCharacterRequest,
    user: PublicUserProfile,
): Promise<CharacterSheet | null> {
    const db = await getDb();

    // Verify character exists and user owns it
    const existingCharacter = await charactersCol(db).findOne({ id: characterId });
    if (!existingCharacter) return null;

    if (existingCharacter.playerId !== user.id) {
        throw new Error("Access denied: You can only update your own characters");
    }

    // Create update object with only non-undefined fields
    const updateFields: any = {
        updatedAt: new Date().toISOString(),
    };

    // Add fields that are defined
    if (updates.name !== undefined) updateFields.name = updates.name;
    if (updates.level !== undefined) updateFields.level = updates.level;
    if (updates.experiencePoints !== undefined)
        updateFields.experiencePoints = updates.experiencePoints;
    if (updates.armorClass !== undefined) updateFields.armorClass = updates.armorClass;
    if (updates.backstory !== undefined) updateFields.backstory = updates.backstory;

    // Handle nested partial updates
    if (updates.hitPoints !== undefined) {
        Object.keys(updates.hitPoints).forEach((key) => {
            updateFields[`hitPoints.${key}`] =
                updates.hitPoints![key as keyof typeof updates.hitPoints];
        });
    }

    if (updates.stats !== undefined) {
        Object.keys(updates.stats).forEach((key) => {
            updateFields[`stats.${key}`] = updates.stats![key as keyof typeof updates.stats];
        });
    }

    const result = await charactersCol(db).updateOne({ id: characterId }, { $set: updateFields });

    if (result.modifiedCount === 0) return null;

    // Fetch and return the updated character
    const updatedCharacter = await charactersCol(db).findOne({ id: characterId });
    return updatedCharacter;
}

export async function getCharactersByCampaign(
    campaignId: CampaignId,
    user: PublicUserProfile,
): Promise<CharacterSheet[]> {
    const db = await getDb();

    // Verify user has access to this campaign
    const campaign = await campaignsCol(db).findOne({ id: campaignId });
    if (!campaign) {
        throw new Error("Campaign not found");
    }

    // Check if user is part of this campaign
    const userSeat = campaign.seats.find((s) => s.humanPlayerId === user.id);
    if (!userSeat && campaign.createdBy !== user.id) {
        throw new Error("Access denied: You are not part of this campaign");
    }

    // Return all characters in this campaign
    return await charactersCol(db).find({ campaignId }).toArray();
}

export async function getCharactersByPlayer(user: PublicUserProfile): Promise<CharacterSheet[]> {
    const db = await getDb();
    return await charactersCol(db).find({ playerId: user.id, isActive: true }).toArray();
}

// Dice Rolling Functions
export async function rollDiceForCharacter(
    request: RollRequest,
    user: PublicUserProfile,
): Promise<CharacterRoll> {
    const db = await getDb();

    // Get character if specified
    if (!request.characterId) {
        throw new Error("Character ID is required for character rolls");
    }

    const character = await charactersCol(db).findOne({ id: request.characterId });
    if (!character) {
        throw new Error("Character not found");
    }

    // Verify user owns the character
    if (character.playerId !== user.id) {
        throw new Error("Access denied: You can only roll for your own characters");
    }

    // Perform the roll
    const roll = rollForCharacter(request, character);

    // Store roll in campaign history
    await addRollToHistory(character.campaignId, roll);

    return roll;
}

export async function rollCustomDice(
    notation: string,
    advantage?: boolean,
    disadvantage?: boolean,
    description?: string,
): Promise<DiceRoll> {
    const roll = rollDice(notation, advantage, disadvantage);

    // Add description if provided
    if (description) {
        (roll as any).description = description;
    }

    return roll;
}

export async function rollPresetDice(
    character: CharacterSheet,
    rollType: "attack" | "save" | "skill" | "ability" | "initiative" | "death-save" | "hit-dice",
    ability?: keyof CharacterStats | keyof CharacterSkills,
    advantage?: boolean,
    disadvantage?: boolean,
): Promise<CharacterRoll> {
    let roll: CharacterRoll;

    switch (rollType) {
        case "attack":
            roll = DnDRoller.attack(
                character,
                (ability as keyof CharacterStats) || "strength",
                advantage,
                disadvantage,
            );
            break;
        case "save":
            if (!ability || !(ability in character.savingThrows)) {
                throw new Error("Valid ability required for saving throw");
            }
            roll = DnDRoller.savingThrow(
                character,
                ability as keyof CharacterStats,
                advantage,
                disadvantage,
            );
            break;
        case "skill":
            if (!ability || !(ability in character.skills)) {
                throw new Error("Valid skill required for skill check");
            }
            roll = DnDRoller.skillCheck(
                character,
                ability as keyof CharacterSkills,
                advantage,
                disadvantage,
            );
            break;
        case "ability":
            if (!ability || !(ability in character.modifiers)) {
                throw new Error("Valid ability required for ability check");
            }
            roll = DnDRoller.abilityCheck(
                character,
                ability as keyof CharacterStats,
                advantage,
                disadvantage,
            );
            break;
        case "initiative":
            roll = DnDRoller.initiative(character, advantage, disadvantage);
            break;
        case "death-save":
            roll = DnDRoller.deathSave(character, advantage, disadvantage);
            break;
        case "hit-dice":
            roll = DnDRoller.hitDice(character);
            break;
        default:
            throw new Error(`Unsupported roll type: ${rollType}`);
    }

    // Store roll in campaign history
    await addRollToHistory(character.campaignId, roll);

    return roll;
}

export async function getCampaignRollHistory(
    campaignId: CampaignId,
    user: PublicUserProfile,
    limit: number = 50,
): Promise<CharacterRoll[]> {
    const db = await getDb();

    // Verify user has access to this campaign
    const campaign = await campaignsCol(db).findOne({ id: campaignId });
    if (!campaign) {
        throw new Error("Campaign not found");
    }

    // Check if user is part of this campaign
    const userSeat = campaign.seats.find((s) => s.humanPlayerId === user.id);
    if (!userSeat && campaign.createdBy !== user.id) {
        throw new Error("Access denied: You are not part of this campaign");
    }

    // Get roll history
    const rollHistory = await rollHistoryCol(db).findOne({ campaignId });
    if (!rollHistory) {
        return [];
    }

    // Return the most recent rolls
    return rollHistory.rolls
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
}

async function addRollToHistory(campaignId: CampaignId, roll: CharacterRoll): Promise<void> {
    const db = await getDb();

    // Try to update existing history, or create new one
    const result = await rollHistoryCol(db).updateOne(
        { campaignId },
        {
            $push: {
                rolls: {
                    $each: [roll],
                    $slice: -100, // Keep only the last 100 rolls
                },
            },
            $set: {
                lastUpdated: new Date().toISOString(),
            },
        },
        { upsert: true },
    );

    // If this is a new document, initialize it properly
    if (result.upsertedCount > 0 && result.upsertedId) {
        await rollHistoryCol(db).updateOne(
            { _id: result.upsertedId },
            {
                $setOnInsert: {
                    campaignId,
                },
            },
        );
    }
}
