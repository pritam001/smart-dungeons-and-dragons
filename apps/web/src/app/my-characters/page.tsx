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
        return (
            <div className="min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg">
                Checking authentication...
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg">
                Loading characters...
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600 p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12 bg-white bg-opacity-95 backdrop-blur-md rounded-2xl p-8 shadow-lg">
                    <div>
                        <h1 className="text-4xl font-extrabold leading-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
                            ⚔️ My Characters
                        </h1>
                        <p className="text-gray-600 text-lg">
                            View and manage your character sheets
                        </p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={() => router.push("/create-character")}
                            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out"
                        >
                            ✨ Create Character
                        </button>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-6 py-3 bg-white bg-opacity-10 text-black rounded-lg border-2 border-white border-opacity-30 backdrop-blur-md shadow-md hover:bg-white hover:bg-opacity-20 transition-all duration-300 ease-in-out"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-lg">
                        <div className="flex">
                            <div className="text-red-400">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 14h4v4h-4zm0-8h4v4h-4zm0 8h4v4h-4zm0-8h4v4h-4z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Characters List */}
                {characters.length === 0 ? (
                    <div className="bg-white bg-opacity-95 rounded-2xl p-16 text-center shadow-lg backdrop-blur-md">
                        <div className="text-6xl mb-4">⚔️</div>
                        <h2 className="text-3xl font-semibold mb-2 text-gray-800">
                            No Characters Yet
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Start your adventure by creating your first character! You can create
                            characters to use in campaigns or just for fun.
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <button
                                onClick={() => router.push("/create-character")}
                                className="p-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white border-none rounded-lg cursor-pointer font-semibold text-lg transition-all duration-300 ease-in-out"
                            >
                                ✨ Create First Character
                            </button>
                            <button
                                onClick={() => router.push("/join")}
                                className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-lg transition-all duration-300 ease-in-out"
                            >
                                🎯 Join Campaign
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {characters.map((character) => (
                            <div
                                key={character.id}
                                className="bg-white bg-opacity-95 rounded-2xl p-6 cursor-pointer transition-all duration-300 ease-in-out shadow-md backdrop-blur-md"
                                onClick={() => navigateToCharacter(character.id)}
                            >
                                {/* Character Header */}
                                <div className="border-b pb-4 mb-4">
                                    <h3 className="text-xl font-bold text-gray-800">
                                        {character.name}
                                    </h3>
                                    <div className="text-sm text-gray-500">
                                        Level {character.level} {character.race.name}{" "}
                                        {character.characterClass.name}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    {Object.entries(character.stats).map(([stat, value]) => (
                                        <div
                                            key={stat}
                                            className="text-center bg-gray-100 rounded-lg p-4"
                                        >
                                            <div className="text-lg font-bold text-gray-700">
                                                {value}
                                            </div>
                                            <div className="text-xs text-gray-500 uppercase">
                                                {stat.slice(0, 3)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {getModifier(value)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Health and AC */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="text-center bg-red-50 rounded-lg p-4 border border-red-200">
                                        <div className="text-lg font-bold text-red-600">
                                            {character.hitPoints.current}/
                                            {character.hitPoints.maximum}
                                        </div>
                                        <div className="text-xs text-red-500">Hit Points</div>
                                    </div>
                                    <div className="text-center bg-blue-50 rounded-lg p-4 border border-blue-200">
                                        <div className="text-lg font-bold text-blue-600">
                                            {character.armorClass}
                                        </div>
                                        <div className="text-xs text-blue-500">Armor Class</div>
                                    </div>
                                </div>

                                {/* Campaign Info */}
                                {character.campaignId ? (
                                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg text-green-700 text-sm mb-4">
                                        🏛️ In Campaign
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg text-yellow-700 text-sm mb-4">
                                        ⭐ Available for Campaign
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
