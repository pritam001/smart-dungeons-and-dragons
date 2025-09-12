"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CampaignConfig } from "@dnd-ai/types";

export default function JoinCampaignPage() {
    const [roomCode, setRoomCode] = useState("");
    const [result, setResult] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<CampaignConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        // Check authentication first
        const token = localStorage.getItem("authToken");
        if (!token) {
            router.push("/auth");
            return;
        }

        // Verify token is still valid and get user profile
        fetch("http://localhost:13333/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) {
                    return res.json();
                } else {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("user");
                    router.push("/auth");
                    throw new Error("Authentication failed");
                }
            })
            .then((userData) => {
                setIsAuthenticated(true);
                setUserProfile(userData.user); // Extract the user object from the response
                loadCampaigns();
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
            // Only show public campaigns in the browser
            const publicCampaigns = data.filter((c: CampaignConfig) => !c.isPrivate);
            setCampaigns(publicCampaigns);
        } catch (error) {
            console.error("Failed to load campaigns:", error);
        } finally {
            setLoading(false);
        }
    }

    async function joinCampaign(campaignRoomCode: string) {
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
                body: JSON.stringify({
                    roomCode: campaignRoomCode,
                    playerDisplayName: userProfile?.displayName || "Player",
                }),
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

    async function submitPrivateCampaign(e: React.FormEvent) {
        e.preventDefault();
        await joinCampaign(roomCode);
    }

    if (!isAuthenticated) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "18px",
                }}
            >
                Checking authentication...
            </div>
        );
    }

    return (
        <main
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "2rem",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
        >
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <button
                        onClick={() => router.push("/dashboard")}
                        style={{
                            position: "absolute",
                            top: "20px",
                            left: "20px",
                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                            color: "white",
                            border: "none",
                            padding: "12px 20px",
                            borderRadius: "25px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                            backdropFilter: "blur(10px)",
                            transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                    >
                        ← Back to Dashboard
                    </button>

                    <h1
                        style={{
                            color: "white",
                            fontSize: "42px",
                            fontWeight: "700",
                            margin: "0 0 12px 0",
                            textShadow: "0 4px 8px rgba(0,0,0,0.3)",
                        }}
                    >
                        🗡️ Join Campaign
                    </h1>
                    <p
                        style={{
                            color: "rgba(255, 255, 255, 0.9)",
                            fontSize: "18px",
                            margin: "0",
                            fontWeight: "300",
                        }}
                    >
                        Join an existing adventure with friends
                    </p>
                </div>

                {/* Public Campaigns Section */}
                <div
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "20px",
                        padding: "2rem",
                        marginBottom: "2rem",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "24px",
                            fontWeight: "600",
                            margin: "0 0 1rem 0",
                            color: "#333",
                        }}
                    >
                        🌟 Public Campaigns
                    </h2>
                    <p
                        style={{
                            color: "#666",
                            marginBottom: "1.5rem",
                            fontSize: "16px",
                            lineHeight: "1.5",
                        }}
                    >
                        Click the "Join" button on any available public campaign to instantly join,
                        or use the private campaign section below to enter a room code.
                    </p>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                            <div style={{ fontSize: "24px", marginBottom: "1rem" }}>⏳</div>
                            Loading campaigns...
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "3rem",
                                color: "#666",
                                backgroundColor: "#f8f9fa",
                                borderRadius: "12px",
                                border: "2px dashed #dee2e6",
                            }}
                        >
                            <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🏰</div>
                            <h3 style={{ margin: "0 0 0.5rem 0", color: "#495057" }}>
                                No Public Campaigns
                            </h3>
                            <p style={{ margin: 0 }}>
                                No public campaigns found. Ask someone to create a campaign or enter
                                a room code below!
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: "1rem" }}>
                            {campaigns.map((campaign) => {
                                const occupiedSeats = campaign.seats.filter(
                                    (s) => s.humanPlayerId,
                                ).length;
                                const totalSeats = campaign.seats.length;
                                const isFull = occupiedSeats >= totalSeats;

                                return (
                                    <div
                                        key={campaign.id}
                                        style={{
                                            border: isFull
                                                ? "2px solid #e74c3c"
                                                : "2px solid #e9ecef",
                                            borderRadius: "12px",
                                            padding: "1.5rem",
                                            backgroundColor: isFull
                                                ? "rgba(231, 76, 60, 0.05)"
                                                : "#ffffff",
                                            transition: "all 0.3s ease",
                                            opacity: isFull ? 0.6 : 1,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                marginBottom: "1rem",
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div
                                                    style={{
                                                        fontWeight: "700",
                                                        fontSize: "20px",
                                                        marginBottom: "0.5rem",
                                                        color: "#333",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.5rem",
                                                    }}
                                                >
                                                    🏛️ {campaign.name}
                                                    {isFull && (
                                                        <span
                                                            style={{
                                                                fontSize: "14px",
                                                                color: "#e74c3c",
                                                            }}
                                                        >
                                                            • FULL
                                                        </span>
                                                    )}
                                                </div>

                                                {campaign.description && (
                                                    <p
                                                        style={{
                                                            color: "#666",
                                                            margin: "0 0 1rem 0",
                                                            fontSize: "14px",
                                                            fontStyle: "italic",
                                                        }}
                                                    >
                                                        {campaign.description}
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => joinCampaign(campaign.roomCode)}
                                                disabled={joining || isFull}
                                                style={{
                                                    padding: "12px 24px",
                                                    background:
                                                        joining || isFull
                                                            ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                                                            : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    cursor:
                                                        joining || isFull
                                                            ? "not-allowed"
                                                            : "pointer",
                                                    transition: "all 0.2s ease",
                                                    opacity: joining || isFull ? 0.6 : 1,
                                                    minWidth: "100px",
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!joining && !isFull) {
                                                        e.currentTarget.style.transform =
                                                            "translateY(-1px)";
                                                        e.currentTarget.style.boxShadow =
                                                            "0 5px 15px rgba(16, 185, 129, 0.3)";
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!joining && !isFull) {
                                                        e.currentTarget.style.transform =
                                                            "translateY(0)";
                                                        e.currentTarget.style.boxShadow = "none";
                                                    }
                                                }}
                                            >
                                                {joining
                                                    ? "Joining..."
                                                    : isFull
                                                      ? "Full"
                                                      : "🚀 Join"}
                                            </button>
                                        </div>

                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "1rem",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "14px",
                                                        color: "#666",
                                                        marginBottom: "0.25rem",
                                                    }}
                                                >
                                                    <strong>Room Code:</strong>
                                                </div>
                                                <div
                                                    style={{
                                                        fontFamily: "monospace",
                                                        fontSize: "16px",
                                                        fontWeight: "bold",
                                                        color: "#667eea",
                                                        backgroundColor: "rgba(102, 126, 234, 0.1)",
                                                        padding: "0.25rem 0.5rem",
                                                        borderRadius: "6px",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    {campaign.roomCode}
                                                </div>
                                            </div>

                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "14px",
                                                        color: "#666",
                                                        marginBottom: "0.25rem",
                                                    }}
                                                >
                                                    <strong>Players:</strong>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "16px",
                                                        fontWeight: "600",
                                                        color: "#333",
                                                    }}
                                                >
                                                    {occupiedSeats} / {totalSeats} seats occupied
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: "1rem", fontSize: "14px" }}>
                                            <span style={{ color: "#666" }}>
                                                <strong>GM:</strong>{" "}
                                                {(() => {
                                                    const gmSeat = campaign.seats.find(
                                                        (s) => s.role === "gm",
                                                    );
                                                    if (gmSeat?.humanPlayerId) {
                                                        return "👤 Human";
                                                    } else if (gmSeat?.ai?.enabled) {
                                                        return `🤖 AI (${gmSeat.ai.modelId || "Default"})`;
                                                    } else {
                                                        return "❓ Not assigned";
                                                    }
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Private Campaign Join Form Section */}
                <div
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "20px",
                        padding: "2rem",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "24px",
                            fontWeight: "600",
                            margin: "0 0 1rem 0",
                            color: "#333",
                        }}
                    >
                        🔐 Private Campaign
                    </h3>
                    <p
                        style={{
                            color: "#666",
                            marginBottom: "1.5rem",
                            fontSize: "16px",
                            lineHeight: "1.5",
                        }}
                    >
                        Enter the 6-character room code to join a private campaign.
                    </p>

                    <form
                        onSubmit={submitPrivateCampaign}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1.5rem",
                            maxWidth: "500px",
                        }}
                    >
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                    fontWeight: "600",
                                    fontSize: "16px",
                                    color: "#374151",
                                }}
                            >
                                Room Code
                            </label>
                            <input
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                placeholder="Enter 6-character room code"
                                required
                                maxLength={6}
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "12px",
                                    fontSize: "16px",
                                    fontFamily: "monospace",
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    letterSpacing: "2px",
                                    textTransform: "uppercase",
                                    transition: "all 0.2s ease",
                                    outline: "none",
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = "#667eea";
                                    e.currentTarget.style.boxShadow =
                                        "0 0 0 3px rgba(102, 126, 234, 0.1)";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = "#e5e7eb";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />
                        </div>

                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                    fontWeight: "600",
                                    fontSize: "16px",
                                    color: "#374151",
                                }}
                            >
                                Joining as
                            </label>
                            <input
                                value={userProfile?.displayName || "Loading..."}
                                readOnly
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "12px",
                                    fontSize: "16px",
                                    backgroundColor: "#f9fafb",
                                    color: "#374151",
                                    cursor: "not-allowed",
                                    fontWeight: "600",
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={joining || !roomCode.trim() || !userProfile}
                            style={{
                                padding: "16px 32px",
                                background: joining
                                    ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "12px",
                                fontSize: "18px",
                                fontWeight: "600",
                                cursor: joining || !roomCode.trim() ? "not-allowed" : "pointer",
                                transition: "all 0.3s ease",
                                textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                opacity: joining || !roomCode.trim() ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!joining && roomCode.trim()) {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow =
                                        "0 10px 20px rgba(16, 185, 129, 0.3)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!joining && roomCode.trim()) {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "none";
                                }
                            }}
                        >
                            {joining ? "🎲 Joining..." : "🚀 Join Campaign"}
                        </button>
                    </form>
                </div>

                {/* Result Messages */}
                {result && (
                    <div
                        style={{
                            marginTop: "2rem",
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "20px",
                            padding: "2rem",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        {result.error ? (
                            <div
                                style={{
                                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                                    color: "#dc2626",
                                    border: "2px solid rgba(239, 68, 68, 0.2)",
                                    borderRadius: "12px",
                                    padding: "1rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                <span style={{ fontSize: "20px" }}>❌</span>
                                <div>
                                    <strong>Error:</strong> {result.error}
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                                    color: "#059669",
                                    border: "2px solid rgba(16, 185, 129, 0.2)",
                                    borderRadius: "12px",
                                    padding: "1rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                <span style={{ fontSize: "20px" }}>✅</span>
                                <div>
                                    <strong>Success!</strong> Joined campaign "
                                    {result.campaign?.name}". Redirecting to seat...
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
