export type PlayerId = string;
export type CampaignId = string;
export type RoomCode = string;

export const SeatRole = {
    PLAYER: "player",
    GAME_MASTER: "gm",
} as const;

export type SeatRole = (typeof SeatRole)[keyof typeof SeatRole];

export interface UserAccount {
    id: PlayerId;
    username: string;
    passwordHash: string;
    displayName: string;
    createdAt: string;
    lastLoginAt?: string;
}

export interface PublicUserProfile {
    id: PlayerId;
    username: string;
    displayName: string;
    createdAt: string;
    lastLoginAt?: string;
}

export interface PlayerProfile {
    id: PlayerId;
    displayName: string;
    createdAt: string;
}

export interface AIModelMeta {
    id: string; // e.g. 'openai:gpt-4o-mini'
    provider: string; // 'openai' | 'anthropic' | 'local'
    label: string; // Human friendly
    capabilities: {
        canPlayPC: boolean;
        canPlayGM: boolean;
        narrativeStyle?: string[]; // optional style tags
    };
    costClass?: "low" | "medium" | "high";
}

export interface AISeatConfig {
    enabled: boolean;
    modelId?: string; // if enabled
    personaPreset?: string; // optional persona template id
}

export interface SeatAssignment {
    seatId: string; // stable per campaign seat
    role: SeatRole;
    humanPlayerId?: PlayerId; // if occupied by human
    ai?: AISeatConfig; // if AI controlled or hybrid
    characterId?: string; // chosen character sheet id
}

export const CampaignStatus = {
    PLANNING: "planning",
    ACTIVE: "active",
    COMPLETED: "completed",
    ARCHIVED: "archived",
} as const;

export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export interface CampaignConfig {
    id: CampaignId;
    roomCode: RoomCode;
    name: string;
    description?: string; // optional campaign description/notes
    createdBy: PlayerId;
    createdAt: string;
    updatedAt: string;
    seats: SeatAssignment[];
    aiModelWhitelist: string[]; // allowed model ids for this campaign
    characterEditMode: CampaignEditMode; // controls who can edit character stats
    isPrivate: boolean; // private campaigns only joinable via room code
    status: CampaignStatus; // campaign lifecycle state

    // --- Turn Tracking ---
    /**
     * Array of character or player IDs representing the turn order for this campaign/session.
     * Can be characterId or playerId depending on implementation.
     */
    turnOrder: string[];
    /**
     * Index of the current turn in the turnOrder array.
     */
    currentTurnIndex: number;
    /**
     * Current round number (increments each time turnOrder cycles).
     */
    roundNumber: number;
}

export interface CreateCampaignRequest {
    name: string;
    description?: string; // optional campaign description
    gmIsHuman: boolean;
    gmAIModelId?: string; // if gmIsHuman=false
    seatCount: number; // count of player seats only (GM separate)
    aiEnabledDefault?: boolean;
    characterEditMode?: CampaignEditMode; // defaults to "strict"
    isPrivate?: boolean; // defaults to true for private campaigns
}

export interface CreateCampaignResponse {
    campaign: CampaignConfig;
    availableModels: AIModelMeta[];
    selfPlayer: PlayerProfile;
    authToken: string; // guest token (JWT)
}

export interface JoinCampaignRequest {
    roomCode: RoomCode;
    playerDisplayName?: string;
}

export interface JoinCampaignResponse {
    campaign: CampaignConfig;
    selfPlayer: PlayerProfile;
    availableModels: AIModelMeta[]; // may be restricted by whitelist
    authToken: string;
}

export interface UpdateSeatAIRequest {
    campaignId: CampaignId;
    seatId: string;
    ai: AISeatConfig;
}

export interface UpdateSeatHumanAssignmentRequest {
    campaignId: CampaignId;
    seatId: string;
    playerId?: PlayerId; // undefined = unassign
}

// Player Management
export interface RemovePlayerRequest {
    campaignId: CampaignId;
    playerId: PlayerId;
    preserveCharacter?: boolean; // if true, character stays in campaign but unassigned
}

export interface TransferGMRequest {
    campaignId: CampaignId;
    newGMPlayerId: PlayerId;
}

// Campaign Management
export interface UpdateCampaignRequest {
    campaignId: CampaignId;
    name?: string;
    description?: string;
    isPrivate?: boolean;
    status?: CampaignStatus;
}

export interface RegenerateRoomCodeRequest {
    campaignId: CampaignId;
}

export interface RegenerateRoomCodeResponse {
    roomCode: RoomCode;
}

export interface AIModelRegistrySnapshot {
    models: AIModelMeta[];
    updatedAt: string;
}

export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

// Auth interfaces
export interface RegisterRequest {
    username: string;
    password: string;
    displayName: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface AuthResponse {
    user: PublicUserProfile;
    authToken: string;
}

export interface AuthTokenPayload {
    sub: PlayerId;
    kind: "user";
    iat: number;
    exp: number;
}

export interface AuthContext {
    playerId: PlayerId;
    token: string;
}

// D&D Character Management Types
export type CharacterId = string;

export interface CharacterStats {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

export interface CharacterModifiers {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

export interface CharacterSkills {
    acrobatics: number;
    animalHandling: number;
    arcana: number;
    athletics: number;
    deception: number;
    history: number;
    insight: number;
    intimidation: number;
    investigation: number;
    medicine: number;
    nature: number;
    perception: number;
    performance: number;
    persuasion: number;
    religion: number;
    sleightOfHand: number;
    stealth: number;
    survival: number;
}

export interface CharacterSavingThrows {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

export interface CharacterHitPoints {
    current: number;
    maximum: number;
    temporary: number;
}

export interface CharacterEquipment {
    weapons: string[];
    armor: string[];
    tools: string[];
    other: string[];
}

export interface CharacterSpell {
    name: string;
    level: number;
    school: string;
    description: string;
    prepared?: boolean;
}

export interface CharacterSpellcasting {
    spellcastingAbility?: keyof CharacterStats;
    spellSaveDC?: number;
    spellAttackBonus?: number;
    spellSlots: {
        level1: number;
        level2: number;
        level3: number;
        level4: number;
        level5: number;
        level6: number;
        level7: number;
        level8: number;
        level9: number;
    };
    spellSlotsUsed: {
        level1: number;
        level2: number;
        level3: number;
        level4: number;
        level5: number;
        level6: number;
        level7: number;
        level8: number;
        level9: number;
    };
    knownSpells: CharacterSpell[];
    preparedSpells: CharacterSpell[];
}

export interface CharacterBackground {
    name: string;
    description: string;
    skillProficiencies: string[];
    toolProficiencies: string[];
    languages: string[];
    features: string[];
}

export interface CharacterClass {
    name: string;
    level: number;
    hitDie: string;
    primaryAbility: keyof CharacterStats;
    savingThrowProficiencies: (keyof CharacterStats)[];
    skillProficiencies: (keyof CharacterSkills)[];
    features: string[];
    subclass?: string;
}

export interface CharacterRace {
    name: string;
    subrace?: string;
    abilityScoreIncrease: Partial<CharacterStats>;
    traits: string[];
    languages: string[];
    proficiencies: string[];
}

export interface CharacterSheet {
    id: CharacterId;
    campaignId?: CampaignId;
    playerId: PlayerId;
    seatId?: string;

    // Basic Information
    name: string;
    race: CharacterRace;
    characterClass: CharacterClass;
    background: CharacterBackground;
    level: number;
    experiencePoints: number;

    // Core Stats
    stats: CharacterStats;
    modifiers: CharacterModifiers;
    proficiencyBonus: number;

    // Combat Stats
    hitPoints: CharacterHitPoints;
    armorClass: number;
    initiative: number;
    speed: number;

    // Skills and Saves
    skills: CharacterSkills;
    savingThrows: CharacterSavingThrows;
    skillProficiencies: (keyof CharacterSkills)[];
    savingThrowProficiencies: (keyof CharacterStats)[];

    // Equipment and Inventory
    equipment: CharacterEquipment;
    currency: {
        copper: number;
        silver: number;
        gold: number;
        platinum: number;
    };

    // Spellcasting (optional)
    spellcasting?: CharacterSpellcasting;

    // Character Details
    personality: {
        traits: string[];
        ideals: string[];
        bonds: string[];
        flaws: string[];
    };
    appearance: {
        age: number;
        height: string;
        weight: string;
        eyes: string;
        skin: string;
        hair: string;
        description: string;
    };
    backstory: string;

    // Metadata
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
}

// Character Creation/Update Requests
export interface CreateCharacterRequest {
    campaignId?: CampaignId;
    seatId?: string;
    name: string;
    race: CharacterRace;
    characterClass: CharacterClass;
    background: CharacterBackground;
    stats: CharacterStats;
    personality?: {
        traits: string[];
        ideals: string[];
        bonds: string[];
        flaws: string[];
    };
    appearance?: {
        age: number;
        height: number;
        weight: number;
        eyes: string;
        skin: string;
        hair: string;
        description: string;
    };
    backstory?: string;
}

export interface UpdateCharacterRequest {
    name?: string;
    level?: number;
    experiencePoints?: number;
    stats?: Partial<CharacterStats>;
    hitPoints?: Partial<CharacterHitPoints>;
    armorClass?: number;
    equipment?: Partial<CharacterEquipment>;
    currency?: Partial<{
        copper: number;
        silver: number;
        gold: number;
        platinum: number;
    }>;
    personality?: Partial<{
        traits: string[];
        ideals: string[];
        bonds: string[];
        flaws: string[];
    }>;
    appearance?: Partial<{
        age: number;
        height: number;
        weight: number;
        eyes: string;
        skin: string;
        hair: string;
        description: string;
    }>;
    backstory?: string;
    spellcasting?: Partial<CharacterSpellcasting>;
}

// D&D Dice Rolling System Types
export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

export interface DiceRoll {
    id: string;
    notation: string; // e.g., "2d6+3", "1d20", "3d8+5"
    dice: DiceResult[];
    modifier: number;
    total: number;
    advantage?: boolean;
    disadvantage?: boolean;
    criticalSuccess: boolean;
    criticalFailure: boolean;
    timestamp: string;

    // New properties
    characterId?: string; // ID of the character rolling the dice
    description?: string; // Optional description for the roll
    rollType?: string; // Type of roll (e.g., attack, saving throw, etc.)
}

export interface DiceResult {
    die: DiceType;
    value: number;
    isMax: boolean;
    isMin: boolean;
}

export interface RollRequest {
    notation: string;
    rollType?: RollType;
    characterId?: CharacterId;
    skillOrSave?: keyof CharacterSkills | keyof CharacterSavingThrows;
    advantage?: boolean;
    disadvantage?: boolean;
    customModifier?: number;
    description?: string;
}

export type RollType =
    | "damage"
    | "attack"
    | "ability-check"
    | "saving-throw"
    | "skill-check"
    | "initiative"
    | "hit-dice"
    | "death-save"
    | "custom";

export interface CharacterRoll extends DiceRoll {
    characterId: CharacterId;
    characterName: string;
    rollType: RollType;
    abilityOrSkill?: string;
    description?: string;
}

export interface CampaignRollHistory {
    campaignId: CampaignId;
    rolls: CharacterRoll[];
    lastUpdated: string;
}

export interface CharacterListResponse {
    characters: CharacterSheet[];
}

// Character Edit Permissions
export interface CharacterEditPermissions {
    // Always player-editable (roleplay/appearance)
    canEditAppearance: boolean;
    canEditPersonality: boolean;
    canEditBackstory: boolean;
    canEditName: boolean;

    // GM permission required (mechanical advantages)
    canEditStats: boolean;
    canEditLevel: boolean;
    canEditExperience: boolean;
    canEditHitPoints: boolean;
    canEditEquipment: boolean;
    canEditCurrency: boolean;

    // Additional context
    isGM: boolean;
    isCharacterOwner: boolean;
    campaignEditMode: CampaignEditMode;
}

export type CampaignEditMode = "strict" | "collaborative" | "sandbox";

export interface PlayerCharacterUpdateRequest {
    // Player-safe updates only
    name?: string;
    backstory?: string;
    personality?: Partial<{
        traits: string[];
        ideals: string[];
        bonds: string[];
        flaws: string[];
    }>;
    appearance?: Partial<{
        age: number;
        height: number;
        weight: number;
        eyes: string;
        skin: string;
        hair: string;
        description: string;
    }>;
}

export interface GMCharacterUpdateRequest extends PlayerCharacterUpdateRequest {
    // GM can also edit mechanical stats
    level?: number;
    experiencePoints?: number;
    stats?: Partial<CharacterStats>;
    hitPoints?: Partial<CharacterHitPoints>;
    armorClass?: number;
    equipment?: Partial<CharacterEquipment>;
    currency?: Partial<{
        copper: number;
        silver: number;
        gold: number;
        platinum: number;
    }>;
    spellcasting?: Partial<CharacterSpellcasting>;
}

export interface CharacterUpdateAuditLog {
    id: string;
    characterId: CharacterId;
    updatedBy: PlayerId;
    updatedAt: string;
    changeType: "player-edit" | "gm-edit" | "system-calculation";
    fieldsChanged: string[];
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
    campaignId?: CampaignId;
}
