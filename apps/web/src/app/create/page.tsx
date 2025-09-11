"use client";
import { useState } from "react";

export default function CreateCampaignPage() {
    const [name, setName] = useState("New Adventure");
    const [gmIsHuman, setGmIsHuman] = useState(true);
    const [gmAIModelId, setGmAIModelId] = useState("openai:gpt-4o-mini");
    const [seatCount, setSeatCount] = useState(4);
    const [creatorDisplayName, setCreatorDisplayName] = useState("GM");
    const [aiEnabledDefault, setAiEnabledDefault] = useState(false);
    const [result, setResult] = useState<any>(null);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch("http://localhost:13333/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                gmIsHuman,
                gmAIModelId: gmIsHuman ? undefined : gmAIModelId,
                seatCount,
                creatorDisplayName,
                aiEnabledDefault,
            }),
        });
        setResult(await res.json());
    }

    return (
        <main style={{ padding: 24 }}>
            <h2>Create Campaign</h2>
            <form
                onSubmit={submit}
                style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 400 }}
            >
                <label>
                    Name <input value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label>
                    Creator Display Name{" "}
                    <input
                        value={creatorDisplayName}
                        onChange={(e) => setCreatorDisplayName(e.target.value)}
                    />
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={gmIsHuman}
                        onChange={(e) => setGmIsHuman(e.target.checked)}
                    />{" "}
                    GM is Human
                </label>
                {!gmIsHuman && (
                    <label>
                        GM AI Model Id{" "}
                        <input
                            value={gmAIModelId}
                            onChange={(e) => setGmAIModelId(e.target.value)}
                        />
                    </label>
                )}
                <label>
                    Player Seat Count{" "}
                    <input
                        type="number"
                        min={1}
                        max={8}
                        value={seatCount}
                        onChange={(e) => setSeatCount(Number(e.target.value))}
                    />
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={aiEnabledDefault}
                        onChange={(e) => setAiEnabledDefault(e.target.checked)}
                    />{" "}
                    AI enabled by default for empty seats
                </label>
                <button type="submit">Create</button>
            </form>
            {result && (
                <pre style={{ marginTop: 24, background: "#111", color: "#0f0", padding: 12 }}>
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </main>
    );
}
