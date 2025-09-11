"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CampaignConfig } from "@dnd-ai/types";

export default function MyCampaignsPage() {
    const [campaigns, setCampaigns] = useState<CampaignConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            router.push("/auth");
            return;
        }

        // Verify token and load campaigns
        fetch("http://localhost:13333/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) {
                    setIsAuthenticated(true);
                    loadMyCampaigns();
                } else {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("user");
                    router.push("/auth");
                }
            })
            .catch(() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("user");
                router.push("/auth");
            });
    }, [router]);

    async function loadMyCampaigns() {
        const token = localStorage.getItem("authToken");
        try {
            const response = await fetch("http://localhost:13333/my-campaigns", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                setError("Failed to load your campaigns");
                return;
            }

            const campaignData = await response.json();
            setCampaigns(campaignData);
        } catch (err) {
            setError("Network error occurred");
        } finally {
            setLoading(false);
        }
    }

    if (!isAuthenticated) {
        return <div style={{ padding: 24 }}>Checking authentication...</div>;
    }

    if (loading) {
        return <div style={{ padding: 24 }}>Loading your campaigns...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: 24 }}>
                <div
                    style={{
                        color: "#dc3545",
                        backgroundColor: "#f8d7da",
                        border: "1px solid #f5c6cb",
                        borderRadius: 4,
                        padding: 12,
                        marginBottom: 16,
                    }}
                >
                    {error}
                </div>
                <button
                    onClick={() => router.push("/dashboard")}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                    }}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 32,
                }}
            >
                <div>
                    <h1>🛡️ My Campaigns</h1>
                    <p style={{ color: "#666", margin: 0 }}>
                        Campaigns where you are the Game Master
                    </p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button
                        onClick={() => router.push("/dashboard")}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                        }}
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={() => router.push("/create")}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                        }}
                    >
                        Create New Campaign
                    </button>
                </div>
            </div>

            {campaigns.length === 0 ? (
                <div
                    style={{
                        textAlign: "center",
                        padding: 48,
                        backgroundColor: "#f8f9fa",
                        borderRadius: 8,
                        border: "1px solid #dee2e6",
                    }}
                >
                    <div style={{ fontSize: 64, marginBottom: 16 }}>🎲</div>
                    <h2 style={{ color: "#666", marginBottom: 16 }}>No Campaigns Yet</h2>
                    <p style={{ color: "#666", marginBottom: 24 }}>
                        You haven't created any campaigns yet. Start your first adventure!
                    </p>
                    <button
                        onClick={() => router.push("/create")}
                        style={{
                            padding: "12px 24px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 16,
                        }}
                    >
                        Create Your First Campaign
                    </button>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gap: 24,
                        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                    }}
                >
                    {campaigns.map((campaign) => {
                        const occupiedSeats = campaign.seats.filter(
                            (s) => s.humanPlayerId && s.role === "player",
                        ).length;
                        const totalPlayerSeats = campaign.seats.filter(
                            (s) => s.role === "player",
                        ).length;
                        const gmSeat = campaign.seats.find((s) => s.role === "gm");

                        return (
                            <div
                                key={campaign.id}
                                style={{
                                    border: "1px solid #dee2e6",
                                    borderRadius: 8,
                                    padding: 24,
                                    backgroundColor: "white",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                }}
                            >
                                <div style={{ marginBottom: 16 }}>
                                    <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>
                                        {campaign.name}
                                    </h3>
                                    <div
                                        style={{ fontSize: "14px", color: "#666", marginBottom: 8 }}
                                    >
                                        <strong>Room Code:</strong> {campaign.roomCode}
                                    </div>
                                    <div
                                        style={{ fontSize: "14px", color: "#666", marginBottom: 8 }}
                                    >
                                        <strong>Players:</strong> {occupiedSeats}/{totalPlayerSeats}{" "}
                                        seats filled
                                    </div>
                                    <div
                                        style={{ fontSize: "14px", color: "#666", marginBottom: 8 }}
                                    >
                                        <strong>GM:</strong>{" "}
                                        {gmSeat?.humanPlayerId ? "Human (You)" : "AI"}
                                    </div>
                                    <div style={{ fontSize: "14px", color: "#666" }}>
                                        <strong>Created:</strong>{" "}
                                        {new Date(campaign.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <button
                                        onClick={() => router.push(`/seat/${campaign.id}`)}
                                        style={{
                                            padding: "8px 16px",
                                            backgroundColor: "#007bff",
                                            color: "white",
                                            border: "none",
                                            borderRadius: 4,
                                            cursor: "pointer",
                                            fontSize: 14,
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Manage Campaign
                                    </button>

                                    {occupiedSeats < totalPlayerSeats && (
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(campaign.roomCode);
                                                alert(
                                                    `Room code ${campaign.roomCode} copied to clipboard!`,
                                                );
                                            }}
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor: "#28a745",
                                                color: "white",
                                                border: "none",
                                                borderRadius: 4,
                                                cursor: "pointer",
                                                fontSize: 14,
                                            }}
                                        >
                                            Copy Room Code
                                        </button>
                                    )}

                                    {occupiedSeats >= totalPlayerSeats && (
                                        <span
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor: "#f8f9fa",
                                                color: "#6c757d",
                                                border: "1px solid #dee2e6",
                                                borderRadius: 4,
                                                fontSize: 14,
                                            }}
                                        >
                                            Campaign Full
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
