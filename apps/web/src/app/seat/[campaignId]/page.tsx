"use client";
import { useEffect, useState } from "react";
import { AIModelMeta, CampaignConfig } from "@dnd-ai/types";

interface SeatState {
    campaign?: CampaignConfig;
    models: AIModelMeta[];
    loading: boolean;
    error?: string;
}

export default function SeatManagement({ params }: { params: { campaignId: string } }) {
    const [state, setState] = useState<SeatState>({ loading: true, models: [] });
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("authToken");
        if (stored) setToken(stored);
    }, []);

    useEffect(() => {
        async function load() {
            try {
                const campaigns = await fetch("http://localhost:13333/campaigns").then((r) =>
                    r.json(),
                );
                const campaign = campaigns.find((c: CampaignConfig) => c.id === params.campaignId);
                const models = await fetch("http://localhost:13333/models")
                    .then((r) => r.json())
                    .then((d) => d.models as AIModelMeta[]);
                setState({ loading: false, campaign, models });
            } catch (e: any) {
                setState((s) => ({ ...s, loading: false, error: e.message }));
            }
        }
        load();
    }, [params.campaignId]);

    async function toggleAI(seatId: string) {
        if (!state.campaign) return;
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

    if (state.loading) return <main style={{ padding: 24 }}>Loading...</main>;
    if (!state.campaign) return <main style={{ padding: 24 }}>Campaign not found.</main>;

    return (
        <main style={{ padding: 24 }}>
            <h2>Seat Management</h2>
            <p>Room Code: {state.campaign.roomCode}</p>
            <table style={{ borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th style={{ border: "1px solid #555", padding: 4 }}>Seat</th>
                        <th style={{ border: "1px solid #555", padding: 4 }}>Role</th>
                        <th style={{ border: "1px solid #555", padding: 4 }}>Human</th>
                        <th style={{ border: "1px solid #555", padding: 4 }}>AI</th>
                        <th style={{ border: "1px solid #555", padding: 4 }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {state.campaign.seats.map((seat) => {
                        return (
                            <tr key={seat.seatId}>
                                <td style={{ border: "1px solid #555", padding: 4 }}>
                                    {seat.seatId}
                                </td>
                                <td style={{ border: "1px solid #555", padding: 4 }}>
                                    {seat.role}
                                </td>
                                <td style={{ border: "1px solid #555", padding: 4 }}>
                                    {seat.humanPlayerId || "-"}
                                </td>
                                <td style={{ border: "1px solid #555", padding: 4 }}>
                                    {seat.ai?.enabled ? seat.ai.modelId || "Enabled" : "Off"}
                                </td>
                                <td style={{ border: "1px solid #555", padding: 4 }}>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button onClick={() => toggleAI(seat.seatId)}>
                                            Toggle AI
                                        </button>
                                        {seat.humanPlayerId &&
                                            !seat.characterId &&
                                            seat.role === "player" && (
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
                                                    Create Character
                                                </button>
                                            )}
                                        {seat.characterId && (
                                            <button
                                                onClick={() =>
                                                    (window.location.href = `/character/${seat.characterId}`)
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
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </main>
    );
}
