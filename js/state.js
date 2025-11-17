const API_KEY_STORAGE_KEY = 'gemini-api-key';

export function getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function setApiKey(key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

const PERSONAS_STORAGE_KEY = 'gemini-personas';

export function getPersonas() {
    const stored = localStorage.getItem(PERSONAS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function savePersonas(personas) {
    localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(personas));
}

const CONVERSATIONS_STORAGE_KEY = 'gemini-conversations';

export function getConversations() {
    const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function saveConversations(conversations) {
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
}
