"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateCampaignPage() {
    const [name, setName] = useState("New Adventure");
    const [description, setDescription] = useState("");
    const [isPrivate, setIsPrivate] = useState(true);
    const [gmIsHuman, setGmIsHuman] = useState(true);
    const [gmAIModelId, setGmAIModelId] = useState("openai:gpt-4o-mini");
    const [seatCount, setSeatCount] = useState(4);
    const [creatorDisplayName, setCreatorDisplayName] = useState("GM");
    const [aiEnabledDefault, setAiEnabledDefault] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
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
        setLoading(true);
        const token = localStorage.getItem("authToken");

        try {
            const res = await fetch("http://localhost:13333/campaigns", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    description: description.trim() || undefined,
                    isPrivate,
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
        } catch (error) {
            setResult({ error: "Network error occurred" });
        } finally {
            setLoading(false);
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

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "20px",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
        >
            <div
                style={{
                    maxWidth: "600px",
                    margin: "0 auto",
                    paddingTop: "40px",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "40px",
                    }}
                >
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
                        🎲 Create Campaign
                    </h1>
                    <p
                        style={{
                            color: "rgba(255, 255, 255, 0.9)",
                            fontSize: "18px",
                            margin: "0",
                            fontWeight: "300",
                        }}
                    >
                        Start your new D&D adventure with AI assistance
                    </p>
                </div>

                {/* Main Form Card */}
                <div
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "20px",
                        padding: "40px",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    <form
                        onSubmit={submit}
                        style={{ display: "flex", flexDirection: "column", gap: "24px" }}
                    >
                        {/* Campaign Name */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontWeight: "600",
                                    fontSize: "16px",
                                    color: "#374151",
                                    marginBottom: "8px",
                                }}
                            >
                                Campaign Name
                            </label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "14px 16px",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "12px",
                                    fontSize: "16px",
                                    transition: "all 0.3s ease",
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

                        {/* Campaign Description */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontWeight: "600",
                                    fontSize: "16px",
                                    color: "#374151",
                                    marginBottom: "8px",
                                }}
                            >
                                Description (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of your campaign..."
                                rows={3}
                                style={{
                                    width: "100%",
                                    padding: "14px 16px",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "12px",
                                    fontSize: "16px",
                                    transition: "all 0.3s ease",
                                    outline: "none",
                                    resize: "vertical",
                                    fontFamily: "inherit",
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

                        {/* Privacy Setting */}
                        <div
                            style={{
                                padding: "20px",
                                backgroundColor: "#f8fafc",
                                borderRadius: "12px",
                                border: "2px solid #e2e8f0",
                            }}
                        >
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={(e) => setIsPrivate(e.target.checked)}
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                        marginRight: "12px",
                                        accentColor: "#667eea",
                                    }}
                                />
                                🔒 Private Campaign
                            </label>
                            <p
                                style={{
                                    margin: "8px 0 0 32px",
                                    fontSize: "14px",
                                    color: "#6b7280",
                                }}
                            >
                                {isPrivate
                                    ? "Only players with the room code can join"
                                    : "Campaign will be visible in the public browser"}
                            </p>
                        </div>

                        {/* Creator Display Name */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontWeight: "600",
                                    fontSize: "16px",
                                    color: "#374151",
                                    marginBottom: "8px",
                                }}
                            >
                                Your Display Name
                            </label>
                            <input
                                value={creatorDisplayName}
                                onChange={(e) => setCreatorDisplayName(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "14px 16px",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "12px",
                                    fontSize: "16px",
                                    transition: "all 0.3s ease",
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

                        {/* GM Type */}
                        <div
                            style={{
                                padding: "20px",
                                backgroundColor: "#f8fafc",
                                borderRadius: "12px",
                                border: "2px solid #e2e8f0",
                            }}
                        >
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    marginBottom: "12px",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={gmIsHuman}
                                    onChange={(e) => setGmIsHuman(e.target.checked)}
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                        marginRight: "12px",
                                        accentColor: "#667eea",
                                    }}
                                />
                                🎭 Human Game Master
                            </label>

                            {!gmIsHuman && (
                                <div style={{ marginLeft: "32px" }}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontWeight: "500",
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        AI Model
                                    </label>
                                    <input
                                        value={gmAIModelId}
                                        onChange={(e) => setGmAIModelId(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "8px",
                                            fontSize: "14px",
                                            outline: "none",
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Seat Count */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontWeight: "600",
                                    fontSize: "16px",
                                    color: "#374151",
                                    marginBottom: "8px",
                                }}
                            >
                                Number of Player Seats
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={8}
                                value={seatCount}
                                onChange={(e) => setSeatCount(Number(e.target.value))}
                                style={{
                                    width: "100%",
                                    padding: "14px 16px",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "12px",
                                    fontSize: "16px",
                                    transition: "all 0.3s ease",
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
                            <p
                                style={{
                                    margin: "6px 0 0 0",
                                    fontSize: "14px",
                                    color: "#6b7280",
                                }}
                            >
                                You can add more seats later (max 8 total including GM)
                            </p>
                        </div>

                        {/* AI Default */}
                        <div
                            style={{
                                padding: "20px",
                                backgroundColor: "#f8fafc",
                                borderRadius: "12px",
                                border: "2px solid #e2e8f0",
                            }}
                        >
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={aiEnabledDefault}
                                    onChange={(e) => setAiEnabledDefault(e.target.checked)}
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                        marginRight: "12px",
                                        accentColor: "#667eea",
                                    }}
                                />
                                🤖 Enable AI for empty seats by default
                            </label>
                            <p
                                style={{
                                    margin: "8px 0 0 32px",
                                    fontSize: "14px",
                                    color: "#6b7280",
                                }}
                            >
                                Empty seats will have AI assistance enabled when created
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "white",
                                border: "none",
                                padding: "16px 32px",
                                borderRadius: "12px",
                                fontSize: "18px",
                                fontWeight: "600",
                                cursor: loading ? "not-allowed" : "pointer",
                                transition: "all 0.3s ease",
                                opacity: loading ? 0.7 : 1,
                                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow =
                                        "0 8px 24px rgba(102, 126, 234, 0.5)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow =
                                        "0 4px 12px rgba(102, 126, 234, 0.4)";
                                }
                            }}
                        >
                            {loading ? "Creating Campaign..." : "🚀 Create Campaign"}
                        </button>
                    </form>

                    {/* Result Display */}
                    {result && (
                        <div style={{ marginTop: "32px" }}>
                            {result.error ? (
                                <div
                                    style={{
                                        backgroundColor: "#fef2f2",
                                        color: "#dc2626",
                                        border: "2px solid #fecaca",
                                        borderRadius: "12px",
                                        padding: "20px",
                                    }}
                                >
                                    <h3
                                        style={{
                                            margin: "0 0 8px 0",
                                            fontSize: "18px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        ❌ Error
                                    </h3>
                                    <p style={{ margin: "0", fontSize: "16px" }}>{result.error}</p>
                                </div>
                            ) : result.campaign ? (
                                <div
                                    style={{
                                        backgroundColor: "#ecfdf5",
                                        color: "#065f46",
                                        border: "2px solid #a7f3d0",
                                        borderRadius: "12px",
                                        padding: "20px",
                                    }}
                                >
                                    <h3
                                        style={{
                                            margin: "0 0 16px 0",
                                            fontSize: "20px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        ✅ Campaign Created Successfully!
                                    </h3>
                                    <div style={{ marginBottom: "12px" }}>
                                        <strong>Campaign:</strong> {result.campaign.name}
                                    </div>
                                    <div style={{ marginBottom: "12px" }}>
                                        <strong>Room Code:</strong>
                                        <span
                                            style={{
                                                backgroundColor: "#10b981",
                                                color: "white",
                                                padding: "4px 12px",
                                                borderRadius: "6px",
                                                marginLeft: "8px",
                                                fontFamily: "monospace",
                                                fontSize: "16px",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {result.campaign.roomCode}
                                        </span>
                                    </div>
                                    <div style={{ marginBottom: "16px" }}>
                                        <strong>Your Role:</strong> Game Master 🎲
                                    </div>
                                    <p
                                        style={{
                                            margin: "0",
                                            fontSize: "14px",
                                            fontStyle: "italic",
                                            opacity: 0.8,
                                        }}
                                    >
                                        Redirecting to seat management...
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
