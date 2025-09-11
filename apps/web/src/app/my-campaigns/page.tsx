"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CampaignConfig } from "@dnd-ai/types";

export default function MyCampaignsPage() {
    const [campaigns, setCampaigns] = useState<CampaignConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
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

    async function regenerateRoomCode(campaignId: string) {
        const token = localStorage.getItem("authToken");
        setActionLoading(campaignId);

        try {
            const response = await fetch(
                `http://localhost:13333/campaigns/${campaignId}/regenerate-code`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (response.ok) {
                const data = await response.json();
                setCampaigns((prev) =>
                    prev.map((c) => (c.id === campaignId ? { ...c, roomCode: data.roomCode } : c)),
                );
                alert(`New room code generated: ${data.roomCode}`);
            } else {
                alert("Failed to regenerate room code");
            }
        } catch (err) {
            alert("Error regenerating room code");
        } finally {
            setActionLoading(null);
        }
    }

    async function updateCampaignStatus(campaignId: string, status: string) {
        const token = localStorage.getItem("authToken");
        setActionLoading(campaignId);

        try {
            const response = await fetch(`http://localhost:13333/campaigns/${campaignId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                setCampaigns((prev) =>
                    prev.map((c) => (c.id === campaignId ? { ...c, status: status as any } : c)),
                );
                alert(`Campaign status updated to ${status}`);
            } else {
                alert("Failed to update campaign status");
            }
        } catch (err) {
            alert("Error updating campaign status");
        } finally {
            setActionLoading(null);
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case "planning":
                return "#3b82f6";
            case "active":
                return "#10b981";
            case "completed":
                return "#f59e0b";
            case "archived":
                return "#6b7280";
            default:
                return "#6b7280";
        }
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case "planning":
                return "📋";
            case "active":
                return "⚔️";
            case "completed":
                return "🏆";
            case "archived":
                return "📦";
            default:
                return "❓";
        }
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

    if (loading) {
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
                Loading your campaigns...
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    padding: "2rem",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}
            >
                <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
                    <div
                        style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "#dc2626",
                            border: "2px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: "12px",
                            padding: "2rem",
                            marginBottom: "2rem",
                        }}
                    >
                        <span style={{ fontSize: "48px", display: "block", marginBottom: "1rem" }}>
                            ❌
                        </span>
                        <h2 style={{ margin: "0 0 1rem 0" }}>Error Loading Campaigns</h2>
                        <p style={{ margin: "0 0 2rem 0" }}>{error}</p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            style={{
                                padding: "1rem 2rem",
                                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "12px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "16px",
                                transition: "all 0.3s ease",
                            }}
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
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
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                {/* Header */}
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
                            🛡️ My Campaigns
                        </h1>
                        <p
                            style={{
                                color: "#64748b",
                                margin: 0,
                                fontSize: "1.1rem",
                            }}
                        >
                            Manage campaigns where you're the Game Master
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <button
                            onClick={() => router.push("/create")}
                            style={{
                                padding: "0.75rem 1.5rem",
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
                                e.currentTarget.style.boxShadow =
                                    "0 10px 20px rgba(16, 185, 129, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            🎲 Create Campaign
                        </button>
                        <button
                            onClick={() => router.push("/dashboard")}
                            style={{
                                padding: "0.75rem 1.5rem",
                                background: "rgba(255, 255, 255, 0.2)",
                                color: "#374151",
                                border: "2px solid #e5e7eb",
                                borderRadius: "12px",
                                cursor: "pointer",
                                fontWeight: "600",
                                transition: "all 0.2s ease",
                                fontSize: "0.95rem",
                                backdropFilter: "blur(10px)",
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
                    </div>
                </div>

                {/* Campaigns List */}
                {campaigns.length === 0 ? (
                    <div
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "20px",
                            padding: "4rem",
                            textAlign: "center",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        <div style={{ fontSize: "64px", marginBottom: "1rem" }}>🏰</div>
                        <h2
                            style={{
                                fontSize: "28px",
                                fontWeight: "600",
                                margin: "0 0 1rem 0",
                                color: "#374151",
                            }}
                        >
                            No Campaigns Yet
                        </h2>
                        <p
                            style={{
                                color: "#6b7280",
                                marginBottom: "2rem",
                                fontSize: "16px",
                                lineHeight: "1.6",
                                maxWidth: "500px",
                                margin: "0 auto 2rem auto",
                            }}
                        >
                            Ready to start your first adventure? Create a campaign to begin your
                            journey as a Game Master!
                        </p>
                        <button
                            onClick={() => router.push("/create")}
                            style={{
                                padding: "1rem 2rem",
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "12px",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "16px",
                                transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow =
                                    "0 10px 20px rgba(16, 185, 129, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            🎲 Create Your First Campaign
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "1.5rem" }}>
                        {campaigns.map((campaign) => {
                            const occupiedSeats = campaign.seats.filter(
                                (s) => s.humanPlayerId,
                            ).length;
                            const totalSeats = campaign.seats.length;
                            const isLoading = actionLoading === campaign.id;

                            return (
                                <div
                                    key={campaign.id}
                                    style={{
                                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                                        borderRadius: "16px",
                                        padding: "2rem",
                                        boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                                        backdropFilter: "blur(10px)",
                                        transition: "all 0.3s ease",
                                    }}
                                >
                                    {/* Campaign Header */}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: "1.5rem",
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.75rem",
                                                    marginBottom: "0.5rem",
                                                }}
                                            >
                                                <h2
                                                    style={{
                                                        fontSize: "24px",
                                                        fontWeight: "700",
                                                        margin: 0,
                                                        color: "#1f2937",
                                                    }}
                                                >
                                                    {campaign.name}
                                                </h2>
                                                <span
                                                    style={{
                                                        backgroundColor: getStatusColor(
                                                            campaign.status,
                                                        ),
                                                        color: "white",
                                                        padding: "0.25rem 0.75rem",
                                                        borderRadius: "20px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.5px",
                                                    }}
                                                >
                                                    {getStatusIcon(campaign.status)}{" "}
                                                    {campaign.status}
                                                </span>
                                            </div>
                                            {campaign.description && (
                                                <p
                                                    style={{
                                                        color: "#6b7280",
                                                        margin: "0 0 1rem 0",
                                                        fontSize: "14px",
                                                    }}
                                                >
                                                    {campaign.description}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => router.push(`/seat/${campaign.id}`)}
                                            style={{
                                                padding: "0.75rem 1rem",
                                                background:
                                                    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontWeight: "600",
                                                fontSize: "14px",
                                                transition: "all 0.2s ease",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform =
                                                    "translateY(-1px)";
                                                e.currentTarget.style.boxShadow =
                                                    "0 5px 15px rgba(59, 130, 246, 0.3)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "translateY(0)";
                                                e.currentTarget.style.boxShadow = "none";
                                            }}
                                        >
                                            🎯 Manage
                                        </button>
                                    </div>

                                    {/* Campaign Stats */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(auto-fit, minmax(200px, 1fr))",
                                            gap: "1rem",
                                            marginBottom: "1.5rem",
                                        }}
                                    >
                                        <div
                                            style={{
                                                backgroundColor: "#f9fafb",
                                                borderRadius: "8px",
                                                padding: "1rem",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#6b7280",
                                                    marginBottom: "0.25rem",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                }}
                                            >
                                                Room Code
                                            </div>
                                            <div
                                                style={{
                                                    fontFamily: "monospace",
                                                    fontSize: "18px",
                                                    fontWeight: "bold",
                                                    color: "#3b82f6",
                                                }}
                                            >
                                                {campaign.roomCode}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                backgroundColor: "#f9fafb",
                                                borderRadius: "8px",
                                                padding: "1rem",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#6b7280",
                                                    marginBottom: "0.25rem",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                }}
                                            >
                                                Players
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "18px",
                                                    fontWeight: "bold",
                                                    color: "#1f2937",
                                                }}
                                            >
                                                {occupiedSeats} / {totalSeats} seats occupied
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                backgroundColor: "#f9fafb",
                                                borderRadius: "8px",
                                                padding: "1rem",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#6b7280",
                                                    marginBottom: "0.25rem",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                }}
                                            >
                                                Privacy
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "18px",
                                                    fontWeight: "bold",
                                                    color: campaign.isPrivate
                                                        ? "#dc2626"
                                                        : "#10b981",
                                                }}
                                            >
                                                {campaign.isPrivate ? "🔒 Private" : "🌍 Public"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "0.75rem",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <select
                                            value={campaign.status}
                                            onChange={(e) =>
                                                updateCampaignStatus(campaign.id, e.target.value)
                                            }
                                            disabled={isLoading}
                                            style={{
                                                padding: "0.5rem",
                                                borderRadius: "6px",
                                                border: "2px solid #e5e7eb",
                                                fontSize: "14px",
                                                fontWeight: "500",
                                                cursor: isLoading ? "not-allowed" : "pointer",
                                                opacity: isLoading ? 0.6 : 1,
                                            }}
                                        >
                                            <option value="planning">📋 Planning</option>
                                            <option value="active">⚔️ Active</option>
                                            <option value="completed">🏆 Completed</option>
                                            <option value="archived">📦 Archived</option>
                                        </select>
                                        <button
                                            onClick={() => regenerateRoomCode(campaign.id)}
                                            disabled={isLoading}
                                            style={{
                                                padding: "0.5rem 1rem",
                                                background: isLoading
                                                    ? "#9ca3af"
                                                    : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "6px",
                                                cursor: isLoading ? "not-allowed" : "pointer",
                                                fontWeight: "500",
                                                fontSize: "14px",
                                                opacity: isLoading ? 0.6 : 1,
                                            }}
                                        >
                                            🔄 New Code
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(campaign.roomCode);
                                                alert("Room code copied to clipboard!");
                                            }}
                                            style={{
                                                padding: "0.5rem 1rem",
                                                background:
                                                    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontWeight: "500",
                                                fontSize: "14px",
                                            }}
                                        >
                                            📋 Copy Code
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
