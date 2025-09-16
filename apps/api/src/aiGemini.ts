import axios from "axios";
import { AISuggestionRequest, AISuggestionResponse } from "@dnd-ai/types";

const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function getGeminiSuggestions(
    apiKey: string,
    req: AISuggestionRequest,
): Promise<AISuggestionResponse> {
    const body = {
        contents: [
            {
                parts: [{ text: req.prompt }],
            },
        ],
    };
    try {
        const response = await axios.post(GEMINI_API_URL, body, {
            headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": apiKey,
            },
        });
        const data = response.data;
        // Parse Gemini response
        const suggestions =
            data?.candidates?.map((c: any) =>
                c.content?.parts?.map((p: any) => p.text).join(" "),
            ) || [];
        console.log("Gemini metadata:", {
            usageMetadata: data?.usageMetadata,
            responseId: data?.responseId,
            modelVersion: data?.modelVersion,
            suggestionsCount: suggestions.length,
        });
        return {
            suggestions,
            modelId: "gemini-pro",
            rawResponse: data,
        };
    } catch (error) {
        throw error;
    }
}
