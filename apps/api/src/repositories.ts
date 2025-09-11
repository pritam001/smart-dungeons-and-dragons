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
} from "@dnd-ai/types";
import jwt from "jsonwebtoken";

const campaigns = new Map<string, CampaignConfig>();
const players = new Map<string, PlayerProfile>();

function generateRoomCode(): string {
    return nanoid(6).toUpperCase();
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change";

function makeGuestToken(playerId: string) {
    return jwt.sign({ sub: playerId, kind: "guest" }, JWT_SECRET, { expiresIn: "7d" });
}

export function createCampaign(
    req: CreateCampaignRequest,
    creatorDisplayName: string,
): CreateCampaignResponse {
    const playerId = nanoid();
    const creator: PlayerProfile = {
        id: playerId,
        displayName: creatorDisplayName,
        createdAt: new Date().toISOString(),
    };
    players.set(playerId, creator);

    const roomCode = generateRoomCode();
    const availableModels = snapshotRegistry().models;
    const whitelist = availableModels.map((m) => m.id); // all allowed now

    const seats: SeatAssignment[] = [];

    // GM seat
    const gmSeat: SeatAssignment = {
        seatId: "gm",
        role: SeatRole.GAME_MASTER,
        humanPlayerId: req.gmIsHuman ? playerId : undefined,
        ai: !req.gmIsHuman ? { enabled: true, modelId: req.gmAIModelId } : { enabled: false },
    };
    seats.push(gmSeat);

    for (let i = 0; i < req.seatCount; i++) {
        seats.push({
            seatId: `p${i + 1}`,
            role: SeatRole.PLAYER,
            humanPlayerId: i === 0 && req.gmIsHuman ? undefined : undefined, // first player seat unassigned by default
            ai: req.aiEnabledDefault ? { enabled: true } : { enabled: false },
        });
    }

    const campaign: CampaignConfig = {
        id: nanoid(),
        roomCode,
        name: req.name,
        createdBy: playerId,
        createdAt: new Date().toISOString(),
        seats,
        aiModelWhitelist: whitelist,
    };

    campaigns.set(campaign.id, campaign);
    const authToken = makeGuestToken(playerId);
    return { campaign, availableModels, selfPlayer: creator, authToken };
}

export function joinCampaign(req: JoinCampaignRequest): JoinCampaignResponse | undefined {
    const campaign = Array.from(campaigns.values()).find(
        (c) => c.roomCode === req.roomCode.toUpperCase(),
    );
    if (!campaign) return undefined;
    const playerId = nanoid();
    const profile: PlayerProfile = {
        id: playerId,
        displayName: req.playerDisplayName,
        createdAt: new Date().toISOString(),
    };
    players.set(playerId, profile);
    const authToken = makeGuestToken(playerId);
    return {
        campaign,
        selfPlayer: profile,
        availableModels: snapshotRegistry().models.filter((m) =>
            campaign.aiModelWhitelist.includes(m.id),
        ),
        authToken,
    };
}

export function updateSeatAI(req: UpdateSeatAIRequest) {
    const campaign = campaigns.get(req.campaignId);
    if (!campaign) return false;
    const seat = campaign.seats.find((s) => s.seatId === req.seatId);
    if (!seat) return false;
    if (req.ai.enabled && req.ai.modelId && !campaign.aiModelWhitelist.includes(req.ai.modelId))
        return false;
    seat.ai = req.ai;
    return true;
}

export function assignSeat(req: UpdateSeatHumanAssignmentRequest) {
    const campaign = campaigns.get(req.campaignId);
    if (!campaign) return false;
    const seat = campaign.seats.find((s) => s.seatId === req.seatId);
    if (!seat) return false;
    seat.humanPlayerId = req.playerId;
    return true;
}

export function listCampaigns() {
    return Array.from(campaigns.values());
}
