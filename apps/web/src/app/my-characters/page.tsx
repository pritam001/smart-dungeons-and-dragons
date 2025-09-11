"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CharacterSheet } from "@dnd-ai/types";

export default function MyCharactersPage() {
    const router = useRouter();
    const [characters, setCharacters] = useState<CharacterSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            router.push("/auth");
            return;
        }

        fetch("http://localhost:13333/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) {
                    setIsAuthenticated(true);
                    loadCharacters();
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

    async function loadCharacters() {
        const token = localStorage.getItem("authToken");
        try {
            const response = await fetch("http://localhost:13333/my-characters", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                setError("Failed to load characters");
                return;
            }

            const data = await response.json();
            setCharacters(data.characters);
        } catch (err) {
            setError("Network error occurred");
        } finally {
            setLoading(false);
        }
    }

    function getModifier(score: number): string {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    }

    function navigateToCharacter(characterId: string) {
        router.push(`/character/${characterId}`);
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
                Loading characters...
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
                            ⚔️ My Characters
                        </h1>
                        <p
                            style={{
                                color: "#64748b",
                                margin: 0,
                                fontSize: "1.1rem",
                            }}
                        >
                            View and manage your character sheets
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <button
                            onClick={() => router.push("/create-character")}
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
                            ✨ Create Character
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

                {/* Error Display */}
                {error && (
                    <div
                        style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "#dc2626",
                            border: "2px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: "12px",
                            padding: "1rem",
                            marginBottom: "2rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <span style={{ fontSize: "20px" }}>❌</span>
                        <div>{error}</div>
                    </div>
                )}

                {/* Characters List */}
                {characters.length === 0 ? (
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
                        <div style={{ fontSize: "64px", marginBottom: "1rem" }}>⚔️</div>
                        <h2
                            style={{
                                fontSize: "28px",
                                fontWeight: "600",
                                margin: "0 0 1rem 0",
                                color: "#374151",
                            }}
                        >
                            No Characters Yet
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
                            Start your adventure by creating your first character! You can create
                            characters to use in campaigns or just for fun.
                        </p>
                        <div
                            style={{
                                display: "flex",
                                gap: "1rem",
                                justifyContent: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                onClick={() => router.push("/create-character")}
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
                                ✨ Create First Character
                            </button>
                            <button
                                onClick={() => router.push("/join")}
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
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow =
                                        "0 10px 20px rgba(59, 130, 246, 0.3)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                🎯 Join Campaign
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gap: "1.5rem",
                            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                        }}
                    >
                        {characters.map((character) => (
                            <div
                                key={character.id}
                                style={{
                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                    borderRadius: "16px",
                                    padding: "1.5rem",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                                    backdropFilter: "blur(10px)",
                                }}
                                onClick={() => navigateToCharacter(character.id)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-5px)";
                                    e.currentTarget.style.boxShadow =
                                        "0 20px 40px rgba(0,0,0,0.15)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow =
                                        "0 10px 25px rgba(0,0,0,0.08)";
                                }}
                            >
                                {/* Character Header */}
                                <div
                                    style={{
                                        borderBottom: "2px solid #f3f4f6",
                                        paddingBottom: "1rem",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: "20px",
                                            fontWeight: "700",
                                            margin: "0 0 0.5rem 0",
                                            color: "#1f2937",
                                        }}
                                    >
                                        {character.name}
                                    </h3>
                                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                                        Level {character.level} {character.race.name}{" "}
                                        {character.characterClass.name}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3, 1fr)",
                                        gap: "0.75rem",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    {Object.entries(character.stats).map(([stat, value]) => (
                                        <div
                                            key={stat}
                                            style={{
                                                textAlign: "center",
                                                backgroundColor: "#f9fafb",
                                                borderRadius: "8px",
                                                padding: "0.5rem",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "18px",
                                                    fontWeight: "700",
                                                    color: "#374151",
                                                }}
                                            >
                                                {value}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#6b7280",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                }}
                                            >
                                                {stat.slice(0, 3)}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                                                {getModifier(value)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Health and AC */}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "0.75rem",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    <div
                                        style={{
                                            textAlign: "center",
                                            backgroundColor: "#fef2f2",
                                            borderRadius: "8px",
                                            padding: "0.5rem",
                                            border: "2px solid #fecaca",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "700",
                                                color: "#dc2626",
                                            }}
                                        >
                                            {character.hitPoints.current}/
                                            {character.hitPoints.maximum}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#7f1d1d" }}>
                                            Hit Points
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            textAlign: "center",
                                            backgroundColor: "#f0f9ff",
                                            borderRadius: "8px",
                                            padding: "0.5rem",
                                            border: "2px solid #bae6fd",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "700",
                                                color: "#0369a1",
                                            }}
                                        >
                                            {character.armorClass}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#075985" }}>
                                            Armor Class
                                        </div>
                                    </div>
                                </div>

                                {/* Campaign Info */}
                                {character.campaignId ? (
                                    <div
                                        style={{
                                            backgroundColor: "#f0fdf4",
                                            border: "2px solid #bbf7d0",
                                            borderRadius: "8px",
                                            padding: "0.75rem",
                                            fontSize: "12px",
                                            color: "#166534",
                                            textAlign: "center",
                                        }}
                                    >
                                        🏛️ In Campaign
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            backgroundColor: "#fefce8",
                                            border: "2px solid #fde047",
                                            borderRadius: "8px",
                                            padding: "0.75rem",
                                            fontSize: "12px",
                                            color: "#a16207",
                                            textAlign: "center",
                                        }}
                                    >
                                        ⭐ Available for Campaign
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
