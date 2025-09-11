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
        <main
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "2rem",
            }}
        >
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "3rem",
                        background: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(10px)",
                        borderRadius: "16px",
                        padding: "2rem",
                        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: "2.5rem",
                                fontWeight: "700",
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                margin: "0 0 0.5rem 0",
                            }}
                        >
                            Welcome, {user.displayName}! 🎲
                        </h1>
                        <p
                            style={{
                                color: "#64748b",
                                margin: 0,
                                fontSize: "1.1rem",
                            }}
                        >
                            @{user.username}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "0.75rem 1.5rem",
                            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            cursor: "pointer",
                            fontWeight: "600",
                            transition: "all 0.2s ease",
                            fontSize: "0.95rem",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 10px 20px rgba(239, 68, 68, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        Logout
                    </button>
                </div>

                <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr 1fr 1fr" }}>
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
                            <h2 style={{ color: "#007bff", margin: "0 0 8px 0" }}>
                                Create Campaign
                            </h2>
                            <p style={{ color: "#666", margin: 0 }}>
                                Start a new D&D adventure with AI assistance
                            </p>
                        </div>
                    </Link>

                    <Link href="/my-campaigns" style={{ textDecoration: "none" }}>
                        <div
                            style={{
                                border: "2px solid #dc3545",
                                borderRadius: 8,
                                padding: 32,
                                textAlign: "center",
                                cursor: "pointer",
                                backgroundColor: "#fff8f8",
                                transition: "background-color 0.2s",
                            }}
                        >
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
                            <h2 style={{ color: "#dc3545", margin: "0 0 8px 0" }}>My Campaigns</h2>
                            <p style={{ color: "#666", margin: 0 }}>
                                Manage campaigns where you're the GM
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

                    <Link href="/create-character" style={{ textDecoration: "none" }}>
                        <div
                            style={{
                                border: "2px solid #28a745",
                                borderRadius: 8,
                                padding: 32,
                                textAlign: "center",
                                cursor: "pointer",
                                backgroundColor: "#f0fff4",
                                transition: "background-color 0.2s",
                            }}
                        >
                            <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                            <h2 style={{ color: "#155724", margin: "0 0 8px 0" }}>
                                Create Character
                            </h2>
                            <p style={{ color: "#666", margin: 0 }}>
                                Build a new character for your adventures
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
                            <strong>Create Campaign:</strong> Set up a new D&D session with
                            customizable AI assistance
                        </li>
                        <li>
                            <strong>Join Campaign:</strong> Enter a room code to join friends in
                            their adventure
                        </li>
                        <li>
                            <strong>AI Features:</strong> Get help with character creation, story
                            generation, and game management
                        </li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
