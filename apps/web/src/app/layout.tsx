import React from "react";
import type { ReactNode } from "react";

export const metadata = {
    title: "DnD AI",
    description: "AI-assisted tabletop campaigns",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>{children}</body>
        </html>
    );
}
