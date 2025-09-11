import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getDb, usersCol } from "./mongo.js";
import {
    UserAccount,
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    AuthTokenPayload,
    PublicUserProfile,
} from "@dnd-ai/types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change";
const SALT_ROUNDS = 12;

function makeAuthToken(userId: string): string {
    const payload: AuthTokenPayload = {
        sub: userId,
        kind: "user",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };
    return jwt.sign(payload, JWT_SECRET);
}

export async function registerUser(
    req: RegisterRequest,
): Promise<AuthResponse | { error: string }> {
    const db = await getDb();

    // Check if username already exists
    const existingUser = await usersCol(db).findOne({ username: req.username });
    if (existingUser) {
        return { error: "Username already exists" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(req.password, SALT_ROUNDS);

    // Create user
    const user: UserAccount = {
        id: nanoid(),
        username: req.username,
        passwordHash,
        displayName: req.displayName,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
    };

    await usersCol(db).insertOne(user);

    const authToken = makeAuthToken(user.id);

    // Don't return password hash
    const { passwordHash: _, ...publicUser } = user;

    return {
        user: publicUser as PublicUserProfile,
        authToken,
    };
}

export async function loginUser(req: LoginRequest): Promise<AuthResponse | { error: string }> {
    const db = await getDb();

    // Find user by username
    const user = await usersCol(db).findOne({ username: req.username });
    if (!user) {
        return { error: "Invalid username or password" };
    }

    // Verify password
    const isValid = await bcrypt.compare(req.password, user.passwordHash);
    if (!isValid) {
        return { error: "Invalid username or password" };
    }

    // Update last login
    await usersCol(db).updateOne(
        { id: user.id },
        { $set: { lastLoginAt: new Date().toISOString() } },
    );

    const authToken = makeAuthToken(user.id);

    // Don't return password hash
    const { passwordHash: _, ...publicUser } = user;

    return {
        user: publicUser as PublicUserProfile,
        authToken,
    };
}

export async function verifyToken(token: string): Promise<PublicUserProfile | null> {
    try {
        const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;

        if (payload.kind !== "user") {
            return null;
        }

        const db = await getDb();
        const user = await usersCol(db).findOne({ id: payload.sub });

        if (!user) {
            return null;
        }

        // Don't return password hash
        const { passwordHash: _, ...publicUser } = user;
        return publicUser as PublicUserProfile;
    } catch (error) {
        return null;
    }
}

export function extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.substring(7);
}
