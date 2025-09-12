"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CharacterSheet, CharacterStats } from "@dnd-ai/types";

export default function CharacterDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [character, setCharacter] = useState<CharacterSheet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [updates, setUpdates] = useState<Partial<CharacterSheet>>({});
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [canEdit, setCanEdit] = useState(false);

    // Get return navigation parameters
    const returnTo = searchParams.get("returnTo");
    const campaignId = searchParams.get("campaignId");

    function handleBackButton() {
        if (returnTo === "seat" && campaignId) {
            router.push(`/seat/${campaignId}`);
        } else {
            router.back();
        }
    }

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
                    return res.json();
                } else {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("user");
                    router.push("/auth");
                    return null;
                }
            })
            .then((userData) => {
                if (userData) {
                    setIsAuthenticated(true);
                    setCurrentUser(userData.user);
                    loadCharacter(userData.user);
                }
            })
            .catch(() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("user");
                router.push("/auth");
            });
    }, [router, params.id]);

    async function loadCharacter(user?: any) {
        const token = localStorage.getItem("authToken");
        try {
            const response = await fetch(`http://localhost:13333/characters/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setError("Character not found");
                } else if (response.status === 403) {
                    setError("Access denied");
                } else {
                    setError("Failed to load character");
                }
                return;
            }

            const characterData = await response.json();
            setCharacter(characterData);

            // Determine if user can edit this character
            if (user && characterData) {
                // User can edit if they own the character
                const isOwner = characterData.playerId === user.id;

                // Or if they're the GM of the campaign (if character is in a campaign)
                let isGM = false;
                if (characterData.campaignId) {
                    try {
                        const campaignsResponse = await fetch("http://localhost:13333/campaigns");
                        const campaigns = await campaignsResponse.json();
                        const campaign = campaigns.find(
                            (c: any) => c.id === characterData.campaignId,
                        );
                        isGM = campaign && campaign.createdBy === user.id;
                    } catch (e) {
                        console.warn("Could not check GM status:", e);
                    }
                }

                setCanEdit(isOwner || isGM);
            }
        } catch (err) {
            setError("Network error occurred");
        } finally {
            setLoading(false);
        }
    }

    async function saveUpdates() {
        if (!character) return;

        const token = localStorage.getItem("authToken");
        try {
            const response = await fetch(`http://localhost:13333/characters/${character.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                setError("Failed to update character");
                return;
            }

            const updatedCharacter = await response.json();
            setCharacter(updatedCharacter);
            setUpdates({});
            setEditMode(false);
        } catch (err) {
            setError("Network error occurred");
        }
    }

    function getModifier(score: number): string {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    }

    function updateHitPoints(current: number, maximum: number, temporary: number) {
        setUpdates((prev) => ({
            ...prev,
            hitPoints: { current, maximum, temporary },
        }));
    }

    if (!isAuthenticated) {
        return (
            <main
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
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🔐</div>
                    Checking authentication...
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main
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
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "48px", marginBottom: "1rem" }}>⏳</div>
                    Loading character...
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main
                style={{
                    minHeight: "100vh",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem",
                }}
            >
                <div
                    style={{
                        background: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "16px",
                        padding: "2rem",
                        textAlign: "center",
                        maxWidth: "500px",
                        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <div style={{ fontSize: "48px", marginBottom: "1rem" }}>❌</div>
                    <div
                        style={{
                            color: "#dc2626",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            border: "2px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: "12px",
                            padding: "1rem",
                            marginBottom: "1.5rem",
                            fontWeight: "600",
                        }}
                    >
                        {error}
                    </div>
                    <button
                        onClick={handleBackButton}
                        style={{
                            padding: "0.75rem 1.5rem",
                            background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            cursor: "pointer",
                            fontWeight: "600",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 5px 15px rgba(107, 114, 128, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        {returnTo === "seat" ? "Back to Seat Management" : "Back to My Characters"}
                    </button>
                </div>
            </main>
        );
    }

    if (!character) {
        return (
            <main
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
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🤷‍♂️</div>
                    Character not found
                </div>
            </main>
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
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "2rem",
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
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                            }}
                        >
                            🎭 {character.name}
                        </h1>
                        <div
                            style={{
                                fontSize: "1.2rem",
                                color: "#6b7280",
                                marginBottom: "0.5rem",
                                fontWeight: "500",
                            }}
                        >
                            Level {character.level} {character.race.name}{" "}
                            {character.characterClass.name}
                        </div>
                        {!canEdit && character.playerId !== currentUser?.id && (
                            <div
                                style={{
                                    color: "#f59e0b",
                                    fontSize: "0.9rem",
                                    fontWeight: "600",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                👁️ View Only - You can view but not edit this character
                            </div>
                        )}
                        {canEdit && character.playerId !== currentUser?.id && (
                            <div
                                style={{
                                    color: "#10b981",
                                    fontSize: "0.9rem",
                                    fontWeight: "600",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                🛡️ GM Access - You can edit this character as the Game Master
                            </div>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                            onClick={handleBackButton}
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
                            {returnTo === "seat" ? "← Back to Seats" : "← Back"}
                        </button>
                        {editMode ? (
                            <>
                                <button
                                    onClick={saveUpdates}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        background:
                                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
                                            "0 5px 15px rgba(16, 185, 129, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    ✅ Save Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setEditMode(false);
                                        setUpdates({});
                                    }}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        background:
                                            "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
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
                                            "0 5px 15px rgba(239, 68, 68, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    ❌ Cancel
                                </button>
                            </>
                        ) : (
                            canEdit && (
                                <button
                                    onClick={() => setEditMode(true)}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        background:
                                            "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
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
                                            "0 5px 15px rgba(59, 130, 246, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    ✏️ Edit Character
                                </button>
                            )
                        )}
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2rem" }}>
                    {/* Left Column - Ability Scores */}
                    <div>
                        <div
                            style={{
                                background: "rgba(255, 255, 255, 0.95)",
                                borderRadius: "16px",
                                padding: "2rem",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                                backdropFilter: "blur(10px)",
                                marginBottom: "2rem",
                            }}
                        >
                            <h3
                                style={{
                                    margin: "0 0 1.5rem 0",
                                    fontSize: "1.5rem",
                                    fontWeight: "600",
                                    color: "#374151",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                💪 Ability Scores
                            </h3>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gap: "1rem",
                                }}
                            >
                                {(Object.keys(character.stats) as Array<keyof CharacterStats>).map(
                                    (stat) => (
                                        <div
                                            key={stat}
                                            style={{
                                                textAlign: "center",
                                                border: "2px solid #e5e7eb",
                                                borderRadius: "12px",
                                                padding: "1rem",
                                                backgroundColor: "#f9fafb",
                                                transition: "all 0.2s ease",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: "700",
                                                    fontSize: "0.8rem",
                                                    textTransform: "uppercase",
                                                    color: "#6b7280",
                                                    marginBottom: "0.5rem",
                                                    letterSpacing: "0.05em",
                                                }}
                                            >
                                                {stat.slice(0, 3)}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "2rem",
                                                    fontWeight: "800",
                                                    color: "#374151",
                                                    marginBottom: "0.25rem",
                                                }}
                                            >
                                                {character.stats[stat]}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "1rem",
                                                    color: "#667eea",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                {getModifier(character.stats[stat])}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>

                        {/* Combat Stats */}
                        <div
                            style={{
                                background: "rgba(255, 255, 255, 0.95)",
                                borderRadius: "16px",
                                padding: "2rem",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <h3
                                style={{
                                    margin: "0 0 1.5rem 0",
                                    fontSize: "1.5rem",
                                    fontWeight: "600",
                                    color: "#374151",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                ⚔️ Combat Stats
                            </h3>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gap: "1rem",
                                }}
                            >
                                <div
                                    style={{
                                        border: "2px solid #e5e7eb",
                                        borderRadius: "12px",
                                        padding: "1rem",
                                        backgroundColor: "#f9fafb",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: "700",
                                            marginBottom: "0.75rem",
                                            color: "#374151",
                                            fontSize: "1rem",
                                        }}
                                    >
                                        ❤️ Hit Points
                                    </div>
                                    {editMode ? (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.5rem",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                <label
                                                    style={{
                                                        fontSize: "0.8rem",
                                                        fontWeight: "600",
                                                        color: "#6b7280",
                                                        minWidth: "50px",
                                                    }}
                                                >
                                                    Current:
                                                </label>
                                                <input
                                                    type="number"
                                                    value={
                                                        updates.hitPoints?.current ??
                                                        character.hitPoints.current
                                                    }
                                                    onChange={(e) =>
                                                        updateHitPoints(
                                                            parseInt(e.target.value),
                                                            updates.hitPoints?.maximum ??
                                                                character.hitPoints.maximum,
                                                            updates.hitPoints?.temporary ??
                                                                character.hitPoints.temporary,
                                                        )
                                                    }
                                                    style={{
                                                        width: "80px",
                                                        padding: "0.5rem",
                                                        border: "2px solid #e5e7eb",
                                                        borderRadius: "6px",
                                                        fontSize: "0.9rem",
                                                        textAlign: "center",
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                <label
                                                    style={{
                                                        fontSize: "0.8rem",
                                                        fontWeight: "600",
                                                        color: "#6b7280",
                                                        minWidth: "50px",
                                                    }}
                                                >
                                                    Max:
                                                </label>
                                                <input
                                                    type="number"
                                                    value={
                                                        updates.hitPoints?.maximum ??
                                                        character.hitPoints.maximum
                                                    }
                                                    onChange={(e) =>
                                                        updateHitPoints(
                                                            updates.hitPoints?.current ??
                                                                character.hitPoints.current,
                                                            parseInt(e.target.value),
                                                            updates.hitPoints?.temporary ??
                                                                character.hitPoints.temporary,
                                                        )
                                                    }
                                                    style={{
                                                        width: "80px",
                                                        padding: "0.5rem",
                                                        border: "2px solid #e5e7eb",
                                                        borderRadius: "6px",
                                                        fontSize: "0.9rem",
                                                        textAlign: "center",
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                <label
                                                    style={{
                                                        fontSize: "0.8rem",
                                                        fontWeight: "600",
                                                        color: "#6b7280",
                                                        minWidth: "50px",
                                                    }}
                                                >
                                                    Temp:
                                                </label>
                                                <input
                                                    type="number"
                                                    value={
                                                        updates.hitPoints?.temporary ??
                                                        character.hitPoints.temporary
                                                    }
                                                    onChange={(e) =>
                                                        updateHitPoints(
                                                            updates.hitPoints?.current ??
                                                                character.hitPoints.current,
                                                            updates.hitPoints?.maximum ??
                                                                character.hitPoints.maximum,
                                                            parseInt(e.target.value),
                                                        )
                                                    }
                                                    style={{
                                                        width: "80px",
                                                        padding: "0.5rem",
                                                        border: "2px solid #e5e7eb",
                                                        borderRadius: "6px",
                                                        fontSize: "0.9rem",
                                                        textAlign: "center",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                fontSize: "1.5rem",
                                                fontWeight: "700",
                                                color: "#374151",
                                                textAlign: "center",
                                            }}
                                        >
                                            {character.hitPoints.current}/
                                            {character.hitPoints.maximum}
                                            {character.hitPoints.temporary > 0 &&
                                                ` (+${character.hitPoints.temporary})`}
                                        </div>
                                    )}
                                </div>
                                <div
                                    style={{
                                        border: "2px solid #e5e7eb",
                                        borderRadius: "12px",
                                        padding: "1rem",
                                        backgroundColor: "#f9fafb",
                                        textAlign: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: "700",
                                            marginBottom: "0.75rem",
                                            color: "#374151",
                                            fontSize: "1rem",
                                        }}
                                    >
                                        🛡️ Armor Class
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "1.5rem",
                                            fontWeight: "700",
                                            color: "#374151",
                                        }}
                                    >
                                        {character.armorClass}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        border: "2px solid #e5e7eb",
                                        borderRadius: "12px",
                                        padding: "1rem",
                                        backgroundColor: "#f9fafb",
                                        textAlign: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: "700",
                                            marginBottom: "0.75rem",
                                            color: "#374151",
                                            fontSize: "1rem",
                                        }}
                                    >
                                        ⚡ Initiative
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "1.5rem",
                                            fontWeight: "700",
                                            color: "#374151",
                                        }}
                                    >
                                        {character.initiative >= 0 ? "+" : ""}
                                        {character.initiative}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        border: "2px solid #e5e7eb",
                                        borderRadius: "12px",
                                        padding: "1rem",
                                        backgroundColor: "#f9fafb",
                                        textAlign: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: "700",
                                            marginBottom: "0.75rem",
                                            color: "#374151",
                                            fontSize: "1rem",
                                        }}
                                    >
                                        🏃 Speed
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "1.5rem",
                                            fontWeight: "700",
                                            color: "#374151",
                                        }}
                                    >
                                        {character.speed} ft
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column - Character Info */}
                    <div>
                        <div
                            style={{
                                background: "rgba(255, 255, 255, 0.95)",
                                borderRadius: "16px",
                                padding: "2rem",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                                backdropFilter: "blur(10px)",
                                marginBottom: "2rem",
                            }}
                        >
                            <h3
                                style={{
                                    margin: "0 0 1.5rem 0",
                                    fontSize: "1.5rem",
                                    fontWeight: "600",
                                    color: "#374151",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                📋 Character Info
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div
                                    style={{
                                        padding: "1rem",
                                        border: "2px solid #e5e7eb",
                                        borderRadius: "12px",
                                        backgroundColor: "#f9fafb",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            fontWeight: "600",
                                            color: "#6b7280",
                                            marginBottom: "0.25rem",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        Race
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "1.1rem",
                                            fontWeight: "600",
                                            color: "#374151",
                                        }}
                                    >
                                        🧝 {character.race.name}
                                        {character.race.subrace && ` (${character.race.subrace})`}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        padding: "1rem",
                                        border: "2px solid #e5e7eb",
                                        borderRadius: "12px",
                                        backgroundColor: "#f9fafb",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            fontWeight: "600",
                                            color: "#6b7280",
                                            marginBottom: "0.25rem",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        Class
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "1.1rem",
                                            fontWeight: "600",
                                            color: "#374151",
                                        }}
                                    >
                                        ⚔️ {character.characterClass.name}
                                        {character.characterClass.subclass &&
                                            ` (${character.characterClass.subclass})`}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        padding: "1rem",
                                        border: "2px solid #e5e7eb",
                                        borderRadius: "12px",
                                        backgroundColor: "#f9fafb",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            fontWeight: "600",
                                            color: "#6b7280",
                                            marginBottom: "0.25rem",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        Background
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "1.1rem",
                                            fontWeight: "600",
                                            color: "#374151",
                                        }}
                                    >
                                        📖 {character.background.name}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "1rem",
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: "1rem",
                                            border: "2px solid #e5e7eb",
                                            borderRadius: "12px",
                                            backgroundColor: "#f9fafb",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "0.8rem",
                                                fontWeight: "600",
                                                color: "#6b7280",
                                                marginBottom: "0.25rem",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            Level
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "1.5rem",
                                                fontWeight: "700",
                                                color: "#667eea",
                                            }}
                                        >
                                            {character.level}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            padding: "1rem",
                                            border: "2px solid #e5e7eb",
                                            borderRadius: "12px",
                                            backgroundColor: "#f9fafb",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "0.8rem",
                                                fontWeight: "600",
                                                color: "#6b7280",
                                                marginBottom: "0.25rem",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            XP
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "1.2rem",
                                                fontWeight: "700",
                                                color: "#667eea",
                                            }}
                                        >
                                            {character.experiencePoints}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Equipment & Currency */}
                        <div
                            style={{
                                background: "rgba(255, 255, 255, 0.95)",
                                borderRadius: "16px",
                                padding: "2rem",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <h3
                                style={{
                                    margin: "0 0 1.5rem 0",
                                    fontSize: "1.5rem",
                                    fontWeight: "600",
                                    color: "#374151",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                💰 Equipment & Currency
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div
                                    style={{
                                        padding: "1rem",
                                        border: "2px solid #e5e7eb",
                                        borderRadius: "12px",
                                        backgroundColor: "#f9fafb",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "0.9rem",
                                            fontWeight: "600",
                                            color: "#6b7280",
                                            marginBottom: "0.75rem",
                                        }}
                                    >
                                        💰 Currency
                                    </div>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(4, 1fr)",
                                            gap: "0.5rem",
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        <div style={{ textAlign: "center" }}>
                                            <div
                                                style={{
                                                    fontWeight: "700",
                                                    color: "#8b5cf6",
                                                    fontSize: "1.1rem",
                                                }}
                                            >
                                                {character.currency.platinum}
                                            </div>
                                            <div style={{ color: "#6b7280", fontSize: "0.7rem" }}>
                                                PP
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "center" }}>
                                            <div
                                                style={{
                                                    fontWeight: "700",
                                                    color: "#f59e0b",
                                                    fontSize: "1.1rem",
                                                }}
                                            >
                                                {character.currency.gold}
                                            </div>
                                            <div style={{ color: "#6b7280", fontSize: "0.7rem" }}>
                                                GP
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "center" }}>
                                            <div
                                                style={{
                                                    fontWeight: "700",
                                                    color: "#6b7280",
                                                    fontSize: "1.1rem",
                                                }}
                                            >
                                                {character.currency.silver}
                                            </div>
                                            <div style={{ color: "#6b7280", fontSize: "0.7rem" }}>
                                                SP
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "center" }}>
                                            <div
                                                style={{
                                                    fontWeight: "700",
                                                    color: "#92400e",
                                                    fontSize: "1.1rem",
                                                }}
                                            >
                                                {character.currency.copper}
                                            </div>
                                            <div style={{ color: "#6b7280", fontSize: "0.7rem" }}>
                                                CP
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    style={{
                                        padding: "1rem",
                                        border: "2px solid #e5e7eb",
                                        borderRadius: "12px",
                                        backgroundColor: "#f9fafb",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "0.9rem",
                                            fontWeight: "600",
                                            color: "#6b7280",
                                            marginBottom: "0.75rem",
                                        }}
                                    >
                                        🎒 Equipment
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "0.9rem",
                                            color: "#374151",
                                            lineHeight: "1.5",
                                        }}
                                    >
                                        {[
                                            ...character.equipment.weapons,
                                            ...character.equipment.armor,
                                            ...character.equipment.tools,
                                            ...character.equipment.other,
                                        ].length > 0
                                            ? [
                                                  ...character.equipment.weapons,
                                                  ...character.equipment.armor,
                                                  ...character.equipment.tools,
                                                  ...character.equipment.other,
                                              ].join(", ")
                                            : "No equipment listed"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Skills */}
                    <div>
                        <div
                            style={{
                                background: "rgba(255, 255, 255, 0.95)",
                                borderRadius: "16px",
                                padding: "2rem",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <h3
                                style={{
                                    margin: "0 0 1.5rem 0",
                                    fontSize: "1.5rem",
                                    fontWeight: "600",
                                    color: "#374151",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                🎯 Skills
                            </h3>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.5rem",
                                }}
                            >
                                {Object.entries(character.skills).map(([skill, bonus]) => (
                                    <div
                                        key={skill}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "0.75rem 1rem",
                                            border: character.skillProficiencies.includes(
                                                skill as any,
                                            )
                                                ? "2px solid #667eea"
                                                : "2px solid #e5e7eb",
                                            borderRadius: "8px",
                                            backgroundColor: character.skillProficiencies.includes(
                                                skill as any,
                                            )
                                                ? "rgba(102, 126, 234, 0.1)"
                                                : "#f9fafb",
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontWeight: character.skillProficiencies.includes(
                                                    skill as any,
                                                )
                                                    ? "700"
                                                    : "500",
                                                color: character.skillProficiencies.includes(
                                                    skill as any,
                                                )
                                                    ? "#374151"
                                                    : "#6b7280",
                                            }}
                                        >
                                            {character.skillProficiencies.includes(skill as any) &&
                                                "⭐ "}
                                            {skill
                                                .replace(/([A-Z])/g, " $1")
                                                .replace(/^./, (str) => str.toUpperCase())}
                                        </span>
                                        <span
                                            style={{
                                                fontWeight: "700",
                                                color: "#667eea",
                                                minWidth: "2rem",
                                                textAlign: "right",
                                            }}
                                        >
                                            {bonus >= 0 ? "+" : ""}
                                            {bonus}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Backstory */}
                {character.backstory && (
                    <div
                        style={{
                            background: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "16px",
                            padding: "2rem",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                            backdropFilter: "blur(10px)",
                            marginTop: "2rem",
                        }}
                    >
                        <h3
                            style={{
                                margin: "0 0 1.5rem 0",
                                fontSize: "1.5rem",
                                fontWeight: "600",
                                color: "#374151",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                            }}
                        >
                            📖 Backstory
                        </h3>
                        <div
                            style={{
                                padding: "1.5rem",
                                border: "2px solid #e5e7eb",
                                borderRadius: "12px",
                                backgroundColor: "#f9fafb",
                                lineHeight: "1.8",
                                fontSize: "1rem",
                                color: "#374151",
                            }}
                        >
                            {character.backstory}
                        </div>
                    </div>
                )}

                {/* Quick Dice Rolling */}
                <div
                    style={{
                        background: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "16px",
                        padding: "2rem",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                        backdropFilter: "blur(10px)",
                        marginTop: "2rem",
                    }}
                >
                    <h3
                        style={{
                            margin: "0 0 1.5rem 0",
                            fontSize: "1.5rem",
                            fontWeight: "600",
                            color: "#374151",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        🎲 Quick Rolls
                    </h3>
                    <DiceRollingComponent character={character} />
                </div>
            </div>
        </main>
    );
}

// Dice Rolling Component
function DiceRollingComponent({ character }: { character: CharacterSheet }) {
    const [isRolling, setIsRolling] = useState(false);
    const [lastRoll, setLastRoll] = useState<any>(null);
    const [advantage, setAdvantage] = useState(false);
    const [disadvantage, setDisadvantage] = useState(false);

    const rollDice = async (rollType: string, ability?: string) => {
        setIsRolling(true);
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`http://localhost:13333/roll/preset/${rollType}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    characterId: character.id,
                    ability,
                    advantage,
                    disadvantage,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setLastRoll(data.roll);
            } else {
                const error = await response.json();
                alert(`Roll failed: ${error.error}`);
            }
        } catch (error) {
            console.error("Failed to roll dice:", error);
            alert("Failed to roll dice");
        } finally {
            setIsRolling(false);
        }
    };

    const rollCustom = async (notation: string) => {
        setIsRolling(true);
        try {
            const response = await fetch("http://localhost:13333/roll/custom", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    notation,
                    advantage,
                    disadvantage,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setLastRoll(data.roll);
            } else {
                const error = await response.json();
                alert(`Roll failed: ${error.error}`);
            }
        } catch (error) {
            console.error("Failed to roll dice:", error);
            alert("Failed to roll dice");
        } finally {
            setIsRolling(false);
        }
    };

    const getModifierDisplay = (modifier: number) => {
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    };

    const getDiceIcon = (notation: string) => {
        if (notation.includes("d4")) return "🔺";
        if (notation.includes("d6")) return "⚀";
        if (notation.includes("d8")) return "🔶";
        if (notation.includes("d10")) return "🔟";
        if (notation.includes("d12")) return "🔷";
        if (notation.includes("d20")) return "🎲";
        if (notation.includes("d100")) return "💯";
        return "🎲";
    };

    return (
        <div>
            {/* Roll Result Display */}
            {lastRoll && (
                <div
                    style={{
                        padding: "12px",
                        marginBottom: "16px",
                        border: `2px solid ${lastRoll.criticalSuccess ? "#28a745" : lastRoll.criticalFailure ? "#dc3545" : "#007bff"}`,
                        borderRadius: "8px",
                        background: lastRoll.criticalSuccess
                            ? "#d4edda"
                            : lastRoll.criticalFailure
                              ? "#f8d7da"
                              : "#e3f2fd",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "4px" }}>
                        🎲 {lastRoll.total}
                        {lastRoll.criticalSuccess && " ⭐"}
                        {lastRoll.criticalFailure && " ☠️"}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                        {lastRoll.notation}
                        {lastRoll.description && ` • ${lastRoll.description}`}
                    </div>
                    {lastRoll.dice && lastRoll.dice.length > 1 && (
                        <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                            Individual rolls: {lastRoll.dice.map((d: any) => d.value).join(", ")}
                        </div>
                    )}
                </div>
            )}

            {/* Roll Modifiers */}
            <div
                style={{ display: "flex", gap: "16px", marginBottom: "16px", alignItems: "center" }}
            >
                <label
                    style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }}
                >
                    <input
                        type="checkbox"
                        checked={advantage}
                        onChange={(e) => {
                            setAdvantage(e.target.checked);
                            if (e.target.checked) setDisadvantage(false);
                        }}
                    />
                    ⬆️ Advantage
                </label>
                <label
                    style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }}
                >
                    <input
                        type="checkbox"
                        checked={disadvantage}
                        onChange={(e) => {
                            setDisadvantage(e.target.checked);
                            if (e.target.checked) setAdvantage(false);
                        }}
                    />
                    ⬇️ Disadvantage
                </label>
                <button
                    onClick={() => {
                        setAdvantage(false);
                        setDisadvantage(false);
                    }}
                    style={{
                        padding: "2px 8px",
                        background: "#f8f9fa",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                    }}
                >
                    Reset
                </button>
            </div>

            {/* Quick Action Rolls */}
            <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>Quick Actions</h4>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: "8px",
                    }}
                >
                    <button
                        onClick={() => rollDice("initiative")}
                        disabled={isRolling}
                        style={{
                            padding: "8px",
                            background: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: isRolling ? "not-allowed" : "pointer",
                            fontSize: "12px",
                            opacity: isRolling ? 0.6 : 1,
                        }}
                    >
                        ⚡ Initiative
                    </button>
                    <button
                        onClick={() => rollDice("death-save")}
                        disabled={isRolling}
                        style={{
                            padding: "8px",
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: isRolling ? "not-allowed" : "pointer",
                            fontSize: "12px",
                            opacity: isRolling ? 0.6 : 1,
                        }}
                    >
                        💀 Death Save
                    </button>
                    <button
                        onClick={() => rollDice("hit-dice")}
                        disabled={isRolling}
                        style={{
                            padding: "8px",
                            background: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: isRolling ? "not-allowed" : "pointer",
                            fontSize: "12px",
                            opacity: isRolling ? 0.6 : 1,
                        }}
                    >
                        ❤️ Hit Dice
                    </button>
                    <button
                        onClick={() => rollCustom("1d20")}
                        disabled={isRolling}
                        style={{
                            padding: "8px",
                            background: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: isRolling ? "not-allowed" : "pointer",
                            fontSize: "12px",
                            opacity: isRolling ? 0.6 : 1,
                        }}
                    >
                        🎲 d20
                    </button>
                </div>
            </div>

            {/* Ability Checks */}
            <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>Ability Checks</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
                    {Object.entries(character.modifiers).map(([ability, modifier]) => (
                        <button
                            key={ability}
                            onClick={() => rollDice("ability", ability)}
                            disabled={isRolling}
                            style={{
                                padding: "6px",
                                background: "#f8f9fa",
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                                cursor: isRolling ? "not-allowed" : "pointer",
                                fontSize: "11px",
                                textAlign: "center",
                            }}
                        >
                            <div style={{ fontWeight: "bold", textTransform: "capitalize" }}>
                                {ability.slice(0, 3)}
                            </div>
                            <div style={{ color: "#666" }}>{getModifierDisplay(modifier)}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Saving Throws */}
            <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>Saving Throws</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
                    {Object.entries(character.savingThrows).map(([save, bonus]) => (
                        <button
                            key={save}
                            onClick={() => rollDice("save", save)}
                            disabled={isRolling}
                            style={{
                                padding: "6px",
                                background: character.savingThrowProficiencies.includes(
                                    save as keyof CharacterStats,
                                )
                                    ? "#e7f3ff"
                                    : "#f8f9fa",
                                border: `1px solid ${character.savingThrowProficiencies.includes(save as keyof CharacterStats) ? "#007bff" : "#ddd"}`,
                                borderRadius: "4px",
                                cursor: isRolling ? "not-allowed" : "pointer",
                                fontSize: "11px",
                                textAlign: "center",
                            }}
                        >
                            <div style={{ fontWeight: "bold", textTransform: "capitalize" }}>
                                {save.slice(0, 3)}
                            </div>
                            <div style={{ color: "#666" }}>{getModifierDisplay(bonus)}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Damage Dice */}
            <div>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>Custom Dice Roll</h4>
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "flex-end",
                        marginBottom: "8px",
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <select
                            onChange={(e) => rollCustom(e.target.value)}
                            disabled={isRolling}
                            style={{
                                width: "100%",
                                padding: "6px",
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                                fontSize: "12px",
                                backgroundColor: "white",
                            }}
                            defaultValue=""
                        >
                            <option value="" disabled>
                                Select dice to roll...
                            </option>
                            <optgroup label="Common Dice">
                                <option value="1d4">🔺 1d4</option>
                                <option value="1d6">⚀ 1d6</option>
                                <option value="1d8">🔶 1d8</option>
                                <option value="1d10">🔟 1d10</option>
                                <option value="1d12">🔷 1d12</option>
                                <option value="1d20">🎲 1d20</option>
                                <option value="1d100">💯 1d100</option>
                            </optgroup>
                            <optgroup label="Multiple Dice">
                                <option value="2d4">🔺 2d4</option>
                                <option value="2d6">⚀ 2d6</option>
                                <option value="2d8">🔶 2d8</option>
                                <option value="3d6">⚀ 3d6</option>
                                <option value="4d6">⚀ 4d6</option>
                            </optgroup>
                            <optgroup label="Damage Dice">
                                <option value="1d6+1">⚀ 1d6+1</option>
                                <option value="1d8+2">🔶 1d8+2</option>
                                <option value="2d6+3">⚀ 2d6+3</option>
                                <option value="1d10+3">🔟 1d10+3</option>
                                <option value="1d12+4">🔷 1d12+4</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
                <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>
                    Or use quick buttons:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {["1d4", "1d6", "1d8", "1d10", "1d12", "1d20", "2d6"].map((notation) => (
                        <button
                            key={notation}
                            onClick={() => rollCustom(notation)}
                            disabled={isRolling}
                            style={{
                                padding: "4px 8px",
                                background: "#f8f9fa",
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                                cursor: isRolling ? "not-allowed" : "pointer",
                                fontSize: "11px",
                                opacity: isRolling ? 0.6 : 1,
                            }}
                        >
                            {getDiceIcon(notation)} {notation}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
