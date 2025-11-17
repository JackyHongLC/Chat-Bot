import { getApiKey } from './state.js';

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * A structured error class for API failures.
 */
class GeminiApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'GeminiApiError';
        this.status = status;
    }
}

/**
 * Calls the Gemini API with the provided persona and message history.
 * @param {string} personaPrompt - The system prompt defining the AI's persona.
 * @param {Array<object>} messages - The history of the conversation.
 * @returns {Promise<object>} - A promise that resolves to the API's JSON response.
 * @throws {GeminiApiError} - Throws a custom error for API or network failures.
 */
export async function callGeminiApi(personaPrompt, messages) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new GeminiApiError('Gemini API 金鑰未設定。', 401);
    }

    const url = `${API_BASE_URL}?key=${apiKey}`;

    // The prompt is structured to guide the model to return a JSON object.
    const structuredPrompt = `
        You are an AI assistant. Your persona is defined by the following description:
        "${personaPrompt}"

        The user's message is at the end of the following conversation history.
        Based on the entire conversation and the user's last message, do two things:
        1. Provide a helpful and relevant answer in Markdown format.
        2. Generate exactly three concise, relevant, and engaging follow-up questions a user might ask.

        Your entire response MUST be a single valid JSON object, with no extra text or explanations before or after it.
        The JSON object must have these two keys:
        - "answer": A string containing your response in Markdown.
        - "suggestions": An array of three strings, representing the follow-up questions.

        Example user message: "Explain how blockchains work."
        Example JSON response:
        {
          "answer": "A blockchain is a decentralized, distributed, and oftentimes public, digital ledger consisting of records called blocks that is used to record transactions across many computers so that any involved block cannot be altered retroactively, without the alteration of all subsequent blocks.",
          "suggestions": [
            "What are smart contracts?",
            "How is this different from a database?",
            "What are some real-world applications?"
          ]
        }
    `;

    // Gemini API uses a specific format for contents
    const contents = [
        {
            role: "user",
            parts: [{ text: structuredPrompt }]
        },
        {
            role: "model",
            parts: [{ text: "OK." }] // Start the conversation as if the model has accepted the instructions.
        },
        ...messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }))
    ];

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    response_mime_type: "application/json",
                    maxOutputTokens: 4000,
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Graceful fallback
            const errorMessage = errorData?.error?.message || `HTTP 錯誤: ${response.status}`;
            throw new GeminiApiError(errorMessage, response.status);
        }

        const data = await response.json();

        // Extract the actual JSON string from the model's response text part
        const responseText = data.candidates[0]?.content?.parts[0]?.text;
        if (!responseText) {
            throw new GeminiApiError('從 API 收到了無效或空白的回應。', 500);
        }

        // The model sometimes wraps the JSON in markdown code blocks. Clean it up.
        const cleanedText = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '');

        return JSON.parse(cleanedText);

    } catch (error) {
        if (error instanceof GeminiApiError) {
            throw error;
        } else if (error instanceof SyntaxError) {
             throw new GeminiApiError('無法解析來自 API 的 JSON 回應。', 500);
        }
        throw new GeminiApiError(error.message || '發生未知的網路錯誤。', 'NetworkError');
    }
}
