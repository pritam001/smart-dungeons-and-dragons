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
                    <div className="text-center p-8">
                        <div className="text-6xl mb-4">🧙‍♂️</div>
                        <h2 className="text-3xl font-bold mb-4 text-gray-800">
                            What's your character's name?
                        </h2>
                        <p className="text-gray-600 mb-8 text-lg">
                            Choose a name that reflects your character's personality and background.
                        </p>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter character name"
                            className="w-full max-w-md p-5 border-4 border-gray-300 rounded-lg text-xl text-center font-semibold transition-all duration-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                );

            case 2:
                return (
                    <div className="p-4">
                        <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">
                            Choose Your Race & Class
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Race Selection */}
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                    🌟 Race
                                </h3>
                                <div className="grid gap-3">
                                    {Object.entries(raceOptions).map(([key, race]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedRace(race)}
                                            className={`p-4 rounded-lg transition-all duration-200 text-left focus:outline-none ${
                                                selectedRace.name === race.name
                                                    ? "border-4 border-indigo-500 bg-indigo-100"
                                                    : "border-2 border-gray-300 bg-white"
                                            }`}
                                        >
                                            <div className="font-semibold text-lg mb-1">
                                                {race.name}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {race.traits.slice(0, 2).join(", ")}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Class Selection */}
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                    ⚔️ Class
                                </h3>
                                <div className="grid gap-3">
                                    {Object.entries(classOptions).map(([key, charClass]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedClass(charClass)}
                                            className={`p-4 rounded-lg transition-all duration-200 text-left focus:outline-none ${
                                                selectedClass.name === charClass.name
                                                    ? "border-4 border-indigo-500 bg-indigo-100"
                                                    : "border-2 border-gray-300 bg-white"
                                            }`}
                                        >
                                            <div className="font-semibold text-lg mb-1">
                                                {charClass.name}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Hit Die: {charClass.hitDie} • Primary:{" "}
                                                {charClass.primaryAbility}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Selected Info Display */}
                        <div className="bg-gray-100 rounded-lg p-6 border-2 border-gray-300">
                            <h4 className="mb-4 text-gray-800 font-semibold">
                                Your Character: {selectedRace.name} {selectedClass.name}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                    <div className="p-4">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-4 text-gray-800">
                                Set Your Ability Scores
                            </h2>
                            <p className="text-gray-600 mb-4">
                                Adjust your character's core attributes (8-18 range recommended)
                            </p>
                            <button
                                onClick={rollStats}
                                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-600 text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-center mx-auto"
                            >
                                <span className="mr-2">🎲</span> Roll Random Stats
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(Object.keys(stats) as Array<keyof CharacterStats>).map((stat) => {
                                const baseScore = stats[stat];
                                const raceBonus = selectedRace.abilityScoreIncrease[stat] || 0;
                                const totalScore = baseScore + raceBonus;
                                const modifier = getModifier(totalScore);

                                return (
                                    <div
                                        key={stat}
                                        className="bg-gray-100 rounded-lg p-6 text-center border-2 border-gray-300"
                                    >
                                        <div className="text-sm font-semibold text-gray-800 mb-2">
                                            {stat}
                                        </div>

                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <button
                                                onClick={() => updateStat(stat, baseScore - 1)}
                                                className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white text-gray-800 font-bold transition-all duration-200 flex items-center justify-center"
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
                                                className="w-20 p-2 border-2 border-gray-300 rounded-lg text-xl font-bold text-center outline-none"
                                            />

                                            <button
                                                onClick={() => updateStat(stat, baseScore + 1)}
                                                className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white text-gray-800 font-bold transition-all duration-200 flex items-center justify-center"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {raceBonus > 0 && (
                                            <div className="text-green-600 text-sm mb-2">
                                                +{raceBonus} racial bonus
                                            </div>
                                        )}

                                        <div className="text-2xl font-extrabold text-indigo-600 mb-1">
                                            {totalScore}
                                        </div>

                                        <div className="text-xs text-gray-500 font-medium">
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
                    <div className="p-4">
                        <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">
                            Choose Your Background
                        </h2>

                        <div className="grid gap-4 mb-8">
                            {Object.entries(backgroundOptions).map(([key, bg]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedBackground(bg)}
                                    className={`p-6 rounded-lg transition-all duration-200 text-left focus:outline-none ${
                                        selectedBackground.name === bg.name
                                            ? "border-4 border-indigo-500 bg-indigo-100"
                                            : "border-2 border-gray-300 bg-white"
                                    }`}
                                >
                                    <div className="font-bold text-lg mb-2 text-gray-800">
                                        {bg.name}
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2">
                                        {bg.description}
                                    </div>
                                    <div className="text-xs text-gray-500">
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
                            <label className="block mb-2 font-semibold text-gray-800">
                                📖 Character Backstory (Optional)
                            </label>
                            <textarea
                                value={backstory}
                                onChange={(e) => setBackstory(e.target.value)}
                                placeholder="Tell us about your character's background, motivations, and history..."
                                className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg resize-none outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="p-8 text-center">
                        <div className="text-6xl mb-4">✨</div>
                        <h2 className="text-3xl font-bold mb-8 text-gray-800">
                            Review Your Character
                        </h2>

                        <div className="bg-gray-100 rounded-lg p-6 border-2 border-gray-300 text-left max-w-2xl mx-auto">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">{name}</h3>

                            <div className="grid gap-4 mb-4">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-800">Race:</span>
                                    <span>{selectedRace.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-800">Class:</span>
                                    <span>{selectedClass.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-800">Background:</span>
                                    <span>{selectedBackground.name}</span>
                                </div>
                            </div>

                            <h4 className="font-semibold text-gray-800 mb-2">Ability Scores:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                {(Object.keys(stats) as Array<keyof CharacterStats>).map((stat) => {
                                    const baseScore = stats[stat];
                                    const raceBonus = selectedRace.abilityScoreIncrease[stat] || 0;
                                    const totalScore = baseScore + raceBonus;
                                    const modifier = getModifier(totalScore);

                                    return (
                                        <div key={stat} className="text-center">
                                            <div className="font-semibold text-gray-800">
                                                {stat}
                                            </div>
                                            <div className="text-indigo-600 font-bold">
                                                {totalScore} ({modifier >= 0 ? "+" : ""}
                                                {modifier})
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {backstory && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Backstory:</h4>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {backstory}
                                    </p>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-100 text-red-600 border-2 border-red-200 rounded-lg p-4 mb-4">
                                ❌ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center mx-auto ${
                                    loading
                                        ? "bg-gray-400 text-white cursor-not-allowed"
                                        : "bg-gradient-to-r from-green-400 to-teal-500 text-white"
                                }`}
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
        <main className="min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600 p-5 font-sans">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12 bg-white bg-opacity-90 backdrop-blur-lg rounded-lg p-6 shadow-md">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600 mb-2">
                            ✨ Create Character
                        </h1>
                        <p className="text-gray-600 text-lg">
                            {campaignId
                                ? "Create a character for your campaign"
                                : "Build a new character for your adventures"}
                        </p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-semibold transition-all duration-200 flex items-center"
                    >
                        ← Back
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-between mb-8 bg-white bg-opacity-90 rounded-lg p-4 shadow-md">
                    {steps.map((step, index) => (
                        <div
                            key={step.number}
                            className="flex flex-col items-center flex-1 relative"
                        >
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    className="absolute top-5 left-1/2 w-full h-1"
                                    style={{
                                        background:
                                            currentStep > step.number ? "#667eea" : "#e5e7eb",
                                    }}
                                />
                            )}

                            {/* Step Circle */}
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300"
                                style={{
                                    background:
                                        currentStep === step.number
                                            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                            : currentStep > step.number
                                              ? "#10b981"
                                              : "#e5e7eb",
                                }}
                            >
                                {currentStep > step.number ? "✓" : step.icon}
                            </div>

                            {/* Step Info */}
                            <div className="text-center mt-2">
                                <div
                                    className="text-sm font-semibold"
                                    style={{
                                        color: currentStep >= step.number ? "#374151" : "#9ca3af",
                                    }}
                                >
                                    {step.title}
                                </div>
                                <div
                                    className="text-xs"
                                    style={{
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
                <div className="bg-white bg-opacity-90 rounded-2xl shadow-lg p-6 md:p-8 lg:p-10">
                    {renderStep()}
                </div>

                {/* Navigation Buttons */}
                {currentStep < 5 && (
                    <div className="flex justify-between mt-6 gap-4">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex-1 ${
                                currentStep === 1
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-white text-gray-800 shadow-md"
                            }`}
                        >
                            ← Previous
                        </button>

                        <button
                            onClick={nextStep}
                            disabled={!canProceedToNext()}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex-1 ${
                                !canProceedToNext()
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-indigo-400 to-purple-600 text-white shadow-md"
                            }`}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
