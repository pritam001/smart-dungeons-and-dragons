"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const GameplayPage = () => {
    const router = useRouter();
    const { campaignId } = useParams(); // Extract campaign ID from the URL

    // State for turn tracker
    const [turnOrder, setTurnOrder] = useState<string[]>([]);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [roundNumber, setRoundNumber] = useState(1);

    useEffect(() => {
        // Fetch initial turn tracker data from the backend
        async function fetchTurnTracker() {
            const token = localStorage.getItem("authToken");
            const response = await fetch(
                `http://localhost:13333/campaigns/${campaignId}/turn-order`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            const data = await response.json();
            setTurnOrder(data.turnOrder);
            setCurrentTurnIndex(data.currentTurnIndex);
            setRoundNumber(data.roundNumber);
        }
        fetchTurnTracker();
    }, [campaignId]);

    const advanceTurn = async () => {
        const token = localStorage.getItem("authToken");
        const response = await fetch(
            `http://localhost:13333/campaigns/${campaignId}/advance-turn`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            },
        );
        const data = await response.json();
        setTurnOrder(data.turnOrder);
        setCurrentTurnIndex(data.currentTurnIndex);
        setRoundNumber(data.roundNumber);
    };

    const skipTurn = async () => {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`http://localhost:13333/campaigns/${campaignId}/skip-turn`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setTurnOrder(data.turnOrder);
        setCurrentTurnIndex(data.currentTurnIndex);
    };

    const reorderTurns = async (newOrder: string[]) => {
        const token = localStorage.getItem("authToken");
        const response = await fetch(
            `http://localhost:13333/campaigns/${campaignId}/reorder-turn-order`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ turnOrder: newOrder }),
            },
        );
        const data = await response.json();
        setTurnOrder(data.turnOrder);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Gameplay Turn Tracker</h1>
            <div className="mb-4">
                <h2 className="text-xl font-semibold">Round: {roundNumber}</h2>
                <h3 className="text-lg">
                    Current Turn:{" "}
                    {turnOrder?.length > 0 && currentTurnIndex < turnOrder.length
                        ? turnOrder[currentTurnIndex]
                        : "N/A"}
                </h3>
            </div>
            <ul className="mb-4">
                {turnOrder?.map((player, index) => (
                    <li
                        key={index}
                        className={`p-2 ${index === currentTurnIndex ? "bg-green-200" : "bg-gray-100"}`}
                    >
                        {player}
                    </li>
                ))}
            </ul>
            <div className="flex gap-4">
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={advanceTurn}
                >
                    Advance Turn
                </button>
                <button
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    onClick={skipTurn}
                >
                    Skip Turn
                </button>
                <button
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    onClick={() => {
                        const input = prompt("Enter new turn order (comma-separated):");
                        if (input) {
                            const newOrder = input.split(",");
                            reorderTurns(newOrder);
                        }
                    }}
                >
                    Reorder Turns
                </button>
            </div>
            <button
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={() => router.push("/seat")}
            >
                Back to Seat Page
            </button>
        </div>
    );
};

export default GameplayPage;
