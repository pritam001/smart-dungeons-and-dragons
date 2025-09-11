"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CharacterStats, CharacterRace, CharacterClass, CharacterBackground } from "@dnd-ai/types";

export default function CreateCharacterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const campaignId = searchParams.get("campaignId");
    const seatId = searchParams.get("seatId");

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Character form state
    const [name, setName] = useState("");
    const [selectedRace, setSelectedRace] = useState<CharacterRace>({
        name: "Human",
        abilityScoreIncrease: {
            strength: 1,
            dexterity: 1,
            constitution: 1,
            intelligence: 1,
            wisdom: 1,
            charisma: 1,
        },
        traits: ["Extra Language", "Extra Skill"],
        languages: ["Common"],
        proficiencies: [],
    });

    const [selectedClass, setSelectedClass] = useState<CharacterClass>({
        name: "Fighter",
        level: 1,
        hitDie: "d10",
        primaryAbility: "strength",
        savingThrowProficiencies: ["strength", "constitution"],
        skillProficiencies: ["athletics", "intimidation"],
        features: ["Fighting Style", "Second Wind"],
    });

    const [selectedBackground, setSelectedBackground] = useState<CharacterBackground>({
        name: "Soldier",
        description: "You had a military life before adventuring.",
        skillProficiencies: ["athletics", "intimidation"],
        toolProficiencies: ["Gaming Set", "Vehicles (Land)"],
        languages: [],
        features: ["Military Rank"],
    });

    const [stats, setStats] = useState<CharacterStats>({
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8,
    });

    const [backstory, setBackstory] = useState("");

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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!campaignId || !seatId) {
            setError("Missing campaign or seat information");
            return;
        }

        setLoading(true);
        setError("");

        const token = localStorage.getItem("authToken");

        try {
            const response = await fetch("http://localhost:13333/characters", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    campaignId,
                    seatId,
                    name,
                    race: selectedRace,
                    characterClass: selectedClass,
                    background: selectedBackground,
                    stats,
                    backstory,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || "Failed to create character");
                return;
            }

            const character = await response.json();

            // Redirect to campaign seat page
            router.push(`/seat/${campaignId}`);
        } catch (err) {
            setError("Network error occurred");
        } finally {
            setLoading(false);
        }
    }

    function updateStat(stat: keyof CharacterStats, value: number) {
        setStats((prev) => ({ ...prev, [stat]: Math.max(1, Math.min(30, value)) }));
    }

    function getModifier(score: number): number {
        return Math.floor((score - 10) / 2);
    }

    if (!isAuthenticated) {
        return <div style={{ padding: 24 }}>Checking authentication...</div>;
    }

    return (
        <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
            <h1>Create Character</h1>

            <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
            >
                {/* Character Name */}
                <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
                        Character Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: 12,
                            border: "1px solid #ddd",
                            borderRadius: 4,
                            fontSize: 16,
                        }}
                        placeholder="Enter your character's name"
                    />
                </div>

                {/* Race Selection */}
                <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
                        Race
                    </label>
                    <select
                        value={selectedRace.name}
                        onChange={(e) => {
                            const raceName = e.target.value;
                            // Simplified race options - in a full implementation, you'd have a races database
                            const raceOptions: Record<string, CharacterRace> = {
                                Human: {
                                    name: "Human",
                                    abilityScoreIncrease: {
                                        strength: 1,
                                        dexterity: 1,
                                        constitution: 1,
                                        intelligence: 1,
                                        wisdom: 1,
                                        charisma: 1,
                                    },
                                    traits: ["Extra Language", "Extra Skill"],
                                    languages: ["Common"],
                                    proficiencies: [],
                                },
                                Elf: {
                                    name: "Elf",
                                    abilityScoreIncrease: { dexterity: 2 },
                                    traits: ["Darkvision", "Keen Senses", "Fey Ancestry", "Trance"],
                                    languages: ["Common", "Elvish"],
                                    proficiencies: ["Perception"],
                                },
                                Dwarf: {
                                    name: "Dwarf",
                                    abilityScoreIncrease: { constitution: 2 },
                                    traits: ["Darkvision", "Dwarven Resilience", "Stonecunning"],
                                    languages: ["Common", "Dwarvish"],
                                    proficiencies: [
                                        "Battleaxe",
                                        "Handaxe",
                                        "Light Hammer",
                                        "Warhammer",
                                    ],
                                },
                            };
                            setSelectedRace(raceOptions[raceName] || raceOptions["Human"]);
                        }}
                        style={{
                            width: "100%",
                            padding: 12,
                            border: "1px solid #ddd",
                            borderRadius: 4,
                            fontSize: 16,
                        }}
                    >
                        <option value="Human">Human</option>
                        <option value="Elf">Elf</option>
                        <option value="Dwarf">Dwarf</option>
                    </select>
                </div>

                {/* Class Selection */}
                <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
                        Class
                    </label>
                    <select
                        value={selectedClass.name}
                        onChange={(e) => {
                            const className = e.target.value;
                            const classOptions: Record<string, CharacterClass> = {
                                Fighter: {
                                    name: "Fighter",
                                    level: 1,
                                    hitDie: "d10",
                                    primaryAbility: "strength",
                                    savingThrowProficiencies: ["strength", "constitution"],
                                    skillProficiencies: ["athletics", "intimidation"],
                                    features: ["Fighting Style", "Second Wind"],
                                },
                                Wizard: {
                                    name: "Wizard",
                                    level: 1,
                                    hitDie: "d6",
                                    primaryAbility: "intelligence",
                                    savingThrowProficiencies: ["intelligence", "wisdom"],
                                    skillProficiencies: ["arcana", "history"],
                                    features: ["Spellcasting", "Arcane Recovery"],
                                },
                                Rogue: {
                                    name: "Rogue",
                                    level: 1,
                                    hitDie: "d8",
                                    primaryAbility: "dexterity",
                                    savingThrowProficiencies: ["dexterity", "intelligence"],
                                    skillProficiencies: ["stealth", "sleightOfHand"],
                                    features: ["Expertise", "Sneak Attack", "Thieves' Cant"],
                                },
                            };
                            setSelectedClass(classOptions[className] || classOptions["Fighter"]);
                        }}
                        style={{
                            width: "100%",
                            padding: 12,
                            border: "1px solid #ddd",
                            borderRadius: 4,
                            fontSize: 16,
                        }}
                    >
                        <option value="Fighter">Fighter</option>
                        <option value="Wizard">Wizard</option>
                        <option value="Rogue">Rogue</option>
                    </select>
                </div>

                {/* Ability Scores */}
                <div>
                    <h3>Ability Scores</h3>
                    <div
                        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}
                    >
                        {(Object.keys(stats) as Array<keyof CharacterStats>).map((stat) => (
                            <div key={stat} style={{ textAlign: "center" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontWeight: "bold",
                                        marginBottom: 4,
                                    }}
                                >
                                    {stat.charAt(0).toUpperCase() + stat.slice(1)}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={stats[stat]}
                                    onChange={(e) =>
                                        updateStat(stat, parseInt(e.target.value) || 1)
                                    }
                                    style={{
                                        width: "60px",
                                        padding: 8,
                                        border: "1px solid #ddd",
                                        borderRadius: 4,
                                        textAlign: "center",
                                        fontSize: 16,
                                    }}
                                />
                                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                    Modifier: {getModifier(stats[stat]) >= 0 ? "+" : ""}
                                    {getModifier(stats[stat])}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Backstory */}
                <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
                        Backstory (Optional)
                    </label>
                    <textarea
                        value={backstory}
                        onChange={(e) => setBackstory(e.target.value)}
                        rows={4}
                        style={{
                            width: "100%",
                            padding: 12,
                            border: "1px solid #ddd",
                            borderRadius: 4,
                            fontSize: 16,
                            resize: "vertical",
                        }}
                        placeholder="Tell us about your character's background and motivations..."
                    />
                </div>

                {error && (
                    <div
                        style={{
                            color: "#dc3545",
                            backgroundColor: "#f8d7da",
                            border: "1px solid #f5c6cb",
                            borderRadius: 4,
                            padding: 12,
                        }}
                    >
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    style={{
                        padding: 16,
                        backgroundColor: loading ? "#ccc" : "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        fontSize: 18,
                        fontWeight: "bold",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Creating Character..." : "Create Character"}
                </button>
            </form>
        </main>
    );
}
