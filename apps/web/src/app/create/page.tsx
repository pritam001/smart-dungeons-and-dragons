"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateCampaignPage() {
    const [name, setName] = useState("New Adventure");
    const [description, setDescription] = useState("");
    const [isPrivate, setIsPrivate] = useState(true);
    const [gmIsHuman, setGmIsHuman] = useState(true);
    const [gmAIModelId, setGmAIModelId] = useState("openai:gpt-4o-mini");
    const [seatCount, setSeatCount] = useState(4);
    const [creatorDisplayName, setCreatorDisplayName] = useState("GM");
    const [aiEnabledDefault, setAiEnabledDefault] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem("authToken");
        if (!token) {
            router.push("/auth");
            return;
        }

        // Verify token is still valid
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

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem("authToken");

        try {
            const res = await fetch("http://localhost:13333/campaigns", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    description: description.trim() || undefined,
                    isPrivate,
                    gmIsHuman,
                    gmAIModelId: gmIsHuman ? undefined : gmAIModelId,
                    seatCount,
                    creatorDisplayName,
                    aiEnabledDefault,
                }),
            });

            const data = await res.json();
            setResult(data);

            // If campaign was created successfully, redirect GM to seat management
            if (res.ok && data.campaign) {
                setTimeout(() => {
                    router.push(`/seat/${data.campaign.id}`);
                }, 1500); // Show success message briefly before redirect
            }
        } catch (error) {
            setResult({ error: "Network error occurred" });
        } finally {
            setLoading(false);
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg">
                Checking authentication...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600 p-5 font-sans">
            <div className="max-w-2xl mx-auto pt-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="absolute top-5 left-5 bg-white bg-opacity-20 text-white rounded-full px-4 py-2 text-sm font-medium backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-opacity-30 transform hover:-translate-y-0.5"
                    >
                        ← Back to Dashboard
                    </button>

                    <h1 className="text-white text-4xl font-extrabold mb-3 drop-shadow-lg">
                        🎲 Create Campaign
                    </h1>
                    <p className="text-white text-lg mb-0 font-light">
                        Start your new D&D adventure with AI assistance
                    </p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white bg-opacity-95 rounded-2xl p-10 shadow-md backdrop-blur-md">
                    <form onSubmit={submit} className="flex flex-col gap-6">
                        {/* Campaign Name */}
                        <div>
                            <label className="block font-semibold text-base text-gray-700 mb-2">
                                Campaign Name
                            </label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 border-2 border-gray-300 rounded-lg text-base transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        {/* Campaign Description */}
                        <div>
                            <label className="block font-semibold text-base text-gray-700 mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of your campaign..."
                                rows={3}
                                className="w-full p-3 border-2 border-gray-300 rounded-lg text-base transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            />
                        </div>

                        {/* Privacy Setting */}
                        <div className="p-5 bg-gray-100 rounded-lg border-2 border-gray-200">
                            <label className="flex items-center cursor-pointer text-base font-medium">
                                <input
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={(e) => setIsPrivate(e.target.checked)}
                                    className="w-5 h-5 mr-3 accent-indigo-500"
                                />
                                🔒 Private Campaign
                            </label>
                            <p className="mt-2 ml-8 text-sm text-gray-500">
                                {isPrivate
                                    ? "Only players with the room code can join"
                                    : "Campaign will be visible in the public browser"}
                            </p>
                        </div>

                        {/* Creator Display Name */}
                        <div>
                            <label className="block font-semibold text-base text-gray-700 mb-2">
                                Your Display Name
                            </label>
                            <input
                                value={creatorDisplayName}
                                onChange={(e) => setCreatorDisplayName(e.target.value)}
                                className="w-full p-3 border-2 border-gray-300 rounded-lg text-base transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        {/* GM Type */}
                        <div className="p-5 bg-gray-100 rounded-lg border-2 border-gray-200">
                            <label className="flex items-center cursor-pointer text-base font-medium mb-3">
                                <input
                                    type="checkbox"
                                    checked={gmIsHuman}
                                    onChange={(e) => setGmIsHuman(e.target.checked)}
                                    className="w-5 h-5 mr-3 accent-indigo-500"
                                />
                                🎭 Human Game Master
                            </label>

                            {!gmIsHuman && (
                                <div className="ml-8">
                                    <label className="block font-medium text-sm text-gray-600 mb-2">
                                        AI Model
                                    </label>
                                    <input
                                        value={gmAIModelId}
                                        onChange={(e) => setGmAIModelId(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Seat Count */}
                        <div>
                            <label className="block font-semibold text-base text-gray-700 mb-2">
                                Number of Player Seats
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={8}
                                value={seatCount}
                                onChange={(e) => setSeatCount(Number(e.target.value))}
                                className="w-full p-3 border-2 border-gray-300 rounded-lg text-base transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                You can add more seats later (max 8 total including GM)
                            </p>
                        </div>

                        {/* AI Default */}
                        <div className="p-5 bg-gray-100 rounded-lg border-2 border-gray-200">
                            <label className="flex items-center cursor-pointer text-base font-medium">
                                <input
                                    type="checkbox"
                                    checked={aiEnabledDefault}
                                    onChange={(e) => setAiEnabledDefault(e.target.checked)}
                                    className="w-5 h-5 mr-3 accent-indigo-500"
                                />
                                🤖 Enable AI for empty seats by default
                            </label>
                            <p className="mt-2 ml-8 text-sm text-gray-500">
                                Empty seats will have AI assistance enabled when created
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg px-4 py-3 text-lg font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70"
                        >
                            {loading ? "Creating Campaign..." : "🚀 Create Campaign"}
                        </button>
                    </form>

                    {/* Result Display */}
                    {result && (
                        <div className="mt-8">
                            {result.error ? (
                                <div className="bg-red-50 text-red-700 border-2 border-red-300 rounded-lg p-5">
                                    <h3 className="text-lg font-semibold mb-2">❌ Error</h3>
                                    <p className="text-base">{result.error}</p>
                                </div>
                            ) : result.campaign ? (
                                <div className="bg-green-50 text-green-700 border-2 border-green-300 rounded-lg p-5">
                                    <h3 className="text-lg font-semibold mb-2">
                                        ✅ Campaign Created Successfully!
                                    </h3>
                                    <div className="mb-3">
                                        <strong>Campaign:</strong> {result.campaign.name}
                                    </div>
                                    <div className="mb-3">
                                        <strong>Room Code:</strong>
                                        <span className="bg-green-600 text-white rounded-md px-3 py-1 ml-2 font-mono text-lg font-bold">
                                            {result.campaign.roomCode}
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <strong>Your Role:</strong> Game Master 🎲
                                    </div>
                                    <p className="text-sm italic opacity-80">
                                        Redirecting to seat management...
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
