import React from "react";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
    title: "DnD AI",
    description: "AI-assisted tabletop campaigns",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className="m-0 font-sans">{children}</body>
        </html>
    );
}
