"use client";

import { useState, useEffect } from "react";
import { CharacterSheet, CharacterRoll, DiceRoll } from "@dnd-ai/types";
import { useRouter, useSearchParams } from "next/navigation";

export default function DiceRollerPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const campaignId = searchParams.get("campaignId");
    const [characters, setCharacters] = useState<CharacterSheet[]>([]);
    const [selectedCharacter, setSelectedCharacter] = useState<CharacterSheet | null>(null);
    const [rollHistory, setRollHistory] = useState<CharacterRoll[]>([]);
    const [customNotation, setCustomNotation] = useState("1d20");
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customInputValue, setCustomInputValue] = useState("");
    const [advantage, setAdvantage] = useState(false);
    const [disadvantage, setDisadvantage] = useState(false);
    const [description, setDescription] = useState("");
    const [isRolling, setIsRolling] = useState(false);
    const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
    const [currentRollResult, setCurrentRollResult] = useState<DiceRoll | CharacterRoll | null>(
        null,
    );

    useEffect(() => {
        loadCharacters();
        loadDiceSuggestions();
        if (campaignId) {
            loadRollHistory(campaignId);
        }
    }, [campaignId]);

    const loadCharacters = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) return;

            const response = await fetch("http://localhost:13333/my-characters", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCharacters(data.characters);
                if (data.characters.length > 0 && !selectedCharacter) {
                    setSelectedCharacter(data.characters[0]);
                }
            }
        } catch (error) {
            console.error("Failed to load characters:", error);
        }
    };

    const loadDiceSuggestions = async () => {
        try {
            const response = await fetch("http://localhost:13333/dice/suggestions");
            if (response.ok) {
                const data = await response.json();
                setSuggestions(data.suggestions);
            }
        } catch (error) {
            console.error("Failed to load dice suggestions:", error);
        }
    };

    const loadRollHistory = async (campaignId: string) => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) return;

            const response = await fetch(`http://localhost:13333/campaigns/${campaignId}/rolls`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRollHistory(data.rolls);
            }
        } catch (error) {
            console.error("Failed to load roll history:", error);
        }
    };

    const rollCustomDice = async () => {
        setIsRolling(true);
        try {
            const actualNotation = customNotation === "custom" ? customInputValue : customNotation;

            if (!actualNotation || actualNotation.trim() === "") {
                alert("Please enter a dice notation");
                setIsRolling(false);
                return;
            }

            const response = await fetch("http://localhost:13333/roll/custom", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    notation: actualNotation,
                    advantage,
                    disadvantage,
                    description: description || undefined,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Roll result:", data.roll);
                // Show roll result in UI
                showRollResult(data.roll);
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

    const rollCharacterDice = async (rollType: string, ability?: string) => {
        if (!selectedCharacter) {
            alert("Please select a character first");
            return;
        }

        setIsRolling(true);
        try {
            const response = await fetch(`http://localhost:13333/roll/preset/${rollType}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({
                    characterId: selectedCharacter.id,
                    ability,
                    advantage,
                    disadvantage,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Character roll result:", data.roll);
                showRollResult(data.roll);

                // Reload roll history if we're in a campaign
                if (campaignId) {
                    loadRollHistory(campaignId);
                }
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

    const showRollResult = (roll: DiceRoll | CharacterRoll) => {
        // Display the roll result in the right panel
        setCurrentRollResult(roll);
    };

    const resetAdvantageDisadvantage = () => {
        setAdvantage(false);
        setDisadvantage(false);
    };

    const getDiceIcon = (diceType: string) => {
        const icons: Record<string, string> = {
            d4: "▲",
            d6: "⚀",
            d8: "⬦",
            d10: "⬟",
            d12: "⬢",
            d20: "⚄",
            d100: "💯",
        };
        return icons[diceType] || "🎲";
    };

    const formatRollResult = (roll: CharacterRoll) => {
        const time = new Date(roll.timestamp).toLocaleTimeString();
        const characterName = roll.characterName;
        const type = roll.rollType.replace(/-/g, " ").toUpperCase();
        const description = roll.description || roll.abilityOrSkill || "";

        return {
            time,
            character: characterName,
            type,
            description,
            notation: roll.notation,
            total: roll.total,
            dice: roll.dice,
            critical: roll.criticalSuccess || roll.criticalFailure,
            criticalType: roll.criticalSuccess
                ? "success"
                : roll.criticalFailure
                  ? "failure"
                  : null,
        };
    };

    return (
        <main className="min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600 p-5 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12 bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
                    <div>
                        <h1 className="text-4xl font-extrabold leading-tight mb-2">
                            🎲 Dice Roller
                        </h1>
                        <p className="text-lg text-gray-700">
                            Roll dice for your adventures and campaigns
                        </p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200"
                    >
                        ← Back
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column - Rolling Interface */}
                    <div>
                        {/* Character Selection */}
                        {characters.length > 0 && (
                            <div className="mb-6 p-4 border border-gray-300 rounded-lg">
                                <h3 className="text-xl font-semibold mb-3 text-gray-800">
                                    Select Character
                                </h3>
                                <select
                                    value={selectedCharacter?.id || ""}
                                    onChange={(e) => {
                                        const character = characters.find(
                                            (c) => c.id === e.target.value,
                                        );
                                        setSelectedCharacter(character || null);
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded-md text-lg"
                                >
                                    <option value="">Select a character...</option>
                                    {characters.map((character) => (
                                        <option key={character.id} value={character.id}>
                                            {character.name} - Level {character.level}{" "}
                                            {character.characterClass.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Advantage/Disadvantage */}
                        <div className="mb-4 p-4 border border-gray-300 rounded-lg">
                            <h3 className="text-xl font-semibold mb-3 text-gray-800">
                                Roll Modifiers
                            </h3>
                            <div className="flex gap-4 mb-3">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={advantage}
                                        onChange={(e) => {
                                            setAdvantage(e.target.checked);
                                            if (e.target.checked) setDisadvantage(false);
                                        }}
                                        className="form-checkbox h-5 w-5 text-indigo-600"
                                    />
                                    ⬆️ Advantage
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={disadvantage}
                                        onChange={(e) => {
                                            setDisadvantage(e.target.checked);
                                            if (e.target.checked) setAdvantage(false);
                                        }}
                                        className="form-checkbox h-5 w-5 text-red-600"
                                    />
                                    ⬇️ Disadvantage
                                </label>
                                <button
                                    onClick={resetAdvantageDisadvantage}
                                    className="px-3 py-1 bg-gray-200 border border-gray-300 rounded-md text-sm"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Character Rolls */}
                        {selectedCharacter && (
                            <div className="mb-6 p-4 border border-gray-300 rounded-lg">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                    Character Actions
                                </h3>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <button
                                        onClick={() => rollCharacterDice("initiative")}
                                        disabled={isRolling}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-all duration-200"
                                    >
                                        ⚡ Initiative
                                    </button>
                                    <button
                                        onClick={() => rollCharacterDice("death-save")}
                                        disabled={isRolling}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-all duration-200"
                                    >
                                        💀 Death Save
                                    </button>
                                    <button
                                        onClick={() => rollCharacterDice("hit-dice")}
                                        disabled={isRolling}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition-all duration-200"
                                    >
                                        ❤️ Hit Dice
                                    </button>
                                    <button
                                        onClick={() => rollCharacterDice("attack")}
                                        disabled={isRolling}
                                        className="px-4 py-2 bg-orange-600 text-white rounded-md shadow-md hover:bg-orange-700 transition-all duration-200"
                                    >
                                        ⚔️ Attack
                                    </button>
                                </div>

                                {/* Ability Checks */}
                                <div className="mb-4">
                                    <h4 className="text-lg font-semibold mb-2 text-gray-800">
                                        Ability Checks
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.keys(selectedCharacter.modifiers).map((ability) => (
                                            <button
                                                key={ability}
                                                onClick={() =>
                                                    rollCharacterDice("ability", ability)
                                                }
                                                disabled={isRolling}
                                                className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all duration-150"
                                            >
                                                {ability.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Saving Throws */}
                                <div className="mb-4">
                                    <h4 className="text-lg font-semibold mb-2 text-gray-800">
                                        Saving Throws
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.keys(selectedCharacter.savingThrows).map((save) => (
                                            <button
                                                key={save}
                                                onClick={() => rollCharacterDice("save", save)}
                                                disabled={isRolling}
                                                className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all duration-150"
                                            >
                                                {save.slice(0, 3)} Save
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Custom Dice Rolling */}
                        <div className="p-4 border border-gray-300 rounded-lg">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                Custom Dice Roll
                            </h3>

                            {/* Dice Suggestions - Quick Select */}
                            {Object.keys(suggestions).length > 0 && (
                                <div className="mb-4">
                                    <h5 className="text-md font-medium mb-2 text-gray-600">
                                        Quick Select
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {["1d20", "1d6", "1d8", "2d6", "3d6", "1d100"].map(
                                            (die) => (
                                                <button
                                                    key={die}
                                                    onClick={() => {
                                                        setCustomNotation(die);
                                                        setCustomInputValue("");
                                                    }}
                                                    className={`px-3 py-2 rounded-md text-sm font-medium border transition-all duration-150 ${
                                                        customNotation === die
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                    }`}
                                                >
                                                    {getDiceIcon(die.match(/d\d+/)?.[0] || "")}{" "}
                                                    {die}
                                                </button>
                                            ),
                                        )}
                                        <button
                                            onClick={() => {
                                                setCustomNotation("custom");
                                                setCustomInputValue("");
                                            }}
                                            className={`px-3 py-2 rounded-md text-sm font-medium border transition-all duration-150 ${
                                                customNotation === "custom"
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        >
                                            ✏️ Custom
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Custom Input */}
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-semibold text-gray-800">
                                    Dice Notation
                                </label>
                                <select
                                    value={customNotation}
                                    onChange={(e) => setCustomNotation(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-lg bg-white"
                                >
                                    <optgroup label="Common Rolls">
                                        {suggestions["Common Rolls"]?.map((notation) => (
                                            <option key={notation} value={notation}>
                                                {notation}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Damage Dice">
                                        {suggestions["Damage"]?.map((notation) => (
                                            <option key={notation} value={notation}>
                                                {notation}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Hit Dice">
                                        {suggestions["Hit Dice"]?.map((notation) => (
                                            <option key={notation} value={notation}>
                                                {notation}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Stat Rolling">
                                        {suggestions["Stat Rolling"]?.map((notation) => (
                                            <option key={notation} value={notation}>
                                                {notation}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Multiple Dice">
                                        {suggestions["Multiple Dice"]?.map((notation) => (
                                            <option key={notation} value={notation}>
                                                {notation}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Other">
                                        <option value="1d100">1d100</option>
                                        <option value="2d10">2d10</option>
                                        <option value="3d8">3d8</option>
                                        <option value="4d4">4d4</option>
                                        <option value="1d6+1">1d6+1</option>
                                        <option value="2d6+2">2d6+2</option>
                                        <option value="1d8+2">1d8+2</option>
                                        <option value="1d10+3">1d10+3</option>
                                        <option value="1d12+4">1d12+4</option>
                                        <option value="custom">✏️ Custom Notation...</option>
                                    </optgroup>
                                </select>

                                {/* Custom Input Field */}
                                {customNotation === "custom" && (
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            value={customInputValue}
                                            onChange={(e) => setCustomInputValue(e.target.value)}
                                            placeholder="Enter custom dice notation (e.g., 5d6+10, 1d20-2)"
                                            className="w-full p-2 border border-blue-600 rounded-md text-sm"
                                            autoFocus
                                        />
                                        <div className="mt-1 text-xs text-gray-500">
                                            Examples: 1d20, 2d6+3, 4d8-1, 3d10+5
                                        </div>
                                    </div>
                                )}
                                <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                                    <span>
                                        Selected:{" "}
                                        {customNotation === "custom"
                                            ? customInputValue || "Enter custom notation"
                                            : customNotation}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setCustomNotation("1d20");
                                            setCustomInputValue("");
                                        }}
                                        className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-all duration-150"
                                    >
                                        Reset to d20
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-semibold text-gray-800">
                                    Description (optional)
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g., Fireball damage, Weapon attack"
                                    className="w-full p-2 border border-gray-300 rounded-md text-lg"
                                />
                            </div>

                            <button
                                onClick={rollCustomDice}
                                disabled={
                                    isRolling ||
                                    !customNotation ||
                                    (customNotation === "custom" && !customInputValue)
                                }
                                className={`w-full px-4 py-2 rounded-md text-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                                    isRolling ||
                                    !customNotation ||
                                    (customNotation === "custom" && !customInputValue)
                                        ? "bg-gray-400 text-white cursor-not-allowed"
                                        : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                            >
                                {isRolling ? (
                                    <>
                                        <svg
                                            className="animate-spin h-5 w-5 mr-3"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v16a8 8 0 01-8-8z"
                                            />
                                        </svg>
                                        Rolling...
                                    </>
                                ) : (
                                    <>
                                        🎲 Roll{" "}
                                        {customNotation === "custom"
                                            ? customInputValue || "Custom"
                                            : customNotation}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Roll Results & History */}
                    <div>
                        {/* Current Roll Result */}
                        {currentRollResult ? (
                            <div
                                className={`p-5 border-2 rounded-lg mb-4 text-center transition-all duration-200 ${
                                    currentRollResult.criticalSuccess
                                        ? "border-green-600 bg-green-50"
                                        : currentRollResult.criticalFailure
                                          ? "border-red-600 bg-red-50"
                                          : "border-gray-300 bg-gray-50"
                                }`}
                            >
                                <div
                                    className={`text-3xl font-bold mb-2 transition-all duration-200 ${
                                        currentRollResult.criticalSuccess
                                            ? "text-green-700"
                                            : currentRollResult.criticalFailure
                                              ? "text-red-700"
                                              : "text-gray-800"
                                    }`}
                                >
                                    🎲 {currentRollResult.total}
                                    {currentRollResult.criticalSuccess && " ⭐"}
                                    {currentRollResult.criticalFailure && " ☠️"}
                                </div>
                                <div className="text-lg mb-2 text-gray-700">
                                    {currentRollResult.notation}
                                    {"description" in currentRollResult &&
                                        currentRollResult.description &&
                                        ` - ${currentRollResult.description}`}
                                </div>
                                {currentRollResult.dice.length > 1 && (
                                    <div className="text-sm text-gray-500">
                                        Individual rolls:{" "}
                                        {currentRollResult.dice.map((d) => d.value).join(", ")}
                                    </div>
                                )}
                                {currentRollResult.criticalSuccess && (
                                    <div className="text-sm font-bold text-green-700 mt-2">
                                        CRITICAL SUCCESS!
                                    </div>
                                )}
                                {currentRollResult.criticalFailure && (
                                    <div className="text-sm font-bold text-red-700 mt-2">
                                        CRITICAL FAILURE!
                                    </div>
                                )}
                                <button
                                    onClick={() => setCurrentRollResult(null)}
                                    className="mt-3 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-all duration-150"
                                >
                                    Clear Result
                                </button>
                            </div>
                        ) : (
                            <div className="p-8 text-center border border-dashed border-gray-300 rounded-lg mb-4 text-gray-500">
                                <div className="text-6xl mb-4">🎲</div>
                                <div>Roll some dice to see results here!</div>
                            </div>
                        )}

                        {/* Roll History */}
                        {campaignId && rollHistory.length > 0 && (
                            <div className="p-4 border border-gray-300 rounded-lg">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                    Recent Rolls
                                </h3>
                                <div className="max-h-[600px] overflow-y-auto">
                                    {rollHistory.map((roll, index) => {
                                        const formatted = formatRollResult(roll);
                                        return (
                                            <div
                                                key={index}
                                                className={`p-3 mb-2 rounded-lg transition-all duration-150 ${
                                                    formatted.critical
                                                        ? formatted.criticalType === "success"
                                                            ? "bg-green-50 border-green-200"
                                                            : "bg-red-50 border-red-200"
                                                        : "bg-gray-50 border-gray-200"
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="text-xs text-gray-500">
                                                        {formatted.time} • {formatted.character}
                                                    </div>
                                                    <div
                                                        className={`text-lg font-bold transition-all duration-200 ${
                                                            formatted.critical
                                                                ? formatted.criticalType ===
                                                                  "success"
                                                                    ? "text-green-700"
                                                                    : "text-red-700"
                                                                : "text-gray-800"
                                                        }`}
                                                    >
                                                        {formatted.total}
                                                        {formatted.critical &&
                                                            (formatted.criticalType === "success"
                                                                ? " ⭐"
                                                                : " ☠️")}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-medium mb-1">
                                                    {formatted.type}
                                                    {formatted.description &&
                                                        ` - ${formatted.description}`}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatted.notation}
                                                    {formatted.dice.length > 1 && (
                                                        <span>
                                                            {" "}
                                                            (
                                                            {formatted.dice
                                                                .map((d) => d.value)
                                                                .join(", ")}
                                                            )
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {(!campaignId || rollHistory.length === 0) && (
                            <div className="p-4 text-center border border-gray-300 rounded-lg text-gray-500">
                                <h3 className="text-lg font-semibold mb-2 text-gray-800">
                                    Campaign Roll History
                                </h3>
                                <div>
                                    {!campaignId
                                        ? "Join a campaign to see roll history"
                                        : "No rolls yet in this campaign"}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
