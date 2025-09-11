"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AIModelMeta, CampaignConfig } from "@dnd-ai/types";

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

    if (state.loading) return <main style={{ padding: 24 }}>Loading...</main>;
    if (!state.campaign) return <main style={{ padding: 24 }}>Campaign not found.</main>;

    return (
        <main style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 14,
                    }}
                >
                    ← Back
                </button>
                <h2 style={{ margin: 0 }}>Seat Management</h2>
            </div>
            <p>
                <strong>Campaign:</strong> {state.campaign.name} | <strong>Room Code:</strong>{" "}
                {state.campaign.roomCode}
            </p>
            {state.isGM && (
                <p style={{ color: "#28a745", fontWeight: "bold" }}>
                    🛡️ GM Access - You can manage AI settings and all characters
                </p>
            )}

            {/* Add Seats Section - GM Only */}
            {state.isGM && (
                <div
                    style={{
                        marginBottom: 20,
                        padding: 16,
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffeaa7",
                        borderRadius: 8,
                    }}
                >
                    <h3 style={{ marginTop: 0, marginBottom: 12 }}>Add More Seats</h3>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 14 }}>
                            Current seats: {state.campaign.seats.length}/8
                        </span>
                        <select
                            id="additional-seat-count"
                            style={{
                                padding: "8px 12px",
                                border: "1px solid #ccc",
                                borderRadius: 4,
                                fontSize: 14,
                            }}
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
                                backgroundColor: "#fd7e14",
                                color: "white",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontSize: 14,
                            }}
                            disabled={state.campaign.seats.length >= 8}
                        >
                            Add Seats
                        </button>
                    </div>
                    <p style={{ fontSize: 12, color: "#666", margin: "8px 0 0 0" }}>
                        {state.campaign.seats.length >= 8
                            ? "Maximum seat limit reached (8 seats including GM)."
                            : "Add more empty seats that can be assigned to players later."}
                    </p>
                </div>
            )}

            <table style={{ borderCollapse: "collapse", width: "100%", marginTop: 16 }}>
                <thead>
                    <tr>
                        <th style={{ border: "1px solid #555", padding: 8 }}>Seat</th>
                        <th style={{ border: "1px solid #555", padding: 8 }}>Role</th>
                        <th style={{ border: "1px solid #555", padding: 8 }}>Player</th>
                        <th style={{ border: "1px solid #555", padding: 8 }}>Character</th>
                        <th style={{ border: "1px solid #555", padding: 8 }}>AI Status</th>
                        <th style={{ border: "1px solid #555", padding: 8 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {state.campaign.seats.map((seat) => {
                        const isCurrentPlayerSeat = seat.humanPlayerId === state.currentUser?.id;
                        const canManageSeat = state.isGM || isCurrentPlayerSeat;

                        return (
                            <tr key={seat.seatId}>
                                <td style={{ border: "1px solid #555", padding: 8 }}>
                                    {seat.seatId}
                                </td>
                                <td style={{ border: "1px solid #555", padding: 8 }}>
                                    {seat.role}
                                </td>
                                <td style={{ border: "1px solid #555", padding: 8 }}>
                                    {seat.humanPlayerId || "-"}
                                    {isCurrentPlayerSeat && (
                                        <span style={{ color: "#007bff", fontSize: "12px" }}>
                                            {" "}
                                            (You)
                                        </span>
                                    )}
                                </td>
                                <td style={{ border: "1px solid #555", padding: 8 }}>
                                    {seat.characterId ? "Created" : "-"}
                                </td>
                                <td style={{ border: "1px solid #555", padding: 8 }}>
                                    {seat.ai?.enabled ? seat.ai.modelId || "Enabled" : "Off"}
                                </td>
                                <td style={{ border: "1px solid #555", padding: 8 }}>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        {/* AI Toggle - Only GM can use */}
                                        {state.isGM && (
                                            <button
                                                onClick={() => toggleAI(seat.seatId)}
                                                style={{
                                                    backgroundColor: seat.ai?.enabled
                                                        ? "#dc3545"
                                                        : "#28a745",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "4px 8px",
                                                    borderRadius: 4,
                                                    fontSize: 12,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {seat.ai?.enabled ? "Disable AI" : "Enable AI"}
                                            </button>
                                        )}

                                        {/* Create Character - GM can create for anyone, players only for themselves */}
                                        {!seat.characterId &&
                                            seat.role === "player" &&
                                            (canManageSeat ||
                                                (state.isGM && !seat.humanPlayerId)) && (
                                                <button
                                                    onClick={() =>
                                                        (window.location.href = `/create-character?campaignId=${state.campaign?.id}&seatId=${seat.seatId}`)
                                                    }
                                                    style={{
                                                        backgroundColor: "#28a745",
                                                        color: "white",
                                                        border: "none",
                                                        padding: "4px 8px",
                                                        borderRadius: 4,
                                                        fontSize: 12,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {seat.humanPlayerId
                                                        ? "Create Character"
                                                        : "Create Character (Empty Seat)"}
                                                </button>
                                            )}

                                        {/* View Character - Everyone can view all characters */}
                                        {seat.characterId && (
                                            <button
                                                onClick={() =>
                                                    (window.location.href = `/character/${seat.characterId}?returnTo=seat&campaignId=${state.campaign?.id}`)
                                                }
                                                style={{
                                                    backgroundColor: "#007bff",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "4px 8px",
                                                    borderRadius: 4,
                                                    fontSize: 12,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                View Character
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
                                                        backgroundColor: "#dc3545",
                                                        color: "white",
                                                        border: "none",
                                                        padding: "4px 8px",
                                                        borderRadius: 4,
                                                        fontSize: 12,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Remove Player
                                                </button>
                                            )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* All Characters Section */}
            <div style={{ marginTop: 32 }}>
                <h3>All Campaign Characters</h3>
                <p style={{ color: "#666", fontSize: "14px" }}>
                    {state.isGM
                        ? "As GM, you can view and edit all characters."
                        : "You can view all characters but can only edit your own."}
                </p>
                <div
                    style={{
                        display: "grid",
                        gap: 16,
                        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                    }}
                >
                    {state.campaign.seats
                        .filter((seat) => seat.characterId)
                        .map((seat) => (
                            <div
                                key={seat.characterId}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: 8,
                                    padding: 16,
                                    backgroundColor: "#f9f9f9",
                                }}
                            >
                                <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                                    {seat.seatId} Character
                                </div>
                                <div style={{ fontSize: "14px", color: "#666", marginBottom: 12 }}>
                                    Player: {seat.humanPlayerId || "AI"}
                                    {seat.humanPlayerId === state.currentUser?.id && (
                                        <span style={{ color: "#007bff" }}> (Your character)</span>
                                    )}
                                </div>
                                <button
                                    onClick={() =>
                                        (window.location.href = `/character/${seat.characterId}?returnTo=seat&campaignId=${state.campaign?.id}`)
                                    }
                                    style={{
                                        backgroundColor: "#007bff",
                                        color: "white",
                                        border: "none",
                                        padding: "8px 16px",
                                        borderRadius: 4,
                                        fontSize: 14,
                                        cursor: "pointer",
                                        width: "100%",
                                    }}
                                >
                                    View Character
                                </button>
                            </div>
                        ))}
                </div>
                {state.campaign.seats.filter((seat) => seat.characterId).length === 0 && (
                    <p style={{ color: "#666", fontStyle: "italic" }}>No characters created yet.</p>
                )}
            </div>
        </main>
    );
}
