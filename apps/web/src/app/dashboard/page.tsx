"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
    id: string;
    username: string;
    displayName: string;
    createdAt: string;
    lastLoginAt?: string;
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
            router.push("/auth");
            return;
        }

        try {
            setUser(JSON.parse(userData));
        } catch {
            router.push("/auth");
            return;
        }

        // Verify token is still valid
        fetch("http://localhost:13333/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("user");
                    router.push("/auth");
                }
            })
            .catch(() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("user");
                router.push("/auth");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [router]);

    function handleLogout() {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        router.push("/auth");
    }

    if (loading) {
        return <main style={{ padding: 24 }}>Loading...</main>;
    }

    if (!user) {
        return null;
    }

    return (
        <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 32,
                    borderBottom: "1px solid #ddd",
                    paddingBottom: 16,
                }}
            >
                <div>
                    <h1>Welcome, {user.displayName}!</h1>
                    <p style={{ color: "#666", margin: 0 }}>@{user.username}</p>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                    }}
                >
                    Logout
                </button>
            </div>

            <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr 1fr" }}>
                <Link href="/create" style={{ textDecoration: "none" }}>
                    <div
                        style={{
                            border: "2px solid #007bff",
                            borderRadius: 8,
                            padding: 32,
                            textAlign: "center",
                            cursor: "pointer",
                            backgroundColor: "#f8f9ff",
                            transition: "background-color 0.2s",
                        }}
                    >
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
                        <h2 style={{ color: "#007bff", margin: "0 0 8px 0" }}>Create Campaign</h2>
                        <p style={{ color: "#666", margin: 0 }}>
                            Start a new D&D adventure with AI assistance
                        </p>
                    </div>
                </Link>

                <Link href="/join" style={{ textDecoration: "none" }}>
                    <div
                        style={{
                            border: "2px solid #28a745",
                            borderRadius: 8,
                            padding: 32,
                            textAlign: "center",
                            cursor: "pointer",
                            backgroundColor: "#f8fff8",
                            transition: "background-color 0.2s",
                        }}
                    >
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🗡️</div>
                        <h2 style={{ color: "#28a745", margin: "0 0 8px 0" }}>Join Campaign</h2>
                        <p style={{ color: "#666", margin: 0 }}>
                            Join an existing adventure with friends
                        </p>
                    </div>
                </Link>

                <Link href="/my-characters" style={{ textDecoration: "none" }}>
                    <div
                        style={{
                            border: "2px solid #6f42c1",
                            borderRadius: 8,
                            padding: 32,
                            textAlign: "center",
                            cursor: "pointer",
                            backgroundColor: "#f8f6ff",
                            transition: "background-color 0.2s",
                        }}
                    >
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
                        <h2 style={{ color: "#6f42c1", margin: "0 0 8px 0" }}>My Characters</h2>
                        <p style={{ color: "#666", margin: 0 }}>
                            View and manage your character sheets
                        </p>
                    </div>
                </Link>

                <Link href="/dice-roller" style={{ textDecoration: "none" }}>
                    <div
                        style={{
                            border: "2px solid #ffc107",
                            borderRadius: 8,
                            padding: 32,
                            textAlign: "center",
                            cursor: "pointer",
                            backgroundColor: "#fffbf0",
                            transition: "background-color 0.2s",
                        }}
                    >
                        <div style={{ fontSize: 48, marginBottom: 16 }}>�</div>
                        <h2 style={{ color: "#856404", margin: "0 0 8px 0" }}>Dice Roller</h2>
                        <p style={{ color: "#666", margin: 0 }}>
                            Roll dice for your characters and campaigns
                        </p>
                    </div>
                </Link>
            </div>

            <div
                style={{
                    marginTop: 48,
                    padding: 24,
                    backgroundColor: "#f8f9fa",
                    borderRadius: 8,
                }}
            >
                <h3>Getting Started</h3>
                <ul style={{ color: "#666" }}>
                    <li>
                        <strong>Create Campaign:</strong> Set up a new D&D session with customizable
                        AI assistance
                    </li>
                    <li>
                        <strong>Join Campaign:</strong> Enter a room code to join friends in their
                        adventure
                    </li>
                    <li>
                        <strong>AI Features:</strong> Get help with character creation, story
                        generation, and game management
                    </li>
                </ul>
            </div>
        </main>
    );
}
