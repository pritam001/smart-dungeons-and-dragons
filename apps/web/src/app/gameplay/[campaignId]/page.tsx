"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { SeatAssignment } from "@dnd-ai/types";

const GameplayPage = () => {
    const router = useRouter();
    const { campaignId } = useParams(); // Extract campaign ID from the URL

    // State for turn tracker
    const [turnOrder, setTurnOrder] = useState<string[]>([]);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [roundNumber, setRoundNumber] = useState(1);
    // Error state
    const [error, setError] = useState<string | null>(null);

    // Added state for seats
    const [seats, setSeats] = useState<SeatAssignment[]>([]);
    const [isGM, setIsGM] = useState(false);

    useEffect(() => {
        // Fetch initial turn tracker data from the backend
        async function fetchTurnTracker() {
            try {
                const token = localStorage.getItem("authToken");
                const response = await fetch(
                    `http://localhost:13333/campaigns/${campaignId}/turn-order`,
                    {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );
                if (!response.ok) throw new Error("Failed to fetch turn order");
                const data = await response.json();
                setTurnOrder(data.turnOrder);
                setCurrentTurnIndex(data.currentTurnIndex);
                setRoundNumber(data.roundNumber);
                setError(null);
            } catch (err: any) {
                setError(err?.message || "Error fetching turn tracker");
                console.error("Error fetching turn tracker:", err);
            }
        }
        fetchTurnTracker();

        // --- WebSocket for real-time turn updates ---
        let ws: WebSocket | null = null;
        let retryTimeout: NodeJS.Timeout | null = null;

        const connectWebSocket = () => {
            try {
                ws = new WebSocket(`ws://localhost:13333/ws?campaignId=${campaignId}`);

                ws.onopen = () => {
                    setError(null);
                    console.log("WebSocket connected");
                };

                ws.onerror = (event) => {
                    setError("WebSocket error");
                    console.error("WebSocket error:", event);
                };

                ws.onclose = (event) => {
                    if (!event.wasClean) {
                        setError("WebSocket closed unexpectedly");
                        console.error("WebSocket closed unexpectedly:", event);
                    }
                    // Retry connection after a delay
                    retryTimeout = setTimeout(() => {
                        console.log("Retrying WebSocket connection...");
                        connectWebSocket();
                    }, 5000); // Retry after 5 seconds
                };

                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        if (msg.type === "turnUpdate" && msg.payload) {
                            setTurnOrder(msg.payload.turnOrder);
                            setCurrentTurnIndex(msg.payload.currentTurnIndex);
                            setRoundNumber(msg.payload.roundNumber);
                            setError(null);
                        }
                    } catch (err) {
                        setError("WebSocket message parse error");
                        console.error("WebSocket message parse error:", err);
                    }
                };
            } catch (err: any) {
                setError("WebSocket connection error");
                console.error("WebSocket connection error:", err);
            }
        };

        connectWebSocket();

        return () => {
            if (ws) ws.close();
            if (retryTimeout) clearTimeout(retryTimeout);
        };
    }, [campaignId]);

    useEffect(() => {
        // Fetch seat data from the backend
        async function fetchSeats() {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`http://localhost:13333/campaigns/${campaignId}/seats`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setSeats(data.seats);
        }

        fetchSeats();
    }, [campaignId]);

    useEffect(() => {
        // Fetch user role to determine if they are the GM
        async function fetchUserRole() {
            try {
                const token = localStorage.getItem("authToken");
                const response = await fetch(
                    `http://localhost:13333/campaigns/${campaignId}/user-role`,
                    {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );
                if (!response.ok) throw new Error("Failed to fetch user role");
                const data = await response.json();
                setIsGM(data.isGM);
            } catch (err) {
                console.error("Error fetching user role:", err);
            }
        }
        fetchUserRole();
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

    // Reintroduced the available seats list in the gameplay page
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center p-8 justify-start text-white relative">
            <button
                className="mt-6 px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 absolute top-8 left-8 z-10"
                onClick={() => router.push(`/seat/${campaignId}`)}
            >
                ← Back to Seats
            </button>
            <div className="w-full max-w-7xl p-8 flex flex-col lg:flex-row gap-8">
                {/* Left Sidebar for Seats */}
                <div className="w-full lg:w-1/4 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Available Seats</h2>
                    <ul className="space-y-2">
                        {(seats ?? []).map((seat) => {
                            const isSeatOccupied = !!seat.humanPlayerId || seat.ai?.enabled;
                            const seatOccupier =
                                seat.humanPlayerId ||
                                (seat.ai?.enabled ? "AI Player" : "Empty Seat");
                            const seatOccupierRole = seat.role;
                            return (
                                <li
                                    key={seat.seatId}
                                    className={`p-3 rounded-lg shadow-sm border border-gray-200 ${
                                        isSeatOccupied
                                            ? "bg-white hover:bg-gray-100"
                                            : "bg-gray-300"
                                    }`}
                                >
                                    <div className="font-semibold text-gray-800">
                                        {seatOccupier}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Role: {seatOccupierRole}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Main Content */}
                <div className="w-full lg:w-3/4 p-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl">
                    <h1 className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
                        Gameplay Turn Tracker
                    </h1>
                    {error && (
                        <div className="mb-4 p-3 bg-red-200 text-red-800 rounded-lg shadow">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-700">
                                Round: {roundNumber}
                            </h2>
                            <h3 className="text-lg text-gray-600 mt-2">
                                Current Turn: {turnOrder?.[currentTurnIndex] || "N/A"}
                            </h3>
                        </div>
                        <div className="flex gap-4">
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                onClick={advanceTurn}
                                disabled={!isGM}
                            >
                                Advance Turn
                            </button>
                            <button
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600"
                                onClick={skipTurn}
                            >
                                Skip Turn
                            </button>
                            <button
                                className="px-4 py-2 bg-purple-500 text-white rounded-lg shadow hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                onClick={() => {
                                    const input = prompt("Enter new turn order (comma-separated):");
                                    if (input) {
                                        const newOrder = input.split(",");
                                        reorderTurns(newOrder);
                                    }
                                }}
                                disabled={!isGM}
                            >
                                Reorder Turns
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section for Next Players (Horizontal) */}
            <div className="w-full p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Next Players</h2>
                <ul className="flex flex-row gap-4 justify-center">
                    {turnOrder?.map((player, index) => (
                        <li
                            key={index}
                            className={`p-3 rounded-lg shadow-sm border border-gray-200 ${
                                index === currentTurnIndex
                                    ? "bg-green-200 font-bold text-gray-800"
                                    : "bg-white text-gray-600"
                            }`}
                        >
                            {player}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default GameplayPage;
