"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem("authToken");
        if (token) {
            router.push("/dashboard");
        } else {
            router.push("/auth");
        }
    }, [router]);

    return (
        <main className="p-6 text-center">
            <h1>DnD AI</h1>
            <p>Loading...</p>
        </main>
    );
}
