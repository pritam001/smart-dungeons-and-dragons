import { MongoClient, Db, Collection } from "mongodb";
import {
    CampaignConfig,
    PlayerProfile,
    UserAccount,
    CharacterSheet,
    CampaignRollHistory,
} from "@dnd-ai/types";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "dndai";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
    if (!db) {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        await ensureIndexes(db);
    }
    return db;
}

async function ensureIndexes(db: Db) {
    await db.collection<CampaignConfig>("campaigns").createIndex({ roomCode: 1 }, { unique: true });
    await db.collection<PlayerProfile>("players").createIndex({ displayName: 1 });
    await db.collection<UserAccount>("users").createIndex({ username: 1 }, { unique: true });
    await db.collection<CharacterSheet>("characters").createIndex({ campaignId: 1 });
    await db.collection<CharacterSheet>("characters").createIndex({ playerId: 1 });
    await db.collection<CharacterSheet>("characters").createIndex({ id: 1 }, { unique: true });
}

export function campaignsCol(db: Db): Collection<CampaignConfig> {
    return db.collection("campaigns");
}
export function playersCol(db: Db): Collection<PlayerProfile> {
    return db.collection("players");
}
export function usersCol(db: Db): Collection<UserAccount> {
    return db.collection("users");
}
export function charactersCol(db: Db) {
    return db.collection<CharacterSheet>("characters");
}

export function rollHistoryCol(db: Db) {
    return db.collection<CampaignRollHistory>("rollHistory");
}

export async function closeMongo() {
    if (client) await client.close();
    client = null;
    db = null;
}
