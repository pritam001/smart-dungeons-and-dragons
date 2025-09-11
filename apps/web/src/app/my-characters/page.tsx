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
        return <div style={{ padding: 24 }}>Checking authentication...</div>;
    }

    if (loading) {
        return <div style={{ padding: 24 }}>Loading characters...</div>;
    }

    return (
        <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 32,
                }}
            >
                <h1>My Characters</h1>
                <div style={{ display: "flex", gap: 12 }}>
                    <button
                        onClick={() => router.push("/create-character")}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                        }}
                    >
                        + Create Character
                    </button>
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
                </div>
            </div>

            {error && (
                <div
                    style={{
                        color: "#dc3545",
                        backgroundColor: "#f8d7da",
                        border: "1px solid #f5c6cb",
                        borderRadius: 4,
                        padding: 12,
                        marginBottom: 24,
                    }}
                >
                    {error}
                </div>
            )}

            {characters.length === 0 ? (
                <div style={{ textAlign: "center", color: "#666", marginTop: 64 }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>⚔️</div>
                    <h2>No Characters Yet</h2>
                    <p style={{ marginBottom: 24 }}>
                        Start your adventure by creating your first character! You can create
                        characters to use in campaigns or just for fun.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                        <button
                            onClick={() => router.push("/create-character")}
                            style={{
                                padding: "12px 24px",
                                backgroundColor: "#28a745",
                                color: "white",
                                border: "none",
                                borderRadius: 4,
                                fontSize: 16,
                                cursor: "pointer",
                            }}
                        >
                            ✨ Create Character
                        </button>
                        <button
                            onClick={() => router.push("/join")}
                            style={{
                                padding: "12px 24px",
                                backgroundColor: "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: 4,
                                fontSize: 16,
                                cursor: "pointer",
                            }}
                        >
                            🎲 Join Campaign
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gap: 24,
                        gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
                    }}
                >
                    {characters.map((character) => (
                        <div
                            key={character.id}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                padding: 20,
                                backgroundColor: "#fafafa",
                                cursor: "pointer",
                                transition: "box-shadow 0.2s ease",
                            }}
                            onClick={() => navigateToCharacter(character.id)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            {/* Character Header */}
                            <div style={{ marginBottom: 16 }}>
                                <h3 style={{ margin: 0, fontSize: 20, color: "#333" }}>
                                    {character.name}
                                </h3>
                                <p style={{ margin: "4px 0", color: "#666", fontSize: 14 }}>
                                    Level {character.level} {character.race.name}{" "}
                                    {character.characterClass.name}
                                </p>
                                <p style={{ margin: "4px 0", color: "#888", fontSize: 12 }}>
                                    {character.campaignId
                                        ? `Campaign: ${character.campaignId}`
                                        : "Standalone Character"}
                                </p>
                            </div>

                            {/* Character Stats */}
                            <div style={{ marginBottom: 16 }}>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#555" }}>
                                    Ability Scores
                                </h4>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3, 1fr)",
                                        gap: 8,
                                        fontSize: 12,
                                    }}
                                >
                                    <div>
                                        STR: {character.stats.strength} (
                                        {getModifier(character.stats.strength)})
                                    </div>
                                    <div>
                                        DEX: {character.stats.dexterity} (
                                        {getModifier(character.stats.dexterity)})
                                    </div>
                                    <div>
                                        CON: {character.stats.constitution} (
                                        {getModifier(character.stats.constitution)})
                                    </div>
                                    <div>
                                        INT: {character.stats.intelligence} (
                                        {getModifier(character.stats.intelligence)})
                                    </div>
                                    <div>
                                        WIS: {character.stats.wisdom} (
                                        {getModifier(character.stats.wisdom)})
                                    </div>
                                    <div>
                                        CHA: {character.stats.charisma} (
                                        {getModifier(character.stats.charisma)})
                                    </div>
                                </div>
                            </div>

                            {/* Character Combat Stats */}
                            <div style={{ marginBottom: 16 }}>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#555" }}>
                                    Combat Stats
                                </h4>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(2, 1fr)",
                                        gap: 8,
                                        fontSize: 12,
                                    }}
                                >
                                    <div>
                                        HP: {character.hitPoints.current}/
                                        {character.hitPoints.maximum}
                                    </div>
                                    <div>AC: {character.armorClass}</div>
                                    <div>
                                        Initiative: {character.initiative >= 0 ? "+" : ""}
                                        {character.initiative}
                                    </div>
                                    <div>Speed: {character.speed} ft</div>
                                </div>
                            </div>

                            {/* Character Background */}
                            <div>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#555" }}>
                                    Background
                                </h4>
                                <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                                    {character.background.name}
                                </p>
                            </div>

                            {/* Character Status */}
                            <div style={{ marginTop: 16, textAlign: "right" }}>
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: character.isActive ? "#28a745" : "#dc3545",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {character.isActive ? "ACTIVE" : "INACTIVE"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
