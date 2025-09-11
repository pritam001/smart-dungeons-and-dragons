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
} from "@dnd-ai/types";
import jwt from "jsonwebtoken";
import { getDb, campaignsCol, playersCol } from "./mongo.js";

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
