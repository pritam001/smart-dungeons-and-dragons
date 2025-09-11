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
    CharacterEditPermissions,
    CampaignEditMode,
    PlayerCharacterUpdateRequest,
    GMCharacterUpdateRequest,
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
        characterEditMode: req.characterEditMode || "strict",
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

    // Prevent campaign creator from joining as a player (they should be GM)
    if (campaign.createdBy === user.id) {
        throw new Error("Campaign creators cannot join as players - you are the GM");
    }

    // Check if user is already in this campaign
    const existingAssignment = campaign.seats.find((s) => s.humanPlayerId === user.id);
    if (existingAssignment) {
        // User is already in the campaign - return existing state instead of creating duplicate
        const existingProfile = await playersCol(db).findOne({ id: user.id });
        if (!existingProfile) {
            // Create profile if somehow missing (edge case)
            const profile: PlayerProfile = {
                id: user.id,
                displayName: req.playerDisplayName || user.displayName,
                createdAt: new Date().toISOString(),
            };
            await playersCol(db).insertOne(profile);
        }

        const authToken = makeGuestToken(user.id);
        return {
            campaign,
            selfPlayer: existingProfile || {
                id: user.id,
                displayName: req.playerDisplayName || user.displayName,
                createdAt: new Date().toISOString(),
            },
            availableModels: snapshotRegistry().models.filter((m) =>
                campaign.aiModelWhitelist.includes(m.id),
            ),
            authToken,
        };
    }

    // Check if there are any available seats
    const availableSeat = campaign.seats.find(
        (s) => s.role === SeatRole.PLAYER && !s.humanPlayerId,
    );
    if (!availableSeat) {
        throw new Error("Campaign is full - no available seats");
    }

    // Create or update player profile (handle potential duplicates gracefully)
    const existingProfile = await playersCol(db).findOne({ id: user.id });
    let profile: PlayerProfile;

    if (existingProfile) {
        // Update existing profile with new display name if provided
        if (req.playerDisplayName && req.playerDisplayName !== existingProfile.displayName) {
            await playersCol(db).updateOne(
                { id: user.id },
                { $set: { displayName: req.playerDisplayName } },
            );
            profile = { ...existingProfile, displayName: req.playerDisplayName };
        } else {
            profile = existingProfile;
        }
    } else {
        // Create new profile
        profile = {
            id: user.id,
            displayName: req.playerDisplayName || user.displayName,
            createdAt: new Date().toISOString(),
        };
        await playersCol(db).insertOne(profile);
    }

    // Assign to the available seat
    await campaignsCol(db).updateOne(
        { id: campaign.id, "seats.seatId": availableSeat.seatId },
        { $set: { "seats.$.humanPlayerId": user.id } },
    );

    // Update the campaign object to reflect the change
    const seatIndex = campaign.seats.findIndex((s) => s.seatId === availableSeat.seatId);
    if (seatIndex !== -1) {
        campaign.seats[seatIndex].humanPlayerId = user.id;
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

// Character Permission Functions
export async function getCharacterEditPermissions(
    characterId: CharacterId,
    user: PublicUserProfile,
): Promise<CharacterEditPermissions> {
    const db = await getDb();

    // Get character and verify it exists
    const character = await charactersCol(db).findOne({ id: characterId });
    if (!character) {
        throw new Error("Character not found");
    }

    const isCharacterOwner = character.playerId === user.id;

    // For standalone characters (no campaign), owner has full control
    if (!character.campaignId) {
        return {
            canEditAppearance: isCharacterOwner,
            canEditPersonality: isCharacterOwner,
            canEditBackstory: isCharacterOwner,
            canEditName: isCharacterOwner,
            canEditStats: isCharacterOwner,
            canEditLevel: isCharacterOwner,
            canEditExperience: isCharacterOwner,
            canEditHitPoints: isCharacterOwner,
            canEditEquipment: isCharacterOwner,
            canEditCurrency: isCharacterOwner,
            isGM: false,
            isCharacterOwner,
            campaignEditMode: "sandbox",
        };
    }

    // For campaign characters, check campaign permissions
    const campaign = await campaignsCol(db).findOne({ id: character.campaignId });
    if (!campaign) {
        throw new Error("Campaign not found");
    }

    // Check if user is GM
    const gmSeat = campaign.seats.find((s) => s.role === "gm");
    const isGM = gmSeat?.humanPlayerId === user.id || campaign.createdBy === user.id;

    // Check if user is part of this campaign
    const userSeat = campaign.seats.find((s) => s.humanPlayerId === user.id);
    const hasAccess = isGM || userSeat || campaign.createdBy === user.id;

    if (!hasAccess) {
        throw new Error("Access denied: You are not part of this campaign");
    }

    const editMode = campaign.characterEditMode || "strict";

    // Permission matrix based on edit mode
    const basePermissions = {
        canEditAppearance: isCharacterOwner || isGM,
        canEditPersonality: isCharacterOwner || isGM,
        canEditBackstory: isCharacterOwner || isGM,
        canEditName: isCharacterOwner || isGM,
        isGM,
        isCharacterOwner,
        campaignEditMode: editMode,
    };

    switch (editMode) {
        case "strict":
            // Only GM can edit mechanical stats
            return {
                ...basePermissions,
                canEditStats: isGM,
                canEditLevel: isGM,
                canEditExperience: isGM,
                canEditHitPoints: isGM,
                canEditEquipment: isGM,
                canEditCurrency: isGM,
            };

        case "collaborative":
            // Players can edit their own character's equipment and HP, but not core stats
            return {
                ...basePermissions,
                canEditStats: isGM,
                canEditLevel: isGM,
                canEditExperience: isGM,
                canEditHitPoints: isCharacterOwner || isGM,
                canEditEquipment: isCharacterOwner || isGM,
                canEditCurrency: isCharacterOwner || isGM,
            };

        case "sandbox":
            // Players have full control over their own characters
            return {
                ...basePermissions,
                canEditStats: isCharacterOwner || isGM,
                canEditLevel: isCharacterOwner || isGM,
                canEditExperience: isCharacterOwner || isGM,
                canEditHitPoints: isCharacterOwner || isGM,
                canEditEquipment: isCharacterOwner || isGM,
                canEditCurrency: isCharacterOwner || isGM,
            };

        default:
            // Default to strict mode
            return {
                ...basePermissions,
                canEditStats: isGM,
                canEditLevel: isGM,
                canEditExperience: isGM,
                canEditHitPoints: isGM,
                canEditEquipment: isGM,
                canEditCurrency: isGM,
            };
    }
}

// Character Management Functions
export async function createCharacter(
    req: CreateCharacterRequest,
    user: PublicUserProfile,
): Promise<CharacterSheet> {
    const db = await getDb();

    // Only verify campaign/seat if they are provided
    if (req.campaignId && req.seatId) {
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

    // Update seat assignment only if this is for a campaign
    if (req.campaignId && req.seatId) {
        const campaign = await campaignsCol(db).findOne({ id: req.campaignId });
        if (campaign) {
            const updatedSeats = campaign.seats.map((s) =>
                s.seatId === req.seatId
                    ? { ...s, humanPlayerId: user.id, characterId: character.id }
                    : s,
            );

            await campaignsCol(db).updateOne(
                { id: req.campaignId },
                { $set: { seats: updatedSeats } },
            );
        }
    }

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
    const isCharacterOwner = character.playerId === user.id;

    // If user owns the character, they can view it
    if (isCharacterOwner) {
        return character;
    }

    // If character is in a campaign, check if user is the GM
    if (character.campaignId) {
        const campaign = await campaignsCol(db).findOne({ id: character.campaignId });
        if (campaign && campaign.createdBy === user.id) {
            // User is the GM of this campaign, they can view all characters
            return character;
        }
    }

    // For campaign characters, allow viewing by all campaign members (but not editing)
    if (character.campaignId) {
        const campaign = await campaignsCol(db).findOne({ id: character.campaignId });
        if (campaign) {
            // Check if user is assigned to any seat in this campaign
            const userSeat = campaign.seats.find((seat) => seat.humanPlayerId === user.id);
            if (userSeat) {
                // User is in the campaign, they can view the character
                return character;
            }
        }
    }

    // Access denied - user is not the owner, GM, or campaign member
    throw new Error(
        "Access denied: You can only view characters you own or from campaigns you're in",
    );
}

// DEPRECATED: This function bypasses the permission system and should not be used
// Use updateCharacterAsPlayer or updateCharacterAsGM instead
export async function updateCharacter(
    characterId: CharacterId,
    updates: UpdateCharacterRequest,
    user: PublicUserProfile,
): Promise<CharacterSheet | null> {
    // This function is deprecated and insecure - redirect to permission-based functions
    console.warn("DEPRECATED: updateCharacter called - use updateCharacterAsPlayer/GM instead");

    // For safety, we'll route through the permission system
    const permissions = await getCharacterEditPermissions(characterId, user);

    if (permissions.isGM) {
        return updateCharacterAsGM(characterId, updates as GMCharacterUpdateRequest, user);
    } else {
        return updateCharacterAsPlayer(characterId, updates as PlayerCharacterUpdateRequest, user);
    }
}

export async function updateCharacterAsPlayer(
    characterId: CharacterId,
    updates: PlayerCharacterUpdateRequest,
    user: PublicUserProfile,
): Promise<CharacterSheet | null> {
    // Check permissions first
    const permissions = await getCharacterEditPermissions(characterId, user);

    // Validate that player can only update allowed fields
    const allowedUpdates: Partial<PlayerCharacterUpdateRequest> = {};

    if (updates.name && permissions.canEditName) {
        allowedUpdates.name = updates.name;
    }
    if (updates.backstory && permissions.canEditBackstory) {
        allowedUpdates.backstory = updates.backstory;
    }
    if (updates.personality && permissions.canEditPersonality) {
        allowedUpdates.personality = updates.personality;
    }
    if (updates.appearance && permissions.canEditAppearance) {
        allowedUpdates.appearance = updates.appearance;
    }

    // If no allowed updates, throw error
    if (Object.keys(allowedUpdates).length === 0) {
        throw new Error("Access denied: You don't have permission to make these changes");
    }

    // Perform the update using the existing function
    return await updateCharacter(characterId, allowedUpdates as UpdateCharacterRequest, user);
}

export async function updateCharacterAsGM(
    characterId: CharacterId,
    updates: GMCharacterUpdateRequest,
    user: PublicUserProfile,
): Promise<CharacterSheet | null> {
    // Check permissions first
    const permissions = await getCharacterEditPermissions(characterId, user);

    if (!permissions.isGM) {
        throw new Error("Access denied: Only GMs can perform mechanical character updates");
    }

    // GM can update everything, but still validate individual permissions for audit
    const allowedUpdates: Partial<GMCharacterUpdateRequest> = {};

    // Always allowed for GM
    if (updates.name) allowedUpdates.name = updates.name;
    if (updates.backstory) allowedUpdates.backstory = updates.backstory;
    if (updates.personality) allowedUpdates.personality = updates.personality;
    if (updates.appearance) allowedUpdates.appearance = updates.appearance;

    // Mechanical updates (GM only)
    if (updates.level && permissions.canEditLevel) allowedUpdates.level = updates.level;
    if (updates.experiencePoints && permissions.canEditExperience)
        allowedUpdates.experiencePoints = updates.experiencePoints;
    if (updates.stats && permissions.canEditStats) allowedUpdates.stats = updates.stats;
    if (updates.hitPoints && permissions.canEditHitPoints)
        allowedUpdates.hitPoints = updates.hitPoints;
    if (updates.equipment && permissions.canEditEquipment)
        allowedUpdates.equipment = updates.equipment;
    if (updates.currency && permissions.canEditCurrency) allowedUpdates.currency = updates.currency;
    if (updates.spellcasting) allowedUpdates.spellcasting = updates.spellcasting;

    // Perform the update using the existing function
    return await updateCharacter(characterId, allowedUpdates as UpdateCharacterRequest, user);
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

    // Store roll in campaign history (only if character is part of a campaign)
    if (character.campaignId) {
        await addRollToHistory(character.campaignId, roll);
    }

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

    // Store roll in campaign history (only if character is part of a campaign)
    if (character.campaignId) {
        await addRollToHistory(character.campaignId, roll);
    }

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
