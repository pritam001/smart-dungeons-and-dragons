import Link from "next/link";

export default function Home() {
    return (
        <main style={{ padding: 24, fontFamily: "system-ui" }}>
            <h1>DnD AI</h1>
            <p>Create or join a campaign.</p>
            <div style={{ display: "flex", gap: 16 }}>
                <Link href="/create">Create Campaign</Link>
                <Link href="/join">Join Campaign</Link>
            </div>
        </main>
    );
}
