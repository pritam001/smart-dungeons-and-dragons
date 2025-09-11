"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateCampaignPage() {
    const [name, setName] = useState("New Adventure");
    const [gmIsHuman, setGmIsHuman] = useState(true);
    const [gmAIModelId, setGmAIModelId] = useState("openai:gpt-4o-mini");
    const [seatCount, setSeatCount] = useState(4);
    const [creatorDisplayName, setCreatorDisplayName] = useState("GM");
    const [aiEnabledDefault, setAiEnabledDefault] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check authentication
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

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:13333/campaigns", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name,
                gmIsHuman,
                gmAIModelId: gmIsHuman ? undefined : gmAIModelId,
                seatCount,
                creatorDisplayName,
                aiEnabledDefault,
            }),
        });

        const data = await res.json();
        setResult(data);

        // If campaign was created successfully, redirect GM to seat management
        if (res.ok && data.campaign) {
            setTimeout(() => {
                router.push(`/seat/${data.campaign.id}`);
            }, 1500); // Show success message briefly before redirect
        }
    }

    if (!isAuthenticated) {
        return <div>Checking authentication...</div>;
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
                <div style={{ marginTop: 24 }}>
                    {result.error ? (
                        <div
                            style={{
                                backgroundColor: "#f8d7da",
                                color: "#721c24",
                                border: "1px solid #f5c6cb",
                                borderRadius: 4,
                                padding: 16,
                            }}
                        >
                            <strong>Error:</strong> {result.error}
                        </div>
                    ) : result.campaign ? (
                        <div
                            style={{
                                backgroundColor: "#d4edda",
                                color: "#155724",
                                border: "1px solid #c3e6cb",
                                borderRadius: 4,
                                padding: 16,
                            }}
                        >
                            <h3 style={{ margin: "0 0 12px 0" }}>
                                ✅ Campaign Created Successfully!
                            </h3>
                            <p style={{ margin: "0 0 8px 0" }}>
                                <strong>Campaign:</strong> {result.campaign.name}
                            </p>
                            <p style={{ margin: "0 0 8px 0" }}>
                                <strong>Room Code:</strong> {result.campaign.roomCode}
                            </p>
                            <p style={{ margin: "0 0 12px 0" }}>
                                <strong>Your Role:</strong> Game Master 🎲
                            </p>
                            <p style={{ margin: "0", fontSize: "14px", fontStyle: "italic" }}>
                                Redirecting to seat management...
                            </p>
                        </div>
                    ) : (
                        <pre
                            style={{
                                marginTop: 24,
                                background: "#111",
                                color: "#0f0",
                                padding: 12,
                            }}
                        >
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    )}
                </div>
            )}
        </main>
    );
}
