export type PlayerId = string;
export type CampaignId = string;
export type RoomCode = string;

export enum SeatRole {
    PLAYER = "player",
    GAME_MASTER = "gm",
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

export interface CampaignConfig {
    id: CampaignId;
    roomCode: RoomCode;
    name: string;
    createdBy: PlayerId;
    createdAt: string;
    seats: SeatAssignment[];
    aiModelWhitelist: string[]; // allowed model ids for this campaign
}

export interface CreateCampaignRequest {
    name: string;
    gmIsHuman: boolean;
    gmAIModelId?: string; // if gmIsHuman=false
    seatCount: number; // including GM? count of player seats only (GM separate)
    aiEnabledDefault?: boolean;
}

export interface CreateCampaignResponse {
    campaign: CampaignConfig;
    availableModels: AIModelMeta[];
    selfPlayer: PlayerProfile;
    authToken: string; // guest token (JWT)
}

export interface JoinCampaignRequest {
    roomCode: RoomCode;
    playerDisplayName: string;
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

export interface AIModelRegistrySnapshot {
    models: AIModelMeta[];
    updatedAt: string;
}

export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

// Auth
export interface GuestAuthTokenPayload {
    sub: PlayerId;
    kind: "guest";
    iat: number;
    exp: number;
}

export interface AuthContext {
    playerId: PlayerId;
    token: string;
}
