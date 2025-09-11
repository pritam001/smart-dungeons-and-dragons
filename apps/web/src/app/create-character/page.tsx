"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CharacterStats, CharacterRace, CharacterClass, CharacterBackground } from "@dnd-ai/types";

export default function CreateCharacterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const campaignId = searchParams.get("campaignId");
    const seatId = searchParams.get("seatId");

    const [currentStep, setCurrentStep] = useState(1);
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

    // Available options
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
            proficiencies: ["Battleaxe", "Handaxe", "Light Hammer", "Warhammer"],
        },
        Halfling: {
            name: "Halfling",
            abilityScoreIncrease: { dexterity: 2 },
            traits: ["Lucky", "Brave", "Halfling Nimbleness"],
            languages: ["Common", "Halfling"],
            proficiencies: [],
        },
    };

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
        Cleric: {
            name: "Cleric",
            level: 1,
            hitDie: "d8",
            primaryAbility: "wisdom",
            savingThrowProficiencies: ["wisdom", "charisma"],
            skillProficiencies: ["history", "medicine"],
            features: ["Spellcasting", "Divine Domain"],
        },
    };

    const backgroundOptions: Record<string, CharacterBackground> = {
        Acolyte: {
            name: "Acolyte",
            description: "You have spent your life in service to a temple.",
            skillProficiencies: ["insight", "religion"],
            toolProficiencies: [],
            languages: ["Any two of your choice"],
            features: ["Shelter of the Faithful"],
        },
        Criminal: {
            name: "Criminal",
            description: "You are an experienced criminal with a history of breaking the law.",
            skillProficiencies: ["deception", "stealth"],
            toolProficiencies: ["Thieves' Tools", "Gaming Set"],
            languages: [],
            features: ["Criminal Contact"],
        },
        Folk_Hero: {
            name: "Folk Hero",
            description: "You come from a humble social rank, but you are destined for much more.",
            skillProficiencies: ["animalHandling", "survival"],
            toolProficiencies: ["Smith's Tools", "Vehicles (Land)"],
            languages: [],
            features: ["Rustic Hospitality"],
        },
        Noble: {
            name: "Noble",
            description: "You understand wealth, power, and privilege.",
            skillProficiencies: ["history", "persuasion"],
            toolProficiencies: ["Gaming Set"],
            languages: ["Any one of your choice"],
            features: ["Position of Privilege"],
        },
        Soldier: {
            name: "Soldier",
            description: "You had a military life before adventuring.",
            skillProficiencies: ["athletics", "intimidation"],
            toolProficiencies: ["Gaming Set", "Vehicles (Land)"],
            languages: [],
            features: ["Military Rank"],
        },
    };

    const steps = [
        { number: 1, title: "Basic Info", description: "Name and identity", icon: "📝" },
        {
            number: 2,
            title: "Race & Class",
            description: "Choose your character's foundation",
            icon: "⚔️",
        },
        {
            number: 3,
            title: "Abilities",
            description: "Set your character's statistics",
            icon: "💪",
        },
        { number: 4, title: "Background", description: "Your character's history", icon: "📖" },
        { number: 5, title: "Review", description: "Finalize your character", icon: "✨" },
    ];

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

    const getModifier = (score: number): number => {
        return Math.floor((score - 10) / 2);
    };

    const updateStat = (stat: keyof CharacterStats, value: number) => {
        setStats((prev) => ({ ...prev, [stat]: Math.max(1, Math.min(30, value)) }));
    };

    const rollStats = () => {
        const rollStat = () => {
            const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
            rolls.sort((a, b) => b - a);
            return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
        };

        setStats({
            strength: rollStat(),
            dexterity: rollStat(),
            constitution: rollStat(),
            intelligence: rollStat(),
            wisdom: rollStat(),
            charisma: rollStat(),
        });
    };

    const canProceedToNext = () => {
        switch (currentStep) {
            case 1:
                return name.trim().length > 0;
            case 2:
                return selectedRace && selectedClass;
            case 3:
                return Object.values(stats).every((stat) => stat >= 8 && stat <= 18);
            case 4:
                return true; // Background is optional
            case 5:
                return true;
            default:
                return false;
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const token = localStorage.getItem("authToken");

        try {
            const requestBody: any = {
                name,
                race: selectedRace,
                characterClass: selectedClass,
                background: selectedBackground,
                stats,
                backstory: backstory || undefined,
            };

            if (campaignId && seatId) {
                requestBody.campaignId = campaignId;
                requestBody.seatId = seatId;
            }

            const response = await fetch("http://localhost:13333/characters", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                const data = await response.json();

                if (campaignId && seatId) {
                    router.push(`/seat/${campaignId}`);
                } else {
                    router.push("/my-characters");
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || "Failed to create character");
            }
        } catch (err) {
            setError("Network error occurred");
        } finally {
            setLoading(false);
        }
    }

    const nextStep = () => {
        if (canProceedToNext() && currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

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

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div style={{ textAlign: "center", padding: "2rem" }}>
                        <div style={{ fontSize: "64px", marginBottom: "1rem" }}>🧙‍♂️</div>
                        <h2
                            style={{
                                fontSize: "28px",
                                fontWeight: "700",
                                marginBottom: "1rem",
                                color: "#374151",
                            }}
                        >
                            What's your character's name?
                        </h2>
                        <p style={{ color: "#6b7280", marginBottom: "2rem", fontSize: "16px" }}>
                            Choose a name that reflects your character's personality and background.
                        </p>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter character name"
                            style={{
                                width: "100%",
                                maxWidth: "400px",
                                padding: "20px",
                                border: "3px solid #e5e7eb",
                                borderRadius: "16px",
                                fontSize: "20px",
                                textAlign: "center",
                                transition: "all 0.3s ease",
                                outline: "none",
                                fontWeight: "600",
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = "#667eea";
                                e.currentTarget.style.boxShadow =
                                    "0 0 0 4px rgba(102, 126, 234, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = "#e5e7eb";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        />
                    </div>
                );

            case 2:
                return (
                    <div style={{ padding: "1rem" }}>
                        <h2
                            style={{
                                fontSize: "28px",
                                fontWeight: "700",
                                marginBottom: "2rem",
                                color: "#374151",
                                textAlign: "center",
                            }}
                        >
                            Choose Your Race & Class
                        </h2>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "2rem",
                                marginBottom: "2rem",
                            }}
                        >
                            {/* Race Selection */}
                            <div>
                                <h3
                                    style={{
                                        fontSize: "20px",
                                        fontWeight: "600",
                                        marginBottom: "1rem",
                                        color: "#374151",
                                    }}
                                >
                                    🌟 Race
                                </h3>
                                <div style={{ display: "grid", gap: "0.75rem" }}>
                                    {Object.entries(raceOptions).map(([key, race]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedRace(race)}
                                            style={{
                                                padding: "1rem",
                                                border:
                                                    selectedRace.name === race.name
                                                        ? "3px solid #667eea"
                                                        : "2px solid #e5e7eb",
                                                borderRadius: "12px",
                                                background:
                                                    selectedRace.name === race.name
                                                        ? "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)"
                                                        : "white",
                                                cursor: "pointer",
                                                textAlign: "left",
                                                transition: "all 0.2s ease",
                                            }}
                                            onMouseEnter={(e) => {
                                                if (selectedRace.name !== race.name) {
                                                    e.currentTarget.style.borderColor = "#cbd5e0";
                                                    e.currentTarget.style.backgroundColor =
                                                        "#f7fafc";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedRace.name !== race.name) {
                                                    e.currentTarget.style.borderColor = "#e5e7eb";
                                                    e.currentTarget.style.backgroundColor = "white";
                                                }
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: "600",
                                                    fontSize: "16px",
                                                    marginBottom: "0.5rem",
                                                }}
                                            >
                                                {race.name}
                                            </div>
                                            <div style={{ fontSize: "14px", color: "#6b7280" }}>
                                                {race.traits.slice(0, 2).join(", ")}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Class Selection */}
                            <div>
                                <h3
                                    style={{
                                        fontSize: "20px",
                                        fontWeight: "600",
                                        marginBottom: "1rem",
                                        color: "#374151",
                                    }}
                                >
                                    ⚔️ Class
                                </h3>
                                <div style={{ display: "grid", gap: "0.75rem" }}>
                                    {Object.entries(classOptions).map(([key, charClass]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedClass(charClass)}
                                            style={{
                                                padding: "1rem",
                                                border:
                                                    selectedClass.name === charClass.name
                                                        ? "3px solid #667eea"
                                                        : "2px solid #e5e7eb",
                                                borderRadius: "12px",
                                                background:
                                                    selectedClass.name === charClass.name
                                                        ? "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)"
                                                        : "white",
                                                cursor: "pointer",
                                                textAlign: "left",
                                                transition: "all 0.2s ease",
                                            }}
                                            onMouseEnter={(e) => {
                                                if (selectedClass.name !== charClass.name) {
                                                    e.currentTarget.style.borderColor = "#cbd5e0";
                                                    e.currentTarget.style.backgroundColor =
                                                        "#f7fafc";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedClass.name !== charClass.name) {
                                                    e.currentTarget.style.borderColor = "#e5e7eb";
                                                    e.currentTarget.style.backgroundColor = "white";
                                                }
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: "600",
                                                    fontSize: "16px",
                                                    marginBottom: "0.5rem",
                                                }}
                                            >
                                                {charClass.name}
                                            </div>
                                            <div style={{ fontSize: "14px", color: "#6b7280" }}>
                                                Hit Die: {charClass.hitDie} • Primary:{" "}
                                                {charClass.primaryAbility}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Selected Info Display */}
                        <div
                            style={{
                                background: "#f8fafc",
                                borderRadius: "12px",
                                padding: "1.5rem",
                                border: "2px solid #e2e8f0",
                            }}
                        >
                            <h4
                                style={{
                                    margin: "0 0 1rem 0",
                                    color: "#374151",
                                    fontWeight: "600",
                                }}
                            >
                                Your Character: {selectedRace.name} {selectedClass.name}
                            </h4>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "1rem",
                                    fontSize: "14px",
                                }}
                            >
                                <div>
                                    <strong>Race Traits:</strong> {selectedRace.traits.join(", ")}
                                </div>
                                <div>
                                    <strong>Class Features:</strong>{" "}
                                    {selectedClass.features.join(", ")}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div style={{ padding: "1rem" }}>
                        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                            <h2
                                style={{
                                    fontSize: "28px",
                                    fontWeight: "700",
                                    marginBottom: "1rem",
                                    color: "#374151",
                                }}
                            >
                                Set Your Ability Scores
                            </h2>
                            <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                                Adjust your character's core attributes (8-18 range recommended)
                            </p>
                            <button
                                onClick={rollStats}
                                style={{
                                    padding: "0.75rem 1.5rem",
                                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                    e.currentTarget.style.boxShadow =
                                        "0 5px 15px rgba(245, 158, 11, 0.3)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                🎲 Roll Random Stats
                            </button>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "1.5rem",
                            }}
                        >
                            {(Object.keys(stats) as Array<keyof CharacterStats>).map((stat) => {
                                const baseScore = stats[stat];
                                const raceBonus = selectedRace.abilityScoreIncrease[stat] || 0;
                                const totalScore = baseScore + raceBonus;
                                const modifier = getModifier(totalScore);

                                return (
                                    <div
                                        key={stat}
                                        style={{
                                            background: "#f8fafc",
                                            borderRadius: "16px",
                                            padding: "1.5rem",
                                            textAlign: "center",
                                            border: "2px solid #e2e8f0",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#374151",
                                                marginBottom: "0.5rem",
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {stat}
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "0.5rem",
                                                marginBottom: "0.75rem",
                                            }}
                                        >
                                            <button
                                                onClick={() => updateStat(stat, baseScore - 1)}
                                                style={{
                                                    width: "32px",
                                                    height: "32px",
                                                    borderRadius: "6px",
                                                    border: "2px solid #e5e7eb",
                                                    background: "white",
                                                    cursor: "pointer",
                                                    fontSize: "16px",
                                                    fontWeight: "600",
                                                    color: "#374151",
                                                }}
                                            >
                                                −
                                            </button>

                                            <input
                                                type="number"
                                                min="1"
                                                max="30"
                                                value={baseScore}
                                                onChange={(e) =>
                                                    updateStat(stat, parseInt(e.target.value) || 1)
                                                }
                                                style={{
                                                    width: "80px",
                                                    padding: "8px",
                                                    border: "2px solid #e5e7eb",
                                                    borderRadius: "8px",
                                                    fontSize: "18px",
                                                    fontWeight: "700",
                                                    textAlign: "center",
                                                    outline: "none",
                                                }}
                                            />

                                            <button
                                                onClick={() => updateStat(stat, baseScore + 1)}
                                                style={{
                                                    width: "32px",
                                                    height: "32px",
                                                    borderRadius: "6px",
                                                    border: "2px solid #e5e7eb",
                                                    background: "white",
                                                    cursor: "pointer",
                                                    fontSize: "16px",
                                                    fontWeight: "600",
                                                    color: "#374151",
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>

                                        {raceBonus > 0 && (
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#059669",
                                                    marginBottom: "0.5rem",
                                                }}
                                            >
                                                +{raceBonus} racial bonus
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                fontSize: "24px",
                                                fontWeight: "800",
                                                color: "#667eea",
                                                marginBottom: "0.25rem",
                                            }}
                                        >
                                            {totalScore}
                                        </div>

                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#6b7280",
                                                fontWeight: "500",
                                            }}
                                        >
                                            Modifier: {modifier >= 0 ? "+" : ""}
                                            {modifier}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div style={{ padding: "1rem" }}>
                        <h2
                            style={{
                                fontSize: "28px",
                                fontWeight: "700",
                                marginBottom: "2rem",
                                color: "#374151",
                                textAlign: "center",
                            }}
                        >
                            Choose Your Background
                        </h2>

                        <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
                            {Object.entries(backgroundOptions).map(([key, bg]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedBackground(bg)}
                                    style={{
                                        padding: "1.5rem",
                                        border:
                                            selectedBackground.name === bg.name
                                                ? "3px solid #667eea"
                                                : "2px solid #e5e7eb",
                                        borderRadius: "12px",
                                        background:
                                            selectedBackground.name === bg.name
                                                ? "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)"
                                                : "white",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: "700",
                                            fontSize: "18px",
                                            marginBottom: "0.5rem",
                                            color: "#374151",
                                        }}
                                    >
                                        {bg.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            marginBottom: "1rem",
                                        }}
                                    >
                                        {bg.description}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#4b5563" }}>
                                        <strong>Skills:</strong> {bg.skillProficiencies.join(", ")}
                                        {bg.features.length > 0 && (
                                            <span>
                                                {" "}
                                                • <strong>Feature:</strong> {bg.features.join(", ")}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                    fontWeight: "600",
                                    fontSize: "16px",
                                    color: "#374151",
                                }}
                            >
                                📖 Character Backstory (Optional)
                            </label>
                            <textarea
                                value={backstory}
                                onChange={(e) => setBackstory(e.target.value)}
                                placeholder="Tell us about your character's background, motivations, and history..."
                                style={{
                                    width: "100%",
                                    padding: "16px",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "12px",
                                    fontSize: "16px",
                                    minHeight: "120px",
                                    resize: "vertical",
                                    outline: "none",
                                    fontFamily: "inherit",
                                    transition: "all 0.2s ease",
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
                    </div>
                );

            case 5:
                return (
                    <div style={{ padding: "2rem", textAlign: "center" }}>
                        <div style={{ fontSize: "64px", marginBottom: "1rem" }}>✨</div>
                        <h2
                            style={{
                                fontSize: "28px",
                                fontWeight: "700",
                                marginBottom: "2rem",
                                color: "#374151",
                            }}
                        >
                            Review Your Character
                        </h2>

                        <div
                            style={{
                                background: "#f8fafc",
                                borderRadius: "16px",
                                padding: "2rem",
                                border: "2px solid #e2e8f0",
                                textAlign: "left",
                                maxWidth: "600px",
                                margin: "0 auto",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "700",
                                    color: "#374151",
                                    marginBottom: "1.5rem",
                                    textAlign: "center",
                                }}
                            >
                                {name}
                            </h3>

                            <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontWeight: "600", color: "#374151" }}>
                                        Race:
                                    </span>
                                    <span>{selectedRace.name}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontWeight: "600", color: "#374151" }}>
                                        Class:
                                    </span>
                                    <span>{selectedClass.name}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontWeight: "600", color: "#374151" }}>
                                        Background:
                                    </span>
                                    <span>{selectedBackground.name}</span>
                                </div>
                            </div>

                            <h4
                                style={{
                                    fontWeight: "600",
                                    color: "#374151",
                                    marginBottom: "1rem",
                                }}
                            >
                                Ability Scores:
                            </h4>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: "0.5rem",
                                    marginBottom: "1.5rem",
                                }}
                            >
                                {(Object.keys(stats) as Array<keyof CharacterStats>).map((stat) => {
                                    const baseScore = stats[stat];
                                    const raceBonus = selectedRace.abilityScoreIncrease[stat] || 0;
                                    const totalScore = baseScore + raceBonus;
                                    const modifier = getModifier(totalScore);

                                    return (
                                        <div
                                            key={stat}
                                            style={{ fontSize: "14px", textAlign: "center" }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: "600",
                                                    textTransform: "capitalize",
                                                }}
                                            >
                                                {stat}
                                            </div>
                                            <div style={{ color: "#667eea", fontWeight: "700" }}>
                                                {totalScore} ({modifier >= 0 ? "+" : ""}
                                                {modifier})
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {backstory && (
                                <div>
                                    <h4
                                        style={{
                                            fontWeight: "600",
                                            color: "#374151",
                                            marginBottom: "0.5rem",
                                        }}
                                    >
                                        Backstory:
                                    </h4>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#6b7280",
                                            lineHeight: "1.5",
                                            margin: 0,
                                        }}
                                    >
                                        {backstory}
                                    </p>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div
                                style={{
                                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                                    color: "#dc2626",
                                    border: "2px solid rgba(239, 68, 68, 0.2)",
                                    borderRadius: "12px",
                                    padding: "1rem",
                                    margin: "1.5rem auto",
                                    maxWidth: "600px",
                                    textAlign: "center",
                                    fontWeight: "600",
                                }}
                            >
                                ❌ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ marginTop: "2rem" }}>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: "1rem 3rem",
                                    background: loading
                                        ? "#9ca3af"
                                        : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "12px",
                                    fontSize: "18px",
                                    fontWeight: "700",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    transition: "all 0.3s ease",
                                    boxShadow: loading
                                        ? "none"
                                        : "0 10px 20px rgba(16, 185, 129, 0.3)",
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        e.currentTarget.style.transform = "translateY(-2px)";
                                        e.currentTarget.style.boxShadow =
                                            "0 15px 30px rgba(16, 185, 129, 0.4)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!loading) {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                            "0 10px 20px rgba(16, 185, 129, 0.3)";
                                    }
                                }}
                            >
                                {loading ? "✨ Creating Character..." : "🎉 Create Character"}
                            </button>
                        </form>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <main
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "2rem",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
        >
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
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
                            ✨ Create Character
                        </h1>
                        <p
                            style={{
                                color: "#64748b",
                                margin: 0,
                                fontSize: "1.1rem",
                            }}
                        >
                            {campaignId
                                ? "Create a character for your campaign"
                                : "Build a new character for your adventures"}
                        </p>
                    </div>
                    <button
                        onClick={() => router.back()}
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
                        ← Back
                    </button>
                </div>

                {/* Progress Steps */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "2rem",
                        background: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "16px",
                        padding: "1.5rem",
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                    }}
                >
                    {steps.map((step, index) => (
                        <div
                            key={step.number}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                flex: 1,
                                position: "relative",
                            }}
                        >
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "20px",
                                        left: "50%",
                                        width: "100%",
                                        height: "2px",
                                        background:
                                            currentStep > step.number ? "#667eea" : "#e5e7eb",
                                        zIndex: 1,
                                    }}
                                />
                            )}

                            {/* Step Circle */}
                            <div
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    background:
                                        currentStep === step.number
                                            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                            : currentStep > step.number
                                              ? "#10b981"
                                              : "#e5e7eb",
                                    color: currentStep >= step.number ? "white" : "#9ca3af",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "14px",
                                    fontWeight: "700",
                                    zIndex: 2,
                                    position: "relative",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                {currentStep > step.number ? "✓" : step.icon}
                            </div>

                            {/* Step Info */}
                            <div
                                style={{
                                    textAlign: "center",
                                    marginTop: "0.5rem",
                                    minHeight: "60px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        color: currentStep >= step.number ? "#374151" : "#9ca3af",
                                        marginBottom: "0.25rem",
                                    }}
                                >
                                    {step.title}
                                </div>
                                <div
                                    style={{
                                        fontSize: "10px",
                                        color: "#6b7280",
                                        lineHeight: "1.3",
                                    }}
                                >
                                    {step.description}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Card */}
                <div
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "20px",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                        backdropFilter: "blur(10px)",
                        overflow: "hidden",
                        minHeight: "600px",
                    }}
                >
                    {renderStep()}
                </div>

                {/* Navigation Buttons */}
                {currentStep < 5 && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: "2rem",
                            gap: "1rem",
                        }}
                    >
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            style={{
                                padding: "0.75rem 1.5rem",
                                background:
                                    currentStep === 1 ? "#9ca3af" : "rgba(255, 255, 255, 0.9)",
                                color: currentStep === 1 ? "white" : "#374151",
                                border: "2px solid #e5e7eb",
                                borderRadius: "12px",
                                cursor: currentStep === 1 ? "not-allowed" : "pointer",
                                fontWeight: "600",
                                fontSize: "0.95rem",
                                transition: "all 0.2s ease",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            ← Previous
                        </button>

                        <button
                            onClick={nextStep}
                            disabled={!canProceedToNext()}
                            style={{
                                padding: "0.75rem 1.5rem",
                                background: !canProceedToNext()
                                    ? "#9ca3af"
                                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "12px",
                                cursor: !canProceedToNext() ? "not-allowed" : "pointer",
                                fontWeight: "600",
                                fontSize: "0.95rem",
                                transition: "all 0.2s ease",
                                boxShadow: !canProceedToNext()
                                    ? "none"
                                    : "0 5px 15px rgba(102, 126, 234, 0.3)",
                            }}
                            onMouseEnter={(e) => {
                                if (canProceedToNext()) {
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                    e.currentTarget.style.boxShadow =
                                        "0 8px 20px rgba(102, 126, 234, 0.4)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (canProceedToNext()) {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow =
                                        "0 5px 15px rgba(102, 126, 234, 0.3)";
                                }
                            }}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
