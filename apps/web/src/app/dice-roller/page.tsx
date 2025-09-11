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
        <div
            style={{
                padding: "20px",
                maxWidth: "1200px",
                margin: "0 auto",
                fontFamily: "Arial, sans-serif",
            }}
        >
            <div
                style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}
            >
                <button
                    onClick={() => router.back()}
                    style={{
                        padding: "8px 16px",
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                >
                    ← Back
                </button>
                <h1 style={{ margin: 0, color: "#2c3e50" }}>🎲 Dice Roller</h1>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Left Column - Rolling Interface */}
                <div>
                    {/* Character Selection */}
                    {characters.length > 0 && (
                        <div
                            style={{
                                marginBottom: "24px",
                                padding: "16px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                            }}
                        >
                            <h3 style={{ marginBottom: "12px", color: "#34495e" }}>
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
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                    fontSize: "16px",
                                }}
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
                    <div
                        style={{
                            marginBottom: "16px",
                            padding: "16px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                        }}
                    >
                        <h3 style={{ marginBottom: "12px", color: "#34495e" }}>Roll Modifiers</h3>
                        <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                                onClick={resetAdvantageDisadvantage}
                                style={{
                                    padding: "4px 8px",
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
                    </div>

                    {/* Character Rolls */}
                    {selectedCharacter && (
                        <div
                            style={{
                                marginBottom: "24px",
                                padding: "16px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                            }}
                        >
                            <h3 style={{ marginBottom: "16px", color: "#34495e" }}>
                                Character Actions
                            </h3>

                            {/* Quick Actions */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gap: "8px",
                                    marginBottom: "16px",
                                }}
                            >
                                <button
                                    onClick={() => rollCharacterDice("initiative")}
                                    disabled={isRolling}
                                    style={{
                                        padding: "12px",
                                        background: "#007bff",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: isRolling ? "not-allowed" : "pointer",
                                        opacity: isRolling ? 0.6 : 1,
                                    }}
                                >
                                    ⚡ Initiative
                                </button>
                                <button
                                    onClick={() => rollCharacterDice("death-save")}
                                    disabled={isRolling}
                                    style={{
                                        padding: "12px",
                                        background: "#dc3545",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: isRolling ? "not-allowed" : "pointer",
                                        opacity: isRolling ? 0.6 : 1,
                                    }}
                                >
                                    💀 Death Save
                                </button>
                                <button
                                    onClick={() => rollCharacterDice("hit-dice")}
                                    disabled={isRolling}
                                    style={{
                                        padding: "12px",
                                        background: "#28a745",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: isRolling ? "not-allowed" : "pointer",
                                        opacity: isRolling ? 0.6 : 1,
                                    }}
                                >
                                    ❤️ Hit Dice
                                </button>
                                <button
                                    onClick={() => rollCharacterDice("attack")}
                                    disabled={isRolling}
                                    style={{
                                        padding: "12px",
                                        background: "#fd7e14",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: isRolling ? "not-allowed" : "pointer",
                                        opacity: isRolling ? 0.6 : 1,
                                    }}
                                >
                                    ⚔️ Attack
                                </button>
                            </div>

                            {/* Ability Checks */}
                            <div style={{ marginBottom: "16px" }}>
                                <h4 style={{ margin: "0 0 8px 0", color: "#495057" }}>
                                    Ability Checks
                                </h4>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3, 1fr)",
                                        gap: "4px",
                                    }}
                                >
                                    {Object.keys(selectedCharacter.modifiers).map((ability) => (
                                        <button
                                            key={ability}
                                            onClick={() => rollCharacterDice("ability", ability)}
                                            disabled={isRolling}
                                            style={{
                                                padding: "8px",
                                                background: "#f8f9fa",
                                                border: "1px solid #ddd",
                                                borderRadius: "4px",
                                                cursor: isRolling ? "not-allowed" : "pointer",
                                                fontSize: "12px",
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {ability.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Saving Throws */}
                            <div style={{ marginBottom: "16px" }}>
                                <h4 style={{ margin: "0 0 8px 0", color: "#495057" }}>
                                    Saving Throws
                                </h4>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3, 1fr)",
                                        gap: "4px",
                                    }}
                                >
                                    {Object.keys(selectedCharacter.savingThrows).map((save) => (
                                        <button
                                            key={save}
                                            onClick={() => rollCharacterDice("save", save)}
                                            disabled={isRolling}
                                            style={{
                                                padding: "8px",
                                                background: "#e9ecef",
                                                border: "1px solid #ddd",
                                                borderRadius: "4px",
                                                cursor: isRolling ? "not-allowed" : "pointer",
                                                fontSize: "12px",
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {save.slice(0, 3)} Save
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Custom Dice Rolling */}
                    <div style={{ padding: "16px", border: "1px solid #ddd", borderRadius: "8px" }}>
                        <h3 style={{ marginBottom: "16px", color: "#34495e" }}>Custom Dice Roll</h3>

                        {/* Dice Suggestions - Quick Select */}
                        {Object.keys(suggestions).length > 0 && (
                            <div style={{ marginBottom: "16px" }}>
                                <h5
                                    style={{
                                        margin: "0 0 8px 0",
                                        fontSize: "14px",
                                        color: "#6c757d",
                                    }}
                                >
                                    Quick Select
                                </h5>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                    {["1d20", "1d6", "1d8", "2d6", "3d6", "1d100"].map((die) => (
                                        <button
                                            key={die}
                                            onClick={() => {
                                                setCustomNotation(die);
                                                setCustomInputValue("");
                                            }}
                                            style={{
                                                padding: "4px 8px",
                                                background:
                                                    customNotation === die ? "#007bff" : "#f8f9fa",
                                                color: customNotation === die ? "white" : "#333",
                                                border: "1px solid #ddd",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                            }}
                                        >
                                            {getDiceIcon(die.match(/d\d+/)?.[0] || "")} {die}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => {
                                            setCustomNotation("custom");
                                            setCustomInputValue("");
                                        }}
                                        style={{
                                            padding: "4px 8px",
                                            background:
                                                customNotation === "custom" ? "#007bff" : "#f8f9fa",
                                            color: customNotation === "custom" ? "white" : "#333",
                                            border: "1px solid #ddd",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                        }}
                                    >
                                        ✏️ Custom
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Custom Input */}
                        <div style={{ marginBottom: "16px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "4px",
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                }}
                            >
                                Dice Notation
                            </label>
                            <select
                                value={customNotation}
                                onChange={(e) => setCustomNotation(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                    fontSize: "16px",
                                    backgroundColor: "white",
                                }}
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
                                <div style={{ marginTop: "8px" }}>
                                    <input
                                        type="text"
                                        value={customInputValue}
                                        onChange={(e) => setCustomInputValue(e.target.value)}
                                        placeholder="Enter custom dice notation (e.g., 5d6+10, 1d20-2)"
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            border: "1px solid #007bff",
                                            borderRadius: "4px",
                                            fontSize: "14px",
                                        }}
                                        autoFocus
                                    />
                                    <div
                                        style={{
                                            marginTop: "4px",
                                            fontSize: "12px",
                                            color: "#666",
                                        }}
                                    >
                                        Examples: 1d20, 2d6+3, 4d8-1, 3d10+5
                                    </div>
                                </div>
                            )}
                            <div
                                style={{
                                    marginTop: "4px",
                                    fontSize: "12px",
                                    color: "#6c757d",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
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
                                    style={{
                                        padding: "2px 6px",
                                        fontSize: "10px",
                                        background: "#f8f9fa",
                                        border: "1px solid #ddd",
                                        borderRadius: "3px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Reset to d20
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "4px",
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                }}
                            >
                                Description (optional)
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g., Fireball damage, Weapon attack"
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                    fontSize: "16px",
                                }}
                            />
                        </div>

                        <button
                            onClick={rollCustomDice}
                            disabled={
                                isRolling ||
                                !customNotation ||
                                (customNotation === "custom" && !customInputValue)
                            }
                            style={{
                                width: "100%",
                                padding: "12px",
                                background:
                                    isRolling ||
                                    !customNotation ||
                                    (customNotation === "custom" && !customInputValue)
                                        ? "#6c757d"
                                        : "#28a745",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor:
                                    isRolling ||
                                    !customNotation ||
                                    (customNotation === "custom" && !customInputValue)
                                        ? "not-allowed"
                                        : "pointer",
                                fontSize: "16px",
                                fontWeight: "bold",
                            }}
                        >
                            {isRolling
                                ? "🎲 Rolling..."
                                : `🎲 Roll ${customNotation === "custom" ? customInputValue || "Custom" : customNotation}`}
                        </button>
                    </div>
                </div>

                {/* Right Column - Roll Results & History */}
                <div>
                    {/* Current Roll Result */}
                    {currentRollResult ? (
                        <div
                            style={{
                                padding: "20px",
                                border: "2px solid #28a745",
                                borderRadius: "8px",
                                marginBottom: "16px",
                                background: currentRollResult.criticalSuccess
                                    ? "#d4edda"
                                    : currentRollResult.criticalFailure
                                      ? "#f8d7da"
                                      : "#f8f9fa",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "bold",
                                    marginBottom: "8px",
                                    color: currentRollResult.criticalSuccess
                                        ? "#155724"
                                        : currentRollResult.criticalFailure
                                          ? "#721c24"
                                          : "#333",
                                }}
                            >
                                🎲 {currentRollResult.total}
                                {currentRollResult.criticalSuccess && " ⭐"}
                                {currentRollResult.criticalFailure && " ☠️"}
                            </div>
                            <div
                                style={{ fontSize: "16px", marginBottom: "8px", color: "#495057" }}
                            >
                                {currentRollResult.notation}
                                {"description" in currentRollResult &&
                                    currentRollResult.description &&
                                    ` - ${currentRollResult.description}`}
                            </div>
                            {currentRollResult.dice.length > 1 && (
                                <div style={{ fontSize: "14px", color: "#6c757d" }}>
                                    Individual rolls:{" "}
                                    {currentRollResult.dice.map((d) => d.value).join(", ")}
                                </div>
                            )}
                            {currentRollResult.criticalSuccess && (
                                <div
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                        color: "#155724",
                                        marginTop: "8px",
                                    }}
                                >
                                    CRITICAL SUCCESS!
                                </div>
                            )}
                            {currentRollResult.criticalFailure && (
                                <div
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                        color: "#721c24",
                                        marginTop: "8px",
                                    }}
                                >
                                    CRITICAL FAILURE!
                                </div>
                            )}
                            <button
                                onClick={() => setCurrentRollResult(null)}
                                style={{
                                    marginTop: "12px",
                                    padding: "6px 12px",
                                    background: "#6c757d",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                }}
                            >
                                Clear Result
                            </button>
                        </div>
                    ) : (
                        <div
                            style={{
                                padding: "32px",
                                textAlign: "center",
                                border: "1px dashed #ddd",
                                borderRadius: "8px",
                                marginBottom: "16px",
                                color: "#6c757d",
                            }}
                        >
                            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎲</div>
                            <div>Roll some dice to see results here!</div>
                        </div>
                    )}

                    {/* Roll History */}
                    {campaignId && rollHistory.length > 0 && (
                        <div
                            style={{
                                padding: "16px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                            }}
                        >
                            <h3 style={{ marginBottom: "16px", color: "#34495e" }}>Recent Rolls</h3>
                            <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                                {rollHistory.map((roll, index) => {
                                    const formatted = formatRollResult(roll);
                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                padding: "12px",
                                                margin: "8px 0",
                                                border: "1px solid #e9ecef",
                                                borderRadius: "6px",
                                                background: formatted.critical
                                                    ? formatted.criticalType === "success"
                                                        ? "#d4edda"
                                                        : "#f8d7da"
                                                    : "#f8f9fa",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "flex-start",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                                    {formatted.time} • {formatted.character}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "18px",
                                                        fontWeight: "bold",
                                                        color: formatted.critical
                                                            ? formatted.criticalType === "success"
                                                                ? "#155724"
                                                                : "#721c24"
                                                            : "#333",
                                                    }}
                                                >
                                                    {formatted.total}
                                                    {formatted.critical &&
                                                        (formatted.criticalType === "success"
                                                            ? " ⭐"
                                                            : " ☠️")}
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    fontWeight: "bold",
                                                    marginBottom: "2px",
                                                }}
                                            >
                                                {formatted.type}
                                                {formatted.description &&
                                                    ` - ${formatted.description}`}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#6c757d" }}>
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
                        <div
                            style={{
                                padding: "16px",
                                textAlign: "center",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                color: "#6c757d",
                            }}
                        >
                            <h3 style={{ marginBottom: "8px", color: "#34495e" }}>
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
    );
}
