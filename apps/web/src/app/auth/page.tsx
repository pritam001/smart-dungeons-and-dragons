"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
        <main
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "20px",
                    padding: "3rem",
                    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                    <h1
                        style={{
                            fontSize: "3rem",
                            fontWeight: "800",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            margin: "0 0 0.5rem 0",
                        }}
                    >
                        ⚔️ DnD AI
                    </h1>
                    <p
                        style={{
                            color: "#64748b",
                            fontSize: "1.1rem",
                            margin: 0,
                        }}
                    >
                        Your AI-powered D&D companion
                    </p>
                </div>

                {/* Tab Buttons */}
                <div
                    style={{
                        display: "flex",
                        marginBottom: "2rem",
                        backgroundColor: "#f1f5f9",
                        borderRadius: "12px",
                        padding: "4px",
                    }}
                >
                    <button
                        onClick={() => setMode("login")}
                        style={{
                            flex: 1,
                            padding: "0.75rem",
                            border: "none",
                            background:
                                mode === "login"
                                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                    : "transparent",
                            color: mode === "login" ? "white" : "#64748b",
                            cursor: "pointer",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "0.95rem",
                            transition: "all 0.2s ease",
                        }}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setMode("register")}
                        style={{
                            flex: 1,
                            padding: "0.75rem",
                            border: "none",
                            background:
                                mode === "register"
                                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                    : "transparent",
                            color: mode === "register" ? "white" : "#64748b",
                            cursor: "pointer",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "0.95rem",
                            transition: "all 0.2s ease",
                        }}
                    >
                        Register
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
                >
                    <div>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: "600",
                                fontSize: "14px",
                                color: "#374151",
                            }}
                        >
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                            style={{
                                width: "100%",
                                padding: 12,
                                border: "1px solid #ddd",
                                borderRadius: 4,
                                fontSize: 16,
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                            Password
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                style={{
                                    width: "100%",
                                    padding: 12,
                                    paddingRight: 40,
                                    border: "1px solid #ddd",
                                    borderRadius: 4,
                                    fontSize: 16,
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 16,
                                    color: "#666",
                                    padding: 0,
                                    width: 20,
                                    height: 20,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    {mode === "register" && (
                        <div>
                            <label
                                style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}
                            >
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: 12,
                                    border: "1px solid #ddd",
                                    borderRadius: 4,
                                    fontSize: 16,
                                }}
                            />
                        </div>
                    )}

                    {error && (
                        <div
                            style={{
                                color: "#dc3545",
                                backgroundColor: "#f8d7da",
                                border: "1px solid #f5c6cb",
                                borderRadius: 4,
                                padding: 12,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: 12,
                            backgroundColor: loading ? "#ccc" : "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            fontSize: 16,
                            fontWeight: "bold",
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
                    </button>
                </form>
            </div>
        </main>
    );
}
