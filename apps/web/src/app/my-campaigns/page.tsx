"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CampaignConfig } from "@dnd-ai/types";
import { PageContainer, ContentWrapper, Button, Card } from "../../components/ui";

export default function MyCampaignsPage() {
    const [campaigns, setCampaigns] = useState<CampaignConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            router.push("/auth");
            return;
        }

        // Verify token and load campaigns
        fetch("http://localhost:13333/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) {
                    setIsAuthenticated(true);
                    loadMyCampaigns();
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

    async function loadMyCampaigns() {
        const token = localStorage.getItem("authToken");
        try {
            const response = await fetch("http://localhost:13333/my-campaigns", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                setError("Failed to load your campaigns");
                return;
            }

            const campaignData = await response.json();
            setCampaigns(campaignData);
        } catch (err) {
            setError("Network error occurred");
        } finally {
            setLoading(false);
        }
    }

    async function regenerateRoomCode(campaignId: string) {
        const token = localStorage.getItem("authToken");
        setActionLoading(campaignId);

        try {
            const response = await fetch(
                `http://localhost:13333/campaigns/${campaignId}/regenerate-code`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (response.ok) {
                const data = await response.json();
                setCampaigns((prev) =>
                    prev.map((c) => (c.id === campaignId ? { ...c, roomCode: data.roomCode } : c)),
                );
                alert(`New room code generated: ${data.roomCode}`);
            } else {
                alert("Failed to regenerate room code");
            }
        } catch (err) {
            alert("Error regenerating room code");
        } finally {
            setActionLoading(null);
        }
    }

    async function updateCampaignStatus(campaignId: string, status: string) {
        const token = localStorage.getItem("authToken");
        setActionLoading(campaignId);

        try {
            const response = await fetch(`http://localhost:13333/campaigns/${campaignId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                setCampaigns((prev) =>
                    prev.map((c) => (c.id === campaignId ? { ...c, status: status as any } : c)),
                );
                alert(`Campaign status updated to ${status}`);
            } else {
                alert("Failed to update campaign status");
            }
        } catch (err) {
            alert("Error updating campaign status");
        } finally {
            setActionLoading(null);
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case "planning":
                return "#3b82f6";
            case "active":
                return "#10b981";
            case "completed":
                return "#f59e0b";
            case "archived":
                return "#6b7280";
            default:
                return "#6b7280";
        }
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case "planning":
                return "📋";
            case "active":
                return "⚔️";
            case "completed":
                return "🏆";
            case "archived":
                return "📦";
            default:
                return "❓";
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">
                Checking authentication...
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">
                Loading your campaigns...
            </div>
        );
    }

    if (error) {
        return (
            <PageContainer>
                <div className="max-w-2xl mx-auto text-center">
                    <Card className="bg-red-50 border-2 border-red-200 text-red-700 mb-8">
                        <div className="text-5xl mb-4">❌</div>
                        <h2 className="text-2xl font-bold mb-4">Error Loading Campaigns</h2>
                        <p className="mb-6">{error}</p>
                        <Button onClick={() => router.push("/dashboard")} variant="primary">
                            ← Back to Dashboard
                        </Button>
                    </Card>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <ContentWrapper>
                {/* Header */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl mb-12 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                            🛡️ My Campaigns
                        </h1>
                        <p className="text-slate-500 text-lg">
                            Manage campaigns where you're the Game Master
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => router.push("/create")}
                            variant="success"
                            className="hover:transform hover:-translate-y-1"
                        >
                            ➕ Create New Campaign
                        </Button>
                        <Button
                            onClick={() => router.push("/dashboard")}
                            variant="secondary"
                            className="hover:transform hover:-translate-y-1"
                        >
                            ← Back to Dashboard
                        </Button>
                    </div>
                </div>

                {/* Campaigns List */}
                {campaigns.length === 0 ? (
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-16 text-center shadow-2xl">
                        <div className="text-6xl mb-4">🏰</div>
                        <h2 className="text-3xl font-semibold mb-4 text-gray-700">
                            No Campaigns Yet
                        </h2>
                        <p className="text-gray-500 mb-8 text-lg leading-relaxed max-w-lg mx-auto">
                            Ready to start your first adventure? Create a campaign to begin your
                            journey as a Game Master!
                        </p>
                        <Button
                            onClick={() => router.push("/create")}
                            variant="success"
                            className="text-lg px-8 py-4 hover:transform hover:-translate-y-1"
                        >
                            🎲 Create Your First Campaign
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {campaigns.map((campaign) => {
                            const occupiedSeats = campaign.seats.filter(
                                (s) => s.humanPlayerId,
                            ).length;
                            const totalSeats = campaign.seats.length;
                            const isLoading = actionLoading === campaign.id;

                            return (
                                <Card
                                    key={campaign.id}
                                    className="bg-white/95 backdrop-blur-md p-8 shadow-xl transition-all duration-300 hover:shadow-2xl"
                                >
                                    {/* Campaign Header */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-2xl font-bold text-gray-800">
                                                    {campaign.name}
                                                </h2>
                                                <span
                                                    className="text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                                                    style={{
                                                        backgroundColor: getStatusColor(
                                                            campaign.status,
                                                        ),
                                                    }}
                                                >
                                                    {getStatusIcon(campaign.status)}{" "}
                                                    {campaign.status}
                                                </span>
                                            </div>
                                            {campaign.description && (
                                                <p className="text-gray-500 mb-4 text-sm">
                                                    {campaign.description}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => router.push(`/seat/${campaign.id}`)}
                                            variant="primary"
                                            className="hover:transform hover:-translate-y-1"
                                        >
                                            🎯 Manage
                                        </Button>
                                    </div>

                                    {/* Campaign Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                                                Room Code
                                            </div>
                                            <div className="font-mono text-lg font-bold text-blue-600">
                                                {campaign.roomCode}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                                                Players
                                            </div>
                                            <div className="text-lg font-bold text-gray-800">
                                                {occupiedSeats} / {totalSeats} seats occupied
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                                                Privacy
                                            </div>
                                            <div
                                                className={`text-lg font-bold ${
                                                    campaign.isPrivate
                                                        ? "text-red-600"
                                                        : "text-green-600"
                                                }`}
                                            >
                                                {campaign.isPrivate ? "🔒 Private" : "🌍 Public"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 flex-wrap">
                                        <select
                                            value={campaign.status}
                                            onChange={(e) =>
                                                updateCampaignStatus(campaign.id, e.target.value)
                                            }
                                            disabled={isLoading}
                                            className={`px-2 py-2 rounded border-2 border-gray-200 text-sm font-medium ${
                                                isLoading
                                                    ? "cursor-not-allowed opacity-60"
                                                    : "cursor-pointer"
                                            }`}
                                        >
                                            <option value="planning">📋 Planning</option>
                                            <option value="active">⚔️ Active</option>
                                            <option value="completed">🏆 Completed</option>
                                            <option value="archived">📦 Archived</option>
                                        </select>
                                        <Button
                                            onClick={() => regenerateRoomCode(campaign.id)}
                                            disabled={isLoading}
                                            variant="secondary"
                                            className={`text-sm ${
                                                isLoading ? "opacity-60 cursor-not-allowed" : ""
                                            }`}
                                        >
                                            🔄 New Code
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                navigator.clipboard.writeText(campaign.roomCode);
                                                alert("Room code copied to clipboard!");
                                            }}
                                            variant="secondary"
                                            className="text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
                                        >
                                            📋 Copy Code
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </ContentWrapper>
        </PageContainer>
    );
}
