import { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerUser, loginUser, verifyToken, extractTokenFromHeader } from "../auth.js";

export async function authRoutes(fastify: FastifyInstance) {
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
}
