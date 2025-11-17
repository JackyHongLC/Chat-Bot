document.addEventListener('DOMContentLoaded', () => {
    const settingsContainer = document.getElementById('settings-container');
    const chatContainer = document.getElementById('chat-container');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveKeyButton = document.getElementById('save-key-button');
    const chatHistory = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=';
    let apiKey = localStorage.getItem('gemini-api-key');

    const checkApiKey = () => {
        apiKey = localStorage.getItem('gemini-api-key');
        if (apiKey) {
            settingsContainer.classList.add('hidden');
            chatContainer.classList.remove('hidden');
        } else {
            settingsContainer.classList.remove('hidden');
            chatContainer.classList.add('hidden');
        }
    };

    const saveApiKey = () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('gemini-api-key', key);
            apiKeyInput.value = '';
            checkApiKey();
        } else {
            alert('請輸入有效的 API 金鑰。');
        }
    };

    const displayMessage = (message, sender, type = 'text') => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);

        if (type === 'loading') {
            messageElement.innerHTML = `
                <div class="loading-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            `;
            messageElement.id = 'loading-indicator';
        } else {
            // A simple way to render markdown-like line breaks
            messageElement.innerHTML = message.replace(/\n/g, '<br>');
        }

        chatHistory.appendChild(messageElement);
        scrollToBottom();
    };

    const scrollToBottom = () => {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };

    const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        displayMessage(message, 'user');
        chatInput.value = '';
        autoResizeTextarea();
        displayMessage('', 'ai', 'loading');

        try {
            const response = await fetch(`${GEMINI_API_URL}${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: message }] }],
                    generationConfig: {
                        maxOutputTokens: 4000
                    }
                }),
            });

            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'API 請求失敗');
            }

            const data = await response.json();

            if (data.candidates && data.candidates.length > 0) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                displayMessage(aiResponse, 'ai');
            } else {
                 displayMessage('抱歉,我無法產生回應。', 'ai');
            }

        } catch (error) {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            displayMessage(`發生錯誤: ${error.message}`, 'ai');
        }
    };

    const autoResizeTextarea = () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';
    };

    saveKeyButton.addEventListener('click', saveApiKey);
    apiKeyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveApiKey();
        }
    });

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    chatInput.addEventListener('input', autoResizeTextarea);

    checkApiKey();
});
