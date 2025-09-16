import Fastify from "fastify";
import cors from "@fastify/cors";
import { snapshotRegistry } from "./aiModels.js";
import { authRoutes } from "./routes/authRoutes.js";
import { campaignRoutes } from "./routes/campaignRoutes.js";
import { characterRoutes } from "./routes/characterRoutes.js";
import { diceRoutes } from "./routes/diceRoutes.js";
import { turnTrackingRoutes } from "./routes/turnTrackingRoutes.js";

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
fastify.listen({ port, host: "0.0.0.0" }).catch((err) => {
    fastify.log.error(err);
    process.exit(1);
});
