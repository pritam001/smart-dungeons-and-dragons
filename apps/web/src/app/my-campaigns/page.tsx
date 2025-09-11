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
                // Update the campaign list with new room code
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
                // Update the campaign list
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
                                    {campaign.description && (
                                        <p
                                            style={{
                                                fontSize: "14px",
                                                color: "#666",
                                                margin: "0 0 8px 0",
                                            }}
                                        >
                                            {campaign.description}
                                        </p>
                                    )}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            marginBottom: 8,
                                        }}
                                    >
                                        <div style={{ fontSize: "14px", color: "#666" }}>
                                            <strong>Room Code:</strong> {campaign.roomCode}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                padding: "2px 6px",
                                                borderRadius: 3,
                                                backgroundColor: campaign.isPrivate
                                                    ? "#ffc107"
                                                    : "#28a745",
                                                color: "white",
                                            }}
                                        >
                                            {campaign.isPrivate ? "PRIVATE" : "PUBLIC"}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                padding: "2px 6px",
                                                borderRadius: 3,
                                                backgroundColor:
                                                    campaign.status === "active"
                                                        ? "#28a745"
                                                        : campaign.status === "planning"
                                                          ? "#007bff"
                                                          : campaign.status === "completed"
                                                            ? "#6c757d"
                                                            : "#ffc107",
                                                color: "white",
                                            }}
                                        >
                                            {campaign.status?.toUpperCase() || "PLANNING"}
                                        </div>
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

                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        flexWrap: "wrap",
                                        marginBottom: 12,
                                    }}
                                >
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

                                    <button
                                        onClick={() => regenerateRoomCode(campaign.id)}
                                        disabled={actionLoading === campaign.id}
                                        style={{
                                            padding: "8px 16px",
                                            backgroundColor: "#ffc107",
                                            color: "black",
                                            border: "none",
                                            borderRadius: 4,
                                            cursor:
                                                actionLoading === campaign.id
                                                    ? "not-allowed"
                                                    : "pointer",
                                            fontSize: 14,
                                            opacity: actionLoading === campaign.id ? 0.7 : 1,
                                        }}
                                    >
                                        {actionLoading === campaign.id ? "..." : "New Code"}
                                    </button>
                                </div>

                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <select
                                        value={campaign.status || "planning"}
                                        onChange={(e) =>
                                            updateCampaignStatus(campaign.id, e.target.value)
                                        }
                                        disabled={actionLoading === campaign.id}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: 4,
                                            border: "1px solid #dee2e6",
                                            fontSize: 14,
                                            cursor:
                                                actionLoading === campaign.id
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}
                                    >
                                        <option value="planning">Planning</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="archived">Archived</option>
                                    </select>

                                    {occupiedSeats >= totalPlayerSeats && (
                                        <span
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor: "#f8f9fa",
                                                color: "#6c757d",
                                                border: "1px solid #dee2e6",
                                                borderRadius: 4,
                                                fontSize: 14,
                                                display: "flex",
                                                alignItems: "center",
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
