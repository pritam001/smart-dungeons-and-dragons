import Fastify from "fastify";
import cors from "@fastify/cors";
import { snapshotRegistry } from "./aiModels.js";
import { authRoutes } from "./routes/authRoutes.js";
import { campaignRoutes } from "./routes/campaignRoutes.js";
import { characterRoutes } from "./routes/characterRoutes.js";
import { diceRoutes } from "./routes/diceRoutes.js";
import { turnTrackingRoutes } from "./routes/turnTrackingRoutes.js";

// --- WebSocket Setup ---

import { WebSocketServer, WebSocket } from "ws";
import type { TurnUpdateEvent } from "../../../packages/types/src/index.js";

// Map campaignId to Set of WebSocket clients
const campaignClients: Record<string, Set<WebSocket>> = {};

let wss: WebSocketServer | undefined;
function setupWebSocket(server: any) {
    wss = new WebSocketServer({ server });
    wss.on("connection", (ws: WebSocket, req: import("http").IncomingMessage) => {
        // Only allow /ws path
        if (!req.url || !req.url.startsWith("/ws")) {
            ws.close(1008, "Invalid WebSocket path");
            return;
        }
        // Expect campaignId as query param
        const url = new URL(req.url, `http://${req.headers.host}`);
        const campaignId = url.searchParams.get("campaignId");
        if (!campaignId) {
            ws.close(1008, "Missing campaignId");
            return;
        }
        if (!campaignClients[campaignId]) campaignClients[campaignId] = new Set();
        campaignClients[campaignId].add(ws);

        // Log incoming messages
        ws.on("message", (message) => {
            console.log(`[WS] Message received for campaignId=${campaignId}:`, message.toString());
        });

        ws.on("close", (code, reason) => {
            console.log(
                `[WS] Connection closed for campaignId=${campaignId} code=${code} reason=${reason?.toString()}`,
            );
            campaignClients[campaignId].delete(ws);
            if (campaignClients[campaignId].size === 0) delete campaignClients[campaignId];
        });
    });
}

// Helper to broadcast turn updates
export function broadcastTurnUpdate(event: TurnUpdateEvent) {
    const clients = campaignClients[event.campaignId];
    if (!clients) return;
    const msg = JSON.stringify({ type: "turnUpdate", payload: event });
    for (const ws of clients) {
        if (ws.readyState === ws.OPEN) ws.send(msg);
    }
}

const fastify = Fastify({ logger: true });
await fastify.register(cors, { origin: true });

fastify.get("/health", async () => ({ ok: true }));
fastify.get("/models", async () => snapshotRegistry());

// Register routes
await authRoutes(fastify);
await campaignRoutes(fastify);
await characterRoutes(fastify);
await diceRoutes(fastify);
await turnTrackingRoutes(fastify);

const port = Number(process.env.PORT || 13333);
fastify
    .listen({ port, host: "0.0.0.0" })
    .then((address) => {
        setupWebSocket(fastify.server);
        fastify.log.info(`HTTP/WebSocket server listening on port ${port}`);
    })
    .catch((err) => {
        fastify.log.error(err);
        process.exit(1);
    });
