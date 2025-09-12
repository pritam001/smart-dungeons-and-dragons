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
            <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg">
                <div className="text-center">
                    <div className="text-5xl mb-4">🔐</div>
                    Checking authentication...
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg">
                <div className="text-center">
                    <div className="text-5xl mb-4">⏳</div>
                    Loading character...
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-8">
                <div className="bg-white/95 rounded-2xl p-8 text-center max-w-lg shadow-2xl">
                    <div className="text-5xl mb-4">❌</div>
                    <div className="text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 font-semibold">
                        {error}
                    </div>
                    <button
                        onClick={handleBackButton}
                        className="px-6 py-3 bg-gradient-to-br from-gray-500 to-gray-600 text-white border-none rounded-xl cursor-pointer font-semibold transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-500/30"
                    >
                        {returnTo === "seat" ? "Back to Seat Management" : "Back to My Characters"}
                    </button>
                </div>
            </main>
        );
    }

    if (!character) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg">
                <div className="text-center">
                    <div className="text-5xl mb-4">🤷‍♂️</div>
                    Character not found
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent m-0 mb-2 flex items-center gap-3">
                            🎭 {character.name}
                        </h1>
                        <div className="text-xl text-gray-500 mb-2 font-medium">
                            Level {character.level} {character.race.name}{" "}
                            {character.characterClass.name}
                        </div>
                        {!canEdit && character.playerId !== currentUser?.id && (
                            <div className="text-amber-500 text-sm font-semibold flex items-center gap-2">
                                👁️ View Only - You can view but not edit this character
                            </div>
                        )}
                        {canEdit && character.playerId !== currentUser?.id && (
                            <div className="text-green-600 text-sm font-semibold flex items-center gap-2">
                                🛡️ GM Access - You can edit this character as the Game Master
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleBackButton}
                            className="px-6 py-3 bg-white/20 text-gray-700 border-2 border-gray-200 rounded-xl cursor-pointer font-semibold transition-all duration-200 text-sm backdrop-blur-md hover:bg-white/30 hover:-translate-y-1"
                        >
                            {returnTo === "seat" ? "← Back to Seats" : "← Back"}
                        </button>
                        {editMode ? (
                            <>
                                <button
                                    onClick={saveUpdates}
                                    className="px-6 py-3 bg-gradient-to-br from-green-600 to-green-700 text-white border-none rounded-xl cursor-pointer font-semibold transition-all duration-200 text-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/30"
                                >
                                    ✅ Save Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setEditMode(false);
                                        setUpdates({});
                                    }}
                                    className="px-6 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white border-none rounded-xl cursor-pointer font-semibold transition-all duration-200 text-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/30"
                                >
                                    ❌ Cancel
                                </button>
                            </>
                        ) : (
                            canEdit && (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none rounded-xl cursor-pointer font-semibold transition-all duration-200 text-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30"
                                >
                                    ✏️ Edit Character
                                </button>
                            )
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                    {/* Left Column - Ability Scores */}
                    <div>
                        <div className="bg-white/95 rounded-2xl p-8 shadow-lg backdrop-blur-md mb-8">
                            <h3 className="m-0 mb-6 text-2xl font-semibold text-gray-700 flex items-center gap-2">
                                💪 Ability Scores
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {(Object.keys(character.stats) as Array<keyof CharacterStats>).map(
                                    (stat) => (
                                        <div
                                            key={stat}
                                            className="text-center border-2 border-gray-200 rounded-xl p-4 bg-gray-50 transition-all duration-200"
                                        >
                                            <div className="font-bold text-xs uppercase text-gray-500 mb-2 tracking-wider">
                                                {stat.slice(0, 3)}
                                            </div>
                                            <div className="text-3xl font-extrabold text-gray-700 mb-1">
                                                {character.stats[stat]}
                                            </div>
                                            <div className="text-base text-indigo-600 font-semibold">
                                                {getModifier(character.stats[stat])}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>

                        {/* Combat Stats */}
                        <div className="bg-white/95 rounded-2xl p-8 shadow-lg backdrop-blur-md">
                            <h3 className="m-0 mb-6 text-2xl font-semibold text-gray-700 flex items-center gap-2">
                                ⚔️ Combat Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                                    <div className="font-bold mb-3 text-gray-700 text-base">
                                        ❤️ Hit Points
                                    </div>
                                    {editMode ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-semibold text-gray-500 min-w-12">
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
                                                    className="w-20 p-2 border-2 border-gray-200 rounded text-sm text-center"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-semibold text-gray-500 min-w-12">
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
                                                    className="w-20 p-2 border-2 border-gray-200 rounded text-sm text-center"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-semibold text-gray-500 min-w-12">
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
                                                    className="w-20 p-2 border-2 border-gray-200 rounded text-sm text-center"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-2xl font-bold text-gray-700 text-center">
                                            {character.hitPoints.current}/
                                            {character.hitPoints.maximum}
                                            {character.hitPoints.temporary > 0 &&
                                                ` (+${character.hitPoints.temporary})`}
                                        </div>
                                    )}
                                </div>
                                <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50 text-center">
                                    <div className="font-bold mb-3 text-gray-700 text-base">
                                        🛡️ Armor Class
                                    </div>
                                    <div className="text-2xl font-bold text-gray-700">
                                        {character.armorClass}
                                    </div>
                                </div>
                                <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50 text-center">
                                    <div className="font-bold mb-3 text-gray-700 text-base">
                                        ⚡ Initiative
                                    </div>
                                    <div className="text-2xl font-bold text-gray-700">
                                        {character.initiative >= 0 ? "+" : ""}
                                        {character.initiative}
                                    </div>
                                </div>
                                <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50 text-center">
                                    <div className="font-bold mb-3 text-gray-700 text-base">
                                        🏃 Speed
                                    </div>
                                    <div className="text-2xl font-bold text-gray-700">
                                        {character.speed} ft
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column - Character Info */}
                    <div>
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg mb-8">
                            <h3 className="text-2xl font-semibold text-gray-700 flex items-center gap-2 mb-6">
                                📋 Character Info
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                        Race
                                    </div>
                                    <div className="text-lg font-semibold text-gray-700">
                                        🧝 {character.race.name}
                                        {character.race.subrace && ` (${character.race.subrace})`}
                                    </div>
                                </div>
                                <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                        Class
                                    </div>
                                    <div className="text-lg font-semibold text-gray-700">
                                        ⚔️ {character.characterClass.name}
                                        {character.characterClass.subclass &&
                                            ` (${character.characterClass.subclass})`}
                                    </div>
                                </div>
                                <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                        Background
                                    </div>
                                    <div className="text-lg font-semibold text-gray-700">
                                        📖 {character.background.name}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-center">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                            Level
                                        </div>
                                        <div className="text-2xl font-bold text-indigo-600">
                                            {character.level}
                                        </div>
                                    </div>
                                    <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-center">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                            XP
                                        </div>
                                        <div className="text-xl font-bold text-indigo-600">
                                            {character.experiencePoints}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Equipment & Currency */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                            <h3 className="text-2xl font-semibold text-gray-700 flex items-center gap-2 mb-6">
                                💰 Equipment & Currency
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                                    <div className="text-sm font-semibold text-gray-500 mb-3">
                                        💰 Currency
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-sm">
                                        <div className="text-center">
                                            <div className="font-bold text-purple-500 text-lg">
                                                {character.currency.platinum}
                                            </div>
                                            <div className="text-gray-500 text-xs">PP</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-yellow-500 text-lg">
                                                {character.currency.gold}
                                            </div>
                                            <div className="text-gray-500 text-xs">GP</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-gray-500 text-lg">
                                                {character.currency.silver}
                                            </div>
                                            <div className="text-gray-500 text-xs">SP</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-amber-700 text-lg">
                                                {character.currency.copper}
                                            </div>
                                            <div className="text-gray-500 text-xs">CP</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                                    <div className="text-sm font-semibold text-gray-500 mb-3">
                                        🎒 Equipment
                                    </div>
                                    <div className="text-sm text-gray-700 leading-relaxed">
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
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                            <h3 className="text-2xl font-semibold text-gray-700 flex items-center gap-2 mb-6">
                                🎯 Skills
                            </h3>
                            <div className="flex flex-col gap-2">
                                {Object.entries(character.skills).map(([skill, bonus]) => (
                                    <div
                                        key={skill}
                                        className={`flex justify-between items-center px-4 py-3 rounded-lg text-sm border-2 ${
                                            character.skillProficiencies.includes(skill as any)
                                                ? "border-indigo-500 bg-indigo-50"
                                                : "border-gray-200 bg-gray-50"
                                        }`}
                                    >
                                        <span
                                            className={`${
                                                character.skillProficiencies.includes(skill as any)
                                                    ? "font-bold text-gray-700"
                                                    : "font-medium text-gray-500"
                                            }`}
                                        >
                                            {character.skillProficiencies.includes(skill as any) &&
                                                "⭐ "}
                                            {skill
                                                .replace(/([A-Z])/g, " $1")
                                                .replace(/^./, (str) => str.toUpperCase())}
                                        </span>
                                        <span className="font-bold text-indigo-600 min-w-8 text-right">
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
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg mt-8">
                        <h3 className="text-2xl font-semibold text-gray-700 flex items-center gap-2 mb-6">
                            📖 Backstory
                        </h3>
                        <div className="p-6 border-2 border-gray-200 rounded-xl bg-gray-50 leading-relaxed text-base text-gray-700">
                            {character.backstory}
                        </div>
                    </div>
                )}

                {/* Quick Dice Rolling */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg mt-8">
                    <h3 className="text-2xl font-semibold text-gray-700 flex items-center gap-2 mb-6">
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
                    className={`p-3 mb-4 border-2 rounded-lg text-center ${
                        lastRoll.criticalSuccess
                            ? "border-green-600 bg-green-100"
                            : lastRoll.criticalFailure
                              ? "border-red-600 bg-red-100"
                              : "border-blue-600 bg-blue-100"
                    }`}
                >
                    <div className="text-2xl font-bold mb-1">
                        🎲 {lastRoll.total}
                        {lastRoll.criticalSuccess && " ⭐"}
                        {lastRoll.criticalFailure && " ☠️"}
                    </div>
                    <div className="text-sm text-gray-600">
                        {lastRoll.notation}
                        {lastRoll.description && ` • ${lastRoll.description}`}
                    </div>
                    {lastRoll.dice && lastRoll.dice.length > 1 && (
                        <div className="text-xs text-gray-500 mt-1">
                            Individual rolls: {lastRoll.dice.map((d: any) => d.value).join(", ")}
                        </div>
                    )}
                </div>
            )}

            {/* Roll Modifiers */}
            <div className="flex gap-4 mb-4 items-center">
                <label className="flex items-center gap-1 text-sm">
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
                <label className="flex items-center gap-1 text-sm">
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
                    className="px-2 py-1 bg-gray-100 border border-gray-300 rounded cursor-pointer text-xs hover:bg-gray-200"
                >
                    Reset
                </button>
            </div>

            {/* Quick Action Rolls */}
            <div className="mb-4">
                <h4 className="text-base font-medium mb-2">Quick Actions</h4>
                <div className="grid grid-cols-auto-fit-120 gap-2">
                    <button
                        onClick={() => rollDice("initiative")}
                        disabled={isRolling}
                        className="p-2 bg-blue-600 text-white border-none rounded cursor-pointer text-xs disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-700"
                    >
                        ⚡ Initiative
                    </button>
                    <button
                        onClick={() => rollDice("death-save")}
                        disabled={isRolling}
                        className="p-2 bg-red-600 text-white border-none rounded cursor-pointer text-xs disabled:opacity-60 disabled:cursor-not-allowed hover:bg-red-700"
                    >
                        💀 Death Save
                    </button>
                    <button
                        onClick={() => rollDice("hit-dice")}
                        disabled={isRolling}
                        className="p-2 bg-green-600 text-white border-none rounded cursor-pointer text-xs disabled:opacity-60 disabled:cursor-not-allowed hover:bg-green-700"
                    >
                        ❤️ Hit Dice
                    </button>
                    <button
                        onClick={() => rollCustom("1d20")}
                        disabled={isRolling}
                        className="p-2 bg-gray-600 text-white border-none rounded cursor-pointer text-xs disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-700"
                    >
                        🎲 d20
                    </button>
                </div>
            </div>

            {/* Ability Checks */}
            <div className="mb-4">
                <h4 className="text-base font-medium mb-2">Ability Checks</h4>
                <div className="grid grid-cols-3 gap-1">
                    {Object.entries(character.modifiers).map(([ability, modifier]) => (
                        <button
                            key={ability}
                            onClick={() => rollDice("ability", ability)}
                            disabled={isRolling}
                            className="p-1.5 bg-gray-100 border border-gray-300 rounded cursor-pointer text-xs disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-200 text-center"
                        >
                            <div className="font-bold capitalize">{ability.slice(0, 3)}</div>
                            <div className="text-gray-600">{getModifierDisplay(modifier)}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Saving Throws */}
            <div className="mb-4">
                <h4 className="text-base font-medium mb-2">Saving Throws</h4>
                <div className="grid grid-cols-3 gap-1">
                    {Object.entries(character.savingThrows).map(([save, bonus]) => (
                        <button
                            key={save}
                            onClick={() => rollDice("save", save)}
                            disabled={isRolling}
                            className={`p-1.5 border rounded text-xs cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed ${
                                character.savingThrowProficiencies.includes(
                                    save as keyof CharacterStats,
                                )
                                    ? "bg-blue-50 border-blue-500 hover:bg-blue-100"
                                    : "bg-gray-100 border-gray-300 hover:bg-gray-200"
                            }`}
                        >
                            <div className="font-bold capitalize">{save.slice(0, 3)}</div>
                            <div className="text-gray-600">{getModifierDisplay(bonus)}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Damage Dice */}
            <div>
                <h4 className="text-base font-medium mb-2">Custom Dice Roll</h4>
                <div className="flex gap-2 items-end mb-2">
                    <div className="flex-1">
                        <select
                            onChange={(e) => rollCustom(e.target.value)}
                            disabled={isRolling}
                            className="w-full p-1.5 border border-gray-300 rounded text-xs bg-white disabled:opacity-60"
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
                <div className="text-xs text-gray-500 mb-2">Or use quick buttons:</div>
                <div className="flex flex-wrap gap-1">
                    {["1d4", "1d6", "1d8", "1d10", "1d12", "1d20", "2d6"].map((notation) => (
                        <button
                            key={notation}
                            onClick={() => rollCustom(notation)}
                            disabled={isRolling}
                            className="px-2 py-1 bg-gray-100 border border-gray-300 rounded cursor-pointer text-xs disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-200"
                        >
                            {getDiceIcon(notation)} {notation}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
