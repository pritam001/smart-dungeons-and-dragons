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
                padding: 24,
                maxWidth: 400,
                margin: "0 auto",
                paddingTop: 80,
            }}
        >
            <h1 style={{ textAlign: "center", marginBottom: 32 }}>DnD AI</h1>

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 32,
                    backgroundColor: "#f9f9f9",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        marginBottom: 24,
                        borderBottom: "1px solid #ddd",
                    }}
                >
                    <button
                        onClick={() => setMode("login")}
                        style={{
                            flex: 1,
                            padding: "12px 0",
                            border: "none",
                            background: mode === "login" ? "#007bff" : "transparent",
                            color: mode === "login" ? "white" : "#666",
                            cursor: "pointer",
                            borderRadius: "4px 0 0 0",
                        }}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setMode("register")}
                        style={{
                            flex: 1,
                            padding: "12px 0",
                            border: "none",
                            background: mode === "register" ? "#007bff" : "transparent",
                            color: mode === "register" ? "white" : "#666",
                            cursor: "pointer",
                            borderRadius: "0 4px 0 0",
                        }}
                    >
                        Register
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                    <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
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
