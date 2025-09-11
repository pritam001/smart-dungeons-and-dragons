"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CharacterSheet, CharacterStats } from "@dnd-ai/types";

export default function CharacterDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [character, setCharacter] = useState<CharacterSheet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [updates, setUpdates] = useState<Partial<CharacterSheet>>({});

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
                    loadCharacter();
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
    }, [router, params.id]);

    async function loadCharacter() {
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
        return <div style={{ padding: 24 }}>Checking authentication...</div>;
    }

    if (loading) {
        return <div style={{ padding: 24 }}>Loading character...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: 24 }}>
                <div
                    style={{
                        color: "#dc3545",
                        backgroundColor: "#f8d7da",
                        border: "1px solid #f5c6cb",
                        borderRadius: 4,
                        padding: 12,
                        marginBottom: 16,
                    }}
                >
                    {error}
                </div>
                <button
                    onClick={() => router.push("/my-characters")}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                    }}
                >
                    Back to My Characters
                </button>
            </div>
        );
    }

    if (!character) {
        return <div style={{ padding: 24 }}>Character not found</div>;
    }

    return (
        <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 32,
                }}
            >
                <div>
                    <h1 style={{ margin: 0 }}>{character.name}</h1>
                    <p style={{ margin: "4px 0", color: "#666" }}>
                        Level {character.level} {character.race.name}{" "}
                        {character.characterClass.name}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button
                        onClick={() => router.push("/my-characters")}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                        }}
                    >
                        Back
                    </button>
                    {editMode ? (
                        <>
                            <button
                                onClick={saveUpdates}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#28a745",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                }}
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => {
                                    setEditMode(false);
                                    setUpdates({});
                                }}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#dc3545",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setEditMode(true)}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: 4,
                                cursor: "pointer",
                            }}
                        >
                            Edit Character
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                {/* Left Column */}
                <div>
                    {/* Ability Scores */}
                    <div style={{ marginBottom: 32 }}>
                        <h3>Ability Scores</h3>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: 16,
                            }}
                        >
                            {(Object.keys(character.stats) as Array<keyof CharacterStats>).map(
                                (stat) => (
                                    <div
                                        key={stat}
                                        style={{
                                            textAlign: "center",
                                            border: "1px solid #ddd",
                                            borderRadius: 4,
                                            padding: 12,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: "bold",
                                                fontSize: 12,
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            {stat.slice(0, 3)}
                                        </div>
                                        <div style={{ fontSize: 24, fontWeight: "bold" }}>
                                            {character.stats[stat]}
                                        </div>
                                        <div style={{ fontSize: 14, color: "#666" }}>
                                            {getModifier(character.stats[stat])}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>

                    {/* Combat Stats */}
                    <div style={{ marginBottom: 32 }}>
                        <h3>Combat Stats</h3>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: 16,
                            }}
                        >
                            <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: 12 }}>
                                <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                                    Hit Points
                                </div>
                                {editMode ? (
                                    <div
                                        style={{ display: "flex", flexDirection: "column", gap: 4 }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <label style={{ fontSize: 12 }}>Current:</label>
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
                                                style={{ width: 60, padding: 4 }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <label style={{ fontSize: 12 }}>Max:</label>
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
                                                style={{ width: 60, padding: 4 }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <label style={{ fontSize: 12 }}>Temp:</label>
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
                                                style={{ width: 60, padding: 4 }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: 18 }}>
                                        {character.hitPoints.current}/{character.hitPoints.maximum}
                                        {character.hitPoints.temporary > 0 &&
                                            ` (+${character.hitPoints.temporary})`}
                                    </div>
                                )}
                            </div>
                            <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: 12 }}>
                                <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                                    Armor Class
                                </div>
                                <div style={{ fontSize: 18 }}>{character.armorClass}</div>
                            </div>
                            <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: 12 }}>
                                <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                                    Initiative
                                </div>
                                <div style={{ fontSize: 18 }}>
                                    {character.initiative >= 0 ? "+" : ""}
                                    {character.initiative}
                                </div>
                            </div>
                            <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: 12 }}>
                                <div style={{ fontWeight: "bold", marginBottom: 8 }}>Speed</div>
                                <div style={{ fontSize: 18 }}>{character.speed} ft</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    {/* Character Info */}
                    <div style={{ marginBottom: 32 }}>
                        <h3>Character Information</h3>
                        <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: 16 }}>
                            <div style={{ marginBottom: 12 }}>
                                <strong>Race:</strong> {character.race.name}
                                {character.race.subrace && ` (${character.race.subrace})`}
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <strong>Class:</strong> {character.characterClass.name}
                                {character.characterClass.subclass &&
                                    ` (${character.characterClass.subclass})`}
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <strong>Background:</strong> {character.background.name}
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <strong>Level:</strong> {character.level}
                            </div>
                            <div>
                                <strong>Experience Points:</strong> {character.experiencePoints}
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div style={{ marginBottom: 32 }}>
                        <h3>Skills</h3>
                        <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: 16 }}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gap: 8,
                                    fontSize: 14,
                                }}
                            >
                                {Object.entries(character.skills).map(([skill, bonus]) => (
                                    <div
                                        key={skill}
                                        style={{ display: "flex", justifyContent: "space-between" }}
                                    >
                                        <span
                                            style={{
                                                fontWeight: character.skillProficiencies.includes(
                                                    skill as any,
                                                )
                                                    ? "bold"
                                                    : "normal",
                                            }}
                                        >
                                            {skill
                                                .replace(/([A-Z])/g, " $1")
                                                .replace(/^./, (str) => str.toUpperCase())}
                                        </span>
                                        <span>
                                            {bonus >= 0 ? "+" : ""}
                                            {bonus}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Equipment */}
                    <div style={{ marginBottom: 32 }}>
                        <h3>Equipment & Currency</h3>
                        <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: 16 }}>
                            <div style={{ marginBottom: 16 }}>
                                <strong>Currency:</strong>
                                <div style={{ fontSize: 14, marginTop: 4 }}>
                                    {character.currency.platinum}pp, {character.currency.gold}gp,
                                    {character.currency.silver}sp, {character.currency.copper}cp
                                </div>
                            </div>
                            <div>
                                <strong>Equipment:</strong>
                                <div style={{ fontSize: 14, marginTop: 4 }}>
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
            </div>

            {/* Backstory */}
            {character.backstory && (
                <div style={{ marginTop: 32 }}>
                    <h3>Backstory</h3>
                    <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: 16 }}>
                        <p style={{ margin: 0, lineHeight: 1.6 }}>{character.backstory}</p>
                    </div>
                </div>
            )}

            {/* Quick Dice Rolling */}
            <div style={{ marginTop: 32 }}>
                <h3>🎲 Quick Rolls</h3>
                <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: 16 }}>
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
