"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer, ContentWrapper, Button, Card } from "../../components/ui";

interface User {
    id: string;
    username: string;
    displayName: string;
    createdAt: string;
    lastLoginAt?: string;
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
            router.push("/auth");
            return;
        }

        try {
            setUser(JSON.parse(userData));
        } catch {
            router.push("/auth");
            return;
        }

        // Verify token is still valid
        fetch("http://localhost:13333/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("user");
                    router.push("/auth");
                }
            })
            .catch(() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("user");
                router.push("/auth");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [router]);

    function handleLogout() {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        router.push("/auth");
    }

    if (loading) {
        return <main className="p-6">Loading...</main>;
    }

    if (!user) {
        return null;
    }

    return (
        <PageContainer>
            <ContentWrapper>
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl mb-12 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                            Welcome, {user.displayName}! 🎲
                        </h1>
                        <p className="text-slate-500 text-lg">@{user.username}</p>
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="danger"
                        className="hover:transform hover:-translate-y-1 hover:shadow-lg"
                    >
                        Logout
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/create" className="no-underline">
                        <Card className="border-2 border-blue-500 bg-white/10 hover:bg-white transition-colors cursor-pointer text-center">
                            <div className="text-5xl mb-4">🎲</div>
                            <h2 className="text-blue-600 text-xl font-semibold mb-2">
                                Create Campaign
                            </h2>
                            <p className="text-gray-600">
                                Start a new D&D adventure with AI assistance
                            </p>
                        </Card>
                    </Link>

                    <Link href="/my-campaigns" className="no-underline">
                        <Card className="border-2 border-red-500 bg-white/10 hover:bg-white transition-colors cursor-pointer text-center">
                            <div className="text-5xl mb-4">🛡️</div>
                            <h2 className="text-red-600 text-xl font-semibold mb-2">
                                My Campaigns
                            </h2>
                            <p className="text-gray-600">Manage campaigns where you're the GM</p>
                        </Card>
                    </Link>

                    <Link href="/join" className="no-underline">
                        <Card className="border-2 border-green-500 bg-white/10 hover:bg-white transition-colors cursor-pointer text-center">
                            <div className="text-5xl mb-4">🗡️</div>
                            <h2 className="text-green-600 text-xl font-semibold mb-2">
                                Join Campaign
                            </h2>
                            <p className="text-gray-600">Join an existing adventure with friends</p>
                        </Card>
                    </Link>

                    <Link href="/my-characters" className="no-underline">
                        <Card className="border-2 border-purple-500 bg-white/10 hover:bg-white transition-colors cursor-pointer text-center">
                            <div className="text-5xl mb-4">⚔️</div>
                            <h2 className="text-purple-600 text-xl font-semibold mb-2">
                                My Characters
                            </h2>
                            <p className="text-gray-600">View and manage your character sheets</p>
                        </Card>
                    </Link>

                    <Link href="/create-character" className="no-underline">
                        <Card className="border-2 border-emerald-500 bg-white/10 hover:bg-white transition-colors cursor-pointer text-center">
                            <div className="text-5xl mb-4">✨</div>
                            <h2 className="text-emerald-700 text-xl font-semibold mb-2">
                                Create Character
                            </h2>
                            <p className="text-gray-600">
                                Build a new character for your adventures
                            </p>
                        </Card>
                    </Link>

                    <Link href="/dice-roller" className="no-underline">
                        <Card className="border-2 border-yellow-500 bg-white/10 hover:bg-white transition-colors cursor-pointer text-center">
                            <div className="text-5xl mb-4">🎯</div>
                            <h2 className="text-yellow-700 text-xl font-semibold mb-2">
                                Dice Roller
                            </h2>
                            <p className="text-gray-600">
                                Roll dice for your characters and campaigns
                            </p>
                        </Card>
                    </Link>
                </div>

                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl mt-12">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Getting Started</h3>
                    <ul className="text-gray-600 space-y-2">
                        <li>
                            <strong>Create Campaign:</strong> Set up a new D&D session with
                            customizable AI assistance
                        </li>
                        <li>
                            <strong>Join Campaign:</strong> Enter a room code to join friends in
                            their adventure
                        </li>
                        <li>
                            <strong>AI Features:</strong> Get help with character creation, story
                            generation, and game management
                        </li>
                    </ul>
                </div>
            </ContentWrapper>
        </PageContainer>
    );
}
