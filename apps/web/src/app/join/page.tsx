"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CampaignConfig } from "@dnd-ai/types";

export default function JoinCampaignPage() {
    const [roomCode, setRoomCode] = useState("");
    const [playerDisplayName, setPlayerDisplayName] = useState("Player");
    const [result, setResult] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<CampaignConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check authentication first
        const token = localStorage.getItem("authToken");
        if (!token) {
            router.push("/auth");
            return;
        }

        // Verify token is still valid
        fetch("http://localhost:13333/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) {
                    setIsAuthenticated(true);
                    loadCampaigns();
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

    async function loadCampaigns() {
        try {
            // List campaigns API doesn't require authentication currently
            const res = await fetch("http://localhost:13333/campaigns");
            const data = await res.json();
            setCampaigns(data);
        } catch (error) {
            console.error("Failed to load campaigns:", error);
        } finally {
            setLoading(false);
        }
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setJoining(true);
        setResult(null);

        const token = localStorage.getItem("authToken");

        try {
            const res = await fetch("http://localhost:13333/campaigns/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ roomCode, playerDisplayName }),
            });

            if (!res.ok) {
                const error = await res.json();
                setResult({ error: error.error || "Failed to join campaign" });
                return;
            }

            const data = await res.json();
            setResult(data);

            // On successful join, redirect to the campaign seat page
            if (data.campaign?.id) {
                // Show success message briefly before redirect
                setTimeout(() => {
                    router.push(`/seat/${data.campaign.id}`);
                }, 1000);
            }
        } catch (error) {
            setResult({ error: "Network error occurred" });
        } finally {
            setJoining(false);
        }
    }

    function selectCampaign(campaign: CampaignConfig) {
        setRoomCode(campaign.roomCode);
    }

    if (!isAuthenticated) {
        return (
            <div style={{ padding: 24, textAlign: "center" }}>
                <p>Checking authentication...</p>
            </div>
        );
    }

    return (
        <main style={{ padding: 24 }}>
            <h1>Join Campaign</h1>

            <div style={{ marginBottom: 32 }}>
                <h2>Available Campaigns</h2>
                {loading ? (
                    <p>Loading campaigns...</p>
                ) : campaigns.length === 0 ? (
                    <p style={{ color: "#666", fontStyle: "italic" }}>
                        No active campaigns found. Ask someone to create a campaign first!
                    </p>
                ) : (
                    <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
                        {campaigns.map((campaign) => {
                            const occupiedSeats = campaign.seats.filter(
                                (s) => s.humanPlayerId,
                            ).length;
                            const totalSeats = campaign.seats.length;
                            const isSelected = roomCode === campaign.roomCode;

                            return (
                                <div
                                    key={campaign.id}
                                    style={{
                                        border: isSelected ? "2px solid #007bff" : "1px solid #ddd",
                                        padding: 16,
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        backgroundColor: isSelected ? "#f0f8ff" : "#fafafa",
                                        transition: "all 0.2s ease",
                                    }}
                                    onClick={() => selectCampaign(campaign)}
                                >
                                    <div
                                        style={{
                                            fontWeight: "bold",
                                            fontSize: 18,
                                            marginBottom: 8,
                                            color: "#333",
                                        }}
                                    >
                                        {campaign.name}
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 14,
                                            color: "#666",
                                            marginBottom: 4,
                                        }}
                                    >
                                        <strong>Room Code:</strong> {campaign.roomCode}
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 14,
                                            color: "#666",
                                            marginBottom: 4,
                                        }}
                                    >
                                        <strong>Players:</strong> {occupiedSeats} / {totalSeats}{" "}
                                        seats occupied
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 14,
                                            color: "#666",
                                        }}
                                    >
                                        <strong>GM:</strong>{" "}
                                        {(() => {
                                            const gmSeat = campaign.seats.find(
                                                (s) => s.role === "gm",
                                            );
                                            if (gmSeat?.humanPlayerId) {
                                                return "Human";
                                            } else if (gmSeat?.ai?.enabled) {
                                                return `AI (${gmSeat.ai.modelId || "Default"})`;
                                            } else {
                                                return "Not assigned";
                                            }
                                        })()}
                                    </div>

                                    {occupiedSeats >= totalSeats && (
                                        <div
                                            style={{
                                                color: "#e74c3c",
                                                fontSize: 12,
                                                fontWeight: "bold",
                                                marginTop: 8,
                                            }}
                                        >
                                            Campaign Full
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 24,
                    backgroundColor: "#f9f9f9",
                }}
            >
                <h3 style={{ marginTop: 0 }}>Join Campaign</h3>

                <form
                    onSubmit={submit}
                    style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 400 }}
                >
                    <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                            Room Code
                        </label>
                        <input
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            placeholder="Enter room code or select from list above"
                            required
                            style={{
                                width: "100%",
                                padding: 12,
                                border: "1px solid #ddd",
                                borderRadius: 4,
                                fontSize: 16,
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                            Your Player Name
                        </label>
                        <input
                            value={playerDisplayName}
                            onChange={(e) => setPlayerDisplayName(e.target.value)}
                            placeholder="Enter your character/player name"
                            required
                            style={{
                                width: "100%",
                                padding: 12,
                                border: "1px solid #ddd",
                                borderRadius: 4,
                                fontSize: 16,
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={joining}
                        style={{
                            padding: 12,
                            backgroundColor: joining ? "#6c757d" : "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            fontSize: 16,
                            fontWeight: "bold",
                            cursor: joining ? "not-allowed" : "pointer",
                        }}
                    >
                        {joining ? "Joining..." : "Join Campaign"}
                    </button>
                </form>
            </div>

            {result && (
                <div style={{ marginTop: 24 }}>
                    {result.error ? (
                        <div
                            style={{
                                backgroundColor: "#f8d7da",
                                color: "#721c24",
                                border: "1px solid #f5c6cb",
                                borderRadius: 4,
                                padding: 12,
                            }}
                        >
                            <strong>Error:</strong> {result.error}
                        </div>
                    ) : (
                        <div
                            style={{
                                backgroundColor: "#d4edda",
                                color: "#155724",
                                border: "1px solid #c3e6cb",
                                borderRadius: 4,
                                padding: 12,
                            }}
                        >
                            <strong>Success!</strong> Joined campaign "{result.campaign?.name}".
                            Redirecting to seat...
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
