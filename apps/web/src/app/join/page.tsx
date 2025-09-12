"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CampaignConfig } from "@dnd-ai/types";
import { PageContainer, ContentWrapper, Button, Card, Input } from "../../components/ui";

export default function JoinCampaignPage() {
    const [roomCode, setRoomCode] = useState("");
    const [result, setResult] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<CampaignConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        // Check authentication first
        const token = localStorage.getItem("authToken");
        if (!token) {
            router.push("/auth");
            return;
        }

        // Verify token is still valid and get user profile
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
                    throw new Error("Authentication failed");
                }
            })
            .then((userData) => {
                setIsAuthenticated(true);
                setUserProfile(userData.user);
                loadCampaigns();
            })
            .catch(() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("user");
                router.push("/auth");
            });
    }, [router]);

    async function loadCampaigns() {
        const token = localStorage.getItem("authToken");
        try {
            const response = await fetch("http://localhost:13333/campaigns", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                // Only show public campaigns
                const publicCampaigns = data.filter((c: CampaignConfig) => !c.isPrivate);
                setCampaigns(publicCampaigns);
            }
        } catch (error) {
            console.error("Failed to load campaigns:", error);
        } finally {
            setLoading(false);
        }
    }

    async function joinCampaign(code: string) {
        if (!code.trim()) return;

        setJoining(true);
        const token = localStorage.getItem("authToken");

        try {
            const response = await fetch("http://localhost:13333/campaigns/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    roomCode: code,
                    playerDisplayName: userProfile?.displayName || "Player",
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    message: `Successfully joined campaign: ${data.campaign.name}`,
                    campaign: data.campaign,
                });
                setRoomCode("");

                // Redirect to campaign seat page
                setTimeout(() => {
                    router.push(`/seat/${data.campaign.id}`);
                }, 1000);
            } else {
                setResult({
                    error: data.error || "Failed to join campaign",
                });
            }
        } catch (error) {
            setResult({ error: "Network error occurred" });
        } finally {
            setJoining(false);
        }
    }

    async function submitPrivateCampaign(e: React.FormEvent) {
        e.preventDefault();
        await joinCampaign(roomCode);
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">
                Checking authentication...
            </div>
        );
    }

    return (
        <PageContainer>
            <ContentWrapper>
                {/* Header */}
                <div className="text-center mb-12">
                    <Button
                        onClick={() => router.push("/dashboard")}
                        variant="secondary"
                        className="absolute top-5 left-5 z-10"
                    >
                        ← Back to Dashboard
                    </Button>
                    <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                        ⚔️ Join Campaign
                    </h1>
                    <p className="text-white/90 text-xl">
                        Join an existing campaign or browse available adventures
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {/* Private Campaign Form */}
                    <Card>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 drop-shadow">
                            🔐 Join Private Campaign
                        </h2>
                        <form onSubmit={submitPrivateCampaign} className="mb-4">
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-white/90 mb-2">
                                    Campaign Code
                                </label>
                                <Input
                                    type="text"
                                    value={roomCode}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setRoomCode(e.target.value.toUpperCase())
                                    }
                                    placeholder="Enter 6-digit campaign code"
                                    maxLength={6}
                                    disabled={joining}
                                    className="font-mono text-center tracking-widest uppercase"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-white/90 mb-2">
                                    Joining as
                                </label>
                                <Input
                                    type="text"
                                    value={userProfile?.displayName || "Loading..."}
                                    readOnly
                                    disabled
                                    className="bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={joining || !roomCode.trim()}
                                className="w-full"
                            >
                                {joining ? "🎲 Joining..." : "🚀 Join Campaign"}
                            </Button>
                        </form>

                        {result && (
                            <div
                                className={`mt-4 p-4 rounded-lg text-center ${
                                    result.success
                                        ? "bg-green-100 text-green-800 border border-green-200"
                                        : "bg-red-100 text-red-800 border border-red-200"
                                }`}
                            >
                                {result.success ? (
                                    <div>
                                        <div className="font-semibold mb-2 flex items-center justify-center gap-2">
                                            ✅ {result.message}
                                        </div>
                                        <div className="text-sm text-green-600">
                                            Redirecting to campaign...
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        ❌ <strong>Error:</strong> {result.error}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Public Campaigns */}
                    <Card>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 drop-shadow">
                            🌍 Public Campaigns
                        </h2>
                        {loading ? (
                            <div className="text-center py-8 text-white/70">
                                <div className="text-2xl mb-2">⏳</div>
                                Loading campaigns...
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div className="text-center py-8 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                                <div className="text-5xl mb-4">🏰</div>
                                <h3 className="font-semibold text-white/80 mb-2">
                                    No Public Campaigns
                                </h3>
                                <p className="text-white/70 text-sm">
                                    No public campaigns found. Ask someone to create a campaign or
                                    enter a room code!
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 max-h-96 overflow-y-auto">
                                {campaigns.map((campaign) => {
                                    const occupiedSeats = campaign.seats.filter(
                                        (s) => s.humanPlayerId,
                                    ).length;
                                    const totalSeats = campaign.seats.length;
                                    const isFull = occupiedSeats >= totalSeats;

                                    return (
                                        <div
                                            key={campaign.id}
                                            className={`border-2 rounded-lg p-4 transition-all ${
                                                isFull
                                                    ? "border-red-300 bg-red-50 opacity-60"
                                                    : "border-white/20 hover:bg-white/10 hover:border-white/30"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                                        🏛️ {campaign.name}
                                                        {isFull && (
                                                            <span className="text-sm text-red-400">
                                                                • FULL
                                                            </span>
                                                        )}
                                                    </h3>
                                                    {campaign.description && (
                                                        <p className="text-white/70 text-sm italic mt-1">
                                                            {campaign.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    onClick={() => joinCampaign(campaign.roomCode)}
                                                    disabled={joining || isFull}
                                                    variant={isFull ? "secondary" : "success"}
                                                    className="ml-4"
                                                >
                                                    {joining
                                                        ? "Joining..."
                                                        : isFull
                                                          ? "Full"
                                                          : "🚀 Join"}
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-semibold text-white/80">
                                                        Room Code:
                                                    </span>
                                                    <div className="font-mono font-bold text-blue-300 bg-blue-900/30 px-2 py-1 rounded mt-1 inline-block">
                                                        {campaign.roomCode}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-white/80">
                                                        Players:
                                                    </span>
                                                    <div className="font-semibold text-white mt-1">
                                                        {occupiedSeats} / {totalSeats} seats
                                                        occupied
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 text-sm">
                                                <span className="font-semibold text-white/80">
                                                    GM:{" "}
                                                </span>
                                                {(() => {
                                                    const gmSeat = campaign.seats.find(
                                                        (s) => s.role === "gm",
                                                    );
                                                    if (gmSeat?.humanPlayerId) {
                                                        return "👤 Human";
                                                    } else if (gmSeat?.ai?.enabled) {
                                                        return `🤖 AI (${gmSeat.ai.modelId || "Default"})`;
                                                    } else {
                                                        return "❓ Not assigned";
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </ContentWrapper>
        </PageContainer>
    );
}
