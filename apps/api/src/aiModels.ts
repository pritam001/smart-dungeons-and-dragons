import { AIModelMeta, AIModelRegistrySnapshot } from "@dnd-ai/types";

// Static registry for now; later could be dynamic (DB or remote fetch)
const MODELS: AIModelMeta[] = [
    {
        id: "local:story-lite",
        provider: "local",
        label: "Local Story Lite",
        capabilities: {
            canPlayPC: true,
            canPlayGM: false,
            narrativeStyle: ["concise", "rules-aware"],
        },
        costClass: "low",
    },
    {
        id: "openai:gpt-4o-mini",
        provider: "openai",
        label: "GPT-4o Mini",
        capabilities: {
            canPlayPC: true,
            canPlayGM: true,
            narrativeStyle: ["balanced", "descriptive"],
        },
        costClass: "medium",
    },
    {
        id: "anthropic:claude-3-5",
        provider: "anthropic",
        label: "Claude 3.5",
        capabilities: {
            canPlayPC: true,
            canPlayGM: true,
            narrativeStyle: ["narrative", "imaginative"],
        },
        costClass: "high",
    },
];

export function snapshotRegistry(): AIModelRegistrySnapshot {
    return { models: MODELS, updatedAt: new Date().toISOString() };
}

export function getModel(modelId: string) {
    return MODELS.find((m) => m.id === modelId);
}
