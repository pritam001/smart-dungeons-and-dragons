"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer, Button, Input } from "../../components/ui";

export default function AuthPage() {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check if already authenticated
        const token = localStorage.getItem("authToken");
        if (token) {
            // Verify token is still valid
            fetch("http://localhost:13333/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => {
                    if (res.ok) {
                        router.push("/dashboard");
                    } else {
                        localStorage.removeItem("authToken");
                        localStorage.removeItem("user");
                    }
                })
                .catch(() => {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("user");
                });
        }
    }, [router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
        const payload =
            mode === "login" ? { username, password } : { username, password, displayName };

        try {
            const res = await fetch(`http://localhost:13333${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Authentication failed");
                return;
            }

            // Store auth data
            localStorage.setItem("authToken", data.authToken);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Redirect to dashboard
            router.push("/dashboard");
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8 font-sans">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-2xl">
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-extrabold bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                        ⚔️ DnD AI
                    </h1>
                    <p className="text-slate-500 text-lg">Your AI-powered D&D companion</p>
                </div>

                {/* Tab Buttons */}
                <div className="flex mb-8 bg-slate-100 rounded-xl p-1">
                    <button
                        onClick={() => setMode("login")}
                        className={`flex-1 py-3 px-4 border-none rounded-lg font-semibold text-sm transition-all duration-200 min-w-0 ${
                            mode === "login"
                                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md"
                                : "bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 shadow-sm"
                        }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setMode("register")}
                        className={`flex-1 py-3 px-4 border-none rounded-lg font-semibold text-sm transition-all duration-200 min-w-0 ${
                            mode === "register"
                                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md"
                                : "bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 shadow-sm"
                        }`}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 min-h-[280px]">
                    <div>
                        <label className="block mb-2 font-semibold text-sm text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                            className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-gray-700">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full p-3 pr-12 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-transparent border-none cursor-pointer text-base text-gray-600 p-0 w-5 h-5 flex items-center justify-center hover:text-gray-800 transition-colors"
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    <div className="min-h-[80px]">
                        {mode === "register" && (
                            <div>
                                <label className="block mb-1 font-bold text-gray-700">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="text-red-700 bg-red-100 border border-red-300 rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`p-3 text-white border-none rounded-lg text-base font-bold transition-all duration-200 ${
                            loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                        }`}
                    >
                        {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
                    </button>
                </form>
            </div>
        </main>
    );
}
