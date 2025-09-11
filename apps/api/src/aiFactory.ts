import { AIModelMeta } from "@dnd-ai/types";
import { getModel } from "./aiModels.js";

export interface AIAdapterContext {
    model: AIModelMeta;
}

export interface AIAdapter {
    id: string;
    kind: "pc" | "gm" | "both";
    generate(options: { prompt: string; system?: string; temperature?: number }): Promise<string>;
}

// Placeholder adapters. Real implementations would call provider SDKs.
class OpenAIAdapter implements AIAdapter {
    id: string;
    kind: "pc" | "gm" | "both" = "both";
    constructor(private ctx: AIAdapterContext) {
        this.id = ctx.model.id;
    }
    async generate(opts: {
        prompt: string;
        system?: string;
        temperature?: number;
    }): Promise<string> {
        return `[openai mock response for ${this.id}] ${opts.prompt.slice(0, 120)}`;
    }
}

class AnthropicAdapter implements AIAdapter {
    id: string;
    kind: "both" = "both";
    constructor(private ctx: AIAdapterContext) {
        this.id = ctx.model.id;
    }
    async generate(opts: {
        prompt: string;
        system?: string;
        temperature?: number;
    }): Promise<string> {
        return `[anthropic mock response for ${this.id}] ${opts.prompt.slice(0, 120)}`;
    }
}

class LocalStoryLiteAdapter implements AIAdapter {
    id: string;
    kind: "pc" = "pc";
    constructor(private ctx: AIAdapterContext) {
        this.id = ctx.model.id;
    }
    async generate(opts: {
        prompt: string;
        system?: string;
        temperature?: number;
    }): Promise<string> {
        return `[local-story-lite] ${opts.prompt.split(/\s+/).slice(0, 25).join(" ")}`;
    }
}

export function createAIAdapter(modelId: string): AIAdapter | undefined {
    const model = getModel(modelId);
    if (!model) return undefined;
    switch (model.provider) {
        case "openai":
            return new OpenAIAdapter({ model });
        case "anthropic":
            return new AnthropicAdapter({ model });
        case "local":
            return new LocalStoryLiteAdapter({ model });
        default:
            return undefined;
    }
}

// Example service-level helper for AI seat invocation
export async function runAIGeneration(modelId: string, prompt: string) {
    const adapter = createAIAdapter(modelId);
    if (!adapter) throw new Error("Unknown model");
    return adapter.generate({ prompt });
}
