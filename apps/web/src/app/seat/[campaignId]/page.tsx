"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AIModelMeta, CampaignConfig } from "@dnd-ai/types";
import { PageContainer, ContentWrapper, Button, Card } from "../../../components/ui";

interface SeatState {
    campaign?: CampaignConfig;
    models: AIModelMeta[];
    loading: boolean;
    error?: string;
    currentUser?: any;
    isGM?: boolean;
}

export default function SeatManagement({ params }: { params: { campaignId: string } }) {
    const [state, setState] = useState<SeatState>({ loading: true, models: [] });
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem("authToken");
        if (stored) setToken(stored);
    }, []);

    useEffect(() => {
        async function load() {
            try {
                // Get current user info to determine if they're the GM
                const userResponse = await fetch("http://localhost:13333/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const userData = await userResponse.json();
                const currentUser = userData.user;

                const campaigns = await fetch("http://localhost:13333/campaigns").then((r) =>
                    r.json(),
                );
                const campaign = campaigns.find((c: CampaignConfig) => c.id === params.campaignId);
                const isGM = campaign && currentUser && campaign.createdBy === currentUser.id;

                const models = await fetch("http://localhost:13333/models")
                    .then((r) => r.json())
                    .then((d) => d.models as AIModelMeta[]);

                setState({ loading: false, campaign, models, currentUser, isGM });
            } catch (e: any) {
                setState((s) => ({ ...s, loading: false, error: e.message }));
            }
        }
        if (token) {
            load();
        }
    }, [params.campaignId, token]);

    async function toggleAI(seatId: string) {
        if (!state.campaign || !state.isGM) return; // Only GM can toggle AI
        const seat = state.campaign.seats.find((s) => s.seatId === seatId);
        const enabled = !seat?.ai?.enabled;
        await fetch(`http://localhost:13333/campaigns/${state.campaign.id}/seat/ai`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ seatId, ai: { enabled } }),
        });
        // refresh
        const campaigns = await fetch("http://localhost:13333/campaigns").then((r) => r.json());
        const campaign = campaigns.find((c: CampaignConfig) => c.id === params.campaignId);
        setState((s) => ({ ...s, campaign }));
    }

    async function removePlayer(playerId: string) {
        if (!state.campaign || !state.isGM) return; // Only GM can remove players

        const confirmMessage =
            "Are you sure you want to remove this player? Their character will also leave the campaign but won't be deleted.";
        if (!confirm(confirmMessage)) return;

        try {
            const response = await fetch(
                `http://localhost:13333/campaigns/${state.campaign.id}/remove-player`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ playerId }),
                },
            );

            if (response.ok) {
                // Refresh campaign data
                const campaigns = await fetch("http://localhost:13333/campaigns").then((r) =>
                    r.json(),
                );
                const campaign = campaigns.find((c: CampaignConfig) => c.id === params.campaignId);
                setState((s) => ({ ...s, campaign }));
                alert("Player removed from campaign");
            } else {
                const error = await response.json();
                alert(`Failed to remove player: ${error.error}`);
            }
        } catch (error) {
            alert("Error removing player. Please try again.");
        }
    }

    if (state.loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">
                <div className="text-center">
                    <div className="text-5xl mb-4">⏳</div>
                    Loading campaign...
                </div>
            </div>
        );
    }

    if (!state.campaign) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">
                <div className="text-center">
                    <div className="text-5xl mb-4">❌</div>
                    Campaign not found.
                </div>
            </div>
        );
    }

    return (
        <PageContainer>
            <ContentWrapper>
                {/* Header */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                            🏛️ {state.campaign.name}
                        </h1>
                        <div className="flex gap-8 items-center">
                            <div className="font-mono text-xl font-bold text-blue-600 bg-blue-100 px-4 py-2 rounded-lg">
                                Room Code: {state.campaign.roomCode}
                            </div>
                            {state.isGM && (
                                <div className="text-green-600 font-semibold text-lg flex items-center gap-2">
                                    🛡️ Game Master Access
                                </div>
                            )}
                        </div>
                    </div>
                    <Button
                        onClick={() => router.back()}
                        variant="secondary"
                        className="hover:transform hover:-translate-y-1"
                    >
                        ← Back
                    </Button>
                </div>

                {/* Add Seats Section - GM Only */}
                {state.isGM && (
                    <Card className="mb-8 border-2 border-yellow-300">
                        <h3 className="mt-0 mb-4 text-xl font-semibold text-gray-700 flex items-center gap-2">
                            ➕ Add More Seats
                        </h3>
                        <div className="flex gap-4 items-center flex-wrap">
                            <div className="text-base text-gray-500 font-medium">
                                Current seats: {state.campaign.seats.length}/8
                            </div>
                            <select
                                id="additional-seat-count"
                                className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base font-medium bg-white min-w-[200px]"
                                disabled={state.campaign.seats.length >= 8}
                            >
                                <option value="">Select number to add...</option>
                                {Array.from(
                                    { length: Math.min(4, 8 - state.campaign.seats.length) },
                                    (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            Add {i + 1} seat{i + 1 > 1 ? "s" : ""}
                                        </option>
                                    ),
                                )}
                            </select>
                            <button
                                onClick={async () => {
                                    const additionalSeatCount = parseInt(
                                        (
                                            document.getElementById(
                                                "additional-seat-count",
                                            ) as HTMLSelectElement
                                        )?.value,
                                    );

                                    if (!additionalSeatCount) {
                                        alert("Please select how many seats to add");
                                        return;
                                    }

                                    try {
                                        const response = await fetch(
                                            `http://localhost:13333/campaigns/${state.campaign?.id}/seats/add`,
                                            {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    ...(token
                                                        ? { Authorization: `Bearer ${token}` }
                                                        : {}),
                                                },
                                                body: JSON.stringify({ additionalSeatCount }),
                                            },
                                        );

                                        if (response.ok) {
                                            // Refresh the campaign data
                                            const campaigns = await fetch(
                                                "http://localhost:13333/campaigns",
                                            ).then((r) => r.json());
                                            const campaign = campaigns.find(
                                                (c: CampaignConfig) => c.id === params.campaignId,
                                            );
                                            setState((s) => ({ ...s, campaign }));

                                            // Clear the selection
                                            (
                                                document.getElementById(
                                                    "additional-seat-count",
                                                ) as HTMLSelectElement
                                            ).value = "";

                                            alert(
                                                `Successfully added ${additionalSeatCount} seat${additionalSeatCount > 1 ? "s" : ""} to the campaign!`,
                                            );
                                        } else {
                                            const error = await response.json();
                                            alert(`Failed to add seats: ${error.error}`);
                                        }
                                    } catch (error) {
                                        alert("Error adding seats. Please try again.");
                                    }
                                }}
                                style={{
                                    padding: "12px 24px",
                                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    transition: "all 0.2s ease",
                                }}
                                disabled={state.campaign.seats.length >= 8}
                                onMouseEnter={(e) => {
                                    if (state.campaign && state.campaign.seats.length < 8) {
                                        e.currentTarget.style.transform = "translateY(-1px)";
                                        e.currentTarget.style.boxShadow =
                                            "0 5px 15px rgba(245, 158, 11, 0.3)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                ➕ Add Seats
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                            {state.campaign.seats.length >= 8
                                ? "🚫 Maximum seat limit reached (8 seats including GM)."
                                : "💡 Add more empty seats that can be assigned to players later."}
                        </p>
                    </Card>
                )}

                {/* Seats Grid */}
                <Card className="mb-8">
                    <h3 className="mt-0 mb-6 text-xl font-semibold text-gray-700 flex items-center gap-2">
                        🪑 Campaign Seats
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {state.campaign.seats.map((seat) => {
                            const isCurrentPlayerSeat =
                                seat.humanPlayerId === state.currentUser?.id;
                            const canManageSeat = state.isGM || isCurrentPlayerSeat;
                            const isGMSeat = seat.role === "gm";

                            return (
                                <div
                                    key={seat.seatId}
                                    style={{
                                        border: isCurrentPlayerSeat
                                            ? "3px solid #10b981"
                                            : isGMSeat
                                              ? "3px solid #f59e0b"
                                              : "2px solid #e5e7eb",
                                        borderRadius: "12px",
                                        padding: "1.5rem",
                                        backgroundColor: isCurrentPlayerSeat
                                            ? "rgba(16, 185, 129, 0.05)"
                                            : isGMSeat
                                              ? "rgba(245, 158, 11, 0.05)"
                                              : "#ffffff",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    {/* Seat Header */}
                                    <div style={{ marginBottom: "1rem" }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: "0.5rem",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "1.2rem",
                                                    fontWeight: "700",
                                                    color: "#374151",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                {isGMSeat ? "🛡️" : "🎭"} Seat {seat.seatId}
                                            </div>
                                            <div
                                                style={{
                                                    padding: "0.25rem 0.75rem",
                                                    borderRadius: "20px",
                                                    fontSize: "0.8rem",
                                                    fontWeight: "600",
                                                    textTransform: "uppercase",
                                                    backgroundColor: isGMSeat
                                                        ? "rgba(245, 158, 11, 0.2)"
                                                        : "rgba(102, 126, 234, 0.2)",
                                                    color: isGMSeat ? "#d97706" : "#667eea",
                                                }}
                                            >
                                                {seat.role}
                                            </div>
                                        </div>

                                        {/* Player Info */}
                                        <div style={{ marginBottom: "0.75rem" }}>
                                            <div
                                                style={{
                                                    fontSize: "0.9rem",
                                                    color: "#6b7280",
                                                    marginBottom: "0.25rem",
                                                }}
                                            >
                                                Player:
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "1rem",
                                                    fontWeight: "600",
                                                    color: "#374151",
                                                }}
                                            >
                                                {seat.humanPlayerId ? (
                                                    <>
                                                        👤 {seat.humanPlayerId}
                                                        {isCurrentPlayerSeat && (
                                                            <span
                                                                style={{
                                                                    color: "#10b981",
                                                                    fontSize: "0.8rem",
                                                                    marginLeft: "0.5rem",
                                                                }}
                                                            >
                                                                (You)
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span style={{ color: "#9ca3af" }}>
                                                        Empty Seat
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Character Info */}
                                        <div style={{ marginBottom: "0.75rem" }}>
                                            <div
                                                style={{
                                                    fontSize: "0.9rem",
                                                    color: "#6b7280",
                                                    marginBottom: "0.25rem",
                                                }}
                                            >
                                                Character:
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "1rem",
                                                    fontWeight: "600",
                                                    color: seat.characterId ? "#374151" : "#9ca3af",
                                                }}
                                            >
                                                {seat.characterId ? "✅ Created" : "❌ Not Created"}
                                            </div>
                                        </div>

                                        {/* AI Status */}
                                        <div style={{ marginBottom: "1rem" }}>
                                            <div
                                                style={{
                                                    fontSize: "0.9rem",
                                                    color: "#6b7280",
                                                    marginBottom: "0.25rem",
                                                }}
                                            >
                                                AI Status:
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "1rem",
                                                    fontWeight: "600",
                                                    color: seat.ai?.enabled ? "#10b981" : "#9ca3af",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                {seat.ai?.enabled ? (
                                                    <>🤖 {seat.ai.modelId || "Enabled"}</>
                                                ) : (
                                                    "🚫 Disabled"
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.75rem",
                                        }}
                                    >
                                        {/* AI Toggle - Only GM can use */}
                                        {state.isGM && (
                                            <button
                                                onClick={() => toggleAI(seat.seatId)}
                                                style={{
                                                    padding: "0.75rem 1rem",
                                                    background: seat.ai?.enabled
                                                        ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                                                        : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    fontSize: "0.9rem",
                                                    fontWeight: "600",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform =
                                                        "translateY(-1px)";
                                                    e.currentTarget.style.boxShadow = seat.ai
                                                        ?.enabled
                                                        ? "0 5px 15px rgba(239, 68, 68, 0.3)"
                                                        : "0 5px 15px rgba(16, 185, 129, 0.3)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform =
                                                        "translateY(0)";
                                                    e.currentTarget.style.boxShadow = "none";
                                                }}
                                            >
                                                {seat.ai?.enabled
                                                    ? "🤖 Disable AI"
                                                    : "🤖 Enable AI"}
                                            </button>
                                        )}

                                        {/* Create Character */}
                                        {!seat.characterId &&
                                            seat.role === "player" &&
                                            (canManageSeat ||
                                                (state.isGM && !seat.humanPlayerId)) && (
                                                <button
                                                    onClick={() =>
                                                        (window.location.href = `/create-character?campaignId=${state.campaign?.id}&seatId=${seat.seatId}`)
                                                    }
                                                    style={{
                                                        padding: "0.75rem 1rem",
                                                        background:
                                                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        fontSize: "0.9rem",
                                                        fontWeight: "600",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s ease",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform =
                                                            "translateY(-1px)";
                                                        e.currentTarget.style.boxShadow =
                                                            "0 5px 15px rgba(16, 185, 129, 0.3)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform =
                                                            "translateY(0)";
                                                        e.currentTarget.style.boxShadow = "none";
                                                    }}
                                                >
                                                    ✨{" "}
                                                    {seat.humanPlayerId
                                                        ? "Create Character"
                                                        : "Create Character (Empty Seat)"}
                                                </button>
                                            )}

                                        {/* View Character */}
                                        {seat.characterId && (
                                            <button
                                                onClick={() =>
                                                    (window.location.href = `/character/${seat.characterId}?returnTo=seat&campaignId=${state.campaign?.id}`)
                                                }
                                                style={{
                                                    padding: "0.75rem 1rem",
                                                    background:
                                                        "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    fontSize: "0.9rem",
                                                    fontWeight: "600",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform =
                                                        "translateY(-1px)";
                                                    e.currentTarget.style.boxShadow =
                                                        "0 5px 15px rgba(59, 130, 246, 0.3)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform =
                                                        "translateY(0)";
                                                    e.currentTarget.style.boxShadow = "none";
                                                }}
                                            >
                                                👁️ View Character
                                            </button>
                                        )}

                                        {/* Remove Player - Only GM can remove players (not themselves) */}
                                        {state.isGM &&
                                            seat.humanPlayerId &&
                                            seat.role === "player" &&
                                            seat.humanPlayerId !== state.currentUser?.id && (
                                                <button
                                                    onClick={() =>
                                                        removePlayer(seat.humanPlayerId!)
                                                    }
                                                    style={{
                                                        padding: "0.75rem 1rem",
                                                        background:
                                                            "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        fontSize: "0.9rem",
                                                        fontWeight: "600",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s ease",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform =
                                                            "translateY(-1px)";
                                                        e.currentTarget.style.boxShadow =
                                                            "0 5px 15px rgba(239, 68, 68, 0.3)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform =
                                                            "translateY(0)";
                                                        e.currentTarget.style.boxShadow = "none";
                                                    }}
                                                >
                                                    🗑️ Remove Player
                                                </button>
                                            )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* All Characters Section */}
                <Card>
                    <h3 className="mt-0 mb-4 text-xl font-semibold text-gray-700 flex items-center gap-2">
                        🎭 All Campaign Characters
                    </h3>
                    <p className="text-gray-500 text-base mb-6 leading-relaxed">
                        {state.isGM
                            ? "🛡️ As GM, you can view and edit all characters."
                            : "👁️ You can view all characters but can only edit your own."}
                    </p>

                    {state.campaign.seats.filter((seat) => seat.characterId).length === 0 ? (
                        <div className="text-center p-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <div className="text-5xl mb-4">🎭</div>
                            <h4 className="m-0 mb-2 text-gray-500">No Characters Created Yet</h4>
                            <p className="m-0">
                                Create characters for your seats to get started with the campaign!
                            </p>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gap: "1.5rem",
                                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                            }}
                        >
                            {state.campaign.seats
                                .filter((seat) => seat.characterId)
                                .map((seat) => (
                                    <div
                                        key={seat.characterId}
                                        style={{
                                            border:
                                                seat.humanPlayerId === state.currentUser?.id
                                                    ? "3px solid #10b981"
                                                    : "2px solid #e5e7eb",
                                            borderRadius: "12px",
                                            padding: "1.5rem",
                                            backgroundColor:
                                                seat.humanPlayerId === state.currentUser?.id
                                                    ? "rgba(16, 185, 129, 0.05)"
                                                    : "#ffffff",
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: "700",
                                                fontSize: "1.1rem",
                                                marginBottom: "0.75rem",
                                                color: "#374151",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                            }}
                                        >
                                            🎭 Seat {seat.seatId} Character
                                        </div>

                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#6b7280",
                                                marginBottom: "1rem",
                                                lineHeight: "1.5",
                                            }}
                                        >
                                            <div style={{ marginBottom: "0.25rem" }}>
                                                <strong>Player:</strong>{" "}
                                                {seat.humanPlayerId ? (
                                                    <>
                                                        👤 {seat.humanPlayerId}
                                                        {seat.humanPlayerId ===
                                                            state.currentUser?.id && (
                                                            <span style={{ color: "#10b981" }}>
                                                                {" "}
                                                                (Your character)
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    "🤖 AI"
                                                )}
                                            </div>
                                            <div>
                                                <strong>Role:</strong>{" "}
                                                <span
                                                    style={{
                                                        textTransform: "capitalize",
                                                        color: "#374151",
                                                        fontWeight: "500",
                                                    }}
                                                >
                                                    {seat.role}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() =>
                                                (window.location.href = `/character/${seat.characterId}?returnTo=seat&campaignId=${state.campaign?.id}`)
                                            }
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                                color: "white",
                                                border: "none",
                                                padding: "0.75rem 1rem",
                                                borderRadius: "8px",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                width: "100%",
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
                                            👁️ View Character Details
                                        </button>
                                    </div>
                                ))}
                        </div>
                    )}
                </Card>
            </ContentWrapper>
        </PageContainer>
    );
}
