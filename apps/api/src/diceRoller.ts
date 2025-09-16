import { nanoid } from "nanoid";
import {
    DiceRoll,
    DiceResult,
    DiceType,
    RollRequest,
    CharacterRoll,
    RollType,
    CharacterSheet,
    CharacterSkills,
    CharacterSavingThrows,
} from "@dnd-ai/types";

/**
 * Parse dice notation like "2d6+3", "1d20", "3d8-2", etc.
 * Returns the number of dice, die type, and modifier
 */
export function parseDiceNotation(notation: string): {
    count: number;
    die: DiceType;
    modifier: number;
} {
    const cleanNotation = notation.replace(/\s/g, "").toLowerCase();

    // Match patterns like "2d6+3", "1d20", "d8-2", etc.
    const match = cleanNotation.match(/^(\d*)d(\d+)([+-]\d+)?$/);

    if (!match) {
        throw new Error(`Invalid dice notation: ${notation}`);
    }

    const count = parseInt(match[1]) || 1;
    const dieValue = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;

    // Validate die type
    const validDice = [4, 6, 8, 10, 12, 20, 100];
    if (!validDice.includes(dieValue)) {
        throw new Error(`Invalid die type: d${dieValue}`);
    }

    const die = `d${dieValue}` as DiceType;

    return { count, die, modifier };
}

/**
 * Roll a single die of the specified type
 */
export function rollSingleDie(dieType: DiceType): DiceResult {
    const dieValue = parseInt(dieType.substring(1));
    const value = Math.floor(Math.random() * dieValue) + 1;

    return {
        die: dieType,
        value,
        isMax: value === dieValue,
        isMin: value === 1,
    };
}

/**
 * Roll multiple dice of the same type
 */
export function rollMultipleDice(count: number, dieType: DiceType): DiceResult[] {
    const results: DiceResult[] = [];

    for (let i = 0; i < count; i++) {
        results.push(rollSingleDie(dieType));
    }

    return results;
}

/**
 * Execute a complete dice roll from notation
 */
export function rollDice(notation: string, advantage?: boolean, disadvantage?: boolean): DiceRoll {
    const { count, die, modifier } = parseDiceNotation(notation);

    let dice: DiceResult[];
    let finalModifier = modifier;

    // Handle advantage/disadvantage for d20 rolls
    if (die === "d20" && (advantage || disadvantage)) {
        if (advantage && disadvantage) {
            // Advantage and disadvantage cancel out - roll normally
            dice = rollMultipleDice(count, die);
        } else if (advantage) {
            // Roll twice, take higher
            const roll1 = rollMultipleDice(count, die);
            const roll2 = rollMultipleDice(count, die);
            const sum1 = roll1.reduce((acc, d) => acc + d.value, 0);
            const sum2 = roll2.reduce((acc, d) => acc + d.value, 0);
            dice = sum1 >= sum2 ? roll1 : roll2;
        } else {
            // Disadvantage: roll twice, take lower
            const roll1 = rollMultipleDice(count, die);
            const roll2 = rollMultipleDice(count, die);
            const sum1 = roll1.reduce((acc, d) => acc + d.value, 0);
            const sum2 = roll2.reduce((acc, d) => acc + d.value, 0);
            dice = sum1 <= sum2 ? roll1 : roll2;
        }
    } else {
        dice = rollMultipleDice(count, die);
    }

    const diceTotal = dice.reduce((acc, d) => acc + d.value, 0);
    const total = diceTotal + finalModifier;

    // Check for critical success/failure (only on d20 rolls)
    const criticalSuccess = die === "d20" && count === 1 && dice[0].value === 20;
    const criticalFailure = die === "d20" && count === 1 && dice[0].value === 1;

    return {
        id: nanoid(),
        notation,
        dice,
        modifier: finalModifier,
        total,
        advantage,
        disadvantage,
        criticalSuccess,
        criticalFailure,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Create a character-specific roll with ability/skill bonuses
 */
export function rollForCharacter(request: RollRequest, character: CharacterSheet): CharacterRoll {
    let finalNotation = request.notation;
    let rollModifier = request.customModifier || 0;
    let description = request.description || "";

    // Add character-specific bonuses for skill/save checks
    if (request.skillOrSave && request.rollType) {
        switch (request.rollType) {
            case "skill-check":
                if (request.skillOrSave in character.skills) {
                    const skillBonus =
                        character.skills[request.skillOrSave as keyof CharacterSkills];
                    rollModifier += skillBonus;
                    description = description || `${request.skillOrSave} check`;
                }
                break;

            case "saving-throw":
                if (request.skillOrSave in character.savingThrows) {
                    const saveBonus =
                        character.savingThrows[request.skillOrSave as keyof CharacterSavingThrows];
                    rollModifier += saveBonus;
                    description = description || `${request.skillOrSave} saving throw`;
                }
                break;

            case "ability-check":
                if (request.skillOrSave in character.modifiers) {
                    const abilityBonus =
                        character.modifiers[request.skillOrSave as keyof CharacterSavingThrows];
                    rollModifier += abilityBonus;
                    description = description || `${request.skillOrSave} check`;
                }
                break;

            case "attack":
                // For attack rolls, add proficiency + ability modifier
                rollModifier += character.proficiencyBonus;
                if (request.skillOrSave in character.modifiers) {
                    rollModifier +=
                        character.modifiers[request.skillOrSave as keyof CharacterSavingThrows];
                }
                description = description || "Attack roll";
                break;

            case "initiative":
                rollModifier += character.initiative;
                description = description || "Initiative";
                break;
        }
    }

    // Update notation to include modifiers if needed
    if (rollModifier !== 0) {
        const { count, die } = parseDiceNotation(request.notation);
        const sign = rollModifier >= 0 ? "+" : "";
        finalNotation = `${count}${die}${sign}${rollModifier}`;
    }

    const baseRoll = rollDice(finalNotation, request.advantage, request.disadvantage);

    return {
        ...baseRoll,
        characterId: character.id,
        characterName: character.name,
        rollType: request.rollType || "custom",
        abilityOrSkill: request.skillOrSave,
        description,
    };
}

/**
 * Roll standard D&D checks with common presets
 */
export class DnDRoller {
    static attack(
        character: CharacterSheet,
        ability: keyof CharacterSavingThrows = "strength",
        advantage?: boolean,
        disadvantage?: boolean,
    ): CharacterRoll {
        return rollForCharacter(
            {
                notation: "1d20",
                rollType: "attack",
                skillOrSave: ability,
                advantage,
                disadvantage,
            },
            character,
        );
    }

    static savingThrow(
        character: CharacterSheet,
        ability: keyof CharacterSavingThrows,
        advantage?: boolean,
        disadvantage?: boolean,
    ): CharacterRoll {
        return rollForCharacter(
            {
                notation: "1d20",
                rollType: "saving-throw",
                skillOrSave: ability,
                advantage,
                disadvantage,
            },
            character,
        );
    }

    static skillCheck(
        character: CharacterSheet,
        skill: keyof CharacterSkills,
        advantage?: boolean,
        disadvantage?: boolean,
    ): CharacterRoll {
        return rollForCharacter(
            {
                notation: "1d20",
                rollType: "skill-check",
                skillOrSave: skill,
                advantage,
                disadvantage,
            },
            character,
        );
    }

    static abilityCheck(
        character: CharacterSheet,
        ability: keyof CharacterSavingThrows,
        advantage?: boolean,
        disadvantage?: boolean,
    ): CharacterRoll {
        return rollForCharacter(
            {
                notation: "1d20",
                rollType: "ability-check",
                skillOrSave: ability,
                advantage,
                disadvantage,
            },
            character,
        );
    }

    static initiative(
        character: CharacterSheet,
        advantage?: boolean,
        disadvantage?: boolean,
    ): CharacterRoll {
        return rollForCharacter(
            {
                notation: "1d20",
                rollType: "initiative",
                advantage,
                disadvantage,
            },
            character,
        );
    }

    static deathSave(
        character: CharacterSheet,
        advantage?: boolean,
        disadvantage?: boolean,
    ): CharacterRoll {
        return rollForCharacter(
            {
                notation: "1d20",
                rollType: "death-save",
                advantage,
                disadvantage,
                description: "Death saving throw",
            },
            character,
        );
    }

    static hitDice(character: CharacterSheet): CharacterRoll {
        const hitDie = character.characterClass.hitDie;
        return rollForCharacter(
            {
                notation: `1${hitDie}`,
                rollType: "hit-dice",
                customModifier: character.modifiers.constitution,
                description: "Hit dice recovery",
            },
            character,
        );
    }

    static damage(notation: string, description?: string): DiceRoll {
        return rollDice(notation);
    }

    static custom(
        notation: string,
        description?: string,
        advantage?: boolean,
        disadvantage?: boolean,
    ): DiceRoll {
        return rollDice(notation, advantage, disadvantage);
    }
}

/**
 * Roll dice for a specific character
 */
export function rollDiceForCharacter(
    characterId: string,
    notation: string,
    rollType?: string,
    advantage?: boolean,
    disadvantage?: boolean,
    customModifier?: number,
): DiceRoll {
    const baseRoll = rollDice(notation, advantage, disadvantage);

    // Apply custom modifier if provided
    if (customModifier) {
        baseRoll.total += customModifier;
    }

    return {
        ...baseRoll,
        characterId,
        rollType,
    };
}

/**
 * Roll preset dice for a specific type
 */
export function rollPresetDice(
    characterId: string,
    type: string,
    ability?: string,
    advantage?: boolean,
    disadvantage?: boolean,
): DiceRoll {
    let notation = "1d20"; // Default to d20 for most rolls

    if (type === "hit-dice") {
        notation = "1d8"; // Example: hit dice could be d8
    }

    return rollDiceForCharacter(characterId, notation, type, advantage, disadvantage);
}

/**
 * Roll custom dice based on notation
 */
export function rollCustomDice(
    notation: string,
    advantage?: boolean,
    disadvantage?: boolean,
    description?: string,
): DiceRoll {
    const baseRoll = rollDice(notation, advantage, disadvantage);

    return {
        ...baseRoll,
        description,
    };
}

/**
 * Validate dice notation
 */
export function isValidDiceNotation(notation: string): boolean {
    try {
        parseDiceNotation(notation);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get suggested dice for different scenarios
 */
export function getDiceSuggestions(): Record<string, string[]> {
    return {
        "Common Rolls": ["1d20", "1d4", "1d6", "1d8", "1d10", "1d12"],
        "Damage": ["1d4", "1d6", "1d8", "1d10", "1d12", "2d6", "3d6"],
        "Hit Dice": ["1d6", "1d8", "1d10", "1d12"],
        "Stat Rolling": ["4d6", "3d6", "2d6+6"],
        "Multiple Dice": ["2d4", "2d6", "2d8", "3d4", "3d6", "4d6"],
    };
}
