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
                        "Authorization": `Bearer ${token}`,
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
                    <div className="flex flex-col gap-4 items-end">
                        <Button
                            onClick={() => router.back()}
                            variant="secondary"
                            className="hover:transform hover:-translate-y-1"
                        >
                            ← Back
                        </Button>
                        <Button
                            onClick={() => router.push(`/gameplay/${params.campaignId}`)}
                            variant="primary"
                            className="hover:transform hover:-translate-y-1"
                        >
                            🎮 Go to Gameplay
                        </Button>
                    </div>
                </div>

                {/* GM Section - Visible to All */}
                {state.campaign && (
                    <Card className="mb-8 border-2 border-purple-300 bg-purple-50">
                        <h3 className="mt-0 mb-4 text-xl font-semibold text-purple-800 flex items-center gap-2">
                            👑 Game Master
                        </h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center text-2xl">
                                    👑
                                </div>
                                <div>
                                    <div className="text-lg font-semibold text-purple-900">
                                        {state.campaign.createdBy || "Unknown GM"}
                                    </div>
                                    <div className="text-sm text-purple-700">
                                        Campaign Creator & Game Master
                                    </div>
                                </div>
                            </div>

                            {/* GM Reassignment - Only visible to current GM */}
                            {state.isGM &&
                                state.campaign.seats.filter(
                                    (s) => s.role === "player" && s.humanPlayerId,
                                ).length > 0 && (
                                    <div className="border-t border-purple-200 pt-4">
                                        <div className="text-sm font-medium text-purple-800 mb-2">
                                            Transfer GM Role:
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {state.campaign.seats
                                                .filter(
                                                    (s) => s.role === "player" && s.humanPlayerId,
                                                )
                                                .map((seat) => (
                                                    <button
                                                        key={seat.seatId}
                                                        onClick={async () => {
                                                            if (
                                                                confirm(
                                                                    `Are you sure you want to transfer GM role to ${seat.humanPlayerId}? You will become a regular player.`,
                                                                )
                                                            ) {
                                                                try {
                                                                    const response = await fetch(
                                                                        `http://localhost:13333/campaigns/${params.campaignId}/transfer-gm`,
                                                                        {
                                                                            method: "POST",
                                                                            headers: {
                                                                                "Content-Type":
                                                                                    "application/json",
                                                                                "Authorization": `Bearer ${token}`,
                                                                            },
                                                                            body: JSON.stringify({
                                                                                newGmId:
                                                                                    seat.humanPlayerId,
                                                                            }),
                                                                        },
                                                                    );

                                                                    if (response.ok) {
                                                                        alert(
                                                                            "GM role transferred successfully!",
                                                                        );
                                                                        window.location.reload();
                                                                    } else {
                                                                        alert(
                                                                            "Failed to transfer GM role",
                                                                        );
                                                                    }
                                                                } catch (error) {
                                                                    alert(
                                                                        "Error transferring GM role",
                                                                    );
                                                                }
                                                            }
                                                        }}
                                                        className="px-3 py-2 bg-purple-200 hover:bg-purple-300 text-purple-800 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Transfer to {seat.humanPlayerId}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                    </Card>
                )}

                {/* Add Seats Section - GM Only */}
                {state.isGM && (
                    <Card className="mb-8 border-2 border-yellow-300">
                        <h3 className="mt-0 mb-4 text-xl font-semibold text-gray-700 flex items-center gap-2">
                            ➕ Add More Seats
                        </h3>
                        <div className="flex gap-4 items-center flex-wrap">
                            <div className="text-base text-gray-500 font-medium">
                                Current player seats:{" "}
                                {state.campaign.seats.filter((s) => s.role !== "gm").length}/8
                            </div>
                            <select
                                id="additional-seat-count"
                                className="px-4 py-3 border-2 border-gray-200 rounded-lg text-base font-medium bg-white min-w-[200px]"
                                disabled={
                                    state.campaign.seats.filter((s) => s.role !== "gm").length >= 8
                                }
                            >
                                <option value="">Select number to add...</option>
                                {Array.from(
                                    {
                                        length: Math.min(
                                            4,
                                            8 -
                                                state.campaign.seats.filter((s) => s.role !== "gm")
                                                    .length,
                                        ),
                                    },
                                    (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            Add {i + 1} player seat{i + 1 > 1 ? "s" : ""}
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
                                className={`px-6 py-3 bg-gradient-to-br from-amber-500 to-amber-600 text-white border-none rounded-lg cursor-pointer text-base font-semibold transition-all duration-200 ${
                                    state.campaign.seats.filter((s) => s.role !== "gm").length < 8
                                        ? "hover:-translate-y-px hover:shadow-lg hover:shadow-amber-500/30"
                                        : "opacity-50 cursor-not-allowed"
                                }`}
                                disabled={
                                    state.campaign.seats.filter((s) => s.role !== "gm").length >= 8
                                }
                            >
                                ➕ Add Seats
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                            {state.campaign.seats.filter((s) => s.role !== "gm").length >= 8
                                ? "🚫 Maximum seat limit reached (8 player seats)."
                                : "💡 Add more empty seats that can be assigned to players later."}
                        </p>
                    </Card>
                )}

                {/* Seats Grid */}
                <Card className="mb-8">
                    <h3 className="mt-0 mb-6 text-2xl font-bold text-white flex items-center gap-2">
                        🪑 Player Seats
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {state.campaign.seats
                            .filter((seat) => seat.role !== "gm") // Don't show GM seats - GM manages from outside
                            .map((seat) => {
                                const isCurrentPlayerSeat =
                                    seat.humanPlayerId === state.currentUser?.id;
                                const canManageSeat = state.isGM || isCurrentPlayerSeat;

                                return (
                                    <div
                                        key={seat.seatId}
                                        className={`rounded-xl p-6 transition-all duration-200 ${
                                            isCurrentPlayerSeat
                                                ? "border-2 border-blue-400 bg-blue-100"
                                                : "border-2 border-gray-200 bg-green-50"
                                        }`}
                                    >
                                        {/* Seat Header */}
                                        <div className="mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="text-xl font-bold text-gray-700 flex items-center gap-2">
                                                    🎭 Seat {seat.seatId}
                                                    {isCurrentPlayerSeat && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                                            YOUR SEAT
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-indigo-100 text-indigo-600">
                                                    {seat.role}
                                                </div>
                                            </div>

                                            {/* Player Info */}
                                            <div className="mb-3">
                                                <div className="text-sm text-gray-500 mb-1">
                                                    Player:
                                                </div>
                                                <div className="text-base font-semibold text-gray-700">
                                                    {seat.humanPlayerId ? (
                                                        <>
                                                            👤 {seat.humanPlayerId}
                                                            {isCurrentPlayerSeat && (
                                                                <span className="text-green-600 text-xs ml-2">
                                                                    (You)
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            Empty Seat
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Character Info */}
                                            <div className="mb-3">
                                                <div className="text-sm text-gray-500 mb-1">
                                                    Character:
                                                </div>
                                                <div
                                                    className={`text-base font-semibold ${seat.characterId ? "text-gray-700" : "text-gray-400"}`}
                                                >
                                                    {seat.characterId
                                                        ? "✅ Created"
                                                        : "❌ Not Created"}
                                                </div>
                                            </div>

                                            {/* AI Status */}
                                            <div className="mb-4">
                                                <div className="text-sm text-gray-500 mb-1">
                                                    AI Status:
                                                </div>
                                                <div
                                                    className={`text-base font-semibold flex items-center gap-2 ${seat.ai?.enabled ? "text-green-600" : "text-gray-400"}`}
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
                                        <div className="flex flex-col gap-3">
                                            {/* AI Toggle - Only GM can use */}
                                            {state.isGM && (
                                                <button
                                                    onClick={() => toggleAI(seat.seatId)}
                                                    className={`px-4 py-3 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px ${
                                                        seat.ai?.enabled
                                                            ? "bg-gradient-to-br from-red-500 to-red-600 hover:shadow-lg hover:shadow-red-500/30"
                                                            : "bg-gradient-to-br from-green-500 to-green-600 hover:shadow-lg hover:shadow-green-500/30"
                                                    }`}
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
                                                        className="px-4 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-green-500/30"
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
                                                    className="px-4 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-blue-500/30"
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
                                                        className="px-4 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-red-500/30"
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
                    <h3 className="mt-0 mb-4 text-2xl font-bold text-white flex items-center gap-2">
                        🎭 Player Characters
                    </h3>
                    <p className="text-gray-100 text-base mb-6 leading-relaxed font-medium">
                        {state.isGM
                            ? "🛡️ As GM, you can view and edit all characters."
                            : "👁️ You can view all characters but can only edit your own."}
                    </p>

                    {state.campaign.seats.filter((seat) => seat.characterId && seat.role !== "gm")
                        .length === 0 ? (
                        <div className="text-center p-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <div className="text-5xl mb-4">🎭</div>
                            <h4 className="m-0 mb-2 text-gray-500">No Characters Created Yet</h4>
                            <p className="m-0">
                                Create characters for your seats to get started with the campaign!
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
                            {state.campaign.seats
                                .filter((seat) => seat.characterId && seat.role !== "gm")
                                .map((seat) => (
                                    <div
                                        key={seat.characterId}
                                        className={`rounded-xl p-6 transition-all duration-200 ${
                                            seat.humanPlayerId === state.currentUser?.id
                                                ? "border-2 border-blue-400 bg-blue-100"
                                                : "border-2 border-gray-200 bg-white"
                                        }`}
                                    >
                                        <div className="font-bold text-lg mb-3 text-gray-700 flex items-center gap-2">
                                            🎭 Seat {seat.seatId} Character
                                            {seat.humanPlayerId === state.currentUser?.id && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                                    YOUR CHARACTER
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-sm text-gray-500 mb-4 leading-relaxed">
                                            <div className="mb-1">
                                                <strong>Player:</strong>{" "}
                                                {seat.humanPlayerId && !seat.ai?.enabled ? (
                                                    <>
                                                        👤 {seat.humanPlayerId}
                                                        {seat.humanPlayerId ===
                                                            state.currentUser?.id && (
                                                            <span className="text-green-600">
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
                                                <span className="capitalize text-gray-700 font-medium">
                                                    {seat.role}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() =>
                                                (window.location.href = `/character/${seat.characterId}?returnTo=seat&campaignId=${state.campaign?.id}`)
                                            }
                                            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none p-3 rounded-lg text-sm font-semibold cursor-pointer w-full transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-blue-500/30"
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
