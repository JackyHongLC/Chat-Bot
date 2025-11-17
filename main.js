/**
 * Deployment Note for GitHub Pages:
 * - To run locally, open `index.html` in your browser.
 * - To deploy, push to GitHub and enable Pages for the main branch.
 */

import { $, $$ } from './js/utils/dom.js';
import { getApiKey, setApiKey } from './js/state.js';
import { callGeminiApi } from './js/api.js';
import { initInputHandler } from './js/ui/inputHandler.js';
import * as chatView from './js/ui/chatView.js';
import * as sidebar from './js/ui/sidebar.js';
import * as personaManager from './js/ui/personaManager.js';

const apiKeyScreen = $('#api-key-screen');
const mainScreen = $('#main-screen');

// --- API Key Screen Logic ---
function initApiKeyScreen() {
    const saveBtn = $('#save-api-key-btn');
    const apiKeyInput = $('#api-key-input');
    const apiKeyError = $('#api-key-error');

    saveBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
            apiKeyError.textContent = '請輸入金鑰';
            return;
        }

        apiKeyError.textContent = '';
        setApiKey(key);

        // Switch screens directly without animation for stability
        apiKeyScreen.classList.remove('visible');
        apiKeyScreen.classList.add('hidden');
        showMainScreen(true);
    });
}

// --- Main Application Logic ---
function showMainScreen(isFirstLoad = false) {
    if (!mainScreen.classList.contains('visible')) {
        mainScreen.classList.remove('hidden');
        mainScreen.classList.add('visible');
    }

    // Only initialize components once
    if (showMainScreen.initialized) return;

    const handleSendMessage = async (message) => {
        let currentConvo = sidebar.getCurrentConversation();
        if (!currentConvo) {
            const activePersona = personaManager.getActivePersona();
            currentConvo = sidebar.createNewConversation(activePersona.id);
            chatView.renderConversation([]);
        }

        chatView.appendMessage({ role: 'user', content: message });
        sidebar.addMessageToCurrentConversation('user', message);
        chatView.showLoadingIndicator();

        try {
            const activePersona = personaManager.getActivePersona();
            const conversationHistory = sidebar.getCurrentConversation().messages;

            const historyForApi = conversationHistory
              .filter(msg => msg.role !== 'error')
              .map(msg => ({ role: msg.role, content: msg.content.answer || msg.content }));

            const response = await callGeminiApi(activePersona.prompt, historyForApi);

            chatView.hideLoadingIndicator();
            chatView.appendMessage({ role: 'ai', content: response });
            sidebar.addMessageToCurrentConversation('ai', response);

        } catch (error) {
            console.error('Gemini API Error:', error);
            chatView.hideLoadingIndicator();
            const errorMessage = `呼叫 Gemini API 失敗: ${error.message}`;
            chatView.appendMessage({ role: 'error', content: errorMessage });
            sidebar.addMessageToCurrentConversation('error', errorMessage);
        }
    };

    initInputHandler(handleSendMessage);
    chatView.initChatView((suggestion) => handleSendMessage(suggestion));
    sidebar.initSidebar((conversation) => {
        chatView.renderConversation(conversation.messages);
        personaManager.setActivePersona(conversation.personaId);
    });
    personaManager.initPersonaManager();
    initSettingsModal();

    showMainScreen.initialized = true;
}

// --- Settings Modal Logic ---
function initSettingsModal() {
    const settingsBtn = $('#settings-btn');
    const settingsModal = $('#settings-modal');
    const saveSettingsBtn = $('#save-settings-btn');
    const cancelSettingsBtn = $('#cancel-settings-btn');
    const updateApiKeyInput = $('#update-api-key-input');

    const showModal = () => settingsModal.classList.remove('hidden');
    const hideModal = () => settingsModal.classList.add('hidden');

    settingsBtn.addEventListener('click', showModal);
    cancelSettingsBtn.addEventListener('click', hideModal);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) hideModal();
    });

    saveSettingsBtn.addEventListener('click', () => {
        const newKey = updateApiKeyInput.value.trim();
        if (newKey) {
            setApiKey(newKey);
            alert('API 金鑰已更新！');
            hideModal();
            updateApiKeyInput.value = '';
        } else {
            alert('請輸入有效的 API 金鑰。');
        }
    });
}

// --- App Initialization ---
function init() {
    const apiKey = getApiKey();
    if (apiKey) {
        apiKeyScreen.classList.add('hidden');
        apiKeyScreen.classList.remove('visible');
        showMainScreen();
    } else {
        apiKeyScreen.classList.add('visible');
        apiKeyScreen.classList.remove('hidden');
        initApiKeyScreen();
    }
}

document.addEventListener('DOMContentLoaded', init);
