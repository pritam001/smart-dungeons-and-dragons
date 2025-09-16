"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@dnd-ai/types";

interface ChatBoxProps {
    campaignId: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ campaignId }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    // Get userName once for rendering and comparison
    const userName = !!localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user")!).displayName
        : "Player";
    const userId = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user")!).id
        : "unknown";

    // Fetch chat history
    useEffect(() => {
        async function fetchHistory() {
            setLoading(true);
            try {
                const token = localStorage.getItem("authToken");
                const res = await fetch(
                    `http://localhost:13333/campaigns/${campaignId}/chat?limit=50`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );
                const data = await res.json();
                setMessages(data.messages.reverse());
            } catch (err) {
                // Optionally handle error
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, [campaignId]);

    // WebSocket for live chat
    useEffect(() => {
        wsRef.current = new WebSocket(`ws://localhost:13333/ws?campaignId=${campaignId}`);
        wsRef.current.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "chatMessage" && msg.payload) {
                    setMessages((prev) => [...prev, msg.payload]);
                }
            } catch {}
        };
        return () => {
            wsRef.current?.close();
        };
    }, [campaignId]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Send message
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        const token = localStorage.getItem("authToken");
        const chatMsg: ChatMessage = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            campaignId,
            senderId: userId,
            senderName: userName,
            text: input,
            createdAt: new Date().toISOString(),
        };
        wsRef.current?.send(JSON.stringify({ type: "chatMessage", payload: chatMsg }));
        setInput("");
    };

    return (
        <div className="bg-gray-900/90 rounded-2xl shadow-2xl p-4 w-full max-w-2xl mx-auto flex flex-col h-96">
            <div className="flex-1 overflow-y-auto mb-2">
                {loading ? (
                    <div className="text-center text-gray-400">Loading chat...</div>
                ) : (
                    <ul className="space-y-2">
                        {messages.map((msg) => (
                            <li
                                key={msg.id}
                                className={`flex flex-col items-start ${msg.senderId === userId ? "items-end" : "items-start"}`}
                            >
                                <span className="text-xs text-gray-400 mb-1">
                                    {msg.senderName}{" "}
                                    <span className="text-gray-500">
                                        {new Date(msg.createdAt).toLocaleTimeString()}
                                    </span>
                                </span>
                                <span
                                    className="px-4 py-2 rounded-xl bg-gradient-to-br from-purple-700 to-blue-700 text-white shadow-md max-w-xs"
                                    style={{ wordBreak: "break-word" }}
                                >
                                    {msg.text}
                                </span>
                            </li>
                        ))}
                        <div ref={messagesEndRef} />
                    </ul>
                )}
            </div>
            <form className="flex gap-2 mt-2" onSubmit={sendMessage}>
                <input
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    maxLength={500}
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatBox;
