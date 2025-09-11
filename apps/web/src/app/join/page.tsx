"use client";
import { useState } from "react";

export default function JoinCampaignPage() {
    const [roomCode, setRoomCode] = useState("");
    const [playerDisplayName, setPlayerDisplayName] = useState("Player");
    const [result, setResult] = useState<any>(null);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch("http://localhost:13333/campaigns/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomCode, playerDisplayName }),
        });
        setResult(await res.json());
    }

    return (
        <main style={{ padding: 24 }}>
            <h2>Join Campaign</h2>
            <form
                onSubmit={submit}
                style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 400 }}
            >
                <label>
                    Room Code{" "}
                    <input
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    />
                </label>
                <label>
                    Player Name{" "}
                    <input
                        value={playerDisplayName}
                        onChange={(e) => setPlayerDisplayName(e.target.value)}
                    />
                </label>
                <button type="submit">Join</button>
            </form>
            {result && (
                <pre style={{ marginTop: 24, background: "#111", color: "#0ff", padding: 12 }}>
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </main>
    );
}
